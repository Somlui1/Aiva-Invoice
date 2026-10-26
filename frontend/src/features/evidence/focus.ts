/**
 * Evidence focus — what the dock is asked to show, as plain data (plan F4).
 *
 * The detail pane says "show me this finding" through `openEvidence()`. Everything the dock needs to
 * decide — which page to turn to, which box to light, whether to move at all — is derived here from
 * the finding, so it is testable without React and the surfaces (detail pane, dock chips, standalone
 * viewer) cannot disagree.
 *
 * The rule that matters: **a finding with no box never moves the PDF.** `page` is absent, `locatable`
 * is false, and the dock only shows the explanation banner.
 */
import type { EvidenceSelection, Finding, InvoiceDoc } from '../../types/invoice'
import { documentFindings, findingPage, findingState } from './findings'

export interface EvidenceDockFocus {
  /** Page to turn to. Absent = the finding has no position: the PDF stays where it is. */
  page?: number
  ruleId?: string
  /** The finding in focus (absent for the legacy "open this rule" request). */
  findingId?: string
  /** Which of the finding's boxes is in focus (‹ n/m ›). */
  targetIdx?: number
  /** `false` = no box to show: do not turn the page, do not scroll, show the banner instead. */
  locatable: boolean
  /** Changes on every request, so asking for the same finding twice scrolls twice. */
  nonce: number
}

/** Index into `finding.targets`, clamped to what exists (0 when there is nothing). */
export function clampTarget(f: Finding, idx = 0): number {
  if (f.targets.length === 0) return 0
  return Math.min(Math.max(Math.trunc(idx) || 0, 0), f.targets.length - 1)
}

export function focusForFinding(f: Finding, targetIdx = 0, nonce: number = Date.now()): EvidenceDockFocus {
  const idx = clampTarget(f, targetIdx)
  const located = findingState(f) === 'located'
  return {
    ...(located ? { page: findingPage(f, idx) } : {}),
    ruleId: f.ruleId,
    findingId: f.id,
    targetIdx: idx,
    locatable: located,
    nonce,
  }
}

/** The legacy "open the dock on this page / rule" request (toolbar button, old callers). */
export function focusForPage(page = 1, ruleId?: string, nonce: number = Date.now()): EvidenceDockFocus {
  return { page, ruleId, locatable: true, nonce }
}

export function selectionForFinding(
  f: Finding,
  targetIdx = 0,
  surface: EvidenceSelection['surface'] = 'pdf',
): EvidenceSelection {
  const idx = clampTarget(f, targetIdx)
  const t = f.targets[idx]
  return {
    ruleId: f.ruleId,
    ...(f.code ? { exceptionCode: f.code } : {}),
    findingId: f.id,
    targetIdx: idx,
    locatable: f.targets.length > 0,
    label: f.code ?? f.ruleId,
    ...(t?.kind === 'row' || t?.kind === 'cell' ? lineOf(t.label) : {}),
    surface,
  }
}

/** `L7 · qty` / `L7` -> `{ lineNo: 7 }` so a row/cell target also marks the row in the lines tab. */
function lineOf(label?: string): { lineNo?: number } {
  const m = /^L(\d+)\b/.exec(label ?? '')
  return m ? { lineNo: Number(m[1]) } : {}
}

/** The id the overlay projector gives a finding's box (`<doc>:<target id>`; never prefixed twice). */
export function viewerBoxId(docId: string, targetId: string): string {
  return targetId.startsWith(`${docId}:`) ? targetId : `${docId}:${targetId}`
}

/** ‹ › over a finding's boxes, wrapping. */
export function stepTarget(f: Finding, idx: number, delta: 1 | -1): number {
  const n = f.targets.length
  if (n <= 1) return 0
  return (((clampTarget(f, idx) + delta) % n) + n) % n
}

/** Previous / next finding in a list (the dock chip order), wrapping; an end when none is active. */
export function stepFinding(
  list: readonly Finding[],
  currentId: string | null | undefined,
  delta: 1 | -1,
): Finding | undefined {
  if (list.length === 0) return undefined
  const i = list.findIndex(f => f.id === currentId)
  if (i < 0) return delta === 1 ? list[0] : list[list.length - 1]
  return list[(((i + delta) % list.length) + list.length) % list.length]
}

/** Looks through the document's findings, including the one rebuilt for a legacy rule. */
export function findFinding(doc: Pick<InvoiceDoc, 'doc' | 'rules'>, findingId?: string | null): Finding | undefined {
  if (!findingId) return undefined
  return documentFindings(doc).find(f => f.id === findingId)
}

/** Short text for a chip / status bar: where the finding points, or that it points nowhere. */
export function findingWhere(f: Finding, targetIdx = 0): string {
  if (f.targets.length === 0) return 'ไม่มีตำแหน่ง'
  const t = f.targets[clampTarget(f, targetIdx)]
  return t.label ? `${t.label} · หน้า ${t.pageNo}` : `หน้า ${t.pageNo}`
}
