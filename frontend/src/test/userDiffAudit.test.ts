import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as saveUser } from '../app/api/users/route'
import { prisma } from '../lib/prisma'

describe('User Provisioning & Permission Change Diff Audit Logging', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: 'diff_test@aapico.com' } }).catch(() => {})
    await prisma.auditLog.deleteMany({ where: { docId: 'USER_MANAGEMENT' } }).catch(() => {})
  })

  it('records RBAC_USER audit log with metadata when creating a new user', async () => {
    const newUserPayload = {
      email: 'diff_test@aapico.com',
      name: 'Diff Test User',
      role: 'EU',
      companies: ['AH'],
      receivers: ['DIFF_RCV_1'],
    }

    const req = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      headers: { 'x-user-id': 'admin_u1' },
      body: JSON.stringify(newUserPayload),
    })

    const res = await saveUser(req)
    expect(res.status).toBe(200)

    const log = await prisma.auditLog.findFirst({
      where: { docId: 'USER_MANAGEMENT', whoId: 'admin_u1' },
      orderBy: { createdAt: 'desc' },
    })

    expect(log).not.toBeNull()
    expect(log?.category).toBe('RBAC_USER')
    expect(log?.action).toBe('CREATE_USER')
    expect(log?.act).toBe('สร้างผู้ใช้ใหม่')
    expect(log?.detail).toContain('Diff Test User')
    expect(log?.metadataJson).toBeDefined()

    const meta = JSON.parse(log?.metadataJson || '{}')
    expect(meta.isNew).toBe(true)
    expect(meta.role).toBe('EU')
    expect(meta.companies).toContain('AH')
  })

  it('records RBAC_PERMISSION audit log with structured diff when updating permissions', async () => {
    // 1. Initial creation
    const initReq = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      headers: { 'x-user-id': 'admin_u1' },
      body: JSON.stringify({
        email: 'diff_test@aapico.com',
        name: 'Diff Test User',
        role: 'EU',
        companies: ['AH'],
        receivers: ['DIFF_RCV_1'],
      }),
    })
    await saveUser(initReq)

    // 2. Update with modified companies and role
    const updateReq = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      headers: { 'x-user-id': 'admin_u2' },
      body: JSON.stringify({
        email: 'diff_test@aapico.com',
        name: 'Diff Test User',
        role: 'ACC', // Changed role
        companies: ['AH', 'AHP'], // Added AHP
        receivers: ['DIFF_RCV_1', 'DIFF_RCV_2'], // Added RCV_2
      }),
    })

    const updateRes = await saveUser(updateReq)
    expect(updateRes.status).toBe(200)

    // Latest audit log should be RBAC_PERMISSION
    const log = await prisma.auditLog.findFirst({
      where: { docId: 'USER_MANAGEMENT', whoId: 'admin_u2' },
      orderBy: { createdAt: 'desc' },
    })

    expect(log).not.toBeNull()
    expect(log?.category).toBe('RBAC_PERMISSION')
    expect(log?.action).toBe('UPDATE_PERMISSIONS')
    expect(log?.act).toBe('แก้ไขสิทธิ์ผู้ใช้')
    expect(log?.detail).toContain('AHP')
    expect(log?.detail).toContain('DIFF_RCV_2')

    const diff = JSON.parse(log?.metadataJson || '{}')
    expect(diff.prevRole).toBe('EU')
    expect(diff.newRole).toBe('ACC')
    expect(diff.addedCompanies).toEqual(['AHP'])
    expect(diff.removedCompanies).toEqual([])
    expect(diff.addedReceivers).toEqual(['DIFF_RCV_2'])
  })
})
