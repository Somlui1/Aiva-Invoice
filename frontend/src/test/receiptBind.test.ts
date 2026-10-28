/**
 * v5.11 — "ผูกใบรับ" end to end (real Express app, real Prisma / SQLite test database), plus DR-06 at
 * ingest. The Oracle receipt source is replaced by an in-memory provider.
 *
 * Documents are built from the DMS-100 Engine fixture exactly like businessKeyIngest.test.ts does.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser } from './helpers/session'
import { setReceiptLookupProvider, type ReceiptLookupProvider, type ReceiptRecord } from '../server/receiptLookup'

const app = createExpressApp()
const FIXTURE = fs.readFileSync(path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json'), 'utf-8')

let seq = 0
const created: string[] = []
const newId = () => {
  const id = `DMS-93${String(++seq).padStart(5, '0')}`
  created.push(id)
  return id
}
const sha = (s: string) => 'sha256:' + createHash('sha256').update(`${s}#${++seq}`).digest('hex')

type Rec = 'AUTO_PASS' | 'REVIEW' | 'HOLD' | 'MANUAL_REVIEW'

/** Ingest one Engine result for (tax, inv) with receipt `receipt` (null = Oracle found none). */
async function ingest(tax: string, inv: string, receipt: string | null, rec: Rec) {
  const raw = JSON.parse(FIXTURE)
  const id = newId()
  raw.request.validation_id = `VAL-RB-${id}`
  raw.request.validation_round = 1
  raw.request.dms_doc_id = id
  raw.package.dms_doc_id = id
  raw.package.package_id = `PKG-${id}`
  raw.package.file_sha256 = sha(id)
  raw.normalized_fields.supplier_tax_id = tax
  raw.normalized_fields.invoice_num = inv
  raw.oracle_snapshot.receipt_nums = receipt ? [receipt] : []
  raw.recommendation = { value: rec, max_severity: rec === 'AUTO_PASS' ? 'None' : 'Medium', exception_codes: [], reasons: [], halted_by: null }
  raw.exceptions = []
  const res = await request(app).post('/api/engine/ingest').send(raw)
  expect(res.status, JSON.stringify(res.body)).toBe(200)
  return { id, body: res.body }
}

const row = (id: string) => prisma.document.findUnique({ where: { id } })

const receipt = (over: Partial<ReceiptRecord> = {}): ReceiptRecord => ({
  receiveId: 'RB-RCV-1',
  receiptDate: '2026-10-10',
  supplierTaxId: '0990000000001',
  supplierName: 'ผู้ขายทดสอบ',
  invoiceNum: 'RB-INV-1',
  companyCode: 'AH',
  receiverName: 'K.Tester',
  poNumbers: ['PO-RB-1'],
  lines: [
    { poNumber: 'PO-RB-1', receiptNum: 'RB-RCV-1', lineNo: 1, rcvLineId: 'RB-RCV-1-1', itemDesc: 'ชิ้นส่วน A', qty: 2, uom: 'PCS', unitPrice: 100, lineAmount: 200 },
  ],
  ...over,
})

/** In-memory provider: `receipts` answer every (tax, invoice) query; `po` maps PO → suppliers. */
function fakeProvider(receipts: ReceiptRecord[], po: Record<string, { supplierTaxId: string; supplierName: string }[]> = {}): ReceiptLookupProvider {
  return {
    name: 'test',
    suppliersByPo: async p => po[p] ?? [],
    findReceipts: async q => receipts.filter(r => r.supplierTaxId === q.supplierTaxId && (r.invoiceNum ?? '').toUpperCase() === q.invoiceNum),
  }
}

beforeEach(() => setReceiptLookupProvider(null))
afterEach(async () => {
  setReceiptLookupProvider(null)
  const ids = created.splice(0)
  if (!ids.length) return
  await prisma.auditLog.deleteMany({ where: { docId: { in: ids } } })
  await prisma.document.deleteMany({ where: { id: { in: ids } } })
})

const lookup = async (id: string, body: object, cookie?: string) =>
  request(app).post(`/api/documents/${id}/receipt-lookup`).set('Cookie', cookie ?? (await asUser('u4', 'ACC', { name: 'ปณิดา รักงาน' }))).send(body)
const bind = async (id: string, body: object, cookie?: string) =>
  request(app).post(`/api/documents/${id}/bind-receipt`).set('Cookie', cookie ?? (await asUser('u4', 'ACC', { name: 'ปณิดา รักงาน' }))).send(body)

// =========================================================================== DR-06 at ingest

describe('ingest — 1 invoice = 1 receive_id', () => {
  it('DR-06: a second invoice on an already used receive_id is a Duplicate, the first is untouched', async () => {
    const a = await ingest('0990000000101', 'RB-A', 'RB-RCV-06', 'REVIEW')
    const b = await ingest('0990000000101', 'RB-B', 'RB-RCV-06', 'AUTO_PASS')
    expect(b.body).toMatchObject({ status: 'Duplicate', applied_rule: 'DR-06', duplicate_of: a.id })
    expect((await row(a.id))?.status).toBe('Review')
  })

  it('the same invoice under another receive_id is the same document (DR-01 supersedes the worse one)', async () => {
    const a = await ingest('0990000000102', 'RB-C', 'RB-RCV-07', 'HOLD')
    const b = await ingest('0990000000102', 'RB-C', 'RB-RCV-08', 'REVIEW')
    expect(b.body).toMatchObject({ applied_rule: 'DR-01', supersedes: a.id })
    expect((await row(a.id))?.status).toBe('Superseded')
  })
})

// =========================================================================== bind

describe('ผูกใบรับ', () => {
  it('without a configured source the lookup says so (503) and nothing changes', async () => {
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    const res = await lookup(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1' })
    expect(res.status).toBe(503)
    expect(res.body.code).toBe('LOOKUP_UNAVAILABLE')
  })

  it('preview shows the receipt lines and the outcome; bind confirms at once and writes the receipt', async () => {
    setReceiptLookupProvider(fakeProvider([receipt()]))
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    expect((await row(d.id))?.identityStatus).toBe('NOT_FOUND')

    const pv = await lookup(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1' })
    expect(pv.status).toBe(200)
    expect(pv.body.receipt.receiveId).toBe('RB-RCV-1')
    expect(pv.body.receipt.lines).toHaveLength(1)
    expect(pv.body.receipt.total).toBe(200)
    expect(pv.body.outcome).toMatchObject({ newStatus: 'Confirmed', duplicateOf: null, supersede: [] })
    expect((await row(d.id))?.status).toBe('Hold') // preview writes nothing

    const res = await bind(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1', reason: 'ตรวจด้วยตาแล้ว', expectedReceiveId: 'RB-RCV-1', expectedStatus: 'Confirmed' })
    expect(res.status, JSON.stringify(res.body)).toBe(200)
    expect(res.body.toStatus).toBe('Confirmed')

    const after = (await row(d.id))!
    expect(after).toMatchObject({ status: 'Confirmed', identityStatus: 'RESOLVED', receiveId: 'RB-RCV-1', receiptNum: 'RB-RCV-1', receiverName: 'K.Tester', confirmedBy: 'u4' })
    const p = JSON.parse(after.payloadJson)
    expect(p).toMatchObject({ status: 'Confirmed', receiptFound: true, receiptNums: ['RB-RCV-1'], receiptTotal: 200 })
    expect(p.oracleReceiptLines).toHaveLength(1)
    expect(p.history.at(-1).act).toContain('Confirm โดยผูกใบรับ')
    expect(await prisma.auditLog.findFirst({ where: { docId: d.id, action: 'BIND_RECEIPT' } })).not.toBeNull()
  })

  it('PO leads to the supplier when there is no tax id', async () => {
    setReceiptLookupProvider(fakeProvider([receipt()], { 'PO-RB-1': [{ supplierTaxId: '0990000000001', supplierName: 'ผู้ขายทดสอบ' }] }))
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    const pv = await lookup(d.id, { invoiceNum: 'RB-INV-1', poNumber: 'PO-RB-1' })
    expect(pv.status).toBe(200)
    expect(pv.body.supplierFromPo).toBe(true)
  })

  it('an open document already on that receipt becomes Superseded; the bound one is Confirmed', async () => {
    setReceiptLookupProvider(fakeProvider([receipt()]))
    const open = await ingest('0990000000001', 'RB-OTHER', 'RB-RCV-1', 'REVIEW') // same receipt, other invoice
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    const pv = await lookup(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1' })
    expect(pv.body.outcome.supersede).toEqual([{ id: open.id, status: 'Review' }])
    const res = await bind(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1', reason: 'x', expectedReceiveId: 'RB-RCV-1', expectedStatus: 'Confirmed' })
    expect(res.status).toBe(200)
    expect((await row(open.id))).toMatchObject({ status: 'Superseded', supersededById: d.id })
    expect((await row(d.id))?.status).toBe('Confirmed')
  })

  it('a receipt already held in the AP flow makes the bound document a Duplicate', async () => {
    setReceiptLookupProvider(fakeProvider([receipt()]))
    const held = await ingest('0990000000001', 'RB-OTHER', 'RB-RCV-1', 'AUTO_PASS')
    await prisma.document.update({ where: { id: held.id }, data: { status: 'Posted', isLocked: true } })
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    const pv = await lookup(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1' })
    expect(pv.body.outcome).toMatchObject({ newStatus: 'Duplicate', duplicateOf: { id: held.id, status: 'Posted' } })
    const res = await bind(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1', reason: 'x', expectedReceiveId: 'RB-RCV-1', expectedStatus: 'Duplicate' })
    expect(res.status).toBe(200)
    expect(await row(d.id)).toMatchObject({ status: 'Duplicate', duplicateOfId: held.id })
  })

  it('the outcome changed since the preview → 409, nothing written', async () => {
    setReceiptLookupProvider(fakeProvider([receipt()]))
    const held = await ingest('0990000000001', 'RB-OTHER', 'RB-RCV-1', 'AUTO_PASS')
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    // preview said Confirmed (held was open → superseded); meanwhile it got Confirmed
    await prisma.document.update({ where: { id: held.id }, data: { status: 'Confirmed' } })
    const res = await bind(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1', reason: 'x', expectedReceiveId: 'RB-RCV-1', expectedStatus: 'Confirmed' })
    expect(res.status).toBe(409)
    expect((await row(d.id))?.status).toBe('Hold')
  })

  it('the browser receive_id is only compared, never trusted', async () => {
    setReceiptLookupProvider(fakeProvider([receipt()]))
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    const res = await bind(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1', reason: 'x', expectedReceiveId: 'SOMETHING-ELSE' })
    expect(res.status).toBe(409)
    expect((await row(d.id))?.receiveId).toBeNull()
  })

  it('several receipts for one invoice → refused as abnormal data (no choosing)', async () => {
    setReceiptLookupProvider(fakeProvider([receipt(), receipt({ receiveId: 'RB-RCV-2' })]))
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    const res = await lookup(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1' })
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('MULTIPLE')
  })

  it('a receipt of another supplier than the document is refused', async () => {
    setReceiptLookupProvider(fakeProvider([receipt({ supplierTaxId: '0990000000999' })]))
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    const res = await lookup(d.id, { supplierTaxId: '0990000000999', invoiceNum: 'RB-INV-1' })
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('SUPPLIER_MISMATCH')
  })

  it('a document that already has a receipt cannot be bound; reason is required', async () => {
    setReceiptLookupProvider(fakeProvider([receipt()]))
    const has = await ingest('0990000000001', 'RB-HAS', 'RB-RCV-9', 'REVIEW')
    expect((await lookup(has.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1' })).status).toBe(422)
    const d = await ingest('0990000000001', 'RB-INV-1', null, 'HOLD')
    expect((await bind(d.id, { supplierTaxId: '0990000000001', invoiceNum: 'RB-INV-1', reason: '  ', expectedReceiveId: 'RB-RCV-1' })).status).toBe(400)
  })
})
