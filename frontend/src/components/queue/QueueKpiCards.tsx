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
  bind: { icon: 'key', color: 'var(--t-teal)', bg: 'var(--t-teal-bg)' },
  apflow: { icon: 'send', color: 'var(--t-navy)', bg: 'var(--s-200)' }
}

interface KpiDef {
  k: string
  label: string
  /** v5.15: one-line hint under the number (EU cards) */
  hint?: string
  /** v5.15: primary call-to-action card (accent) */
  accent?: boolean
  /** v5.15: progress-only card — documents are read-only */
  ro?: boolean
}

/** v5.15: EU cards ordered by what the user must do (SRS: EU sees only own Oracle receivers). */
export const EU_KPI_DEFS: KpiDef[] = [
  { k: 'all', label: 'ทั้งหมด', hint: 'เอกสารในขอบเขต Receiver' },
  { k: 'mine', label: 'ต้องดำเนินการ', hint: 'รอคุณแก้ไข PO / ใบรับ', accent: true },
  { k: 'Review', label: 'Review', hint: 'ระบบตรวจพบจุดที่ต้องตรวจ' },
  { k: 'Hold', label: 'Hold', hint: 'ถูกพักไว้ชั่วคราว' },
  { k: 'Auto-pass', label: 'ผ่านอัตโนมัติ', hint: 'ตรวจผ่านครบทุกเงื่อนไข' },
  { k: 'apflow', label: 'ส่งบัญชีแล้ว', hint: 'Confirmed / Sent / Posted', ro: true }
]

const DAY_MS = 864e5
function ageDays(up: string, now: number): number {
  const t = new Date(up.length <= 10 ? up + 'T00:00:00Z' : up).getTime()
  return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / DAY_MS)) : 0
}

export function QueueKpiCards() {
  const { currentUser } = useAuth()
  const { statusFilter, setStatusFilter, kpiCounts, visibleDocs } = useInvoices()
  const { orgSettings } = useSettings()

  const isEu = currentUser.role === 'EU'
  const keys: KpiDef[] = isEu
    ? EU_KPI_DEFS
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

  // v5.15: ages are measured against "now" (was a fixed 2026-10-07 mock date)
  const now = Date.now()
  const staleUnresCount = visibleDocs.filter(
    d => !!d.unres && d.status === 'Manual Review' && ageDays(d.up, now) > orgSettings.staleDays
  ).length
  const staleMineCount = isEu
    ? visibleDocs.filter(
        d => d.assigned === 'eu' && !['Confirmed', 'Sent', 'Posted', 'Rejected', 'Superseded', 'Duplicate'].includes(d.status) &&
          ageDays(d.up, now) > orgSettings.staleDays
      ).length
    : 0

  return (
    <div className={`kpis ${isEu ? 'kpis-eu' : ''}`} id="kpis">
      {keys.map(({ k, label, hint, accent, ro }) => {
        const meta = KPI_META[k] || KPI_META.all
        const count = kpiCounts[k] || 0
        const isActive = statusFilter === k

        return (
          <button
            key={k}
            type="button"
            className={[
              'kpi',
              isActive ? 'on' : '',
              accent ? 'kpi-accent' : '',
              ro ? 'kpi-ro' : '',
              count === 0 ? 'kpi-zero' : ''
            ].filter(Boolean).join(' ')}
            aria-pressed={isActive}
            title={hint ? `${label} — ${hint}` : label}
            onClick={() => setStatusFilter(k)}
          >
            <span className="k-l">
              {label}
              {k === 'unres' && staleUnresCount > 0 && (
                <span className="kst">ค้างนาน {staleUnresCount}</span>
              )}
              {k === 'mine' && staleMineCount > 0 && (
                <span className="kst">เกิน {orgSettings.staleDays} วัน {staleMineCount}</span>
              )}
              {ro && <span className="k-ro">ดูอย่างเดียว</span>}
            </span>
            <span className="k-v">{count}</span>
            {hint && <span className="k-h">{hint}</span>}
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
