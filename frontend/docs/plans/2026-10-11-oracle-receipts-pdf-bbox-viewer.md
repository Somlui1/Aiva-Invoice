# Oracle Receipts, Full PDF BBox Viewer & Web Schema Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:**
Add an Oracle receipt items display with multi-PO identification in a dedicated "ใบรับ Oracle" tab, build a standalone full-screen PDF BBox inspection viewer in a new browser tab (`/viewer/[id]`), and document the complete engine data contract in `temp/schemas/web_schema.json`.

**Architecture:**
- Update `temp/schemas/web_schema.json` as the official contract separating engine-required payload fields (`oracle_snapshot.receipt_lines` with `po_number` + full `ocr.elements` in 10 categories) from portal-owned fields.
- Extend `portalDomain.ts`, `engineResultV3Schema.ts`, `types/invoice.ts`, and `engineToPortalAdapter.ts` to parse and expose `PortalOracleReceiptLine[]`.
- Add a new tab `receipts` ("ใบรับ Oracle") in `InvoiceDetailPane.tsx` with multi-PO filter chips, summary metrics, and full tabular receipt detail.
- Create a dedicated standalone viewer page at `src/app/viewer/[id]/page.tsx` rendering PDF pages via PDF.js with an interactive overlay of all OCR bounding boxes, 10-category color toggles, label badge toggle, zoom, and tooltips matching `report.html` / `viewer.html`.
- Add "ตรวจ BBox (แท็บใหม่)" buttons in `InvoiceDetailPane.tsx` and `DockControls.tsx`.

**Tech Stack:** Next.js 15, React 19, TypeScript, PDF.js, Vitest, Testing Library.

---

### Task 1: Web Schema Contract & Domain Types Extension

**Files:**
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/temp/schemas/web_schema.json`
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/features/engine/types/portalDomain.ts`
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/types/invoice.ts`
- Create: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/test/oracleReceiptContract.test.ts`

**Step 1: Write failing contract test**
Verify `PortalOracleReceiptLine` interface and `temp/schemas/web_schema.json` validity.
- Verify `web_schema.json` includes `oracle_snapshot.receipt_lines` with `po_number`, `receipt_num`, `line`, `item`, `qty`, `uom`, `unit_price`, `line_amount`, `line_status`.
- Verify `web_schema.json` includes `ocr.elements` with 10-category elements.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/oracleReceiptContract.test.ts`
Expected: FAIL

**Step 3: Update `web_schema.json` and domain types**
- Update `web_schema.json` with multi-PO sample and complete 10-category OCR elements specification.
- Add `PortalOracleReceiptLine` to `portalDomain.ts` and `InvoiceDoc.oracleReceiptLines` to `types/invoice.ts`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/oracleReceiptContract.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add temp/schemas/web_schema.json src/features/engine/types/portalDomain.ts src/types/invoice.ts src/test/oracleReceiptContract.test.ts
git commit -m "feat: define web schema contract and portal oracle receipt domain types"
```

---

### Task 2: Adapter Mapping for Oracle Receipt Lines & Multi-PO Grouping

**Files:**
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/features/engine/schemas/engineResultV3Schema.ts`
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/features/engine/adapters/engineToPortalAdapter.ts`
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/lib/backendApi.ts`
- Create: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/test/oracleReceiptAdapter.test.ts`

**Step 1: Write failing adapter test**
Test mapping of `oracle_snapshot.receipt_lines` for:
- Single-PO payload (`DMS-100_result.json`): 2 lines, single PO `42051905`.
- Multi-PO payload (`DMS-35_result.json`): 3 lines with different POs (`43026973`, `43041729`, `43043027`).

**Step 2: Run test to verify it fails**
Run: `npm test src/test/oracleReceiptAdapter.test.ts`
Expected: FAIL

**Step 3: Implement adapter extraction logic**
- Update `engineResultV3Schema.ts` to allow rich `receipt_lines` fields.
- In `engineToPortalAdapter.ts`, map `os.receipt_lines` into `oracleReceiptLines: PortalOracleReceiptLine[]`.
- In `backendApi.ts`, forward `oracleReceiptLines` onto `InvoiceDoc`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/oracleReceiptAdapter.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/features/engine/schemas/engineResultV3Schema.ts src/features/engine/adapters/engineToPortalAdapter.ts src/lib/backendApi.ts src/test/oracleReceiptAdapter.test.ts
git commit -m "feat: map oracle receipt lines with multi-PO attributes in adapter"
```

---

### Task 3: Oracle Receipts UI Tab in InvoiceDetailPane

**Files:**
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/components/queue/InvoiceDetailPane.tsx`
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/styles/queue.css`
- Create: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/test/oracleReceiptsTab.test.tsx`

**Step 1: Write failing UI test**
Write `src/test/oracleReceiptsTab.test.tsx` to verify:
- Tab button `ใบรับ Oracle` renders with count.
- Clicking tab displays PO info card (multi-PO badges, receiver, receipt total).
- Table displays columns: `#`, `PO #`, `เลขที่ใบรับ`, `รหัสสินค้า`, `รายการ`, `จำนวนรับ`, `ราคา/หน่วย`, `ราคารวม`, `วางบิลแล้ว`, `สถานะ`.
- PO filter chips filter rows by clicked PO.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/oracleReceiptsTab.test.tsx`
Expected: FAIL

**Step 3: Implement tab UI in `InvoiceDetailPane.tsx` and styles in `queue.css`**
- Add `{ k: 'receipts', label: 'ใบรับ Oracle', count: doc.oracleReceiptLines?.length || 0 }`.
- Render summary metrics & filter chips.
- Render receipt table with formatted numbers, status badges, and PO pill tags.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/oracleReceiptsTab.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/queue/InvoiceDetailPane.tsx src/styles/queue.css src/test/oracleReceiptsTab.test.tsx
git commit -m "feat: add oracle receipts tab with multi-PO filter and detailed table"
```

---

### Task 4: Standalone PDF BBox Viewer Route (`/viewer/[id]`)

**Files:**
- Create: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/features/pdf-viewer/components/StandaloneBBoxViewer.tsx`
- Create: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/features/pdf-viewer/styles/standaloneViewer.css`
- Create: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/app/viewer/[id]/page.tsx`
- Create: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/test/standaloneBBoxViewer.test.tsx`

**Step 1: Write failing standalone viewer test**
Verify:
- Renders top sticky bar with document title, zoom controls, label toggle, and 10 category checkboxes.
- Toggling category checkbox hides/shows corresponding bounding boxes.
- Toggling label checkbox toggles label text visibility.
- Hovering a box displays tooltip with text & coordinates.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/standaloneBBoxViewer.test.tsx`
Expected: FAIL

**Step 3: Implement `StandaloneBBoxViewer` and `/viewer/[id]/page.tsx`**
- Create `StandaloneBBoxViewer.tsx` with PDF.js canvas rendering + full 10-category BBox overlay.
- Style toolbar and overlay with `standaloneViewer.css` matching `viewer.html` / screenshot.
- Wire route `src/app/viewer/[id]/page.tsx` to load document and render viewer.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/standaloneBBoxViewer.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/features/pdf-viewer/components/StandaloneBBoxViewer.tsx src/features/pdf-viewer/styles/standaloneViewer.css src/app/viewer/[id]/page.tsx src/test/standaloneBBoxViewer.test.tsx
git commit -m "feat: create standalone PDF BBox inspection viewer in new tab"
```

---

### Task 5: Link to Standalone Viewer & End-to-End Regression Pass

**Files:**
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/components/queue/InvoiceDetailPane.tsx`
- Modify: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/features/pdf-viewer/components/DockControls.tsx`
- Create: `c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/test/standaloneViewerLink.test.tsx`

**Step 1: Write test for viewer trigger buttons**
Verify:
- "ตรวจ BBox (แท็บใหม่)" button exists in `InvoiceDetailPane.tsx` header with `target="_blank"`.
- "เปิดแท็บใหม่" button exists in `DockControls.tsx` with `target="_blank"`.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/standaloneViewerLink.test.tsx`
Expected: FAIL

**Step 3: Implement link buttons**
- Add anchor button in `InvoiceDetailPane.tsx` header.
- Add external link button in `DockControls.tsx`.

**Step 4: Run all tests and regression suites**
Run: `npm test`
Expected: All test suites PASS (including all existing 24 suites + new suites).
Run: `npx tsc --noEmit`
Expected: Clean with 0 errors.
Run: `npm run build`
Expected: Clean production build with `/viewer/[id]` route compiled.

**Step 5: Commit**
```bash
git add src/components/queue/InvoiceDetailPane.tsx src/features/pdf-viewer/components/DockControls.tsx src/test/standaloneViewerLink.test.tsx
git commit -m "feat: add trigger buttons for standalone bbox viewer and verify end-to-end"
```
