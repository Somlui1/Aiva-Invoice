# Enterprise Portal & Matching Engine Integration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** พัฒนา Web Portal ให้เป็น Enterprise Production-Ready รับผลลัพธ์จาก Matching Engine (`aiva.system_a.result/3.0`) ผ่าน Webhook Ingest API, แปลงผ่าน Transformation Layer สู่ Portal Standard Domain Model, จัดเก็บบน Database (Prisma), และแสดงผล UI 100% ตรงตาม Mockup พร้อมระบบ PDF.js และ Interactive Bounding Box

**Architecture:** Fullstack Next.js 15 Decoupled Architecture ที่มี Adapter แปลงข้อมูลจาก Engine Schema เข้าสู่ Portal Domain Model ก่อนบันทึกลง Hybrid Database (Prisma ORM) โดย UI ฝั่ง Client ดึงข้อมูลผ่าน Portal APIs และมี Proxy Stream PDF จาก DMS พร้อม BBox Overlay Layer ซ้อนทับบน Canvas

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma ORM, SQLite/PostgreSQL, Zod, PDF.js (`pdfjs-dist`), Vitest

---

### Task 1: Setup Dependencies & Database Foundation (Prisma ORM)

**Files:**
- Modify: `package.json`
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Test: `src/test/prisma.test.ts`

**Step 1: Write the failing test**
Create `src/test/prisma.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { prisma } from '../lib/prisma'

describe('Prisma Database Client', () => {
  it('initializes prisma client and connects to database', async () => {
    expect(prisma).toBeDefined()
    const count = await prisma.document.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test -- src/test/prisma.test.ts`
Expected: FAIL (Cannot find module '../lib/prisma' or Prisma Client not generated)

**Step 3: Install dependencies and configure Prisma**
Run in shell:
```bash
npm install prisma @prisma/client zod
npx prisma init --datasource-provider sqlite
```
Define schema in `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Document {
  id              String   @id // e.g. "DMS-100"
  dmsDocId        String   @unique
  packageId       String
  fileSha256      String
  pageCount       Int
  invoiceNum      String
  invoiceDate     String
  companyCode     String
  supplierTaxId   String
  supplierName    String
  grandTotal      Float
  currency        String   @default("THB")
  status          String   // Auto-pass, Review, Hold, Manual Review, Confirmed, Posted
  recommendation  String
  maxSeverity     String
  receiverName    String?
  receiptNum      String?
  linesMatched    String?
  assignedRole    String   @default("EU")
  apStatus        String   @default("unconfirmed")
  payloadJson     String   // Full Portal Document JSON (Structured)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  runs            ValidationRun[]
}

model ValidationRun {
  id              String   @id @default(cuid())
  documentId      String
  validationId    String   @unique
  correlationId   String?
  validationRound Int      @default(1)
  rawEngineResult String   // Raw JSON from engine
  completedAt     DateTime @default(now())
  document        Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id        String   @id @default(cuid())
  docId     String
  who       String
  role      String
  act       String
  detail    String
  createdAt DateTime @default(now())
}
```
Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```
Run migration:
```bash
npx prisma db push
```

**Step 4: Run test to verify it passes**
Run: `npm test -- src/test/prisma.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add package.json package-lock.json prisma/schema.prisma src/lib/prisma.ts src/test/prisma.test.ts
git commit -m "feat(db): setup prisma orm schema and database client"
```

---

### Task 2: Engine Schema Validator & Portal Domain Contracts

**Files:**
- Create: `src/features/engine/schemas/engineResultV3Schema.ts`
- Create: `src/features/engine/types/portalDomain.ts`
- Test: `src/test/engineSchema.test.ts`

**Step 1: Write the failing test**
Create `src/test/engineSchema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { engineResultV3Schema } from '../features/engine/schemas/engineResultV3Schema'
import fs from 'node:fs'
import path from 'node:path'

describe('Engine Result 3.0 Schema Validator', () => {
  it('validates DMS-100 engine result successfully', () => {
    const filePath = path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json')
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const parsed = engineResultV3Schema.safeParse(rawData)
    expect(parsed.success).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test -- src/test/engineSchema.test.ts`
Expected: FAIL (Cannot find module)

**Step 3: Implement Engine Result 3.0 Zod Schema and Portal Domain Types**
Create `src/features/engine/types/portalDomain.ts` and `src/features/engine/schemas/engineResultV3Schema.ts` matching `result-3.0.schema.json`.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/test/engineSchema.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/features/engine/schemas/engineResultV3Schema.ts src/features/engine/types/portalDomain.ts src/test/engineSchema.test.ts
git commit -m "feat(engine): define engine result 3.0 schema and portal domain models"
```

---

### Task 3: Transformation Layer (EngineToPortalAdapter)

**Files:**
- Create: `src/features/engine/adapters/engineToPortalAdapter.ts`
- Test: `src/test/engineToPortalAdapter.test.ts`

**Step 1: Write the failing test**
Create `src/test/engineToPortalAdapter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import fs from 'node:fs'
import path from 'node:path'

describe('EngineToPortalAdapter', () => {
  it('correctly transforms DMS-100 engine result into Portal Domain Document', () => {
    const raw = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json'), 'utf-8'))
    const doc = transformEngineResultToPortalDoc(raw)
    
    expect(doc.id).toBe('DMS-100')
    expect(doc.invoiceNum).toBe('694055679')
    expect(doc.companyCode).toBe('AHT')
    expect(doc.grandTotal).toBe(34989.00)
    expect(doc.status).toBe('Manual Review')
    expect(doc.stepProgress.step3.status).toBe('warn')
    expect(doc.bboxes.length).toBeGreaterThan(0)
    expect(doc.bboxes[0].bbox).toHaveLength(4)
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test -- src/test/engineToPortalAdapter.test.ts`
Expected: FAIL

**Step 3: Implement Transformation Adapter**
Implement `transformEngineResultToPortalDoc` in `src/features/engine/adapters/engineToPortalAdapter.ts`:
- Map recommendation -> Portal status
- Calculate 4-step progress states
- Extract and normalize OCR bboxes per page `[x, y, w, h]`
- Attach default Portal workflow attributes

**Step 4: Run test to verify it passes**
Run: `npm test -- src/test/engineToPortalAdapter.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/features/engine/adapters/engineToPortalAdapter.ts src/test/engineToPortalAdapter.test.ts
git commit -m "feat(engine): implement engine to portal transformation adapter"
```

---

### Task 4: Webhook Ingestion API (`POST /api/engine/ingest`)

**Files:**
- Create: `src/app/api/engine/ingest/route.ts`
- Test: `src/test/ingestApi.test.ts`

**Step 1: Write the failing test**
Create `src/test/ingestApi.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { POST } from '../app/api/engine/ingest/route'
import { NextRequest } from 'next/server'

describe('POST /api/engine/ingest', () => {
  it('ingests valid engine payload with idempotency check', async () => {
    const raw = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json'), 'utf-8'))
    const req = new NextRequest('http://localhost:3000/api/engine/ingest', {
      method: 'POST',
      body: JSON.stringify(raw),
      headers: { 'Content-Type': 'application/json' }
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.dmsDocId).toBe('DMS-100')
  })
})
```

**Step 2: Run test to verify it fails**
Run: `npm test -- src/test/ingestApi.test.ts`
Expected: FAIL

**Step 3: Implement Ingestion Route Handler**
Implement `POST` in `src/app/api/engine/ingest/route.ts`:
- Validate with `engineResultV3Schema`
- Check idempotency with `validation_id`
- Transform payload using `transformEngineResultToPortalDoc`
- Save to `Document` and `ValidationRun` via Prisma

**Step 4: Run test to verify it passes**
Run: `npm test -- src/test/ingestApi.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/app/api/engine/ingest/route.ts src/test/ingestApi.test.ts
git commit -m "feat(api): implement webhook ingestion route handler with idempotency"
```

---

### Task 5: 126 Sample Files Ingestion Harness

**Files:**
- Create: `scripts/simulate-engine-push.ts`
- Modify: `package.json` (add script `"seed:engine"`)
- Test: `src/test/seedHarness.test.ts`

**Step 1: Write test for harness function**
Create test checking that the ingest simulation runner processes files and returns summary statistics.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/test/seedHarness.test.ts`
Expected: FAIL

**Step 3: Implement Simulation Runner Script**
Implement `scripts/simulate-engine-push.ts`:
- Scan `temp/paperless_invoices_v5/` for all `DMS-*_result.json`
- Post each file to the ingestion service
- Output summary report: Total Ingested, Auto-pass count, Review count, Hold count, Duration

**Step 4: Run script and test**
Run: `npx tsx scripts/simulate-engine-push.ts`
Verify all 126 files ingested successfully.

**Step 5: Commit**
```bash
git add scripts/simulate-engine-push.ts src/test/seedHarness.test.ts package.json
git commit -m "feat(scripts): add 126 sample files ingestion test harness"
```

---

### Task 6: DMS PDF Streaming Proxy API with Fallback

**Files:**
- Create: `src/app/api/documents/[id]/pdf/route.ts`
- Test: `src/test/pdfProxy.test.ts`

**Step 1: Write the failing test**
Create `src/test/pdfProxy.test.ts` testing streaming PDF response or mock fallback.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/test/pdfProxy.test.ts`
Expected: FAIL

**Step 3: Implement PDF Proxy Route**
In `src/app/api/documents/[id]/pdf/route.ts`:
- Lookup document in DB
- Stream PDF binary from DMS if configured
- Return fallback response if offline

**Step 4: Run test to verify it passes**
Run: `npm test -- src/test/pdfProxy.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/app/api/documents/[id]/pdf/route.ts src/test/pdfProxy.test.ts
git commit -m "feat(api): implement dms pdf streaming proxy with fallback"
```

---

### Task 7: PDF.js Canvas Viewer with Interactive Bounding Box Overlay

**Files:**
- Create: `src/features/pdf-viewer/components/PdfCanvasViewer.tsx`
- Create: `src/features/pdf-viewer/components/BoundingBoxOverlay.tsx`
- Create: `src/features/pdf-viewer/hooks/usePdfViewer.ts`
- Modify: `src/components/evidence/EvidenceViewerDock.tsx`
- Test: `src/test/coordinateTransform.test.ts`

**Step 1: Write coordinate transform test**
Create test verifying that normalized `[x, y, w, h]` correctly converts to canvas pixel box.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/test/coordinateTransform.test.ts`
Expected: FAIL

**Step 3: Implement PDF Viewer & BBox Overlay**
Implement PDF.js rendering on `<canvas>` and SVG/HTML BBox layer with bi-directional click highlight.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/test/coordinateTransform.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/features/pdf-viewer/ src/components/evidence/EvidenceViewerDock.tsx src/test/coordinateTransform.test.ts
git commit -m "feat(pdf): integrate pdf.js canvas viewer and interactive bounding box overlay"
```

---

### Task 8: UI Integration & Live Database Connection (100% Mockup Parity)

**Files:**
- Create: `src/app/api/documents/route.ts` (DB-backed list & query)
- Modify: `src/context/InvoiceContext.tsx` (connect to live API)
- Modify: `src/components/queue/QueuePage.tsx`
- Modify: `src/components/queue/InvoiceDetailPane.tsx`
- Test: `src/test/uiParity.test.ts`

**Step 1: Write integration test**
Verify that `InvoiceContext` fetches live DB documents, preserves table/split views, KPI filters, and action triggers.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/test/uiParity.test.ts`
Expected: FAIL

**Step 3: Implement Live Database Connection in Context & UI**
Wire up Context to load live records from `/api/documents`, ensuring 100% parity with `AIVA-Web-Portal-Mockup-v4.18.html`.

**Step 4: Run test and build verification**
Run: `npm test` and `npm run build`
Expected: ALL PASS with 0 build errors.

**Step 5: Commit**
```bash
git add src/app/api/documents/route.ts src/context/InvoiceContext.tsx src/components/queue/ src/test/uiParity.test.ts
git commit -m "feat(ui): connect queue and detail pane to live portal database"
```

---

### Task 9: Final End-to-End Verification & Documentation Update

**Files:**
- Update: `docs/plans/task.md`
- Run: `npx tsx scripts/simulate-engine-push.ts`
- Run: `npm test`
- Run: `npm run build`

**Step 1: Run Full Verification Suite**
Verify end-to-end ingestion of 126 sample documents, check all tests passing, and confirm build success.

**Step 2: Commit & Update Task Tracker**
```bash
git add docs/plans/task.md
git commit -m "docs: complete enterprise portal and engine integration implementation"
```
