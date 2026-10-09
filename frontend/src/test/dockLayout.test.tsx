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
import { render, screen, act, type RenderResult } from '@testing-library/react'

import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { QueuePage } from '../components/queue/QueuePage'
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
 */
async function mount(ui: React.ReactElement): Promise<RenderResult> {
  let result: RenderResult | undefined
  await act(async () => {
    result = render(<Providers>{ui}</Providers>)
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return result as RenderResult
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{"ok":false,"error":"offline test"}', { status: 500 })),
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
