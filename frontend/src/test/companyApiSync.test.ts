import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getCompanies } from '../app/api/companies/route'
import { POST as syncCompanies } from '../app/api/oracle/sync-companies/route'
import { prisma } from '../lib/prisma'
import { autoSeedCompanies } from '../lib/autoSeedSample'

describe('Company Search & Oracle MCP Sync API', () => {
  beforeEach(async () => {
    await autoSeedCompanies()
  })

  it('GET /api/companies returns all 26 companies when no search filter provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/companies')
    const res = await getCompanies(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(Array.isArray(data.companies)).toBe(true)
    expect(data.companies.length).toBeGreaterThanOrEqual(26)

    const ah = data.companies.find((c: any) => c.code === 'AH')
    expect(ah).toBeDefined()
    expect(ah.orgId).toBe(101)
  })

  it('GET /api/companies filters by search query on code, name, taxId, or ouName', async () => {
    // Search by code
    const reqCode = new NextRequest('http://localhost:3000/api/companies?search=AHT')
    const resCode = await getCompanies(reqCode)
    const dataCode = await resCode.json()
    expect(dataCode.ok).toBe(true)
    expect(dataCode.companies.some((c: any) => c.code === 'AHT')).toBe(true)

    // Search by name text
    const reqName = new NextRequest('http://localhost:3000/api/companies?search=Forging')
    const resName = await getCompanies(reqName)
    const dataName = await resName.json()
    expect(dataName.ok).toBe(true)
    expect(dataName.companies.some((c: any) => c.code === 'AF')).toBe(true)

    // Search by orgId
    const reqOrg = new NextRequest('http://localhost:3000/api/companies?search=413')
    const resOrg = await getCompanies(reqOrg)
    const dataOrg = await resOrg.json()
    expect(dataOrg.ok).toBe(true)
    expect(dataOrg.companies.some((c: any) => c.code === 'AHA')).toBe(true)
  })

  it('POST /api/oracle/sync-companies upserts into Company table and creates ORACLE_SYNC audit log', async () => {
    const req = new NextRequest('http://localhost:3000/api/oracle/sync-companies', {
      method: 'POST',
      body: JSON.stringify({ triggeredBy: 'itsupport' }),
    })

    const res = await syncCompanies(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.companies.length).toBeGreaterThanOrEqual(26)

    // Verify audit log has category ORACLE_SYNC
    const log = await prisma.auditLog.findFirst({
      where: { action: 'oracle_sync_companies' },
      orderBy: { createdAt: 'desc' },
    })

    expect(log).not.toBeNull()
    expect(log?.category).toBe('ORACLE_SYNC')
  })
})
