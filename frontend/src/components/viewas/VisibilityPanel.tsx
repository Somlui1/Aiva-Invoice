'use client'

/**
 * v5.10 — Super Admin "ทำไมเห็น / ไม่เห็น" for one document.
 *
 * Uses the same rule as the browser and the server (lib/docScope.explainScope):
 *  - the active "view as" target (if any) first;
 *  - each real user of the document's company (from /api/users, fetched as the real SA): can see /
 *    cannot see + the exact reason;
 *  - nothing is fetched until the panel is opened.
 */
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { USERS, acctsOf } from '../../mock/users'
import { explainScope } from '../../lib/docScope'
import { VIEW_AS_BYPASS } from '../../lib/viewAs'
import type { InvoiceDoc } from '../../types/invoice'

interface DirUser {
  id: string
  name: string
  role: string
  companies: string[]
  receivers: string[]
  isActive?: boolean
}

export function VisibilityPanel({ doc }: { doc: InvoiceDoc }) {
  const { realUser, viewAs } = useAuth()
  const [open, setOpen] = useState(false)
  const [dir, setDir] = useState<DirUser[] | null>(null)
  const [src, setSrc] = useState<'server' | 'demo'>('server')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!open || dir) return
    let alive = true
    fetch('/api/users', { credentials: 'same-origin', headers: { [VIEW_AS_BYPASS]: '1' } })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(d => alive && setDir(Array.isArray(d?.users) ? d.users : []))
      .catch(() => {
        if (!alive) return
        setSrc('demo')
        setDir(USERS.map(u => ({ id: u.id, name: u.n, role: u.role, companies: u.co, receivers: acctsOf(u) })))
      })
    return () => {
      alive = false
    }
  }, [open, dir])

  const rows = useMemo(() => {
    if (!dir) return []
    return dir
      .filter(u => u.isActive !== false && String(u.role).toUpperCase() !== 'SA')
      .map(u => ({ u, r: explainScope(doc, { role: u.role, companies: u.companies, accounts: u.receivers }) }))
      .sort((a, b) => Number(b.r.ok) - Number(a.r.ok) || a.u.role.localeCompare(b.u.role) || a.u.name.localeCompare(b.u.name))
  }, [dir, doc])

  if (realUser.role !== 'SA') return null

  const target = viewAs
    ? explainScope(doc, { role: viewAs.user.role, companies: viewAs.user.companies, accounts: viewAs.user.receivers })
    : null
  const seeing = rows.filter(x => x.r.ok)
  // Hide people of other companies unless asked: they are "obviously" out and drown the list.
  const shown = showAll ? rows : rows.filter(x => x.r.ok || x.u.companies.includes(doc.company) || x.u.companies.length === 0)

  return (
    <details className="vis" open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>
        <Icon name="eye" size="sm" />
        <b>ทำไมเห็น / ไม่เห็น</b>
        <span className="muted xs">Super Admin · {doc.company} · Receiver {doc.receiver || '— (ไม่มี)'}</span>
        {dir && <span className="vis-n">{seeing.length} คนเห็น</span>}
      </summary>

      {target && viewAs && (
        <div className={`vis-target ${target.ok ? 'ok' : 'no'}`}>
          <Icon name={target.ok ? 'checkc' : 'ban'} size="sm" />
          <span>
            มุมมองปัจจุบัน <b>{viewAs.user.name}</b> ({viewAs.user.role}): {target.ok ? 'เห็น' : 'ไม่เห็น'} · {target.why}
          </span>
        </div>
      )}

      {!dir ? (
        <p className="muted sm">
          <span className="spin" /> กำลังโหลดรายชื่อผู้ใช้…
        </p>
      ) : (
        <>
          {src === 'demo' && <p className="vis-warn">โหลดรายชื่อจาก server ไม่ได้ · ใช้รายชื่อตัวอย่าง</p>}
          <table className="t vis-t">
            <thead>
              <tr>
                <th>ผู้ใช้</th>
                <th>บทบาท</th>
                <th>ผล</th>
                <th>เหตุผล</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ u, r }) => (
                <tr key={u.id} className={r.ok ? '' : 'vis-no'}>
                  <td className="fit-td" title={`${u.name} · ${u.companies.join(', ')}${u.receivers.length ? ` · ${u.receivers.join(', ')}` : ''}`}>
                    {u.name}
                  </td>
                  <td className="mono xs">{u.role}</td>
                  <td>{r.ok ? <span className="vis-ok">เห็น</span> : <span className="vis-bad">ไม่เห็น</span>}</td>
                  <td className="fit-td" title={r.why}>
                    {r.why}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    ไม่มีผู้ใช้ในบริษัท {doc.company}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {rows.length > shown.length && (
            <button type="button" className="link" onClick={() => setShowAll(true)}>
              แสดงผู้ใช้บริษัทอื่นอีก {rows.length - shown.length} คน
            </button>
          )}
        </>
      )}
    </details>
  )
}

export default VisibilityPanel
