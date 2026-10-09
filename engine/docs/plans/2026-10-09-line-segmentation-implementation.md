# Amount-Anchored Line Segmentation & Dual-Quantity Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Resolve invoice row merging on borderless multi-line tables, accurately parse dual-quantity rows (Sheet vs KG), and fix N:1 relation quantity checks in Rule V-08.

**Architecture:** Anchor row segmentation on printed `amount` and `unit_price` tokens across Perception Prompts and Fallback parsers. Enhance `cells_from_row_text()` with dual-quantity arithmetic matching, protect `rows_from_line_items()` from dropping rows with currency tokens, update `uom_groups.yaml` with missing standard units (TRIP, BOOK), and adapt Rule V-08 to aggregate invoice quantities for N:1 matching groups.

**Tech Stack:** Python 3.10+, Pytest, PyMuPDF, LiteLLM, PyYAML, Regular Expressions.

---

### Task 1: Add Missing UOM Groups (TRIP, BOOK) to Standards

**Files:**
- Modify: `config/standards/v6.6/uom_groups.yaml:30-36`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`:
```python
def test_standard_uom_groups_include_trip_and_book():
    from system_a.domain.standard import load_standard
    std = load_standard()
    assert std.uom_group("TRIP") == "TRIP"
    assert std.uom_group("เที่ยว") == "TRIP"
    assert std.uom_group("TP") == "TRIP"
    assert std.uom_group("BOOK") == "BOOK"
    assert std.uom_group("เล่ม") == "BOOK"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py -k test_standard_uom_groups_include_trip_and_book -v`
Expected: FAIL (AssertionError or None != 'TRIP')

**Step 3: Write minimal implementation**

In `config/standards/v6.6/uom_groups.yaml`:
```yaml
# TRIP: เที่ยว / trip
TRIP:  [TRIP, TP, เที่ยว]
# BOOK: เล่ม / book
BOOK:  [BOOK, เล่ม]
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_standard_uom_groups_include_trip_and_book -v`
Expected: PASS

**Step 5: Commit**

```bash
git add config/standards/v6.6/uom_groups.yaml tests/test_ocr_improvements.py
git commit -m "feat(standards): add TRIP and BOOK to uom_groups"
```

---

### Task 2: Enhance `cells_from_row_text()` to Handle Dual-Quantity Rows

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py:1042-1081`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`:
```python
def test_cells_from_row_text_dual_quantities():
    t1 = "MB3B-41111K34/35-A WSS-M1A367-A45 FILL FLR TNL REINF RH/LH 2.00x940.00xC 667877 1 3,006 49.940 KG 150,119.64"
    c1 = vp.cells_from_row_text(t1)
    assert c1 is not None
    assert c1["qty"] == "3,006" or c1["qty"] == "3006"
    assert c1["uom"] == "KG"
    assert c1["unit_price"] == "49.940"
    assert c1["amount"] == "150,119.64"

    t2 = "MB3B-41111K34/35-A WSS-M1A367-A45 FILL FLR TNL REINF RH/LH 2.00x940.00xC 667877 1 2,906 49.940 KG 145,125.64"
    c2 = vp.cells_from_row_text(t2)
    assert c2 is not None
    assert c2["qty"] == "2,906" or c2["qty"] == "2906"
    assert c2["uom"] == "KG"
    assert c2["unit_price"] == "49.940"
    assert c2["amount"] == "145,125.64"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py -k test_cells_from_row_text_dual_quantities -v`
Expected: FAIL (AssertionError: assert None is not None)

**Step 3: Write minimal implementation**

In `src/system_a/perception/vision_pipeline.py`:
Update `cells_from_row_text()`:
Support dual-quantity pattern where 2 numbers precede `unit_price`, `uom`, and `amount` (e.g. `1 3,006 49.940 KG 150,119.64`).
Use arithmetic validation $\text{qty} \times \text{unit\_price} \approx \text{amount} \pm 0.01$ to disambiguate the true billing quantity.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_cells_from_row_text_dual_quantities -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py tests/test_ocr_improvements.py
git commit -m "feat(perception): support dual-quantity arithmetic resolution in cells_from_row_text"
```

---

### Task 3: Prevent False Merging of Rows in `rows_from_line_items()` & `merge_duplicate_rows()`

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py:908-936, 1026-1033`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`:
```python
def test_rows_from_line_items_does_not_merge_rows_with_money():
    read = vp.PageRead(page_no=1, items=[
        {"label": "line_1", "text": "PART A 1 PCS 100.00 100.00", "bbox": (0.01, 0.25, 0.9, 0.05)},
        {"label": "line_2", "text": "PART B 1 PCS 100.00 100.00", "bbox": (0.01, 0.35, 0.9, 0.05)},
    ])
    rows = vp.rows_from_line_items(read)
    assert len(rows) == 2

def test_merge_duplicate_rows_preserves_separated_rows():
    rows = [
        {"line_no": 1, "bbox": (0.01, 0.25, 0.9, 0.04), "cells": {"qty": {"text": "1"}, "unit_price": {"text": "100.00"}, "amount": {"text": "100.00"}}},
        {"line_no": 2, "bbox": (0.01, 0.35, 0.9, 0.04), "cells": {"qty": {"text": "1"}, "unit_price": {"text": "100.00"}, "amount": {"text": "100.00"}}},
    ]
    kept, notes = vp.merge_duplicate_rows(rows, page=1)
    assert len(kept) == 2
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py -k "test_rows_from_line_items_does_not_merge_rows_with_money or test_merge_duplicate_rows_preserves_separated_rows" -v`
Expected: Check current behavior.

**Step 3: Write minimal implementation**

In `src/system_a/perception/vision_pipeline.py`:
1. In `rows_from_line_items`: Only merge `it` into previous row if `it["text"]` contains no decimal currency amounts.
2. In `merge_duplicate_rows`: Ensure vertical gap / non-overlapping lines are never merged even if quantities and prices match.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k "test_rows_from_line_items_does_not_merge_rows_with_money or test_merge_duplicate_rows_preserves_separated_rows" -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py tests/test_ocr_improvements.py
git commit -m "fix(perception): prevent false row merging for borderless invoice rows"
```

---

### Task 4: Update Table Rows Prompt for Borderless & Dual-Quantity Tables

**Files:**
- Modify: `config/prompts/vision_table_rows.md:14-29`
- Test: Inspection & validation

**Step 1: Write modification to prompt**

In `config/prompts/vision_table_rows.md`:
Clarify Rule 2:
- State that distinct printed `amount` tokens strictly denote independent rows.
- Clarify dual quantity: When two quantity columns are printed (e.g. `แผ่น` and `กิโลกรัม`), pick the quantity matching the unit of measure of `unit_price`.

**Step 2: Verify prompt syntax and loadability**

Run: `python -c "from system_a.domain.standard import load_prompt; print(load_prompt('vision_table_rows')[:100])"`
Expected: Prints prompt header successfully.

**Step 3: Commit**

```bash
git add config/prompts/vision_table_rows.md
git commit -m "docs(prompts): update vision_table_rows for borderless tables and dual quantities"
```

---

### Task 5: Fix Rule V-08 for N:1 Matching Groups

**Files:**
- Modify: `src/system_a/domain/v08.py:30-48`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`:
```python
def test_v08_n_to_1_group_passes_when_sum_matches():
    from decimal import Decimal
    from system_a.domain.contracts import InvoiceDoc, NField, NLine, ReceiptRow
    from system_a.domain.matching import MatchGroup
    from system_a.domain.standard import load_standard
    from system_a.domain.v08 import build_payload

    l1 = NLine(1, "D1-L1", {"description": NField("description", "d1", "A", "A", 1.0, True, None),
                           "qty": NField("qty", "q1", "3006", Decimal("3006"), 1.0, True, None)}, "KG", ())
    l2 = NLine(2, "D1-L2", {"description": NField("description", "d2", "B", "B", 1.0, True, None),
                           "qty": NField("qty", "q2", "2906", Decimal("2906"), 1.0, True, None)}, "KG", ())
    doc = InvoiceDoc("D1", {}, (l1, l2), {}, True)
    r1 = ReceiptRow(176, "RCV1", "Rec", 1, "Item", Decimal("5912"), "Kilogram", Decimal("49.94"), Decimal("295245.28"), {})
    group = MatchGroup("G1", (1, 2), ("RCV1-1",), "N:1", "M3", 0.9, "ai", "Matched")

    payload, expected = build_payload(doc, [group], {"RCV1-1": r1}, load_standard())
    assert expected[1][0] == "pass"
    assert expected[2][0] == "pass"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py -k test_v08_n_to_1_group_passes_when_sum_matches -v`
Expected: FAIL (AssertionError: assert 'fail' == 'pass')

**Step 3: Write minimal implementation**

In `src/system_a/domain/v08.py`:
When `g.relation == "N:1"`:
Compute $\text{inv\_qty\_sum} = \sum_{n \in g.\text{invoice\_line\_nos}} \text{lines}[n].v(\text{"qty"})$.
If $\text{inv\_qty\_sum} == rsum$, set `expected[n] = ("pass", None)`.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_v08_n_to_1_group_passes_when_sum_matches -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/v08.py tests/test_ocr_improvements.py
git commit -m "fix(domain): support N:1 relation quantity matching in V-08"
```

---

### Task 6: Full Regression and Golden Schema Verification

**Files:**
- Test: All tests in `tests/` and sandbox scenarios

**Step 1: Run pytest suite**

Run: `pytest -q tests`
Expected: All tests PASS.

**Step 2: Run sandbox golden integrity**

Run: `python -m system_a.sandbox.scenarios --golden --schema`
Expected: PASS.
