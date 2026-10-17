# AIVA v5.2 Parity & 6 Core Defects Resolution Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Resolve all 6 identified visual, presentation, and data availability defects in the AIVA Frontend to achieve 100% parity with prototype v5.2.

**Architecture:** Bind all presentation surfaces and table containers to CSS Design Tokens eliminating dark-mode clashing; mount the profile modal cleanly via React Portal with glassmorphic styles; unblock auto-seeding to ensure 125 sample documents are always ingested and add a Topbar Role Quick Switcher; port the v5.2 FX Animation Engine for theme switching, login transitions, and splash screen orbital rings; and upgrade the brand logo and Icon component to Prism v2 duotone depth.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma ORM (SQLite), CSS Design Tokens, Vitest, Testing Library.

---

### Task 1: Theme Clashing Fix (Table Panels, KPI Cards, Excel Grid)

**Files:**
- Modify: `src/styles/components.css`
- Modify: `src/styles/queue.css`
- Modify: `src/styles/permissionGrid.css`
- Modify: `src/styles/pm.css`
- Create: `src/test/theme-tokens-parity.test.ts`

**Step 1: Write the failing test**
Create `src/test/theme-tokens-parity.test.ts` asserting that `components.css` does NOT contain hardcoded `.panel { background: #fff; }`, that `queue.css` does NOT contain `.tbl-wrap { background: #fff; }` or hardcoded `#FAFBFC` / `#F5F9FE`, and that `var(--surface)` is bound.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/theme-tokens-parity.test.ts`
Expected: FAIL

**Step 3: Implement minimal code**
Update:
1. `src/styles/components.css`:
   - Change `.panel { background: #fff; ... }` $\rightarrow$ `.panel { background: var(--surface); color: var(--s-900); ... }`
   - Ensure `.panel-h` uses `background: var(--head); border-bottom: 1px solid var(--line);`
2. `src/styles/queue.css`:
   - Change `.tbl-wrap { background: #fff; ... }` $\rightarrow$ `.tbl-wrap { background: var(--surface); border: 1px solid var(--line); ... }`
   - Change `table.t tbody tr:nth-child(even) td { background: #FAFBFC; }` $\rightarrow$ `background: var(--surface-2);`
   - Change `table.t tbody tr:hover td, table.t tr.click:hover td { background: #EEF4FB; }` $\rightarrow$ `background: var(--hov-2, color-mix(in srgb, var(--surface) 90%, var(--teal) 10%));`
   - Change `.kpi.on { ... background: #F5F9FE; }` $\rightarrow$ `background: var(--surface-2);`
3. `src/styles/permissionGrid.css` & `src/styles/pm.css`:
   - Bind all panel surfaces and header lines to `var(--surface)`, `var(--surface-2)`, and `var(--line)`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/theme-tokens-parity.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/styles/components.css src/styles/queue.css src/styles/permissionGrid.css src/styles/pm.css src/test/theme-tokens-parity.test.ts; git commit -m "fix(theme): eliminate hardcoded white table and panel backgrounds in dark mode"`

---

### Task 2: Profile Modal React Portal Mount & Glassmorphic Floating Card

**Files:**
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/components/layout/MyProfileModal.tsx`
- Modify: `src/styles/components.css`
- Create: `src/test/profile-modal-portal.test.tsx`

**Step 1: Write the failing test**
Create `src/test/profile-modal-portal.test.tsx` testing that when `isOpen={true}`, `MyProfileModal` mounts outside the Topbar directly into `document.body` via React Portal, renders with glassmorphic styles, and contains no hardcoded `#ffffff` inline styles.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/profile-modal-portal.test.tsx`
Expected: FAIL

**Step 3: Implement minimal code**
1. In `src/components/layout/MyProfileModal.tsx`:
   - Import `createPortal` from `react-dom`.
   - Wrap the return modal tree in `createPortal(..., document.body)`.
   - Replace hardcoded inline colors with CSS design token classes or variables:
     - Backdrop: `position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(8px); z-index: 10000;`
     - Modal card: `background: var(--glass-2, var(--surface)); border: 1px solid var(--line-strong); box-shadow: var(--e-3); border-radius: 16px; backdrop-filter: blur(20px); color: var(--s-900);`
     - Card header: `background: var(--surface-2); border-bottom: 1px solid var(--line);`
     - Account list and badges: use `var(--surface)`, `var(--line)`, and `var(--s-900)`.
2. In `src/styles/components.css`:
   - Add `.profile-modal-ov` and `.profile-modal-box` helper classes supporting clean glassmorphism.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/profile-modal-portal.test.tsx`
Expected: PASS

**Step 5: Commit**
`git add src/components/layout/Topbar.tsx src/components/layout/MyProfileModal.tsx src/styles/components.css src/test/profile-modal-portal.test.tsx; git commit -m "fix(profile): mount profile modal via React Portal with glassmorphic tokens"`

---

### Task 3: Auto-Seed 125 Invoices Ingestion & Topbar Role Quick Switcher

**Files:**
- Modify: `src/lib/autoSeedSample.ts`
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/context/AuthContext.tsx`
- Create: `src/test/autoseed-role-switcher.test.tsx`

**Step 1: Write the failing test**
Create `src/test/autoseed-role-switcher.test.tsx` testing that `autoSeedSample` ensures count is at least 125 documents, and that `Topbar` renders a role switch affordance allowing instant switching between SA, ACC, APR, and EU roles.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/autoseed-role-switcher.test.tsx`
Expected: FAIL

**Step 3: Implement minimal code**
1. Remove `.cleared` file if present: `rm .cleared`
2. In `src/lib/autoSeedSample.ts`:
   - Change `if (docCount > 0) return;` $\rightarrow$ `if (docCount >= 125) return;`
   - Run seed ingestion to guarantee 125 documents exist in SQLite database and sync with `initialDocs.ts`.
3. In `src/context/AuthContext.tsx`:
   - Add `switchRole: (role: RoleKey) => void` that dynamically sets `currentRole`, adjusts company scope, and assigns sample receiver account for EU so documents match.
4. In `src/components/layout/Topbar.tsx`:
   - Add an interactive Role Switcher dropdown/pill in Topbar allowing users to switch roles instantly.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/autoseed-role-switcher.test.tsx`
Expected: PASS

**Step 5: Commit**
`git add src/lib/autoSeedSample.ts src/components/layout/Topbar.tsx src/context/AuthContext.tsx src/test/autoseed-role-switcher.test.tsx; git commit -m "feat(data): guarantee 125 sample invoices seed and add Topbar role quick switcher"`

---

### Task 4: FX Animation Engine Core & Theme Transition Integration

**Files:**
- Create: `src/lib/fxEngine.ts`
- Modify: `src/styles/fx.css`
- Modify: `src/context/ThemeContext.tsx`
- Create: `src/test/fx-engine-theme.test.ts`

**Step 1: Write the failing test**
Create `src/test/fx-engine-theme.test.ts` verifying that `bloom`, `sparks`, `ring`, `sweep`, `hud`, and `AIVA_FX` create appropriate elements inside `#fxLayer` and animate them.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/fx-engine-theme.test.ts`
Expected: FAIL

**Step 3: Implement minimal code**
1. Create `src/lib/fxEngine.ts`:
   - Implement `bloom(x, y, col, size)`
   - Implement `sparks(x, y, light, n)`
   - Implement `ring(x, y, R, cls, delay)`
   - Implement `sweep(delay)`
   - Implement `hud(light)` with glassmorphism, progress bar countdown, and icons
   - Implement `FX.warp(x, y)`, `FX.welcome(user, message, isSkip, isResume)`, and `FX.appIn({ lite })`
2. Update `src/styles/fx.css`:
   - Add styles for `.fx-layer`, `.fx-bloom`, `.fx-spark`, `.fx-ring`, `.fx-sweep`, `.fx-warp`, `.fx-hud`, `.fx-welcome` from prototype v5.2 lines 3360–3460.
   - Add `@keyframes ringSpin`, `@keyframes hudPg`, `@keyframes okPop`, `@keyframes swGlow`, `@keyframes knSquash`.
3. In `src/context/ThemeContext.tsx`:
   - Integrate `bloom`, `sparks`, and `hud` on theme toggle with circular `clip-path` transition via `document.startViewTransition`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/fx-engine-theme.test.ts`
Expected: PASS

**Step 5: Commit**
`git add src/lib/fxEngine.ts src/styles/fx.css src/context/ThemeContext.tsx src/test/fx-engine-theme.test.ts; git commit -m "feat(fx): implement authentic v5.2 FX animation engine and theme transition"`

---

### Task 5: Login Page Warp & Welcome FX + Splash Screen Orbital Rings Animation

**Files:**
- Modify: `src/features/login/LoginPage.tsx`
- Modify: `src/components/layout/SplashScreen.tsx`
- Modify: `src/styles/fx.css`
- Create: `src/test/splash-login-fx.test.tsx`

**Step 1: Write the failing test**
Create `src/test/splash-login-fx.test.tsx` verifying `#splash` has `.ring.r1` and `.ring.r2`, 4-phase status text, and that `LoginPage` triggers warp and exit animations.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/splash-login-fx.test.tsx`
Expected: FAIL

**Step 3: Implement minimal code**
1. In `src/styles/fx.css`:
   - Add `@keyframes spR1` (7s linear infinite) and `@keyframes spR2` (9s linear infinite).
   - Add `@keyframes spBeam` (1.4s sweep).
   - Add `@keyframes lgOutL`, `@keyframes lgOutR`, `@keyframes lgBg` for `#lg.out`.
2. In `src/components/layout/SplashScreen.tsx`:
   - Update orbital rings and 4-step status sequence: "Initializing workspace…" $\rightarrow$ "Preparing workspace…" $\rightarrow$ "Almost ready…" $\rightarrow$ "Ready".
   - Trigger `FX.appIn({})` and `FX.welcome()` upon completion when restoring session.
3. In `src/features/login/LoginPage.tsx`:
   - On submit, call `FX.warp()` and add `#lg.out` class before navigating into application.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/splash-login-fx.test.tsx`
Expected: PASS

**Step 5: Commit**
`git add src/features/login/LoginPage.tsx src/components/layout/SplashScreen.tsx src/styles/fx.css src/test/splash-login-fx.test.tsx; git commit -m "feat(fx): add login warp/split FX and splash screen orbital animations"`

---

### Task 6: Brand Tile Logo Assets & Prism v2 Duotone Icon Component

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/SplashScreen.tsx`
- Modify: `src/components/common/Icon.tsx`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/base.css`
- Create: `src/test/prism-icons-logo.test.tsx`

**Step 1: Write the failing test**
Create `src/test/prism-icons-logo.test.tsx` testing that Sidebar and SplashScreen do NOT render letter "A", that branding text is "AIVA / Auto Invoice Matching", and that `Icon` renders duotone SVG paths (`.f`, stroke, `.a`).

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/prism-icons-logo.test.tsx`
Expected: FAIL

**Step 3: Implement minimal code**
1. In `src/styles/layout.css`:
   - Set `.logo-mark` to `background: var(--logo-sm) center/contain no-repeat; aspect-ratio: 975/625;`
   - Set `.brand-tile .logo-mark` to `width: calc(var(--bt, 44px) * .82); height: auto; background-image: var(--logo-big); filter: var(--mark-glow);`
2. In `src/components/layout/Sidebar.tsx` & `SplashScreen.tsx`:
   - Remove `<span className="logo-mark">A</span>` $\rightarrow$ `<span className="logo-mark" role="img" aria-label="AIVA" />`
   - Update text: `<b>AIVA</b><span>Auto Invoice Matching</span>`
3. In `src/components/common/Icon.tsx`:
   - Incorporate `AIVA_ICONS` dataset from `src/runtime/icons.js`.
   - Render duotone layers: `<path className="f" d={fill} />`, `<path d={stroke} />`, and `<path className="a" d={accent} />`.
4. In `src/styles/base.css`:
   - Add `.ico path.f { fill: currentColor; opacity: 0.16; }` and `.ico path.a { fill: currentColor; }`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/prism-icons-logo.test.tsx`
Expected: PASS

**Step 5: Commit**
`git add src/components/layout/Sidebar.tsx src/components/layout/SplashScreen.tsx src/components/common/Icon.tsx src/styles/layout.css src/styles/base.css src/test/prism-icons-logo.test.tsx; git commit -m "feat(brand): update logo brand tile and upgrade Icon component to Prism v2 duotone"`

---

### Task 7: Comprehensive Regression Verification & Production Build Validation

**Files:**
- Verify: Full codebase

**Step 1: Run Vitest test suite**
Run: `npm test`
Expected: 100% tests pass (70+ test files, 350+ tests).

**Step 2: Run TypeScript compile**
Run: `npx tsc --noEmit`
Expected: 0 errors (exit code 0).

**Step 3: Run Next.js production build**
Run: `npm run build`
Expected: Standalone production build completes cleanly.

**Step 4: Commit and finalize**
`git add -A; git commit -m "chore: complete 6-point defect resolution and full verification"`
