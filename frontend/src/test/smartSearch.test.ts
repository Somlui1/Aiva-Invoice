/**
 * v5.8 — dynamic search: anything the document carries, incl. status (EN/ไทย) and dates in any form.
 */
import { describe, expect, it } from 'vitest'
import { describeQuery, parseAmount, parseDateToken, parseQuery, smartMatch } from '../lib/smartSearch'
import { matchesSearchQuery } from '../lib/queueFilters'
import type { InvoiceDoc } from '../types/invoice'

const doc = {
  doc: 'DMS-107',
  inv: 'IV2026-09002',
  vendor: '3D DESIGN TOOL AND DIE',
  stax: '0145566001938',
  oname: 'บริษัท อาปิโก ไฮเทค อยุธยา',
  company: 'AHT',
  po: '42052569',
  rcv: '50220043380',
  receiver: 'AHT Die Making 03, K.Vinitda Jitpilai',
  receiverActive: true,
  status: 'Review',
  dt: '2026-09-23',
  up: '2026-10-26',
  created: '2026-10-26',
  total: 190995,
  sub: 178500,
  codes: ['E11'],
  rules: [{ rule: 'V-07', exception_code: 'E11' }],
  assigned: 'acc',
  pages: 6,
  history: [],
} as unknown as InvoiceDoc

const yes = (q: string) => expect(smartMatch(doc, q), q).toBe(true)
const no = (q: string) => expect(smartMatch(doc, q), q).toBe(false)

describe('smart search', () => {
  it('ids, parties, numbers — partial and separator-insensitive', () => {
    ;['IV2026-09002', 'iv202609002', '09002', 'dms-107', '3d design', 'tool die', '0145566001938', '42052569', '5022004', 'vinitda', 'อาปิโก', 'aht'].forEach(yes)
    no('konecranes')
  })

  it('status in English and Thai, codes and rules', () => {
    ;['review', 'รอตรวจ', 'E11', 'e1', 'V-07', 'v07', 'ฝ่ายบัญชี'].forEach(yes)
    ;['hold', 'status:hold', 'ซ้ำ', 'E99'].forEach(no)
    yes('status:review')
  })

  it('dates in any format, ค.ศ. or พ.ศ., and month names', () => {
    ;['2026-09-23', '23/09/2026', '23/9/2026', '23-09-2026', '23.09.26', '23/09/69', '23/09/2569', '2569-09-23', '2026-10', '10/2026', 'ต.ค. 2026', 'ตุลาคม 2569', '26 ต.ค. 2569', 'oct 2026', 'ก.ย.'].forEach(yes)
    ;['2026-11', '01/01/2026', 'ม.ค. 2026'].forEach(no)
  })

  it('amounts with or without separators, and comparisons', () => {
    ;['190995', '190,995', '190,995.00', 'amt:>100000', 'amt:190995', 'amt:100000..200000', 'amt:178,500'].forEach(yes)
    ;['amt:<100', 'amt:>500000'].forEach(no)
  })

  it('field filters, date ranges, phrases and exclusions', () => {
    ;['date:2026-10-01..2026-10-31', 'inv-date:2026-09', 'created:26/10/2026', 'updated:2026-10', 'co:aht', 'vendor:design', 'po:4205', '"tool and die"', '-hold', 'review -auto-pass'].forEach(yes)
    ;['inv-date:2026-10', '-review', 'co:ah', '"die tool and"'].forEach(no)
  })

  it('every word must match (AND)', () => {
    yes('review E11 2026-09')
    no('review E12')
  })

  it('never throws on odd input; empty = everything', () => {
    ;['', '   ', '"', 'date:', 'amt:abc', 'status:', '((()))', 'x'.repeat(5000), 'date:2026-13-45', '10:30'].forEach(q => {
      expect(() => smartMatch(doc, q)).not.toThrow()
    })
    yes('')
    yes('   ')
  })

  it('queueFilters.matchesSearchQuery uses the same engine (browser + API agree)', () => {
    expect(matchesSearchQuery(doc, 'รอตรวจ 23/09/2569')).toBe(true)
  })

  it('parsers', () => {
    expect(parseDateToken('26/10/69')).toBe('2026-10-26')
    expect(parseDateToken('31/02/2026')).toBeNull()
    expect(parseDateToken('ธ.ค. 2569')).toBe('2026-12')
    expect(parseAmount('฿1,234.50')).toBe(1234.5)
    expect(parseAmount('12a')).toBeNull()
    expect(parseQuery('26 ต.ค. 2569 hold')).toEqual([
      { field: 'date', value: '26 ต.ค. 2569', negate: false },
      { field: 'any', value: 'hold', negate: false },
    ])
    expect(describeQuery('status:hold 26/10/2026')).toEqual(['สถานะ: hold', 'วันที่ 2026-10-26'])
  })
})
