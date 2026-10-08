# AIVA Web Portal v4.18 — React Conversion Design Document

**Date:** 2026-10-08  
**Topic:** Convert AIVA Web Portal Mockup v4.18 to Modular Vite + React + TypeScript Application  
**Status:** Approved  
**Author:** Antigravity (Pair Programming with User)  

---

## 1. Executive Summary & Goals

### 1.1 Purpose
The purpose of this project is to convert the monolithic HTML/JS/CSS prototype `AIVA-Web-Portal-Mockup-v4.18.html` (~2,110 lines, 386 KB) into a modern, type-safe, modular **Vite + React 19 + TypeScript** application.

### 1.2 Core Objectives
1. **100% Functional & Visual Fidelity**: Retain the exact visual identity (AAPICO AP Hub, navy/slate/teal palette, Inter & Sarabun typography, high-density ERP layouts) and interactive features of mockup v4.18.
2. **Comprehensive Scope**: Include all 8 views:
   - **คิวตรวจสอบ / งานของฉัน** (`queue`) with Summary Table & Split 2-pane view.
   - **Evidence / PDF Viewer Dock** with multi-page navigation, zoom, rotation, watermark, and interactive bounding box rule highlights.
   - **ส่งเข้า AP Interface** (`ap`) with batch creation, limit checks, and Entra MFA simulation.
   - **สิทธิ์และการเชื่อมบัญชี** (`rbac`) with role permission matrix and user directory.
   - **ชุดเอกสารทดสอบ** (`cases`) test scenario explorer.
   - **บันทึกการเข้าถึง** (`audit`) audit trail log with date filtering.
   - **ตั้งค่า** (`settings`) with Personal, Org (APR), Locked Rules, IT Admin (AD ↔ Oracle account binding), and History tabs.
   - **มาตรฐาน Payload** (`std`) Standard v6.10 schema explorer and JSON download.
   - **Document Simulation** (`sim`) sandbox runner, lifecycle flow diagram, and preset scenarios.
3. **Domain-Driven Architecture**: Decouple logic into strict TypeScript interfaces, domain-oriented React Contexts, and focused component units under 200 lines each.
4. **Zero Heavy UI Library Bloat**: Pure Vanilla CSS utilizing existing `:root` design tokens.

---

## 2. Technology Stack & Directory Structure

### 2.1 Stack
- **Framework**: Vite + React 19
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Vanilla CSS with structured design tokens (`tokens.css`, `layout.css`, `queue.css`, `evidence.css`, `components.css`)
- **Icons**: Custom SVG Icon system encapsulating all mockup SVG paths without external bundle dependencies
- **Persistence**: `localStorage` integration for user preferences (`aiva.pref.<userId>`) and navigation state
- **Testing**: Vitest for domain logic unit testing

### 2.2 Directory Structure
```
src/react/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── docs/
│   └── plans/
│       ├── task.md
│       └── 2026-10-08-aiva-react-conversion-design.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types/
    │   ├── auth.ts              # User, Role, Permissions (EU, ACC, APR, ADM)
    │   ├── invoice.ts           # InvoiceDoc, LineItem, PoLine, GrLine, RuleCheck
    │   ├── settings.ts          # Preferences, OrgSettings, SettingLog, AccountMap
    │   ├── audit.ts             # AuditEntry schema
    │   └── sim.ts               # Simulation state & presets
    ├── mock/
    │   ├── companies.ts         # AH, AHT, AHP, AM, org definitions
    │   ├── users.ts             # Users u1-u8, Entra emails, roles
    │   ├── rules.ts             # Standard v6.10 E01–E15 definitions & severities
    │   ├── vendors.ts           # Vendor master, tax IDs, templates
    │   ├── initialDocs.ts       # Mock invoice dataset covering all edge cases
    │   └── presets.ts           # Simulation preset scenarios
    ├── context/
    │   ├── AuthContext.tsx      # Active user, switchUser, permissions & scoping
    │   ├── InvoiceContext.tsx   # Invoices state, selection, filters, actions
    │   ├── SettingsContext.tsx  # Personal preferences, org settings, IT account maps
    │   ├── SimContext.tsx       # Simulation runner, payload builder, presets
    │   └── ToastModalContext.tsx# Confirmation modal & toast system
    ├── components/
    │   ├── layout/
    │   │   ├── Topbar.tsx       # Header, role pill, user switch dropdown
    │   │   ├── Sidebar.tsx      # Collapsible navigation with badge counters
    │   │   ├── Modal.tsx        # Global dialog handler
    │   │   └── Toast.tsx        # Notification toast container
    │   ├── common/
    │   │   ├── Icon.tsx         # Unified SVG icon renderer
    │   │   ├── StatusBadge.tsx  # Status pill with dot indicators
    │   │   ├── KpiCard.tsx      # Metric card with icon and count
    │   │   └── FilterChip.tsx   # Pill buttons for company & status filters
    │   ├── queue/
    │   │   ├── QueueToolbar.tsx # Scope filters, period selector, view switcher
    │   │   ├── QueueKpiCards.tsx# Auto-pass, Review, Hold, Manual Review, etc.
    │   │   ├── QueueTableView.tsx # Summary table with column visibility
    │   │   ├── QueueSplitView.tsx # 2-pane queue list + detail pane
    │   │   ├── QueueListItem.tsx  # Left sidebar invoice card
    │   │   ├── InvoiceDetailPane.tsx # Detail tabs: Summary, Lines, Rules, History
    │   │   └── ActionModals.tsx # Modals for Confirm, Review, Hold, Reject
    │   ├── evidence/
    │   │   ├── EvidenceViewerDock.tsx # Resizable/collapsible dock container
    │   │   ├── EvidenceCanvas.tsx     # Simulated digital/scanned invoice renderer
    │   │   ├── EvidenceHighlight.tsx  # Bounding box overlays linked to rules
    │   │   └── DockControls.tsx       # Zoom, rotate, page pagination, watermark
    │   ├── ap/
    │   │   ├── ApPage.tsx             # AP Interface batch generator & pending list
    │   │   └── MfaChallengeModal.tsx  # MFA verification for APR high amounts
    │   ├── settings/
    │   │   ├── SettingsPage.tsx       # Tab controller
    │   │   ├── PersonalTab.tsx        # Personal preferences (columns, period)
    │   │   ├── OrgSettingsTab.tsx     # APR org policies & limits
    │   │   ├── LockedTab.tsx          # Read-only standard rules & exception table
    │   │   ├── ItAdminTab.tsx         # AD user ↔ Oracle receiver mapping
    │   │   └── HistoryTab.tsx         # Settings audit change log
    │   ├── rbac/
    │   │   └── RbacPage.tsx           # RBAC permissions matrix & user table
    │   ├── audit/
    │   │   └── AuditPage.tsx          # System access and action log table
    │   ├── cases/
    │   │   └── CasesPage.tsx          # Test cases scenario index
    │   ├── std/
    │   │   └── StdPage.tsx            # Standard v6.10 spec & schema download
    │   └── sim/
    │       ├── SimPage.tsx            # Simulator tab controller
    │       ├── SimConsole.tsx         # Raw JSON ingest & engine execution
    │       ├── SimLifecycle.tsx       # Visual document lifecycle diagram
    │       └── SimMatrix.tsx          # Scenario matrix runner
    └── styles/
        ├── tokens.css
        ├── base.css
        ├── layout.css
        ├── queue.css
        ├── evidence.css
        └── components.css
```

---

## 3. Data Models & State Management

### 3.1 Authentication & RBAC (`AuthContext`)
- **Roles**:
  - `EU` (End User / Receiver): Access restricted to documents where `doc.receiver` matches accounts mapped to the user (`acctsOf(user)`).
  - `ACC` (Accounting Staff): Access to documents within assigned companies (`AH`, `AHT`, `AHP`, `AM`). Can Confirm, Review, Hold, Reject, and view AP.
  - `APR` (Accounting Head): All ACC rights plus Manual Review, Duplicate Override, Unconfirm, Post Batch to AP, Return Failed, and Audit log. Post limit enforced with MFA.
  - `ADM` (IT Admin): Exclusively manages Account Mappings (`MAPS`) and company assignments. Cannot view document contents (SEC-10).
- **Core Functions**:
  - `scopeCheck(doc, user): { ok: boolean, why?: string }`
  - `can(permission: Permission): boolean`
  - `switchUser(userId: string)`

### 3.2 Invoice Review & Actions (`InvoiceContext`)
- **Documents Collection**: Reactive state initialized with seed data from `DOCS`, updated immutably on workflow actions.
- **Workflow State Transitions**:
  - `confirm`: Moves to `Confirmed` (or `Posted` if auto-posted). Requires high-severity check validation.
  - `review` / `hold`: Moves to `Review` or `Hold`. Requires selecting a reason from org settings.
  - `reject`: Moves to `Rejected`. Requires reason.
  - `unconfirm`: Reverts confirmed document.
  - `returnf`: Marks import failed document as returned.
- **Audit Logging**: Every action appends an immutable entry to `AUDIT` and document-specific history.

### 3.3 Settings & Account Mapping (`SettingsContext`)
- **Personal Preferences**:
  - `period`: default queue period filter.
  - `view`: default view mode ('table' vs 'split').
  - `cols`: column toggles (`tax`, `po`, `rcv`, `own`, `up`, `age`).
  - `showClosed`: show closed invoices by default.
- **Org Settings** (APR only):
  - `staleDays`: threshold for aging invoices (1–90 days).
  - `limit.APR`: maximum batch limit per invoice before MFA required.
  - `reasons`: configurable reasons per action.
  - `euReason`: visibility mode for End User.
  - `print`: role-based print/download permissions.
- **IT Account Mapping** (ADM only):
  - Mandatory `itRef` parameter before any mapping modification.
  - Bidirectional M:N mapping between AD Users and Oracle Receiver account strings.

---

## 4. UI Components & Layout Specification

### 4.1 Layout & Navigation
- CSS Grid based shell (`56px` header + `1fr` body).
- Sidebar with collapsed (`60px`) and expanded (`224px`) states.
- Role pill with dynamic colors based on active user role.

### 4.2 Document Evidence Viewer Dock
- Browser-native simulation of invoice document with realistic vendor templates (Apex, Siam, Thai Summit, etc.).
- Active field highlight system: when inspecting a rule violation (e.g. `E03: Total Mismatch`), clicking the rule focuses and scrolls to the corresponding coordinate box overlay (`.hl.focus`) on the document canvas.
- Zoom controls: 50% to 200%, rotate 90°, page switcher, and dynamic security watermark.

### 4.3 Simulator & Developer Tools
- Full JSON schema ingestion console with live error and rule evaluation output.
- Interactive lifecycle flowchart tracing documents from Upload to AP Interface.
- Schema generator with 1-click JSON file download.

---

## 5. Verification & Testing Plan

1. **Type Checking**:
   - `tsc -b` must pass with 0 errors in strict mode.
2. **Build Test**:
   - `npm run build` must produce an optimized production bundle in `dist/`.
3. **Automated Unit Tests**:
   - Verify `scopeCheck` across all 4 roles.
   - Verify `bound()` resolution for Oracle receivers.
   - Verify action transitions and reason requirements.
4. **Browser Smoke Testing**:
   - Run `browser_subagent` to test UI interactions:
     - User switching between EU, ACC, APR, ADM.
     - Split view vs Table view toggle.
     - Document detail tabs (Summary, Lines, Rules, History).
     - Evidence Viewer Dock navigation, zoom, and rule highlights.
     - Navigation across all 8 pages.

---

## 6. Next Steps

Upon finalization of this design doc, transition directly to the **writing-plans** skill to generate a step-by-step implementation plan.
