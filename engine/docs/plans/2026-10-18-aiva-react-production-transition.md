# AIVA React Production Transition Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transform `frontend/temp/aiva-react` from a hybrid DOM prototype into an idiomatic, modular React + Vite application starting with the complete Queue and PDF/BBox evidence viewer.

**Architecture:** Pure React 19 SPA running on Vite, with React Context for state management, an isolated API service layer for Connection Points CP-1..CP-6 with bundled real 125 documents fallback, and modular components for Sidebar, Queue, and PDF Canvas Viewer with BBox overlays.

**Tech Stack:** React 19, Vite 6, JavaScript/JSX, PDF.js (`pdfjs-dist`), Vitest, CSS Tokens v5.2

---

### Task 1: API Service Layer & Real 125 Documents Dataset

**Files:**
- Create: `frontend/temp/aiva-react/src/mock/real125Invoices.js`
- Create: `frontend/temp/aiva-react/src/mock/oracleReceipts.js`
- Create: `frontend/temp/aiva-react/src/services/api.js`
- Test: `frontend/temp/aiva-react/tests/api.test.js`

**Step 1: Write test for API service layer**
Verify that `getDocuments()` returns 125 documents and `getOracleReceipts(id)` returns valid line items.

**Step 2: Run test to verify it fails**
Run test using vitest in `frontend/temp/aiva-react`.

**Step 3: Implement mock data and api service**
- Extract 125 documents from the engine/frontend data.
- Implement `api.js` with functions for CP-1 (`getDocuments`), CP-2 (`getPdfUrl`), CP-3 (`getExtractionResult`), CP-4 (`getOracleReceipts`).

**Step 4: Run test to verify it passes**

**Step 5: Commit**
`git commit -m "feat(aiva-react): add api service layer and real 125 documents dataset"`

---

### Task 2: React Context Providers (`AuthContext`, `ThemeContext`, `InvoiceContext`)

**Files:**
- Create: `frontend/temp/aiva-react/src/context/AuthContext.jsx`
- Create: `frontend/temp/aiva-react/src/context/ThemeContext.jsx`
- Create: `frontend/temp/aiva-react/src/context/InvoiceContext.jsx`
- Test: `frontend/temp/aiva-react/tests/context.test.jsx`

**Step 1: Write test for Context Providers**
Verify role switching, theme toggle (dark/light), document selection, and filtering.

**Step 2: Run test to verify it fails**

**Step 3: Implement Context Providers**
- `AuthContext`: Manage active role (EU, ACC, FIN, ADM, SA) and permission helper `can()`.
- `ThemeContext`: Manage `data-theme` on document element and local storage persistence.
- `InvoiceContext`: Load 125 invoices, manage selected document, search term, status filter, and counts.

**Step 4: Run test to verify it passes**

**Step 5: Commit**
`git commit -m "feat(aiva-react): add auth, theme, and invoice context providers"`

---

### Task 3: Menu & Layout Shell Components (`Sidebar`, `Topbar`, `AppShell`)

**Files:**
- Create: `frontend/temp/aiva-react/src/components/layout/Sidebar.jsx`
- Create: `frontend/temp/aiva-react/src/components/layout/Topbar.jsx`
- Modify: `frontend/temp/aiva-react/src/components/AppShell.jsx`
- Test: `frontend/temp/aiva-react/tests/layout.test.jsx`

**Step 1: Write test for Sidebar and Topbar**
Verify all 8 menu items render with correct labels, icons, badge counts, and click navigation handlers.

**Step 2: Run test to verify it fails**

**Step 3: Implement Sidebar and Topbar**
- Render menu items: `queue`, `ap`, `rbac`, `audit`, `settings`, `cases`, `std`, `sim`.
- Dynamic badge counts for queue items.
- Topbar breadcrumb and theme switcher.

**Step 4: Run test to verify it passes**

**Step 5: Commit**
`git commit -m "feat(aiva-react): implement pure React sidebar, topbar, and app shell"`

---

### Task 4: Interactive Queue Management Component (`QueuePage` & `QueueTable`)

**Files:**
- Create: `frontend/temp/aiva-react/src/components/queue/QueuePage.jsx`
- Create: `frontend/temp/aiva-react/src/components/queue/QueueTable.jsx`
- Test: `frontend/temp/aiva-react/tests/queue.test.jsx`

**Step 1: Write test for QueuePage**
Verify rendering of invoices, status pill classes, search query filtering, and status chip filtering.

**Step 2: Run test to verify it fails**

**Step 3: Implement QueuePage & QueueTable**
- Status filter chips: All, Review, Hold, Auto-pass, Manual Review.
- Search input for invoice number, supplier name, and amount.
- Interactive table row clicking to select active document.

**Step 4: Run test to verify it passes**

**Step 5: Commit**
`git commit -m "feat(aiva-react): add pure React queue page and table grid"`

---

### Task 5: PDF Canvas Viewer with Interactive BBox Overlays (`PdfCanvasViewer`)

**Files:**
- Create: `frontend/temp/aiva-react/src/components/evidence/PdfCanvasViewer.jsx`
- Test: `frontend/temp/aiva-react/tests/pdf-viewer.test.jsx`

**Step 1: Write test for PdfCanvasViewer**
Verify rendering of canvas/page containers and bounding box coordinate overlays.

**Step 2: Run test to verify it fails**

**Step 3: Implement PdfCanvasViewer**
- Zoom controls (`+`, `-`, `Fit`, `Reset`).
- Page navigation (p1, p2, ...).
- Bounding box overlay mapping normalized coordinates [ymin, xmin, ymax, xmax] to pixel positions.
- Color badges and tooltip hover for field labels and confidence.

**Step 4: Run test to verify it passes**

**Step 5: Commit**
`git commit -m "feat(aiva-react): implement interactive PDF canvas viewer with bbox overlays"`

---

### Task 6: Invoice Detail Pane & Oracle Receipts Matching Tab

**Files:**
- Create: `frontend/temp/aiva-react/src/components/evidence/InvoiceDetailPane.jsx`
- Create: `frontend/temp/aiva-react/src/components/evidence/OracleReceiptsTab.jsx`
- Test: `frontend/temp/aiva-react/tests/detail-pane.test.jsx`

**Step 1: Write test for InvoiceDetailPane**
Verify header summary metadata, validation rules (V-01..V-08), line items, and Oracle receipt variance calculation.

**Step 2: Run test to verify it fails**

**Step 3: Implement DetailPane & OracleReceiptsTab**
- Header: Invoice No, Supplier Tax ID, Total Amount, Match Status.
- Tabs: Validation Rules (V-01..V-08), Line Items, Oracle Receipts, Raw JSON.
- Variance diff between Invoice Amount and Receipt Amount.

**Step 4: Run test to verify it passes**

**Step 5: Commit**
`git commit -m "feat(aiva-react): add invoice detail pane and oracle receipts reconciliation tab"`

---

### Task 7: End-to-End Integration, Verification, and Build Test

**Files:**
- Modify: `frontend/temp/aiva-react/src/App.jsx`
- Modify: `frontend/temp/aiva-react/src/main.jsx`
- Test: `frontend/temp/aiva-react/tests/e2e-smoke.test.jsx`

**Step 1: Assemble all components in App.jsx**
- Wire `AuthProvider`, `ThemeProvider`, `InvoiceProvider`.
- Render `AppShell` with split view: `QueuePage` on left, `PdfCanvasViewer` and `InvoiceDetailPane` in dock.

**Step 2: Run all tests in `frontend/temp/aiva-react`**
Verify all tests pass 100%.

**Step 3: Run production build**
`npm run build` in `frontend/temp/aiva-react` and ensure 0 errors.

**Step 4: Commit**
`git commit -m "feat(aiva-react): complete queue and evidence viewer integration and build validation"`
