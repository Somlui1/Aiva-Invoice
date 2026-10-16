'use client'

import { useEffect, useState, useMemo } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { AuditEntry } from '../../types/audit'

const CATEGORY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  ALL: { label: 'ทุกประเภท (All Categories)', badgeClass: '' },
  INGESTION: { label: 'นำเข้าเอกสาร (Ingestion)', badgeClass: 'audit-cat-ingest' },
  DOCUMENT: { label: 'การดำเนินงานเอกสาร (Document)', badgeClass: 'audit-cat-doc' },
  AP_BATCH: { label: 'การส่งข้อมูล AP (AP Batch)', badgeClass: 'audit-cat-ap' },
  RBAC_USER: { label: 'จัดการผู้ใช้ (User Management)', badgeClass: 'audit-cat-user' },
  RBAC_PERMISSION: { label: 'แก้ไขสิทธิ์ (Permission Changes)', badgeClass: 'audit-cat-perm' },
  AUTH: { label: 'ความปลอดภัย (Authentication)', badgeClass: 'audit-cat-auth' },
  ORACLE_SYNC: { label: 'การเชื่อมต่อระบบ (Oracle Sync)', badgeClass: 'audit-cat-sync' },
}

export function AuditPage() {
  const { currentUser, auditLogs: fallbackLogs, can } = useAuth()
  const [liveLogs, setLiveLogs] = useState<AuditEntry[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const isAdmin = currentUser.role === 'ADM' || currentUser.role === 'SA'

  // Filter out admin-only categories for regular staff
  const availableCategories = useMemo(() => {
    return Object.entries(CATEGORY_CONFIG).filter(([key]) => {
      if (isAdmin) return true
      return key !== 'RBAC_USER' && key !== 'RBAC_PERMISSION'
    })
  }, [isAdmin])

  useEffect(() => {
    let active = true
    async function fetchLogs() {
      try {
        const params = new URLSearchParams({
          whoId: currentUser.id,
          role: currentUser.role,
          companies: currentUser.co.join(','),
        })

        if (selectedCategory && selectedCategory !== 'ALL') {
          params.set('category', selectedCategory)
        }

        if (search.trim()) {
          params.set('search', search.trim())
        }

        const res = await fetch(`/api/audit-logs?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (active && data.ok && Array.isArray(data.logs)) {
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
  }, [currentUser.id, currentUser.role, currentUser.co, selectedCategory, search])

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
  const filteredFallback = useMemo(() => {
    let filtered = isAdmin
      ? fallbackLogs
      : currentUser.role === 'APR'
      ? fallbackLogs.filter(l => currentUser.co.some(c => l.detail.includes(c)) || l.who === currentUser.n)
      : fallbackLogs.filter(l => l.who === currentUser.n)

    if (selectedCategory && selectedCategory !== 'ALL') {
      filtered = filtered.filter(l => (l.category || 'DOCUMENT') === selectedCategory)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        l =>
          l.who.toLowerCase().includes(q) ||
          l.act.toLowerCase().includes(q) ||
          l.detail.toLowerCase().includes(q) ||
          l.doc.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [fallbackLogs, isAdmin, currentUser, selectedCategory, search])

  const logs = liveLogs.length > 0 ? liveLogs : filteredFallback

  const renderCategoryBadge = (cat?: string) => {
    const key = cat || 'DOCUMENT'
    const conf = CATEGORY_CONFIG[key] || { label: key, badgeClass: 'audit-cat-doc' }
    return <span className={`audit-cat-badge ${conf.badgeClass}`}>{conf.label.split(' ')[0]}</span>
  }

  return (
    <div className="pg">
      <div className="tbar">
        <div className="audit-filter-row">
          <span className="lab">บันทึกการเข้าถึงและการดำเนินการ</span>
          <input
            type="text"
            className="audit-search-input"
            placeholder="ค้นหาตามชื่อผู้ใช้, เอกสาร, กิจกรรม..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            aria-label="กรองประเภท Log"
            className="sel audit-category-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {availableCategories.map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>
        </div>
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
                  <th>ประเภท</th>
                  <th>ผู้ใช้</th>
                  <th>บทบาท</th>
                  <th>การดำเนินการ</th>
                  <th>เอกสาร</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                      ไม่พบข้อมูลบันทึกที่ตรงตามเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  logs.map((a, i) => (
                    <tr
                      key={a.id || i}
                      className={/ปฏิเสธ|ไม่สำเร็จ/.test(a.act) ? 'row-bad' : ''}
                    >
                      <td className="mono">{a.dt}</td>
                      <td className="mono">{a.t}</td>
                      <td>{renderCategoryBadge(a.category)}</td>
                      <td>{a.who}</td>
                      <td>{a.role}</td>
                      <td>{a.act}</td>
                      <td className="mono">{a.doc}</td>
                      <td>
                        <div>{a.detail}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditPage
