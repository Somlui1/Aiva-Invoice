/**
 * DMS PDF streaming proxy — `GET /api/documents/[id]/pdf` (design §4.1).
 *
 * The browser must never see the Paperless master token, so the Portal fetches
 * the original scan server-side and streams it on. Three sources, best first:
 *
 *   1. `dms_live`       — Paperless-NGX, when configured and reachable
 *   2. `cache`          — the Engine's own downloaded copy on disk, so offline
 *                         development still shows the *real* pages (the bbox
 *                         coordinates only line up against real page geometry)
 *   3. `fallback_mock`  — a generated single-page PDF; always succeeds, never
 *                         lies about being a PDF
 *
 * The caller learns which one answered via `X-PDF-Source`, so a silently
 * degraded viewer is impossible. Order matters for safety: the id is validated
 * and looked up in the database *before* any path is built or network call made.
 */
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildMockPdf } from '@/lib/mockPdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Portal document ids are `DMS-<digits>`; nothing else may reach fs or DMS. */
const SAFE_ID = /^DMS-\d{1,7}$/
const PDF_MAGIC = '%PDF'

type PdfSource = 'dms_live' | 'cache' | 'fallback_mock'

interface PdfBody {
  body: BodyInit
  length?: number
  reason?: string
}

function paperlessConfig() {
  // The Engine already uses PAPERLESS_BASE_URL / PAPERLESS_API_TOKEN; the
  // shorter aliases are accepted so a hand-written .env also works.
  const base = (process.env.PAPERLESS_BASE_URL ?? process.env.PAPERLESS_URL ?? '').trim().replace(/\/+$/, '')
  const token = (process.env.PAPERLESS_API_TOKEN ?? process.env.PAPERLESS_TOKEN ?? '').trim()
  const timeoutMs = Number(process.env.PAPERLESS_TIMEOUT_MS ?? 10_000)
  return { base, token, timeoutMs }
}

function cacheDir(): string {
  return (process.env.PDF_CACHE_DIR ?? '').trim() || path.resolve(process.cwd(), '../engine/.cache/downloads')
}

function isPdfPrefix(chunk: Uint8Array | undefined | null): boolean {
  return !!chunk && chunk.length >= 4 && Buffer.from(chunk.slice(0, 4)).toString() === PDF_MAGIC
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const rawId = (await ctx.params)?.id ?? ''
  const id = rawId.trim()

  if (!SAFE_ID.test(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid document id', http: 400 }, { status: 400 })
  }

  // Existence check first: an unknown id must not trigger filesystem reads,
  // an upstream request, or a mock that makes a typo look like a real document.
  const doc = await prisma.document.findFirst({
    where: { OR: [{ id }, { dmsDocId: id }] },
    select: { id: true, dmsDocId: true, pageCount: true },
  })
  if (!doc) {
    return NextResponse.json({ ok: false, error: `Document ${id} not found`, http: 404 }, { status: 404 })
  }

  const filename = `${doc.id}.pdf`
  const attempts: PdfSource[] = ['dms_live', 'cache', 'fallback_mock']
  const reasons: string[] = []

  for (const source of attempts) {
    let got: PdfBody | null = null
    try {
      if (source === 'dms_live') got = await fromPaperless(doc.dmsDocId, reasons)
      else if (source === 'cache') got = fromCache(doc.id, reasons)
      else got = fromMock(doc.id, reasons)
    } catch (e) {
      reasons.push(`${source}: ${String(e instanceof Error ? e.message : e)}`)
      got = null
    }
    if (!got) continue

    // On a fallback, say what the earlier layers tried: a degraded viewer is
    // otherwise indistinguishable from a broken one.
    if (source !== 'dms_live' && !got.reason && reasons.length) got.reason = reasons.join('; ')

    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'X-PDF-Source': source,
      // A PDF can be re-validated by the Engine at any time; never cache it.
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'none',
    })
    if (got.length !== undefined) headers.set('Content-Length', String(got.length))
    // X-PDF-Pages describes the bytes in *this* response; X-PDF-Real-Pages is
    // the stored scan's page count. They differ only for the mock, and Task 7
    // needs both: navigation must not seek pages that aren't in the response,
    // while the overlay still has to know the document's true page count.
    if (doc.pageCount) headers.set('X-PDF-Real-Pages', String(doc.pageCount))
    headers.set('X-PDF-Pages', source === 'fallback_mock' ? '1' : String(doc.pageCount ?? ''))
    if (source === 'fallback_mock') headers.set('X-PDF-Mock', 'true')
    if (got.reason) headers.set('X-PDF-Fallback-Reason', got.reason.slice(0, 200))

    return new NextResponse(got.body as BodyInit, { status: 200, headers })
  }

  // fromMock cannot fail, so this is unreachable; kept honest rather than fatal.
  return NextResponse.json(
    { ok: false, error: 'No PDF source available', reasons, http: 500 },
    { status: 500 },
  )
}

/** Layer 1: stream from Paperless-NGX, mirroring the Engine's download rules. */
async function fromPaperless(dmsDocId: string, reasons: string[]): Promise<PdfBody | null> {
  const { base, token, timeoutMs } = paperlessConfig()
  if (!base) {
    reasons.push('dms_live: PAPERLESS_BASE_URL not configured')
    return null
  }
  const numeric = dmsDocId.match(/(\d+)$/)?.[1]
  if (!numeric) {
    reasons.push(`dms_live: "${dmsDocId}" has no numeric Paperless id`)
    return null
  }

  // Same request the Engine's PaperlessReader makes: the uploaded original
  // first, then the OCRmyPDF archive when the original is not a PDF.
  const url = `${base}/api/documents/${numeric}/download/`
  for (const original of ['true', undefined] as const) {
    const target = original ? `${url}?original=${original}` : url
    let res: Response
    try {
      res = await fetch(target, {
        headers: token ? { Authorization: `Token ${token}` } : {},
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      })
    } catch (e) {
      reasons.push(`dms_live: ${target} unreachable (${String(e instanceof Error ? e.message : e)})`)
      return null // Transport failure: retrying the archive cannot help.
    }
    if (!res.ok || !res.body) {
      reasons.push(`dms_live: HTTP ${res.status}`)
      continue
    }

    const reader = res.body.getReader()
    const first = await reader.read()
    if (!isPdfPrefix(first.value)) {
      await reader.cancel('not a pdf')
      reasons.push(`dms_live: HTTP 200 body is not a PDF`)
      continue
    }
    return {
      body: streamWithPeek(first.value as Uint8Array, reader),
      length: Number(res.headers.get('Content-Length')) || undefined,
    }
  }
  return null
}

/** Re-emits the peeked chunk ahead of the rest, so validation stays streaming. */
function streamWithPeek(first: Uint8Array, reader: ReadableStreamDefaultReader<Uint8Array>): ReadableStream {
  let pending: Uint8Array | null = first
  return new ReadableStream({
    async pull(controller) {
      if (pending) {
        controller.enqueue(pending)
        pending = null
        return
      }
      const { done, value } = await reader.read()
      if (done) controller.close()
      else controller.enqueue(value)
    },
    cancel(reason) {
      reader.cancel(reason).catch(() => {})
    },
  })
}

/** Layer 2: the Engine's downloaded copy, if it exists and really is a PDF. */
function fromCache(id: string, reasons: string[]): PdfBody | null {
  const dir = cacheDir()
  // id is regex-validated above, so this path cannot escape the cache directory.
  const file = path.join(dir, `${id}.pdf`)
  if (!fs.existsSync(file)) {
    reasons.push(`cache: ${path.relative(process.cwd(), file)} not found`)
    return null
  }
  const st = fs.statSync(file)
  if (!st.isFile() || st.size < 32) {
    reasons.push('cache: file missing or too small to be a PDF')
    return null
  }
  const fd = fs.openSync(file, 'r')
  try {
    const head = Buffer.alloc(5)
    const read = fs.readSync(fd, head, 0, 5, 0)
    if (read < 4 || head.subarray(0, 4).toString() !== PDF_MAGIC) {
      reasons.push('cache: file does not start with %PDF')
      return null
    }
  } finally {
    fs.closeSync(fd)
  }
  // Node's stream/web ReadableStream and the DOM ReadableStream type are not
  // structurally identical in TS, though they are interchangeable at runtime;
  // the hop through unknown is what keeps a real stream instead of buffering.
  return {
    body: Readable.toWeb(fs.createReadStream(file)) as unknown as BodyInit,
    length: st.size,
  }
}

/** Layer 3: always-available placeholder, so the viewer always has a PDF. */
function fromMock(id: string, reasons: string[]): PdfBody {
  const buf = buildMockPdf(`${id} - offline placeholder (DMS unreachable)`)
  return { body: buf, length: buf.length, reason: reasons.join('; ') || 'no DMS connection' }
}
