# Design Document: PDF Dock Layout Grid Visibility and Loading Indicator

## 1. Context & Motivation

In AIVA Web Portal v4.18, when an operator clicks the **"เปิดเอกสาร PDF (P)"** button in the Invoice Detail Pane or clicks an exception evidence link (e.g. `V-07 · E10` "ดูหลักฐานหน้า 1"), the PDF Evidence Dock should appear on the right side of the workspace in a 60:40 Split View (60% Detail : 40% PDF Viewer).

### Current Problem
1. **Dock not visible despite active button state:**
   In [InvoiceDetailPane.tsx](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/components/queue/InvoiceDetailPane.tsx#L143), the button correctly toggles `isEvidenceDockOpen` to `true` and switches its styling to the red `.btn-close-pdf` ("ปิด PDF [P]"). However, the parent grid element `<div className="work" id="work">` in [QueuePage.tsx](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/components/queue/QueuePage.tsx#L66) does not apply the `.pdf-open` class, and does not set the CSS variables `--mc` and `--dc`.
   In [queue.css](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/styles/queue.css#L1318-L1324):
   ```css
   grid-template-columns: var(--rc) minmax(0, var(--qc)) minmax(0, var(--mc, 100fr)) minmax(0, var(--dc, 0fr));
   ```
   Because `--dc` defaults to `0fr` and `--mc` defaults to `100fr`, Column 4 (the `<EvidenceViewerDock>`) has a width of `0fr` (0 pixels). The dock is squished down to zero width, completely invisible to the user.
2. **Missing loading indicator during PDF streaming:**
   Fetching the PDF from DMS (`/api/documents/[id]/pdf`) and rendering the page via PDF.js takes between 200ms and 1500ms depending on file size and network latency. Currently, the button and the dock body lack a prominent loading spinner, giving the impression that the button click failed or that the system is frozen.

---

## 2. Requirements & Goals

1. **Grid Visibility & Proportion:**
   - When `isEvidenceDockOpen` is `true`:
     - Container `.work` receives class `pdf-open`.
     - Container `.work` sets `--mc` to `(1 - splitRatio) * 100 + 'fr'` (default 60.0fr) and `--dc` to `splitRatio * 100 + 'fr'` (default 40.0fr).
     - Column 4 expands smoothly with transition into view.
   - When `isEvidenceDockOpen` is `false`:
     - Container `.work` removes class `pdf-open`.
     - Container `.work` sets `--mc` to `100fr` and `--dc` to `0fr`.
2. **Draggable Splitter (`.dock-rz`):**
   - Provide a draggable divider on the left edge of the dock (`.dock-rz`) allowing the user to adjust the split ratio between 30% and 50% (default 40%).
   - Double-clicking `.dock-rz` resets the split ratio back to the 60:40 default (ratio 0.40).
3. **Loading Feedback (Dual Indicator):**
   - **On the Toolbar Button:**
     - While the PDF is in flight / rendering, the button displays a spinning spinner icon `<span className="spin" aria-hidden="true" />` and label `กำลังโหลด PDF…`.
   - **In the Dock Body:**
     - The dark canvas mat displays a centered loading card with a spinning loader and Thai text:
       *"กำลังดาวน์โหลดและเรนเดอร์เอกสาร PDF จาก DMS…"*.
4. **Bounding Box Preservation:**
   - Once loading completes (`status.state === 'ready'`), the bounding box overlays (`.hl.Medium`, `.hl.High`, tag badge `<span className="tag">E10</span>`) immediately appear accurately on the rendered canvas without any coordinate drift.

---

## 3. Architecture & State Management

```
┌────────────────────────────────────────────────────────────────────────┐
│ InvoiceContext                                                         │
│   • isEvidenceDockOpen: boolean                                        │
│   • dockSplitRatio: number (default: 0.40)                             │
│   • isPdfLoading: boolean (derived from dock status or loading hook)   │
│   • setDockSplitRatio(ratio: number)                                   │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
                    ▼                               ▼
       ┌────────────────────────┐      ┌─────────────────────────┐
       │ QueuePage              │      │ InvoiceDetailPane       │
       │ .work.pdf-open         │      │ Button:                 │
       │ style:                 │      │  If loading:            │
       │   --mc: 60.0fr         │      │    [Spin] กำลังโหลด...  │
       │   --dc: 40.0fr         │      │  If open:               │
       └───────────┬────────────┘      │    [X] ปิด PDF [P]      │
                   │                   │  If closed:             │
                   ▼                   │    [File] เปิด PDF [P]  │
       ┌────────────────────────┐      └─────────────────────────┘
       │ EvidenceViewerDock     │
       │   • .dock-rz splitter  │
       │   • DockControls       │
       │   • PdfCanvasViewer    │
       │       - Loading state  │
       │       - Canvas canvas  │
       │       - BBox overlay   │
       └────────────────────────┘
```

---

## 4. Component Changes

### 4.1 `InvoiceContext.tsx`
- Add `dockSplitRatio`: state `number` (default `0.40`).
- Add `setDockSplitRatio`: `(ratio: number) => void`.
- Add `isPdfLoading`: state `boolean` (default `false`).
- Add `setIsPdfLoading`: `(loading: boolean) => void`.

### 4.2 `QueuePage.tsx`
- Bind class `pdf-open` to `.work` when `isEvidenceDockOpen && selectedDoc`.
- Bind inline style variables `--mc` and `--dc`:
  ```tsx
  style={{
    '--mc': isEvidenceDockOpen ? `${((1 - dockSplitRatio) * 100).toFixed(1)}fr` : '100fr',
    '--dc': isEvidenceDockOpen ? `${(dockSplitRatio * 100).toFixed(1)}fr` : '0fr',
  } as React.CSSProperties}
  ```

### 4.3 `InvoiceDetailPane.tsx`
- In the PDF button:
  ```tsx
  <button
    type="button"
    className={`btn ${isEvidenceDockOpen ? 'btn-close-pdf' : 'btn-sec'} sm`}
    onClick={() => {
      if (isEvidenceDockOpen) closeEvidenceDock()
      else openEvidenceDock(1)
    }}
    disabled={!can('DMS') || isPdfLoading}
    title={isEvidenceDockOpen ? 'ปิด PDF (P / Esc)' : 'เปิดเอกสาร PDF (P)'}
  >
    {isPdfLoading ? (
      <>
        <span className="spin" aria-hidden="true" />
        กำลังโหลด PDF…
      </>
    ) : (
      <>
        <Icon name={isEvidenceDockOpen ? 'x' : 'file'} size="sm" />
        {isEvidenceDockOpen ? 'ปิด PDF' : 'เปิดเอกสาร PDF'} <kbd>P</kbd>
      </>
    )}
  </button>
  ```

### 4.4 `EvidenceViewerDock.tsx`
- Add Draggable Splitter `.dock-rz` on the dock edge:
  - Supports `onPointerDown` to track pointer movements across the window.
  - Updates `dockSplitRatio` clamped to `[0.30, 0.50]`.
  - Double-click resets `dockSplitRatio` to `0.40`.
- Sync `setIsPdfLoading(status.state === 'loading')` in an effect.

### 4.5 `PdfCanvasViewer.tsx`
- Enhance the `.evd-pdf-fallback` loading view with a centered spinner and loading text so that while PDF.js is downloading or rasterizing, a clean loading mat is presented.

---

## 5. Verification Plan

1. **Unit & Component Tests (`src/test/dockLayout.test.tsx`):**
   - Verify `.work` has `pdf-open` and `--dc: 40.0fr`, `--mc: 60.0fr` when `isEvidenceDockOpen = true`.
   - Verify `.work` has no `pdf-open` and `--dc: 0fr`, `--mc: 100fr` when `isEvidenceDockOpen = false`.
   - Verify the PDF toolbar button renders `<span className="spin" />` when `isPdfLoading = true`.
   - Verify dragging `.dock-rz` updates `dockSplitRatio`.
2. **End-to-End Visual Verification:**
   - Load `http://localhost:3000` with user `สมชาย วงศ์ทอง` (APR).
   - Select invoice `69/214` (DMS-113) or `DMS-100`.
   - Click "เปิดเอกสาร PDF (P)".
   - Observe immediate expansion of the right column (60:40 split), visible loading spinner during network transfer, followed by the crisp PDF canvas rendering and highlighted bounding box.
