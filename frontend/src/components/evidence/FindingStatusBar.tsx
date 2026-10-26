'use client'

/**
 * The line above the PDF that says which finding is in focus (plan F6):
 *
 *   [E11] บรรทัด 2 · หน้า 1      ‹ 1/3 ›   ·   รายการ 2/14 ˄ ˅
 *
 *   ‹ ›  the boxes of this finding (Alt+← / Alt+→)
 *   ˄ ˅  the previous / next finding of the document (Alt+↑ / Alt+↓)
 */
import { Icon } from '../common/Icon'
import type { Finding } from '../../types/invoice'
import { findingWhere } from '../../features/evidence/focus'

export interface FindingStatusBarProps {
  finding: Finding
  targetIdx: number
  /** 0-based position of the finding in the document list, and the list length. */
  position: number
  total: number
  onStepTarget: (delta: 1 | -1) => void
  onStepFinding: (delta: 1 | -1) => void
}

export function FindingStatusBar({ finding, targetIdx, position, total, onStepTarget, onStepFinding }: FindingStatusBarProps) {
  const boxes = finding.targets.length
  const tag = finding.code ?? 'ต้องตรวจ'
  return (
    <div className="ev-status" role="status" aria-live="polite" data-finding={finding.id}>
      <span className={`code ${finding.severity ?? 'Low'}${finding.code ? '' : ' review'}`}>{tag}</span>
      <span className="ev-status-where">
        {finding.ruleId} · {findingWhere(finding, targetIdx)}
      </span>
      <span className="grow" />
      {boxes > 1 && (
        <span className="ev-nav" aria-label="กล่องหลักฐานของรายการนี้">
          <button type="button" onClick={() => onStepTarget(-1)} title="กล่องก่อนหน้า (Alt+←)" aria-label="กล่องก่อนหน้า">
            <Icon name="chevL" size="sm" />
          </button>
          <span className="mono">
            {targetIdx + 1}/{boxes}
          </span>
          <button type="button" onClick={() => onStepTarget(1)} title="กล่องถัดไป (Alt+→)" aria-label="กล่องถัดไป">
            <Icon name="chevR" size="sm" />
          </button>
        </span>
      )}
      {total > 1 && (
        <span className="ev-nav" aria-label="รายการหลักฐานของเอกสาร">
          <button type="button" onClick={() => onStepFinding(-1)} title="รายการก่อนหน้า (Alt+↑)" aria-label="รายการก่อนหน้า">
            <Icon name="chevL" size="sm" />
          </button>
          <span className="mono">
            รายการ {position + 1}/{total}
          </span>
          <button type="button" onClick={() => onStepFinding(1)} title="รายการถัดไป (Alt+↓)" aria-label="รายการถัดไป">
            <Icon name="chevR" size="sm" />
          </button>
        </span>
      )}
    </div>
  )
}

export default FindingStatusBar
