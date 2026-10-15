# Invoice Separation, Dual-Quantity & Matching Robustness Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate false-positive HOLDs (11 cases) by pruning duplicate invoice copies and resilient row folding, and resolve false-positive MANUAL_REVIEWs (8 cases) via visual unit matching, self-evidence quantity fallback, and business rule fast-paths.

**Architecture:** Two-stage Defense-in-Depth:
1. Upstream visual unit matching in prompts + safe duplicate page separation in `single_pass.py` protecting multi-page continuation sheets.
2. Resilient midstream row folding in `evidence.py` (fuzzy block match + installment decoupling) + self-corroboration token fallback without Oracle peeking + V-05/V-08 business rule fast-paths.

**Tech Stack:** Python 3.10+, PyTest, PyMuPDF, LiteLLM / Qwen-VL, System A Domain Engine.

---

### Task 1: Prompt Enhancements for Visual Unit Matching & Negative Discounts

**Files:**
- Modify: `engine/config/prompts/single_pass_extract.md`
- Modify: `engine/config/prompts/vision_table_rows.md`
- Test: `engine/tests/test_ocr_improvements.py`

**Step 1: Write test verifying prompt content specifications**

```python
def test_single_pass_extract_prompt_has_visual_unit_and_discount_rules():
    from pathlib import Path
    prompt_text = Path("config/prompts/single_pass_extract.md").read_text(encoding="utf-8")
    assert "B / KGS" in prompt_text or "Visual Unit Matching" in prompt_text
    assert "ส่วนลด" in prompt_text or "discount" in prompt_text
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py::test_single_pass_extract_prompt_has_visual_unit_and_discount_rules -v`
Expected: FAIL

**Step 3: Update `single_pass_extract.md` and `vision_table_rows.md`**

In `single_pass_extract.md` and `vision_table_rows.md`, add:
```markdown
2D TABLE EXTRACTION RULES (VERTICAL COLUMNS & HORIZONTAL ROWS):
a) Horizontal Row Gating (Multi-line Descriptions):
   - A valid "line_item" row MUST have a printed numeric "amount" (or "unit_price") on the right side of the table.
   - Text-only lines underneath an item (e.g., Coil No., Heat No., Lot No., PO reference, size specs, or remarks with empty qty/price/amount columns) are CONTINUATION lines. Append their text to the parent item's "description" — NEVER output them as separate line_items and NEVER assign a UOM or price to them.
b) Vertical Header & Price-Unit Alignment (Dual Quantity Columns):
   - Inspect column headers vertically from top to bottom, including sub-headers under UNIT PRICE (e.g., "[B / KGS]", "THB/KG", "บาท/กก.").
   - When a row has numbers in multiple quantity/weight columns (e.g., QTY = 1 and KGS = 701), select the column whose header matches the unit in the UNIT PRICE header (KGS) AND satisfies the horizontal check: qty × unit_price ≈ amount (701 × 35.70 = 25,025.70).
   - The number assigned to qty must be physically printed in that row; never invent an unprinted number.
c) Conditional UOM Inheritance (No Number, No Header UOM):
   - Priority 1: If a cell explicitly prints a unit next to the number (e.g., "1 SET", "2 PCS"), use that printed unit.
   - Priority 2: If a cell contains ONLY a number (e.g., "701" vertically aligned with KGS), inherit the UOM from that specific column's header (e.g., header "KGS" -> uom: "KG").
   - Priority 3: If the quantity/weight column is blank for that row (e.g., lump-sum service fee or discount line), set qty: null and uom: null — NEVER inherit the column header unit onto a row that has no number in that column.
d) Negative Discount Parsing:
   - Rows with "ส่วนลด", "หัก", "Discount", "Less" must extract negative amounts.
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py::test_single_pass_extract_prompt_has_visual_unit_and_discount_rules -v`
Expected: PASS

**Step 5: Commit**

```bash
git add config/prompts/single_pass_extract.md config/prompts/vision_table_rows.md tests/test_ocr_improvements.py
git commit -m "feat(prompts): add visual unit matching, header uom inheritance, and negative discount rules"
```

---

### Task 2: Safe Upstream Duplicate Page Separation with Continuation Guard

**Files:**
- Modify: `engine/src/system_a/perception/single_pass.py`
- Test: `engine/tests/test_single_pass.py`

**Step 1: Write failing tests for duplicate page pruning vs multi-page continuation preservation**

```python
def test_select_invoice_pages_drops_named_copy_with_same_doc_no():
    pages = [
        {"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "INV-101", "page_marker": None},
        {"page_no": 2, "doc_type": "tax_invoice", "copy_status": "copy", "doc_no_hint": "INV-101", "page_marker": None},
    ]
    res = select_invoice_pages(pages)
    assert res["selected"] == [1]

def test_select_invoice_pages_preserves_multipage_continuation():
    pages = [
        {"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "INV-101", "page_marker": None},
        {"page_no": 2, "doc_type": "tax_invoice", "copy_status": "original", "doc_no_hint": "INV-101", "page_marker": None},
    ]
    res = select_invoice_pages(pages)
    assert res["selected"] == [1, 2]
```

**Step 2: Run test to verify failure**

Run: `pytest tests/test_single_pass.py -k test_select_invoice_pages_drops_named_copy -v`
Expected: FAIL (currently keeps `[1, 2]`)

**Step 3: Implement safe pruning in `select_invoice_pages`**

In `single_pass.py`:
- Drop pages where `copy_status == "copy"` or zero-price delivery copy if an original sheet with the same `doc_no_hint` exists.
- If both are `copy_status == "original"` and have the same `doc_no_hint` without markers, keep both for continuation safety.

**Step 4: Run tests to verify pass**

Run: `pytest tests/test_single_pass.py -k test_select_invoice_pages -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/perception/single_pass.py tests/test_single_pass.py
git commit -m "feat(perception): safe upstream duplicate copy pruning with continuation guard"
```

---

### Task 3: Resilient Midstream Row Folding for Installments & Fuzzy Match

**Files:**
- Modify: `engine/src/system_a/domain/evidence.py`
- Test: `engine/tests/test_ocr_improvements.py`

**Step 1: Write failing tests for installment folding and fuzzy block matching**

```python
def test_collapse_repeated_copies_installment_without_subtotal_equality():
    # Table has 2 identical blocks of 2 lines (amounts: 17000, 17000, 17000, 17000)
    # subtotal is 10,200 (30% installment)
    # should fold to kept 2 lines
    ...

def test_collapse_repeated_copies_fuzzy_ocr_noise():
    # Line 1 in Block 2 has 158000 instead of 156000
    # should fold cleanly
    ...
```

**Step 2: Run tests to verify failure**

Run: `pytest tests/test_ocr_improvements.py -k test_collapse_repeated_copies -v`
Expected: FAIL

**Step 3: Implement fuzzy block match and installment decoupling in `evidence.py`**

- In `collapse_repeated_copies`:
  - If table cleanly divides into $k$ blocks with matching item codes / amounts ($\ge 80\%$ similarity), fold to Block 1.
  - For installment invoices, decouple requirement `abs(sum(amounts[:size]) - sub) <= tol` when identical line blocks repeat.

**Step 4: Run tests to verify pass**

Run: `pytest tests/test_ocr_improvements.py -k test_collapse_repeated_copies -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/evidence.py tests/test_ocr_improvements.py
git commit -m "feat(evidence): resilient midstream row folding for installments and fuzzy ocr noise"
```

---

### Task 4: Ghost Row Auto-Folding Guard & Self-Evidence Token Fallback

**Files:**
- Modify: `engine/src/system_a/domain/evidence.py`
- Test: `engine/tests/test_ocr_improvements.py`

**Step 1: Write failing tests for ghost row auto-folding and self-evidence fallback**

```python
def test_ghost_row_auto_folding_into_preceding_description():
    # If a line item has qty is None and unit_price is None and amount is None
    # but has description text (e.g. "COIL NO: A123 / PO: 45001")
    # Python code must fold text into preceding item's description and remove the empty row
    ...

def test_corroborate_dual_quantity_from_row_tokens():
    # Row has qty=1, price=35.70, amount=25025.70, and token "701" in description/cells
    # Should promote qty=701 and uom=KG with tag "arith:target_qty_found_in_row_tokens:701"
    # MUST NOT inspect Oracle receipt
    ...
```

**Step 2: Run test to verify failure**

Run: `pytest tests/test_ocr_improvements.py -k "test_ghost_row or test_corroborate_dual_quantity" -v`
Expected: FAIL

**Step 3: Implement ghost row auto-folding and self-corroboration in `evidence.py`**

- In row parsing / `corroborate_lines()`:
  - **Ghost Row Folding**: If any extracted row has `qty is None and unit_price is None and amount is None`, fold its description into the previous row with `desc = f"{prev.desc} {row.desc}"` and drop the empty row.
  - **Self-Corroboration**: If $qty \times unit\_price \neq amount$, compute $target\_qty = amount / unit\_price$. Inspect raw OCR cells and tokens of that row. If $target\_qty$ is physically present, update `qty = target_qty` with evidence tag `arith:target_qty_found_in_row_tokens:target_qty`.

**Step 4: Run test to verify pass**

Run: `pytest tests/test_ocr_improvements.py -k "test_ghost_row or test_corroborate_dual_quantity" -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/evidence.py tests/test_ocr_improvements.py
git commit -m "feat(evidence): ghost row auto-folding guard and self-evidence token fallback"
```

---

### Task 5: Business Rule Fast-Paths (V-05 Tax ID Fast-Path & V-08 Service Line Match)

**Files:**
- Modify: `engine/src/system_a/domain/rules.py`
- Modify: `engine/src/system_a/domain/v08.py`
- Test: `engine/tests/test_ocr_improvements.py`

**Step 1: Write failing tests for V-05 Tax ID 100% bypass and V-08 service line amount match**

```python
def test_v05_aapico_tax_id_fast_path():
    # Tax ID matches Aapico 100%, but name_match is None -> should PASS (no E07)
    ...

def test_v08_service_line_amount_match():
    # qty is None, uom is "JOB", receipt amount matches invoice amount -> should PASS
    ...
```

**Step 2: Run tests to verify failure**

Run: `pytest tests/test_ocr_improvements.py -k "test_v05_aapico or test_v08_service" -v`
Expected: FAIL

**Step 3: Implement V-05 fast-path & V-08 service line logic**

- In `v05_customer`: When `tax_id_match is True`, do not generate E07 for advisory name/address uncertainty when Tax ID is 100% corroborated.
- In `v08.py`: When `qty_inv is None` and line description is service charge with exact amount match, pass with `"service line amount match"`.

**Step 4: Run tests to verify pass**

Run: `pytest tests/test_ocr_improvements.py -k "test_v05_aapico or test_v08_service" -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/rules.py src/system_a/domain/v08.py tests/test_ocr_improvements.py
git commit -m "feat(rules): add v05 aapico tax id fast-path and v08 service line amount matching"
```

---

### Task 5B: Pure Numeric Line Pairing & Split-Line Aggregation (1:1, N:1, 1:N, M:N)

**Files:**
- Modify: `engine/src/system_a/domain/matching.py`
- Modify: `engine/src/system_a/domain/v08.py`
- Modify: `engine/src/system_a/domain/rules.py`
- Test: `engine/tests/test_ocr_improvements.py`

**Step 1: Write failing tests for UOM-agnostic numeric matching and 1:N / N:1 split lines**

```python
def test_numeric_pairing_ignores_uom_and_description_when_qty_price_amount_match():
    # Invoice line: qty=701, uom=None, unit_price=35.70, amount=25025.70, desc="COIL A"
    # Receipt line: qty=701, uom="KG", unit_price=35.70, amount=25025.70, desc="SPC590 STEEL"
    # Should PASS V-07 and V-08 without UOM mismatch or AI description check
    ...

def test_numeric_pairing_n_to_1_invoice_split_coils():
    # DMS-28 pattern: Invoice has 2 lines of (qty=701, price=35.70, amount=25025.70)
    # Oracle Receipt has 1 combined line of (qty=1402, price=35.70, amount=50051.40)
    # Should aggregate N:1 by unit_price and PASS V-07 and V-08
    ...

def test_numeric_pairing_1_to_n_receipt_split():
    # Invoice has 1 consolidated line of (qty=1000, price=50.00, amount=50000.00)
    # Oracle Receipt has 2 split lines of (qty=600, price=50.00, amount=30000.00) and (qty=400, price=50.00, amount=20000.00)
    # Should aggregate 1:N by unit_price and PASS V-07 and V-08
    ...
```

**Step 2: Run tests to verify failure**

Run: `pytest tests/test_ocr_improvements.py -k "test_numeric_pairing" -v`
Expected: FAIL

**Step 3: Implement pure numeric pairing and aggregation in `matching.py` & `v08.py`**

- In `matching.py`:
  - Enhance deterministic logic pairing before AI fallback:
    a) **Pure Numeric 1:1 Match**: When `qty`, `unit_price`, and `amount` match an unallocated receipt line within tolerance, pair as M1 even if `uom` is None or descriptions differ (description is advisory, not gating).
    b) **N:1 Split-Coil Invoice Aggregation**: When multiple invoice lines share the exact `unit_price` and their sum of `qty` and `amount` matches an unallocated receipt line of that same `unit_price` ($\sum qty_{inv} == qty_{rcv}$ and $\sum amount_{inv} \approx amount_{rcv}$), pair as N:1 deterministic group without delegating to AI.
    c) **1:N Split-Receipt Aggregation**: When one invoice line has `unit_price` and its `qty` and `amount` equal the sum of unallocated receipt lines with that same `unit_price` ($qty_{inv} == \sum qty_{rcv}$ and $amount_{inv} \approx \sum amount_{rcv}$), pair as 1:N deterministic group without delegating to AI.
- In `v08.py`:
  - Ensure UOM is treated as comparable when pure numeric price/qty/amount arithmetic confirms the match.

**Step 4: Run tests to verify pass**

Run: `pytest tests/test_ocr_improvements.py -k "test_numeric_pairing" -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/matching.py src/system_a/domain/v08.py tests/test_ocr_improvements.py
git commit -m "feat(matching): pure numeric line pairing and split-line aggregation (1:1, N:1, 1:N)"
```

---

### Task 6: Target Document Verification & Full Regression

**Files:**
- Test: `engine/tests/` (all engine unit tests)
- Test: `engine/src/test-portal/` (all portal unit tests)
- Verification script: `engine/scripts/audit_3call_benchmark.py`

**Step 1: Run full Pytest regression suite**

Run: `cd engine && pytest tests/ -q`
Expected: All tests pass (>= 129 passed).

Run: `cd engine/src/test-portal && pytest -q`
Expected: All tests pass (>= 153 passed).

**Step 2: Re-evaluate target cases**

Re-run target documents:
- HOLD targets: DMS-109, 112, 113, 86, 153, 40, 39.
- MANUAL_REVIEW targets: DMS-28, 33, 62, 89, 101, 37, 80, 174, 210.
- Safety multi-page continuation: DMS-179, 188.
Verify verdict transitions and record scorecard in `task.md`.

**Step 3: Update `docs/plans/task.md` and commit final verification**

```bash
git add docs/plans/task.md
git commit -m "docs: record verification for invoice separation and dual-quantity robustness"
```
