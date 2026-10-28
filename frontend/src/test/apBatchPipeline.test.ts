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

  // ------------------------------------------------------------------ v5.11

  const sendBoth = async () => {
    await prisma.apBatch.create({
      data: { id: 'AP-TEST-V511', status: 'SENT', totalDocs: 2, totalAmount: 40000.0, companyCode: 'AH', createdBy: 'u6', payloadJson: '[]' },
    })
    await prisma.document.updateMany({
      where: { id: { in: [doc1Id, doc2Id] } },
      data: { status: 'Sent', isLocked: true, apBatchId: 'AP-TEST-V511' },
    })
  }
  const callback = (results: unknown[]) => request(app).post('/api/ap/batches/AP-TEST-V511/callback').send({ results })

  it('callback: ALREADY_EXISTS (posted outside the Portal) → Posted; ERROR keeps the error code → Import Failed', async () => {
    await sendBoth()
    const res = await callback([
      { documentId: doc1Id, result: 'ALREADY_EXISTS', oracleInvoiceId: 'ORA-EXIST-1' },
      { documentId: doc2Id, result: 'ERROR', errorCode: '404', error: 'Supplier site not found' },
    ])
    expect(res.status).toBe(200)
    expect(res.body.summary).toMatchObject({ success: 0, alreadyExists: 1, failure: 1, skipped: 0 })
    expect(res.body.batch.status).toBe('PARTIAL')

    const d1 = await prisma.document.findUnique({ where: { id: doc1Id } })
    expect(d1).toMatchObject({ status: 'Posted', isLocked: true, oracleInvoiceId: 'ORA-EXIST-1' })
    const p1 = JSON.parse(d1!.payloadJson)
    expect(p1.status).toBe('Posted')
    expect(p1.history.at(-1).act).toBe('พบว่าถูก Post ใน Oracle แล้ว')

    const d2 = await prisma.document.findUnique({ where: { id: doc2Id } })
    expect(d2).toMatchObject({ status: 'Import Failed', isLocked: false, importError: '[404] Supplier site not found' })
  })

  it('callback: ALREADY_EXISTS counts as success for the batch status', async () => {
    await sendBoth()
    const res = await callback([
      { documentId: doc1Id, result: 'SUCCESS', oracleInvoiceId: 'ORA-1' },
      { documentId: doc2Id, result: 'ALREADY_EXISTS' },
    ])
    expect(res.body.batch.status).toBe('SYNCED')
  })

  it('callback: a repeated or late result never downgrades a Posted document', async () => {
    await sendBoth()
    await callback([{ documentId: doc1Id, result: 'SUCCESS', oracleInvoiceId: 'ORA-1' }])
    const late = await callback([{ documentId: doc1Id, result: 'ERROR', errorCode: '500', error: 'late' }])
    expect(late.status).toBe(200)
    expect(late.body.summary.skipped).toBe(1)
    expect((await prisma.document.findUnique({ where: { id: doc1Id } }))?.status).toBe('Posted')
    const skipLog = await prisma.auditLog.findFirst({ where: { docId: doc1Id, action: 'oracle_ap_skip' } })
    expect(skipLog).not.toBeNull()
  })

  it('callback: a document of another batch is skipped; an unknown result value is skipped', async () => {
    await sendBoth()
    await prisma.document.update({ where: { id: doc2Id }, data: { apBatchId: 'AP-TEST-OTHER' } })
    const res = await callback([
      { documentId: doc1Id, result: 'MAYBE' },
      { documentId: doc2Id, result: 'SUCCESS' },
    ])
    expect(res.body.summary).toMatchObject({ skipped: 2, success: 0 })
    expect(res.body.batch.status).toBe('SENT') // nothing processed → batch untouched
  })

  it('batch guard: two Confirmed documents of one receive_id — the earlier Confirm is sent, the other becomes Duplicate', async () => {
    await prisma.document.update({ where: { id: doc1Id }, data: { receiveId: 'RCV-AP-1', receiptNum: 'RCV-AP-1', confirmedAt: new Date('2026-10-14T09:00:00Z') } })
    await prisma.document.update({ where: { id: doc2Id }, data: { receiveId: 'RCV-AP-1', receiptNum: 'RCV-AP-1', confirmedAt: new Date('2026-10-14T11:00:00Z') } })
    const res = await request(app)
      .post('/api/ap/batches')
      .set('Cookie', await asUser('u6', 'APR', { name: 'สมชาย วงศ์ทอง' }))
      .send({ batchId: 'AP-TEST-GUARD', documentIds: [doc1Id, doc2Id], companyCode: 'AH' })
    expect(res.status).toBe(200)
    expect(res.body.documentIds).toEqual([doc1Id])
    expect(res.body.excluded).toEqual([{ id: doc2Id, duplicateOf: doc1Id, receiveId: 'RCV-AP-1' }])
    expect(res.body.batch.totalDocs).toBe(1)
    expect((await prisma.document.findUnique({ where: { id: doc1Id } }))?.status).toBe('Sent')
    expect(await prisma.document.findUnique({ where: { id: doc2Id } })).toMatchObject({ status: 'Duplicate', duplicateOfId: doc1Id, isLocked: false })
  })

  it('batch guard: a receive_id already Posted outside the batch takes the selected document out', async () => {
    await prisma.document.update({ where: { id: doc1Id }, data: { receiveId: 'RCV-AP-2', status: 'Posted', isLocked: true } })
    await prisma.document.update({ where: { id: doc2Id }, data: { receiveId: 'RCV-AP-2' } })
    const res = await request(app)
      .post('/api/ap/batches')
      .set('Cookie', await asUser('u6', 'APR'))
      .send({ batchId: 'AP-TEST-GUARD2', documentIds: [doc2Id] })
    expect(res.status).toBe(200)
    expect(res.body.batch).toBeNull()
    expect(res.body.excluded[0]).toMatchObject({ id: doc2Id, duplicateOf: doc1Id })
    expect(await prisma.apBatch.findUnique({ where: { id: 'AP-TEST-GUARD2' } })).toBeNull()
  })

  it('a sent document stores "Sent" and the send entry in its payload (was lost before v5.11)', async () => {
    await request(app)
      .post('/api/ap/batches')
      .set('Cookie', await asUser('u6', 'APR', { name: 'สมชาย วงศ์ทอง' }))
      .send({ batchId: 'AP-TEST-PAYLOAD', documentIds: [doc1Id] })
    const p = JSON.parse((await prisma.document.findUnique({ where: { id: doc1Id } }))!.payloadJson)
    expect(p.status).toBe('Sent')
    expect(p.history.at(-1).act).toContain('AP-TEST-PAYLOAD')
  })
})
