/**
 * Security Scoping Tests for /api/audit-logs
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser } from './helpers/session'

describe('Audit Log Security Scoping API', () => {
  const app = createExpressApp()
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
    const res = await request(app).get('/api/audit-logs').set('Cookie', await asUser('u1', 'EU'))
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    // User u1 must see their own log
    const hasU1 = res.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-1')
    expect(hasU1).toBe(true)

    // User u1 must NOT see logs of u2 or u6
    const hasU2 = res.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AHT-2')
    const hasU6 = res.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-3')
    expect(hasU2).toBe(false)
    expect(hasU6).toBe(false)
  })

  it('v5.5: the scope comes from the session — ?role=SA in the query does not widen it', async () => {
    const res = await request(app)
      .get('/api/audit-logs?whoId=itsupport&role=SA')
      .set('Cookie', await asUser('u1', 'EU'))
    expect(res.status).toBe(200)
    expect(res.body.logs.every((l: any) => l.doc !== 'TEST-SCOPING-AHT-2')).toBe(true)
    const anon = await request(app).get('/api/audit-logs?role=SA')
    expect(anon.status).toBe(401)
  })

  it('allows APR to see audit logs within their assigned companies and own logs', async () => {
    const res = await request(app).get('/api/audit-logs').set('Cookie', await asUser('u6', 'APR', { companies: ['AH'] }))
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    // APR on AH should see AH logs and own log
    const hasU1 = res.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-1')
    const hasU6 = res.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-3')
    expect(hasU1).toBe(true)
    expect(hasU6).toBe(true)

    // Should NOT see AHT log
    const hasU2 = res.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AHT-2')
    expect(hasU2).toBe(false)
  })

  it('allows ADM and itsupport to see all audit logs across the system', async () => {
    // itsupport
    const resSupport = await request(app).get('/api/audit-logs').set('Cookie', await asUser('sa-test', 'SA'))
    expect(resSupport.body.ok).toBe(true)

    expect(resSupport.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-1')).toBe(true)
    expect(resSupport.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AHT-2')).toBe(true)
    expect(resSupport.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-3')).toBe(true)

    // ADM
    const resAdm = await request(app).get('/api/audit-logs').set('Cookie', await asUser('u7', 'ADM'))
    expect(resAdm.body.ok).toBe(true)
    expect(resAdm.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AH-1')).toBe(true)
    expect(resAdm.body.logs.some((l: any) => l.doc === 'TEST-SCOPING-AHT-2')).toBe(true)
  })
})
