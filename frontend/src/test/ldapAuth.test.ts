import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'

describe('LDAP / Active Directory Authentication API', () => {
  const app = createExpressApp()

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { docId: 'AUTH' } })
  })

  it('rejects empty username or password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/ldap')
      .send({ username: '', password: '' })
    expect(res.status).toBe(400)
  })

  it('rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/ldap')
      .send({ username: 'itsupport', password: 'wrongpassword' })
    expect(res.status).toBe(401)
    expect(res.body.error).toContain('ไม่ถูกต้อง')
  })

  it('authenticates itsupport with password support and grants SA role', async () => {
    const res = await request(app)
      .post('/api/auth/ldap')
      .send({ username: 'itsupport', password: 'support' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.id).toBe('itsupport')
    expect(res.body.user.role).toBe('SA')
    expect(res.body.user.name).toContain('IT Support')

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
  })
})
