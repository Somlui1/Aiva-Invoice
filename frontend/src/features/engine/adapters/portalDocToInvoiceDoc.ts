/**
 * Portal contract → `InvoiceDoc` (design §4.1, Task 8).
 *
 * `src/mock/initialDocs.ts` is a hand-written picture of three invoices. The
 * database holds the real thing, but the queue, the detail pane and the evidence
 * dock were all built against the mock's shape, so this adapter is the one place
 * allowed to know both sides.
 *
 * Rules it follows:
 *
 *  • **Never invent a fact the Engine did not report.** A missing invoice date
 *    becomes the mockup's em dash, not today's date; a document with no receiver
 *    leaves `receiver` empty (that absence *is* the "ไม่ทราบเจ้าของ" signal), and
 *    fields with no Portal source (`batch`, `apErr`, `confirmedBy`, `grp`) stay
 *    empty rather than gaining a plausible value.
 *  • **Portal workflow state is authoritative.** `status` is copied through the
 *    union; an Engine result can only ever produce the four pre-posting statuses.
 *  • **The evidence overlay is fed from the same row.** `rules[].bbox` and, on
 *    request, `raw_payload` carry the Engine's boxes, so Task 7's projector draws
 *    live documents exactly like the mock page.
 */
import { EXCEPTION_RULES, EU_CODES } from '../../../mock/rules'
import type {
  DocumentHistoryEntry,
  ExceptionSeverity,
  InvoiceDoc,
  InvoiceLineItem,
  InvoiceStatus,
  RuleCheck,
} from '../../../types/invoice'
import type { PortalBoundingBox, PortalInvoiceDocument } from '../types/portalDomain'

/** Element types that are containers, not evidence — drawing them buries the page. */
export const DEFAULT_DROPPED_ELEMENT_TYPES: readonly string[] = Object.freeze([
  'page',
  'section',
  'word',
])

export interface PortalToUiOptions {
  /**
   * Attach `raw_payload` (OCR elements + evidence links) for the evidence dock.
   * The list endpoint leaves this off: boxes are only needed for the document the
   * analyst has open, and 125 documents' worth of boxes is not a list payload.
   */
  includeBoxes?: boolean
  /** Element types to leave out of `raw_payload`. */
  dropElementTypes?: readonly string[]
  /**
   * Oracle account binding, for `receiverActive`. Defaults to "bound"; wire the
   * real table when Task 9 lands it.
   */
  isReceiverBound?: ReceiverBindingCheck
}

/**
 * Every state the queue can display: the four an Engine result leaves behind,
 * plus the workflow states the Portal moves a document into afterwards.
 */
const UI_STATUSES: readonly string[] = Object.freeze([
  'Auto-pass',
  'Review',
  'Hold',
  'Manual Review',
  'Confirmed',
  'Sent',
  'Posted',
  'Rejected',
  'Superseded',
  'Duplicate',
  'Import Failed',
])

const RULE_STATUSES: readonly string[] = Object.freeze(['PASS', 'FAIL', 'WARN', 'SKIP'])
const SEVERITY_RANK: Record<ExceptionSeverity, number> = { High: 0, Medium: 1, Low: 2 }

/** ISO timestamp → `YYYY-MM-DD`, or `''`. The queue compares these as strings. */
export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso)
  return m ? m[1] : ''
}

function timeOnly(iso: string | null | undefined): string {
  const m = /T(\d{2}:\d{2})/.exec(iso ?? '')
  return m ? `${m[1]}:00` : '—'
}

/**
 * Portal status → UI status. A copy, never a reinterpretation: the Portal owns
 * what state a document is in (design §2), and a document that has been posted
 * must read as posted in the queue — quietly relabelling it "Manual Review"
 * would put finished work back on someone's to-do list.
 *
 * A string outside the union (an older row, a value from a future release) falls
 * back to "Manual Review", because a document whose state nobody can read must
 * be looked at by a human rather than hidden.
 */
export function uiStatusFor(status: string): InvoiceStatus {
  return (UI_STATUSES.includes(status) ? status : 'Manual Review') as InvoiceStatus
}

function ruleStatus(status: string): RuleCheck['status'] {
  return (RULE_STATUSES.includes(status) ? status : 'SKIP') as RuleCheck['status']
}

function ruleName(r: PortalInvoiceDocument['rules'][number]): string {
  const named = r.exceptionCode ? EXCEPTION_RULES[r.exceptionCode]?.name : undefined
  return named ?? r.ruleId
}

function ruleDetail(r: PortalInvoiceDocument['rules'][number]): string | undefined {
  // The Engine's Thai sentence is what the analyst reads; the raw detail is the
  // fallback; the catalog name keeps a bare rule from rendering an empty card.
  if (r.messageTh) return r.messageTh
  if (r.detail) return r.detail
  const named = r.exceptionCode ? EXCEPTION_RULES[r.exceptionCode]?.name : undefined
  return named || undefined
}

/**
 * Smallest evidence box for a rule, on the first page that carries evidence.
 * @deprecated kept for `RuleCheck.bbox` consumers until the dock reads `findings` (plan F3/F6).
 */
function boxForRule(
  ruleId: string,
  bboxes: readonly PortalBoundingBox[],
): PortalBoundingBox | undefined {
  const forRule = bboxes.filter(
    b => b.ruleId === ruleId && !!b.exceptionCode && b.bbox[2] > 0 && b.bbox[3] > 0,
  )
  if (!forRule.length) return undefined
  const page = Math.min(...forRule.map(b => b.pageNo))
  return forRule
    .filter(b => b.pageNo === page)
    .sort((a, b) => a.bbox[2] * a.bbox[3] - b.bbox[2] * b.bbox[3])[0]
}

function toRuleCheck(r: PortalInvoiceDocument['rules'][number], box?: PortalBoundingBox): RuleCheck {
  const check: RuleCheck = {
    id: r.ruleId,
    rule: r.ruleId,
    name: ruleName(r),
    status: ruleStatus(r.status),
    result: r.result,
  }
  const detail = ruleDetail(r)
  if (detail) check.detail = detail
  if (r.exceptionCode) check.exception_code = r.exceptionCode
  if (r.severity && r.severity !== 'None') check.severity = r.severity
  if (r.actualValue != null) check.actual = r.actualValue
  if (r.expectedValue != null) check.expected = r.expectedValue
  if (r.pageNos?.length) check.page = r.pageNos[0]
  if (r.haltedBy) check.halted_by = r.haltedBy
  if (r.findings) check.findings = r.findings
  if (box) {
    check.bbox = { x: box.bbox[0], y: box.bbox[1], w: box.bbox[2], h: box.bbox[3], page: box.pageNo }
  }
  return check
}

/** Exception codes, once each, most severe first — the order the badges render in. */
function codesOf(doc: PortalInvoiceDocument): string[] {
  const best = new Map<string, ExceptionSeverity>()
  for (const e of doc.exceptions) {
    const current = best.get(e.code)
    if (!current || SEVERITY_RANK[e.severity] < SEVERITY_RANK[current]) best.set(e.code, e.severity)
  }
  return [...best.entries()]
    .sort((a, b) => SEVERITY_RANK[a[1]] - SEVERITY_RANK[b[1]] || a[0].localeCompare(b[0]))
    .map(([code]) => code)
}

function linesOf(doc: PortalInvoiceDocument): InvoiceLineItem[] {
  return doc.lineItems.map(l => {
    const line: InvoiceLineItem = {
      no: l.no,
      desc: l.desc ?? '',
      qty: l.qty ?? 0,
      unit: l.unit ?? '',
      price: l.price ?? 0,
      amount: l.amount ?? 0,
      diff: !!l.diff,
    }
    if (l.poLine != null) line.po_line = l.poLine
    if (l.poQty != null) line.po_qty = l.poQty
    if (l.poPrice != null) line.po_price = l.poPrice
    if (l.grLine != null) line.gr_line = l.grLine
    if (l.grQty != null) line.gr_qty = l.grQty
    if (l.matchLevel) line.match_level = l.matchLevel
    return line
  })
}

/**
 * The mock page's two signature glyphs.
 *
 * The Engine reports a signature as a named element on the page. Engine v5.6+ always emits the
 * slot's box and says what is in it: `raw_value` "signed" / "empty" (older payloads: the boolean
 * `normalized_value`, which the adapter stringifies to "true" / "false"). Only an explicit "signed" /
 * "true" is the ✓ glyph — a box that exists but is empty is ✗. This reads the Engine's own evidence,
 * not the V-06 verdict, so the picture and the rule can never disagree by construction.
 */
export const SIGNED_VALUES: ReadonlySet<string> = new Set(['signed', 'true'])

export function isSignedValue(raw: unknown): boolean {
  return SIGNED_VALUES.has(String(raw ?? '').trim().toLowerCase())
}

export function mockSignatureFlags(doc: PortalInvoiceDocument): [number, number] {
  const present = (field: string): number =>
    doc.bboxes.some(b => b.fieldName === field && isSignedValue(b.rawValue)) ? 1 : 0
  return [present('signatures.deliverer'), present('signatures.receiver')]
}

/**
 * The trail the log tab shows. The Engine reports no audit history, so exactly one
 * entry is recorded — the arrival of the result, with the verdict the Engine gave.
 * Everything after that comes from real Portal actions.
 */
function historyOf(doc: PortalInvoiceDocument): DocumentHistoryEntry[] {
  if (doc.history.length) {
    return doc.history.map(h => ({
      dt: dateOnly(h.dt),
      t: timeOnly(h.dt),
      who: h.who,
      role: h.role,
      act: h.act,
      d: h.detail,
    }))
  }
  // The Engine writes no audit trail, so the one entry the log can honestly show
  // is the arrival of its result and the verdict that came with it.
  const stamp = doc.updatedAt || doc.createdAt
  return [
    {
      dt: dateOnly(stamp),
      t: timeOnly(stamp),
      who: 'ระบบตรวจสอบอัตโนมัติ (System A)',
      role: 'Engine',
      act: 'ตรวจเอกสารเสร็จสิ้น',
      d: `ผลตรวจ ${doc.status} · ความรุนแรงสูงสุด ${doc.maxSeverity}`,
      k: 's',
    },
  ]
}

export interface RawElementLite {
  element_id: string
  page_no: number
  bbox: number[]
  field_name?: string | null
  raw_value?: string | number | null
  normalized_value?: string | number | null
  confidence?: number | null
  element_type?: string | null
}

export interface RawEvidenceLite {
  rule_id: string
  /** Absent on a review finding (manual_review evidence has no exception code). */
  exception_code?: string
  severity?: ExceptionSeverity
  /** The finding this group is (one group per finding; legacy payloads: one per rule). */
  finding_id?: string
  bboxes: { element_id: string; page_no: number; bbox: number[] }[]
}

/**
 * `raw_payload` in the shape Task 7's `viewerBoxesFromInvoiceDoc()` reads.
 *
 * The Portal already flattened OCR elements and their rule links into `bboxes[]`;
 * this re-expresses them as the OCR element list plus per-rule evidence groups,
 * which is what the overlay projector consumes.
 */
export function portalBboxesToRawPayload(
  doc: PortalInvoiceDocument,
  opts: Pick<PortalToUiOptions, 'dropElementTypes'> = {},
): { ocr: { elements: RawElementLite[] }; evidence: RawEvidenceLite[] } {
  const dropped = new Set(opts.dropElementTypes ?? DEFAULT_DROPPED_ELEMENT_TYPES)

  const elements: RawElementLite[] = []
  for (const b of doc.bboxes) {
    if (dropped.has(b.elementType)) continue
    elements.push({
      element_id: b.id,
      page_no: b.pageNo,
      bbox: [b.bbox[0], b.bbox[1], b.bbox[2], b.bbox[3]],
      field_name: b.fieldName ?? null,
      raw_value: b.rawValue ?? null,
      // The Portal contract keeps only the text the Engine read; there is no
      // separate normalised form to carry.
      normalized_value: null,
      confidence: b.confidence ?? null,
      element_type: b.elementType,
    })
  }

  // One evidence group per *located* finding, so a rule with several findings (V-07 per line)
  // keeps each finding's boxes apart and a box shared by two rules sits in both groups. A review
  // finding (manual_review, no exception code) is a group too — its button has to find its boxes —
  // but carries no code / severity, so it is drawn as "needs a person", never as an exception.
  const findingGroups: RawEvidenceLite[] = []
  for (const r of doc.rules) {
    for (const f of r.findings ?? []) {
      if (f.targets.length === 0) continue
      findingGroups.push({
        rule_id: f.ruleId,
        ...(f.code ? { exception_code: f.code } : {}),
        ...(f.severity ? { severity: f.severity } : {}),
        finding_id: f.id,
        bboxes: f.targets.map(t => ({
          element_id: t.id,
          page_no: t.pageNo,
          bbox: [t.bbox[0], t.bbox[1], t.bbox[2], t.bbox[3]],
        })),
      })
    }
  }
  if (doc.rules.some(r => r.findings !== undefined)) {
    return { ocr: { elements }, evidence: findingGroups }
  }

  // Legacy payload (stored before findings existed): one group per rule, as before.
  const groups = new Map<string, RawEvidenceLite>()
  for (const b of doc.bboxes) {
    if (!b.ruleId || !b.exceptionCode || !b.severity) continue
    let group = groups.get(b.ruleId)
    if (!group) {
      group = {
        rule_id: b.ruleId,
        exception_code: b.exceptionCode,
        severity: b.severity,
        bboxes: [],
      }
      groups.set(b.ruleId, group)
    }
    group.bboxes.push({
      element_id: b.id,
      page_no: b.pageNo,
      bbox: [b.bbox[0], b.bbox[1], b.bbox[2], b.bbox[3]],
    })
  }

  return { ocr: { elements }, evidence: [...groups.values()] }
}

/**
 * Whether a receiver name printed on a receipt corresponds to a live Oracle
 * account the person can act in.
 *
 * The mockup answers this from the IT-admin account table (`bound(acct)`,
 * `INITIAL_MAPS`). The Portal database has no such table yet — Task 9 (Oracle
 * account binding) owns it — so until then a receiver the Engine read is treated
 * as bound. Answering "not bound" instead would park every document behind
 * `pendingBind`, a gate nobody in the Portal can clear, and the queue would read
 * as broken when the missing thing is only a table.
 */
export type ReceiverBindingCheck = (receiverName: string) => boolean

export const ASSUME_BOUND: ReceiverBindingCheck = () => true

/**
 * Who has to act next — the mockup's `assigned` rule.
 *
 * Portal's own `assignedRole` column is a placeholder constant today ('EU' for
 * every ingested row, see `engineToPortalAdapter`), so copying it would hand the
 * whole queue to the receiver and leave the accounting lane empty. The mockup's
 * rule is reproduced instead: an ownerless, unbound, already-closed or
 * auto-passed document is accounting's; otherwise a document carrying a code the
 * receiver owns is the receiver's.
 */
export function assignedLaneFor(
  doc: PortalInvoiceDocument,
  status: InvoiceStatus,
  receiverActive: boolean,
): 'eu' | 'acc' {
  if (!doc.receiverName || !receiverActive) return 'acc'
  if (['Manual Review', 'Duplicate', 'Auto-pass'].includes(status)) return 'acc'
  return doc.rules.some(r => r.exceptionCode && EU_CODES.has(r.exceptionCode)) ? 'eu' : 'acc'
}

/**
 * The one-way mapping the queue runs on.
 *
 * `up` is the date the Portal took the document in — the period filter and the
 * queue sort both read it — so it comes from the row's timestamp, never from a
 * date printed on the invoice.
 */
export function portalDocToInvoiceDoc(
  doc: PortalInvoiceDocument,
  opts: PortalToUiOptions = {},
): InvoiceDoc {
  const status = uiStatusFor(doc.status)
  const receiverActive = doc.receiverName ? opts.isReceiverBound?.(doc.receiverName) ?? true : true
  const out: InvoiceDoc = {
    doc: doc.id,
    company: doc.companyCode,
    vendor: doc.supplierName,
    stax: doc.supplierTaxId,
    inv: doc.invoiceNum,
    dt: doc.invoiceDate || '—',
    total: doc.grandTotal,
    sub: doc.subtotal,
    vat: doc.vat,
    po: doc.poNumbers.join(', '),
    rcv: doc.receiptNums[0] ?? '—',
    org: doc.orgId ?? null,
    oname: doc.companyName,
    sig: mockSignatureFlags(doc),
    rtotal: doc.receiptTotal ?? null,
    status,
    // The mockup treats a document with no receiver as "active" — there is
    // simply nobody to wait for — and only a bound name counts as actionable.
    receiverActive,
    assigned: assignedLaneFor(doc, status, receiverActive),
    codes: codesOf(doc),
    rules: doc.rules.map(r => toRuleCheck(r, boxForRule(r.ruleId, doc.bboxes))),
    lines: linesOf(doc),
    oracleReceiptLines: doc.oracleReceiptLines,
    pages: doc.pageCount,
    history: historyOf(doc),
    unres: !doc.receiverName,
    up: dateOnly(doc.updatedAt) || dateOnly(doc.createdAt),
  }

  if (doc.receiverName) out.receiver = doc.receiverName
  if (opts.includeBoxes) {
    out.bboxes = doc.bboxes
    out.raw_payload = portalBboxesToRawPayload(doc, opts) as unknown as Record<string, unknown>
  }
  return out
}

export default portalDocToInvoiceDoc
