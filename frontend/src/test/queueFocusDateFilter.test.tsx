/**
 * v5.7.1/v5.8 — split view focus mode (queue ⇄ PDF exclusive) and the date filter.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, type RenderResult } from '@testing-library/react'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { QueuePage } from '../components/queue/QueuePage'
import { INITIAL_DOCS } from '../mock/initialDocs'
import { docDateFor, filterDocsFor, matchesDateFilter } from '../lib/queueFilters'
import type { InvoiceDoc } from '../types/invoice'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => {
    throw new Error('PDF.js is not available in jsdom unit tests')
  },
}))

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

async function mount(ui: React.ReactElement): Promise<RenderResult> {
  let result: RenderResult | undefined
  await act(async () => {
    result = render(<Providers>{ui}</Providers>)
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return result as RenderResult
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"ok":false}', { status: 500 }))))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(() => vi.unstubAllGlobals())

const doc = (over: Partial<InvoiceDoc>): InvoiceDoc => ({ ...INITIAL_DOCS[0], ...over })

describe('date filter (pure)', () => {
  const a = doc({ doc: 'DMS-1', up: '2026-10-20', created: '2026-10-01', dt: '2026-09-28' })
  const b = doc({ doc: 'DMS-2', up: '2026-10-05', created: '2026-10-05', dt: '—' })

  it('created = createdAt (falls back to up) · invoice = invoice_date', () => {
    expect(docDateFor(a, 'created')).toBe('2026-10-01')
    expect(docDateFor(doc({ created: undefined, up: '2026-10-09' }), 'created')).toBe('2026-10-09')
    expect(docDateFor(a, 'invoice')).toBe('2026-09-28')
    expect(docDateFor(b, 'invoice')).toBe('')
  })

  it('inclusive range, open ends, reversed range, unreadable date excluded', () => {
    expect(matchesDateFilter(a, { field: 'created', from: '2026-10-01', to: '2026-10-01' })).toBe(true)
    expect(matchesDateFilter(a, { field: 'created', from: '2026-10-02' })).toBe(false)
    expect(matchesDateFilter(a, { field: 'invoice', to: '2026-09-30' })).toBe(true)
    expect(matchesDateFilter(a, { field: 'invoice', from: '2026-09-30', to: '2026-09-01' })).toBe(true)
    expect(matchesDateFilter(b, { field: 'invoice', from: '2026-01-01' })).toBe(false)
    expect(matchesDateFilter(b, { field: 'invoice' })).toBe(true)
  })

  it('v5.8: the toolbar period applies to the chosen date field (one filter for list + KPI)', () => {
    const base = {
      docs: [a, b],
      statusFilter: 'all',
      companyFilter: new Set<string>(),
      searchQuery: '',
      showClosed: true,
      role: 'ACC' as const,
    }
    const pick = (periodFilter: any) => filterDocsFor({ ...base, periodFilter }).map(d => d.doc)
    expect(pick({ k: 'custom', from: '2026-10-04', field: 'created' })).toEqual(['DMS-2'])
    expect(pick({ k: 'custom', from: '2026-10-04' })).toEqual(['DMS-1', 'DMS-2'])
    expect(pick({ k: 'custom', from: '2026-09-01', to: '2026-09-30', field: 'invoice' })).toEqual(['DMS-1'])
    // reversed custom range is swapped
    expect(pick({ k: 'custom', from: '2026-09-30', to: '2026-09-01', field: 'invoice' })).toEqual(['DMS-1'])
  })
})

function Harness() {
  const { setViewMode, selectDoc, openEvidenceDock, selectedDocId, isEvidenceDockOpen } = useInvoices()
  return (
    <div>
      <span data-testid="sel">{selectedDocId}</span>
      <span data-testid="dock">{String(isEvidenceDockOpen)}</span>
      <button
        onClick={() => {
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

describe('v5.7.1: queue and PDF preview are exclusive (no overlay)', () => {
  it('opening the PDF hides the queue column and shows only the rail', async () => {
    const { container } = await mount(<Harness />)
    expect(container.querySelector('#queue-panel')).not.toBeNull()
    act(() => screen.getByText('OpenDock').click())

    const work = container.querySelector('#work') as HTMLElement
    expect(work.classList.contains('pdf-open')).toBe(true)
    expect(container.querySelector('#queue-panel')).toBeNull()
    expect(container.querySelector('.qrail')).not.toBeNull()
    expect(container.querySelector('.qscrim')).toBeNull()
    expect(work.style.getPropertyValue('--qc')).toBe('0px')
  })

  it('the rail shows the queue and closes the PDF preview automatically', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    act(() => (container.querySelector('.qrail') as HTMLButtonElement).click())

    expect(screen.getByTestId('dock').textContent).toBe('false')
    expect(container.querySelector('#queue-panel')).not.toBeNull()
    expect(container.querySelector('.qrail')).toBeNull()
    expect((container.querySelector('#work') as HTMLElement).classList.contains('pdf-open')).toBe(false)
    // the selected document stays selected
    expect(screen.getByTestId('sel').textContent).toBe(INITIAL_DOCS[0].doc)
  })

  it('only one detail pane and one action bar are ever rendered', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    expect(container.querySelectorAll('#detail').length).toBeLessThanOrEqual(1)
    expect(container.querySelectorAll('.detail .abar').length).toBeLessThanOrEqual(1)
  })
})

describe('v5.8: date tool lives in the toolbar, not in the search box', () => {
  it('the queue search box has no calendar button any more', async () => {
    function SplitHarness() {
      const { setViewMode } = useInvoices()
      return (
        <div>
          <button onClick={() => setViewMode('split')}>Split</button>
          <QueuePage />
        </div>
      )
    }
    const { container } = await mount(<SplitHarness />)
    act(() => screen.getByText('Split').click())
    expect(container.querySelector('#queue-panel .sdf, #queue-panel .drt')).toBeNull()
    expect(container.querySelector('.tbar .drt')).not.toBeNull()
  })
})
