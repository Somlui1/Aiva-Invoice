import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../app/api/auth/me/route'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'

describe('Auth Me API (/api/auth/me)', () => {
  beforeEach(async () => {
    // Upsert a test AD user in DB with assigned companies
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

    // Upsert an unassigned user with NO companies in DB (Strict Zero-Trust)
    await prisma.user.upsert({
      where: { email: 'unassigned.test@aapico.com' },
      update: {},
      create: {
        id: 'unassigned.test',
        email: 'unassigned.test@aapico.com',
        name: 'Unassigned Staff',
        role: 'EU',
        samAccount: 'unassigned.test',
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

  it('returns user profile via cookie for registered AD employee', async () => {
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
    expect(Array.isArray(data.user.companies)).toBe(true)
  })

  it('enforces Zero-Trust: returns empty companies [] when user has not been assigned companies in DB', async () => {
    const req = new NextRequest('http://localhost/api/auth/me?userId=unassigned.test')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.user.id).toBe('unassigned.test')
    expect(data.user.companies).toEqual([])
  })

  it('returns 404 for unknown user ID', async () => {
    const req = new NextRequest('http://localhost/api/auth/me?userId=non_existent_user')
    const res = await GET(req)
    expect(res.status).toBe(404)
  })
})
