import { Role, RoleKey, User, AccountMapping } from '../types/auth'

export const ROLES: Record<RoleKey, Role> = {
  EU: {
    n: 'ผู้ใช้งาน (Receiver)',
    c: '#C2410C',
    bg: '#FFF1E3',
    p: ['VIEW_OWN', 'DMS', 'UPLOAD_NEW'],
    scope: 'receiver'
  },
  ACC: {
    n: 'เจ้าหน้าที่บัญชี',
    c: '#1E8A5F',
    bg: '#E3F4E8',
    p: ['VIEW_CO', 'DMS', 'CONFIRM', 'REVIEW', 'HOLD', 'REJECT', 'VIEW_AP'],
    scope: 'company'
  },
  APR: {
    n: 'หัวหน้าฝ่ายบัญชี',
    c: '#1E6FB2',
    bg: '#E8F1FB',
    p: [
      'VIEW_CO',
      'DMS',
      'CONFIRM',
      'REVIEW',
      'HOLD',
      'REJECT',
      'VIEW_AP',
      'MANUAL_REVIEW',
      'DUP_OVERRIDE',
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
    c: '#7A4A9E',
    bg: '#F2E9F8',
    p: ['MAP', 'AUDIT'],
    scope: 'none'
  },
  SA: {
    n: 'ผู้ดูแลระบบระดับสูง (Super Admin)',
    c: '#0D9488',
    bg: '#CCFBF1',
    p: [
      'VIEW_CO',
      'VIEW_OWN',
      'DMS',
      'UPLOAD_NEW',
      'CONFIRM',
      'REVIEW',
      'HOLD',
      'REJECT',
      'MANUAL_REVIEW',
      'DUP_OVERRIDE',
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

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  VIEW_OWN: 'ดูเอกสารที่ตนเป็น Receiver',
  VIEW_CO: 'ดูเอกสารทั้งบริษัทที่ได้รับมอบหมาย',
  DMS: 'เปิดเอกสารจาก DMS',
  UPLOAD_NEW: 'อัปโหลดเอกสารใหม่',
  CONFIRM: 'Confirm',
  REVIEW: 'ย้ายเป็น Review',
  HOLD: 'Hold',
  REJECT: 'Reject',
  MANUAL_REVIEW: 'ตัดสิน Manual Review',
  DUP_OVERRIDE: 'ยืนยันว่าไม่ซ้ำ (Duplicate)',
  UNCONFIRM: 'ยกเลิกการยืนยัน',
  POST: 'ส่งเข้า AP Interface (Batch)',
  RETURN_FAILED: 'Return Import Failed',
  VIEW_AP: 'ดูหน้าส่งเข้า AP Interface',
  MAP: 'จัดการการเชื่อมบัญชีและสิทธิ์',
  AUDIT: 'ดูบันทึกการเข้าถึง'
}

export const USERS: User[] = [
  { id: 'wajeepradit.p', n: 'Wajeepradit Prompan (AH)', email: 'wajeepradit.p@aapico.com', role: 'SA', rcvName: '—', emp: null, co: ['AH', 'AHA', 'AHT', 'AHP', 'AM'], unit: 'IT Support' },
  { id: 'itsupport', n: 'IT Support (AH)', email: 'itsupport@aapico.com', role: 'SA', rcvName: '—', emp: null, co: ['AH', 'AHA', 'AHT', 'AHP', 'AM'], unit: 'IT Support' }
]

export const INITIAL_MAPS: AccountMapping[] = []

export function acctsOf(u: User, maps: AccountMapping[] = INITIAL_MAPS): string[] {
  const list = maps.filter(m => m.user === u.id).map(m => m.acct)
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
