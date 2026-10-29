import { Role, RoleKey, User, AccountMapping } from '../types/auth'

export const ROLES: Record<RoleKey, Role> = {
  EU: {
    n: 'ผู้ใช้งาน (Receiver)',
    c: 'var(--t-org)',
    bg: 'var(--t-org-bg)',
    p: ['VIEW_OWN', 'DMS', 'UPLOAD_NEW', 'BIND_RECEIPT'],
    scope: 'receiver'
  },
  ACC: {
    n: 'เจ้าหน้าที่บัญชี',
    c: 'var(--t-ok)',
    bg: 'var(--t-ok-bg)',
    // v5.13: + UNCONFIRM (ยกเลิก Confirm ที่หน้า AP แท็บรอส่ง) · + BIND_RECEIPT (เดิมไม่มีชื่อสิทธิ์ แต่ทำได้อยู่แล้ว)
    p: ['VIEW_CO', 'DMS', 'CONFIRM', 'REVIEW', 'HOLD', 'REJECT', 'BIND_RECEIPT', 'UNCONFIRM', 'VIEW_AP'],
    scope: 'company'
  },
  APR: {
    n: 'หัวหน้าฝ่ายบัญชี',
    c: 'var(--t-blue)',
    bg: 'var(--t-blue-bg)',
    p: [
      'VIEW_CO',
      'DMS',
      'CONFIRM',
      'REVIEW',
      'HOLD',
      'REJECT',
      'BIND_RECEIPT',
      'VIEW_AP',
      'MANUAL_REVIEW',
      'UNCONFIRM',
      'POST',
      'RETURN_FAILED',
      'AUDIT'
    ],
    scope: 'company',
    postMax: 1000000
  },
  ADM: {
    n: 'ผู้ดูแลระบบ (IT)',
    c: 'var(--t-adm)',
    bg: 'var(--t-adm-bg)',
    p: ['MAP', 'AUDIT'],
    scope: 'none'
  },
  SA: {
    n: 'ผู้ดูแลระบบระดับสูง (Super Admin)',
    c: 'var(--t-teal)',
    bg: 'var(--t-teal-bg)',
    p: [
      'VIEW_CO',
      'VIEW_OWN',
      'DMS',
      'UPLOAD_NEW',
      'CONFIRM',
      'REVIEW',
      'HOLD',
      'REJECT',
      'BIND_RECEIPT',
      'MANUAL_REVIEW',
      'UNCONFIRM',
      'POST',
      'RETURN_FAILED',
      'VIEW_AP',
      'MAP',
      'AUDIT'
    ],
    scope: 'all'
  }
}

/**
 * v5.13: one line per permission that something really checks (UI and/or server).
 * DUP_OVERRIDE was listed before but nothing ever checked it — removed from every role.
 * The Matrix page (RbacPage) groups these with src/lib/permissionMatrix.ts.
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  VIEW_OWN: 'ดูเอกสารที่ตนเป็น Receiver',
  VIEW_CO: 'ดูเอกสารทั้งบริษัทที่ได้รับมอบหมาย',
  DMS: 'เปิดเอกสาร / หลักฐานจาก DMS',
  UPLOAD_NEW: 'อัปโหลดเอกสารฉบับใหม่',
  BIND_RECEIPT: 'ผูกใบรับ (Receive ID)',
  CONFIRM: 'Confirm',
  REVIEW: 'ย้ายเป็น Review',
  HOLD: 'Hold',
  REJECT: 'Reject',
  MANUAL_REVIEW: 'ตัดสิน Manual Review / เอกสาร UNRESOLVED',
  UNCONFIRM: 'ยกเลิก Confirm (กลับไป Review)',
  POST: 'ส่งเข้า AP Interface (Batch)',
  RETURN_FAILED: 'ส่งคืน Import ไม่ผ่าน (กลับไป Review)',
  VIEW_AP: 'ดูหน้าส่งเข้า AP Interface',
  MAP: 'จัดการผู้ใช้ สิทธิ์ และข้อมูลบริษัท',
  AUDIT: 'ดูบันทึกการเข้าถึง'
}

export const USERS: User[] = [
  { id: 'wajeepradit.p', n: 'Wajeepradit Prompan (AH)', email: 'wajeepradit.p@aapico.com', role: 'SA', rcvName: '—', emp: null, co: ['AH', 'AHA', 'AHT', 'AHP', 'AM'], unit: 'IT Support' },
  { id: 'itsupport', n: 'IT Support (AH)', email: 'itsupport@aapico.com', role: 'SA', rcvName: '—', emp: null, co: ['AH', 'AHA', 'AHT', 'AHP', 'AM'], unit: 'IT Support' }
]

export const INITIAL_MAPS: AccountMapping[] = []

export function acctsOf(u: User, maps: AccountMapping[] = INITIAL_MAPS): string[] {
  const list = maps.filter(m => m.user === u.id).map(m => m.acct)
  for (const a of u.accts ?? []) if (a && !list.includes(a)) list.push(a)
  if (u.rcvName && u.rcvName !== '—' && !list.includes(u.rcvName)) {
    list.push(u.rcvName)
  }
  return list
}

export function isAccountBound(acct: string | undefined, maps: AccountMapping[] = INITIAL_MAPS, users: User[] = USERS): boolean {
  if (!acct) return true
  return maps.some(m => m.acct === acct && users.find(x => x.id === m.user)?.role === 'EU')
}

export const bound = isAccountBound
