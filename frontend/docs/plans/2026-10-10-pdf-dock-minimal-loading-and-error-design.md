# Design Document: PDF Dock Minimal Loading & Error UI (Simple to the Base)

**Author:** Antigravity  
**Date:** 2026-10-10  
**Status:** Approved  
**Related Documents:**  
- `frontend/docs/plans/2026-10-09-pdf-dock-layout-and-loading-state-design.md`  
- `frontend/docs/plans/2026-10-09-pdf-dock-focus-sidebar-cleanup-design.md`  

---

## 1. Problem Statement & Motivation

The current PDF Evidence Dock in the AIVA Web Portal has two visual and UX shortcomings:
1. **Cluttered Loading State:** Currently renders a heavy centered card backdrop (`.evd-loading-center`) with textual descriptions ("กำลังดาวน์โหลดและเรนเดอร์เอกสาร PDF จาก DMS…") layered over a simulated mock invoice canvas. Furthermore, the toolbar button is disabled while loading, preventing users from cancelling slow or accidental PDF requests.
2. **Ambiguous Error / Fallback State:** When a PDF cannot be retrieved from DMS, the dock quietly falls back to rendering a simulated invoice with a small warning label ("แสดงเอกสารจำลอง — ..."), which confuses business users into believing they are looking at a degraded or corrupted scan rather than understanding that the document was missing or inaccessible.

The user requested a refined, elegant, and minimal experience adhering to the design principle of **"Simple to the base"**:
- **During Loading:** A single centered spinning arrow (`spin lg`), no cards, steps, or text clutter, clean neutral surface (no distracting mock canvas). A subtle browser-like top progress bar in teal (8% -> 94% trickle, 100% on success with fade out). The PDF button remains interactive so clicking it cancels the load and closes the dock immediately.
- **On Failure:** Top bar flashes red to 100% and fades out. Center displays a clear minimal error presentation: red exclamation circle badge `!`, main title `"โหลดเอกสารไม่สำเร็จ"`, 1-line plain language cause, small reference code (e.g. `DMS-404 · REF-B1FQC0`), and contextual action buttons (`[ลองอีกครั้ง]` + `[ปิด]`, or `[ปิด]` only if non-retryable such as 404 file not found).

---

## 2. Visual & Interaction Specifications

### 2.1 Loading State (ตอนรอโหลด)
- **Dock Center:**
  - Neutral clean canvas background (`#f8fafc` / transparent workspace).
  - Exactly one spinning indicator: `<span className="spin lg" aria-label="กำลังโหลดเอกสาร" />`.
  - Zero cards, zero background boxes, zero step lists, zero text.
- **Top Edge Progress Bar (`PdfTopProgressBar`):**
  - Position: `position: absolute; top: 0; left: 0; right: 0; height: 2.5px; z-index: 50`.
  - Color: Teal (`#0d9488` with subtle box-shadow glow `0 0 8px rgba(13, 148, 136, 0.6)`).
  - Behavior:
    - Mounts on loading start at `~8%`.
    - Automatically trickles upward with decaying step increments: 8% -> 25% -> 45% -> 70% -> 85% -> capped strictly at `94%`.
    - When `state === 'ready'`: accelerates smoothly to `100%` within 200ms, then fades out (`opacity: 0`) over 300ms before unmounting.
    - If cancelled or dock is closed: immediately aborts, stops interval, and clears.
- **PDF Action Button (`InvoiceDetailPane`):**
  - When `isPdfLoading` is true:
    - Button displays spinning icon: `<span className="spin" /> กำลังโหลด…`.
    - **Clickable (not disabled)**: Clicking the button triggers `closeEvidenceDock()`, immediately aborting the flight and closing the dock.
    - Title tooltip: `"ยกเลิกการโหลด (P / Esc)"`.

### 2.2 Failure / Error State (ตอนล้มเหลว)
- **Top Edge Progress Bar:**
  - Transitions to error color: Crimson/Red (`#ef4444` with glow `0 0 8px rgba(239, 68, 68, 0.6)`).
  - Snaps to `100%` and fades out (`opacity: 0`) over 400ms.
- **Dock Center Minimal Error View (`PdfErrorView`):**
  - Center-aligned layout, clean and modern spacing:
    1. **Icon**: 44px circular badge with light red tint background (`#fee2e2`), border (`#fecaca`), and deep red exclamation icon (`#dc2626`).
    2. **Headline**: `"โหลดเอกสารไม่สำเร็จ"` (16px, font-weight 600, color `#0f172a`).
    3. **Cause (1 line)**:
       - 404 / Missing: `"ไม่พบไฟล์เอกสารในระบบจัดเก็บเอกสาร (DMS)"`
       - 401 / 403: `"ไม่มีสิทธิ์เข้าถึงเอกสารนี้ในระบบ DMS"`
       - 500 / 502 / 504 / Network: `"การเชื่อมต่อเซิร์ฟเวอร์ DMS ขัดข้อง หรือหมดเวลาการเชื่อมต่อ"`
    4. **Reference Code**: Monospace, 12px, muted `#64748b`:  
       e.g. `DMS-404 · REF-B1FQC0` (or `DMS-500 · REF-9A4E21`).  
       Calculated from status/http code and a stable deterministic reference hash from document ID.
    5. **Action Buttons**:
       - **Retryable Errors** (e.g. 500, Network Timeout, Fetch Failures):
         - Primary button: `[ลองอีกครั้ง]` (Triggers `reload()`, resetting progress bar and retrying).
         - Secondary button: `[ปิด]` (Triggers `closeEvidenceDock()`).
       - **Non-retryable Errors** (e.g. 404 File Not Found, 400 Bad Request):
         - Only `[ปิด]` button is displayed.

---

## 3. Technical Architecture & File Layout

### 3.1 New & Modified Components

1. **`src/features/pdf-viewer/types.ts`:**
   - Extend `PdfViewerState` to include explicit error metadata:
     ```ts
     export type PdfViewerState = 'loading' | 'ready' | 'error' | 'fallback'

     export interface PdfViewerError {
       code: string          // e.g. 'DMS-404', 'DMS-500', 'DMS-NET'
       ref: string           // e.g. 'REF-B1FQC0'
       message: string       // Plain Thai 1-line reason
       retryable: boolean    // false for 404/not found, true for 500/timeout
     }

     export interface PdfViewerStatus {
       state: PdfViewerState
       mode: PdfViewMode
       source?: PdfProxySource
       reason?: string
       pageCount: number
       error?: PdfViewerError
     }
     ```

2. **`src/features/pdf-viewer/components/PdfTopProgressBar.tsx`:**
   - Standalone browser-style progress bar component.
   - Props: `state: 'idle' | 'loading' | 'ready' | 'error'`, `onFinished?: () => void`.
   - Internal state: smooth percentage timer (trickles up to 94% on loading, snaps to 100% on ready/error, then fades out).

3. **`src/features/pdf-viewer/components/PdfErrorView.tsx`:**
   - Dedicated minimal error presentation component.
   - Props:
     ```ts
     interface PdfErrorViewProps {
       error: PdfViewerError
       onRetry?: () => void
       onClose: () => void
     }
     ```

4. **`src/features/pdf-viewer/components/PdfCanvasViewer.tsx`:**
   - Remove the old `.evd-loading-center` card and note text.
   - In `'loading'` state: render only `<span className="spin lg" aria-label="กำลังโหลดเอกสาร" />` centered in the container, with `PdfTopProgressBar` at the top edge. Do not mount the mock placeholder behind it.
   - In `'error'` state: render `PdfErrorView` centered, with `PdfTopProgressBar` in red.
   - In `'ready'` state: render `<canvas>` and `<BoundingBoxOverlay>` with 100% complete progress bar fading out.

5. **`src/features/pdf-viewer/hooks/usePdfViewer.ts`:**
   - Detect HTTP status from `/api/documents/[id]/pdf`:
     - If response is 404: create `PdfViewerError` with `code: 'DMS-404'`, `retryable: false`, `message: 'ไม่พบไฟล์เอกสารในระบบจัดเก็บเอกสาร (DMS)'`.
     - If response is 401/403: create `PdfViewerError` with `code: 'DMS-403'`, `retryable: false`, `message: 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้ในระบบ DMS'`.
     - If response is 5xx or fetch threw an exception: create `PdfViewerError` with `code: 'DMS-500'`, `retryable: true`, `message: 'การเชื่อมต่อเซิร์ฟเวอร์ DMS ขัดข้อง หรือหมดเวลา'`.
   - Generate short reference code: e.g. `REF-${hash(docId)}`.
   - Update `status.state` to `'error'`.

6. **`src/components/queue/InvoiceDetailPane.tsx`:**
   - Update PDF button:
     - Remove `disabled={... || isPdfLoading}` so the button remains active during load.
     - When `isPdfLoading` is active, clicking calls `closeEvidenceDock()` to abort and close the dock.

7. **`src/styles/components.css`:**
   - Add styling for `.pdf-top-progress` (teal gradient / red, glow effect, smooth width transitions).
   - Add styling for `.evd-error-mat`, `.evd-error-icon`, `.evd-error-title`, `.evd-error-desc`, `.evd-error-code`, and `.evd-error-actions`.
   - Add styling for `.evd-loading-minimal` (clean centering, single spinner, zero borders or backgrounds).

---

## 4. Test Strategy (Strict TDD)

Create `src/test/dockLoadingError.test.tsx` containing tests:
1. **Loading State Test:**
   - When loading, renders `PdfTopProgressBar` in teal and `<span class="spin lg">` centered.
   - Does NOT render any text like "กำลังดาวน์โหลด", no cards, no step lists.
2. **Cancel Loading Test:**
   - PDF button in `InvoiceDetailPane` is NOT disabled while `isPdfLoading`.
   - Clicking the button while `isPdfLoading` calls `closeEvidenceDock()`.
3. **Error State (Retryable) Test:**
   - On 500 / Network Error: renders red progress bar, "โหลดเอกสารไม่สำเร็จ", cause line, code `DMS-500 · REF-...`, and BOTH `[ลองอีกครั้ง]` and `[ปิด]` buttons.
   - Clicking `[ลองอีกครั้ง]` invokes `reload()`.
4. **Error State (Non-Retryable 404) Test:**
   - On 404 Not Found: renders "โหลดเอกสารไม่สำเร็จ", cause line "ไม่พบไฟล์เอกสารในระบบจัดเก็บเอกสาร (DMS)", code `DMS-404 · REF-...`, and ONLY `[ปิด]` button (no retry button).
   - Clicking `[ปิด]` calls `closeEvidenceDock()`.
