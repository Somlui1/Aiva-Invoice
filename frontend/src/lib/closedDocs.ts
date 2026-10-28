/**
 * v5.9 — "เอกสารที่ปิดแล้ว" (closed documents view).
 *
 * Pure helpers shared by the page, the sidebar count and the tests. No React, no context.
 *
 * Groups (spec):
 *   ap         AP Flow              Confirmed → Sent → Posted
 *   rejected   ปฏิเสธ (Terminated)  Rejected
 *   dup        เอกสารซ้ำ             Superseded (DR-01/02 · ผูกใบรับ) · Duplicate (DR-03/04/06)
 *
 * `Import Failed` is NOT closed: it still needs someone (returned to the AP page / queue).
 */
import type { DocumentHistoryEntry, InvoiceDoc } from '../types/invoice'

export type ClosedGroup = 'ap' | 'rejected' | 'dup' | 'sup'
export type ClosedStatus = 'Confirmed' | 'Sent' | 'Posted' | 'Rejected' | 'Superseded' | 'Duplicate'

export const CLOSED_GROUPS: ReadonlyArray<{
  key: ClosedGroup
  label: string
  hint: string
  statuses: readonly ClosedStatus[]
}> = Object.freeze([
  { key: 'ap', label: 'AP Flow', hint: 'อนุมัติแล้วและเข้าสู่กระบวนการจ่ายเงิน', statuses: ['Confirmed', 'Sent', 'Posted'] },
  { key: 'rejected', label: 'ปฏิเสธ', hint: 'เอกสารที่ถูกปฏิเสธ (มีเหตุผลใน Audit Log)', statuses: ['Rejected'] },
  { key: 'dup', label: 'เอกสารซ้ำ', hint: 'ปิดโดยกฎเอกสารซ้ำ DR-01 – DR-06 หรือการผูกใบรับ', statuses: ['Superseded', 'Duplicate'] },
])

export const CLOSED_VIEW_STATUSES: readonly ClosedStatus[] = Object.freeze(
  CLOSED_GROUPS.flatMap(g => g.statuses),
)

/** Badge spec: label (TH), icon, extra class. Colours live in CSS (`.cst-*`). */
export const CLOSED_STATUS_META: Readonly<Record<ClosedStatus, { th: string; icon: string; desc: string }>> =
  Object.freeze({
    Confirmed: { th: 'อนุมัติแล้ว', icon: 'check', desc: 'ผ่านการตรวจโดย ACC / APR · รอส่งเข้า Oracle ERP' },
    Sent: { th: 'กำลังนำส่ง', icon: 'send', desc: 'อยู่ใน AP Batch · กำลังส่งเข้า Oracle ผ่าน API Interface' },
    Posted: { th: 'เข้า Oracle สำเร็จ', icon: 'send', desc: 'ตั้งหนี้ใน Oracle Payables สำเร็จ · ปิดงาน 100%' },
    Rejected: { th: 'ปฏิเสธ', icon: 'ban', desc: 'ถูกปฏิเสธ · เหตุผลบันทึกใน Audit Log' },
    Superseded: { th: 'ถูกแทนที่', icon: 'layers', desc: 'ฉบับเก่าที่ถูกฉบับใหม่แทนที่ (DR-01 / DR-02)' },
    Duplicate: { th: 'เอกสารซ้ำ', icon: 'copy', desc: 'ซ้ำกับเอกสารที่สมบูรณ์หรือ Confirmed แล้ว หรือใบรับเป็นของใบแจ้งหนี้อื่น (DR-03 / DR-04 / DR-06) · Reject ได้อย่างเดียว' },
  })

/** Roles that may see the duplicate-resolution group (EU / ADM do not). */
export const DUP_GROUP_ROLES: readonly string[] = ['ACC', 'APR', 'SA']

export interface ClosedGroupDef {
  key: ClosedGroup
  label: string
  hint: string
  statuses: readonly ClosedStatus[]
}

/**
 * v5.10 — "ผลการส่งเอกสาร" for the Receiver (EU): what happened to what they sent.
 * No Duplicate (internal to accounting), AP Flow in one tab with the stage shown per row.
 */
export const EU_RESULT_GROUPS: readonly ClosedGroupDef[] = Object.freeze([
  { key: 'ap', label: 'ส่งจ่ายแล้ว', hint: 'ฝ่ายบัญชีอนุมัติแล้ว · ดูขั้นตอนการจ่ายในแต่ละรายการ', statuses: ['Confirmed', 'Sent', 'Posted'] },
  { key: 'rejected', label: 'ถูกปฏิเสธ', hint: 'เอกสารที่ฝ่ายบัญชีปฏิเสธ พร้อมเหตุผล', statuses: ['Rejected'] },
  { key: 'sup', label: 'ถูกแทนที่', hint: 'ฉบับเก่าที่ถูกเอกสารใหม่ของคุณแทนที่', statuses: ['Superseded'] },
] as ClosedGroupDef[])

/** Tabs of the closed / result page for a role (ADM: none). */
export function closedGroupsFor(role: string): readonly ClosedGroupDef[] {
  const r = String(role || '').toUpperCase()
  if (r === 'ADM') return []
  if (r === 'EU') return EU_RESULT_GROUPS
  return CLOSED_GROUPS as readonly ClosedGroupDef[]
}

/** Every status the role sees on that page. */
export function closedStatusesFor(role: string): ClosedStatus[] {
  return closedGroupsFor(role).flatMap(g => g.statuses)
}

export function isClosedViewStatus(s: string): s is ClosedStatus {
  return (CLOSED_VIEW_STATUSES as readonly string[]).includes(s)
}

/** Group of a status for a role ('' role = the accounting layout). */
export function groupOf(s: string, role = 'ACC'): ClosedGroup | null {
  return closedGroupsFor(role).find(g => (g.statuses as readonly string[]).includes(s))?.key ?? null
}

/** @deprecated v5.10 — use closedGroupsFor(role). Kept for callers that only need the keys. */
export function groupsForRole(role: string): ClosedGroup[] {
  return closedGroupsFor(role).map(g => g.key)
}

/** True when `role` sees this status on the closed / result page. */
export function closedVisibleFor(status: string, role: string): boolean {
  return (closedStatusesFor(role) as string[]).includes(status)
}

// ---------------------------------------------------------------------------------------------
// Sent that stays too long (APR / SA warning)
// ---------------------------------------------------------------------------------------------

export const SENT_STALE_DAYS = 2

export function todayIso(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** Whole days since the document was sent (closure date); null when unknown. */
export function sentAgeDays(d: InvoiceDoc, today = todayIso()): number | null {
  if (d.status !== 'Sent') return null
  const sent = closureOf(d).date
  if (!sent) return null
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${sent}T00:00:00Z`)
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 864e5)) : null
}

export function isSentStale(d: InvoiceDoc, today = todayIso(), days = SENT_STALE_DAYS): boolean {
  const age = sentAgeDays(d, today)
  return age !== null && age > days
}

// ---------------------------------------------------------------------------------------------
// Closure: who / when / why a document was closed
// ---------------------------------------------------------------------------------------------

const ISO = /^\d{4}-\d{2}-\d{2}$/
const day = (s?: string | null) => {
  const d = String(s ?? '').slice(0, 10)
  return ISO.test(d) ? d : ''
}

/** Words that identify the history entry which closed the document, per status. */
const CLOSING_WORDS: Record<ClosedStatus, RegExp> = {
  Confirmed: /confirm|ยืนยัน|อนุมัติ/i,
  Sent: /sent|ส่ง|batch/i,
  Posted: /post|oracle|ตั้งหนี้/i,
  Rejected: /reject|ปฏิเสธ/i,
  Superseded: /supersed|แทนที่/i,
  Duplicate: /duplicate|ซ้ำ/i,
}

export interface Closure {
  /** YYYY-MM-DD, '' when unknown. */
  date: string
  time: string
  who: string
  /** What happened (history `act`). */
  act: string
  /** Why (history detail / reason / note). */
  reason: string
  /** Reference shown in the table: batch, AP id, replacing / original document + rule. */
  ref: string
  /** Document id the reference points to (clickable), if any. */
  refDoc?: string
}

/**
 * The closing event = the most recent history entry that matches the status (history is appended
 * in time order), else the most recent entry. Never throws; every field is a string.
 */
export function closureOf(d: InvoiceDoc): Closure {
  const st = d.status as ClosedStatus
  const hist: DocumentHistoryEntry[] = Array.isArray(d.history) ? d.history : []
  const words = CLOSING_WORDS[st]
  let entry: DocumentHistoryEntry | undefined
  for (let i = hist.length - 1; i >= 0 && !entry; i--) {
    const h = hist[i]
    if (words && words.test(`${h.act ?? ''} ${h.d ?? ''}`)) entry = h
  }
  // No matching event: the last entry only gives a date — its text (e.g. the Engine verdict) is not
  // the reason the document was closed, so it is not shown as one.
  const matched = !!entry
  entry = entry ?? hist[hist.length - 1]

  let ref = ''
  let refDoc: string | undefined
  switch (st) {
    case 'Confirmed':
      ref = d.confirmedBy ? `ยืนยันโดย ${d.confirmedBy}` : ''
      break
    case 'Sent':
    case 'Posted':
      ref = [d.batch ? `Batch ${d.batch}` : '', d.apId ? `AP ${d.apId}` : ''].filter(Boolean).join(' · ')
      break
    case 'Superseded':
      refDoc = d.supersededBy || undefined
      ref = [refDoc ? `แทนโดย ${refDoc}` : '', d.supRule || ''].filter(Boolean).join(' · ')
      break
    case 'Duplicate':
      refDoc = d.duplicate_of || undefined
      ref = [refDoc ? `ซ้ำกับ ${refDoc}` : '', d.dupRule || ''].filter(Boolean).join(' · ')
      break
  }

  const reason = matched ? String(entry?.rs || entry?.d || entry?.nt || '').trim() : ''
  const date =
    (st === 'Confirmed' && day(d.confirmedAt)) || day(entry?.dt) || day(d.up) || ''

  return {
    date,
    time: matched || !(st === 'Confirmed' && day(d.confirmedAt)) ? String(entry?.t ?? '') : '',
    who: String((st === 'Confirmed' && d.confirmedBy) || (matched ? entry?.who : '') || ''),
    act: matched ? String(entry?.act ?? '') : '',
    reason,
    ref: ref || (st === 'Rejected' ? reason : ''),
    refDoc,
  }
}

/** Closing date for the date filter ("วันที่ปิดงาน"). */
export function closedDateOf(d: InvoiceDoc): string {
  return isClosedViewStatus(d.status) ? closureOf(d).date : ''
}

// ---------------------------------------------------------------------------------------------
// Ordering + CSV export
// ---------------------------------------------------------------------------------------------

/** Newest closing first; stable tiebreak on document id. */
export function sortClosed(docs: InvoiceDoc[]): InvoiceDoc[] {
  return [...docs].sort((a, b) => {
    const c = closedDateOf(b).localeCompare(closedDateOf(a))
    return c !== 0 ? c : a.doc.localeCompare(b.doc)
  })
}

/** CSV cell: quoted, quotes doubled, and spreadsheet formulas neutralised (=, +, -, @, tab, CR). */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export const CSV_COLUMNS: ReadonlyArray<[string, (d: InvoiceDoc, c: Closure) => unknown]> = [
  ['DMS', d => d.doc],
  ['เลขที่ใบแจ้งหนี้', d => d.inv],
  ['บริษัท', d => d.company],
  ['ผู้ขาย', d => d.vendor],
  ['Tax ID', d => d.stax],
  ['PO', d => d.po ?? ''],
  ['ใบรับ', d => d.rcv ?? ''],
  ['วันที่ใบแจ้งหนี้', d => d.dt],
  ['ยอดรวม', d => (typeof d.total === 'number' ? d.total.toFixed(2) : '')],
  ['สถานะ', d => d.status],
  ['สถานะ (ไทย)', d => CLOSED_STATUS_META[d.status as ClosedStatus]?.th ?? ''],
  ['วันที่ปิด', (_d, c) => c.date],
  ['ปิดโดย', (_d, c) => c.who],
  ['เหตุการณ์', (_d, c) => c.act],
  ['เหตุผล', (_d, c) => c.reason],
  ['อ้างอิง', (_d, c) => c.ref],
]

/** UTF-8 CSV with BOM (Excel opens Thai correctly), CRLF line ends. */
export function closedDocsCsv(docs: InvoiceDoc[]): string {
  const head = CSV_COLUMNS.map(([h]) => csvCell(h)).join(',')
  const rows = docs.map(d => {
    const c = closureOf(d)
    return CSV_COLUMNS.map(([, f]) => csvCell(f(d, c))).join(',')
  })
  return '\ufeff' + [head, ...rows].join('\r\n') + '\r\n'
}

/** Trigger a browser download; returns false when the environment cannot (SSR / old browser). */
export function downloadCsv(filename: string, csv: string): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return false
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
