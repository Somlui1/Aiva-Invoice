/**
 * Business-key duplicate resolution, end to end through POST /api/engine/ingest (real Express app,
 * real Prisma / SQLite test database).
 *
 *   RESOLVED   → primary key receive_id            UNRESOLVED → no key, never auto-matched
 *   NOT_FOUND  → secondary key tax id + invoice no.
 *   Engine ranking Auto-pass > Review > Hold > Manual Review · DR-01 … DR-05, DR-07
 *
 * Every test builds its own invoice (unique tax id / invoice no. / receipt / DMS ids) and deletes
 * its rows afterwards, so it neither depends on nor disturbs the other suites sharing the test DB.
 * The pure rules are pinned separately in duplicateResolution.test.ts.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'

const app = createExpressApp()
const post = (body: unknown) => request(app).post('/api/engine/ingest').send(body as object)

// ---------------------------------------------------------------------------- builders

const FIXTURE = fs.readFileSync(path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json'), 'utf-8')

type Rec = 'AUTO_PASS' | 'REVIEW' | 'HOLD' | 'MANUAL_REVIEW'
const STATUS: Record<Rec, string> = {
  AUTO_PASS: 'Auto-pass',
  REVIEW: 'Review',
  HOLD: 'Hold',
  MANUAL_REVIEW: 'Manual Review',
}
const RECS = Object.keys(STATUS) as Rec[]

interface Invoice {
  tax: string
  inv: string
  /** Oracle receipt number; null = Oracle found nothing. */
  receipt: string | null
}

interface ScanOpts {
  /** Re-use a DMS id (re-validation of the same document). */
  id?: string
  round?: number
  vid?: string
  /** Explicit `identity` block; omitted = the Portal derives it from oracle_snapshot. */
  identity?: Record<string, unknown>
}

let seq = 0
const created: string[] = []

const newId = () => {
  const id = `DMS-91${String(++seq).padStart(5, '0')}`
  created.push(id)
  return id
}
const newInvoice = (receipt: string | null | 'auto' = 'auto'): Invoice => {
  const n = ++seq
  return {
    tax: `0990${String(n).padStart(9, '0')}`,
    inv: `BKINV-${n}`,
    receipt: receipt === 'auto' ? `RBK${n}` : receipt,
  }
}
const sha = (s: string) => 'sha256:' + createHash('sha256').update(`${s}#${++seq}`).digest('hex')

/** One Engine result: the DMS-100 fixture, re-keyed to `inv` and given the Engine verdict `rec`. */
function scan(inv: Invoice, rec: Rec, o: ScanOpts = {}) {
  const raw = JSON.parse(FIXTURE)
  const id = o.id ?? newId()
  const round = o.round ?? 1
  raw.request.validation_id = o.vid ?? `VAL-BK-${id}-R${round}`
  raw.request.validation_round = round
  raw.request.dms_doc_id = id
  raw.package.dms_doc_id = id
  raw.package.package_id = `PKG-${id}`
  raw.package.file_sha256 = sha(`${id}-${round}-${rec}`)
  raw.normalized_fields.supplier_tax_id = inv.tax
  raw.normalized_fields.invoice_num = inv.inv
  raw.oracle_snapshot.receipt_nums = inv.receipt ? [inv.receipt] : []
  raw.recommendation = {
    value: rec,
    max_severity: rec === 'AUTO_PASS' ? 'None' : 'Medium',
    exception_codes: [],
    reasons: [],
    halted_by: null,
  }
  raw.exceptions = []
  if (o.identity) raw.identity = o.identity
  return raw
}

const row = (id: string) => prisma.document.findUnique({ where: { id } })
const payloadOf = async (id: string) => JSON.parse((await row(id))!.payloadJson)
const openRows = (where: object) =>
  prisma.document.findMany({ where: { ...where, status: { notIn: ['Duplicate', 'Superseded', 'Rejected'] } } })

afterEach(async () => {
  const ids = created.splice(0)
  if (!ids.length) return
  await prisma.auditLog.deleteMany({ where: { docId: { in: ids } } })
  await prisma.document.deleteMany({ where: { id: { in: ids } } }) // ValidationRun + bboxes cascade
})

// ===========================================================================
// 1. Repeated RESOLVED scans (2–3+ rounds)
// ===========================================================================

describe('RESOLVED — repeated scans of one receipt', () => {
  it('stores the business keys on a first scan and treats it as a plain new document (DR-07)', async () => {
    const inv = newInvoice()
    const a = scan(inv, 'HOLD')
    const res = await post(a)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ok: true,
      status: 'Hold',
      identity_status: 'RESOLVED',
      applied_rule: 'DR-07',
      matched_by: null,
      supersedes: null,
      duplicate_of: null,
    })
    const doc = (await row(a.request.dms_doc_id))!
    expect(doc).toMatchObject({
      identityStatus: 'RESOLVED',
      receiveId: inv.receipt,
      receiptNum: inv.receipt,
      secondaryKey: `${inv.tax}|${inv.inv.toUpperCase()}`,
      missingKeys: null,
      status: 'Hold',
    })
    expect(JSON.parse(doc.payloadJson).identity).toMatchObject({ status: 'RESOLVED', receiveId: inv.receipt })
  })

  it('three rounds: better → equal → worse, each compared with the CURRENT document', async () => {
    const inv = newInvoice()

    // Round 1
    const a1 = scan(inv, 'HOLD')
    expect((await post(a1)).body.status).toBe('Hold')

    // Round 2 — better (Review < Hold): A1 is superseded
    const a2 = scan(inv, 'REVIEW')
    const r2 = await post(a2)
    expect(r2.body).toMatchObject({
      status: 'Review',
      applied_rule: 'DR-01',
      matched_by: 'RECEIVE_ID',
      supersedes: a1.request.dms_doc_id,
    })

    // Round 3 — equal (Review = Review): A2 is superseded, A3 carries the Engine status
    const a3 = scan(inv, 'REVIEW')
    const r3 = await post(a3)
    expect(r3.body).toMatchObject({ status: 'Review', applied_rule: 'DR-02', supersedes: a2.request.dms_doc_id })

    const [d1, d2, d3] = await Promise.all([a1, a2, a3].map(s => row(s.request.dms_doc_id)))
    expect(d1).toMatchObject({ status: 'Superseded', supersededById: a2.request.dms_doc_id })
    expect(d2).toMatchObject({ status: 'Superseded', supersededById: a3.request.dms_doc_id, supersedesId: d1!.id })
    expect(d3).toMatchObject({ status: 'Review', supersedesId: d2!.id, supersededById: null, drRule: 'DR-02' })

    // History is kept: the receipt now has three rows, exactly one of them open.
    expect(await prisma.document.count({ where: { receiveId: inv.receipt! } })).toBe(3)
    expect((await openRows({ receiveId: inv.receipt! })).map(d => d.id)).toEqual([d3!.id])

    // Round 4 — worse (Hold > Review): the current document (A3) stays; the new one is a Duplicate
    const a4 = scan(inv, 'HOLD')
    const r4 = await post(a4)
    expect(r4.body).toMatchObject({ status: 'Duplicate', applied_rule: 'DR-03', duplicate_of: d3!.id })
    expect((await row(d3!.id))!.status).toBe('Review')
    expect((await row(a4.request.dms_doc_id))).toMatchObject({ status: 'Duplicate', duplicateOfId: d3!.id })

    // Round 5 — better than A3. The NEWEST row is the Duplicate A4, but A3 is the current document.
    const a5 = scan(inv, 'AUTO_PASS')
    const r5 = await post(a5)
    expect(r5.body).toMatchObject({ status: 'Auto-pass', applied_rule: 'DR-01', supersedes: d3!.id })
    expect((await row(d3!.id))!.status).toBe('Superseded')
    expect((await row(a4.request.dms_doc_id))!.status).toBe('Duplicate') // history is left as it was
    expect(await prisma.document.count({ where: { receiveId: inv.receipt! } })).toBe(5)
  })

  it('writes the verdict into the stored payload the queue reads, with history on both documents', async () => {
    const inv = newInvoice()
    const a1 = scan(inv, 'HOLD')
    const a2 = scan(inv, 'REVIEW')
    await post(a1)
    await post(a2)

    const old = await payloadOf(a1.request.dms_doc_id)
    expect(old).toMatchObject({ status: 'Superseded', supersededBy: a2.request.dms_doc_id, supRule: 'DR-01' })
    expect(old.history.at(-1).act).toContain('Superseded')

    const fresh = await payloadOf(a2.request.dms_doc_id)
    expect(fresh).toMatchObject({ status: 'Review', supersedes: a1.request.dms_doc_id, supRule: 'DR-01' })
    expect(fresh.history.at(-1).act).toContain(a1.request.dms_doc_id)

    const log = await prisma.auditLog.findMany({ where: { docId: a1.request.dms_doc_id } })
    const sup = log.find(l => l.action === 'SUPERSEDE')
    expect(sup).toMatchObject({ action: 'SUPERSEDE', fromStatus: 'Hold', toStatus: 'Superseded', reason: 'DR-01' })
  })

  it('ignores Rejected / Duplicate rows when choosing the current document (DR-05)', async () => {
    const inv = newInvoice()
    const a1 = scan(inv, 'HOLD')
    await post(a1)
    await prisma.document.update({ where: { id: a1.request.dms_doc_id }, data: { status: 'Rejected' } })

    const a2 = scan(inv, 'MANUAL_REVIEW')
    const res = await post(a2)
    expect(res.body).toMatchObject({ status: 'Manual Review', applied_rule: 'DR-05', supersedes: null, duplicate_of: null })
    expect((await row(a1.request.dms_doc_id))!.status).toBe('Rejected') // not Superseded
  })

  it('does not let the receive_id become a technical unique key', async () => {
    const inv = newInvoice()
    await post(scan(inv, 'REVIEW'))
    await post(scan(inv, 'REVIEW'))
    await post(scan(inv, 'REVIEW'))
    expect(await prisma.document.count({ where: { receiveId: inv.receipt! } })).toBe(3)
  })

  it('different receipts of the same supplier never interact', async () => {
    const a = newInvoice()
    const b = { ...newInvoice(), tax: a.tax } // same supplier, different invoice + receipt
    await post(scan(a, 'HOLD'))
    const res = await post(scan(b, 'AUTO_PASS'))
    expect(res.body.applied_rule).toBe('DR-07')
  })
})

// ===========================================================================
// 2. Engine ranking: better / equal / worse (full 4 × 4)
// ===========================================================================

describe('Engine ranking Auto-pass > Review > Hold > Manual Review', () => {
  const cases = RECS.flatMap((oldRec, i) =>
    RECS.map((newRec, j) => ({
      oldRec,
      newRec,
      rule: j < i ? 'DR-01' : j === i ? 'DR-02' : 'DR-03',
    })),
  )

  it.each(cases)('current $oldRec, new $newRec → $rule', async ({ oldRec, newRec, rule }) => {
    const inv = newInvoice()
    const first = scan(inv, oldRec)
    const second = scan(inv, newRec)
    await post(first)
    const res = await post(second)

    expect(res.status).toBe(200)
    expect(res.body.applied_rule).toBe(rule)
    const oldDoc = (await row(first.request.dms_doc_id))!
    const newDoc = (await row(second.request.dms_doc_id))!

    if (rule === 'DR-03') {
      expect(oldDoc.status).toBe(STATUS[oldRec]) // the current document is left alone
      expect(newDoc).toMatchObject({ status: 'Duplicate', duplicateOfId: oldDoc.id })
      expect(newDoc.recommendation).toBe(newRec) // the Engine's own verdict is still recorded
    } else {
      expect(oldDoc).toMatchObject({ status: 'Superseded', supersededById: newDoc.id })
      expect(newDoc).toMatchObject({ status: STATUS[newRec], supersedesId: oldDoc.id })
    }
  })
})

// ===========================================================================
// 3. NOT_FOUND → RESOLVED through the secondary key
// ===========================================================================

describe('NOT_FOUND (secondary key) and NOT_FOUND → RESOLVED', () => {
  it('a NOT_FOUND scan has no receive_id and is keyed by supplier_tax_id + invoice_num', async () => {
    const inv = newInvoice(null)
    const a = scan(inv, 'HOLD')
    const res = await post(a)
    expect(res.body).toMatchObject({ ok: true, identity_status: 'NOT_FOUND', status: 'Hold' })
    expect(await row(a.request.dms_doc_id)).toMatchObject({
      identityStatus: 'NOT_FOUND',
      receiveId: null,
      receiptNum: null,
      secondaryKey: `${inv.tax}|${inv.inv.toUpperCase()}`,
    })
  })

  it('a later RESOLVED scan finds the NOT_FOUND document by the secondary key and applies the normal rules', async () => {
    const withoutReceipt = newInvoice(null)
    const n1 = scan(withoutReceipt, 'HOLD')
    await post(n1)

    // The receipt has appeared in Oracle: same supplier + invoice number, now with a receive_id.
    const resolved: Invoice = { ...withoutReceipt, receipt: `RBK-FOUND-${++seq}` }
    const n2 = scan(resolved, 'REVIEW')
    const res = await post(n2)

    expect(res.body).toMatchObject({
      identity_status: 'RESOLVED',
      status: 'Review',
      applied_rule: 'DR-01',
      matched_by: 'SECONDARY_KEY',
      supersedes: n1.request.dms_doc_id,
    })
    expect(await row(n1.request.dms_doc_id)).toMatchObject({ status: 'Superseded', receiveId: null })
    expect(await row(n2.request.dms_doc_id)).toMatchObject({ status: 'Review', receiveId: resolved.receipt })

    // From now on the primary key takes over — and the superseded NOT_FOUND row is history.
    const n3 = scan(resolved, 'REVIEW')
    const res3 = await post(n3)
    expect(res3.body).toMatchObject({ applied_rule: 'DR-02', matched_by: 'RECEIVE_ID', supersedes: n2.request.dms_doc_id })
  })

  it('NOT_FOUND → RESOLVED: a worse RESOLVED scan becomes the Duplicate', async () => {
    const withoutReceipt = newInvoice(null)
    const n1 = scan(withoutReceipt, 'REVIEW')
    await post(n1)
    const n2 = scan({ ...withoutReceipt, receipt: `RBK-FOUND-${++seq}` }, 'MANUAL_REVIEW')
    const res = await post(n2)
    expect(res.body).toMatchObject({ status: 'Duplicate', applied_rule: 'DR-03', duplicate_of: n1.request.dms_doc_id })
    expect((await row(n1.request.dms_doc_id))!.status).toBe('Review')
  })

  it('NOT_FOUND → RESOLVED against a Confirmed NOT_FOUND document is a Duplicate (DR-04)', async () => {
    const withoutReceipt = newInvoice(null)
    const n1 = scan(withoutReceipt, 'REVIEW')
    await post(n1)
    await prisma.document.update({ where: { id: n1.request.dms_doc_id }, data: { status: 'Confirmed' } })

    const n2 = scan({ ...withoutReceipt, receipt: `RBK-FOUND-${++seq}` }, 'AUTO_PASS')
    const res = await post(n2)
    expect(res.body).toMatchObject({ status: 'Duplicate', applied_rule: 'DR-04', duplicate_of: n1.request.dms_doc_id })
    expect((await row(n1.request.dms_doc_id))!.status).toBe('Confirmed')
  })

  it('two NOT_FOUND scans of one invoice follow the ranking (equal → DR-02)', async () => {
    const inv = newInvoice(null)
    const n1 = scan(inv, 'HOLD')
    const n2 = scan(inv, 'HOLD')
    await post(n1)
    const res = await post(n2)
    expect(res.body).toMatchObject({ applied_rule: 'DR-02', matched_by: 'SECONDARY_KEY', status: 'Hold' })
    expect((await row(n1.request.dms_doc_id))!.status).toBe('Superseded')
  })

  it('the secondary key is tolerant of case / spacing in OCR text but needs the exact invoice number', async () => {
    const inv = newInvoice(null)
    await post(scan(inv, 'HOLD'))

    const sloppy = scan({ ...inv, inv: `  ${inv.inv.toLowerCase()} ` }, 'HOLD')
    expect((await post(sloppy)).body.applied_rule).toBe('DR-02')

    const other = scan({ ...inv, inv: `${inv.inv}-X` }, 'HOLD')
    expect((await post(other)).body.applied_rule).toBe('DR-07')
  })

  it('a NOT_FOUND document with an unreadable half of the key is never matched on the other half', async () => {
    const inv = newInvoice(null)
    await post(scan(inv, 'HOLD'))
    // Same supplier, invoice number now unreadable → UNRESOLVED (no key), not "the supplier's invoice".
    const res = await post(scan({ ...inv, inv: '' }, 'HOLD'))
    expect(res.body).toMatchObject({ identity_status: 'UNRESOLVED', applied_rule: 'DR-07' })
  })

  it('accepts an explicit identity block as well (NOT_FOUND, receive_id null)', async () => {
    const inv = newInvoice(null)
    const a = scan(inv, 'HOLD', { identity: { status: 'NOT_FOUND', reason: 'RECEIPT_NOT_FOUND', receive_id: null, missing_keys: [] } })
    const res = await post(a)
    expect(res.status).toBe(200)
    expect(res.body.identity_status).toBe('NOT_FOUND')
  })
})

// ===========================================================================
// 4. Confirmed / Sent / Posted / Import Failed protection
// ===========================================================================

describe('AP-flow documents are never superseded (DR-04)', () => {
  it.each(['Confirmed', 'Sent', 'Posted', 'Import Failed'])(
    'current %s + a BETTER new scan → the new one is a Duplicate, the old one is untouched',
    async protectedStatus => {
      const inv = newInvoice()
      const first = scan(inv, 'REVIEW')
      await post(first)
      await prisma.document.update({ where: { id: first.request.dms_doc_id }, data: { status: protectedStatus } })
      const before = (await row(first.request.dms_doc_id))!

      const second = scan(inv, 'AUTO_PASS')
      const res = await post(second)
      expect(res.body).toMatchObject({
        status: 'Duplicate',
        applied_rule: 'DR-04',
        duplicate_of: first.request.dms_doc_id,
        supersedes: null,
      })

      const after = (await row(first.request.dms_doc_id))!
      expect(after.status).toBe(protectedStatus)
      expect(after.supersededById).toBeNull()
      expect(after.payloadJson).toBe(before.payloadJson) // not even its history was edited

      const dup = (await row(second.request.dms_doc_id))!
      expect(dup).toMatchObject({ status: 'Duplicate', duplicateOfId: first.request.dms_doc_id })
      const p = JSON.parse(dup.payloadJson)
      expect(p).toMatchObject({ status: 'Duplicate', duplicateOf: first.request.dms_doc_id, dupRule: 'DR-04' })
      expect(p.duplicateStatus).toBe('potential_duplicate')

      const log = await prisma.auditLog.findMany({ where: { docId: second.request.dms_doc_id } })
      expect(log.map(l => l.action)).toContain('DUPLICATE')
    },
  )

  it('a protected document wins over a newer open one and over history rows', async () => {
    const inv = newInvoice()
    const first = scan(inv, 'REVIEW')
    await post(first)
    await prisma.document.update({ where: { id: first.request.dms_doc_id }, data: { status: 'Posted' } })
    await post(scan(inv, 'HOLD')) // → Duplicate of the Posted document
    const res = await post(scan(inv, 'AUTO_PASS')) // newest row is a Duplicate; Posted is still the current one
    expect(res.body).toMatchObject({ applied_rule: 'DR-04', duplicate_of: first.request.dms_doc_id })
  })

  it('a locked document (AP batch being built) is protected too', async () => {
    const inv = newInvoice()
    const first = scan(inv, 'REVIEW')
    await post(first)
    await prisma.document.update({ where: { id: first.request.dms_doc_id }, data: { isLocked: true } })
    const res = await post(scan(inv, 'AUTO_PASS'))
    expect(res.body).toMatchObject({ status: 'Duplicate', applied_rule: 'DR-04' })
    expect((await row(first.request.dms_doc_id))!.status).toBe('Review')
  })
})

// ===========================================================================
// 5. UNRESOLVED / DR-07*
// ===========================================================================

describe('UNRESOLVED — no reliable key, never auto-matched', () => {
  const unresolvedBlock = (missing: string[] = ['invoice_num']) => ({
    status: 'UNRESOLVED',
    reason: 'KEYS_UNREADABLE',
    receive_id: null,
    missing_keys: missing,
  })

  it('creates a new Manual Review document, owner Unknown, APR only — even if the Engine said AUTO_PASS', async () => {
    const inv = newInvoice(null)
    const a = scan(inv, 'AUTO_PASS', { identity: unresolvedBlock() })
    const res = await post(a)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      status: 'Manual Review',
      identity_status: 'UNRESOLVED',
      applied_rule: 'DR-07',
      supersedes: null,
      duplicate_of: null,
    })
    const doc = (await row(a.request.dms_doc_id))!
    expect(doc).toMatchObject({
      status: 'Manual Review',
      identityStatus: 'UNRESOLVED',
      receiveId: null,
      receiptNum: null,
      secondaryKey: null,
      receiverName: null, // Owner = Unknown
      assignedRole: 'APR', // APR only
      recommendation: 'AUTO_PASS', // the Engine's own verdict is still recorded
    })
    expect(JSON.parse(doc.missingKeys!)).toEqual(['invoice_num'])
    const p = JSON.parse(doc.payloadJson)
    expect(p).toMatchObject({ status: 'Manual Review', assignedRole: 'APR' })
    expect(p.receiverName).toBeUndefined()
    expect(p.identity).toMatchObject({ status: 'UNRESOLVED', missingKeys: ['invoice_num'] })
  })

  it('is derived when the Engine sends no identity block (unreadable invoice number, no receipt)', async () => {
    const a = scan({ ...newInvoice(null), inv: '' }, 'HOLD')
    const res = await post(a)
    expect(res.body).toMatchObject({ identity_status: 'UNRESOLVED', status: 'Manual Review' })
    expect(JSON.parse((await row(a.request.dms_doc_id))!.missingKeys!)).toEqual(['invoice_num'])
  })

  it('never supersedes — or duplicates — another document, even one with identical tax id + invoice no.', async () => {
    const inv = newInvoice()
    const existing = scan(inv, 'HOLD')
    await post(existing)

    const u1 = scan(inv, 'AUTO_PASS', { identity: unresolvedBlock(['po_number']) })
    const u2 = scan(inv, 'AUTO_PASS', { identity: unresolvedBlock(['po_number']) })
    expect((await post(u1)).body.applied_rule).toBe('DR-07')
    expect((await post(u2)).body.applied_rule).toBe('DR-07')

    // Nothing was superseded or marked Duplicate: three independent open documents.
    expect((await row(existing.request.dms_doc_id))!.status).toBe('Hold')
    expect((await row(u1.request.dms_doc_id))!.status).toBe('Manual Review')
    expect((await row(u2.request.dms_doc_id))!.status).toBe('Manual Review')
  })

  it('is never picked up as the "current" document by a later RESOLVED / NOT_FOUND scan', async () => {
    const inv = newInvoice(null)
    const u = scan(inv, 'MANUAL_REVIEW', { identity: unresolvedBlock() })
    await post(u)

    const later = scan(inv, 'AUTO_PASS')
    expect((await post(later)).body).toMatchObject({ identity_status: 'NOT_FOUND', applied_rule: 'DR-07', status: 'Auto-pass' })
    expect((await row(u.request.dms_doc_id))!.status).toBe('Manual Review')
  })

  it.each([
    ['RESOLVED without receive_id', { status: 'RESOLVED', receive_id: null }, 'receive_id'],
    ['RESOLVED with a malformed receive_id', { status: 'RESOLVED', receive_id: 'no spaces allowed' }, 'A-Z0-9'],
    ['NOT_FOUND carrying a receive_id', { status: 'NOT_FOUND', receive_id: 'RBK1234' }, 'receive_id = null'],
    ['UNRESOLVED carrying a receive_id', { status: 'UNRESOLVED', receive_id: 'RBK1234', missing_keys: ['invoice_num'] }, 'receive_id = null'],
    ['UNRESOLVED without missing_keys', { status: 'UNRESOLVED', receive_id: null, missing_keys: [] }, 'missing_keys'],
    ['UNRESOLVED with no missing_keys field', { status: 'UNRESOLVED', receive_id: null }, 'missing_keys'],
  ])('422 and nothing written: %s', async (_label, identity, expected) => {
    const a = scan(newInvoice(), 'AUTO_PASS', { identity })
    const docsBefore = await prisma.document.count()
    const runsBefore = await prisma.validationRun.count()

    const res = await post(a)
    expect(res.status).toBe(422)
    expect(res.body.ok).toBe(false)
    expect((res.body.errors as string[]).join(' ')).toContain(expected)
    expect(await prisma.document.count()).toBe(docsBefore)
    expect(await prisma.validationRun.count()).toBe(runsBefore)
  })

  it('422 for an identity.status outside RESOLVED | NOT_FOUND | UNRESOLVED', async () => {
    const res = await post(scan(newInvoice(), 'AUTO_PASS', { identity: { status: 'MAYBE', receive_id: null } }))
    expect(res.status).toBe(422)
  })
})

describe('UNRESOLVED documents: Confirm disabled, Reject allowed, APR only (POST /api/documents/:id/actions)', () => {
  const act = async (userId: string, role: 'APR' | 'ACC' | 'ADM', docId: string, action: string) => {
    const { asUser } = await import('./helpers/session')
    return request(app)
      .post(`/api/documents/${docId}/actions`)
      .set('Cookie', await asUser(userId, role))
      .send({ action, reason: 'อ่านคีย์ไม่ได้' })
  }

  const unresolvedDoc = async () => {
    const a = scan(newInvoice(null), 'AUTO_PASS', {
      identity: { status: 'UNRESOLVED', reason: 'KEYS_UNREADABLE', receive_id: null, missing_keys: ['invoice_num'] },
    })
    expect((await post(a)).status).toBe(200)
    return a.request.dms_doc_id as string
  }

  it('Confirm and every other move are refused, even for APR', async () => {
    const id = await unresolvedDoc()
    for (const action of ['confirm', 'manual_review', 'review', 'hold']) {
      const res = await act('bk-apr', 'APR', id, action)
      expect(res.status, action).toBe(422)
    }
    expect((await row(id))!.status).toBe('Manual Review')
  })

  it('Reject is allowed — for APR', async () => {
    const id = await unresolvedDoc()
    const res = await act('bk-apr', 'APR', id, 'reject')
    expect(res.status).toBe(200)
    expect((await row(id))!.status).toBe('Rejected')
  })

  it('ACC and ADM cannot act on it at all', async () => {
    const id = await unresolvedDoc()
    expect((await act('bk-acc', 'ACC', id, 'reject')).status).toBe(403)
    expect((await act('bk-adm', 'ADM', id, 'reject')).status).toBe(403)
    expect((await row(id))!.status).toBe('Manual Review')
  })
})

// ===========================================================================
// 6. API retry / idempotency
// ===========================================================================

describe('API retry & idempotency', () => {
  it('an exact retry is a 200 replay that writes nothing', async () => {
    const inv = newInvoice()
    const a = scan(inv, 'REVIEW')
    await post(a)
    const docs = await prisma.document.count()
    const runs = await prisma.validationRun.count()
    const logs = await prisma.auditLog.count()

    const res = await post(a)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, idempotent_replay: true, result: 'ALREADY_PROCESSED', identity_status: 'RESOLVED' })
    expect(await prisma.document.count()).toBe(docs)
    expect(await prisma.validationRun.count()).toBe(runs)
    expect(await prisma.auditLog.count()).toBe(logs)
  })

  it('a retry of a superseding scan does not supersede anything twice', async () => {
    const inv = newInvoice()
    const a1 = scan(inv, 'HOLD')
    const a2 = scan(inv, 'REVIEW')
    await post(a1)
    await post(a2)
    const logs = await prisma.auditLog.count({ where: { docId: a1.request.dms_doc_id } })

    const retry = await post(a2)
    expect(retry.body).toMatchObject({ idempotent_replay: true, applied_rule: 'DR-01', supersedes: a1.request.dms_doc_id })
    expect(await prisma.auditLog.count({ where: { docId: a1.request.dms_doc_id } })).toBe(logs)
    expect((await row(a1.request.dms_doc_id))!.status).toBe('Superseded')
    expect((await row(a2.request.dms_doc_id))!.status).toBe('Review')
  })

  it('a retry of an OLD scan after a newer one superseded it does not revive it or demote the new one', async () => {
    const inv = newInvoice()
    const a1 = scan(inv, 'HOLD')
    const a2 = scan(inv, 'AUTO_PASS')
    await post(a1)
    await post(a2)

    const retry = await post(a1) // the Engine's HTTP client times out and resends the first scan
    expect(retry.status).toBe(200)
    expect(retry.body).toMatchObject({ idempotent_replay: true, status: 'Superseded' })
    expect((await row(a1.request.dms_doc_id))!.status).toBe('Superseded')
    expect((await row(a2.request.dms_doc_id))!.status).toBe('Auto-pass')
  })

  it('a retry of a Duplicate reports it as the Duplicate it is', async () => {
    const inv = newInvoice()
    const a1 = scan(inv, 'AUTO_PASS')
    const a2 = scan(inv, 'HOLD')
    await post(a1)
    await post(a2)
    const retry = await post(a2)
    expect(retry.body).toMatchObject({ idempotent_replay: true, status: 'Duplicate', duplicate_of: a1.request.dms_doc_id })
    expect(await prisma.document.count({ where: { receiveId: inv.receipt! } })).toBe(2)
  })

  it('the same validation_id for a different file is a 409 and changes nothing', async () => {
    const inv = newInvoice()
    const a = scan(inv, 'REVIEW')
    await post(a)
    const clash = structuredClone(a)
    clash.package.file_sha256 = 'sha256:' + '0'.repeat(64)
    const res = await post(clash)
    expect(res.status).toBe(409)
    expect((await row(a.request.dms_doc_id))!.fileSha256).toBe(a.package.file_sha256)
  })

  it('the same DMS document re-validated (new validation_id, higher round) updates it in place and never supersedes itself', async () => {
    const inv = newInvoice()
    const id = newId()
    await post(scan(inv, 'HOLD', { id, round: 1 }))
    const res = await post(scan(inv, 'AUTO_PASS', { id, round: 2 }))

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ idempotent_replay: false, status: 'Auto-pass', applied_rule: 'DR-07', supersedes: null })
    expect(await prisma.document.count({ where: { id } })).toBe(1)
    expect(await prisma.validationRun.count({ where: { documentId: id } })).toBe(2)
    expect((await row(id))!.status).toBe('Auto-pass')
  })

  it('an older round arriving late (out of order) is refused and does not overwrite the newer result', async () => {
    const inv = newInvoice()
    const id = newId()
    await post(scan(inv, 'HOLD', { id, round: 1 }))
    await post(scan(inv, 'AUTO_PASS', { id, round: 2 }))

    const late = await post(scan(inv, 'MANUAL_REVIEW', { id, round: 1, vid: `VAL-BK-${id}-LATE` }))
    expect(late.status).toBe(409)
    expect(late.body.code).toBe('STALE_VALIDATION_ROUND')
    expect((await row(id))!.status).toBe('Auto-pass')
  })

  it.each(['Confirmed', 'Superseded', 'Duplicate', 'Rejected'])(
    'a %s document cannot be re-validated in place: 409, the document is untouched',
    async status => {
      const inv = newInvoice()
      const id = newId()
      await post(scan(inv, 'REVIEW', { id, round: 1 }))
      await prisma.document.update({ where: { id }, data: { status } })

      const res = await post(scan(inv, 'AUTO_PASS', { id, round: 2 }))
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('DOCUMENT_NOT_REVALIDATABLE')
      expect((await row(id))!.status).toBe(status)
      expect(await prisma.validationRun.count({ where: { documentId: id } })).toBe(1)
    },
  )

  it('concurrent identical requests produce one document and one validation run', async () => {
    const a = scan(newInvoice(), 'REVIEW')
    const results = await Promise.all([post(a), post(a), post(a)])
    expect(results.map(r => r.status)).toEqual([200, 200, 200])
    expect(results.filter(r => r.body.idempotent_replay === false)).toHaveLength(1)
    expect(await prisma.validationRun.count({ where: { validationId: a.request.validation_id } })).toBe(1)
    expect(await prisma.document.count({ where: { id: a.request.dms_doc_id } })).toBe(1)
  })

  it('concurrent scans of one receipt still resolve to exactly one open document', async () => {
    const inv = newInvoice()
    const scans = [scan(inv, 'REVIEW'), scan(inv, 'REVIEW'), scan(inv, 'REVIEW')]
    const results = await Promise.all(scans.map(post))
    expect(results.map(r => r.status)).toEqual([200, 200, 200])

    expect(await prisma.document.count({ where: { receiveId: inv.receipt! } })).toBe(3)
    expect(await openRows({ receiveId: inv.receipt! })).toHaveLength(1)
    expect(await prisma.document.count({ where: { receiveId: inv.receipt!, status: 'Superseded' } })).toBe(2)
  })
})
