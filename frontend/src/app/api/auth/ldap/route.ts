import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { USERS } from '@/mock/users'
import { authenticateWithAd } from '@/lib/adAuth'

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
    const sam = cleanUser.includes('@') ? cleanUser.split('@')[0] : cleanUser

    // 1. Authenticate against real Active Directory (10.10.10.250:389)
    let adResult = await authenticateWithAd(cleanUser, password)

    // Fallback for offline dev/test environments
    if (!adResult.ok && adResult.kind === 'timeout') {
      const isItsupport = (cleanUser === 'itsupport' || cleanUser === 'itsupport@aapico.com') && password === 'support'
      const matchedMock = USERS.find(u => u.id.toLowerCase() === sam || u.email.toLowerCase().startsWith(sam))
      if (isItsupport) {
        adResult = {
          ok: true,
          user: {
            samAccount: 'itsupport',
            name: 'IT Support',
            email: 'itsupport@aapico.com',
            unit: 'IT Support',
            title: 'IT Admin',
          },
        }
      } else if (matchedMock && password === 'support') {
        adResult = {
          ok: true,
          user: {
            samAccount: matchedMock.id,
            name: matchedMock.n,
            email: matchedMock.email,
            unit: matchedMock.unit,
          },
        }
      }
    }

    if (!adResult.ok) {
      try {
        await prisma.auditLog.create({
          data: {
            who: username,
            role: 'GUEST',
            docId: 'AUTH',
            act: 'เข้าสู่ระบบไม่สำเร็จ',
            action: 'login_failed',
            detail: `ชื่อผู้ใช้หรือรหัสผ่าน Active Directory ไม่ถูกต้อง: ${username}`,
          },
        })
      } catch {}

      return NextResponse.json(
        { ok: false, kind: adResult.kind, error: adResult.error },
        { status: adResult.kind === 'cred' ? 401 : 502 }
      )
    }

    const adUser = adResult.user

    // 2. Map user role and scope in Portal DB
    const isItsupport = adUser.samAccount.toLowerCase() === 'itsupport' || adUser.email.toLowerCase() === 'itsupport@aapico.com'
    
    // Check if user already exists in DB
    const existingDbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adUser.email },
          { samAccount: adUser.samAccount },
        ],
      },
      include: {
        companies: true,
        receivers: true,
      },
    })

    // Check mock fallback users if not in DB
    const matchedMock = USERS.find(
      u => u.id.toLowerCase() === adUser.samAccount.toLowerCase() || u.email.toLowerCase() === adUser.email.toLowerCase()
    )

    const assignedRole = isItsupport
      ? 'SA'
      : (existingDbUser?.role || matchedMock?.role || 'EU') as 'EU' | 'ACC' | 'APR' | 'ADM' | 'SA'

    const assignedCompanies = isItsupport
      ? ['AH', 'AHA', 'AHT', 'AHP', 'AM']
      : existingDbUser?.companies.map(c => c.companyCode) || matchedMock?.co || ['AH']

    const assignedReceivers = isItsupport
      ? []
      : existingDbUser?.receivers.map(r => r.receiverName) || (matchedMock?.rcvName && matchedMock?.rcvName !== '—' ? [matchedMock.rcvName] : [])

    // Ensure user record is updated in prisma.user
    try {
      await prisma.user.upsert({
        where: { email: adUser.email },
        create: {
          id: existingDbUser?.id || matchedMock?.id || adUser.samAccount,
          email: adUser.email,
          name: adUser.name,
          samAccount: adUser.samAccount,
          empId: adUser.empId || null,
          unit: adUser.unit || null,
          role: assignedRole,
        },
        update: {
          name: adUser.name,
          samAccount: adUser.samAccount,
          empId: adUser.empId || undefined,
          unit: adUser.unit || undefined,
          role: assignedRole,
        },
      })
    } catch {}

    // Audit log successful AD login
    try {
      await prisma.auditLog.create({
        data: {
          who: adUser.name,
          role: assignedRole === 'ADM' ? 'ผู้ดูแลระบบ (IT)' : assignedRole,
          docId: 'AUTH',
          act: 'เข้าสู่ระบบ',
          action: 'login_ldap',
          detail: `เข้าสู่ระบบสำเร็จผ่าน Active Directory (LDAP): ${adUser.samAccount} (${adUser.email})`,
        },
      })
    } catch {}

    const response = NextResponse.json({
      ok: true,
      user: {
        id: existingDbUser?.id || matchedMock?.id || adUser.samAccount,
        name: adUser.name,
        email: adUser.email,
        role: assignedRole,
        companies: assignedCompanies,
        oracleAccounts: assignedReceivers,
      },
    })

    response.cookies.set('aiva_session', existingDbUser?.id || matchedMock?.id || adUser.samAccount, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 7,
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
