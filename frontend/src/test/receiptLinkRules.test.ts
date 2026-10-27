/**
 * v5.11 Phase 1 — Confirm + ผูกใบรับ: the shared rule set (src/lib/receiptLink.ts).
 */
import { describe, expect, it } from 'vitest'
import {
  canOpenLink,
  evaluateConfirm,
  findSameInvoice,
  parseMoney,
  receiptsSentToAp,
  receiptUsage,
  type EvaluateArgs,
  type LinkDocFacts,
  type OracleReceipt,
} from '../lib/receiptLink'
import { explainScope } from '../lib/docScope'

const RCV: OracleReceipt = {
  receiptNum: '50220043288',
  orgId: 195,
  companyCode: 'AHT',
  ouName: 'Aapico Hitech Tooling',
  supplierName: 'KONECRANES',
  supplierTaxId: '0105517000907',
  receiver: 'AHT Die Making 03, K.Vinitda Jitpilai',
  poNumbers: ['42051905'],
  lines: [
    { rcvLineId: '50220043288-1', lineNo: 1, poNumber: '42051905', itemCode: 'MSP1', itemDesc: 'DRIVE SHAFT', qty: 1, uom: 'PCS', unitPrice: 23100, lineAmount: 23100 },
    { rcvLineId: '50220043288-2', lineNo: 2, poNumber: '42051905', itemCode: null, itemDesc: 'SERVICE', qty: 1, uom: 'LOT', unitPrice: 9000, lineAmount: 9000 },
  ],
  total: 32100,
}

const DOC: LinkDocFacts = {
  id: 'DMS-1',
  status: 'Review',
  identityStatus: 'NOT_FOUND',
  companyCode: 'AHT',
  supplierTaxId: '0105517000907',
  supplierName: 'KONECRANES',
  invoiceNum: 'INV-001',
  grandTotal: 34347,
  subtotal: 32100,
  vat: 2247,
  codes: [],
  euPending: false,
  engineReceiptNum: null,
}

const args = (over: Partial<EvaluateArgs> = {}, doc: Partial<LinkDocFacts> = {}): EvaluateArgs => ({
  doc: { ...DOC, ...doc },
  actor: { role: 'ACC', companies: ['AHT'] },
  input: { receiptNum: '50220043288', reasonCode: 'OCR_RCV_UNREADABLE' },
  lookup: { state: 'found', receipt: RCV, source: 'oracle' },
  sameInvoiceCandidates: [],
  onReceipt: [],
  pairs: [],
  ...over,
})

describe('status / role', () => {
  it('Superseded / Duplicate / Import Failed / closed can never be confirmed', () => {
    for (const status of ['Superseded', 'Duplicate', 'Import Failed', 'Confirmed', 'Sent', 'Posted', 'Rejected']) {
      const e = evaluateConfirm(args({}, { status }))
      expect(e.canConfirm, status).toBe(false)
      expect(canOpenLink('APR', { status, identityStatus: null, companyCode: 'AH' }).ok).toBe(false)
    }
  })

  it('every other engine status can be confirmed (with a reason)', () => {
    for (const status of ['Review', 'Hold']) expect(evaluateConfirm(args({}, { status })).canConfirm, status).toBe(true)
    const ap = evaluateConfirm(args({ input: { receiptNum: '50220043288' } }, { status: 'Auto-pass' }))
    expect(ap.requireReason).toBe(false)
    expect(ap.canConfirm).toBe(true)
  })

  it('Manual Review / UNRESOLVED / unknown company → APR only', () => {
    const mr = evaluateConfirm(args({}, { status: 'Manual Review' }))
    expect(mr.requireApr).toBe(true)
    expect(mr.canConfirm).toBe(false)
    expect(evaluateConfirm(args({ actor: { role: 'APR', companies: ['AHT'] } }, { status: 'Manual Review' })).canConfirm).toBe(true)
    expect(evaluateConfirm(args({}, { identityStatus: 'UNRESOLVED' })).requireApr).toBe(true)
    expect(canOpenLink('ACC', { status: 'Review', identityStatus: 'UNRESOLVED', companyCode: 'AHT' }).ok).toBe(false)
    expect(canOpenLink('APR', { status: 'Review', identityStatus: 'UNRESOLVED', companyCode: 'AHT' }).ok).toBe(true)
    expect(canOpenLink('EU', { status: 'Review', identityStatus: null, companyCode: 'AHT' }).ok).toBe(false)
  })
})

describe('reason / note', () => {
  it('not Auto-pass → reason from the list; OTHER needs text', () => {
    expect(evaluateConfirm(args({ input: { receiptNum: '50220043288' } })).missing).toContain('เหตุผล')
    expect(evaluateConfirm(args({ input: { receiptNum: '50220043288', reasonCode: 'NOPE' } })).canConfirm).toBe(false)
    const other = evaluateConfirm(args({ input: { receiptNum: '50220043288', reasonCode: 'OTHER', reasonText: '' } }))
    expect(other.canConfirm).toBe(false)
    expect(evaluateConfirm(args({ input: { receiptNum: '50220043288', reasonCode: 'OTHER', reasonText: 'ผู้ขายยืนยันทางโทรศัพท์' } })).canConfirm).toBe(true)
  })

  it('a High code → note required', () => {
    const a = args({}, { codes: [{ code: 'E10', severity: 'High' }] })
    expect(evaluateConfirm(a).requireNote).toBe(true)
    expect(evaluateConfirm(a).canConfirm).toBe(false)
    expect(evaluateConfirm({ ...a, input: { ...a.input, note: 'ตรวจกับต้นฉบับแล้ว' } }).canConfirm).toBe(true)
  })

  it('EU still has to fix → accounting may skip, with a reason', () => {
    const e = evaluateConfirm(args({ input: { receiptNum: '50220043288' } }, { status: 'Review', euPending: true }))
    expect(e.requireReason).toBe(true)
    expect(e.gates.some(g => g.key === 'eu_pending' && g.level === 'warn')).toBe(true)
  })
})

describe('receipt rules', () => {
  it('not found / Oracle down / none → cannot confirm', () => {
    expect(evaluateConfirm(args({ lookup: { state: 'not_found', receiptNum: 'X1234' } })).canConfirm).toBe(false)
    const down = evaluateConfirm(args({ lookup: { state: 'unavailable', error: 'timeout' } }))
    expect(down.canConfirm).toBe(false)
    expect(down.missing.join()).toContain('Oracle')
    expect(evaluateConfirm(args({ lookup: { state: 'none' }, input: { reasonCode: 'NO_RCV_ON_DOC' } })).missing).toContain('เลขใบรับ')
  })

  it('receipt of another company → refused', () => {
    const e = evaluateConfirm(args({}, { companyCode: 'AH' }))
    expect(e.gates.find(g => g.key === 'company_mismatch')?.level).toBe('block')
    expect(e.canConfirm).toBe(false)
  })

  it('receipt outside the actor companies → refused', () => {
    expect(evaluateConfirm(args({ actor: { role: 'ACC', companies: ['AH'] } }, { companyCode: 'AHT' })).canConfirm).toBe(false)
  })

  it('supplier Tax ID differs → warning + reason required (even for Auto-pass)', () => {
    const e = evaluateConfirm(args({ input: { receiptNum: '50220043288' } }, { status: 'Auto-pass', supplierTaxId: '0999999999999' }))
    expect(e.gates.find(g => g.key === 'supplier_mismatch')?.level).toBe('warn')
    expect(e.requireReason).toBe(true)
    expect(e.canConfirm).toBe(false)
  })

  it('amount differs → highlight + note', () => {
    const e = evaluateConfirm(args({}, { subtotal: 32000 }))
    expect(e.amountDiff).toBe(-100)
    expect(e.requireNote).toBe(true)
    expect(e.canConfirm).toBe(false)
  })

  it('qty / price differs on a paired line → note', () => {
    const e = evaluateConfirm(args({ pairs: [{ inv: { no: 1, qty: 2, price: 23100, amount: 46200 }, rcv: RCV.lines[0] }] }))
    expect(e.lineDiffs.map(d => d.field).sort()).toEqual(['amount', 'qty'])
    expect(e.requireNote).toBe(true)
  })

  it('receipt typed by a person is flagged', () => {
    expect(evaluateConfirm(args()).receiptManual).toBe(true)
    expect(evaluateConfirm(args({}, { engineReceiptNum: '50220043288' })).receiptManual).toBe(false)
  })
})

describe('duplicates + cumulative', () => {
  const row = (docId: string, status: string, over: Partial<{ invoiceNum: string; supplierTaxId: string; amount: number }> = {}) => ({
    docId,
    status,
    invoiceNum: over.invoiceNum ?? 'INV-001',
    supplierTaxId: over.supplierTaxId ?? '0105517000907',
    amount: over.amount ?? 32100,
  })

  it('same invoice + supplier in AP flow → refused, offer close as duplicate', () => {
    const e = evaluateConfirm(args({ sameInvoiceCandidates: [row('DMS-9', 'Posted', { invoiceNum: ' inv-001 ' })] }))
    expect(e.duplicateOf).toBe('DMS-9')
    expect(e.canConfirm).toBe(false)
    // other supplier, or not yet in AP flow → not a duplicate
    expect(findSameInvoice({ id: 'DMS-1', invoiceNum: 'INV-001', supplierTaxId: '0105517000907' }, [row('DMS-8', 'Review'), row('DMS-7', 'Sent', { supplierTaxId: '1' })])).toEqual([])
  })

  it('same receipt, other invoice → allowed + "ใบรับนี้ใช้แล้วกับ"', () => {
    const e = evaluateConfirm(args({ input: { receiptNum: '50220043288', reasonCode: 'RCV_LATE' }, onReceipt: [row('DMS-5', 'Confirmed', { invoiceNum: 'INV-000', amount: 0 })] }))
    expect(e.gates.some(g => g.msg.includes('ใบรับนี้ใช้แล้วกับ DMS-5'))).toBe(true)
    expect(e.canConfirm).toBe(true)
  })

  it('cumulative over the receipt total → APR only + note', () => {
    const on = [row('DMS-5', 'Sent', { invoiceNum: 'INV-000', amount: 100 })]
    const acc = evaluateConfirm(args({ onReceipt: on }))
    expect(acc.requireApr).toBe(true)
    expect(acc.canConfirm).toBe(false)
    const apr = evaluateConfirm(args({ actor: { role: 'APR', companies: ['AHT'] }, onReceipt: on, input: { receiptNum: '50220043288', reasonCode: 'RCV_LATE', note: 'รับของเพิ่มแล้ว' } }))
    expect(apr.canConfirm).toBe(true)
    expect(receiptUsage('DMS-1', [...on, row('DMS-6', 'Review', { amount: 999 })]).total).toBe(100)
  })

  it('queue badge: receipt already Sent / Posted', () => {
    const s = receiptsSentToAp([{ doc: 'A', rcv: ' 50220043288', status: 'Posted' }, { doc: 'B', rcv: 'X9999', status: 'Review' }])
    expect([...s]).toEqual(['50220043288'])
  })
})

describe('route D: unknown company / no amounts', () => {
  const d = { companyCode: '?', supplierTaxId: '', supplierName: '', invoiceNum: '', grandTotal: 0, subtotal: null, vat: null, status: 'Manual Review' }
  const apr = { role: 'APR', companies: ['AHT'] }

  it('company + supplier come from the receipt only after the person accepts', () => {
    const e = evaluateConfirm(args({ actor: apr, input: { receiptNum: '50220043288', reasonCode: 'HANDWRITING' } }, d))
    expect(e.missing).toContain('ยืนยันบริษัทจากใบรับ')
    expect(e.missing).toContain('ยืนยันผู้ขายจากใบรับ')
    expect(e.requireApr).toBe(true)
  })

  it('invoice number + total typed twice; receipt total is never used as the invoice total', () => {
    const base = { receiptNum: '50220043288', reasonCode: 'HANDWRITING', acceptReceiptCompany: true, acceptReceiptSupplier: true, note: 'ตรวจกับต้นฉบับ' }
    const noTotal = evaluateConfirm(args({ actor: apr, input: { ...base, manual: { invoiceNum: 'A1', invoiceNumConfirm: 'A1' } } }, d))
    expect(noTotal.effective.grandTotal).toBeNull()
    expect(noTotal.canConfirm).toBe(false)
    const mismatch = evaluateConfirm(args({ actor: apr, input: { ...base, manual: { invoiceNum: 'A1', invoiceNumConfirm: 'A1', grandTotal: '34,347', grandTotalConfirm: '34347.5' } } }, d))
    expect(mismatch.canConfirm).toBe(false)
    const ok = evaluateConfirm(args({ actor: apr, input: { ...base, manual: { invoiceNum: 'A1', invoiceNumConfirm: 'A1', grandTotal: '34,347.00', grandTotalConfirm: '34347' } } }, { ...d, vat: 2247 }))
    expect(ok.effective).toMatchObject({ companyCode: 'AHT', companyFromReceipt: true, supplierFromReceipt: true, invoiceNum: 'A1', grandTotal: 34347 })
    expect(ok.canConfirm).toBe(true)
  })

  it('receipt outside the APR companies → refused', () => {
    const e = evaluateConfirm(args({ actor: { role: 'APR', companies: ['AH'] }, input: { receiptNum: '50220043288', acceptReceiptCompany: true } }, d))
    expect(e.gates.some(g => g.key === 'rcv_scope')).toBe(true)
  })

  it('scope: APR sees unknown-company documents, ACC / EU do not', () => {
    expect(explainScope({ company: '?' }, { role: 'APR', companies: ['AH'], accounts: [] }).ok).toBe(true)
    expect(explainScope({ company: '?' }, { role: 'ACC', companies: ['AH'], accounts: [] }).ok).toBe(false)
    expect(explainScope({ company: '?' }, { role: 'EU', companies: ['AH'], accounts: [] }).ok).toBe(false)
    expect(explainScope({ company: '?' }, { role: 'SA', companies: [], accounts: [] }).ok).toBe(true)
  })

  it('parseMoney', () => {
    expect(parseMoney('1,234.50')).toBe(1234.5)
    expect(parseMoney('฿ 10')).toBe(10)
    expect(parseMoney('12a')).toBeNull()
    expect(parseMoney('')).toBeNull()
  })
})
