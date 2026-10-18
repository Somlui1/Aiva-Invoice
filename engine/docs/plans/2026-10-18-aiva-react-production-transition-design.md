# Design Document: AIVA React Production Transition (`temp/aiva-react`)

- **Date:** 2026-10-18
- **Author:** Antigravity & User
- **Status:** Approved
- **Scope:** `frontend/temp/aiva-react/` -> Production Frontend Target

---

## 1. Executive Summary & Purpose

The existing `frontend/` project (built on Next.js 15) has accumulated architectural friction, SSR hydration mismatches, and deployment complexities. The user requested pivoting the frontend to build upon **`frontend/temp/aiva-react`** (a clean Vite + React SPA).

This design details the systematic upgrade of `frontend/temp/aiva-react` from a hybrid DOM prototype into an idiomatic, production-ready React application that:
1. Retains the standard menu hierarchy and business capabilities from the current system.
2. Implements pure React components for the core workflow, starting with **Queue Management** and **PDF/BBox Evidence Viewer**.
3. Clearly documents and isolates all **Connection Points** (APIs / Data Feeds) with resilient fallback data for offline/standalone execution.
4. Prepares `aiva-react` to cleanly replace `frontend/` once fully verified.

---

## 2. Menu & Navigation Architecture

The sidebar and navigation will align with the approved system menu hierarchy:

```
[งานหลัก]
├── คิวตรวจสอบ / งานของฉัน (Queue)      [Icon: inbox]     -> /queue (Default view)
└── ส่งเข้า AP Interface (AP Interface) [Icon: send]      -> /ap

[การกำกับดูแล]
├── สิทธิ์และการเชื่อมบัญชี (RBAC)      [Icon: shield]    -> /rbac
├── บันทึกการเข้าถึง (Audit Logs)       [Icon: log]       -> /audit
└── ตั้งค่า (Settings)                  [Icon: sliders]   -> /settings

[เครื่องมือทดสอบและพัฒนา]
├── ชุดเอกสารทดสอบ (Test Cases)         [Icon: layers]    -> /cases
├── มาตรฐาน Payload (API Standard)       [Icon: code]      -> /std
└── Document Simulation (Sandbox)       [Icon: flask]     -> /sim
```

---

## 3. Data Flow & Connection Points (จุดเชื่อมต่อข้อมูล)

To ensure transparency and prevent broken integrations, all external data interactions are isolated into an API Service Layer (`src/services/api.js`). Each connection point includes a live endpoint and bundled fallback data:

| จุดเชื่อมต่อ (Connection Point) | รายละเอียดข้อมูล | Live Endpoint | Standalone Fallback Source |
|---|---|---|---|
| **CP-1: Document Queue** | รายการใบกำกับภาษี 125 ฉบับ พร้อมสถานะ และผลตรวจ | `GET /api/documents` | `src/mock/real125Invoices.json` (จาก Engine v5.5) |
| **CP-2: PDF Document File** | ไฟล์ PDF ต้นฉบับเพื่อเรนเดอร์บน Canvas | `GET /api/documents/:id/pdf` | `/mock/pdf/:id.pdf` หรือ Paperless static URL |
| **CP-3: BBox & OCR Extraction** | พิกัด BBox [ymin, xmin, ymax, xmax] และค่า OCR รายหน้า | `GET /api/documents/:id/result` | Payload จาก `SinglePassPipeline` |
| **CP-4: Oracle PO Receipts** | ข้อมูลการรับสินค้า PO, Receipt Lines, และยอดเงิน | `GET /api/documents/:id/oracle-receipts` | `src/mock/oracleReceipts.json` |
| **CP-5: User & Authentication** | ข้อมูลผู้ใช้ปัจจุบัน, สิทธิ์ตาม Role (EU/ACC/FIN/ADM) | `GET /api/auth/me` | Active Role Session State |
| **CP-6: Company Scope** | รายชื่อ 26 บริษัทในเครือ AAPICO และการแมปสิทธิ์ | `GET /api/companies` | `src/mock/companies26.json` |

---

## 4. Phase 1 Target: Queue & PDF/BBox Viewer Implementation

### 4.1 Component Breakdown
Instead of injecting HTML strings into `#app`, Phase 1 introduces modular React components:

1. **`src/context/InvoiceContext.jsx`**:
   - Manages loaded invoices, active selection, filter criteria (status, search query, period, assigned user).
   - Exposes actions: `selectInvoice(id)`, `updateStatus(id, newStatus)`, `filterBy(query)`.

2. **`src/components/queue/QueuePage.jsx`**:
   - **Header & Metric Bar**: Count of Open, Review, Hold, Auto-pass, Manual Review.
   - **Filter Controls**: Quick filter chips (`All`, `Mine`, `Review`, `Hold`, `Auto-pass`), date period selector, free-text search.
   - **Queue Data Grid**: Responsive table with invoice number, supplier name, amount, date, status pill, and action buttons.

3. **`src/components/evidence/InvoiceDetailPane.jsx`**:
   - **Header Metadata**: Invoice Number, Supplier Tax ID, Total Amount, Matched PO Number.
   - **Tabs**:
     - **Tab 1: Validation Results & Rules (V-01..V-08)**: Summary of checks, error badges (E01..E12), discrepancies.
     - **Tab 2: Line Items**: Extracted items, unit price, quantity, amount vs PO lines.
     - **Tab 3: Oracle Receipt Lines**: Real-time PO matching lines, variance diff, receiving status.
     - **Tab 4: Raw JSON Payload**: For inspection and debugging.

4. **`src/components/evidence/PdfCanvasViewer.jsx`**:
   - **Interactive Canvas / Viewer**: Renders document pages with zoom (`+`, `-`, `Fit Width`, `Reset`).
   - **Bounding Box Overlay**:
     - Highlights bounding boxes for selected fields (Supplier, Grand Total, Invoice No, Line Items).
     - Color-coded badges: Green for verified, Yellow for review, Red for error/mismatch.
     - Hover tooltips showing extracted text and confidence.

---

## 5. Technology Stack & Directory Structure

```
frontend/temp/aiva-react/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── styles/               # Preserved authentic v5.2 stylesheets
│   └── mock/                 # Static mock assets (PDFs, icons)
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # App container with Context Providers
│   ├── context/
│   │   ├── AuthContext.jsx   # Role & user state
│   │   ├── InvoiceContext.jsx# Invoice list, selection, filters
│   │   └── ThemeContext.jsx  # Dark/Light theme switching
│   ├── services/
│   │   └── api.js            # Unified API Client with CP-1..CP-6 definitions
│   ├── mock/
│   │   ├── real125Invoices.js# Exported 125 real documents from Engine v5.5
│   │   ├── oracleReceipts.js # Oracle receipts master data
│   │   └── companies26.js    # 26 AAPICO Companies
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx  # Topbar + Sidebar + Main slot
│   │   │   ├── Topbar.jsx    # Breadcrumb, Theme toggle, Search, Profile
│   │   │   └── Sidebar.jsx   # Full menu with badge counters
│   │   ├── queue/
│   │   │   ├── QueuePage.jsx
│   │   │   └── QueueTable.jsx
│   │   └── evidence/
│   │       ├── InvoiceDetailPane.jsx
│   │       ├── PdfCanvasViewer.jsx
│   │       └── OracleReceiptsTab.jsx
│   └── tests/
│       └── queue-viewer.test.jsx # Automated regression tests
```

---

## 6. Success Criteria & Verification

1. **Vite Development & Build**: `npm run build` exits 0 with zero syntax or bundle errors.
2. **Menu Completeness**: All 8 sidebar menu items render accurately with icons, badges, and proper active states.
3. **Queue Functionality**: Renders all 125 documents from the engine, supports searching and filtering by status (`Review`, `Hold`, `Auto-pass`).
4. **PDF & BBox Overlay**: Selected document opens in detail view, displays metadata, line items, and visual BBox overlays.
5. **Zero Hydration Errors**: Runs completely client-side without Next.js SSR/hydration errors.
