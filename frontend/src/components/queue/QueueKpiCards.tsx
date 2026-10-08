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
  all: { icon: 'layers', color: '#1D4ED8', bg: '#EFF6FF' },
  mine: { icon: 'user', color: '#C2410C', bg: '#FFF7ED' },
  'Auto-pass': { icon: 'checkc', color: '#047857', bg: '#ECFDF5' },
  Review: { icon: 'clock', color: '#B45309', bg: '#FFFBEB' },
  Hold: { icon: 'pause', color: '#B91C1C', bg: '#FEF2F2' },
  'Manual Review': { icon: 'alert', color: '#6D28D9', bg: '#F5F3FF' },
  Duplicate: { icon: 'copy', color: '#C2410C', bg: '#FFF7ED' },
  Confirmed: { icon: 'check', color: '#1D4ED8', bg: '#EFF6FF' },
  Posted: { icon: 'send', color: '#0D274D', bg: '#E2E8F0' },
  Superseded: { icon: 'layers', color: '#64748B', bg: '#F1F5F9' },
  Rejected: { icon: 'ban', color: '#64748B', bg: '#F1F5F9' },
  unres: { icon: 'alert', color: '#6D28D9', bg: '#F5F3FF' },
  bind: { icon: 'key', color: '#0F766E', bg: '#E6F4F3' }
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
