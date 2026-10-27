/**
 * v5.11 Phase 1 — link the comparison table to the PDF (invoice line ↔ receipt line).
 *
 *  - Lines the ENGINE already paired (rcvLineId on the invoice line, same receipt) use the engine's
 *    pairing — never second-guessed.
 *  - A receipt typed by a person has no engine pairing: the portal pairs APPROXIMATELY, in order:
 *      1. item code (or PO line) equal on both sides
 *      2. invoice qty × unit price = receipt line amount (± 0.01)
 *      3. invoice line amount = receipt line amount, the amount being unique on BOTH sides
 *      4. otherwise: no pairing (never guess)
 *    One-to-one; a step that finds more than one candidate pairs nothing for that line.
 *  - Approximate pairs carry `approx: true` ("ประมาณ" badge). They are used to NAVIGATE (scroll /
 *    highlight) and to show differences — never to decide anything on their own.
 *
 * Pure: no React, no DOM.
 */
import { MONEY_TOL, round2, type PairedLine, type ReceiptLine } from './receiptLink'

export interface MatchInvoiceLine {
  no: number
  desc?: string
  qty: number
  price: number
  amount: number
  itemCode?: string | null
  poLine?: number | null
  /** Engine pairing (receipt line id), when the engine matched this line. */
  rcvLineId?: string | null
  pageNo?: number | null
  elementId?: string | null
}

export type MatchMethod = 'engine' | 'item_code' | 'po_line' | 'qty_price' | 'amount'

export interface LinePair {
  invNo: number
  rcvLineId: string
  method: MatchMethod
  approx: boolean
}

const near = (a: number, b: number) => Math.abs(a - b) <= MONEY_TOL + 1e-9
const norm = (s?: string | null) => (s ?? '').normalize('NFKC').replace(/\s+/g, '').toUpperCase()

/**
 * @param useEngine true when the receipt on screen is the engine's receipt (its pairs are valid).
 */
export function matchLines(inv: MatchInvoiceLine[], rcv: ReceiptLine[], useEngine: boolean): LinePair[] {
  const pairs: LinePair[] = []
  const usedInv = new Set<number>()
  const usedRcv = new Set<string>()
  const rcvIds = new Set(rcv.map(r => r.rcvLineId))

  const take = (i: MatchInvoiceLine, r: ReceiptLine, method: MatchMethod) => {
    pairs.push({ invNo: i.no, rcvLineId: r.rcvLineId, method, approx: method !== 'engine' })
    usedInv.add(i.no)
    usedRcv.add(r.rcvLineId)
  }

  // 0. engine pairs
  if (useEngine) {
    for (const i of inv) {
      if (i.rcvLineId && rcvIds.has(i.rcvLineId) && !usedRcv.has(i.rcvLineId) && !usedInv.has(i.no)) {
        take(i, rcv.find(r => r.rcvLineId === i.rcvLineId)!, 'engine')
      }
    }
  }

  // One step = a key on both sides; pair only when the key is unique among the still-open lines.
  const step = (
    method: MatchMethod,
    keyInv: (i: MatchInvoiceLine) => string | null,
    eq: (k: string, r: ReceiptLine) => boolean,
  ) => {
    const openInv = inv.filter(i => !usedInv.has(i.no))
    const openRcv = () => rcv.filter(r => !usedRcv.has(r.rcvLineId))
    for (const i of openInv) {
      const k = keyInv(i)
      if (!k) continue
      // the same key on another open invoice line → ambiguous
      if (openInv.some(o => o.no !== i.no && !usedInv.has(o.no) && keyInv(o) === k)) continue
      const cands = openRcv().filter(r => eq(k, r))
      if (cands.length === 1) take(i, cands[0], method)
    }
  }

  // 1. item code / PO line
  step('item_code', i => (norm(i.itemCode) ? norm(i.itemCode) : null), (k, r) => !!r.itemCode && norm(r.itemCode) === k)
  step('po_line', i => (i.poLine != null && i.poLine > 0 ? String(i.poLine) : null), (k, r) => String(r.lineNo) === k)
  // 2. qty × price = receipt line amount
  step(
    'qty_price',
    i => (i.qty > 0 && i.price > 0 ? round2(i.qty * i.price).toFixed(2) : null),
    (k, r) => near(Number(k), r.lineAmount),
  )
  // 3. line amount unique on both sides
  step(
    'amount',
    i => {
      if (!(i.amount > 0)) return null
      const dupInv = inv.filter(o => near(o.amount, i.amount)).length > 1
      const dupRcv = rcv.filter(r => near(r.lineAmount, i.amount)).length > 1
      return dupInv || dupRcv ? null : i.amount.toFixed(2)
    },
    (k, r) => near(Number(k), r.lineAmount),
  )

  return pairs.sort((a, b) => a.invNo - b.invNo)
}

/** Pairs → the shape receiptLink.lineDiffsOf reads. */
export function pairedLines(inv: MatchInvoiceLine[], rcv: ReceiptLine[], pairs: LinePair[]): PairedLine[] {
  const out: PairedLine[] = []
  for (const p of pairs) {
    const i = inv.find(x => x.no === p.invNo)
    const r = rcv.find(x => x.rcvLineId === p.rcvLineId)
    if (i && r) out.push({ inv: { no: i.no, qty: i.qty, price: i.price, amount: i.amount }, rcv: r })
  }
  return out
}

/** Why a row cannot scroll the PDF (tooltip) — '' when it can. */
export function rowLocateWhy(line: Pick<MatchInvoiceLine, 'elementId' | 'pageNo'>, hasBox: boolean): string {
  if (!line.elementId) return 'บรรทัดนี้ไม่มี element_id จาก OCR · ไม่มีตำแหน่งบนเอกสาร'
  if (!hasBox) return 'OCR ไม่ได้ส่งกรอบของบรรทัดนี้ · ไม่มีตำแหน่งบนเอกสาร'
  if (!line.pageNo) return 'ไม่ทราบหน้า'
  return ''
}
