# Login Theme, Hook Order Integrity, and Strict Zero-Trust RBAC Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Resolve the React Rule of Hooks error in `PortalShell.tsx`, eliminate the Dark Mode hydration mismatch and white screen on `/login`, purge all fake users and default IT Support identity, and enforce a Zero-Trust RBAC model where unassigned users see 0 documents.

**Architecture:** Reorder `PortalShell` to unconditionally execute all hooks before conditional returns; enforce two-pass hydration in `ThemeContext` and `ThemeSwitcher` guaranteeing identical SSR/client initial markup with dark cosmic default; purge fake mock accounts (`u1`..`u8`, `itsupport`) across frontend and backend; and enforce Zero-Trust company scoping so only admin-assigned users see documents.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma ORM (SQLite), Vitest, @testing-library/react.

---

### Task 1: Resolve Hook Order Violation in `PortalShell.tsx`

**Files:**
- Modify: `src/components/layout/PortalShell.tsx`
- Test: `src/test/portalShellHookOrder.test.tsx`

**Step 1: Write the failing test**
Create `src/test/portalShellHookOrder.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, act } from '@testing-library/react'
import { PortalShell } from '@/components/layout/PortalShell'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ToastModalProvider } from '@/context/ToastModalContext'
import { InvoiceProvider } from '@/context/InvoiceContext'
import { SimProvider } from '@/context/SimContext'
import { ANONYMOUS_USER } from '@/types/auth'

describe('PortalShell Hook Order Integrity', () => {
  it('does not alter hook execution order when auth state transitions from unauthenticated to authenticated', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const { rerender } = render(
      <AuthProvider initialUser={ANONYMOUS_USER}>
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
    )

    // Trigger auth state change
    const validUser = {
      id: 'wajeepradit.p',
      n: 'Wajeepradit Prompan',
      email: 'wajeepradit.p@aapico.com',
      role: 'EU' as const,
      rcvName: '—',
      emp: 12345,
      co: ['AH'],
      unit: 'Engineering',
    }

    act(() => {
      rerender(
        <AuthProvider initialUser={validUser}>
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
      )
    })

    const hookErrors = errorSpy.mock.calls.filter(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('change in the order of Hooks'))
    )

    expect(hookErrors).toHaveLength(0)
    errorSpy.mockRestore()
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test src/test/portalShellHookOrder.test.tsx`
Expected: FAIL or warning if hooks are skipped conditionally.

**Step 3: Move conditional auth guard after all hooks in `PortalShell.tsx`**
In `src/components/layout/PortalShell.tsx`:
Move the `if (!isAuthenticated)` block from line 53 down to line 145 (immediately before `return (<div className="shell"...>)`).

**Step 4: Run test to verify it passes**
Run: `npm test src/test/portalShellHookOrder.test.tsx`
Expected: PASS with 0 hook order warnings.

**Step 5: Commit**
```bash
git add src/components/layout/PortalShell.tsx src/test/portalShellHookOrder.test.tsx
git commit -m "fix(layout): eliminate React hook order violation in PortalShell"
```

---

### Task 2: Fix Dark Theme SSR Hydration & Two-Pass State Sync in `ThemeContext.tsx` & `ThemeSwitcher.tsx`

**Files:**
- Modify: `src/context/ThemeContext.tsx`
- Modify: `src/components/common/ThemeSwitcher.tsx`
- Test: `src/test/themeHydrationParity.test.tsx`

**Step 1: Write the failing test**
Create `src/test/themeHydrationParity.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@/context/ThemeContext'
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher'

describe('ThemeSwitcher SSR and Client Hydration Parity', () => {
  beforeEach(() => {
    window.localStorage.setItem('aiva.theme', 'light')
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders initial server HTML with dark theme default attributes avoiding hydration mismatch', () => {
    const ssrHtml = renderToString(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    )

    // Server must render aria-checked="false"
    expect(ssrHtml).toContain('aria-checked="false"')
    expect(ssrHtml).toContain('title="โหมดมืด · คลิกเพื่อสลับเป็นโหมดสว่าง"')
  })

  it('hydrates without changing initial markup on first client pass', () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    )

    const btn = container.querySelector('button.theme-sw')
    expect(btn).not.toBeNull()
    // Upon initial client mount, button attributes are safely rendered
    expect(btn?.getAttribute('aria-label')).toBe('สลับโหมดสว่าง / มืด')
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test src/test/themeHydrationParity.test.tsx`
Expected: May fail if `ThemeContext` initializes `useState` from `localStorage` directly in client render.

**Step 3: Update `ThemeContext.tsx` & `ThemeSwitcher.tsx`**
- In `ThemeContext.tsx`: Initialize `theme` state to `'dark'` unconditionally. Synchronize saved theme from `localStorage` within `useEffect` after mount.
- In `ThemeSwitcher.tsx`: Add a mounted check or ensure safe attributes until hydration is established.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/themeHydrationParity.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/context/ThemeContext.tsx src/components/common/ThemeSwitcher.tsx src/test/themeHydrationParity.test.tsx
git commit -m "fix(theme): guarantee SSR hydration parity and eliminate ThemeSwitcher attribute mismatch"
```

---

### Task 3: Purge Fake Mock Users & Enforce Blank Initial State on `/login`

**Files:**
- Modify: `src/features/login/LoginPage.tsx`
- Modify: `src/features/login/LoginForm.tsx`
- Modify: `src/features/login/useLogin.ts`
- Modify: `src/features/login/auth/mock.ts`
- Modify: `src/app/api/auth/microsoft/start/route.ts`
- Test: `src/test/loginBlankInitialState.test.tsx`

**Step 1: Write the failing test**
Create `src/test/loginBlankInitialState.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { LoginPage } from '@/features/login/LoginPage'

describe('LoginPage Blank State & No Default IT Support', () => {
  it('renders blank username and password inputs without default user', () => {
    render(<LoginPage />)
    
    // Switch to LDAP tab if not active
    const ldapTab = screen.getByRole('tab', { name: /LDAP ภายใน/i })
    ldapTab.click()

    const userInput = screen.getByPlaceholderText('ชื่อผู้ใช้ภายในบริษัท') as HTMLInputElement
    const passInput = screen.getByPlaceholderText('รหัสผ่าน') as HTMLInputElement

    expect(userInput.value).toBe('')
    expect(passInput.value).toBe('')
    expect(userInput.value).not.toBe('itsupport')
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test src/test/loginBlankInitialState.test.tsx`

**Step 3: Update `LoginPage.tsx`, `LoginForm.tsx`, and `useLogin.ts`**
- Ensure `username` and `password` always initialize to empty strings `""`.
- Remove any fallback that sets `itsupport` as default user.
- In `src/app/api/auth/microsoft/start/route.ts`: Disallow defaulting to `itsupport`. If not configured, require genuine session or return redirect to login with error.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/loginBlankInitialState.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/features/login/LoginPage.tsx src/features/login/LoginForm.tsx src/features/login/useLogin.ts src/app/api/auth/microsoft/start/route.ts src/test/loginBlankInitialState.test.tsx
git commit -m "fix(login): enforce blank initial credentials and purge default itsupport identity"
```

---

### Task 4: Enforce Zero-Trust RBAC & Purge Fake Seed Users from Database Ingestion

**Files:**
- Modify: `src/lib/autoSeedSample.ts`
- Modify: `src/app/api/auth/ldap/route.ts`
- Modify: `src/app/api/auth/me/route.ts`
- Modify: `src/context/AuthContext.tsx`
- Test: `src/test/zeroTrustRbacScope.test.ts`

**Step 1: Write the failing test**
Create `src/test/zeroTrustRbacScope.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { filterDocsFor } from '@/lib/queueFilters'
import type { InvoiceDoc } from '@/types/invoice'
import type { User } from '@/types/auth'

describe('Strict Zero-Trust RBAC Scoping', () => {
  const sampleDocs: InvoiceDoc[] = [
    {
      id: 'DMS-101',
      docId: 'DMS-101',
      invoiceNumber: 'INV-001',
      vendorName: 'Supplier A',
      vendorTaxId: '1234567890123',
      companyCode: 'AH',
      receiverName: 'SOMSAK JAIDEE',
      status: 'Auto-pass',
      confidence: 95,
      netTotal: 1000,
      vat: 70,
      grandTotal: 1070,
      lines: [],
      ocrResults: [],
      validationResults: [],
      auditTrail: [],
    },
  ]

  it('returns 0 documents for newly logged-in user without granted company permissions', () => {
    const unassignedUser: User = {
      id: 'new.employee',
      n: 'New Employee',
      email: 'new.employee@aapico.com',
      role: 'EU',
      rcvName: '—',
      emp: null,
      co: [], // No companies assigned!
      unit: 'General',
    }

    const visibleDocs = filterDocsFor(sampleDocs, unassignedUser)
    expect(visibleDocs).toHaveLength(0)
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test src/test/zeroTrustRbacScope.test.ts`

**Step 3: Update `autoSeedSample.ts`, `ldap/route.ts`, and `AuthContext.tsx`**
- In `autoSeedSample.ts`: Remove the code block that creates `itsupport` (`prisma.user.create({ data: { id: 'itsupport' ... } })`).
- In `ldap/route.ts`: When a user is authenticated via AD but has no record in `prisma.user`, create/update them with `role: 'EU'`, `assignedCompanies = []`, and `assignedReceivers = []`. Do NOT auto-grant `['AH', 'AHA', 'AHT', 'AHP', 'AM']`.
- In `AuthContext.tsx`: Fallback users with unknown scopes default to `co: []`, guaranteeing they see 0 documents.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/zeroTrustRbacScope.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/lib/autoSeedSample.ts src/app/api/auth/ldap/route.ts src/app/api/auth/me/route.ts src/context/AuthContext.tsx src/test/zeroTrustRbacScope.test.ts
git commit -m "feat(rbac): enforce zero-trust company scoping and purge fake itsupport database seeding"
```

---

### Task 5: Refactor Explainer Role Scene (No Fake Employee Names) & Full E2E Regression Pass

**Files:**
- Modify: `src/features/login/explainer/RoleScene.tsx`
- Modify: `src/features/login/data/explainer.ts`
- Test: `src/test/explainerRoleArchetypes.test.tsx`

**Step 1: Write the failing test**
Create `src/test/explainerRoleArchetypes.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { RoleScene } from '@/features/login/explainer/RoleScene'

describe('RoleScene Business Archetypes', () => {
  it('displays business role descriptions without referencing fake personal employees', () => {
    render(<RoleScene ri={0} onRole={() => {}} />)
    
    // Check for standard role archetype titles
    expect(screen.getByText(/ผู้ใช้งาน \(Receiver\)/i)).toBeDefined()
    expect(screen.getByText(/เจ้าหน้าที่บัญชี/i)).toBeDefined()
    
    // Ensure no fake employee name is rendered
    expect(screen.queryByText(/กิตติศักดิ์ ซัพพอร์ต/i)).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test src/test/explainerRoleArchetypes.test.tsx`

**Step 3: Update `RoleScene.tsx` and `explainer.ts`**
Update role definitions and tab cards to present functional roles (Receiver, AP Accountant, Approver, IT Admin) with standard organizational scope descriptions rather than mock user personas.

**Step 4: Run full regression test suite**
Run:
```bash
npm test
npx tsc --noEmit
npm run build
```
Expected: All tests pass, TypeScript compiles clean with 0 errors, Next.js production build exits 0.

**Step 5: Commit**
```bash
git add src/features/login/explainer/RoleScene.tsx src/features/login/data/explainer.ts src/test/explainerRoleArchetypes.test.tsx
git commit -m "refactor(explainer): use pure organizational role archetypes and pass full test suite"
```

---

## Plan Complete and Saved
Next step: run `.agent/workflows/execute-plan.md` to execute this plan task-by-task in single-flow mode.
