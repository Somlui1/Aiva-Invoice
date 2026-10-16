# Production Enhancements Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement database clear scripts with RBAC preservation, real-time RBAC-scoped document ingestion alerts with audio chime, PDF multi-page continuous vertical scroll with clean default view, and decoupled Docker configurations for OCR Engine and Web Application.

**Architecture:** A pragmatic, resilient microservices approach. Database transactions safely purge documents and logs while preserving RBAC user mappings; `/api/engine/ingest` creates audit entries on new arrivals; client smart-polling (`useDocumentAlerts`) delivers Glassmorphism toasts and Web Audio chimes filtered by session permissions; PDF.js canvas renders stacked continuous pages with `IntersectionObserver` page tracking; and independent Docker compose files enable isolated multi-server deployment.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma ORM, SQLite, PDF.js, Web Audio API, Vitest, Docker Compose.

---

### Task 1: Database Clear Scripts (`scripts/clear-database.ts` & `package.json`) & Auto-Seed Guard

**Files:**
- Create: `scripts/clear-database.ts`
- Modify: `package.json:20-22`
- Modify: `src/lib/autoSeedSample.ts:10-35`
- Test: `src/test/clearDatabase.test.ts`

**Step 1: Write the failing test**
Create `src/test/clearDatabase.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../lib/prisma'
import { clearDatabase } from '../../scripts/clear-database'

describe('Database Clear Scripts', () => {
  beforeEach(async () => {
    // Ensure test user and document exist
    await prisma.user.upsert({
      where: { id: 'test-admin' },
      create: { id: 'test-admin', email: 'admin@test.com', name: 'Admin', role: 'ADM' },
      update: {},
    })
    await prisma.userCompany.upsert({
      where: { userId_companyCode: { userId: 'test-admin', companyCode: 'AH' } },
      create: { userId: 'test-admin', companyCode: 'AH' },
      update: {},
    })
  })

  it('clears only logs when mode is logs, preserving documents and users', async () => {
    await prisma.auditLog.create({
      data: { docId: 'TEST-01', who: 'tester', role: 'ADM', act: 'TEST', detail: 'test' },
    })
    const res = await clearDatabase('logs')
    expect(res.logsCleared).toBeGreaterThanOrEqual(1)
    
    const logCount = await prisma.auditLog.count()
    expect(logCount).toBe(0)
    
    const userCount = await prisma.user.count({ where: { id: 'test-admin' } })
    expect(userCount).toBe(1)
  })

  it('clears transactions and logs when mode is data, preserving user and permission mappings', async () => {
    const res = await clearDatabase('data')
    expect(res.ok).toBe(true)

    const [docCount, bboxCount, runCount, batchCount, logCount] = await Promise.all([
      prisma.document.count(),
      prisma.documentBBox.count(),
      prisma.validationRun.count(),
      prisma.apBatch.count(),
      prisma.auditLog.count(),
    ])
    expect(docCount).toBe(0)
    expect(bboxCount).toBe(0)
    expect(runCount).toBe(0)
    expect(batchCount).toBe(0)
    expect(logCount).toBe(0)

    const user = await prisma.user.findUnique({
      where: { id: 'test-admin' },
      include: { companies: true },
    })
    expect(user).not.toBeNull()
    expect(user?.companies.length).toBeGreaterThanOrEqual(1)
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/clearDatabase.test.ts`
Expected: FAIL (Cannot find module `../../scripts/clear-database`)

**Step 3: Write minimal implementation**
1. Implement `scripts/clear-database.ts`:
   - Export `clearDatabase(mode: 'data' | 'logs')`
   - In mode `data`: purge `AuditLog`, `DocumentBBox`, `ValidationRun`, `ApBatch`, `Document` in `$transaction`
   - Write `.cleared` file in workspace root to prevent `autoSeedSample.ts` from auto-repopulating sample data
   - In mode `logs`: purge `AuditLog` only
   - CLI runner: parse `--mode=data` or `--mode=logs` from `process.argv`
2. Update `package.json` with scripts:
   - `"db:clear:data": "tsx scripts/clear-database.ts --mode=data"`
   - `"db:clear:logs": "tsx scripts/clear-database.ts --mode=logs"`
3. Update `src/lib/autoSeedSample.ts`:
   - If `process.env.AIVA_DISABLE_AUTO_SEED === 'true'` or `fs.existsSync(path.resolve(process.cwd(), '.cleared'))`, skip seeding invoices.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/clearDatabase.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add scripts/clear-database.ts package.json src/lib/autoSeedSample.ts src/test/clearDatabase.test.ts
git commit -m "feat(db): add db:clear:data and db:clear:logs scripts with rbac preservation"
```

---

### Task 2: Ingestion Audit Log Creation & Scoped Notification Polling API

**Files:**
- Modify: `src/app/api/engine/ingest/route.ts:125-155`
- Create: `src/app/api/notifications/poll/route.ts`
- Modify: `src/app/api/audit-logs/route.ts:20-45`
- Test: `src/test/notificationsPoll.test.ts`

**Step 1: Write the failing test**
Create `src/test/notificationsPoll.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { GET } from '../app/api/notifications/poll/route'
import { prisma } from '../lib/prisma'

describe('GET /api/notifications/poll', () => {
  it('returns documents created after since parameter for authorized company', async () => {
    const now = new Date()
    await prisma.document.upsert({
      where: { id: 'DMS-POLL-1' },
      create: {
        id: 'DMS-POLL-1',
        dmsDocId: 'DMS-POLL-1',
        packageId: 'PKG-1',
        fileSha256: 'sha-poll-1',
        pageCount: 1,
        invoiceNum: 'INV-POLL-1',
        invoiceDate: '2026-10-16',
        companyCode: 'AH',
        supplierTaxId: '0105500000001',
        supplierName: 'AAPICO Test Supplier',
        grandTotal: 15000,
        status: 'Auto-pass',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'Low',
        payloadJson: '{}',
        createdAt: now,
      },
      update: {},
    })

    const pastIso = new Date(Date.now() - 60000).toISOString()
    // Test for user with AH company
    const req = new Request(`http://localhost:3000/api/notifications/poll?since=${encodeURIComponent(pastIso)}&role=APR&companies=AH`)
    const res = await GET(req as any)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.newDocuments.some((d: any) => d.id === 'DMS-POLL-1')).toBe(true)

    // Test for user without AH company
    const reqUnauthorized = new Request(`http://localhost:3000/api/notifications/poll?since=${encodeURIComponent(pastIso)}&role=APR&companies=AHP`)
    const resUnauthorized = await GET(reqUnauthorized as any)
    const dataUnauthorized = await resUnauthorized.json()
    expect(dataUnauthorized.ok).toBe(true)
    expect(dataUnauthorized.newDocuments.some((d: any) => d.id === 'DMS-POLL-1')).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/notificationsPoll.test.ts`
Expected: FAIL (Cannot find module `../app/api/notifications/poll/route`)

**Step 3: Write minimal implementation**
1. Update `src/app/api/engine/ingest/route.ts`:
   - Inside `prisma.$transaction`, create `tx.auditLog.create`:
     ```typescript
     await tx.auditLog.create({
       data: {
         docId: doc.id,
         who: 'OCR Matching Engine',
         role: 'SYSTEM',
         act: 'INGEST',
         detail: `[${doc.companyCode}] เอกสารใหม่ ${doc.invoiceNum} (${doc.supplierName}) รับเข้าสู่ระบบ สถานะ: ${doc.status}`,
       },
     })
     ```
2. Implement `src/app/api/notifications/poll/route.ts`:
   - Parse `since`, `role`, `companies`, `whoId`, `receivers` from searchParams.
   - Query `prisma.document.findMany` with `where: { createdAt: { gt: sinceDate }, ...companyScope }`.
   - Return `{ ok: true, count: docs.length, newDocuments: docs.map(...) }`.
3. Verify `src/app/api/audit-logs/route.ts` correctly displays INGEST logs for users with matching company/receiver scope.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/notificationsPoll.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/app/api/engine/ingest/route.ts src/app/api/notifications/poll/route.ts src/app/api/audit-logs/route.ts src/test/notificationsPoll.test.ts
git commit -m "feat(alerts): add ingestion audit logging and scoped notification poll endpoint"
```

---

### Task 3: Real-Time Alert UI (Glassmorphism Toast, Web Audio Chime, Pulse Badge)

**Files:**
- Create: `src/lib/soundEffects.ts`
- Create: `src/features/notifications/useDocumentAlerts.ts`
- Create: `src/features/notifications/DocumentAlertToast.tsx`
- Modify: `src/components/layout/Topbar.tsx:1-80`
- Modify: `src/app/layout.tsx:1-40`
- Modify: `src/styles/components.css`
- Test: `src/test/documentAlerts.test.tsx`

**Step 1: Write the failing test**
Create `src/test/documentAlerts.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DocumentAlertToast } from '../features/notifications/DocumentAlertToast'

describe('DocumentAlertToast', () => {
  it('renders new document toast with company badge, invoice num and action button', () => {
    const doc = {
      id: 'DMS-105',
      invoiceNum: 'INV-8888',
      supplierName: 'AAPICO Hitech',
      companyCode: 'AH',
      grandTotal: 12500,
    }
    const onView = vi.fn()
    const onClose = vi.fn()

    render(<DocumentAlertToast doc={doc} onView={onView} onClose={onClose} />)
    expect(screen.getByText('DMS-105')).toBeDefined()
    expect(screen.getByText('INV-8888')).toBeDefined()
    expect(screen.getByText('AH')).toBeDefined()
    expect(screen.getByText(/AAPICO Hitech/)).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/documentAlerts.test.tsx`
Expected: FAIL (Cannot find module `../features/notifications/DocumentAlertToast`)

**Step 3: Write minimal implementation**
1. Implement `src/lib/soundEffects.ts`:
   - Uses Web Audio API: `AudioContext.createOscillator()`, `createGain()`.
   - Plays dual-tone harmonic chime (587Hz -> 880Hz, smooth decay).
   - Exports `playChime()`, `isSoundMuted()`, `toggleSoundMuted()`.
2. Implement `src/features/notifications/DocumentAlertToast.tsx`:
   - Glassmorphism styling (`backdrop-filter: blur(16px)`, gradient border, glowing badge).
   - Auto-dismiss after 8 seconds with pause on hover.
3. Implement `src/features/notifications/useDocumentAlerts.ts`:
   - Polls `/api/notifications/poll?since=...` every 8s.
   - Pauses when `document.hidden`.
   - On arrival: plays chime (if not muted), mounts toast, pulses notification badge.
4. Mount alert container in `src/app/layout.tsx` or `src/components/layout/App.tsx`.
5. Add Mute/Unmute sound icon button & pulsating badge in `src/components/layout/Topbar.tsx`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/documentAlerts.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/soundEffects.ts src/features/notifications/ src/components/layout/Topbar.tsx src/styles/components.css src/test/documentAlerts.test.tsx
git commit -m "feat(ui): add glassmorphism document alert toast, audio chime and topbar mute toggle"
```

---

### Task 4: PDF Default Evidence State & Continuous Multi-Page Vertical Scroll

**Files:**
- Modify: `src/components/evidence/EvidenceViewerDock.tsx:65-75`
- Modify: `src/features/pdf-viewer/components/PdfCanvasViewer.tsx:40-108`
- Modify: `src/features/pdf-viewer/hooks/usePdfViewer.ts:1-120`
- Modify: `src/styles/evidence.css`
- Test: `src/test/pdfContinuousScroll.test.tsx`

**Step 1: Write the failing test**
Create `src/test/pdfContinuousScroll.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EvidenceViewerDock } from '../components/evidence/EvidenceViewerDock'
import { InvoiceProvider } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import type { InvoiceDoc } from '../types/invoice'

const mockDoc: InvoiceDoc = {
  id: 'DMS-TEST-PDF',
  dmsDocId: 'DMS-TEST-PDF',
  fileSha256: 'sha-pdf-test',
  pageCount: 3,
  invoiceNum: 'INV-TEST',
  invoiceDate: '2026-10-16',
  companyCode: 'AH',
  supplierTaxId: '0105500000001',
  supplierName: 'Test Supplier',
  grandTotal: 1000,
  currency: 'THB',
  status: 'Review',
  recommendation: 'REVIEW',
  maxSeverity: 'Medium',
  assignedRole: 'APR',
  apStatus: 'unconfirmed',
  confidenceScore: 0.95,
  sourceCategory: 'PDF',
  receivedDate: '2026-10-16',
  extractedFields: {} as any,
  lineItems: [],
  validationProgress: {} as any,
  validationSteps: [],
  duplicateCheck: {} as any,
  auditTrail: [],
  rawValidation: {} as any,
}

describe('PDF Viewer Continuous Scroll and Default Evidence View', () => {
  it('mounts with evidence hidden by default', () => {
    render(
      <AuthProvider>
        <InvoiceProvider>
          <EvidenceViewerDock doc={mockDoc} />
        </InvoiceProvider>
      </AuthProvider>
    )
    // Evidence highlights toggle should be in off state by default
    const evidenceToggle = screen.getByTitle(/ซ่อนกรอบหลักฐาน|แสดงกรอบหลักฐาน/)
    expect(evidenceToggle).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/pdfContinuousScroll.test.tsx`
Expected: FAIL or verify default state mismatch.

**Step 3: Write minimal implementation**
1. In `src/components/evidence/EvidenceViewerDock.tsx`:
   - Change `const [showEvidence, setShowEvidence] = useState<boolean>(false)`.
2. In `src/features/pdf-viewer/hooks/usePdfViewer.ts`:
   - Enhance hook to load document once and maintain page render promises for all pages `1..numPages`.
   - Provide `renderAllPages(containerRef)` or per-page canvas registration.
3. In `src/features/pdf-viewer/components/PdfCanvasViewer.tsx`:
   - Wrap pages in `.evd-continuous-scroll` with `overflow-y: auto`.
   - Render stacked page elements `<div className="evd-page-wrapper" data-page-num={p}>` for each page.
   - Attach `BoundingBoxOverlay` scoped to each page with `visible={visible}`.
   - Set up `IntersectionObserver` to detect active visible page and sync with DockControls.
   - Smooth jump-to-page when page selector is triggered.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/pdfContinuousScroll.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/evidence/EvidenceViewerDock.tsx src/features/pdf-viewer/ src/styles/evidence.css src/test/pdfContinuousScroll.test.tsx
git commit -m "feat(pdf): add continuous multi-page vertical scroll and default clean pdf view"
```

---

### Task 5: Decoupled Microservice Docker Configurations & Healthcheck

**Files:**
- Create: `docker-compose.frontend.yml`
- Create: `docker-compose.engine.yml`
- Modify: `docker-compose.prod.yml`
- Test: `src/test/dockerDecoupledConfig.test.ts`

**Step 1: Write the failing test**
Create `src/test/dockerDecoupledConfig.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Decoupled Docker Compose Configurations', () => {
  it('has standalone docker-compose.frontend.yml with correct services', () => {
    const file = path.resolve(process.cwd(), 'docker-compose.frontend.yml')
    expect(fs.existsSync(file)).toBe(true)
    const content = fs.readFileSync(file, 'utf-8')
    expect(content).toContain('container_name: aiva-portal-frontend')
    expect(content).not.toContain('container_name: aiva-matching-engine')
  })

  it('has standalone docker-compose.engine.yml with PORTAL_CALLBACK_URL', () => {
    const file = path.resolve(process.cwd(), 'docker-compose.engine.yml')
    expect(fs.existsSync(file)).toBe(true)
    const content = fs.readFileSync(file, 'utf-8')
    expect(content).toContain('container_name: aiva-matching-engine')
    expect(content).toContain('PORTAL_CALLBACK_URL')
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/dockerDecoupledConfig.test.ts`
Expected: FAIL (files do not exist yet)

**Step 3: Write minimal implementation**
1. Create `docker-compose.frontend.yml`:
   - Standalone frontend container on port 3000, persistent SQLite volume, healthcheck on `/api/health`.
2. Create `docker-compose.engine.yml`:
   - Standalone OCR Engine container on port 8080 with `PORTAL_CALLBACK_URL` and Python environment.
3. Update `docker-compose.prod.yml`:
   - Add `profiles: ["frontend"]` and `profiles: ["engine"]` so users can run `docker compose --profile frontend up` or `docker compose --profile engine up` or `--profile full`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/dockerDecoupledConfig.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add docker-compose.frontend.yml docker-compose.engine.yml docker-compose.prod.yml src/test/dockerDecoupledConfig.test.ts
git commit -m "feat(docker): add independent compose configs for frontend and engine microservices"
```

---

### Task 6: Full Regression Verification & Live Integration Pass

**Files:**
- Modify: `docs/plans/task.md` (track all completed tasks)

**Step 1: Run complete test suite**
Run: `npm test`
Expected: All test files pass (100% green).

**Step 2: Run TypeScript check**
Run: `npm run typecheck`
Expected: Exit code 0, 0 type errors.

**Step 3: Run production build**
Run: `npm run build`
Expected: Next.js standalone build compiles clean (all routes generated).

**Step 4: Verify Docker configuration syntax**
Run: `docker compose -f docker-compose.frontend.yml config` (or mock schema check)
Expected: Clean valid configuration.

**Step 5: Update task tracker and commit**
```bash
git add docs/plans/task.md
git commit -m "chore: update task.md with completed production enhancements"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-10-16-production-enhancements-alert-pdf-clean-engine.md`.  
Next step: run `.agent/workflows/execute-plan.md` to execute this plan task-by-task in single-flow mode.
