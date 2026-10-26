"""Evidence post-check (engine v5.7) — the rules the Portal's 3-state evidence button relies on.

Pure and read-only: it inspects an assembled payload and returns violations, never raises in the
default (warn) mode.  ``AIVA_EVIDENCE_STRICT=1`` makes :func:`enforce` raise — tests / CI only.

R1  evidence_id present and unique
R3  bboxes non-empty  or  bbox_missing_reason present        (a button is either "located" or "explained")
R4  bbox_missing_reason.reason in REASONS
R5  page_no == sorted(unique(bboxes[].page_no))
R6  related_element_ids exist in ocr.elements
R7  a manual_review rule has at least one evidence row
R8  a fail rule has at least one evidence row with an exception code
R10 signatures.* normalized_value is bool or null
"""
from __future__ import annotations

import os

REASONS = ("PAGES_INCOMPLETE", "NOT_PRESENT", "LOW_CONFIDENCE", "NOT_LOCATED", "NO_ELEMENT")
MAX_ELEMENTS_PER_FINDING = 12          # advisory only (R2): more usually means several findings were merged


def check_evidence(payload: dict) -> list[dict]:
    out: list[dict] = []

    def v(code, xid, detail):
        out.append({"code": code, "evidence_id": xid, "detail": detail})

    els = {e.get("element_id") for e in (payload.get("ocr") or {}).get("elements") or ()}
    seen: set = set()
    by_id = {}
    for e in payload.get("evidence") or ():
        xid = e.get("evidence_id")
        if not xid or xid in seen:
            v("R1_EVIDENCE_ID", xid, "missing or duplicate evidence_id")
        seen.add(xid)
        by_id[xid] = e
        boxes = e.get("bboxes") or []
        reason = e.get("bbox_missing_reason")
        if not boxes and not reason:
            v("R3_NO_LOCATION_NO_REASON", xid, f"{e.get('rule_id')}: no bbox and no bbox_missing_reason")
        if reason and reason.get("reason") not in REASONS:
            v("R4_BAD_REASON", xid, f"reason={reason.get('reason')!r}")
        pages = sorted({b.get("page_no") for b in boxes})
        if list(e.get("page_no") or []) != pages:
            v("R5_PAGE_MISMATCH", xid, f"page_no={e.get('page_no')} bboxes={pages}")
        unknown = [i for i in e.get("related_element_ids") or () if i not in els]
        if unknown:
            v("R6_UNKNOWN_ELEMENT", xid, ", ".join(unknown[:5]))
        if len(e.get("related_element_ids") or ()) > MAX_ELEMENTS_PER_FINDING:
            v("R2_WIDE_FINDING", xid, f"{len(e['related_element_ids'])} elements")
    for r in payload.get("rule_results") or ():
        ev = [by_id.get(i) for i in r.get("evidence_ids") or ()]
        if r.get("result") == "manual_review" and not ev:
            v("R7_REVIEW_WITHOUT_EVIDENCE", None, r.get("rule_id"))
        if r.get("result") == "fail" and not any(x and x.get("exception_code") for x in ev):
            v("R8_FAIL_WITHOUT_EVIDENCE", None, r.get("rule_id"))
    for e in (payload.get("ocr") or {}).get("elements") or ():
        if str(e.get("field_name") or "").startswith("signatures.") \
                and e.get("normalized_value") not in (True, False, None):
            v("R10_SIGNATURE_NOT_BOOL", None, f"{e.get('element_id')}={e.get('normalized_value')!r}")
    return out


def strict() -> bool:
    return os.environ.get("AIVA_EVIDENCE_STRICT", "").strip() in ("1", "true", "yes")


def enforce(payload: dict) -> list[dict]:
    """Returns the violations; raises ValueError when strict mode is on and there are any
    (R2 is advisory and never raises)."""
    found = check_evidence(payload)
    hard = [x for x in found if x["code"] != "R2_WIDE_FINDING"]
    if hard and strict():
        raise ValueError("evidence contract violated: " + "; ".join(
            f"{x['code']}@{x['evidence_id']}:{x['detail']}" for x in hard[:5]))
    return found
