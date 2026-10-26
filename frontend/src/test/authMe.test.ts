import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'

describe('Auth Me API (/api/auth/me)', () => {
  const app = createExpressApp()

  beforeEach(async () => {
    // Upsert a test AD user in DB
    await prisma.user.upsert({
      where: { email: 'wajeepradit.p@aapico.com' },
      update: {},
      create: {
        id: 'wajeepradit.p',
        email: 'wajeepradit.p@aapico.com',
        name: 'Wajeepradit Prompan (AH)',
        role: 'EU',
        empId: 'AH10002898',
        samAccount: 'wajeepradit.p',
        isActive: true,
      },
    })
  })

  it('returns 401 if no session cookie or header is provided', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.ok).toBe(false)
  })

  it('returns user profile via cookie for registered AD employee', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'aiva_session=wajeepradit.p')

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.id).toBe('wajeepradit.p')
    expect(res.body.user.name).toBe('Wajeepradit Prompan (AH)')
    expect(res.body.user.role).toBe('EU')
    expect(Array.isArray(res.body.user.companies)).toBe(true)
  })

  it('enforces Zero-Trust: returns 404 for unknown or purged mock users (u1)', async () => {
    const res = await request(app).get('/api/auth/me?userId=u1')
    expect(res.status).toBe(404)
    expect(res.body.ok).toBe(false)
  })
})
