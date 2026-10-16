import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { USERS, INITIAL_MAPS } from '@/mock/users'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const USER_SAVE_SCHEMA = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  samAccount: z.string().optional(),
  empId: z.string().optional(),
  unit: z.string().optional(),
  role: z.enum(['EU', 'ACC', 'APR', 'ADM', 'SA']),
  companies: z.array(z.string()).default([]),
  receivers: z.array(z.string()).default([]),
})

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    let dbUsers = await prisma.user.findMany({
      include: {
        companies: true,
        receivers: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // If database has no users yet, seed from USERS and INITIAL_MAPS
    if (dbUsers.length === 0) {
      for (const u of USERS) {
        const uReceivers = INITIAL_MAPS.filter(m => m.user === u.id).map(m => m.acct)
        await prisma.user.create({
          data: {
            id: u.id,
            email: u.email,
            name: u.n,
            samAccount: u.email.split('@')[0],
            empId: u.emp ? String(u.emp) : null,
            unit: u.unit,
            role: u.role,
            companies: {
              create: (u.co || []).map(c => ({ companyCode: c })),
            },
            receivers: {
              create: uReceivers.map(r => ({ receiverName: r, assignedBy: 'u7' })),
            },
          },
        })
      }

      dbUsers = await prisma.user.findMany({
        include: {
          companies: true,
          receivers: true,
        },
        orderBy: { createdAt: 'asc' },
      })
    }

    const formatted = dbUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      samAccount: u.samAccount || u.email.split('@')[0],
      empId: u.empId,
      unit: u.unit,
      role: u.role,
      companies: u.companies.map(c => c.companyCode),
      receivers: u.receivers.map(r => r.receiverName),
      isActive: u.isActive,
    }))

    return NextResponse.json({ ok: true, users: formatted })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to list users' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = USER_SAVE_SCHEMA.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const data = parsed.data
  const adminId = req.headers.get('x-user-id') || 'u7'

  try {
    const user = await prisma.$transaction(async tx => {
      // 0. Find existing user to compute diff
      const existingUser = await tx.user.findUnique({
        where: { email: data.email },
        include: {
          companies: true,
          receivers: true,
        },
      })
      const isNew = !existingUser

      // 1. Upsert User
      const u = await tx.user.upsert({
        where: { email: data.email },
        create: {
          id: data.id || `u_${Date.now()}`,
          email: data.email,
          name: data.name,
          samAccount: data.samAccount || data.email.split('@')[0],
          empId: data.empId,
          unit: data.unit,
          role: data.role,
        },
        update: {
          name: data.name,
          samAccount: data.samAccount || data.email.split('@')[0],
          empId: data.empId,
          unit: data.unit,
          role: data.role,
        },
      })

      // 2. Synchronize Companies
      await tx.userCompany.deleteMany({ where: { userId: u.id } })
      if (data.companies.length > 0) {
        await tx.userCompany.createMany({
          data: data.companies.map(c => ({ userId: u.id, companyCode: c })),
        })
      }

      // 3. Synchronize Receivers
      await tx.userReceiverMap.deleteMany({ where: { userId: u.id } })
      if (data.receivers.length > 0) {
        await tx.userReceiverMap.createMany({
          data: data.receivers.map(r => ({
            userId: u.id,
            receiverName: r,
            assignedBy: adminId,
          })),
        })
      }

      // 4. Calculate diff
      const prevCompanies = existingUser ? existingUser.companies.map(c => c.companyCode) : []
      const newCompanies = data.companies
      const addedCompanies = newCompanies.filter(c => !prevCompanies.includes(c))
      const removedCompanies = prevCompanies.filter(c => !newCompanies.includes(c))

      const prevReceivers = existingUser ? existingUser.receivers.map(r => r.receiverName) : []
      const newReceivers = data.receivers
      const addedReceivers = newReceivers.filter(r => !prevReceivers.includes(r))
      const removedReceivers = prevReceivers.filter(r => !newReceivers.includes(r))

      const prevRole = existingUser ? existingUser.role : null
      const roleChanged = existingUser ? existingUser.role !== data.role : false

      const category = isNew ? 'RBAC_USER' : 'RBAC_PERMISSION'
      const action = isNew ? 'CREATE_USER' : 'UPDATE_PERMISSIONS'
      const act = isNew ? 'สร้างผู้ใช้ใหม่' : 'แก้ไขสิทธิ์ผู้ใช้'

      let diffDesc = ''
      if (isNew) {
        diffDesc = `สร้างผู้ใช้ใหม่: ${u.name} (${u.email}) · Role: ${u.role} · Scope: ${
          u.role === 'EU' ? data.receivers.join(', ') : data.companies.join(', ')
        }`
      } else {
        const parts: string[] = []
        if (roleChanged) parts.push(`เปลี่ยนบทบาท ${prevRole} -> ${data.role}`)
        if (addedCompanies.length > 0) parts.push(`เพิ่มบริษัท [${addedCompanies.join(', ')}]`)
        if (removedCompanies.length > 0) parts.push(`ลดบริษัท [${removedCompanies.join(', ')}]`)
        if (addedReceivers.length > 0) parts.push(`เพิ่มผู้รับ [${addedReceivers.join(', ')}]`)
        if (removedReceivers.length > 0) parts.push(`ลดผู้รับ [${removedReceivers.join(', ')}]`)
        if (parts.length === 0) parts.push('อัปเดตข้อมูลทั่วไป')
        diffDesc = `แก้ไขสิทธิ์ผู้ใช้ ${u.name} (${u.email}): ${parts.join(' · ')}`
      }

      const metadata = isNew
        ? {
            isNew: true,
            role: data.role,
            companies: data.companies,
            receivers: data.receivers,
          }
        : {
            isNew: false,
            prevRole,
            newRole: data.role,
            roleChanged,
            addedCompanies,
            removedCompanies,
            addedReceivers,
            removedReceivers,
          }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          category,
          docId: 'USER_MANAGEMENT',
          whoId: adminId,
          who: 'IT Admin',
          role: 'ADM',
          act,
          action,
          detail: diffDesc,
          metadataJson: JSON.stringify(metadata),
        },
      })

      return u
    })

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companies: data.companies,
        receivers: data.receivers,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to save user' },
      { status: 500 },
    )
  }
}
