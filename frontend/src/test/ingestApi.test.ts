import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { POST } from '../app/api/engine/ingest/route'
import { NextRequest } from 'next/server'

describe('POST /api/engine/ingest', () => {
  it('ingests valid engine payload with idempotency check', async () => {
    const raw = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json'), 'utf-8'))
    const req = new NextRequest('http://localhost:3000/api/engine/ingest', {
      method: 'POST',
      body: JSON.stringify(raw),
      headers: { 'Content-Type': 'application/json' }
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.dmsDocId).toBe('DMS-100')
  })
})

/**
 * Coverage beyond the plan's single happy path: the point of this route is the
 * contract boundary plus idempotency, so those are what must be pinned down.
 * Runs against an isolated test database (see vitest global setup).
 */
const DMS100 = () =>
  JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json'), 'utf-8'),
  )

const postJson = (body: unknown) =>
  POST(
    new NextRequest('http://localhost:3000/api/engine/ingest', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  )

describe('POST /api/engine/ingest — persistence & idempotency', () => {
  it('persists Document + ValidationRun, storing the raw Engine payload', async () => {
    const { prisma } = await import('../lib/prisma')
    const raw = DMS100()
    const res = await postJson(raw)
    expect(res.status).toBe(200)

    const doc = await prisma.document.findUnique({ where: { id: 'DMS-100' } })
    expect(doc).not.toBeNull()
    expect(doc?.dmsDocId).toBe('DMS-100')
    expect(doc?.status).toBe('Manual Review')
    expect(doc?.recommendation).toBe('MANUAL_REVIEW')
    expect(doc?.companyCode).toBe('AHT')
    expect(doc?.grandTotal).toBe(34989)
    expect(doc?.packageId).toBe('PKG-DMS-100')
    expect(doc?.fileSha256).toBe(raw.package.file_sha256)
    expect(doc?.pageCount).toBe(5)

    // payloadJson holds the Portal-side document, not the Engine payload.
    const portal = JSON.parse(doc!.payloadJson)
    expect(portal.stepProgress.step3.status).toBe('warn')
    expect(portal.bboxes.length).toBeGreaterThan(0)
    expect(portal.id).toBe('DMS-100')

    const run = await prisma.validationRun.findUnique({
      where: { validationId: raw.request.validation_id },
    })
    expect(run).not.toBeNull()
    expect(run?.documentId).toBe('DMS-100')
    expect(run?.validationRound).toBe(1)
    // rawEngineResult must be the untouched Engine payload.
    expect(JSON.parse(run!.rawEngineResult).contract).toBe('aiva.system_a.result/3.0')
  })

  it('answers an exact replay with 200 idempotent_replay and writes nothing new', async () => {
    const { prisma } = await import('../lib/prisma')
    const raw = DMS100()
    await postJson(raw)
    const runsBefore = await prisma.validationRun.count()
    const docsBefore = await prisma.document.count()

    const res = await postJson(raw)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.idempotent_replay).toBe(true)
    expect(data.dmsDocId).toBe('DMS-100')

    expect(await prisma.validationRun.count()).toBe(runsBefore)
    expect(await prisma.document.count()).toBe(docsBefore)
  })

  it('treats a same-validation_id payload with a different file hash as a conflict', async () => {
    const raw = DMS100()
    await postJson(raw)
    const clash = structuredClone(raw)
    clash.package.file_sha256 = 'sha256:' + '0'.repeat(64)
    const res = await postJson(clash)
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.ok).toBe(false)
  })

  it('accepts a genuinely new validation round and updates the document', async () => {
    const { prisma } = await import('../lib/prisma')
    const raw = DMS100()
    await postJson(raw)

    const round2 = structuredClone(raw)
    round2.request.validation_id = raw.request.validation_id + '-R2'
    round2.request.validation_round = 2
    round2.recommendation = { value: 'AUTO_PASS', max_severity: 'None', exception_codes: [], reasons: [], halted_by: null }
    round2.rule_results = round2.rule_results.map((r: any) => ({ ...r, result: 'pass' }))
    round2.exceptions = []

    const res = await postJson(round2)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.idempotent_replay).toBe(false)

    const runs = await prisma.validationRun.findMany({ where: { documentId: 'DMS-100' } })
    expect(runs.length).toBe(2)
    expect(runs.map(r => r.validationRound).sort()).toEqual([1, 2])

    // Document keeps exactly one row and reflects the latest round.
    expect(await prisma.document.count({ where: { id: 'DMS-100' } })).toBe(1)
    const doc = await prisma.document.findUnique({ where: { id: 'DMS-100' } })
    expect(doc?.status).toBe('Auto-pass')
    expect(JSON.parse(doc!.payloadJson).stepProgress.step3.status).toBe('ok')
  })

  it('rejects a contract-invalid payload with 422 and writes nothing', async () => {
    const { prisma } = await import('../lib/prisma')
    const bad = DMS100()
    bad.recommendation.value = 'PROBABLY_FINE'
    bad.request.dms_doc_id = 'DMS-999001'
    const before = await prisma.document.count()

    const res = await postJson(bad)
    expect(res.status).toBe(422)
    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(Array.isArray(data.errors)).toBe(true)
    expect(data.errors.join(' ')).toContain('recommendation')
    expect(await prisma.document.count()).toBe(before)
  })

  it('rejects a payload carrying Portal-owned keys with 422 (decoupling guard)', async () => {
    const { prisma } = await import('../lib/prisma')
    const bad = DMS100()
    bad.ap_status = 'posted'
    bad.request.dms_doc_id = 'DMS-999002'
    const before = await prisma.document.count()

    const res = await postJson(bad)
    expect(res.status).toBe(422)
    expect(((await res.json()).errors ?? []).join(' ')).toContain('ap_status')
    expect(await prisma.document.count()).toBe(before)
  })

  it('rejects a malformed JSON body with 400', async () => {
    const res = await postJson('{ this is not json')
    expect(res.status).toBe(400)
    expect((await res.json()).ok).toBe(false)
  })

  it('rejects a non-object body with 422', async () => {
    const res = await postJson({ unexpected: 'shape' })
    expect(res.status).toBe(422)
    expect((await res.json()).ok).toBe(false)
  })
})
