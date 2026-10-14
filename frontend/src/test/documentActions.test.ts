import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '../app/api/documents/[id]/actions/route'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'

describe('Document Actions Mutation API', () => {
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
    const req = new NextRequest('http://localhost/api/documents/DMS-NONEXIST/actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'confirm', reason: 'ทดสอบ' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'DMS-NONEXIST' }) })
    expect(res.status).toBe(404)
  })

  it('rejects action when document is locked with 423 Locked', async () => {
    await prisma.document.update({ where: { id: docId }, data: { isLocked: true } })
    const req = new NextRequest(`http://localhost/api/documents/${docId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action: 'confirm', reason: 'ทดสอบ' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: docId }) })
    expect(res.status).toBe(423)
    const data = await res.json()
    expect(data.error).toContain('ล็อก')
  })

  it('rejects confirm when role is EU with 403 Forbidden', async () => {
    const req = new NextRequest(`http://localhost/api/documents/${docId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action: 'confirm', reason: 'ผู้รับของพยายามกดยืนยัน' }),
      headers: { 'x-user-id': 'u1', 'x-user-role': 'EU', 'x-user-name': encodeURIComponent('สมศักดิ์ ใจดี') },
    })
    const res = await POST(req, { params: Promise.resolve({ id: docId }) })
    expect(res.status).toBe(403)
  })

  it('confirms document and writes AuditLog row in atomic transaction', async () => {
    const req = new NextRequest(`http://localhost/api/documents/${docId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action: 'confirm', reason: 'PO ตรงกับใบรับ' }),
      headers: { 'x-user-id': 'u4', 'x-user-role': 'ACC', 'x-user-name': encodeURIComponent('ปณิดา รักงาน') },
    })
    const res = await POST(req, { params: Promise.resolve({ id: docId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.document.status).toBe('Confirmed')

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
    const req = new NextRequest(`http://localhost/api/documents/${docId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action: 'hold', reason: 'รอยืนยันใบรับของรอบสอง', note: 'ติดต่อคุณสมศักดิ์แล้ว' }),
      headers: { 'x-user-id': 'u4', 'x-user-role': 'ACC', 'x-user-name': encodeURIComponent('ปณิดา รักงาน') },
    })
    const res = await POST(req, { params: Promise.resolve({ id: docId }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.document.status).toBe('Hold')

    const updatedDoc = await prisma.document.findUnique({ where: { id: docId } })
    expect(updatedDoc?.status).toBe('Hold')
  })

  it('rejects invalid action transition', async () => {
    // Current status is Auto-pass, unconfirm is only allowed from Confirmed
    const req = new NextRequest(`http://localhost/api/documents/${docId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action: 'unconfirm', reason: 'ยกเลิก' }),
      headers: { 'x-user-id': 'u6', 'x-user-role': 'APR', 'x-user-name': encodeURIComponent('สมชาย วงศ์ทอง') },
    })
    const res = await POST(req, { params: Promise.resolve({ id: docId }) })
    expect(res.status).toBe(422)
  })
})
