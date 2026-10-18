import { describe, it, expect, beforeEach } from 'vitest'
import { GET as searchAd } from '../app/api/ad/search/route'
import { GET as listUsers, POST as saveUser } from '../app/api/users/route'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'

describe('Directory Search and User Provisioning API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: 'new.emp@aapico.com' } })
  })

  it('searches directory by query and returns auto-mapped employee fields', async () => {
    const req = new NextRequest('http://localhost/api/ad/search?q=somsak')
    const res = await searchAd(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBeGreaterThan(0)

    const emp = data.results[0]
    expect(emp).toMatchObject({
      name: expect.any(String),
      email: expect.stringContaining('@aapico.com'),
      samAccount: expect.any(String),
      unit: expect.any(String),
    })
  }, 15000)

  it('provisions new user into database and retrieves user list with relations', async () => {
    const saveReq = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new.emp@aapico.com',
        name: 'สมหญิง รักดี',
        samAccount: 'somying.r',
        empId: '50112',
        unit: 'ฝ่ายบัญชี',
        role: 'ACC',
        companies: ['AH', 'AHT'],
      }),
      headers: { 'x-user-id': 'u7', 'x-user-role': 'ADM' },
    })
    const saveRes = await saveUser(saveReq)
    expect(saveRes.status).toBe(200)
    const saved = await saveRes.json()
    expect(saved.ok).toBe(true)
    expect(saved.user.email).toBe('new.emp@aapico.com')

    const listRes = await listUsers(new NextRequest('http://localhost/api/users'))
    const list = await listRes.json()
    expect(list.ok).toBe(true)
    const found = list.users.find((u: any) => u.email === 'new.emp@aapico.com')
    expect(found).toBeDefined()
    expect(found.companies).toEqual(expect.arrayContaining(['AH', 'AHT']))

    await prisma.user.deleteMany({ where: { email: 'new.emp@aapico.com' } })
  })
})
