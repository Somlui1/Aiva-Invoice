# Validation Evidence PDF Linking & Summary Card Layout Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement single-active validation selection, category-based highlight colors, cell-level evidence focusing with smooth auto-scroll, and resolve summary card text overlap and height collapse.

**Architecture:** Extend the evidence overlay projector and context state to enforce single-active highlight rendering per validation. Map exception rules to 4 semantic categories with dedicated color palettes. Decouple `.sel` CSS form styles from validation card active states, and make all validation cards in the detail pane interactive with automatic dock opening and smooth centering.

**Tech Stack:** React 19, Next.js 15, TypeScript, CSS (Vanilla), Vitest, React Testing Library.

---

### Task 1: CSS Isolation Fix & Summary Card Layout Auto-Expand

**Files:**
- Modify: `src/styles/components.css:194-205`
- Modify: `src/styles/queue.css:816-842, 902-914`
- Test: `src/test/validationCardLayout.test.tsx`

**Step 1: Write the failing test**
Create `src/test/validationCardLayout.test.tsx` testing that:
1. `.exc` card with active state uses `.is-active` and retains `height: auto` without inheriting `.inp`/`.sel` form height.
2. Long technical descriptions wrap properly in `.ev-text` without overflowing into sibling cards.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/validationCardLayout.test.tsx`
Expected: FAIL (classes or markup not yet updated).

**Step 3: Write minimal implementation**
1. In `src/styles/components.css`: change `.inp, .sel` to `.inp, select.sel`.
2. In `src/styles/queue.css`:
   - Replace `.exc.sel` with `.exc.is-active`.
   - Add `.exc { cursor: pointer; height: auto; min-height: auto; }`.
   - Update `.ev` to `height: auto; align-items: flex-start;` and add `.ev-text { flex: 1; white-space: pre-wrap; word-break: break-word; line-height: 1.5; }` and `.ev-btn { flex-shrink: 0; }`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/validationCardLayout.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/styles/components.css src/styles/queue.css src/test/validationCardLayout.test.tsx
git commit -m "fix(queue): isolate form select css and auto-expand validation cards"
```

---

### Task 2: Validation Category Theme Definitions & Color Palette

**Files:**
- Create: `src/features/pdf-viewer/lib/validationCategories.ts`
- Modify: `src/styles/evidence.css:710-760, 850-880`
- Test: `src/test/validationCategories.test.ts`

**Step 1: Write the failing test**
Create `src/test/validationCategories.test.ts` testing:
1. `getValidationCategory('E01') === 'missing'`
2. `getValidationCategory('E09') === 'mismatch'`
3. `getValidationCategory('E14') === 'calculation'`
4. `getValidationCategory('E11') === 'duplicate'`
5. Theme palette tokens (border, background, glow) for all 4 categories.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/validationCategories.test.ts`
Expected: FAIL (`validationCategories.ts` not found).

**Step 3: Write minimal implementation**
1. Implement `src/features/pdf-viewer/lib/validationCategories.ts` with `ValidationCategory`, `VALIDATION_CATEGORY_THEMES`, and `getValidationCategory`.
2. Add CSS rules in `src/styles/evidence.css` for `.hl.cat-missing`, `.hl.cat-mismatch`, `.hl.cat-calculation`, `.hl.cat-duplicate` with respective borders, tints, and glowing focus states.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/validationCategories.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/features/pdf-viewer/lib/validationCategories.ts src/styles/evidence.css src/test/validationCategories.test.ts
git commit -m "feat(pdf-viewer): add validation category themes and palette classes"
```

---

### Task 3: Single-Active BBox Filtering & Cell Specificity in Projector

**Files:**
- Modify: `src/features/pdf-viewer/lib/overlayModel.ts:64-197, 240-322, 360-400`
- Modify: `src/features/pdf-viewer/components/BoundingBoxOverlay.tsx:30-45, 80-100`
- Test: `src/test/overlayCategoryAndFilter.test.ts`

**Step 1: Write the failing test**
Create `src/test/overlayCategoryAndFilter.test.ts` testing:
1. When `activeRuleId` or `focusRuleId` is provided to `projectOverlayBoxes`, boxes not matching the active validation are filtered out (clearing non-active highlights).
2. Projected boxes include their mapped `category` class.
3. Cell-level OCR elements take precedence over full-table container boxes for line validations.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/overlayCategoryAndFilter.test.ts`
Expected: FAIL (filtering and category property missing on projected boxes).

**Step 3: Write minimal implementation**
1. Update `ProjectOptions` in `overlayModel.ts` to accept `activeRuleId?: string | null` and `activeExceptionCode?: string | null`.
2. Filter `placed` boxes when an active validation is designated so only matching boxes are retained.
3. Attach `category` from `getValidationCategory(b.exceptionCode, b.ruleId)` to `OverlayBox`.
4. In `BoundingBoxOverlay.tsx`, include `box.category ? `cat-${box.category}` : ''` in the CSS class list.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/overlayCategoryAndFilter.test.ts`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/features/pdf-viewer/lib/overlayModel.ts src/features/pdf-viewer/components/BoundingBoxOverlay.tsx src/test/overlayCategoryAndFilter.test.ts
git commit -m "feat(pdf-viewer): enforce single-active bbox filtering and cell-level projection"
```

---

### Task 4: Interactive Validation Card Click & Bi-directional Auto-Scroll Integration

**Files:**
- Modify: `src/components/queue/InvoiceDetailPane.tsx:340-375`
- Modify: `src/components/evidence/EvidenceViewerDock.tsx:220-275`
- Test: `src/test/validationEvidenceLinking.test.tsx`

**Step 1: Write the failing test**
Create `src/test/validationEvidenceLinking.test.tsx` testing:
1. Clicking anywhere on an `.exc` validation card triggers `openEvidenceDock` and sets active selection.
2. Active card displays `.is-active` and category-themed border/shadow.
3. Selecting card B clears card A's active state.
4. Auto-scroll centers the target `.hl.focus` element within the dock viewport.

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/test/validationEvidenceLinking.test.tsx`
Expected: FAIL (card click handler and updated classes not yet bound).

**Step 3: Write minimal implementation**
1. In `InvoiceDetailPane.tsx`:
   - Add `handleSelectValidation(r)` callback.
   - Attach `onClick={() => handleSelectValidation(r)}` to the `.exc` container.
   - Use `.exc.is-active` when `picked` is true.
   - Render `.ev-text` and `.ev-btn` inside `.ev`.
2. In `EvidenceViewerDock.tsx`:
   - Pass `activeRuleId: focusRuleId` to `projectOverlayBoxes`.
   - Maintain reliable smooth scroll centering on `.hl.focus` upon selection changes.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/test/validationEvidenceLinking.test.tsx`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/components/queue/InvoiceDetailPane.tsx src/components/evidence/EvidenceViewerDock.tsx src/test/validationEvidenceLinking.test.tsx
git commit -m "feat(queue): wire card click to evidence dock focus and smooth centering"
```

---

### Task 5: End-to-End Verification & Full Regression Pass

**Files:**
- Verify: Full test suite (`npm test`)
- Verify: TypeScript check (`npx tsc --noEmit`)
- Verify: Production build (`npm run build`)
- Modify: `docs/plans/task.md`

**Step 1: Run complete test suite**
Run: `npm test`
Expected: 100% tests pass (all 20+ test files).

**Step 2: Run TypeScript compiler check**
Run: `npx tsc --noEmit`
Expected: 0 errors, exit 0.

**Step 3: Run Next.js production build**
Run: `npm run build`
Expected: Exit 0, all routes generated cleanly.

**Step 4: Update task tracker**
Mark all tasks as completed in `docs/plans/task.md`.

**Step 5: Final commit**
```bash
git add docs/plans/task.md
git commit -m "docs: complete validation evidence pdf linking and layout implementation"
```
