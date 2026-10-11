"""One small state machine per document, and the batch that drives many of them at once.

    idle --start--> processing --ok--> done
                        |
                        +--failure--> error          (start again from any state except processing)

* a document is processed by one job at a time (``Busy`` -> HTTP 409); different documents run side by side;
* each ``start`` increases ``run`` and clears the document's previous result first, and a job may only write its
  outcome if its ``run`` is still the current one - so a result can never be mixed with another run's or document's;
* the outcome lives in the *active round* of the store: ``DMS-<id>_result.json`` is System A's payload exactly as
  it came back, ``summary.json`` is rewritten from what the round holds after a run, and the browser view is only
  a cache of it, rebuilt from the result when somebody opens the document;
* a batch is this same state machine driven over a list of documents on a thread pool of its own, with a stop flag
  the queued documents check before they start; a document already inside System A is allowed to finish, because
  the answer it is computing is the answer;
* when System A raises, the document goes to ``error`` with the exception's own type, message and traceback.  A
  failed run keeps no partial result: the portal would otherwise be showing something System A never produced.
"""
from __future__ import annotations

import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, wait
from typing import Optional

from .store import SUMMARY_COUNTS, ResultStore
from .view import build_view

log = logging.getLogger("webapp.service")

#: one worker is a serial run; a few dozen is already more than a local OCR + VLM pipeline can take at once
MAX_CONCURRENCY = 32

#: the verdict hierarchy: which answer needed the least human work.  Comparing two rounds means comparing these.
VERDICT_RANKS = {"AUTO_PASS": 5, "REVIEW": 4, "MANUAL_REVIEW": 3, "HOLD": 2, "SYSTEM_ERROR": 1, "FAILED": 1}


def verdict_rank(value) -> int:
    """The standing of a verdict; a value the engine never produced (or no verdict at all) ranks last."""
    return VERDICT_RANKS.get(str(value or "").strip().upper(), 0)


def compare_verdicts(base, target) -> str:
    """``improved`` / ``regressed`` / ``unchanged`` for one document between two rounds."""
    a, b = verdict_rank(base), verdict_rank(target)
    if b > a:
        return "improved"
    if b < a:
        return "regressed"
    return "unchanged"


def _rule_changes(base: dict, target: dict) -> list:
    """The rules that moved: ``[{"rule_id": "V-08", "base": "fail", "target": "pass"}]``, in rule order."""
    return [{"rule_id": rid, "base": base.get(rid), "target": target.get(rid)}
            for rid in sorted(set(base) | set(target)) if base.get(rid) != target.get(rid)]


class Busy(RuntimeError):
    """The document is being processed right now."""


class NotReady(RuntimeError):
    """The document has no result (not processed yet, still processing, or the last run failed)."""


class NotRoundStore(RuntimeError):
    """This service was handed a store that has no rounds (the old per-document ``ResultStore``)."""


class DocumentService:
    def __init__(self, catalog, runner, store: ResultStore, *, workers: int = 4, mode: str = "production",
                 concurrency: int = 0):
        self.catalog, self.runner, self.store = catalog, runner, store
        self.mode = mode
        self.pool = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="doc")
        self.default_concurrency = max(1, min(int(concurrency or workers), MAX_CONCURRENCY))
        self._lock = threading.RLock()
        self._st: dict = {}
        self._futures: dict = {}
        self._search_cache: dict = {}
        self._batch_stop = threading.Event()
        self._batch_pool: Optional[ThreadPoolExecutor] = None
        self._batch: dict = {"running": False, "stopped": False, "total": 0, "completed": 0, "errors": 0,
                             "skipped": 0, "cancelled": 0, "current": None, "round": None, "concurrency": 0,
                             "started_at": None, "finished_at": None}
        self._rehydrate()

    # ------------------------------------------------------------------ state helpers
    def _blank(self, doc_id: int) -> dict:
        return {"id": int(doc_id), "state": "idle", "run": 0, "step": None,
                "started_at": None, "finished_at": None, "seconds": None,
                "error": None, "traceback": None}

    def _state(self, doc_id: int) -> dict:
        self.catalog.get(doc_id)                                       # KeyError for an unknown id
        return self._st.setdefault(int(doc_id), self._blank(doc_id))

    def _rehydrate(self) -> None:
        """Rebuild every state from what the store holds - which, after a round switch, is a different round.

        A saved ``processing`` state can only mean the process died mid-run, so it comes back as an error.  A
        document that has a result is ``done`` even when no state file here says so: that ``DMS-<id>_result.json``
        may have been written by ``scripts/test_paperless_invoices.py``, and the tester who picked the round
        means to look at it.
        """
        cases = self._summary_cases(build_if_missing=True)
        out: dict = {}
        for d in self.catalog.docs:
            saved = self.store.load(d.id, "state") or {}
            s = self._blank(d.id)
            for k in ("run", "started_at", "finished_at", "seconds", "error", "traceback"):
                if saved.get(k) is not None:
                    s[k] = saved[k]
            for k in ("recommendation", "cls", "boxes"):
                if saved.get(k) is not None:
                    s[k] = saved[k]
            if isinstance(saved.get("types"), list):
                s["types"] = saved["types"]
            state = saved.get("state") or "idle"
            if state == "processing":
                s.update(state="error", step=None, error="interrupted by a restart - process it again")
                self.store.save(d.id, "state", s)
                log.warning("#%s was processing when the portal stopped: reported as an error", d.id)
            elif self._has_result(d.id):
                case = cases.get(d.id) or {}
                s.update(state="done", step=None, error=None, traceback=None,
                         run=max(int(saved.get("run") or 0), 1),
                         recommendation=saved.get("recommendation") or case.get("recommendation"),
                         seconds=saved.get("seconds") if saved.get("seconds") is not None else case.get("elapsed_s"))
            else:
                # "done" with no result behind it is not a state worth keeping
                s.update(state="error" if state == "error" else "idle",
                         error=saved.get("error") if state == "error" else None)
            out[d.id] = s
        self._st = out

    def _has_result(self, doc_id: int) -> bool:
        """Does the active round hold a result for this document - without reading the result."""
        has = getattr(self.store, "has_result", None)
        return bool(has(doc_id)) if has else self.store.load(doc_id, "payload") is not None

    def _view_of(self, doc_id: int) -> Optional[dict]:
        """The browser view: the cached one where the store keeps a cache, otherwise the result, reshaped now."""
        build = getattr(self.store, "load_or_build_view", None)
        return build(doc_id) if build else self.store.load(doc_id, "view")

    def _public(self, d) -> dict:
        s = self._state(d.id)
        return {"id": d.id, "title": d.title, "file_name": d.file_name, "mime": d.mime,
                "file_class": d.file_class, "tagged": d.tagged, "pages_total": d.pages_total,
                "pages": d.page_numbers, "created": d.created, "correspondent": d.correspondent,
                "dms_url": d.dms_url, "viewer_url": self.catalog.viewer_url(d.id),
                "state": s["state"], "run": s["run"], "step": s.get("step"), "seconds": s.get("seconds"),
                "error": s.get("error"), "traceback": s.get("traceback"),
                "recommendation": s.get("recommendation"), "cls": s.get("cls"),
                "types": s.get("types") or [], "boxes": s.get("boxes") or 0,
                "started_at": s.get("started_at"),
                "elapsed": (round(time.time() - s["started_at"], 1)
                            if s["state"] == "processing" and s.get("started_at") else None)}

    def _update(self, doc_id: int, run: int, **kw) -> bool:
        with self._lock:
            s = self._state(doc_id)
            if s["run"] != run:
                return False                                           # a newer run owns the document now
            s.update(kw)
            self.store.save(doc_id, "state", s)
            return True

    # ------------------------------------------------------------------ queries
    def list_documents(self) -> list:
        with self._lock:
            return [self._public(d) for d in self.catalog.docs]

    def status(self, doc_id: int) -> dict:
        with self._lock:
            return self._public(self.catalog.get(doc_id))

    def view(self, doc_id: int) -> dict:
        with self._lock:
            s = self._state(doc_id)
            if s["state"] != "done":
                raise NotReady(f"#{doc_id} is {s['state']}")
        v = self._view_of(doc_id)
        if v is None:
            raise NotReady(f"#{doc_id} has no stored result")
        return v

    def part(self, doc_id: int, part: str) -> dict:
        self.view(doc_id)                                              # same readiness rule
        data = self.store.load(doc_id, part)
        if data is None:
            raise NotReady(f"#{doc_id} has no stored {part}")
        return data

    def search(self, q: str) -> list:
        """Ids of processed documents whose id / title / payload text contains ``q`` (case-insensitive)."""
        q = (q or "").strip().lower()
        if not q:
            return []
        hits = []
        for d in self.catalog.docs:
            with self._lock:
                s = self._state(d.id)
                if s["state"] != "done":
                    continue
                key = (d.id, s["run"])
                text = self._search_cache.get(key)
                if text is None:
                    v = self._view_of(d.id) or {}
                    s = v.get("search") or {}                   # the words of the payload itself, nothing invented
                    text = self._search_cache[key] = "\n".join(
                        str(x) for x in (s.get("elements_text"), s.get("fields_text"), s.get("lines_text"),
                                         s.get("rules_text"), s.get("exceptions_text"),
                                         s.get("oracle_text")) if x).lower()
            if q == str(d.id) or q in d.title.lower() or q in text:
                hits.append(d.id)
        return hits

    # ------------------------------------------------------------------ commands
    def _begin_run(self, doc_id: int) -> int:
        """Take the document for a new round.  Called with the lock held; raises :class:`Busy` if one is running.

        The previous result is deleted before the new round starts, so nothing of the old one can survive into it.
        """
        s = self._state(doc_id)
        if s["state"] == "processing":
            raise Busy(f"#{doc_id} is already being processed")
        s["run"] += 1
        s.update(state="processing", step="process", started_at=time.time(), finished_at=None, seconds=None,
                 error=None, traceback=None, recommendation=None, cls=None, types=[], boxes=0)
        self.store.clear(doc_id)                                       # the previous result is gone before the new run
        self.store.save(doc_id, "state", s)
        return s["run"]

    def start(self, doc_id: int) -> dict:
        with self._lock:
            d = self.catalog.get(doc_id)
            run = self._begin_run(doc_id)
            self._futures[doc_id] = self.pool.submit(self._job, d.id, run)
            return self._public(d)

    def delete(self, doc_id: int) -> dict:
        with self._lock:
            d = self.catalog.get(doc_id)
            s = self._state(doc_id)
            if s["state"] == "processing":
                raise Busy(f"#{doc_id} is being processed")
            s.update(state="idle", step=None, error=None, traceback=None, seconds=None, recommendation=None,
                     cls=None, types=[], boxes=0, started_at=None, finished_at=None)
            self.store.clear(doc_id)
            self.store.save(doc_id, "state", s)
            return self._public(d)

    # ------------------------------------------------------------------ the job
    def _execute(self, doc_id: int, run: int, *, make_view: bool) -> dict:
        """Run System A once on one document and store what it hands back.  Never raises to the caller.

        System A is called once and what it hands back is stored as-is; the browser view is derived from that
        payload alone.  A failure leaves the document in ``error`` with the traceback System A produced - the
        portal invents no partial result.

        ``make_view`` builds the browser view now, because somebody asked to watch this document.  A batch leaves
        it to the first person who opens the document, which is what keeps a 125-document run cheap.
        """
        t0 = time.perf_counter()
        try:
            payload = self.runner.run(doc_id, run=run)                 # System A, all of it
            secs = time.perf_counter() - t0
            view = None
            if make_view:
                view = build_view(payload)                             # the view is only ever the payload, reshaped
                view["seconds"] = round(secs, 1)
                view["engine"] = self.runner.name
                view["mode"] = self.mode
            self._update(doc_id, run, step="view")
            with self._lock:
                if self._state(doc_id)["run"] != run:
                    # a newer round owns the document now, so this answer is thrown away
                    return {"ok": True, "stale": True, "rec": None}
                self.store.save(doc_id, "payload", payload)             # the real result/3.0, exactly as returned
                if view is not None:
                    self.store.save(doc_id, "view", view)               # only a cache of the payload above
            rec = ((view or {}).get("recommendation") or (payload or {}).get("recommendation") or {}).get("value")
            self._update(doc_id, run, state="done", step=None, seconds=round(secs, 1), finished_at=time.time(),
                         error=None, traceback=None, recommendation=rec,
                         cls=(view or {}).get("cls"), types=(view or {}).get("types") or [],
                         boxes=(view or {}).get("counts", {}).get("boxes", 0))
            return {"ok": True, "stale": False, "rec": rec}
        except Exception as e:                       # the document shows exactly what System A raised
            tb = getattr(e, "traceback", None) or ""
            log.exception("processing #%s (run %s) failed", doc_id, run)
            self._update(doc_id, run, state="error", step=None, seconds=round(time.perf_counter() - t0, 1),
                         finished_at=time.time(), error=f"{type(e).__name__}: {e}"[:900],
                         traceback=(tb or _tb_tail())[-6000:])
            return {"ok": False, "stale": False, "rec": None}

    def _job(self, doc_id: int, run: int) -> None:
        """One document on its own: produce its result, then rewrite the round's summary from what it now holds."""
        if self._execute(doc_id, run, make_view=True)["ok"]:
            self._refresh_summary()

    # ------------------------------------------------------------------ a batch of documents
    def start_batch(self, doc_ids: list, skip_existing: bool = True, concurrency: int = 0) -> dict:
        """Run System A over these documents, ``concurrency`` of them at a time, into the active round.

        One batch at a time (``Busy`` -> HTTP 409).  An id the catalog does not know is counted as ``unknown``
        instead of failing the run: a tester who picked a document that has fallen out of the tag should still
        get the other 124.
        """
        with self._lock:
            if self._batch["running"]:
                raise Busy("a batch is already running - stop it before starting another")
            wanted, unknown = [], 0
            for raw in doc_ids or []:
                try:
                    wanted.append(int(self.catalog.get(int(raw)).id))
                except (KeyError, TypeError, ValueError):
                    unknown += 1
            ids = list(dict.fromkeys(wanted))                          # the order the tester picked, each once
            done = [i for i in ids if skip_existing and self._has_result(i)]
            todo = [i for i in ids if i not in set(done)]
            if not todo:
                self._batch.update(running=False, stopped=False, total=0, completed=0, errors=0, skipped=len(done),
                                   cancelled=0, current=None, round=self._round_name(), concurrency=0,
                                   started_at=None, finished_at=time.time())
                return {"status": "nothing-to-run", "total": 0, "skipped": len(done), "unknown": unknown,
                        "round": self._round_name()}

            n = max(1, min(int(concurrency or self.default_concurrency), len(todo), MAX_CONCURRENCY))
            self._batch_stop.clear()
            self._batch.update(running=True, stopped=False, total=len(todo), completed=0, errors=0,
                               skipped=len(done), cancelled=0, current=None, round=self._round_name(),
                               concurrency=n, started_at=time.time(), finished_at=None)
            self._batch_pool = ThreadPoolExecutor(max_workers=n, thread_name_prefix="batch")
            futures = [self._batch_pool.submit(self._batch_job, i) for i in todo]
            threading.Thread(target=self._watch_batch, args=(futures,), daemon=True, name="batch-watch").start()
            log.info("batch: %s documents into round %r at %sx (%s already had a result, %s unknown)",
                     len(todo), self._round_name(), n, len(done), unknown)
            return {"status": "started", "total": len(todo), "skipped": len(done), "unknown": unknown,
                    "concurrency": n, "round": self._round_name()}

    def _batch_job(self, doc_id: int) -> None:
        """One document of a batch.  The counters are the only thing allowed to go wrong here."""
        if self._batch_stop.is_set():
            with self._lock:
                self._batch["cancelled"] += 1
            return
        with self._lock:
            try:
                run = self._begin_run(doc_id)
            except Busy:                                               # a single-document run has taken it
                self._batch["skipped"] += 1
                return
            self._batch["current"] = doc_id
        out = self._execute(doc_id, run, make_view=False)
        with self._lock:
            if not out["ok"]:
                self._batch["errors"] += 1
            elif out["stale"]:
                self._batch["skipped"] += 1
            else:
                self._batch["completed"] += 1
            self._batch["current"] = None

    def _watch_batch(self, futures: list) -> None:
        """Wait for the batch to drain, then close it and rewrite the summary once, not once per document."""
        try:
            wait(futures)
        except Exception:                                              # pragma: no cover - _batch_job cannot raise
            log.exception("the batch watcher failed")
        finally:
            self._finish_batch()

    def _finish_batch(self) -> None:
        with self._lock:
            pool, self._batch_pool = self._batch_pool, None
            self._batch.update(running=False, current=None, finished_at=time.time())
            done, errors, round_name = self._batch["completed"], self._batch["errors"], self._round_name()
        self._refresh_summary()                                        # outside the lock: it reads the whole round
        if pool is not None:
            pool.shutdown(wait=False)                                  # not one of its threads, so this cannot block
        log.info("batch: round %r holds %s done, %s failed", round_name, done, errors)

    def stop_batch(self) -> dict:
        """Let go of the batch: what is still queued is dropped, what is inside System A is allowed to finish."""
        with self._lock:
            if self._batch["running"]:
                self._batch_stop.set()
                self._batch["stopped"] = True
                log.info("batch: stop requested at %s/%s", self._batch["completed"] + self._batch["errors"],
                         self._batch["total"])
            return self.batch_status()

    def batch_status(self) -> dict:
        with self._lock:
            b = dict(self._batch)
        b["round"] = b["round"] or self._round_name()
        b["processed"] = b["completed"] + b["errors"] + b["cancelled"]
        b["percent"] = round(100.0 * b["processed"] / b["total"], 1) if b["total"] else 0.0
        b["elapsed"] = round((b["finished_at"] or time.time()) - b["started_at"], 1) if b["started_at"] else None
        return b

    # ------------------------------------------------------------------ rounds
    def _rounds(self):
        """The store, or one clear complaint: an old ``ResultStore`` has no rounds to switch between."""
        missing = [m for m in ("list_rounds", "create_round", "set_active_round", "has_round", "has_result")
                   if not hasattr(self.store, m)]
        if missing:
            raise NotRoundStore("this portal stores results one folder per document, so it has no rounds: "
                                "point WEBAPP_RESULTS_DIR at the engine results directory")
        return self.store

    def _round_name(self) -> Optional[str]:
        return getattr(self.store, "active_round", None)

    def rounds(self) -> dict:
        """The rounds the tester can pick from, and which one is being looked at."""
        store = self._rounds()
        with self._lock:
            return {"active": store.active_round, "rounds": store.list_rounds(),
                    "batch_running": self._batch["running"]}

    def create_round(self, round_name: str) -> dict:
        """Open a round folder and report it.  Opening one does not look at it - that is ``switch_round``."""
        store = self._rounds()
        with self._lock:
            if self._batch["running"]:
                raise Busy("a batch is running - stop it before opening a new round")
            existed = store.has_round(round_name)
            d = store.create_round(round_name)
            log.info("round %r opened inside %s", d.name, getattr(store, "results_root", ""))
            return {"round": d.name, "active": store.active_round, "created": not existed,
                    "rounds": store.list_rounds()}

    def switch_round(self, round_name: str) -> dict:
        """Look at another round.  Nothing is deleted: the other round's files simply become the ones we read."""
        store = self._rounds()
        with self._lock:
            if self._batch["running"]:
                raise Busy("a batch is running - stop it before switching round")
            busy = sorted(i for i, s in self._st.items() if s["state"] == "processing")
            if busy:
                raise Busy("documents are being processed: " + ", ".join(str(i) for i in busy[:8]))
            created = not store.has_round(round_name)
            store.set_active_round(round_name)
            self._search_cache.clear()
            self._rehydrate()
            done = sum(1 for s in self._st.values() if s["state"] == "done")
            log.info("looking at round %r: %s documents, %s with a result", round_name, len(self._st), done)
            return {"active": store.active_round, "documents": len(self._st), "done": done, "created": created}

    def _round_facts(self, round_name: str) -> dict:
        """``doc_id -> what that round decided``, read from the round's own ``summary.json``.

        The summary is the cheap way in: answering a comparison by reading 125 ``DMS-*_result.json`` files would
        parse hundreds of megabytes to draw a table of verdicts.  A round that never wrote one - a round made by
        the batch script, or by an older portal - gets it built now, which is the same fold a run does at its end.
        """
        store = self._rounds()
        try:
            summary = store.load_summary(round_name)
        except Exception:                                              # pragma: no cover - damaged summary.json
            log.exception("cannot read summary.json of round %r", round_name)
            summary = None
        if summary is None and store.has_results(round_name):
            summary = store.build_and_save_summary(self.mode, round_name=round_name,
                                                   titles={d.id: d.title for d in self.catalog.docs})
        facts: dict = {}
        for c in (summary or {}).get("cases", []):
            doc_id = c.get("doc_id")
            if not isinstance(doc_id, int):
                continue
            facts[doc_id] = {"recommendation": c.get("recommendation"), "title": c.get("title"),
                             "max_severity": c.get("max_severity"), "invoice_num": c.get("invoice_num"),
                             "grand_total": c.get("grand_total"), "currency": c.get("currency"),
                             "elapsed_s": c.get("elapsed_s"),
                             "rules": {r.get("rule_id"): r.get("result")
                                       for r in (c.get("rule_results") or [])
                                       if isinstance(r, dict) and r.get("rule_id")}}
        return facts

    def compare_rounds(self, base_round: str, target_round: str) -> dict:
        """What moved between two rounds, document by document and in total.

        A document only in the target is ``added`` and one only in the base is ``removed``: both are reported
        rather than quietly dropped, because a document that vanished from a run is exactly what a tester is
        looking for.
        """
        base, target = self._round_facts(base_round), self._round_facts(target_round)
        tally = {v: {"base": 0, "target": 0} for v in SUMMARY_COUNTS}
        deltas = {"improved": 0, "regressed": 0, "unchanged": 0, "added": 0, "removed": 0}
        cases: list = []
        for doc_id in sorted(set(base) | set(target)):
            a, b = base.get(doc_id), target.get(doc_id)
            if a is None or b is None:
                delta = "added" if a is None else "removed"
            else:
                delta = compare_verdicts(a["recommendation"], b["recommendation"])
            deltas[delta] += 1
            for side, fact in (("base", a), ("target", b)):
                rec = (fact or {}).get("recommendation")
                if rec in tally:
                    tally[rec][side] += 1
            cases.append({"doc_id": doc_id, "delta": delta, "title": (b or a).get("title"),
                          "base_recommendation": (a or {}).get("recommendation"),
                          "target_recommendation": (b or {}).get("recommendation"),
                          "base_severity": (a or {}).get("max_severity"),
                          "target_severity": (b or {}).get("max_severity"),
                          "invoice_num": (b or a).get("invoice_num"),
                          "base_seconds": (a or {}).get("elapsed_s"),
                          "target_seconds": (b or {}).get("elapsed_s"),
                          "rule_changes": _rule_changes((a or {}).get("rules") or {},
                                                        (b or {}).get("rules") or {})})
        aggregate = {v: {"base": n["base"], "target": n["target"], "diff": n["target"] - n["base"]}
                     for v, n in tally.items()}
        aggregate.update((f"{k}_count", n) for k, n in deltas.items())
        aggregate.update(documents=len(cases), base_round=base_round, target_round=target_round)
        log.info("compare %r -> %r: %s improved, %s regressed, %s unchanged, %s added, %s removed",
                 base_round, target_round, deltas["improved"], deltas["regressed"], deltas["unchanged"],
                 deltas["added"], deltas["removed"])
        return {"base": base_round, "target": target_round, "aggregate": aggregate, "cases": cases}

    def _summary_cases(self, build_if_missing: bool = False) -> dict:
        """``doc_id -> its summary case`` for the active round, or ``{}`` when it has no summary to offer."""
        load = getattr(self.store, "load_summary", None)
        if load is None:
            return {}
        try:
            summary = load()
        except Exception:                                              # pragma: no cover - damaged summary.json
            log.exception("cannot read summary.json of round %r", self._round_name())
            return {}
        if summary is None and build_if_missing and any(self._has_result(d.id) for d in self.catalog.docs):
            summary = self._refresh_summary()
        return {c["doc_id"]: c for c in (summary or {}).get("cases", []) if isinstance(c.get("doc_id"), int)}

    def _refresh_summary(self) -> Optional[dict]:
        """Rewrite ``summary.json`` of the active round from what it now holds.

        Best effort on purpose: a document's own result must not be lost because the summary could not be written.
        """
        build = getattr(self.store, "build_and_save_summary", None)
        if build is None:
            return None
        try:
            return build(self.mode, titles={d.id: d.title for d in self.catalog.docs})
        except Exception:                                              # pragma: no cover - damaged results folder
            log.exception("cannot rewrite summary.json of round %r", self._round_name())
            return None

    def rebuild_summary(self) -> Optional[dict]:
        """Fold ``summary.json`` of the active round again, now - whatever the browser last saw."""
        self._rounds()
        return self._refresh_summary()

    def summary(self) -> dict:
        """The round's summary, regenerated when the round has results and no summary file yet."""
        self._rounds()
        s = self.store.load_summary()
        if s is None:
            s = self._refresh_summary()
        if s is None:
            raise NotReady(f"round {self._round_name()!r} has no results to summarise yet")
        return s

    # ------------------------------------------------------------------ test / shutdown helpers
    def wait(self, doc_id: int, timeout: float = 30.0) -> dict:
        f = self._futures.get(doc_id)
        if f is not None:
            f.result(timeout=timeout)
        return self.status(doc_id)

    def shutdown(self) -> None:
        """Stop the batch and let both pools go; a document already inside System A finishes on its own."""
        self._batch_stop.set()
        pool, self._batch_pool = self._batch_pool, None
        if pool is not None:
            pool.shutdown(wait=False, cancel_futures=True)
        self.pool.shutdown(wait=False, cancel_futures=False)


def _tb_tail() -> str:
    import traceback
    return traceback.format_exc()
