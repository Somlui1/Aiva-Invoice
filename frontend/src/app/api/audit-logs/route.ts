import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADMIN_ONLY_CATEGORIES = ['RBAC_USER', 'RBAC_PERMISSION']

export async function GET(req: Request) {
  try {
    let whereClause: any = {}
    const conditions: any[] = []

    if (req && req.url) {
      const url = new URL(req.url)
      const whoId = url.searchParams.get('whoId')
      const role = url.searchParams.get('role')
      const category = url.searchParams.get('category')?.trim()
      const search = url.searchParams.get('search')?.trim()
      const companiesParam = url.searchParams.get('companies')
      const companies = companiesParam
        ? companiesParam.split(',').map(c => c.trim()).filter(Boolean)
        : []

      const isAdmin = role === 'ADM' || role === 'SA'

      // 1. RBAC Security Scoping
      if (!isAdmin) {
        // Non-admin users cannot access administrative user/permission logs
        if (category && ADMIN_ONLY_CATEGORIES.includes(category)) {
          return NextResponse.json({ ok: true, logs: [] })
        }
        conditions.push({
          category: { notIn: ADMIN_ONLY_CATEGORIES },
        })

        if (role === 'APR' || role === 'ACC') {
          const matchedDocs = await prisma.document.findMany({
            where: { companyCode: { in: companies } },
            select: { id: true },
          })
          const companyDocIds = matchedDocs.map(d => d.id)

          conditions.push({
            OR: [
              ...(whoId ? [{ whoId }] : []),
              ...(companyDocIds.length > 0 ? [{ docId: { in: companyDocIds } }] : []),
              ...companies.flatMap(c => [
                { detail: { contains: ` ${c} ` } },
                { detail: { startsWith: `${c} ` } },
                { detail: { contains: `[${c}]` } },
                { detail: { contains: `(${c})` } },
                { detail: { contains: ` ${c},` } },
                { detail: { contains: `บริษัท ${c}` } },
                { docId: { contains: `-${c}-` } },
                { docId: { contains: `${c}-` } },
              ]),
            ],
          })
        } else if (whoId) {
          conditions.push({ whoId })
        }
      }

      // 2. Category Filter
      if (category && category !== 'ALL') {
        conditions.push({ category })
      }

      // 3. Text Search Filter (who, act, detail, docId)
      if (search) {
        conditions.push({
          OR: [
            { who: { contains: search } },
            { act: { contains: search } },
            { detail: { contains: search } },
            { docId: { contains: search } },
          ],
        })
      }
    }

    if (conditions.length > 0) {
      whereClause = { AND: conditions }
    } else {
      whereClause = undefined
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const formatted = logs.map(l => ({
      id: l.id,
      dt: l.createdAt.toISOString().slice(0, 10),
      t: l.createdAt.toTimeString().slice(0, 8),
      category: l.category,
      who: l.who,
      role: l.role,
      act: l.act,
      doc: l.docId,
      detail: l.detail,
      metadataJson: l.metadataJson,
    }))

    return NextResponse.json({ ok: true, logs: formatted })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to fetch audit logs' },
      { status: 500 },
    )
  }
}
