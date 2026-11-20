'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { useInvoices } from '../../context/InvoiceContext'
import { resetLayoutPrefs, saveLayoutPrefs, useEffectiveLayout, useLayoutPrefs } from '../../lib/layoutPrefs'
import {
  DEFAULT_LAYOUT_PREFS,
  RATIO_MAX,
  RATIO_MIN,
  RATIO_PRESETS,
  densityFor,
  type QueueMode,
} from '../../lib/queueLayout'

const MODES: { k: QueueMode; label: string; hint: string }[] = [
  { k: 'auto', label: 'อัตโนมัติ', hint: 'ตามความกว้างจอ' },
  { k: 'full', label: 'Full', hint: '360px · การ์ด 4 บรรทัด' },
  { k: 'compact', label: 'Compact', hint: '260px · 2 บรรทัด' },
  { k: 'slim', label: 'Slim', hint: '160px · Invoice / บริษัท · สถานะ' },
  { k: 'edge', label: 'พับ', hint: 'แถบด้านซ้าย คลิกเพื่อเปิดคิว' },
]

const DENSITY_TH: Record<string, string> = { full: 'Full', compact: 'Compact', slim: 'Slim', edge: 'พับ' }
const widthName = (w: number) => (w <= 0 ? 'พับ' : `${DENSITY_TH[densityFor(w)]} ${w}px`)

/**
 * v5.17 — one button, one popover: queue size, detail : PDF split, which panes show while the PDF is
 * open, and the pre-v5.17 behaviour ("hide the queue when the PDF opens") for anyone who wants it back.
 * Every change is saved at once (localStorage) and applied by QueuePage.
 */
export function LayoutMenu() {
  const prefs = useLayoutPrefs()
  const eff = useEffectiveLayout()
  const { dockSplitRatio, setDockSplitRatio, isEvidenceDockOpen } = useInvoices()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const id = useId()

  // Outside click / Esc close the menu (capture phase: Esc must not also close the PDF).
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      btnRef.current?.focus()
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey, true)
    requestAnimationFrame(() => popRef.current?.querySelector<HTMLElement>('button.on, button')?.focus())
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const setRatio = (r: number) => {
    const v = Math.min(RATIO_MAX, Math.max(RATIO_MIN, Math.round(r * 1000) / 1000))
    setDockSplitRatio(v)
    saveLayoutPrefs({ ratio: v })
  }

  const pdfPct = Math.round(dockSplitRatio * 100)
  const effNote = (() => {
    if (!isEvidenceDockOpen) return 'ขนาดคิวนี้ใช้ขณะเปิด PDF · ตอนนี้ไม่ได้เปิด PDF คิวจึงแสดงเต็ม'
    if (!eff) return ''
    if (prefs.pdfHidesQueue) return 'เปิด PDF อยู่ → คิวซ่อนเป็นแถบด้านซ้าย (แบบเดิม)'
    const used = eff.queue === 'rail' ? 'พับ' : widthName(eff.queueWidth)
    return `ใช้จริง: ${used}${eff.workWidth ? ` · พื้นที่ ${eff.workWidth}px` : ''}`
  })()

  return (
    <div className="lm-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`btn btn-sec sm lm-btn${open ? ' on' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title="ปรับเลย์เอาต์ คิว · ผลตรวจ · PDF"
        onClick={() => setOpen(v => !v)}
      >
        <Icon name="sliders" size="sm" />
        เลย์เอาต์
      </button>
      {open && (
        <div className="lm-pop" id={id} role="dialog" aria-label="ปรับเลย์เอาต์" ref={popRef}>
          <section>
            <h5>ขนาดคิว (ขณะเปิด PDF)</h5>
            <div className="lm-seg" role="group" aria-label="ขนาดคิว">
              {MODES.map(m => (
                <button
                  key={m.k}
                  type="button"
                  className={prefs.mode === m.k ? 'on' : ''}
                  aria-pressed={prefs.mode === m.k}
                  title={m.hint}
                  disabled={prefs.pdfHidesQueue}
                  onClick={() => saveLayoutPrefs({ mode: m.k })}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {prefs.mode === 'custom' && <div className="lm-note">กำหนดเองจากการลากขอบคิว: {prefs.customWidth}px</div>}
            {effNote && <div className="lm-note">{effNote}</div>}
            {isEvidenceDockOpen && eff?.notes.map(n => (
              <div key={n} className="lm-note warn">
                {n}
              </div>
            ))}
          </section>

          <section className={prefs.showDetail ? '' : 'dim'}>
            <h5>สัดส่วน ผลตรวจ : PDF</h5>
            <div className="lm-seg" role="group" aria-label="สัดส่วน">
              {(
                [
                  ['data', 'เน้นข้อมูล'],
                  ['balanced', 'สมดุล'],
                  ['pdf', 'เน้น PDF'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={Math.abs(dockSplitRatio - RATIO_PRESETS[k]) < 0.011 ? 'on' : ''}
                  disabled={!prefs.showDetail}
                  onClick={() => setRatio(RATIO_PRESETS[k])}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={Math.round(RATIO_MIN * 100)}
              max={Math.round(RATIO_MAX * 100)}
              step={1}
              value={pdfPct}
              disabled={!prefs.showDetail}
              aria-label="ความกว้างของ PDF (เปอร์เซ็นต์)"
              aria-valuetext={`ผลตรวจ ${100 - pdfPct} : PDF ${pdfPct}`}
              onChange={e => setRatio(Number(e.target.value) / 100)}
            />
            <div className="lm-rr">
              <span>← ผลตรวจกว้างขึ้น</span>
              <b>
                {100 - pdfPct} : {pdfPct}
              </b>
              <span>PDF กว้างขึ้น →</span>
            </div>
            {isEvidenceDockOpen && eff && !eff.detailHidden && Math.abs(eff.ratio - dockSplitRatio) > 0.02 && (
              <div className="lm-note">
                ใช้จริง {Math.round((1 - eff.ratio) * 100)} : {Math.round(eff.ratio * 100)} — ปรับตามขั้นต่ำ ผลตรวจ ≥ 440px · PDF ≥ 360px และ PDF ≤ 900px
              </div>
            )}
          </section>

          <section>
            <h5>ขณะเปิด PDF</h5>
            <label className="lm-ck">
              <input type="checkbox" checked={prefs.showDetail} onChange={e => saveLayoutPrefs({ showDetail: e.target.checked })} />
              แสดงผลตรวจคู่กับ PDF
            </label>
            <div className="lm-radio" role="radiogroup" aria-label="คิวเมื่อเปิด PDF">
              <button
                type="button"
                role="radio"
                aria-checked={!prefs.pdfHidesQueue}
                className={!prefs.pdfHidesQueue ? 'on' : ''}
                onClick={() => saveLayoutPrefs({ pdfHidesQueue: false })}
              >
                <i />
                แสดงคิวด้วย (3 ส่วน)
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={prefs.pdfHidesQueue}
                className={prefs.pdfHidesQueue ? 'on' : ''}
                onClick={() => saveLayoutPrefs({ pdfHidesQueue: true })}
              >
                <i />
                ซ่อนคิว (แบบเดิม)
              </button>
            </div>
          </section>

          <div className="lm-foot">
            <button
              type="button"
              className="btn btn-sec sm"
              onClick={() => {
                resetLayoutPrefs()
                setDockSplitRatio(DEFAULT_LAYOUT_PREFS.ratio)
              }}
            >
              <Icon name="undo" size="sm" />
              รีเซ็ตเลย์เอาต์
            </button>
            <span className="grow" />
            <span className="lm-kb">
              <kbd>J</kbd>
              <kbd>K</kbd> สลับเอกสาร · <kbd>P</kbd> PDF
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LayoutMenu
