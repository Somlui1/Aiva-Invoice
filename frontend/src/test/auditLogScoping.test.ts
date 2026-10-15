/**
 * Security Scoping Tests for /api/audit-logs
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '../lib/prisma'
import { GET } from '../app/api/audit-logs/route'

describe('Audit Log Security Scoping API', () => {
  const testIds: string[] = []

  beforeEach(async () => {
    // Seed isolated test logs
    const l1 = await prisma.auditLog.create({
      data: {
        docId: 'TEST-SCOPING-AH-1',
        whoId: 'u1',
        who: 'สมศักดิ์ ใจดี',
        role: 'EU',
        act: 'ดูเอกสาร',
        detail: 'AH invoice DMS-AH-1',
      },
    })
    const l2 = await prisma.auditLog.create({
      data: {
        docId: 'TEST-SCOPING-AHT-2',
        whoId: 'u2',
        who: 'วิไลวรรณ ศรีสุข',
        role: 'EU',
        act: 'ดูเอกสาร',
        detail: 'AHT invoice DMS-AHT-2',
      },
    })
    const l3 = await prisma.auditLog.create({
      data: {
        docId: 'TEST-SCOPING-AH-3',
        whoId: 'u6',
        who: 'สมชาย วงศ์ทอง',
        role: 'APR',
        act: 'อนุมัติ',
        detail: 'AH approval DMS-AH-3',
      },
    })
    testIds.push(l1.id, l2.id, l3.id)
  })

  afterEach(async () => {
    if (testIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { id: { in: testIds } },
      })
      testIds.length = 0
    }
  })

  it('restricts EU and ACC users to only see their own audit logs', async () => {
    const req = new NextRequest('http://localhost/api/audit-logs?whoId=u1&role=EU')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)

    // User u1 must see their own log
    const hasU1 = data.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-1')
    expect(hasU1).toBe(true)

    // User u1 must NOT see logs of u2 or u6
    const hasU2 = data.logs.some((l: any) => l.doc === 'TEST-SCOPING-AHT-2')
    const hasU6 = data.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-3')
    expect(hasU2).toBe(false)
    expect(hasU6).toBe(false)
  })

  it('allows APR to see audit logs within their assigned companies and own logs', async () => {
    const req = new NextRequest('http://localhost/api/audit-logs?whoId=u6&role=APR&companies=AH')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)

    // APR on AH should see AH logs and own log
    const hasU1 = data.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-1')
    const hasU6 = data.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-3')
    expect(hasU1).toBe(true)
    expect(hasU6).toBe(true)

    // Should NOT see AHT log
    const hasU2 = data.logs.some((l: any) => l.doc === 'TEST-SCOPING-AHT-2')
    expect(hasU2).toBe(false)
  })

  it('allows ADM and itsupport to see all audit logs across the system', async () => {
    // itsupport
    const reqSupport = new NextRequest('http://localhost/api/audit-logs?whoId=itsupport&role=itsupport')
    const resSupport = await GET(reqSupport)
    const dataSupport = await resSupport.json()
    expect(dataSupport.ok).toBe(true)

    expect(dataSupport.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-1')).toBe(true)
    expect(dataSupport.logs.some((l: any) => l.doc === 'TEST-SCOPING-AHT-2')).toBe(true)
    expect(dataSupport.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-3')).toBe(true)

    // ADM
    const reqAdm = new NextRequest('http://localhost/api/audit-logs?whoId=u7&role=ADM')
    const resAdm = await GET(reqAdm)
    const dataAdm = await resAdm.json()
    expect(dataAdm.ok).toBe(true)
    expect(dataAdm.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-1')).toBe(true)
    expect(dataAdm.logs.some((l: any) => l.doc === 'TEST-SCOPING-AHT-2')).toBe(true)
  })
})
