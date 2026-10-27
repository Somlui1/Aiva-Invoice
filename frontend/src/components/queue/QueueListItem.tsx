'use client'

import { InvoiceDoc } from '../../types/invoice'
import { StatusBadge } from '../common/StatusBadge'
import { TODAY } from '../../context/InvoiceContext'
import { useSettings } from '../../context/SettingsContext'
import { SEVERITY_OF_CODE } from '../../mock/rules'

interface QueueListItemProps {
  doc: InvoiceDoc
  isSelected: boolean
  onClick: () => void
}

export function QueueListItem({ doc, isSelected, onClick }: QueueListItemProps) {
  const { orgSettings } = useSettings()

  const calcAge = (upDate: string): number => {
    return Math.max(
      0,
      Math.round(
        (new Date(TODAY + 'T00:00:00Z').getTime() - new Date(upDate + 'T00:00:00Z').getTime()) / 864e5
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

  return (
    <button
      type="button"
      className={`qi ${isSelected ? 'on' : ''}`}
      role="option"
      aria-selected={isSelected}
      data-doc={doc.doc}
      onClick={onClick}
      title={`${doc.inv} · ${doc.company} · ${doc.status}\n${doc.vendor}\n${poLine}\nยอด ${amount}`}
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
