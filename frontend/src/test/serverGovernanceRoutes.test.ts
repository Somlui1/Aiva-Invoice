import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express Governance Routes', () => {
  const app = createExpressApp()

  it('GET /api/users returns users list', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.users)).toBe(true)
  })

  it('GET /api/audit-logs returns audit logs array', async () => {
    const res = await request(app).get('/api/audit-logs')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.logs)).toBe(true)
  })

  it('GET /api/ap/batches returns batches array', async () => {
    const res = await request(app).get('/api/ap/batches')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.batches)).toBe(true)
  })

  it('GET /api/ad/search returns matching employees or full directory on empty query', async () => {
    const res = await request(app).get('/api/ad/search')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.results)).toBe(true)
    expect(res.body.results.length).toBeGreaterThan(0)
  })

  it('POST /api/oracle/sync-companies returns synchronized companies', async () => {
    const res = await request(app)
      .post('/api/oracle/sync-companies')
      .send({ triggeredBy: 'test_admin' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.companies)).toBe(true)
    expect(res.body.companies.length).toBeGreaterThan(0)
  })
})
