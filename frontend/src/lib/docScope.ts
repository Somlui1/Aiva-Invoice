/**
 * v5.10 — who may see a document. ONE rule, used by the browser (AuthContext.scopeCheck), the
 * server under "view as" (src/server/viewAs.ts), so the two
 * can never disagree.
 *
 * Behaviour kept exactly as AuthContext.scopeCheck before v5.10 (including: an EU with no bound
 * Oracle account is limited by company only — see the v5.10 notes).
 */
export interface ScopeSubject {
  role: string
  companies: string[]
  /** Oracle accounts (receiver names) bound to the user. */
  accounts: string[]
}

export interface ScopeDocLike {
  company: string
  receiver?: string | null
}

export const ROLE_SCOPE: Readonly<Record<string, 'receiver' | 'company' | 'none' | 'all'>> = Object.freeze({
  EU: 'receiver',
  ACC: 'company',
  APR: 'company',
  ADM: 'none',
  SA: 'all',
})

export function explainScope(doc: ScopeDocLike, who: ScopeSubject): { ok: boolean; why: string } {
  const scope = ROLE_SCOPE[String(who.role || '').toUpperCase()] ?? 'none'
  if (scope === 'none') return { ok: false, why: 'บทบาทนี้ไม่เข้าถึงเนื้อหาเอกสาร' }
  if (scope === 'all' || who.companies.includes('ALL')) return { ok: true, why: 'เห็นทุกบริษัท' }
  if (who.companies.length > 0 && !who.companies.includes(doc.company)) {
    return { ok: false, why: `เอกสารอยู่นอกบริษัทที่ได้รับมอบหมาย (${doc.company})` }
  }
  if (scope === 'receiver' && who.accounts.length > 0) {
    if (!doc.receiver) return { ok: false, why: 'เอกสารยังไม่มี Receiver ในใบรับ · ฝ่ายบัญชีดำเนินการ' }
    if (!who.accounts.includes(doc.receiver)) {
      return { ok: false, why: `ไม่ได้เป็น Receiver ของใบรับนี้ (Receiver = ${doc.receiver})` }
    }
    return { ok: true, why: `เป็น Receiver (${doc.receiver})` }
  }
  if (scope === 'receiver') return { ok: true, why: 'ยังไม่ผูก Oracle account · จำกัดแค่บริษัท' }
  return { ok: true, why: `อยู่ในบริษัทที่ได้รับมอบหมาย (${doc.company})` }
}
