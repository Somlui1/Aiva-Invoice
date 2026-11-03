'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../common/Icon'

interface ReceiverPickerProps {
  accounts: string[]
  countOf: (acct: string) => number
  total: number
  value: string | null
  onChange: (acct: string | null) => void
}

/**
 * v5.15: EU Receiver scope when one AD user maps to many Oracle accounts.
 * One button ("Receiver: ทั้งหมด (N)") + popover with search and per-account counts.
 */
export function ReceiverPicker({ accounts, countOf, total, value, onChange }: ReceiverPickerProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const root = useRef<HTMLSpanElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const onDoc = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return accounts
      .filter(a => !needle || a.toLowerCase().includes(needle))
      .map(a => ({ a, n: countOf(a) }))
  }, [accounts, countOf, q])

  const pick = (acct: string | null) => {
    onChange(acct)
    setOpen(false)
    setQ('')
  }

  const label = value ?? `ทั้งหมด (${accounts.length} บัญชี)`

  return (
    <span className="rcv-pick" ref={root}>
      <button
        type="button"
        className={`chip ${value ? 'on' : ''} rcv-btn`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={value ?? 'เลือก Receiver'}
        onClick={() => setOpen(o => !o)}
      >
        <Icon name="user" size="sm" />
        <span className="rcv-lbl">Receiver: {label}</span>
        <span className="n">{value ? countOf(value) : total}</span>
        <span className="rcv-caret" aria-hidden="true">▾</span>
      </button>
      {value && (
        <button type="button" className="chip rcv-clear" aria-label="ล้าง Receiver" onClick={() => pick(null)}>
          <Icon name="x" size="sm" />
        </button>
      )}
      {open && (
        <div className="rcv-pop" role="listbox" aria-label="Receiver">
          <div className="rcv-search">
            <Icon name="search" size="sm" />
            <input
              ref={input}
              value={q}
              placeholder="ค้นหา Receiver…"
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={`rcv-opt ${!value ? 'on' : ''}`}
            onClick={() => pick(null)}
          >
            <span className="rcv-name">ทุก Receiver ของฉัน</span>
            <span className="n">{total}</span>
          </button>
          <div className="rcv-list">
            {rows.map(({ a, n }) => (
              <button
                key={a}
                type="button"
                role="option"
                aria-selected={value === a}
                className={`rcv-opt ${value === a ? 'on' : ''} ${n === 0 ? 'zero' : ''}`}
                title={a}
                onClick={() => pick(a)}
              >
                <span className="rcv-name">{a}</span>
                <span className="n">{n}</span>
              </button>
            ))}
            {rows.length === 0 && <div className="rcv-empty">ไม่พบ Receiver</div>}
          </div>
        </div>
      )}
    </span>
  )
}

export default ReceiverPicker
