/**
 * `GET /api/documents` — the queue's data source (design §4.1, Task 8).
 *
 * This endpoint used to proxy a Python side-service and fall back to a hard-coded
 * array. It now reads the same database the Engine writes through
 * `POST /api/engine/ingest`, and returns rows already in the shape the queue
 * renders, so the browser holds no adaptation logic of its own.
 *
 * Which filters run where, and why:
 *
 *  • **Company** is a real column, so it is pushed into SQL.
 *  • **Status, lane (`assigned`) and search** are *derived* — the UI status comes
 *    from `uiStatusFor`, the lane from `assignedLaneFor`, the search string spans
 *    exception codes the columns do not hold. Filtering those in SQL would let
 *    the endpoint and the screen disagree about a document, which is worse than
 *    scanning: at 125 documents the whole load-and-map pass costs tens of
 *    milliseconds. A corpus large enough to make that hurt needs the derivation
 *    stored in columns, not a second implementation of it in SQL.
 *  • **Pagination happens after filtering**, so `total` is the filtered count.
 *
 * Order is `sortDocsFor` — the mockup's ordering with a deterministic tiebreak —
 * because paging must not show the same document twice or skip one.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { loadQueueDocs } from '@/server/portalDocs'
import { matchesSearchQuery, sortDocsFor } from '@/lib/queueFilters'
import type { InvoiceDoc } from '@/types/invoice'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** The four states the Engine can leave a document in, plus workflow states. */
const STATUS_VALUES = [
  'Auto-pass',
  'Review',
  'Hold',
  'Manual Review',
  'Duplicate',
  'Confirmed',
  'Posted',
  'Sent',
  'Rejected',
  'Superseded',
  'Import Failed',
] as const

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
/** A calendar date, not merely twelve digits: `2026-13-01` is not one. */
const isoDate = z
  .string()
  .regex(DATE_RE, 'expected YYYY-MM-DD')
  .refine(v => {
    const [y, m, d] = v.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    return (
      date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    )
  }, 'not a real date')

const LIST_QUERY = z.object({
  status: z.enum(STATUS_VALUES).optional(),
  company: z.string().regex(/^[A-Za-z0-9?_-]{1,8}$/, 'unknown company code').optional(),
  assigned: z.enum(['eu', 'acc']).optional(),
  q: z.string().max(120).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
  include: z.enum(['boxes']).optional(),
})

function badRequest(error: string) {
  return NextResponse.json({ ok: false, source: 'portal_db', error }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const parsed = LIST_QUERY.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const where = first?.path.join('.') ?? 'query'
    return badRequest(`${where}: ${first?.message ?? 'invalid parameter'}`)
  }
  const q = parsed.data
  if (q.from && q.to && q.from > q.to) return badRequest('from: ต้องไม่เกิน to')

  try {
    const { docs, skipped } = await loadQueueDocs(
      q.company ? { companyCode: q.company } : {},
      { includeBoxes: q.include === 'boxes' },
    )

    const filtered = docs
      .filter(d => (q.status ? d.status === q.status : true))
      .filter(d => (q.assigned ? d.assigned === q.assigned : true))
      .filter(d => (q.from ? d.up >= q.from : true))
      .filter(d => (q.to ? d.up <= q.to : true))
      .filter(d => matchesSearchQuery(d, q.q ?? ''))

    const ordered = sortDocsFor(filtered, q.status ?? 'all')
    const page = ordered.slice(q.offset, q.offset + q.limit)

    const body = {
      ok: true,
      source: 'portal_db',
      total: ordered.length,
      count: page.length,
      offset: q.offset,
      documents: page as InvoiceDoc[],
      // Rows the database holds but the queue cannot show. Never silent: a
      // missing document is a document somebody has to chase.
      skipped: skipped.length ? skipped : undefined,
    }
    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'no-store',
        ...(skipped.length ? { 'X-Documents-Skipped': skipped.join(',') } : {}),
      },
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { ok: false, source: 'portal_db', error: `อ่านฐานข้อมูลไม่สำเร็จ: ${error}` },
      { status: 500 },
    )
  }
}
