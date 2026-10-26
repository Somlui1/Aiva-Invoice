/**
 * `/viewer/:id?finding=X3&t=0` — which boxes of the standalone viewer to light (plan F8).
 * Pure: the route reads the query string and the document, this decides.
 */
import type { InvoiceDoc } from '../../types/invoice'
import { MISSING_REASON_TH } from './findings'
import { clampTarget, findFinding } from './focus'

export interface ViewerFocus {
  /** Box ids (`PortalBoundingBox.id`) of the finding; empty when it has no position. */
  ids: string[]
  /** The box to scroll to first (`t`). */
  firstId?: string
  /** One line for the viewer's bar, e.g. "E11 · V-07 · L2 · หน้า 1" or why there is no box. */
  note: string
}

export function parseViewerQuery(search: string): { finding?: string; target: number } {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const finding = q.get('finding') || undefined
  const t = Number.parseInt(q.get('t') ?? '0', 10)
  return { finding, target: Number.isFinite(t) && t > 0 ? t : 0 }
}

export function viewerFocusFor(
  doc: Pick<InvoiceDoc, 'doc' | 'rules'> | null | undefined,
  findingId: string | undefined,
  target = 0,
): ViewerFocus | null {
  if (!doc || !findingId) return null
  const f = findFinding(doc, findingId)
  if (!f) return { ids: [], note: `ไม่พบรายการหลักฐาน ${findingId} ในเอกสารนี้` }
  const tag = `${f.code ?? 'ต้องตรวจ'} · ${f.ruleId}`
  if (f.targets.length === 0) {
    return { ids: [], note: `${tag} · ไม่พบตำแหน่งบนเอกสาร — ${MISSING_REASON_TH[f.missingReason ?? 'UNKNOWN']}` }
  }
  const t = f.targets[clampTarget(f, target)]
  return {
    ids: f.targets.map(x => x.id),
    firstId: t.id,
    note: `${tag} · ${t.label ? `${t.label} · ` : ''}หน้า ${t.pageNo}`,
  }
}
