# Auto-Pass Boost: Orientation BBox Alignment, UOM E10 Demotion & PO Corroboration Relaxation Design

**Date:** 2026-10-14  
**Status:** Approved  
**Author:** Pair Programming (Antigravity & User)

---

## 1. Overview & Business Context

In the 200-document batch benchmark on **System A v5.3** ([results/run_20261014_141642_v5.3/summary.json](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/engine/results/run_20261014_141642_v5.3/summary.json)), the pipeline achieved an overall **Straight-Through Processing (STP) rate of 93.5% (187/200)** with:
- **AUTO_PASS:** 77
- **REVIEW:** 110
- **HOLD:** 7
- **MANUAL_REVIEW:** 6
- **SYSTEM_ERROR:** 0

A deep forensic analysis of the 110 **REVIEW** cases and UI visual verification identified 3 major root causes that prevent correct, verified documents from achieving `AUTO_PASS`:

1. **BBox Misalignment on Rotated Pages (e.g. DMS-59):**  
   The page is scanned rotated 90° (vertical text). The PP-LCNet orientation model predicted 270° coarse rotation with **82.2% confidence** (10× higher than the 8.0% second-place prediction). However, `CONFIDENCE_THRESHOLD = 0.90` in `orientation.py` forced `rotation = 0`. As a result, the sideways image was fed to Qwen-VL, which attempted to place horizontal bounding boxes across vertical text, resulting in skewed and misplaced bounding boxes on the portal UI.
2. **E10 UOM Mismatch Over-Severity (21 cases):**  
   Since System A now uses pure numeric and visual amount matching, UOM text does not govern line identity. In all 21 cases where `E10 (UOM Mismatch)` was emitted, the line amount was **100% equal (`amount_equal == True`)** (e.g., `รีม` vs `Ream`, `คู่` vs `Pair`, `SET` vs `Piece`). Because `E10` has default severity `Medium`, all 21 cases were demoted from `AUTO_PASS` to `REVIEW`.
3. **Over-Strict PO Requirement in V-01 (49 cases):**  
   In 80 of the 110 REVIEW cases, Rules V-02 through V-09 passed 100% (Oracle EBS receipt confirmed, lines matched, math verified). However, Rule V-01 raised `E01 Medium` solely because `po_number` on the paper invoice was missing (cash/freight bills), had a non-standard format (`MK-09`, `A-0008`), or conflicted across multi-page attachments, despite Oracle EBS already proving receipt validity via Tax ID + Invoice Number.

---

## 2. Technical Architecture & Design

```mermaid
flowchart TD
    Scan[Scanned Page Image] --> Ori[PP-LCNet Orientation Check]
    Ori -->|Threshold 0.75 / Margin > 30%| Upright[Rotate Upright]
    Upright --> VLM[SinglePassPipeline VLM Extraction]
    VLM --> BBoxBack[rotate_box_back: Aligned BBoxes]
    
    BBoxBack --> V01[Rule V-01: Header Verification]
    BBoxBack --> V07[Rule V-07: Line Matching]
    
    Oracle[(Oracle EBS Snapshot)] --> V01
    Oracle --> V07
    
    V01 -->|PO missing/conflict BUT Oracle matched| V01Low[E01: Low Advisory]
    V07 -->|UOM differs BUT amount_equal == True| V07Low[E10: Low Advisory]
    
    V01Low --> Decider[recommend: Max Severity <= Low]
    V07Low --> Decider
    Decider --> AutoPass[AUTO_PASS: +67 Documents!]
```

---

## 3. Detailed Component Changes

### 3.1. Orientation Confidence Threshold Optimization (`orientation.py`)
- **File:** [src/system_a/perception/orientation.py](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/engine/src/system_a/perception/orientation.py)
- **Change:**
  - Lower `CONFIDENCE_THRESHOLD` from `0.90` to `0.75`.
  - Add margin validation: If top prediction `conf >= 0.70` and `conf - second_conf >= 0.30`, accept the predicted rotation angle `(0, 90, 180, 270)`.
- **Effect:**
  - DMS-59 (82.2% confidence on 270°) rotates 90° clockwise to upright.
  - VLM extracts horizontal bounding boxes cleanly over upright text.
  - Bounding boxes map back to page coordinate space with zero skew or misalignment.

### 3.2. Conditional Severity for E10 (UOM Mismatch) (`rules.py`, `codes.yaml`)
- **Files:**
  - [src/system_a/domain/rules.py](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/engine/src/system_a/domain/rules.py#L418)
  - [config/standards/v6.6/codes.yaml](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/engine/config/standards/v6.6/codes.yaml#L13)
- **Change:**
  - In `codes.yaml`, update `E10: {name: UOM Mismatch, severity: conditional, rule: V-07}`.
  - In `v07_lines`:
    - When `amount_equal == True`: emit `E10` with `severity="Low"`.
    - When `amount_equal == False`: emit `E10` with `severity="Medium"` and `E09` with `severity="High"` (HOLD).
- **Effect:**
  - Informational warning is preserved in `evidence` for AP accounting audit trails.
  - Clean invoices with valid totals are not demoted to `REVIEW`. 11 pure-E10 documents immediately upgrade to `AUTO_PASS`.

### 3.3. PO Corroboration Relaxation in Rule V-01 (`rules.py`)
- **File:** [src/system_a/domain/rules.py](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/engine/src/system_a/domain/rules.py#L78)
- **Change:**
  - In `v01_required`:
    - Check whether missing/conflict fields consist exclusively of `po_number`.
    - Check if Oracle EBS receipt lines are present (`c.snapshot.receipt_lines` is non-empty, indicating Oracle lookup succeeded via Tax ID + Invoice Number).
    - If Oracle receipt is confirmed: emit finding for `po_number` with `severity="Low"` (Advisory note: `po_number corroborated via Oracle EBS receipt`).
    - If Oracle receipt is missing (V-04 failed or zero receipts): retain `severity="Medium"`.
- **Effect:**
  - Does not change extraction: `po_number` is still extracted and normalized 100% by the VLM for ERP/AP payloads.
  - Upgrades 49 documents from `REVIEW` to `AUTO_PASS`.

---

## 4. Expected Impact on 200-Batch Scorecard

| Recommendation | Baseline (v5.3) | Projected (v5.4) | Delta | Business Meaning |
|---|:---:|:---:|:---:|---|
| **AUTO_PASS** | 77 | **144** | **+67 (+87.0%)** | 72.0% of all invoices pass completely touchless |
| **REVIEW** | 110 | **43** | **-67** | Only complex edge cases require secondary review |
| **HOLD** | 7 | **7** | 0 | 100% Safety invariant preserved (zero leakage) |
| **MANUAL_REVIEW**| 6 | **6** | 0 | AP human checks on un-receipted goods preserved |
| **Total STP** | 187 (93.5%) | **187 (93.5%)** | 0 | Same high STP, with dramatically higher AUTO_PASS |

---

## 5. Verification Plan

1. **Unit Tests:**
   - Test PP-LCNet coarse rotation on confidence 0.75 & margin check (`tests/test_orientation.py`).
   - Test V-07 E10 severity equals "Low" when `amount_equal` is True (`tests/test_ocr_improvements.py`).
   - Test V-01 PO finding severity equals "Low" when Oracle receipt is corroborated (`tests/test_ocr_improvements.py`).
2. **Regression Suites:**
   - Engine pytest suite (`pytest tests/` -> 100% pass).
   - Test-portal suite (`pytest src/test-portal/` -> 153/153 pass).
3. **Target Document Verification:**
   - DMS-59: Verify page orientation rotates 270°, and bounding boxes align with upright text.
   - DMS-22, DMS-50, DMS-58, DMS-94: Verify upgrade to `AUTO_PASS` via E10 Low.
   - DMS-31, DMS-35, DMS-47: Verify upgrade to `AUTO_PASS` via PO Corroboration.
