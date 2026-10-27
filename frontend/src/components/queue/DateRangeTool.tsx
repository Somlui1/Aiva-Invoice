'use client'

/**
 * v5.8 — Date range tool in the queue toolbar (replaces "ช่วงเวลา <select>" and the v5.7 calendar
 * button that sat inside the search box).
 *
 * One control, one source of truth (`periodFilter`), used by the list, the table, KPI cards,
 * company counts and the "ค้างนอกงวด" banner:
 *
 *   [ 📅  วันที่เข้าระบบ │ เดือนนี้ · 01 ต.ค. – 31 ต.ค. 2026  ▾ ] [✕]
 *
 *  - the trigger always shows WHICH date and WHICH range is applied (affordance = a tool, not a label);
 *  - the panel edits a draft; nothing changes the queue until "ใช้ตัวกรอง" (or a preset click, which
 *    is a complete choice) — so half-typed dates never filter the list;
 *  - live preview: how many documents the draft would show;
 *  - guards: reversed range is swapped, empty custom range is refused, invalid dates (the browser
 *    gives "") are ignored, Esc / outside click cancel the draft, ✕ resets only the range.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { AnchoredPopover } from '../common/AnchoredPopover'
import { useInvoices, perRange, inPerDoc, TODAY, type PeriodFilter, type PeriodField } from '../../context/InvoiceContext'
import type { InvoiceDoc } from '../../types/invoice'

export const FIELD_LABEL: Record<PeriodField, string> = {
  closed: 'วันที่ปิดงาน',
  updated: 'วันที่เข้าระบบ',
  created: 'วันที่สร้างเอกสาร',
  invoice: 'วันที่ในใบแจ้งหนี้',
}
const FIELD_HINT: Record<PeriodField, string> = {
  closed: 'วันที่เอกสารถูกปิด (อนุมัติ / ส่ง / ตั้งหนี้ / ปฏิเสธ / ปิดเพราะซ้ำ) ตามประวัติเอกสาร',
  updated: 'วันที่เอกสารเข้าคิวหรือมีการอัปเดตล่าสุด (ค่าเดิมของระบบ)',
  created: 'วันที่เอกสารถูกสร้างใน Portal (รับผลจาก Engine ครั้งแรก)',
  invoice: 'วันที่ที่พิมพ์บนใบแจ้งหนี้ · เอกสารที่ OCR อ่านวันที่ไม่ได้จะไม่แสดง',
}

const PRESETS: Array<{ k: string; label: string }> = [
  { k: 'all', label: 'ทั้งหมด' },
  { k: 'today', label: 'วันนี้' },
  { k: '7d', label: '7 วันล่าสุด' },
  { k: 'month', label: 'เดือนนี้' },
  { k: 'lastm', label: 'เดือนก่อน' },
]
const PRESET_LABEL: Record<string, string> = {
  all: 'ทั้งหมด',
  today: 'วันนี้',
  '7d': '7 วันล่าสุด',
  month: 'เดือนนี้',
  lastm: 'เดือนก่อน',
  period: 'งวด',
  custom: 'กำหนดเอง',
}

const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const ISO = /^\d{4}-\d{2}-\d{2}$/

/** 2026-10-01 → "01 ต.ค. 2026" (year shown only when needed). */
export function fmtDay(iso: string, withYear = true): string {
  if (!ISO.test(iso)) return '…'
  const [y, m, d] = iso.split('-')
  return `${d} ${TH_MON[+m - 1]}${withYear ? ` ${y}` : ''}`
}

export function rangeText(p: PeriodFilter): string {
  const r = perRange(p)
  if (!r) return 'ทุกช่วงเวลา'
  const [a, b] = r
  const open = (x: string) => x === '0000-01-01' || x === '9999-12-31'
  if (open(a)) return `ถึง ${fmtDay(b)}`
  if (open(b)) return `ตั้งแต่ ${fmtDay(a)}`
  if (a === b) return fmtDay(a)
  return `${fmtDay(a, a.slice(0, 4) !== b.slice(0, 4))} – ${fmtDay(b)}`
}

export function summaryOf(p: PeriodFilter): string {
  const field = FIELD_LABEL[p.field ?? 'updated']
  if (p.k === 'all') return `${field} · ทุกช่วงเวลา`
  const name = p.k === 'period' && p.ym ? `งวด ${p.ym}` : PRESET_LABEL[p.k] ?? p.k
  return `${field} · ${name} · ${rangeText(p)}`
}

/** A draft that is safe to apply (or the reason it is not). */
export function normalizeDraft(d: PeriodFilter): { ok: true; value: PeriodFilter } | { ok: false; why: string } {
  if (d.k === 'custom') {
    const from = d.from && ISO.test(d.from) ? d.from : undefined
    const to = d.to && ISO.test(d.to) ? d.to : undefined
    if (!from && !to) return { ok: false, why: 'กรุณาเลือกวันที่อย่างน้อย 1 ช่อง' }
    if (from && to && from > to) return { ok: true, value: { ...d, from: to, to: from } }
    return { ok: true, value: { ...d, from, to } }
  }
  if (d.k === 'period') {
    const ym = d.ym && /^\d{4}-\d{2}$/.test(d.ym) ? d.ym : TODAY.slice(0, 7)
    return { ok: true, value: { k: 'period', ym, field: d.field } }
  }
  return { ok: true, value: { k: d.k, field: d.field } }
}

export interface DateRangeToolProps {
  /** Controlled value (v5.9 closed page). Omit = the queue's `periodFilter` from context. */
  value?: PeriodFilter
  onChange?: (p: PeriodFilter) => void
  /** Documents for the live count preview (default: every visible document). */
  docs?: InvoiceDoc[]
  /** Date fields offered, in order (default: เข้าระบบ / สร้างเอกสาร / ใบแจ้งหนี้). */
  fields?: PeriodField[]
}

const DEFAULT_FIELDS: PeriodField[] = ['updated', 'created', 'invoice']

export function DateRangeTool({ value, onChange, docs, fields = DEFAULT_FIELDS }: DateRangeToolProps = {}) {
  const ctx = useInvoices()
  const periodFilter = value ?? ctx.periodFilter
  const setPeriodFilter = onChange ?? ctx.setPeriodFilter
  const visibleDocs = docs ?? ctx.visibleDocs
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<PeriodFilter>(periodFilter)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const field: PeriodField = periodFilter.field ?? fields[0]
  const active = periodFilter.k !== 'all'

  // Every open starts from what is applied (a cancelled draft never comes back).
  useEffect(() => {
    if (open) setDraft({ ...periodFilter, field: periodFilter.field ?? fields[0] })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const checked = normalizeDraft(draft)
  const reversed = draft.k === 'custom' && !!draft.from && !!draft.to && draft.from > draft.to
  const previewCount = useMemo(() => {
    const c = normalizeDraft(draft)
    return c.ok ? visibleDocs.filter(d => inPerDoc(d, c.value)).length : 0
  }, [visibleDocs, draft])

  const apply = (value?: PeriodFilter) => {
    const res = normalizeDraft(value ?? draft)
    if (!res.ok) return
    setPeriodFilter(res.value)
    setOpen(false)
    btnRef.current?.focus()
  }

  const setField = (f: PeriodField) => setDraft(d => ({ ...d, field: f }))

  return (
    <div className={`drt${active ? ' is-active' : ''}`} role="group" aria-label="ตัวกรองวันที่">
      <button
        ref={btnRef}
        type="button"
        className="drt-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        title={`${summaryOf(periodFilter)} · คลิกเพื่อเปลี่ยน`}
        onClick={() => setOpen(v => !v)}
      >
        <Icon name="calendar" size="sm" />
        <span className="drt-field">{FIELD_LABEL[field]}</span>
        <span className="drt-div" aria-hidden="true" />
        <span className="drt-val">
          {periodFilter.k === 'all' ? (
            'ทุกช่วงเวลา'
          ) : (
            <>
              <b>{periodFilter.k === 'period' && periodFilter.ym ? `งวด ${periodFilter.ym}` : PRESET_LABEL[periodFilter.k]}</b>
              <span className="drt-range">{rangeText(periodFilter)}</span>
            </>
          )}
        </span>
        <Icon name="chevD" size="sm" className="drt-caret" />
      </button>
      {active && (
        <button
          type="button"
          className="drt-clear"
          aria-label="ล้างช่วงวันที่ (แสดงทุกช่วงเวลา)"
          title="ล้างช่วงวันที่"
          onClick={() => setPeriodFilter({ k: 'all', field })}
        >
          <Icon name="x" size="sm" />
        </button>
      )}

      <AnchoredPopover
        open={open}
        anchorRef={btnRef}
        onClose={() => setOpen(false)}
        id={panelId}
        ariaLabel="เลือกช่วงวันที่"
        width={380}
        className="drt-pop"
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            apply()
          }}
        >
          <fieldset className="drt-sec">
            <legend>กรองตาม</legend>
            <div className="drt-fields">
              {fields.map(f => (
                <label key={f} className={`drt-opt${(draft.field ?? fields[0]) === f ? ' on' : ''}`}>
                  <input
                    type="radio"
                    name={`${panelId}-field`}
                    value={f}
                    checked={(draft.field ?? fields[0]) === f}
                    onChange={() => setField(f)}
                  />
                  {FIELD_LABEL[f]}
                </label>
              ))}
            </div>
            <p className="drt-hint">{FIELD_HINT[draft.field ?? fields[0]]}</p>
          </fieldset>

          <fieldset className="drt-sec">
            <legend>ช่วงเวลาสำเร็จรูป</legend>
            <div className="drt-presets">
              {PRESETS.map(p => (
                <button
                  key={p.k}
                  type="button"
                  className={`drt-chip${draft.k === p.k ? ' on' : ''}`}
                  aria-pressed={draft.k === p.k}
                  title={p.k === 'all' ? 'ไม่กรองวันที่' : rangeText({ k: p.k })}
                  onClick={() => apply({ k: p.k, field: draft.field })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="drt-sec">
            <legend>งวด / กำหนดเอง</legend>
            <div className="drt-grid">
              <label className="drt-in">
                <span>งวด (เดือน)</span>
                <input
                  type="month"
                  className="inp"
                  value={draft.k === 'period' ? draft.ym || '' : ''}
                  onChange={e =>
                    setDraft(d => ({ k: 'period', ym: e.target.value || undefined, field: d.field }))
                  }
                />
              </label>
              <span className="drt-or">หรือ</span>
              <label className="drt-in">
                <span>ตั้งแต่</span>
                <input
                  type="date"
                  className="inp"
                  aria-label="ตั้งแต่วันที่"
                  value={draft.k === 'custom' ? draft.from || '' : ''}
                  onChange={e =>
                    setDraft(d => ({
                      k: 'custom',
                      from: e.target.value || undefined,
                      to: d.k === 'custom' ? d.to : undefined,
                      field: d.field,
                    }))
                  }
                />
              </label>
              <label className="drt-in">
                <span>ถึง</span>
                <input
                  type="date"
                  className="inp"
                  aria-label="ถึงวันที่"
                  value={draft.k === 'custom' ? draft.to || '' : ''}
                  onChange={e =>
                    setDraft(d => ({
                      k: 'custom',
                      from: d.k === 'custom' ? d.from : undefined,
                      to: e.target.value || undefined,
                      field: d.field,
                    }))
                  }
                />
              </label>
            </div>
            {reversed && (
              <p className="drt-warn" role="status">
                วันที่เริ่มอยู่หลังวันที่สิ้นสุด · ระบบจะสลับให้เมื่อกดใช้
              </p>
            )}
          </fieldset>

          <div className="drt-preview" aria-live="polite">
            {checked.ok ? (
              <>
                <Icon name="filter" size="sm" />
                <span>
                  {summaryOf(checked.value)} · <b>{previewCount}</b> ฉบับ
                </span>
              </>
            ) : (
              <span className="drt-warn">{checked.why}</span>
            )}
          </div>

          <div className="drt-foot">
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => apply({ k: 'all', field: draft.field })}
            >
              <Icon name="undo" size="sm" />
              ทุกช่วงเวลา
            </button>
            <span className="grow" />
            <button type="button" className="btn btn-sec sm" onClick={() => setOpen(false)}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary sm" disabled={!checked.ok}>
              <Icon name="check" size="sm" />
              ใช้ตัวกรอง
            </button>
          </div>
        </form>
      </AnchoredPopover>
    </div>
  )
}

export default DateRangeTool
