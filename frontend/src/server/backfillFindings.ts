/**
 * Backfill `findings` into Portal documents stored before they existed (plan F7).
 *
 * Why: `Document.payloadJson` is written once, at ingest, by the adapter of that day, and an
 * idempotent replay does not transform again. A new adapter therefore never reaches rows already in
 * the database — they keep rendering through `legacyFindings()` (one finding per rule) until rebuilt.
 *
 * What it does: run the *current* adapter on the Engine result the row was built from
 * (`ValidationRun.rawEngineResult`) and copy **only** `rules[].findings` and `bboxes[].findingIds`
 * into the stored payload. Status, history, AP fields — everything the Portal changed since ingest —
 * stay exactly as they are.
 *
 * Pure (no database): `scripts/backfill-findings.ts` does the reading and writing.
 */
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import type { PortalInvoiceDocument } from '../features/engine/types/portalDomain'

export type BackfillSkipReason =
  /** The run's file is not the file this row was built from. */
  | 'DIFFERENT_FILE'
  /** The run is not the one the stored rules came from (a later validation replaced it). */
  | 'STALE_RUN'
  /** The raw Engine result no longer passes the contract. */
  | 'UNREADABLE_RUN'

export type BackfillOutcome =
  | { status: 'updated'; payload: PortalInvoiceDocument; findings: number }
  | { status: 'unchanged' }
  | { status: 'skipped'; reason: BackfillSkipReason; detail?: string }

/** What the Engine said about each rule — the part of the payload that must agree with the run. */
const engineSignature = (p: PortalInvoiceDocument): string =>
  p.rules.map(r => `${r.ruleId}:${r.result}:${r.evidenceIds.join(',')}`).join('|')

export function mergeFindings(stored: PortalInvoiceDocument, rawEngineResult: unknown): BackfillOutcome {
  let fresh: PortalInvoiceDocument
  try {
    fresh = transformEngineResultToPortalDoc(rawEngineResult)
  } catch (e) {
    return { status: 'skipped', reason: 'UNREADABLE_RUN', detail: e instanceof Error ? e.message.slice(0, 200) : String(e) }
  }
  if (stored.id !== fresh.id || stored.fileSha256 !== fresh.fileSha256) {
    return { status: 'skipped', reason: 'DIFFERENT_FILE' }
  }
  if (engineSignature(stored) !== engineSignature(fresh)) {
    return { status: 'skipped', reason: 'STALE_RUN' }
  }

  const freshRules = new Map(fresh.rules.map(r => [r.ruleId, r] as const))
  const freshBoxes = new Map(fresh.bboxes.map(b => [b.id, b] as const))
  const rules = stored.rules.map(r => ({ ...r, findings: freshRules.get(r.ruleId)?.findings ?? [] }))
  const bboxes = stored.bboxes.map(b => ({ ...b, findingIds: freshBoxes.get(b.id)?.findingIds ?? [] }))

  const same =
    stored.rules.every((r, i) => JSON.stringify(r.findings) === JSON.stringify(rules[i].findings)) &&
    stored.bboxes.every((b, i) => JSON.stringify(b.findingIds ?? []) === JSON.stringify(bboxes[i].findingIds))
  if (same) return { status: 'unchanged' }

  return {
    status: 'updated',
    payload: { ...stored, rules, bboxes },
    findings: rules.reduce((n, r) => n + (r.findings?.length ?? 0), 0),
  }
}
