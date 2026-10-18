# Design Document: Login Hero Brand, Splash FX & Hydration Resolution (v5.2 Parity)

**Date:** 2026-10-18  
**Status:** Approved  
**Reference Mockup:** `mockup/AIVA-Auto-Invoice-Matching-v5.2-Dark-Light.html`  
**Target:** `frontend/` (Next.js 15, React 19, TypeScript)

---

## 1. Executive Summary

This design resolves three interconnected defects in the AIVA Frontend:
1. **Hydration Mismatch Error:** Server-rendered fallback (`auth-redirect-guard`) conflicting with client-side session resolution causing React tree hydration failure on `/`.
2. **Login Brand Hero Discrepancy:** The login form currently displays a legacy green box with `"AI"` instead of the authentic v5.2 `.brand-tile.md` glowing AIVA logo mark, wordmark, tagline, and process pills (`OCR > Match > Post to Oracle`), alongside a missing theme switcher in the login header.
3. **Login Loading & Refresh Animation Defect:** Navigating or refreshing `/login` immediately pops into a static card without the authentic v5.2 orbital rings splash screen, `.lg-enter` staged animations (`.d3-l` slide-in, `.d3-r` slide-in, logo pop, theme switch drop), and ambient background orbs/grid.

---

## 2. Architecture & Detailed Design

### 2.1 Hydration Mismatch Resolution (PortalShell & Auth Guard)
* **Root Cause:** In `AuthContext.tsx`, `currentUser` is initialized using `localStorage` on the client, but defaults to `ANONYMOUS_USER` during SSR. `PortalShell.tsx` renders `<div data-testid="auth-redirect-guard">` on the server, while on the client it immediately resolves to the authenticated `<div id="shell" className="shell">` before hydration completes.
* **Solution:**
  * Implement two-pass mounting guard (`isMounted`) in `PortalShell.tsx` and ensure initial render between SSR and client produces identical markup.
  * During the unmounted phase or initial check, render a neutral loading surface or the `<SplashScreen />` so SSR and Client initial trees match 100%.

### 2.2 Authentic Login Hero, Wordmark & Theme Switcher
* Replace legacy `<div className="lg-brand">` in `src/features/login/LoginForm.tsx` with:
  ```html
  <div class="lg-hero">
    <span class="brand-tile md">
      <span class="logo-mark" role="img" aria-label="AIVA"></span>
    </span>
    <div>
      <div class="wm wordmark">AIVA</div>
      <div class="tg">Auto Invoice Matching</div>
      <div class="pp2">
        <em>OCR</em>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        <em>Match</em>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        <em>Post to Oracle</em>
      </div>
    </div>
  </div>
  <div class="lg-theme">
    <ThemeSwitcher />
  </div>
  ```
* Wire `.brand-tile.md .logo-mark` to `var(--logo-big)` and `var(--mark-glow)` matching `Sidebar.tsx`.
* Update `.lg-foot` with authentic copyright and IT support trigger.

### 2.3 Splash Screen & Login Entry FX Animation Engine
* **Splash on Login Entry / Refresh:**
  * In `LoginPage.tsx`, mount `<SplashScreen onDismiss={handleDismiss} />` on initial mount / refresh.
  * Render the 3D rotating rings (`.r1`, `.r2`, `spBeam`), central glowing logo emblem, particles, progress bar, and 4-phase status:
    `Initializing workspace…` ➔ `Preparing workspace…` ➔ `Almost ready…` ➔ `Ready`.
* **Login Entry Animations (`.lg-enter`):**
  * When Splash dismisses, trigger `FX.loginIn()` which applies `.lg-enter` to `#lg`:
    * `.d3-l`: `animation: lgInL .75s var(--ease) backwards`
    * `.d3-r`: `animation: lgInR .75s var(--ease) .1s backwards`
    * `.brand-tile`: `animation: fxPop .85s var(--ease) .25s backwards`
    * `.lg-theme`: `animation: fxDrop .5s var(--ease) .5s backwards`
* **Ambient Backdrop:**
  * Include `<span className="lg-orb"></span><i className="lg-grid"></i>` in `LoginPage.tsx` for depth and perspective lighting.

---

## 3. Testing & Verification Strategy

1. **Unit & Component Testing (Vitest + React Testing Library):**
   * `src/test/login-hero-parity.test.tsx`: Verify `.brand-tile.md`, `.logo-mark`, wordmark `AIVA`, tagline, and theme switcher mount without `"AI"` text.
   * `src/test/login-splash-fx.test.tsx`: Verify splash screen dismisses and triggers `.lg-enter` and ambient elements (`.lg-orb`, `.lg-grid`).
   * `src/test/hydration-guard.test.tsx`: Verify `PortalShell` mounts predictably without SSR/client DOM divergence.
2. **Full Regression Pass:**
   * Full vitest suite: `npm test` (all tests passing).
   * TypeScript typecheck: `npx tsc --noEmit` (0 errors).
   * Next.js production build: `npm run build` (all 19 routes cleanly generated).
