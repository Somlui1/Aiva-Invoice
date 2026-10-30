/**
 * v5.14 — Oracle accounts (Receiver names) that really occur on documents, for the RBAC page:
 * when an End User is given an Oracle account, the admin picks from this list instead of typing.
 *
 * Why: an EU sees a document only when one of their accounts equals the document's Receiver
 * (case / space-insensitive, `normalizeReceiverName`). A typo = the user sees nothing.
 *
 * One entry per normalised name: the most frequent spelling, document count, companies, last seen,
 * and which active End Users already have it (a shared account is allowed → a hint, never a block).
 */
import { prisma } from '../lib/prisma'
import { normalizeReceiverName } from '../lib/docScope'

export interface ReceiverRow {
  receiverName: string | null
  companyCode: string
  count: number
  lastSeen?: string | null
}

export interface ReceiverBinding {
  receiverName: string
  userId: string
  userName: string
}

export interface ReceiverEntry {
  name: string
  key: string
  docs: number
  companies: string[]
  lastSeen: string | null
  boundTo: { id: string; name: string }[]
}

/** Pure: fold document rows + bindings into one entry per normalised receiver name. */
export function foldReceivers(rows: readonly ReceiverRow[], bindings: readonly ReceiverBinding[] = []): ReceiverEntry[] {
  const byKey = new Map<string, { spellings: Map<string, number>; docs: number; companies: Set<string>; lastSeen: string | null }>()
  for (const r of rows) {
    const raw = String(r.receiverName ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim()
    const key = normalizeReceiverName(raw)
    if (!key || raw === '—' || raw === '-') continue
    const e = byKey.get(key) ?? { spellings: new Map<string, number>(), docs: 0, companies: new Set<string>(), lastSeen: null }
    e.spellings.set(raw, (e.spellings.get(raw) ?? 0) + r.count)
    e.docs += r.count
    if (r.companyCode) e.companies.add(r.companyCode)
    if (r.lastSeen && (!e.lastSeen || r.lastSeen > e.lastSeen)) e.lastSeen = r.lastSeen
    byKey.set(key, e)
  }
  const bound = new Map<string, Map<string, string>>()
  for (const b of bindings) {
    const k = normalizeReceiverName(b.receiverName)
    if (!k) continue
    const m = bound.get(k) ?? new Map<string, string>()
    m.set(b.userId, b.userName)
    bound.set(k, m)
  }
  return [...byKey.entries()]
    .map(([key, e]) => ({
      key,
      name: [...e.spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      docs: e.docs,
      companies: [...e.companies].sort(),
      lastSeen: e.lastSeen,
      boundTo: [...(bound.get(key) ?? new Map<string, string>()).entries()].map(([id, name]) => ({ id, name })),
    }))
    .sort((a, b) => b.docs - a.docs || a.name.localeCompare(b.name))
}

export async function loadReceiverDirectory(): Promise<ReceiverEntry[]> {
  const grouped: any[] = await (prisma.document as any).groupBy({
    by: ['receiverName', 'companyCode'],
    where: { receiverName: { not: null } },
    _count: { _all: true },
    _max: { updatedAt: true },
  })
  const maps: any[] = await prisma.userReceiverMap.findMany({
    where: { user: { isActive: true, role: 'EU' } },
    select: { receiverName: true, userId: true, user: { select: { name: true } } },
  })
  return foldReceivers(
    grouped.map(g => ({
      receiverName: g.receiverName,
      companyCode: g.companyCode,
      count: g._count?._all ?? 0,
      lastSeen: g._max?.updatedAt ? new Date(g._max.updatedAt).toISOString().slice(0, 10) : null,
    })),
    maps.map(m => ({ receiverName: m.receiverName, userId: m.userId, userName: m.user?.name ?? m.userId })),
  )
}
