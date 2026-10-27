/**
 * v5.11 — table ↔ PDF link: engine pairs first, then the portal's approximate pairing
 * (item code / PO line → qty × price → unique amount → no guess), one-to-one.
 */
import { describe, expect, it } from 'vitest'
import { matchLines, pairedLines, rowLocateWhy, type MatchInvoiceLine } from '../lib/approxLineMatch'
import type { ReceiptLine } from '../lib/receiptLink'

const r = (id: number, over: Partial<ReceiptLine> = {}): ReceiptLine => ({
  rcvLineId: `R-${id}`,
  lineNo: id,
  poNumber: 'PO1',
  itemCode: null,
  itemDesc: `rcv ${id}`,
  qty: 1,
  uom: 'PCS',
  unitPrice: 100,
  lineAmount: 100,
  ...over,
})
const i = (no: number, over: Partial<MatchInvoiceLine> = {}): MatchInvoiceLine => ({ no, qty: 1, price: 100, amount: 100, ...over })

describe('matchLines', () => {
  it('engine pairs are used as they are (only when the receipt is the engine one)', () => {
    const inv = [i(1, { rcvLineId: 'R-2', amount: 5 }), i(2, { rcvLineId: 'R-1', amount: 6 })]
    const rcv = [r(1), r(2)]
    expect(matchLines(inv, rcv, true)).toEqual([
      { invNo: 1, rcvLineId: 'R-2', method: 'engine', approx: false },
      { invNo: 2, rcvLineId: 'R-1', method: 'engine', approx: false },
    ])
    // a typed receipt ignores engine ids
    expect(matchLines(inv, rcv, false).every(p => p.method !== 'engine')).toBe(true)
  })

  it('item code first, then qty × price, then a unique amount', () => {
    const inv = [
      i(1, { itemCode: 'abc 1', qty: 9, price: 9, amount: 81 }),
      i(2, { qty: 2, price: 50, amount: 999 }), // qty×price = 100
      i(3, { qty: 0, price: 0, amount: 777 }),
    ]
    const rcv = [r(1, { itemCode: 'ABC1', lineAmount: 1 }), r(2, { lineAmount: 100 }), r(3, { lineAmount: 777 })]
    const p = matchLines(inv, rcv, false)
    expect(p.map(x => [x.invNo, x.rcvLineId, x.method, x.approx])).toEqual([
      [1, 'R-1', 'item_code', true],
      [2, 'R-2', 'qty_price', true],
      [3, 'R-3', 'amount', true],
    ])
  })

  it('ambiguous → no pairing (never guess); one-to-one', () => {
    const inv = [i(1), i(2)]
    const rcv = [r(1), r(2)] // every amount is 100 on both sides
    expect(matchLines(inv, rcv, false)).toEqual([])
    const one = matchLines([i(1)], [r(1), r(2)], false)
    expect(one).toEqual([])
  })

  it('± 0.01 tolerance on qty × price', () => {
    const p = matchLines([i(1, { qty: 3, price: 33.333, amount: 0 })], [r(1, { lineAmount: 100 })], false)
    expect(p[0]?.method).toBe('qty_price')
  })

  it('pairedLines feeds the rule set', () => {
    const inv = [i(1, { itemCode: 'X' })]
    const rcv = [r(1, { itemCode: 'X', qty: 2 })]
    const pl = pairedLines(inv, rcv, matchLines(inv, rcv, false))
    expect(pl).toHaveLength(1)
    expect(pl[0].rcv.qty).toBe(2)
  })
})

describe('rowLocateWhy', () => {
  it('explains why a row cannot scroll the PDF', () => {
    expect(rowLocateWhy({ elementId: null, pageNo: 1 }, false)).toContain('element_id')
    expect(rowLocateWhy({ elementId: 'D1:D1-L1', pageNo: 1 }, false)).toContain('กรอบ')
    expect(rowLocateWhy({ elementId: 'D1:D1-L1', pageNo: 1 }, true)).toBe('')
  })
})
