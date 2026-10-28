/**
 * Document workflow transitions — ONE table for the queue buttons (src/lib/queueFilters.ts) and the
 * server (server/routes/documents.ts). Pure, no React, no database.
 *
 * Before v5.11 the UI and the server each had their own copy and they disagreed (a Hold with a
 * receipt showed Confirm, the server answered 422; Duplicate showed "Confirm" that the server turned
 * into Review). Both sides now ask this module.
 *
 * Rules (1 invoice = 1 receive_id):
 *   • A document needs a receipt (receive_id) before it can be Confirmed. A document without one is
 *     confirmed through "ผูกใบรับ" (bind receipt), never through this table.
 *   • Duplicate → Reject only. Superseded / Rejected / Sent / Posted → nothing.
 *   • Manual Review decided as pass → Confirmed directly (no second click through Review).
 *   • Hold with a receipt → Confirm allowed, reason required.
 *   • The receive_id guard (no second holder of one receive_id) is NOT here: it needs the database
 *     and lives in src/server/receiveIdGuard.ts.
 *
 * `role` is optional: the server passes the session role and gets the role checks; the UI leaves it
 * out because it gates by permission (`ctx.can`) instead.
 */

export type WorkflowAction = 'confirm' | 'review' | 'hold' | 'reject' | 'unconfirm' | 'returnf'

/** Statuses that hold ("reserve") a receive_id for AP: one document per receive_id may be in these. */
export const RECEIVE_HOLDER_STATUSES: readonly string[] = Object.freeze(['Confirmed', 'Sent', 'Posted', 'Import Failed'])

/** Closed for every queue action. */
export const CLOSED_STATUSES: readonly string[] = Object.freeze(['Sent', 'Posted', 'Rejected', 'Superseded'])

/** Statuses a receipt can be bound from (the document is still being reviewed). */
export const BINDABLE_STATUSES: readonly string[] = Object.freeze(['Auto-pass', 'Review', 'Hold', 'Manual Review'])

export interface TransitionInput {
  status: string
  identityStatus?: string | null
  /** The document carries a receive_id / receipt number. */
  hasReceipt: boolean
  /** Session role (server). Omit to skip role checks (UI uses permissions). */
  role?: string
}

export type TransitionResult =
  | { ok: true; to: string; reasonRequired: boolean }
  | { ok: false; why: string; http: 403 | 422 | 423 }

const no = (why: string, http: 403 | 422 | 423 = 422): TransitionResult => ({ ok: false, why, http })
const to = (status: string, reasonRequired = true): TransitionResult => ({ ok: true, to: status, reasonRequired })

const isSupervisor = (role?: string) => role === undefined || role === 'APR' || role === 'ADM'

export function transitionFor(input: TransitionInput, action: WorkflowAction): TransitionResult {
  const { status, identityStatus, hasReceipt, role } = input

  if (role === 'EU') return no('End User อัปโหลดเอกสารใหม่ได้อย่างเดียว', 403)
  if (CLOSED_STATUSES.includes(status)) return no('เอกสารปิดหรืออยู่ระหว่าง Import', 423)

  // UNRESOLVED: OCR could not read the lookup keys. Reject (APR) here; the other way out is "ผูกใบรับ".
  if (identityStatus === 'UNRESOLVED' && !RECEIVE_HOLDER_STATUSES.includes(status)) {
    if (role !== undefined && role !== 'APR') return no('เอกสาร UNRESOLVED: เฉพาะหัวหน้าฝ่ายบัญชี (APR) ตัดสินได้', 403)
    return action === 'reject' ? to('Rejected') : no('UNRESOLVED: Reject หรือ "ผูกใบรับ" เท่านั้น')
  }

  if (action === 'unconfirm') {
    if (status !== 'Confirmed') return no('ใช้กับ Confirmed เท่านั้น')
    if (!isSupervisor(role)) return no('การดำเนินการนี้สงวนไว้สำหรับหัวหน้าฝ่ายบัญชี (APR) เท่านั้น', 403)
    return to('Review')
  }
  if (action === 'returnf') return status === 'Import Failed' ? to('Review') : no('ใช้กับ Import Failed เท่านั้น')
  if (status === 'Confirmed' || status === 'Import Failed') return no('ดำเนินการที่หน้า AP Interface')

  if (status === 'Duplicate') {
    return action === 'reject' ? to('Rejected') : no('Duplicate: Reject เท่านั้น (ใบรับนี้มีเอกสารที่ใช้อยู่แล้ว)')
  }

  if (status === 'Manual Review') {
    if (action !== 'confirm' && action !== 'reject') return no('Manual Review: Confirm / Reject เท่านั้น')
    if (!isSupervisor(role)) return no('ตัดสิน Manual Review ได้เฉพาะหัวหน้าฝ่ายบัญชี (APR)', 403)
    if (action === 'reject') return to('Rejected')
    if (!hasReceipt) return no('ยังไม่พบใบรับ')
    return to('Confirmed')
  }

  if (!['Auto-pass', 'Review', 'Hold'].includes(status)) return no('ไม่รองรับ')

  if (status === 'Hold' && !hasReceipt) {
    return action === 'reject' ? to('Rejected') : no('ไม่มี Receiver: Reject เท่านั้น')
  }

  switch (action) {
    case 'confirm':
      if (!hasReceipt) return no('ยังไม่พบใบรับ: ใช้ "ผูกใบรับ" ก่อน')
      // Auto-pass / Review keep the old behaviour (reason from the preset list); Hold needs one.
      return to('Confirmed', status === 'Hold')
    case 'review':
      return status === 'Review' ? no('อยู่ใน Review แล้ว') : to('Review')
    case 'hold':
      return status === 'Hold' ? no('อยู่ใน Hold แล้ว') : to('Hold')
    case 'reject':
      return to('Rejected')
    default:
      return no('ไม่รองรับ')
  }
}

/** Whether "ผูกใบรับ" may start on this document. */
export function canBindReceipt(input: { status: string; identityStatus?: string | null; hasReceipt: boolean; isLocked?: boolean }): {
  ok: boolean
  why?: string
} {
  if (input.isLocked) return { ok: false, why: 'เอกสารถูกล็อก' }
  if (!BINDABLE_STATUSES.includes(input.status)) return { ok: false, why: `สถานะ ${input.status} ผูกใบรับไม่ได้` }
  // Only a document WITHOUT a receipt is bound (NOT_FOUND, UNRESOLVED, or an older row without one).
  if (input.hasReceipt) return { ok: false, why: 'เอกสารมีใบรับแล้ว' }
  return { ok: true }
}
