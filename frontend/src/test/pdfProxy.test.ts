import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'
import path from 'node:path'
import { AddressInfo } from 'node:net'
import { NextRequest } from 'next/server'
import { GET } from '../app/api/documents/[id]/pdf/route'

/**
 * The PDF proxy has three sources (live DMS -> cached file -> synthetic mock)
 * and only the last one is guaranteed to exist, so the test has to pin down
 * which source answered, not merely that bytes came back. Everything here runs
 * offline: the "live DMS" is a throwaway local server.
 */
const DOC_ID = 'DMS-100'

const get = (id: string) =>
  GET(new NextRequest(`http://localhost/api/documents/${encodeURIComponent(id)}/pdf`), {
    params: Promise.resolve({ id }),
  })

let prisma: any
let originalBaseUrl: string | undefined
let originalToken: string | undefined

beforeAll(async () => {
  originalBaseUrl = process.env.PAPERLESS_BASE_URL
  originalToken = process.env.PAPERLESS_API_TOKEN
  delete process.env.PAPERLESS_BASE_URL
  delete process.env.PAPERLESS_API_TOKEN

  prisma = (await import('../lib/prisma')).prisma
  // Own rows, created explicitly: this file must not depend on another test
  // file having seeded the database first.
  for (const id of [DOC_ID, 'DMS-900']) {
    const data = {
      dmsDocId: id, packageId: `PKG-${id}`, fileSha256: `sha256:${id}`, pageCount: 5,
      invoiceNum: 'INV-1', invoiceDate: '2026-07-01', companyCode: 'AHT', supplierTaxId: '1',
      supplierName: 'X', grandTotal: 1, currency: 'THB', status: 'Review', recommendation: 'REVIEW',
      maxSeverity: 'Medium', payloadJson: '{}',
    }
    await prisma.document.upsert({ where: { id }, create: { id, ...data }, update: data })
  }
})

afterAll(async () => {
  if (originalBaseUrl !== undefined) process.env.PAPERLESS_BASE_URL = originalBaseUrl
  else delete process.env.PAPERLESS_BASE_URL
  if (originalToken !== undefined) process.env.PAPERLESS_API_TOKEN = originalToken
  else delete process.env.PAPERLESS_API_TOKEN

  await prisma.validationRun.deleteMany({ where: { documentId: { in: [DOC_ID, 'DMS-900'] } } })
  await prisma.document.deleteMany({ where: { id: { in: [DOC_ID, 'DMS-900'] } } })
})

const PDF_MAGIC = '%PDF'
const assertRealPdf = (buf: Buffer) => {
  expect(buf.length, 'pdf body must not be empty').toBeGreaterThan(100)
  expect(buf.subarray(0, 4).toString()).toBe(PDF_MAGIC)
}

describe('GET /api/documents/[id]/pdf', () => {
  it('returns a real PDF with the required headers', async () => {
    const res = await get(DOC_ID)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('inline')
    expect(res.headers.get('Content-Disposition')).toContain('DMS-100.pdf')
    const source = res.headers.get('X-PDF-Source')
    expect(['dms_live', 'cache', 'fallback_mock']).toContain(source)

    const buf = Buffer.from(await res.arrayBuffer())
    assertRealPdf(buf)
    expect(Number(res.headers.get('Content-Length'))).toBe(buf.length)
  })

  it('answers 404 for a document that is not in the database', async () => {
    const res = await get('DMS-999999')
    expect(res.status).toBe(404)
    expect((await res.json()).ok).toBe(false)
  })

  it('never lets the id reach the filesystem unvalidated (path traversal)', async () => {
    for (const evil of ['../../engine/.cache/downloads/DMS-100', 'DMS-100/../../etc/passwd', '']) {
      const res = await get(evil)
      expect([400, 404]).toContain(res.status)
      expect(res.headers.get('Content-Type')).not.toBe('application/pdf')
    }
  })

  it('streams a multi-MB cached file without truncating it', async () => {
    const fs = await import('node:fs')
    const crypto = await import('node:crypto')
    const file = path.resolve(process.cwd(), '../engine/.cache/downloads/DMS-100.pdf')
    if (!fs.existsSync(file)) return // No cache on this machine: layer not exercised.

    const onDisk = fs.readFileSync(file)
    expect(onDisk.length).toBeGreaterThan(1_000_000) // genuinely multi-MB

    const res = await get(DOC_ID)
    expect(res.headers.get('X-PDF-Source')).toBe('cache')
    const served = Buffer.from(await res.arrayBuffer())
    const md5 = (b: Buffer) => crypto.createHash('md5').update(b).digest('hex')
    expect(served.length).toBe(onDisk.length)
    expect(md5(served)).toBe(md5(onDisk)) // byte-for-byte, end to end
  })

  it('generates a structurally valid PDF (pdf.js must be able to parse it)', async () => {
    const { buildMockPdf } = await import('../lib/mockPdf')
    const buf = buildMockPdf('DMS-7 - offline placeholder (DMS unreachable)')

    expect(buf.subarray(0, 8).toString()).toBe('%PDF-1.4')
    expect(buf.subarray(-6).toString()).toContain('%%EOF')

    // Every xref offset must land exactly on its own object header.
    const text = buf.toString('latin1')
    // Anchor to the line start: plain indexOf('xref') also matches the 'xref'
    // inside 'startxref', which sits *after* the table.
    const xrefAt = text.search(/^xref$/m)
    expect(xrefAt).toBeGreaterThan(0)
    const startxref = Number(text.match(/startxref\n(\d+)/)?.[1])
    expect(startxref, 'startxref must point at the xref table').toBe(xrefAt)

    const entries = [...text.slice(xrefAt).matchAll(/^(\d{10}) 00000 n $/gm)].map(m => Number(m[1]))
    expect(entries.length).toBe(5)
    entries.forEach((off, i) => {
      expect(text.slice(off, off + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`)
    })
    // The declared stream length must match the bytes actually inside stream..endstream.
    const streamStart = text.indexOf('stream\n') + 'stream\n'.length
    const streamEnd = text.indexOf('\nendstream')
    expect(Number(text.match(/<< \/Length (\d+) >>/)![1])).toBe(streamEnd - streamStart)
    expect(text.slice(streamStart, streamStart + 3)).toBe('BT ')
  })

  it('falls back to a valid mock PDF when DMS is unreachable', async () => {
    const prevUrl = process.env.PAPERLESS_BASE_URL
    const prevToken = process.env.PAPERLESS_API_TOKEN
    process.env.PAPERLESS_BASE_URL = 'http://127.0.0.1:1' // dead port
    process.env.PAPERLESS_API_TOKEN = 'secret-token'
    try {
      const res = await get('DMS-900') // no cached file for this id
      expect(res.status).toBe(200)
      expect(res.headers.get('X-PDF-Source')).toBe('fallback_mock')
      expect(res.headers.get('X-PDF-Fallback-Reason')).toBeTruthy()
      // The stored scan has 5 pages, but the mock being served has 1: the header
      // must describe the bytes, or Task 7 would navigate to a page that isn't there.
      expect(res.headers.get('X-PDF-Pages')).toBe('1')
      expect(res.headers.get('X-PDF-Mock')).toBe('true')
      expect(res.headers.get('X-PDF-Real-Pages')).toBe('5')
      assertRealPdf(Buffer.from(await res.arrayBuffer()))
      // The token must never leak into the response.
      expect(JSON.stringify([...res.headers])).not.toContain('secret-token')
    } finally {
      if (prevUrl === undefined) delete process.env.PAPERLESS_BASE_URL
      else process.env.PAPERLESS_BASE_URL = prevUrl
      if (prevToken === undefined) delete process.env.PAPERLESS_API_TOKEN
      else process.env.PAPERLESS_API_TOKEN = prevToken
    }
  })

  describe('live DMS proxy', () => {
    let server: http.Server
    let baseUrl: string
    const seen: { url: string; auth: string | undefined }[] = []
    let mode: 'pdf' | 'not_pdf' = 'pdf'
    const fakePdf = Buffer.concat([
      Buffer.from('%PDF-1.4\n'),
      Buffer.from('% fake upstream pdf body '.repeat(20)),
      Buffer.from('\n%%EOF\n'),
    ])

    beforeAll(async () => {
      server = http.createServer((req, res) => {
        seen.push({ url: req.url ?? '', auth: req.headers.authorization })
        if (mode === 'not_pdf') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end('{"detail":"not a pdf"}')
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': String(fakePdf.length) })
        res.end(fakePdf)
      })
      await new Promise<void>(r => server.listen(0, '127.0.0.1', r))
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    afterAll(async () => {
      await new Promise<void>(r => server.close(() => r()))
      delete process.env.PAPERLESS_BASE_URL
      delete process.env.PAPERLESS_API_TOKEN
    })

    it('streams upstream bytes and forwards the Token auth header', async () => {
      seen.length = 0
      mode = 'pdf'
      process.env.PAPERLESS_BASE_URL = baseUrl
      process.env.PAPERLESS_API_TOKEN = 'test-token-123'

      const res = await get(DOC_ID)
      expect(res.status).toBe(200)
      expect(res.headers.get('X-PDF-Source')).toBe('dms_live')
      expect(Buffer.from(await res.arrayBuffer()).equals(fakePdf)).toBe(true)

      // Same endpoint + auth scheme the Engine's own reader uses.
      expect(seen.length).toBeGreaterThan(0)
      expect(seen[0].url).toContain('/api/documents/100/download/')
      expect(seen[0].auth).toBe('Token test-token-123')
    })

    it('refuses to pass non-PDF bytes upstream, falling back instead', async () => {
      mode = 'not_pdf'
      process.env.PAPERLESS_BASE_URL = baseUrl
      process.env.PAPERLESS_API_TOKEN = 'test-token-123'

      const res = await get('DMS-900')
      expect(res.status).toBe(200)
      // A JSON error page must never be served as application/pdf.
      expect(res.headers.get('X-PDF-Source')).not.toBe('dms_live')
      assertRealPdf(Buffer.from(await res.arrayBuffer()))
    })
  })
})
