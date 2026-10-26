'use client'

/**
 * The 3-state evidence button (plan F5).
 *
 *   located    solid button   · target icon · "หน้า N" (· "3 กล่อง")   → turns to the page, lights the box
 *   unlocated  dashed button  · info icon   · "ไม่มีตำแหน่ง"             → PDF stays put, banner explains
 *   none       nothing rendered (rule passed / skipped / no finding)
 *
 * A review finding (manual_review, no exception code) gets the same two states with a neutral colour.
 * The state is decided by `findingState()` only — never re-derived here.
 */
import type { MouseEvent } from 'react'
import { Icon } from '../common/Icon'
import type { Finding } from '../../types/invoice'
import { findingState, MISSING_REASON_TH } from '../../features/evidence/findings'

export interface EvidenceButtonProps {
  finding?: Finding | null
  onOpen: (finding: Finding) => void
  /** Marks the button of the finding currently shown in the dock. */
  active?: boolean
  /** `compact`: icon + page only (table rows, finding lists). */
  compact?: boolean
}

export function EvidenceButton({ finding, onOpen, active = false, compact = false }: EvidenceButtonProps) {
  if (!finding) return null
  const state = findingState(finding)
  const review = finding.kind === 'review'
  const page = finding.targets[0]?.pageNo
  const boxes = finding.targets.length

  const label =
    state === 'located'
      ? `หน้า ${page}${boxes > 1 && !compact ? ` · ${boxes} กล่อง` : ''}`
      : 'ไม่มีตำแหน่ง'
  const title =
    state === 'located'
      ? `ดูหลักฐานบนเอกสาร หน้า ${page}${boxes > 1 ? ` (${boxes} กล่อง)` : ''}`
      : `ไม่พบตำแหน่งบนเอกสาร — ${MISSING_REASON_TH[finding.missingReason ?? 'UNKNOWN']}`

  const handle = (e: MouseEvent) => {
    e.stopPropagation() // the card around the button has its own click
    onOpen(finding)
  }

  return (
    <button
      type="button"
      className={[
        'evbtn',
        state === 'located' ? 'loc' : 'noloc',
        review ? 'review' : '',
        active ? 'on' : '',
        compact ? 'compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-state={state}
      data-finding={finding.id}
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={handle}
    >
      <Icon name={state === 'located' ? 'target' : 'info'} size="sm" />
      <span>{label}</span>
    </button>
  )
}

export default EvidenceButton
