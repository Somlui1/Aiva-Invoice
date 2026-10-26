import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'

describe('Oracle Company Sync API (/api/oracle/sync-companies)', () => {
  const app = createExpressApp()

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { docId: 'MASTER_DATA' } })
  })

  it('handles company sync request and returns structured companies with audit logging', async () => {
    const res = await request(app)
      .post('/api/oracle/sync-companies')
      .send({ triggeredBy: 'itsupport' })
    expect(res.status).toBe(200)

    expect(res.body.ok).toBe(true)
    expect(res.body.source).toBeDefined()
    expect(Array.isArray(res.body.companies)).toBe(true)
    expect(res.body.companies.length).toBeGreaterThanOrEqual(4)

    // Check AH company structure
    const ah = res.body.companies.find((c: any) => c.code === 'AH')
    expect(ah).toBeDefined()
    expect(ah.name).toContain('อาปิโก')
    expect(ah.tax).toBe('0107545000179')
    expect(ah.orgs).toContain(103)

    // Verify audit log entry
    const log = await prisma.auditLog.findFirst({
      where: { docId: 'MASTER_DATA', action: 'oracle_sync_companies' },
    })
    expect(log).toBeDefined()
    expect(log?.act).toContain('Sync')
  })
})
