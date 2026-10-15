"""Per-document persistence.

:class:`RoundStore` - what the portal uses now - works directly on the batch rounds the engine already writes:
``<results_root>/<round>/DMS-<id>_result.json`` plus ``<round>/summary.json``, exactly the layout
``scripts/test_paperless_invoices.py`` produces.  A round the script produced is therefore readable here with no
re-run, and a round made here is readable by that script with no conversion.

:class:`ResultStore` is the older per-document layout (``<data_dir>/results/doc_<id>/{state,view,payload}.json``)
and :class:`MemoryStore` the same contract without disk; both stay so the doubles and the settings that still
select them keep working.

Every file is written atomically (temp file + replace), and a document only ever touches its own files, so two
documents can never share or overwrite each other's result.
"""
from __future__ import annotations

import json
import logging
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, Optional

from .view import build_view

log = logging.getLogger("webapp.store")

PARTS = ("state", "view", "payload")   # the extraction lives inside the payload (extraction block)

#: the names the batch script uses, so both tools read the same folder
RESULT_PREFIX, RESULT_SUFFIX = "DMS-", "_result.json"
SUMMARY_NAME, CACHE_DIR = "summary.json", ".cache"
SUMMARY_TITLE = "AIVA System A Batch Invoice Test Summary"
SUMMARY_COUNTS = ("AUTO_PASS", "REVIEW", "HOLD", "MANUAL_REVIEW", "SYSTEM_ERROR", "SKIPPED", "FAILED")
RULE_RESULTS = ("pass", "fail", "manual_review", "not_evaluated")
#: one folder name: no separator, no ``..``, no absolute path - a round name never escapes ``results_root``
ROUND_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")


def safe_round(name: str) -> str:
    name = str(name or "").strip()
    if not ROUND_NAME.match(name):
        raise ValueError(f"not a usable round name: {name!r} (letters, digits, dot, dash, underscore; 1-80 chars)")
    return name


def _write_json(f: Path, data, indent: Optional[int] = None) -> None:
    """Write the whole file, then move it into place: a reader never sees a half-written result."""
    import threading, time
    f.parent.mkdir(parents=True, exist_ok=True)
    tmp = f.with_name(f"{f.name}.{os.getpid()}_{threading.get_ident()}_{time.time_ns()}.tmp")
    text = (json.dumps(data, ensure_ascii=False, indent=indent) if indent
            else json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    tmp.write_text(text, encoding="utf-8")
    for attempt in range(10):
        try:
            os.replace(tmp, f)
            break
        except OSError:
            time.sleep(0.02)
    else:
        try:
            os.replace(tmp, f)
        finally:
            if tmp.exists():
                try:
                    tmp.unlink(missing_ok=True)
                except OSError:
                    pass


def _read_json(f: Path) -> Optional[dict]:
    if not f.is_file():
        return None
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None                                       # a damaged file is treated as absent, never half-read


class ResultStore:
    def __init__(self, root: Path):
        self.root = Path(root) / "results"
        self.root.mkdir(parents=True, exist_ok=True)

    def folder(self, doc_id: int) -> Path:
        return self.root / f"doc_{int(doc_id)}"

    def _file(self, doc_id: int, part: str) -> Path:
        if part not in PARTS:
            raise ValueError(part)
        return self.folder(doc_id) / f"{part}.json"

    def save(self, doc_id: int, part: str, data) -> None:
        _write_json(self._file(doc_id, part), data)

    def load(self, doc_id: int, part: str) -> Optional[dict]:
        return _read_json(self._file(doc_id, part))

    def clear(self, doc_id: int, keep_state: bool = True) -> None:
        for part in PARTS:
            if keep_state and part == "state":
                continue
            self._file(doc_id, part).unlink(missing_ok=True)

    def remove(self, doc_id: int) -> None:
        shutil.rmtree(self.folder(doc_id), ignore_errors=True)

    def ids(self) -> list:
        return sorted(int(p.name[4:]) for p in self.root.glob("doc_*") if p.name[4:].isdigit())


class RoundStore:
    """The engine's own round folders: ``<results_root>/<round>/DMS-<id>_result.json`` + ``summary.json``.

    One round is *active* at a time (``set_active_round``); everything the portal reads or writes for a document
    happens inside that folder, so picking an old round shows the results that round really holds.

    Where the three parts of a document live:

    ``payload``  ``<round>/DMS-<id>_result.json`` - System A's ``result/3.0`` as it came back, the same bytes the
                 batch script writes, so the two tools are interchangeable.
    ``view``     ``<round>/.cache/DMS-<id>_view.json`` - the screen model, only an accelerator.  Rebuilt when the
                 result is newer than the cache, and dropped whenever the result is rewritten.
    ``state``    ``<round>/.cache/DMS-<id>_state.json`` - the portal's own bookkeeping (running/done/error), so it
                 belongs to the round it was produced in and does not follow the document to the next one.

    ``save``/``load``/``clear``/``remove``/``ids``/``folder`` keep the :class:`ResultStore` contract, so the
    service drives either one.
    """

    def __init__(self, results_root: Path, default_round: str = "default"):
        self.results_root = Path(results_root)
        self.results_root.mkdir(parents=True, exist_ok=True)
        self.root = self.results_root                     # ResultStore contract: build.py reports this path
        self.default_round = safe_round(default_round)
        self._round = self.default_round

    # ------------------------------------------------------------------ rounds
    @property
    def active_round(self) -> str:
        return self._round

    @property
    def round_dir(self) -> Path:
        return self.dir_of(self._round)

    def dir_of(self, name: str) -> Path:
        return self.results_root / safe_round(name)

    def list_rounds(self) -> list:
        """The round folders, sorted by name - so ``v4`` and ``v5`` of the same run sit next to each other."""
        try:
            return sorted(p.name for p in self.results_root.iterdir()
                          if p.is_dir() and not p.name.startswith((".", "_")))
        except OSError:
            return []

    def create_round(self, name: str) -> Path:
        d = self.dir_of(name)
        (d / CACHE_DIR).mkdir(parents=True, exist_ok=True)
        return d

    def set_active_round(self, name: str) -> str:
        d = self.create_round(name)
        self._round = d.name
        return self._round

    def has_round(self, name: str) -> bool:
        try:
            return self.dir_of(name).is_dir()
        except ValueError:
            return False

    # ------------------------------------------------------------------ files
    def _result_file(self, doc_id: int, round_name: Optional[str] = None) -> Path:
        return (self.dir_of(round_name) if round_name else self.round_dir) / f"{RESULT_PREFIX}{int(doc_id)}{RESULT_SUFFIX}"

    def _cache_file(self, doc_id: int, kind: str, round_name: Optional[str] = None) -> Path:
        base = self.dir_of(round_name) if round_name else self.round_dir
        return base / CACHE_DIR / f"{RESULT_PREFIX}{int(doc_id)}_{kind}.json"

    def folder(self, doc_id: int) -> Path:
        return self.round_dir                             # one folder per round, one file per document inside it

    # ------------------------------------------------------------------ the result itself
    def save_result(self, doc_id: int, payload: dict) -> Path:
        f = self._result_file(doc_id)
        _write_json(f, payload)
        self._cache_file(doc_id, "view").unlink(missing_ok=True)     # the cached screen model is stale now
        return f

    def load_result(self, doc_id: int, round_name: Optional[str] = None) -> Optional[dict]:
        return _read_json(self._result_file(doc_id, round_name))

    def has_result(self, doc_id: int, round_name: Optional[str] = None) -> bool:
        return self._result_file(doc_id, round_name).is_file()

    def delete_result(self, doc_id: int) -> None:
        self._result_file(doc_id).unlink(missing_ok=True)
        self._cache_file(doc_id, "view").unlink(missing_ok=True)     # the screen model of a gone result is gone

    def iter_results(self, round_name: Optional[str] = None) -> Iterator:
        """``(doc_id, payload)`` for every result of a round, in document order, skipping an unreadable file."""
        d = self.dir_of(round_name) if round_name else self.round_dir
        if not d.is_dir():
            return
        for f in sorted(d.glob(f"{RESULT_PREFIX}*{RESULT_SUFFIX}")):
            stem = f.name[len(RESULT_PREFIX):-len(RESULT_SUFFIX)]
            if not stem.isdigit():
                continue
            data = _read_json(f)
            if data is not None:
                yield int(stem), data

    def ids(self) -> list:
        return sorted(doc_id for doc_id, _ in self.iter_results())

    def has_results(self, round_name: Optional[str] = None) -> bool:
        """Does this round hold at least one result - answered without reading any of them."""
        d = self.dir_of(round_name) if round_name else self.round_dir
        return next(iter(sorted(d.glob(f"{RESULT_PREFIX}*{RESULT_SUFFIX}"))), None) is not None

    # ------------------------------------------------------------------ the ResultStore contract
    def save(self, doc_id: int, part: str, data) -> None:
        if part not in PARTS:
            raise ValueError(part)
        if part == "payload":
            self.save_result(doc_id, data)
            return
        _write_json(self._cache_file(doc_id, part), data)

    def load(self, doc_id: int, part: str) -> Optional[dict]:
        if part not in PARTS:
            raise ValueError(part)
        return self.load_result(doc_id) if part == "payload" else _read_json(self._cache_file(doc_id, part))

    def clear(self, doc_id: int, keep_state: bool = True) -> None:
        self.delete_result(doc_id)
        for part in PARTS:
            if keep_state and part == "state":
                continue
            self._cache_file(doc_id, part).unlink(missing_ok=True)

    def remove(self, doc_id: int) -> None:
        self._result_file(doc_id).unlink(missing_ok=True)
        for part in ("state", "view"):
            self._cache_file(doc_id, part).unlink(missing_ok=True)

    # ------------------------------------------------------------------ the screen model, built from the result
    def load_or_build_view(self, doc_id: int) -> Optional[dict]:
        """The cached view when it still matches the result, otherwise the view rebuilt from that result.

        The result file is the only truth: the cache is allowed to be missing, damaged or out of date, and this
        answers from the payload in every one of those cases.  A payload that is not a result/3.0 raises
        :class:`webapp.view.PayloadError` - the portal shows that, it does not draw a picture of nothing.
        """
        src = self._result_file(doc_id)
        payload = _read_json(src)
        if payload is None:
            return None
        cache = self._cache_file(doc_id, "view")
        try:
            if cache.is_file() and cache.stat().st_mtime >= src.stat().st_mtime:
                cached = _read_json(cache)
                if cached is not None:
                    return cached
        except OSError:
            pass
        view = build_view(payload)
        try:
            _write_json(cache, view)
        except OSError as e:                              # a cache that cannot be written costs time, not correctness
            log.warning("cannot cache the view of DMS-%s: %s", doc_id, e)
        return view

    # ------------------------------------------------------------------ summary.json, the batch script's schema
    def summary(self, mode: str = "production", *, round_name: Optional[str] = None,
                titles: Optional[dict] = None) -> dict:
        """Fold every result of a round into the summary ``scripts/test_paperless_invoices.py`` writes.

        Nothing is worked out here that the payload does not say: the verdict, the severity, the invoice number,
        the duration and the per-rule results are read out of each ``DMS-<id>_result.json``.
        """
        d = self.dir_of(round_name) if round_name else self.round_dir
        cases: list = []
        counts: dict = {k: 0 for k in SUMMARY_COUNTS}
        rules: dict = {}
        total_elapsed = 0.0
        for doc_id, payload in self.iter_results(round_name):
            rec = payload.get("recommendation") or {}
            fields = payload.get("normalized_fields") or {}
            metrics = ((payload.get("metrics") or {}).get("duration_ms") or {})
            ms = metrics.get("total_ms")
            elapsed = round(ms / 1000.0, 2) if isinstance(ms, (int, float)) else 0.0
            total_elapsed += elapsed
            rule_results = payload.get("rule_results") or []
            value = rec.get("value") or "UNKNOWN"
            cases.append({
                "doc_id": doc_id,
                "title": (titles or {}).get(doc_id) or payload.get("dms_doc_id") or f"DMS-{doc_id}",
                "recommendation": value,
                "max_severity": rec.get("max_severity"),
                "exception_codes": rec.get("exception_codes") or [],
                "invoice_num": fields.get("invoice_num") or "-",
                "po_number": fields.get("po_number"),
                "supplier_name": fields.get("supplier_name"),
                "grand_total": fields.get("grand_total"),
                "currency": fields.get("currency") or "THB",
                "elapsed_s": elapsed,
                "output_file": f"{RESULT_PREFIX}{doc_id}{RESULT_SUFFIX}",
                "error": None,
                "rule_results": rule_results,
                "skipped": False,
                "failed": False,
            })
            counts[value] = counts.get(value, 0) + 1
            for r in rule_results:
                if not isinstance(r, dict):
                    continue
                rid = r.get("rule_id") or "UNKNOWN"
                stat = rules.setdefault(rid, {k: 0 for k in RULE_RESULTS})
                res = r.get("result") or "not_evaluated"
                stat[res] = stat.get(res, 0) + 1
        cases.sort(key=lambda c: c["doc_id"])
        return {
            "metadata": {
                "title": SUMMARY_TITLE,
                "executed_at": datetime.now(timezone.utc).isoformat(),
                "mode": mode,
                "round": d.name,
                "total_documents": len(cases),
                "total_elapsed_s": round(total_elapsed, 1),
                "output_directory": str(d.resolve()),
            },
            "statistics": {"counts": counts, "rules": rules},
            "cases": cases,
        }

    def build_and_save_summary(self, mode: str = "production", *, round_name: Optional[str] = None,
                              titles: Optional[dict] = None) -> dict:
        data = self.summary(mode, round_name=round_name, titles=titles)
        d = self.dir_of(round_name) if round_name else self.round_dir
        _write_json(d / SUMMARY_NAME, data, indent=2)     # the script writes this file indented: same bytes
        return data

    def load_summary(self, round_name: Optional[str] = None) -> Optional[dict]:
        return _read_json((self.dir_of(round_name) if round_name else self.round_dir) / SUMMARY_NAME)


class MemoryStore:
    """Same interface, nothing on disk: the processed result of a document lives in this process only.

    Used when the browser is the system of record for cases (``WEBAPP_PERSIST=false``): the server keeps what the
    running page needs while it polls, and the browser keeps the case itself (``localStorage``).  A restart
    therefore leaves no result behind on the server.
    """

    def __init__(self, root=None):
        self.root = None
        self._d: dict = {}

    def save(self, doc_id: int, part: str, data) -> None:
        if part not in PARTS:
            raise ValueError(part)
        self._d.setdefault(int(doc_id), {})[part] = data

    def load(self, doc_id: int, part: str):
        return self._d.get(int(doc_id), {}).get(part)

    def clear(self, doc_id: int, keep_state: bool = True) -> None:
        keep = self._d.get(int(doc_id), {}).get("state") if keep_state else None
        self._d[int(doc_id)] = {"state": keep} if keep is not None else {}

    def remove(self, doc_id: int) -> None:
        self._d.pop(int(doc_id), None)

    def ids(self) -> list:
        return sorted(self._d)

    def folder(self, doc_id: int):
        return None

