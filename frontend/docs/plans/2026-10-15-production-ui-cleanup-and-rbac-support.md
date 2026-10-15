# Production UI Cleanup, RBAC Design System Icons, Audit Log Scoping & IT Support Role Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Clean up all dev/mock remnants across the portal, replace RBAC emojis with design system SVG icons, enforce identity-based audit log scoping, add `itsupport` support admin role with all-menu visibility, and introduce an interactive My Profile & Permissions modal with receiver queue filtering.

**Architecture:** Extend `RoleKey` and `ROLES` to support `itsupport` with full document and menu scope; update `Sidebar` to reveal all navigation sections for `itsupport`; replace the Topbar demo user switcher with a production profile badge and `MyProfileModal`; purge emojis from `RbacPage` using `<Icon />`; implement backend query scoping in `/api/audit-logs` by user identity and company; remove the yellow `MockBar` from `/login`; and add Oracle Receiver account filtering for EU in `QueueToolbar`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma ORM, Vitest, Testing Library.

---

### Task 1: Role Definition & Context Integration for `itsupport`

**Files:**
- Modify: `src/types/auth.ts:1-29`
- Modify: `src/mock/users.ts:1-60`
- Modify: `src/context/AuthContext.tsx:30-75`
- Test: `src/test/domain-types.test.ts`

**Step 1: Write the failing test**
Add test in `src/test/domain-types.test.ts` verifying `itsupport` is a valid `RoleKey`, exists in `ROLES`, has `scope === 'all'`, has full permissions (`['VIEW_CO', 'VIEW_OWN', 'DMS', 'CONFIRM', 'REVIEW', 'HOLD', 'REJECT', 'MANUAL_REVIEW', 'DUP_OVERRIDE', 'UNCONFIRM', 'POST', 'RETURN_FAILED', 'VIEW_AP', 'MAP', 'AUDIT']`), and user `u8` is an `itsupport` user.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/domain-types.test.ts`
Expected: FAIL with missing `itsupport` role definition.

**Step 3: Write minimal implementation**
- In `src/types/auth.ts`: Add `'itsupport'` to `RoleKey` and allow `'all'` in `Role.scope`.
- In `src/mock/users.ts`: Add `itsupport` entry to `ROLES` with teal colors (`c: '#0D9488'`, `bg: '#CCFBF1'`), `scope: 'all'`, and all permissions. Add user `u8` (`กิตติศักดิ์ ซัพพอร์ต`, `kittisak.s@aapico.com`, `role: 'itsupport'`).
- In `src/context/AuthContext.tsx`: Update `scopeCheck` to always return `{ ok: true }` when `currentRole.scope === 'all'`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/domain-types.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/types/auth.ts src/mock/users.ts src/context/AuthContext.tsx src/test/domain-types.test.ts
git commit -m "feat(auth): add itsupport role and all-scope document access"
```

---

### Task 2: Sidebar Navigation Visibility for `itsupport`

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:40-105`
- Test: `src/test/sidebarRole.test.tsx`

**Step 1: Write the failing test**
In `src/test/sidebarRole.test.tsx`, add a test case verifying that `itsupport` (`u8`) sees:
1. "งานหลัก" (คิวตรวจสอบ, ส่งเข้า AP Interface)
2. "การกำกับดูแล" (สิทธิ์และการเชื่อมบัญชี, บันทึกการเข้าถึง, ตั้งค่า)
3. "เครื่องมือทดสอบและพัฒนา" (ชุดเอกสารทดสอบ, มาตรฐาน Payload, Document Simulation)

**Step 2: Run test to verify it fails**
Run: `npm test src/test/sidebarRole.test.tsx`
Expected: FAIL because `Sidebar` currently partitions into either ADM (Gov + Dev) or non-ADM (Work + Gov).

**Step 3: Write minimal implementation**
In `src/components/layout/Sidebar.tsx`:
- Detect `isSupport = currentUser.role === 'itsupport'` and `isAdm = currentUser.role === 'ADM'`.
- If `isSupport`, render all 3 sections: `งานหลัก`, `การกำกับดูแล`, and `เครื่องมือทดสอบและพัฒนา`.
- If `isAdm`, render `การกำกับดูแล` and `เครื่องมือทดสอบและพัฒนา`.
- Otherwise (`EU`, `ACC`, `APR`), render `งานหลัก` and `การกำกับดูแล`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/sidebarRole.test.tsx`
Expected: PASS (4/4 tests pass)

**Step 5: Commit**
```bash
git add src/components/layout/Sidebar.tsx src/test/sidebarRole.test.tsx
git commit -m "feat(nav): support all 3 navigation sections for itsupport role"
```

---

### Task 3: Topbar Profile Header & "My Profile & Permissions" Modal

**Files:**
- Create: `src/components/layout/MyProfileModal.tsx`
- Modify: `src/components/layout/Topbar.tsx:80-120`
- Create: `src/test/topbarProfile.test.tsx`

**Step 1: Write the failing test**
In `src/test/topbarProfile.test.tsx`, verify:
- `<select id="user-selector">` does NOT exist in Topbar.
- The current user's name (e.g. `สมศักดิ์ ใจดี`) and role badge are rendered in `.who`.
- Clicking on the profile trigger opens `MyProfileModal` displaying user email, unit, assigned companies/receivers, and permitted actions with green checkmarks.
- Clicking close or ✕ dismisses the modal.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/topbarProfile.test.tsx`
Expected: FAIL (`MyProfileModal` not found, `user-selector` still present).

**Step 3: Write minimal implementation**
- Create `src/components/layout/MyProfileModal.tsx` rendering user information (name, email, empId, unit, role badge, assigned companies, receivers, and the list of permissions from `PERMISSION_DESCRIPTIONS` with checkmarks).
- In `src/components/layout/Topbar.tsx`: Remove `<select id="user-selector">`. Render the clickable user profile pill button that toggles `MyProfileModal`, followed by the logout button.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/topbarProfile.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/layout/MyProfileModal.tsx src/components/layout/Topbar.tsx src/test/topbarProfile.test.tsx
git commit -m "feat(ui): add production profile header and my profile modal, remove dev user selector"
```

---

### Task 4: RBAC UI Redesign & Emoji Purge

**Files:**
- Modify: `src/components/governance/RbacPage.tsx:50-100, 250-290`
- Modify: `src/test/rbacPageInteractive.test.tsx:90-135`

**Step 1: Write the failing test**
Update `src/test/rbacPageInteractive.test.tsx` to assert that:
- Tab elements render with `<Icon />` SVG elements (no emoji text characters like `👤`, `📋`, `🏢`, `🔒`, `🔄`).
- The 3 tabs still switch views correctly and maintain full functionality.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/rbacPageInteractive.test.tsx`
Expected: FAIL if matching on emoji absence or icon presence.

**Step 3: Write minimal implementation**
In `src/components/governance/RbacPage.tsx`:
- Replace `👤 จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)` with `<Icon name="user" size="sm" /> จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)`
- Replace `📋 Matrix สิทธิ์ตามบทบาท` with `<Icon name="layers" size="sm" /> Matrix สิทธิ์ตามบทบาท`
- Replace `🏢 บริษัทและ ORG_ID` with `<Icon name="building" size="sm" /> บริษัทและ ORG_ID`
- Replace `🔒 มุมมองอ่านอย่างเดียว...` with `<Icon name="lock" size="sm" /> มุมมองอ่านอย่างเดียว...`
- Replace `'🔄 Sync ข้อมูลจาก Oracle'` with `<><Icon name="refresh" size="sm" /> Sync ข้อมูลจาก Oracle</>`
- Update `PermissionExcelGrid.tsx` options to include `itsupport` in role options.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/rbacPageInteractive.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/governance/RbacPage.tsx src/components/governance/rbac/PermissionExcelGrid.tsx src/test/rbacPageInteractive.test.tsx
git commit -m "refactor(rbac): replace emojis with design system SVG icons and support itsupport in grid"
```

---

### Task 5: Audit Log Security Scoping API & AuditPage Integration

**Files:**
- Modify: `src/app/api/audit-logs/route.ts:1-33`
- Modify: `src/components/governance/AuditPage.tsx:1-50`
- Create: `src/test/auditLogScoping.test.ts`

**Step 1: Write the failing test**
Create `src/test/auditLogScoping.test.ts`:
- Create test AuditLog rows for different users (`u1` / EU, `u2` / ACC, `u6` / APR on AH, `u7` / ADM).
- Call `GET /api/audit-logs?whoId=u1&role=EU`: verify only `u1`'s logs are returned.
- Call `GET /api/audit-logs?whoId=u6&role=APR&companies=AH`: verify only AH company logs and `u6`'s logs are returned.
- Call `GET /api/audit-logs?whoId=u8&role=itsupport`: verify all logs are returned.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/auditLogScoping.test.ts`
Expected: FAIL because `/api/audit-logs` currently returns all logs indiscriminately.

**Step 3: Write minimal implementation**
- In `src/app/api/audit-logs/route.ts`:
  Parse search parameters `whoId`, `role`, and `companies`.
  If `role === 'ADM' || role === 'itsupport'`: query all logs (`take: 100`).
  Else if `role === 'APR'`: find document IDs for `companyCode in companies`, and query logs where `docId in docIds OR whoId = whoId`.
  Else (`EU`, `ACC`): query logs where `whoId = whoId`.
- In `src/components/governance/AuditPage.tsx`:
  Fetch `/api/audit-logs?whoId=${currentUser.id}&role=${currentUser.role}&companies=${currentUser.co.join(',')}`.
  Also filter fallback in-memory logs by role and `whoId`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/auditLogScoping.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/app/api/audit-logs/route.ts src/components/governance/AuditPage.tsx src/test/auditLogScoping.test.ts
git commit -m "feat(audit): implement identity and company based audit log scoping"
```

---

### Task 6: Login Page Production Cleanup

**Files:**
- Modify: `src/features/login/LoginPage.tsx:80-100`
- Modify: `src/features/login/LoginForm.tsx:165-180`
- Modify: `src/test/loginPage.test.tsx:20-55`

**Step 1: Write the failing test**
In `src/test/loginPage.test.tsx`:
- Assert that `MockBar` (`.lg-dev` or "ข้ามหน้า login" button) is NOT rendered on the login page.
- Assert that footer prototype disclaimers are removed.
- Assert that Microsoft 365 and LDAP tabs remain functional.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/loginPage.test.tsx`
Expected: FAIL because `MockBar` is currently rendered when `isMock` is true.

**Step 3: Write minimal implementation**
- In `src/features/login/LoginPage.tsx`: Remove the `<MockBar ... />` JSX rendering.
- In `src/features/login/LoginForm.tsx`: Remove the `{mock && <span>Mock Prototype · ข้อมูลทั้งหมดเป็นค่าสมมติ</span>}` element.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/loginPage.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/features/login/LoginPage.tsx src/features/login/LoginForm.tsx src/test/loginPage.test.tsx
git commit -m "refactor(login): purge yellow mock bar and demo disclaimers for production readiness"
```

---

### Task 7: Queue Receiver Filtering by Oracle Account

**Files:**
- Modify: `src/context/InvoiceContext.tsx:30-80`
- Modify: `src/components/queue/QueueToolbar.tsx:50-90`
- Create: `src/test/queueReceiverFilter.test.tsx`

**Step 1: Write the failing test**
Create `src/test/queueReceiverFilter.test.tsx`:
- Render `QueueToolbar` under `AuthProvider` with an `EU` user having multiple receiver accounts or a specific receiver account.
- Verify receiver filter chips/selector exist (e.g. "ทุกใบรับของฉัน", specific account).
- Verify selecting a specific receiver filters the queue documents.

**Step 2: Run test to verify it fails**
Run: `npm test src/test/queueReceiverFilter.test.tsx`
Expected: FAIL because `QueueToolbar` only renders static text for EU.

**Step 3: Write minimal implementation**
- In `src/context/InvoiceContext.tsx`: Add `receiverFilter: string | null` and `setReceiverFilter(rcv: string | null)` to `InvoiceContext`. In `visibleDocs` computation, if `receiverFilter` is active, filter `d.receiver === receiverFilter`.
- In `src/components/queue/QueueToolbar.tsx`: For `isEu`, render filter chips for "ทุกบัญชีของฉัน" and each account in `acctsOf(currentUser)`.

**Step 4: Run test to verify it passes**
Run: `npm test src/test/queueReceiverFilter.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/context/InvoiceContext.tsx src/components/queue/QueueToolbar.tsx src/test/queueReceiverFilter.test.tsx
git commit -m "feat(queue): add interactive Oracle receiver account filtering for EU role"
```

---

### Task 8: Full End-to-End Regression & Verification Pass

**Files:**
- Test all modified and existing test files.
- Run: `npm test`
- Run: `npx tsc --noEmit`
- Run: `npm run build`

**Step 1: Run full Vitest test suite**
Run: `npm test`
Expected: All 39+ test files pass (100% green).

**Step 2: Run TypeScript compiler**
Run: `npx tsc --noEmit`
Expected: Exit code 0 (zero errors).

**Step 3: Run Next.js production build**
Run: `npm run build`
Expected: Exit code 0, all routes compiled clean.

**Step 4: Update task tracker**
Update `frontend/docs/plans/task.md` with completed tasks.

**Step 5: Commit**
```bash
git add docs/plans/task.md
git commit -m "chore: complete production UI cleanup and RBAC support implementation"
```
