export interface CompanyInfo {
  name: string
  tax: string
  orgs: number[]
}

export const COMPANIES: Record<string, CompanyInfo> = {
  AH: { name: 'อาปิโก ไฮเทค (มหาชน)', tax: '0107545000179', orgs: [101, 103, 222] },
  AHT: { name: 'อาปิโก ไฮเทค ทูลลิ่ง', tax: '0145548001557', orgs: [195, 196, 352] },
  AHP: { name: 'อาปิโก ไฮเทค พาร์ทส์', tax: '0145548001549', orgs: [175, 176] },
  AHA: { name: 'อาปิโก ไฮเทค ออโตโมชั่น', tax: '0145563000434', orgs: [413] },
  AM: { name: 'เอเบิล มอเตอร์ส', tax: '0135546008643', orgs: [376] },
  '?': { name: 'ไม่ระบุบริษัท (ORG_ID ยังไม่ทราบ / ยกเลิก)', tax: '—', orgs: [556, 104] }
}

export const ORG: Record<number, string> = {
  103: 'APD',
  222: 'AHR',
  352: 'AHD',
  196: 'AHT',
  175: 'AHP',
  376: 'AM',
  556: 'MGP',
  104: 'ATD'
}

export const ORG_NAMES = ORG

export function companyOfOrg(orgId: number): string {
  const found = Object.keys(COMPANIES).find(k => COMPANIES[k].orgs.includes(orgId))
  return found || '?'
}

export function companyOfTax(taxId: string): string {
  const want = String(taxId ?? '').replace(/\D/g, '')
  const found = want ? Object.keys(COMPANIES).find(k => k !== UNKNOWN_COMPANY && COMPANIES[k].tax.replace(/\D/g, '') === want) : undefined
  return found || '?'
}

/* =====================================================================
   v5.13 — บริษัท "?" และ master บริษัทในเครือที่ sync ได้
   ===================================================================== */

/** เอกสารที่ระบุบริษัทไม่ได้ (Tax ID / ORG_ID ไม่ตรง master) */
export const UNKNOWN_COMPANY = '?'

/**
 * รหัสบริษัทที่มอบหมายให้ผู้ใช้ได้ — v5.13: รวม "?" ด้วย (ต่อท้ายเสมอ) เพื่อให้ SA มอบหมาย
 * เอกสารที่ระบุบริษัทไม่ได้ให้พนักงานบัญชีคนอื่นดูแลได้ · อ่านทุกครั้ง (master เปลี่ยนได้หลัง sync)
 */
export function assignableCompanies(): string[] {
  return [...Object.keys(COMPANIES).filter(k => k !== UNKNOWN_COMPANY), UNKNOWN_COMPANY]
}

/** ป้ายสั้นบน chip: "?" อ่านไม่ออกเมื่ออยู่ลำพัง จึงต่อคำอธิบาย */
/**
 * v5.14.1 — ชื่อบริษัทผู้ซื้อ (Buyer ORG) ของเอกสาร · ใช้แสดงผลเท่านั้น (ไม่แตะค่า `oname` ที่ Engine ส่งมา)
 *
 * ที่มา (เรียงตามความน่าเชื่อถือ):
 *  1) master "บริษัทและ ORG_ID" (COMPANIES) ตามรหัสบริษัทของเอกสาร — เช่น AH → "อาปิโก ไฮเทค (มหาชน)"
 *  2) master ตาม ORG_ID ของใบรับ (กรณีรหัสบริษัทยังเป็น "?")
 *  3) ชื่อลูกค้าที่อ่านจากใบแจ้งหนี้ (`oname`) — ใช้เมื่อ master ระบุบริษัทไม่ได้
 * อ่าน COMPANIES ตอนเรียกทุกครั้ง (applyCompanyMaster แก้ object เดิมหลัง sync)
 */
export interface BuyerOrg {
  /** ชื่อที่แสดง · '' = ไม่ทราบ */
  name: string
  /** รหัสบริษัทจาก master (AH, AHT, …) · '' เมื่อไม่ได้มาจาก master */
  code: string
  source: 'master' | 'invoice' | 'none'
}

export function buyerOrgOf(d: { company?: string | null; org?: number | null; oname?: string | null }): BuyerOrg {
  const known = (c: string | null | undefined): c is string => !!c && c !== UNKNOWN_COMPANY && !!COMPANIES[c]?.name
  let code = d.company ?? ''
  if (!known(code) && d.org != null) code = companyOfOrg(Number(d.org))
  if (known(code)) return { name: COMPANIES[code].name, code, source: 'master' }
  const inv = (d.oname ?? '').trim()
  return inv ? { name: inv, code: '', source: 'invoice' } : { name: '', code: '', source: 'none' }
}

export function companyChipLabel(code: string): string {
  return code === UNKNOWN_COMPANY ? '? ไม่ระบุบริษัท' : code
}

export interface CompanyMasterRow {
  code: string
  name: string
  tax: string
  orgs: number[]
  /** ORG_ID → ชื่อ OU (จาก Oracle) */
  orgNames?: Record<number, string>
}

/**
 * แทนค่า master ในหน่วยความจำ (แก้ object เดิม — ทุกไฟล์ที่ import COMPANIES / ORG เห็นค่าใหม่ทันที)
 * "?" ไม่ถูกแทน · ORG_ID ที่ย้ายไปอยู่บริษัทจริงแล้วจะถูกเอาออกจาก "?"
 */
export function applyCompanyMaster(rows: readonly CompanyMasterRow[]): void {
  if (!rows.length) return
  // "?" keeps its current name; its ORG_IDs start from the built-in list every time (re-applying is idempotent)
  const unknown = { ...COMPANIES[UNKNOWN_COMPANY], orgs: [...(BUILTIN_COMPANIES[UNKNOWN_COMPANY] ?? COMPANIES[UNKNOWN_COMPANY]).orgs] }
  for (const k of Object.keys(COMPANIES)) if (k !== UNKNOWN_COMPANY) delete COMPANIES[k]
  const taken = new Set<number>()
  for (const r of rows) {
    const code = String(r.code || '').trim().toUpperCase()
    if (!code || code === UNKNOWN_COMPANY || code === 'ALL') continue
    const orgs = [...new Set((r.orgs || []).map(Number).filter(Number.isFinite))].sort((a, b) => a - b)
    orgs.forEach(o => taken.add(o))
    COMPANIES[code] = { name: r.name || code, tax: r.tax || '—', orgs }
    for (const [o, n] of Object.entries(r.orgNames || {})) if (n) ORG[Number(o)] = n
  }
  // "?" ไว้ท้ายสุดเสมอ (ลำดับ key ของ object)
  delete COMPANIES[UNKNOWN_COMPANY]
  COMPANIES[UNKNOWN_COMPANY] = { ...unknown, orgs: unknown.orgs.filter(o => !taken.has(o)) }
}

/** สำเนาค่าเริ่มต้นในโค้ด — ใช้เมื่อยังไม่เคย sync และในเทสต์ */
export const BUILTIN_COMPANIES: Readonly<Record<string, CompanyInfo>> = Object.freeze(
  Object.fromEntries(Object.entries(COMPANIES).map(([k, v]) => [k, { ...v, orgs: [...v.orgs] }] as [string, CompanyInfo])),
)
