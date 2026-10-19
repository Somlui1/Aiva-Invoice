import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express Auth Routes', () => {
  const app = createExpressApp()

  it('GET /api/auth/me returns 401 when no session is present', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.ok).toBe(false)
  })

  it('GET /api/auth/me returns user profile when x-user-id header is provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('x-user-id', 'wajeepradit.p')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.email).toBe('wajeepradit.p@aapico.com')
  })

  it('POST /api/auth/ldap fails with 400 when missing username or password', async () => {
    const res = await request(app).post('/api/auth/ldap').send({})
    expect(res.status).toBe(400)
    expect(res.body.ok).toBe(false)
  })
})
