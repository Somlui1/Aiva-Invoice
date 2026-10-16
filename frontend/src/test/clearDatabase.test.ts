import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../lib/prisma'
import { clearDatabase } from '../../scripts/clear-database'

describe('Database Clear Scripts', () => {
  beforeEach(async () => {
    // Ensure test user and permissions exist
    await prisma.user.upsert({
      where: { id: 'test-admin-clear' },
      create: { id: 'test-admin-clear', email: 'admin-clear@test.com', name: 'Admin Clear', role: 'ADM' },
      update: {},
    })
    await prisma.userCompany.upsert({
      where: { userId_companyCode: { userId: 'test-admin-clear', companyCode: 'AH' } },
      create: { userId: 'test-admin-clear', companyCode: 'AH' },
      update: {},
    })
  })

  it('clears only logs when mode is logs, preserving documents and users', async () => {
    await prisma.auditLog.create({
      data: { docId: 'TEST-LOG-01', who: 'tester', role: 'ADM', act: 'TEST', detail: 'test log detail' },
    })
    const res = await clearDatabase('logs')
    expect(res.ok).toBe(true)
    expect(res.logsCleared).toBeGreaterThanOrEqual(1)

    const logCount = await prisma.auditLog.count({ where: { docId: 'TEST-LOG-01' } })
    expect(logCount).toBe(0)

    const userCount = await prisma.user.count({ where: { id: 'test-admin-clear' } })
    expect(userCount).toBe(1)
  })

  it('clears transactions and logs when mode is data, preserving user and permission mappings', async () => {
    // Insert a dummy document and validation run
    await prisma.document.upsert({
      where: { id: 'DMS-TEST-DEL' },
      create: {
        id: 'DMS-TEST-DEL',
        dmsDocId: 'DMS-TEST-DEL',
        packageId: 'PKG-DEL',
        fileSha256: 'sha-del',
        pageCount: 1,
        invoiceNum: 'INV-DEL-1',
        invoiceDate: '2026-10-16',
        companyCode: 'AH',
        supplierTaxId: '0105500000001',
        supplierName: 'Del Supplier',
        grandTotal: 5000,
        status: 'Auto-pass',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'Low',
        payloadJson: '{}',
      },
      update: {},
    })

    const res = await clearDatabase('data')
    expect(res.ok).toBe(true)

    const [docCount, bboxCount, runCount, batchCount, logCount] = await Promise.all([
      prisma.document.count({ where: { id: 'DMS-TEST-DEL' } }),
      prisma.documentBBox.count(),
      prisma.validationRun.count(),
      prisma.apBatch.count(),
      prisma.auditLog.count(),
    ])
    expect(docCount).toBe(0)
    expect(bboxCount).toBe(0)
    expect(runCount).toBe(0)
    expect(batchCount).toBe(0)
    expect(logCount).toBe(0)

    const user = await prisma.user.findUnique({
      where: { id: 'test-admin-clear' },
      include: { companies: true },
    })
    expect(user).not.toBeNull()
    expect(user?.companies.length).toBeGreaterThanOrEqual(1)
  })
})
