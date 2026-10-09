# Design Document: Streamlining MANUAL_REVIEW into REVIEW and AUTO_PASS

**Date:** 2026-10-09  
**Status:** Approved  
**Author:** Pair Programming Session  

---

## 1. Context & Executive Summary

In batch test run `run_20261009_121019` across all 125 documents:
- `AUTO_PASS`: 54 (43.2%)
- `REVIEW`: 20 (16.0%)
- `HOLD`: 8 (6.4%)
- `MANUAL_REVIEW`: 43 (34.4%)
- `SYSTEM_ERROR`: 0

Analysis of all 43 `MANUAL_REVIEW` cases revealed that **41 out of 43 documents (95.3%)** are not financial or matching failures. Their core matching passed 100%:
- Invoice number exists and is verified.
- Supplier and PO number match Oracle EBS.
- Line items match Oracle receipts (or are confirmed milestone fractions).
- Monetary totals (`lines_sum`, `sub_total`, `grand_total`) equal Oracle EBS receipts with 0.00 diff.

However, because of the strict **Any-Manual-Review Cascade** in `src/system_a/domain/recommendation.py`:
> If any rule returns `result == "manual_review"`, the entire document recommendation is stamped `MANUAL_REVIEW`, overriding Medium and High severity classifications.

This design document establishes the policy demotions and rule enhancements to eliminate false `MANUAL_REVIEW` triggers, routing them cleanly to `AUTO_PASS` (when backed by EBS evidence) or `REVIEW` (when requiring accountant check of non-critical fields).

---

## 2. Root Cause Breakdown (43 Cases)

| Rule | Affected Docs | Current Failure Mechanism | Correct Target State | Target Verdict |
|---|:---:|---|---|:---:|
| **Rule V-06** (Signatures) | 17 | `unsure_slots: ['deliverer']`: faint driver signature in scanned PDF | If Oracle EBS receipt is confirmed (`receipt.found == True`), warehouse already signed for goods. Deliverer signature is waived. | **`AUTO_PASS`** |
| **Rule V-08 / V-07** (Installments) | 7 | Installment fraction detected (e.g. 0.3 / 0.7 SET), exact amount match (`diff == 0.00`), hardcoded as `"รอมาตรฐานกำหนด ให้คนตรวจ"` | When total line amounts equal receipt amounts 100%, pass or treat as `REVIEW` | **`AUTO_PASS`** / `REVIEW` |
| **Rule V-08** (UOM Mismatch) | 8 | Different UOM groups (e.g. `PCS` vs `SET`); V-08 overrides with `manual_review` | Let Rule V-07's existing `E10` (Medium severity) govern the outcome | **`REVIEW`** |
| **Rule V-05** (Customer Address) | 4 | Tax ID and Customer Name match Aapico 100%, but Thai address parsing has AI confidence < 0.85 | Tax ID + Name prove entity identity. Low address confidence becomes `E07` (Medium) | **`REVIEW`** |
| **Rule V-08** (Unread `qty_inv`) | 5 | Empty/null `qty_inv` on continuation lines | Fold continuation lines into preceding items (from perception task 4) | `REVIEW` |
| **Rule V-04** (Receipt Not Found) | 2 | EBS actually has no receipt for this invoice yet (`DMS-120`, `DMS-127`) | Retain `MANUAL_REVIEW` (correct business behavior) | **`MANUAL_REVIEW`** |

---

## 3. Detailed Specification by Component

### 3.1 Rule V-06: Deliverer Signature Waiver on Confirmed Receipt (`src/system_a/domain/rules.py`)
- **Current Behavior:**
  If `deliverer` signature slot is undecided (`unsure`), `v06_signatures()` returns:
  `RuleOutcome("V-06", "manual_review", detail="ความมั่นใจต่ำ: ['deliverer']")`.
- **Target Behavior:**
  1. Check if Oracle receipt was found: `has_receipt = c.snapshot.found and bool(c.snapshot.active)`.
  2. If `has_receipt` and only `deliverer` is unsure:
     - Waive deliverer signature: `deliverer` is treated as satisfied by the Oracle EBS warehouse receipt proof.
     - Return `_ok("V-06", detail="ยืนยันการรับของจากใบรับสินค้าใน Oracle EBS")`.
  3. If `receiver` signature is absent or unsure, emit `E08` with `High` severity (for absent receiver) or `Medium` severity (for unsure receiver).

### 3.2 Rule V-05: Customer Address AI Confidence Demotion (`src/system_a/domain/rules.py`)
- **Current Behavior:**
  In `v05_customer()`:
  ```python
  if float(r.get("confidence", 0)) < th:
      data.update(address_match=None)
      return RuleOutcome("V-05", "manual_review", tuple(findings), "AI ไม่มั่นใจเรื่องที่อยู่", data=data)
  ```
- **Target Behavior:**
  When `tax_id_match is True` and `name_match is True`:
  - Low confidence on address parsing (`confidence < th`) does **not** abort as `manual_review`.
  - Instead, emit finding `_f(c, "E07", "V-05", "AI ไม่มั่นใจเรื่องที่อยู่ลูกค้า", "Medium", ...)` or mark as advisory when Tax ID matches.
  - Return `_fail("V-05", findings, ...)` with Medium severity, allowing the document to receive `REVIEW` rather than `MANUAL_REVIEW`.

### 3.3 Rule V-07 & V-08: Milestone Installment Exact-Amount Match (`src/system_a/domain/rules.py` & `v08.py`)
- **Current Behavior:**
  `policy.validation.milestone_installment` is hardcoded to `manual_review`.
  `v07_line_match()` returns `manual_review`.
  `v08_quantity()` returns `manual_review`.
- **Target Behavior:**
  Support policy setting `milestone_installment: exact_amount_pass` (or `review`):
  When each installment line satisfies:
  - `abs(a - r.line_amount) <= tol` (line amount matches receipt line amount)
  - `lines_vs_sub_total <= tol` (total invoice matches receipt total)
  Then:
  - V-07 marks installments as passed with audit trace `installment_match`.
  - V-08 evaluates quantity difference against the installment ratio, marking `pass` if the installment arithmetic matches.

### 3.4 Rule V-08: UOM Mismatch Delegation to Rule V-07 (`src/system_a/domain/v08.py`)
- **Current Behavior:**
  When `uom_comparable` is `False`, V-08 marks `manual_review` with reason `"หน่วยนับต่างกลุ่ม เทียบจำนวนไม่ได้ (ดู V-07)"`.
- **Target Behavior:**
  - V-07 already flags non-matching UOM with `E10` (Severity: Medium).
  - V-08 should not double-flag with `manual_review`. When `uom_comparable is False`, V-08 records `not_evaluated` (halted_by="V-07") or delegates to V-07's `E10`.
  - The document naturally resolves to **`REVIEW`** (due to `E10` Medium severity), not `MANUAL_REVIEW`.

---

## 4. Expected Impact

| Metric | Before (`run_20261009_121019`) | After Projected |
|---|:---:|:---:|
| **`AUTO_PASS`** | 54 (43.2%) | **75 – 80 (60 – 64%)** |
| **`REVIEW`** | 20 (16.0%) | **35 – 42 (28 – 34%)** |
| **`HOLD`** | 8 (6.4%) | **8 (6.4%)** |
| **`MANUAL_REVIEW`** | **43 (34.4%)** | **2 (1.6%)** *(only true un-receipted DMS-120/127)* |
| **`SYSTEM_ERROR`** | 0 | 0 |

---

## 5. Verification & Safety Gates

1. **Unit Tests:**
   - Test V-06 waiver when EBS receipt exists.
   - Test V-05 address uncertainty yields `E07` Medium (REVIEW) instead of `manual_review`.
   - Test V-07/V-08 milestone installment exact amount matching.
   - Test V-08 UOM mismatch yields `E10` (REVIEW) without `manual_review`.
2. **Sandbox Golden Regression:**
   - Run `python -m system_a.sandbox.scenarios --schema` to verify all 62/62 scenarios pass with zero drift.
3. **Target Document Verifications:**
   - Test `DMS-20`, `DMS-25` (V-06 deliverer waiver $\rightarrow$ `AUTO_PASS`).
   - Test `DMS-37`, `DMS-51` (V-05 address $\rightarrow$ `REVIEW` or `AUTO_PASS`).
   - Test `DMS-72`, `DMS-107` (Milestone installment $\rightarrow$ `AUTO_PASS`).
   - Test `DMS-120`, `DMS-127` (Remain safely in `MANUAL_REVIEW`).
