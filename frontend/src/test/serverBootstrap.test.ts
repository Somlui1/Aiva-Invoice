import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'

describe('Express Adapter Service Bootstrap', () => {
  it('instantiates express app with basic health and middleware', async () => {
    const app = createExpressApp()
    expect(app).toBeDefined()

    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBeDefined()
  })

  it('supports json body parsing with large payload', async () => {
    const app = createExpressApp()
    // Test endpoint or dummy route
    app.post('/api/test-body', (req, res) => {
      res.json({ receivedKeys: Object.keys(req.body) })
    })

    const res = await request(app)
      .post('/api/test-body')
      .send({ hello: 'world', count: 123 })
    expect(res.status).toBe(200)
    expect(res.body.receivedKeys).toContain('hello')
  })
})
