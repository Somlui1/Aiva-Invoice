import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { cookieFor } from './helpers/session'

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
      .set('Cookie', cookieFor('wajeepradit.p'))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.id).toBe('wajeepradit.p')
    expect(res.body.user.name).toBe('Wajeepradit Prompan (AH)')
    expect(res.body.user.role).toBe('EU')
    expect(Array.isArray(res.body.user.companies)).toBe(true)
  })

  it('v5.5: an unsigned cookie (plain user id) is rejected', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'aiva_session=wajeepradit.p')
    expect(res.status).toBe(401)
  })

  it('v5.5: ?userId= no longer reads another user profile', async () => {
    const res = await request(app).get('/api/auth/me?userId=wajeepradit.p')
    expect(res.status).toBe(401)
    expect(res.body.user).toBeNull()
  })

  it('v5.5: an unknown user id in a valid signature resolves to no session', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', cookieFor('u1-purged'))
    expect(res.status).toBe(401)
  })

  it('v5.5: a deactivated user loses the session at once', async () => {
    await prisma.user.update({ where: { email: 'wajeepradit.p@aapico.com' }, data: { isActive: false } })
    const res = await request(app).get('/api/auth/me').set('Cookie', cookieFor('wajeepradit.p'))
    expect(res.status).toBe(401)
    await prisma.user.update({ where: { email: 'wajeepradit.p@aapico.com' }, data: { isActive: true } })
  })
})
