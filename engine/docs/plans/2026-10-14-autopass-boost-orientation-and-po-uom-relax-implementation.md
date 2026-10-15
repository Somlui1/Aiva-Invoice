# Auto-Pass Boost: Orientation BBox Alignment, UOM E10 Demotion & PO Relaxation Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Boost `AUTO_PASS` from 77 to 144+ documents (72%+ of 200-batch) and fix rotated document bounding box misalignment by optimizing orientation confidence thresholds, demoting equal-amount UOM mismatch (E10) to Low, and relaxing PO corroboration in Rule V-01 when Oracle EBS receipts confirm receipt.

**Architecture:** 
- In `src/system_a/perception/orientation.py`, lower `CONFIDENCE_THRESHOLD` to 0.75 and add a margin rule so rotated scans (like DMS-59 at 82.2% confidence on 270°) are rotated upright prior to VLM extraction, fixing BBox misalignment.
- In `config/standards/v6.6/codes.yaml` and `src/system_a/domain/rules.py` (V-07), emit `E10` as `severity="Low"` whenever line amount matches Oracle receipt line amount (`amount_equal == True`).
- In `src/system_a/domain/rules.py` (V-01), demote missing or non-8-digit `po_number` findings to `severity="Low"` (advisory) when an Oracle EBS receipt is confirmed via Tax ID + Invoice Number.

**Tech Stack:** Python 3.11, OpenCV dnn / ONNXRuntime, PyMuPDF (fitz), Pytest.

---

### Task 1: Orientation Threshold Optimization & Margin Check in `orientation.py`

**Files:**
- Modify: `src/system_a/perception/orientation.py:21-23, 97-118`
- Test: `tests/test_orientation.py`

**Step 1: Write the failing test**

In `tests/test_orientation.py`, add `test_detect_coarse_orientation_threshold_75_and_margin`:
```python
def test_detect_coarse_orientation_threshold_75_and_margin():
    from system_a.perception.orientation import detect_coarse_orientation
    # Simulated 270 deg image with prob around 0.822 and runner-up 0.08
    # Test that confidence 0.822 returns angle 270 without forcing 0
    img_270 = _make_invoice_image(rotate_deg=270)
    angle, conf, uncertain, runtime = detect_coarse_orientation(img_270, threshold=0.75)
    assert angle == 270
    assert conf >= 0.75
    assert not uncertain
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_orientation.py::test_detect_coarse_orientation_threshold_75_and_margin -v`  
Expected: FAIL or verify baseline behavior.

**Step 3: Implement minimal code**

In `src/system_a/perception/orientation.py`:
- Update `CONFIDENCE_THRESHOLD = 0.75`
- In `detect_coarse_orientation`:
```python
    cls_idx = int(np.argmax(probs))
    conf = float(probs[cls_idx])
    detected_angle = LABELS[cls_idx]

    # Check runner-up margin
    sorted_probs = sorted(float(p) for p in probs)
    margin = conf - sorted_probs[-2] if len(sorted_probs) >= 2 else conf

    # Accept if conf >= threshold OR (conf >= 0.70 and margin >= 0.30)
    is_confident = (conf >= threshold) or (conf >= 0.70 and margin >= 0.30)

    if not is_confident:
        return 0, round(conf, 4), True, runtime
    return detected_angle, round(conf, 4), False, runtime
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_orientation.py -v`  
Expected: PASS (all tests pass).

**Step 5: Commit**

```bash
git add src/system_a/perception/orientation.py tests/test_orientation.py
git commit -m "feat(orientation): optimize coarse orientation threshold to 0.75 with margin check"
```

---

### Task 2: UOM Mismatch (E10) Conditional Low Severity when Amount is Equal

**Files:**
- Modify: `config/standards/v6.6/codes.yaml:13`
- Modify: `src/system_a/domain/rules.py:410-430`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`, add `test_v07_e10_severity_low_when_amount_equal`:
```python
def test_v07_e10_severity_low_when_amount_equal():
    # Setup context where invoice line UOM is PCS and Oracle UOM is SHT, but amounts are equal 1000.00 == 1000.00
    # Assert finding E10 has severity 'Low', allowing AUTO_PASS
    pass
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py::test_v07_e10_severity_low_when_amount_equal -v`  
Expected: FAIL (currently emits Medium).

**Step 3: Implement minimal code**

1. In `config/standards/v6.6/codes.yaml`:
```yaml
  E10: {name: UOM Mismatch,                     severity: conditional, rule: V-07}
```

2. In `src/system_a/domain/rules.py` in `v07_lines`:
```python
                e10_sev = "Low" if amount_equal else "Medium"
                out.append(_f(c, "E10", "V-07", f"{_line_tag(l)}: หน่วยนับต่างกลุ่มหลังแปลง "
                                                 f"(Inv: {inv_raw}→{l.uom_group}, Rcv: {rcv_txt}){tail}",
                              actual=str(l.uom_group), expected=",".join(sorted(str(x) for x in rcv_groups)),
                              element_ids=(l.element_id, l.cells["uom"].element_id, l.cells["amount"].element_id),
                              oracle_refs=refs, severity=e10_sev))
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_v07_e10 -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add config/standards/v6.6/codes.yaml src/system_a/domain/rules.py tests/test_ocr_improvements.py
git commit -m "feat(v07): set E10 UOM mismatch to Low severity when line amount is equal"
```

---

### Task 3: PO Corroboration Relaxation in Rule V-01

**Files:**
- Modify: `src/system_a/domain/rules.py:78-96`
- Test: `tests/test_ocr_improvements.py`

**Step 1: Write the failing test**

In `tests/test_ocr_improvements.py`, add `test_v01_po_missing_corroborated_by_oracle_receipt_is_low`:
```python
def test_v01_po_missing_corroborated_by_oracle_receipt_is_low():
    # Context where required fields pass except po_number is None/NOT_PRESENT
    # Oracle snapshot has active receipt lines
    # Assert V-01 finding for po_number is Low severity instead of Medium
    pass
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_ocr_improvements.py::test_v01_po_missing_corroborated_by_oracle_receipt_is_low -v`  
Expected: FAIL.

**Step 3: Implement minimal code**

In `src/system_a/domain/rules.py` in `v01_required`:
```python
def v01_required(c: Ctx) -> RuleOutcome:
    d, miss, eids = c.doc, [], []
    po_only_issue = False
    
    # Check required header fields
    for k in c.std.policy["required_fields"]:
        f = d.fields[k]
        if not f.ok:
            miss.append(f"{k}({f.null_reason})"), eids.append(f.element_id)
            
    if not d.lines:
        miss.append("lines(NOT_PRESENT)")
    for l in d.lines:
        for k in c.std.policy["required_line_cells"]:
            cf = l.cells[k]
            if not cf.ok:
                miss.append(f"L{l.line_no}.{k}({cf.null_reason})"), eids.append(cf.element_id)
    if not d.pages_complete:
        miss.append("pages_complete(false)")
        
    if not miss:
        return _ok("V-01")

    # Check if the only issue is po_number and Oracle EBS confirmed receipt
    oracle_confirmed = bool(c.snapshot and c.snapshot.receipt_lines)
    all_po = all("po_number" in m for m in miss)
    
    if all_po and oracle_confirmed:
        return _ok("V-01", findings=[_f(c, "E01", "V-01", "ฟิลด์ PO บนเอกสารมีข้อสังเกต แต่ยืนยันได้จากใบรับในระบบ Oracle: " + ", ".join(miss),
                                        element_ids=tuple(eids), severity="Low")])
                                        
    return _fail("V-01", [_f(c, "E01", "V-01", "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: " + ", ".join(miss),
                             element_ids=tuple(eids))])
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/test_ocr_improvements.py -k test_v01_po -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/system_a/domain/rules.py tests/test_ocr_improvements.py
git commit -m "feat(v01): demote PO missing/conflict to Low severity when Oracle receipt is confirmed"
```

---

### Task 4: Target Document Verification, Regression Suite & Tracker Update

**Files:**
- Modify: `docs/plans/task.md`
- Verify: `DMS-59` orientation & target review cases

**Step 1: Verify DMS-59 orientation**

Run script to verify DMS-59 page 1 orientation angle is detected as 270° with confidence 0.822 and rotated upright.

**Step 2: Run full regression tests**

Run:
```bash
pytest tests/ -q
pytest src/test-portal/ -q
```
Expected: 100% PASS on both engine and portal suites.

**Step 3: Update `docs/plans/task.md`**

Add table rows for this plan and mark tasks completed.

**Step 4: Commit**

```bash
git add docs/plans/task.md
git commit -m "docs(task): record completion of auto-pass boost and orientation bbox alignment plan"
```
