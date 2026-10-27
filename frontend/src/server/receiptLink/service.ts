/**
 * v5.11 Phase 1 — Confirm + ผูกใบรับ: database side (portal server only; engine not called).
 *
 * The rules are in src/lib/receiptLink.ts (shared with the browser). This module loads the facts the
 * rules need (document, Oracle receipt, other documents on the same invoice / receipt) and writes the
 * outcome (columns + payloadJson + AuditLog) with an optimistic version check (409 when the document
 * changed after the screen was opened).
 */
import { prisma } from '../../lib/prisma'
import { companyOfOrg } from '../../mock/companies'
import { EU_CODES } from '../../mock/rules'
import { parsePortalPayload } from '../portalDocs'
import { normalizeInvoiceNum, normalizeTaxId } from '../businessKey'
import { lookupReceipt } from './oracleReceipts'
import { matchLines, pairedLines, type MatchInvoiceLine } from '../../lib/approxLineMatch'
import {
  COUNTED_STATUSES,
  UNKNOWN_COMPANY,
  evaluateConfirm,
  normalizeReceiptInput,
  preVatAmount,
  receiptInScope,
  round2,
  type Actor,
  type ConfirmEvaluation,
  type LinkDocFacts,
  type LinkInput,
  type OracleReceipt,
  type ReceiptLookup,
  type UsageRow,
} from '../../lib/receiptLink'
import type { PortalInvoiceDocument } from '../../features/engine/types/portalDomain'

const RECOMMENDATION_TO_STATUS: Record<string, string> = {
  AUTO_PASS: 'Auto-pass',
  REVIEW: 'Review',
  HOLD: 'Hold',
  MANUAL_REVIEW: 'Manual Review',
  SYSTEM_ERROR: 'Manual Review',
}
export const engineStatusOf = (recommendation: string | null | undefined) =>
  RECOMMENDATION_TO_STATUS[String(recommendation ?? '').toUpperCase()] ?? 'Manual Review'

export type DocRow = NonNullable<Awaited<ReturnType<typeof prisma.document.findUnique>>>

export class LinkError extends Error {
  constructor(public status: number, public code: string, message: string, public extra: Record<string, unknown> = {}) {
    super(message)
  }
}

export function versionOf(row: Pick<DocRow, 'updatedAt'>): string {
  return row.updatedAt.toISOString()
}

export function readPayload(row: Pick<DocRow, 'id' | 'payloadJson'>): PortalInvoiceDocument {
  const p = parsePortalPayload(row)
  if (p) return p
  // Rows written by tests / older tools may carry a partial payload — keep what is there.
  try {
    const raw = JSON.parse(row.payloadJson || '{}')
    return { ...raw, id: row.id } as PortalInvoiceDocument
  } catch {
    return { id: row.id } as PortalInvoiceDocument
  }
}

/** Facts for the rule set, from the row (columns are the index) and its payload. */
export function factsOf(row: DocRow, p: PortalInvoiceDocument): LinkDocFacts {
  const rules = Array.isArray(p.rules) ? p.rules : []
  const codes = rules
    .filter(r => r.exceptionCode)
    .map(r => ({ code: String(r.exceptionCode), severity: r.severity ?? null }))
  const engineRcv = Array.isArray(p.receiptNums) && p.receiptNums[0] ? p.receiptNums[0] : null
  return {
    id: row.id,
    status: row.status,
    identityStatus: row.identityStatus,
    companyCode: row.companyCode || UNKNOWN_COMPANY,
    supplierTaxId: row.supplierTaxId || '',
    supplierName: row.supplierName || '',
    invoiceNum: row.invoiceNum || '',
    grandTotal: Number.isFinite(row.grandTotal) ? row.grandTotal : null,
    subtotal: typeof p.subtotal === 'number' ? p.subtotal : null,
    vat: typeof p.vat === 'number' ? p.vat : null,
    codes,
    euPending: !!p.receiverName && codes.some(c => EU_CODES.has(c.code)),
    engineReceiptNum: row.receiptManual ? null : engineRcv,
  }
}

/** The engine's receipt, rebuilt from the snapshot it stored (no Oracle call). */
export function engineReceiptOf(p: PortalInvoiceDocument): OracleReceipt | null {
  const num = Array.isArray(p.receiptNums) ? p.receiptNums[0] : null
  if (!num) return null
  const lines = (p.oracleReceiptLines ?? []).filter(l => normalizeReceiptInput(l.receiptNum) === normalizeReceiptInput(num))
  const orgId = typeof p.orgId === 'number' ? p.orgId : null
  return {
    receiptNum: num,
    orgId,
    companyCode: orgId != null ? companyOfOrg(orgId) : p.companyCode || UNKNOWN_COMPANY,
    ouName: p.ouName ?? null,
    supplierName: p.supplierName ?? null,
    supplierTaxId: p.supplierTaxId ?? null,
    receiver: p.receiverName ?? lines[0]?.receiver ?? null,
    poNumbers: [...new Set(lines.map(l => l.poNumber).filter(Boolean))],
    lines: lines.map(l => ({
      rcvLineId: l.rcvLineId,
      lineNo: l.lineNo,
      poNumber: l.poNumber,
      itemCode: l.itemCode ?? null,
      itemDesc: l.itemDesc,
      qty: l.qty,
      uom: l.uom,
      unitPrice: l.unitPrice,
      lineAmount: l.lineAmount,
    })),
    total: typeof p.receiptTotal === 'number' ? p.receiptTotal : round2(lines.reduce((s, l) => s + l.lineAmount, 0)),
  }
}

export function invoiceLinesOf(p: PortalInvoiceDocument): MatchInvoiceLine[] {
  return (p.lineItems ?? []).map(l => ({
    no: l.no,
    desc: l.desc,
    qty: l.qty ?? 0,
    price: l.price ?? 0,
    amount: l.amount ?? 0,
    itemCode: l.itemCode ?? null,
    poLine: l.poLine ?? null,
    rcvLineId: l.rcvLineId ?? null,
    pageNo: l.pageNo ?? null,
    elementId: l.elementId ?? null,
  }))
}

/** Resolve the receipt the screen is about: typed (Oracle) or the engine's (snapshot). */
export async function resolveLookup(
  facts: LinkDocFacts,
  p: PortalInvoiceDocument,
  typed: string | null | undefined,
  actor: Actor,
): Promise<{ lookup: ReceiptLookup; useEngine: boolean }> {
  const t = normalizeReceiptInput(typed ?? null)
  const engineNum = normalizeReceiptInput(facts.engineReceiptNum)
  if (!t || t === engineNum) {
    const er = engineNum ? engineReceiptOf(p) : null
    if (er) return { lookup: { state: 'found', receipt: er, source: 'engine' }, useEngine: true }
    if (!t) return { lookup: { state: 'none' }, useEngine: false }
  }
  const r = await lookupReceipt(t!)
  if (!r.ok) {
    if (r.code === 'BAD_RECEIPT') return { lookup: { state: 'not_found', receiptNum: t! }, useEngine: false }
    return { lookup: { state: 'unavailable', error: r.error }, useEngine: false }
  }
  if (!r.receipt) return { lookup: { state: 'not_found', receiptNum: t! }, useEngine: false }
  if (!receiptInScope(r.receipt.companyCode, actor)) {
    return { lookup: { state: 'out_of_scope', receiptNum: t!, companyCode: r.receipt.companyCode }, useEngine: false }
  }
  return { lookup: { state: 'found', receipt: r.receipt, source: 'oracle' }, useEngine: false }
}

function usageOf(row: Pick<DocRow, 'id' | 'invoiceNum' | 'supplierTaxId' | 'status' | 'grandTotal' | 'payloadJson'>): UsageRow {
  let sub: number | null = null
  let vat: number | null = null
  try {
    const p = JSON.parse(row.payloadJson || '{}')
    sub = typeof p.subtotal === 'number' ? p.subtotal : null
    vat = typeof p.vat === 'number' ? p.vat : null
  } catch {
    /* columns only */
  }
  return {
    docId: row.id,
    invoiceNum: row.invoiceNum,
    supplierTaxId: row.supplierTaxId,
    status: row.status,
    amount: preVatAmount({ subtotal: sub, vat, grandTotal: row.grandTotal }, row.grandTotal) ?? 0,
  }
}

const USAGE_SELECT = { id: true, invoiceNum: true, supplierTaxId: true, status: true, grandTotal: true, payloadJson: true, receiptNum: true, receiveId: true } as const

/** Documents (in AP flow) with this invoice number — supplier compared by the rules. */
export async function sameInvoiceCandidates(invoiceNum: string): Promise<UsageRow[]> {
  const n = normalizeInvoiceNum(invoiceNum)
  if (!n) return []
  // invoiceNum is stored as OCR read it; compare normalised in memory on the AP-flow subset.
  const rows = await prisma.document.findMany({ where: { status: { in: [...COUNTED_STATUSES] } }, select: USAGE_SELECT })
  return rows.filter(r => normalizeInvoiceNum(r.invoiceNum) === n).map(usageOf)
}

/** Documents linked to this receipt (engine key or person-linked column). */
export async function documentsOnReceipt(receiptNum: string | null): Promise<UsageRow[]> {
  const n = normalizeReceiptInput(receiptNum)
  if (!n) return []
  const rows = await prisma.document.findMany({
    where: { OR: [{ receiveId: n }, { receiptNum: n }, { receiptNum: receiptNum ?? n }] },
    select: USAGE_SELECT,
  })
  return rows.map(usageOf)
}

export interface Evaluated {
  row: DocRow
  payload: PortalInvoiceDocument
  facts: LinkDocFacts
  lookup: ReceiptLookup
  evaluation: ConfirmEvaluation
  pairs: ReturnType<typeof matchLines>
}

export async function evaluateFor(row: DocRow, actor: Actor, input: LinkInput): Promise<Evaluated> {
  const payload = readPayload(row)
  const facts = factsOf(row, payload)
  // Values saved earlier ("บันทึก") count as typed twice, unless the form sends new ones.
  const saved = Array.isArray(payload.manualValues) ? payload.manualValues : []
  const m = { ...(input.manual ?? {}) }
  const sInv = saved.find(x => x.field === 'invoiceNum')
  const sTot = saved.find(x => x.field === 'grandTotal')
  if (sInv && !String(m.invoiceNum ?? '').trim()) m.invoiceNum = m.invoiceNumConfirm = String(sInv.value)
  if (sTot && !String(m.grandTotal ?? '').trim()) m.grandTotal = m.grandTotalConfirm = String(sTot.value)
  input = { ...input, manual: m }
  const typed = input.receiptNum ?? (row.receiptManual ? row.receiptNum : null)
  const { lookup, useEngine } = await resolveLookup(facts, payload, typed, actor)
  const inv = invoiceLinesOf(payload)
  const receipt = lookup.state === 'found' ? lookup.receipt : null
  const pairs = receipt ? matchLines(inv, receipt.lines, useEngine) : []
  const effInvoice = String(input.manual?.invoiceNum ?? '').trim() || facts.invoiceNum
  const [sameInv, onRcv] = await Promise.all([
    sameInvoiceCandidates(effInvoice),
    documentsOnReceipt(receipt?.receiptNum ?? null),
  ])
  const evaluation = evaluateConfirm({
    doc: facts,
    actor,
    input: { ...input, receiptNum: typed },
    lookup,
    sameInvoiceCandidates: sameInv,
    onReceipt: onRcv,
    pairs: receipt ? pairedLines(inv, receipt.lines, pairs) : [],
  })
  return { row, payload, facts, lookup, evaluation, pairs }
}

export async function loadRowOr404(id: string): Promise<DocRow> {
  const row = await prisma.document.findUnique({ where: { id } })
  if (!row) throw new LinkError(404, 'NOT_FOUND', `ไม่พบเอกสาร ${id}`)
  return row
}

export function assertVersion(row: DocRow, version: string | undefined) {
  if (!version || version !== versionOf(row)) {
    throw new LinkError(409, 'STALE', 'เอกสารถูกแก้ไขหลังจากเปิดหน้านี้ · โหลดหน้าใหม่ก่อนทำรายการ', { version: versionOf(row) })
  }
}

/** Duplicate check for the quick Confirm (Auto-pass) in /actions — same rule as the link screen. */
export async function duplicateInApFor(row: Pick<DocRow, 'id' | 'invoiceNum' | 'supplierTaxId'>): Promise<string | null> {
  const tax = normalizeTaxId(row.supplierTaxId)
  if (!tax) return null
  const same = (await sameInvoiceCandidates(row.invoiceNum)).filter(o => o.docId !== row.id && normalizeTaxId(o.supplierTaxId) === tax)
  return same[0]?.docId ?? null
}
