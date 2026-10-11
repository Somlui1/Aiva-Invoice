# Validation Evidence PDF Linking & Summary Card Layout Design

**Date:** 2026-10-11  
**Status:** Approved  
**Project:** AIVA Invoice Portal (`frontend`)

---

## 1. Problem Statement & Motivation

During review of the invoice processing interface by accounting users, several UX and visual integration issues were identified in the validation and evidence viewer:

1. **Weak Validation-to-PDF Connection**: Clicking on a validation card does not immediately open, focus, or navigate the PDF viewer to the relevant evidence. Users had to locate and click a small link button ("ดูหลักฐานหน้า X").
2. **Coarse Bounding Boxes (Whole-Table Highlights)**: Line-level validations (e.g., `V-02`, `V-07`, `V-08`) highlight the entire lines table rather than pointing specifically to the problematic row cell or target field.
3. **Cluttered Multi-BBox Overlap**: All validation bounding boxes are rendered simultaneously on the PDF canvas, causing visual overlap and confusion when multiple rules flag items in the same page region.
4. **No Single Active State**: Multiple highlights remain active concurrently instead of clearing previous highlights when a user investigates a different validation.
5. **Card Text Collision & Layout Collapse**: In the summary tab ("ข้อยกเว้นจาก AIVA"), selecting a card causes severe visual text overlap into adjacent cards.
   - **Root Cause Identified**: In `src/styles/components.css`, `.inp, .sel { height: var(--ctl-h-sm); }` applies a fixed input height (~30px) to any element with class `.sel`. When a validation card is selected (`className="exc ... sel"`), its height collapses, causing its content to overflow and collide into the card below it.

---

## 2. Solution Overview

A unified solution encompassing five core pillars:
1. **Interactive Validation Cards**: Make the entire validation card clickable. Selecting any card triggers PDF dock opening (if closed), navigates to the evidence page, and smooth-scrolls to center the evidence BBox.
2. **Cell & Field-Level Specificity**: Prioritize specific cell/field BBoxes (`element_type === 'cell'` or specific `field_name`) over coarse container or whole-table boxes.
3. **Category-Based Color System**: Replace generic severity colors with 4 distinct category themes (Missing, Mismatch, Calculation, Duplicate) applied consistently to both card badges and PDF BBox overlays.
4. **Single Active Highlight Enforcement**: At any point in time, only the active validation's BBox is rendered and highlighted on the PDF surface; all other BBoxes are cleared to eliminate visual clutter.
5. **Summary Card Layout Isolation & Auto-Expand**: Fix the CSS conflict in `components.css` (`select.sel`), transition active card styling to `.exc.is-active`, and provide clean, auto-expanding layout for error descriptions with proper text wrapping and button placement.

---

## 3. Detailed Specifications

### 3.1 Validation Categories & Color Palette

Exceptions are mapped into 4 distinct functional categories:

| Category | Exception Codes / Rules | Border & Outline | Background Tint | Tag Pill (Light) |
|---|---|---|---|---|
| **missing** | `E01`, `E05`, `E08`, `V-01`, `V-04`, `V-06` | `#D97706` (Amber-600) | `rgba(217, 119, 6, 0.15)` | `#FEF3C7` / `#92400E` |
| **mismatch** | `E07`, `E09`, `E10`, `E12`, `E13`, `V-05`, `V-07` | `#DC2626` (Red-600) | `rgba(220, 38, 38, 0.15)` | `#FEE2E2` / `#991B1B` |
| **calculation** | `E02`, `E03`, `E04`, `E14`, `E15`, `V-02`, `V-03`, `V-08`, `V-09` | `#0284C7` (Sky-600) | `rgba(2, 132, 199, 0.15)` | `#E0F2FE` / `#075985` |
| **duplicate** | `E11`, Status `Duplicate` | `#7C3AED` (Purple-600) | `rgba(124, 58, 237, 0.15)` | `#EDE9FE` / `#5B21B6` |

Helper utility in `src/features/pdf-viewer/lib/validationCategories.ts`:
```typescript
export type ValidationCategory = 'missing' | 'mismatch' | 'calculation' | 'duplicate'

export function getValidationCategory(code?: string | null, ruleId?: string | null): ValidationCategory {
  if (code === 'E11' || ruleId === 'duplicate') return 'duplicate'
  if (['E01', 'E05', 'E08'].includes(code || '') || ['V-01', 'V-04', 'V-06'].includes(ruleId || '')) return 'missing'
  if (['E02', 'E03', 'E04', 'E14', 'E15'].includes(code || '') || ['V-02', 'V-03', 'V-08', 'V-09'].includes(ruleId || '')) return 'calculation'
  if (['E07', 'E09', 'E10', 'E12', 'E13'].includes(code || '') || ['V-05', 'V-07'].includes(ruleId || '')) return 'mismatch'
  return 'mismatch' // default
}
```

### 3.2 Single Active Selection & Bi-directional Navigation

1. **State Flow**:
   - `InvoiceContext` maintains `activeValidationKey: { ruleId: string; exceptionCode?: string; pageNo: number; nonce: number } | null`.
   - Clicking a card in `InvoiceDetailPane` invokes `selectValidation(r)`.
   - `selectValidation` performs:
     ```typescript
     setViewMode('split')
     setIsEvidenceDockOpen(true)
     setEvidenceDockFocus({ page: r.page || 1, ruleId: r.rule || r.id, nonce: Date.now() })
     setEvidenceSelection({
       ruleId: r.rule || r.id,
       exceptionCode: r.exception_code,
       lineNo: r.lineNo,
       surface: 'pdf',
     })
     ```
2. **Single Active BBox Filtering in `projectOverlayBoxes`**:
   - When `activeRuleId` or `focusRuleId` is present:
     Filter boxes strictly so that only boxes matching the active rule/exception are projected into the overlay DOM.
     Previous boxes are unmounted, ensuring only 1 active validation is visible on the PDF.
3. **Smooth Scroll & Focus Animation**:
   - `EvidenceViewerDock` listens to `evidenceDockFocus` changes.
   - When the page is rendered, locate `container.querySelector('.hl.focus, .hl[data-rule="..."]')` and execute:
     `el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })`
   - `.hl.focus` receives an active pulse glow animation based on its category theme.

### 3.3 BBox Specificity (Cell vs Table Region)

1. In `viewerBoxesFromInvoiceDoc`:
   - Prioritize OCR elements with `element_type === 'cell'` or matching specific line fields over general page/table boxes.
   - When drawing evidence for line-item errors, tie the BBox directly to the cell coordinates (e.g. quantity, price, or amount cell) rather than the parent table bounding box.
2. In `mockEvidenceViewerBBoxes`:
   - When `mockLineNumbersForRule` flags lines (e.g., `line1`, `line3`), generate boxes targeting the specific row `line{n}` or cell regions. Drop fallback to `lines` (entire table) if specific lines can be determined.

### 3.4 Summary Card Layout & CSS Isolation

1. In `src/styles/components.css`:
   - Change:
     ```css
     /* BEFORE: Collapses any .sel element */
     .inp, .sel {
       height: var(--ctl-h-sm);
     }
     
     /* AFTER: Restrict to select elements only */
     .inp, select.sel {
       height: var(--ctl-h-sm);
     }
     ```
2. In `src/styles/queue.css`:
   - Replace `.exc.sel` with `.exc.is-active`:
     ```css
     .exc {
       cursor: pointer;
       transition: border-color .15s ease, box-shadow .15s ease, transform .1s ease;
       height: auto;
       min-height: auto;
     }
     .exc:hover {
       border-color: var(--line-strong);
     }
     .exc.is-active {
       border-color: var(--active-theme-border, #F59E0B);
       box-shadow: 0 0 0 2px var(--active-theme-glow, rgba(245, 158, 11, .35)), var(--e-1);
       transform: translateY(-1px);
     }
     .ev {
       margin-top: 8px;
       display: flex;
       align-items: flex-start;
       justify-content: space-between;
       gap: 12px;
       padding: 8px 10px;
       background: var(--sunken);
       border: 1px solid var(--line);
       border-radius: var(--r-sm);
       font-size: 12.5px;
       height: auto;
       min-height: auto;
     }
     .ev-text {
       flex: 1;
       white-space: pre-wrap;
       word-break: break-word;
       line-height: 1.5;
       color: var(--s-800);
     }
     .ev-btn {
       flex-shrink: 0;
     }
     ```

---

## 4. Verification & Testing Plan

1. **Unit & Component Tests**:
   - `categoryTheme.test.ts`: Test that all exception codes and rule IDs map to expected categories and theme colors.
   - `overlayModel.test.ts`: Test that passing an active rule/exception filters out unrelated boxes and retains only the target BBox(es).
   - `invoiceDetailPane.test.tsx`: Test that clicking anywhere on an `.exc` card calls `openEvidenceDock` with target page and rule ID, and sets `.exc.is-active`.
   - `cssIsolation.test.ts`: Verify that selecting an `.exc` card does not apply `height: var(--ctl-h-sm)` or collapse card height.
2. **Regression & Full Test Suite**:
   - Run `npm test` across all 20+ test files to confirm 100% green status.
   - Run `npx tsc --noEmit` to ensure TypeScript clean compilation.
   - Run `npm run build` to verify production Next.js build.
