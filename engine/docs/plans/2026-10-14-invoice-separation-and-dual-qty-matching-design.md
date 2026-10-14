# Design: Invoice Page Separation, Dual-Quantity & Matching Robustness

**Date**: 2026-10-14  
**Status**: Validated Design  
**Target Round**: Upgraded Pipeline post `run_20261013_124649_V5.2`  

---

## 1. Context & Problem Statement

Analysis of the 200-document production test round `run_20261013_124649_V5.2` revealed that:
1. **HOLD (15 cases)**: **73% (11 cases) are False Positives** caused by duplicate invoice pages (Original + Copies / Delivery slips) not being separated or folded. The extracted row count multiplies (2x..3x), causing massive arithmetic diffs in **V-03 (E03 High)** and quantity over-billing in **V-08 (E14 High)** (e.g. DMS-109 diff 1.29M THB, DMS-112/113 installment folding failure, DMS-40, DMS-86, DMS-153).
2. **MANUAL_REVIEW (13 cases)**:
   - **Dual Quantity (5 cases, DMS-28, 33, 62, etc.)**: Table has dual quantity columns (e.g. `QTY = 1` coil vs `KGS = 701` kg). The VLM latches onto the literal `QTY` header instead of the billing weight `701` that matches unit price `35.70 B/KGS` and amount `25,025.70`.
   - **Service Lines (2 cases, DMS-89, 101)**: Crane maintenance without quantity (`qty is null`), but amount matches PO/Receipt 100%.
   - **Customer Advisory Uncertainty (5 cases, DMS-37, 80, 107, 174, 210)**: 13-digit Tax ID matches AAPICO 100%, but AI uncertainty in name/address triggers E07.
3. **Discount Misparsing (1 case, DMS-43)**: `-หักส่วนลด 14.40.-` was parsed as a positive line item.

This design implements a **Defense-in-Depth** architecture across prompt design, page selection, midstream folding, and business rules without hallucination risks or cheating 3-way matching integrity.

---

## 2. Architecture & Data Flow

```
[ PDF Document ]
       │
       ▼
[ Page Classification & Rotation Detection ]
       │
       ▼
[ 1. Upstream select_invoice_pages() ] ──► Prunes duplicate copies (copy_status == "copy"
       │                                     or zero-price DO copy) via Doc No & Line Fingerprints.
       │                                     PROTECTS multi-page continuation sheets (DMS-179/188).
       ▼
[ 2. VLM Single-Pass / Table Extraction ] ──► Visual Unit Matching (B/KGS -> KGS column).
       │                                     Inherit UOM from header. Strict: no number guessing.
       ▼
[ 3. Midstream Evidence & Row Folding ] ──► Fuzzy Block Matching (tolerates single-digit OCR noise).
       │                                     Decouple installment folding from sum == subtotal.
       │                                     Self-Corroboration: adopt billing qty ONLY if number
       │                                     physically exists in row tokens (NO Oracle peeking).
       ▼
[ 4. Rule Engine (V-01 .. V-09) ] ──────► V-05: 100% Tax ID match bypasses advisory uncertainty.
                                             V-08: Service lines without qty pass on exact amount.
                                             V-03: Discount rows parsed with negative values.
```

---

## 3. Detailed Component Design

### 3.1 Dual Quantity & Header UOM Resolution (Prompt & Code)

#### A. Prompt-Level Visual Unit Matching (`single_pass_extract.md` & `vision_table_rows.md`)
To avoid prompt conflict with *"Do not compute, correct, round, reformat or guess"*, VLM will NOT be asked to solve free-form math that could cause hallucinations. Instead, it follows strict **Visual Unit Matching**:
1. **Price Header Unit Correlation**:
   - Inspect the sub-header label under `UNIT PRICE` (e.g. `[B / KGS]`, `[บาท/กก.]`, `[THB/PCS]`).
   - If the price specifies a unit (e.g. `B / KGS`), select the column whose header matches that unit (`KGS` / `น้ำหนัก`).
2. **UOM Header Inheritance**:
   - When a row contains a bare number (e.g. `701`), inherit the UOM from its column header (`uom: "KG"`). Never leave `uom: null` when the column header specifies the unit.
3. **Physical Text Strictness**:
   - *Strict Rule*: The number assigned to `qty` MUST be physically printed in that row. Never fabricate or compute an unprinted number.

#### B. Engine-Level Self-Evidence Token Fallback (`src/system_a/domain/evidence.py`)
In `corroborate_lines`:
- **Integrity Rule**: NEVER peek at `oracle:receipt_qty` to silently overwrite invoice values (preserves 3-way matching audit rigor).
- **Self-Corroboration**: If $qty \times unit\_price \neq amount$, compute $target\_qty = amount / unit\_price$.
- If $target\_qty$ (e.g. `701`) **physically exists** in the raw OCR tokens or alternate cells of that invoice row:
  - Promote $target\_qty$ to `qty` with evidence tag: `arith:target_qty_found_in_row_tokens:701`.
  - Update `uom` to match the unit header.

---

### 3.2 Upstream Invoice Page Selection (`select_invoice_pages`)

Located in [`src/system_a/perception/single_pass.py`](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/engine/src/system_a/perception/single_pass.py):

#### A. Problem with Existing Logic
Existing code drops duplicate pages only when `marker` (e.g. "1/2") exists. When Thai invoices omit page markers, `key` is `None` and all copies are retained.

#### B. Safe Multi-Page vs. Copy Separation Algorithm
1. **Doc No Hint & Copy Status**:
   - Group pages having the same `doc_no_hint`.
   - If an `original` sheet already exists:
     - Drop any subsequent page where `copy_status == "copy"` (e.g. contains "สำเนา", "COPY", "คู่ฉบับ").
     - Drop any subsequent delivery slip where all line prices are zero (`price == 0` for all lines, like DMS-40 p4).
2. **Line Fingerprint Continuation Guard**:
   - To protect genuine multi-page continuation sheets (e.g. DMS-179, DMS-188):
   - Check the start of the table on Page $N$:
     - If Page $N$ restarts with `line_no == 1` AND has identical item code / description as Page 1 $\rightarrow$ **Duplicate Copy (Drop)**.
     - If Page $N$ continues line numbering (e.g. begins at line 6 after page 1 ended at line 5) OR carries distinctly different item codes $\rightarrow$ **Continuation Sheet (Keep)**.

---

### 3.3 Resilient Midstream Row Folding (`collapse_repeated_copies`)

Located in [`src/system_a/domain/evidence.py`](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/engine/src/system_a/domain/evidence.py):

#### A. Installment Invoice Decoupling
- In installment invoices (DMS-112, DMS-113), the printed table shows 100% PO amounts, while Subtotal is 30%.
- **Fix**: Remove the hard constraint `abs(sum(amounts[:size]) - sub) <= tol` when the table cleanly partitions into $k$ repeated blocks ($k \ge 2$) of identical row count where item codes and line amounts repeat across blocks.

#### B. Fuzzy Block Matching Against OCR Noise
- In DMS-109, page 2 had one OCR typo (`158,000` vs `156,000`). In DMS-86 and DMS-153, copy pages missed `unit_price` or `qty`.
- **Fix**: Instead of 100% strict tuple equality on every single cell across all copies:
  - If block size $m = n / k$ and $\ge 80\%$ of rows in Block 2 match Block 1 (or match on all non-null fields):
  - Fold rows by keeping Block 1 (from the Original page) and dropping the duplicate blocks.

---

### 3.4 Business Logic Quick Wins

1. **V-05 AAPICO Tax ID Fast-Path**:
   - In [`src/system_a/domain/rules.py`](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/engine/src/system_a/domain/rules.py) (`v05_customer`):
   - If `customer_tax_id` matches the 13-digit Tax ID of the target AAPICO entity (and branch if present) with 100% confidence, pass V-05 without allowing advisory name/address uncertainty (`name_match: null`) to demote the decision to `MANUAL_REVIEW`.
   - *Fixes*: DMS-37, DMS-80, DMS-107, DMS-174, DMS-210.
2. **V-08 Service / Lump-Sum Matching**:
   - In `v08_qty`:
   - If invoice line has no quantity (`qty is null` or `uom` in `["JOB", "LOT", "เหมา", "งาน"]`) and Oracle receipt has a corresponding service line with exact line amount matching:
   - Mark line as `pass` with reason `"service line amount match"`.
   - *Fixes*: DMS-89, DMS-101 (Konecranes).
3. **V-03 Discount Negative Row Recognition**:
   - In Prompt & Assembler:
   - When a row description contains `"ส่วนลด"`, `"หัก"`, `"Discount"`, or `Less`, parse the amount as negative so internal invoice arithmetic reconciles.
   - *Fixes*: DMS-43 (BKS Enterprise).

---

## 4. Test Strategy & Verification Plan

### Test Corpus & Acceptance Targets
1. **Target HOLD Regressions (Must turn from HOLD to AUTO_PASS / REVIEW)**:
   - DMS-109 (Fine Components): duplicate folding with OCR typo.
   - DMS-112, DMS-113 (ATM Precision): installment folding.
   - DMS-86 (J S Autowork): missing price on copy.
   - DMS-153 (PS Steel): missing qty on copy.
   - DMS-40 (J. Phiphat): zero-price delivery copy.
   - DMS-39 (J S Autowork): duplicate copies.
2. **Target MANUAL_REVIEW Regressions (Must turn to AUTO_PASS)**:
   - DMS-28, DMS-33, DMS-62: dual quantity (Coil vs KGS).
   - DMS-89, DMS-101: crane maintenance service line.
   - DMS-37, DMS-80, DMS-174, DMS-210: AAPICO customer Tax ID fast-path.
3. **Continuation Multi-Page Safety (Must NOT drop page 2)**:
   - DMS-179, DMS-188: multi-page continuation tables.
4. **Full Regression Gate**:
   - Engine suite: all pytest tests in `tests/` pass.
   - Portal suite: all pytest tests in `src/test-portal/` pass.
   - Sandbox 68 scenarios: schema validation and verdict assertion.
