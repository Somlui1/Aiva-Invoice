# Perception Layer Robustness & False Positive Elimination Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate false positives on Rule V-01 (PO number consensus conflicts), prevent multi-page header leaks from PO attachments, and auto-fold empty ghost rows into parent line items to eliminate false V-07 failures (HOLD/E13).

**Architecture:** Strictly localize changes to the Perception Layer (`src/system_a/perception/vision_pipeline.py`) without modifying domain rules. Add PO prefix stripping, crop budget prioritization for lookup keys, candidate page scoping for invoice headers, and auto-folding of continuation description rows in `_lines()`.

**Tech Stack:** Python 3.11, Pydantic v2, PyMuPDF (fitz), Pytest.

---

### Task 1: PO Number Normalization & Consensus in `vision_pipeline.py`

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py:166-209, 1202-1215`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`:
```python
def test_po_prefix_normalization_and_consensus():
    # VLM saw 'PO42052739' and crop saw '42052739' -> should agree on '42052739'
    v1, _, _ = vp.extract_value("po_number", "PO42052739")
    v2, _, _ = vp.extract_value("po_number", "42052739")
    assert v1 == "42052739"
    assert v2 == "42052739"
    winner, conf, agree, source, null_r = vp.consensus("PO42052739", None, "42052739", 0.95)
    assert agree is True
    assert winner == "42052739"
    assert null_r is None
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py -k test_po_prefix_normalization_and_consensus -v`
Expected: FAIL (AssertionError: assert 'PO42052739' == '42052739')

**Step 3: Write minimal implementation**

In `src/system_a/perception/vision_pipeline.py`:
1. In `extract_value("po_number", ...)`:
   Strip common prefixes `(?:PO|P\.O\.|P/O|PO#|เลขที่สั่งซื้อ)\s*` so extracted values are purely numeric `42052739`.
2. In `_key()`:
   Ensure `_key("PO42052739")` strips `PO` prefix for `po_number` so consensus tallies identical tokens.
3. In `po_from_lines()`:
   If `fields.get("po_number")` is present and matches the single PO printed in item rows, upgrade `agreement = True`, `confidence = max(conf, 0.96)`, and `null_reason = None`.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_po_prefix_normalization_and_consensus -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py tests/test_ocr_improvements.py
git commit -m "feat(perception): normalize PO prefixes and corroborate PO agreement"
```

---

### Task 2: Crop Budget Prioritization for Core Lookup Keys

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py:475-485`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`:
```python
def test_priority_crop_order_allocates_budget():
    # Verify priority fields are evaluated for crops before non-critical fields
    order = vp.field_crop_priority(["customer_address", "po_number", "customer_name", "invoice_num"])
    assert order.index("invoice_num") < order.index("customer_address")
    assert order.index("po_number") < order.index("customer_address")
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py -k test_priority_crop_order_allocates_budget -v`
Expected: FAIL (AttributeError: module has no attribute 'field_crop_priority')

**Step 3: Write minimal implementation**

In `src/system_a/perception/vision_pipeline.py`:
Define `PRIORITY_CROP_ORDER = ("invoice_num", "po_number", "supplier_tax_id", "grand_total", "sub_total", "invoice_date")`.
In `_fields()`:
Sort `candidates.keys()` using `field_crop_priority()` so critical lookup identifiers consume crop re-read budget before free-text customer fields.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_priority_crop_order_allocates_budget -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py tests/test_ocr_improvements.py
git commit -m "feat(perception): prioritize crop re-read budget for critical identifiers"
```

---

### Task 3: Header Candidate Scoping to Invoice Pages

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py:470-490, 1180-1200`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`:
```python
def test_header_scoping_ignores_attachment_doc_no():
    # Page 1 is TAX_INVOICE without doc_no; Page 2 is PO with doc_no='42052739'
    options = [
        (2, {"label": "doc_no", "text": "42052739", "confidence": 0.95, "bbox": (0.1, 0.1, 0.2, 0.05)})
    ]
    # When invoice_pages=[1], page 2's doc_no must NOT be picked as invoice_num
    chosen = vp.pick_candidate("invoice_num", options, first_invoice=1, invoice_pages=[1])
    assert chosen is None or chosen[0] == 1
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py -k test_header_scoping_ignores_attachment_doc_no -v`
Expected: FAIL (chosen[0] == 2)

**Step 3: Write minimal implementation**

In `src/system_a/perception/vision_pipeline.py`:
In `pick_candidate()`:
For `INVOICE_HEADER_FIELDS = {"invoice_num", "invoice_date", "sub_total", "vat", "grand_total"}`:
If `invoice_pages` is provided and non-empty, reject candidates where `page not in invoice_pages`.
If no candidate remains on `invoice_pages`, fall back to searching `ctx.layers[first_invoice]` with `IDENTIFIER_SHAPE` or regex.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_header_scoping_ignores_attachment_doc_no -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py tests/test_ocr_improvements.py
git commit -m "fix(perception): restrict invoice header candidates to classified invoice pages"
```

---

### Task 4: Ghost Row Auto-Folding in `_lines()`

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py:605-640`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`:
```python
def test_ghost_rows_auto_fold_into_preceding_description():
    rows = [
        {"line_no": 1, "bbox": (0.01, 0.20, 0.9, 0.05), "cells": {
            "description": {"text": "PART A MAIN"}, "qty": {"text": "2"}, "unit_price": {"text": "50.00"}, "amount": {"text": "100.00"}}},
        {"line_no": 2, "bbox": (0.01, 0.26, 0.9, 0.04), "cells": {
            "description": {"text": "EXTRA SPECIFICATION CONTINUED"}, "qty": {}, "unit_price": {}, "amount": {}}},
    ]
    folded = vp.fold_ghost_rows(rows)
    assert len(folded) == 1
    assert "EXTRA SPECIFICATION CONTINUED" in folded[0]["cells"]["description"]["text"]
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py -k test_ghost_rows_auto_fold_into_preceding_description -v`
Expected: FAIL (AttributeError: module has no attribute 'fold_ghost_rows')

**Step 3: Write minimal implementation**

In `src/system_a/perception/vision_pipeline.py`:
Implement `fold_ghost_rows(rows: list) -> list`:
A row where `cells.get("qty")` is empty, `cells.get("unit_price")` is empty, and `cells.get("amount")` is empty is a ghost row.
If a previous row exists in the page, fold its description into `prev_row["cells"]["description"]["text"]` and union their bboxes.
If no previous row exists (leading header noise), drop it.
Apply `fold_ghost_rows()` inside `_lines()` before creating `RawLine` objects.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_ghost_rows_auto_fold_into_preceding_description -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py tests/test_ocr_improvements.py
git commit -m "feat(perception): auto-fold ghost continuation rows into preceding items"
```

---

### Task 5: Full Regression & Sandbox Scenario Verification

**Files:**
- Test: Entire pytest test suite & sandbox scenarios

**Step 1: Run OCR improvements pytest suite**

Run: `pytest tests/test_ocr_improvements.py -v`
Expected: All tests pass.

**Step 2: Run Sandbox Golden Scenarios**

Run: `python -m system_a.sandbox.scenarios --golden --schema`
Expected: 62/62 scenarios pass with zero drift.

**Step 3: Re-verify DMS-24, DMS-64, DMS-23 directly**

Run:
```bash
python scripts/test_paperless_invoices.py --doc-id 24 --out-dir results/test_run
python scripts/test_paperless_invoices.py --doc-id 64 --out-dir results/test_run
python scripts/test_paperless_invoices.py --doc-id 23 --out-dir results/test_run
```
Expected:
- DMS-24 recommendation: AUTO_PASS (PO consensus clean).
- DMS-64 recommendation: AUTO_PASS (Ghost rows folded, 2 items match receipt).
- DMS-23 recommendation: Valid invoice number on Page 1.

**Step 4: Update task.md and commit**

```bash
git add docs/plans/task.md
git commit -m "test(regression): verify 62 scenarios and target DMS documents"
```
