import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser } from './helpers/session'

describe('Document Actions Mutation API', () => {
  const app = createExpressApp()
  const docId = 'DMS-ACTION-TEST'

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { docId } })
    await prisma.document.deleteMany({ where: { OR: [{ id: docId }, { receiveId: 'RCV-ACT-01' }] } })
    await prisma.document.create({
      data: {
        id: docId,
        dmsDocId: '88801',
        packageId: 'PKG-ACT',
        fileSha256: 'sha888',
        pageCount: 1,
        invoiceNum: 'INV-ACT-01',
        invoiceDate: '2026-10-14',
        companyCode: 'AH',
        supplierTaxId: '0107539000244',
        supplierName: 'AAPICO',
        grandTotal: 1000.0,
        status: 'Auto-pass',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'LOW',
        // v5.11: Confirm needs a receipt (an Auto-pass from the Engine always has one).
        identityStatus: 'RESOLVED',
        receiveId: 'RCV-ACT-01',
        receiptNum: 'RCV-ACT-01',
        payloadJson: JSON.stringify({ history: [] }),
      },
    })
  })

  it('rejects action when document does not exist with 404', async () => {
    const res = await request(app)
      .post('/api/documents/DMS-NONEXIST/actions')
      .set('Cookie', await asUser('u4', 'ACC', { name: 'ปณิดา รักงาน' }))
      .send({ action: 'confirm', reason: 'ทดสอบ' })
    expect(res.status).toBe(404)
  })

  it('rejects action when document is locked with 423 Locked', async () => {
    await prisma.document.update({ where: { id: docId }, data: { isLocked: true } })
    const res = await request(app)
      .post(`/api/documents/${docId}/actions`)
      .set('Cookie', await asUser('u4', 'ACC', { name: 'ปณิดา รักงาน' }))
      .send({ action: 'confirm', reason: 'ทดสอบ' })
    expect(res.status).toBe(423)
    expect(res.body.error).toContain('ล็อก')
  })

  it('v5.5: no session = 401, and x-user-* headers are not a session', async () => {
    const anon = await request(app).post(`/api/documents/${docId}/actions`).send({ action: 'confirm', reason: 'x' })
    expect(anon.status).toBe(401)
    const forged = await request(app)
      .post(`/api/documents/${docId}/actions`)
      .set('x-user-id', 'u6')
      .set('x-user-role', 'SA')
      .send({ action: 'confirm', reason: 'x' })
    expect(forged.status).toBe(401)
    expect((await prisma.document.findUnique({ where: { id: docId } }))?.status).toBe('Auto-pass')
  })

  it('rejects confirm when role is EU with 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/actions`)
      .set('Cookie', await asUser('u1', 'EU', { name: 'สมศักดิ์ ใจดี' }))
      .send({ action: 'confirm', reason: 'ผู้รับของพยายามกดยืนยัน' })
    expect(res.status).toBe(403)
  })

  it('confirms document and writes AuditLog row in atomic transaction', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/actions`)
      .set('Cookie', await asUser('u4', 'ACC', { name: 'ปณิดา รักงาน' }))
      .send({ action: 'confirm', reason: 'PO ตรงกับใบรับ' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.document.status).toBe('Confirmed')

    // Verify DB update
    const updatedDoc = await prisma.document.findUnique({ where: { id: docId } })
    expect(updatedDoc?.status).toBe('Confirmed')
    expect(updatedDoc?.confirmedBy).toBe('u4')
    expect(updatedDoc?.confirmedAt).not.toBeNull()

    // Verify AuditLog written
    const audit = await prisma.auditLog.findFirst({ where: { docId } })
    expect(audit).not.toBeNull()
    expect(audit?.action).toBe('CONFIRM')
    expect(audit?.fromStatus).toBe('Auto-pass')
    expect(audit?.toStatus).toBe('Confirmed')
    expect(audit?.whoId).toBe('u4')
    expect(audit?.who).toBe('ปณิดา รักงาน')
  })

  it('handles hold action with mandatory reason', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/actions`)
      .set('Cookie', await asUser('u4', 'ACC', { name: 'ปณิดา รักงาน' }))
      .send({ action: 'hold', reason: 'รอยืนยันใบรับของรอบสอง', note: 'ติดต่อคุณสมศักดิ์แล้ว' })
    expect(res.status).toBe(200)
    expect(res.body.document.status).toBe('Hold')

    const updatedDoc = await prisma.document.findUnique({ where: { id: docId } })
    expect(updatedDoc?.status).toBe('Hold')
  })

  it('rejects invalid action transition', async () => {
    // Current status is Auto-pass, unconfirm is only allowed from Confirmed
    const res = await request(app)
      .post(`/api/documents/${docId}/actions`)
      .set('Cookie', await asUser('u6', 'APR', { name: 'สมชาย วงศ์ทอง' }))
      .send({ action: 'unconfirm', reason: 'ยกเลิก' })
    expect(res.status).toBe(422)
  })

  // ------------------------------------------------------------------ v5.11

  const other = 'DMS-ACTION-OTHER'
  const mkOther = async (data: Record<string, unknown>) => {
    await prisma.auditLog.deleteMany({ where: { docId: other } })
    await prisma.document.deleteMany({ where: { id: other } })
    await prisma.document.create({
      data: {
        id: other,
        dmsDocId: '88802',
        packageId: 'PKG-ACT-2',
        fileSha256: 'sha889',
        pageCount: 1,
        invoiceNum: 'INV-ACT-02',
        invoiceDate: '2026-10-14',
        companyCode: 'AH',
        supplierTaxId: '0107539000244',
        supplierName: 'AAPICO',
        grandTotal: 1000.0,
        status: 'Auto-pass',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'LOW',
        identityStatus: 'RESOLVED',
        receiveId: 'RCV-ACT-01',
        receiptNum: 'RCV-ACT-01',
        payloadJson: JSON.stringify({ history: [] }),
        ...data,
      },
    })
  }
  const acc = () => asUser('u4', 'ACC', { name: 'ปณิดา รักงาน' })
  const apr = () => asUser('u6', 'APR', { name: 'สมชาย วงศ์ทอง' })
  const act = async (id: string, body: Record<string, unknown>, cookie?: string) =>
    request(app).post(`/api/documents/${id}/actions`).set('Cookie', cookie ?? (await acc())).send(body)

  for (const holder of ['Confirmed', 'Sent', 'Posted', 'Import Failed']) {
    it(`receive_id guard: Confirm is refused (409) while another document is ${holder} with the same receive_id`, async () => {
      await mkOther({ status: holder, isLocked: holder === 'Sent' || holder === 'Posted' })
      const res = await act(docId, { action: 'confirm', reason: 'x' })
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('RECEIVE_ID_HELD')
      expect(res.body.heldBy).toBe(other)
      expect((await prisma.document.findUnique({ where: { id: docId } }))?.status).toBe('Auto-pass')
    })
  }

  it('receive_id guard: a Rejected / Superseded / Duplicate row does not hold the receive_id', async () => {
    for (const status of ['Rejected', 'Superseded', 'Duplicate']) {
      await mkOther({ status })
      await prisma.document.update({ where: { id: docId }, data: { status: 'Auto-pass', confirmedAt: null } })
      expect((await act(docId, { action: 'confirm', reason: 'x' })).status, status).toBe(200)
    }
  })

  it('receive_id guard: a legacy row that only has the receipt number still holds it', async () => {
    await mkOther({ status: 'Posted', isLocked: true, receiveId: null, identityStatus: null, receiptNum: 'RCV-ACT-01' })
    expect((await act(docId, { action: 'confirm', reason: 'x' })).status).toBe(409)
  })

  it('two Confirms of one receive_id at the same moment: exactly one wins', async () => {
    await mkOther({ status: 'Review' })
    const [a, b] = await Promise.all([act(docId, { action: 'confirm', reason: 'x' }), act(other, { action: 'confirm', reason: 'x' })])
    expect([a.status, b.status].sort()).toEqual([200, 409])
    const confirmed = await prisma.document.count({ where: { id: { in: [docId, other] }, status: 'Confirmed' } })
    expect(confirmed).toBe(1)
  })

  it('Confirm needs a receipt: without one it is refused and points to "ผูกใบรับ"', async () => {
    await prisma.document.update({ where: { id: docId }, data: { receiveId: null, receiptNum: null, identityStatus: 'NOT_FOUND' } })
    const res = await act(docId, { action: 'confirm', reason: 'x' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('ผูกใบรับ')
  })

  it('Duplicate: Reject only — Confirm is refused, Reject works; dup_override no longer exists', async () => {
    await prisma.document.update({ where: { id: docId }, data: { status: 'Duplicate' } })
    expect((await act(docId, { action: 'confirm', reason: 'x' }, await apr())).status).toBe(422)
    expect((await act(docId, { action: 'dup_override', reason: 'x' }, await apr())).status).toBe(400)
    const rj = await act(docId, { action: 'reject', reason: 'ซ้ำ' })
    expect(rj.status).toBe(200)
    expect(rj.body.toStatus).toBe('Rejected')
  })

  it('Superseded: nothing is allowed', async () => {
    await prisma.document.update({ where: { id: docId }, data: { status: 'Superseded' } })
    for (const action of ['confirm', 'reject', 'review', 'hold']) {
      expect((await act(docId, { action, reason: 'x' }, await apr())).status, action).toBe(423)
    }
  })

  it('Manual Review decided as pass goes straight to Confirmed (APR), and ACC cannot decide it', async () => {
    await prisma.document.update({ where: { id: docId }, data: { status: 'Manual Review' } })
    expect((await act(docId, { action: 'confirm', reason: 'x' })).status).toBe(403)
    const res = await act(docId, { action: 'confirm', reason: 'ตรวจแล้วผ่าน' }, await apr())
    expect(res.status).toBe(200)
    expect(res.body.toStatus).toBe('Confirmed')
    // legacy alias still means the same thing
    await prisma.document.update({ where: { id: docId }, data: { status: 'Manual Review', confirmedAt: null } })
    expect((await act(docId, { action: 'manual_review', reason: 'x' }, await apr())).body.toStatus).toBe('Confirmed')
  })

  it('Hold with a receipt can be Confirmed directly (reason required); Hold without one cannot', async () => {
    await prisma.document.update({ where: { id: docId }, data: { status: 'Hold' } })
    expect((await act(docId, { action: 'confirm', reason: '', note: '' })).status).toBe(400)
    const ok = await act(docId, { action: 'confirm', reason: 'ตรวจลายเซ็นแล้ว' })
    expect(ok.status).toBe(200)
    expect(ok.body.toStatus).toBe('Confirmed')

    await prisma.document.update({ where: { id: docId }, data: { status: 'Hold', receiveId: null, receiptNum: null, identityStatus: 'NOT_FOUND' } })
    expect((await act(docId, { action: 'confirm', reason: 'x' })).status).toBe(422)
  })
})
