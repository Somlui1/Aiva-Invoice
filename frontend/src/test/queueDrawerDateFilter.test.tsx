/**
 * v5.7 — split view focus mode (queue slide-over drawer) and the search-box date filter.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, type RenderResult } from '@testing-library/react'
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

  it('combines with the text search (AND)', () => {
    const out = filterDocsFor({
      docs: [a, b],
      statusFilter: 'all',
      companyFilter: new Set(),
      periodFilter: { k: 'all' },
      searchQuery: '',
      dateFilter: { field: 'created', from: '2026-10-04' },
      showClosed: true,
      role: 'ACC',
    })
    expect(out.map(d => d.doc)).toEqual(['DMS-2'])
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

describe.skip('queue slide-over drawer while the PDF is open (superseded by v5.7.1 focus mode)', () => {
  it('hides the queue column, shows the rail, opens an overlay drawer with a backdrop', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())

    const work = container.querySelector('#work') as HTMLElement
    expect(work.classList.contains('pdf-open')).toBe(true)
    expect(work.classList.contains('q-drawer')).toBe(false)
    const rail = container.querySelector('.qrail') as HTMLButtonElement
    expect(rail).not.toBeNull()
    expect(rail.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('#queue-panel')!.getAttribute('aria-hidden')).toBe('true')

    act(() => rail.click())
    expect(work.classList.contains('q-drawer')).toBe(true)
    expect(rail.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('.qscrim')).not.toBeNull()
    // overlay: the grid tracks did not change
    expect(work.style.getPropertyValue('--qc')).toBe('0px')

    act(() => (container.querySelector('.qscrim') as HTMLElement).click())
    expect(work.classList.contains('q-drawer')).toBe(false)
  })

  it('picking another document from the drawer switches it, keeps the PDF open and closes the drawer', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    act(() => (container.querySelector('.qrail') as HTMLButtonElement).click())

    const items = container.querySelectorAll('#list [role="option"], #list .qi')
    const other = Array.from(items).find(el => !el.className.includes(' on')) as HTMLElement | undefined
    if (!other) return // a single-document fixture has nothing to switch to
    act(() => other.click())
    expect(screen.getByTestId('sel').textContent).not.toBe(INITIAL_DOCS[0].doc)
    expect(screen.getByTestId('dock').textContent).toBe('true')
    expect((container.querySelector('#work') as HTMLElement).classList.contains('q-drawer')).toBe(false)
  })

  it('Esc closes the drawer before it closes the PDF', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    act(() => (container.querySelector('.qrail') as HTMLButtonElement).click())
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' })
    })
    expect((container.querySelector('#work') as HTMLElement).classList.contains('q-drawer')).toBe(false)
    expect(screen.getByTestId('dock').textContent).toBe('true')
  })
})

describe.skip('search box date filter UI (superseded by v5.8 toolbar date tool)', () => {
  it('opens, filters on invoice date and shows the active summary', async () => {
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
    act(() => screen.getByRole('button', { name: 'กรองตามวันที่' }).click())
    act(() => screen.getByRole('radio', { name: 'วันที่ในใบแจ้งหนี้' }).click())
    act(() => {
      fireEvent.change(screen.getByLabelText('ตั้งแต่วันที่'), { target: { value: '2026-10-01' } })
    })
    expect(container.querySelector('.sdf-active')!.textContent).toContain('วันที่ในใบแจ้งหนี้')
    act(() => screen.getByRole('button', { name: 'ล้างตัวกรองวันที่' }).click())
    expect(container.querySelector('.sdf-active')).toBeNull()
  })
})
