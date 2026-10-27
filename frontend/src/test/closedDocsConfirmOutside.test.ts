/**
 * v5.11 — "เอกสารที่ปิดแล้ว": filter "Confirm นอก Auto-pass", reason column, CSV columns.
 */
import { describe, expect, it } from 'vitest'
import { closedDocsCsv, confirmReasonOf, isConfirmOutsideAutoPass } from '../lib/closedDocs'
import { INITIAL_DOCS } from '../mock/initialDocs'
import type { InvoiceDoc, PortalConfirmMeta } from '../types/invoice'

const meta = (over: Partial<PortalConfirmMeta> = {}): PortalConfirmMeta => ({
  statusAtConfirm: 'Review',
  engineStatus: 'Review',
  outsideAutoPass: true,
  codes: ['E10'],
  reasonCode: 'OTHER',
  reasonText: 'ผู้ขายยืนยัน',
  note: 'ตรวจแล้ว',
  receiptManual: true,
  byId: 'u4',
  byName: 'ปณิดา',
  byRole: 'ACC',
  at: '2026-10-27T08:00:00.000Z',
  ...over,
})
const mk = (over: Partial<InvoiceDoc>): InvoiceDoc => ({ ...INITIAL_DOCS[0], history: [], ...over })

describe('Confirm outside Auto-pass', () => {
  it('flag + reason text', () => {
    const d = mk({ status: 'Confirmed', confirmMeta: meta() })
    expect(isConfirmOutsideAutoPass(d)).toBe(true)
    expect(confirmReasonOf(d)).toBe('อื่น ๆ: ผู้ขายยืนยัน · ตรวจแล้ว')
    expect(isConfirmOutsideAutoPass(mk({ status: 'Confirmed', confirmMeta: meta({ outsideAutoPass: false }) }))).toBe(false)
    expect(isConfirmOutsideAutoPass(mk({ status: 'Rejected', confirmMeta: meta() }))).toBe(false)
    expect(confirmReasonOf(mk({ status: 'Confirmed' }))).toBe('')
  })

  it('CSV carries the v5.11 columns', () => {
    const csv = closedDocsCsv([
      mk({ status: 'Posted', confirmMeta: meta(), manualValues: [{ field: 'grandTotal', value: 1070, ocrValue: null, byId: 'u', byName: 'u', at: '', reason: 'x' }] }),
    ])
    const [head, row] = csv.replace('\ufeff', '').split('\r\n')
    for (const h of ['Confirm นอก Auto-pass', 'สถานะจาก engine', 'รหัสข้อยกเว้นตอน Confirm', 'เหตุผล Confirm', 'ใบรับกรอกเอง', 'มีค่าที่คนกรอก', 'ผู้ Confirm']) {
      expect(head).toContain(`"${h}"`)
    }
    expect(row).toContain('"ใช่"')
    expect(row).toContain('"E10"')
    expect(row).toContain('"grandTotal=1070"')
  })
})
