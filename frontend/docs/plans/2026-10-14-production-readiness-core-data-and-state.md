# Production Readiness Implementation Plan: Core Data, State Machine, RBAC & ERP Staging

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transform the AIVA Portal from in-memory mock state to a production-grade database-backed platform with atomic document state transitions, immutable audit logs, Excel-style user & permission management with directory auto-mapping, and an Oracle AP interface batch staging pipeline.

**Architecture:** Extended Prisma ORM models (`Document`, `DocumentBBox`, `AuditLog`, `ApBatch`, `User`, `UserCompany`, `UserReceiverMap`) backing Next.js Route Guards and Mutation APIs. Frontend `InvoiceContext` and `ApPage` integrate with real server endpoints via optimistic updates. Interactive permission management adapted from `AIVA-Permission-Admin-Excel-Grid-v3.html` using verified `email` as the canonical identifier.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma ORM, SQLite/PostgreSQL, Zod 4.6, React 19, Vitest, Testing Library.

---

### Task 1: Database Schema Migration & Model Foundations

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/test/productionSchema.test.ts`

**Step 1: Write the failing test**

```typescript
// src/test/productionSchema.test.ts
import { describe, it, expect } from 'vitest'
import { prisma } from '../lib/prisma'

describe('Production Schema Models', () => {
  it('supports extended Document locking and AP batch fields', async () => {
    const doc = await prisma.document.create({
      data: {
        id: 'DMS-PROD-01',
        dmsDocId: '99901',
        packageId: 'PKG-01',
        fileSha256: 'abc123sha256',
        pageCount: 2,
        invoiceNum: 'INV-TEST-01',
        invoiceDate: '2026-10-14',
        companyCode: 'AH',
        supplierTaxId: '0107539000244',
        supplierName: 'AAPICO Hitech PLC',
        grandTotal: 15000.0,
        currency: 'THB',
        status: 'Confirmed',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'LOW',
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: 'u6',
        apBatchId: 'AP-20261014-001',
        payloadJson: '{}',
      },
    })
    expect(doc.isLocked).toBe(true)
    expect(doc.apBatchId).toBe('AP-20261014-001')
    await prisma.document.delete({ where: { id: 'DMS-PROD-01' } })
  })

  it('persists and queries AuditLog records', async () => {
    const log = await prisma.auditLog.create({
      data: {
        docId: 'DMS-100',
        whoId: 'u4',
        whoName: 'ปณิดา รักงาน',
        role: 'ACC',
        action: 'CONFIRM',
        fromStatus: 'Auto-pass',
        toStatus: 'Confirmed',
        reason: 'ผ่านการตรวจสอบยอดและ PO ถูกต้อง',
      },
    })
    expect(log.id).toBeDefined()
    expect(log.action).toBe('CONFIRM')
    await prisma.auditLog.delete({ where: { id: log.id } })
  })

  it('persists and links User, UserCompany, and UserReceiverMap', async () => {
    const user = await prisma.user.create({
      data: {
        id: 'u-test-99',
        email: 'test.user@aapico.com',
        name: 'ทดสอบ ผู้ใช้งาน',
        samAccount: 'test.u',
        empId: '99999',
        unit: 'คลังสินค้า',
        role: 'EU',
        companies: {
          create: [{ companyCode: 'AH' }],
        },
        receivers: {
          create: [{ receiverName: 'TEST USER', assignedBy: 'u7' }],
        },
      },
      include: { companies: true, receivers: true },
    })
    expect(user.companies).toHaveLength(1)
    expect(user.receivers[0].receiverName).toBe('TEST USER')
    await prisma.user.delete({ where: { id: user.id } })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/test/productionSchema.test.ts`
Expected: FAIL (models and fields not found on Prisma Client).

**Step 3: Update `prisma/schema.prisma` & push database**

Update `prisma/schema.prisma` with:
- `Document`: add `isLocked`, `lockedAt`, `lockedBy`, `apBatchId`, `oracleInvoiceId`, `importError`, `bboxes DocumentBBox[]`.
- `DocumentBBox`: model with `id`, `documentId`, `pageNum`, `boxType`, `targetRef`, `boxJson`.
- `AuditLog`: add `whoId`, `whoName`, `fromStatus`, `toStatus`, `reason`, `note`, `ipAddress`.
- `ApBatch`: model with `id`, `status`, `totalDocs`, `totalAmount`, `companyCode`, `createdBy`, `sentAt`, `payloadJson`.
- `User`, `UserCompany`, `UserReceiverMap`: models for RBAC.

Run: `npx prisma db push`

**Step 4: Run test to verify it passes**

Run: `npm test src/test/productionSchema.test.ts`
Expected: PASS (all 3 tests pass).

**Step 5: Commit**

```bash
git add prisma/schema.prisma src/test/productionSchema.test.ts
git commit -m "feat(db): extend schema for document locking, audit logs, and user rbac"
```

---

### Task 2: Document State Machine & Action Mutation API

**Files:**
- Create: `src/app/api/documents/[id]/actions/route.ts`
- Create: `src/test/documentActions.test.ts`

**Step 1: Write the failing test**

```typescript
// src/test/documentActions.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '../app/api/documents/[id]/actions/route'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'

describe('Document Actions Mutation API', () => {
  const docId = 'DMS-ACTION-TEST'

  beforeEach(async () => {
    await prisma.document.deleteMany({ where: { id: docId } })
    await prisma.auditLog.deleteMany({ where: { docId } })
    await prisma.document.create({
      data: {
        id: docId,
        dmsDocId: '88801',
        packageId: 'PKG-ACT',
        fileSha256: 'sha888',
        pageCount: 1,
        invoiceNum: 'INV-ACT-01',
        invoiceDate: '2026-10-14',
        companyCode: 'AH',
        supplierTaxId: '0107539000244',
        supplierName: 'AAPICO',
        grandTotal: 1000.0,
        status: 'Auto-pass',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'LOW',
        payloadJson: JSON.stringify({ history: [] }),
      },
    })
  })

  it('rejects action when document is locked with 423 Locked', async () => {
    await prisma.document.update({ where: { id: docId }, data: { isLocked: true } })
    const req = new NextRequest(`http://localhost/api/documents/${docId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action: 'confirm', reason: 'ทดสอบ' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: docId }) })
    expect(res.status).toBe(423)
  })

  it('confirms document and writes AuditLog row in atomic transaction', async () => {
    const req = new NextRequest(`http://localhost/api/documents/${docId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action: 'confirm', reason: 'PO ตรงกับใบรับ' }),
      headers: { 'x-user-id': 'u4', 'x-user-role': 'ACC', 'x-user-name': 'ปณิดา รักงาน' },
    })
    const res = await POST(req, { params: Promise.resolve({ id: docId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.document.status).toBe('Confirmed')

    const audit = await prisma.auditLog.findFirst({ where: { docId } })
    expect(audit).not.toBeNull()
    expect(audit?.action).toBe('CONFIRM')
    expect(audit?.fromStatus).toBe('Auto-pass')
    expect(audit?.toStatus).toBe('Confirmed')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/test/documentActions.test.ts`
Expected: FAIL (route does not exist).

**Step 3: Implement `src/app/api/documents/[id]/actions/route.ts`**

- Validate request body with Zod: `action`, `reason`, `note`, `revisionPayload`.
- Check `doc.isLocked` -> return HTTP 423.
- Check state transition validity against SRS matrix.
- Execute `prisma.$transaction`:
  1. `tx.document.update` status and history.
  2. `tx.auditLog.create`.
- Return `{ ok: true, document }`.

**Step 4: Run test to verify it passes**

Run: `npm test src/test/documentActions.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/api/documents/[id]/actions/route.ts src/test/documentActions.test.ts
git commit -m "feat(api): add document action mutation endpoint with state guards and audit logs"
```

---

### Task 3: Frontend State Mutation & Audit Trail Integration

**Files:**
- Modify: `src/context/InvoiceContext.tsx`
- Create: `src/app/api/audit-logs/route.ts`
- Modify: `src/components/governance/AuditPage.tsx`
- Test: `src/test/invoiceContextMutation.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/test/invoiceContextMutation.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'

describe('InvoiceContext Server Action Integration', () => {
  it('calls backend API when executeAction is triggered', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        document: { doc: 'DMS-100', status: 'Confirmed' },
      }),
    } as Response)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>{children}</InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    )

    const { result } = renderHook(() => useInvoices(), { wrapper })
    await act(async () => {
      await result.current.executeAction('DMS-100', 'confirm', 'ผ่านการตรวจ', 'หมายเหตุ')
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/documents/DMS-100/actions'),
      expect.objectContaining({ method: 'POST' })
    )
    fetchSpy.mockRestore()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/test/invoiceContextMutation.test.tsx`
Expected: FAIL (fetch not called or signature mismatch).

**Step 3: Implement client mutation and audit API**

- Update `executeAction()` in `InvoiceContext.tsx` to POST to `/api/documents/[id]/actions` with optimistic update and error rollback.
- Create `src/app/api/audit-logs/route.ts` to return rows from `prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })`.
- Update `AuditPage.tsx` to fetch from `/api/audit-logs`.

**Step 4: Run test to verify it passes**

Run: `npm test src/test/invoiceContextMutation.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/context/InvoiceContext.tsx src/app/api/audit-logs/route.ts src/components/governance/AuditPage.tsx src/test/invoiceContextMutation.test.tsx
git commit -m "feat(ui): connect invoice actions and audit page with server database"
```

---

### Task 4: Directory Search & User Provisioning API

**Files:**
- Create: `src/app/api/ad/search/route.ts`
- Create: `src/app/api/users/route.ts`
- Create: `src/test/userDirectory.test.ts`

**Step 1: Write the failing test**

```typescript
// src/test/userDirectory.test.ts
import { describe, it, expect } from 'vitest'
import { GET as searchAd } from '../app/api/ad/search/route'
import { GET as listUsers, POST as saveUsers } from '../app/api/users/route'
import { NextRequest } from 'next/server'

describe('Directory Search and User Provisioning API', () => {
  it('searches directory by query and returns auto-mapped fields', async () => {
    const req = new NextRequest('http://localhost/api/ad/search?q=somsak')
    const res = await searchAd(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.results[0]).toMatchObject({
      name: expect.any(String),
      email: expect.stringContaining('@aapico.com'),
      samAccount: 'somsak.j',
      empId: expect.any(String),
      unit: expect.any(String),
    })
  })

  it('provisions new user into database and retrieves user list', async () => {
    const saveReq = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new.emp@aapico.com',
        name: 'สมหญิง รักดี',
        samAccount: 'somying.r',
        empId: '50112',
        unit: 'ฝ่ายบัญชี',
        role: 'ACC',
        companies: ['AH', 'AHT'],
      }),
    })
    const saveRes = await saveUsers(saveReq)
    expect(saveRes.status).toBe(200)

    const listRes = await listUsers(new NextRequest('http://localhost/api/users'))
    const list = await listRes.json()
    expect(list.users.some((u: any) => u.email === 'new.emp@aapico.com')).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/test/userDirectory.test.ts`
Expected: FAIL (endpoints do not exist).

**Step 3: Implement `ad/search` and `users` route handlers**

- `src/app/api/ad/search/route.ts`: Searches active directory (or directory mock dataset) returning normalized employee fields (`name`, `email`, `samAccount`, `empId`, `unit`).
- `src/app/api/users/route.ts`:
  - `GET`: Queries `prisma.user` with companies and receivers.
  - `POST`: Upserts `User`, synchronizes `UserCompany` and `UserReceiverMap` in a transaction.

**Step 4: Run test to verify it passes**

Run: `npm test src/test/userDirectory.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/api/ad/search/route.ts src/app/api/users/route.ts src/test/userDirectory.test.ts
git commit -m "feat(rbac): implement directory auto-mapping search and user persistence api"
```

---

### Task 5: Interactive Permission Admin UI (Adapted from Mockup v3)

**Files:**
- Create: `src/components/governance/rbac/AdUserSearchModal.tsx`
- Create: `src/components/governance/rbac/PermissionExcelGrid.tsx`
- Create: `src/components/governance/rbac/SaveDiffModal.tsx`
- Modify: `src/components/governance/RbacPage.tsx`
- Create: `src/test/rbacPageInteractive.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/test/rbacPageInteractive.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RbacPage } from '../components/governance/RbacPage'
import { AuthProvider } from '../context/AuthContext'

describe('Interactive RbacPage with Mockup v3 Excel Grid', () => {
  it('renders Add User button and opens directory search modal', async () => {
    render(
      <AuthProvider>
        <RbacPage />
      </AuthProvider>
    )
    const addBtn = screen.getByRole('button', { name: /เพิ่มผู้ใช้จาก AD/i })
    expect(addBtn).toBeInTheDocument()
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/พิมพ์ชื่อ หรือ username/i)).toBeInTheDocument()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/test/rbacPageInteractive.test.tsx`
Expected: FAIL (button not found on old static page).

**Step 3: Port `AIVA-Permission-Admin-Excel-Grid-v3.html` into React components**

- Build `AdUserSearchModal.tsx`:
  - Search input with debounce to `/api/ad/search`.
  - Auto-mapped info card.
  - Role selection cards (`EU`, `ACC`, `APR`, `ADM`).
  - Scope input (Oracle Receiver chip for EU; Company chips for ACC/APR).
- Build `PermissionExcelGrid.tsx`:
  - Excel-style grid: Name, Username, Email, Role selector, Scope chips with removal and addition, Delete row button.
  - Tracking of dirty rows with highlight styling.
- Build `SaveDiffModal.tsx`:
  - Displays summary diff before sending `POST /api/users`.
- Wire into `RbacPage.tsx` for ADM users.

**Step 4: Run test to verify it passes**

Run: `npm test src/test/rbacPageInteractive.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/governance/rbac/* src/components/governance/RbacPage.tsx src/test/rbacPageInteractive.test.tsx
git commit -m "feat(ui): port mockup v3 excel grid and ad auto-map modal into rbac page"
```

---

### Task 6: Oracle AP Batch Staging & Locking Pipeline

**Files:**
- Create: `src/app/api/ap/batches/route.ts`
- Create: `src/app/api/ap/batches/[id]/callback/route.ts`
- Modify: `src/context/InvoiceContext.tsx`
- Modify: `src/components/governance/ApPage.tsx`
- Create: `src/test/apBatchPipeline.test.ts`

**Step 1: Write the failing test**

```typescript
// src/test/apBatchPipeline.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { POST as createBatch } from '../app/api/ap/batches/route'
import { POST as callbackBatch } from '../app/api/ap/batches/[id]/callback/route'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'

describe('Oracle AP Batch Staging Pipeline', () => {
  const docId = 'DMS-AP-STAGE-01'

  beforeEach(async () => {
    await prisma.document.deleteMany({ where: { id: docId } })
    await prisma.document.create({
      data: {
        id: docId,
        dmsDocId: '77701',
        packageId: 'PKG-AP',
        fileSha256: 'sha777',
        pageCount: 1,
        invoiceNum: 'INV-AP-01',
        invoiceDate: '2026-10-14',
        companyCode: 'AH',
        supplierTaxId: '0107539000244',
        supplierName: 'AAPICO',
        grandTotal: 50000.0,
        status: 'Confirmed',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'LOW',
        payloadJson: JSON.stringify({ items: [{ description: 'Steel Bar', qty: 10, amount: 50000 }] }),
      },
    })
  })

  it('creates ApBatch, locks documents to Sent status, and generates staging payload', async () => {
    const req = new NextRequest('http://localhost/api/ap/batches', {
      method: 'POST',
      body: JSON.stringify({ docIds: [docId], companyCode: 'AH' }),
      headers: { 'x-user-id': 'u6' },
    })
    const res = await createBatch(req)
    expect(res.status).toBe(200)
    const { batch } = await res.json()
    expect(batch.status).toBe('SENT')

    const doc = await prisma.document.findUnique({ where: { id: docId } })
    expect(doc?.status).toBe('Sent')
    expect(doc?.isLocked).toBe(true)
  })

  it('handles Oracle callback to mark batch documents as Posted with voucher number', async () => {
    const batch = await prisma.apBatch.create({
      data: {
        id: 'AP-BATCH-TEST',
        status: 'SENT',
        totalDocs: 1,
        totalAmount: 50000.0,
        companyCode: 'AH',
        createdBy: 'u6',
        payloadJson: '{}',
      },
    })
    await prisma.document.update({ where: { id: docId }, data: { apBatchId: batch.id, status: 'Sent' } })

    const req = new NextRequest(`http://localhost/api/ap/batches/${batch.id}/callback`, {
      method: 'POST',
      body: JSON.stringify({
        status: 'POSTED',
        results: [{ docId, oracleInvoiceId: 'ORA-INV-9988', voucherNum: 'VOUCH-1001' }],
      }),
    })
    const res = await callbackBatch(req, { params: Promise.resolve({ id: batch.id }) })
    expect(res.status).toBe(200)

    const updatedDoc = await prisma.document.findUnique({ where: { id: docId } })
    expect(updatedDoc?.status).toBe('Posted')
    expect(updatedDoc?.oracleInvoiceId).toBe('ORA-INV-9988')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/test/apBatchPipeline.test.ts`
Expected: FAIL (endpoints do not exist).

**Step 3: Implement batch staging and callback endpoints**

- `src/app/api/ap/batches/route.ts`:
  - Validates `docIds` (must be `Confirmed`).
  - Creates `ApBatch` with standard Payables Open Interface JSON structure.
  - Updates documents: `status = 'Sent'`, `isLocked = true`, `apBatchId = batch.id`.
  - Logs `POST_BATCH` to `AuditLog`.
- `src/app/api/ap/batches/[id]/callback/route.ts`:
  - Updates documents:
    - If `POSTED`: `status = 'Posted'`, stores `oracleInvoiceId`.
    - If `FAILED`: `status = 'Import Failed'`, stores `importError`.
- Update `InvoiceContext.batchPost` and `ApPage.tsx` to call these endpoints.

**Step 4: Run test to verify it passes**

Run: `npm test src/test/apBatchPipeline.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/api/ap/batches/* src/context/InvoiceContext.tsx src/components/governance/ApPage.tsx src/test/apBatchPipeline.test.ts
git commit -m "feat(erp): implement oracle ap batch staging, document locking, and result callback"
```

---

### Task 7: Full Verification & End-to-End Regression Pass

**Files:**
- Test all existing and new test suites.

**Step 1: Run full unit & integration test suite**

Run: `npm test`
Expected: All test files pass with 0 failures.

**Step 2: Run TypeScript compiler check**

Run: `npx tsc --noEmit`
Expected: Exit code 0 with 0 diagnostic errors.

**Step 3: Run Next.js production build**

Run: `npm run build`
Expected: Exit code 0, all routes compiled cleanly.

**Step 4: Commit**

```bash
git commit --allow-empty -m "chore: verify production readiness full test suite, typecheck, and build"
```
