# RBAC Tabbed Navigation & Oracle Company Sync Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor RbacPage into a clean 3-tab interface (Admin Grid, Permission Matrix, Companies & ORG_ID) and implement Oracle MCP company sync API with interactive UI controls.

**Architecture:** Client tab state in `RbacPage.tsx` using system `.tabs` / `.tab` / `.tab.on` classes with accessibility roles; dedicated Next.js API route `/api/oracle/sync-companies` querying Oracle ORDS MCP JSON-RPC (`sql_run`) with robust fallback and AuditLog recording; Tab 3 sync button with pending spinners and feedback messages.

**Tech Stack:** Next.js 15, React 19, Prisma ORM, Oracle ORDS MCP JSON-RPC, Vitest, Testing Library.

---

### Task 1: Oracle MCP Company Sync API (`/api/oracle/sync-companies`)

**Files:**
- Create: `frontend/src/app/api/oracle/sync-companies/route.ts`
- Test: `frontend/src/test/oracleCompanySync.test.ts`

**Step 1: Write the failing test**
Create `src/test/oracleCompanySync.test.ts` verifying `POST /api/oracle/sync-companies` returns company records and records an audit log entry.

**Step 2: Run test to verify it fails**
Run: `node ./node_modules/vitest/vitest.mjs run src/test/oracleCompanySync.test.ts`
Expected: FAIL (route does not exist).

**Step 3: Implement minimal route**
Create `src/app/api/oracle/sync-companies/route.ts`:
- Check for `ORACLE_MCP_URL` and `ORACLE_MCP_TOKEN`.
- Query Oracle ORDS MCP or return fallback company master data.
- Record audit log entry in `prisma.auditLog`.
- Return `{ ok: true, source, companies }`.

**Step 4: Run test to verify it passes**
Run: `node ./node_modules/vitest/vitest.mjs run src/test/oracleCompanySync.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/app/api/oracle/sync-companies/route.ts src/test/oracleCompanySync.test.ts
git commit -m "feat(api): implement oracle company sync api with mcp fallback"
```

---

### Task 2: RbacPage 3-Tab Component Structure & Tab State

**Files:**
- Modify: `frontend/src/components/governance/RbacPage.tsx`
- Modify: `frontend/src/test/rbacPageInteractive.test.tsx`

**Step 1: Write the failing test**
Add tests in `src/test/rbacPageInteractive.test.tsx` checking:
- Default active tab is `จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)` and displays `PermissionExcelGrid`.
- Clicking `Matrix สิทธิ์ตามบทบาท` displays the Permission Matrix table and hides the Admin Grid.
- Clicking `บริษัทและ ORG_ID` displays the Companies table.

**Step 2: Run test to verify it fails**
Run: `node ./node_modules/vitest/vitest.mjs run src/test/rbacPageInteractive.test.tsx`
Expected: FAIL (tabs do not exist).

**Step 3: Implement 3-tab layout in RbacPage.tsx**
- Add `activeTab` state (`'users' | 'matrix' | 'companies'`) initialized to `'users'`.
- Render `.tabs` header with 3 tab buttons with `role="tab"` and badges:
  - `จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)`
  - `Matrix สิทธิ์ตามบทบาท`
  - `บริษัทและ ORG_ID`
- Render conditionally based on `activeTab`.

**Step 4: Run test to verify it passes**
Run: `node ./node_modules/vitest/vitest.mjs run src/test/rbacPageInteractive.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/components/governance/RbacPage.tsx src/test/rbacPageInteractive.test.tsx
git commit -m "feat(rbac): implement 3-tab navigation layout for RbacPage"
```

---

### Task 3: Interactive Oracle Sync Button & Feedback in Tab 3

**Files:**
- Modify: `frontend/src/components/governance/RbacPage.tsx`
- Modify: `frontend/src/styles/queue.css` (if any toolbar / sync button styling needed)
- Modify: `frontend/src/test/rbacPageInteractive.test.tsx`

**Step 1: Write the failing test**
Add a test in `src/test/rbacPageInteractive.test.tsx` verifying:
- Tab 3 contains the "Sync ข้อมูลจาก Oracle" button.
- Clicking the button triggers `/api/oracle/sync-companies` and displays success status.

**Step 2: Run test to verify it fails**
Run: `node ./node_modules/vitest/vitest.mjs run src/test/rbacPageInteractive.test.tsx`
Expected: FAIL (button / sync handler not implemented).

**Step 3: Implement Sync button and handler in RbacPage.tsx**
- Add `handleSyncCompanies` making a `POST` request to `/api/oracle/sync-companies`.
- Add loading indicator (`isSyncing`) and timestamp notification.
- Update company state dynamically if new data is returned.

**Step 4: Run test to verify it passes**
Run: `node ./node_modules/vitest/vitest.mjs run src/test/rbacPageInteractive.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/components/governance/RbacPage.tsx src/test/rbacPageInteractive.test.tsx
git commit -m "feat(rbac): add interactive oracle company sync button to tab 3"
```

---

### Task 4: Full Verification Pass (Vitest, TSC, Next Build)

**Files:**
- Modify: `frontend/docs/plans/task.md` (Update task status rows)

**Step 1: Run full test suite**
Run: `node ./node_modules/vitest/vitest.mjs run`
Expected: All 37 test files PASS.

**Step 2: Run type check**
Run: `npx tsc --noEmit`
Expected: 0 errors.

**Step 3: Run production build**
Run: `node ./node_modules/next/dist/bin/next build`
Expected: Clean build, 20/20 routes generated.

**Step 4: Commit and finalize**
```bash
git add docs/plans/task.md
git commit -m "chore(rbac): complete tabbed navigation and oracle company sync verification pass"
```
