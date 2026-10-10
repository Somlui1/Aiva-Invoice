/**
 * PDF Evidence Dock — grid visibility + loading state.
 * Design: docs/plans/2026-10-09-pdf-dock-layout-and-loading-state-design.md
 * Plan:   docs/plans/2026-10-09-pdf-dock-layout-and-loading-state.md
 *
 * These tests run in a real DOM (jsdom) because the bug being fixed is a CSS
 * Grid contract: the dock column only exists when `.work` carries `pdf-open`
 * plus the `--mc` / `--dc` custom properties, and a state update has to be
 * observable through an actual click, which `renderToString` cannot express.
 *
 * @vitest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, act, within, type RenderResult } from '@testing-library/react'

import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { QueuePage } from '../components/queue/QueuePage'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { EvidenceViewerDock } from '../components/evidence/EvidenceViewerDock'
import { INITIAL_DOCS } from '../mock/initialDocs'

/**
 * PDF.js is browser-only: it touches `DOMMatrix` while its module is evaluated and
 * answers "Please use the `legacy` build in Node.js environments" under jsdom. The
 * rasteriser is not what these layout tests exercise, and the real proxy/render
 * path has its own coverage (`pdfProxy.test.ts`, `coordinateTransform.test.ts`),
 * so the module is replaced by a stub that can never paint a page.
 */
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => {
    throw new Error('PDF.js is not available in jsdom unit tests')
  },
}))

/** Same provider stack the live shell mounts (`src/test/app-smoke.test.tsx`). */
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>{children}</SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

/**
 * `InvoiceProvider` loads `GET /api/documents` on mount. There is no server in a
 * unit test, so the loader is answered with an offline failure — the documented
 * fallback that keeps the seeded queue — and the exchange is drained inside
 * `act` so no state update lands outside it. Every test below then exercises the
 * same components the browser renders, on the same seed data.
 *
 * `pdfMode` decides what the dock's own `GET /api/documents/:id/pdf` answers:
 * `pending` holds the request open, which is how a real download looks and what
 * keeps the loading state observable; `offline` fails it, so the dock reports
 * `fallback` and the loading indicators must disappear.
 */
let pdfMode: 'pending' | 'offline' = 'pending'

async function mount(ui: React.ReactElement): Promise<RenderResult> {
  let result: RenderResult | undefined
  await act(async () => {
    result = render(<Providers>{ui}</Providers>)
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return result as RenderResult
}

/**
 * Split view, a selected document and the dock open — the state the analyst
 * reaches by clicking "เปิดเอกสาร PDF". Rendered through `QueuePage`, because
 * that is what owns the `.work` grid whose width the splitter divides.
 */
function QueueDockHarness() {
  const { setViewMode, selectDoc, openEvidenceDock, dockSplitRatio } = useInvoices()
  return (
    <div>
      <button
        onClick={() => {
          setViewMode('split')
          selectDoc(INITIAL_DOCS[0].doc)
          openEvidenceDock(1)
        }}
      >
        OpenDock
      </button>
      <span data-testid="ratio">{dockSplitRatio}</span>
      <QueuePage />
    </div>
  )
}

/** Open the dock through the toolbar button, letting the PDF request reach its answer. */
async function mountDock(): Promise<RenderResult> {
  const view = await mount(<QueueDockHarness />)
  await act(async () => {
    screen.getByText('OpenDock').click()
    // `pending` leaves the request in flight; `offline` lets it land as a failure.
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return view
}

/**
 * jsdom has no layout engine: every element reports `clientWidth` 0, which would
 * turn the splitter's ratio maths into a division by zero. The measured width of
 * the grid is the environment's job, so it is supplied here; the arithmetic that
 * consumes it stays the production code under test.
 */
function stubGridWidth(el: Element, width: number): void {
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: width })
}

/** One press-drag-release across the splitter, as the browser would deliver it. */
function dragSplitter(rz: Element, fromX: number, toX: number): void {
  act(() => {
    rz.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: fromX }))
    window.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: toX }))
    window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
  })
}

beforeEach(() => {
  pdfMode = 'pending'
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/pdf')) {
        return pdfMode === 'pending'
          ? new Promise<Response>(() => {})
          : Promise.resolve(new Response('{"ok":false}', { status: 500 }))
      }
      return Promise.resolve(new Response('{"ok":false,"error":"offline test"}', { status: 500 }))
    }),
  )
  // jsdom implements no ResizeObserver; the dock only needs the observe/disconnect
  // contract, and its fit-to-width maths is covered in coordinateTransform.test.ts.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('InvoiceContext Dock & Loading Extensions', () => {
  it('provides default dockSplitRatio 0.40 and isPdfLoading false, and allows updates', async () => {
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

    await mount(<TestHarness />)

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

describe('QueuePage Grid Layout Binding', () => {
  it('applies pdf-open and calculated --mc and --dc CSS variables when dock is open', async () => {
    function PageHarness() {
      const { selectDoc, openEvidenceDock, setViewMode } = useInvoices()
      return (
        <div>
          <button
            onClick={() => {
              // `.work` is the split view; the table view has no dock column at all.
              setViewMode('split')
              selectDoc(INITIAL_DOCS[0].doc)
              openEvidenceDock(1)
            }}
          >
            OpenDock
          </button>
          <QueuePage />
        </div>
      )
    }

    const { container } = await mount(<PageHarness />)

    const workBefore = container.querySelector('#work')
    expect(workBefore).toBeNull() // default is table view

    act(() => {
      screen.getByText('OpenDock').click()
    })

    const workAfter = container.querySelector('#work') as HTMLElement
    expect(workAfter).not.toBeNull()
    expect(workAfter.classList.contains('pdf-open')).toBe(true)
    expect(workAfter.style.getPropertyValue('--mc')).toBe('60.0fr')
    expect(workAfter.style.getPropertyValue('--dc')).toBe('40.0fr')
  })

  it('keeps the full-width grid (no pdf-open, --mc 100fr, --dc 0fr) while the dock is closed', async () => {
    function SplitHarness() {
      const { setViewMode, selectDoc } = useInvoices()
      return (
        <div>
          <button onClick={() => { setViewMode('split'); selectDoc(INITIAL_DOCS[0].doc) }}>OpenSplit</button>
          <QueuePage />
        </div>
      )
    }

    const { container } = await mount(<SplitHarness />)

    act(() => {
      screen.getByText('OpenSplit').click()
    })

    const work = container.querySelector('#work') as HTMLElement
    expect(work).not.toBeNull()
    expect(work.classList.contains('pdf-open')).toBe(false)
    expect(work.style.getPropertyValue('--mc')).toBe('100fr')
    expect(work.style.getPropertyValue('--dc')).toBe('0fr')
  })
})

describe('InvoiceDetailPane PDF Button Loading State', () => {
  it('renders spinner and disables button when isPdfLoading is true', async () => {
    function DetailHarness() {
      const { setIsPdfLoading } = useInvoices()
      return (
        <div>
          <button onClick={() => setIsPdfLoading(true)}>TriggerLoading</button>
          <InvoiceDetailPane doc={INITIAL_DOCS[0]} onOpenActionModal={() => {}} />
        </div>
      )
    }

    await mount(<DetailHarness />)

    const btnBefore = screen.getByRole<HTMLButtonElement>('button', { name: /เปิดเอกสาร PDF/i })
    expect(btnBefore.disabled).toBe(false)
    expect(btnBefore.querySelector('.spin')).toBeNull()

    act(() => {
      screen.getByText('TriggerLoading').click()
    })

    const btnLoading = screen.getByRole<HTMLButtonElement>('button', { name: /กำลังโหลด/i })
    expect(btnLoading.disabled).toBe(false)
    expect(btnLoading.title).toContain('ยกเลิก')
    expect(btnLoading.querySelector('.spin')).not.toBeNull()
    // The spinner state replaces the toggle, so the idle label must be gone.
    expect(screen.queryByRole('button', { name: /เปิดเอกสาร PDF/i })).toBeNull()
  })
})

describe('EvidenceViewerDock Splitter and Loading State', () => {
  it('renders the draggable splitter inside the dock', async () => {
    const { container } = await mountDock()

    expect(container.querySelector('#dock')).not.toBeNull()
    expect(container.querySelector('.dock-rz')).not.toBeNull()
  })

  it('re-splits the grid on drag and clamps the dock to 30–50%', async () => {
    const { container } = await mountDock()
    const work = container.querySelector('#work') as HTMLElement
    const rz = container.querySelector('.dock-rz') as HTMLElement
    expect(rz).not.toBeNull()
    stubGridWidth(work, 1000)

    expect(screen.getByTestId('ratio').textContent).toBe('0.4')

    // The grid carries `dragging` for the whole press, which is what the
    // `.work.dragging .dock-rz::after` affordance in evidence.css keys on.
    act(() => {
      rz.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 1000 }))
    })
    expect(work.classList.contains('dragging')).toBe(true)

    // 100px pulled left on a 1000px grid is +10% of the dock, which lands on the
    // upper clamp rather than overshooting it.
    act(() => {
      window.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 900 }))
    })
    expect(screen.getByTestId('ratio').textContent).toBe('0.5')
    expect(work.style.getPropertyValue('--dc')).toBe('50.0fr')
    expect(work.style.getPropertyValue('--mc')).toBe('50.0fr')

    act(() => {
      window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    })
    expect(work.classList.contains('dragging')).toBe(false)

    // Dragging the other way past the lower bound still stops at 30%.
    dragSplitter(rz, 1000, 1400)
    expect(screen.getByTestId('ratio').textContent).toBe('0.3')
    expect(work.style.getPropertyValue('--dc')).toBe('30.0fr')
    expect(work.style.getPropertyValue('--mc')).toBe('70.0fr')
    expect(work.classList.contains('dragging')).toBe(false)
  })

  it('double-clicking the splitter restores the 60:40 default', async () => {
    const { container } = await mountDock()
    const work = container.querySelector('#work') as HTMLElement
    const rz = container.querySelector('.dock-rz') as HTMLElement
    stubGridWidth(work, 1000)

    dragSplitter(rz, 1000, 900)
    expect(screen.getByTestId('ratio').textContent).toBe('0.5')

    act(() => {
      rz.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })

    expect(screen.getByTestId('ratio').textContent).toBe('0.4')
    expect(work.style.getPropertyValue('--dc')).toBe('40.0fr')
    expect(work.style.getPropertyValue('--mc')).toBe('60.0fr')
  })

  it('shows a loading mat in the dock and a spinner on the toolbar button while the PDF is in flight', async () => {
    const { container } = await mountDock()

    // Dock body: centred spinner only (minimal clean state).
    const mat = container.querySelector('.evd-loading-minimal')
    expect(mat).not.toBeNull()
    expect(mat!.querySelector('.spin.lg')).not.toBeNull()
    expect(container.querySelector('.pdf-top-progress')).not.toBeNull()

    // Same flight, reported on the toolbar button too — the dual indicator.
    const btn = screen.getByRole<HTMLButtonElement>('button', { name: /กำลังโหลด/i })
    expect(btn.disabled).toBe(false)
    expect(btn.querySelector('.spin')).not.toBeNull()
  })

  it('clears both loading indicators once the request settles', async () => {
    pdfMode = 'offline'
    const { container } = await mountDock()

    expect(container.querySelector('.evd-loading-center')).toBeNull()
    expect(container.querySelector('#dock .spin')).toBeNull()
    expect(screen.queryByRole('button', { name: /กำลังโหลด PDF/i })).toBeNull()
    // The dock's own header also says "ปิด PDF", so the toolbar toggle is read from
    // the detail pane it lives in.
    const detail = container.querySelector('#detail') as HTMLElement
    expect(within(detail).getByRole<HTMLButtonElement>('button', { name: /ปิด PDF/i }).disabled).toBe(false)
  })
})
