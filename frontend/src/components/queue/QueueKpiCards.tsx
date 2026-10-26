'use client'

import { Icon, IconName } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useInvoices } from '../../context/InvoiceContext'
import { useSettings } from '../../context/SettingsContext'

interface KpiMeta {
  icon: IconName
  color: string
  bg: string
}

const KPI_META: Record<string, KpiMeta> = {
  all: { icon: 'layers', color: 'var(--t-blue)', bg: 'var(--t-blue-bg)' },
  mine: { icon: 'user', color: 'var(--t-org)', bg: 'var(--t-org-bg)' },
  'Auto-pass': { icon: 'checkc', color: 'var(--t-ok)', bg: 'var(--t-ok-bg)' },
  Review: { icon: 'clock', color: 'var(--t-warn)', bg: 'var(--t-warn-bg)' },
  Hold: { icon: 'pause', color: 'var(--t-err)', bg: 'var(--t-err-bg)' },
  'Manual Review': { icon: 'alert', color: 'var(--t-vio)', bg: 'var(--t-vio-bg)' },
  Duplicate: { icon: 'copy', color: 'var(--t-org)', bg: 'var(--t-org-bg)' },
  Confirmed: { icon: 'check', color: 'var(--t-blue)', bg: 'var(--t-blue-bg)' },
  Posted: { icon: 'send', color: 'var(--t-navy)', bg: 'var(--s-200)' },
  Superseded: { icon: 'layers', color: 'var(--s-500)', bg: 'var(--s-100)' },
  Rejected: { icon: 'ban', color: 'var(--s-500)', bg: 'var(--s-100)' },
  unres: { icon: 'alert', color: 'var(--t-vio)', bg: 'var(--t-vio-bg)' },
  bind: { icon: 'key', color: 'var(--t-teal)', bg: 'var(--t-teal-bg)' }
}

export function QueueKpiCards() {
  const { currentUser } = useAuth()
  const { statusFilter, setStatusFilter, kpiCounts, visibleDocs } = useInvoices()
  const { orgSettings } = useSettings()

  const isEu = currentUser.role === 'EU'
  const keys = isEu
    ? [
        { k: 'mine', label: 'รอฉันแก้ไข' },
        { k: 'all', label: 'ใบรับของฉัน' },
        { k: 'Hold', label: 'Hold' },
        { k: 'Review', label: 'Review' },
        { k: 'Rejected', label: 'ปฏิเสธ' },
        { k: 'Superseded', label: 'ถูกแทนที่' }
      ]
    : [
        { k: 'all', label: 'ทั้งหมด' },
        { k: 'Auto-pass', label: 'Auto-pass' },
        { k: 'Review', label: 'Review' },
        { k: 'Hold', label: 'Hold' },
        { k: 'Manual Review', label: 'Manual Review' },
        { k: 'unres', label: 'ไม่ทราบเจ้าของ' },
        { k: 'bind', label: 'รอผูกบัญชี' },
        { k: 'Duplicate', label: 'ซ้ำ (Portal)' },
        { k: 'Superseded', label: 'ถูกแทนที่' }
      ]

  // Count stale unres
  const staleUnresCount = visibleDocs.filter(d => {
    if (!d.unres || d.status !== 'Manual Review') return false
    const days = Math.max(
      0,
      Math.round((new Date('2026-10-07T00:00:00Z').getTime() - new Date(d.up + 'T00:00:00Z').getTime()) / 864e5)
    )
    return days > orgSettings.staleDays
  }).length

  return (
    <div className="kpis" id="kpis">
      {keys.map(({ k, label }) => {
        const meta = KPI_META[k] || KPI_META.all
        const count = kpiCounts[k] || 0
        const isActive = statusFilter === k

        return (
          <button
            key={k}
            type="button"
            className={`kpi ${isActive ? 'on' : ''}`}
            aria-pressed={isActive}
            onClick={() => setStatusFilter(k)}
          >
            <span className="k-l">
              {label}
              {k === 'unres' && staleUnresCount > 0 && (
                <span className="kst">ค้างนาน {staleUnresCount}</span>
              )}
            </span>
            <span className="k-v">{count}</span>
            <span
              className="k-i"
              style={{ background: meta.bg, color: meta.color }}
            >
              <Icon name={meta.icon} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default QueueKpiCards
