import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { prisma } from '../../src/lib/prisma'
import { buildMockPdf } from '../../src/lib/mockPdf'
import { pdfFallbacksEnabled } from '../../src/server/auth/config'

export const pdfProxyRouter = Router()

const SAFE_ID = /^DMS-\d{1,7}$/
const PDF_MAGIC = '%PDF'
type PdfSource = 'dms_live' | 'cache' | 'fallback_mock'

function paperlessConfig() {
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

async function fromPaperless(dmsDocId: string, reasons: string[]) {
  const { base, token, timeoutMs } = paperlessConfig()
  if (!base || !token) {
    reasons.push('dms_live: PAPERLESS_URL or PAPERLESS_TOKEN not set')
    return null
  }

  const numeric = dmsDocId.match(/(\d+)$/)?.[1]
  if (!numeric) {
    reasons.push(`dms_live: "${dmsDocId}" has no numeric Paperless id`)
    return null
  }
  const url = `${base}/api/documents/${numeric}/download/`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Token ${token}` },
      signal: controller.signal,
    })
    if (!upstream.ok) {
      reasons.push(`dms_live: HTTP ${upstream.status} ${upstream.statusText}`)
      return null
    }

    const buf = Buffer.from(await upstream.arrayBuffer())
    if (!isPdfPrefix(buf)) {
      reasons.push('dms_live: upstream payload lacks %PDF magic')
      return null
    }

    return {
      buffer: buf,
      length: buf.length,
    }
  } catch (err: any) {
    reasons.push(`dms_live: ${err.message}`)
    return null
  } finally {
    clearTimeout(timer)
  }
}

function fromCache(id: string, reasons: string[]) {
  const cDir = cacheDir()
  const candidates = [
    path.join(cDir, `${id}.pdf`),
    path.join(cDir, `${id.replace(/^DMS-/, '')}.pdf`),
    path.join(cDir, `${id}.PDF`),
    // Development fixtures — never served in production.
    ...(pdfFallbacksEnabled()
      ? [
          path.resolve(process.cwd(), `temp/paperless_invoices_v5/${id}/${id}.pdf`),
          path.resolve(process.cwd(), `temp/paperless_invoices_v5/${id}.pdf`),
        ]
      : []),
  ]

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const buf = fs.readFileSync(candidate)
        if (isPdfPrefix(buf)) {
          return { buffer: buf, length: buf.length }
        }
      }
    } catch {}
  }

  reasons.push(`cache: no valid cached PDF found in ${cDir}`)
  return null
}

function fromMock(id: string, _reasons: string[]) {
  const buf = buildMockPdf(id)
  return { buffer: buf, length: buf.length, reason: 'generated fallback mock PDF' }
}

/**
 * GET /api/documents/:id/pdf
 */
pdfProxyRouter.get('/:id/pdf', async (req, res) => {
  const rawId = req.params.id ?? ''
  const id = rawId.trim()

  if (!SAFE_ID.test(id)) {
    return res.status(400).json({ ok: false, error: 'Invalid document id', http: 400 })
  }

  const doc = await prisma.document.findFirst({
    where: { OR: [{ id }, { dmsDocId: id }] },
    select: { id: true, dmsDocId: true, pageCount: true },
  })

  if (!doc) {
    return res.status(404).json({ ok: false, error: `Document ${id} not found`, http: 404 })
  }

  const filename = `${doc.id}.pdf`
  // Production never shows a generated stand-in: a reviewer must not judge a fake document.
  const attempts: PdfSource[] = pdfFallbacksEnabled() ? ['dms_live', 'cache', 'fallback_mock'] : ['dms_live', 'cache']
  const reasons: string[] = []

  for (const source of attempts) {
    let got: { buffer: Buffer; length: number; reason?: string } | null = null
    try {
      if (source === 'dms_live') got = await fromPaperless(doc.dmsDocId, reasons)
      else if (source === 'cache') got = fromCache(doc.id, reasons)
      else got = fromMock(doc.id, reasons)
    } catch (e: any) {
      reasons.push(`${source}: ${e.message}`)
      got = null
    }

    if (!got) continue

    if (source !== 'dms_live' && !got.reason && reasons.length) {
      got.reason = reasons.join('; ')
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    res.setHeader('X-PDF-Source', source)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Accept-Ranges', 'none')
    if (doc.pageCount) res.setHeader('X-PDF-Real-Pages', String(doc.pageCount))
    res.setHeader('X-PDF-Pages', source === 'fallback_mock' ? '1' : String(doc.pageCount ?? 1))
    if (source === 'fallback_mock') res.setHeader('X-PDF-Mock', 'true')
    if (got.reason) {
      res.setHeader('X-PDF-Fallback-Reason', got.reason.slice(0, 200))
      res.setHeader('X-PDF-Reason', got.reason)
    }
    if (got.length) res.setHeader('Content-Length', String(got.length))

    return res.end(got.buffer)
  }

  return res.status(502).json({ ok: false, error: 'All PDF delivery sources failed' })
})
