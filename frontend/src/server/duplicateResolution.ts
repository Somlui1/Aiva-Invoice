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
 *   DR-07  nothing matches, or the document is UNRESOLVED → new document, never auto-matched
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

export type DrRule = 'DR-01' | 'DR-02' | 'DR-03' | 'DR-04' | 'DR-05' | 'DR-07'
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
  /** Set for DR-03 / DR-04: the current document the new one duplicates. */
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
 * How (if at all) `candidate` is "the same invoice" as the new document.
 *
 *  - UNRESOLVED (either side) never matches: no reliable key, no automatic matching.
 *  - RESOLVED new   → primary key `receive_id`. A previous NOT_FOUND document has no receive_id, so
 *                     it is located through the secondary key (NOT_FOUND → RESOLVED).
 *  - NOT_FOUND new  → secondary key. Any earlier document carrying the same supplier_tax_id +
 *                     invoice_num is the same invoice, including one that has meanwhile been
 *                     RESOLVED — otherwise a re-scan whose lookup failed could slip past a
 *                     Confirmed document and be paid twice.
 *  Two RESOLVED documents with different receive_ids are different receipts even if the invoice
 *  number happens to be equal, so the secondary key is deliberately NOT used between them.
 */
export function matchKind(identity: DocumentIdentity, c: DrCandidate): DrMatchedBy | null {
  if (identity.status === 'UNRESOLVED') return null
  if (c.identityStatus === 'UNRESOLVED' || c.identityStatus == null) return null

  if (identity.status === 'RESOLVED') {
    if (identity.receiveId && c.receiveId && c.receiveId === identity.receiveId) return 'RECEIVE_ID'
    if (c.identityStatus === 'NOT_FOUND' && identity.secondaryKey && c.secondaryKey === identity.secondaryKey) {
      return 'SECONDARY_KEY'
    }
    return null
  }

  // NOT_FOUND
  if (identity.secondaryKey && c.secondaryKey === identity.secondaryKey) return 'SECONDARY_KEY'
  return null
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
 * tie. (An APR `dup_override` can legitimately leave two open rows for one invoice.)
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
