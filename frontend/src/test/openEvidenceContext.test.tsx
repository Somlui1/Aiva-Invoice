/**
 * F4 — `openEvidence()` in the invoice context.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import type { Finding } from '../types/invoice'

type Ctx = ReturnType<typeof useInvoices>

function Monitor({ onState }: { onState: (c: Ctx) => void }) {
  onState(useInvoices())
  return null
}

function mount() {
  const ref: { ctx: Ctx | null } = { ctx: null }
  render(
    <AuthProvider>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>
              <Monitor onState={c => (ref.ctx = c)} />
            </SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>,
  )
  return ref
}

const located: Finding = {
  id: 'X2', ruleId: 'V-07', kind: 'exception', result: 'fail', code: 'E11', severity: 'Medium',
  messageTh: 'm', actual: null, expected: null, relatedElementIds: [], oracleRefs: [],
  targets: [
    { id: 'D1:D1-L5', elementId: 'D1-L5', pageNo: 3, bbox: [0.1, 0.2, 0.5, 0.03], kind: 'row', label: 'L5' },
    { id: 'D1:D1-L5-qty', elementId: 'D1-L5-qty', pageNo: 4, bbox: [0.4, 0.2, 0.05, 0.03], kind: 'cell', label: 'L5 · qty' },
  ],
}
const unlocated: Finding = { ...located, id: 'X7', ruleId: 'V-01', code: 'E01', targets: [], missingReason: 'NOT_PRESENT' }

describe('F4: openEvidence', () => {
  it('a located finding opens the split dock on the chosen box page and marks the finding', async () => {
    const ref = mount()
    await act(async () => ref.ctx!.openEvidence(located, 1))
    expect(ref.ctx!.isEvidenceDockOpen).toBe(true)
    expect(ref.ctx!.viewMode).toBe('split')
    expect(ref.ctx!.evidenceDockFocus).toMatchObject({ page: 4, findingId: 'X2', targetIdx: 1, locatable: true })
    expect(ref.ctx!.evidenceSelection).toMatchObject({ ruleId: 'V-07', findingId: 'X2', exceptionCode: 'E11', lineNo: 5, locatable: true })
  })

  it('an unlocated finding opens the dock but asks for no page', async () => {
    const ref = mount()
    await act(async () => ref.ctx!.openEvidence(unlocated))
    expect(ref.ctx!.isEvidenceDockOpen).toBe(true)
    expect(ref.ctx!.evidenceDockFocus?.page).toBeUndefined()
    expect(ref.ctx!.evidenceDockFocus?.locatable).toBe(false)
    expect(ref.ctx!.evidenceSelection).toMatchObject({ findingId: 'X7', locatable: false })
  })

  it('asking for the same finding twice changes the nonce (the dock scrolls again)', async () => {
    const ref = mount()
    await act(async () => ref.ctx!.openEvidence(located))
    const first = ref.ctx!.evidenceDockFocus!.nonce
    await act(async () => ref.ctx!.openEvidence(located))
    expect(ref.ctx!.evidenceDockFocus!.nonce).toBeGreaterThan(first)
  })

  it('closing the dock clears focus and selection', async () => {
    const ref = mount()
    await act(async () => ref.ctx!.openEvidence(located))
    await act(async () => ref.ctx!.closeEvidenceDock())
    expect(ref.ctx!.evidenceDockFocus).toBeNull()
    expect(ref.ctx!.evidenceSelection).toBeNull()
  })

  it('the legacy openEvidenceDock(page, rule) still works', async () => {
    const ref = mount()
    await act(async () => ref.ctx!.openEvidenceDock(2, 'V-03'))
    expect(ref.ctx!.evidenceDockFocus).toMatchObject({ page: 2, ruleId: 'V-03', locatable: true })
    expect(ref.ctx!.evidenceDockFocus?.findingId).toBeUndefined()
  })
})
