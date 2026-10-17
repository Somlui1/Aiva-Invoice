# AIVA v5.2 Dark / Light UI/UX Major Upgrade Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transform the AIVA Frontend application from Mockup v4.18 to v5.2 Dark / Light Premium Edition, fixing zoom-out layout defects with a 100dvh unified CSS Grid, adding all v5.2 features (Command Palette, Theme Switcher, Splash Screen, Column Filters, 4-Tab RBAC Console), while preserving 100% of backend API, Prisma models, Engine adapters, and real PDF rendering.

**Architecture:** An incremental component & CSS overhaul executed across 4 bounded rounds. Foundation tokens support both Graphite (Dark, default) and Porcelain (Light) with CSS variables. The viewport is locked to `100dvh` using `.shell` 2x2 grid and `.body { display: contents }`. Components in layout, queue, evidence, and governance are systematically updated to v5.2 markup without altering existing business logic or test IDs.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Vitest, Testing Library, Vanilla CSS with custom properties & View Transitions API, PDF.js, Prisma ORM, SQLite.

---

### Task 1: CSS Foundation & Design Tokens (Round 1)

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/base.css`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/components.css`
- Modify: `src/styles/queue.css`
- Modify: `src/styles/evidence.css`
- Create: `src/styles/cf.css`
- Create: `src/styles/pm.css`
- Create: `src/styles/fx.css`
- Test: `src/test/cssTokensV5.test.ts`

**Step 1: Write the failing test**
Create `src/test/cssTokensV5.test.ts` checking for key v5.2 tokens, dimensions (`--hdr-h: 52px`, `--nav-w: 236px`, `--nav-w-c: 60px`, `--q-w: 360px`), `data-theme` color definitions, and `100dvh` shell rule.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/cssTokensV5.test.ts`
Expected: FAIL (missing new tokens, dimensions, or classes).

**Step 3: Write minimal implementation**
- Extract tokens and styles from `mockup/AIVA-Auto-Invoice-Matching-v5.2-Dark-Light.html` (`aivacss`, `aivacss52`, `cfcss`, `pmcss`, `ivcss`).
- Update `tokens.css`, `base.css`, `layout.css`, `components.css`, `queue.css`, `evidence.css`.
- Add `cf.css` (column filters), `pm.css` (permission console), `fx.css` (animations, ripple, splash, command palette).

**Step 4: Run test to verify it passes**
Run: `npm test src/test/cssTokensV5.test.ts`
Expected: PASS.

**Step 5: Commit**
`git add src/styles/ src/test/cssTokensV5.test.ts; git commit -m "feat(ui): upgrade CSS tokens and design system to AIVA v5.2"`

---

### Task 2: ThemeContext & Layout 100dvh Integration (Round 1)

**Files:**
- Create: `src/context/ThemeContext.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/themeContext.test.tsx`

**Step 1: Write the failing test**
Create `src/test/themeContext.test.tsx` verifying:
- Default theme is `'dark'`.
- `toggleTheme()` toggles between `'dark'` and `'light'`.
- Attribute `data-theme` is set on `document.documentElement`.
- Theme selection persists in `localStorage.getItem('aiva.theme')`.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/themeContext.test.tsx`
Expected: FAIL (module not found).

**Step 3: Write minimal implementation**
- Implement `ThemeContext.tsx` with `ThemeProvider`, `useTheme()`, `setTheme()`, `toggleTheme(triggerEl?: HTMLElement)`, supporting view transitions if available.
- Update `src/app/layout.tsx`: add Google Fonts (`Bai Jamjuree`, `Noto Sans Thai`, `Inter`, `JetBrains Mono`), `<meta name="color-scheme" content="dark light">`, and import `cf.css`, `pm.css`, `fx.css`.
- Update `src/App.tsx`: wrap with `ThemeProvider`, ensure `.body { display: contents }` is styled and `.shell` grid tracks are active.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/themeContext.test.tsx`
Expected: PASS.

**Step 5: Commit**
`git add src/context/ThemeContext.tsx src/app/layout.tsx src/App.tsx src/test/themeContext.test.tsx; git commit -m "feat(ui): implement ThemeContext with dark default and 100dvh layout integration"`

---

### Task 3: Topbar & Theme Switcher Component (Round 2)

**Files:**
- Modify: `src/components/layout/Topbar.tsx`
- Test: `src/test/topbarV5.test.tsx`

**Step 1: Write the failing test**
Create `src/test/topbarV5.test.tsx` testing that `Topbar` renders:
- Breadcrumb pill `.crumb` with active page title.
- Command Palette trigger button (`.cmdk-btn`).
- Theme switcher button (`.theme-sw`) that toggles theme on click.
- User profile pill and environment badge.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/topbarV5.test.tsx`
Expected: FAIL (missing `.cmdk-btn` or `.theme-sw`).

**Step 3: Write minimal implementation**
Update `Topbar.tsx` with v5.2 markup, connecting `useTheme()` to `.theme-sw` with sliding knob and sun/moon icons, and adding `.cmdk-btn` with `Ctrl K` keyboard indicator.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/topbarV5.test.tsx`
Expected: PASS.

**Step 5: Commit**
`git add src/components/layout/Topbar.tsx src/test/topbarV5.test.tsx; git commit -m "feat(ui): update Topbar with v5.2 breadcrumb, theme switcher, and command palette trigger"`

---

### Task 4: Command Palette & Splash Screen (Round 2)

**Files:**
- Create: `src/components/layout/CommandPalette.tsx`
- Create: `src/components/layout/SplashScreen.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/commandPaletteAndSplash.test.tsx`

**Step 1: Write the failing test**
Create `src/test/commandPaletteAndSplash.test.tsx` testing:
- `SplashScreen` renders with `#splash`, brand ring animation, and dismisses.
- Pressing `Ctrl+K` opens `CommandPalette`.
- Tabs (All, Documents, Menus, Commands) filter items properly.
- Selecting a document navigates to `/queue` and selects that document.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/commandPaletteAndSplash.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Build `CommandPalette.tsx` with keyboard listeners (`Ctrl+K`, ArrowUp/Down, Enter, Esc), query state, tabs, document search via `useInvoices()`, and quick actions.
- Build `SplashScreen.tsx` matching v5.2 `#splash` HTML/CSS.
- Update `Sidebar.tsx` with v5.2 brand tile, counters, and footer.
- Mount `SplashScreen` and `CommandPalette` in `App.tsx`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/commandPaletteAndSplash.test.tsx`
Expected: PASS.

**Step 5: Commit**
`git add src/components/layout/CommandPalette.tsx src/components/layout/SplashScreen.tsx src/components/layout/Sidebar.tsx src/App.tsx src/test/commandPaletteAndSplash.test.tsx; git commit -m "feat(ui): add Command Palette, Splash Screen, and v5.2 Sidebar polish"`

---

### Task 5: Queue Experience, PDF Dock Focus & `.qrail` (Round 3)

**Files:**
- Modify: `src/components/queue/QueuePage.tsx`
- Modify: `src/components/queue/QueueToolbar.tsx`
- Modify: `src/components/queue/QueueKpiCards.tsx`
- Modify: `src/components/queue/QueueListItem.tsx`
- Modify: `src/components/queue/InvoiceDetailPane.tsx`
- Modify: `src/components/evidence/EvidenceViewerDock.tsx`
- Modify: `src/components/evidence/DockControls.tsx`
- Modify: `src/features/pdf-viewer/components/PdfCanvasViewer.tsx`
- Test: `src/test/queueFocusAndDock.test.tsx`

**Step 1: Write the failing test**
Create `src/test/queueFocusAndDock.test.tsx` testing:
- When PDF dock is open, `.work.pdf-open` applies `60% : 40%` split and displays vertical `.qrail` (32px).
- Clicking `.qrail` activates `.work.q-peek` with `.qscrim`.
- `DockControls` includes `.dock-rz` resizer and `.navpn` pagination buttons.
- `PdfCanvasViewer` defaults to fit-to-width.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/queueFocusAndDock.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Wire `.qrail` into `QueuePage.tsx` with `peekQueue` state.
- Update `QueueToolbar.tsx`, `QueueKpiCards.tsx`, `QueueListItem.tsx`, and `InvoiceDetailPane.tsx` with v5.2 badges (`.st-Auto-pass`, etc.), severity pills (`.sev`), and step rings.
- Update `EvidenceViewerDock.tsx` and `DockControls.tsx` with prev/next buttons and fit-to-width auto scaling.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/queueFocusAndDock.test.tsx`
Expected: PASS.

**Step 5: Commit**
`git add src/components/queue/ src/components/evidence/ src/features/pdf-viewer/ src/test/queueFocusAndDock.test.tsx; git commit -m "feat(ui): implement v5.2 queue focus layout with qrail, dock splitter, and fit-to-width"`

---

### Task 6: Granular Column Filters in Table View (Round 3)

**Files:**
- Modify: `src/components/queue/QueueTableView.tsx`
- Create: `src/components/queue/ColumnFilterPopover.tsx`
- Test: `src/test/columnFilters.test.tsx`

**Step 1: Write the failing test**
Create `src/test/columnFilters.test.tsx` testing:
- Table header columns display filter buttons.
- Clicking a column filter button opens `.cfp` popover.
- Applying a filter renders a chip in `.cfbar` with remove action.
- Filter criteria narrow the rendered rows properly.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/columnFilters.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Build `ColumnFilterPopover.tsx` supporting conditions: equals, contains, range, and status multi-select with live preview count.
- Add `.cfbar` chip summary bar below table toolbar.
- Connect column filter predicates to `QueueTableView.tsx`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/columnFilters.test.tsx`
Expected: PASS.

**Step 5: Commit**
`git add src/components/queue/QueueTableView.tsx src/components/queue/ColumnFilterPopover.tsx src/test/columnFilters.test.tsx; git commit -m "feat(ui): add granular column filters and cfbar chip bar in QueueTableView"`

---

### Task 7: 4-Tab Admin Permission Console (v4.22) in `/rbac` (Round 4)

**Files:**
- Modify: `src/components/governance/RbacPage.tsx`
- Create: `src/components/governance/rbac/RolePermissionMatrix.tsx`
- Create: `src/components/governance/rbac/CompanyScopeMatrix.tsx`
- Create: `src/components/governance/rbac/VisibilityTester.tsx`
- Create: `src/components/governance/rbac/UserInspectorPane.tsx`
- Modify: `src/components/governance/rbac/PermissionExcelGrid.tsx`
- Modify: `src/components/governance/rbac/AdUserSearchModal.tsx`
- Modify: `src/components/governance/rbac/SaveDiffModal.tsx`
- Test: `src/test/rbacConsoleV422.test.tsx`

**Step 1: Write the failing test**
Create `src/test/rbacConsoleV422.test.tsx` verifying:
- RbacPage renders 4 tabs: 1) Users & Scopes, 2) Role Matrix (`.pm-mx`), 3) Company Matrix (`.pm-cg`), 4) Visibility Tester (`.pm-tst`).
- Selecting a user populates the right Inspector pane (`.pm-insp`).
- Editing permission or scope triggers Draft Changes footer banner with pending count and Undo (`Ctrl+Z`).
- Review & Save opens `SaveDiffModal` displaying exact diff before persisting to `/api/users`.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/rbacConsoleV422.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Implement `RolePermissionMatrix.tsx`, `CompanyScopeMatrix.tsx`, `VisibilityTester.tsx`, and `UserInspectorPane.tsx`.
- Connect draft mutation state, undo stack, and persist via existing `/api/users` and `/api/companies` endpoints.
- Update `RbacPage.tsx` layout with `.pm`, `.pm-mx`, `.pm-insp`, and `.pm-foot`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/rbacConsoleV422.test.tsx`
Expected: PASS.

**Step 5: Commit**
`git add src/components/governance/RbacPage.tsx src/components/governance/rbac/ src/test/rbacConsoleV422.test.tsx; git commit -m "feat(ui): implement complete 4-tab Admin Permission Console in /rbac"`

---

### Task 8: Governance Pages Polish & Full Regression Verification (Round 4)

**Files:**
- Modify: `src/components/governance/ApPage.tsx`
- Modify: `src/components/governance/AuditPage.tsx`
- Modify: `src/components/governance/CasesPage.tsx`
- Modify: `src/components/governance/SettingsPage.tsx`
- Modify: `src/components/governance/StdPage.tsx`
- Modify: `src/components/governance/SimPage.tsx`
- Modify: `src/features/login/LoginPage.tsx`
- Test: Full Vitest suite (`npm test`), `npx tsc --noEmit`, `npm run build`

**Step 1: Write the regression test check**
Run: `npm test` across all 53+ test files.
Expected: PASS with 0 failures.

**Step 2: Write minimal implementation**
- Apply v5.2 design tokens, card elevations, badge styles, and tables to `ApPage.tsx`, `AuditPage.tsx`, `CasesPage.tsx`, `SettingsPage.tsx`, `StdPage.tsx`, `SimPage.tsx`, and `LoginPage.tsx`.
- Verify type definitions and clean up any unused v4 styles.

**Step 3: Run full verification suite**
Run:
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
Expected: All tests PASS, TypeScript exit 0, Next.js build exit 0 (19/19 routes generated).

**Step 4: Commit**
`git add src/components/governance/ src/features/login/; git commit -m "feat(ui): polish governance pages and login with v5.2 design"`
