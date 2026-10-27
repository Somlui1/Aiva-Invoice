/**
 * v5.8 — toolbar date range tool + anchored popover + no-cut text.
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
import { DateRangeTool, normalizeDraft, rangeText, summaryOf } from '../components/queue/DateRangeTool'
import { QueueListItem } from '../components/queue/QueueListItem'
import { INITIAL_DOCS } from '../mock/initialDocs'

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
  let r: RenderResult | undefined
  await act(async () => {
    r = render(<Providers>{ui}</Providers>)
    await new Promise(res => setTimeout(res, 0))
  })
  return r as RenderResult
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"ok":false}', { status: 500 }))))
})
afterEach(() => vi.unstubAllGlobals())

function Probe() {
  const { periodFilter } = useInvoices()
  return <span data-testid="pf">{JSON.stringify(periodFilter)}</span>
}
const pf = () => JSON.parse(screen.getByTestId('pf').textContent || '{}')

describe('normalizeDraft / labels', () => {
  it('refuses an empty custom range, swaps a reversed one, keeps the field', () => {
    expect(normalizeDraft({ k: 'custom' }).ok).toBe(false)
    expect(normalizeDraft({ k: 'custom', from: 'garbage' }).ok).toBe(false)
    const r = normalizeDraft({ k: 'custom', from: '2026-10-20', to: '2026-10-01', field: 'invoice' })
    expect(r).toEqual({ ok: true, value: { k: 'custom', from: '2026-10-01', to: '2026-10-20', field: 'invoice' } })
    expect(normalizeDraft({ k: 'period', ym: '' })).toMatchObject({ ok: true, value: { k: 'period' } })
  })

  it('human labels', () => {
    expect(rangeText({ k: 'all' })).toBe('ทุกช่วงเวลา')
    expect(rangeText({ k: 'custom', from: '2026-10-01', to: '2026-10-01' })).toBe('01 ต.ค. 2026')
    expect(rangeText({ k: 'custom', from: '2026-10-01' })).toBe('ตั้งแต่ 01 ต.ค. 2026')
    expect(summaryOf({ k: 'month', field: 'invoice' })).toMatch(/^วันที่ในใบแจ้งหนี้ · เดือนนี้ · /)
  })
})

describe('DateRangeTool', () => {
  it('shows the applied field + range on the trigger, panel renders in <body> (never clipped)', async () => {
    const { container } = await mount(<><DateRangeTool /><Probe /></>)
    const btn = container.querySelector('.drt-btn') as HTMLButtonElement
    expect(btn.textContent).toContain('วันที่เข้าระบบ')
    act(() => btn.click())
    const pop = document.body.querySelector('.apop.drt-pop') as HTMLElement
    expect(pop).not.toBeNull()
    expect(container.contains(pop)).toBe(false)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })

  it('a preset applies at once with the chosen field', async () => {
    const { container } = await mount(<><DateRangeTool /><Probe /></>)
    act(() => (container.querySelector('.drt-btn') as HTMLButtonElement).click())
    act(() => screen.getByRole('radio', { name: 'วันที่ในใบแจ้งหนี้' }).click())
    act(() => screen.getByRole('button', { name: '7 วันล่าสุด' }).click())
    expect(pf()).toMatchObject({ k: '7d', field: 'invoice' })
    expect(document.body.querySelector('.drt-pop')).toBeNull()
    expect((container.querySelector('.drt-btn') as HTMLElement).textContent).toContain('วันที่ในใบแจ้งหนี้')
  })

  it('custom range is a draft: nothing changes until "ใช้ตัวกรอง"; Esc cancels', async () => {
    const { container } = await mount(<><DateRangeTool /><Probe /></>)
    const before = pf()
    act(() => (container.querySelector('.drt-btn') as HTMLButtonElement).click())
    act(() => {
      fireEvent.change(screen.getByLabelText('ตั้งแต่วันที่'), { target: { value: '2026-10-20' } })
      fireEvent.change(screen.getByLabelText('ถึงวันที่'), { target: { value: '2026-10-01' } })
    })
    expect(pf()).toEqual(before)
    expect(screen.getByText(/ระบบจะสลับให้/)).toBeDefined()
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' })
    })
    expect(pf()).toEqual(before)

    act(() => (container.querySelector('.drt-btn') as HTMLButtonElement).click())
    act(() => {
      fireEvent.change(screen.getByLabelText('ตั้งแต่วันที่'), { target: { value: '2026-10-20' } })
      fireEvent.change(screen.getByLabelText('ถึงวันที่'), { target: { value: '2026-10-01' } })
    })
    act(() => screen.getByRole('button', { name: /ใช้ตัวกรอง/ }).click())
    expect(pf()).toMatchObject({ k: 'custom', from: '2026-10-01', to: '2026-10-20' })
  })

  it('✕ clears only the range and keeps the field', async () => {
    const { container } = await mount(<><DateRangeTool /><Probe /></>)
    act(() => (container.querySelector('.drt-btn') as HTMLButtonElement).click())
    act(() => screen.getByRole('radio', { name: 'วันที่สร้างเอกสาร' }).click())
    act(() => screen.getByRole('button', { name: 'เดือนนี้' }).click())
    act(() => screen.getByRole('button', { name: /ล้างช่วงวันที่/ }).click())
    expect(pf()).toEqual({ k: 'all', field: 'created' })
    expect(container.querySelector('.drt-clear')).toBeNull()
  })
})

describe('no-cut text in the queue', () => {
  it('every truncatable line carries its full text as a tooltip', async () => {
    const d = { ...INITIAL_DOCS[0], vendor: 'A VERY LONG SUPPLIER NAME THAT CANNOT FIT INTO 360 PX CO., LTD.' }
    const { container } = await mount(<QueueListItem doc={d} isSelected={false} onClick={() => {}} />)
    expect(container.querySelector('.qi .v')!.getAttribute('title')).toBe(d.vendor)
    expect(container.querySelector('.qi .r2 .fit2')!.getAttribute('title')).toContain(`PO ${d.po}`)
  })
})
