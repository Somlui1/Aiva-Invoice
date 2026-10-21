# LLM-Driven Orientation, Line BBox Sanitization & AUTO_PASS Integrity Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate vertical column bounding box distortions and orientation misclassifications by transitioning orientation detection to Qwen VLM in the Classify step, enforcing geometric row sanitization ([x1, y1, x2, y2] with aspect ratio $\ge 1.5$), and safeguarding AUTO_PASS via row overlap collision checks and unit-price grouping.

**Architecture:** Remove PP-LCNet pre-classification rotation and fine skew adjustments; classify pages at $0^\circ$ and let Qwen return rotation `r` (0/90/180/270); rotate only when $r \neq 0$; compute horizontal row bounding boxes using skew-aware cell union with median outlier filtering ($\pm 0.05$); guard AUTO_PASS through geometric grounding and unit-price group validation.

**Tech Stack:** Python 3.11+, PyMuPDF (fitz), OpenCV, NumPy, Pydantic, LiteLLM (Qwen 3.8 Flash), Pytest.

---

### Task 1: Prompt Update for Orientation `r` in Classify & Removal of PP-LCNet in `single_pass.py`

**Files:**
- Modify: `config/prompts/single_pass_classify.md`
- Modify: `src/system_a/perception/single_pass.py:490-545`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

```python
def test_single_pass_classify_orientation_prompt_parsing():
    from system_a.perception.single_pass import normalize_classify
    # Test that normalize_classify captures 'r' orientation from LLM
    raw_response = {
        "pages": [
            {"p": 1, "t": "tax_invoice", "c": "original", "n": "TLP-001", "m": "1/1", "r": 0},
            {"p": 2, "t": "tax_invoice", "c": "original", "n": "TLP-001", "m": "2/2", "r": 270}
        ]
    }
    classified = normalize_classify(raw_response, 2)
    assert len(classified) == 2
    assert classified[0]["rotate_degrees"] == 0
    assert classified[1]["rotate_degrees"] == 270
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py::test_single_pass_classify_orientation_prompt_parsing -v`
Expected: FAIL or verify baseline behavior.

**Step 3: Write minimal implementation**

1. In `config/prompts/single_pass_classify.md`, add `- "r": rotation degrees needed to make this page upright: 0 | 90 | 180 | 270 (degrees clockwise to read upright, 0 if already upright)` and bump version to `1.3.0`.
2. In `single_pass.py:normalize_classify`, ensure `r = int(e.get("r") if e.get("r") is not None else e.get("rotate_degrees") or 0)` is mapped to `rotate_degrees`.
3. In `single_pass.py:SinglePassPipeline.extract_pdf`:
   - Remove `detect_page_orientation` before Classify.
   - Render unrotated 80 DPI pages for Classify.
   - For extraction (150 DPI), check `classified[p-1]["rotate_degrees"]`. If $r \neq 0$, call `rotate_image(orig_img, r)`. If $r == 0$, bypass rotation completely.
   - Record orientation in `page_orientations` as `OrientationResult(r=r, confidence=1.0, uncertain=False, skew=0.0, total=float(r), runtime="vlm_classify")`.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py::test_single_pass_classify_orientation_prompt_parsing -v`
Expected: PASS

**Step 5: Commit**

```bash
git add config/prompts/single_pass_classify.md src/system_a/perception/single_pass.py tests/test_ocr_improvements.py
git commit -m "feat(perception): transition orientation detection to VLM in classify step and remove PP-LCNet pre-rotation"
```

---

### Task 2: Coordinate Sanitization, Clamping & Swapping in `coords.py`

**Files:**
- Modify: `src/system_a/perception/coords.py`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

```python
def test_coordinate_sanitization_rules():
    from system_a.perception.coords import sanitize_xyxy
    # 1. Auto-rescaling 0-1000 -> 0.0-1.0
    assert sanitize_xyxy([100, 200, 900, 400]) == [0.1, 0.2, 0.9, 0.4]
    
    # 2. Coordinate swapping (x1 > x2, y1 > y2)
    assert sanitize_xyxy([0.9, 0.4, 0.1, 0.2]) == [0.1, 0.2, 0.9, 0.4]
    
    # 3. Severe out-of-bounds rejection (< -0.10 or > 1.10)
    assert sanitize_xyxy([-0.15, 0.2, 0.9, 0.4]) is None
    assert sanitize_xyxy([0.1, 0.2, 1.25, 0.4]) is None
    
    # 4. Clamping small tolerance [-0.10, 1.10] -> [0.0, 1.0]
    assert sanitize_xyxy([-0.05, 0.1, 1.05, 0.3]) == [0.0, 0.1, 1.0, 0.3]
    
    # 5. Zero-area check
    assert sanitize_xyxy([0.5, 0.5, 0.5005, 0.5005]) is None
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py::test_coordinate_sanitization_rules -v`
Expected: FAIL with "ImportError: cannot import name 'sanitize_xyxy'"

**Step 3: Write minimal implementation**

Implement `sanitize_xyxy(box: Sequence[float], tol: float = 0.10) -> Optional[list[float]]` in `src/system_a/perception/coords.py`:
- Check length == 4 and numeric conversion.
- Rescale if any coordinate $> 1.5$ and $\le 1100$.
- Swap points: $x_1 = \min(x_1, x_2), x_2 = \max(x_1, x_2), y_1 = \min(y_1, y_2), y_2 = \max(y_1, y_2)$.
- If $x_1 < -\text{tol}$ or $y_1 < -\text{tol}$ or $x_2 > 1.0 + \text{tol}$ or $y_2 > 1.0 + \text{tol}$: return None.
- Clamp into $[0.0, 1.0]$: $x_1 = \max(0.0, x_1), y_1 = \max(0.0, y_1), x_2 = \min(1.0, x_2), y_2 = \min(1.0, y_2)$.
- If $(x_2 - x_1) \le 0.001$ or $(y_2 - y_1) \le 0.001$: return None.
- Return rounded `[round(x1, 4), round(y1, 4), round(x2, 4), round(y2, 4)]`.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py::test_coordinate_sanitization_rules -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/perception/coords.py tests/test_ocr_improvements.py
git commit -m "feat(coords): add sanitize_xyxy with auto-rescaling, point swapping, out-of-bounds rejection, and clamping"
```

---

### Task 3: Skew-Tolerant Cell Union & Geometric Sanity Check in `single_pass.py`

**Files:**
- Modify: `config/prompts/single_pass_extract.md`
- Modify: `src/system_a/perception/single_pass.py:85-100, 350-370`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

```python
def test_skew_aware_cell_union_and_aspect_ratio_sanity():
    from system_a.perception.single_pass import compute_row_bbox_from_cells, validate_line_bbox
    
    # 1. Cell union with vertical outlier filtering (y_center difference > 0.05 excluded)
    cells = {
        "item_code": {"bbox_2d": [0.05, 0.30, 0.20, 0.32]},
        "description": {"bbox_2d": [0.22, 0.30, 0.60, 0.33]},
        "amount": {"bbox_2d": [0.80, 0.31, 0.95, 0.33]},
        "outlier": {"bbox_2d": [0.50, 0.85, 0.60, 0.88]}, # Outlier at bottom of page
    }
    union_box = compute_row_bbox_from_cells(cells)
    assert union_box is not None
    assert union_box[0] == 0.05 # min_x
    assert union_box[1] == 0.30 # min_y
    assert union_box[2] == 0.95 # max_x
    assert union_box[3] == 0.33 # max_y
    
    # 2. Geometric sanity check: aspect ratio >= 1.5
    # Normal horizontal box: width=0.90, height=0.03 -> aspect ratio 30.0 -> Valid
    assert validate_line_bbox([0.05, 0.30, 0.95, 0.33]) is True
    # Vertical column box: width=0.08, height=0.55 -> aspect ratio 0.145 -> Invalid!
    assert validate_line_bbox([0.44, 0.27, 0.52, 0.82]) is False
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py::test_skew_aware_cell_union_and_aspect_ratio_sanity -v`
Expected: FAIL with "ImportError: cannot import name 'compute_row_bbox_from_cells'"

**Step 3: Write minimal implementation**

1. In `single_pass.py`:
   - Implement `compute_row_bbox_from_cells(cells: dict, table_bbox: Optional[list] = None) -> Optional[list[float]]`:
     - Sanitize each cell's `bbox_2d` using `sanitize_xyxy`.
     - Calculate $y_{\text{center}} = (y_1 + y_2) / 2$ for each sanitized cell box.
     - Find `median_y_center` using `statistics.median`.
     - Keep cells where $|y_{\text{center}} - \text{median\_y\_center}| \le 0.05$.
     - Union kept cells: $\min(x_1), \min(y_1), \max(x_2), \max(y_2)$.
     - If `table_bbox` provided, pad $x_1 = \min(x_1, \text{table\_bbox}[0])$ and $x_2 = \max(x_2, \text{table\_bbox}[2])$.
   - Implement `validate_line_bbox(box: Optional[list[float]]) -> bool`:
     - Check sanitized box: $\text{width} = x_2 - x_1$, $\text{height} = y_2 - y_1$.
     - Return True if $(\text{width} / \text{height}) \ge 1.5$ and $\text{width} \ge 0.45$ and $\text{height} \le 0.25$.
   - In `build_extraction` row builder:
     - Check `row.get("line_bbox")`. If `validate_line_bbox` passes, use it.
     - Else, fallback to `compute_row_bbox_from_cells(row)`.
     - If fallback passes, use it; otherwise assign `region = None`.
2. In `config/prompts/single_pass_extract.md`:
   - Explicitly define `"line_bbox": [x1, y1, x2, y2]` as normalized $0.00-1.00$ horizontal rectangle across all columns from code/description to amount. Bump version to `1.2.0`.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py::test_skew_aware_cell_union_and_aspect_ratio_sanity -v`
Expected: PASS

**Step 5: Commit**

```bash
git add config/prompts/single_pass_extract.md src/system_a/perception/single_pass.py tests/test_ocr_improvements.py
git commit -m "feat(perception): enforce horizontal row geometric sanity and skew-aware cell union fallback"
```

---

### Task 4: Grounding Gate & Row Overlap Collision Check in `rules.py` (V-01 / V-07)

**Files:**
- Modify: `src/system_a/domain/rules.py:80-120`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

```python
def test_geometric_grounding_gate_and_row_overlap_collision():
    from system_a.domain.rules import check_row_geometry_and_overlap
    from system_a.domain.contracts import NDoc, NLine, Region
    
    # 1. Missing or ungrounded bbox on active line fails gate
    line1 = NLine(line_no=1, description="ITEM 1", qty=Decimal("1"), unit_price=Decimal("100"), amount=Decimal("100"),
                  region=None, cells={})
    assert check_row_geometry_and_overlap([line1]) == ["L1.bbox(UNGROUNDED_GEOMETRY)"]
    
    # 2. Overlapping rows (IoMin_y > 0.50) on same page fail gate
    # Line A: y from 0.30 to 0.34 (height 0.04)
    # Line B: y from 0.31 to 0.35 (height 0.04, overlap 0.03 -> ratio 0.75 > 0.50)
    lineA = NLine(line_no=1, description="ITEM 1", region=Region(page=1, bbox=(0.05, 0.30, 0.90, 0.04)), cells={})
    lineB = NLine(line_no=2, description="ITEM 2", region=Region(page=1, bbox=(0.05, 0.31, 0.90, 0.04)), cells={})
    assert len(check_row_geometry_and_overlap([lineA, lineB])) > 0
    
    # 3. Clean separated rows pass gate
    lineC = NLine(line_no=1, description="ITEM 1", region=Region(page=1, bbox=(0.05, 0.30, 0.90, 0.03)), cells={})
    lineD = NLine(line_no=2, description="ITEM 2", region=Region(page=1, bbox=(0.05, 0.34, 0.90, 0.03)), cells={})
    assert check_row_geometry_and_overlap([lineC, lineD]) == []
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py::test_geometric_grounding_gate_and_row_overlap_collision -v`
Expected: FAIL with "ImportError: cannot import name 'check_row_geometry_and_overlap'"

**Step 3: Write minimal implementation**

1. In `rules.py`, implement `check_row_geometry_and_overlap(lines: Sequence[NLine]) -> list[str]`:
   - For each line $l$, ensure `l.region is not None and l.region.bbox is not None`.
   - Check aspect ratio: $w / h \ge 1.2$. If invalid, add `f"L{l.line_no}.bbox(UNGROUNDED_GEOMETRY)"`.
   - Group lines by `page = l.region.page`.
   - Sort by line order. For consecutive pairs $(i, j)$:
     - Check monotonic vertical order: $y_{\text{center}, j} \ge y_{\text{center}, i} - 0.01$. If violated, add `f"L{j.line_no}.order(INVERTED_ROW_SEQUENCE)"`.
     - Compute $\text{overlap\_y} = \max(0.0, \min(y_{2,i}, y_{2,j}) - \max(y_{1,i}, y_{1,j}))$.
     - $\text{overlap\_ratio} = \text{overlap\_y} / \min(h_i, h_j)$.
     - If $\text{overlap\_ratio} > 0.50$, add `f"L{j.line_no}.overlap(COLLISION_RATIO_{overlap_ratio:.2f})"`.
2. In `v01_required`:
   - Call `geo_errs = check_row_geometry_and_overlap(d.lines)`.
   - If `geo_errs`: add to `miss`.
   - Ensure that `geo_errs` CANNOT be demoted by Oracle PO advisory (it emits `_fail("V-01", [_f(..., "E01", sev="Medium", detail="พิกัดบรรทัดสินค้าบนเอกสารไม่สมบูรณ์หรือไม่สอดคล้องกับโครงสร้างตาราง: " + ...)])`).

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py::test_geometric_grounding_gate_and_row_overlap_collision -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/rules.py tests/test_ocr_improvements.py
git commit -m "feat(rules): enforce line bbox grounding and row overlap collision gate in rule V-01"
```

---

### Task 5: V-08 Unit-Price Grouping & Subtotal Sum Validation in `v08.py`

**Files:**
- Modify: `src/system_a/domain/v08.py`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

```python
def test_v08_unit_price_grouping_and_subtotal_sum():
    from system_a.domain.v08 import validate_unit_price_groups
    from system_a.domain.contracts import ReceiptRow, NLine
    from decimal import Decimal
    
    # 2 invoice lines with unit_price 1,200 (Line 1: qty 1, Line 2: qty 1 -> sum_qty 2, sum_amt 2400)
    # Oracle has only 1 receipt row with qty 1, amount 1200
    inv_lines = [
        NLine(line_no=1, qty=Decimal("1"), unit_price=Decimal("1200"), amount=Decimal("1200"), cells={}),
        NLine(line_no=2, qty=Decimal("1"), unit_price=Decimal("1200"), amount=Decimal("1200"), cells={})
    ]
    orc_rows = [
        ReceiptRow(rcv_line_id="1-1", line=1, qty=Decimal("1"), unit_price=Decimal("1200"), line_amount=Decimal("1200"))
    ]
    # Should detect quantity mismatch for unit price group 1,200
    errors = validate_unit_price_groups(inv_lines, orc_rows)
    assert len(errors) > 0
    assert "unit_price:1200.00" in errors[0]
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py::test_v08_unit_price_grouping_and_subtotal_sum -v`
Expected: FAIL with "ImportError: cannot import name 'validate_unit_price_groups'"

**Step 3: Write minimal implementation**

In `v08.py`:
- Implement `validate_unit_price_groups(lines: Sequence[NLine], rcv_rows: Sequence[ReceiptRow], tol: Decimal = Decimal("0.02")) -> list[str]`:
  - Group invoice lines by quantized `unit_price`: compute `sum_qty` and `sum_amount`.
  - Group active Oracle receipt rows by quantized `unit_price`: compute `sum_qty` and `sum_amount`.
  - For each price group present on invoice:
    - Compare `sum_qty` and `sum_amount` against Oracle.
    - If $| \text{sum\_qty}_{\text{inv}} - \text{sum\_qty}_{\text{orc}} | > tol$ or $| \text{sum\_amount}_{\text{inv}} - \text{sum\_amount}_{\text{orc}} | > tol$:
      - Record mismatch error.
- Integrate into `evaluate_v08_lines`: if group validation fails, flag finding rather than passing silently on coincidence.

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py::test_v08_unit_price_grouping_and_subtotal_sum -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/system_a/domain/v08.py tests/test_ocr_improvements.py
git commit -m "feat(v08): add unit-price grouping and subtotal sum validation against double-counting and hallucinations"
```

---

### Task 6: Target Document Verification (DMS-25, DMS-26, DMS-22) & Full Regression Suite

**Files:**
- Test: `tests/test_ocr_improvements.py`
- Verify target documents: DMS-25 (Top Laser), DMS-26 (Tool Management), DMS-22 (10-line AIVA invoice)

**Step 1: Execute single-pass run on DMS-25, DMS-26, DMS-22**

Run:
```bash
python scripts/test_paperless_invoices.py --doc-id 25 --out-dir results/test_dms25_fix
python scripts/test_paperless_invoices.py --doc-id 26 --out-dir results/test_dms26_fix
python scripts/test_paperless_invoices.py --doc-id 22 --out-dir results/test_dms22_fix
```

**Step 2: Inspect output bounding boxes**

Verify using python script:
- DMS-25 Page 2 has `rotation == 0` (no 270° rotation).
- All 4 lines of DMS-25 have `width > height` and aspect ratio $\ge 1.5$.
- DMS-26 multi-page lines are segregated cleanly by page.
- DMS-22 all 10 lines have horizontal row bounding boxes.

**Step 3: Run full engine & portal regression test suites**

Run:
```bash
python -m pytest -q
cd src/test-portal && python -m pytest -q && cd ../..
```
Expected: All tests PASS with exit status 0.

**Step 4: Commit and update tracker**

```bash
git add docs/plans/task.md
git commit -m "chore: complete LLM orientation and line bbox sanitization plan verification pass"
```
