/**
 * v5.13 — browser side of the synced company master.
 * After sign-in the shell loads GET /api/companies once and updates COMPANIES / ORG in place
 * (same object every screen already imports), then re-renders. Failure = keep the built-in list.
 */
import { useEffect, useState } from 'react'
import { UNKNOWN_COMPANY, applyCompanyMaster, type CompanyMasterRow } from '../mock/companies'

export const COMPANY_MASTER_EVENT = 'aiva:companies'

export function applyCompanyRows(rows: unknown): number {
  if (!Array.isArray(rows)) return 0
  const clean: CompanyMasterRow[] = rows
    .filter((r: any) => r && typeof r.code === 'string' && r.code !== UNKNOWN_COMPANY && Array.isArray(r.orgs))
    .map((r: any) => ({
      code: r.code,
      name: String(r.name ?? r.code),
      tax: String(r.tax ?? '—'),
      orgs: r.orgs.map(Number).filter(Number.isFinite),
      orgNames: r.orgNames && typeof r.orgNames === 'object' ? r.orgNames : undefined,
    }))
  if (!clean.length) return 0
  applyCompanyMaster(clean)
  try {
    window.dispatchEvent(new CustomEvent(COMPANY_MASTER_EVENT))
  } catch {}
  return clean.length
}

export async function refreshCompanyMaster(): Promise<number> {
  try {
    if (typeof fetch !== 'function') return 0
    const res = await fetch('/api/companies', { credentials: 'same-origin' })
    if (!res?.ok) return 0
    const data = await res.json()
    return data?.persisted ? applyCompanyRows(data.companies) : 0
  } catch {
    return 0
  }
}

/** returns a counter that changes whenever the master was (re)applied — use it to re-render */
export function useCompanyMaster(enabled: boolean): number {
  const [ver, setVer] = useState(0)
  useEffect(() => {
    const on = () => setVer(v => v + 1)
    window.addEventListener(COMPANY_MASTER_EVENT, on)
    return () => window.removeEventListener(COMPANY_MASTER_EVENT, on)
  }, [])
  useEffect(() => {
    if (enabled) void refreshCompanyMaster()
  }, [enabled])
  return ver
}
