import { describe, it, expect } from 'vitest'
import { checkAllServices, printServiceHealthReport } from '../lib/serviceHealth'

describe('Integrated Services Preflight Health Check', () => {
  it('checks all 5 integrated services and returns structured statuses', async () => {
    const results = await checkAllServices()
    expect(results).toBeDefined()
    expect(results.length).toBe(5)

    const names = results.map(r => r.name)
    expect(names).toContain('SQLite Database (Prisma)')
    expect(names).toContain('Active Directory / LDAP')
    expect(names).toContain('Paperless DMS (Document Storage)')
    expect(names).toContain('System A Invoice Matching Engine')
    expect(names).toContain('Oracle MCP Gateway / ORDS')

    // Every service result must have a valid status and description
    for (const r of results) {
      expect(['ok', 'warn', 'error']).toContain(r.status)
      expect(typeof r.message).toBe('string')
      expect(r.message.length).toBeGreaterThan(0)
    }

    // Database is connected in test environment
    const db = results.find(r => r.name === 'SQLite Database (Prisma)')
    expect(db?.status).toBe('ok')
    expect(db?.message).toContain('documents')
  })

  it('prints service health report without throwing', async () => {
    await expect(printServiceHealthReport()).resolves.not.toThrow()
  })
})
