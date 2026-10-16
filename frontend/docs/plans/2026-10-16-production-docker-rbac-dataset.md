# Production Docker Compose, Super Admin (SA) RBAC, Login Polish & Invoices v5 Dataset Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Provide turn-key production readiness for AIVA AP Portal and Engine: a complete Docker Compose environment, refactored Super Admin (`SA`) role and permission matrix, clean Oracle accounts slate, login page note removal with accelerated bug-free explainer animations, strict authentication guard, and live ingestion of the 125 `paperless_invoices_v5` documents.

**Architecture:** 
- Next.js 15 standalone multi-stage container and Python 3.11 FastAPI container running on a unified Docker bridge network with SQLite and cache volume persistence.
- Strict authentication route guard redirecting unauthenticated users to `/login`.
- Role system refactoring replacing `itsupport` role code with `SA` (Super Admin) across types, UI grid, and matrix.
- Clean database ingestion replacing legacy mock documents with the 125 real engine results from `temp/paperless_invoices_v5/`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma (SQLite), Docker & Docker Compose, Python 3.11, FastAPI, Uvicorn, Vitest.

---

### Task 1: Super Admin (`SA`) Role Refactoring & RBAC Matrix Update

**Files:**
- Modify: `src/types/auth.ts`
- Modify: `src/mock/users.ts`
- Modify: `src/features/login/data/demo.ts`
- Modify: `src/components/governance/RbacPage.tsx`
- Modify: `src/components/governance/rbac/PermissionExcelGrid.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/governance/AuditPage.tsx`
- Modify: `src/app/api/audit-logs/route.ts`
- Modify: `src/app/api/users/route.ts`
- Modify: `src/app/api/auth/ldap/route.ts`
- Test: `src/test/sidebarRole.test.tsx`
- Test: `src/test/auditLogScoping.test.ts`
- Test: `src/test/domain-types.test.ts`
- Test: `src/test/rbacPageInteractive.test.tsx`

**Step 1: Write/Update the failing tests**

Update `src/test/domain-types.test.ts` and `src/test/sidebarRole.test.tsx`:
- Expect `ROLES.SA` to exist with title `ผู้ดูแลระบบระดับสูง (Super Admin)` and scope `'all'`.
- Expect user `itsupport` to have role `'SA'`.
- Expect `ROLES.itsupport` to be undefined.

**Step 2: Run tests to verify failure**

Run: `npx vitest run src/test/domain-types.test.ts`
Expected: FAIL (`ROLES.SA is undefined` or `'itsupport'` is not assignable to `'SA'`).

**Step 3: Implement Super Admin (`SA`) role refactoring**

1. In `src/types/auth.ts`:
   ```ts
   export type RoleKey = 'EU' | 'ACC' | 'APR' | 'ADM' | 'SA'
   ```
2. In `src/mock/users.ts` and `src/features/login/data/demo.ts`:
   - Replace key `itsupport` in `ROLES` with `SA`:
     ```ts
     SA: {
       n: 'ผู้ดูแลระบบระดับสูง (Super Admin)',
       c: '#0D9488',
       bg: '#CCFBF1',
       p: [
         'VIEW_CO', 'VIEW_OWN', 'DMS', 'UPLOAD_NEW', 'CONFIRM', 'REVIEW', 'HOLD',
         'REJECT', 'MANUAL_REVIEW', 'DUP_OVERRIDE', 'UNCONFIRM', 'POST',
         'RETURN_FAILED', 'VIEW_AP', 'MAP', 'AUDIT'
       ],
       scope: 'all'
     }
     ```
   - Update user `itsupport` definition:
     ```ts
     { id: 'itsupport', n: 'กิตติศักดิ์ ซัพพอร์ต (IT Support)', email: 'itsupport@aapico.com', role: 'SA', rcvName: '—', emp: 99999, co: ['AH', 'AHA', 'AHT', 'AHP', 'AM'], unit: 'IT Support' }
     ```
3. In `src/components/governance/RbacPage.tsx`:
   - Table 6 headers render `roleKeys` where `rk === 'SA'` renders title `Super Admin`.
4. In `src/components/governance/rbac/PermissionExcelGrid.tsx`:
   - Role dropdown options: `(['EU', 'ACC', 'APR', 'ADM', 'SA'] as RoleKey[]).map(...)`.
   - Option label: `SA — Super Admin`.
5. Update `Sidebar.tsx`, `AuditPage.tsx`, `api/audit-logs/route.ts`, and `api/auth/ldap/route.ts` to check `role === 'SA'`.

**Step 4: Run tests to verify pass**

Run: `npx vitest run src/test/domain-types.test.ts src/test/sidebarRole.test.tsx src/test/auditLogScoping.test.ts src/test/rbacPageInteractive.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/types/auth.ts src/mock/users.ts src/features/login/data/demo.ts src/components/governance/ src/components/layout/ src/app/api/ src/test/
git commit -m "feat(rbac): refactor itsupport role to SA (Super Admin) across types, grid and matrix"
```

---

### Task 2: Purge Fake Oracle Accounts from Seed & Initial Maps

**Files:**
- Modify: `src/mock/users.ts`
- Modify: `src/features/login/data/demo.ts`
- Modify: `src/app/api/users/route.ts`
- Test: `src/test/domain-types.test.ts`
- Test: `src/test/userDirectory.test.ts`

**Step 1: Write/Update the test for empty initial mapping**

In `src/test/domain-types.test.ts`:
- Verify `INITIAL_MAPS` has length 0 (empty clean slate).
- Verify `USERS.filter(u => u.role === 'EU').every(u => !u.rcvName || u.rcvName === '—')`.

**Step 2: Run test to verify failure**

Run: `npx vitest run src/test/domain-types.test.ts`
Expected: FAIL with `expected 6 to be 0`.

**Step 3: Clear fake Oracle accounts**

1. In `src/mock/users.ts`:
   - Set `INITIAL_MAPS: AccountMapping[] = []`.
   - Set `rcvName: '—'` for all mock users (`u1`, `u2`, `u3`, `u8`).
2. In `src/features/login/data/demo.ts`:
   - Set `MAPS: { user: string; acct: string }[] = []`.
3. In `src/app/api/users/route.ts`:
   - Do not seed mock receivers into `prisma.userReceiverMap`.

**Step 4: Run tests to verify pass**

Run: `npx vitest run src/test/domain-types.test.ts src/test/userDirectory.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/mock/users.ts src/features/login/data/demo.ts src/app/api/users/route.ts src/test/
git commit -m "refactor(oracle): purge fake oracle receiver accounts for clean production slate"
```

---

### Task 3: Login Page Polish, Explainer Animation Speedup & Play Bugfix

**Files:**
- Modify: `src/features/login/data/explainer.ts`
- Modify: `src/features/login/explainer/FlowScene.tsx`
- Modify: `src/features/login/explainer/HowItWorks.tsx`
- Modify: `src/features/login/explainer/RulesScene.tsx`
- Modify: `src/features/login/login.css`
- Test: `src/test/loginPage.test.tsx`

**Step 1: Update test in `src/test/loginPage.test.tsx`**

Ensure test asserts:
- Yellow note banner with *"Portal ไม่เก็บ URL ของ DMS"* is absent.
- Auto-play toggle button functions correctly and does not freeze on click.

**Step 2: Run test**

Run: `npx vitest run src/test/loginPage.test.tsx`
Expected: Verify current behavior.

**Step 3: Implement Login Page polish & animation speedup**

1. In `src/features/login/data/explainer.ts`:
   - Remove the note text: `note: ""` in `WF[0]`.
   - Speed up DWELL by ~50%:
     ```ts
     export const DWELL: Record<TabKey, number> = { flow: 10000, rules: 12000, state: 9000, role: 8000, queue: 5000 };
     export const STEP_MS: Partial<Record<TabKey, number>> = { flow: 1600, state: 1500, role: 1800 };
     ```
2. In `src/features/login/explainer/HowItWorks.tsx`:
   - Fix mouse hover freeze: In `toggleAuto()`, reset `holdRef.current = false` so clicking "เล่นอัตโนมัติ" triggers instant animation regardless of cursor position.
   - Refine hover behavior so user clicking Play or switching tabs is not stalled by hover detection.
3. In `src/features/login/explainer/RulesScene.tsx`:
   - Cut step delay `T` from 460ms to 250ms for snappy rule evaluations.
4. In `src/features/login/login.css`:
   - Speed up keyframes (`lgx-dashR`, `lgx-pX`, etc.) to match the 2x tempo.

**Step 4: Run tests**

Run: `npx vitest run src/test/loginPage.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/login/ src/test/loginPage.test.tsx
git commit -m "fix(login): speed up explainer animations, fix play button hover freeze, and purge dms note banner"
```

---

### Task 4: Strict Authentication Guard & No Default IT Support

**Files:**
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/App.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/features/login/LoginPage.tsx`
- Modify: `src/features/login/useLogin.ts`
- Test: `src/test/loginPage.test.tsx`
- Test: `src/test/app-smoke.test.tsx`

**Step 1: Write unit test for Route Guard**

Create/update test in `src/test/app-smoke.test.tsx`:
- When localStorage and session have no user, App shell renders redirect / login prompt instead of defaulting to `u1` or `itsupport`.

**Step 2: Run test to verify failure**

Run: `npx vitest run src/test/app-smoke.test.tsx`
Expected: FAIL if it previously defaulted to `u1`.

**Step 3: Implement Route Guard**

1. In `src/context/AuthContext.tsx`:
   - Change `currentUser` initial state to check localStorage or cookie:
     ```ts
     const [currentUser, setCurrentUser] = useState<User | null>(() => {
       if (typeof window !== 'undefined') {
         try {
           const saved = window.localStorage.getItem('aiva.auth.user')
           if (saved) {
             const found = USERS.find(u => u.id === saved || u.email === saved)
             if (found) return found
           }
         } catch {}
       }
       return null
     })
     ```
2. In `src/App.tsx`:
   - If `!currentUser`, redirect to `/login` immediately via `window.location.href = '/login'`.
3. In `src/features/login/LoginPage.tsx`:
   - Ensure `c.username` and `c.password` start empty.
   - Forbid auto-login with `itsupport`.

**Step 4: Run tests to verify pass**

Run: `npx vitest run src/test/app-smoke.test.tsx src/test/loginPage.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/context/AuthContext.tsx src/App.tsx src/features/login/ src/test/
git commit -m "feat(auth): enforce strict login guard redirecting unauthenticated visits to /login"
```

---

### Task 5: Ingest Real Dataset (`paperless_invoices_v5`) into Portal Database & Default State

**Files:**
- Modify: `scripts/simulate-engine-push.ts`
- Modify: `src/mock/initialDocs.ts`
- Create: `scripts/seed-invoices-v5.ts`
- Modify: `package.json`
- Test: `src/test/seedHarness.test.ts`
- Test: `src/test/engineSchema.test.ts`

**Step 1: Write test for 125 documents ingestion**

In `src/test/seedHarness.test.ts`:
- Test that ingesting `temp/paperless_invoices_v5` yields 125 documents.
- Verify status distribution matches `summary.json`: 51 Auto-pass, 23 Review, 12 Hold, 39 Manual Review.

**Step 2: Run test to verify failure**

Run: `npx vitest run src/test/seedHarness.test.ts`
Expected: FAIL or outdated counts.

**Step 3: Implement Ingestion of `paperless_invoices_v5`**

1. In `scripts/simulate-engine-push.ts`:
   - Update `DEFAULT_DIR = 'temp/paperless_invoices_v5'`.
2. Create `scripts/seed-invoices-v5.ts`:
   - Reads `temp/paperless_invoices_v5/` and converts/upserts them into Prisma `Document` and `DocumentBBox`.
3. Update `src/mock/initialDocs.ts`:
   - Generate `INITIAL_DOCS_RAW` from `temp/paperless_invoices_v5/` so the fallback matches the true 125 invoices.
4. Add npm script in `package.json`:
   ```json
   "seed:v5": "tsx scripts/seed-invoices-v5.ts"
   ```

**Step 4: Run ingestion and verify tests pass**

Run: `npx vitest run src/test/seedHarness.test.ts src/test/engineSchema.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/ src/mock/initialDocs.ts package.json src/test/
git commit -m "feat(data): ingest paperless_invoices_v5 dataset replacing legacy mock documents"
```

---

### Task 6: Complete Production Docker Compose & Dockerfiles

**Files:**
- Create: `Dockerfile.frontend` (in `frontend/` or root)
- Create: `Dockerfile.engine` (in `engine/` or root)
- Create: `docker-compose.prod.yml` (in repository root)
- Create: `.env.production.example`
- Modify: `frontend/next.config.ts`

**Step 1: Configure Next.js standalone output**

In `frontend/next.config.ts`:
```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  /* existing settings */
}
```

**Step 2: Create Multi-stage `frontend/Dockerfile.frontend`**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN node scripts/copy-pdfjs-worker.mjs
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/temp/paperless_invoices_v5 ./temp/paperless_invoices_v5
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Step 3: Create `engine/Dockerfile.engine`**

```dockerfile
FROM python:3.11-slim AS runner
WORKDIR /engine
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -u 1001 appuser && chown -R appuser:appuser /engine
USER appuser
EXPOSE 8000
CMD ["python", "-m", "system_a.cli", "serve", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 4: Create `docker-compose.prod.yml`**

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    container_name: aiva-portal-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/prisma/prod.db
      - NEXT_PUBLIC_AUTH_MOCK=false
      - NEXT_PUBLIC_AUTH_BYPASS=false
      - LDAP_URL=${LDAP_URL:-ldaps://dc.aapico.com:636}
      - LDAP_BIND_DN=${LDAP_BIND_DN}
      - LDAP_BIND_PASSWORD=${LDAP_BIND_PASSWORD}
      - LDAP_SEARCH_BASE=${LDAP_SEARCH_BASE:-DC=aapico,DC=com}
      - AUTH_SECRET=${AUTH_SECRET}
    volumes:
      - sqlite_data:/app/prisma
      - aiva_cache:/app/cache
    networks:
      - aiva-net
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "5"

  engine:
    build:
      context: ./engine
      dockerfile: Dockerfile.engine
    container_name: aiva-matching-engine
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - CACHE_DIR=/engine/cache
    volumes:
      - aiva_cache:/engine/cache
    networks:
      - aiva-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "5"

volumes:
  sqlite_data:
    driver: local
  aiva_cache:
    driver: local

networks:
  aiva-net:
    driver: bridge
```

**Step 5: Verify build configuration & Commit**

```bash
git add frontend/Dockerfile.frontend engine/Dockerfile.engine docker-compose.prod.yml frontend/next.config.ts .env.production.example
git commit -m "feat(deploy): add production docker-compose and multi-stage Dockerfiles"
```

---

### Task 7: Full Verification & Integration Regression

**Step 1: Run TypeScript typecheck**
Run: `npm run typecheck` in `frontend/`
Expected: 0 errors.

**Step 2: Run complete unit test suite**
Run: `npm test` in `frontend/`
Expected: All 37+ test suites pass with 0 failures.

**Step 3: Run Next.js production build**
Run: `npm run build` in `frontend/`
Expected: Standalone build generates clean.

**Step 4: Update task tracker**
Update `docs/plans/task.md` with completion evidence.
