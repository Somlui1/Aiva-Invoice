"""Engine v5.7 — evidence per finding (docs/plans/2026-10-26-evidence-findings-implementation.md).

The Portal shows one evidence button per evidence row: "located" (bboxes) / "not located"
(bbox_missing_reason) / none.  These tests pin the contract that makes that possible, and that the
decision (recommendation, severity, codes) does not depend on how evidence is split.
"""
from __future__ import annotations

import pytest

from system_a.application import evidence_check as EC
from system_a.application.assembler import MISSING_REASONS, _locate
from system_a.domain.contracts import Finding, ReviewPoint, RuleOutcome
from system_a.domain.recommendation import recommend
from system_a.sandbox import scenarios as S


# --------------------------------------------------------------------------- helpers
def _el(eid, bbox=(0.1, 0.1, 0.2, 0.02), page=1, raw="x", null_reason=None, etype="field"):
    return {"element_id": eid, "page_no": page if bbox else None, "bbox": list(bbox) if bbox else None,
            "raw_value": raw, "normalized_value": raw, "element_type": etype,
            "source_reference": {"null_reason": null_reason}}


class _Doc:
    pages_complete = True


def _fd(*eids, reason=None):
    return Finding("E01", "Medium", "V-01", "m", element_ids=tuple(eids), missing_reason=reason)


# --------------------------------------------------------------------------- _locate (R3, R4, R6)
def test_located_element_has_no_reason():
    rel, boxes, why = _locate(_fd("a"), {"a": _el("a")}, _Doc())
    assert rel == ["a"] and len(boxes) == 1 and why is None


@pytest.mark.parametrize("el,expected", [
    (_el("a", bbox=None, raw=None, null_reason="NOT_PRESENT"), "NOT_PRESENT"),
    (_el("a", bbox=None, raw="123"), "NOT_LOCATED"),
    (_el("a", bbox=None, raw="123", null_reason="LOW_CONFIDENCE"), "LOW_CONFIDENCE"),
])
def test_reason_comes_from_the_element(el, expected):
    _, boxes, why = _locate(_fd("a"), {"a": el}, _Doc())
    assert boxes == [] and why == {"element_ids": ["a"], "reason": expected}


def test_unknown_id_is_reported_only_in_the_reason():
    rel, boxes, why = _locate(_fd("ghost"), {}, _Doc())
    assert rel == [] and boxes == [] and why["reason"] == "NO_ELEMENT" and why["element_ids"] == ["ghost"]


def test_finding_without_elements_uses_its_own_reason():
    assert _locate(_fd(reason="PAGES_INCOMPLETE"), {}, _Doc())[2] == {"element_ids": [], "reason": "PAGES_INCOMPLETE"}
    assert _locate(_fd(), {}, _Doc())[2] == {"element_ids": [], "reason": "NOT_LOCATED"}   # never None


def test_partly_located_keeps_boxes_and_explains_the_rest():
    els = {"r": _el("r", etype="row", raw=None), "q": _el("q", bbox=None, raw=None, null_reason="NOT_PRESENT")}
    rel, boxes, why = _locate(_fd("r", "q"), els, _Doc())
    assert rel == ["r", "q"] and [b["element_id"] for b in boxes] == ["r"]
    assert why == {"element_ids": ["q"], "reason": "NOT_PRESENT"}


def test_reason_priority_and_details():
    els = {"a": _el("a", bbox=None, raw="1"), "b": _el("b", bbox=None, raw=None, null_reason="NOT_PRESENT")}
    why = _locate(_fd("a", "b"), els, _Doc())[2]
    assert why["reason"] == "NOT_PRESENT" and why["details"] == {"a": "NOT_LOCATED", "b": "NOT_PRESENT"}
    assert MISSING_REASONS[0] == "PAGES_INCOMPLETE"


# --------------------------------------------------------------------------- post-check
def _payload(ev, rules=(), els=("a",), sig=None):
    elements = [{"element_id": e, "field_name": None, "normalized_value": None} for e in els]
    if sig is not None:
        elements.append({"element_id": "D1-sig-receiver", "field_name": "signatures.receiver", "normalized_value": sig})
    return {"ocr": {"elements": elements}, "evidence": ev, "rule_results": list(rules)}


def _ev(xid="X1", boxes=(), reason=None, pages=None, related=("a",), code="E01"):
    return {"evidence_id": xid, "rule_id": "V-01", "exception_code": code, "bboxes": list(boxes),
            "bbox_missing_reason": reason, "page_no": pages if pages is not None else sorted({b["page_no"] for b in boxes}),
            "related_element_ids": list(related)}


@pytest.mark.parametrize("payload,code", [
    (_payload([_ev()]), "R3_NO_LOCATION_NO_REASON"),
    (_payload([_ev(reason={"element_ids": [], "reason": "WHO_KNOWS"})]), "R4_BAD_REASON"),
    (_payload([_ev(boxes=[{"page_no": 2}], pages=[1])]), "R5_PAGE_MISMATCH"),
    (_payload([_ev(boxes=[{"page_no": 1}], related=("nope",))]), "R6_UNKNOWN_ELEMENT"),
    (_payload([], rules=[{"rule_id": "V-08", "result": "manual_review", "evidence_ids": []}]), "R7_REVIEW_WITHOUT_EVIDENCE"),
    (_payload([], rules=[{"rule_id": "V-03", "result": "fail", "evidence_ids": []}]), "R8_FAIL_WITHOUT_EVIDENCE"),
    (_payload([], sig="false"), "R10_SIGNATURE_NOT_BOOL"),
])
def test_post_check_flags(payload, code):
    assert code in {v["code"] for v in EC.check_evidence(payload)}


def test_strict_mode_raises(monkeypatch):
    monkeypatch.setenv("AIVA_EVIDENCE_STRICT", "1")
    with pytest.raises(ValueError):
        EC.enforce(_payload([_ev()]))
    monkeypatch.delenv("AIVA_EVIDENCE_STRICT")
    assert EC.enforce(_payload([_ev()]))           # warn mode: returned, not raised


# --------------------------------------------------------------------------- decision is split-proof
def test_recommendation_ignores_review_points_and_split():
    one = RuleOutcome("V-01", "fail", (Finding("E01", "Medium", "V-01", "a, b"),))
    split = RuleOutcome("V-01", "fail", (Finding("E01", "Medium", "V-01", "a"), Finding("E01", "Medium", "V-01", "b")),
                        reviews=(ReviewPoint("look"),))
    a, b = recommend([one], []), recommend([split], [])
    assert (a["value"], a["max_severity"], a["exception_codes"], sorted(a["reasons"])) == \
           (b["value"], b["max_severity"], b["exception_codes"], sorted(b["reasons"]))


# --------------------------------------------------------------------------- whole documents (sandbox)
@pytest.fixture(scope="module")
def results():
    return [(sc, S.run_scenario(sc)[0]) for sc in S.all_scenarios()]


def test_every_scenario_meets_the_evidence_contract(results):
    for sc, res in results:
        hard = [v for v in EC.check_evidence(res) if v["code"] != "R2_WIDE_FINDING"]
        assert not hard, (getattr(sc, "sid", sc), hard)
        assert res["metrics"]["evidence_violations"] is not None


def test_review_evidence_is_never_an_exception(results):
    for sc, res in results:
        coded = [e for e in res["evidence"] if e["exception_code"]]
        reviews = [e for e in res["evidence"] if e.get("kind") == "review"]
        assert len(res["exceptions"]) == len(coded)
        assert all(e["severity"] is None and e["result"] == "manual_review" for e in reviews)
        assert all(x["code"] for x in res["summary"].get("exceptions") or [])
        for r in res["rule_results"]:
            if r["result"] == "manual_review":
                assert r["evidence_ids"], (getattr(sc, "sid", sc), r["rule_id"])


def test_signature_slots_always_have_an_element(results):
    for sc, res in results:
        did = res["extraction"]["invoice_document_id"]
        ids = {e["element_id"]: e for e in res["ocr"]["elements"]}
        for slot in ("receiver", "deliverer"):
            el = ids.get(f"{did}-sig-{slot}")
            assert el is not None, (getattr(sc, "sid", sc), slot)
            assert el["normalized_value"] in (True, False, None)


def test_v01_and_v03_findings_are_narrow(results):
    for sc, res in results:
        for e in res["evidence"]:
            if e["rule_id"] in ("V-01", "V-03"):
                rows = [i for i in e["related_element_ids"] if i.count("-L") and i.split("-L")[1].isdigit()]
                assert len(rows) <= 1, (getattr(sc, "sid", sc), e["evidence_id"], e["related_element_ids"])
