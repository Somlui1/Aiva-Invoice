# Unified Multi-Type Audit Logs & Oracle EBS Company Master Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement unified multi-type audit logging with user/permission diff tracking and RBAC security scoping, plus a dedicated database master table for 26 Oracle EBS affiliate companies with search and live Oracle MCP synchronization.

**Architecture:** Extend Prisma `AuditLog` with `category` and `metadataJson`, create `Company` table in SQLite seeded with 26 real AAPICO entities from Oracle EBS. Enhance `/api/users` to compute before/after diffs, update `/api/audit-logs` with category/search and RBAC scoping, build `/api/companies` search API, wire live Oracle MCP query in `/api/oracle/sync-companies`, and build unified UI in `AuditPage.tsx` and `RbacPage.tsx`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma ORM, SQLite, Oracle ORDS MCP (`sql_run`), Vitest.

---

### Task 1: Database Foundation & 26-Company Master Seed

**Files:**
- Modify: `frontend/prisma/schema.prisma`
- Create: `frontend/src/mock/companies26.ts`
- Modify: `frontend/src/lib/autoSeedSample.ts`
- Test: `frontend/src/test/companyModel.test.ts`

**Step 1: Write the failing test**
Create `frontend/src/test/companyModel.test.ts` testing that:
1. `prisma.auditLog` accepts `category` and `metadataJson`.
2. `prisma.company` model can create and query companies with code, name, taxId, ouName, ledgerName, orgId.
3. Seeding function seeds 26 companies into the database.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/companyModel.test.ts`
Expected: FAIL (Company table does not exist or category not in AuditLog).

**Step 3: Implement minimal code**
- Update `prisma/schema.prisma`:
  - Add `category String @default("DOCUMENT")` and `metadataJson String?` to `model AuditLog`.
  - Add `model Company` with fields `code`, `name`, `taxId`, `ouName`, `ledgerName`, `orgId`, `isActive`, `createdAt`, `updatedAt`.
- Run `npx prisma db push` to synchronize SQLite database and regenerate Prisma Client.
- Create `src/mock/companies26.ts` containing all 26 AAPICO companies extracted from Oracle EBS.
- Update `src/lib/autoSeedSample.ts` to populate the `Company` table if empty.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/companyModel.test.ts`
Expected: PASS (all tests pass).

**Step 5: Commit**
```bash
git add prisma/schema.prisma src/mock/companies26.ts src/lib/autoSeedSample.ts src/test/companyModel.test.ts
git commit -m "feat(db): add Company model and AuditLog category extensions with 26-company seed"
```

---

### Task 2: Company Search & Oracle MCP Sync API

**Files:**
- Create: `frontend/src/app/api/companies/route.ts`
- Modify: `frontend/src/app/api/oracle/sync-companies/route.ts`
- Test: `frontend/src/test/companyApiSync.test.ts`

**Step 1: Write the failing test**
Create `frontend/src/test/companyApiSync.test.ts` testing that:
1. `GET /api/companies` returns all 26 companies and supports `?search=AH` or `?search=101`.
2. `POST /api/oracle/sync-companies` upserts companies from Oracle MCP and records an `ORACLE_SYNC` audit log.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/companyApiSync.test.ts`
Expected: FAIL (`/api/companies` not found).

**Step 3: Implement minimal code**
- Create `src/app/api/companies/route.ts` handling `GET` with Prisma queries against `Company`, filtering by `search` (matching code, name, taxId, or ouName).
- Update `src/app/api/oracle/sync-companies/route.ts`:
  - Query Oracle MCP `APPS.HR_OPERATING_UNITS` joined with `APPS.XLE_ENTITY_PROFILES` and `APPS.GL_LEDGERS`.
  - Upsert rows into `prisma.company`.
  - Insert `AuditLog` with `category: 'ORACLE_SYNC'`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/companyApiSync.test.ts`
Expected: PASS (all tests pass).

**Step 5: Commit**
```bash
git add src/app/api/companies/route.ts src/app/api/oracle/sync-companies/route.ts src/test/companyApiSync.test.ts
git commit -m "feat(api): add company search and live Oracle MCP sync endpoints"
```

---

### Task 3: User Provisioning & Permission Change Diff Audit Logging

**Files:**
- Modify: `frontend/src/app/api/users/route.ts`
- Test: `frontend/src/test/userDiffAudit.test.ts`

**Step 1: Write the failing test**
Create `frontend/src/test/userDiffAudit.test.ts` testing that:
1. Creating a new user via `POST /api/users` creates an `AuditLog` row with `category: 'RBAC_USER'`, `action: 'CREATE_USER'`.
2. Updating existing user permissions creates an `AuditLog` row with `category: 'RBAC_PERMISSION'`, `action: 'UPDATE_PERMISSIONS'`, and JSON diff in `metadataJson`.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/userDiffAudit.test.ts`
Expected: FAIL (category is still default 'DOCUMENT' without diff metadata).

**Step 3: Implement minimal code**
- In `src/app/api/users/route.ts`:
  - Fetch existing user before update (if any).
  - Calculate diffs for role, companies (`addedCompanies`, `removedCompanies`), and receivers (`addedReceivers`, `removedReceivers`).
  - Create `AuditLog` in transaction:
    - If new: `category = 'RBAC_USER'`, `act = 'สร้างผู้ใช้ใหม่'`, `action = 'CREATE_USER'`.
    - If existing: `category = 'RBAC_PERMISSION'`, `act = 'แก้ไขสิทธิ์ผู้ใช้'`, `action = 'UPDATE_PERMISSIONS'`, `metadataJson` containing structured diff.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/userDiffAudit.test.ts`
Expected: PASS (all tests pass).

**Step 5: Commit**
```bash
git add src/app/api/users/route.ts src/test/userDiffAudit.test.ts
git commit -m "feat(rbac): add structured diff audit logging for user provisioning and permission changes"
```

---

### Task 4: Multi-Type Scoped Audit Logs API

**Files:**
- Modify: `frontend/src/app/api/audit-logs/route.ts`
- Test: `frontend/src/test/auditLogMultiType.test.ts`

**Step 1: Write the failing test**
Create `frontend/src/test/auditLogMultiType.test.ts` testing that:
1. `GET /api/audit-logs?category=RBAC_USER` filters by category.
2. `GET /api/audit-logs?search=...` performs text search across who, act, detail, docId.
3. SA/ADM roles see all log categories.
4. Non-admin roles (APR/EU) cannot see `RBAC_USER` or `RBAC_PERMISSION` logs.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/auditLogMultiType.test.ts`
Expected: FAIL (category and search query params not supported).

**Step 3: Implement minimal code**
- Update `src/app/api/audit-logs/route.ts` to parse `category` and `search` query parameters.
- Restrict non-admin queries from accessing administrative categories (`RBAC_USER`, `RBAC_PERMISSION`).
- Include `category` and `metadataJson` in the returned JSON logs.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/auditLogMultiType.test.ts`
Expected: PASS (all tests pass).

**Step 5: Commit**
```bash
git add src/app/api/audit-logs/route.ts src/test/auditLogMultiType.test.ts
git commit -m "feat(audit): add category and search filtering with role scoping to audit logs API"
```

---

### Task 5: Unified Audit Logs UI (`AuditPage.tsx`)

**Files:**
- Modify: `frontend/src/components/governance/AuditPage.tsx`
- Modify: `frontend/src/styles/components.css`
- Test: `frontend/src/test/unifiedAuditPage.test.tsx`

**Step 1: Write the failing test**
Create `frontend/src/test/unifiedAuditPage.test.tsx` testing that:
1. `AuditPage` renders text search input and Category dropdown selector.
2. Selecting a category filters the displayed log rows.
3. Each row displays the category badge and details.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/unifiedAuditPage.test.tsx`
Expected: FAIL (search input and category dropdown not present).

**Step 3: Implement minimal code**
- In `src/components/governance/AuditPage.tsx`:
  - Add `search` state and `categoryFilter` state.
  - Render search input and category dropdown in `.tbar`.
  - Add category badge in table rows with color classes.
  - Display metadata diff summary when available.
- In `src/styles/components.css`:
  - Add badge styling for `.badge-cat-ingest`, `.badge-cat-doc`, `.badge-cat-ap`, `.badge-cat-user`, `.badge-cat-perm`, `.badge-cat-auth`, `.badge-cat-sync`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/unifiedAuditPage.test.tsx`
Expected: PASS (all tests pass).

**Step 5: Commit**
```bash
git add src/components/governance/AuditPage.tsx src/styles/components.css src/test/unifiedAuditPage.test.tsx
git commit -m "feat(ui): add unified audit page with search, category filter, and diff badges"
```

---

### Task 6: RbacPage Tab 3 Company Search & Live MCP Sync UI

**Files:**
- Modify: `frontend/src/components/rbac/RbacPage.tsx`
- Test: `frontend/src/test/rbacCompanySearch.test.tsx`

**Step 1: Write the failing test**
Create `frontend/src/test/rbacCompanySearch.test.tsx` testing that:
1. Tab 3 in `RbacPage` renders a search input for companies.
2. Typing a search query filters the table to matching companies.
3. Sync button triggers MCP sync and updates company list.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/rbacCompanySearch.test.tsx`
Expected: FAIL (search input in Tab 3 not found).

**Step 3: Implement minimal code**
- In `src/components/rbac/RbacPage.tsx`:
  - Add `companySearch` state in Tab 3.
  - Fetch companies from `/api/companies` on mount.
  - Add search bar to filter by code, name, taxId, or orgId.
  - Wire sync button to trigger `/api/oracle/sync-companies` and refresh the table.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/rbacCompanySearch.test.tsx`
Expected: PASS (all tests pass).

**Step 5: Commit**
```bash
git add src/components/rbac/RbacPage.tsx src/test/rbacCompanySearch.test.tsx
git commit -m "feat(ui): add company search and live MCP sync to RbacPage Tab 3"
```

---

### Task 7: Full Regression Verification & Integration Pass

**Files:**
- Modify: `frontend/docs/plans/task.md`

**Step 1: Run full test suite**
Run: `npm test`
Expected: 100% of test files and tests pass.

**Step 2: Run TypeScript compiler check**
Run: `npm run typecheck`
Expected: 0 errors (exit code 0).

**Step 3: Run Next.js production build**
Run: `npm run build`
Expected: Clean compilation of all routes (exit code 0).

**Step 4: Update task tracker & commit**
Update `frontend/docs/plans/task.md` with completed tasks and verification evidence.
```bash
git add docs/plans/task.md
git commit -m "chore: complete unified audit logs and oracle company master verification"
```
