"""AIVA System A — Flow Engine Server v2.

FastAPI application with async lifespan managing:
  - Health endpoints: /health/live, /health/ready
  - Worker controls:  /worker/status, /worker/start, /worker/pause, /worker/resume, /worker/stop
  - Direct trigger:   POST /process/{doc_id}
  - Webhook trigger:  POST /webhook/aiva-invoice-process, POST /webhook/process

The background FlowWorker runs as an asyncio Task (no threads for the loop itself).
"""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .container import Settings, build_services
from .envfile import load_env
from .flow_worker import FlowWorker, build_flow_worker

load_env()
log = logging.getLogger("system_a.flow_server")

# Global worker instance (set in lifespan)
_worker: Optional[FlowWorker] = None
_worker_task: Optional[asyncio.Task] = None


# =============================================================================
# Lifespan — startup & graceful shutdown
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _worker, _worker_task

    # ── Startup ───────────────────────────────────────────────────────────────
    settings = Settings()
    worker = build_flow_worker(settings)
    _worker = worker

    auto_start = os.getenv("AUTO_PROCESS", "true").lower() in ("true", "1", "yes")
    if auto_start:
        log.info("AUTO_PROCESS=true — starting Flow Worker as background task")
        _worker_task = asyncio.create_task(worker.run(), name="FlowWorkerLoop")
    else:
        log.info("AUTO_PROCESS=false — Flow Worker not started automatically")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    log.info("Shutting down Flow Worker...")
    if _worker_task and not _worker_task.done():
        worker._stop_event.set()
        worker._pause_event.set()
        try:
            await asyncio.wait_for(_worker_task, timeout=8.0)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            _worker_task.cancel()
    log.info("Flow Worker shut down cleanly")


# =============================================================================
# FastAPI Application
# =============================================================================
def create_flow_server() -> FastAPI:
    app = FastAPI(
        title="AIVA System A — Flow Engine Server v2",
        description=(
            "High-stability async document processing server. "
            "Runs the System A blackbox pipeline against invoices from Paperless-ngx "
            "and pushes validated results to AIVA Portal."
        ),
        version="2.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def _require_worker() -> FlowWorker:
        if _worker is None:
            raise HTTPException(status_code=503, detail="Worker not initialized")
        return _worker

    # ── Health ────────────────────────────────────────────────────────────────

    @app.get("/health", summary="Health check")
    @app.get("/health/live", summary="Liveness probe")
    def health_live() -> Dict[str, Any]:
        """Returns 200 as long as the process is running."""
        return {"ok": True, "status": "alive"}

    @app.get("/health/ready", summary="Readiness probe")
    def health_ready() -> Dict[str, Any]:
        """Checks Paperless connectivity, LiteLLM config, and worker state."""
        settings = Settings()
        checks: Dict[str, Any] = {
            "paperless": False,
            "litellm_configured": bool(settings.litellm_url and settings.litellm_key),
        }

        # Quick Paperless connectivity check
        try:
            from .adapters.paperless.reader import PaperlessReader
            reader = PaperlessReader(
                settings.paperless_url, settings.paperless_token,
                timeout_s=settings.paperless_timeout_s,
            )
            h = reader.health()
            checks["paperless"] = bool(h and h.get("count") is not None)
            checks["paperless_doc_count"] = h.get("count") if h else None
        except Exception as exc:
            checks["paperless_error"] = str(exc)[:120]

        if _worker:
            checks["worker_status"] = _worker.stats.get("status")

        is_ready = checks["paperless"] and checks["litellm_configured"]
        return {"ok": is_ready, "checks": checks}

    # ── Worker controls ───────────────────────────────────────────────────────

    @app.get("/worker/status", summary="Worker status & recent events")
    def worker_status() -> Dict[str, Any]:
        return _require_worker().get_status()

    @app.post("/worker/start", summary="Start background worker")
    async def worker_start() -> Dict[str, Any]:
        global _worker_task
        worker = _require_worker()
        if _worker_task and not _worker_task.done():
            return {"ok": True, "status": "already_running"}
        worker._stop_event.clear()
        worker._pause_event.set()
        _worker_task = asyncio.create_task(worker.run(), name="FlowWorkerLoop")
        return {"ok": True, "status": "started"}

    @app.post("/worker/pause", summary="Pause background worker")
    def worker_pause() -> Dict[str, Any]:
        worker = _require_worker()
        worker._pause_event.clear()
        worker.stats["status"] = "paused"
        worker._log("INFO", "Worker paused via API")
        return {"ok": True, "status": "paused"}

    @app.post("/worker/resume", summary="Resume paused worker")
    def worker_resume() -> Dict[str, Any]:
        worker = _require_worker()
        worker._pause_event.set()
        worker.stats["status"] = "running"
        worker._log("INFO", "Worker resumed via API")
        return {"ok": True, "status": "running"}

    @app.post("/worker/stop", summary="Stop background worker")
    async def worker_stop() -> Dict[str, Any]:
        global _worker_task
        worker = _require_worker()
        worker._stop_event.set()
        worker._pause_event.set()
        if _worker_task and not _worker_task.done():
            try:
                await asyncio.wait_for(asyncio.shield(_worker_task), timeout=5.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                _worker_task.cancel()
        return {"ok": True, "status": "stopped"}

    # ── Direct document processing ─────────────────────────────────────────────

    @app.post("/process/{doc_id}", summary="Process a single document now")
    async def process_document(doc_id: int) -> Dict[str, Any]:
        """
        Immediately processes one document through the full blackbox pipeline
        without going through the batch queue. Useful for manual re-processing
        or testing specific documents.
        """
        worker = _require_worker()
        result = await worker.process_single(doc_id)
        if not result.get("ok"):
            raise HTTPException(status_code=500, detail=result)
        return result

    # ── Webhook trigger ────────────────────────────────────────────────────────

    class WebhookPayload(BaseModel):
        doc_id: Optional[int] = None
        batch_size: Optional[int] = None

    @app.post("/webhook/aiva-invoice-process", summary="Webhook: trigger processing")
    @app.post("/webhook/process", summary="Webhook: trigger processing (alias)")
    async def webhook_trigger(
        bg: BackgroundTasks,
        payload: Optional[WebhookPayload] = None,
    ) -> Dict[str, Any]:
        """
        Drop-in replacement for the n8n Webhook Trigger node.
        - If doc_id is provided: processes that specific document in background.
        - If no doc_id: ensures the worker loop is running.
        """
        worker = _require_worker()
        doc_id = payload.doc_id if payload else None

        if doc_id:
            bg.add_task(_bg_process_single, worker, doc_id)
            return {"ok": True, "message": f"Document {doc_id} queued for processing"}

        # Ensure worker loop is active
        global _worker_task
        if not _worker_task or _worker_task.done():
            worker._stop_event.clear()
            worker._pause_event.set()
            _worker_task = asyncio.create_task(worker.run(), name="FlowWorkerLoop")
            return {"ok": True, "message": "Worker loop started"}

        if worker.stats.get("status") == "paused":
            worker._pause_event.set()
            worker.stats["status"] = "running"
            return {"ok": True, "message": "Worker resumed"}

        return {"ok": True, "message": f"Worker already active (status={worker.stats.get('status')})"}

    # ── Mount System A validation sub-API ─────────────────────────────────────
    from .api.app import create_app as create_system_a_api
    settings = Settings()
    sub_api = create_system_a_api(settings, lambda: build_services(settings))
    app.mount("/sysa", sub_api)

    return app


async def _bg_process_single(worker: FlowWorker, doc_id: int) -> None:
    """Background task wrapper for single-doc processing (used by webhook)."""
    try:
        await worker.process_single(doc_id)
    except Exception as exc:
        log.error("[BG Process] Doc %d error: %s", doc_id, exc)


# Module-level app for uvicorn factory mode
app = create_flow_server()
