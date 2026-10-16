import { NextRequest, NextResponse } from 'next/server'
import { searchActiveDirectory } from '@/lib/adAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DirectoryEmployee {
  samAccount: string
  name: string
  email: string
  upn?: string
  empId: string
  title: string
  unit: string
  ou: string
  enabled: boolean
}

const DIRECTORY_EMPLOYEES: DirectoryEmployee[] = [
  { samAccount: 'somsak.j', name: 'สมศักดิ์ ใจดี', email: 'somsak.j@aapico.com', upn: 'somsak.j@aapico.com', empId: '10231', title: 'หัวหน้าคลัง', unit: 'คลังวัตถุดิบ', ou: 'OU=Warehouse,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'wilaiwan.s', name: 'วิไลวรรณ ศรีสุข', email: 'wilaiwan.s@aapico.com', upn: 'wilaiwan.s@aapico.co.th', empId: '20417', title: 'เจ้าหน้าที่ซ่อมบำรุง', unit: 'ฝ่ายซ่อมบำรุง', ou: 'OU=Maintenance,OU=AHT,DC=aapico,DC=com', enabled: true },
  { samAccount: 'thanakorn.m', name: 'ธนากร มั่นคง', email: 'thanakorn.m@aapico.com', upn: 'thanakorn.m@aapico.com', empId: '30552', title: 'เจ้าหน้าที่คลังอะไหล่', unit: 'คลังอะไหล่', ou: 'OU=Spare,OU=AM,DC=aapico,DC=com', enabled: true },
  { samAccount: 'panida.r', name: 'ปณิดา รักงาน', email: 'panida.r@aapico.com', upn: 'panida.r@aapico.com', empId: '11020', title: 'นักบัญชี', unit: 'ฝ่ายบัญชี AH/AHT', ou: 'OU=Accounting,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'kamonwan.j', name: 'กมลวรรณ ใจงาม', email: 'kamonwan.j@aapico.com', upn: 'kamonwan.j@aapico.com', empId: '31005', title: 'นักบัญชี', unit: 'ฝ่ายบัญชี AM/AHP', ou: 'OU=Accounting,OU=AM,DC=aapico,DC=com', enabled: true },
  { samAccount: 'somchai.w', name: 'สมชาย วงศ์ทอง', email: 'somchai.w@aapico.com', upn: 'somchai.w@aapico.com', empId: '11001', title: 'หัวหน้าฝ่ายบัญชี', unit: 'ฝ่ายบัญชี', ou: 'OU=Accounting,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'anucha.i', name: 'อนุชา ไอที', email: 'anucha.i@aapico.com', upn: 'anucha.i@aapico.com', empId: '90007', title: 'IT Admin', unit: 'IT', ou: 'OU=IT,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'kitti.s', name: 'กิตติ สมบูรณ์', email: 'kitti.s@aapico.com', upn: 'kitti.s@aapico.com', empId: '10388', title: 'หัวหน้าคลัง', unit: 'คลัง (ดูแลหลาย account)', ou: 'OU=Warehouse,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'narong.p', name: 'ณรงค์ พลศรี', email: 'narong.p@aapico.com', upn: 'narong.p@aapico.com', empId: '40118', title: 'เจ้าหน้าที่คลัง', unit: 'คลังสินค้า MGP', ou: 'OU=Warehouse,OU=MGP,DC=aapico,DC=com', enabled: true },
  { samAccount: 'praphan.k', name: 'ประพันธ์ แก้วกล้า', email: 'praphan.k@aapico.com', upn: 'praphan.k@aapico.com', empId: '40227', title: 'เจ้าหน้าที่คลัง', unit: 'คลังน้ำมันหล่อลื่น', ou: 'OU=Warehouse,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'anan.t', name: 'อนันต์ ทองดี', email: 'anan.t@aapico.com', upn: 'anan.t@aapico.com', empId: '40301', title: 'ช่างซ่อมบำรุง', unit: 'บำรุงรักษา ATD', ou: 'OU=Maintenance,OU=ATD,DC=aapico,DC=com', enabled: true },
  { samAccount: 'siriporn.k', name: 'ศิริพร แก้วใส', email: 'siriporn.k@aapico.com', upn: 'siriporn.k@aapico.com', empId: '40412', title: 'เจ้าหน้าที่คลัง', unit: 'คลังวัตถุดิบ', ou: 'OU=Warehouse,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'theerapong.t', name: 'ธีรพงษ์ ทองดี', email: 'theerapong.t@aapico.com', upn: 'theerapong.t@aapico.com', empId: '40533', title: 'นักบัญชี', unit: 'ฝ่ายบัญชี AHT', ou: 'OU=Accounting,OU=AHT,DC=aapico,DC=com', enabled: true },
  { samAccount: 'napassorn.p', name: 'นภัสสร พึ่งบุญ', email: 'napassorn.p@aapico.com', upn: 'napassorn.p@aapico.com', empId: '40640', title: 'เจ้าหน้าที่คลังอะไหล่', unit: 'คลังอะไหล่ AHP', ou: 'OU=Spare,OU=AHP,DC=aapico,DC=com', enabled: true },
  { samAccount: 'kittipong.s', name: 'กิตติพงษ์ สมบัติ', email: 'kittipong.s@aapico.com', upn: 'kittipong.s@aapico.com', empId: '40755', title: 'เจ้าหน้าที่คลังอะไหล่', unit: 'คลังอะไหล่ AM', ou: 'OU=Spare,OU=AM,DC=aapico,DC=com', enabled: true },
  { samAccount: 'wipa.s', name: 'วิภา ศรีสุข', email: 'wipa.s@aapico.com', upn: 'wipa.s@aapico.co.th', empId: '40866', title: 'หัวหน้าสายการผลิต', unit: 'ฝ่ายผลิต AHT', ou: 'OU=Production,OU=AHT,DC=aapico,DC=com', enabled: true },
]

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase()

  if (!q) {
    return NextResponse.json({ ok: true, results: DIRECTORY_EMPLOYEES })
  }

  // Query real Active Directory Domain Controller first
  try {
    const liveResults = await searchActiveDirectory(q)
    if (liveResults && liveResults.length > 0) {
      return NextResponse.json({ ok: true, results: liveResults })
    }
  } catch {}

  // Fallback to local directory list
  const results = DIRECTORY_EMPLOYEES.filter(
    e =>
      e.samAccount.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.empId.includes(q) ||
      e.unit.toLowerCase().includes(q),
  )

  return NextResponse.json({ ok: true, results })
}
