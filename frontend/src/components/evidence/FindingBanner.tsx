'use client'

/**
 * Shown in the dock when the finding in focus has no box (plan F6). The PDF has not moved; this says
 * why and what the reviewer needs to check by eye. Every row is always present ("—" when the Engine
 * gave no value), so the layout does not jump between findings.
 */
import { Icon } from '../common/Icon'
import type { Finding } from '../../types/invoice'
import { unlocatedBanner } from '../../features/evidence/findings'

export function FindingBanner({ finding }: { finding: Finding }) {
  const b = unlocatedBanner(finding)
  return (
    <div className="ev-banner" role="status" aria-live="polite" data-finding={finding.id}>
      <Icon name="info" />
      <div className="ev-banner-body">
        <b>ไม่พบตำแหน่งบนเอกสาร</b> — {b.reason}
        {b.message && <div className="ev-banner-msg">{b.message}</div>}
        <dl className="ev-banner-kv">
          <dt>ค่าที่ได้</dt>
          <dd className="mono">{b.actual}</dd>
          <dt>ค่าที่คาดไว้</dt>
          <dd className="mono">{b.expected}</dd>
          {b.related.length > 0 && (
            <>
              <dt>ข้อมูลที่เกี่ยวข้อง</dt>
              <dd className="mono">{b.related.join(', ')}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}

export default FindingBanner
