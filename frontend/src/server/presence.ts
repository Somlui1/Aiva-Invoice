/** v5.17 — database side of POST /api/engine/presence (see presenceCore.ts). */
import { prisma } from '../lib/prisma'
import { parsePortalPayload } from './portalDocs'
import { buildPresence, type PresenceEntry, type PresenceRow } from './presenceCore'

export async function documentPresence(ids: string[]): Promise<Record<string, PresenceEntry>> {
  if (!ids.length) return {}
  const rows = await prisma.document.findMany({
    where: { OR: [{ id: { in: ids } }, { dmsDocId: { in: ids } }] },
    select: { id: true, dmsDocId: true, status: true, isLocked: true, companyCode: true, receiverName: true, payloadJson: true },
  })
  const mapped: PresenceRow[] = rows.map((r: any) => ({
    id: r.id,
    dmsDocId: r.dmsDocId,
    status: r.status,
    isLocked: !!r.isLocked,
    companyCode: r.companyCode ?? null,
    receiverName: r.receiverName ?? null,
    readable: parsePortalPayload({ id: r.id, payloadJson: r.payloadJson }) !== null,
  }))
  return buildPresence(ids, mapped)
}
