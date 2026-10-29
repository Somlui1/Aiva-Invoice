/**
 * Queue logic, out of the React provider (design §4.1, Task 8).
 *
 * Everything the mockup decides — who may see a document, which tab it falls
 * under, how many cards each KPI shows, which button is enabled, what a posting
 * pre-check refuses — used to live inside `InvoiceContext` and inside
 * `AuthContext`, where nothing but a browser could check it. Moving the decisions
 * here keeps the components thin and lets `src/test/uiParity.test.ts` assert the
 * rules against live rows.
 *
 * The behaviour is the mockup's (`AIVA-Web-Portal-Mockup-v4.18.html`): the
 * functions below are line-for-line equivalents of `scopeCheck`, `matchSt`,
 * `hasHigh`, `eupend`, `pendingBind`, `allow`, `precheck` and the KPI counters.
 * Where the port in Task 1 had drifted, the mockup is treated as the reference
 * and the drift is called out in a comment.
 */
import { EU_CODES } from '../mock/rules'
import { acctsOf } from '../mock/users'
import type { Role, RoleKey, User } from '../types/auth'
import type { ActionType } from '../mock/rules'
import type { InvoiceDoc, InvoiceStatus } from '../types/invoice'
import { smartMatch } from './smartSearch'
import { closedDateOf } from './closedDocs'
import { transitionFor, type WorkflowAction } from './docTransitions'

/** The mockup's frozen "today"; the whole demo runs on one fixed clock. */
export const TODAY = '2026-10-07'

export const OPEN_STATUSES: readonly string[] = Object.freeze([
  'Review',
  'Hold',
  'Manual Review',
  'Duplicate',
])

export const CLOSED_STATUSES: readonly string[] = Object.freeze([
  'Posted',
  'Rejected',
  'Confirmed',
  'Sent',
  'Superseded',
  'Duplicate',
])

/** Worse-severity-last ordering used when a revision supersedes a document. */
export const RANK: Readonly<Record<string, number>> = Object.freeze({
  'Auto-pass': 1,
  Review: 2,
  Hold: 3,
  'Manual Review': 4,
})

export interface PeriodFilter {
  k: string
  ym?: string
  from?: string
  to?: string
  /**
   * v5.8: which date the period applies to — `updated` วันที่เข้าระบบ (default, as before) ·
   * `created` วันที่สร้างเอกสาร · `invoice` วันที่ในใบแจ้งหนี้. One filter, one source of truth
   * (replaces the v5.7 separate search-box date filter).
   */
  field?: PeriodField
}

/** v5.9: `closed` = วันที่ปิดงาน (closed-documents page only). */
export type PeriodField = 'updated' | 'created' | 'invoice' | 'closed'

/** The period test on the date the filter is set to. */
export function inPerDoc(d: InvoiceDoc, p: PeriodFilter): boolean {
  return inPerOf(docDateFor(d, p.field ?? 'updated'), p)
}

/** `AuthContext.scopeCheck`, as a plain function so tests can call the real one. */
export function scopeCheckFor(
  doc: InvoiceDoc,
  user: User,
  role: Role,
  accounts: string[] = acctsOf(user),
): { ok: boolean; why?: string } {
  if (role.scope === 'none') return { ok: false, why: 'บทบาทนี้ไม่เข้าถึงเนื้อหาเอกสาร' }
  if (role.scope === 'all') return { ok: true }
  if (!user.co.includes(doc.company)) {
    return { ok: false, why: `เอกสารอยู่นอกบริษัทที่ได้รับมอบหมาย (${doc.company})` }
  }
  if (role.scope === 'receiver' && !doc.receiver) {
    return { ok: false, why: 'เอกสารยังไม่มี Receiver ในใบรับ · ฝ่ายบัญชีดำเนินการ' }
  }
  if (role.scope === 'receiver' && !accounts.includes(doc.receiver || '')) {
    return { ok: false, why: `ไม่ได้เป็น Receiver ของใบรับนี้ (Receiver = ${doc.receiver})` }
  }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Period helpers (the mockup's perRange / inPer)
// ---------------------------------------------------------------------------

const isoD = (t: Date) => t.toISOString().slice(0, 10)
const dAdd = (x: string, n: number) => {
  const t = new Date(x + 'T00:00:00Z')
  t.setUTCDate(t.getUTCDate() + n)
  return isoD(t)
}
const mRange = (ym: string): [string, string] => {
  const [y, m] = ym.split('-').map(Number)
  return [`${ym}-01`, isoD(new Date(Date.UTC(y, m, 0)))]
}

export function perRange(p: PeriodFilter): [string, string] | null {
  const ym = TODAY.slice(0, 7)
  switch (p.k) {
    case 'today':
      return [TODAY, TODAY]
    case '7d':
      return [dAdd(TODAY, -6), TODAY]
    case 'month':
      return mRange(ym)
    case 'lastm': {
      const [y, m] = ym.split('-').map(Number)
      return mRange(isoD(new Date(Date.UTC(y, m - 2, 1))).slice(0, 7))
    }
    case 'period':
      return mRange(p.ym || ym)
    case 'custom': {
      if (!p.from && !p.to) return null
      const lo = p.from || '0000-01-01'
      const hi = p.to || '9999-12-31'
      // v5.8: a reversed range is read the way the user meant it
      return lo <= hi ? [lo, hi] : [hi, lo]
    }
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Date filter attached to the document search box (v5.7)
// ---------------------------------------------------------------------------

/**
 * `created` = วันที่สร้างเอกสาร (the Portal row's createdAt) · `invoice` = วันที่ในใบแจ้งหนี้
 * (normalized_fields.invoice_date). Independent of the period selector, which works on `up`.
 */
export type DateSearchField = 'created' | 'invoice'

export interface DateSearchFilter {
  field: DateSearchField
  /** Inclusive, YYYY-MM-DD; empty = open-ended. */
  from?: string
  to?: string
}

export const EMPTY_DATE_FILTER: DateSearchFilter = Object.freeze({ field: 'created' }) as DateSearchFilter

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

export function isDateFilterActive(f?: DateSearchFilter | null): boolean {
  return !!f && (!!f.from || !!f.to)
}

/** The date a document is filtered on; '' when it has none that can be compared. */
export function docDateFor(d: InvoiceDoc, field: DateSearchField | 'updated' | 'closed'): string {
  if (field === 'closed') return closedDateOf(d)
  const raw = field === 'invoice' ? d.dt : field === 'created' ? d.created || d.up : d.up
  const day = (raw || '').slice(0, 10)
  return ISO_DAY.test(day) ? day : ''
}

/** A document without that date never matches an active range (an invoice with no readable date). */
export function matchesDateFilter(d: InvoiceDoc, f?: DateSearchFilter | null): boolean {
  if (!f || !isDateFilterActive(f)) return true
  const day = docDateFor(d, f.field)
  if (!day) return false
  // A reversed range is read the way the user meant it.
  const [lo, hi] = f.from && f.to && f.from > f.to ? [f.to, f.from] : [f.from, f.to]
  return (!lo || day >= lo) && (!hi || day <= hi)
}

/** A document with no readable date is only ever in the "all periods" view. */
export function inPerOf(dt: string | undefined, p?: PeriodFilter): boolean {
  if (!p) return true
  const r = perRange(p)
  return !r || (!!dt && dt >= r[0] && dt <= r[1])
}

// ---------------------------------------------------------------------------
// Document predicates
// ---------------------------------------------------------------------------

export function hasHighSeverity(d: InvoiceDoc): boolean {
  return d.rules.some(r => (r.status === 'FAIL' || r.result === 'fail') && r.severity === 'High')
}

/** A code the receiver must fix, on a document that has a bound receiver. */
export function isEuPending(d: InvoiceDoc): boolean {
  return d.codes.some(c => EU_CODES.has(c)) && !!d.receiver && !!d.receiverActive
}

/**
 * Waiting on IT to bind an Oracle account.
 *
 * The mockup restricts this to Review and Hold (`pendingBind`, line 1963); the
 * Task 1 port dropped that restriction, which let a Manual Review document show a
 * "รอผูกบัญชี" lock that its own tab cannot act on. Restored to the mockup.
 */
export function pendingBind(d: InvoiceDoc): boolean {
  return (
    !!d.receiver &&
    !d.receiverActive &&
    ['Review', 'Hold'].includes(d.status) &&
    d.codes.some(c => EU_CODES.has(c))
  )
}

// ---------------------------------------------------------------------------
// Selection: scope → status tab → company → period → search → order
// ---------------------------------------------------------------------------

export type ScopeCheck = (d: InvoiceDoc) => { ok: boolean; why?: string }

export interface QueueFilterInput {
  /** Already scope-checked, or raw — `filterDocsFor` checks nothing itself. */
  docs: InvoiceDoc[]
  statusFilter: string
  companyFilter: ReadonlySet<string>
  periodFilter: PeriodFilter
  searchQuery: string
  /** v5.7: date range attached to the search box (created / invoice date). */
  dateFilter?: DateSearchFilter | null
  showClosed: boolean
  role: RoleKey
}

export function visibleDocsFor(docs: InvoiceDoc[], scope: ScopeCheck): InvoiceDoc[] {
  return docs.filter(d => scope(d).ok)
}

export function matchStatusFor(
  k: string,
  d: InvoiceDoc,
  ctx: { showClosed: boolean; role: RoleKey },
): boolean {
  if (k === 'all') {
    // End User sees every state of their own Oracle account — there is no alert
    // channel for them, so hiding closed documents would hide work entirely.
    return ctx.showClosed || ctx.role === 'EU' || !CLOSED_STATUSES.includes(d.status)
  }
  if (k === 'bind') return pendingBind(d)
  if (k === 'unres') return !!d.unres && d.status === 'Manual Review'
  if (k === 'mine') return d.assigned === 'eu' && !CLOSED_STATUSES.includes(d.status)
  return d.status === k
}

function inCompany(d: InvoiceDoc, companyFilter: ReadonlySet<string>): boolean {
  return companyFilter.size === 0 || companyFilter.has(d.company)
}

/**
 * v5.8: dynamic search — every word must match anything the document carries (status in EN/ไทย,
 * codes, rules, dates in any format, amounts, parties…). See `lib/smartSearch.ts`.
 */
export function matchesSearchQuery(d: InvoiceDoc, rawQuery: string): boolean {
  return smartMatch(d, rawQuery)
}

/**
 * Mockup ordering. "รอผู้ใช้งาน" is a work queue — oldest request first — and every
 * other tab is newest first. Exported because `GET /api/documents` paginates and
 * has to hand back the same order the browser would have produced.
 */
export function sortDocsFor(docs: InvoiceDoc[], statusFilter: string): InvoiceDoc[] {
  return [...docs].sort((a, b) => {
    // "รอผู้ใช้งาน" is a work queue: oldest first. Everything else is newest first.
    const byDate =
      statusFilter === 'mine' ? a.up.localeCompare(b.up) : b.up.localeCompare(a.up)
    // `up` is a date, and 125 documents arrive on a handful of days: without a
    // tiebreak two requests could page the same document differently.
    return byDate !== 0 ? byDate : a.doc.localeCompare(b.doc)
  })
}

/** The queue table, in mockup order. `docs` must already be scope-checked. */
export function filterDocsFor(input: QueueFilterInput): InvoiceDoc[] {
  return sortDocsFor(
    input.docs
      .filter(d => matchStatusFor(input.statusFilter, d, input))
      .filter(d => inCompany(d, input.companyFilter))
      .filter(d => inPerDoc(d, input.periodFilter))
      .filter(d => matchesSearchQuery(d, input.searchQuery))
      .filter(d => matchesDateFilter(d, input.dateFilter)),
    input.statusFilter,
  )
}

/** KPI card keys, in the order the cards render (mockup `kpis()`). */
export function kpiKeysFor(role: RoleKey): string[] {
  return role === 'EU'
    ? // v5.10: Rejected / Superseded moved to "ผลการส่งเอกสาร" — the EU queue shows work only
      ['mine', 'all', 'Hold', 'Review']
    : ['all', 'Auto-pass', 'Review', 'Hold', 'Manual Review', 'unres', 'bind', 'Duplicate', 'Superseded']
}

export function kpiCountsFor(input: QueueFilterInput, keys: string[] = kpiKeysFor(input.role)) {
  const counts: Record<string, number> = {}
  for (const k of keys) {
    counts[k] = input.docs.filter(
      d =>
        matchStatusFor(k, d, input) && inCompany(d, input.companyFilter) && inPerDoc(d, input.periodFilter),
    ).length
  }
  return counts
}

/**
 * Counts behind the company chips: what the table would hold if that chip were
 * the only company selected. Counting on the already company-filtered list would
 * make every other chip read zero the moment one chip is on.
 */
export function companyCountsFor(input: QueueFilterInput): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const d of input.docs) {
    if (!matchStatusFor(input.statusFilter, d, input)) continue
    if (!inPerDoc(d, input.periodFilter)) continue
    counts[d.company] = (counts[d.company] || 0) + 1
  }
  return counts
}

/** Open documents that fall outside the chosen period ("ค้างนอกงวด"). */
export function staleDocsFor(input: QueueFilterInput): InvoiceDoc[] {
  return input.docs.filter(
    d => OPEN_STATUSES.includes(d.status) && inCompany(d, input.companyFilter) && !inPerDoc(d, input.periodFilter),
  )
}

// ---------------------------------------------------------------------------
// The four-step validation gates
// ---------------------------------------------------------------------------

export interface ActionContext {
  role: RoleKey
  can: (permission: string) => boolean
}

/** The document carries a receipt number (the Engine found it, or it was bound). */
export function hasReceipt(d: Pick<InvoiceDoc, 'rcv'>): boolean {
  return !!d.rcv && d.rcv !== '—'
}

const PERM_FOR: Record<WorkflowAction, string> = {
  confirm: 'CONFIRM',
  review: 'REVIEW',
  hold: 'HOLD',
  reject: 'REJECT',
  unconfirm: 'UNCONFIRM',
  returnf: 'RETURN_FAILED',
}

/**
 * `allow()` in the mockup: whether a button may fire, and why not.
 *
 * v5.11: the status table is `transitionFor` (src/lib/docTransitions.ts) — the same one the server
 * enforces — so a button that is enabled here is accepted by the server. What stays here is only what
 * the UI knows and the server does not check: permissions, the receiver-binding wait, codes the End
 * User must fix, and High severity on a Manual Review decision.
 */
export function allowedActionFor(
  d: InvoiceDoc,
  act: ActionType,
  ctx: ActionContext,
): { ok: boolean; why?: string; perm?: string } {
  const st = d.status
  const no = (w: string) => ({ ok: false, why: w })
  const yes = (p: string) => ({
    ok: ctx.can(p),
    why: ctx.can(p) ? undefined : `บทบาทนี้ไม่มีสิทธิ์ (${p})`,
    perm: p,
  })

  if (ctx.role === 'EU') {
    if (act !== 'upload') return no('End User อัปโหลดเอกสารใหม่ได้อย่างเดียว')
    if (['Superseded', 'Duplicate', 'Confirmed', 'Sent', 'Posted'].includes(st)) {
      return no(`สถานะ ${st} อัปโหลดแทนไม่ได้`)
    }
    return yes('UPLOAD_NEW')
  }

  if (act === 'upload') return no('อัปโหลดเอกสารใหม่ทำโดย End User')
  if (d.identityStatus === 'UNRESOLVED' && ctx.role !== 'APR' && !['Sent', 'Posted', 'Rejected', 'Superseded'].includes(st)) {
    return no('เอกสาร UNRESOLVED: เฉพาะหัวหน้าฝ่ายบัญชี (APR) ตัดสินได้')
  }
  const t = transitionFor({ status: st, identityStatus: d.identityStatus ?? null, hasReceipt: hasReceipt(d) }, act)
  if (!t.ok) return no(t.why)

  const decidingManual = st === 'Manual Review' && d.identityStatus !== 'UNRESOLVED'
  if (act === 'confirm') {
    if (decidingManual && hasHighSeverity(d)) return no('มีรหัส High')
  }
  return yes(decidingManual ? 'MANUAL_REVIEW' : PERM_FOR[act])
}

/**
 * v5.12: "รอผูกบัญชี" and "รอ End User แก้" no longer block accounting. Accounting may decide the
 * document itself, but must say why — the same rule the server applies (receiverWorkPending).
 */
export function confirmNeedsReason(d: InvoiceDoc): string | null {
  if (pendingBind(d)) return `Receiver ${d.receiver} ยังไม่ผูก Oracle account · Confirm แทนผู้ใช้งานต้องระบุเหตุผล`
  if (isEuPending(d)) return 'มีรหัสที่ผู้ใช้งาน (Receiver) ต้องแก้ค้างอยู่ · Confirm แทนต้องระบุเหตุผล'
  return null
}

/** The status an action leaves behind; `upload` creates a document instead. */
export function statusForAction(act: ActionType): InvoiceStatus | null {
  switch (act) {
    case 'confirm':
      return 'Confirmed'
    case 'review':
    case 'unconfirm':
    case 'returnf':
      return 'Review'
    case 'hold':
      return 'Hold'
    case 'reject':
      return 'Rejected'
    default:
      return null
  }
}

/**
 * `precheck()` in the mockup — the two things that stop a batch posting:
 * the sender cannot be the approver, and the total must sit inside the role's
 * credit limit.
 */
export function precheckPostFor(
  d: InvoiceDoc,
  ctx: { userId: string; postMax?: number; dupAtPost?: string },
): { ok: boolean; code?: string; why: string } {
  if (ctx.dupAtPost ?? (d as { dupAtPost?: string }).dupAtPost) {
    return { ok: false, code: 'dup', why: `Portal พบเอกสารซ้ำ: ${ctx.dupAtPost ?? (d as { dupAtPost?: string }).dupAtPost}` }
  }
  if (d.confirmedBy && d.confirmedBy === ctx.userId) {
    return { ok: false, code: 'sod', why: 'ผู้ส่งเป็นผู้ยืนยันเอกสารนี้ (ผู้ยืนยัน ≠ ผู้ส่ง)' }
  }
  const lim = ctx.postMax
  if (lim && d.total > lim) {
    return { ok: false, code: 'lim', why: `ยอด ${d.total.toLocaleString()} เกินวงเงินตั้งหนี้ ${lim.toLocaleString()}` }
  }
  return { ok: true, why: 'พร้อมส่ง' }
}

// ---------------------------------------------------------------------------
// Live data arriving
// ---------------------------------------------------------------------------

/** Where the rows on screen came from — the queue header tells the analyst. */
export type QueueDataSource = 'mock' | 'portal_db' | 'error'

export interface LiveLoadResult {
  docs: InvoiceDoc[]
  selectedDocId: string | null
  source: QueueDataSource
  notice?: string
}

/**
 * Merge a freshly loaded live queue into what the analyst is looking at.
 *
 * The rule that matters: **the queue is never a mixture of mock and live rows**.
 * A successful load replaces the whole list; a failed load keeps the previous
 * list and reports the error, because emptying an analyst's queue because one
 * request failed is how documents get missed.
 */
export function applyLiveDocs(input: {
  prevDocs: InvoiceDoc[]
  liveDocs: InvoiceDoc[]
  selectedDocId: string | null
  error?: string | null
}): LiveLoadResult {
  if (input.error) {
    return {
      docs: input.prevDocs,
      selectedDocId: input.selectedDocId,
      source: 'error',
      notice: input.error,
    }
  }

  const docs = input.liveDocs
  const selected =
    input.selectedDocId && docs.some(d => d.doc === input.selectedDocId)
      ? input.selectedDocId
      : docs.length
        ? docs[0].doc
        : null

  return { docs, selectedDocId: selected, source: 'portal_db' }
}
