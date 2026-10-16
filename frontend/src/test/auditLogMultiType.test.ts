import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getAuditLogs } from '../app/api/audit-logs/route'
import { prisma } from '../lib/prisma'

describe('Multi-Type Scoped Audit Logs API', () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { docId: { startsWith: 'TEST-LOG-' } } })

    // Create varied audit logs for testing
    await prisma.auditLog.createMany({
      data: [
        {
          category: 'INGESTION',
          docId: 'TEST-LOG-INGEST-1',
          who: 'System A OCR Engine',
          role: 'SYSTEM',
          act: 'INGEST',
          detail: 'นำเข้าเอกสารใบแจ้งหนี้ TEST-LOG-INGEST-1 บริษัท AH',
        },
        {
          category: 'DOCUMENT',
          docId: 'TEST-LOG-DOC-1',
          who: 'สมศักดิ์ บัญชี',
          whoId: 'user_acc_1',
          role: 'ACC',
          act: 'อนุมัติเอกสาร',
          detail: 'ยืนยันความถูกต้องเอกสาร TEST-LOG-DOC-1 บริษัท AH',
        },
        {
          category: 'AP_BATCH',
          docId: 'TEST-LOG-AP-1',
          who: 'หัวหน้า บัญชี',
          whoId: 'user_apr_1',
          role: 'APR',
          act: 'ส่งข้อมูล AP เข้า Oracle',
          detail: 'ส่ง Batch AP-2026-001 บริษัท AH จำนวน 10 รายการ',
        },
        {
          category: 'RBAC_USER',
          docId: 'TEST-LOG-USER-1',
          who: 'IT Administrator',
          whoId: 'u7',
          role: 'ADM',
          act: 'สร้างผู้ใช้ใหม่',
          detail: 'สร้างผู้ใช้ใหม่: นายทดสอบ สิทธิ์ (test@aapico.com)',
          metadataJson: JSON.stringify({ isNew: true, role: 'EU' }),
        },
        {
          category: 'RBAC_PERMISSION',
          docId: 'TEST-LOG-PERM-1',
          who: 'IT Administrator',
          whoId: 'u7',
          role: 'ADM',
          act: 'แก้ไขสิทธิ์ผู้ใช้',
          detail: 'แก้ไขสิทธิ์ผู้ใช้: เพิ่มบริษัท [AHT]',
          metadataJson: JSON.stringify({ addedCompanies: ['AHT'] }),
        },
        {
          category: 'ORACLE_SYNC',
          docId: 'TEST-LOG-SYNC-1',
          who: 'IT Administrator',
          whoId: 'u7',
          role: 'ADM',
          act: 'Sync ข้อมูลบริษัทจาก Oracle ERP',
          detail: 'ซิงค์ข้อมูลบริษัทและ ORG_ID สำเร็จ (26 บริษัท)',
        },
      ],
    })
  })

  it('filters audit logs by category for ADM role', async () => {
    const req = new NextRequest('http://localhost/api/audit-logs?role=ADM&category=RBAC_PERMISSION')
    const res = await getAuditLogs(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.logs.length).toBeGreaterThan(0)
    expect(data.logs.every((l: any) => l.category === 'RBAC_PERMISSION')).toBe(true)
    expect(data.logs[0].act).toBe('แก้ไขสิทธิ์ผู้ใช้')
    expect(data.logs[0].metadataJson).toBeDefined()
  })

  it('searches audit logs across text query matching who, act, detail, doc', async () => {
    const req = new NextRequest('http://localhost/api/audit-logs?role=ADM&search=Oracle')
    const res = await getAuditLogs(req)
    const data = await res.json()

    expect(data.ok).toBe(true)
    expect(data.logs.length).toBeGreaterThanOrEqual(1)
    expect(data.logs.some((l: any) => l.act.includes('Oracle') || l.detail.includes('Oracle'))).toBe(true)
  })

  it('enforces RBAC security scoping: APR cannot view RBAC_USER or RBAC_PERMISSION logs', async () => {
    const req = new NextRequest('http://localhost/api/audit-logs?role=APR&whoId=user_apr_1&companies=AH&category=RBAC_USER')
    const res = await getAuditLogs(req)
    const data = await res.json()

    expect(data.ok).toBe(true)
    // APR should get 0 rows for administrative categories
    expect(data.logs.length).toBe(0)
  })

  it('allows APR to view DOCUMENT and AP_BATCH logs within assigned company', async () => {
    const req = new NextRequest('http://localhost/api/audit-logs?role=APR&whoId=user_apr_1&companies=AH')
    const res = await getAuditLogs(req)
    const data = await res.json()

    expect(data.ok).toBe(true)
    const testLogs = data.logs.filter((l: any) => l.doc.startsWith('TEST-LOG-'))
    expect(testLogs.some((l: any) => l.category === 'AP_BATCH')).toBe(true)
    expect(testLogs.some((l: any) => l.category === 'DOCUMENT')).toBe(true)
    expect(testLogs.every((l: any) => l.category !== 'RBAC_USER' && l.category !== 'RBAC_PERMISSION')).toBe(true)
  })
})
