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
  const found = Object.keys(COMPANIES).find(k => COMPANIES[k].tax === taxId)
  return found || '?'
}
