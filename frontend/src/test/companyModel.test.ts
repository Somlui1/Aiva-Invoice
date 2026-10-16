import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '../lib/prisma'
import { COMPANIES_26 } from '../mock/companies26'
import { autoSeedCompanies } from '../lib/autoSeedSample'

describe('Database Foundation & 26-Company Master Seed', () => {
  beforeEach(async () => {
    // Clear test companies and test audit logs
    await prisma.company.deleteMany().catch(() => {})
    await prisma.auditLog.deleteMany({ where: { docId: 'TEST-SEED' } }).catch(() => {})
  })

  afterEach(async () => {
    await prisma.company.deleteMany().catch(() => {})
    await prisma.auditLog.deleteMany({ where: { docId: 'TEST-SEED' } }).catch(() => {})
  })

  it('supports category and metadataJson on AuditLog', async () => {
    const log = await prisma.auditLog.create({
      data: {
        category: 'RBAC_USER',
        docId: 'TEST-SEED',
        who: 'IT Admin',
        role: 'ADM',
        act: 'สร้างผู้ใช้ใหม่',
        detail: 'ทดสอบบันทึก Log หมวดหมู่ RBAC_USER',
        metadataJson: JSON.stringify({ role: 'EU', co: ['AH'] }),
      },
    })

    expect(log.id).toBeDefined()
    expect(log.category).toBe('RBAC_USER')
    expect(log.metadataJson).toContain('co')
    expect(JSON.parse(log.metadataJson || '{}')).toEqual({ role: 'EU', co: ['AH'] })
  })

  it('creates and queries Company entity in database', async () => {
    const created = await prisma.company.create({
      data: {
        code: 'TEST_CO',
        name: 'Test Affiliate Co., Ltd.',
        taxId: 'TH9999999999',
        ouName: 'Test OU Legal',
        ledgerName: 'TEST_Ledger',
        orgId: 999,
        isActive: true,
      },
    })

    expect(created.code).toBe('TEST_CO')
    expect(created.orgId).toBe(999)

    const queried = await prisma.company.findUnique({
      where: { code: 'TEST_CO' },
    })

    expect(queried).not.toBeNull()
    expect(queried?.name).toBe('Test Affiliate Co., Ltd.')
  })

  it('contains all 26 real AAPICO entities in COMPANIES_26 dictionary', () => {
    expect(Object.keys(COMPANIES_26).length).toBe(26)
    expect(COMPANIES_26['AH']).toBeDefined()
    expect(COMPANIES_26['AH'].orgId).toBe(101)
    expect(COMPANIES_26['AHP']).toBeDefined()
    expect(COMPANIES_26['AHP'].orgId).toBe(176)
    expect(COMPANIES_26['AHT']).toBeDefined()
    expect(COMPANIES_26['AHT'].orgId).toBe(195)
    expect(COMPANIES_26['AHA']).toBeDefined()
    expect(COMPANIES_26['AHA'].orgId).toBe(413)
    expect(COMPANIES_26['AM']).toBeDefined()
    expect(COMPANIES_26['AM'].orgId).toBe(373)
  })

  it('auto-seeds all 26 companies into database when table is empty', async () => {
    const countBefore = await prisma.company.count()
    expect(countBefore).toBe(0)

    await autoSeedCompanies()

    const countAfter = await prisma.company.count()
    expect(countAfter).toBe(26)

    const ah = await prisma.company.findUnique({ where: { code: 'AH' } })
    expect(ah?.name).toBe('AAPICO HITECH PUBLIC COMPANY LIMITED')
    expect(ah?.taxId).toBe('TH3011706022')
    expect(ah?.orgId).toBe(101)
  })
})
