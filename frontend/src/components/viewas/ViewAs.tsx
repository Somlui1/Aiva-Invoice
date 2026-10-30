'use client'

/**
 * v5.10 — Super Admin "ดูในมุมมองของ…".
 *
 *  <ViewAsBanner/>  amber bar on top while active: who · read-only · started · time left · [สลับ] [ออก]
 *  <ViewAsPicker/>  modal: by role (EU / ACC / APR / ADM + companies + Oracle accounts) or by real user
 *  openViewAsPicker()  open it from anywhere (topbar eye button, Ctrl K)
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useToastModal } from '../../context/ToastModalContext'
import { ROLES, USERS, acctsOf } from '../../mock/users'
import { COMPANIES } from '../../mock/companies'
import { VIEW_AS_BYPASS, VIEW_AS_ROLES, remainingText, type ViewAsTarget } from '../../lib/viewAs'
import type { RoleKey } from '../../types/auth'

export const OPEN_VIEW_AS_EVENT = 'aiva:open-view-as'
export function openViewAsPicker() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_VIEW_AS_EVENT))
}

const ROLE_HINT: Record<string, string> = {
  EU: 'Receiver · เห็นเฉพาะเอกสารของ Oracle account ตัวเอง',
  ACC: 'เจ้าหน้าที่บัญชี · ทั้งบริษัทที่ได้รับมอบหมาย',
  APR: 'หัวหน้าบัญชี · ทั้งบริษัท + อนุมัติ / ส่ง AP',
  ADM: 'IT Admin · ไม่เห็นเนื้อหาเอกสาร',
}

interface DirUser {
  id: string
  name: string
  email: string
  role: string
  companies: string[]
  receivers: string[]
  isActive?: boolean
}

const fmtTime = (ms: number) => new Date(ms).toTimeString().slice(0, 5)

// ---------------------------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------------------------

export function ViewAsBanner() {
  const { viewAs, stopViewAs } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!viewAs) return
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [viewAs])
  if (!viewAs) return null
  const u = viewAs.user
  const left = viewAs.expiresAt - now
  return (
    <div className="vab" role="status" aria-live="polite">
      <Icon name="eye" />
      <div className="vab-t">
        <b>กำลังดูในมุมมองของ</b>
        <span className="vab-who" title={viewAs.label}>
          {u.name} · {u.role}
          {u.role === 'EU' && u.receivers.length ? ` · Receiver ${u.receivers.join(', ')}` : ''}
          {u.role !== 'EU' && u.role !== 'ADM' ? ` · ${u.companies.join(', ')}` : ''}
        </span>
        <span className="vab-meta">
          ทำรายการได้เหมือนผู้ใช้นี้ (บันทึกในชื่อคุณ) · เริ่ม {fmtTime(viewAs.startedAt)} · หมดอายุใน {remainingText(left)}
          {!viewAs.serverChecked && <em> · ตรวจฝั่ง browser เท่านั้น (ติดต่อ server ไม่ได้)</em>}
        </span>
      </div>
      <button type="button" className="vab-btn" onClick={openViewAsPicker}>
        <Icon name="users" size="sm" /> สลับ
      </button>
      <button type="button" className="vab-btn vab-exit" onClick={() => stopViewAs('user')}>
        <Icon name="logout" size="sm" /> ออกจากมุมมอง
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------------------------

export function ViewAsPicker() {
  const { realUser, startViewAs, viewAs } = useAuth()
  const { toast } = useToastModal()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'role' | 'user'>('user')
  const [role, setRole] = useState<RoleKey>('EU')
  const [cos, setCos] = useState<Set<string>>(new Set())
  const [rcv, setRcv] = useState('')
  const [q, setQ] = useState('')
  const [dir, setDir] = useState<DirUser[] | null>(null)
  const [dirErr, setDirErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const titleId = useId()
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_VIEW_AS_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_VIEW_AS_EVENT, onOpen)
  }, [])

  // Load the directory once per open, as the real SA (bypass the active view).
  useEffect(() => {
    if (!open) return
    setErr('')
    setQ('')
    requestAnimationFrame(() => firstRef.current?.focus())
    let alive = true
    fetch('/api/users', { credentials: 'same-origin', headers: { [VIEW_AS_BYPASS]: '1' } })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(d => {
        if (!alive) return
        setDir(Array.isArray(d?.users) ? d.users : [])
        setDirErr('')
      })
      .catch(() => {
        if (!alive) return
        // Mock / offline: the demo roster still lets the UI be checked.
        setDir(
          USERS.map(u => ({ id: u.id, name: u.n, email: u.email, role: u.role, companies: u.co, receivers: acctsOf(u) })),
        )
        setDirErr('โหลดรายชื่อจาก server ไม่ได้ · แสดงรายชื่อตัวอย่าง')
      })
    return () => {
      alive = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  const candidates = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (dir ?? [])
      .filter(u => String(u.role).toUpperCase() !== 'SA' && u.isActive !== false && u.id !== realUser.id)
      .filter(u => !t || `${u.name} ${u.email} ${u.id} ${u.role} ${u.receivers.join(' ')} ${u.companies.join(' ')}`.toLowerCase().includes(t))
      .slice(0, 60)
  }, [dir, q, realUser.id])

  if (!open || realUser.role !== 'SA' || typeof document === 'undefined') return null

  const go = async (target: ViewAsTarget) => {
    setBusy(true)
    setErr('')
    const r = await startViewAs(target)
    setBusy(false)
    if (!r.ok) {
      setErr(r.error || 'เริ่มโหมดดูในมุมมองไม่ได้')
      return
    }
    setOpen(false)
    toast('เข้าสู่โหมดดูในมุมมอง · ทำรายการได้เหมือนผู้ใช้นี้ (บันทึกในชื่อคุณ)')
  }

  const toggleCo = (c: string) =>
    setCos(prev => {
      const n = new Set(prev)
      if (n.has(c)) n.delete(c)
      else n.add(c)
      return n
    })

  const roleTarget = (): ViewAsTarget => ({
    kind: 'role',
    role,
    companies: [...cos],
    receivers: role === 'EU' ? rcv.split(';').map(x => x.trim()).filter(Boolean).slice(0, 10) : [],
  })
  const roleInvalid = role === 'EU' && !rcv.trim()

  return createPortal(
    <div className="ov on vap-ov" role="presentation" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
      <div className="modal vap" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="mh">
          <span className="mi vap-mi">
            <Icon name="eye" size="lg" />
          </span>
          <div>
            <h3 id={titleId}>ดูในมุมมองของ…</h3>
            <p className="muted sm">เห็นและทำรายการได้เหมือนเป้าหมายทุกประการ (สิทธิ์ · ขอบเขต · กติกา) · ทุกรายการบันทึกในชื่อคุณ · หมดอายุใน 30 นาที</p>
          </div>
        </div>

        <div className="seg vap-seg" role="tablist">
          <button ref={firstRef} type="button" role="tab" aria-selected={tab === 'user'} className={tab === 'user' ? 'on' : ''} onClick={() => setTab('user')}>
            <Icon name="user" size="sm" /> ผู้ใช้จริง
          </button>
          <button type="button" role="tab" aria-selected={tab === 'role'} className={tab === 'role' ? 'on' : ''} onClick={() => setTab('role')}>
            <Icon name="users" size="sm" /> ตามบทบาท
          </button>
        </div>

        {tab === 'user' ? (
          <div className="vap-body">
            <input
              className="inp"
              type="text"
              placeholder="ค้นหาชื่อ / อีเมล / Oracle account / บริษัท"
              aria-label="ค้นหาผู้ใช้"
              value={q}
              maxLength={80}
              onChange={e => setQ(e.target.value)}
            />
            {dirErr && <p className="vap-warn">{dirErr}</p>}
            <ul className="vap-list" aria-label="ผู้ใช้">
              {dir === null ? (
                <li className="vap-empty">
                  <span className="spin" /> กำลังโหลดรายชื่อ…
                </li>
              ) : candidates.length === 0 ? (
                <li className="vap-empty">ไม่พบผู้ใช้ (Super Admin และผู้ใช้ที่ถูกปิดเลือกไม่ได้)</li>
              ) : (
                candidates.map(u => (
                  <li key={u.id}>
                    <button
                      type="button"
                      disabled={busy}
                      className={viewAs?.target.kind === 'user' && viewAs.target.userId === u.id ? 'on' : ''}
                      onClick={() => go({ kind: 'user', userId: u.id })}
                    >
                      <span className={`vap-role r-${u.role}`}>{u.role}</span>
                      <span className="vap-n">
                        <b>{u.name}</b>
                        <span className="muted xs">
                          {u.email} · {u.companies.join(', ') || '—'}
                          {u.receivers.length ? ` · ${u.receivers.join(', ')}` : ''}
                        </span>
                      </span>
                      <Icon name="chevR" size="sm" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : (
          <div className="vap-body">
            <div className="vap-roles" role="radiogroup" aria-label="บทบาท">
              {VIEW_AS_ROLES.map(r => (
                <label key={r} className={`vap-ropt${role === r ? ' on' : ''}`}>
                  <input type="radio" name={`${titleId}-role`} checked={role === r} onChange={() => setRole(r)} />
                  <b>{r}</b>
                  <span>{ROLES[r].n}</span>
                  <small>{ROLE_HINT[r]}</small>
                </label>
              ))}
            </div>
            {role !== 'ADM' && (
              <fieldset className="vap-fs">
                <legend>บริษัท (ไม่เลือก = ทุกบริษัท)</legend>
                <div className="vap-cos">
                  {Object.keys(COMPANIES).map(c => (
                    <button key={c} type="button" className={`chip${cos.has(c) ? ' on' : ''}`} aria-pressed={cos.has(c)} onClick={() => toggleCo(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {role === 'EU' && (
              <label className="vap-fs vap-in">
                <span>Oracle account (Receiver) · หลายบัญชีคั่นด้วย ; · จำเป็นสำหรับ EU</span>
                <input className="inp" type="text" value={rcv} maxLength={300} placeholder="เช่น AHT Die Making 03, K.Vinitda Jitpilai" onChange={e => setRcv(e.target.value)} />
              </label>
            )}
            <div className="vap-foot">
              <span className="grow" />
              <button type="button" className="btn btn-primary" disabled={busy || roleInvalid} onClick={() => go(roleTarget())}>
                <Icon name="eye" size="sm" /> ดูในมุมมอง {role}
              </button>
            </div>
          </div>
        )}

        {err && (
          <p className="vap-err" role="alert">
            {err}
          </p>
        )}
        <div className="mf">
          <button type="button" className="btn btn-sec" onClick={() => setOpen(false)}>
            ปิด
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
