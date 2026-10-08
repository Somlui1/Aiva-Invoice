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
  { id: 'u1', n: 'สมศักดิ์ ใจดี', email: 'somsak.j@aapico.com', role: 'EU', rcvName: 'SOMSAK JAIDEE', emp: 10231, co: ['AH'], unit: 'คลังวัตถุดิบ' },
  { id: 'u2', n: 'วิไลวรรณ ศรีสุข', email: 'wilaiwan.s@aapico.com', role: 'EU', rcvName: 'WILAIWAN SRISUK', emp: 20417, co: ['AHT'], unit: 'ฝ่ายซ่อมบำรุง' },
  { id: 'u3', n: 'ธนากร มั่นคง', email: 'thanakorn.m@aapico.com', role: 'EU', rcvName: 'THANAKORN MANKONG', emp: 30552, co: ['AM'], unit: 'คลังอะไหล่' },
  { id: 'u4', n: 'ปณิดา รักงาน', email: 'panida.r@aapico.com', role: 'ACC', rcvName: '—', emp: 11020, co: ['AH', 'AHT'], unit: 'ฝ่ายบัญชี AH/AHT' },
  { id: 'u5', n: 'กมลวรรณ ใจงาม', email: 'kamonwan.j@aapico.com', role: 'ACC', rcvName: '—', emp: 31005, co: ['AM', 'AHP'], unit: 'ฝ่ายบัญชี AM/AHP' },
  { id: 'u6', n: 'สมชาย วงศ์ทอง', email: 'somchai.w@aapico.com', role: 'APR', rcvName: '—', emp: 11001, co: ['AH', 'AHT', 'AHP', 'AM', '?'], unit: 'หัวหน้าฝ่ายบัญชี' },
  { id: 'u7', n: 'อนุชา ไอที', email: 'anucha.i@aapico.com', role: 'ADM', rcvName: '—', emp: null, co: [], unit: 'IT' },
  { id: 'u8', n: 'กิตติ สมบูรณ์', email: 'kitti.s@aapico.com', role: 'EU', rcvName: '—', emp: null, co: ['AH', 'AHT', 'AM'], unit: 'หัวหน้าคลัง (ดูแลหลาย account)' }
]

export const INITIAL_MAPS: AccountMapping[] = [
  { id: 'm1', user: 'u1', acct: 'SOMSAK JAIDEE', by: 'อนุชา ไอที', at: '2026-09-20', req: 'INC-0998' },
  { id: 'm2', user: 'u2', acct: 'WILAIWAN SRISUK', by: 'อนุชา ไอที', at: '2026-09-20', req: 'INC-0998' },
  { id: 'm3', user: 'u3', acct: 'THANAKORN MANKONG', by: 'อนุชา ไอที', at: '2026-09-20', req: 'INC-0998' },
  { id: 'm4', user: 'u8', acct: 'SOMSAK JAIDEE', by: 'อนุชา ไอที', at: '2026-10-02', req: 'ticket INC-1021' },
  { id: 'm5', user: 'u8', acct: 'WILAIWAN SRISUK', by: 'อนุชา ไอที', at: '2026-10-02', req: 'ticket INC-1021' },
  { id: 'm6', user: 'u8', acct: 'THANAKORN MANKONG', by: 'อนุชา ไอที', at: '2026-10-02', req: 'ticket INC-1021' }
]

export function acctsOf(u: User, maps: AccountMapping[] = INITIAL_MAPS): string[] {
  return maps.filter(m => m.user === u.id).map(m => m.acct)
}

export function isAccountBound(acct: string | undefined, maps: AccountMapping[] = INITIAL_MAPS, users: User[] = USERS): boolean {
  if (!acct) return true
  return maps.some(m => m.acct === acct && users.find(x => x.id === m.user)?.role === 'EU')
}

export const bound = isAccountBound
