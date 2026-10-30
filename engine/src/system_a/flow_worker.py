"""AIVA System A — Flow Engine v2: Async Blackbox & Smart Batch Worker.

Architecture (5 clear sections):
  1. PaperlessClient      — REST CRUD with Paperless-ngx DMS
  2. FrontendClient       — Health probe + payload push to Portal
  3. OraclePrefetchCache  — Batch concurrent Oracle MCP pre-fetch (reduces bottleneck)
  4. blackbox()           — Async single-invoice processing function (PDF → v3.1 payload)
  5. FlowWorker           — Daemon loop: batch orchestration, health gate, stability

Design goals:
  - System A treated as ONE async blackbox (opaque to worker)
  - Oracle MCP: concurrent per-batch pre-fetch (N concurrent vs N sequential)
  - Frontend health gate: never claim/process when portal is offline
  - 24/7 stability: exceptions never kill the loop, gc.collect after each batch
  - Clean, readable functions — one responsibility each
"""
from __future__ import annotations

import asyncio
import gc
import logging
import os
import threading
import time
import uuid
from collections import deque
from contextlib import suppress
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

log = logging.getLogger("system_a.flow_worker")

# ─────────────────────────────────────────────────────────────────────────────
# Verification rule metadata (for building the v3.x verification block)
# ─────────────────────────────────────────────────────────────────────────────
_RULE_ORDER = ["V-01", "V-02", "V-03", "V-06", "V-04", "V-05", "V-07", "V-08", "V-09"]
_RULE_META: Dict[str, Tuple] = {
    "V-01": ("v01_required",     1, "logic",              False),
    "V-02": ("v02_line_math",    1, "logic",              True),
    "V-03": ("v03_doc_totals",   1, "logic",              False),
    "V-06": ("v06_signatures",   1, "logic+vision",       False),
    "V-04": ("v04_receipt",      2, "logic",              False),
    "V-05": ("v05_customer",     2, "logic+ai",           False),
    "V-07": ("v07_line_match",   3, "logic(M1)+ai(M3/M4/M5)", False),
    "V-08": ("v08_quantity",     3, "logic",              False),
    "V-09": ("v09_total_vs_receipt", 3, "logic",          False),
}


# =============================================================================
# SECTION 1 — PaperlessClient
# REST client for Paperless-ngx workflow lifecycle management.
# =============================================================================
class PaperlessClient:
    """Manages document state in Paperless-ngx: query, claim, tag, note."""

    def __init__(self, base_url: str, token: str, timeout_s: float = 45.0):
        self.base_url = base_url.rstrip("/")
        self._headers = {
            "Authorization": f"Token {token.strip()}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        self._timeout = httpx.Timeout(timeout_s, connect=10.0)

    def _client(self) -> httpx.Client:
        return httpx.Client(
            base_url=self.base_url,
            headers=self._headers,
            timeout=self._timeout,
        )

    # ── Read ──────────────────────────────────────────────────────────────────

    def query_documents(self, params: Dict[str, Any]) -> Dict[str, Any]:
        with self._client() as c:
            r = c.get("/api/documents/", params=params)
            r.raise_for_status()
            return r.json()

    def get_document(self, doc_id: int) -> Dict[str, Any]:
        with self._client() as c:
            r = c.get(f"/api/documents/{doc_id}/")
            r.raise_for_status()
            return r.json()

    def get_notes(self, doc_id: int) -> List[Dict[str, Any]]:
        with self._client() as c:
            r = c.get(f"/api/documents/{doc_id}/notes/")
            r.raise_for_status()
            data = r.json()
            return data if isinstance(data, list) else data.get("results", [])

    def download_pdf(self, doc_id: int) -> bytes:
        """Download the original PDF bytes for a document."""
        with httpx.Client(
            headers=self._headers,
            timeout=httpx.Timeout(120.0, connect=10.0),
        ) as c:
            r = c.get(f"{self.base_url}/api/documents/{doc_id}/download/")
            r.raise_for_status()
            return r.content

    # ── Write ─────────────────────────────────────────────────────────────────

    def patch_tags(self, doc_id: int, tags: List[int]) -> None:
        with self._client() as c:
            r = c.patch(f"/api/documents/{doc_id}/", json={"tags": tags})
            r.raise_for_status()

    def add_note(self, doc_id: int, note: str) -> None:
        with self._client() as c:
            r = c.post(f"/api/documents/{doc_id}/notes/", json={"note": note})
            r.raise_for_status()

    # ── Workflow helpers ───────────────────────────────────────────────────────

    def query_unprocessed(
        self,
        tag_invoice: int,
        tag_processed: int,
        tag_in_process: int,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Return eligible invoices: has INVOICE tag, no PROCESSED or IN_PROCESS tag."""
        res = self.query_documents({
            "tags__id__all": tag_invoice,
            "tags__id__none": f"{tag_processed},{tag_in_process}",
            "ordering": "id",
            "page_size": limit,
        })
        return res.get("results") or []

    def claim(
        self,
        doc_id: int,
        worker_id: str,
        tag_in_process: int,
        tag_processed: int,
    ) -> bool:
        """
        Optimistic claim using a lock note for concurrency safety.
        Returns True if this worker won the claim, False if already taken.
        """
        try:
            doc = self.get_document(doc_id)
            current_tags = [int(t) for t in (doc.get("tags") or [])]

            # Already claimed or processed by another worker
            if tag_in_process in current_tags or tag_processed in current_tags:
                return False

            # Write lock note first, then tag
            lock_token = f"AIVA_LOCK:{worker_id}:{int(time.time() * 1000)}"
            self.add_note(doc_id, lock_token)
            self.patch_tags(doc_id, list(set(current_tags + [tag_in_process])))

            # Verify we won the lock (last AIVA_LOCK note must be ours)
            notes = self.get_notes(doc_id)
            lock_notes = [
                n["note"] for n in notes
                if isinstance(n.get("note"), str) and n["note"].startswith("AIVA_LOCK:")
            ]
            if not lock_notes or f":{worker_id}:" not in lock_notes[-1]:
                # Lost the race — revert tag
                fresh_tags = [int(t) for t in (self.get_document(doc_id).get("tags") or [])]
                self.patch_tags(doc_id, [t for t in fresh_tags if t != tag_in_process])
                log.info("[Claim] Doc %d lock race lost — skipped", doc_id)
                return False

            log.info("[Claim] Doc %d claimed by %s", doc_id, worker_id)
            return True
        except Exception as exc:
            log.error("[Claim] Doc %d error: %s", doc_id, exc)
            return False

    def mark_processed(
        self,
        doc_id: int,
        verdict: str,
        ingest_result: str,
        validation_round: int = 1,
        tag_in_process: int = 26,
        tag_processed: int = 25,
    ) -> None:
        """Remove IN_PROCESS tag, add PROCESSED tag, write success note."""
        doc = self.get_document(doc_id)
        tags = [int(t) for t in (doc.get("tags") or [])]
        new_tags = list(set([t for t in tags if t != tag_in_process] + [tag_processed]))
        self.patch_tags(doc_id, new_tags)
        self.add_note(
            doc_id,
            f"AIVA_SUCCESS: verdict={verdict}, ingestion={ingest_result}, validationRound={validation_round}",
        )
        log.info("[Done] Doc %d → PROCESSED (verdict=%s, ingest=%s)", doc_id, verdict, ingest_result)

    def mark_failed(self, doc_id: int, reason: str, tag_in_process: int = 26) -> None:
        """Revert IN_PROCESS tag (→ UNPROCESSED) and write failure note."""
        try:
            doc = self.get_document(doc_id)
            tags = [int(t) for t in (doc.get("tags") or [])]
            self.patch_tags(doc_id, [t for t in tags if t != tag_in_process])
            self.add_note(doc_id, f"AIVA_FAIL: {str(reason).replace(chr(10), ' ').strip()[:240]}")
        except Exception as exc:
            log.error("[Mark Failed] Doc %d cleanup error: %s", doc_id, exc)
        log.warning("[Failed] Doc %d reverted to UNPROCESSED: %s", doc_id, reason[:120])

    def recover_stale_locks(self, tag_in_process: int, stale_timeout_s: float) -> List[int]:
        """
        Find documents stuck IN_PROCESS longer than stale_timeout_s and revert them.
        Protects against crashes that leave documents permanently locked.
        """
        recovered = []
        now = time.time()
        try:
            res = self.query_documents({"tags__id__all": tag_in_process, "page_size": 25})
            for doc in (res.get("results") or []):
                doc_id = int(doc["id"])
                mod_str = doc.get("modified") or doc.get("created") or ""
                try:
                    mod_time = datetime.fromisoformat(mod_str.replace("Z", "+00:00")).timestamp()
                except Exception:
                    continue

                if now - mod_time > stale_timeout_s:
                    minutes = int((now - mod_time) / 60)
                    tags = [int(t) for t in (doc.get("tags") or [])]
                    self.patch_tags(doc_id, [t for t in tags if t != tag_in_process])
                    self.add_note(
                        doc_id,
                        f"AIVA_RECOVER: Stale lock cleared by engine daemon (inactive >{minutes}m)",
                    )
                    recovered.append(doc_id)
                    log.info("[Stale] Doc %d lock released (inactive %dm)", doc_id, minutes)
        except Exception as exc:
            log.warning("[Stale] Recovery check error: %s", exc)
        return recovered


# =============================================================================
# SECTION 2 — FrontendClient
# Health probe + payload push to AIVA Portal /api/engine/ingest.
# Auto-discovers portal URL across Docker network, host:3000, and host:3001.
# =============================================================================
class FrontendClient:
    """Pushes engine results to Portal and probes health before claiming docs."""

    # Fallback candidates tried in order when primary URL fails
    _FALLBACK_HOSTS = (
        "http://host.docker.internal:3000",
        "http://host.docker.internal:3001",
        "http://aiva-portal:3000",
    )

    def __init__(
        self,
        base_url: str,
        ingest_path: str = "/api/engine/ingest",
        ingest_key: str = "",
        timeout_s: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/") if base_url else ""
        self.ingest_path = "/" + ingest_path.lstrip("/")
        self.ingest_key = ingest_key.strip()
        self.timeout_s = timeout_s
        self._working_base: Optional[str] = None  # cache last successful host

    def _candidates(self) -> List[str]:
        """Ordered list of base URLs to try (working host first)."""
        seen: List[str] = []
        for url in [self._working_base, self.base_url, *self._FALLBACK_HOSTS]:
            if url and url not in seen:
                seen.append(url)
        return seen

    def _auth_headers(self) -> Dict[str, str]:
        h: Dict[str, str] = {"User-Agent": "aiva-flow-engine/2.0"}
        if self.ingest_key:
            h["Authorization"] = f"Bearer {self.ingest_key}"
            h["X-AIVA-Key"] = self.ingest_key
        return h

    def is_online(self) -> Tuple[bool, str]:
        """
        Probes /api/health on all candidate URLs.
        Returns (True, url) if any responds 200, (False, reason) otherwise.
        Caches the working URL for subsequent calls.
        """
        for base in self._candidates():
            try:
                with httpx.Client(timeout=httpx.Timeout(2.5, connect=2.0)) as c:
                    r = c.get(f"{base}/api/health")
                    if r.status_code == 200 and r.json().get("ok") is not False:
                        self._working_base = base
                        return True, base
            except Exception:
                continue
        return False, f"All endpoints offline: {self._candidates()}"

    def push(self, payload: Dict[str, Any]) -> Tuple[bool, Any]:
        """
        POST payload to /api/engine/ingest.
        Returns (True, response_body) on success, (False, error_string) on failure.
        Tries all candidate hosts in order; stops on first HTTP response.
        """
        headers = {"Content-Type": "application/json", **self._auth_headers()}

        for base in self._candidates():
            url = f"{base}{self.ingest_path}"
            try:
                with httpx.Client(timeout=httpx.Timeout(self.timeout_s, connect=5.0)) as c:
                    r = c.post(url, json=payload, headers=headers)
                    status = r.status_code
                    try:
                        body = r.json()
                    except Exception:
                        body = {"text": r.text[:200]}

                    if status == 200 and (
                        body.get("ok") is True
                        or body.get("result") in ("CREATED", "ALREADY_PROCESSED")
                    ):
                        self._working_base = base
                        return True, body

                    # Got an HTTP response — no point trying other hosts
                    err = (
                        body.get("error")
                        or "; ".join(body.get("errors") or body.get("issues") or [])
                        or f"HTTP {status}"
                    )
                    return False, f"{err} (code={body.get('code', status)})"
            except Exception as exc:
                log.debug("[Push] %s failed: %s", url, exc)
                continue

        return False, f"All candidate endpoints unreachable: {self._candidates()}"


# =============================================================================
# SECTION 3 — OraclePrefetchCache
# Batch concurrent Oracle MCP pre-fetch.
#
# Problem:  Sequential per-doc Oracle queries = N×40s for N docs in a batch.
# Solution: After perception for all docs, fire Oracle lookups concurrently
#           (asyncio.gather) so total Oracle wait ≈ max(40s) not N×40s.
#           Results are cached by key-fingerprint and reused by validation.
# =============================================================================
# SECTION 3 — CachedOracleRepository & Batch Pre-fetch
# =============================================================================
class CachedOracleRepository:
    """
    Wraps an OracleRepository with an in-memory cache shared across a batch.
    Prevents repeated queries for identical parameters (e.g. same PO, supplier tax, or invoice number).
    """

    def __init__(self, inner: Any, cache: Optional[Dict[Any, Any]] = None):
        self._inner = inner
        self._cache = cache if cache is not None else {}
        self._lock = threading.Lock()

    def _call(self, name: str, *args):
        def _norm(a):
            if isinstance(a, (list, tuple, set)):
                return tuple(_norm(x) for x in a)
            if isinstance(a, dict):
                return tuple(sorted((k, _norm(v)) for k, v in a.items()))
            return a

        key = (name, tuple(_norm(a) for a in args))
        with self._lock:
            if key in self._cache:
                log.info("[OracleCache] HIT %s: %s", name, [str(a)[:30] for a in args[:2]])
                return self._cache[key]
        res = getattr(self._inner, name)(*args)
        with self._lock:
            self._cache[key] = res
        return res

    def rcv_v01(self, po_number: str, invoice_num: str):
        return self._call("rcv_v01", po_number, invoice_num)

    def supplier_tax_by_po(self, po_number: str):
        return self._call("supplier_tax_by_po", po_number)

    def rcv_v02(self, supplier_tax_id: str, invoice_num: str):
        return self._call("rcv_v02", supplier_tax_id, invoice_num)

    def receipts_by_tax_invoice(self, supplier_tax_id: str, invoice_variants: list[str]):
        return self._call("receipts_by_tax_invoice", supplier_tax_id, invoice_variants)

    def receipts_by_po_list(self, po_numbers: list[str]):
        return self._call("receipts_by_po_list", po_numbers)

    def receipts_by_receipt_num(self, supplier_tax_id: str, receipt_num: str):
        return self._call("receipts_by_receipt_num", supplier_tax_id, receipt_num)

    def receipts_by_po_vendor_invoice(self, po_number: str, invoice_variants: list[str]):
        return self._call("receipts_by_po_vendor_invoice", po_number, invoice_variants)

    def receipts_by_tax_invoice_suffix(self, supplier_tax_id: str, suffixes: list[str]):
        return self._call("receipts_by_tax_invoice_suffix", supplier_tax_id, suffixes)

    def size(self) -> int:
        return len(self._cache)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()


# Legacy alias for backward compatibility
OraclePrefetchCache = CachedOracleRepository


def build_base_oracle(settings: Any) -> Any:
    """Build root Oracle repository based on settings (MCP or Memory)."""
    from .domain.standard import load_standard
    std = load_standard()
    ora = std.policy.get("oracle", {})
    row_cap = ora.get("row_cap", 200)

    if settings.mode == "production" and settings.oracle_backend != "memory":
        from .adapters.oracle.mcp_repository import McpSqlClient, OracleMcpRepository
        if not settings.oracle_mcp_url:
            raise RuntimeError("ORACLE_MCP_URL is required when SYSTEM_A_MODE=production")
        client = McpSqlClient(
            settings.oracle_mcp_url, settings.oracle_mcp_token,
            timeout_s=settings.oracle_timeout_s,
        )
        return OracleMcpRepository(
            client, row_cap=row_cap, database=settings.oracle_database,
            match_columns=(ora.get("lookup") or {}).get("invoice_match_columns"),
            row_caps=ora.get("row_caps"),
        )
    else:
        from .adapters.oracle.repositories import InMemoryOracleRepository
        return InMemoryOracleRepository({}, down=False)


async def prefetch_oracle_batch(
    extractions: List[Dict[str, Any]],
    settings: Any,
    cached_oracle: CachedOracleRepository,
) -> int:
    """
    Phase C: Concurrent Oracle pre-fetch for all extracted key-sets in a batch.
    Uses cached_oracle so all results are retained in memory for the validation phase.
    """
    from .domain.standard import load_standard
    from .application.oracle_lookup import OracleSession, lookup_mode, TAX_MODE

    if not extractions:
        return 0

    std = load_standard()
    ora_cfg = std.policy.get("oracle", {})
    row_cap = ora_cfg.get("row_cap", 200)
    mode = lookup_mode(std.policy)

    unique_key_sets: Dict[str, Dict[str, Optional[str]]] = {}
    for ext in extractions:
        fields = (ext.get("fields") or {}) if isinstance(ext, dict) else {}
        inv_num = _safe_field(fields, "invoice_num")
        po_num = _safe_field(fields, "po_number")
        tax_id = _safe_field(fields, "supplier_tax_id")
        k = f"{inv_num}|{po_num}|{tax_id}"
        if k not in unique_key_sets:
            unique_key_sets[k] = {"inv_num": inv_num, "po_num": po_num, "tax_id": tax_id}

    if not unique_key_sets:
        return 0

    log.info("[OraclePrefetch] Firing %d concurrent Oracle lookups for batch", len(unique_key_sets))

    async def _lookup_one(keys: Dict[str, Optional[str]]) -> None:
        inv = keys["inv_num"]
        po = keys["po_num"]
        tax = keys["tax_id"]
        try:
            session = OracleSession(cached_oracle, row_cap, lookup_cfg=ora_cfg.get("lookup"))
            if mode == TAX_MODE:
                await asyncio.to_thread(
                    session.lookup_tax_invoice, inv,
                    ocr_supplier_tax_id=tax, po_number=po,
                )
            else:
                if not (po and inv):
                    return
                await asyncio.to_thread(session.lookup, po, inv)
            log.debug("[OraclePrefetch] Prefetched inv=%s po=%s", inv, po)
        except Exception as exc:
            log.warning("[OraclePrefetch] Lookup error for inv=%s: %s", inv, exc)

    await asyncio.gather(*[_lookup_one(keys) for keys in unique_key_sets.values()])
    log.info("[OraclePrefetch] Done — cache size: %d entries", cached_oracle.size())
    return len(unique_key_sets)


def _safe_field(fields: Dict[str, Any], name: str) -> Optional[str]:
    """Extract field value safely from extraction result fields dict."""
    f = fields.get(name)
    if f is None:
        return None
    if isinstance(f, dict):
        return f.get("value") or f.get("raw")
    return str(f) if f else None


# =============================================================================
# SECTION 4 — blackbox()
# THE async single-invoice processing function.
# Input:  PDF bytes + doc_id
# Output: Final payload dict (schema aiva.system_a.result v3.x)
#
# System A internals are completely opaque to the caller.
# The worker calls this and gets back a ready-to-push payload.
# =============================================================================
async def blackbox(
    pdf_bytes: bytes,
    *,
    doc_id: str,
    settings: Any,
    oracle_cache: Optional[OraclePrefetchCache] = None,
) -> Dict[str, Any]:
    """
    AIVA System A — Async invoice processing blackbox.

    Executes the complete pipeline:
      1. Perception  — single-pass VLM OCR extraction (CPU/IO → thread pool)
      2. Validation  — rules V-01..V-09 vs Oracle EBS (uses cache if provided)
      3. Assembly    — builds final v3.x result payload with verification block

    Args:
        pdf_bytes:    Raw PDF bytes to process.
        doc_id:       DMS document ID string (e.g. "DMS-42").
        settings:     Engine settings (Settings dataclass).
        oracle_cache: Optional pre-fetched Oracle cache for this batch.

    Returns:
        Final result dict ready to POST to /api/engine/ingest.
    """
    t0 = time.time()
    dms_doc_id = f"DMS-{doc_id}" if not str(doc_id).startswith("DMS-") else str(doc_id)

    if oracle_cache is None:
        oracle_cache = CachedOracleRepository(build_base_oracle(settings))

    # Step 1: Perception (blocking I/O → run in thread pool)
    ext = await asyncio.to_thread(_run_perception, pdf_bytes, dms_doc_id, settings)

    # Step 2: Validation (CPU + Oracle I/O → run in thread pool, uses cache)
    result = await asyncio.to_thread(_run_validation, ext, dms_doc_id, settings, oracle_cache)

    # Step 3: Assemble final payload (fast, runs inline)
    elapsed_ms = int((time.time() - t0) * 1000)
    return _assemble_final_payload(result, dms_doc_id, elapsed_ms, settings)


def _run_perception(pdf_bytes: bytes, dms_doc_id: str, settings: Any) -> Any:
    """
    Stage 1: Run single-pass VLM perception on PDF.
    Returns ExtractionResult from perception pipeline.
    Runs in a thread pool (blocking httpx calls to LiteLLM).
    """
    from .container import build_perception

    perception = build_perception(settings)
    return perception.extract(
        pdf_bytes,
        package_id=f"PKG-{dms_doc_id}",
        dms_doc_id=dms_doc_id,
    )


def _run_validation(
    ext: Any,
    dms_doc_id: str,
    settings: Any,
    oracle_cache: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Stage 2: Run V-01..V-09 rules against Oracle EBS.
    If oracle_cache is provided, validation finds cached results.
    Runs in a thread pool (blocking Oracle MCP calls).
    """
    from .container import build_services
    from .application.orchestrator import validate
    from .domain.standard import load_standard

    services = build_services(settings, oracle_repo=oracle_cache)
    std = load_standard()

    request = {
        "validation_id": f"VAL-{dms_doc_id}-{int(time.time())}",
        "correlation_id": str(uuid.uuid4()),
        "idempotency_key": None,
        "document_revision": 1,
        "validation_round": 1,
        "source": "system_a.flow_engine_v2",
        "dms_doc_id": dms_doc_id,
        "content_kind": "pdf",
        "declared_mime": "application/pdf",
    }

    result = validate(ext, services, request=request, std=std)

    # Standardise package identifiers
    if isinstance(result.get("package"), dict):
        result["package"]["dms_doc_id"] = dms_doc_id
        result["package"]["package_id"] = f"PKG-{dms_doc_id}"
    if isinstance(result.get("request"), dict):
        result["request"]["dms_doc_id"] = dms_doc_id

    return result


def _assemble_final_payload(
    result: Dict[str, Any],
    dms_doc_id: str,
    elapsed_ms: int,
    settings: Any,
) -> Dict[str, Any]:
    """
    Stage 3: Build verification block and attach to result.
    Produces schema aiva.system_a.result/3.x compatible payload.
    """
    rec = result.get("recommendation") or {}
    rule_results = result.get("rule_results") or []
    exceptions = result.get("exceptions") or []

    rules_table = []
    for rid in _RULE_ORDER:
        name, step, engine, gate = _RULE_META[rid]
        r = next((x for x in rule_results if x.get("rule_id") == rid), None)
        rules_table.append({
            "rule_id": rid,
            "rule_name": name,
            "step": step,
            "engine": engine,
            "gate": gate,
            "rule_version": r.get("rule_version") if r else None,
            "result": r.get("result", "not_evaluated") if r else "not_evaluated",
            "halted_by": r.get("halted_by") if r else None,
            "detail": r.get("detail", "") if r else "not evaluated",
            "exceptions": [
                {"code": e.get("code"), "name": e.get("name"), "severity": e.get("severity")}
                for e in exceptions if e.get("rule_id") == rid
            ],
            "evidence_ids": r.get("evidence_ids", []) if r else [],
            "data": r.get("data") if r else None,
        })

    result["verification"] = {
        "schema": "aiva.system_a.result/3.1",
        "source": "system_a.flow_engine_v2 (async blackbox)",
        "engine_ok": len(rule_results) > 0,
        "mode": settings.mode,
        "doc_id": dms_doc_id,
        "verdict": rec.get("value"),
        "halted_by": rec.get("halted_by"),
        "max_severity": rec.get("max_severity"),
        "exception_codes": rec.get("exception_codes", []),
        "cards": len(rules_table),
        "elapsed_ms": elapsed_ms,
        "rules": rules_table,
    }

    return result


# =============================================================================
# SECTION 5 — FlowWorker
# 24/7 daemon: poll → batch-claim → prefetch Oracle → blackbox → push → tag.
# =============================================================================
class FlowWorker:
    """
    High-stability async daemon worker.

    Lifecycle:
      1. Poll Paperless for unprocessed INVOICE-tagged documents
      2. Claim each doc (optimistic locking via note + tag)
      3. Download PDFs concurrently for all claimed docs
      4. Run blackbox (perception) concurrently for all docs
      5. Pre-fetch Oracle results concurrently for all docs (bottleneck fix)
      6. Run validation + assemble payload for each doc (uses Oracle cache)
      7. Push each result to Portal, update Paperless tags
      8. GC, sleep, repeat
    """

    def __init__(
        self,
        paperless: PaperlessClient,
        frontend: FrontendClient,
        settings: Any,
        config: Dict[str, Any],
    ):
        self.paperless = paperless
        self.frontend = frontend
        self.settings = settings
        self.config = config

        self.worker_id = f"worker-{uuid.uuid4().hex[:8]}"
        self.started_at: Optional[float] = None

        # Async control
        self._stop_event = asyncio.Event()
        self._pause_event = asyncio.Event()
        self._pause_event.set()  # unpaused by default

        # Stats
        self.stats: Dict[str, Any] = {
            "worker_id": self.worker_id,
            "status": "stopped",
            "processed_count": 0,
            "success_count": 0,
            "failed_count": 0,
            "stale_recovered_count": 0,
            "current_batch": [],
            "last_cycle_at": None,
            "last_error": None,
        }
        self.recent_events: deque = deque(maxlen=100)
        self._frontend_offline_notified = False

    # ── Event log ─────────────────────────────────────────────────────────────

    def _log(self, event_type: str, message: str, doc_id: Optional[int] = None) -> None:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": event_type,
            "doc_id": doc_id,
            "message": message,
        }
        self.recent_events.append(entry)
        level = logging.ERROR if event_type == "ERROR" else logging.INFO
        log.log(level, "[Worker] %s", message)

    # ── Controls ──────────────────────────────────────────────────────────────

    def get_status(self) -> Dict[str, Any]:
        uptime = int(time.time() - self.started_at) if self.started_at else 0
        return {
            **self.stats,
            "uptime_seconds": uptime,
            "config": {
                "tag_invoice": self.config.get("tag_invoice", 5),
                "tag_processed": self.config.get("tag_processed", 25),
                "tag_in_process": self.config.get("tag_in_process", 26),
                "batch_size": self.config.get("batch_size", 5),
                "poll_interval_s": self.config.get("poll_interval_s", 15),
                "stale_timeout_s": self.config.get("stale_timeout_s", 1800),
                "frontend_base_url": self.frontend.base_url or "(auto)",
            },
            "recent_events": list(self.recent_events),
        }

    # ── Main async loop ────────────────────────────────────────────────────────

    async def run(self) -> None:
        """Main worker coroutine. Run as asyncio task."""
        self.started_at = time.time()
        self.stats["status"] = "running"
        self._log("INFO", f"Flow Worker v2 started — ID: {self.worker_id}")

        tag_inv = self.config.get("tag_invoice", 5)
        tag_proc = self.config.get("tag_processed", 25)
        tag_in_proc = self.config.get("tag_in_process", 26)
        batch_size = self.config.get("batch_size", 5)
        poll_interval = float(self.config.get("poll_interval_s", 15))
        stale_timeout = float(self.config.get("stale_timeout_s", 1800))

        while not self._stop_event.is_set():
            # Wait while paused (manual pause command)
            await self._pause_event.wait()
            if self._stop_event.is_set():
                break

            self.stats["last_cycle_at"] = datetime.now(timezone.utc).isoformat()

            # ── Preflight: Frontend health gate ───────────────────────────────
            is_online, fe_url = await asyncio.to_thread(self.frontend.is_online)
            if not is_online:
                if not self._frontend_offline_notified:
                    self._log("WAIT", f"Frontend offline — pausing claim loop. Will retry every {poll_interval:.0f}s")
                    self._frontend_offline_notified = True
                self.stats["status"] = "waiting_for_frontend"
                await asyncio.sleep(poll_interval)
                continue
            else:
                if self._frontend_offline_notified:
                    self._log("RESUME", f"Frontend back online at {fe_url} — resuming processing")
                    self._frontend_offline_notified = False
                self.stats["status"] = "running"

            # ── Cycle ─────────────────────────────────────────────────────────
            try:
                has_more = await self._run_cycle(
                    tag_inv, tag_proc, tag_in_proc, batch_size, stale_timeout
                )
            except Exception as exc:
                err = f"Cycle error: {type(exc).__name__}: {exc}"
                self.stats["last_error"] = err
                self._log("ERROR", err)
                has_more = False

            # Sleep shorter if there are more docs waiting
            await asyncio.sleep(2.0 if has_more else poll_interval)

        self.stats["status"] = "stopped"
        self._log("INFO", "Flow Worker stopped")

    async def _run_cycle(
        self,
        tag_inv: int,
        tag_proc: int,
        tag_in_proc: int,
        batch_size: int,
        stale_timeout: float,
    ) -> bool:
        """
        One poll-process cycle. Returns True if there are likely more docs waiting.

        Pipeline:
          A. Recover stale locks
          B. Query + claim batch of docs
          C. Download PDFs concurrently
          D. Run perception (blackbox stage 1) concurrently
          E. Pre-fetch Oracle concurrently (batch bottleneck fix)
          F. Run validation + push + tag for each doc
        """
        # A. Stale lock recovery
        recovered = await asyncio.to_thread(
            self.paperless.recover_stale_locks, tag_in_proc, stale_timeout
        )
        if recovered:
            self.stats["stale_recovered_count"] += len(recovered)
            self._log("RECOVER", f"Stale locks cleared: doc_ids={recovered}")

        # B. Query candidates
        candidates = await asyncio.to_thread(
            self.paperless.query_unprocessed, tag_inv, tag_proc, tag_in_proc, batch_size
        )
        if not candidates:
            return False

        self._log("POLL", f"Found {len(candidates)} candidate invoice(s)")
        has_more = len(candidates) >= batch_size

        # Claim each doc
        claimed_docs: List[Dict[str, Any]] = []
        for cand in candidates:
            doc_id = int(cand["id"])
            claimed = await asyncio.to_thread(
                self.paperless.claim, doc_id, self.worker_id, tag_in_proc, tag_proc
            )
            if claimed:
                claimed_docs.append(cand)

        if not claimed_docs:
            return has_more

        self._log("BATCH_START", f"Processing batch of {len(claimed_docs)} docs: {[d['id'] for d in claimed_docs]}")
        self.stats["current_batch"] = [int(d["id"]) for d in claimed_docs]

        # C. Download PDFs concurrently
        pdf_map: Dict[int, bytes] = {}
        async def _download(doc: Dict[str, Any]) -> None:
            doc_id = int(doc["id"])
            try:
                pdf = await asyncio.to_thread(self.paperless.download_pdf, doc_id)
                pdf_map[doc_id] = pdf
                log.debug("[Download] Doc %d OK (%d bytes)", doc_id, len(pdf))
            except Exception as exc:
                log.error("[Download] Doc %d failed: %s", doc_id, exc)
                await asyncio.to_thread(
                    self.paperless.mark_failed, doc_id, f"PDF download error: {exc}", tag_in_proc
                )

        await asyncio.gather(*[_download(d) for d in claimed_docs])

        # Filter to only docs with PDFs
        processable = [d for d in claimed_docs if int(d["id"]) in pdf_map]
        if not processable:
            self.stats["current_batch"] = []
            return has_more

        # D. Perception stage — run concurrently (LiteLLM calls in thread pool)
        perception_results: Dict[int, Any] = {}
        llm_sem = asyncio.Semaphore(self.config.get("max_concurrent_perception", 3))

        async def _perceive(doc: Dict[str, Any]) -> None:
            doc_id = int(doc["id"])
            dms_id = f"DMS-{doc_id}"
            async with llm_sem:
                try:
                    ext = await asyncio.to_thread(
                        _run_perception, pdf_map[doc_id], dms_id, self.settings
                    )
                    perception_results[doc_id] = ext
                    log.debug("[Perception] Doc %d OK", doc_id)
                except Exception as exc:
                    log.error("[Perception] Doc %d failed: %s", doc_id, exc)
                    await asyncio.to_thread(
                        self.paperless.mark_failed, doc_id, f"Perception error: {exc}", tag_in_proc
                    )

        await asyncio.gather(*[_perceive(d) for d in processable])

        # Filter to only docs that perception succeeded
        validated_docs = [d for d in processable if int(d["id"]) in perception_results]

        # E. Oracle pre-fetch (concurrent batch) — bottleneck fix
        base_oracle = build_base_oracle(self.settings)
        oracle_cache = CachedOracleRepository(base_oracle)
        if self.settings.mode == "production" and validated_docs:
            try:
                ext_list = [
                    _extraction_to_fields(perception_results[int(d["id"])])
                    for d in validated_docs
                ]
                n_fetched = await prefetch_oracle_batch(ext_list, self.settings, oracle_cache)
                self._log("ORACLE_PREFETCH", f"Prefetched {n_fetched} Oracle key-sets for {len(validated_docs)} docs")
            except Exception as exc:
                log.warning("[OraclePrefetch] Batch prefetch failed (will proceed without cache): %s", exc)

        # F. Validation + push + tag (sequential per doc to avoid DB lock contention)
        for doc in validated_docs:
            doc_id = int(doc["id"])
            dms_id = f"DMS-{doc_id}"
            self._log("PROCESS_START", f"Validating doc {doc_id}", doc_id)

            try:
                # Validation + assemble (uses oracle_cache)
                result = await asyncio.to_thread(
                    _run_validation, perception_results[doc_id], dms_id, self.settings, oracle_cache
                )
                elapsed_ms = 0  # already timed inside blackbox when called directly
                payload = _assemble_final_payload(result, dms_id, elapsed_ms, self.settings)

                # Push to frontend
                ok, push_resp = await asyncio.to_thread(self.frontend.push, payload)

                if ok:
                    verdict = result.get("recommendation", {}).get("value", "UNKNOWN")
                    res_str = push_resp.get("result", "OK") if isinstance(push_resp, dict) else "OK"
                    round_no = push_resp.get("validationRound", 1) if isinstance(push_resp, dict) else 1
                    await asyncio.to_thread(
                        self.paperless.mark_processed,
                        doc_id, verdict, res_str, round_no, tag_in_proc, tag_proc,
                    )
                    self.stats["success_count"] += 1
                    self._log("SUCCESS", f"Doc {doc_id} → {verdict} (ingest={res_str})", doc_id)
                else:
                    await asyncio.to_thread(
                        self.paperless.mark_failed, doc_id, str(push_resp), tag_in_proc
                    )
                    self.stats["failed_count"] += 1
                    self._log("ERROR", f"Doc {doc_id} push rejected: {push_resp}", doc_id)

            except Exception as exc:
                err_msg = f"{type(exc).__name__}: {exc}"
                self.stats["last_error"] = err_msg
                self.stats["failed_count"] += 1
                await asyncio.to_thread(
                    self.paperless.mark_failed, doc_id, err_msg, tag_in_proc
                )
                self._log("ERROR", f"Doc {doc_id} crashed: {err_msg}", doc_id)
            finally:
                self.stats["processed_count"] += 1

            # Brief inter-doc pause (avoids hammering frontier)
            await asyncio.sleep(0.5)

        self.stats["current_batch"] = []
        gc.collect()
        return has_more

    # ── Direct process (for /process/{doc_id} endpoint) ──────────────────────

    async def process_single(self, doc_id: int) -> Dict[str, Any]:
        """
        Manually process one document end-to-end (no claim check).
        Used by the /process/{doc_id} API endpoint.
        """
        dms_id = f"DMS-{doc_id}"
        self._log("MANUAL", f"Manual trigger for doc {doc_id}", doc_id)
        tag_in_proc = self.config.get("tag_in_process", 26)
        tag_proc = self.config.get("tag_processed", 25)

        try:
            pdf = await asyncio.to_thread(self.paperless.download_pdf, doc_id)
            payload = await blackbox(pdf, doc_id=str(doc_id), settings=self.settings)
            ok, push_resp = await asyncio.to_thread(self.frontend.push, payload)

            if ok:
                verdict = payload.get("recommendation", {}).get("value", "UNKNOWN")
                res_str = push_resp.get("result", "OK") if isinstance(push_resp, dict) else "OK"
                round_no = push_resp.get("validationRound", 1) if isinstance(push_resp, dict) else 1
                await asyncio.to_thread(
                    self.paperless.mark_processed,
                    doc_id, verdict, res_str, round_no, tag_in_proc, tag_proc,
                )
                self._log("SUCCESS", f"Manual doc {doc_id} → {verdict}", doc_id)
                return {"ok": True, "doc_id": doc_id, "verdict": verdict, "ingest": push_resp}
            else:
                await asyncio.to_thread(
                    self.paperless.mark_failed, doc_id, str(push_resp), tag_in_proc
                )
                self._log("ERROR", f"Manual doc {doc_id} push failed: {push_resp}", doc_id)
                return {"ok": False, "doc_id": doc_id, "error": str(push_resp)}
        except Exception as exc:
            err = f"{type(exc).__name__}: {exc}"
            await asyncio.to_thread(self.paperless.mark_failed, doc_id, err, tag_in_proc)
            self._log("ERROR", f"Manual doc {doc_id} crashed: {err}", doc_id)
            return {"ok": False, "doc_id": doc_id, "error": err}


def _extraction_to_fields(ext: Any) -> Dict[str, Any]:
    """Convert ExtractionResult to a plain dict suitable for OraclePrefetchCache keying."""
    if isinstance(ext, dict):
        return ext
    # ExtractionResult pydantic model
    try:
        return {"fields": {k: {"value": v} for k, v in (ext.fields or {}).items()}}
    except Exception:
        return {}


# =============================================================================
# Factory — build FlowWorker from environment
# =============================================================================
def build_flow_worker(settings: Any) -> FlowWorker:
    """Build a ready-to-run FlowWorker from environment variables."""
    from .envfile import load_env
    load_env()

    paperless_url = os.getenv("PAPERLESS_BASE_URL", os.getenv("PAPERLESS_URL", ""))
    paperless_token = os.getenv("PAPERLESS_API_TOKEN", os.getenv("PAPERLESS_TOKEN", ""))
    paperless = PaperlessClient(paperless_url, paperless_token)

    frontend_url = os.getenv("FRONTEND_BASE_URL", "")
    frontend_path = os.getenv("FRONTEND_INGEST_PATH", "/api/engine/ingest")
    frontend_key = os.getenv("ENGINE_INGEST_KEY", "")
    frontend = FrontendClient(frontend_url, frontend_path, frontend_key)

    config = {
        "tag_invoice": int(os.getenv("PAPERLESS_TAG_INVOICE", "5")),
        "tag_processed": int(os.getenv("PAPERLESS_TAG_PROCESSED", "25")),
        "tag_in_process": int(os.getenv("PAPERLESS_TAG_IN_PROCESS", "26")),
        "batch_size": int(os.getenv("BATCH_SIZE", "5")),
        "poll_interval_s": float(os.getenv("POLL_INTERVAL_SECONDS", "15")),
        "stale_timeout_s": float(os.getenv("STALE_LOCK_TIMEOUT_SECONDS", "1800")),
        "max_concurrent_perception": int(os.getenv("MAX_CONCURRENT_PERCEPTION", "3")),
    }

    return FlowWorker(paperless, frontend, settings, config)
