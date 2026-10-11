"""HTTP API + the single-page UI.

    GET    /                                      the UI
    GET    /api/meta                              what this instance is wired to (engine, mode, source, colours)
    GET    /api/health                            System A reachable? the DMS reachable?
    GET    /api/documents                         every document with its state
    POST   /api/documents/refresh                 re-read the document list from the DMS
    GET    /api/documents/{id}                    one document's state (poll while processing)
    POST   /api/documents/{id}/process            start (202) - 409 if that document is already running
    GET    /api/documents/{id}/result             the screen model: boxes from ``ocr.elements``, Final, Verify
    GET    /api/documents/{id}/payload            the raw aiva.system_a.result/3.0, exactly as System A returned it
    GET    /api/documents/{id}/extraction         the ``extraction`` block of that payload (what System A read)
    DELETE /api/documents/{id}/result             forget the result of that document (server side)
    GET    /api/documents/{id}/pdf                the document's own file, inline
    GET    /api/documents/{id}/pages/{n}/image    that page rendered, to draw the boxes on
    GET    /api/search?q=                         ids of processed documents whose payload text contains q

    GET    /api/rounds                            the rounds in the results directory and which one is open
    POST   /api/rounds/create                     open a new round folder
    POST   /api/rounds/select                     look at another round (nothing is deleted)
    GET    /api/rounds/summary                    summary.json of the open round
    POST   /api/rounds/summary/rebuild            fold it again from the DMS-*_result.json files
    GET    /api/rounds/compare?base=&target=      what moved between two rounds

    POST   /api/batch/start                       run a list of documents into the open round (202)
    POST   /api/batch/stop                        let go of the queued ones
    GET    /api/batch/status                      progress, for the polling browser

There is no stand-in page and no second source anywhere in here: if System A did not produce something, the
request says so (409 while it has not run, 502 when the file cannot be read) and the UI shows the failure.

A round name arrives from the browser, so it goes through the store's own rule before anything is opened: a name
that looks like a path is a 400, not a folder outside the results directory.
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel

from . import __version__
from .config import Settings
from .service import Busy, DocumentService, NotReady, NotRoundStore
from .view import COLORS, DEFAULT_TYPES, ELEMENT_TYPES

log = logging.getLogger("webapp.api")
STATIC = Path(__file__).resolve().parent / "static"
NO_STORE = {"Cache-Control": "no-store"}
LONG_CACHE = {"Cache-Control": "private, max-age=3600"}


class RoundName(BaseModel):
    """The round the tester picked (or asked for) in the selector."""
    name: str = ""


class BatchRun(BaseModel):
    """What to run: the documents ticked in the list, and how many of them at a time."""
    doc_ids: list[int] = []
    skip_existing: bool = True
    concurrency: int = 0


def create_app(settings: Settings, service: DocumentService, catalog) -> FastAPI:
    app = FastAPI(title="AIVA System A test portal", version=__version__)

    def doc_or_404(doc_id: int):
        try:
            return catalog.get(doc_id)
        except KeyError:
            raise HTTPException(404, f"unknown document {doc_id}") from None

    def round_command(fn, *args, **kw):
        """Run a round/batch command and turn its complaints into a status the browser can act on.

        A name the store will not accept is the caller's mistake (400); a document that is busy, a batch already
        going, or a store with no rounds at all is a state to react to (409).
        """
        try:
            return fn(*args, **kw)
        except (ValueError, Busy, NotRoundStore) as e:
            raise HTTPException(400 if isinstance(e, ValueError) else 409, str(e)) from None

    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(STATIC / "index.html", headers=NO_STORE, media_type="text/html")

    @app.get("/static/app.js", include_in_schema=False)
    def js():
        return FileResponse(STATIC / "app.js", headers=NO_STORE, media_type="application/javascript")

    @app.get("/api/meta")
    def meta():
        return {"version": __version__, "engine": settings.engine, "mode": settings.mode, "quick": settings.quick,
                "persist": settings.persist_results, "workers": settings.workers, "render_dpi": settings.render_dpi,
                "round": getattr(service.store, "active_round", None), "results_dir": str(settings.results_dir),
                "source": catalog.stats(), "system_a": str(settings.system_a_home or ""),
                "colors": COLORS, "element_types": list(ELEMENT_TYPES), "default_types": list(DEFAULT_TYPES)}

    @app.get("/api/health")
    def health():
        eng = service.runner.health()
        src = {"kind": catalog.kind}
        try:                                                # one cheap call, never fatal
            src.update(catalog.health())
        except Exception as e:
            src.update(error=f"{type(e).__name__}: {e}"[:200])
        return JSONResponse({"ok": bool(eng.get("ok")), "engine": eng, "source": src, "kind": catalog.kind,
                             "mode": settings.mode, "documents": len(catalog.docs)},
                            status_code=200 if eng.get("ok") else 503)

    @app.get("/api/documents")
    def documents():
        return service.list_documents()

    @app.post("/api/documents/refresh")
    def refresh():
        from .catalog import CatalogError
        try:
            catalog.refresh()
        except CatalogError as e:
            raise HTTPException(502, str(e)) from None
        return {"documents": len(catalog.docs), "pages": sum(d.pages_total or 0 for d in catalog.docs),
                "error": catalog.list_error}

    @app.get("/api/documents/{doc_id}")
    def document(doc_id: int):
        d = doc_or_404(doc_id)
        source_error = None
        try:                                                # the page count only exists once the file has been read
            d = catalog.ensure(doc_id) or d
        except Exception as e:
            source_error = f"อ่านไฟล์เอกสารจาก Paperless ไม่สำเร็จ: {type(e).__name__}: {e}"[:300]
        return {**service.status(doc_id), "source_error": source_error}

    @app.post("/api/documents/{doc_id}/process", status_code=202)
    def process(doc_id: int):
        doc_or_404(doc_id)
        try:
            return service.start(doc_id)
        except Busy as e:
            raise HTTPException(409, str(e)) from None

    @app.get("/api/documents/{doc_id}/result")
    def result(doc_id: int):
        doc_or_404(doc_id)
        try:
            return JSONResponse(service.view(doc_id), headers=NO_STORE)
        except NotReady as e:
            raise HTTPException(409, str(e)) from None

    @app.get("/api/documents/{doc_id}/payload")
    def payload(doc_id: int):
        doc_or_404(doc_id)
        try:
            return JSONResponse(service.part(doc_id, "payload"), headers=NO_STORE)
        except NotReady as e:
            raise HTTPException(409, str(e)) from None

    @app.get("/api/documents/{doc_id}/extraction")
    def extraction(doc_id: int):
        """The ``extraction`` block *inside* the result - System A echoes what it read, boxes and all."""
        doc_or_404(doc_id)
        try:
            data = service.part(doc_id, "payload").get("extraction")
        except NotReady as e:
            raise HTTPException(409, str(e)) from None
        if data is None:
            raise HTTPException(409, "this payload carries no extraction block")
        return JSONResponse(data, headers=NO_STORE)

    @app.delete("/api/documents/{doc_id}/result")
    def delete(doc_id: int):
        doc_or_404(doc_id)
        try:
            return service.delete(doc_id)
        except Busy as e:
            raise HTTPException(409, str(e)) from None

    @app.get("/api/documents/{doc_id}/pdf")
    def pdf(doc_id: int):
        doc_or_404(doc_id)
        try:
            raw = catalog.sa.pdf_bytes(doc_id)
        except Exception as e:
            raise HTTPException(502, f"อ่านไฟล์ของเอกสาร #{doc_id} ไม่ได้: {e}") from None
        return Response(raw, media_type="application/pdf",
                        headers={**LONG_CACHE, "Content-Disposition": f'inline; filename="DMS-{doc_id}.pdf"'})

    @app.get("/api/documents/{doc_id}/pages/{page}/image")
    def image(doc_id: int, page: int):
        doc_or_404(doc_id)
        try:
            png, _size = catalog.sa.page_image(doc_id, page, settings.render_dpi)
        except Exception as e:
            raise HTTPException(502, f"อ่านหน้า {page} ของเอกสาร #{doc_id} ไม่ได้: {e}") from None
        return Response(png, media_type="image/png", headers=LONG_CACHE)

    @app.get("/api/search")
    def search(q: str = Query("", max_length=200)):
        return {"q": q, "ids": service.search(q)}

    # ------------------------------------------------------------------ rounds
    @app.get("/api/rounds")
    def rounds():
        return round_command(service.rounds)

    @app.post("/api/rounds/create")
    def round_create(body: RoundName):
        """Open a round folder.  Opening one does not look at it - that is ``select``."""
        return round_command(service.create_round, body.name)

    @app.post("/api/rounds/select")
    def round_select(body: RoundName):
        """Look at another round: the portal reads and writes that folder from now on, and nothing is deleted."""
        return round_command(service.switch_round, body.name)

    @app.get("/api/rounds/summary")
    def round_summary():
        try:
            return JSONResponse(service.summary(), headers=NO_STORE)
        except (NotReady, NotRoundStore) as e:
            raise HTTPException(409, str(e)) from None

    @app.post("/api/rounds/summary/rebuild")
    def round_summary_rebuild():
        """Fold ``summary.json`` of the open round again from the result files it holds."""
        summary = round_command(service.rebuild_summary)
        if summary is None:
            raise HTTPException(500, "cannot write summary.json of this round - the portal log says why")
        return JSONResponse(summary, headers=NO_STORE)

    @app.get("/api/rounds/compare")
    def round_compare(base: str = Query("", max_length=120), target: str = Query("", max_length=120)):
        if not base.strip() or not target.strip():
            raise HTTPException(400, "pick both rounds to compare")
        return JSONResponse(round_command(service.compare_rounds, base.strip(), target.strip()), headers=NO_STORE)

    # ------------------------------------------------------------------ batches
    @app.post("/api/batch/start", status_code=202)
    def batch_start(body: BatchRun):
        return round_command(service.start_batch, list(body.doc_ids), body.skip_existing, int(body.concurrency))

    @app.post("/api/batch/stop")
    def batch_stop():
        return service.stop_batch()

    @app.get("/api/batch/status")
    def batch_status():
        return service.batch_status()

    return app
