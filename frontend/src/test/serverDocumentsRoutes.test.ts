import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express Documents & Actions Routes', () => {
  const app = createExpressApp()

  it('GET /api/documents returns documents array', async () => {
    const res = await request(app).get('/api/documents')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.documents)).toBe(true)
  })

  it('GET /api/documents/:id returns 404 for non-existent document', async () => {
    const res = await request(app).get('/api/documents/NON_EXISTENT_ID_999')
    expect(res.status).toBe(404)
    expect(res.body.ok).toBe(false)
  })

  it('POST /api/documents/:id/actions validates action parameter', async () => {
    const res = await request(app)
      .post('/api/documents/DMS-100/actions')
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.ok).toBe(false)
  })
})
