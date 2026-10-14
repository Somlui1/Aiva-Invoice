'use client'

import { useEffect, useState } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { AuditEntry } from '../../types/audit'

export function AuditPage() {
  const { auditLogs: fallbackLogs, can } = useAuth()
  const [liveLogs, setLiveLogs] = useState<AuditEntry[]>([])

  useEffect(() => {
    let active = true
    async function fetchLogs() {
      try {
        const res = await fetch('/api/audit-logs')
        if (res.ok) {
          const data = await res.json()
          if (active && data.ok && Array.isArray(data.logs) && data.logs.length > 0) {
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
  }, [])

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

  const logs = liveLogs.length > 0 ? liveLogs : fallbackLogs

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">บันทึกการเข้าถึงและการดำเนินการ</span>
        <span className="scope-note">
          {logs.length} รายการ · ไม่สามารถแก้ไขได้
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
                    className={/ปฏิเสธ|ไม่สำเร็จ/.test(a.act) ? 'row-bad' : ''}
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
