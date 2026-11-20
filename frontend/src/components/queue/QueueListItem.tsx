'use client'

import { InvoiceDoc } from '../../types/invoice'
import { StatusBadge } from '../common/StatusBadge'
import { todayISO } from '../../context/InvoiceContext'
import { useSettings } from '../../context/SettingsContext'
import { SEVERITY_OF_CODE } from '../../mock/rules'
import { useLive } from '../../context/LiveContext'
import { midTrim, shortStatus, type QueueDensity } from '../../lib/queueLayout'

interface QueueListItemProps {
  doc: InvoiceDoc
  isSelected: boolean
  onClick: () => void
  /**
   * v5.17: `full` (default) = the 4-line card, unchanged · `compact` = 2 lines (Invoice · company /
   * PO · status) · `slim` = Invoice / company · status. Narrow rows still flag an overdue document.
   */
  density?: QueueDensity
  /** Width of the queue column in px — lets narrow rows shorten the invoice number in the middle. */
  width?: number
}

export function QueueListItem({ doc, isSelected, onClick, density = 'full', width = 360 }: QueueListItemProps) {
  const { orgSettings } = useSettings()
  const { freshIds } = useLive()

  const calcAge = (upDate: string): number => {
    return Math.max(
      0,
      Math.round(
        (new Date(todayISO() + 'T00:00:00Z').getTime() - new Date(upDate + 'T00:00:00Z').getTime()) / 864e5
      )
    )
  }

  const age = calcAge(doc.up)
  const amount = doc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  // v5.8: every line that can be cut off carries its full text as a hover tooltip
  const poLine = `PO ${doc.po ?? '—'}${doc.release ? `-${doc.release}` : ''} · ${
    doc.receiver ? `Receiver ${doc.receiver}${doc.receiverActive ? '' : ' (ยังไม่เชื่อมบัญชี)'}` : 'ไม่มี Receiver'
  }`
  const isOld = ['Review', 'Hold', 'Manual Review', 'Duplicate'].includes(doc.status) && age > orgSettings.staleDays

  const tooltip = `${doc.inv} · ${doc.company} · ${doc.status}\n${doc.vendor}\n${poLine}\nยอด ${amount}\nอายุ ${age} วัน${
    isOld ? ` · เกินกำหนด ${orgSettings.staleDays} วัน` : ''
  }`

  if (density !== 'full') {
    const slim = density === 'slim'
    const poFirst = String(doc.po ?? '—').split(',')[0].trim() || '—'
    const poMore = String(doc.po ?? '').split(',').filter(x => x.trim()).length - 1
    // ~7.4px per character at 12.5px bold; the CSS ellipsis is the safety net
    const invChars = slim ? (width - 34 - (isOld ? 10 : 0)) / 7.4 : (width - 92 - (isOld ? 44 : 0)) / 7.4
    const prefix = String(doc.status).split(' ')[0]
    const iconOnly = slim && width < 150
    return (
      <button
        type="button"
        className={`qi qi-${density} ${isSelected ? 'on' : ''}${freshIds.has(doc.doc) ? ' is-fresh' : ''}${isOld ? ' is-old' : ''}`}
        role="option"
        aria-selected={isSelected}
        aria-label={`${doc.inv} ${doc.company} ${doc.status}${isOld ? ` เกินกำหนด ${age} วัน` : ''}`}
        data-doc={doc.doc}
        data-st={prefix}
        onClick={onClick}
        title={tooltip}
      >
        {slim && isOld && <span className="qi-pip" aria-hidden="true" />}
        <div className="r1">
          <span className="inv">{midTrim(doc.inv, invChars)}</span>
          {!slim && isOld && (
            <span className="qi-age" aria-hidden="true">
              {age}d
            </span>
          )}
          {!slim && <span className="co">{doc.company}</span>}
        </div>
        <div className="r2">
          {slim ? <span className="co">{doc.company}</span> : (
            <span className="po">
              PO {midTrim(poFirst, (width - 130) / 6.6)}
              {poMore > 0 && <span className="po-more">+{poMore}</span>}
            </span>
          )}
          <span className={`badge st-${prefix}${iconOnly ? ' ic' : ''}`}>
            <i></i>
            {!iconOnly && shortStatus(doc.status)}
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`qi ${isSelected ? 'on' : ''}${freshIds.has(doc.doc) ? ' is-fresh' : ''}`}
      role="option"
      aria-selected={isSelected}
      data-doc={doc.doc}
      onClick={onClick}
      title={tooltip}
    >
      <div className="r1">
        <span className="inv fit" title={doc.inv}>
          {doc.inv}
          <span className="co">{doc.company}</span>
        </span>
        <StatusBadge status={doc.status} />
      </div>

      <div className="v fit" title={doc.vendor}>
        {doc.vendor}
      </div>

      <div className="r2">
        <span className="fit2" title={poLine}>
          PO {doc.po}
          {doc.release ? `-${doc.release}` : ''} ·{' '}
          {doc.receiver ? (
            <>
              Receiver {doc.receiver}
              {!doc.receiverActive && <span className="warn"> (ยังไม่เชื่อมบัญชี)</span>}
            </>
          ) : (
            <span className="warn">ไม่มี Receiver</span>
          )}
        </span>
        <span className="mono">{amount}</span>
      </div>

      <div className="r3">
        {doc.codes.map(c => (
          <span key={c} className={`code ${SEVERITY_OF_CODE[c] || 'High'}`}>
            {c}
          </span>
        ))}
        <span className="rnd">
          {doc.assigned === 'eu' ? '→ ผู้ใช้งาน' : '→ ฝ่ายบัญชี'} ·{' '}
          <span className={`age ${isOld ? 'old' : ''}`}>อายุ {age} วัน</span>
        </span>
      </div>
    </button>
  )
}

export default QueueListItem
