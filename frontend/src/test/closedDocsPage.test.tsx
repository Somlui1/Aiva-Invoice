/**
 * v5.9 — "เอกสารที่ปิดแล้ว": tabs, chips, read-only detail, queue no longer mixes closed docs.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within, type RenderResult } from '@testing-library/react'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { ClosedDocsPage } from '../components/closed/ClosedDocsPage'
import { INITIAL_DOCS } from '../mock/initialDocs'
import { USERS } from '../mock/users'
import type { InvoiceDoc } from '../types/invoice'
import type { User } from '../types/auth'

vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: { workerSrc: '' }, getDocument: () => { throw new Error('no pdf') } }))

const SA = USERS.find(u => u.role === 'SA') as User
const base = INITIAL_DOCS[0]
const hist = (dt: string, act: string, d = '') => [{ dt, t: '09:00:00', who: 'สมชาย', act, d }]
const DOCS: InvoiceDoc[] = [
  { ...base, doc: 'DMS-901', inv: 'INV-901', company: 'AH', status: 'Confirmed', history: hist('2026-10-05', 'Confirm') },
  { ...base, doc: 'DMS-902', inv: 'INV-902', company: 'AH', status: 'Sent', batch: 'AP-01', history: hist('2026-10-06', 'Sent') },
  { ...base, doc: 'DMS-903', inv: 'INV-903', company: 'AHT', status: 'Posted', batch: 'AP-01', history: hist('2026-10-07', 'Posted') },
  { ...base, doc: 'DMS-904', inv: 'INV-904', company: 'AH', status: 'Rejected', history: hist('2026-10-04', 'Reject', 'สแกนผิดบริษัท') },
  { ...base, doc: 'DMS-905', inv: 'INV-905', company: 'AH', status: 'Superseded', supersededBy: 'DMS-907', supRule: 'DR-01', history: hist('2026-10-03', 'Superseded') },
  { ...base, doc: 'DMS-906', inv: 'INV-906', company: 'AH', status: 'Duplicate', duplicate_of: 'DMS-901', dupRule: 'DR-04', history: hist('2026-10-03', 'Duplicate') },
  { ...base, doc: 'DMS-907', inv: 'INV-907', company: 'AH', status: 'Review', history: hist('2026-10-03', 'ตรวจเสร็จ') },
]

function Providers({ children, user }: { children: React.ReactNode; user: User }) {
  return (
    <AuthProvider initialUser={user}>
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

async function mount(ui: React.ReactElement, user: User = SA): Promise<RenderResult> {
  let r: RenderResult | undefined
  await act(async () => {
    r = render(<Providers user={user}>{ui}</Providers>)
    for (let i = 0; i < 3; i++) await new Promise(res => setTimeout(res, 0))
  })
  return r as RenderResult
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    String(url).startsWith('/api/documents')
      ? new Response(JSON.stringify({ ok: true, documents: DOCS }), { status: 200 })
      : new Response('{"ok":false}', { status: 500 }),
  ))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(() => vi.unstubAllGlobals())

describe('ClosedDocsPage', () => {
  it('three group tabs with counts; AP Flow shows Confirmed → Sent → Posted', async () => {
    const { container } = await mount(<ClosedDocsPage />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(t => t.querySelector('.cdp-tab-l')!.textContent)).toEqual(['AP Flow', 'ปฏิเสธ', 'เอกสารซ้ำ'])
    expect(tabs.map(t => t.querySelector('.cdp-tab-n')!.textContent)).toEqual(['3', '1', '2'])
    const rows = container.querySelectorAll('tbody tr[data-doc]')
    expect(Array.from(rows).map(r => r.getAttribute('data-doc'))).toEqual(['DMS-903', 'DMS-902', 'DMS-901'])
    expect(container.querySelector('tbody .cst-Sent .cst-pulse')).not.toBeNull()
  })

  it('status chip narrows the list; switching tab resets it', async () => {
    const { container } = await mount(<ClosedDocsPage />)
    act(() => (container.querySelector('.cdp-subs .cdp-sub[title*="Oracle Payables"]') as HTMLButtonElement).click())
    expect(container.querySelectorAll('tbody tr[data-doc]').length).toBe(1)
    act(() => screen.getByRole('tab', { name: /เอกสารซ้ำ/ }).click())
    const docs = Array.from(container.querySelectorAll('tbody tr[data-doc]')).map(r => r.getAttribute('data-doc'))
    expect(docs.sort()).toEqual(['DMS-905', 'DMS-906'])
    expect(container.querySelector('tbody .cst-Superseded .cst-t')).not.toBeNull()
  })

  it('opening a document is read-only: no Confirm / Reject / Hold / Review, closing summary instead', async () => {
    const { container } = await mount(<ClosedDocsPage />)
    act(() => screen.getByRole('tab', { name: /ปฏิเสธ/ }).click())
    act(() => (container.querySelector('tbody tr[data-doc="DMS-904"]') as HTMLElement).click())
    const detail = container.querySelector('#detail') as HTMLElement
    expect(detail).not.toBeNull()
    for (const name of ['Confirm', 'Reject', 'Hold', 'Review']) {
      expect(within(detail).queryByRole('button', { name: new RegExp(`^\\s*${name}\\s*$`) })).toBeNull()
    }
    const card = container.querySelector('.cdp-closure') as HTMLElement
    expect(card.textContent).toContain('สแกนผิดบริษัท')
    expect(card.textContent).toContain('สมชาย')
    expect(card.textContent).toContain('ดูอย่างเดียว')
  })

  it('End User does not get the duplicate group', async () => {
    const eu = { ...(USERS.find(u => u.role === 'EU') as User), co: ['AH', 'AHT'] }
    await mount(<ClosedDocsPage />, eu)
    expect(screen.queryByRole('tab', { name: /เอกสารซ้ำ/ })).toBeNull()
    // v5.10: the Receiver's page is "ผลการส่งเอกสาร" with three tabs and no Export
    expect(screen.getAllByRole('tab').map(t => t.querySelector('.cdp-tab-l')!.textContent)).toEqual(['ส่งจ่ายแล้ว', 'ถูกปฏิเสธ', 'ถูกแทนที่'])
    expect(screen.queryByRole('button', { name: /Export CSV/ })).toBeNull()
  })
})

describe('review queue no longer mixes closed documents', () => {
  it('filteredDocs keeps open work only', async () => {
    function Probe() {
      const { filteredDocs, setStatusFilter } = useInvoices() as any
      return (
        <div>
          <span data-testid="ids">{filteredDocs.map((d: InvoiceDoc) => d.doc).join(',')}</span>
          <button onClick={() => setStatusFilter('Duplicate')}>dup</button>
        </div>
      )
    }
    await mount(<Probe />)
    expect(screen.getByTestId('ids').textContent).toBe('DMS-907')
    // an explicit status card still lists that status (APR duplicate override)
    act(() => screen.getByText('dup').click())
    expect(screen.getByTestId('ids').textContent).toBe('DMS-906')
  })
})
