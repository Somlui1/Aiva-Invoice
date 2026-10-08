import { ExceptionSeverity } from '../types/invoice'

export interface ExceptionDefinition {
  name: string
  owner: 'eu' | 'acc'
}

export const EXCEPTION_RULES: Record<string, ExceptionDefinition> = {
  E01: { name: 'Missing Field', owner: 'eu' },
  E02: { name: 'Arithmetic Inconsistency', owner: 'acc' },
  E03: { name: 'Total Mismatch', owner: 'acc' },
  E04: { name: 'Rounding', owner: 'acc' },
  E05: { name: 'Receipt Not Found', owner: 'eu' },
  E06: { name: 'Multiple Receipts', owner: 'eu' },
  E07: { name: 'Customer Mismatch', owner: 'acc' },
  E08: { name: 'Signature Missing', owner: 'eu' },
  E09: { name: 'Price Variance', owner: 'acc' },
  E10: { name: 'Line Arithmetic Inconsistency', owner: 'acc' },
  E11: { name: 'Duplicate Item', owner: 'acc' },
  E12: { name: 'UOM Mismatch', owner: 'acc' },
  E13: { name: 'GR Quantity Exceeded', owner: 'acc' },
  E14: { name: 'Tax Calculation Mismatch', owner: 'acc' },
  E15: { name: 'Currency Mismatch', owner: 'acc' }
}

export const SEVERITIES: Record<string, ExceptionSeverity> = {
  E01: 'Medium',
  E02: 'High',
  E03: 'High',
  E04: 'Low',
  E05: 'High',
  E06: 'High',
  E07: 'High',
  E08: 'High',
  E09: 'High',
  E10: 'Medium',
  E11: 'Medium',
  E12: 'Medium',
  E13: 'High',
  E14: 'High',
  E15: 'Medium'
}

export const RULE_MAPPING: Record<string, string> = {
  E01: 'V-01',
  E02: 'V-02',
  E03: 'V-03',
  E04: 'V-03',
  E05: 'V-04',
  E06: 'V-04',
  E07: 'V-05',
  E08: 'V-06',
  E09: 'V-07',
  E10: 'V-07',
  E11: 'V-07',
  E12: 'V-07',
  E13: 'V-07',
  E14: 'V-08',
  E15: 'V-08'
}

export const ACTION_REASONS: Record<string, string[]> = {
  confirm: ['ตรวจแล้วถูกต้อง', 'ผลต่างยอมรับได้', 'ตรวจต้นฉบับแล้ว', 'ยืนยันว่าไม่ใช่เอกสารซ้ำ'],
  review: ['ต้องตรวจเพิ่มเติม', 'รอข้อมูลประกอบ'],
  hold: ['รอเอกสารจากผู้ขาย', 'รอตรวจสอบราคา', 'รอยืนยันจากหน่วยงาน'],
  reject: ['เอกสารซ้ำจริง', 'ผู้ขายออกใบแจ้งหนี้ผิด', 'ไม่พบใบรับ', 'ข้อมูลไม่ครบ'],
  unconfirm: ['พบข้อมูลใหม่ก่อนส่ง', 'ยืนยันผิดฉบับ'],
  returnf: ['ต้องแก้ข้อมูลผู้ขายใน Oracle', 'ต้องตรวจเอกสารใหม่'],
  upload: [
    'ขอลายเซ็นผู้รับของแล้ว',
    'แก้ใบรับใน Oracle แล้ว (ยกเลิกแล้วทำรับใหม่)',
    'สแกนใหม่ครบทุกหน้า',
    'ผู้ขายส่งฉบับแก้ไข'
  ]
}

export const SEVERITY_OF_CODE = SEVERITIES


export const EXCEPTION_CATALOG: Record<string, [string, 'eu' | 'acc']> = {
  E01: ['Missing Field', 'eu'],
  E02: ['Arithmetic Inconsistency', 'acc'],
  E03: ['Total Mismatch', 'acc'],
  E04: ['Rounding', 'acc'],
  E05: ['Receipt Not Found', 'eu'],
  E06: ['Multiple Receipts', 'eu'],
  E07: ['Customer Mismatch', 'acc'],
  E08: ['Signature Missing', 'eu'],
  E09: ['Price Variance', 'acc'],
  E10: ['Line Arithmetic Inconsistency', 'eu'],
  E11: ['Duplicate Item', 'acc'],
  E12: ['UOM Mismatch', 'acc'],
  E13: ['GR Quantity Exceeded', 'acc'],
  E14: ['Tax Calculation Mismatch', 'eu'],
  E15: ['Currency Mismatch', 'eu']
}

export const EU_CODES = new Set(
  Object.keys(EXCEPTION_RULES).filter(k => EXCEPTION_RULES[k].owner === 'eu')
)

export const RULES = [
  'V-01 ฟิลด์บังคับ',
  'V-02 เลขคณิตรายบรรทัด',
  'V-03 ยอดรวมในใบแจ้งหนี้',
  'V-04 พบใบรับ',
  'V-05 ลูกค้าตรงกับตารางที่ 4',
  'V-06 ลายเซ็น',
  'V-07 จับคู่รายบรรทัดและราคา',
  'V-08 จำนวนเท่ากับใบรับ',
  'V-09 ยอดรวมเท่ากับใบรับ'
]

export type ActionType = 'confirm' | 'review' | 'hold' | 'reject' | 'unconfirm' | 'returnf' | 'upload'

export const ACTION_CONFIG: Record<
  ActionType,
  { title: string; btnText: string; btnClass: string; icon: string; tone: string; c: string; bg: string }
> = {
  confirm: { title: 'Confirm', btnText: 'Confirm', btnClass: 'btn-success', icon: 'check', tone: 'ok', c: '#047857', bg: '#ECFDF5' },
  review: { title: 'ย้ายเป็น Review', btnText: 'Review', btnClass: 'btn-primary', icon: 'clock', tone: 'warn', c: '#B45309', bg: '#FFFBEB' },
  hold: { title: 'Hold', btnText: 'Hold', btnClass: 'btn-warn', icon: 'pause', tone: 'warn', c: '#B91C1C', bg: '#FEF2F2' },
  reject: { title: 'Reject', btnText: 'Reject', btnClass: 'btn-danger', icon: 'ban', tone: 'err', c: '#B91C1C', bg: '#FEF2F2' },
  unconfirm: { title: 'Unconfirm', btnText: 'ย้ายกลับ Review', btnClass: 'btn-primary', icon: 'undo', tone: 'warn', c: '#1D4ED8', bg: '#EFF6FF' },
  returnf: { title: 'Return Import Failed', btnText: 'Return → Review', btnClass: 'btn-warn', icon: 'undo', tone: 'warn', c: '#B45309', bg: '#FFFBEB' },
  upload: { title: 'อัปโหลดเอกสารใหม่', btnText: 'อัปโหลด', btnClass: 'btn-teal', icon: 'dl', tone: 'info', c: '#00857F', bg: '#EEF8F8' }
}
