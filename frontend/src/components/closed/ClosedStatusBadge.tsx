'use client'

/**
 * v5.9 — status badge of the closed-documents page (spec colours + icons):
 *   Confirmed  blue        check
 *   Sent       teal        send + pulsing dot (in transit)
 *   Posted     navy        send
 *   Rejected   gray        ban
 *   Superseded light gray  layers, struck-through label
 *   Duplicate  orange      copy
 */
import { Icon, type IconName } from '../common/Icon'
import { CLOSED_STATUS_META, type ClosedStatus } from '../../lib/closedDocs'

export function ClosedStatusBadge({
  status,
  lang = 'en',
  size = 'sm',
}: {
  status: string
  /** `en` = Confirmed… · `th` = อนุมัติแล้ว… · `both` = Confirmed · อนุมัติแล้ว */
  lang?: 'en' | 'th' | 'both'
  size?: 'sm' | 'lg'
}) {
  const meta = CLOSED_STATUS_META[status as ClosedStatus]
  if (!meta) {
    return <span className={`cst cst-other cst-${size}`}>{status}</span>
  }
  const text = lang === 'th' ? meta.th : lang === 'both' ? `${status} · ${meta.th}` : status
  return (
    <span className={`cst cst-${status} cst-${size}`} title={`${status} · ${meta.th} — ${meta.desc}`}>
      <Icon name={meta.icon as IconName} size="sm" />
      <span className="cst-t">{text}</span>
      {status === 'Sent' && <i className="cst-pulse" aria-hidden="true" />}
    </span>
  )
}

export default ClosedStatusBadge
