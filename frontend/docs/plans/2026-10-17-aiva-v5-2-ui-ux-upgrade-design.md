# Design Specification — AIVA v5.2 Dark / Light UI/UX Major Upgrade

**Date:** 2026-10-17  
**Status:** Approved  
**Mockup Reference:** [`mockup/AIVA-Auto-Invoice-Matching-v5.2-Dark-Light.html`](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/mockup/AIVA-Auto-Invoice-Matching-v5.2-Dark-Light.html)

---

## 1. Executive Summary & Goals

This document specifies the major UI/UX upgrade of the `frontend` Next.js application from Mockup v4.18 to **AIVA v5.2 Dark / Light Premium Edition**.

### Core Objectives:
1. **100% Backend & Logic Preservation:**  
   Preserve all API routes (`src/app/api/`), Prisma models & dev database (`prisma/schema.prisma`), Engine adapters (`src/features/engine/`), backend client (`src/lib/backendApi.ts`), auth tokens/cookies, and the multi-page PDF rendering pipeline with Bounding Box overlays (`PdfCanvasViewer` + `BoundingBoxOverlay`).
2. **Eliminate Zoom-out / Sparse Layout Defects:**  
   Lock the viewport to `100dvh` (`min-height: 640px; overflow: hidden`) and apply the unified 2-column CSS Grid (`grid-template-columns: var(--nav-w) minmax(0, 1fr); grid-template-rows: var(--hdr-h) minmax(0, 1fr)`) with `.body { display: contents }`. Apply exact v5.2 typography (`Bai Jamjuree`, `Noto Sans Thai`, `Inter`) and density.
3. **Incorporate All New v5.2 Features:**  
   - Dark (Graphite, Default) & Light (Porcelain) Theme Switcher (`.theme-sw`) with smooth ripple/bloom FX and `localStorage` persistence.
   - Command Palette (`Ctrl+K` / `.cmdk-ov`) with categorical filtering (All, Documents, Menus, Commands).
   - Animated Splash Screen (`#splash`) during initial workspace load.
   - Granular Column Filters in Table View (`.cfp` popover and `.cfbar` chip summary bar) with live match previews.
   - Full 4-tab Admin Permission Console (v4.22) in `/rbac`: Users & Scopes, Role Matrix (`.pm-mx`), Company Matrix (`.pm-cg`), and Visibility Tester (`.pm-tst`), with Inspector (`.pm-insp`), Draft Changes banner, Undo (`Ctrl+Z`), Add User Directory Modal, and Diff Modal.
   - PDF Dock: resizable column splitter (`.dock-rz`), prev/next document pagination (`.navpn`), 60:40 focus layout with auto-collapsing sidebar (`--nav-w-c: 60px`) and queue rail (`.qrail: 32px`).

---

## 2. Architecture & Delivery Plan (4 Rounds)

### Round 1: Foundation, CSS System & Theme Engine
- **Tokens & Themes:** Create unified `tokens.css` with dark (`:root`, `:root[data-theme=dark]`) and light (`:root[data-theme=light]`) palettes, exact dimensions (`--hdr-h: 52px`, `--nav-w: 236px`, `--nav-w-c: 60px`, `--q-w: 360px`), typography (`Bai Jamjuree`, `Noto Sans Thai`, `Inter`, `JetBrains Mono`), and component elevation tokens.
- **CSS Architecture:**
  * `tokens.css`: Dark/Light palette variables, density, radii, brand tiles, status badges, severity tags.
  * `base.css`: 100dvh reset, webkit scrollbars, focus rings, base typography `12.5px - 13px`.
  * `layout.css`: `.shell` 2x2 grid, `.body { display: contents }`, `.nav`, `.topbar`, `.main`, responsive breakpoints.
  * `queue.css`: Queue views, `.work` 4-track grid (`--rc minmax(0, --qc) minmax(0, --mc) minmax(0, --dc)`), `.qrail` (32px), `.q47`, `.detail`, `.dock`.
  * `evidence.css`: PDF dock styling, canvas viewer, bounding box highlights, mock paper fallback (`.ivp-paper`).
  * `components.css`: Buttons, badges, tabs, chips, toolbars, toasts, modals, spinner animations.
  * `cf.css`: Column filters (`.cfp`, `.cfbar`).
  * `pm.css`: Permission console (`.pm`, `.pm-mx`, `.pm-cg`, `.pm-tst`, `.pm-insp`, `.pm-foot`).
  * `fx.css`: Splash screen, theme switcher bloom/sparks/ripple, command palette.
- **ThemeContext:** Provide `theme` (`'dark' | 'light'`), `toggleTheme(triggerEl?: HTMLElement)`, `setTheme(theme)`, default `'dark'`, save to `localStorage.getItem('aiva.theme')`, and set `data-theme` on `document.documentElement`.
- **App & Shell Integration:** Update `src/app/layout.tsx` (Google Fonts, meta tags) and `src/App.tsx` (mounting ThemeProvider, Splash screen, Command palette).

### Round 2: Navigation, Command Palette & Splash Screen
- **Splash Screen (`SplashScreen.tsx`):**
  * Displays centered AIVA brand tile with rotating glowing rings, pulse particles, brand subtitle (`OCR › Match › Post to Oracle`), progress bar, and status messages.
  * Auto-fades out after initial load (or upon user dismissal).
- **Topbar (`Topbar.tsx`):**
  * Breadcrumb pill (`.crumb`), Command Palette trigger button (`.cmdk-btn` with `Ctrl K` badge), Environment badge (`.env`), Theme switcher toggle (`.theme-sw`), and User Profile Pill (`.who`).
- **Command Palette (`CommandPalette.tsx`):**
  * Global listener for `Ctrl+K` / `Cmd+K`.
  * Category tabs: All, Documents (search live invoices by number, vendor, PO, amount), Menus (quick navigate to Queue, AP, RBAC, Audit, Settings), and Actions (Toggle Theme, Collapse Sidebar, Table View).
  * Keyboard navigation (Up/Down arrow, Enter, Escape).
- **Sidebar (`Sidebar.tsx`):**
  * Brand tile with AIVA logo mark, collapsible toggle, role-scoped menus, counter badges (`.cnt`), active indicators with teal border, Standard schema footer.

### Round 3: Queue Experience, Column Filters & PDF Dock Focus
- **Queue Views:**
  * `QueueToolbar`: Search box, period filter dropdown, role filters, view mode toggle (Table / Split), refresh button.
  * `QueueKpiCards`: Cards with status counts and severity indicators matching v5.2 badge styles.
  * `QueueTableView`: Full data grid with **Column Filters (`.cfp` popover and `.cfbar` chip summary)** allowing condition selection (equals, contains, range, status multi-select), live preview count, apply, and undo toast.
  * `QueueListItem`: Rich list items with status badges (`.st-Auto-pass`, `.st-Review`, `.st-Hold`, `.st-Manual`), vendor names, PO numbers, and amounts.
- **InvoiceDetailPane:**
  * 3-tier header, progress steps with animated rings, 3-tab layout (Invoice Info, Line Items / PO Matching, Validation Evidence & Exceptions).
  * Interactive action buttons (Confirm, Review, Hold, Reject) with state guards.
- **EvidenceViewerDock & PDF Viewer:**
  * Left-edge resizable splitter (`.dock-rz`), prev/next navigation (`.navpn`), fit-to-width auto-scaling.
  * When PDF dock opens: `.work.pdf-open` activates `60% : 40%` grid ratio, hides queue list and exposes 32px vertical `.qrail` with click-to-peek overlay (`.work.q-peek`).
  * Real PDF rendering via `PdfCanvasViewer` + `BoundingBoxOverlay`, with fallback to `.ivp-paper` for mock-only documents.

### Round 4: Admin Permission Console (v4.22) & Governance Pages
- **Admin Permission Console (`RbacPage.tsx`):**
  * 4 Internal Tabs:
    1. Users & Scopes (`.pm-users` table with identity, role pill, company scope chips, status).
    2. Role Permission Matrix (`.pm-mx` grid mapping 14 permissions across roles EU, ACC, APR, ADM, SA).
    3. Company Scope Matrix (`.pm-cg` mapping company entities AH, AHT, AHP, AM, etc.).
    4. Visibility Tester (`.pm-tst` simulating document visibility for selected user).
  * Right Inspector Panel (`.pm-insp` displaying user details, assigned scope, and permission breakdown).
  * Draft Changes Banner (`.pm-foot` showing pending edit count, Undo `Ctrl+Z`, and Review & Save button).
  * Modals: Add User from Directory (`AdUserSearchModal`), Save Diff Inspector (`SaveDiffModal`) connected to `/api/users` and `/api/companies`.
- **Governance Pages:**
  * Update `ApPage.tsx`, `AuditPage.tsx`, `CasesPage.tsx`, `SettingsPage.tsx`, `StdPage.tsx`, and `SimPage.tsx` to inherit v5.2 design tokens, cards, and tables.
  * Polish `LoginPage.tsx` with v5.2 dark/light aesthetic.

---

## 3. Preservation & Quality Gates

1. **Test Suite Invariant:**  
   All 53 existing test files (289 tests) in `src/test/` must pass after each round. Existing test IDs (`data-testid`) must be preserved.
2. **Type Safety:**  
   `npx tsc --noEmit` must complete with zero errors.
3. **Build Integrity:**  
   `npm run build` must generate all 19 Next.js production routes cleanly.
4. **Backend Invariant:**  
   Files in `src/app/api/`, `src/features/engine/`, `src/lib/`, and `prisma/` are strictly preserved.
