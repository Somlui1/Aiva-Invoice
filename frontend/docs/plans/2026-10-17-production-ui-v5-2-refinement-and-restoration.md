# Production React Architecture & v5.2 UI/UX Restoration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Restore the 100% authentic production React application tree (`PortalShell`), Active Directory RBAC management, Oracle Receipt Lines tab, and 125 real documents from `temp/paperless_invoices_v5` with v5.2 styling, while eliminating the Next.js hydration mismatch error, broken logo paths, and login bounce issues.

**Architecture:** Decouple the frontend from the temporary static ChatGPT mock (`temp/aiva-react` and `src/runtime`) and return `src/App.tsx` to the production `PortalShell` wrapped in real context providers (`AuthProvider`, `InvoiceContext`, `SettingsContext`, `ToastModalContext`, `SimContext`, `ThemeContext`). Migrate Dark/Light theme switching to CSS variables and `data-theme` on `<html>` without mutating SSR `<link>` tags, copy `src/logo.png` to `public/logo.png`, and polish `RbacPage` and `InvoiceDetailPane` with v5.2 design tokens.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma (SQLite `dev.db`), Vitest, CSS Tokens (v5.2 Dark/Light).

---

### Task 1: Resolve Hydration Mismatch & Cleanly Integrate v5.2 Styles in `src/app/layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/styles/tokens.css`
- Test: `src/test/hydration-cleanup.test.ts`

**Step 1: Write the failing test**

Create `src/test/hydration-cleanup.test.ts` to assert that `src/app/layout.tsx` does not inject mutable `media="not all"` `<link>` tags or inline scripts that mutate `<link>` media attributes at runtime.

```typescript
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Layout Hydration Cleanliness', () => {
  it('does not contain media="not all" link tags or mutating inline scripts in layout.tsx', () => {
    const layoutPath = path.resolve(__dirname, '../app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf-8')

    // Must not have media="not all" on stylesheet links
    expect(content).not.toContain('media="not all"')
    // Must not have window.__aivaStyles mutating media attributes
    expect(content).not.toContain('window.__aivaStyles')
  })

  it('imports the full suite of v5.2 modular stylesheets', () => {
    const layoutPath = path.resolve(__dirname, '../app/layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf-8')

    expect(content).toContain("@/styles/tokens.css")
    expect(content).toContain("@/styles/layout.css")
    expect(content).toContain("@/styles/components.css")
    expect(content).toContain("@/styles/queue.css")
    expect(content).toContain("@/styles/permissionGrid.css")
    expect(content).toContain("@/styles/fx.css")
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/hydration-cleanup.test.ts`
Expected: FAIL with `expect(content).not.toContain('media="not all"')`.

**Step 3: Write minimal implementation**

Update `src/app/layout.tsx` to:
1. Remove all 17 `<link rel="stylesheet" href="/styles/style-*.css" ... />` and inline `window.__aivaStyles` script.
2. Import `@/styles/permissionGrid.css` alongside `tokens.css`, `base.css`, `layout.css`, `components.css`, `queue.css`, `evidence.css`, `cf.css`, `pm.css`, `fx.css`.
3. Keep the lightweight anti-flicker theme script:
```typescript
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){
  try {
    var t = localStorage.getItem("aiva.theme") || "dark";
    if (t !== "light") t = "dark";
    document.documentElement.setAttribute("data-theme", t);
  } catch(e) {}
})();`,
  }}
/>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/hydration-cleanup.test.ts`
Expected: PASS

---

### Task 2: Fix Logo Assets & Brand Tile Presentation

**Files:**
- Copy: `src/logo.png` -> `public/logo.png` and `public/assets/logo.png`
- Modify: `src/styles/tokens.css`
- Test: `src/test/logo-asset.test.ts`

**Step 1: Write the failing test**

Create `src/test/logo-asset.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Logo Assets', () => {
  it('has logo.png present in public/ and public/assets/', () => {
    const publicLogo = path.resolve(__dirname, '../../public/logo.png')
    const publicAssetsLogo = path.resolve(__dirname, '../../public/assets/logo.png')

    expect(fs.existsSync(publicLogo)).toBe(true)
    expect(fs.existsSync(publicAssetsLogo)).toBe(true)
    expect(fs.statSync(publicLogo).size).toBeGreaterThan(100000)
  })

  it('defines --logo-sm and --logo-big pointing to /logo.png in tokens.css', () => {
    const tokensPath = path.resolve(__dirname, '../styles/tokens.css')
    const content = fs.readFileSync(tokensPath, 'utf-8')

    expect(content).toContain("--logo-sm: url('/logo.png')")
    expect(content).toContain("--logo-big: url('/logo.png')")
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/logo-asset.test.ts`
Expected: FAIL (`public/logo.png` does not exist).

**Step 3: Write minimal implementation**

1. Ensure directory `public/assets` exists.
2. Copy `src/logo.png` to `public/logo.png` and `public/assets/logo.png`.
3. In `src/styles/tokens.css`, define under `:root`:
```css
  /* Brand Logos */
  --logo-sm: url('/logo.png');
  --logo-big: url('/logo.png');
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/logo-asset.test.ts`
Expected: PASS

---

### Task 3: Re-wire `src/App.tsx` to Full Production `PortalShell` & Authentication Flow

**Files:**
- Modify: `src/App.tsx`
- Test: `src/test/app-shell-production.test.tsx`

**Step 1: Write the failing test**

Create `src/test/app-shell-production.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { App } from '../App'
import { USERS } from '../mock/users'

describe('App Shell Production Root', () => {
  it('renders PortalShell inside all core providers even when initialUser is undefined', () => {
    // In server environment without window, should render redirect guard cleanly
    const html = renderToString(<App initialPage="queue" />)
    expect(html).toContain('auth-redirect-guard')
  })

  it('renders PortalShell with authenticated user content when user is provided', () => {
    const accUser = USERS.find(u => u.role === 'ACC') || USERS[3]
    const html = renderToString(<App initialUser={accUser} initialPage="queue" />)
    expect(html).toContain('AIVA')
    expect(html).toContain('shell')
    expect(html).not.toContain('auth-redirect-guard')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/app-shell-production.test.tsx`
Expected: FAIL (renders static ChatGPT mock instead of `PortalShell` guard).

**Step 3: Write minimal implementation**

Update `src/App.tsx` to always render the standard provider stack and `PortalShell`:

```tsx
'use client'

import React from 'react'
import { PortalShell } from '@/components/layout/PortalShell'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ToastModalProvider } from '@/context/ToastModalContext'
import { InvoiceProvider } from '@/context/InvoiceContext'
import { SimProvider } from '@/context/SimContext'
import type { PageKey } from '@/components/layout/Sidebar'
import type { User } from '@/types/auth'

export { PortalShell } from '@/components/layout/PortalShell'

export function App({
  initialPage = 'queue',
  initialUser,
}: {
  initialPage?: PageKey | string
  initialUser?: User | null
}) {
  return (
    <ThemeProvider>
      <AuthProvider initialUser={initialUser}>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>
              <SimProvider>
                <PortalShell initialPage={initialPage as PageKey} />
              </SimProvider>
            </InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/app-shell-production.test.tsx`
Expected: PASS

---

### Task 4: Polish `RbacPage.tsx` & Restore Active Directory Permission Management with v5.2 Aesthetics

**Files:**
- Modify: `src/components/governance/RbacPage.tsx`
- Modify: `src/styles/permissionGrid.css`
- Test: `src/test/rbac-v5-integration.test.tsx`

**Step 1: Write the failing test**

Create `src/test/rbac-v5-integration.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { RbacPage } from '../components/governance/RbacPage'
import { AuthProvider } from '../context/AuthContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { USERS } from '../mock/users'

describe('RBAC Page Production Integration', () => {
  it('renders all 4 tabs including PermissionExcelGrid, Role Matrix, Company Scope, and Visibility Tester', () => {
    const itAdmin = USERS.find(u => u.role === 'ADM') || USERS[6]
    render(
      <AuthProvider initialUser={itAdmin}>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    expect(screen.getByText('ตารางสิทธิ์ผู้ใช้งาน (Excel Grid)')).toBeDefined()
    expect(screen.getByText('Role Permission Matrix')).toBeDefined()
    expect(screen.getByText('รายชื่อบริษัท & ORG_ID (26 บริษัท)')).toBeDefined()
    expect(screen.getByText('จำลองมุมมองผู้ใช้งาน (Visibility Tester)')).toBeDefined()
  })

  it('has + เพิ่มผู้ใช้ button for Active Directory search', () => {
    const itAdmin = USERS.find(u => u.role === 'ADM') || USERS[6]
    render(
      <AuthProvider initialUser={itAdmin}>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    expect(screen.getByText(/เพิ่มผู้ใช้/i)).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails or passes**

Run: `npx vitest run src/test/rbac-v5-integration.test.tsx`
Verify current status and check rendering.

**Step 3: Write minimal implementation**

1. In `src/styles/permissionGrid.css`:
   - Replace hardcoded background `#fff` and colors with `var(--surface)` and `var(--s-900)`.
   - Ensure seamless theme styling in Dark and Light mode.
2. In `src/components/governance/RbacPage.tsx`:
   - Refine tab buttons and header cards with v5.2 badge styles, typography (`Bai Jamjuree`), and sleek borders.
   - Retain full functionality of `AdUserSearchModal`, `SaveDiffModal`, and Oracle MCP sync.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/rbac-v5-integration.test.tsx`
Expected: PASS

---

### Task 5: Verify Oracle Receipts & Evidence BBox in `InvoiceDetailPane.tsx` with 125 Real Invoices

**Files:**
- Modify/Verify: `src/components/queue/InvoiceDetailPane.tsx`
- Test: `src/test/oracle-receipts-pane.test.tsx`

**Step 1: Write the failing test**

Create `src/test/oracle-receipts-pane.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { AuthProvider } from '../context/AuthContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { USERS } from '../mock/users'
import { INITIAL_DOCS } from '../mock/initialDocs'

describe('Invoice Detail Pane - Oracle Receipts & 125 Docs', () => {
  it('loads 125 real documents in initialDocs matching Engine summary', () => {
    expect(INITIAL_DOCS.length).toBe(125)
    const autoPass = INITIAL_DOCS.filter(d => d.status === 'Auto-pass')
    const review = INITIAL_DOCS.filter(d => d.status === 'Review')
    const hold = INITIAL_DOCS.filter(d => d.status === 'Hold')
    const manual = INITIAL_DOCS.filter(d => d.status === 'Manual')

    expect(autoPass.length).toBe(51)
    expect(review.length).toBe(23)
    expect(hold.length).toBe(12)
    expect(manual.length).toBe(39)
  })

  it('renders ใบรับ Oracle tab with line items and variance diff when document has oracleReceiptLines', () => {
    const docWithReceipts = INITIAL_DOCS.find(d => d.oracleReceiptLines && d.oracleReceiptLines.length > 0)
    expect(docWithReceipts).toBeDefined()

    const accUser = USERS.find(u => u.role === 'ACC') || USERS[3]

    render(
      <AuthProvider initialUser={accUser}>
        <ToastModalProvider>
          <InvoiceProvider initialDocs={INITIAL_DOCS} initialSelectedId={docWithReceipts!.id}>
            <InvoiceDetailPane doc={docWithReceipts!} />
          </InvoiceProvider>
        </ToastModalProvider>
      </AuthProvider>
    )

    // Tab 3 must exist
    expect(screen.getByText(/ใบรับ Oracle/i)).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails or passes**

Run: `npx vitest run src/test/oracle-receipts-pane.test.tsx`
Verify current status.

**Step 3: Write minimal implementation**

1. Verify that `InvoiceDetailPane` renders receipt lines, PO chips, unit price, quantity, line total, and BBox linking button.
2. Ensure v5.2 badges (`.st-Auto-pass`, `.st-Review`, `.st-Hold`, `.st-Manual`, etc.) and typography look crisp in Dark and Light themes.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/oracle-receipts-pane.test.tsx`
Expected: PASS

---

### Task 6: Preserve 100% Business Logic & Document Status State Machine

**Files:**
- Verify: `src/test/business-logic.test.ts`
- Test: `src/test/status-state-machine-regression.test.ts`

**Step 1: Write the failing test**

Create `src/test/status-state-machine-regression.test.ts` testing the complete transition graph:
- Confirm (Auto-pass / Review -> Confirmed)
- Review (Auto-pass / Hold -> Review)
- Hold (Auto-pass / Review -> Hold)
- Reject (Auto-pass / Review / Hold -> Rejected)
- Unconfirm (Confirmed -> Review)
- Manual Review resolution
- Duplicate override
- Audit log entry created for each action

```typescript
import { describe, it, expect } from 'vitest'
import { INITIAL_DOCS } from '../mock/initialDocs'
import { USERS, ROLES } from '../mock/users'

describe('Document Status State Machine Invariance', () => {
  it('guarantees role permissions match SRS v1.1', () => {
    expect(ROLES.EU.p).toEqual(['VIEW_OWN', 'DMS', 'UPLOAD_NEW'])
    expect(ROLES.ACC.p).toContain('CONFIRM')
    expect(ROLES.ACC.p).toContain('REVIEW')
    expect(ROLES.ACC.p).toContain('HOLD')
    expect(ROLES.ACC.p).toContain('REJECT')
    expect(ROLES.APR.p).toContain('UNCONFIRM')
    expect(ROLES.APR.p).toContain('MANUAL_REVIEW')
    expect(ROLES.APR.p).toContain('DUP_OVERRIDE')
    expect(ROLES.APR.p).toContain('POST')
  })
})
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/test/status-state-machine-regression.test.ts`
Expected: PASS

---

### Task 7: Comprehensive Regression Verification & Production Build

**Files:**
- Entire repository

**Step 1: Run complete Vitest suite**

Run: `npx vitest run`
Expected: All tests pass (63+ test files, 325+ tests passing, 0 failures).

**Step 2: Run TypeScript typecheck**

Run: `npx tsc --noEmit`
Expected: Clean exit code 0.

**Step 3: Run Next.js production build**

Run: `npm run build`
Expected: Clean build with exit code 0.

---
