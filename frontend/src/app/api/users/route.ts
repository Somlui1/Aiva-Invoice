import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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
    const dbUsers = await prisma.user.findMany({
      include: {
        companies: true,
        receivers: true,
      },
      orderBy: { createdAt: 'asc' },
    })

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

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          docId: 'USER_MANAGEMENT',
          whoId: adminId,
          who: 'IT Admin',
          role: 'ADM',
          act: 'บันทึกสิทธิ์ผู้ใช้',
          action: 'SAVE_USER',
          detail: `บันทึกผู้ใช้ ${u.name} (${u.email}) · Role: ${u.role} · Scope: ${
            u.role === 'EU' ? data.receivers.join(', ') : data.companies.join(', ')
          }`,
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
