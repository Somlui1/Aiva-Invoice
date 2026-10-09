# PDF Dock Focus Layout, Production Sidebar & Revalidate Removal Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix the PDF dock right-side overflow/click bug by auto-collapsing sidebar and completely hiding the queue column in focus mode, make the sidebar production-grade by isolating test tools to the IT role, and completely purge the obsolete "revalidate" concept from frontend UI, context, API client, and endpoints.

**Architecture:** 
1. Focus Layout: In `App.tsx`, attach `.nav-auto` to `#shell` when the PDF dock is open; in `toggleNav`, force-close the dock if open. In `QueuePage.tsx` and `queue.css`, set `--qc: 0px` and hide `.q47` when `pdf-open` is active so that Detail (60%) and PDF Dock (40%) fit 100% of the viewport without overflow.
2. Sidebar: In `Sidebar.tsx`, dynamically render navigation sections based on `currentUser.role` — regular business users (`EU`, `ACC`, `APR`) only see production menus, while IT/Dev tools (`cases`, `std`, `sim`) are isolated to `ADM`.
3. Revalidate Purge: Remove the "Revalidate Engine" button from `InvoiceDetailPane.tsx`, remove `revalidateDocWithBackend` from `InvoiceContext.tsx`, remove `revalidateInvoice` from `backendApi.ts`, and delete `/api/validations/[id]/revalidate`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, React Testing Library, Vanilla CSS.

---

### Task 1: PDF Dock Focus Layout & Auto-Collapse (`focus-task-1`)

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/queue/QueuePage.tsx`
- Modify: `frontend/src/styles/queue.css`
- Test: `frontend/src/test/dockFocus.test.tsx`

**Step 1: Write the failing test**
Create `frontend/src/test/dockFocus.test.tsx` verifying:
1. When PDF dock is open (`isEvidenceDockOpen = true`), `#shell` carries class `nav-auto`.
2. When PDF dock is open, `#work` carries class `pdf-open`, style `--qc` is `0px`, and `.q47` is hidden.
3. Clicking the 3-line hamburger button (`Topbar` toggle) while the dock is open closes the PDF dock.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/dockFocus.test.tsx`
Expected: FAIL (shell missing `nav-auto`, `--qc` not `0px`, toggle does not close dock).

**Step 3: Implement minimal code**
- In `frontend/src/App.tsx`:
  - Add `isEvidenceDockOpen && selectedDoc ? 'nav-auto' : ''` to `#shell` className.
  - In `toggleNav`: call `if (isEvidenceDockOpen) closeEvidenceDock()`.
- In `frontend/src/components/queue/QueuePage.tsx`:
  - Set `'--rc': '0px'` and `'--qc': dockVisible ? '0px' : 'var(--q-w)'`.
- In `frontend/src/styles/queue.css`:
  - Add `.work.pdf-open .q47 { display: none; }` and ensure `.work.pdf-open` resets `--qc: 0px`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/dockFocus.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/App.tsx src/components/queue/QueuePage.tsx src/styles/queue.css src/test/dockFocus.test.tsx
git commit -m "feat(dock): auto-collapse sidebar, hide queue list in focus mode, and close dock on hamburger toggle"
```

---

### Task 2: Production Sidebar & IT-Only Test Tools (`focus-task-2`)

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Test: `frontend/src/test/sidebarRole.test.tsx`

**Step 1: Write the failing test**
Create `frontend/src/test/sidebarRole.test.tsx` verifying:
1. When logged in as `EU`, `ACC`, or `APR`, `Sidebar` renders "งานหลัก" and "การกำกับดูแล", but does NOT render `cases` ("ชุดเอกสารทดสอบ"), `std` ("มาตรฐาน Payload"), or `sim` ("Document Simulation").
2. When logged in as `ADM`, `Sidebar` renders "เครื่องมือทดสอบและพัฒนา" containing `cases`, `std`, and `sim`.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/sidebarRole.test.tsx`
Expected: FAIL (test tools currently rendered for all roles).

**Step 3: Implement minimal code**
- In `frontend/src/components/layout/Sidebar.tsx`:
  - Branch `sections`:
    - For `currentUser.role === 'ADM'`:
      - "การกำกับดูแล" (`rbac`, `audit`, `settings`)
      - "เครื่องมือทดสอบและพัฒนา" (`cases`, `std`, `sim`)
    - For other roles (`EU`, `ACC`, `APR`):
      - "งานหลัก" (`queue`, and `ap` if `can('VIEW_AP')`)
      - "การกำกับดูแล" (`rbac`, and `audit` if `can('AUDIT')`, `settings`)

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/sidebarRole.test.tsx`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/layout/Sidebar.tsx src/test/sidebarRole.test.tsx
git commit -m "feat(sidebar): isolate test and simulation tools to IT role and streamline production menus"
```

---

### Task 3: Complete Purge of "Revalidate" Menu & Source Code (`focus-task-3`)

**Files:**
- Modify: `frontend/src/components/queue/InvoiceDetailPane.tsx`
- Modify: `frontend/src/context/InvoiceContext.tsx`
- Modify: `frontend/src/lib/backendApi.ts`
- Modify: `frontend/src/test/backend-api.test.ts`
- Delete: `frontend/src/app/api/validations/[id]/revalidate/route.ts`

**Step 1: Remove UI and code references**
- In `frontend/src/components/queue/InvoiceDetailPane.tsx`:
  - Remove button `<button ... onClick={() => revalidateDocWithBackend(doc.doc)}> ... Revalidate Engine</button>`.
  - Remove `revalidateDocWithBackend` from `useInvoices()`.
- In `frontend/src/context/InvoiceContext.tsx`:
  - Remove `revalidateDocWithBackend` from interface `InvoiceContextType`, implementation callback, and provider value.
  - Remove `revalidateInvoice` import.
- In `frontend/src/lib/backendApi.ts`:
  - Remove `revalidateInvoice` function export.
- In `frontend/src/test/backend-api.test.ts`:
  - Remove the test case testing `revalidateInvoice`.
- Delete file:
  - `frontend/src/app/api/validations/[id]/revalidate/route.ts`

**Step 2: Run test suite & TypeScript check**
Run: `npx vitest run src/test/backend-api.test.ts`
Run: `npx tsc --noEmit`
Expected: Clean exit 0, no references to revalidate.

**Step 3: Commit**
```bash
git rm src/app/api/validations/[id]/revalidate/route.ts
git add src/components/queue/InvoiceDetailPane.tsx src/context/InvoiceContext.tsx src/lib/backendApi.ts src/test/backend-api.test.ts
git commit -m "refactor: completely remove revalidate engine button, context methods, and api endpoint"
```

---

### Task 4: Full Verification & E2E Validation Pass (`focus-task-4`)

**Files:**
- Modify: `frontend/docs/plans/task.md`

**Step 1: Run complete test suite**
Run: `npm test`
Expected: 100% tests pass (exit 0).

**Step 2: Run TypeScript typecheck**
Run: `npx tsc --noEmit`
Expected: 0 errors (exit 0).

**Step 3: Run production build**
Run: `npm run build`
Expected: Compiled successfully, all static & dynamic pages generated (exit 0).

**Step 4: Update task tracker**
Update `frontend/docs/plans/task.md` with tasks `focus-task-1` through `focus-task-4`.

**Step 5: Commit**
```bash
git add docs/plans/task.md
git commit -m "docs: complete PDF dock focus layout, sidebar cleanup, and revalidate removal verification"
```
