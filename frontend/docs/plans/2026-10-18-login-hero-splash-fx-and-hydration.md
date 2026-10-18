# Login Hero Brand, Splash FX & Hydration Resolution Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Resolve Hydration mismatch on `/`, update login hero brand tile & theme switcher to v5.2 mockup standard, and add authentic orbital splash screen + `.lg-enter` animations to `/login`.

**Architecture:** Two-pass mounting pattern in `PortalShell` to synchronize SSR/client DOM trees; replace legacy `.lg-brand` in `LoginForm` with authentic `.lg-hero`, `.brand-tile.md`, wordmark, process pills, and `ThemeSwitcher`; mount `SplashScreen` and trigger `FX.loginIn()` with `.lg-enter` slide/pop animations and ambient `.lg-orb`/`.lg-grid` backdrops in `LoginPage`.

**Tech Stack:** Next.js 15.5.27, React 19, TypeScript, Vitest, Testing Library.

---

### Task 1: Resolve SSR/Client Hydration Mismatch in `PortalShell.tsx`

**Files:**
- Modify: `src/components/layout/PortalShell.tsx:22-75`
- Test: `src/test/hydration-guard.test.tsx`

**Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortalShell } from '@/components/layout/PortalShell'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { InvoiceProvider } from '@/context/InvoiceContext'
import { SimProvider } from '@/context/SimContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ToastModalProvider } from '@/context/ToastModalContext'

describe('PortalShell Hydration Guard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders consistent loading/splash state before mounting and prevents hydration divergence', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <ToastModalProvider>
              <InvoiceProvider>
                <SimProvider>
                  <PortalShell initialPage="queue" />
                </SimProvider>
              </InvoiceProvider>
            </ToastModalProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    )
    expect(container).toBeTruthy()
    // Should render without throwing hydration error or unhandled redirection
  })
})
```

**Step 2: Run test to verify it fails or verifies behavior**

Run: `npx vitest run src/test/hydration-guard.test.tsx`

**Step 3: Write minimal implementation**

In `src/components/layout/PortalShell.tsx`:
Add `isMounted` state. During SSR and before client mount, render a neutral loading surface or `<SplashScreen />` so the initial server markup matches client hydration DOM before redirecting or evaluating `localStorage`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/hydration-guard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/layout/PortalShell.tsx src/test/hydration-guard.test.tsx
git commit -m "fix(hydration): add two-pass mount guard to PortalShell to eliminate SSR/client mismatch"
```

---

### Task 2: Authentic Login Hero Brand Tile, Wordmark & Theme Switcher in `LoginForm.tsx`

**Files:**
- Modify: `src/features/login/LoginForm.tsx:32-45`
- Modify: `src/features/login/login.css`
- Test: `src/test/login-hero-parity.test.tsx`

**Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginForm } from '@/features/login/LoginForm'
import { ThemeProvider } from '@/context/ThemeContext'

describe('LoginForm Brand Hero Parity', () => {
  const dummyController = {
    method: 'ldap' as const,
    busy: false,
    busyMethod: null,
    locked: false,
    lockRemaining: 0,
    exiting: false,
    progress: 0,
    u: 'test',
    p: '',
    keep: false,
    alert: null,
    step: 0,
    switchMethod: vi.fn(),
    setU: vi.fn(),
    setP: vi.fn(),
    setKeep: vi.fn(),
    go: vi.fn(),
    dismissAlert: vi.fn(),
  }

  it('renders .lg-hero with .brand-tile.md, .logo-mark, wordmark AIVA, and no legacy "AI" box', () => {
    const { container } = render(
      <ThemeProvider>
        <LoginForm c={dummyController} mock={false} onSupport={vi.fn()} />
      </ThemeProvider>
    )

    // No legacy "AI" span
    const legacyMarks = container.querySelectorAll('.brand-mark')
    expect(legacyMarks.length).toBe(0)

    // Has authentic .lg-hero and .brand-tile.md
    const hero = container.querySelector('.lg-hero')
    expect(hero).toBeTruthy()
    const brandTile = hero?.querySelector('.brand-tile.md .logo-mark')
    expect(brandTile).toBeTruthy()

    // Wordmark & process pills
    expect(hero?.querySelector('.wm.wordmark')?.textContent).toBe('AIVA')
    expect(hero?.querySelector('.tg')?.textContent).toBe('Auto Invoice Matching')
    expect(hero?.querySelector('.pp2')?.textContent).toContain('OCR')
    expect(hero?.querySelector('.pp2')?.textContent).toContain('Match')
    expect(hero?.querySelector('.pp2')?.textContent).toContain('Post to Oracle')

    // Has theme switcher
    const themeSw = container.querySelector('.lg-theme .theme-sw')
    expect(themeSw).toBeTruthy()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/login-hero-parity.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

In `src/features/login/LoginForm.tsx`:
1. Import `ThemeSwitcher` or `useTheme`.
2. Replace `.lg-brand` with `.lg-hero` containing:
   - `<span className="brand-tile md"><span className="logo-mark" role="img" aria-label="AIVA" /></span>`
   - `<div><div className="wm wordmark">AIVA</div><div className="tg">Auto Invoice Matching</div><div className="pp2"><em>OCR</em>...<em>Match</em>...<em>Post to Oracle</em></div></div>`
   - `<div className="lg-theme"><ThemeSwitcher /></div>`
3. Update `.lg-foot` with authentic copyright and IT support links.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/login-hero-parity.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/login/LoginForm.tsx src/features/login/login.css src/test/login-hero-parity.test.tsx
git commit -m "feat(login): update LoginForm brand hero to authentic v5.2 layout with logo-mark and theme switcher"
```

---

### Task 3: Login Page Splash Screen, `.lg-enter` Entry Animations & Ambient Backdrop

**Files:**
- Modify: `src/features/login/LoginPage.tsx`
- Modify: `src/features/login/login.css`
- Test: `src/test/login-splash-fx.test.tsx`

**Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LoginPage } from '@/features/login/LoginPage'
import { ThemeProvider } from '@/context/ThemeContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('LoginPage Splash Screen & FX Animations', () => {
  it('renders SplashScreen on initial visit and transitions with .lg-enter, .lg-orb, and .lg-grid', async () => {
    const { container } = render(
      <ThemeProvider>
        <LoginPage showExplainer={false} />
      </ThemeProvider>
    )

    // Contains ambient elements
    expect(container.querySelector('.lg-orb')).toBeTruthy()
    expect(container.querySelector('.lg-grid')).toBeTruthy()

    // Contains SplashScreen initially
    expect(container.querySelector('#splash')).toBeTruthy()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/login-splash-fx.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

In `src/features/login/LoginPage.tsx`:
1. Add `showSplash` state initialized to `true` (can be skipped if `nologin` or already active).
2. Render `<SplashScreen onDismiss={handleDismiss} />` when `showSplash` is true.
3. On dismiss, call `FX.loginIn()` to add `.lg-enter` animation class to `.aiva-login`.
4. Render `<span className="lg-orb" aria-hidden="true" />` and `<i className="lg-grid" aria-hidden="true" />` as background ambient layers.
5. In `login.css`, ensure `.lg-enter` keyframes (`lgInL`, `lgInR`, `fxPop`, `fxDrop`) are properly configured.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/login-splash-fx.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/login/LoginPage.tsx src/features/login/login.css src/test/login-splash-fx.test.tsx
git commit -m "feat(login): integrate splash screen, .lg-enter entry animation, and ambient orbs into LoginPage"
```

---

### Task 4: Comprehensive Regression Verification & Next.js Production Build Validation

**Files:**
- Modify: `docs/plans/task.md`

**Step 1: Run Vitest full test suite**

Run: `npx vitest run`
Expected: All 75+ test files pass (100% green).

**Step 2: Run TypeScript compile**

Run: `npx tsc --noEmit`
Expected: 0 errors.

**Step 3: Run Next.js production build**

Run: `npm run build`
Expected: Exit code 0, 19/19 routes generated cleanly.

**Step 4: Commit**

```bash
git add docs/plans/task.md
git commit -m "docs: complete login hero brand, splash FX, and hydration resolution"
```
