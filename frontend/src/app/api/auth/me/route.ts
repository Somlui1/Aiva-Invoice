import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { USERS } from '@/mock/users'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Check cookie or header or query parameter
  const sessionCookie = req.cookies.get('aiva_session')?.value
  const headerUser = req.headers.get('x-user-id')
  const queryUser = req.nextUrl.searchParams.get('userId')
  const targetId = sessionCookie || headerUser || queryUser

  if (!targetId) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 })
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetId },
          { email: targetId },
          { samAccount: targetId },
        ],
      },
      include: {
        companies: true,
        receivers: true,
      },
    })

    if (dbUser) {
      const companies = dbUser.companies.map(c => c.companyCode)
      return NextResponse.json({
        ok: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          empId: dbUser.empId,
          unit: dbUser.unit,
          companies: companies.length > 0 ? companies : ['AH', 'AHA', 'AHT', 'AHP', 'AM'],
          oracleAccounts: dbUser.receivers.map(r => r.receiverName),
        },
      })
    }

    // Fallback to mock users if not yet in database
    const mock = USERS.find(u => u.id === targetId || u.email === targetId)
    if (mock) {
      return NextResponse.json({
        ok: true,
        user: {
          id: mock.id,
          name: mock.n,
          email: mock.email,
          role: mock.role,
          empId: mock.emp ? String(mock.emp) : null,
          unit: mock.unit,
          companies: mock.co || ['AH'],
          oracleAccounts: mock.rcvName && mock.rcvName !== '—' ? [mock.rcvName] : [],
        },
      })
    }

    return NextResponse.json({ ok: false, user: null }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
