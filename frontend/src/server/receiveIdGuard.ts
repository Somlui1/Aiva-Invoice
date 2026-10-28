/**
 * receive_id guard (v5.11) — one receive_id may be held by ONE document in the AP flow.
 *
 * "Holding" = status Confirmed, Sent, Posted or Import Failed. These are the same document at
 * different points of its AP life (Confirm → Sent → Posted / Import Failed), so a second document
 * with that receive_id is refused at Confirm, at "ผูกใบรับ" and at batch creation.
 * Rejected / Superseded / Duplicate never hold a receive_id (they are history).
 *
 * No schema change: the check reads the existing `receiveId` column, and `receiptNum` for rows
 * written before v5.6. Callers run it inside the same interactive transaction as their write
 * (SQLite serialises writers, so the check and the write cannot interleave with another request).
 *
 * Limit: only documents in the Portal database are seen. An invoice posted straight in Oracle shows
 * up when the batch is sent (Oracle answers ALREADY_EXISTS → Posted, see the AP callback).
 */
import { RECEIVE_HOLDER_STATUSES } from '../lib/docTransitions'
import { normalizeReceiveId } from './businessKey'

export interface ReceiveHolder {
  id: string
  status: string
  receiveId: string | null
  receiptNum: string | null
  confirmedAt: Date | string | null
  isLocked?: boolean | null
}

/** The receive_id a row carries: the v5.6 column, else the receipt number older rows stored. */
export function receiveIdOf(row: { receiveId?: string | null; receiptNum?: string | null }): string | null {
  return normalizeReceiveId(row.receiveId ?? null) ?? normalizeReceiveId(row.receiptNum ?? null)
}

/** The document already holding `receiveId` in the AP flow, other than `excludeIds`; null if none. */
export async function findReceiveIdHolder(db: any, receiveId: string | null, excludeIds: string[] = []): Promise<ReceiveHolder | null> {
  const rid = normalizeReceiveId(receiveId)
  if (!rid) return null
  const rows: ReceiveHolder[] = await db.document.findMany({
    where: {
      id: { notIn: excludeIds },
      status: { in: [...RECEIVE_HOLDER_STATUSES] },
      OR: [{ receiveId: rid }, { receiptNum: rid }],
    },
    select: { id: true, status: true, receiveId: true, receiptNum: true, confirmedAt: true, isLocked: true },
  })
  // receiptNum is matched raw by the query; re-check normalised so a formatting difference cannot slip.
  const hit = rows.filter(r => receiveIdOf(r) === rid)
  return hit.length ? [...hit].sort(holderOrder)[0] : null
}

/** Thai message for a refused action. */
export function holderMessage(receiveId: string, h: Pick<ReceiveHolder, 'id' | 'status'>): string {
  return `ใบรับ ${receiveId} ถูกใช้โดย ${h.id} (${h.status}) แล้ว · 1 ใบรับส่งเข้า AP ได้ฉบับเดียว`
}

const t = (v: Date | string | null | undefined): number => {
  if (v == null) return Number.POSITIVE_INFINITY
  const n = v instanceof Date ? v.getTime() : new Date(v).getTime()
  return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n
}

/** Already sent / posted beats merely confirmed; then the earliest Confirm; id breaks a tie. */
function holderOrder(a: ReceiveHolder, b: ReceiveHolder): number {
  const stage = (s: string) => (s === 'Confirmed' ? 1 : 0)
  return stage(a.status) - stage(b.status) || t(a.confirmedAt) - t(b.confirmedAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

export interface BatchPartition {
  send: string[]
  duplicates: { id: string; duplicateOf: string; receiveId: string }[]
}

/**
 * Which selected (Confirmed) documents may go into a batch. Per receive_id one document wins:
 * a holder outside the batch that is already Sent / Posted / Import Failed, otherwise the earliest
 * Confirm among the selected documents and the Confirmed holders outside the batch. Every other
 * selected document of that receive_id becomes Duplicate; the rest of the batch is sent normally.
 * Normally nothing is excluded (the Confirm guard already prevents a second holder) — this is the
 * safety net for rows written before v5.11.
 */
export function partitionBatch(selected: readonly ReceiveHolder[], outsideHolders: readonly ReceiveHolder[]): BatchPartition {
  const out: BatchPartition = { send: [], duplicates: [] }
  const groups = new Map<string, ReceiveHolder[]>()
  for (const d of selected) {
    const rid = receiveIdOf(d)
    if (!rid) {
      out.send.push(d.id) // no receive_id to compare (legacy row) — not this guard's call
      continue
    }
    groups.set(rid, [...(groups.get(rid) ?? []), d])
  }
  for (const [rid, docs] of groups) {
    const outside = outsideHolders.filter(h => receiveIdOf(h) === rid && !docs.some(d => d.id === h.id))
    const winner = [...docs, ...outside].sort(holderOrder)[0]
    for (const d of docs) {
      if (d.id === winner.id) out.send.push(d.id)
      else out.duplicates.push({ id: d.id, duplicateOf: winner.id, receiveId: rid })
    }
  }
  return out
}
