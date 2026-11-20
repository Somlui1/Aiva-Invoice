/**
 * v5.17 — "is this DMS document in THIS Portal's database, and can the queue show it?"
 *
 * Pure part (no Prisma) of POST /api/engine/presence, used by the Engine's reconciler: a Paperless
 * document tagged "AIVA processed" whose answer here is `found: false` never reached this Portal
 * (database reset, another Portal instance, a receipt that could not be confirmed) and is sent back
 * for processing. Read-only; the Engine decides what to do.
 */

export const PRESENCE_ID = /^DMS-\d{1,7}$/
export const PRESENCE_MAX_IDS = 500

/** Engine states a re-delivery may overwrite in place (mirrors ENGINE_RANK in duplicateResolution). */
export const REVALIDATABLE_STATUSES: readonly string[] = Object.freeze(['Auto-pass', 'Review', 'Hold', 'Manual Review'])

export interface PresenceRow {
  id: string
  dmsDocId: string
  status: string
  isLocked: boolean
  companyCode: string | null
  receiverName: string | null
  /** false = the stored payload cannot be read, so the queue skips the row (it is invisible). */
  readable: boolean
}

export interface PresenceEntry {
  found: boolean
  status?: string
  readable?: boolean
  /** A new Engine delivery would be accepted (re-validated in place) rather than refused with 409. */
  revalidatable?: boolean
  company?: string | null
  receiver?: string | null
}

export type PresenceParse = { ok: true; ids: string[] } | { ok: false; error: string }

export function parsePresenceRequest(body: unknown): PresenceParse {
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>).dms_doc_ids : undefined
  if (!Array.isArray(raw)) return { ok: false, error: 'dms_doc_ids: expected an array of "DMS-<n>"' }
  if (raw.length > PRESENCE_MAX_IDS) return { ok: false, error: `dms_doc_ids: at most ${PRESENCE_MAX_IDS} per request` }
  const ids: string[] = []
  for (const v of raw) {
    const s = String(v ?? '').trim()
    if (!PRESENCE_ID.test(s)) return { ok: false, error: `dms_doc_ids: invalid id ${JSON.stringify(v).slice(0, 40)}` }
    if (!ids.includes(s)) ids.push(s)
  }
  return { ok: true, ids }
}

export function buildPresence(ids: string[], rows: PresenceRow[]): Record<string, PresenceEntry> {
  const byKey = new Map<string, PresenceRow>()
  for (const r of rows) {
    byKey.set(r.id, r)
    if (r.dmsDocId) byKey.set(r.dmsDocId, r)
  }
  const out: Record<string, PresenceEntry> = {}
  for (const id of ids) {
    const r = byKey.get(id)
    out[id] = r
      ? {
          found: true,
          status: r.status,
          readable: r.readable,
          revalidatable: !r.isLocked && REVALIDATABLE_STATUSES.includes(r.status),
          company: r.companyCode,
          receiver: r.receiverName,
        }
      : { found: false }
  }
  return out
}
