import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '../app/api/oracle/sync-companies/route'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'

describe('Oracle Company Sync API (/api/oracle/sync-companies)', () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { docId: 'MASTER_DATA' } })
  })

  it('handles company sync request and returns structured companies with audit logging', async () => {
    const req = new NextRequest('http://localhost/api/oracle/sync-companies', {
      method: 'POST',
      body: JSON.stringify({ triggeredBy: 'itsupport' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.source).toBeDefined()
    expect(Array.isArray(data.companies)).toBe(true)
    expect(data.companies.length).toBeGreaterThanOrEqual(4)

    // Check AH company structure
    const ah = data.companies.find((c: any) => c.code === 'AH')
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
