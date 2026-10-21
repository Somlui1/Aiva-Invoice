import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express PDF Proxy and Engine Ingestion Routes', () => {
  const app = createExpressApp()

  it('POST /api/engine/ingest rejects invalid JSON with 422', async () => {
    const res = await request(app).post('/api/engine/ingest').send({})
    expect(res.status).toBe(422)
    expect(res.body.ok).toBe(false)
  })

  it('GET /api/documents/:id/pdf rejects invalid id format with 400', async () => {
    const res = await request(app).get('/api/documents/invalid_doc_id/pdf')
    expect(res.status).toBe(400)
    expect(res.body.ok).toBe(false)
  })
})
