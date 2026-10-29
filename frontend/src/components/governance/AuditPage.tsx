'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { AuditEntry } from '../../types/audit'
import { useLive } from '../../context/LiveContext'

export function AuditPage() {
  const { currentUser, auditLogs: fallbackLogs, can } = useAuth()
  const [liveLogs, setLiveLogs] = useState<AuditEntry[]>([])
  // v5.12: refresh when a document event the user may see arrives (debounced), highlight new lines
  const { subscribe, state: liveState } = useLive()
  const [reload, setReload] = useState(0)
  const [freshKeys, setFreshKeys] = useState<Set<string>>(new Set())
  const seenKeys = useRef<Set<string> | null>(null)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    const off = subscribe(() => {
      if (t) clearTimeout(t)
      t = setTimeout(() => setReload(n => n + 1), 800)
    })
    return () => {
      off()
      if (t) clearTimeout(t)
    }
  }, [subscribe])

  useEffect(() => {
    let active = true
    async function fetchLogs() {
      try {
        const params = new URLSearchParams({
          whoId: currentUser.id,
          role: currentUser.role,
          companies: currentUser.co.join(','),
        })
        const res = await fetch(`/api/audit-logs?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (active && data.ok && Array.isArray(data.logs)) {
            const keyOf = (a: AuditEntry, i: number) => String(a.id ?? `${a.dt}|${a.t}|${a.doc}|${a.act}|${i}`)
            const keys = new Set<string>(data.logs.map(keyOf))
            if (seenKeys.current) {
              const fresh = new Set([...keys].filter(k => !seenKeys.current!.has(k)))
              if (fresh.size) {
                setFreshKeys(fresh)
                setTimeout(() => setFreshKeys(new Set()), 8000)
              }
            }
            seenKeys.current = keys
            setLiveLogs(data.logs)
          }
        }
      } catch {
        // Fallback to in-memory context logs if endpoint is unavailable
      }
    }
    fetchLogs()
    return () => {
      active = false
    }
  }, [currentUser.id, currentUser.role, currentUser.co, reload])

  if (!can('AUDIT')) {
    return (
      <div className="pg-scroll">
        <div className="panel">
          <div className="empty">
            <Icon name="lock" />
            ไม่มีสิทธิ์เข้าถึงหน้านี้
          </div>
        </div>
      </div>
    )
  }

  // Filter fallback logs if endpoint was unavailable
  const filteredFallback = currentUser.role === 'ADM' || currentUser.role === 'SA'
    ? fallbackLogs
    : currentUser.role === 'APR'
    ? fallbackLogs.filter(l => currentUser.co.some(c => l.detail.includes(c)) || l.who === currentUser.n)
    : fallbackLogs.filter(l => l.who === currentUser.n)

  const logs = liveLogs.length > 0 ? liveLogs : filteredFallback

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">บันทึกการเข้าถึงและการดำเนินการ</span>
        <span className="scope-note">
          {logs.length} รายการ · ไม่สามารถแก้ไขได้
        </span>
        <span className={`audit-live${liveState === 'live' ? ' on' : ''}`} role="status">
          <i aria-hidden="true" />
          {liveState === 'live' ? 'อัปเดตอัตโนมัติ' : liveState === 'polling' ? 'ตรวจทุก 60 วินาที' : 'ไม่อัปเดตอัตโนมัติ'}
        </span>
      </div>

      <div className="pg-scroll">
        <div className="panel">
          <div className="tbl-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เวลา</th>
                  <th>ผู้ใช้</th>
                  <th>บทบาท</th>
                  <th>การดำเนินการ</th>
                  <th>เอกสาร</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((a, i) => (
                  <tr
                    key={a.id || i}
                    className={`${/ปฏิเสธ|ไม่สำเร็จ/.test(a.act) ? 'row-bad' : ''}${
                      freshKeys.has(String(a.id ?? `${a.dt}|${a.t}|${a.doc}|${a.act}|${i}`)) ? ' is-fresh' : ''
                    }`}
                  >
                    <td className="mono">{a.dt}</td>
                    <td className="mono">{a.t}</td>
                    <td>{a.who}</td>
                    <td>{a.role}</td>
                    <td>{a.act}</td>
                    <td className="mono">{a.doc}</td>
                    <td>{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditPage
