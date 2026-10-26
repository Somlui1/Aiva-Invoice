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
    await prisma.document.deleteMany({ where: { id: docId } })
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
})
