/**
 * Task 8 — UI integration & live database connection (100% mockup parity).
 *
 * The Portal must stop reading a hard-coded array and start reading the database
 * the Engine fills, without the analyst noticing any difference in behaviour from
 * `AIVA-Web-Portal-Mockup-v4.18.html`. That makes two independent claims:
 *
 *  1. **The data is live.** Real Engine payloads go through the real ingestion
 *     boundary (`POST /api/engine/ingest`) into the real schema, and
 *     `GET /api/documents` answers from that database — filtered, sorted, shaped
 *     the way the queue needs.
 *  2. **The behaviour is the mockup's.** Every filter, KPI, scope rule and action
 *     gate the mockup implements still holds on live rows, and the evidence dock
 *     still fits the page exactly like `fitPages()` does.
 *
 * Everything runs on the throwaway test database (`vitest.setup.ts`), which the
 * global setup force-resets, so the counts below are exact rather than "at least".
 */
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import {
  DEFAULT_DROPPED_ELEMENT_TYPES,
  dateOnly,
  mockSignatureFlags,
  portalBboxesToRawPayload,
  portalDocToInvoiceDoc,
  uiStatusFor,
} from '../features/engine/adapters/portalDocToInvoiceDoc'
import type { PortalInvoiceDocument } from '../features/engine/types/portalDomain'
import type { InvoiceDoc } from '../types/invoice'
import {
  allowedActionFor,
  applyLiveDocs,
  CLOSED_STATUSES,
  OPEN_STATUSES,
  companyCountsFor,
  filterDocsFor,
  hasHighSeverity,
  inPerOf,
  isEuPending,
  kpiCountsFor,
  kpiKeysFor,
  matchStatusFor,
  pendingBind,
  perRange,
  precheckPostFor,
  scopeCheckFor,
  staleDocsFor,
  statusForAction,
  visibleDocsFor,
} from '../lib/queueFilters'
import {
  DOCK_BODY_INSET,
  MOCK_PAGE_WIDTH_CSS,
  mockPageFitScale,
  mockSurfaceStyle,
  zoomForStep,
} from '../features/pdf-viewer/lib/coordinateTransform'
import { viewerBoxesFromInvoiceDoc } from '../features/pdf-viewer/lib/overlayModel'
import { USERS, ROLES } from '../mock/users'
import type { User } from '../types/auth'
import { EU_CODES, EXCEPTION_RULES } from '../mock/rules'
import { asUser } from './helpers/session'

// ---------------------------------------------------------------------------
// Corpus: the real Engine results, pushed through the real ingestion boundary.
// ---------------------------------------------------------------------------

const CORPUS_DIR = path.resolve(process.cwd(), 'temp/paperless_invoices_v5')
const RESULT_FILE = /^DMS-.*_result\.json$/
/** The Engine's own index — the independent source of truth for the counts. */
const SUMMARY = JSON.parse(
  fs.readFileSync(path.join(CORPUS_DIR, 'summary.json'), 'utf8'),
) as {
  metadata: { total_documents: number }
  statistics: { counts: Record<string, number> }
}

const files = fs
  .readdirSync(CORPUS_DIR)
  .filter(f => RESULT_FILE.test(f))
  .sort()

/** docId → the Portal document the Task 3 adapter produces for it. */
const expected = new Map<string, PortalInvoiceDocument>()
const rawById = new Map<string, unknown>()

interface ListBody {
  ok: boolean
  source: string
  total: number
  count: number
  documents: InvoiceDoc[]
  error?: string
}

const app = createExpressApp()

/** v5.5: the documents API needs a signed session (one SA user for the whole parity suite). */
let saCookie: Promise<string> | null = null
const sa = () => (saCookie ??= asUser('parity-sa', 'SA'))

async function list(url: string): Promise<{ status: number; body: ListBody }> {
  const res = await request(app).get(url).set('Cookie', await sa())
  return { status: res.status, body: res.body as ListBody }
}

beforeAll(async () => {
  expect(files.length, 'Engine corpus must be present to test live ingestion').toBeGreaterThan(100)

  const { prisma } = await import('@/lib/prisma')
  await prisma.validationRun.deleteMany()
  await prisma.document.deleteMany()

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(CORPUS_DIR, file), 'utf8'))
    const portal = transformEngineResultToPortalDoc(raw)
    expected.set(portal.id, portal)
    rawById.set(portal.id, raw)

    const res = await request(app)
      .post('/api/engine/ingest')
      .send(raw)

    const body = res.body as { ok: boolean; idempotent_replay?: boolean }
    expect(body.ok, `ingest failed for ${file}: ${JSON.stringify(body)}`).toBe(true)
    expect(body.idempotent_replay, `${file} must be a fresh insert`).toBe(false)
  }
}, 180_000)

/** Live docs, UI-shaped, exactly as the queue will receive them. */
let live: InvoiceDoc[] = []
/** docId → Portal contract row, for cross-checking the mapper. */
const portalOf = (id: string): PortalInvoiceDocument => {
  const p = expected.get(id)
  if (!p) throw new Error(`no expectation for ${id}`)
  return p
}

beforeAll(async () => {
  const { body } = await list('/api/documents')
  live = body.documents
})

const countBy = <T>(xs: T[], key: (x: T) => string): Record<string, number> =>
  xs.reduce<Record<string, number>>((acc, x) => {
    const k = key(x)
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

const statusCounts = (docs: InvoiceDoc[]) => countBy(docs, d => d.status)
const companyCounts = (docs: InvoiceDoc[]) => countBy(docs, d => d.company)

/** Engine recommendation → Portal status, as `summary.json` reports it. */
const ENGINE_TO_STATUS: Record<string, string> = {
  AUTO_PASS: 'Auto-pass',
  REVIEW: 'Review',
  HOLD: 'Hold',
  MANUAL_REVIEW: 'Manual Review',
}

// ===========================================================================
// 1. Portal contract → InvoiceDoc
// ===========================================================================

describe('portalDocToInvoiceDoc — the mockup shape, from live data', () => {
  it('maps identity, money and dates without inventing anything', () => {
    const p = portalOf('DMS-100')
    const doc = portalDocToInvoiceDoc(p)

    expect(doc.doc).toBe('DMS-100')
    expect(doc.inv).toBe(p.invoiceNum)
    expect(doc.vendor).toBe(p.supplierName)
    expect(doc.stax).toBe(p.supplierTaxId)
    expect(doc.company).toBe(p.companyCode)
    expect(doc.oname).toBe(p.companyName)
    expect(doc.total).toBe(p.grandTotal)
    expect(doc.sub).toBe(p.subtotal)
    expect(doc.vat).toBe(p.vat)
    expect(doc.pages).toBe(p.pageCount)
    expect(doc.org).toBe(p.orgId ?? null)
    expect(doc.po).toBe(p.poNumbers.join(', '))
    expect(doc.rcv).toBe(p.receiptNums[0] ?? '—')
    expect(doc.rtotal).toBe(p.receiptTotal ?? null)
  })

  it('dates: the invoice date is the Engine\'s, "up" is the Portal\'s ingestion date', () => {
    const p = portalOf('DMS-100')
    const doc = portalDocToInvoiceDoc(p)

    expect(doc.dt).toBe(p.invoiceDate)
    // `up` is what the period filter and the queue sort read; it must be a plain
    // YYYY-MM-DD taken from the row the Portal wrote, not from Engine text.
    expect(doc.up).toBe(dateOnly(p.updatedAt))
    expect(doc.up).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('shows an em dash instead of a fake date when the Engine read no invoice date', () => {
    const blank = [...expected.values()].find(p => !p.invoiceDate)
    expect(blank, 'corpus must contain documents with no readable invoice date').toBeTruthy()
    expect(portalDocToInvoiceDoc(blank!).dt).toBe('—')
  })

  it('carries the status through the union it belongs to', () => {
    const seen = new Set<string>()
    for (const p of expected.values()) seen.add(portalDocToInvoiceDoc(p).status)
    // Portal workflow states are never invented from Engine data.
    for (const s of seen) {
      expect(['Auto-pass', 'Review', 'Hold', 'Manual Review']).toContain(s)
    }
    expect(uiStatusFor('Posted')).toBe('Posted')
  })

  it('derives the two signature glyphs from the Engine\'s own signature elements', () => {
    const withBoth = [...expected.values()].find(p => {
      const [sup, rcv] = mockSignatureFlags(p)
      return sup === 1 && rcv === 1
    })
    const withNone = [...expected.values()].find(p => {
      const [sup, rcv] = mockSignatureFlags(p)
      return sup === 0 && rcv === 0
    })
    expect(withBoth, 'corpus must contain a document with both signatures').toBeTruthy()
    expect(withNone, 'corpus must contain a document with no signature').toBeTruthy()

    expect(portalDocToInvoiceDoc(withBoth!).sig).toEqual([1, 1])
    expect(portalDocToInvoiceDoc(withNone!).sig).toEqual([0, 0])

    // The flags come from named elements, not from a guess about the rule verdict.
    const named = withBoth!.bboxes.filter(b => b.elementType === 'signature').map(b => b.fieldName)
    expect(named).toContain('signatures.deliverer')
    expect(named).toContain('signatures.receiver')
  })

  it('lists exception codes once each, most severe first', () => {
    const p = [...expected.values()].find(x => x.exceptions.length > 1)!
    const doc = portalDocToInvoiceDoc(p)

    expect(doc.codes.length).toBe(new Set(p.exceptions.map(e => e.code)).size)
    for (const e of p.exceptions) expect(doc.codes).toContain(e.code)

    const rank = { High: 0, Medium: 1, Low: 2 } as const
    const sevOf = (code: string) =>
      rank[p.exceptions.filter(e => e.code === code).sort((a, b) => rank[a.severity] - rank[b.severity])[0].severity]
    const ordered = doc.codes.map(sevOf)
    expect(ordered).toEqual([...ordered].sort((a, b) => a - b))
  })

  it('keeps all nine rule checks with the labels and page the detail pane reads', () => {
    const p = portalOf('DMS-100')
    const doc = portalDocToInvoiceDoc(p)

    expect(doc.rules.length).toBe(9)
    expect(doc.rules.map(r => r.rule)).toEqual(p.rules.map(r => r.ruleId))
    for (const [i, r] of doc.rules.entries()) {
      const src = p.rules[i]
      expect(r.id).toBe(src.ruleId)
      expect(r.status).toBe(src.status)
      expect(r.result).toBe(src.result)
      expect(r.exception_code).toBe(src.exceptionCode ?? undefined)
      // 'None' in the Portal contract means "no severity", which the UI spells as
      // "no severity field at all".
      expect(r.severity ?? null).toBe(
        src.severity && src.severity !== 'None' ? src.severity : null,
      )
      // A rule that failed never renders a blank card: the Engine's Thai sentence
      // wins, then the raw detail, then the catalog name for the code.
      if (r.status !== 'PASS') expect((r.detail ?? '').length, `${src.ruleId} detail`).toBeGreaterThan(0)
      expect(r.name.length).toBeGreaterThan(0)
      expect(r.page).toBe(src.pageNos?.[0] ?? undefined)
      expect(r.halted_by).toBe(src.haltedBy ?? undefined)
    }
    // Rules that failed must be reachable by page, or "เปิดดูหลักฐาน" lands on page 1
    // while the evidence sits on page 3.
    for (const doc2 of live.slice(0, 25)) {
      const src = portalOf(doc2.doc)
      for (const r of src.rules.filter(x => x.pageNos?.length)) {
        const mapped = doc2.rules.find(x => x.rule === r.ruleId)!
        expect(mapped.page).toBe(r.pageNos![0])
      }
    }
  })

  it('maps line items so the PO and receipt columns stay on their own sides', () => {
    // The live Engine matches invoice lines to goods receipts, not to PO lines:
    // across the corpus `grLine` is populated and `poLine` never is. The columns
    // must not borrow each other's values to look complete.
    const p = [...expected.values()].find(x => x.lineItems.some(l => l.grLine != null))!
    const doc = portalDocToInvoiceDoc(p)

    expect(doc.lines?.length).toBe(p.lineItems.length)
    const src = p.lineItems.find(l => l.grLine != null)!
    const line = doc.lines!.find(l => l.no === src.no)!
    expect(line.desc).toBe(src.desc)
    expect(line.qty).toBe(src.qty)
    expect(line.unit).toBe(src.unit)
    expect(line.price).toBe(src.price)
    expect(line.amount).toBe(src.amount)
    expect(line.gr_line).toBe(src.grLine ?? undefined)
    expect(line.gr_qty).toBe(src.grQty ?? undefined)
    expect(line.match_level).toBe(src.matchLevel ?? undefined)
    expect(line.diff).toBe(!!src.diff)

    expect(src.poLine ?? null).toBe(null)
    expect(line.po_line).toBeUndefined()
    expect(line.po_qty).toBeUndefined()
    expect(line.po_price).toBeUndefined()

    // a line the Engine matched to nothing keeps every match column empty
    const unmatched = p.lineItems.find(l => l.grLine == null && l.poLine == null)
    if (unmatched) {
      const blank = doc.lines!.find(l => l.no === unmatched.no)!
      expect(blank.gr_line).toBeUndefined()
      expect(blank.po_line).toBeUndefined()
    }
  })

  it('leaves the receiver truth on the page and flags the docs nobody owns', () => {
    const owned = [...expected.values()].find(p => !!p.receiverName)!
    const orphan = [...expected.values()].find(p => !p.receiverName)!
    const ownedDoc = portalDocToInvoiceDoc(owned)
    const orphanDoc = portalDocToInvoiceDoc(orphan)

    expect(ownedDoc.receiver).toBe(owned.receiverName)
    expect(ownedDoc.receiverActive).toBe(true)
    expect(ownedDoc.unres).toBe(false)

    expect(orphanDoc.receiver).toBeUndefined()
    expect(orphanDoc.rcv).toBe('—')
    // No receiver means no owner: this is what drives the "ไม่ทราบเจ้าของ" KPI.
    expect(pendingBind(orphanDoc)).toBe(false)
    expect(orphanDoc.unres).toBe(true)
  })

  it('assigns lanes by the mockup rule, not by Portal\'s placeholder role column', () => {
    // `assignedRole` is a constant 'EU' on every ingested row today (see
    // engineToPortalAdapter), so copying it would hand the entire queue to the
    // receiver and leave accounting's lane empty. The lane is derived instead.
    const euCode = [...EU_CODES][0]
    const otherCode = Object.keys(EXCEPTION_RULES).find(c => !EU_CODES.has(c))!
    const base = portalOf('DMS-100')

    const receiverWork: PortalInvoiceDocument = {
      ...base,
      status: 'Review',
      receiverName: 'SOME RECEIVER',
      rules: base.rules.map((r, i) => (i ? r : { ...r, exceptionCode: euCode as never })),
    }
    expect(portalDocToInvoiceDoc(receiverWork).assigned).toBe('eu')

    // no owner ⇒ accounting picks it up, whoever the placeholder column names
    expect(
      portalDocToInvoiceDoc({ ...receiverWork, receiverName: undefined }).assigned,
    ).toBe('acc')
    // codes the receiver does not own ⇒ accounting
    expect(
      portalDocToInvoiceDoc({
        ...receiverWork,
        rules: base.rules.map((r, i) => (i ? r : { ...r, exceptionCode: otherCode as never })),
      }).assigned,
    ).toBe('acc')
    // a Manual Review decision is never the receiver's, even with their code on it
    expect(portalDocToInvoiceDoc({ ...receiverWork, status: 'Manual Review' }).assigned).toBe('acc')
    expect(portalDocToInvoiceDoc({ ...receiverWork, status: 'Auto-pass' }).assigned).toBe('acc')
    // an unbound receiver cannot be handed work they cannot act on
    expect(
      portalDocToInvoiceDoc(receiverWork, { isReceiverBound: () => false }).assigned,
    ).toBe('acc')

    for (const p of expected.values()) {
      expect(['eu', 'acc']).toContain(portalDocToInvoiceDoc(p).assigned)
    }
  })

  it('synthesises the audit trail the log tab shows when the Engine has none', () => {
    const p = portalOf('DMS-100')
    expect(p.history.length).toBe(0)
    const doc = portalDocToInvoiceDoc(p)

    expect(doc.history.length).toBeGreaterThan(0)
    const last = doc.history[doc.history.length - 1]
    expect(last.dt).toBe(dateOnly(p.updatedAt))
    expect(last.act.length).toBeGreaterThan(0)
    expect(last.d).toContain(p.status)
  })

  it('leaves fields the Portal has no data for empty rather than inventing them', () => {
    const p = portalOf('DMS-100')
    const doc = portalDocToInvoiceDoc(p)
    // AP push result, batch id and the actor who confirmed a doc are Portal-side
    // facts that no Engine payload can supply; a fabricated value here would
    // show up in the UI as an audit trail that never happened.
    expect(doc.apErr ?? null).toBe(null)
    expect(doc.batch ?? null).toBe(null)
    expect(doc.confirmedBy ?? null).toBe(null)
    // The Oracle account is the field Task 9's binding table will fill; today the
    // Engine leaves it empty, and the UI must not invent one.
    expect(p.receiverAccount ?? null).toBe(null)
    expect(doc.grp ?? null ?? undefined).toBeUndefined()
  })

  it('attaches the rule box that the evidence overlay draws', () => {
    const p = [...expected.values()].find(x => x.bboxes.some(b => b.ruleId && b.exceptionCode))!
    const doc = portalDocToInvoiceDoc(p, { includeBoxes: true })
    const withBox = doc.rules.filter(r => r.bbox)
    expect(withBox.length).toBeGreaterThan(0)
    for (const r of withBox) {
      expect(r.bbox!.page).toBeGreaterThanOrEqual(1)
      expect(r.bbox!.w).toBeGreaterThan(0)
      expect(r.bbox!.h).toBeGreaterThan(0)
      expect(r.bbox!.x).toBeGreaterThanOrEqual(0)
      expect(r.exception_code, 'a boxed rule must name the exception it proves').toBeTruthy()
    }
  })

  it('produces a document that passes every UI invariant, for all 125 rows', () => {
    for (const p of expected.values()) {
      const doc = portalDocToInvoiceDoc(p)
      expect(doc.doc, 'doc id').toBeTruthy()
      expect(doc.company).toMatch(/^(AH|AHT|AHP|AM|AHA|\?)$/)
      expect(typeof doc.total).toBe('number')
      expect(Number.isFinite(doc.total)).toBe(true)
      expect(Array.isArray(doc.codes)).toBe(true)
      expect(doc.rules.length).toBe(9)
      expect(Array.isArray(doc.lines)).toBe(true)
      expect(doc.pages).toBeGreaterThan(0)
      expect(doc.sig).toEqual(expect.arrayContaining([expect.any(Number)]))
      expect(doc.dt).toBeTruthy()
      expect(doc.up).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      for (const r of doc.rules) {
        expect(['PASS', 'FAIL', 'WARN', 'SKIP']).toContain(r.status)
        if (r.severity) expect(['High', 'Medium', 'Low']).toContain(r.severity)
      }
      for (const l of doc.lines ?? []) {
        expect(Number.isFinite(l.amount)).toBe(true)
        expect(Number.isFinite(l.qty)).toBe(true)
      }
    }
  })

  it('agrees with the Engine summary on the queue distribution', () => {
    const counts = statusCounts([...expected.values()].map(p => portalDocToInvoiceDoc(p)))
    const engineCounts: Record<string, number> = {}
    for (const [rec, n] of Object.entries(SUMMARY.statistics.counts)) {
      const status = ENGINE_TO_STATUS[rec]
      if (!status || !n) continue
      engineCounts[status] = n
    }
    expect(counts).toEqual(engineCounts)
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(SUMMARY.metadata.total_documents)
  })
})

// ===========================================================================
// 2. Bounding boxes: the same mapper must feed the Task 7 overlay
// ===========================================================================

describe('raw_payload boxes — live rows drive the evidence overlay', () => {
  it('omits boxes from the list payload and attaches them on request', () => {
    const p = portalOf('DMS-100')
    expect(portalDocToInvoiceDoc(p).raw_payload).toBeUndefined()

    const withBoxes = portalDocToInvoiceDoc(p, { includeBoxes: true })
    const payload = withBoxes.raw_payload as {
      ocr: { elements: Array<{ element_id: string; element_type: string; bbox: number[] }> }
      evidence: Array<{ rule_id: string; bboxes: unknown[] }>
    }
    expect(payload.ocr.elements.length).toBeGreaterThan(0)
    expect(payload.evidence.length).toBeGreaterThan(0)
  })

  it('drops the element types that would bury the evidence', () => {
    const p = portalOf('DMS-100')
    const payload = portalBboxesToRawPayload(p)
    const types = new Set(payload.ocr.elements.map(e => e.element_type))
    for (const dropped of DEFAULT_DROPPED_ELEMENT_TYPES) expect(types.has(dropped)).toBe(false)

    // Page containers are the whole page: drawing them would hide every box.
    expect(p.bboxes.some(b => b.elementType === 'page')).toBe(true)
  })

  it('keeps the element identity, page and confidence the tooltip shows', () => {
    const p = portalOf('DMS-100')
    const src = p.bboxes.find(b => b.elementType === 'field')!
    const el = portalBboxesToRawPayload(p).ocr.elements.find(e => e.element_id === src.id)!
    expect(el.page_no).toBe(src.pageNo)
    expect(el.bbox).toEqual([src.bbox[0], src.bbox[1], src.bbox[2], src.bbox[3]])
    expect(el.field_name).toBe(src.fieldName ?? null)
    expect(el.confidence).toBe(src.confidence)
  })


  it('links boxes back to the rule and exception that produced them', () => {
    const p = [...expected.values()].find(x => x.bboxes.some(b => b.exceptionCode && b.ruleId))!
    const payload = portalBboxesToRawPayload(p)
    const src = p.bboxes.find(b => b.exceptionCode && b.ruleId)!

    // One evidence group per finding (plan F2): find the group of this rule that holds the box.
    const link = payload.evidence.find(
      e => e.rule_id === src.ruleId && e.bboxes.some(b => b.element_id === src.id),
    )!
    expect(link, `no evidence group for rule ${src.ruleId}`).toBeTruthy()
    expect(link.exception_code).toBe(src.exceptionCode)
    expect(link.severity).toBe(src.severity)
    expect(link.bboxes.map((b: any) => b.element_id)).toContain(src.id)

    // ...and the Task 7 projector can draw it: same page, same normalised box.
    const doc = portalDocToInvoiceDoc(p, { includeBoxes: true })
    const boxes = viewerBoxesFromInvoiceDoc(doc)
    expect(boxes.length, 'live rows must produce overlay boxes').toBeGreaterThan(0)
    const drawn = boxes.find(b => b.id.endsWith(`:${src.id}`))
    expect(drawn, `the box for element ${src.id} must reach the canvas`).toBeTruthy()
    expect(drawn!.ruleId).toBe(src.ruleId)
    expect(drawn!.exceptionCode).toBe(src.exceptionCode)
    expect(drawn!.pageNo).toBe(src.pageNo)
    expect([...drawn!.bbox]).toEqual([src.bbox[0], src.bbox[1], src.bbox[2], src.bbox[3]])
    expect(['High', 'Medium']).toContain(drawn!.severity)
  })

  it('draws only boxes the Engine actually reported', () => {
    // A document with no exception codes still has rules that carry coordinates
    // ("where did you look"), so "no invented boxes" is the property that matters,
    // not "no boxes".
    const clean = [...expected.values()].find(
      p => p.bboxes.every(b => !b.exceptionCode) && p.exceptions.length === 0,
    )
    if (!clean) return
    const clean2 = portalDocToInvoiceDoc(clean, { includeBoxes: true })
    const payload = portalBboxesToRawPayload(clean)
    expect(payload.evidence).toEqual([])
    expect(clean2.codes).toEqual([])

    const reported = clean.bboxes.map(b => `${b.pageNo}:${b.bbox.join(',')}`)
    const drawn = viewerBoxesFromInvoiceDoc(clean2)
    expect(drawn.length, 'a rule that reports where it looked should draw').toBeGreaterThan(0)
    for (const box of drawn) {
      // Coordinate truth: whatever id scheme the projector uses, every box it
      // paints has to be a box the Engine reported, on the page it reported it.
      expect(reported, `drew a box (${box.id}) no Engine element backs`).toContain(
        `${box.pageNo}:${box.bbox.join(',')}`,
      )
      expect(box.exceptionCode ?? null).toBe(null)
    }
  })
})

// ===========================================================================
// 3. The list endpoint reads the live database
// ===========================================================================

describe('GET /api/documents — live database connection', () => {
  it('returns every ingested document, tagged with its source', async () => {
    const { status, body } = await list('/api/documents')
    expect(status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.source).toBe('portal_db')
    expect(body.total).toBe(files.length)
    expect(body.documents.length).toBe(files.length)
    expect(new Set(body.documents.map(d => d.doc))).toEqual(new Set(expected.keys()))
  })

  it('answers with UI-shaped rows, so the queue needs no adaptation layer', async () => {
    const { body } = await list('/api/documents?limit=25')
    for (const d of body.documents) {
      expect(typeof d.dt).toBe('string')
      expect(d.rules.length).toBe(9)
      expect(Array.isArray(d.lines)).toBe(true)
      expect(['eu', 'acc']).toContain(d.assigned)
      // The list is the lean projection: boxes are fetched for one document only.
      expect(d.raw_payload).toBeUndefined()
    }
  })

  it('filters by status, company and lane exactly like the KPI cards count them', async () => {
    const all = (await list('/api/documents')).body.documents
    const byStatus = statusCounts(all)

    for (const [status, n] of Object.entries(byStatus)) {
      const { body } = await list(`/api/documents?status=${encodeURIComponent(status)}`)
      expect(body.documents.length, `status=${status}`).toBe(n)
      expect(new Set(body.documents.map(d => d.status))).toEqual(new Set([status]))
    }

    for (const [company, n] of Object.entries(companyCounts(all))) {
      const { body } = await list(`/api/documents?company=${encodeURIComponent(company)}`)
      expect(body.documents.length, `company=${company}`).toBe(n)
      expect(new Set(body.documents.map(d => d.company))).toEqual(new Set([company]))
    }

    const both = await list('/api/documents?status=Hold&company=AHT')
    expect(both.body.documents.length).toBe(
      all.filter(d => d.status === 'Hold' && d.company === 'AHT').length,
    )

    for (const lane of ['eu', 'acc']) {
      const { body } = await list(`/api/documents?assigned=${lane}`)
      expect(body.documents.length).toBe(all.filter(d => d.assigned === lane).length)
    }
  })

  it("searches the same columns the mockup's q() does", async () => {
    const doc = live.find(d => d.status === 'Manual Review' && d.codes.length > 0)!
    const hits = async (q: string) => (await list(`/api/documents?q=${encodeURIComponent(q)}`)).body.documents

    expect((await hits(doc.inv)).map(d => d.doc)).toContain(doc.doc)
    expect((await hits(doc.vendor)).map(d => d.doc)).toContain(doc.doc)
    expect((await hits(doc.doc)).map(d => d.doc)).toContain(doc.doc)
    expect((await hits(doc.codes[0])).map(d => d.doc)).toContain(doc.doc)
    if (doc.po) expect((await hits(doc.po.split(',')[0])).map(d => d.doc)).toContain(doc.doc)

    // a query that matches nothing must not fall back to "everything"
    expect((await hits('ZZZ-no-such-invoice-9999')).length).toBe(0)
  })

  it('filters by the ingestion date the period control reads', async () => {
    const all = (await list('/api/documents')).body.documents
    const days = [...new Set(all.map(d => d.up))].sort()
    const from = days[Math.floor(days.length / 2)] ?? days[0]

    const { body } = await list(`/api/documents?from=${from}`)
    expect(body.documents.length).toBe(all.filter(d => d.up >= from).length)
    for (const d of body.documents) expect(d.up >= from).toBe(true)

    const { body: window } = await list(`/api/documents?from=${from}&to=${from}`)
    for (const d of window.documents) expect(d.up).toBe(from)
  })

  it('paginates on a stable order', async () => {
    const all = (await list('/api/documents')).body.documents
    const page1 = (await list('/api/documents?limit=10&offset=0')).body
    const page2 = (await list('/api/documents?limit=10&offset=10')).body

    expect(page1.count).toBe(10)
    expect(page1.total).toBe(all.length)
    expect(page2.count).toBe(10)
    expect(page1.documents.map(d => d.doc)).toEqual(all.slice(0, 10).map(d => d.doc))
    expect(page2.documents.map(d => d.doc)).toEqual(all.slice(10, 20).map(d => d.doc))
  })

  it('attaches boxes only when asked for them', async () => {
    const { body } = await list('/api/documents?limit=3&include=boxes')
    for (const d of body.documents) {
      expect(d.raw_payload, `${d.doc} should carry raw_payload`).toBeTruthy()
      expect((d.raw_payload as any).ocr.elements.length).toBeGreaterThan(0)
    }
  })

  it('rejects bad parameters instead of silently returning the world', async () => {
    for (const url of [
      '/api/documents?limit=abc',
      '/api/documents?limit=0',
      '/api/documents?limit=99999',
      '/api/documents?offset=-1',
      '/api/documents?status=NotAStatus',
      '/api/documents?from=2026-13-01',
      '/api/documents?to=not-a-date',
    ]) {
      const { status, body } = await list(url)
      expect(status, url).toBe(400)
      expect(body.ok).toBe(false)
      expect(body.error?.length).toBeGreaterThan(0)
    }
  })

  it('serves one document with its boxes for the evidence dock', async () => {
    const res = await request(app).get('/api/documents/DMS-100').set('Cookie', await sa())
    expect(res.status).toBe(200)
    const body = res.body as { ok: boolean; source: string; document: InvoiceDoc }
    expect(body.source).toBe('portal_db')
    expect(body.document.doc).toBe('DMS-100')
    expect(body.document.raw_payload).toBeTruthy()
    expect(viewerBoxesFromInvoiceDoc(body.document).length).toBeGreaterThan(0)
  })

  it('answers 404 for an unknown id and 400 for a forged one', async () => {
    const missing = await request(app).get('/api/documents/DMS-999999').set('Cookie', await sa())
    expect(missing.status).toBe(404)

    for (const bad of ['../etc/passwd', 'DMS-100 x', ' ']) {
      const res = await request(app).get(`/api/documents/${encodeURIComponent(bad)}`).set('Cookie', await sa())
      expect(res.status, bad).toBe(400)
    }
  })
})

// ===========================================================================
// 4. The mockup's queue logic still holds on live rows
// ===========================================================================

const ACC: User = { id: 'test-acc', n: 'Test ACC', email: 'acc@aapico.com', role: 'ACC', rcvName: '—', emp: 11020, co: ['AH', 'AHA', 'AHT'], unit: 'Accounting' }
const APR: User = { id: 'test-apr', n: 'Test APR', email: 'apr@aapico.com', role: 'APR', rcvName: '—', emp: 11001, co: ['AH', 'AHA', 'AHT', 'AHP', 'AM', '?'], unit: 'Accounting Head' }
const EU: User = { id: 'test-eu', n: 'Test EU', email: 'eu@aapico.com', role: 'EU', rcvName: 'SOMSAK JAIDEE', emp: 10231, co: ['AH'], unit: 'Warehouse' }
const canAll = () => true

const scopeOf = (user: User) => (d: InvoiceDoc) =>
  scopeCheckFor(d, user, ROLES[user.role])

const baseInput = (over: Partial<Parameters<typeof filterDocsFor>[0]> = {}) => ({
  docs: live,
  scope: scopeOf(APR),
  statusFilter: 'all' as const,
  companyFilter: new Set<string>(),
  periodFilter: { k: 'all' as const },
  searchQuery: '',
  showClosed: false,
  role: 'APR' as const,
  pending: new Set<string>(),
  ...over,
})

describe('queue logic — the mockup rules, applied to live rows', () => {
  it('KPI cards agree with the table and with the Engine summary', () => {
    const visible = visibleDocsFor(live, scopeOf(APR))
    const kpi = kpiCountsFor(baseInput({ docs: visible }))

    expect(kpi.all).toBe(visible.length)
    for (const s of ['Auto-pass', 'Review', 'Hold', 'Manual Review']) {
      expect(kpi[s]).toBe(statusCounts(visible)[s] ?? 0)
    }
    expect(kpi['Auto-pass']).toBe(SUMMARY.statistics.counts.AUTO_PASS)
    expect(kpi['Manual Review']).toBe(SUMMARY.statistics.counts.MANUAL_REVIEW)
    expect(kpi.unres).toBe(visible.filter(d => d.unres && d.status === 'Manual Review').length)
    expect(kpi.bind).toBe(visible.filter(pendingBind).length)
    // the four status cards are disjoint slices of the queue
    expect(kpi['Auto-pass'] + kpi.Review + kpi.Hold + kpi['Manual Review']).toBe(kpi.all)

    // "รอฉันแก้ไข" is an End User card: an accountant's queue is the whole company,
    // so the mockup gives them no personal-lane count at all
    expect(kpi.mine ?? null).toBe(null)
    expect(kpiKeysFor('ACC')).toEqual(kpiKeysFor('APR'))
    // the End User's own cards count the End User's own scope, not the company's
    const euVisible = visibleDocsFor(live, scopeOf(EU))
    const euKpi = kpiCountsFor(baseInput({ docs: euVisible, role: 'EU' }), kpiKeysFor('EU'))
    expect(Object.keys(euKpi)).toEqual(kpiKeysFor('EU'))
    expect(euKpi.all).toBe(euVisible.length)
    expect(euKpi.mine).toBe(
      euVisible.filter(d => d.assigned === 'eu' && !CLOSED_STATUSES.includes(d.status)).length,
    )
    // No live receiver is in the mock Oracle account table yet (that mapping is
    // Task 9's screen), so an End User signing in today legitimately sees 0 rows.
    expect(euVisible.length).toBe(0)
  })

  it('hands EU-owned exception codes to the receiver and everything else to accounting', () => {
    for (const d of live) {
      if (d.assigned !== 'eu') continue
      expect(d.receiver, `${d.doc} assigned to the receiver with no receiver`).toBeTruthy()
      expect(d.codes.some(c => EU_CODES.has(c)), `${d.doc} assigned without an EU-owned code`).toBe(true)
      expect(['Manual Review', 'Duplicate', 'Auto-pass']).not.toContain(d.status)
    }
    // both lanes must be populated, or a rule that always answered "acc" would
    // pass every filter test above by accident
    expect(live.some(d => d.assigned === 'eu'), 'no live document goes to the receiver').toBe(true)
    expect(live.some(d => d.assigned === 'acc'), 'no live document goes to accounting').toBe(true)
  })

  it('company chips cover every live document exactly once', () => {
    const chips = companyCountsFor(baseInput())
    expect(Object.values(chips).reduce((a, b) => a + b, 0)).toBe(live.length)
    expect(Object.keys(chips).sort()).toEqual(Object.keys(companyCounts(live)).sort())
    for (const [c, n] of Object.entries(chips)) {
      expect(filterDocsFor(baseInput({ companyFilter: new Set([c]) })).length, c).toBe(n)
    }
  })

  it('hides what the role may not scope, with the mockup reason', () => {
    for (const d of visibleDocsFor(live, scopeOf(EU))) {
      expect(scopeOf(EU)(d).ok).toBe(true)
      expect(d.receiver).toBeTruthy()
    }

    const foreign: InvoiceDoc = { ...live[0], company: 'ZZZ' }
    const why = scopeCheckFor(foreign, APR, ROLES.APR)
    expect(why.ok).toBe(false)
    expect(why.why).toContain('ZZZ')

    const admin: User = { id: 'test-adm', n: 'Test Admin', email: 'adm@aapico.com', role: 'ADM', rcvName: '—', emp: null, co: [], unit: 'IT' }
    expect(scopeCheckFor(live[0], admin, ROLES.ADM).ok).toBe(false)
  })

  it('never strands a live document outside every accountant company list', () => {
    const reach = new Set<string>()
    for (const u of [ACC, APR, ...USERS]) {
      if (ROLES[u.role].scope === 'none' || ROLES[u.role].scope === 'receiver') continue
      for (const c of u.co) reach.add(c)
    }
    for (const company of Object.keys(companyCounts(live))) {
      expect(reach.has(company), `no accountant role can open company ${company}`).toBe(true)
    }
  })

  it('status tabs select what the mockup selects', () => {
    const visible = visibleDocsFor(live, scopeOf(APR))
    const hold = visible.find(d => d.status === 'Hold')!

    expect(matchStatusFor('all', hold, baseInput())).toBe(true)
    expect(matchStatusFor('Hold', hold, baseInput())).toBe(true)
    expect(matchStatusFor('Review', hold, baseInput())).toBe(false)

    // "รอผู้ใช้งาน" is whoever the queue handed to the receiver, whichever tab is open
    const euDoc: InvoiceDoc = { ...hold, assigned: 'eu', receiver: 'SOMEONE ELSE', receiverActive: true }
    expect(matchStatusFor('mine', euDoc, baseInput({ role: 'ACC' }))).toBe(true)
    expect(matchStatusFor('mine', { ...euDoc, assigned: 'acc' }, baseInput())).toBe(false)
    expect(matchStatusFor('mine', { ...euDoc, status: 'Posted' }, baseInput())).toBe(false)

    // "ไม่ทราบเจ้าของ" is a Manual Review document with no receiver
    const orphan: InvoiceDoc = { ...hold, status: 'Manual Review', unres: true, receiver: undefined }
    expect(matchStatusFor('unres', orphan, baseInput())).toBe(true)
    expect(matchStatusFor('unres', { ...orphan, unres: false }, baseInput())).toBe(false)
    expect(matchStatusFor('unres', { ...orphan, status: 'Hold' }, baseInput())).toBe(false)

    // "รอผูกบัญชี" is a live rule: Review/Hold, an EU-owned code, an unbound receiver
    const euCode = [...EU_CODES][0]
    const unbound: InvoiceDoc = {
      ...hold,
      status: 'Review',
      receiver: 'NOT IN ORACLE',
      receiverActive: false,
      codes: [...hold.codes, euCode],
    }
    expect(pendingBind(unbound)).toBe(true)
    expect(matchStatusFor('bind', unbound, baseInput())).toBe(true)
    expect(pendingBind({ ...unbound, status: 'Manual Review' })).toBe(false)
    expect(pendingBind({ ...unbound, codes: hold.codes.filter(c => !EU_CODES.has(c)) })).toBe(false)
  })

  it('period filter reads the ingestion date', () => {
    const days = [...new Set(live.map(d => d.up))].sort()
    const from = days[days.length - 1]
    expect(perRange({ k: 'custom', from, to: from })).toEqual([from, from])
    expect(inPerOf(from, { k: 'custom', from, to: from })).toBe(true)
    expect(inPerOf('2000-01-01', { k: 'custom', from, to: from })).toBe(false)
    // a document with no readable date only ever appears in "ทุกช่วงเวลา"
    expect(inPerOf('', { k: 'month' })).toBe(false)
    expect(inPerOf('', { k: 'all' })).toBe(true)

    const inMonth = filterDocsFor(baseInput({ periodFilter: { k: 'month' } }))
    const stale = staleDocsFor(baseInput({ periodFilter: { k: 'month' } }))
    expect(inMonth.length + stale.length).toBeGreaterThanOrEqual(live.length)
    for (const d of stale) {
      // only open work can be "ค้างนอกงวด"; closed documents are history
      expect(OPEN_STATUSES).toContain(d.status)
      expect(inPerOf(d.up, { k: 'month' })).toBe(false)
    }
  })

  it('search matches document, invoice, release, PO, vendor and tax id together', () => {
    const doc = live.find(d => d.po && d.vendor.length > 4)!
    const po = doc.po!.split(',')[0].trim()
    expect(filterDocsFor(baseInput({ searchQuery: po })).map(d => d.doc)).toContain(doc.doc)
    expect(filterDocsFor(baseInput({ searchQuery: doc.stax })).map(d => d.doc)).toContain(doc.doc)
    expect(filterDocsFor(baseInput({ searchQuery: `  ${doc.inv}  ` })).map(d => d.doc)).toContain(doc.doc)
  })

  it('sorts the way the mockup sorts each tab', () => {
    // "รอผู้ใช้งาน" is a work queue: the oldest request is worked first
    const mine = filterDocsFor(baseInput({ statusFilter: 'mine' })).map(d => d.up)
    expect(mine).toEqual([...mine].sort())

    // every other tab is newest first
    for (const tab of ['all', 'Hold', 'Review', 'Manual Review']) {
      const ups = filterDocsFor(baseInput({ statusFilter: tab })).map(d => d.up)
      expect(ups, tab).toEqual([...ups].sort().reverse())
    }
  })

  it('keeps closed documents hidden until the accountant asks for them', () => {
    const posted: InvoiceDoc = { ...live[0], doc: 'POSTED-1', status: 'Posted' }
    expect(CLOSED_STATUSES.includes('Posted')).toBe(true)

    const hidden = filterDocsFor(baseInput({ docs: [posted, ...live] }))
    expect(hidden.map(d => d.doc)).not.toContain('POSTED-1')

    const shown = filterDocsFor(baseInput({ docs: [posted, ...live], showClosed: true }))
    expect(shown.map(d => d.doc)).toContain('POSTED-1')

    // an End User always sees closed documents of their own account: they get no
    // alert, so hiding them would hide the work entirely
    const euClosed = matchStatusFor('all', posted, baseInput({ role: 'EU', showClosed: false }))
    expect(euClosed).toBe(true)
    expect(ROLES.EU.p).not.toContain('CONFIRM')
  })

  it('keeps the four-step validation gates on live rows', () => {
    const anyHold = live.find(d => d.status === 'Hold')!
    // A Hold with no receipt and no receiver is the state the mockup's
    // "Reject เท่านั้น" gate exists for. No live row is in it right now (every
    // Hold the Engine produced printed a name), so it is built from a real one.
    const hold: InvoiceDoc = { ...anyHold, receiver: undefined, unres: true, rcv: '—' }
    expect(hold.rcv).toBe('—')
    const reviewBase = live.find(d => d.status === 'Review' && !hasHighSeverity(d) && d.rcv !== '—')!
    const review: InvoiceDoc = { ...reviewBase, codes: reviewBase.codes.filter(c => !EU_CODES.has(c)) }
    expect(review.codes).toEqual(reviewBase.codes.filter(c => !EU_CODES.has(c)))
    expect(isEuPending(review)).toBe(false)
    const manual = live.find(d => d.status === 'Manual Review')!
    const posted: InvoiceDoc = { ...live[0], doc: 'POSTED-2', status: 'Posted' }

    expect(allowedActionFor(review, 'confirm', { role: 'ACC', can: canAll }).ok).toBe(true)
    expect(allowedActionFor(review, 'reject', { role: 'ACC', can: canAll }).ok).toBe(true)
    expect(allowedActionFor(posted, 'confirm', { role: 'ACC', can: canAll }).ok).toBe(false)

    // A receipt-less Hold is reject-only: confirm needs a receipt the Engine found
    expect(allowedActionFor(hold, 'confirm', { role: 'APR', can: canAll })).toEqual({
      ok: false,
      why: 'ไม่มี Receiver: Reject เท่านั้น',
    })
    expect(allowedActionFor(hold, 'reject', { role: 'ACC', can: canAll }).ok).toBe(true)

    // High severity exceptions stop a Manual Review confirm
    const high: InvoiceDoc = { ...manual, codes: [...manual.codes, 'E01'] }
    high.rules = [...manual.rules]
    high.rules[0] = { ...high.rules[0], exception_code: 'E01', severity: 'High', status: 'FAIL', result: 'fail' }
    expect(hasHighSeverity(high)).toBe(true)
    expect(allowedActionFor(high, 'confirm', { role: 'APR', can: canAll })).toEqual({
      ok: false,
      why: 'มีรหัส High',
    })

    // deciding a Manual Review is a permission of its own, not a seniority hint
    expect(allowedActionFor(manual, 'confirm', { role: 'ACC', can: () => false }).ok).toBe(false)
    expect(allowedActionFor(manual, 'confirm', { role: 'ACC', can: () => false }).perm).toBe('MANUAL_REVIEW')
    expect(allowedActionFor(manual, 'reject', { role: 'APR', can: canAll }).perm).toBe('MANUAL_REVIEW')
    expect(ROLES.ACC.p).not.toContain('MANUAL_REVIEW')
    expect(ROLES.APR.p).toContain('MANUAL_REVIEW')

    // an unbound receiver blocks everything until IT links the Oracle account
    const euCode = [...EU_CODES][0]
    const unbound: InvoiceDoc = {
      ...manual,
      status: 'Review',
      receiver: 'NOT IN ORACLE',
      receiverActive: false,
      codes: [...manual.codes, euCode],
    }
    const blocked = allowedActionFor(unbound, 'confirm', { role: 'APR', can: canAll })
    expect(blocked.ok).toBe(false)
    expect(blocked.why).toContain('รอผูกบัญชี')
    expect(blocked.why).toContain('NOT IN ORACLE')

    // a code the receiver must fix waits for the receiver, not for accounting
    const euPending: InvoiceDoc = {
      ...manual,
      status: 'Review',
      assigned: 'eu',
      receiver: EU.rcvName,
      receiverActive: true,
      codes: [...manual.codes, euCode],
    }
    expect(isEuPending(euPending)).toBe(true)
    expect(allowedActionFor(euPending, 'confirm', { role: 'ACC', can: canAll })).toEqual({
      ok: false,
      why: 'รอ End User แก้ไข (มีรหัสของผู้ใช้งานค้าง)',
    })

    // EU may only upload; permission gates still apply to everything else
    const euDoc: InvoiceDoc = { ...manual, receiver: EU.rcvName, receiverActive: true }
    expect(allowedActionFor(euDoc, 'upload', { role: 'EU', can: canAll }).ok).toBe(true)
    expect(allowedActionFor(euDoc, 'confirm', { role: 'EU', can: canAll }).ok).toBe(false)
    expect(allowedActionFor(review, 'hold', { role: 'APR', can: canAll }).ok).toBe(true)
    // same document, same role, permission withheld: the answer names what is missing
    expect(allowedActionFor(review, 'hold', { role: 'ACC', can: () => false })).toEqual({
      ok: false,
      why: 'บทบาทนี้ไม่มีสิทธิ์ (HOLD)',
      perm: 'HOLD',
    })

    // step 3 of four: Confirm lands on AP Interface, it does not post by itself
    expect(statusForAction('confirm')).toBe('Confirmed')
    expect(statusForAction('reject')).toBe('Rejected')
    expect(statusForAction('hold')).toBe('Hold')
    expect(statusForAction('review')).toBe('Review')
    expect(statusForAction('upload')).toBeNull()
  })

  it('runs the two posting pre-checks the mockup warns about', () => {
    const manual = live.find(d => d.status === 'Manual Review')!
    const own: InvoiceDoc = { ...manual, confirmedBy: ACC.id }
    const big: InvoiceDoc = { ...manual, confirmedBy: null, total: 600_000 }

    expect(precheckPostFor(own, { userId: ACC.id, postMax: 500_000 }).code).toBe('sod')
    expect(precheckPostFor(big, { userId: APR.id, postMax: 500_000 }).code).toBe('lim')
    expect(precheckPostFor(big, { userId: APR.id, postMax: 500_000 }).why).toContain('เกินวงเงินตั้งหนี้')
    expect(
      precheckPostFor({ ...manual, confirmedBy: null }, { userId: APR.id, postMax: 500_000 }).ok,
    ).toBe(true)
    // only the reviewer may post, and only inside their credit limit
    expect(ROLES.APR.p).toContain('POST')
    expect(ROLES.ACC.p).not.toContain('POST')
    expect(ROLES.APR.postMax).toBe(1_000_000)
    expect(ROLES.ACC.postMax ?? null).toBe(null)
  })

  it('swaps mock rows for live rows wholesale and keeps the selection usable', () => {
    const first = live[0]
    const second = live[1]

    const failed = applyLiveDocs({ prevDocs: live, liveDocs: [], selectedDocId: first.doc, error: 'boom' })
    // a failed refresh must never empty the queue the analyst is reading
    expect(failed.docs.map(d => d.doc)).toEqual(live.map(d => d.doc))
    expect(failed.selectedDocId).toBe(first.doc)
    expect(failed.source).toBe('error')
    expect(failed.notice).toContain('boom')

    const keep = applyLiveDocs({ prevDocs: live, liveDocs: live, selectedDocId: second.doc })
    expect(keep.selectedDocId).toBe(second.doc)
    expect(keep.source).toBe('portal_db')

    const dropped = applyLiveDocs({ prevDocs: live, liveDocs: live.slice(0, 5), selectedDocId: 'GONE' })
    expect(dropped.selectedDocId).toBe(live[0].doc)
    expect(dropped.docs.length).toBe(5)
    // never a mix of mock and live rows in one queue
    expect(dropped.docs.every(d => expected.has(d.doc))).toBe(true)
  })
})

// ===========================================================================
// 5. Evidence dock zoom — the mockup's fitPages() formula, single scale
// ===========================================================================

describe('evidence dock zoom — mockup fit formula, one scale factor', () => {
  it("uses the mockup's 794px page and 32px dock inset", () => {
    expect(MOCK_PAGE_WIDTH_CSS).toBe(794)
    expect(DOCK_BODY_INSET).toBe(32)
  })

  it('fits the page to the dock body the way fitPages() does', () => {
    expect(mockPageFitScale(794 + DOCK_BODY_INSET)).toBe(1)
    expect(mockPageFitScale(1588 + DOCK_BODY_INSET)).toBeCloseTo(2, 10)
    expect(mockPageFitScale(1000)).toBeCloseTo((1000 - DOCK_BODY_INSET) / MOCK_PAGE_WIDTH_CSS, 10)
    // a collapsed panel must not produce a zero or negative page
    expect(mockPageFitScale(0)).toBeGreaterThan(0)
    expect(mockPageFitScale(-500)).toBeGreaterThan(0)
  })

  it('carries fit x zoom in one CSS variable and leaves transform to rotation only', () => {
    const fit = mockPageFitScale(1000)
    const style = mockSurfaceStyle({ fit, zoom: 1.4, rotation: 90 }) as Record<string, string>

    expect(style['--s']).toBe((fit * 1.4).toFixed(4))
    // rotation is carried as --rot and applied by .ivp-in around the page's own
    // centre, exactly like the mockup: the sheet keeps its place and the paper
    // turns inside it
    expect(style['--rot']).toBe('90deg')
    expect(style.transform ?? '').toBe('')
    // the bug this pins down: a second scale() on the same surface compounds with --s
    expect(`${style.transform ?? ''}${style['--s']}`).not.toContain('scale(')

    // the mockup's own self-test: width grows exactly with the requested zoom
    const widthAt = (zoom: number) =>
      MOCK_PAGE_WIDTH_CSS * Number(mockSurfaceStyle({ fit, zoom, rotation: 0 })['--s'])
    // four decimals is what the mockup writes into --s, so the ratio is exact to
    // within a sub-pixel of that rounding, not to machine precision
    expect(widthAt(1.2) / widthAt(1)).toBeCloseTo(1.2, 3)
    expect(widthAt(1) / widthAt(1)).toBeCloseTo(1, 10)
    expect(widthAt(0.5) / widthAt(1)).toBeCloseTo(0.5, 3)
  })

  it('steps zoom by 10% inside the mockup range', () => {
    expect(zoomForStep(1, 0.1)).toBeCloseTo(1.1, 10)
    expect(zoomForStep(1, -0.1)).toBeCloseTo(0.9, 10)
    expect(zoomForStep(1.1, -0.1)).toBeCloseTo(1, 10)
    expect(zoomForStep(2.5, 0.1)).toBe(2.5)
    expect(zoomForStep(0.5, -0.1)).toBe(0.5)
    // steps stay on clean tenths instead of accumulating float noise
    expect(zoomForStep(1.3000000000000003, 0.1)).toBe(1.4)
    // the fit button does not nudge zoom, it returns it to the fitted width
    expect(zoomForStep(0.5, 'fit')).toBe(1)
  })
})
