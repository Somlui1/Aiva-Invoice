'use client'

/**
 * v5.14 — "เพิ่ม Oracle account" for an End User, with suggestions from the Receivers that really
 * occur on documents (GET /api/users/receivers).
 *
 * Designed against the bugs the old free-text box had:
 *  - typo → the EU sees nothing: suggestions use the spelling found on documents (+ doc count)
 *  - duplicates: names already on the user (case / space-insensitive) are hidden, never re-added
 *  - an account already bound to another user is shown with a note (shared accounts are legitimate,
 *    so allowed — but never silently)
 *  - blur never adds a half-typed word: only an exact directory match is added on blur; otherwise
 *    the text stays in the box with a "not added yet" hint (nothing lost, nothing wrong saved)
 *  - picking with the mouse does not blur the input (mousedown prevented) → no double add
 *  - free text is still possible (a new receiver may have no document yet) — marked as such
 *
 * Keyboard: ↓ / ↑ choose · Enter add · Esc close · ARIA combobox + listbox.
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AnchoredPopover } from '../../common/AnchoredPopover'
import { Icon } from '../../common/Icon'
import { normalizeReceiverName } from '../../../lib/docScope'

export interface ReceiverSuggestion {
  name: string
  key: string
  docs: number
  companies: string[]
  lastSeen: string | null
  boundTo: { id: string; name: string }[]
}

// ---- directory cache: one request per minute for the whole page --------------------------------
type DirState = { status: 'loading' | 'ready' | 'error'; items: ReceiverSuggestion[] }
let cache: { at: number; promise: Promise<ReceiverSuggestion[]> } | null = null
const TTL_MS = 60_000

export function loadReceiverSuggestions(force = false): Promise<ReceiverSuggestion[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.promise
  const promise = fetch('/api/users/receivers', { credentials: 'same-origin' })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then(d => (Array.isArray(d?.receivers) ? (d.receivers as ReceiverSuggestion[]) : []))
  cache = { at: Date.now(), promise }
  promise.catch(() => {
    if (cache?.promise === promise) cache = null
  })
  return promise
}

/** test hook */
export function __resetReceiverCache() {
  cache = null
}

function useReceiverDirectory(): DirState {
  const [state, setState] = useState<DirState>({ status: 'loading', items: [] })
  useEffect(() => {
    let alive = true
    loadReceiverSuggestions().then(
      items => alive && setState({ status: 'ready', items }),
      () => alive && setState({ status: 'error', items: [] }),
    )
    return () => {
      alive = false
    }
  }, [])
  return state
}

const clean = (v: string) => v.normalize('NFKC').replace(/\s+/g, ' ').trim()

/** Pure: suggestions for a query (exact → starts with → contains all words), most documents first. */
export function rankReceivers(items: readonly ReceiverSuggestion[], query: string, exclude: readonly string[], limit = 50): ReceiverSuggestion[] {
  const ex = new Set(exclude.map(normalizeReceiverName))
  const q = normalizeReceiverName(query)
  const words = q.split(' ').filter(Boolean)
  const scored: { s: ReceiverSuggestion; rank: number }[] = []
  for (const s of items) {
    const k = s.key || normalizeReceiverName(s.name)
    if (ex.has(k)) continue
    if (!q) {
      scored.push({ s, rank: 3 })
      continue
    }
    if (!words.every(w => k.includes(w))) continue
    scored.push({ s, rank: k === q ? 0 : k.startsWith(q) ? 1 : 2 })
  }
  return scored
    .sort((a, b) => a.rank - b.rank || b.s.docs - a.s.docs || a.s.name.localeCompare(b.s.name))
    .slice(0, limit)
    .map(x => x.s)
}

export interface ReceiverPickerProps {
  /** Accounts already on the user (hidden from the list, never re-added). */
  value: readonly string[]
  onAdd: (name: string) => void
  /** The user being edited (their own binding is not reported as "already bound"). */
  selfUserId?: string
  /** 'chip' = compact, inline in the user grid · 'field' = full-width form field (add-user dialog). */
  variant?: 'chip' | 'field'
  placeholder?: string
  ariaLabel?: string
  inputId?: string
}

export function ReceiverPicker({
  value,
  onAdd,
  selfUserId,
  variant = 'field',
  placeholder = 'พิมพ์หรือเลือก Oracle account (Receiver)…',
  ariaLabel = 'เพิ่ม Oracle account',
  inputId,
}: ReceiverPickerProps) {
  const dir = useReceiverDirectory()
  const uid = useId().replace(/:/g, '')
  const listId = `rcvp-list-${uid}`
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [pending, setPending] = useState(false)

  const results = useMemo(() => rankReceivers(dir.items, q, value), [dir.items, q, value])
  const typed = clean(q)
  const typedKey = normalizeReceiverName(typed)
  const exact = typedKey ? results.find(r => r.key === typedKey) ?? null : null
  const alreadyOn = !!typedKey && value.some(v => normalizeReceiverName(v) === typedKey)
  const showFree = !!typed && !exact && !alreadyOn
  // null = "+ add what I typed"
  const options: (ReceiverSuggestion | null)[] = showFree ? [...results, null] : results
  const activeIdx = options.length ? Math.min(active, options.length - 1) : -1
  const width = Math.max(360, wrapRef.current?.offsetWidth ?? 0)

  useEffect(() => setActive(0), [q, open])

  const add = (name: string, refocus = true) => {
    const v = clean(name)
    if (!v) return
    setQ('')
    setPending(false)
    if (value.some(x => normalizeReceiverName(x) === normalizeReceiverName(v))) return
    onAdd(v)
    if (refocus) inputRef.current?.focus()
  }

  const choose = (i: number) => {
    const o = options[i]
    if (o === undefined) return
    add(o === null ? typed : o.name)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      const n = options.length
      if (n) setActive(a => (e.key === 'ArrowDown' ? (a + 1) % n : (a - 1 + n) % n))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && activeIdx >= 0) choose(activeIdx)
      else if (typed) add(exact ? exact.name : typed)
      return
    }
    if (e.key === 'Tab') setOpen(false)
  }

  const onBlur = () => {
    // Only an exact directory match is safe to add without asking; anything else stays visible.
    if (!typed) return setPending(false)
    if (exact) add(exact.name, false)
    else if (!alreadyOn) setPending(true)
  }

  useEffect(() => {
    if (!open || activeIdx < 0) return
    document.getElementById(`${listId}-${activeIdx}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIdx, open, listId])

  const others = (s: ReceiverSuggestion) => s.boundTo.filter(b => b.id !== selfUserId)

  return (
    <div ref={wrapRef} className={`rcvp rcvp-${variant}${pending ? ' is-pending' : ''}`}>
      <div className="rcvp-box">
        <span className="rcvp-ico" aria-hidden="true">
          <Icon name="search" size="sm" />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={q}
          onChange={e => {
            setQ(e.target.value)
            setPending(false)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        {q && (
          <button
            type="button"
            className="rcvp-x"
            aria-label="ล้างข้อความ"
            title="ล้าง"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              setQ('')
              setPending(false)
              inputRef.current?.focus()
            }}
          >
            <Icon name="x" size="sm" />
          </button>
        )}
      </div>
      {pending && (
        <div className="rcvp-pending" role="status">
          <Icon name="alert" size="sm" />
          {`“${typed}” ยังไม่ได้เพิ่ม · กด Enter เพื่อเพิ่ม หรือเลือกจากรายการ`}
        </div>
      )}

      <AnchoredPopover
        open={open}
        anchorRef={wrapRef}
        onClose={() => setOpen(false)}
        width={width}
        className="rcvp-pop"
        ariaLabel="รายชื่อ Oracle account จากเอกสาร"
      >
        <div className="rcvp-h">
          {dir.status === 'loading'
            ? 'กำลังโหลดรายชื่อจากเอกสาร…'
            : dir.status === 'error'
              ? 'โหลดรายชื่อจากเอกสารไม่ได้ · พิมพ์ชื่อเองได้'
              : q
                ? `ตรงกับ “${typed}” ${results.length} บัญชี`
                : `Receiver ที่พบในเอกสาร ${dir.items.length} บัญชี · เรียงตามจำนวนเอกสาร`}
        </div>
        <ul id={listId} role="listbox" className="rcvp-list" aria-label="Oracle account">
          {options.map((o, i) => {
            const on = i === activeIdx
            const common = {
              id: `${listId}-${i}`,
              role: 'option' as const,
              'aria-selected': on,
              onMouseDown: (e: { preventDefault: () => void }) => e.preventDefault(),
              onMouseEnter: () => setActive(i),
              onClick: () => choose(i),
            }
            if (o === null) {
              return (
                <li key="__free" {...common} className={`rcvp-opt rcvp-free${on ? ' on' : ''}`}>
                  <span className="rcvp-lead">+</span>
                  <span className="rcvp-main">
                    <span className="rcvp-name">{`เพิ่ม “${typed}”`}</span>
                    <span className="rcvp-meta warn">ไม่พบในเอกสาร · ตรวจให้ตรงกับ RECEIVER ใน Oracle ทุกตัวอักษร</span>
                  </span>
                </li>
              )
            }
            const bound = others(o)
            return (
              <li key={o.key} {...common} className={`rcvp-opt${on ? ' on' : ''}`} title={o.name}>
                <span className="rcvp-lead">
                  <Icon name="user" size="sm" />
                </span>
                <span className="rcvp-main">
                  <span className="rcvp-name">{o.name}</span>
                  <span className="rcvp-meta">
                    <span>{`${o.docs.toLocaleString()} ฉบับ`}</span>
                    {o.companies.length > 0 && <span>{o.companies.join(', ')}</span>}
                    {o.lastSeen && <span>{`ล่าสุด ${o.lastSeen}`}</span>}
                  </span>
                  {bound.length > 0 && <span className="rcvp-meta bound">{`ผูกกับ ${bound.map(b => b.name).join(', ')} อยู่แล้ว`}</span>}
                </span>
                <span className="rcvp-enter" aria-hidden="true">
                  ↵
                </span>
              </li>
            )
          })}
          {dir.status === 'ready' && options.length === 0 && (
            <li className="rcvp-empty" role="presentation">
              {alreadyOn ? 'บัญชีนี้มีอยู่แล้ว' : q ? 'ไม่มีรายการ' : 'ยังไม่มี Receiver ในเอกสาร · พิมพ์ชื่อเองได้'}
            </li>
          )}
        </ul>
        <div className="rcvp-f">↑ ↓ เลือก · Enter เพิ่ม · Esc ปิด</div>
      </AnchoredPopover>
    </div>
  )
}

export default ReceiverPicker
