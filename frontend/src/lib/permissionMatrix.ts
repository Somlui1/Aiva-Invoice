/**
 * v5.13 — Matrix สิทธิ์ "ตามจริง": ทุกแถวคือสิ่งที่ UI และ/หรือ server ตรวจจริง พร้อมที่อยู่ของปุ่มและเงื่อนไข
 * ✓ / — ของแต่ละบทบาทอ่านจาก ROLES (src/mock/users.ts) ตารางเดียวกับที่ server ใช้ (guards.hasPermission,
 * docTransitions.roleCan) → หน้า Matrix กับสิ่งที่กดได้จริงไม่มีทางไม่ตรงกัน (ตรวจใน v513Permissions.test.ts)
 */
import type { Permission } from '../types/auth'

export interface MatrixRow {
  perm: Permission
  /** ปุ่ม / หน้า ที่ผู้ใช้เห็น */
  where: string
  /** เงื่อนไขเพิ่มเติมนอกจากสิทธิ์ (สถานะเอกสาร, ขอบเขต) */
  rule?: string
}

export interface MatrixGroup {
  title: string
  rows: MatrixRow[]
}

export const PERMISSION_MATRIX: readonly MatrixGroup[] = [
  {
    title: 'ดูเอกสาร',
    rows: [
      { perm: 'VIEW_OWN', where: 'คิว "งานของฉัน"', rule: 'เฉพาะเอกสารที่ Receiver = Oracle account ที่ผูกไว้' },
      { perm: 'VIEW_CO', where: 'คิวตรวจสอบ · เอกสารที่ปิดแล้ว', rule: 'เฉพาะบริษัทที่ได้รับมอบหมาย (รวม "?" ถ้ามอบหมาย) · SA เห็นทุกบริษัท' },
      { perm: 'DMS', where: 'ปุ่มเปิด PDF / หลักฐานในรายละเอียดเอกสาร' },
    ],
  },
  {
    title: 'คิวตรวจสอบ',
    rows: [
      { perm: 'UPLOAD_NEW', where: 'ปุ่ม "อัปโหลดฉบับใหม่"', rule: 'ยกเว้นสถานะ Superseded / Duplicate / Confirmed / Sent / Posted' },
      { perm: 'BIND_RECEIPT', where: 'ปุ่ม "ผูกใบรับ"', rule: 'เอกสารที่ยังไม่มีใบรับ สถานะ Auto-pass / Review / Hold / Manual Review' },
      { perm: 'CONFIRM', where: 'ปุ่ม Confirm', rule: 'ต้องมีใบรับ · receive_id ยังไม่มีผู้ถือ · Hold ต้องระบุเหตุผล' },
      { perm: 'REVIEW', where: 'ปุ่ม Review', rule: 'Auto-pass / Hold' },
      { perm: 'HOLD', where: 'ปุ่ม Hold', rule: 'Auto-pass / Review' },
      { perm: 'REJECT', where: 'ปุ่ม Reject', rule: 'ทุกสถานะที่ยังเปิด (Duplicate: Reject อย่างเดียว)' },
      { perm: 'MANUAL_REVIEW', where: 'Confirm / Reject บนเอกสาร Manual Review และ UNRESOLVED', rule: 'ไม่มีรหัส High' },
    ],
  },
  {
    title: 'ส่งจ่าย (AP)',
    rows: [
      { perm: 'VIEW_AP', where: 'เมนู "ส่งเข้า AP Interface"' },
      { perm: 'UNCONFIRM', where: 'ปุ่มแดง "ยกเลิก Confirm" แท็บรอส่ง', rule: 'เฉพาะ Confirmed (ยังไม่ส่ง) → กลับเป็น Review · ต้องระบุเหตุผล' },
      { perm: 'POST', where: 'ปุ่ม "ส่งเข้า AP Interface (Batch)" แท็บรอส่ง', rule: 'วงเงิน ≤ 1,000,000 ต่อ Batch · ผู้ส่งต้องไม่ใช่ผู้ Confirm' },
      { perm: 'RETURN_FAILED', where: 'ส่งคืนเอกสาร Import ไม่ผ่าน', rule: 'Import Failed → Review' },
    ],
  },
  {
    title: 'การกำกับดูแล',
    rows: [
      { perm: 'MAP', where: 'สิทธิ์และการเชื่อมบัญชี (ผู้ใช้ · Sync บริษัท)', rule: 'นำเข้าบริษัทจากไฟล์ JSON: SA เท่านั้น' },
      { perm: 'AUDIT', where: 'เมนู "บันทึกการเข้าถึง"', rule: 'APR เห็นเฉพาะบริษัทตัวเอง · ADM/SA เห็นทั้งหมด' },
    ],
  },
]

export const MATRIX_PERMISSIONS: readonly Permission[] = PERMISSION_MATRIX.flatMap(g => g.rows.map(r => r.perm))
