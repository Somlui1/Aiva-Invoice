import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser } from './helpers/session'

describe('Oracle AP Batch Staging & Locking Pipeline', () => {
  const app = createExpressApp()
  const doc1Id = 'DMS-AP-TEST-01'
  const doc2Id = 'DMS-AP-TEST-02'

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { docId: { in: [doc1Id, doc2Id] } } })
    await prisma.document.deleteMany({ where: { id: { in: [doc1Id, doc2Id] } } })
    await prisma.apBatch.deleteMany({ where: { id: { startsWith: 'AP-TEST' } } })

    await prisma.document.createMany({
      data: [
        {
          id: doc1Id,
          dmsDocId: '90001',
          packageId: 'PKG-AP-1',
          fileSha256: 'sha90001',
          pageCount: 1,
          invoiceNum: 'INV-AP-01',
          invoiceDate: '2026-10-14',
          companyCode: 'AH',
          supplierTaxId: '0107539000244',
          supplierName: 'AAPICO',
          grandTotal: 15000.0,
          status: 'Confirmed',
          confirmedBy: 'u4',
          confirmedAt: new Date('2026-10-14T10:00:00Z'),
          recommendation: 'AUTO_PASS',
          maxSeverity: 'LOW',
          isLocked: false,
          payloadJson: JSON.stringify({ history: [] }),
        },
        {
          id: doc2Id,
          dmsDocId: '90002',
          packageId: 'PKG-AP-2',
          fileSha256: 'sha90002',
          pageCount: 1,
          invoiceNum: 'INV-AP-02',
          invoiceDate: '2026-10-14',
          companyCode: 'AH',
          supplierTaxId: '0107539000244',
          supplierName: 'AAPICO',
          grandTotal: 25000.0,
          status: 'Confirmed',
          confirmedBy: 'u4',
          confirmedAt: new Date('2026-10-14T10:00:00Z'),
          recommendation: 'REVIEW',
          maxSeverity: 'MEDIUM',
          isLocked: false,
          payloadJson: JSON.stringify({ history: [] }),
        },
      ],
    })
  })

  it('rejects batch creation when user role is not authorized (EU)', async () => {
    const res = await request(app)
      .post('/api/ap/batches')
      .set('Cookie', await asUser('u1', 'EU', { name: 'สมศักดิ์ ใจดี' }))
      .send({
        documentIds: [doc1Id],
        companyCode: 'AH',
      })

    expect(res.status).toBe(403)
  })

  it('creates AP batch, locks documents with Sent status, and records audit log', async () => {
    const res = await request(app)
      .post('/api/ap/batches')
      .set('Cookie', await asUser('u6', 'APR', { name: 'สมชาย วงศ์ทอง' }))
      .send({
        batchId: 'AP-TEST-001',
        documentIds: [doc1Id, doc2Id],
        companyCode: 'AH',
      })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.batch.id).toBe('AP-TEST-001')
    expect(res.body.batch.status).toBe('SENT')
    expect(res.body.batch.totalDocs).toBe(2)
    expect(res.body.batch.totalAmount).toBe(40000.0)

    // Verify documents are locked and set to Sent
    const updatedDocs = await prisma.document.findMany({
      where: { id: { in: [doc1Id, doc2Id] } },
    })
    for (const d of updatedDocs) {
      expect(d.status).toBe('Sent')
      expect(d.isLocked).toBe(true)
      expect(d.lockedBy).toBe('u6')
      expect(d.apBatchId).toBe('AP-TEST-001')
    }

    // Verify audit logs
    const logs = await prisma.auditLog.findMany({
      where: { docId: { in: [doc1Id, doc2Id] } },
    })
    expect(logs.length).toBe(2)
    expect(logs[0].act).toContain('ส่งเข้า AP Interface')
  })

  it('lists existing batches via GET /api/ap/batches', async () => {
    await prisma.apBatch.create({
      data: {
        id: 'AP-TEST-EXISTING',
        status: 'SENT',
        totalDocs: 1,
        totalAmount: 5000.0,
        companyCode: 'AH',
        createdBy: 'u6',
        payloadJson: '[]',
      },
    })

    const res = await request(app).get('/api/ap/batches').set('Cookie', await asUser('u4', 'ACC'))
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    const found = res.body.batches.find((b: any) => b.id === 'AP-TEST-EXISTING')
    expect(found).toBeDefined()
    expect(found.totalAmount).toBe(5000.0)
  })

  it('processes batch callback, setting Posted on success and Import Failed on error', async () => {
    // First create batch
    await prisma.apBatch.create({
      data: {
        id: 'AP-TEST-CALLBACK',
        status: 'SENT',
        totalDocs: 2,
        totalAmount: 40000.0,
        companyCode: 'AH',
        createdBy: 'u6',
        payloadJson: '[]',
      },
    })
    await prisma.document.update({
      where: { id: doc1Id },
      data: { status: 'Sent', isLocked: true, apBatchId: 'AP-TEST-CALLBACK' },
    })
    await prisma.document.update({
      where: { id: doc2Id },
      data: { status: 'Sent', isLocked: true, apBatchId: 'AP-TEST-CALLBACK' },
    })

    // Now call callback route
    const res = await request(app)
      .post('/api/ap/batches/AP-TEST-CALLBACK/callback')
      .send({
        results: [
          {
            documentId: doc1Id,
            success: true,
            oracleInvoiceId: 'ORA-INV-1001',
          },
          {
            documentId: doc2Id,
            success: false,
            error: 'Tax ID mismatch with Oracle supplier master',
          },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.batch.status).toBe('PARTIAL')

    // Verify doc1 is Posted and remains locked
    const doc1 = await prisma.document.findUnique({ where: { id: doc1Id } })
    expect(doc1?.status).toBe('Posted')
    expect(doc1?.oracleInvoiceId).toBe('ORA-INV-1001')
    expect(doc1?.isLocked).toBe(true)

    // Verify doc2 is Import Failed and unlocked so it can be fixed/returned
    const doc2 = await prisma.document.findUnique({ where: { id: doc2Id } })
    expect(doc2?.status).toBe('Import Failed')
    expect(doc2?.importError).toBe('Tax ID mismatch with Oracle supplier master')
    expect(doc2?.isLocked).toBe(false)
  })
})
