import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    let whereClause: any = undefined

    if (req && req.url) {
      const url = new URL(req.url)
      const whoId = url.searchParams.get('whoId')
      const role = url.searchParams.get('role')
      const companiesParam = url.searchParams.get('companies')
      const companies = companiesParam
        ? companiesParam.split(',').map(c => c.trim()).filter(Boolean)
        : []

      if (role === 'ADM' || role === 'itsupport') {
        whereClause = undefined
      } else if (role === 'APR') {
        const matchedDocs = await prisma.document.findMany({
          where: { companyCode: { in: companies } },
          select: { id: true },
        })
        const companyDocIds = matchedDocs.map(d => d.id)

        whereClause = {
          OR: [
            ...(whoId ? [{ whoId }] : []),
            ...(companyDocIds.length > 0 ? [{ docId: { in: companyDocIds } }] : []),
            ...companies.flatMap(c => [
              { detail: { contains: ` ${c} ` } },
              { detail: { startsWith: `${c} ` } },
              { detail: { contains: `[${c}]` } },
              { detail: { contains: `(${c})` } },
              { docId: { contains: `-${c}-` } },
            ]),
          ],
        }
      } else if (whoId) {
        whereClause = { whoId }
      }
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
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
