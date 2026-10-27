/**
 * v5.11 Phase 1 — Confirm + ผูกใบรับ API (server/routes/receiptLink.ts + /actions changes).
 * Oracle is replaced by __setReceiptLookupForTests (no MCP in tests).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser } from './helpers/session'
import { __setReceiptLookupForTests } from '../server/receiptLink/oracleReceipts'
import type { OracleReceipt } from '../lib/receiptLink'

const app = createExpressApp()
const IDS = ['DMS-9101', 'DMS-9102', 'DMS-9103', 'DMS-9104']

const RCV: OracleReceipt = {
  receiptNum: 'RCV91010',
  orgId: 195,
  companyCode: 'AHT',
  ouName: 'AHT',
  supplierName: 'SUP',
  supplierTaxId: '0105517000907',
  receiver: 'AHT Die Making 03',
  poNumbers: ['PO1'],
  lines: [{ rcvLineId: 'RCV91010-1', lineNo: 1, poNumber: 'PO1', itemCode: null, itemDesc: 'A', qty: 1, uom: 'PCS', unitPrice: 1000, lineAmount: 1000 }],
  total: 1000,
}

function payload(id: string, over: Record<string, unknown> = {}) {
  return JSON.stringify({
    id,
    rules: [],
    bboxes: [],
    lineItems: [{ no: 1, desc: 'A', qty: 1, unit: 'PCS', price: 1000, amount: 1000 }],
    receiptNums: [],
    subtotal: 1000,
    vat: 70,
    history: [],
    ...over,
  })
}

async function seed(id: string, over: Record<string, any> = {}) {
  const { payloadOver, ...cols } = over
  await prisma.document.create({
    data: {
      id,
      dmsDocId: id.replace('DMS-', ''),
      packageId: 'PKG',
      fileSha256: 'sha',
      pageCount: 1,
      invoiceNum: 'INV-91',
      invoiceDate: '2026-10-20',
      companyCode: 'AHT',
      supplierTaxId: '0105517000907',
      supplierName: 'SUP',
      grandTotal: 1070,
      status: 'Review',
      recommendation: 'REVIEW',
      maxSeverity: 'LOW',
      payloadJson: payload(id, payloadOver),
      ...cols,
    },
  })
}

async function open(id: string, cookie: string) {
  const r = await request(app).get(`/api/documents/${id}/link`).set('Cookie', cookie)
  expect(r.status).toBe(200)
  return r.body.version as string
}

beforeEach(async () => {
  __setReceiptLookupForTests(async n => ({ ok: true, source: 'oracle_mcp', receipt: n === RCV.receiptNum ? RCV : null }))
  await prisma.auditLog.deleteMany({ where: { docId: { in: IDS } } })
  await prisma.document.deleteMany({ where: { id: { in: IDS } } })
})
afterAll(() => __setReceiptLookupForTests(null))

describe('GET /api/receipts/:num', () => {
  it('ACC gets receipts of its companies only; EU is refused; Oracle down = 503', async () => {
    const acc = await asUser('rl-acc', 'ACC', { companies: ['AHT'] })
    expect((await request(app).get('/api/receipts/RCV91010').set('Cookie', acc)).body.receipt.total).toBe(1000)
    const other = await asUser('rl-acc2', 'ACC', { companies: ['AH'] })
    expect((await request(app).get('/api/receipts/RCV91010').set('Cookie', other)).status).toBe(403)
    expect((await request(app).get('/api/receipts/NOPE1').set('Cookie', acc)).status).toBe(404)
    const eu = await asUser('rl-eu', 'EU', { companies: ['AHT'] })
    expect((await request(app).get('/api/receipts/RCV91010').set('Cookie', eu)).status).toBe(403)
    __setReceiptLookupForTests(async () => ({ ok: false, code: 'ORACLE_UNAVAILABLE', error: 'down' }))
    expect((await request(app).get('/api/receipts/RCV91010').set('Cookie', acc)).status).toBe(503)
  })
})

describe('POST /api/documents/:id/link', () => {
  it('confirm outside Auto-pass: needs a reason, then writes columns + payload + audit', async () => {
    await seed('DMS-9101')
    const acc = await asUser('rl-acc', 'ACC', { name: 'บัญชี A', companies: ['AHT'] })
    const version = await open('DMS-9101', acc)
    const noReason = await request(app).post('/api/documents/DMS-9101/link').set('Cookie', acc).send({ op: 'confirm', version, receiptNum: 'RCV91010' })
    expect(noReason.status).toBe(422)
    expect(noReason.body.code).toBe('NOT_READY')

    const ok = await request(app)
      .post('/api/documents/DMS-9101/link')
      .set('Cookie', acc)
      .send({ op: 'confirm', version, receiptNum: 'RCV91010', reasonCode: 'OCR_RCV_UNREADABLE' })
    expect(ok.status).toBe(200)
    const row = await prisma.document.findUnique({ where: { id: 'DMS-9101' } })
    expect(row).toMatchObject({
      status: 'Confirmed',
      receiptNum: 'RCV91010',
      receiverName: 'AHT Die Making 03',
      receiptManual: true,
      confirmOutsideAutopass: true,
      confirmReasonCode: 'OCR_RCV_UNREADABLE',
      engineStatus: 'Review',
      confirmedBy: 'rl-acc',
    })
    const p = JSON.parse(row!.payloadJson)
    expect(p.confirmMeta).toMatchObject({ statusAtConfirm: 'Review', outsideAutoPass: true, receiptManual: true, byName: 'บัญชี A' })
    const audit = await prisma.auditLog.findFirst({ where: { docId: 'DMS-9101', action: 'LINK_CONFIRM' } })
    expect(audit?.toStatus).toBe('Confirmed')
  })

  it('409 when the document changed after the screen was opened', async () => {
    await seed('DMS-9101')
    const acc = await asUser('rl-acc', 'ACC', { companies: ['AHT'] })
    const version = await open('DMS-9101', acc)
    await new Promise(r => setTimeout(r, 5))
    await prisma.document.update({ where: { id: 'DMS-9101' }, data: { supplierName: 'changed' } })
    const res = await request(app).post('/api/documents/DMS-9101/link').set('Cookie', acc).send({ op: 'save', version, receiptNum: 'RCV91010' })
    expect(res.status).toBe(409)
    expect(res.body.code).toBe('STALE')
  })

  it('receipt not found → cannot confirm; other company → refused on save', async () => {
    await seed('DMS-9101')
    await seed('DMS-9102', { companyCode: 'AH' })
    const acc = await asUser('rl-acc', 'ACC', { companies: ['AHT', 'AH'] })
    const v1 = await open('DMS-9101', acc)
    const nf = await request(app).post('/api/documents/DMS-9101/link').set('Cookie', acc).send({ op: 'confirm', version: v1, receiptNum: 'NOPE1', reasonCode: 'RCV_LATE' })
    expect(nf.status).toBe(422)
    const v2 = await open('DMS-9102', acc)
    const other = await request(app).post('/api/documents/DMS-9102/link').set('Cookie', acc).send({ op: 'save', version: v2, receiptNum: 'RCV91010' })
    expect(other.status).toBe(422)
    expect(other.body.code).toBe('RECEIPT_REFUSED')
  })

  it('duplicate in AP → refused with link; close_duplicate → Duplicate', async () => {
    await seed('DMS-9103', { status: 'Posted', receiptNum: 'RCV91010' })
    await seed('DMS-9101')
    const acc = await asUser('rl-acc', 'ACC', { companies: ['AHT'] })
    const version = await open('DMS-9101', acc)
    const dup = await request(app).post('/api/documents/DMS-9101/link').set('Cookie', acc).send({ op: 'confirm', version, receiptNum: 'RCV91010', reasonCode: 'RCV_LATE' })
    expect(dup.status).toBe(409)
    expect(dup.body).toMatchObject({ code: 'DUPLICATE_IN_AP', duplicateOf: 'DMS-9103' })
    const close = await request(app).post('/api/documents/DMS-9101/link').set('Cookie', acc).send({ op: 'close_duplicate', version, receiptNum: 'RCV91010' })
    expect(close.status).toBe(200)
    expect(await prisma.document.findUnique({ where: { id: 'DMS-9101' } })).toMatchObject({ status: 'Duplicate', duplicateOfId: 'DMS-9103', drRule: 'MANUAL' })
    // the original is never touched
    expect((await prisma.document.findUnique({ where: { id: 'DMS-9103' } }))?.status).toBe('Posted')
  })

  it('Manual Review / unknown company: ACC refused, APR allowed; manual values stored apart from OCR', async () => {
    await seed('DMS-9104', { status: 'Manual Review', companyCode: '?', invoiceNum: '', grandTotal: 0, supplierTaxId: '', supplierName: '', payloadOver: { subtotal: 0, vat: 0 } })
    const acc = await asUser('rl-acc', 'ACC', { companies: ['AHT'] })
    expect((await request(app).get('/api/documents/DMS-9104/link').set('Cookie', acc)).status).toBe(403)
    const apr = await asUser('rl-apr', 'APR', { companies: ['AHT'] })
    const version = await open('DMS-9104', apr)
    const res = await request(app)
      .post('/api/documents/DMS-9104/link')
      .set('Cookie', apr)
      .send({
        op: 'confirm',
        version,
        receiptNum: 'RCV91010',
        reasonCode: 'HANDWRITING',
        note: 'ตรวจกับต้นฉบับแล้ว',
        acceptReceiptCompany: true,
        acceptReceiptSupplier: true,
        manual: { invoiceNum: 'H-1', invoiceNumConfirm: 'H-1', grandTotal: '1000', grandTotalConfirm: '1000' },
      })
    expect(res.status).toBe(200)
    const row = await prisma.document.findUnique({ where: { id: 'DMS-9104' } })
    expect(row).toMatchObject({ status: 'Confirmed', companyCode: 'AHT', supplierTaxId: '0105517000907', invoiceNum: '', grandTotal: 0, hasManualValues: true })
    const mv = JSON.parse(row!.payloadJson).manualValues
    expect(mv.map((m: any) => [m.field, m.value, m.ocrValue])).toEqual([
      ['invoiceNum', 'H-1', null],
      ['grandTotal', 1000, null],
    ])
  })

  it('SA "view as" cannot write (PREVIEW_READ_ONLY)', async () => {
    await seed('DMS-9101')
    const sa = await asUser('rl-sa', 'SA')
    const res = await request(app).post('/api/documents/DMS-9101/link').set('Cookie', sa).set('X-View-As', 'role:ACC;co=AHT').send({ op: 'save', version: 'x'.repeat(24) })
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('PREVIEW_READ_ONLY')
  })
})

describe('/actions confirm (quick path)', () => {
  it('Review → USE_LINK_SCREEN; Auto-pass duplicate in AP → 409', async () => {
    await seed('DMS-9101')
    const acc = await asUser('rl-acc', 'ACC', { companies: ['AHT'] })
    const r1 = await request(app).post('/api/documents/DMS-9101/actions').set('Cookie', acc).send({ action: 'confirm', reason: 'x' })
    expect(r1.status).toBe(422)
    expect(r1.body.code).toBe('USE_LINK_SCREEN')
    await seed('DMS-9102', { status: 'Auto-pass', recommendation: 'AUTO_PASS' })
    await seed('DMS-9103', { status: 'Sent' })
    const r2 = await request(app).post('/api/documents/DMS-9102/actions').set('Cookie', acc).send({ action: 'confirm', reason: 'x' })
    expect(r2.status).toBe(409)
    expect(r2.body.duplicateOf).toBe('DMS-9103')
  })
})
