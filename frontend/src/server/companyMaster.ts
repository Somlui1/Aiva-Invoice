/**
 * v5.13 — master บริษัทในเครือ: เก็บในตาราง Company และโหลดเข้าหน่วยความจำ (COMPANIES / ORG)
 *
 * ทำไมต้องเก็บ: ก่อนหน้านี้ปุ่ม "Sync ข้อมูลจาก Oracle" แค่แสดงผลในหน้าจอ ไม่ได้บันทึก ไม่ได้เพิ่มบริษัทใหม่
 * และการจับคู่บริษัทของเอกสาร (companyOfTax / companyOfOrg) ยังใช้ค่าที่เขียนในโค้ด
 *
 * กติกา
 *  - ตารางว่าง → ใช้ค่าในโค้ด (เหมือนเดิมทุกอย่าง) · sync ครั้งแรกจะบันทึกค่าในโค้ดลงตารางก่อน แล้วค่อยรวมข้อมูล Oracle
 *  - จับคู่ด้วย Tax ID (ตัวเลขล้วน) — บริษัทที่มีอยู่แล้ว: อัปเดต ORG_ID + ชื่อ OU · ชื่อภาษาไทยที่ใช้ในระบบไม่ถูกทับ
 *  - Tax ID ที่ยังไม่มีในระบบ → status "pending" (ยังไม่ใช้จับคู่เอกสาร) จนกว่า SA/ADM จะตั้งรหัสบริษัทและเปิดใช้
 *  - ORG_ID ที่ Oracle บอกว่าเป็นของบริษัทจริง จะถูกเอาออกจาก "?" อัตโนมัติ (applyCompanyMaster)
 *  - ไม่ลบบริษัท: บริษัทที่ไม่อยู่ในผล Oracle รอบนี้ยังคงอยู่ (กันผู้ใช้ที่ถูกมอบหมายไว้หลุดสิทธิ์)
 */
import { prisma } from '../lib/prisma'
import {
  BUILTIN_COMPANIES,
  COMPANIES,
  ORG,
  UNKNOWN_COMPANY,
  applyCompanyMaster,
  type CompanyMasterRow,
} from '../mock/companies'

export type CompanySource = 'builtin' | 'oracle_mcp' | 'import'

export interface OrgUnit {
  id: number
  name?: string
}

/** หนึ่งนิติบุคคลจากแหล่งข้อมูล (Oracle / ไฟล์นำเข้า) */
export interface CompanyFeedEntry {
  tax: string
  name?: string
  orgs: OrgUnit[]
  /** ใช้ได้เฉพาะการนำเข้า JSON — Oracle ไม่มีรหัสย่อ */
  code?: string
}

export interface CompanyView {
  code: string
  name: string
  tax: string
  orgs: number[]
  orgNames: Record<number, string>
  status: 'active' | 'pending'
  source: string
  oracleName: string | null
  syncedAt: string | null
}

export interface MergeResult {
  updated: string[]
  added: string[]
  pending: string[]
  unchanged: string[]
}

export const COMPANY_CODE_RE = /^[A-Z0-9]{2,8}$/
const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')
const pendingCode = (tax: string) => `PENDING-${tax}`

function parseOrgs(json: string | null | undefined): OrgUnit[] {
  try {
    const v = JSON.parse(json || '[]')
    return Array.isArray(v)
      ? v.map((o: any) => ({ id: Number(o?.id), name: o?.name ? String(o.name) : undefined })).filter(o => Number.isFinite(o.id))
      : []
  } catch {
    return []
  }
}

function toView(r: any): CompanyView {
  const orgs = parseOrgs(r.orgsJson)
  return {
    code: r.code,
    name: r.name,
    tax: r.tax,
    orgs: orgs.map(o => o.id),
    orgNames: Object.fromEntries(orgs.filter(o => o.name).map(o => [o.id, o.name as string] as [number, string])),
    status: r.status === 'pending' ? 'pending' : 'active',
    source: r.source,
    oracleName: r.oracleName ?? null,
    syncedAt: r.syncedAt ? new Date(r.syncedAt).toISOString() : null,
  }
}

function toMasterRow(v: CompanyView): CompanyMasterRow {
  return { code: v.code, name: v.name, tax: v.tax, orgs: v.orgs, orgNames: v.orgNames }
}

/** อ่านตาราง → ใส่เข้าหน่วยความจำ · ตารางว่าง/ยังไม่มีตาราง = ไม่ทำอะไร (ใช้ค่าในโค้ด) */
export async function loadCompanyMaster(): Promise<number> {
  let rows: any[] = []
  try {
    rows = await prisma.company.findMany({ where: { status: 'active' }, orderBy: { code: 'asc' } })
  } catch (err) {
    console.warn('[company-master] cannot read Company table (schema not pushed yet?) — using built-in companies', err)
    return 0
  }
  if (rows.length) applyCompanyMaster(rows.map(toView).map(toMasterRow))
  return rows.length
}

/** บันทึกค่าในโค้ดลงตาราง (ครั้งแรกเท่านั้น) — ให้ทุกบริษัทที่ระบบรู้จักอยู่แล้วเป็น active ต่อไป */
async function ensureSeeded(tx: any): Promise<void> {
  if ((await tx.company.count()) > 0) return
  for (const [code, info] of Object.entries(BUILTIN_COMPANIES)) {
    if (code === UNKNOWN_COMPANY) continue
    await tx.company.create({
      data: {
        code,
        name: info.name,
        tax: digits(info.tax),
        orgsJson: JSON.stringify(info.orgs.map(id => ({ id, ...(ORG[id] ? { name: ORG[id] } : {}) }))),
        status: 'active',
        source: 'builtin',
      },
    })
  }
}

/** รวม feed เข้าตาราง (transaction เดียว) แล้วโหลดเข้าหน่วยความจำ */
export async function mergeCompanyFeed(feed: readonly CompanyFeedEntry[], source: CompanySource): Promise<MergeResult> {
  const out: MergeResult = { updated: [], added: [], pending: [], unchanged: [] }
  const now = new Date()
  await prisma.$transaction(async (tx: any) => {
    await ensureSeeded(tx)
    for (const e of feed) {
      const tax = digits(e.tax)
      if (tax.length !== 13) continue
      const orgs = [...new Map(e.orgs.filter(o => Number.isFinite(o.id)).map(o => [o.id, o] as [number, OrgUnit])).values()].sort((a, b) => a.id - b.id)
      const existing = await tx.company.findUnique({ where: { tax } })
      if (existing) {
        const old = new Map(parseOrgs(existing.orgsJson).map(o => [o.id, o.name] as [number, string | undefined]))
        // ชื่อ OU ที่ระบบใช้อยู่แล้ว (เช่น "APD") ไม่ถูกทับด้วยชื่อยาวจาก Oracle · ORG_ID ใหม่ใช้ชื่อจาก Oracle
        const merged = orgs.map(o => {
          const name = old.get(o.id) ?? o.name
          return { id: o.id, ...(name ? { name } : {}) }
        })
        const orgsJson = JSON.stringify(merged)
        if (orgsJson === existing.orgsJson && (e.name ?? null) === (existing.oracleName ?? null)) {
          out.unchanged.push(existing.code)
          await tx.company.update({ where: { tax }, data: { syncedAt: now } })
          continue
        }
        await tx.company.update({
          where: { tax },
          data: { orgsJson, oracleName: e.name ?? existing.oracleName, source, syncedAt: now },
        })
        out.updated.push(existing.code)
        continue
      }
      const code = e.code ? e.code.trim().toUpperCase() : ''
      const usable = source === 'import' && COMPANY_CODE_RE.test(code) && !(await tx.company.findUnique({ where: { code } }))
      await tx.company.create({
        data: {
          code: usable ? code : pendingCode(tax),
          name: e.name || (usable ? code : tax),
          tax,
          orgsJson: JSON.stringify(orgs),
          status: usable ? 'active' : 'pending',
          source,
          oracleName: e.name ?? null,
          syncedAt: now,
        },
      })
      ;(usable ? out.added : out.pending).push(usable ? code : tax)
    }
  })
  await loadCompanyMaster()
  return out
}

/** ตั้งรหัสให้บริษัท pending แล้วเปิดใช้ */
export async function activatePendingCompany(
  taxIn: string,
  codeIn: string,
  nameIn?: string,
): Promise<{ ok: true; company: CompanyView } | { ok: false; status: number; error: string }> {
  const tax = digits(taxIn)
  const code = String(codeIn || '').trim().toUpperCase()
  if (!COMPANY_CODE_RE.test(code) || code === 'ALL') {
    return { ok: false, status: 400, error: 'รหัสบริษัทต้องเป็น A–Z / 0–9 ยาว 2–8 ตัว และห้ามใช้ ALL' }
  }
  const row = await prisma.company.findUnique({ where: { tax } })
  if (!row) return { ok: false, status: 404, error: 'ไม่พบบริษัทที่มี Tax ID นี้' }
  if (row.status !== 'pending') return { ok: false, status: 409, error: `บริษัทนี้เปิดใช้แล้ว (รหัส ${row.code})` }
  if (await prisma.company.findUnique({ where: { code } })) return { ok: false, status: 409, error: `รหัส ${code} ถูกใช้แล้ว` }
  // code เป็น primary key → สร้างแถวใหม่แทนแถว pending (transaction เดียว)
  const created = await prisma.$transaction(async (tx: any) => {
    await tx.company.delete({ where: { code: row.code } })
    return tx.company.create({
      data: {
        code,
        name: (nameIn || '').trim() || row.oracleName || row.name,
        tax,
        orgsJson: row.orgsJson,
        status: 'active',
        source: row.source,
        oracleName: row.oracleName,
        syncedAt: row.syncedAt,
      },
    })
  })
  await loadCompanyMaster()
  return { ok: true, company: toView(created) }
}

/** สำหรับหน้า RBAC: บริษัทที่ใช้งาน (+ "?") และรายการรอเปิดใช้ */
export async function listCompanyMaster(): Promise<{ companies: CompanyView[]; pending: CompanyView[]; persisted: boolean }> {
  let rows: any[] = []
  try {
    rows = await prisma.company.findMany({ orderBy: { code: 'asc' } })
  } catch {
    rows = []
  }
  const unknown = COMPANIES[UNKNOWN_COMPANY]
  const unknownView: CompanyView = {
    code: UNKNOWN_COMPANY,
    name: unknown?.name ?? 'ไม่ระบุบริษัท',
    tax: '—',
    orgs: unknown?.orgs ?? [],
    orgNames: Object.fromEntries((unknown?.orgs ?? []).filter(o => ORG[o]).map(o => [o, ORG[o]] as [number, string])),
    status: 'active',
    source: 'builtin',
    oracleName: null,
    syncedAt: null,
  }
  if (!rows.length) {
    const builtin = Object.entries(COMPANIES)
      .filter(([k]) => k !== UNKNOWN_COMPANY)
      .map(([code, c]): CompanyView => ({
        code,
        name: c.name,
        tax: c.tax,
        orgs: c.orgs,
        orgNames: Object.fromEntries(c.orgs.filter(o => ORG[o]).map(o => [o, ORG[o]] as [number, string])),
        status: 'active',
        source: 'builtin',
        oracleName: null,
        syncedAt: null,
      }))
    return { companies: [...builtin, unknownView], pending: [], persisted: false }
  }
  const views = rows.map(toView)
  return {
    companies: [...views.filter(v => v.status === 'active'), unknownView],
    pending: views.filter(v => v.status === 'pending'),
    persisted: true,
  }
}

/** แถวจาก Oracle (HR_OPERATING_UNITS ⋈ XLE_ENTITY_PROFILES) → feed ตาม Tax ID */
export function feedFromOracleRows(rows: readonly Record<string, unknown>[]): CompanyFeedEntry[] {
  const byTax = new Map<string, CompanyFeedEntry>()
  for (const r of rows) {
    const tax = digits(r.TAX_ID ?? r.tax_id)
    const id = Number(r.ORG_ID ?? r.org_id)
    if (tax.length !== 13 || !Number.isFinite(id)) continue
    const e = byTax.get(tax) ?? { tax, name: String(r.COMPANY_NAME ?? r.company_name ?? '') || undefined, orgs: [] }
    const ou = String(r.OU_NAME ?? r.ou_name ?? '').trim()
    e.orgs.push({ id, ...(ou ? { name: ou } : {}) })
    byTax.set(tax, e)
  }
  return [...byTax.values()]
}
