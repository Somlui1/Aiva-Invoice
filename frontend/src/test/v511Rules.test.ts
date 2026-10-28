/**
 * v5.11 pure rules: the shared transition table, UI ↔ server parity, the batch receive_id partition
 * and the Oracle callback outcome. No database.
 */
import { describe, expect, it } from 'vitest'
import { canBindReceipt, transitionFor, type WorkflowAction } from '../lib/docTransitions'
import { allowedActionFor } from '../lib/queueFilters'
import { partitionBatch, receiveIdOf, type ReceiveHolder } from '../server/receiveIdGuard'
import { callbackOutcome } from '../server/apCallback'
import type { InvoiceDoc } from '../types/invoice'

const ACTIONS: WorkflowAction[] = ['confirm', 'review', 'hold', 'reject', 'unconfirm', 'returnf']
const STATUSES = ['Auto-pass', 'Review', 'Hold', 'Manual Review', 'Duplicate', 'Superseded', 'Rejected', 'Confirmed', 'Sent', 'Posted', 'Import Failed']

describe('transitionFor — one table for buttons and server', () => {
  const t = (status: string, action: WorkflowAction, hasReceipt = true, role = 'APR', identityStatus: string | null = 'RESOLVED') =>
    transitionFor({ status, hasReceipt, role, identityStatus }, action)

  it('Duplicate: Reject only', () => {
    for (const a of ACTIONS) expect(t('Duplicate', a).ok, a).toBe(a === 'reject')
  })

  it('Superseded / Rejected / Sent / Posted: nothing', () => {
    for (const s of ['Superseded', 'Rejected', 'Sent', 'Posted']) for (const a of ACTIONS) expect(t(s, a).ok, `${s} ${a}`).toBe(false)
  })

  it('Manual Review → Confirmed directly, APR / ADM only, receipt required', () => {
    expect(t('Manual Review', 'confirm')).toEqual({ ok: true, to: 'Confirmed', reasonRequired: true })
    expect(t('Manual Review', 'confirm', true, 'ACC')).toMatchObject({ ok: false, http: 403 })
    expect(t('Manual Review', 'confirm', false)).toMatchObject({ ok: false })
  })

  it('Hold with a receipt → Confirm with reason; without → Reject only', () => {
    expect(t('Hold', 'confirm', true, 'ACC')).toEqual({ ok: true, to: 'Confirmed', reasonRequired: true })
    expect(t('Hold', 'confirm', false, 'ACC')).toMatchObject({ ok: false, why: 'ไม่มี Receiver: Reject เท่านั้น' })
    expect(t('Hold', 'reject', false, 'ACC').ok).toBe(true)
  })

  it('no receipt → no Confirm from any status', () => {
    for (const s of STATUSES) expect(t(s, 'confirm', false).ok, s).toBe(false)
  })

  it('UNRESOLVED: APR Reject only', () => {
    expect(t('Manual Review', 'reject', false, 'APR', 'UNRESOLVED').ok).toBe(true)
    expect(t('Manual Review', 'confirm', false, 'APR', 'UNRESOLVED').ok).toBe(false)
    expect(t('Manual Review', 'reject', false, 'ACC', 'UNRESOLVED')).toMatchObject({ ok: false, http: 403 })
  })

  it('EU: nothing', () => {
    for (const a of ACTIONS) expect(t('Review', a, true, 'EU')).toMatchObject({ ok: false, http: 403 })
  })
})

describe('UI parity: an enabled button is a transition the server accepts', () => {
  const doc = (status: string, rcv: string, identityStatus?: string) =>
    ({ doc: 'DMS-1', status, rcv, receiver: rcv === '—' ? undefined : 'R', receiverActive: true, identityStatus, codes: [], rules: [] }) as unknown as InvoiceDoc

  for (const status of STATUSES)
    for (const rcv of ['RCV-1', '—'])
      for (const action of ACTIONS)
        it(`${status} · ${rcv === '—' ? 'no receipt' : 'receipt'} · ${action}`, () => {
          const ui = allowedActionFor(doc(status, rcv), action, { role: 'APR', can: () => true })
          const server = transitionFor({ status, hasReceipt: rcv !== '—', role: 'APR', identityStatus: null }, action)
          expect(ui.ok).toBe(server.ok)
        })
})

describe('canBindReceipt', () => {
  it('only an open document without a receipt', () => {
    expect(canBindReceipt({ status: 'Hold', hasReceipt: false }).ok).toBe(true)
    expect(canBindReceipt({ status: 'Manual Review', identityStatus: 'UNRESOLVED', hasReceipt: false }).ok).toBe(true)
    expect(canBindReceipt({ status: 'Review', hasReceipt: true }).ok).toBe(false)
    for (const s of ['Duplicate', 'Superseded', 'Rejected', 'Confirmed', 'Sent', 'Posted', 'Import Failed']) {
      expect(canBindReceipt({ status: s, hasReceipt: false }).ok, s).toBe(false)
    }
    expect(canBindReceipt({ status: 'Hold', hasReceipt: false, isLocked: true }).ok).toBe(false)
  })
})

describe('partitionBatch — one receive_id per batch / AP flow', () => {
  const h = (id: string, receiveId: string | null, confirmedAt: string | null, status = 'Confirmed'): ReceiveHolder => ({
    id,
    status,
    receiveId,
    receiptNum: null,
    confirmedAt,
  })

  it('different receive_ids all go', () => {
    expect(partitionBatch([h('A', 'R1', '2026-10-01'), h('B', 'R2', '2026-10-02')], [])).toEqual({ send: ['A', 'B'], duplicates: [] })
  })

  it('same receive_id in the batch: the earlier Confirm goes, the other is Duplicate of it', () => {
    const p = partitionBatch([h('B', 'R1', '2026-10-02'), h('A', 'R1', '2026-10-01')], [])
    expect(p.send).toEqual(['A'])
    expect(p.duplicates).toEqual([{ id: 'B', duplicateOf: 'A', receiveId: 'R1' }])
  })

  it('a holder already Sent / Posted outside the batch wins over any Confirm', () => {
    const p = partitionBatch([h('A', 'R1', '2026-10-01')], [h('X', 'R1', '2026-10-05', 'Posted')])
    expect(p).toEqual({ send: [], duplicates: [{ id: 'A', duplicateOf: 'X', receiveId: 'R1' }] })
  })

  it('a Confirmed holder outside the batch wins only if it was Confirmed earlier', () => {
    expect(partitionBatch([h('A', 'R1', '2026-10-01')], [h('X', 'R1', '2026-10-05')]).send).toEqual(['A'])
    expect(partitionBatch([h('A', 'R1', '2026-10-09')], [h('X', 'R1', '2026-10-05')]).send).toEqual([])
  })

  it('a legacy row without a receive_id is not this guard’s call', () => {
    expect(partitionBatch([h('A', null, null)], []).send).toEqual(['A'])
  })

  it('receiveIdOf falls back to the receipt number and normalises', () => {
    expect(receiveIdOf({ receiveId: null, receiptNum: ' rcv-1 ' })).toBe('RCV-1')
  })
})

describe('callbackOutcome', () => {
  it('reads result, falls back to success, rejects anything else', () => {
    expect(callbackOutcome({ result: 'SUCCESS' })).toBe('SUCCESS')
    expect(callbackOutcome({ result: 'already_exists' })).toBe('ALREADY_EXISTS')
    expect(callbackOutcome({ result: 'ERROR', errorCode: '404' })).toBe('ERROR')
    expect(callbackOutcome({ success: true })).toBe('SUCCESS')
    expect(callbackOutcome({ success: false })).toBe('ERROR')
    expect(callbackOutcome({ result: 'MAYBE', success: true })).toBeNull()
    expect(callbackOutcome({})).toBeNull()
    expect(callbackOutcome(null)).toBeNull()
  })
})
