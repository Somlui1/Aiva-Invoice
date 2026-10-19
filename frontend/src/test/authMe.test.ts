import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../app/api/auth/me/route'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'

describe('Auth Me API (/api/auth/me)', () => {
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
    const req = new NextRequest('http://localhost/api/auth/me')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.ok).toBe(false)
  })

  it('returns user profile via cookie with default companies for AD employee', async () => {
    const req = new NextRequest('http://localhost/api/auth/me', {
      headers: {
        cookie: 'aiva_session=wajeepradit.p',
      },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.user.id).toBe('wajeepradit.p')
    expect(data.user.name).toBe('Wajeepradit Prompan (AH)')
    expect(data.user.role).toBe('EU')
    // Check that companies are defaulted so scopeCheck doesn't block the queue
    expect(data.user.companies).toEqual(['AH', 'AHA', 'AHT', 'AHP', 'AM'])
  })

  it('returns user profile via query parameter for mock users', async () => {
    const req = new NextRequest('http://localhost/api/auth/me?userId=u1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.user.id).toBe('u1')
    expect(data.user.role).toBe('EU')
    expect(data.user.companies).toEqual(['AH'])
  })
})
