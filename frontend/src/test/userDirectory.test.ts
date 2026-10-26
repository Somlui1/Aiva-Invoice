import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'

describe('Directory Search and User Provisioning API', () => {
  const app = createExpressApp()

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: 'new.emp@aapico.com' } })
  })

  it('searches directory by query and returns auto-mapped employee fields', async () => {
    const res = await request(app).get('/api/ad/search?q=somsak')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.results)).toBe(true)
    expect(res.body.results.length).toBeGreaterThan(0)

    const emp = res.body.results[0]
    expect(emp).toMatchObject({
      name: expect.any(String),
      email: expect.stringContaining('@aapico.com'),
      samAccount: expect.any(String),
      unit: expect.any(String),
    })
  })

  it('provisions new user into database and retrieves user list with relations', async () => {
    const saveRes = await request(app)
      .post('/api/users')
      .set('x-user-id', 'u7')
      .set('x-user-role', 'ADM')
      .send({
        email: 'new.emp@aapico.com',
        name: 'สมหญิง รักดี',
        samAccount: 'somying.r',
        empId: '50112',
        unit: 'ฝ่ายบัญชี',
        role: 'ACC',
        companies: ['AH', 'AHT'],
      })

    expect(saveRes.status).toBe(200)
    expect(saveRes.body.ok).toBe(true)
    expect(saveRes.body.user.email).toBe('new.emp@aapico.com')

    const listRes = await request(app).get('/api/users')
    expect(listRes.status).toBe(200)
    expect(listRes.body.ok).toBe(true)
    const found = listRes.body.users.find((u: any) => u.email === 'new.emp@aapico.com')
    expect(found).toBeDefined()
    expect(found.companies).toEqual(expect.arrayContaining(['AH', 'AHT']))

    await prisma.user.deleteMany({ where: { email: 'new.emp@aapico.com' } })
  })
})
