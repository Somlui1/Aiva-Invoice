/**
 * v5.7.1/v5.8 — split view focus mode (queue ⇄ PDF exclusive) and the date filter.
 *
 * @vitest-environment jsdom
 */
import React, { useEffect } from 'react'
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
import { saveLayoutPrefs } from '../lib/layoutPrefs'

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
  useEffect(() => {
    setViewMode('split')
  }, [setViewMode])
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

describe('v5.7.1 (legacy layout "ซ่อนคิว แบบเดิม"): queue and PDF preview are exclusive (no overlay)', () => {
  // v5.17: this behaviour is now an option in the layout menu; the default keeps the queue visible.
  beforeEach(() => {
    saveLayoutPrefs({ pdfHidesQueue: true })
  })

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

/** Like Harness, but with every period shown so the seeded documents are in the list. */
function AllPeriodHarness() {
  const { setViewMode, selectDoc, openEvidenceDock, selectedDocId, isEvidenceDockOpen, setPeriodFilter } = useInvoices()
  useEffect(() => {
    setViewMode('split')
    setPeriodFilter({ k: 'all' })
  }, [setViewMode, setPeriodFilter])
  return (
    <div>
      <span data-testid="sel">{selectedDocId}</span>
      <span data-testid="dock">{String(isEvidenceDockOpen)}</span>
      <button
        onClick={() => {
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

describe('v5.17: adaptive 3-pane — queue, detail and PDF together', () => {
  const rows = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('#list .qi')).map(el => el.dataset.doc)
  const Harness = AllPeriodHarness

  it('opening the PDF keeps the queue as a compact column (no rail)', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    const work = container.querySelector('#work') as HTMLElement
    expect(work.classList.contains('pdf-open')).toBe(true)
    expect(container.querySelector('#queue-panel')).not.toBeNull()
    expect(container.querySelector('.qrail')).toBeNull()
    expect(work.style.getPropertyValue('--qc')).toBe('260px')
    expect(container.querySelector('#list .qi.qi-compact')).not.toBeNull()
    expect(container.querySelector('.q-rz[role="separator"]')).not.toBeNull()
  })

  it('PDF closed: the queue keeps the full 4-line card', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    act(() => fireEvent.keyDown(document.body, { key: 'p' }))
    expect(screen.getByTestId('dock').textContent).toBe('false')
    expect(container.querySelector('#list .qi.qi-compact')).toBeNull()
    expect(container.querySelector('#list .qi .r3')).not.toBeNull()
  })

  it('J / K switch the document while the PDF stays open; P toggles the PDF', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    const order = rows(container)
    expect(order.length).toBeGreaterThan(1)
    const start = order.indexOf(screen.getByTestId('sel').textContent!)
    expect(start).toBeGreaterThanOrEqual(0)
    act(() => fireEvent.keyDown(document.body, { key: start < order.length - 1 ? 'j' : 'k' }))
    const moved = screen.getByTestId('sel').textContent
    expect(moved).toBe(order[start < order.length - 1 ? start + 1 : start - 1])
    expect(screen.getByTestId('dock').textContent).toBe('true')
    act(() => fireEvent.keyDown(document.body, { key: start < order.length - 1 ? 'k' : 'j' }))
    expect(screen.getByTestId('sel').textContent).toBe(order[start])

    act(() => fireEvent.keyDown(document.body, { key: 'p' }))
    expect(screen.getByTestId('dock').textContent).toBe('false')
    act(() => fireEvent.keyDown(document.body, { key: 'P' }))
    expect(screen.getByTestId('dock').textContent).toBe('true')
  })

  it('J / K are ignored while typing in the search box', async () => {
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    const before = screen.getByTestId('sel').textContent
    const input = container.querySelector('#queue-panel input') as HTMLInputElement | null
    if (!input) return
    act(() => fireEvent.keyDown(input, { key: 'j' }))
    expect(screen.getByTestId('sel').textContent).toBe(before)
  })

  it('"พับ" mode: the rail opens the queue over the PDF; Esc closes it before the PDF', async () => {
    saveLayoutPrefs({ mode: 'edge' })
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    const work = container.querySelector('#work') as HTMLElement
    const rail = container.querySelector('.qrail') as HTMLButtonElement
    expect(rail).not.toBeNull()
    expect(container.querySelector('#queue-panel')).toBeNull()
    expect(rail.getAttribute('aria-expanded')).toBe('false')

    act(() => rail.click())
    expect(work.classList.contains('q-peek')).toBe(true)
    expect(container.querySelector('#queue-panel')).not.toBeNull()
    expect(screen.getByTestId('dock').textContent).toBe('true')

    act(() => fireEvent.keyDown(document.body, { key: 'Escape' }))
    expect(work.classList.contains('q-peek')).toBe(false)
    expect(screen.getByTestId('dock').textContent).toBe('true')
  })

  it('picking a document in the flyout switches it, keeps the PDF and closes the flyout', async () => {
    saveLayoutPrefs({ mode: 'edge' })
    const { container } = await mount(<Harness />)
    act(() => screen.getByText('OpenDock').click())
    act(() => (container.querySelector('.qrail') as HTMLButtonElement).click())
    const other = Array.from(container.querySelectorAll<HTMLElement>('#list .qi')).find(el => !el.classList.contains('on'))
    if (!other) return
    act(() => other.click())
    expect(screen.getByTestId('sel').textContent).toBe(other.dataset.doc)
    expect(screen.getByTestId('dock').textContent).toBe('true')
    expect((container.querySelector('#work') as HTMLElement).classList.contains('q-peek')).toBe(false)
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
