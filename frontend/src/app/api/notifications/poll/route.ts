/**
 * Notification polling endpoint — `GET /api/notifications/poll`.
 *
 * Scopes new document arrivals to the current user's role and assigned companies/receivers:
 *  - 'SA' | 'ADM': Sees all new documents across all entities.
 *  - 'APR' | 'ACC': Sees only new documents matching their assigned company codes.
 *  - 'EU': Sees only new documents matching their assigned receivers or companies.
 */
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sinceParam = url.searchParams.get('since')
    const role = url.searchParams.get('role') || 'EU'
    const companiesParam = url.searchParams.get('companies')
    const receiversParam = url.searchParams.get('receivers')

    const companies = companiesParam
      ? companiesParam.split(',').map(c => c.trim()).filter(Boolean)
      : []
    const receivers = receiversParam
      ? receiversParam.split(',').map(r => r.trim()).filter(Boolean)
      : []

    // If no since param is passed, look back 30 seconds by default
    const sinceDate = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 30000)

    let whereClause: any = {
      createdAt: {
        gt: sinceDate,
      },
    }

    if (role === 'SA' || role === 'ADM') {
      // Super Admin and Admin see all companies
    } else if (role === 'APR' || role === 'ACC') {
      // Approver & Accountant: Scoped to their mapped companies
      if (companies.length === 0) {
        return NextResponse.json({ ok: true, count: 0, newDocuments: [] })
      }
      whereClause.companyCode = { in: companies }
    } else {
      // End User (EU): Scoped to assigned receivers OR companies
      const orConditions: any[] = []
      if (receivers.length > 0) {
        orConditions.push({ receiverName: { in: receivers } })
      }
      if (companies.length > 0) {
        orConditions.push({ companyCode: { in: companies } })
      }

      if (orConditions.length > 0) {
        whereClause.OR = orConditions
      } else {
        return NextResponse.json({ ok: true, count: 0, newDocuments: [] })
      }
    }

    const docs = await prisma.document.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        invoiceNum: true,
        supplierName: true,
        companyCode: true,
        grandTotal: true,
        currency: true,
        status: true,
        receiverName: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      count: docs.length,
      newDocuments: docs,
      serverTime: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[NotificationsPoll] Error:', err)
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to poll notifications' },
      { status: 500 }
    )
  }
}
