/**
 * Who may see a document. ONE rule, used by the browser (AuthContext.scopeCheck) and by the server
 * on EVERY document read / write / PDF (v5.11.1 — before, the server applied it only under "view as"
 * and returned every document to every signed-in user), so the two can never disagree.
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

/**
 * Oracle receiver names are typed by people (the RBAC page) and read by OCR / Oracle (documents):
 * case and spacing differ ("AHT Die Making 03, K.Vinitda" vs "AHT DIE MAKING 03,  K.VINITDA").
 * Before v5.11.1 the match was exact, so an account typed in capitals never matched and the End User
 * saw nothing. Compared case- and space-insensitively; punctuation is kept (it is part of the name).
 */
export function normalizeReceiverName(v: string | null | undefined): string {
  return String(v ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toUpperCase()
}

export function receiverMatches(accounts: readonly string[], receiver: string | null | undefined): boolean {
  const want = normalizeReceiverName(receiver)
  return !!want && accounts.some(a => normalizeReceiverName(a) === want)
}

/**
 * v5.11.1 (production): an assignment that is missing means NO access — never "everything".
 *   ACC / APR without a company        → nothing   (before: every company)
 *   EU without a bound Oracle account  → nothing   (before: the whole company — or every company when
 *                                                    the user had no company either, which is how the
 *                                                    RBAC page creates End Users)
 *   EU with accounts                   → documents whose Receiver is one of them; when companies are
 *                                        also assigned, only inside those companies
 */
export function explainScope(doc: ScopeDocLike, who: ScopeSubject): { ok: boolean; why: string } {
  const scope = ROLE_SCOPE[String(who.role || '').toUpperCase()] ?? 'none'
  const companies = (who.companies ?? []).filter(Boolean)
  const accounts = (who.accounts ?? []).filter(a => normalizeReceiverName(a) !== '' && a !== '—')
  if (scope === 'none') return { ok: false, why: 'บทบาทนี้ไม่เข้าถึงเนื้อหาเอกสาร' }
  if (scope === 'all' || companies.includes('ALL')) return { ok: true, why: 'เห็นทุกบริษัท' }

  if (scope === 'receiver') {
    if (accounts.length === 0) return { ok: false, why: 'ยังไม่ได้ผูก Oracle account (Receiver) · ติดต่อผู้ดูแลระบบ' }
    if (companies.length > 0 && !companies.includes(doc.company)) {
      return { ok: false, why: `เอกสารอยู่นอกบริษัทที่ได้รับมอบหมาย (${doc.company})` }
    }
    if (!doc.receiver) return { ok: false, why: 'เอกสารยังไม่มี Receiver ในใบรับ · ฝ่ายบัญชีดำเนินการ' }
    if (!receiverMatches(accounts, doc.receiver)) {
      return { ok: false, why: `ไม่ได้เป็น Receiver ของใบรับนี้ (Receiver = ${doc.receiver})` }
    }
    return { ok: true, why: `เป็น Receiver (${doc.receiver})` }
  }

  if (companies.length === 0) return { ok: false, why: 'ยังไม่ได้รับมอบหมายบริษัท · ติดต่อผู้ดูแลระบบ' }
  if (!companies.includes(doc.company)) {
    return { ok: false, why: `เอกสารอยู่นอกบริษัทที่ได้รับมอบหมาย (${doc.company})` }
  }
  return { ok: true, why: `อยู่ในบริษัทที่ได้รับมอบหมาย (${doc.company})` }
}
