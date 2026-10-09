# Design Document: Amount-Anchored Row Segmentation & Dual-Quantity Resolution

**Date:** 2026-10-09  
**Status:** Approved  
**Author:** Antigravity  
**Target Components:**
- `config/prompts/vision_table_rows.md`
- `config/standards/v6.6/uom_groups.yaml`
- `src/system_a/perception/vision_pipeline.py`
- `src/system_a/domain/v08.py`
- `tests/test_ocr_improvements.py`

---

## 1. Problem Statement & Background

### 1.1 Context
In processing PDF invoices from suppliers (such as steel, coils, auto-parts like SUMISHO METAL / DMS-60), the extraction engine occasionally identifies 2 distinct invoice rows as a single merged row, or drops row segmentation completely.

### 1.2 Observed Failure Modes
1. **Borderless Multi-line Rows:**
   - Invoices often have no horizontal grid lines between rows.
   - Each item's description spans 3–5 lines (Part No, Spec, Description, Dimensions, Coil/Heat No).
   - The visual vertical spacing between lines within an item is almost identical to the spacing between distinct items.
2. **Dual-Quantity Columns:**
   - The table header contains merged columns such as:
     `จำนวน QUANTITY` split into `แผ่น SHEET` (e.g. 1) and `กิโลกรัม KGS.` (e.g. 3,006).
   - The unit price is quoted per weight (e.g. `49.940 KG`).
   - If the system extracts the first quantity (`1 SHEET`), line math fails (`1 * 49.940 != 150,119.64`), and unit matching against Oracle EBS (`Kilogram`) fails.
3. **Over-eager Wrapped Text Merging:**
   - In fallback mode (`rows_from_line_items`), if a line fails regex `cells_from_row_text()`, it is automatically treated as "wrapped description" of the previous line and concatenated into row 1.
4. **False Positive Deduplication in `merge_duplicate_rows()`:**
   - When identical descriptions or part numbers appear in successive lines with overlapping predicted bounding boxes, rows get collapsed into one.
5. **N:1 Quantity Verification Failure in Rule V-08:**
   - When 2 invoice rows match 1 Oracle receipt row (e.g. $3,006 + 2,906 = 5,912$), V-08 compared each line individually against 5,912, raising exception `E15: Quantity Below Receipt`.

---

## 2. Root Cause Analysis

| Component | Code Location | Root Cause |
|---|---|---|
| Prompt | `config/prompts/vision_table_rows.md` Rule 2 | Prompt mandates merging wrapped description without explicitly instructing that distinct `amount` numbers dictate separate rows. |
| Fallback Parser | `vision_pipeline.py:cells_from_row_text()` | Regex expects single qty/uom before money tokens. Fails on strings containing dual quantities and mid-string units (`1 3,006 49.940 KG 150,119.64`). |
| Fallback Assembler | `vision_pipeline.py:rows_from_line_items()` | If a row does not parse via regex, it unconditionally joins the previous item's description, even if it contains distinct money amounts. |
| Row Deduplicator | `vision_pipeline.py:merge_duplicate_rows()` | Tolerant bounding box overlap ($\ge 0.5$) combined with identical pricing merges consecutive identical parts. |
| Domain Rule V-08 | `v08.py:build_payload()` | In `N:1` matching relations, `cmp_` was set to `rcv[0].qty` for each invoice line instead of comparing $\sum \text{Qty}_{\text{inv}}$ against $\text{Qty}_{\text{rcv}}$. |

---

## 3. Architecture & Detailed Design

```
+-----------------------------------------------------------------------------------+
| 1. Perception Prompt Layer (config/prompts/vision_table_rows.md)                  |
|    - Amount-Anchored Rule: Each printed Amount defines an independent row.       |
|    - Dual-Quantity Rule: Match Qty to Unit Price's UOM (e.g. 49.940 KG -> KGS).   |
+-----------------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------------+
| 2. Perception Pipeline (src/system_a/perception/vision_pipeline.py)              |
|    - Enhanced cells_from_row_text(): Arithmetic-driven Qty selection.             |
|    - Protected rows_from_line_items(): Do not merge rows containing Amount tokens. |
|    - Safe merge_duplicate_rows(): Prevent merging rows with distinct amounts.     |
+-----------------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------------+
| 3. Standard UOM Normalizer (config/standards/v6.6/uom_groups.yaml)                |
|    - Standard v6.6 Table 3 mappings: PCS, KG, SHT, etc.                           |
|    - Add TRIP (TRIP, TP, เที่ยว) and BOOK (BOOK, เล่ม) to dictionary.             |
+-----------------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------------+
| 4. Domain & Matching Rules (src/system_a/domain/v08.py)                           |
|    - Support N:1 Relations: Compute sum(Qty_inv) for the group vs Qty_rcv.       |
+-----------------------------------------------------------------------------------+
```

### 3.1 Prompt Updates (`vision_table_rows.md`)
1. **Rule 2 Clarification:**
   - Explicitly define: A row is strictly anchored by its `amount` / `unit_price`. Even in borderless tables where description spans multiple physical lines, if a line has its own amount, it is a distinct row.
2. **Dual-Quantity Guidance:**
   - When a table prints multiple quantity columns (e.g., `SHEET` and `KGS`), extract the quantity that matches the unit of measure of `unit_price`.

### 3.2 Parser & Pipeline Updates (`vision_pipeline.py`)
1. **`cells_from_row_text(text)`:**
   - Detect cases where multiple candidate numbers precede unit price and amount.
   - Cross-validate candidates:
     $$\text{Candidate} \times \text{Unit Price} \approx \text{Amount} \pm 0.01$$
   - Select the matching number as `qty` and assign corresponding `uom` (e.g. `KG`).
2. **`rows_from_line_items(read)`:**
   - Do not concatenate an unparsed line into the previous description if that line contains currency/numeric patterns matching `amount`.
   - Keep such lines as individual rows to allow downstream rules to flag or resolve them rather than losing the row entirely.
3. **`merge_duplicate_rows(rows)`:**
   - Verify that `amount` is identical and vertical bounding boxes actually overlap before deduplicating. Never merge rows with distinct vertical centerlines.

### 3.3 Standards Update (`uom_groups.yaml`)
- Add standard groups missing from current dictionary:
  ```yaml
  TRIP: [TRIP, TP, เที่ยว]
  BOOK: [BOOK, เล่ม]
  ```

### 3.4 Domain Rule V-08 Update (`v08.py`)
In `v08.py:build_payload()`:
- When group relation is `N:1`:
  Calculate:
  $$\text{inv\_qty\_sum} = \sum_{n \in \text{group}} \text{lines}[n].\text{qty}$$
  $$\text{diff} = \text{inv\_qty\_sum} - \text{rcv\_qty\_sum}$$
  If $\text{diff} == 0$, set evaluation to `pass`.

---

## 4. Verification & Testing Plan

1. **Unit Tests (`tests/test_ocr_improvements.py`):**
   - Test `cells_from_row_text()` on dual-quantity line strings:
     `MB3B-41111K34/35-A ... 1 3,006 49.940 KG 150,119.64` $\rightarrow$ parses with `qty=3006`, `uom=KG`, `unit_price=49.940`, `amount=150,119.64`.
   - Test `rows_from_line_items()` ensuring borderless rows with independent amounts are never merged.
   - Test `merge_duplicate_rows()` ensuring identical part descriptions in separate rows are kept distinct.
   - Test V-08 `build_payload()` with `N:1` matching relation ($3,006 + 2,906 = 5,912$) evaluating to `pass`.
2. **Regression & Sandbox Verification:**
   - Run `pytest -q tests`.
   - Run `python -m system_a.sandbox.scenarios --golden --schema` to verify legacy golden integrity.
   - Re-test against DMS-60 and DMS-64 data to verify both rows are cleanly extracted and pass V-02, V-03, V-07, and V-08.
