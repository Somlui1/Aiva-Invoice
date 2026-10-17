# AIVA v5.2 Parity & 6 Core Defects Resolution Design

**Date:** 2026-10-17  
**Status:** Approved  
**Reference Mockup:** `mockup/AIVA-Auto-Invoice-Matching-v5.2-Dark-Light.html`  
**Reference Dataset:** `temp/paperless_invoices_v5` (125 documents)

---

## 1. Overview & Objective

Based on the System Diagnostic Report, this design establishes the architectural solutions for 6 key visual, presentation, and data availability defects in the AIVA Frontend:

1. **Theme Clashing (White Table in Dark Mode):** Replace hardcoded `#fff` and bright tones with CSS Design Tokens across tables, panels, and KPI cards.
2. **Profile Modal Bar Bug:** Fix Stacking Context clipping by moving `MyProfileModal` to a React Portal on `document.body` and applying glassmorphic design token styles.
3. **RBAC Style Incomplete:** Modernize the Excel Permission grid and 4-tab admin views to purely leverage `var(--surface)`, `var(--grid)`, and `var(--line)` without white bleed-through in Dark mode.
4. **Missing FX & Animations:** Port the complete v5.2 FX Animation Engine (theme switch bloom, sparks, ring, sweep, floating hud, login warp & welcome, splash dual orbital rings `.r1`/`.r2` & `spBeam`).
5. **0 Docs in Queue:** Remove blocking `.cleared` marker, update auto-seed condition to ensure full 125 documents from `temp/paperless_invoices_v5` are ingested, and provide a Role Quick Switcher in Topbar to toggle between SA/ACC/APR/EU views.
6. **Brand Identity & Prism v2 Duotone Icons:** Remove hardcoded "A" letter, bind `.logo-mark` to `public/logo.png` with `--logo-big` and `--mark-glow`, update app title to "AIVA / Auto Invoice Matching", and upgrade `Icon.tsx` with Prism v2 duotone layers (`.f` fill, stroke, `.a` accent).

---

## 2. Detailed Technical Design by Defect

### 2.1 Presentation Layer & Theme Tokens (Points 1 & 3)

#### Files Affected:
- `src/styles/components.css`
- `src/styles/queue.css`
- `src/styles/permissionGrid.css`
- `src/styles/pm.css`
- `src/components/governance/RbacPage.tsx`

#### Changes:
1. In `components.css`:
   - Change `.panel { background: #fff; }` to `.panel { background: var(--surface); color: var(--s-900); }`.
   - Ensure `.panel-h` uses `background: var(--head); border-bottom: 1px solid var(--line); color: var(--s-900);`.
2. In `queue.css`:
   - Change `.tbl-wrap { background: #fff; }` to `.tbl-wrap { background: var(--surface); border: 1px solid var(--line); }`.
   - Change `table.t tbody tr:nth-child(even) td { background: #FAFBFC; }` to `table.t tbody tr:nth-child(even) td { background: var(--surface-2); }`.
   - Change `table.t tbody tr:hover td, table.t tr.click:hover td { background: #EEF4FB; }` to `background: var(--hov-2, color-mix(in srgb, var(--surface) 90%, var(--teal) 10%));`.
   - Change `.kpi.on { background: #F5F9FE; }` to `background: var(--surface-2);`.
   - Update sticky header `table.t th` to ensure background is `var(--head)` and border colors use `var(--line-strong)`.
3. In `permissionGrid.css` & `pm.css`:
   - Replace any lingering hardcoded hex colors with `var(--surface)`, `var(--surface-2)`, `var(--line)`, and `var(--grid)` so all 4 tabs in `/rbac` render consistently in dark and light modes.

---

### 2.2 Modal Stacking Context & Glassmorphic Profile Modal (Point 2)

#### Files Affected:
- `src/components/layout/Topbar.tsx`
- `src/components/layout/MyProfileModal.tsx`

#### Changes:
1. In `Topbar.tsx`:
   - Mount `<MyProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />`.
2. In `MyProfileModal.tsx`:
   - Use `ReactDOM.createPortal(..., document.body)` so the modal mounts directly on `document.body` rather than inside `<header className="topbar">`, eliminating Stacking Context conflicts.
   - Replace hardcoded inline colors (`#ffffff`, `#F8FAFC`, `#E2E8F0`) with responsive CSS variables:
     - Backdrop: `position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(8px); z-index: 10000;`.
     - Container: `background: var(--glass-2, var(--surface)); border: 1px solid var(--line-strong); box-shadow: var(--e-3); border-radius: 16px; color: var(--s-900); backdrop-filter: blur(20px);`.
     - Header & Tab sections: `background: var(--surface-2); border-color: var(--line);`.
     - Text & Accents: `color: var(--s-900);` and `var(--s-500);`.

---

### 2.3 Queue Data Availability & Role Quick Switcher (Point 5)

#### Files Affected:
- `src/lib/autoSeedSample.ts`
- `src/components/layout/Topbar.tsx`
- `src/context/AuthContext.tsx`
- `scripts/seed-invoices-v5.ts`

#### Changes:
1. Remove `.cleared` file if present in workspace root.
2. In `autoSeedSample.ts`:
   - Change check from `if (docCount > 0) return;` to `if (docCount >= 125) return;`.
   - Ensure `temp/paperless_invoices_v5` ingestion runs to populate all 125 documents into `prisma/dev.db` and syncs with `initialDocs.ts`.
3. Role Quick Switcher:
   - Add a fast Role Selector in `Topbar.tsx` next to the user profile pill, allowing immediate switching between:
     - `SA`: Super Admin (unrestricted access)
     - `ACC`: Accounting (Queue & Matching full visibility)
     - `APR`: Approver (Approval scope)
     - `EU`: End User (Receiver view)
   - When role is switched, update the active user role in `AuthContext` with appropriate company and receiver accounts so EU doesn't get an empty view.

---

### 2.4 FX Animation Engine Implementation (Point 4)

#### Files Affected:
- `src/lib/fxEngine.ts` (New module)
- `src/styles/fx.css`
- `src/context/ThemeContext.tsx`
- `src/features/login/LoginPage.tsx`
- `src/components/layout/SplashScreen.tsx`

#### Changes:
1. In `src/lib/fxEngine.ts`:
   - Implement `bloom(x, y, color, size)`
   - Implement `sparks(x, y, isLight, count)`
   - Implement `ring(x, y, radius, className, delay)`
   - Implement `sweep(delay)`
   - Implement `hud(isLight)` with glassmorphism, progress bar countdown, and icons
   - Implement `FX.warp(x, y)` and `FX.welcome(user, message, isSkip, isResume)`
   - Implement `FX.appIn({ lite })` adding `.fx-in` class to document root with staggered `--i` delays
2. In `fx.css`:
   - Add `.fx-bloom`, `.fx-spark`, `.fx-ring`, `.fx-sweep`, `.fx-warp`, `.fx-hud`, `.fx-welcome` styles directly from v5.2 prototype (lines 3360–3460).
   - Add keyframes: `ringSpin`, `hudPg`, `okPop`, `swGlow`, `knSquash`.
   - Add orbital ring animations for `#splash`:
     - `@keyframes spR1 { to { transform: rotate(336deg); } }`
     - `@keyframes spR2 { to { transform: rotate(-348deg); } }`
     - `@keyframes spBeam { 0% { left: -50%; } 100% { left: 150%; } }`
     - Connect `#splash .emb .r1` (7s linear infinite) and `#splash .emb .r2` (9s linear infinite).
   - Add login exit split `#lg.out` with `@keyframes lgOutL`, `@keyframes lgOutR`, `@keyframes lgBg`.
3. In `ThemeContext.tsx`:
   - When switching themes, trigger `bloom()`, `sparks()`, `hud()`, and run `document.startViewTransition` with a circular `clip-path` expansion centered on the toggle switch.
4. In `LoginPage.tsx`:
   - On login submit: trigger `FX.warp()`, apply `#lg.out` animation, then execute login and trigger `FX.welcome()` on landing.
5. In `SplashScreen.tsx`:
   - Step through status text: "Initializing workspace…" $\rightarrow$ "Preparing workspace…" $\rightarrow$ "Almost ready…" $\rightarrow$ "Ready" over 1.8 seconds.

---

### 2.5 Brand Identity & Prism v2 Duotone Icons (Point 6)

#### Files Affected:
- `src/styles/layout.css`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/SplashScreen.tsx`
- `src/components/common/Icon.tsx`

#### Changes:
1. In `layout.css`:
   - Update `.brand-tile .logo-mark`:
     ```css
     .logo-mark {
       display: inline-block;
       flex: none;
       background: var(--logo-sm) center/contain no-repeat;
       aspect-ratio: 975/625;
     }
     .brand-tile .logo-mark {
       width: calc(var(--bt, 44px) * .82);
       height: auto;
       background-image: var(--logo-big);
       filter: var(--mark-glow);
     }
     ```
2. In `Sidebar.tsx` & `SplashScreen.tsx`:
   - Remove `<span className="logo-mark">A</span>` $\rightarrow$ change to `<span className="logo-mark" role="img" aria-label="AIVA" />`.
   - Change Sidebar brand text to `<b>AIVA</b><span>Auto Invoice Matching</span>`.
3. In `Icon.tsx`:
   - Incorporate the complete `AIVA_ICONS` dataset (duotone tuples `[stroke, fill?, accent?]`) from `src/runtime/icons.js`.
   - Update `Icon` component to render:
     ```tsx
     <svg className={`ico ${sizeClass} ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true" style={style}>
       {fill && <path className="f" d={fill} />}
       <path d={stroke} />
       {accent && <path className="a" d={accent} />}
     </svg>
     ```
   - Add CSS rules in `src/styles/base.css` or `components.css`:
     - `.ico path.f { fill: currentColor; opacity: 0.16; }`
     - `.ico path.a { fill: currentColor; }`

---

## 3. Verification Plan

1. **Visual Theme Verification:**
   - Toggle Dark/Light mode in `/queue`, `/rbac`, and `/audit`. Verify table panels, rows, headers, and inputs follow theme tokens without stark white panels in dark mode.
2. **Modal Stacking & Glassmorphism Verification:**
   - Click user profile in Topbar. Confirm modal opens centered on screen via React Portal above all elements, with glassmorphism background and no header clipping.
3. **Queue Data & Role Switcher Verification:**
   - Verify `prisma/dev.db` has 125 documents.
   - Switch role to SA, ACC, APR: verify documents display in table.
   - Switch role to EU: verify receiver filtering operates cleanly without 0 doc crash.
4. **FX Engine & Animation Verification:**
   - Theme toggle: confirm circular clip-path transition, bloom, sparks, and bottom HUD card appear.
   - Login page: confirm warp animation, split screen out, and welcome card upon entry.
   - Splash screen: confirm orbital rings rotate (`.r1`, `.r2`) and beam sweeps across progress bar.
5. **Brand & Icon Verification:**
   - Verify logo displays image asset without letter "A".
   - Verify icons across sidebar, toolbar, and buttons display Prism v2 duotone depth.
6. **Regression Suite:**
   - Run Vitest full test suite (`npm test`).
   - Run TypeScript typecheck (`npx tsc --noEmit`).
   - Run Next.js production build (`npm run build`).
