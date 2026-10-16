import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autoSeedCompanies } from '@/lib/autoSeedSample'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Ensure companies are seeded
    const count = await prisma.company.count().catch(() => 0)
    if (count === 0) {
      await autoSeedCompanies()
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()
    const activeOnly = searchParams.get('active') === 'true'

    let whereClause: any = {}

    if (activeOnly) {
      whereClause.isActive = true
    }

    if (search) {
      const searchNum = parseInt(search, 10)
      const isNum = !isNaN(searchNum)

      whereClause.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { ouName: { contains: search } },
        { taxId: { contains: search } },
        { ledgerName: { contains: search } },
        ...(isNum ? [{ orgId: searchNum }] : []),
      ]
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      orderBy: [{ orgId: 'asc' }, { code: 'asc' }],
    })

    return NextResponse.json({
      ok: true,
      companies,
      count: companies.length,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to fetch companies' },
      { status: 500 },
    )
  }
}
