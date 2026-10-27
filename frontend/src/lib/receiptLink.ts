/**
 * v5.11 Phase 1 — "Confirm + ผูกใบรับ" (link a receipt, then Confirm).
 *
 * ONE pure rule set, used by:
 *   - the portal server (authoritative: server/routes/receiptLink.ts), and
 *   - the browser (live "ยังขาดอะไร" list under the Confirm button).
 * No React, no Prisma, no fetch. The engine is never called (Phase 2 re-runs V-xx).
 *
 * Decisions encoded here (agreed spec, Phase 1):
 *  1. Confirm from every engine status except Superseded / Duplicate. Import Failed stays on the
 *     AP page. Closed statuses (Confirmed / Sent / Posted / Rejected) cannot be confirmed again.
 *  2. Not Auto-pass → a reason from CONFIRM_REASONS is required. Any High code → a note is required.
 *  3. Manual Review, identity UNRESOLVED, unknown company ('?') or receipts used over their total
 *     → APR (or SA) only.
 *  4. Receipt rules: not found in Oracle → cannot Confirm (Hold). Other company → refused.
 *     Supplier Tax ID differs → warning + reason. Amount / qty / price differ → highlight + note.
 *  5. Duplicate check at Confirm: same invoice number + supplier already Confirmed / Sent / Posted →
 *     refused, the user may "close as duplicate". Same receipt, different invoice → allowed + info.
 *  6. Unknown company / no amounts: company + supplier may come from the receipt (person confirms);
 *     invoice number and grand total must be typed twice when OCR could not read them; the receipt
 *     total is NEVER copied into the invoice total.
 */
import { normalizeInvoiceNum, normalizeReceiveId, normalizeTaxId } from '../server/businessKey'

// ---------------------------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------------------------

export const CONFIRM_REASONS = Object.freeze([
  { code: 'OCR_RCV_UNREADABLE', th: 'OCR อ่านเลขใบรับไม่ได้' },
  { code: 'NO_RCV_ON_DOC', th: 'เอกสารไม่มีเลขใบรับ' },
  { code: 'HANDWRITING', th: 'ลายมืออ่านไม่ออก' },
  { code: 'RCV_LATE', th: 'ใบรับบันทึกล่าช้า' },
  { code: 'VERIFIED_PAPER', th: 'ตรวจกับเอกสารจริงแล้วถูกต้อง' },
  { code: 'OTHER', th: 'อื่น ๆ' },
] as const)

export type ConfirmReasonCode = (typeof CONFIRM_REASONS)[number]['code']
export const CONFIRM_REASON_CODES: readonly string[] = CONFIRM_REASONS.map(r => r.code)

export function reasonLabel(code: string | null | undefined, text?: string | null): string {
  if (!code) return ''
  const r = CONFIRM_REASONS.find(x => x.code === code)
  if (!r) return code
  return code === 'OTHER' && text ? `อื่น ๆ: ${text}` : r.th
}

/** Engine statuses that can never be confirmed (decided by the duplicate rules). */
export const NEVER_CONFIRM = ['Superseded', 'Duplicate'] as const
/** Already closed (or in AP) — nothing to confirm. */
export const ALREADY_CLOSED = ['Confirmed', 'Sent', 'Posted', 'Rejected'] as const
/** Statuses that count as "used" for duplicate / cumulative checks. */
export const COUNTED_STATUSES = ['Confirmed', 'Sent', 'Posted'] as const

/** The value the portal stores for "company not known" (engineToPortalAdapter.resolveCompanyCode). */
export const UNKNOWN_COMPANY = '?'

export const MONEY_TOL = 0.01
export const MIN_OTHER_TEXT = 3
export const MIN_NOTE = 3

export const isApproverRole = (role: string) => ['APR', 'SA'].includes(String(role || '').toUpperCase())
export const isAccountingRole = (role: string) => ['ACC', 'APR', 'SA'].includes(String(role || '').toUpperCase())

// ---------------------------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------------------------

export interface ReceiptLine {
  rcvLineId: string
  lineNo: number
  poNumber: string
  itemCode?: string | null
  itemDesc: string
  qty: number
  uom: string
  unitPrice: number
  lineAmount: number
}

/** One Oracle receipt, normalised (src/server/receiptLink/oracleReceipts.ts). */
export interface OracleReceipt {
  receiptNum: string
  orgId: number | null
  /** Portal company code of ORG_ID ('?' when the org is not mapped). */
  companyCode: string
  ouName: string | null
  supplierName: string | null
  supplierTaxId: string | null
  receiver: string | null
  poNumbers: string[]
  lines: ReceiptLine[]
  /** Sum of line amounts (pre-VAT, as Oracle stores it). */
  total: number
}

export type ReceiptLookup =
  | { state: 'none' } // nothing entered and the document has no engine receipt
  | { state: 'loading' }
  | { state: 'found'; receipt: OracleReceipt; source: 'engine' | 'oracle' }
  | { state: 'not_found'; receiptNum: string }
  | { state: 'out_of_scope'; receiptNum: string; companyCode: string }
  | { state: 'unavailable'; error: string }

export interface UsageRow {
  docId: string
  invoiceNum: string
  supplierTaxId: string
  status: string
  /** Pre-VAT amount compared with the receipt (subtotal, else total − VAT). */
  amount: number
}

export interface LinkDocFacts {
  id: string
  /** Current status = the engine verdict unless a person already moved it. */
  status: string
  identityStatus?: string | null
  companyCode: string
  supplierTaxId: string
  supplierName: string
  invoiceNum: string
  grandTotal: number | null
  subtotal: number | null
  vat: number | null
  /** Exception codes on the document with their severity. */
  codes: Array<{ code: string; severity?: string | null }>
  /** A receiver-owned (EU) code is still open: accounting may skip it but must give a reason. */
  euPending: boolean
  /** Receipt the engine found (RESOLVED), if any. */
  engineReceiptNum: string | null
}

export interface ManualInput {
  invoiceNum?: string
  invoiceNumConfirm?: string
  grandTotal?: string | number
  grandTotalConfirm?: string | number
}

export interface LinkInput {
  /** Receipt typed by the user ('' / undefined = keep the engine receipt). */
  receiptNum?: string | null
  reasonCode?: string | null
  reasonText?: string | null
  note?: string | null
  manual?: ManualInput
  /** The person accepted the company taken from the receipt (unknown-company path). */
  acceptReceiptCompany?: boolean
  /** The person accepted the supplier taken from the receipt (doc had none). */
  acceptReceiptSupplier?: boolean
}

export interface Actor {
  role: string
  companies: string[]
}

export type GateLevel = 'block' | 'warn' | 'info'

export interface Gate {
  key: string
  level: GateLevel
  msg: string
  /** Doc id the message refers to (clickable). */
  ref?: string
}

export interface LineDiff {
  invNo: number
  rcvLineId: string
  field: 'qty' | 'price' | 'amount'
  inv: number
  rcv: number
}

export interface ConfirmEvaluation {
  /** Every block cleared AND every required input present. */
  canConfirm: boolean
  /** Short "ยังขาด…" items shown under the Confirm button (empty = ready). */
  missing: string[]
  gates: Gate[]
  requireReason: boolean
  requireNote: boolean
  requireApr: boolean
  requireManualInvoiceNum: boolean
  requireManualTotal: boolean
  /** Same invoice + supplier already in AP flow: offer "ปิดเป็นเอกสารซ้ำ". */
  duplicateOf: string | null
  receiptManual: boolean
  effective: {
    receiptNum: string | null
    companyCode: string
    supplierTaxId: string
    supplierName: string
    invoiceNum: string
    grandTotal: number | null
    /** Pre-VAT amount used for receipt comparison. */
    compareAmount: number | null
    companyFromReceipt: boolean
    supplierFromReceipt: boolean
  }
  receiptUsedTotal: number
  receiptUsedBy: string[]
  amountDiff: number | null
  lineDiffs: LineDiff[]
}

// ---------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------

const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === '' || String(v).trim() === '—'

/** "1,234.50" → 1234.5 · invalid / empty → null. */
export function parseMoney(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (blank(v)) return null
  const s = String(v).replace(/[,\s฿]/g, '')
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export const round2 = (n: number) => Math.round(n * 100) / 100
export const moneyEq = (a: number, b: number, tol = MONEY_TOL) => Math.abs(a - b) <= tol + 1e-9

/** OCR could not read the invoice number. */
export function invoiceNumMissing(v: string | null | undefined): boolean {
  return blank(v)
}

/** OCR could not read the grand total (absent, not a number, or zero). */
export function totalMissing(v: number | null | undefined): boolean {
  return v === null || v === undefined || !Number.isFinite(v) || v <= 0
}

export function normalizeReceiptInput(v: string | null | undefined): string | null {
  const n = normalizeReceiveId(v ?? null)
  if (!n) return null
  return n.replace(/\s+/g, '')
}

export const RECEIPT_INPUT_RE = /^[A-Z0-9-]{4,30}$/

export function preVatAmount(d: Pick<LinkDocFacts, 'subtotal' | 'grandTotal' | 'vat'>, total: number | null): number | null {
  if (d.subtotal != null && Number.isFinite(d.subtotal) && d.subtotal > 0) return d.subtotal
  if (total == null) return null
  return round2(total - (d.vat != null && Number.isFinite(d.vat) ? d.vat : 0))
}

// ---------------------------------------------------------------------------------------------
// Confirm eligibility (status + role) — also used by the queue action bar
// ---------------------------------------------------------------------------------------------

export function confirmStatusGate(status: string): Gate | null {
  if ((NEVER_CONFIRM as readonly string[]).includes(status)) {
    return { key: 'status', level: 'block', msg: `สถานะ ${status} Confirm ไม่ได้ (ตัดสินโดยกฎเอกสารซ้ำ)` }
  }
  if (status === 'Import Failed') return { key: 'status', level: 'block', msg: 'Import Failed: ดำเนินการที่หน้า AP Interface' }
  if ((ALREADY_CLOSED as readonly string[]).includes(status)) {
    return { key: 'status', level: 'block', msg: `เอกสารอยู่ในสถานะ ${status} แล้ว` }
  }
  return null
}

/** Needs APR (or SA) — before any receipt is known. */
export function needsApproverForDoc(d: Pick<LinkDocFacts, 'status' | 'identityStatus' | 'companyCode'>): string | null {
  if (d.status === 'Manual Review') return 'Manual Review'
  if (d.identityStatus === 'UNRESOLVED') return 'identity UNRESOLVED'
  if (!d.companyCode || d.companyCode === UNKNOWN_COMPANY) return 'ไม่รู้บริษัท'
  return null
}

/** Whether a role may open the link screen at all for this document. */
export function canOpenLink(role: string, d: Pick<LinkDocFacts, 'status' | 'identityStatus' | 'companyCode'>): { ok: boolean; why?: string } {
  if (!isAccountingRole(role)) return { ok: false, why: 'เฉพาะฝ่ายบัญชี (ACC / APR)' }
  const st = confirmStatusGate(d.status)
  if (st) return { ok: false, why: st.msg }
  const apr = needsApproverForDoc(d)
  if (apr && !isApproverRole(role)) return { ok: false, why: `${apr}: เฉพาะหัวหน้าฝ่ายบัญชี (APR)` }
  return { ok: true }
}

/** Receipt may be used by this actor (company in the actor's assignment). */
export function receiptInScope(companyCode: string, actor: Actor): boolean {
  if (String(actor.role).toUpperCase() === 'SA' || actor.companies.includes('ALL')) return true
  return actor.companies.includes(companyCode)
}

// ---------------------------------------------------------------------------------------------
// Duplicate + cumulative
// ---------------------------------------------------------------------------------------------

export function findSameInvoice(
  self: { id: string; invoiceNum: string; supplierTaxId: string },
  others: UsageRow[],
): UsageRow[] {
  const inv = normalizeInvoiceNum(self.invoiceNum)
  const tax = normalizeTaxId(self.supplierTaxId)
  if (!inv || !tax) return []
  return others.filter(
    o =>
      o.docId !== self.id &&
      (COUNTED_STATUSES as readonly string[]).includes(o.status) &&
      normalizeInvoiceNum(o.invoiceNum) === inv &&
      normalizeTaxId(o.supplierTaxId) === tax,
  )
}

/** Other documents already in AP flow on the same receipt (excluding this one). */
export function receiptUsage(selfId: string, onReceipt: UsageRow[]): { used: UsageRow[]; total: number } {
  const used = onReceipt.filter(o => o.docId !== selfId && (COUNTED_STATUSES as readonly string[]).includes(o.status))
  return { used, total: round2(used.reduce((s, o) => s + (Number.isFinite(o.amount) ? o.amount : 0), 0)) }
}

// ---------------------------------------------------------------------------------------------
// Line comparison (only lines that are paired — see approxLineMatch.ts)
// ---------------------------------------------------------------------------------------------

export interface PairedLine {
  inv: { no: number; qty: number; price: number; amount: number }
  rcv: ReceiptLine
}

export function lineDiffsOf(pairs: PairedLine[]): LineDiff[] {
  const out: LineDiff[] = []
  for (const p of pairs) {
    if (!moneyEq(p.inv.qty, p.rcv.qty, 1e-6)) out.push({ invNo: p.inv.no, rcvLineId: p.rcv.rcvLineId, field: 'qty', inv: p.inv.qty, rcv: p.rcv.qty })
    if (!moneyEq(p.inv.price, p.rcv.unitPrice)) out.push({ invNo: p.inv.no, rcvLineId: p.rcv.rcvLineId, field: 'price', inv: p.inv.price, rcv: p.rcv.unitPrice })
    if (!moneyEq(p.inv.amount, p.rcv.lineAmount)) out.push({ invNo: p.inv.no, rcvLineId: p.rcv.rcvLineId, field: 'amount', inv: p.inv.amount, rcv: p.rcv.lineAmount })
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// The evaluation
// ---------------------------------------------------------------------------------------------

export interface EvaluateArgs {
  doc: LinkDocFacts
  actor: Actor
  input: LinkInput
  lookup: ReceiptLookup
  /** Documents with the same invoice number (any supplier — filtered here). */
  sameInvoiceCandidates: UsageRow[]
  /** Documents linked to the effective receipt. */
  onReceipt: UsageRow[]
  /** Paired invoice/receipt lines (engine pairs or approximate pairs). */
  pairs?: PairedLine[]
}

export function evaluateConfirm(a: EvaluateArgs): ConfirmEvaluation {
  const { doc, actor, input, lookup } = a
  const gates: Gate[] = []
  const missing: string[] = []
  const role = String(actor.role || '').toUpperCase()

  // -- status / role ---------------------------------------------------------------------------
  const st = confirmStatusGate(doc.status)
  if (st) gates.push(st)
  if (!isAccountingRole(role)) gates.push({ key: 'role', level: 'block', msg: 'บทบาทนี้ Confirm ไม่ได้' })

  let requireApr = false
  const aprWhy: string[] = []
  const docApr = needsApproverForDoc(doc)
  if (docApr) {
    requireApr = true
    aprWhy.push(docApr)
  }

  const notAutoPass = doc.status !== 'Auto-pass'
  let requireReason = notAutoPass
  const highCodes = doc.codes.filter(c => String(c.severity || '').toLowerCase() === 'high').map(c => c.code)
  let requireNote = highCodes.length > 0
  const noteWhy: string[] = highCodes.length ? [`มีรหัส High (${highCodes.join(', ')})`] : []

  if (doc.euPending) {
    requireReason = true
    gates.push({ key: 'eu_pending', level: 'warn', msg: 'มีรหัสที่ Receiver ต้องแก้ค้างอยู่ · Confirm ข้ามได้แต่ต้องระบุเหตุผล' })
  }

  // -- receipt ---------------------------------------------------------------------------------
  const typed = normalizeReceiptInput(input.receiptNum ?? null)
  const engineRcv = normalizeReceiptInput(doc.engineReceiptNum)
  const effectiveReceipt = typed ?? engineRcv
  const receiptManual = !!typed && typed !== engineRcv

  let receipt: OracleReceipt | null = null
  if (typed && !RECEIPT_INPUT_RE.test(typed)) {
    gates.push({ key: 'rcv_format', level: 'block', msg: 'รูปแบบเลขใบรับไม่ถูกต้อง (A-Z 0-9 - ยาว 4–30)' })
  } else {
    switch (lookup.state) {
      case 'none':
        gates.push({ key: 'rcv_none', level: 'block', msg: 'ยังไม่มีใบรับ · กรอกเลขใบรับ หรือกด Hold รอใบรับ' })
        missing.push('เลขใบรับ')
        break
      case 'loading':
        gates.push({ key: 'rcv_loading', level: 'block', msg: 'กำลังค้นใบรับใน Oracle…' })
        missing.push('ผลค้นใบรับ')
        break
      case 'unavailable':
        gates.push({ key: 'rcv_unavailable', level: 'block', msg: `ค้น Oracle ไม่ได้: ${lookup.error} · ลองใหม่ หรือ Hold` })
        missing.push('ผลค้นใบรับ (Oracle ไม่พร้อม)')
        break
      case 'not_found':
        gates.push({ key: 'rcv_not_found', level: 'block', msg: `ไม่พบใบรับ ${lookup.receiptNum} ใน Oracle · Confirm ไม่ได้ ให้ Hold รอใบรับ` })
        break
      case 'out_of_scope':
        gates.push({ key: 'rcv_scope', level: 'block', msg: `ใบรับ ${lookup.receiptNum} อยู่บริษัท ${lookup.companyCode} ซึ่งไม่ได้รับมอบหมาย` })
        break
      case 'found':
        receipt = lookup.receipt
        break
    }
  }

  // -- company / supplier ----------------------------------------------------------------------
  const docCompanyKnown = !!doc.companyCode && doc.companyCode !== UNKNOWN_COMPANY
  let companyCode = doc.companyCode || UNKNOWN_COMPANY
  let companyFromReceipt = false
  let supplierTaxId = doc.supplierTaxId || ''
  let supplierName = doc.supplierName || ''
  let supplierFromReceipt = false

  if (receipt) {
    if (!receiptInScope(receipt.companyCode, actor)) {
      gates.push({ key: 'rcv_scope', level: 'block', msg: `ใบรับอยู่บริษัท ${receipt.companyCode} ซึ่งไม่ได้รับมอบหมาย` })
    }
    if (receipt.companyCode === UNKNOWN_COMPANY) {
      gates.push({ key: 'rcv_company_unknown', level: 'block', msg: `ORG_ID ${receipt.orgId ?? '—'} ของใบรับไม่อยู่ในรายการบริษัท` })
    } else if (docCompanyKnown && receipt.companyCode !== doc.companyCode) {
      gates.push({ key: 'company_mismatch', level: 'block', msg: `ใบรับเป็นของบริษัท ${receipt.companyCode} แต่เอกสารเป็นของ ${doc.companyCode} · ใช้ไม่ได้` })
    } else if (!docCompanyKnown) {
      if (input.acceptReceiptCompany) {
        companyCode = receipt.companyCode
        companyFromReceipt = true
      } else {
        gates.push({ key: 'company_accept', level: 'block', msg: `ยืนยันบริษัทจากใบรับ (${receipt.companyCode}) ก่อน` })
        missing.push('ยืนยันบริษัทจากใบรับ')
      }
    }

    const docTax = normalizeTaxId(doc.supplierTaxId)
    const rcvTax = normalizeTaxId(receipt.supplierTaxId)
    if (!docTax && rcvTax) {
      if (input.acceptReceiptSupplier) {
        supplierTaxId = receipt.supplierTaxId ?? ''
        supplierName = receipt.supplierName ?? supplierName
        supplierFromReceipt = true
      } else {
        gates.push({ key: 'supplier_accept', level: 'block', msg: 'ยืนยันผู้ขายจากใบรับก่อน' })
        missing.push('ยืนยันผู้ขายจากใบรับ')
      }
    } else if (docTax && rcvTax && docTax !== rcvTax) {
      requireReason = true
      gates.push({ key: 'supplier_mismatch', level: 'warn', msg: `Tax ID ผู้ขายไม่ตรง (เอกสาร ${doc.supplierTaxId} · ใบรับ ${receipt.supplierTaxId}) · ต้องระบุเหตุผล` })
    }
  }
  if (!docCompanyKnown) {
    requireApr = true
    if (!aprWhy.includes('ไม่รู้บริษัท')) aprWhy.push('ไม่รู้บริษัท')
  }

  // -- manual values (OCR unreadable) ---------------------------------------------------------
  const requireManualInvoiceNum = invoiceNumMissing(doc.invoiceNum)
  const requireManualTotal = totalMissing(doc.grandTotal)
  let invoiceNum = doc.invoiceNum
  let grandTotal: number | null = requireManualTotal ? null : doc.grandTotal
  const m = input.manual ?? {}
  if (requireManualInvoiceNum) {
    const v1 = String(m.invoiceNum ?? '').trim()
    const v2 = String(m.invoiceNumConfirm ?? '').trim()
    if (!v1) missing.push('เลขใบแจ้งหนี้ (OCR อ่านไม่ได้)')
    else if (v1 !== v2) {
      missing.push('เลขใบแจ้งหนี้ ครั้งที่ 2 ให้ตรงกัน')
      gates.push({ key: 'manual_inv_mismatch', level: 'block', msg: 'เลขใบแจ้งหนี้ที่กรอก 2 ครั้งไม่ตรงกัน' })
    } else invoiceNum = v1
  }
  if (requireManualTotal) {
    const v1 = parseMoney(m.grandTotal)
    const v2 = parseMoney(m.grandTotalConfirm)
    if (v1 === null || v1 <= 0) missing.push('ยอดรวม (OCR อ่านไม่ได้)')
    else if (v2 === null || !moneyEq(v1, v2, 0)) {
      missing.push('ยอดรวม ครั้งที่ 2 ให้ตรงกัน')
      gates.push({ key: 'manual_total_mismatch', level: 'block', msg: 'ยอดรวมที่กรอก 2 ครั้งไม่ตรงกัน' })
    } else grandTotal = round2(v1)
  }
  if (requireManualInvoiceNum || requireManualTotal) {
    gates.push({ key: 'manual_values', level: 'info', msg: 'มีค่าที่คนกรอก · เก็บแยกจากค่า OCR และติดป้ายไปถึงหน้า AP' })
  }

  // -- amounts vs receipt ----------------------------------------------------------------------
  const compareAmount = preVatAmount(doc, grandTotal)
  let amountDiff: number | null = null
  if (receipt && compareAmount != null) {
    amountDiff = round2(compareAmount - receipt.total)
    if (!moneyEq(compareAmount, receipt.total)) {
      requireNote = true
      noteWhy.push('ยอดไม่ตรงใบรับ')
      gates.push({ key: 'amount_diff', level: 'warn', msg: `ยอดก่อน VAT ต่างจากใบรับ ${amountDiff > 0 ? '+' : ''}${amountDiff.toFixed(2)} · ต้องมีหมายเหตุ` })
    }
  }
  const lineDiffs = receipt ? lineDiffsOf(a.pairs ?? []) : []
  if (lineDiffs.length) {
    requireNote = true
    noteWhy.push('จำนวน/ราคาต่างจากใบรับ')
    gates.push({ key: 'line_diff', level: 'warn', msg: `${lineDiffs.length} ค่าในตารางเทียบไม่ตรงใบรับ (ไฮไลต์) · ต้องมีหมายเหตุ` })
  }

  // -- duplicates ------------------------------------------------------------------------------
  const same = findSameInvoice({ id: doc.id, invoiceNum, supplierTaxId }, a.sameInvoiceCandidates)
  const duplicateOf = same[0]?.docId ?? null
  if (duplicateOf) {
    gates.push({
      key: 'duplicate',
      level: 'block',
      msg: `เลขใบแจ้งหนี้ ${invoiceNum} ของผู้ขายนี้ ${same[0].status} แล้วที่ ${duplicateOf} · ปิดเป็นเอกสารซ้ำแทน`,
      ref: duplicateOf,
    })
  }

  const usage = receiptUsage(doc.id, a.onReceipt)
  const otherInvoiceUsers = usage.used.filter(u => normalizeInvoiceNum(u.invoiceNum) !== normalizeInvoiceNum(invoiceNum))
  for (const u of otherInvoiceUsers) {
    gates.push({ key: `rcv_used_${u.docId}`, level: 'info', msg: `ใบรับนี้ใช้แล้วกับ ${u.docId} (${u.status})`, ref: u.docId })
  }
  if (receipt && compareAmount != null && usage.used.length) {
    const cumulative = round2(usage.total + compareAmount)
    if (cumulative > receipt.total + MONEY_TOL) {
      requireApr = true
      aprWhy.push('ยอดสะสมเกินใบรับ')
      requireNote = true
      noteWhy.push('ยอดสะสมเกินใบรับ')
      gates.push({ key: 'cumulative_over', level: 'warn', msg: `ยอดสะสมของใบรับ ${cumulative.toFixed(2)} เกินยอดรับ ${receipt.total.toFixed(2)} · APR เท่านั้น + หมายเหตุ` })
    }
  }

  // -- role vs APR requirement -----------------------------------------------------------------
  if (requireApr && !isApproverRole(role)) {
    gates.push({ key: 'apr_only', level: 'block', msg: `${aprWhy.join(' · ')}: Confirm ได้เฉพาะหัวหน้าฝ่ายบัญชี (APR)` })
  }

  // -- reason / note ---------------------------------------------------------------------------
  if (requireReason) {
    const code = input.reasonCode ?? ''
    if (!code || !CONFIRM_REASON_CODES.includes(code)) missing.push('เหตุผล')
    else if (code === 'OTHER' && String(input.reasonText ?? '').trim().length < MIN_OTHER_TEXT) missing.push('รายละเอียดเหตุผล "อื่น ๆ"')
  }
  if (requireNote && String(input.note ?? '').trim().length < MIN_NOTE) missing.push(`หมายเหตุ (${noteWhy.join(' · ')})`)

  // Blocks that did not already add their own "ยังขาด" item are listed as they are.
  const ALREADY_LISTED = new Set(['rcv_none', 'rcv_loading', 'rcv_unavailable', 'company_accept', 'supplier_accept', 'manual_inv_mismatch', 'manual_total_mismatch'])
  for (const g of gates) if (g.level === 'block' && !ALREADY_LISTED.has(g.key)) missing.push(g.msg)

  const blocked = gates.some(g => g.level === 'block')
  return {
    canConfirm: !blocked && missing.length === 0,
    missing,
    gates,
    requireReason,
    requireNote,
    requireApr,
    requireManualInvoiceNum,
    requireManualTotal,
    duplicateOf,
    receiptManual,
    effective: {
      receiptNum: effectiveReceipt,
      companyCode,
      supplierTaxId,
      supplierName,
      invoiceNum,
      grandTotal,
      compareAmount,
      companyFromReceipt,
      supplierFromReceipt,
    },
    receiptUsedTotal: usage.total,
    receiptUsedBy: usage.used.map(u => u.docId),
    amountDiff,
    lineDiffs,
  }
}

/** Badge text for queue rows whose receipt already went to AP. */
export const RCV_SENT_BADGE = 'ใบรับนี้ส่ง AP แล้ว'

/**
 * Receipt numbers already in AP (Sent / Posted) → doc ids on the same receipt that are still open
 * get the badge. Pure: the list route calls it on the loaded rows.
 */
export function receiptsSentToAp(docs: Array<{ doc: string; rcv?: string; status: string }>): Set<string> {
  const sent = new Set<string>()
  for (const d of docs) {
    const r = normalizeReceiptInput(d.rcv)
    if (r && (d.status === 'Sent' || d.status === 'Posted')) sent.add(r)
  }
  return sent
}
