"""v5.17 — "tagged AIVA processed but not in the Portal queue".

Covers: the reconciler (only `found:false` is requeued, never on errors, circuit breaker, per-doc cap,
grace window, IN_PROCESS untouched), the stricter delivery receipt, the presence client and the
traceable success note.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

import httpx
import pytest

from system_a import flow_worker as fw
from system_a.reconciler import NOTE_PREFIX, Reconciler

INV, PROC, INP = 5, 25, 26
NOW = datetime(2026, 11, 19, 12, 0, tzinfo=timezone.utc)


def iso(minutes_ago: float) -> str:
    return (NOW - timedelta(minutes=minutes_ago)).isoformat()


class FakePaperless:
    def __init__(self, docs):
        self.docs = {d["id"]: d for d in docs}
        self.notes = {d["id"]: list(d.pop("_notes", [])) for d in docs}
        self.requeued = []

    def query_processed(self, tag_invoice, tag_processed, limit=100):
        return [dict(d) for d in self.docs.values() if tag_processed in d["tags"]][:limit]

    def get_notes(self, doc_id):
        return [{"note": n} for n in self.notes[doc_id]]

    def requeue(self, doc_id, tag_processed, tag_in_process, note):
        d = self.docs[doc_id]
        if tag_in_process in d["tags"] or tag_processed not in d["tags"]:
            return False
        d["tags"] = [t for t in d["tags"] if t != tag_processed]
        self.notes[doc_id].append(note)
        self.requeued.append(doc_id)
        return True


class FakePortal:
    def __init__(self, present=(), unreadable=(), closed_unreadable=(), instance="portal/abc", fail=None):
        self.present, self.unreadable, self.closed = set(present), set(unreadable), set(closed_unreadable)
        self.instance, self.fail, self.calls = instance, fail, []

    def presence(self, ids):
        self.calls.append(list(ids))
        if self.fail:
            return None, self.fail
        docs = {}
        for i in ids:
            if i in self.present:
                docs[i] = {"found": True, "status": "Review", "readable": True, "revalidatable": True}
            elif i in self.unreadable:
                docs[i] = {"found": True, "status": "Review", "readable": False, "revalidatable": True}
            elif i in self.closed:
                docs[i] = {"found": True, "status": "Posted", "readable": False, "revalidatable": False}
            else:
                docs[i] = {"found": False}
        return {"ok": True, "portal_instance": self.instance, "documents": docs}, ""


def doc(i, minutes_ago=60, tags=(INV, PROC), notes=()):
    return {"id": i, "tags": list(tags), "modified": iso(minutes_ago), "_notes": list(notes)}


def make(docs, portal, **cfg):
    base = {"tag_invoice": INV, "tag_processed": PROC, "tag_in_process": INP, "mode": "fix", "interval_s": 600,
            "start_delay_s": 0, "lookback_days": 14, "scan_limit": 200, "grace_s": 300, "max_requeue": 10,
            "max_missing_ratio": 0.2, "max_per_doc": 3, "expect_instance": ""}
    base.update(cfg)
    pl = FakePaperless(docs)
    return Reconciler(pl, portal, base, clock=lambda: NOW.timestamp()), pl


def test_only_documents_missing_from_the_portal_are_requeued():
    docs = [doc(i) for i in range(1, 21)]
    rec, pl = make(docs, FakePortal(present={f"DMS-{i}" for i in range(1, 21) if i != 7}))
    rep = rec.run_once()
    assert rep["missing"] == ["DMS-7"] and rep["requeued"] == ["DMS-7"]
    assert pl.requeued == [7]
    assert PROC not in pl.docs[7]["tags"] and INV in pl.docs[7]["tags"]
    assert pl.notes[7][-1].startswith(NOTE_PREFIX) and "portal/abc" in pl.notes[7][-1]
    assert rep["present"] == 19


def test_report_mode_changes_nothing():
    rec, pl = make([doc(1), doc(2)], FakePortal(present={"DMS-1"}), mode="report")
    rep = rec.run_once()
    assert rep["missing"] == ["DMS-2"] and rep["requeued"] == [] and pl.requeued == []


def test_portal_error_never_counts_as_missing():
    rec, pl = make([doc(1), doc(2)], FakePortal(fail="presence HTTP 503 database unavailable"))
    rep = rec.run_once()
    assert rep["aborted"] and pl.requeued == [] and rep["missing"] == []


def test_breaker_on_too_many_missing_then_force():
    docs = [doc(i) for i in range(1, 31)]
    rec, pl = make(docs, FakePortal(present=set()))  # empty / wrong database
    rep = rec.run_once()
    assert rep["breaker"] and pl.requeued == []
    rep = rec.run_once(force=True)
    assert len(rep["requeued"]) == 30 and len(pl.requeued) == 30


def test_breaker_on_high_ratio():
    docs = [doc(i) for i in range(1, 21)]
    rec, pl = make(docs, FakePortal(present={f"DMS-{i}" for i in range(1, 16)}))  # 5/20 = 25 %
    rep = rec.run_once()
    assert "%" in rep["breaker"] and pl.requeued == []


def test_instance_pin_and_instance_change():
    rec, pl = make([doc(1)], FakePortal(present=set(), instance="other/db"), expect_instance="portal/abc")
    assert rec.run_once()["aborted"] and pl.requeued == []

    portal = FakePortal(present={"DMS-1"}, instance="portal/abc")
    rec, pl = make([doc(1), doc(2, tags=(INV,))], portal)
    rec.run_once()
    portal.instance, portal.present = "portal/NEW", set()
    rep = rec.run_once()
    assert "instance changed" in rep["breaker"] and pl.requeued == []


def test_fresh_in_process_and_old_documents_are_left_alone():
    docs = [doc(1, minutes_ago=2), doc(2, tags=(INV, PROC, INP)), doc(3, minutes_ago=60 * 24 * 30), doc(4)]
    rec, pl = make(docs, FakePortal(present=set()))
    rep = rec.run_once()
    assert rep["scanned"] == 1 and pl.requeued == [4]


def test_gives_up_after_max_attempts_per_document():
    notes = [f"{NOTE_PREFIX}: … attempt {i}/3" for i in (1, 2, 3)]
    rec, pl = make([doc(1, notes=notes), doc(2)], FakePortal(present=set()))
    rep = rec.run_once()
    assert rep["gave_up"] == ["DMS-1"] and pl.requeued == [2]


def test_unreadable_rows_requeued_only_when_the_portal_accepts_a_redelivery():
    rec, pl = make([doc(1), doc(2), doc(3)], FakePortal(present={"DMS-3"}, unreadable={"DMS-1"}, closed_unreadable={"DMS-2"}))
    rep = rec.run_once()
    assert rep["unreadable"] == ["DMS-1"] and rep["unreadable_closed"] == ["DMS-2"]
    assert pl.requeued == [1]


def test_off_mode():
    rec, pl = make([doc(1)], FakePortal(present=set()), mode="off")
    assert rec.run_once()["aborted"] == "RECONCILE_MODE=off" and pl.requeued == []


# ── delivery receipt (FrontendClient.push) ──────────────────────────────────

PAYLOAD = {"request": {"validation_id": "VAL-DMS-9-1", "dms_doc_id": "DMS-9"}}
OK_BODY = {"ok": True, "result": "CREATED", "portalDocId": "DMS-9", "portal_instance": "portal/abc"}


def _client(monkeypatch, receipt, require=True):
    c = fw.FrontendClient("http://portal", require_receipt=require, attempts=1)
    monkeypatch.setattr(c, "_post_once", lambda base, payload, headers: (200, dict(OK_BODY)))
    monkeypatch.setattr(c, "confirm", lambda base, vid: receipt)
    return c


def test_unconfirmed_receipt_is_not_a_delivery(monkeypatch):
    ok, resp = _client(monkeypatch, (None, "receipt check failed: ConnectError")).push(PAYLOAD)
    assert ok is False and "unconfirmed" in resp


def test_unconfirmed_receipt_accepted_when_requirement_is_off(monkeypatch):
    ok, resp = _client(monkeypatch, (None, "receipt HTTP 500"), require=False).push(PAYLOAD)
    assert ok is True and resp["_receipt"] == "unconfirmed"


def test_old_portal_without_receipt_endpoint_still_works(monkeypatch):
    c = _client(monkeypatch, (None, "receipt endpoint not available on this Portal"))
    c._verify_supported = False
    ok, resp = c.push(PAYLOAD)
    assert ok is True and resp["_receipt"] == "unsupported"


def test_confirmed_receipt(monkeypatch):
    ok, resp = _client(monkeypatch, (True, "DMS-9 · Review")).push(PAYLOAD)
    assert ok is True and resp["_receipt"] == "confirmed" and resp["portalDocId"] == "DMS-9"


def test_trace_written_into_the_success_note(monkeypatch):
    p = fw.PaperlessClient("http://dms", "t")
    written = {}
    monkeypatch.setattr(p, "get_document", lambda i: {"tags": [INV, INP]})
    monkeypatch.setattr(p, "patch_tags", lambda i, tags: written.__setitem__("tags", sorted(tags)))
    monkeypatch.setattr(p, "add_note", lambda i, n: written.__setitem__("note", n))
    p.mark_processed(9, "REVIEW", "CREATED", 1, INP, PROC,
                     fw._delivery_trace(PAYLOAD, {**OK_BODY, "_receipt": "confirmed"}))
    assert written["tags"] == [INV, PROC]
    for part in ("validation_id=VAL-DMS-9-1", "portalDocId=DMS-9", "portal=portal/abc", "receipt=confirmed"):
        assert part in written["note"]


# ── presence client ──────────────────────────────────────────────────────────

def _patch_httpx(monkeypatch, handler):
    real = httpx.Client
    monkeypatch.setattr(fw.httpx, "Client", lambda *a, **k: real(transport=httpx.MockTransport(handler), **{
        kk: vv for kk, vv in k.items() if kk != "transport"}))


def test_presence_posts_to_the_primary_portal(monkeypatch):
    seen = {}

    def handler(req: httpx.Request):
        seen["url"], seen["body"] = str(req.url), json.loads(req.content)
        seen["auth"] = req.headers.get("x-aiva-key")
        return httpx.Response(200, json={"ok": True, "portal_instance": "p/1", "documents": {"DMS-1": {"found": False}}})

    _patch_httpx(monkeypatch, handler)
    c = fw.FrontendClient("http://portal:3000", ingest_key="k1")
    body, why = c.presence(["DMS-1"])
    assert why == "" and body["documents"]["DMS-1"]["found"] is False
    assert seen == {"url": "http://portal:3000/api/engine/presence", "body": {"dms_doc_ids": ["DMS-1"]}, "auth": "k1"}


@pytest.mark.parametrize("status,body", [(404, {"error": "not found"}), (503, {"ok": False, "error": "db"}), (200, {"ok": True})])
def test_presence_errors_are_none(monkeypatch, status, body):
    _patch_httpx(monkeypatch, lambda req: httpx.Response(status, json=body))
    got, why = fw.FrontendClient("http://portal").presence(["DMS-1"])
    assert got is None and why
