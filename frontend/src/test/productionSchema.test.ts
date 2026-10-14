import { describe, it, expect } from 'vitest'
import { prisma } from '../lib/prisma'

describe('Production Schema Models', () => {
  it('supports extended Document locking and AP batch fields', async () => {
    // Clean up if existed from previous run
    await prisma.document.deleteMany({ where: { id: 'DMS-PROD-01' } })

    const doc = await (prisma.document as any).create({
      data: {
        id: 'DMS-PROD-01',
        dmsDocId: '99901',
        packageId: 'PKG-01',
        fileSha256: 'abc123sha256',
        pageCount: 2,
        invoiceNum: 'INV-TEST-01',
        invoiceDate: '2026-10-14',
        companyCode: 'AH',
        supplierTaxId: '0107539000244',
        supplierName: 'AAPICO Hitech PLC',
        grandTotal: 15000.0,
        currency: 'THB',
        status: 'Confirmed',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'LOW',
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: 'u6',
        apBatchId: 'AP-20261014-001',
        payloadJson: '{}',
      },
    })
    expect(doc.isLocked).toBe(true)
    expect(doc.apBatchId).toBe('AP-20261014-001')
    await prisma.document.delete({ where: { id: 'DMS-PROD-01' } })
  })

  it('persists and queries AuditLog records with whoId, action and statuses', async () => {
    const log = await (prisma.auditLog as any).create({
      data: {
        docId: 'DMS-100',
        whoId: 'u4',
        who: 'ปณิดา รักงาน',
        role: 'ACC',
        act: 'CONFIRM',
        action: 'CONFIRM',
        fromStatus: 'Auto-pass',
        toStatus: 'Confirmed',
        reason: 'ผ่านการตรวจสอบยอดและ PO ถูกต้อง',
        detail: 'ผ่านการตรวจสอบยอดและ PO ถูกต้อง',
      },
    })
    expect(log.id).toBeDefined()
    expect(log.action).toBe('CONFIRM')
    expect(log.fromStatus).toBe('Auto-pass')
    expect(log.toStatus).toBe('Confirmed')
    await prisma.auditLog.delete({ where: { id: log.id } })
  })

  it('persists and links User, UserCompany, and UserReceiverMap', async () => {
    await (prisma as any).user?.deleteMany?.({ where: { email: 'test.user@aapico.com' } })

    const user = await (prisma as any).user.create({
      data: {
        id: 'u-test-99',
        email: 'test.user@aapico.com',
        name: 'ทดสอบ ผู้ใช้งาน',
        samAccount: 'test.u',
        empId: '99999',
        unit: 'คลังสินค้า',
        role: 'EU',
        companies: {
          create: [{ companyCode: 'AH' }],
        },
        receivers: {
          create: [{ receiverName: 'TEST USER', assignedBy: 'u7' }],
        },
      },
      include: { companies: true, receivers: true },
    })
    expect(user.companies).toHaveLength(1)
    expect(user.receivers[0].receiverName).toBe('TEST USER')
    await (prisma as any).user.delete({ where: { id: user.id } })
  })
})
