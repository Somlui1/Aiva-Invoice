import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { asUser } from './helpers/session'

describe('Express Governance Routes', () => {
  const app = createExpressApp()

  it('GET /api/users returns users list', async () => {
    const res = await request(app).get('/api/users').set('Cookie', await asUser('route-adm', 'ADM'))
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.users)).toBe(true)
  })

  it('GET /api/audit-logs returns audit logs array', async () => {
    const res = await request(app).get('/api/audit-logs').set('Cookie', await asUser('route-sa', 'SA'))
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.logs)).toBe(true)
  })

  it('GET /api/ap/batches returns batches array', async () => {
    const res = await request(app).get('/api/ap/batches').set('Cookie', await asUser('route-sa', 'SA'))
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.batches)).toBe(true)
  })

  it('GET /api/ad/search returns matching employees or full directory on empty query', async () => {
    const res = await request(app).get('/api/ad/search').set('Cookie', await asUser('route-adm', 'ADM'))
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.results)).toBe(true)
    expect(res.body.results.length).toBeGreaterThan(0)
  })

  it('POST /api/oracle/sync-companies returns synchronized companies', async () => {
    const res = await request(app)
      .post('/api/oracle/sync-companies')
      .set('Cookie', await asUser('route-adm', 'ADM'))
      .send({ triggeredBy: 'test_admin' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.companies)).toBe(true)
    expect(res.body.companies.length).toBeGreaterThan(0)
  })
})
