'use client'

/**
 * v5.7 — date filter attached to the document search box.
 *
 * Filters on **วันที่สร้างเอกสาร** (Portal createdAt) or **วันที่ในใบแจ้งหนี้** (invoice_date), combined
 * (AND) with the text search. Independent of the toolbar's period selector, which keeps working on the
 * "entered the system" date. State lives in InvoiceContext so the table view and the split-view queue
 * share one filter.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { useInvoices } from '../../context/InvoiceContext'
import { EMPTY_DATE_FILTER, isDateFilterActive, type DateSearchField } from '../../lib/queueFilters'

const FIELD_LABEL: Record<DateSearchField, string> = {
  created: 'วันที่สร้างเอกสาร',
  invoice: 'วันที่ในใบแจ้งหนี้',
}

const pad = (n: number) => String(n).padStart(2, '0')
const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const dmy = (iso?: string) => (iso && iso.length >= 10 ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '…')

function preset(k: 'today' | '7d' | '30d' | 'month' | 'lastm'): { from: string; to: string } {
  const now = new Date()
  const today = isoLocal(now)
  if (k === 'today') return { from: today, to: today }
  if (k === '7d' || k === '30d') {
    const d = new Date(now)
    d.setDate(d.getDate() - (k === '7d' ? 6 : 29))
    return { from: isoLocal(d), to: today }
  }
  if (k === 'month') return { from: isoLocal(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
  return {
    from: isoLocal(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to: isoLocal(new Date(now.getFullYear(), now.getMonth(), 0)),
  }
}

const PRESETS: Array<{ k: Parameters<typeof preset>[0]; label: string }> = [
  { k: 'today', label: 'วันนี้' },
  { k: '7d', label: '7 วัน' },
  { k: '30d', label: '30 วัน' },
  { k: 'month', label: 'เดือนนี้' },
  { k: 'lastm', label: 'เดือนก่อน' },
]

export function dateFilterSummary(f: { field: DateSearchField; from?: string; to?: string }): string {
  if (!f.from && !f.to) return ''
  const range = f.from && f.to && f.from === f.to ? dmy(f.from) : `${dmy(f.from)} – ${dmy(f.to)}`
  return `${FIELD_LABEL[f.field]}: ${range}`
}

export function SearchDateFilter({ compact = false }: { compact?: boolean }) {
  const { dateFilter, setDateFilter } = useInvoices()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const active = isDateFilterActive(dateFilter)

  // Close on outside click / Esc (the popover never traps the page).
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const invalid = !!(dateFilter.from && dateFilter.to && dateFilter.from > dateFilter.to)

  return (
    <div className={`sdf${compact ? ' sdf-compact' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`sdf-btn${active ? ' on' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={active ? `ตัวกรองวันที่: ${dateFilterSummary(dateFilter)}` : 'กรองตามวันที่'}
        title={active ? dateFilterSummary(dateFilter) : 'กรองตามวันที่สร้างเอกสาร / วันที่ในใบแจ้งหนี้'}
        onClick={() => setOpen(v => !v)}
      >
        <Icon name="calendar" size="sm" />
        {!compact && <span className="sdf-lbl">{active ? dateFilterSummary(dateFilter) : 'วันที่'}</span>}
        {active && <span className="sdf-dot" aria-hidden="true" />}
      </button>

      {open && (
        <div className="sdf-pop" id={panelId} role="dialog" aria-label="กรองเอกสารตามวันที่">
          <div className="seg sdf-seg" role="radiogroup" aria-label="กรองตาม">
            {(Object.keys(FIELD_LABEL) as DateSearchField[]).map(k => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={dateFilter.field === k}
                className={dateFilter.field === k ? 'on' : ''}
                onClick={() => setDateFilter({ ...dateFilter, field: k })}
              >
                {FIELD_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="sdf-presets">
            {PRESETS.map(p => (
              <button
                key={p.k}
                type="button"
                className="chip"
                onClick={() => setDateFilter({ ...dateFilter, ...preset(p.k) })}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="sdf-range">
            <label>
              <span>ตั้งแต่</span>
              <input
                type="date"
                className="inp"
                aria-label="ตั้งแต่วันที่"
                value={dateFilter.from || ''}
                max={dateFilter.to || undefined}
                onChange={e => setDateFilter({ ...dateFilter, from: e.target.value || undefined })}
              />
            </label>
            <label>
              <span>ถึง</span>
              <input
                type="date"
                className="inp"
                aria-label="ถึงวันที่"
                value={dateFilter.to || ''}
                min={dateFilter.from || undefined}
                onChange={e => setDateFilter({ ...dateFilter, to: e.target.value || undefined })}
              />
            </label>
          </div>
          {invalid && (
            <div className="sdf-warn" role="alert">
              วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด · ระบบสลับช่วงให้อัตโนมัติ
            </div>
          )}
          <p className="sdf-note">
            {dateFilter.field === 'invoice'
              ? 'เอกสารที่ OCR อ่านวันที่ในใบแจ้งหนี้ไม่ได้จะไม่แสดงเมื่อเปิดตัวกรองนี้'
              : 'วันที่ที่เอกสารถูกสร้างใน Portal (รับผลจาก Engine ครั้งแรก)'}
          </p>

          <div className="sdf-foot">
            <button
              type="button"
              className="btn btn-ghost sm"
              disabled={!active}
              onClick={() => setDateFilter({ ...EMPTY_DATE_FILTER, field: dateFilter.field })}
            >
              <Icon name="x" size="sm" />
              ล้างวันที่
            </button>
            <span className="grow" />
            <button type="button" className="btn btn-primary sm" onClick={() => setOpen(false)}>
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchDateFilter
