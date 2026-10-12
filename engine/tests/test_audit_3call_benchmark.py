"""Unit tests for scripts/audit_3call_benchmark.py — the 3-pillar gate evaluators.

Each gate is a pure function over a result dict, so the tests build minimal
synthetic results and assert pass/fail plus the reason strings the scorecard
prints during the evaluation loop.
"""
from __future__ import annotations

import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import audit_3call_benchmark as audit  # noqa: E402


# ------------------------------------------------------------------ fixtures
def make_result(*, kinds=("classify_batch", "page_items", "table_rows"), crops=0,
                verdict="AUTO_PASS", fields=None, n_lines=2, elements=None,
                bbox_problems=None, invoice_pages=(1,)):
    calls = [{"kind": k, "ok": True} for k in kinds] + [{"kind": "crop_reread", "ok": True}] * crops
    extra = {"calls": calls, "invoice_pages": list(invoice_pages)}
    if bbox_problems is not None:
        extra["bbox_problems"] = bbox_problems
    if fields is None:
        fields = {"invoice_num": "SQ26/071249", "po_number": "40117545",
                  "supplier_tax_id": "0135537003456", "sub_total": "442.00",
                  "grand_total": "472.94"}
    if elements is None:
        elements = [{"element_id": "R1", "element_type": "row", "bbox": [0.10, 0.35, 0.80, 0.04]}]
    return {
        "documents": [{"document_id": "D1", "document_type": "INVOICE"}],
        "recommendation": {"value": verdict},
        "normalized_fields": fields,
        "extraction": {"lines": [{"line_no": i + 1} for i in range(n_lines)], "extra": extra},
        "ocr": {"elements": elements},
    }


# ------------------------------------------------------------------ Gate 1
def test_gate1_passes_when_calls_under_or_equal_three():
    ok, reasons = audit.gate1_calls_budget(make_result())
    assert ok and reasons == []

    ok, reasons = audit.gate1_calls_budget(make_result(kinds=("classify_batch",)))   # 1 call
    assert ok and reasons == []

    ok, reasons = audit.gate1_calls_budget(make_result(kinds=("classify_batch",) * 2))  # 2 calls
    assert ok and reasons == []

    # over the fixed budget of 3 for a single-page invoice document
    ok, reasons = audit.gate1_calls_budget(
        make_result(kinds=("classify_batch", "page_items", "table_rows", "table_rows")))
    assert not ok and any("calls=4" in r for r in reasons)

    # multi-page exception: 1 + 2*K where K = invoice pages processed (design's per-unit budget)
    ok, _ = audit.gate1_calls_budget(make_result(
        kinds=("classify_batch",) + ("page_items", "table_rows") * 2, invoice_pages=(1, 2)))
    assert ok
    ok, reasons = audit.gate1_calls_budget(make_result(
        kinds=("classify_batch",) + ("page_items", "table_rows") * 2 + ("table_rows",),
        invoice_pages=(1, 2)))
    assert not ok and any("calls=6 > budget 5" in r for r in reasons)


def test_gate1_fails_when_crop_reread_present():
    ok, reasons = audit.gate1_calls_budget(make_result(crops=11))
    assert not ok
    assert any("crop_reread=11" in r for r in reasons)
    assert any("calls=14 > budget 3" in r for r in reasons)   # 3 base + 11 crops

    # even one crop reread violates the zero-crop rule even inside the call budget
    ok, reasons = audit.gate1_calls_budget(
        make_result(kinds=("classify_batch", "page_items"), crops=1))
    assert not ok and any("crop_reread=1" in r for r in reasons)


# ------------------------------------------------------------------ Gate 2
def test_gate2_verifies_verdict_and_field_parity():
    baseline = make_result()

    ok, reasons = audit.gate2_accuracy(make_result(), baseline)
    assert ok and reasons == []

    # verdict regression AUTO_PASS -> HOLD
    ok, reasons = audit.gate2_accuracy(make_result(verdict="HOLD"), baseline)
    assert not ok and any("verdict regression AUTO_PASS -> HOLD" in r for r in reasons)

    # verdict improvement HOLD -> AUTO_PASS is allowed
    ok, reasons = audit.gate2_accuracy(make_result(), make_result(verdict="HOLD"))
    assert ok and reasons == []

    # core field mismatch (po_number) and missing field (grand_total)
    bad_fields = {"invoice_num": "SQ26/071249", "po_number": "99999999",
                  "supplier_tax_id": "0135537003456", "sub_total": "442.00", "grand_total": ""}
    ok, reasons = audit.gate2_accuracy(make_result(fields=bad_fields), baseline)
    assert not ok
    assert any("po_number='99999999' != baseline '40117545'" in r for r in reasons)
    assert any("grand_total missing" in r for r in reasons)

    # improvement over an empty baseline field is allowed
    weak_baseline = make_result(fields={**baseline["normalized_fields"], "po_number": ""})
    ok, reasons = audit.gate2_accuracy(make_result(), weak_baseline)
    assert ok and reasons == []

    # line count drift
    ok, reasons = audit.gate2_accuracy(make_result(n_lines=3), baseline)
    assert not ok and any("lines=3 != baseline 2" in r for r in reasons)

    # missing target/baseline are violations with clear reasons
    ok, reasons = audit.gate2_accuracy(None, baseline)
    assert not ok and reasons == ["target result missing"]
    ok, reasons = audit.gate2_accuracy(make_result(), None)
    assert not ok and any("baseline result missing" in r for r in reasons)


# ------------------------------------------------------------------ Gate 3
def test_gate3_detects_degenerate_bbox():
    ok, reasons = audit.gate3_bbox(make_result())
    assert ok and reasons == []

    zero_w = make_result(elements=[{"element_id": "C7", "element_type": "cell",
                                    "bbox": [0.5, 0.4, 0.0, 0.02]}])
    ok, reasons = audit.gate3_bbox(zero_w)
    assert not ok and any("degenerate bbox: C7" in r for r in reasons)

    neg_h = make_result(elements=[{"element_id": "R9", "element_type": "row",
                                   "bbox": [0.1, 0.4, 0.3, -0.01]}])
    ok, reasons = audit.gate3_bbox(neg_h)
    assert not ok and any("degenerate bbox: R9" in r for r in reasons)

    out_of_bounds = make_result(elements=[{"element_id": "R2", "element_type": "row",
                                           "bbox": [0.9, 0.4, 0.3, 0.05]}])
    ok, reasons = audit.gate3_bbox(out_of_bounds)
    assert not ok and any("out-of-range bbox: R2" in r for r in reasons)

    # engine-reported problems fail the gate even when the scan itself is clean
    reported = make_result(bbox_problems=[{"element_id": "R1", "problem": "outside_parent"}])
    ok, reasons = audit.gate3_bbox(reported)
    assert not ok and any("bbox_problems=1" in r for r in reasons)
