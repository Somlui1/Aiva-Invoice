'use client'

/**
 * v5.8 — the document search box (queue list + table view share it).
 *
 *  - types freely; the queue follows after a short pause (150 ms) so typing never stutters;
 *  - ✕ clears, Esc clears (a second Esc leaves the box), Ctrl/⌘+F-style "/" is NOT hijacked;
 *  - a "?" button opens a cheat-sheet; every example is clickable and fills the box;
 *  - when the query contains something the search *interpreted* (a date, status:, amt:…) the
 *    interpretation is shown under the box, so the user can see why a document matched.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { AnchoredPopover } from '../common/AnchoredPopover'
import { useInvoices } from '../../context/InvoiceContext'
import { describeQuery, parseQuery, parseDateToken } from '../../lib/smartSearch'

const EXAMPLES: Array<{ q: string; d: string }> = [
  { q: 'IV2026-09002', d: 'เลขที่ใบแจ้งหนี้ / DMS / PO / ใบรับ / Tax ID' },
  { q: 'crv packaging', d: 'ชื่อผู้ขาย (หลายคำ = ต้องเจอทุกคำ)' },
  { q: 'hold', d: 'สถานะ (พิมพ์ไทยได้ เช่น รอตรวจ, ซ้ำ, รอผูกบัญชี)' },
  { q: 'E11', d: 'รหัสข้อยกเว้น หรือกฎ เช่น V-07' },
  { q: '26/10/2569', d: 'วันที่รูปแบบใดก็ได้ (ค.ศ./พ.ศ.) · หรือ ต.ค. 2026' },
  { q: '190,995.00', d: 'ยอดเงิน (มีหรือไม่มี , ก็ได้)' },
  { q: 'status:review amt:>100000', d: 'ระบุช่องได้: status: code: co: vendor: po: date: amt:' },
  { q: 'date:2026-10-01..2026-10-15', d: 'ช่วงวันที่ (ใบแจ้งหนี้ / เข้าระบบ / สร้าง)' },
  { q: '-auto-pass', d: 'ขึ้นต้นด้วย - เพื่อตัดออก' },
]

const DEBOUNCE_MS = 150

export function SmartSearchBox({
  id,
  variant = 'list',
  resultCount,
  value,
  onChange: onQueryChange,
  placeholder = 'ค้นหาทุกอย่าง: เลขที่ · ผู้ขาย · สถานะ · E11 · วันที่ · ยอดเงิน',
}: {
  id: string
  variant?: 'list' | 'table'
  resultCount?: number
  /** Controlled query (v5.9 closed page). Omit = the queue's `searchQuery` from context. */
  value?: string
  onChange?: (q: string) => void
  placeholder?: string
}) {
  const ctx = useInvoices()
  const searchQuery = value ?? ctx.searchQuery
  const setSearchQuery = onQueryChange ?? ctx.setSearchQuery
  const [text, setText] = useState(searchQuery)
  const [help, setHelp] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const helpRef = useRef<HTMLButtonElement>(null)
  const hintId = useId()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // External changes (ล้างตัวกรอง, Ctrl K, the other box) win over the local text.
  useEffect(() => {
    setText(prev => (prev.trim() === searchQuery.trim() ? prev : searchQuery))
  }, [searchQuery])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const push = (v: string, now = false) => {
    if (timer.current) clearTimeout(timer.current)
    if (now) setSearchQuery(v)
    else timer.current = setTimeout(() => setSearchQuery(v), DEBOUNCE_MS)
  }

  const onChange = (v: string) => {
    // hard cap: a pasted page of text must not freeze the queue
    const capped = v.slice(0, 200)
    setText(capped)
    push(capped)
  }

  const clear = () => {
    setText('')
    push('', true)
    inputRef.current?.focus()
  }

  const terms = text.trim() ? parseQuery(text) : []
  const interpreted =
    terms.length > 0 && terms.some(t => t.field !== 'any' || t.negate || !!parseDateToken(t.value))
      ? describeQuery(text)
      : []

  return (
    <div className={`ssb ssb-${variant}`}>
      <div className="ssb-box">
        <Icon name="search" size="sm" className="ssb-ico" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          aria-label="ค้นหาเอกสาร"
          aria-describedby={interpreted.length ? hintId : undefined}
          value={text}
          maxLength={200}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              if (text) {
                e.preventDefault()
                e.stopPropagation()
                clear()
              } else {
                inputRef.current?.blur()
              }
            } else if (e.key === 'Enter') {
              push(text, true)
            }
          }}
        />
        {text && (
          <button type="button" className="ssb-btn" aria-label="ล้างคำค้นหา" title="ล้าง (Esc)" onClick={clear}>
            <Icon name="x" size="sm" />
          </button>
        )}
        <button
          ref={helpRef}
          type="button"
          className={`ssb-btn ssb-help${help ? ' on' : ''}`}
          aria-label="วิธีค้นหา"
          aria-expanded={help}
          title="วิธีค้นหา"
          onClick={() => setHelp(v => !v)}
        >
          <Icon name="help" size="sm" />
        </button>
      </div>

      {(interpreted.length > 0 || (text.trim() && typeof resultCount === 'number')) && (
        <div className="ssb-meta" id={hintId} aria-live="polite">
          {interpreted.map((t, i) => (
            <span key={`${t}-${i}`} className="ssb-tag" title={t}>
              {t}
            </span>
          ))}
          {text.trim() && typeof resultCount === 'number' && (
            <span className="ssb-count">พบ {resultCount} ฉบับ</span>
          )}
        </div>
      )}

      <AnchoredPopover
        open={help}
        anchorRef={helpRef}
        onClose={() => setHelp(false)}
        align="end"
        width={380}
        ariaLabel="วิธีค้นหา"
        className="ssb-pop"
      >
        <div className="ssb-pop-h">ค้นหาอะไรก็ได้ · คลิกตัวอย่างเพื่อลอง</div>
        <ul className="ssb-ex">
          {EXAMPLES.map(ex => (
            <li key={ex.q}>
              <button
                type="button"
                onClick={() => {
                  setText(ex.q)
                  push(ex.q, true)
                  setHelp(false)
                  inputRef.current?.focus()
                }}
              >
                <code>{ex.q}</code>
                <span>{ex.d}</span>
              </button>
            </li>
          ))}
        </ul>
      </AnchoredPopover>
    </div>
  )
}

export default SmartSearchBox
