/**
 * F5 / F6 — the 3-state evidence button in the detail pane, and the dock banner / status bar.
 * Uses real Engine results (temp/paperless_invoices_v5) mapped through the adapter.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { render, act, fireEvent } from '@testing-library/react'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { EvidenceButton } from '../components/evidence/EvidenceButton'
import { FindingBanner } from '../components/evidence/FindingBanner'
import { FindingStatusBar } from '../components/evidence/FindingStatusBar'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { USERS } from '../mock/users'
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import { portalDocToInvoiceDoc } from '../features/engine/adapters/portalDocToInvoiceDoc'
import { documentFindings } from '../features/evidence/findings'
import type { Finding, InvoiceDoc } from '../types/invoice'

const DIR = path.resolve(process.cwd(), 'temp/paperless_invoices_v5')
const doc = (id: string): InvoiceDoc =>
  portalDocToInvoiceDoc(
    transformEngineResultToPortalDoc(JSON.parse(fs.readFileSync(path.join(DIR, `${id}_result.json`), 'utf-8'))),
    { includeBoxes: true },
  )
const ACC = { ...(USERS.find(u => u.role === 'ACC') ?? USERS[0]), co: ['ALL'] }

type Ctx = ReturnType<typeof useInvoices>
function Monitor({ onState }: { onState: (c: Ctx) => void }) {
  onState(useInvoices())
  return null
}
function Providers({ children, onState }: { children: React.ReactNode; onState?: (c: Ctx) => void }) {
  return (
    <AuthProvider initialUser={ACC}>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>
              {onState && <Monitor onState={onState} />}
              {children}
            </SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

describe('F5: EvidenceButton', () => {
  const d27 = doc('DMS-27')
  const located = documentFindings(d27).find(f => f.targets.length > 1)!
  const unlocated = documentFindings(doc('DMS-123')).find(f => f.targets.length === 0)!

  it('located: solid button with the page and the box count', () => {
    const { container } = render(<EvidenceButton finding={located} onOpen={() => {}} />)
    const b = container.querySelector('button.evbtn')!
    expect(b.classList.contains('loc')).toBe(true)
    expect(b.getAttribute('data-state')).toBe('located')
    expect(b.textContent).toContain(`หน้า ${located.targets[0].pageNo}`)
    expect(b.textContent).toContain(`${located.targets.length} กล่อง`)
  })

  it('unlocated: dashed button that says there is no position', () => {
    const { container } = render(<EvidenceButton finding={unlocated} onOpen={() => {}} />)
    const b = container.querySelector('button.evbtn')!
    expect(b.classList.contains('noloc')).toBe(true)
    expect(b.textContent).toContain('ไม่มีตำแหน่ง')
  })

  it('none: renders nothing', () => {
    const { container } = render(<EvidenceButton finding={null} onOpen={() => {}} />)
    expect(container.innerHTML).toBe('')
  })

  it('click reports the finding and does not bubble to the card', () => {
    const got: Finding[] = []
    let bubbled = false
    const { container } = render(
      <div onClick={() => (bubbled = true)}>
        <EvidenceButton finding={located} onOpen={f => got.push(f)} />
      </div>,
    )
    fireEvent.click(container.querySelector('button.evbtn')!)
    expect(got.map(f => f.id)).toEqual([located.id])
    expect(bubbled).toBe(false)
  })
})

describe('F5: detail pane', () => {
  it('DMS-27: V-07 lists its findings (5 shown, the rest behind "แสดงอีก")', async () => {
    const d = doc('DMS-27')
    render(
      <Providers>
        <InvoiceDetailPane doc={d} onOpenActionModal={() => {}} />
      </Providers>,
    )
    const card = document.querySelector('.exc[data-rule="V-07"]')!
    expect(card.querySelectorAll('.fnd').length).toBe(5)
    const more = card.querySelector('.fnd-more button') as HTMLButtonElement
    expect(more.textContent).toContain('แสดงอีก 5 รายการ')
    await act(async () => fireEvent.click(more))
    expect(card.querySelectorAll('.fnd').length).toBe(10)
  })

  it('a passed rule never gets a button; there is no "ดูหลักฐานหน้า" link left', () => {
    const d = doc('DMS-27')
    render(
      <Providers>
        <InvoiceDetailPane doc={d} onOpenActionModal={() => {}} />
      </Providers>,
    )
    for (const r of d.rules.filter(x => x.status === 'PASS')) {
      expect(document.querySelector(`.exc[data-rule="${r.rule}"]`)).toBeNull()
    }
    expect(document.body.textContent).not.toContain('ดูหลักฐานหน้า')
  })

  it('a manual_review rule has a card with no fake E01', () => {
    const d = [100, 101, 102, 103, 104, 105].map(n => doc(`DMS-${n}`)).find(x => x.rules.some(r => r.status === 'WARN'))!
    render(
      <Providers>
        <InvoiceDetailPane doc={d} onOpenActionModal={() => {}} />
      </Providers>,
    )
    const r = d.rules.find(x => x.status === 'WARN')!
    const card = document.querySelector(`.exc[data-rule="${r.rule}"]`)!
    expect(card).not.toBeNull()
    expect(card.querySelector('.exc-h .code')!.textContent).toBe(r.exception_code ?? 'ต้องตรวจ')
  })

  it('DMS-123: the unlocated button opens the dock without a page', async () => {
    let ctx: Ctx | null = null
    const d = doc('DMS-123')
    render(
      <Providers onState={c => (ctx = c)}>
        <InvoiceDetailPane doc={d} onOpenActionModal={() => {}} />
      </Providers>,
    )
    const btn = document.querySelector('.exc[data-rule="V-01"] button.evbtn.noloc') as HTMLButtonElement
    expect(btn).not.toBeNull()
    await act(async () => fireEvent.click(btn))
    expect(ctx!.isEvidenceDockOpen).toBe(true)
    expect(ctx!.evidenceDockFocus?.locatable).toBe(false)
    expect(ctx!.evidenceDockFocus?.page).toBeUndefined()
  })
})

describe('F6: banner and status bar', () => {
  it('banner shows reason, actual and expected, never blank', () => {
    const f = documentFindings(doc('DMS-40'))[0]
    const { container } = render(<FindingBanner finding={f} />)
    const text = container.textContent ?? ''
    expect(text).toContain('ไม่พบตำแหน่งบนเอกสาร')
    expect(text).toContain('ค่าที่ได้')
    expect(text).toContain('—')
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
  })

  it('status bar steps boxes and findings', () => {
    const f = documentFindings(doc('DMS-27')).find(x => x.targets.length > 1)!
    const steps: string[] = []
    const { container } = render(
      <FindingStatusBar
        finding={f}
        targetIdx={0}
        position={1}
        total={14}
        onStepTarget={d => steps.push(`t${d}`)}
        onStepFinding={d => steps.push(`f${d}`)}
      />,
    )
    expect(container.textContent).toContain(`1/${f.targets.length}`)
    expect(container.textContent).toContain('รายการ 2/14')
    const buttons = container.querySelectorAll('.ev-nav button')
    fireEvent.click(buttons[1])
    fireEvent.click(buttons[3])
    expect(steps).toEqual(['t1', 'f1'])
  })
})
