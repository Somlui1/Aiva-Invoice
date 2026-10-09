/**
 * `GET /api/documents/[id]` — one document, with its evidence (design §4.1, Task 8).
 *
 * The queue list is deliberately lean; the boxes that make the evidence dock
 * light up are fetched here, for the one document the analyst opened. That keeps
 * a 125-document list at list size while the overlay still gets every box the
 * Engine reported.
 *
 * The id is validated before it touches the database: it is a document identity
 * that ends up in a path and in log lines, and `../etc/passwd` is not one.
 */
import { NextRequest, NextResponse } from 'next/server'

import { loadQueueDoc, SAFE_DOC_ID, UnreadableDocumentError } from '@/server/portalDocs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = (await ctx.params) ?? { id: '' }

  if (!SAFE_DOC_ID.test(id)) {
    return NextResponse.json(
      {
        ok: false,
        source: 'portal_db',
        error: 'รหัสเอกสารไม่ถูกต้อง (รูปแบบที่รองรับ: DMS-ตามด้วยตัวเลข)',
      },
      { status: 400 },
    )
  }

  try {
    const document = await loadQueueDoc(id)
    if (!document) {
      return NextResponse.json(
        { ok: false, source: 'portal_db', error: `ไม่พบเอกสาร ${id} ในฐานข้อมูล` },
        { status: 404 },
      )
    }
    return NextResponse.json(
      { ok: true, source: 'portal_db', document },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    if (err instanceof UnreadableDocumentError) {
      return NextResponse.json({ ok: false, source: 'portal_db', error: err.message }, { status: 422 })
    }
    const error = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { ok: false, source: 'portal_db', error: `อ่านฐานข้อมูลไม่สำเร็จ: ${error}` },
      { status: 500 },
    )
  }
}
