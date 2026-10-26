/**
 * Evidence findings — the unit of the 3-state evidence button.
 * Plan: docs/plans/2026-10-26-evidence-findings-portal-implementation.md (F2)
 *
 *   located    the finding has boxes  -> jump to the page, centre the box, pulse it
 *   unlocated  finding, but no box    -> do NOT move the PDF; show why + actual / expected
 *   none       rule passed / skipped, or no finding at all -> no button
 *
 * Pure functions only: the detail pane, the dock chips and the standalone viewer all decide the
 * state the same way.
 */
import type { Finding, FindingMissingReason, InvoiceDoc, RuleCheck } from '../../types/invoice'

export type FindingState = 'located' | 'unlocated'
export type RuleEvidenceState = FindingState | 'none'

export const MISSING_REASON_TH: Record<FindingMissingReason, string> = {
  NOT_PRESENT: 'ไม่พบข้อมูลนี้บนเอกสาร',
  NOT_LOCATED: 'อ่านค่าได้ แต่ระบุตำแหน่งบนเอกสารไม่ได้',
  PAGES_INCOMPLETE: 'เอกสารสแกนไม่ครบหน้า',
  LOW_CONFIDENCE: 'ระบบไม่มั่นใจผลการอ่าน',
  NO_ELEMENT: 'ระบบไม่ได้สร้างตำแหน่งของข้อมูลนี้',
  UNKNOWN: 'ไม่ทราบตำแหน่ง (engine ไม่ระบุเหตุผล)',
}

export function findingState(f: Finding): FindingState {
  return f.targets.length > 0 ? 'located' : 'unlocated'
}

/**
 * The findings of a rule. Documents mapped from an Engine payload carry `findings`; mock documents
 * and rows stored before findings existed get one finding rebuilt from the rule's own fields
 * (its single `bbox`, if any) — never a box the Engine did not report.
 */
export function findingsOf(r: RuleCheck, doc?: Pick<InvoiceDoc, 'doc'>): Finding[] {
  if (r.findings) return r.findings
  return legacyFindings(r, doc)
}

export function legacyFindings(r: RuleCheck, doc?: Pick<InvoiceDoc, 'doc'>): Finding[] {
  const failing = r.status === 'FAIL' || r.status === 'WARN'
  if (!failing) return []
  const ruleId = r.rule || r.id
  const bb = r.bbox
  const located = !!bb && bb.w > 0 && bb.h > 0
  const page = bb?.page ?? r.page ?? 1
  const f: Finding = {
    id: `${ruleId}#legacy`,
    ruleId,
    kind: r.exception_code ? 'exception' : 'review',
    result: r.result ?? (r.status === 'WARN' ? 'manual_review' : 'fail'),
    code: r.exception_code ?? null,
    severity: r.severity ?? null,
    messageTh: r.detail ?? r.evidence ?? null,
    actual: r.actual ?? null,
    expected: r.expected ?? null,
    relatedElementIds: [],
    oracleRefs: [],
    targets: located
      ? [
          {
            id: `${doc?.doc ?? 'doc'}:${ruleId}`,
            elementId: ruleId,
            pageNo: page,
            bbox: [bb!.x, bb!.y, bb!.w, bb!.h],
            kind: 'other',
            label: r.exception_code ?? ruleId,
          },
        ]
      : [],
  }
  if (!located) {
    f.missingReason = 'UNKNOWN'
    f.missingElementIds = []
  }
  return [f]
}

/** Button state of a whole rule: `none` when it passed / was skipped or has nothing to show. */
export function ruleEvidenceState(r: RuleCheck, doc?: Pick<InvoiceDoc, 'doc'>): RuleEvidenceState {
  if (r.status === 'PASS' || r.status === 'SKIP') return 'none'
  const fs = findingsOf(r, doc)
  if (fs.length === 0) return 'none'
  return fs.some(f => findingState(f) === 'located') ? 'located' : 'unlocated'
}

/** First page a finding points at (`undefined` = unlocated: the PDF must not move). */
export function findingPage(f: Finding, targetIdx = 0): number | undefined {
  const t = f.targets[Math.min(Math.max(targetIdx, 0), f.targets.length - 1)]
  return t?.pageNo
}

/** Every finding of a document, rule order then evidence order — the dock chip strip. */
export function documentFindings(doc: Pick<InvoiceDoc, 'doc' | 'rules'>): Finding[] {
  return (doc.rules ?? []).flatMap(r => (r.status === 'PASS' || r.status === 'SKIP' ? [] : findingsOf(r, doc)))
}

/** The rows of the banner shown for an unlocated finding. */
export function unlocatedBanner(f: Finding): {
  reason: string
  message: string | null
  actual: string
  expected: string
  related: string[]
} {
  return {
    reason: MISSING_REASON_TH[f.missingReason ?? 'UNKNOWN'],
    message: f.messageTh,
    actual: f.actual == null || f.actual === '' ? '—' : String(f.actual),
    expected: f.expected == null || f.expected === '' ? '—' : String(f.expected),
    related: f.fieldName ? [f.fieldName] : (f.missingElementIds ?? []),
  }
}
