# Minimal PDF Loading & Error UI Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a minimal, high-aesthetic ("Simple to the base") PDF dock loading and error experience featuring a thin browser-style top progress bar, a clean single-spinner loading state, an interactive cancelable PDF button, and a modern minimal error presentation.

**Architecture:** 
- A lightweight `PdfTopProgressBar` component tracks loading/success/error progress states with smooth trickle animation and fade out.
- `InvoiceDetailPane` un-disables the PDF button during load, routing clicks to `closeEvidenceDock()` for cancellation.
- `PdfCanvasViewer` replaces the old card/text loading mat with a pure centered spinner on a clean backdrop.
- `usePdfViewer` classifies fetch failures into `PdfViewerError` (404 not found vs 500/timeout retryable), generating deterministic reference codes.
- `PdfErrorView` renders a clean red exclamation badge, title, 1-line reason, reference code, and dynamic buttons (`[ลองอีกครั้ง]` + `[ปิด]` or `[ปิด]` only).

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Next.js 15, Vanilla CSS.

---

### Task 1: Top Progress Bar & Cancelable PDF Button (`dock-ui-task-1`)

**Files:**
- Create: `frontend/src/features/pdf-viewer/components/PdfTopProgressBar.tsx`
- Modify: `frontend/src/components/queue/InvoiceDetailPane.tsx`
- Modify: `frontend/src/styles/components.css`
- Test: `frontend/src/test/dockLoadingError.test.tsx`

**Step 1: Write failing tests for Progress Bar & Cancel Button**
- Test that `PdfTopProgressBar` renders with progress percentage and teal color on loading.
- Test that the PDF button in `InvoiceDetailPane` is clickable when `isPdfLoading` is true, displaying "กำลังโหลด…", and clicking it triggers `closeEvidenceDock()`.

**Step 2: Run test to verify it fails (RED)**
```bash
npx vitest run src/test/dockLoadingError.test.tsx
```

**Step 3: Implement minimal code**
- Implement `PdfTopProgressBar.tsx` with smooth trickle animation (8% -> 94% decay, 100% on ready/error, fade out).
- Update `InvoiceDetailPane.tsx` to remove `disabled={... || isPdfLoading}` and call `closeEvidenceDock()` when clicked while `isPdfLoading`.
- Add `.pdf-top-progress` styling to `components.css`.

**Step 4: Run test to verify it passes (GREEN)**
```bash
npx vitest run src/test/dockLoadingError.test.tsx
```

**Step 5: Commit**
```bash
git add src/features/pdf-viewer/components/PdfTopProgressBar.tsx src/components/queue/InvoiceDetailPane.tsx src/styles/components.css src/test/dockLoadingError.test.tsx docs/plans/task.md
git commit -m "feat(dock): add browser-style top progress bar and cancelable pdf button"
```

---

### Task 2: Clean Centered Loading State in `PdfCanvasViewer` (`dock-ui-task-2`)

**Files:**
- Modify: `frontend/src/features/pdf-viewer/components/PdfCanvasViewer.tsx`
- Modify: `frontend/src/styles/components.css`
- Test: `frontend/src/test/dockLoadingError.test.tsx`

**Step 1: Write failing test for Minimal Loading State**
- Test that when `status.state === 'loading'`, only `<span class="spin lg">` is rendered.
- Verify that no textual description ("กำลังดาวน์โหลดและเรนเดอร์เอกสาร PDF จาก DMS…"), no card containers, and no mock canvas elements are rendered.
- Verify that `PdfTopProgressBar` is mounted at the top edge.

**Step 2: Run test to verify it fails (RED)**
```bash
npx vitest run src/test/dockLoadingError.test.tsx
```

**Step 3: Implement minimal code**
- In `PdfCanvasViewer.tsx`, update loading branch: mount `PdfTopProgressBar` and center `<span className="spin lg" aria-label="กำลังโหลดเอกสาร" />` in `.evd-loading-minimal`.
- Do not render placeholder or note cards during loading.
- Add `.evd-loading-minimal` styles in `components.css`.

**Step 4: Run test to verify it passes (GREEN)**
```bash
npx vitest run src/test/dockLoadingError.test.tsx
```

**Step 5: Commit**
```bash
git add src/features/pdf-viewer/components/PdfCanvasViewer.tsx src/styles/components.css src/test/dockLoadingError.test.tsx docs/plans/task.md
git commit -m "feat(dock): simplify loading state to pure centered spinner with clean surface"
```

---

### Task 3: Minimal Error View & Error Classification (`dock-ui-task-3`)

**Files:**
- Modify: `frontend/src/features/pdf-viewer/types.ts`
- Create: `frontend/src/features/pdf-viewer/components/PdfErrorView.tsx`
- Modify: `frontend/src/features/pdf-viewer/hooks/usePdfViewer.ts`
- Modify: `frontend/src/features/pdf-viewer/components/PdfCanvasViewer.tsx`
- Modify: `frontend/src/styles/components.css`
- Test: `frontend/src/test/dockLoadingError.test.tsx`

**Step 1: Write failing tests for Error States**
- Test 500/Network error: renders red progress bar, red exclamation circle, `"โหลดเอกสารไม่สำเร็จ"`, error cause line, `DMS-500 · REF-...`, and BOTH `[ลองอีกครั้ง]` and `[ปิด]` buttons. Clicking `[ลองอีกครั้ง]` calls `onRetry()`.
- Test 404 error: renders red exclamation circle, `"โหลดเอกสารไม่สำเร็จ"`, `"ไม่พบไฟล์เอกสารในระบบจัดเก็บเอกสาร (DMS)"`, `DMS-404 · REF-...`, and ONLY `[ปิด]` button. Clicking `[ปิด]` calls `closeEvidenceDock()`.

**Step 2: Run test to verify it fails (RED)**
```bash
npx vitest run src/test/dockLoadingError.test.tsx
```

**Step 3: Implement minimal code**
- In `types.ts`: Add `PdfViewerError` interface (`code`, `ref`, `message`, `retryable`), add `'error'` to `PdfViewerState`.
- Create `PdfErrorView.tsx` with red badge, title, cause, reference code, and dynamic buttons.
- In `usePdfViewer.ts`: catch fetch failures, parse HTTP status (404 vs 500), compute short hash `REF-${hash}`, set `status.state = 'error'` and `status.error`.
- In `PdfCanvasViewer.tsx`: render `PdfTopProgressBar` with `state="error"` and `PdfErrorView`.
- In `components.css`: style `.evd-error-mat`, `.evd-error-icon`, `.evd-error-title`, `.evd-error-desc`, `.evd-error-code`, and `.evd-error-actions`.

**Step 4: Run test to verify it passes (GREEN)**
```bash
npx vitest run src/test/dockLoadingError.test.tsx
```

**Step 5: Commit**
```bash
git add src/features/pdf-viewer/types.ts src/features/pdf-viewer/components/PdfErrorView.tsx src/features/pdf-viewer/hooks/usePdfViewer.ts src/features/pdf-viewer/components/PdfCanvasViewer.tsx src/styles/components.css src/test/dockLoadingError.test.tsx docs/plans/task.md
git commit -m "feat(dock): add minimal error state with ref code and non-retryable 404 handling"
```

---

### Task 4: Full Verification & E2E Validation Pass (`dock-ui-task-4`)

**Files:**
- Modify: `frontend/docs/plans/task.md`

**Step 1: Run full Vitest suite**
```bash
npm test
```
Expected: 18/18 test files pass (100% GREEN).

**Step 2: Run TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors (clean exit 0).

**Step 3: Run production build**
```bash
npm run build
```
Expected: Next.js production build succeeds, 17/17 pages generated.

**Step 4: Update task tracker & Commit**
```bash
git add docs/plans/task.md
git commit -m "docs: complete minimal loading and error UI verification"
```
