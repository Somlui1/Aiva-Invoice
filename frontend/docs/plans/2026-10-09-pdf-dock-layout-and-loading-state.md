# PDF Dock Layout Grid Visibility and Loading State Implementation Plan

> **For Antigravity & Pi Agent:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` (or Pi equivalent) to execute this plan in single-flow mode.

**Goal:** Fix the hidden PDF Evidence Dock by dynamically applying the `.pdf-open` grid class and CSS variables (`--mc: 60.0fr`, `--dc: 40.0fr`), adding a draggable splitter (`.dock-rz`), and introducing clear loading spinner states on both the toolbar button and the dock body.

**Architecture:** Extend `InvoiceContext` with `dockSplitRatio` (default `0.40`) and `isPdfLoading` states. Update `QueuePage` to inject `--mc` and `--dc` grid variables into `.work` when the dock is open. Enhance `InvoiceDetailPane` and `PdfCanvasViewer` with responsive spinning indicators during PDF retrieval.

**Tech Stack:** React 19, Next.js 15, TypeScript 5, Vitest, CSS Grid / Custom Properties.

---

### Task 1: Context State Extensions (`dockSplitRatio` and `isPdfLoading`)

**Files:**
- Modify: `src/context/InvoiceContext.tsx`
- Create / Test: `src/test/dockLayout.test.tsx`

**Step 1: Write the failing test**

Create `src/test/dockLayout.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'

function TestHarness() {
  const { dockSplitRatio, setDockSplitRatio, isPdfLoading, setIsPdfLoading } = useInvoices()
  return (
    <div>
      <span data-testid="ratio">{dockSplitRatio}</span>
      <span data-testid="loading">{String(isPdfLoading)}</span>
      <button onClick={() => setDockSplitRatio(0.45)}>SetRatio</button>
      <button onClick={() => setIsPdfLoading(true)}>SetLoading</button>
    </div>
  )
}

describe('InvoiceContext Dock & Loading Extensions', () => {
  it('provides default dockSplitRatio 0.40 and isPdfLoading false, and allows updates', () => {
    render(
      <InvoiceProvider>
        <TestHarness />
      </InvoiceProvider>
    )

    expect(screen.getByTestId('ratio').textContent).toBe('0.4')
    expect(screen.getByTestId('loading').textContent).toBe('false')

    act(() => {
      screen.getByText('SetRatio').click()
    })
    expect(screen.getByTestId('ratio').textContent).toBe('0.45')

    act(() => {
      screen.getByText('SetLoading').click()
    })
    expect(screen.getByTestId('loading').textContent).toBe('true')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/dockLayout.test.tsx`
Expected: FAIL (missing `dockSplitRatio`, `setDockSplitRatio`, `isPdfLoading`, `setIsPdfLoading` on `InvoiceContextType`).

**Step 3: Implement minimal code in `InvoiceContext.tsx`**

In `src/context/InvoiceContext.tsx`:
1. Add to `InvoiceContextType`:
   ```ts
   dockSplitRatio: number
   setDockSplitRatio: (ratio: number) => void
   isPdfLoading: boolean
   setIsPdfLoading: (loading: boolean) => void
   ```
2. Inside `InvoiceProvider`:
   ```ts
   const [dockSplitRatio, setDockSplitRatio] = useState<number>(0.4)
   const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false)
   ```
3. Expose them in the Provider `value` object.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/dockLayout.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/context/InvoiceContext.tsx src/test/dockLayout.test.tsx
git commit -m "feat(dock): add dockSplitRatio and isPdfLoading to InvoiceContext"
```

---

### Task 2: QueuePage Grid Layout & CSS Variables Binding

**Files:**
- Modify: `src/components/queue/QueuePage.tsx`
- Modify: `src/test/dockLayout.test.tsx`

**Step 1: Write the failing test**

Append to `src/test/dockLayout.test.tsx`:
```tsx
import { AuthProvider } from '../context/AuthContext'
import { QueuePage } from '../components/queue/QueuePage'

describe('QueuePage Grid Layout Binding', () => {
  it('applies pdf-open and calculated --mc and --dc CSS variables when dock is open', async () => {
    function PageHarness() {
      const { selectDoc, openEvidenceDock } = useInvoices()
      return (
        <div>
          <button onClick={() => { selectDoc('DMS-100'); openEvidenceDock(1) }}>OpenDock</button>
          <QueuePage />
        </div>
      )
    }

    const { container } = render(
      <AuthProvider>
        <InvoiceProvider>
          <PageHarness />
        </InvoiceProvider>
      </AuthProvider>
    )

    const workBefore = container.querySelector('#work')
    expect(workBefore).toBeNull() // default is table view

    // Switch to split view and open dock
    act(() => {
      screen.getByText('OpenDock').click()
    })

    const workAfter = container.querySelector('#work') as HTMLElement
    expect(workAfter).not.toBeNull()
    expect(workAfter.classList.contains('pdf-open')).toBe(true)
    expect(workAfter.style.getPropertyValue('--mc')).toBe('60.0fr')
    expect(workAfter.style.getPropertyValue('--dc')).toBe('40.0fr')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/dockLayout.test.tsx`
Expected: FAIL (missing `.pdf-open` and `--dc`/`--mc` on `#work`).

**Step 3: Implement minimal code in `QueuePage.tsx`**

In `src/components/queue/QueuePage.tsx`:
1. Destructure `dockSplitRatio` from `useInvoices()`.
2. Update line 66:
   ```tsx
   <div
     className={`work${isEvidenceDockOpen && selectedDoc ? ' pdf-open' : ''}`}
     id="work"
     style={
       {
         '--mc': isEvidenceDockOpen && selectedDoc ? `${((1 - dockSplitRatio) * 100).toFixed(1)}fr` : '100fr',
         '--dc': isEvidenceDockOpen && selectedDoc ? `${(dockSplitRatio * 100).toFixed(1)}fr` : '0fr',
       } as React.CSSProperties
     }
   >
   ```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/dockLayout.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/queue/QueuePage.tsx src/test/dockLayout.test.tsx
git commit -m "feat(dock): dynamically bind pdf-open class and CSS grid variables in QueuePage"
```

---

### Task 3: Toolbar Button Loading Spinner Feedback

**Files:**
- Modify: `src/components/queue/InvoiceDetailPane.tsx`
- Modify: `src/test/dockLayout.test.tsx`

**Step 1: Write the failing test**

Append to `src/test/dockLayout.test.tsx`:
```tsx
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { INITIAL_DOCS } from '../mock/initialDocs'

describe('InvoiceDetailPane PDF Button Loading State', () => {
  it('renders spinner and disables button when isPdfLoading is true', () => {
    function DetailHarness() {
      const { setIsPdfLoading } = useInvoices()
      return (
        <div>
          <button onClick={() => setIsPdfLoading(true)}>TriggerLoading</button>
          <InvoiceDetailPane doc={INITIAL_DOCS[0]} />
        </div>
      )
    }

    render(
      <AuthProvider>
        <InvoiceProvider>
          <DetailHarness />
        </InvoiceProvider>
      </AuthProvider>
    )

    const btnBefore = screen.getByRole('button', { name: /เปิดเอกสาร PDF/i })
    expect(btnBefore).not.toBeDisabled()

    act(() => {
      screen.getByText('TriggerLoading').click()
    })

    const btnLoading = screen.getByRole('button', { name: /กำลังโหลด PDF…/i })
    expect(btnLoading).toBeDisabled()
    expect(btnLoading.querySelector('.spin')).not.toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/dockLayout.test.tsx`
Expected: FAIL (button does not show `กำลังโหลด PDF…` or `.spin`).

**Step 3: Implement minimal code in `InvoiceDetailPane.tsx`**

In `src/components/queue/InvoiceDetailPane.tsx`:
1. Read `isPdfLoading` from `useInvoices()`.
2. Update the PDF button around line 141:
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

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/dockLayout.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/queue/InvoiceDetailPane.tsx src/test/dockLayout.test.tsx
git commit -m "feat(ui): add loading spinner state to PDF toggle button"
```

---

### Task 4: EvidenceViewerDock Splitter Dragging & Loading Mat

**Files:**
- Modify: `src/components/evidence/EvidenceViewerDock.tsx`
- Modify: `src/features/pdf-viewer/components/PdfCanvasViewer.tsx`
- Modify: `src/styles/evidence.css` (if needed for `.spin.lg` or centered loading)
- Modify: `src/test/dockLayout.test.tsx`

**Step 1: Write the failing test**

Append to `src/test/dockLayout.test.tsx`:
```tsx
import { EvidenceViewerDock } from '../components/evidence/EvidenceViewerDock'

describe('EvidenceViewerDock Splitter and Loading State', () => {
  it('renders draggable splitter .dock-rz and updates isPdfLoading when status changes', () => {
    const { container } = render(
      <AuthProvider>
        <InvoiceProvider>
          <EvidenceViewerDock doc={INITIAL_DOCS[0]} />
        </InvoiceProvider>
      </AuthProvider>
    )

    const rz = container.querySelector('.dock-rz')
    expect(rz).not.toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/dockLayout.test.tsx`
Expected: FAIL (`.dock-rz` not found in `EvidenceViewerDock`).

**Step 3: Implement minimal code in `EvidenceViewerDock.tsx` and `PdfCanvasViewer.tsx`**

1. In `src/components/evidence/EvidenceViewerDock.tsx`:
   - Destructure `dockSplitRatio`, `setDockSplitRatio`, `setIsPdfLoading` from `useInvoices()`.
   - Sync loading state:
     ```tsx
     useEffect(() => {
       setIsPdfLoading(status.state === 'loading')
     }, [status.state, setIsPdfLoading])
     ```
   - Implement pointer dragging handler for `.dock-rz`:
     ```tsx
     const handleResizeStart = (e: React.PointerEvent) => {
       e.preventDefault()
       const startX = e.clientX
       const initialRatio = dockSplitRatio
       const workEl = document.getElementById('work')
       if (!workEl) return
       const workWidth = workEl.clientWidth

       const onPointerMove = (moveEvent: PointerEvent) => {
         const deltaX = startX - moveEvent.clientX // dragging left increases dock width
         const deltaRatio = deltaX / workWidth
         const nextRatio = Math.min(0.5, Math.max(0.3, initialRatio + deltaRatio))
         setDockSplitRatio(Number(nextRatio.toFixed(3)))
       }

       const onPointerUp = () => {
         window.removeEventListener('pointermove', onPointerMove)
         window.removeEventListener('pointerup', onPointerUp)
       }

       window.addEventListener('pointermove', onPointerMove)
       window.addEventListener('pointerup', onPointerUp)
     }

     const handleResizeReset = () => {
       setDockSplitRatio(0.4)
     }
     ```
   - Render `.dock-rz` right inside `<section className="col dock" id="dock">`:
     ```tsx
     <div
       className="dock-rz"
       title="ลากเพื่อปรับความกว้าง (รายละเอียด 50–70%) · ดับเบิลคลิกเพื่อกลับเป็น 60:40"
       onPointerDown={handleResizeStart}
       onDoubleClick={handleResizeReset}
     />
     ```
2. In `src/features/pdf-viewer/components/PdfCanvasViewer.tsx`:
   Enhance loading feedback in `.evd-pdf-fallback`:
   ```tsx
   {status.state === 'loading' ? (
     <div className="evd-loading-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 16px' }}>
       <span className="spin" style={{ width: 32, height: 32, borderWidth: 3 }} aria-hidden="true" />
       <span className="evd-pdf-note">กำลังดาวน์โหลดและประมวลผลเอกสาร PDF จาก DMS…</span>
     </div>
   ) : ...}
   ```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/test/dockLayout.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/evidence/EvidenceViewerDock.tsx src/features/pdf-viewer/components/PdfCanvasViewer.tsx src/test/dockLayout.test.tsx
git commit -m "feat(dock): add draggable splitter and centered loading spinner in EvidenceViewerDock"
```

---

### Task 5: End-to-End Verification & Full Test Suite Pass

**Files:**
- Modify: `docs/plans/task.md` (Update task status rows)

**Step 1: Run full test suite**

Run: `npm test`
Expected: All test files pass (14/14 test files, 160+ tests passing, 0 failures).

**Step 2: Run TypeScript typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

**Step 3: Run production build verification**

Run: `npm run build`
Expected: Successful build (Exit code 0).

**Step 4: Live HTTP & Browser Smoke Check**

Run:
```bash
curl.exe -I http://localhost:3000/api/documents/DMS-100/pdf
```
Expected: `HTTP/1.1 200 OK` with `x-pdf-source: dms_live`.

**Step 5: Commit and Update Tracker**

```bash
git add docs/plans/task.md
git commit -m "docs: complete PDF dock layout and loading state implementation"
```
