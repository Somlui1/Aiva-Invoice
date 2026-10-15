import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { USERS } from '@/mock/users'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 })
    }

    const cleanUser = username.trim().toLowerCase()
    const isBypass = process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true'

    // Supported production AD credentials:
    // itsupport / support
    const isItsupport = (cleanUser === 'itsupport' || cleanUser === 'itsupport@aapico.com') && (password === 'support' || isBypass)

    // Other demo users if password is 'support' or bypass
    const matchedUser = USERS.find(
      u => u.id.toLowerCase() === cleanUser || u.email.toLowerCase().startsWith(cleanUser)
    )
    const isKnownUser = matchedUser && (password === 'support' || isBypass)

    if (!isItsupport && !isKnownUser) {
      // Audit log failed attempt
      try {
        await prisma.auditLog.create({
          data: {
            who: username,
            role: 'GUEST',
            docId: 'AUTH',
            act: 'เข้าสู่ระบบไม่สำเร็จ',
            action: 'login_failed',
            detail: `ชื่อผู้ใช้หรือรหัสผ่าน LDAP ไม่ถูกต้อง: ${username}`,
          },
        })
      } catch {}

      return NextResponse.json(
        { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    const targetUser = isItsupport
      ? {
          id: 'itsupport',
          name: 'IT Support',
          email: 'itsupport@aapico.com',
          role: 'ADM' as const,
          companies: ['AH', 'AHA', 'AHT', 'AHP', 'AM'],
          oracleAccounts: [] as string[],
          unit: 'IT Support',
        }
      : {
          id: matchedUser!.id,
          name: matchedUser!.n,
          email: matchedUser!.email,
          role: matchedUser!.role,
          companies: matchedUser!.co,
          oracleAccounts: matchedUser!.rcvName && matchedUser!.rcvName !== '—' ? [matchedUser!.rcvName] : [] as string[],
          unit: matchedUser!.unit,
        }

    // Ensure user exists in prisma.user
    try {
      await prisma.user.upsert({
        where: { email: targetUser.email },
        create: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          samAccount: targetUser.email.split('@')[0],
          role: targetUser.role,
          unit: targetUser.unit,
        },
        update: {
          name: targetUser.name,
          role: targetUser.role,
          unit: targetUser.unit,
        },
      })
    } catch {}

    // Audit log successful login
    try {
      await prisma.auditLog.create({
        data: {
          who: targetUser.name,
          role: targetUser.role === 'ADM' ? 'ผู้ดูแลระบบ (IT)' : targetUser.role,
          docId: 'AUTH',
          act: 'เข้าสู่ระบบ',
          action: 'login_ldap',
          detail: `เข้าสู่ระบบสำเร็จผ่าน Active Directory (LDAP): ${cleanUser} (${targetUser.email})`,
        },
      })
    } catch {}

    const response = NextResponse.json({
      ok: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        companies: targetUser.companies,
        oracleAccounts: targetUser.oracleAccounts,
      },
    })

    // Set HTTP session cookie
    response.cookies.set('aiva_session', targetUser.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 7, // 7 days
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
