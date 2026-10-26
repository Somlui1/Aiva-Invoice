import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { asUser } from './helpers/session'

describe('Express Auth Routes', () => {
  const app = createExpressApp()

  it('GET /api/auth/me returns 401 when no session is present', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.ok).toBe(false)
  })

  it('v5.5: the x-user-id header is NOT a session', async () => {
    const res = await request(app).get('/api/auth/me').set('x-user-id', 'wajeepradit.p')
    expect(res.status).toBe(401)
  })

  it('GET /api/auth/me returns the user of a signed session cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', await asUser('me-acc', 'ACC', { name: 'Me Acc', companies: ['AH'] }))
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.id).toBe('me-acc')
    expect(res.body.user.role).toBe('ACC')
    expect(res.body.user.companies).toEqual(['AH'])
  })

  it('POST /api/auth/ldap fails with 400 when missing username or password', async () => {
    const res = await request(app).post('/api/auth/ldap').send({})
    expect(res.status).toBe(400)
    expect(res.body.ok).toBe(false)
  })
})
