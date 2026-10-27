/**
 * v5.9 — closed-documents helpers: groups, closure (who / when / why), CSV.
 */
import { describe, expect, it } from 'vitest'
import {
  CLOSED_VIEW_STATUSES,
  closedDateOf,
  closedDocsCsv,
  closureOf,
  csvCell,
  groupOf,
  groupsForRole,
  isClosedViewStatus,
  sortClosed,
} from '../lib/closedDocs'
import { docDateFor, inPerDoc } from '../lib/queueFilters'
import { INITIAL_DOCS } from '../mock/initialDocs'
import type { InvoiceDoc } from '../types/invoice'

const base = INITIAL_DOCS[0]
const mk = (over: Partial<InvoiceDoc>): InvoiceDoc => ({ ...base, ...over })
const engine = { dt: '2026-10-01', t: '08:00:00', who: 'System A', act: 'ตรวจเอกสารเสร็จสิ้น', d: 'ผลตรวจ Review' }

describe('groups', () => {
  it('six closed statuses in three groups; Import Failed is not closed', () => {
    expect([...CLOSED_VIEW_STATUSES]).toEqual(['Confirmed', 'Sent', 'Posted', 'Rejected', 'Superseded', 'Duplicate'])
    expect(groupOf('Sent')).toBe('ap')
    expect(groupOf('Rejected')).toBe('rejected')
    expect(groupOf('Duplicate')).toBe('dup')
    expect(isClosedViewStatus('Import Failed')).toBe(false)
    expect(isClosedViewStatus('Review')).toBe(false)
  })

  it('v5.10: EU gets "ผลการส่งเอกสาร" (ส่งจ่ายแล้ว / ถูกปฏิเสธ / ถูกแทนที่); duplicate group only for ACC / APR / SA', () => {
    expect(groupsForRole('EU')).toEqual(['ap', 'rejected', 'sup'])
    expect(groupsForRole('APR')).toEqual(['ap', 'rejected', 'dup'])
    expect(groupsForRole('ADM')).toEqual([])
  })
})

describe('closureOf', () => {
  it('Rejected: last matching history entry gives who / when / why', () => {
    const d = mk({
      status: 'Rejected',
      history: [engine, { dt: '2026-10-05', t: '10:12:00', who: 'สมชาย', act: 'Reject', d: 'สแกนผิดบริษัท' }, { dt: '2026-10-06', t: '09:00:00', who: 'x', act: 'เปิดดู' }],
    })
    const c = closureOf(d)
    expect(c).toMatchObject({ date: '2026-10-05', who: 'สมชาย', reason: 'สแกนผิดบริษัท', ref: 'สแกนผิดบริษัท' })
  })

  it('Superseded / Duplicate point to the other document and the rule', () => {
    const s = closureOf(mk({ status: 'Superseded', supersededBy: 'DMS-121', supRule: 'DR-01', history: [engine] }))
    expect(s.ref).toBe('แทนโดย DMS-121 · DR-01')
    expect(s.refDoc).toBe('DMS-121')
    const d = closureOf(mk({ status: 'Duplicate', duplicate_of: 'DMS-9', dupRule: 'DR-04', history: [] }))
    expect(d).toMatchObject({ ref: 'ซ้ำกับ DMS-9 · DR-04', refDoc: 'DMS-9' })
  })

  it('Posted shows batch / AP id; Confirmed prefers confirmedAt / confirmedBy', () => {
    expect(closureOf(mk({ status: 'Posted', batch: 'AP-2610-03', apId: '7781', history: [engine] })).ref).toBe('Batch AP-2610-03 · AP 7781')
    const c = closureOf(mk({ status: 'Confirmed', confirmedBy: 'ปณิดา', confirmedAt: '2026-10-04T09:00:00Z', history: [engine] }))
    expect(c).toMatchObject({ date: '2026-10-04', who: 'ปณิดา' })
  })

  it('never throws on missing history; falls back to `up`', () => {
    const d = mk({ status: 'Posted', history: undefined as any, up: '2026-10-03' })
    expect(closureOf(d).date).toBe('2026-10-03')
    expect(closedDateOf(mk({ status: 'Review' }))).toBe('')
  })
})

describe('date filter on the closing date + ordering', () => {
  const a = mk({ doc: 'DMS-A', status: 'Rejected', up: '2026-10-09', history: [{ ...engine, dt: '2026-10-02', act: 'Reject' }] })
  const b = mk({ doc: 'DMS-B', status: 'Posted', up: '2026-10-01', history: [{ ...engine, dt: '2026-10-08', act: 'Posted' }] })

  it('"วันที่ปิดงาน" uses the closure date, not the entry date', () => {
    expect(docDateFor(a, 'closed')).toBe('2026-10-02')
    expect(inPerDoc(a, { k: 'custom', from: '2026-10-05', field: 'closed' })).toBe(false)
    expect(inPerDoc(b, { k: 'custom', from: '2026-10-05', field: 'closed' })).toBe(true)
  })

  it('newest closing first', () => {
    expect(sortClosed([a, b]).map(d => d.doc)).toEqual(['DMS-B', 'DMS-A'])
  })
})

describe('CSV export', () => {
  it('BOM, header, quoted cells, formula injection neutralised', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('-5')).toBe(`"'-5"`)
    expect(csvCell(null)).toBe('""')
    const csv = closedDocsCsv([mk({ status: 'Rejected', vendor: 'A "B" Co', history: [{ ...engine, act: 'Reject', d: '@bad' }] })])
    expect(csv.startsWith('\ufeff"DMS",')).toBe(true)
    expect(csv).toContain('"A ""B"" Co"')
    expect(csv).toContain(`"'@bad"`)
    expect(csv.split('\r\n').length).toBe(3)
  })
})
