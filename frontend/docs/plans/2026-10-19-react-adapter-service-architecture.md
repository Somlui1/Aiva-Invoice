# React + Express Adapter Service Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Migrate the web application from Next.js 15 to a pure React 19 + Vite SPA frontend backed by an integrated Express.js Adapter Service managing SQLite, LDAP, Paperless DMS proxy, and Engine webhooks.

**Architecture:** The frontend runs as a pure client-side SPA (React 19 + Vite) with zero SSR/Hydration overhead. An Express.js + TypeScript Adapter Service runs in the background to handle server-only concerns (Prisma SQLite, LDAP binding, Webhook ingestion, Paperless DMS streaming). In development, `concurrently` runs both services via a single command with Vite proxying `/api` requests; in production, Express serves static assets and API routes on a single port.

**Tech Stack:** React 19, Vite 6, Express 4 / TypeScript, Prisma ORM 6 (SQLite), ldapts, Vitest 3.

---

### Task 1: Project Scaffolding, Dependencies & Vite Configuration

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`

**Step 1: Write the failing test for Vite configuration & entrypoint**

Create `frontend/src/test/viteSetup.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Vite & SPA Entrypoint Scaffolding', () => {
  it('has index.html at root with root div and main.tsx script', () => {
    const indexPath = path.resolve(__dirname, '../../index.html')
    expect(fs.existsSync(indexPath)).toBe(true)
    const content = fs.readFileSync(indexPath, 'utf-8')
    expect(content).toContain('<div id="root"></div>')
    expect(content).toContain('/src/main.tsx')
  })

  it('has vite.config.ts with /api proxy configured', () => {
    const vitePath = path.resolve(__dirname, '../../vite.config.ts')
    expect(fs.existsSync(vitePath)).toBe(true)
    const content = fs.readFileSync(vitePath, 'utf-8')
    expect(content).toContain('/api')
    expect(content).toContain('3001')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/viteSetup.test.ts`
Expected: FAIL (files missing).

**Step 3: Implement dependencies, Vite config, index.html, and main.tsx**

1. Install dependencies in `frontend/package.json`:
   - `express`, `cors`, `cookie-parser`, `concurrently`
   - `@types/express`, `@types/cors`, `@types/cookie-parser`
2. Create `frontend/index.html`:
```html
<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AIVA - Enterprise Invoice Matching Portal</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
3. Create `frontend/src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```
4. Create `frontend/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/viteSetup.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json vite.config.ts index.html src/main.tsx src/test/viteSetup.test.ts
git commit -m "feat(scaffold): configure Vite SPA entrypoint and API proxy"
```

---

### Task 2: Express Adapter Service Entrypoint & Middlewares

**Files:**
- Create: `frontend/server/index.ts`
- Create: `frontend/server/app.ts`
- Create: `frontend/server/middleware/session.ts`
- Create: `frontend/server/middleware/errorHandler.ts`
- Test: `frontend/src/test/serverBootstrap.test.ts`

**Step 1: Write the failing test for Express App creation & healthcheck**

Create `frontend/src/test/serverBootstrap.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createExpressApp } from '../../server/app'

describe('Express Adapter Service Bootstrap', () => {
  it('instantiates express app with health endpoint', async () => {
    const app = createExpressApp()
    expect(app).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/serverBootstrap.test.ts`
Expected: FAIL (`../../server/app` not found).

**Step 3: Implement Express app & bootstrap**

1. Create `frontend/server/app.ts`:
   - Setup `express.json({ limit: '50mb' })`
   - Setup `cors({ origin: true, credentials: true })`
   - Setup `cookie-parser()`
   - Setup session middleware extracting `aiva_session` cookie and `x-user-*` headers
2. Create `frontend/server/index.ts`:
   - Call `ensureProductionSampleData()`
   - Call `printServiceHealthReport()`
   - Listen on port `3001` (or `process.env.PORT || 3000` in production)
   - Serve `dist/` static files in production mode

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/serverBootstrap.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add server/app.ts server/index.ts server/middleware/ src/test/serverBootstrap.test.ts
git commit -m "feat(server): scaffold Express adapter service and middleware"
```

---

### Task 3: Authentication & Identity Routes Migration

**Files:**
- Create: `frontend/server/routes/auth.ts`
- Test: `frontend/src/test/serverAuthRoutes.test.ts`

**Step 1: Write failing test for Express auth endpoints**

Create `frontend/src/test/serverAuthRoutes.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express Auth Routes', () => {
  const app = createExpressApp()

  it('GET /api/auth/me returns 401 when no session is present', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('GET /api/auth/me returns user profile when x-user-id header is provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('x-user-id', 'wajeepradit.p')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.email).toBe('wajeepradit.p@aapico.com')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/serverAuthRoutes.test.ts`
Expected: FAIL (404 Not Found on `/api/auth/me`).

**Step 3: Implement `server/routes/auth.ts`**

- Port logic from `src/app/api/auth/ldap/route.ts` and `src/app/api/auth/me/route.ts`.
- `POST /api/auth/ldap`: authenticate via `authenticateLdap` (or DB fallback), set `aiva_session` cookie, return user.
- `GET /api/auth/me`: verify cookie or `x-user-id`, retrieve user from SQLite DB.
- `GET /api/auth/microsoft/start`: mock/redirect start.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/serverAuthRoutes.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add server/routes/auth.ts src/test/serverAuthRoutes.test.ts
git commit -m "feat(server): implement Express auth and session routes"
```

---

### Task 4: Documents & State Machine Mutation Endpoints Migration

**Files:**
- Create: `frontend/server/routes/documents.ts`
- Test: `frontend/src/test/serverDocumentsRoutes.test.ts`

**Step 1: Write failing test for documents & actions routes**

Create `frontend/src/test/serverDocumentsRoutes.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express Documents & Actions Routes', () => {
  const app = createExpressApp()

  it('GET /api/documents returns documents array', async () => {
    const res = await request(app).get('/api/documents')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.documents)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/serverDocumentsRoutes.test.ts`
Expected: FAIL (404 Not Found).

**Step 3: Implement `server/routes/documents.ts`**

- Port logic from `src/app/api/documents/route.ts` and `src/app/api/documents/[id]/actions/route.ts`.
- `GET /api/documents`: parse query parameters (`status`, `company`, `role`, `include`), query Prisma `Document` and `DocumentBBox`.
- `GET /api/documents/:id`: single document retrieval.
- `POST /api/documents/:id/actions`: execute state transition with locking check and audit log recording.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/serverDocumentsRoutes.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add server/routes/documents.ts src/test/serverDocumentsRoutes.test.ts
git commit -m "feat(server): implement Express documents and action mutation routes"
```

---

### Task 5: PDF Streaming Proxy & Engine Webhook Ingestion Migration

**Files:**
- Create: `frontend/server/routes/pdfProxy.ts`
- Create: `frontend/server/routes/engineIngest.ts`
- Test: `frontend/src/test/serverPdfAndIngest.test.ts`

**Step 1: Write failing test for PDF proxy and Engine webhook**

Create `frontend/src/test/serverPdfAndIngest.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express PDF Proxy and Engine Ingestion', () => {
  const app = createExpressApp()

  it('POST /api/engine/ingest rejects invalid JSON with 422', async () => {
    const res = await request(app).post('/api/engine/ingest').send({})
    expect(res.status).toBe(422)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/serverPdfAndIngest.test.ts`
Expected: FAIL (404 Not Found).

**Step 3: Implement `server/routes/pdfProxy.ts` and `server/routes/engineIngest.ts`**

- Port `src/app/api/documents/[id]/pdf/route.ts` to Express streaming pipeline (`res.setHeader`, `pipeline(stream, res)`).
- Port `src/app/api/engine/ingest/route.ts`:
  - `engineResultV3Schema.safeParse`
  - Idempotency check on `validation_id` and `file_sha256`
  - `transformValidatedEngineResult(engine)`
  - Prisma transaction for `Document.upsert` and `ValidationRun.create`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/serverPdfAndIngest.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add server/routes/pdfProxy.ts server/routes/engineIngest.ts src/test/serverPdfAndIngest.test.ts
git commit -m "feat(server): implement Express PDF streaming proxy and Engine webhook ingestion"
```

---

### Task 6: Governance Routes (AP Batches, RBAC Users, AD Search, Audit, Oracle Sync, Health)

**Files:**
- Create: `frontend/server/routes/governance.ts`
- Test: `frontend/src/test/serverGovernanceRoutes.test.ts`

**Step 1: Write failing test for governance routes**

Create `frontend/src/test/serverGovernanceRoutes.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express Governance Routes', () => {
  const app = createExpressApp()

  it('GET /api/health returns 200 OK', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBeDefined()
  })

  it('GET /api/users returns users list', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.users)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/serverGovernanceRoutes.test.ts`
Expected: FAIL.

**Step 3: Implement routes in `server/routes/governance.ts`**

- Port `/api/health`, `/api/users`, `/api/ad/search`, `/api/ap/batches`, `/api/audit-logs`, `/api/oracle/sync-companies`.
- Register routes in `server/app.ts`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/serverGovernanceRoutes.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add server/routes/governance.ts server/app.ts src/test/serverGovernanceRoutes.test.ts
git commit -m "feat(server): implement governance, RBAC, health, and batch routes"
```

---

### Task 7: Frontend SPA Root & Routing Adaptation

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/features/login/LoginPage.tsx`
- Remove: Next.js dependencies from package.json (`next`, `next/navigation`)
- Remove: `frontend/src/app/` directory (now fully replaced by Express routes & SPA root)

**Step 1: Write failing test verifying pure SPA routing in App.tsx**

Create `frontend/src/test/spaRouting.test.tsx`:
```tsx
/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '../App'
import { USERS } from '../mock/users'
import React from 'react'

describe('Pure SPA Root Routing', () => {
  it('renders login view directly when unauthenticated without crashing', () => {
    render(<App initialUser={null} />)
    expect(screen.getByRole('heading', { name: /เข้าสู่ระบบ/i })).toBeDefined()
  })

  it('renders portal shell when authenticated', () => {
    render(<App initialUser={USERS[0]} />)
    expect(screen.getByText(/AIVA/i)).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/spaRouting.test.tsx`
Expected: FAIL (unauthenticated previously showed redirect guard `กำลังนำทางไปหน้าเข้าสู่ระบบ...`).

**Step 3: Update `src/App.tsx` and `LoginPage.tsx`**

1. In `src/App.tsx`:
   - If `!isAuthenticated`, render `<LoginPage onLoginSuccess={(user) => login(user)} />` directly in the DOM.
   - If `window.location.pathname.startsWith('/viewer/')`, extract the doc ID and render `<StandaloneBBoxViewer />`.
   - Remove Next.js `useRouter` / `window.location.href = '/login'` bounce.
2. Remove Next.js packages from `frontend/package.json`.
3. Clean up legacy `src/app/` folder.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/spaRouting.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/App.tsx src/features/login/ src/test/spaRouting.test.tsx package.json
git commit -m "refactor(frontend): adapt App.tsx to pure React SPA and retire Next.js"
```

---

### Task 8: Verification & Regression Pass

**Files:**
- Entire repository

**Step 1: Run Full Vitest Suite**
Run: `npm test`
Expected: 42/42 test files PASS (100% green).

**Step 2: Run TypeScript Typecheck**
Run: `npm run typecheck`
Expected: 0 errors (exit 0).

**Step 3: Run Frontend Production Build**
Run: `npm run build`
Expected: Vite build clean, server transpile clean.

**Step 4: Run Python Invoice Matching Engine Tests**
Run: `cd engine && python -m pytest -q`
Expected: 263 passed (exit 0).

**Step 5: Update Task Tracker & Commit**
Update `frontend/docs/plans/task.md` and commit.
