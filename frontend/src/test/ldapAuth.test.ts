import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '../app/api/auth/ldap/route'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'

describe('LDAP / Active Directory Authentication API', () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { docId: 'AUTH' } })
  })

  it('rejects empty username or password with 400', async () => {
    const req = new NextRequest('http://localhost/api/auth/ldap', {
      method: 'POST',
      body: JSON.stringify({ username: '', password: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects incorrect password with 401', async () => {
    const req = new NextRequest('http://localhost/api/auth/ldap', {
      method: 'POST',
      body: JSON.stringify({ username: 'itsupport', password: 'wrongpassword' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toContain('ไม่ถูกต้อง')
  })

  it('authenticates itsupport with password support and grants SA role', async () => {
    const req = new NextRequest('http://localhost/api/auth/ldap', {
      method: 'POST',
      body: JSON.stringify({ username: 'itsupport', password: 'support' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.user.id).toBe('itsupport')
    expect(data.user.role).toBe('SA')
    expect(data.user.name).toContain('IT Support')

    // Verify audit log
    const log = await prisma.auditLog.findFirst({
      where: { docId: 'AUTH', action: 'login_ldap' },
    })
    expect(log).toBeDefined()
    expect(log?.who).toContain('IT Support')

    // Verify user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: 'itsupport@aapico.com' },
    })
    expect(dbUser).toBeDefined()
    expect(dbUser?.role).toBe('SA')
  }, 15000)
})
