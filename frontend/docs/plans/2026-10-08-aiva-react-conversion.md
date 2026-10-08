# AIVA Web Portal v4.18 React Conversion Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Convert the monolithic `AIVA-Web-Portal-Mockup-v4.18.html` prototype into a modular, production-ready Vite + React 19 + TypeScript application with 100% functional and visual fidelity across all 8 views and the interactive Evidence Viewer Dock.

**Architecture:** Domain-driven React component hierarchy powered by focused React Contexts (`AuthContext`, `InvoiceContext`, `SettingsContext`, `SimContext`, `ToastModalContext`) with strict TypeScript domain definitions and zero external UI bloat using the proven `:root` design token system.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vitest, Vanilla CSS (Design Tokens).

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`

**Step 1: Create package.json and configuration files**
Scaffold dependencies: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `vite`, `typescript`, `vitest`.

**Step 2: Install dependencies**
Run: `npm install`  
Expected: Dependencies installed with exit code 0.

**Step 3: Create index.html and minimal main.tsx**
Mount React root element `#root`.

**Step 4: Verify build setup**
Run: `npm run build`  
Expected: `vite build` succeeds creating `dist/`.

**Step 5: Commit**
```bash
git add package.json package-lock.json tsconfig*.json vite.config.ts index.html src/main.tsx
git commit -m "chore: scaffold Vite React TypeScript foundation"
```

---

### Task 2: Design Tokens & CSS Architecture

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/layout.css`
- Create: `src/styles/queue.css`
- Create: `src/styles/evidence.css`
- Create: `src/styles/components.css`
- Create: `src/components/common/Icon.tsx`

**Step 1: Extract and modularize CSS from mockup**
- Extract `:root` variables to `tokens.css` (Navy, Slate, Teal, Semantic colors, Spacing, Elevation).
- Extract body, reset, and typography to `base.css`.
- Extract grid shell, topbar, and collapsible nav to `layout.css`.
- Extract queue, split, detail, and KPI styles to `queue.css`.
- Extract invoice canvas, stamps, and bounding boxes to `evidence.css`.
- Extract modals, chips, badges, and tabs to `components.css`.

**Step 2: Create unified SVG Icon component**
Create `src/components/common/Icon.tsx` mapping all paths (`inbox`, `shield`, `send`, `file`, `zoom`, `check`, `sliders`, `trash`, `plus`, etc.).

**Step 3: Verify style compilation**
Import styles in `src/main.tsx` and run `npm run build`.  
Expected: Passes with exit code 0.

**Step 4: Commit**
```bash
git add src/styles/ src/components/common/Icon.tsx src/main.tsx
git commit -m "feat: setup CSS design tokens and SVG icon system"
```

---

### Task 3: Domain Types & Mock Datasets

**Files:**
- Create: `src/types/auth.ts`
- Create: `src/types/invoice.ts`
- Create: `src/types/settings.ts`
- Create: `src/types/audit.ts`
- Create: `src/types/sim.ts`
- Create: `src/mock/companies.ts`
- Create: `src/mock/users.ts`
- Create: `src/mock/rules.ts`
- Create: `src/mock/vendors.ts`
- Create: `src/mock/initialDocs.ts`
- Create: `src/mock/presets.ts`
- Test: `src/test/domain-types.test.ts`

**Step 1: Write failing test verifying mock data integrity**
Test company mappings (`AH`, `AHT`, `AHP`, `AM`), users (`u1`-`u8`), roles, and initial invoice status distribution.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/domain-types.test.ts`  
Expected: FAIL (files not yet created).

**Step 3: Implement domain types and mock data**
Extract all datasets from `AIVA-Web-Portal-Mockup-v4.18.html` lines 725–848 and lines 1470–1760.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/domain-types.test.ts`  
Expected: PASS.

**Step 5: Commit**
```bash
git add src/types/ src/mock/ src/test/domain-types.test.ts
git commit -m "feat: add domain types and seed master datasets"
```

---

### Task 4: State Management & Core Business Logic

**Files:**
- Create: `src/context/ToastModalContext.tsx`
- Create: `src/context/AuthContext.tsx`
- Create: `src/context/SettingsContext.tsx`
- Create: `src/context/InvoiceContext.tsx`
- Create: `src/context/SimContext.tsx`
- Test: `src/test/business-logic.test.ts`

**Step 1: Write unit tests for core business logic**
Tests for:
- `scopeCheck(doc, user)` for `EU`, `ACC`, `APR`, `ADM`.
- `bound(receiver)` for Oracle receiver resolution.
- `executeAction` state transitions (Confirm, Review, Hold, Reject) with reason requirement.
- `setOrgLimit` requiring MFA verification.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/business-logic.test.ts`  
Expected: FAIL.

**Step 3: Implement context providers and custom hooks**
- `AuthContext`: Active user, role, `can(p)`, `scopeCheck(d)`, `switchUser(uid)`.
- `ToastModalContext`: `openModal(...)`, `closeModal()`, `toast(msg, isError)`.
- `SettingsContext`: Preferences with `localStorage`, Org policies, IT Account mappings (`MAPS`).
- `InvoiceContext`: Filtered docs, KPI counters, active selection, workflow actions.
- `SimContext`: Ingest sandbox runner, lifecycle states, scenario matrix.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/business-logic.test.ts`  
Expected: PASS.

**Step 5: Commit**
```bash
git add src/context/ src/test/business-logic.test.ts
git commit -m "feat: implement React contexts and business rules engine"
```

---

### Task 5: App Shell Layout & Navigation

**Files:**
- Create: `src/components/common/StatusBadge.tsx`
- Create: `src/components/common/FilterChip.tsx`
- Create: `src/components/layout/Topbar.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Modal.tsx`
- Create: `src/components/layout/Toast.tsx`
- Modify: `src/App.tsx`

**Step 1: Implement Topbar and UserSwitcher**
Render brand logo, role pill with dynamic colors, and user selector dropdown triggering `switchUser`.

**Step 2: Implement Sidebar**
Render collapsible sidebar with 4 sections, active state indicators, and real-time counter badges.

**Step 3: Implement Modal & Toast components**
Hook into `ToastModalContext` to render confirmation dialogs and transient notifications.

**Step 4: Verify App shell rendering**
Run: `npm run build`  
Expected: Compiles cleanly with exit code 0.

**Step 5: Commit**
```bash
git add src/components/layout/ src/components/common/ src/App.tsx
git commit -m "feat: implement App shell layout, topbar, and collapsible sidebar"
```

---

### Task 6: Queue & Review Views (Table & Split Modes)

**Files:**
- Create: `src/components/queue/QueueToolbar.tsx`
- Create: `src/components/queue/QueueKpiCards.tsx`
- Create: `src/components/queue/QueueTableView.tsx`
- Create: `src/components/queue/QueueListItem.tsx`
- Create: `src/components/queue/InvoiceDetailPane.tsx`
- Create: `src/components/queue/ActionModals.tsx`
- Create: `src/components/queue/QueuePage.tsx`

**Step 1: Implement QueueToolbar & QueueKpiCards**
Add company chips (`AH`, `AHT`, `AHP`, `AM`), period filter, show closed toggle, view switcher (`split` vs `table`), and reactive KPI metric cards.

**Step 2: Implement QueueTableView**
Render summary data table respecting user's configured column visibility (`tax`, `po`, `rcv`, `own`, `up`, `age`), row selection, and age coloring.

**Step 3: Implement QueueSplitView & Detail Pane**
Render left scrollable queue list + middle invoice detail pane with tabs:
- `Summary`: PO vs Invoice comparison, header metadata, exception summary.
- `Lines`: Line items comparison with GR & PO lines.
- `Rules`: Standard v6.10 rule checks (V-01..V-09).
- `History`: Append-only audit history with EU visibility filter.

**Step 4: Implement Action Modals**
Modals for Confirm, Move to Review/Hold, Reject, Unconfirm, and Return Failed with reason select and notes.

**Step 5: Verify build**
Run: `npm run build`  
Expected: Compiles with 0 errors.

**Step 6: Commit**
```bash
git add src/components/queue/
git commit -m "feat: implement Queue page with Summary Table, Split View, and Review actions"
```

---

### Task 7: Evidence & Document Viewer Dock

**Files:**
- Create: `src/components/evidence/EvidenceCanvas.tsx`
- Create: `src/components/evidence/EvidenceHighlight.tsx`
- Create: `src/components/evidence/DockControls.tsx`
- Create: `src/components/evidence/EvidenceViewerDock.tsx`

**Step 1: Implement EvidenceCanvas**
Render simulated invoice layout with digital/scanned styling, vendor headers (Apex, Siam, etc.), barcodes, tables, and stamps.

**Step 2: Implement EvidenceHighlight overlays**
Render coordinate bounding boxes (`.hl[data-rule]`) that highlight and scroll into view when a rule check is clicked in the detail pane.

**Step 3: Implement DockControls**
Page pagination (`Page X of Y`), zoom controls (50%–200%), rotate controls, open in new tab, and security watermark (`ดูผ่าน AIVA Portal · {user.email} · token {token}`).

**Step 4: Integrate with QueueSplitView**
Enable side-by-side dock viewing with responsive 3-column layout (`--q-w`, middle detail, right dock).

**Step 5: Commit**
```bash
git add src/components/evidence/
git commit -m "feat: implement Evidence Viewer Dock with invoice canvas and rule highlights"
```

---

### Task 8: Governance, Admin & Simulation Pages

**Files:**
- Create: `src/components/ap/ApPage.tsx`
- Create: `src/components/settings/PersonalTab.tsx`
- Create: `src/components/settings/OrgSettingsTab.tsx`
- Create: `src/components/settings/LockedTab.tsx`
- Create: `src/components/settings/ItAdminTab.tsx`
- Create: `src/components/settings/HistoryTab.tsx`
- Create: `src/components/settings/SettingsPage.tsx`
- Create: `src/components/rbac/RbacPage.tsx`
- Create: `src/components/audit/AuditPage.tsx`
- Create: `src/components/cases/CasesPage.tsx`
- Create: `src/components/std/StdPage.tsx`
- Create: `src/components/sim/SimConsole.tsx`
- Create: `src/components/sim/SimLifecycle.tsx`
- Create: `src/components/sim/SimMatrix.tsx`
- Create: `src/components/sim/SimPage.tsx`

**Step 1: Implement AP Interface Page (`/ap`)**
Render pending invoices for batch creation, total amount calculation, APR threshold check, and MFA dialog.

**Step 2: Implement Settings Page (`/settings`)**
Render 5 tabs: Personal preferences, Org settings (APR), Locked standard policies, IT Admin (AD ↔ Oracle account binding and company assignments), and Settings change history.

**Step 3: Implement RBAC & Audit Pages (`/rbac`, `/audit`)**
Render permission matrix, user directory, and complete audit log table with date filtering.

**Step 4: Implement Developer & Simulator Tools (`/cases`, `/std`, `/sim`)**
- `Cases`: Test case scenario index.
- `Std`: Standard v6.10 schema explorer with JSON download.
- `Sim`: Simulator console with raw payload runner, lifecycle diagram, and scenario presets.

**Step 5: Verify build**
Run: `npm run build`  
Expected: Passes with 0 errors.

**Step 6: Commit**
```bash
git add src/components/ap/ src/components/settings/ src/components/rbac/ src/components/audit/ src/components/cases/ src/components/std/ src/components/sim/
git commit -m "feat: implement AP Interface, Settings, RBAC, Audit, and Simulator pages"
```

---

### Task 9: Verification, Smoke Testing & Final Polishing

**Files:**
- Test: `src/test/e2e-smoke.test.ts`

**Step 1: Run complete test suite**
Run: `npx vitest run`  
Expected: All tests PASS.

**Step 2: Run strict TypeScript check and build**
Run: `npm run build`  
Expected: `tsc -b` and `vite build` complete with zero errors.

**Step 3: Smoke test application using browser automation**
Launch Vite dev server and test:
- User switching between EU, ACC, APR, ADM.
- Toggling between Table summary and Split 2-pane view.
- Opening Evidence dock and zooming/clicking rule highlights.
- Navigating to each of the 8 pages.

**Step 4: Update task tracker and finalize**
Update `docs/plans/task.md` with all completed tasks and verification evidence.

**Step 5: Commit**
```bash
git add .
git commit -m "feat: complete AIVA Web Portal React conversion with full verification"
```
