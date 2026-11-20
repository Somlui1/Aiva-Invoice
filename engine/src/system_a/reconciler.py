"""AIVA System A — v5.17 Reconciler: Paperless "AIVA processed" ⇄ Portal database.

Problem it fixes
----------------
"Done" lives in two places: the PROCESSED tag in Paperless and the Document row in the Portal
database. Nothing compared them, so when they drifted apart the document stayed out of the queue
for good — the manual fix was to delete the tag so the worker would process it again.

Typical ways they drift: the Portal database was reset / recreated after the tag was set
(``docker compose down -v``, ``db:reset``, ``db:clear-docs``), the Engine delivered to another
Portal instance, or (before v5.17) a 200 whose delivery receipt could not be checked was accepted.

What it does
------------
Every ``RECONCILE_INTERVAL_SECONDS`` it takes the most recent PROCESSED invoices (lookback window),
asks the Portal ``POST /api/engine/presence`` which of them it really stores, and — only for the ones
the Portal answers ``found: false`` (or stores but cannot read and would accept again) — removes the
PROCESSED tag with an ``AIVA_RECONCILE`` note. The existing worker then processes them exactly as if
someone had removed the tag by hand. It never touches a document that is IN_PROCESS, never guesses on
an error, and stops (circuit breaker) when "missing" looks like a wrong / empty database instead of a
few lost documents.

Modes (``RECONCILE_MODE``): ``off`` · ``report`` (log + /reconcile only) · ``fix`` (default).
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

log = logging.getLogger("system_a.reconciler")

NOTE_PREFIX = "AIVA_RECONCILE"
MODES = ("off", "report", "fix")


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


def _ts(value: Any) -> Optional[float]:
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
    except Exception:
        return None


def reconcile_config_from_env(base: Dict[str, Any]) -> Dict[str, Any]:
    mode = os.getenv("RECONCILE_MODE", "fix").strip().lower()
    return {
        **base,
        "mode": mode if mode in MODES else "fix",
        "interval_s": max(30.0, _env_float("RECONCILE_INTERVAL_SECONDS", 600)),
        "start_delay_s": max(0.0, _env_float("RECONCILE_START_DELAY_SECONDS", 90)),
        "lookback_days": max(1.0, _env_float("RECONCILE_LOOKBACK_DAYS", 14)),
        "scan_limit": int(max(10, min(500, _env_float("RECONCILE_SCAN_LIMIT", 200)))),
        "grace_s": max(60.0, _env_float("RECONCILE_GRACE_SECONDS", 300)),
        "max_requeue": int(max(1, _env_float("RECONCILE_MAX_REQUEUE", 10))),
        "max_missing_ratio": min(1.0, max(0.01, _env_float("RECONCILE_MAX_MISSING_RATIO", 0.2))),
        "max_per_doc": int(max(1, _env_float("RECONCILE_MAX_PER_DOC", 3))),
        "expect_instance": os.getenv("FRONTEND_EXPECT_INSTANCE", "").strip(),
    }


class Reconciler:
    def __init__(self, paperless: Any, frontend: Any, config: Dict[str, Any],
                 clock: Callable[[], float] = time.time):
        self.paperless = paperless
        self.frontend = frontend
        self.cfg = config
        self.clock = clock
        self.last_report: Optional[Dict[str, Any]] = None
        self.history: deque = deque(maxlen=20)
        self.last_instance: Optional[str] = None
        self.requeued_total = 0
        self.runs = 0
        self._lock = asyncio.Lock()

    # ── one pass ──────────────────────────────────────────────────────────────
    def run_once(self, mode: Optional[str] = None, force: bool = False) -> Dict[str, Any]:
        mode = (mode or self.cfg["mode"]).lower()
        t0 = self.clock()
        rep: Dict[str, Any] = {
            "at": datetime.now(timezone.utc).isoformat(), "mode": mode, "force": force,
            "scanned": 0, "present": 0, "missing": [], "unreadable": [], "unreadable_closed": [],
            "requeued": [], "gave_up": [], "skipped": [], "breaker": None, "aborted": None,
            "portal_instance": None,
        }
        self.runs += 1
        if mode not in MODES:
            rep["aborted"] = f"unknown mode {mode!r}"
            return self._done(rep, t0)
        if mode == "off":
            rep["aborted"] = "RECONCILE_MODE=off"
            return self._done(rep, t0)

        tag_inv, tag_proc, tag_in = self.cfg["tag_invoice"], self.cfg["tag_processed"], self.cfg["tag_in_process"]
        now = self.clock()
        oldest = now - self.cfg["lookback_days"] * 86400
        newest = now - self.cfg["grace_s"]  # leave fresh deliveries alone (commit / tag race)
        try:
            docs = self.paperless.query_processed(tag_inv, tag_proc, self.cfg["scan_limit"])
        except Exception as exc:
            rep["aborted"] = f"Paperless query failed: {type(exc).__name__}: {exc}"
            return self._done(rep, t0)

        ids: Dict[str, int] = {}
        for d in docs:
            tags = [int(t) for t in (d.get("tags") or [])]
            if tag_in in tags or tag_proc not in tags:
                continue
            mod = _ts(d.get("modified") or d.get("created"))
            if mod is None or mod < oldest or mod > newest:
                continue
            ids[f"DMS-{int(d['id'])}"] = int(d["id"])
        rep["scanned"] = len(ids)
        if not ids:
            return self._done(rep, t0)

        body, why = self.frontend.presence(list(ids))
        if body is None:
            rep["aborted"] = f"Portal presence unavailable — nothing changed ({why})"
            return self._done(rep, t0)
        inst = body.get("portal_instance")
        rep["portal_instance"] = inst
        expect = self.cfg.get("expect_instance") or ""
        if expect and inst != expect:
            rep["aborted"] = f"Portal instance {inst} ≠ FRONTEND_EXPECT_INSTANCE {expect} — nothing changed"
            return self._done(rep, t0)
        instance_changed = bool(self.last_instance and inst and inst != self.last_instance)
        if inst:
            self.last_instance = inst

        docs_state: Dict[str, Any] = body.get("documents") or {}
        for key in ids:
            st = docs_state.get(key)
            if not isinstance(st, dict):
                rep["skipped"].append(key)  # the Portal did not answer for it: never guess
            elif st.get("found") is False:
                rep["missing"].append(key)
            elif st.get("readable") is False:
                (rep["unreadable"] if st.get("revalidatable") else rep["unreadable_closed"]).append(key)
            else:
                rep["present"] += 1
        candidates = rep["missing"] + rep["unreadable"]

        if not candidates:
            return self._done(rep, t0)

        if not force:
            ratio = len(candidates) / max(1, rep["scanned"])
            if len(candidates) > self.cfg["max_requeue"]:
                rep["breaker"] = (f"{len(candidates)} documents missing > RECONCILE_MAX_REQUEUE {self.cfg['max_requeue']} — "
                                  "looks like a wrong / reset Portal database; check, then run POST /reconcile/run?mode=fix&force=true")
            elif rep["scanned"] >= 10 and ratio > self.cfg["max_missing_ratio"]:
                rep["breaker"] = (f"{ratio:.0%} of recent documents missing > {self.cfg['max_missing_ratio']:.0%} — "
                                  "looks like a wrong / reset Portal database; check, then force a run")
            elif instance_changed:
                rep["breaker"] = f"Portal instance changed to {inst} since the last run — report only this time"
        if mode != "fix" or rep["breaker"]:
            return self._done(rep, t0)

        for key in candidates:
            doc_id = ids[key]
            try:
                notes = self.paperless.get_notes(doc_id)
                done_before = sum(1 for n in notes
                                  if isinstance(n.get("note"), str) and n["note"].startswith(NOTE_PREFIX))
                if done_before >= self.cfg["max_per_doc"]:
                    rep["gave_up"].append(key)
                    continue
                why_txt = "not in Portal" if key in rep["missing"] else "unreadable in Portal"
                note = (f"{NOTE_PREFIX}: {why_txt} {inst or '?'} (presence found="
                        f"{'false' if key in rep['missing'] else 'true, readable=false'}) → PROCESSED removed, "
                        f"will be processed again · attempt {done_before + 1}/{self.cfg['max_per_doc']}")
                if self.paperless.requeue(doc_id, self.cfg["tag_processed"], self.cfg["tag_in_process"], note):
                    rep["requeued"].append(key)
                else:
                    rep["skipped"].append(key)
            except Exception as exc:
                log.warning("[Reconcile] %s requeue failed: %s", key, exc)
                rep["skipped"].append(key)
        self.requeued_total += len(rep["requeued"])
        return self._done(rep, t0)

    def _done(self, rep: Dict[str, Any], t0: float) -> Dict[str, Any]:
        rep["elapsed_ms"] = int((self.clock() - t0) * 1000)
        self.last_report = rep
        self.history.append({k: rep[k] for k in ("at", "mode", "scanned", "present", "breaker", "aborted")} |
                            {"missing": len(rep["missing"]), "requeued": len(rep["requeued"])})
        lvl = logging.WARNING if (rep["missing"] or rep["unreadable"] or rep["breaker"]) else logging.INFO
        if rep["aborted"] and rep["mode"] != "off":
            lvl = logging.WARNING
        log.log(lvl, "[Reconcile] %s scanned=%d present=%d missing=%d unreadable=%d requeued=%d%s%s",
                rep["mode"], rep["scanned"], rep["present"], len(rep["missing"]),
                len(rep["unreadable"]) + len(rep["unreadable_closed"]), len(rep["requeued"]),
                f" · BREAKER: {rep['breaker']}" if rep["breaker"] else "",
                f" · aborted: {rep['aborted']}" if rep["aborted"] else "")
        if rep["missing"]:
            log.warning("[Reconcile] missing in Portal: %s", ", ".join(rep["missing"][:20]))
        return rep

    # ── async loop / status ─────────────────────────────────────────────────
    async def run_async(self, mode: Optional[str] = None, force: bool = False) -> Dict[str, Any]:
        async with self._lock:
            return await asyncio.to_thread(self.run_once, mode, force)

    async def loop(self, stop_event: asyncio.Event) -> None:
        if self.cfg["mode"] == "off":
            log.info("[Reconcile] RECONCILE_MODE=off — reconciler not started")
            return
        log.info("[Reconcile] on — mode=%s every %.0fs, lookback %.0fd, max %d per run",
                 self.cfg["mode"], self.cfg["interval_s"], self.cfg["lookback_days"], self.cfg["max_requeue"])
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=self.cfg["start_delay_s"])
            return
        except asyncio.TimeoutError:
            pass
        while not stop_event.is_set():
            try:
                await self.run_async()
            except Exception as exc:  # never kill the engine
                log.exception("[Reconcile] run crashed: %s", exc)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=self.cfg["interval_s"])
            except asyncio.TimeoutError:
                pass

    def status(self) -> Dict[str, Any]:
        cfg = {k: v for k, v in self.cfg.items() if k not in ("tag_invoice", "tag_processed", "tag_in_process")}
        return {"config": cfg, "runs": self.runs, "requeued_total": self.requeued_total,
                "portal_instance": self.last_instance, "last": self.last_report, "history": list(self.history)}
