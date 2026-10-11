# Design Document: Oracle Receipt Items Display, Full PDF BBox Viewer & Web Schema Contract

**Date:** 2026-10-11  
**Status:** Approved  
**Author:** Antigravity  
**Branch:** `feat/enterprise-portal-engine-integration`  

---

## 1. Overview & Context

This design addresses 3 key enhancements requested for the AIVA Enterprise Invoice Portal:
1. **Oracle Receipt Items (รายการรับใน Oracle):** Display complete Oracle receipt line items attached to the engine payload in a dedicated tab in `InvoiceDetailPane`, explicitly identifying which line comes from which PO (since 1 invoice can reference multiple POs - e.g., `DMS-35`).
2. **Full PDF BBox Inspection in New Tab (`/viewer/[id]`):** A standalone full-screen PDF inspection page opened in a new browser tab (`target="_blank"`), rendering PDF pages via PDF.js with all detected OCR bounding boxes, 10 category color toggles (`header`, `supplier`, `customer`, `table`, `line`, `total`, `payment`, `signature`, `stamp`, `other`), label badge toggle, zoom controls, and interactive tooltips matching `frontend/temp/batch/report.html` and `docs/doc_20/viewer.html`.
3. **Web Schema Specification (`frontend/temp/schemas/web_schema.json`):** Formulate the complete JSON contract required by the Web Portal from the OCR & Validate Engine, clearly separating engine-supplied payload fields from portal-managed fields.

---

## 2. Architecture & Data Flow

```mermaid
graph TD
    Engine[OCR & Validate Engine] -->|Payload with oracle_snapshot + ocr.elements| API[/api/invoices or mock/backend]
    API --> Adapter[EngineToPortalAdapter]
    Adapter --> Domain[PortalInvoiceDocument]
    Domain --> Tab[InvoiceDetailPane: 'ใบรับ Oracle' Tab]
    Domain --> Button["ตรวจ BBox (แท็บใหม่) Button"]
    Button -->|target=_blank| ViewerPage["/viewer/[id] Standalone Page"]
    ViewerPage --> PDFJS[PDF.js Canvas Renderer]
    ViewerPage --> BBoxOverlay[10-Category Interactive BBox Layer]
```

---

## 3. Detailed Component Designs

### 3.1. Section 1: Data Contract & Schema (`frontend/temp/schemas/web_schema.json`)

#### Engine-Supplied Required Fields
1. **`oracle_snapshot.receipt_lines`**:
   * `po_number` (string) — Required for multi-PO tracking.
   * `receipt_num` (string) — Oracle receipt number.
   * `line` / `line_no` (integer) — Receipt line sequence.
   * `rcv_line_id` (string) — Composite key (e.g. `"50220043288-1"`).
   * `item` / `item_desc` (string) — Item description.
   * `item_code` (string | null) — Part/item code.
   * `qty` (number | string) — Received quantity.
   * `uom` (string) — Unit of measure.
   * `unit_price` (number | string) — Unit price.
   * `line_amount` (number | string) — Line amount.
   * `qty_billed` (number | string) — Quantity already billed.
   * `line_status` (string) — Line status (e.g. `"FULLY RECEIVED"`).
   * `po_line_status` (string) — PO line status (e.g. `"CLOSED"`, `"OPEN"`).
   * `receiver` (string) — Receiver personnel.
   * `extra` (object) — Shipment number, packing slip, waybill.
2. **`ocr.elements`**:
   * Complete detected bounding boxes per page.
   * `element_id`, `page_no`, `element_type` (10 categories), `field_name` / `label`, `raw_value` / `text`, `confidence`, and `bbox: [x, y, w, h]` normalized.
3. **`normalized_fields`**, **`rule_results`** (V-01..V-09), **`evidence`**, **`exceptions`**, **`recommendation`**.

#### Portal-Managed Fields (Not Required from Engine)
* Workflow state (`status`: `Assigned`, `Confirmed`, `Posted`, `Rejected`).
* Role assignment (`assignedRole`, `assignedUserId`).
* Duplicate override status (`duplicateStatus`: `none` | `potential_duplicate` | `overridden`).
* Audit history logs (`history: PortalHistoryEntry[]`).

---

### 3.2. Section 2: UI Tab "ใบรับ Oracle" in `InvoiceDetailPane`

1. **Tab Navigation:**
   * Key: `receipts`, Label: `ใบรับ Oracle`, Badge: count of `oracleReceiptLines`.
   * Positioned immediately following `รายบรรทัด` (`lines`).
2. **Header Summary Banner:**
   * Multi-PO chip list (e.g. `PO 43026973`, `PO 43041729`).
   * Receipt Number, Receiver, Org/OU.
   * Receipt Total vs Invoice Subtotal & Diff comparison.
3. **Receipt Lines Table Columns:**
   * `#` (Index)
   * `PO #` (Pill badge per PO)
   * `เลขที่ใบรับ` (Receipt # & Line)
   * `รหัสสินค้า` (Item Code / Part No.)
   * `รายการ` (Description)
   * `จำนวนรับ` (Qty & UOM)
   * `ราคา/หน่วย` (Unit Price)
   * `ราคารวม` (Line Amount)
   * `วางบิลแล้ว` (Qty Billed)
   * `สถานะ` (Badges for `line_status` and `po_line_status`)
4. **PO Filter Chips:**
   * Filter buttons `[ทั้งหมด]` and `[PO xxxxxxxx]` to focus on lines for a single PO.

---

### 3.3. Section 3: Standalone PDF BBox Inspection Page (`/viewer/[id]`)

1. **Route:**
   * `src/app/viewer/[id]/page.tsx`
2. **Top Sticky Toolbar:**
   * Title: Document ID / Number.
   * Zoom controls: `[−]` Zoom percentage `[+]`.
   * `[✓] label` toggle checkbox for bounding box badges.
   * 10 category toggle checkboxes with color swatches:
     * Header (`#d62728`), Supplier (`#ff7f0e`), Customer (`#9467bd`), Table (`#7f7f7f`), Line (`#1f77b4`), Total (`#2ca02c`), Payment (`#bcbd22`), Signature (`#e377c2`), Stamp (`#8c564b`), Other (`#17becf`).
3. **Document Canvas & BBox Overlay:**
   * PDF.js canvas rendering each page in succession.
   * Absolutely positioned `.box` elements mapped to normalized coordinates.
   * Text badge above each box showing the label.
   * Hover styling and floating tooltip showing label, text, and coords.

---

## 4. Verification Plan

1. **Schema Validation:** Ensure `temp/schemas/web_schema.json` is valid JSON and satisfies schema requirements.
2. **Adapter & Domain Tests:** Verify `engineToPortalAdapter` parses `oracle_snapshot.receipt_lines` into `PortalInvoiceDocument.oracleReceiptLines` for single and multi-PO payloads (`DMS-100`, `DMS-35`).
3. **UI Component Tests:**
   * Verify "ใบรับ Oracle" tab appears and renders receipt lines with PO pills.
   * Verify PO filter chips filter rows properly.
4. **Viewer Page Tests:**
   * Verify `/viewer/[id]` route renders toolbar controls, categories, and overlay containers.
5. **Regression Verification:** Run `npm run test` and `npm run build` to confirm zero breakages across existing 24 test suites.
