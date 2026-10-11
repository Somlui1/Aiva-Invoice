# Design Document: Perception Layer Robustness & False Positive Elimination

**Date:** 2026-10-09  
**Status:** Approved  
**Scope:** `src/system_a/perception/vision_pipeline.py` & `tests/test_ocr_improvements.py`

---

## 1. Executive Summary & Problem Context

In batch verification run **v5 (125 documents)**, core line segmentation improvements (such as dual-quantity arithmetic parsing in DMS-60) succeeded, promoting DMS-60 from `REVIEW (E15)` to clean `AUTO_PASS` and dropping `E15` exceptions across the entire dataset to just 1 case.

However, detailed comparative analysis between v4 and v5 revealed 3 critical friction points causing 74 documents to miss `AUTO_PASS`:
1. **Rule V-01 False Conflict on PO Numbers (40 failures, 31 E01 exceptions):**
   - Disagreements between VLM text (e.g. `PO42052739`) and text layer / crop (e.g. `42052739`) caused `need_agree` check in `normalize.py` to flag `CONFLICT_BETWEEN_SOURCES`.
   - The crop budget (6 crops) was being exhausted by free-text fields (`customer_name`, `customer_address`) before reaching `po_number`, preventing an independent confirming vote.
   - Result: Documents whose Oracle matching passed 100% (V-02..V-09 all pass, e.g. DMS-24, DMS-132, DMS-135, DMS-140) were downgraded to `REVIEW (E01)`.
2. **Ghost Continuation Rows in Line Item Tables (12 HOLD cases, 10 E13 exceptions):**
   - In multi-line descriptions or borderless layouts (e.g. DMS-64, DMS-27), continuation description lines that carry NO quantity, unit price, or amount were emitted as separate `RawLine` entries with `qty=None, price=None, amount=None`.
   - These orphan lines cannot match any Oracle EBS receipt line, producing `UNMATCHED` groups in V-07, emitting `E13: Line Not Matched`, and sending the invoice to `HOLD`.
3. **Multi-Page Header Leakage (e.g. DMS-23):**
   - In multi-page PDFs containing a Tax Invoice on Page 1 and an attached Purchase Order on Page 2, if Page 1's `invoice_num` was missed by VLM, `pick_candidate` inadvertently selected Page 2's `doc_no` (which is the PO number `42052739`), overwriting `invoice_num` with the PO number and breaking validation.

---

## 2. Architecture & Design Principles

All fixes are strictly localized to the Perception Layer (`src/system_a/perception/vision_pipeline.py`) without modifying Domain Rules in `src/system_a/domain/`, preserving backwards compatibility with existing contracts.

```
[ PDF Pages / Scans ]
         │
         ▼
[ vision_pipeline.py ]
   ├── (A) PO Normalization & Crop Budget Priority ──> Clean PO, agreement=True
   ├── (B) Invoice Pages Scoping for Header ─────────> Never leak doc_no from PO attachment
   └── (C) Ghost Row Auto-Folding in _lines() ───────> Fold empty rows into prev description
         │
         ▼
[ Extraction Result ] ──> [ normalize.py ] ──> [ Oracle EBS Matching / Rules V-01..V-09 ]
```

---

## 3. Detailed Component Design

### 3.1 Module A: PO Number Normalization & Crop Budget Priority
1. **PO Prefix Stripping**:
   - In `extract_value("po_number", ...)` and `_key()`:
     Normalize common prefixes: `(?:PO|P\.O\.|P/O|PO#|เลขที่สั่งซื้อ)\s*`.
     Both `PO42052739` and `42052739` map to identical canonical token `42052739`.
2. **Crop Re-read Budget Prioritization**:
   - In `_fields()`, instead of iterating `candidates` in layout order, sort fields so critical identifiers receive crop priority:
     `PRIORITY_CROP_ORDER = ("invoice_num", "po_number", "supplier_tax_id", "sub_total", "grand_total")`.
     This guarantees `po_number` receives a crop re-read before free-text name/address fields exhaust the 6-crop limit.
3. **PO Corroboration from Line Items**:
   - In `po_from_lines()`: If `fields.get("po_number")` is present and matches the single PO printed in the line items, upgrade `agreement = True`, `confidence = max(conf, 0.96)`, and `null_reason = None`.

### 3.2 Module B: Header Scoping to Invoice Pages
1. **Invoice Pages Restriction**:
   - In `_fields()`: For header fields `{"invoice_num", "invoice_date", "sub_total", "vat", "grand_total"}`:
     If `invoice_pages` is populated, only accept candidates where `page in invoice_pages`.
     Candidate items from attached documents (such as `page_type == "PO"` or `page_type == "DELIVERY_NOTE"`) are strictly ignored for invoice header assignments.
2. **Text Layer Fallback on First Invoice Page**:
   - If VLM omits `doc_no` on `first_invoice`, inspect the text layer of `first_invoice` for regex patterns matching invoice numbers before leaving the field empty.

### 3.3 Module C: Ghost Row Auto-Folding in `_lines()`
1. **Ghost Row Detection**:
   - A row is a ghost row if:
     `cells.get("qty") is None` AND `cells.get("unit_price") is None` AND `cells.get("amount") is None`.
2. **Auto-Folding Behavior**:
   - If `len(page_rows) > 0`:
     Append `cells.get("description")` to the previous row's `description` with a space separator.
     Merge the ghost row's bounding box into the previous row's bounding box.
   - If `len(page_rows) == 0`:
     The ghost row represents leading table header/page clutter and is safely dropped.
3. **Impact**:
   - DMS-64: Lines 3 and 4 (empty ghost rows) fold into Lines 1 and 2. Resulting `len(lines) == 2`, perfectly matching Oracle EBS receipt lines.
   - DMS-27: Continuation lines (lines 11-14) fold into their respective parent items.

---

## 4. Verification & Testing Plan

1. **Unit Tests (`tests/test_ocr_improvements.py`):**
   - `test_po_prefix_normalization_and_consensus`: Verify `PO42052739` and `42052739` produce agreement and confidence >= 0.96.
   - `test_po_crop_priority`: Verify `po_number` receives crop allocation over lower-priority fields.
   - `test_po_corroboration_from_line_items`: Verify PO matching line items upgrades `agreement=True`.
   - `test_header_scoping_ignores_attachment_doc_no`: Verify multi-page PDF does not inherit `doc_no` from attachment PO page.
   - `test_ghost_rows_auto_fold_into_preceding_description`: Verify rows without qty/price/amount fold into preceding description.
2. **Regression & Sandbox Verification:**
   - Run `pytest tests/test_ocr_improvements.py` (100% pass).
   - Run `python -m system_a.sandbox.scenarios --golden --schema` (62/62 scenarios pass).
3. **Live Target Verification:**
   - DMS-24: `po_number` consensus clean $\rightarrow$ `AUTO_PASS`.
   - DMS-64: Ghost rows eliminated $\rightarrow$ lines match EBS $\rightarrow$ `AUTO_PASS`.
   - DMS-23: Header stays on page 1 $\rightarrow$ invoice_num valid.
