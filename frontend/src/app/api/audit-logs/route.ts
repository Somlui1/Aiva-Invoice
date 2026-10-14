import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const formatted = logs.map(l => ({
      id: l.id,
      dt: l.createdAt.toISOString().slice(0, 10),
      t: l.createdAt.toTimeString().slice(0, 8),
      who: l.who,
      role: l.role,
      act: l.act,
      doc: l.docId,
      detail: l.detail,
    }))

    return NextResponse.json({ ok: true, logs: formatted })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to fetch audit logs' },
      { status: 500 },
    )
  }
}
