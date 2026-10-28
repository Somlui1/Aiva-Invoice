/**
 * Duplicate resolution (DR-01 … DR-07) — the Portal's decision when a new Engine result arrives for
 * an invoice the Portal may already hold.
 *
 * Pure: it is handed the candidate rows and returns a decision. `ingestEngineResult` loads the
 * candidates and writes the outcome inside one transaction; nothing here touches the database, so
 * every rule below is unit-tested without one (src/test/duplicateResolution.test.ts).
 *
 * The rules (the Document Status Model itself is unchanged):
 *
 *   Compare against the CURRENT document of the invoice — the authoritative one — never simply the
 *   most recently inserted row. Duplicate / Superseded / Rejected rows are history and are ignored
 *   when choosing it.
 *
 *   Engine ranking          Auto-pass (1) > Review (2) > Hold (3) > Manual Review (4)
 *   DR-01  new better        old → Superseded, new = Engine status
 *   DR-02  new equal         old → Superseded, new = Engine status
 *   DR-03  new worse         old stays current, new = Duplicate
 *   DR-04  old Confirmed / Sent / Posted / Import Failed (or locked) → never superseded, new = Duplicate
 *   DR-05  only history rows match (all Duplicate / Superseded / Rejected) → new = Engine status
 *   DR-06  same receive_id but a DIFFERENT invoice (supplier_tax_id + invoice_num) → new = Duplicate.
 *          1 invoice = 1 receive_id, so this is conflicting data, never a second legitimate invoice;
 *          there is no override (v5.11).
 *   DR-07  nothing matches, or the document is UNRESOLVED → new document, never auto-matched
 *
 * v5.11 — 1 invoice = 1 receive_id in both directions:
 *   • same receive_id, different invoice → DR-06 (above)
 *   • same invoice, different receive_id → the same document; DR-01 … DR-04 apply as usual
 *
 * `decideBind` is the decision for "ผูกใบรับ" (a person binds a receipt to a document that had none).
 */
import type { DocumentIdentity } from './businessKey'

/** The four statuses an Engine result can produce, best first. */
export const ENGINE_RANK: Readonly<Record<string, number>> = Object.freeze({
  'Auto-pass': 1,
  Review: 2,
  Hold: 3,
  'Manual Review': 4,
})

/** A document in one of these is part of the AP flow: a newer scan must never displace it. */
export const PROTECTED_STATUSES: readonly string[] = Object.freeze(['Confirmed', 'Sent', 'Posted', 'Import Failed'])

/** History rows. They never act as the document a new scan is compared with. */
export const IGNORED_STATUSES: readonly string[] = Object.freeze(['Duplicate', 'Superseded', 'Rejected'])

export type DrRule = 'DR-01' | 'DR-02' | 'DR-03' | 'DR-04' | 'DR-05' | 'DR-06' | 'DR-07'
export type DrMatchedBy = 'RECEIVE_ID' | 'SECONDARY_KEY'

/** The columns of an existing `Document` the decision needs. */
export interface DrCandidate {
  id: string
  status: string
  identityStatus: string | null
  receiveId: string | null
  secondaryKey: string | null
  isLocked?: boolean | null
  createdAt: Date | string | number
}

export interface DrDecision {
  rule: DrRule
  /** Status the NEW document is stored with. */
  newStatus: string
  /** The current document the new one was compared with (null for DR-05 / DR-07). */
  current: DrCandidate | null
  matchedBy: DrMatchedBy | null
  /** Set for DR-01 / DR-02: the old document to mark Superseded. */
  supersede: DrCandidate | null
  /** Set for DR-03 / DR-04 / DR-06: the current document the new one duplicates. */
  duplicateOf: DrCandidate | null
  /** One English sentence for logs; the Thai history text is built by the caller. */
  reason: string
}

/** Rank of an Engine status; anything unknown ranks as the worst (Manual Review). */
export const rankOf = (status: string): number => ENGINE_RANK[status] ?? ENGINE_RANK['Manual Review']

/**
 * Unknown statuses are protected on purpose: a row whose state this code does not understand must
 * not be overwritten by an automatic rule.
 */
export function isProtected(c: Pick<DrCandidate, 'status' | 'isLocked'>): boolean {
  if (c.isLocked) return true
  if (PROTECTED_STATUSES.includes(c.status)) return true
  return !(c.status in ENGINE_RANK) && !IGNORED_STATUSES.includes(c.status)
}

/**
 * How (if at all) `candidate` is "the same invoice" (or the same receipt) as the new document.
 *
 *  - UNRESOLVED (either side) never matches: no reliable key, no automatic matching.
 *  - Same receive_id (both sides have one)              → RECEIVE_ID
 *  - Same secondary key (supplier_tax_id + invoice_num) → SECONDARY_KEY, whatever either side's
 *    receive_id is. v5.11: 1 invoice = 1 receive_id, so two RESOLVED rows of one invoice with
 *    different receive_ids are the same document (before v5.11 they were treated as two receipts).
 *  A RECEIVE_ID match whose secondary keys differ is DR-06 in `decide`.
 */
export function matchKind(identity: DocumentIdentity, c: DrCandidate): DrMatchedBy | null {
  if (identity.status === 'UNRESOLVED') return null
  if (c.identityStatus === 'UNRESOLVED' || c.identityStatus == null) return null
  if (identity.receiveId && c.receiveId && c.receiveId === identity.receiveId) return 'RECEIVE_ID'
  if (identity.secondaryKey && c.secondaryKey && c.secondaryKey === identity.secondaryKey) return 'SECONDARY_KEY'
  return null
}

/** Same receive_id but both sides name a different invoice: conflicting data (DR-06). */
export function isReceiveConflict(identity: Pick<DocumentIdentity, 'receiveId' | 'secondaryKey'>, c: DrCandidate): boolean {
  return (
    !!identity.receiveId &&
    c.receiveId === identity.receiveId &&
    !!identity.secondaryKey &&
    !!c.secondaryKey &&
    c.secondaryKey !== identity.secondaryKey
  )
}

const time = (v: Date | string | number): number => {
  const t = v instanceof Date ? v.getTime() : new Date(v).getTime()
  return Number.isNaN(t) ? 0 : t
}

/** Newest first; id breaks a timestamp tie so the choice is deterministic. */
const newestFirst = (a: DrCandidate, b: DrCandidate): number =>
  time(b.createdAt) - time(a.createdAt) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)

/**
 * The authoritative document among the matching rows, or null when only history remains.
 * AP-protected documents win outright; otherwise the best Engine rank; the newest row only breaks a
 * tie. (Two open rows of one invoice can only come from data written before v5.11.)
 */
export function selectCurrent(matching: readonly DrCandidate[]): DrCandidate | null {
  const open = matching.filter(c => !IGNORED_STATUSES.includes(c.status))
  if (open.length === 0) return null
  const protectedRows = open.filter(isProtected)
  if (protectedRows.length) return [...protectedRows].sort(newestFirst)[0]
  return [...open].sort((a, b) => rankOf(a.status) - rankOf(b.status) || newestFirst(a, b))[0]
}

export function decide(input: {
  identity: DocumentIdentity
  /** Engine-derived status of the new document: Auto-pass | Review | Hold | Manual Review. */
  engineStatus: string
  candidates: readonly DrCandidate[]
}): DrDecision {
  const { identity, candidates } = input

  if (identity.status === 'UNRESOLVED') {
    // Always a fresh Manual Review document; the Engine's opinion cannot lift it.
    return {
      rule: 'DR-07',
      newStatus: 'Manual Review',
      current: null,
      matchedBy: null,
      supersede: null,
      duplicateOf: null,
      reason: 'UNRESOLVED: no reliable business key, never auto-matched',
    }
  }

  const engineStatus = input.engineStatus in ENGINE_RANK ? input.engineStatus : 'Manual Review'
  const matches = candidates
    .map(c => ({ c, by: matchKind(identity, c) }))
    .filter((m): m is { c: DrCandidate; by: DrMatchedBy } => m.by !== null)

  if (matches.length === 0) {
    return {
      rule: 'DR-07',
      newStatus: engineStatus,
      current: null,
      matchedBy: null,
      supersede: null,
      duplicateOf: null,
      reason: 'no earlier document for this invoice',
    }
  }

  const current = selectCurrent(matches.map(m => m.c))
  if (!current) {
    return {
      rule: 'DR-05',
      newStatus: engineStatus,
      current: null,
      matchedBy: null,
      supersede: null,
      duplicateOf: null,
      reason: 'earlier documents are all Duplicate / Superseded / Rejected and are not compared',
    }
  }
  const matchedBy = matches.find(m => m.c.id === current.id)!.by

  // DR-06: an open document already carries this receive_id for ANOTHER invoice.
  const conflict = matches.find(m => !IGNORED_STATUSES.includes(m.c.status) && isReceiveConflict(identity, m.c))
  if (conflict) {
    return {
      rule: 'DR-06',
      newStatus: 'Duplicate',
      current: conflict.c,
      matchedBy: 'RECEIVE_ID',
      supersede: null,
      duplicateOf: conflict.c,
      reason: `receive_id ${identity.receiveId} already belongs to another invoice (${conflict.c.id})`,
    }
  }

  if (isProtected(current)) {
    return {
      rule: 'DR-04',
      newStatus: 'Duplicate',
      current,
      matchedBy,
      supersede: null,
      duplicateOf: current,
      reason: `${current.id} is ${current.isLocked ? 'locked' : current.status}; it is never superseded`,
    }
  }

  const rankNew = rankOf(engineStatus)
  const rankOld = rankOf(current.status)
  if (rankNew > rankOld) {
    return {
      rule: 'DR-03',
      newStatus: 'Duplicate',
      current,
      matchedBy,
      supersede: null,
      duplicateOf: current,
      reason: `${engineStatus} is worse than the current ${current.status} (${current.id})`,
    }
  }
  return {
    rule: rankNew < rankOld ? 'DR-01' : 'DR-02',
    newStatus: engineStatus,
    current,
    matchedBy,
    supersede: current,
    duplicateOf: null,
    reason: `${engineStatus} is ${rankNew < rankOld ? 'better than' : 'equal to'} the current ${current.status} (${current.id})`,
  }
}

// ---------------------------------------------------------------------------- ผูกใบรับ (bind receipt)

export interface BindDecision {
  /** Status of the bound document: Confirmed, or Duplicate when the receipt is already held. */
  newStatus: 'Confirmed' | 'Duplicate'
  rule: 'BIND' | 'DR-04' | 'DR-06'
  /** The document holding this receive_id / invoice in the AP flow (Duplicate case). */
  duplicateOf: DrCandidate | null
  /** Open, not-yet-confirmed documents of the same receipt / invoice: they become Superseded. */
  supersede: DrCandidate[]
  reason: string
}

/**
 * A person bound a receipt to a document that had none, after checking the receipt lines.
 * Agreed rules (v5.11):
 *   • a matching document already in the AP flow (Confirmed / Sent / Posted / Import Failed, or
 *     locked) → the bound document becomes Duplicate of it (DR-04, or DR-06 when it is another
 *     invoice on the same receipt); nothing else changes
 *   • otherwise every open matching document (Auto-pass / Review / Hold / Manual Review) becomes
 *     Superseded, and the bound document is Confirmed straight away
 * `identity` is the RESOLVED identity the bound document gets. Candidates must exclude the document
 * itself.
 */
export function decideBind(input: { identity: DocumentIdentity; candidates: readonly DrCandidate[] }): BindDecision {
  const { identity } = input
  const matches = input.candidates.filter(c => matchKind(identity, c) !== null && !IGNORED_STATUSES.includes(c.status))

  const held = matches.filter(isProtected).sort(newestFirst)
  if (held.length) {
    const h = held[0]
    const rule = isReceiveConflict(identity, h) ? 'DR-06' : 'DR-04'
    return {
      newStatus: 'Duplicate',
      rule,
      duplicateOf: h,
      supersede: [],
      reason: `${h.id} already holds this receipt/invoice (${h.isLocked ? 'locked' : h.status})`,
    }
  }
  return {
    newStatus: 'Confirmed',
    rule: 'BIND',
    duplicateOf: null,
    supersede: [...matches].sort(newestFirst),
    reason: matches.length ? `supersedes ${matches.map(m => m.id).join(', ')}` : 'no other open document',
  }
}
