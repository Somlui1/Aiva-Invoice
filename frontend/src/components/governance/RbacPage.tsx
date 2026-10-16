'use client'

import { useState, useEffect } from 'react'
import { PERMISSION_DESCRIPTIONS, ROLES, USERS, acctsOf } from '../../mock/users'
import { COMPANIES_26, CompanyMasterInfo } from '../../mock/companies26'
import { Permission } from '../../types/auth'
import { useAuth } from '../../context/AuthContext'
import { PermissionExcelGrid } from './rbac/PermissionExcelGrid'
import { Icon } from '../common/Icon'

type RbacTab = 'users' | 'matrix' | 'companies'

export function RbacPage() {
  const { can } = useAuth()
  const permKeys = Object.keys(PERMISSION_DESCRIPTIONS) as Permission[]
  const roleKeys = Object.keys(ROLES) as Array<keyof typeof ROLES>
  const canManage = can('MAP')

  const [activeTab, setActiveTab] = useState<RbacTab>('users')
  const [companiesList, setCompaniesList] = useState<CompanyMasterInfo[]>(Object.values(COMPANIES_26))
  const [companySearch, setCompanySearch] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.companies) && data.companies.length > 0) {
          setCompaniesList(data.companies)
        }
      })
      .catch(() => {})
  }, [])

  const handleSyncCompanies = async () => {
    setIsSyncing(true)
    setSyncStatus(null)
    try {
      const res = await fetch('/api/oracle/sync-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: 'itsupport' }),
      })
      const data = await res.json()
      if (data.ok && Array.isArray(data.companies)) {
        const nextList: CompanyMasterInfo[] = data.companies.map((c: any) => ({
          code: c.code,
          name: c.name,
          taxId: c.taxId || c.tax || '',
          ouName: c.ouName || '',
          ledgerName: c.ledgerName || '',
          orgId: c.orgId || (Array.isArray(c.orgs) && c.orgs.length > 0 ? c.orgs[0] : 0),
          isActive: c.isActive !== false,
        }))
        setCompaniesList(nextList)
        setSyncStatus(`ซิงค์ข้อมูลสำเร็จ จาก ${data.source === 'oracle_mcp' ? 'Oracle ERP' : 'ระบบสำรอง'}`)
        setSyncedAt(new Date().toLocaleTimeString('th-TH'))
      } else {
        setSyncStatus(`ซิงค์ข้อมูลไม่สำเร็จ: ${data.error || 'Unknown'}`)
      }
    } catch {
      setSyncStatus('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Oracle API')
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredCompanies = companiesList.filter(c => {
    if (!companySearch.trim()) return true
    const q = companySearch.toLowerCase().trim()
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.ouName && c.ouName.toLowerCase().includes(q)) ||
      (c.taxId && c.taxId.toLowerCase().includes(q)) ||
      (c.ledgerName && c.ledgerName.toLowerCase().includes(q)) ||
      String(c.orgId).includes(q)
    )
  })

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">สิทธิ์และการเชื่อมบัญชี</span>
        <span className="scope-note">
          Active Directory ↔ RECEIVER (Oracle) ↔ บริษัท · ผู้ดูแลระบบจัดการได้ แต่ไม่เห็นเนื้อหาเอกสาร
        </span>
      </div>

      {/* 3-Tab Header */}
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`tab ${activeTab === 'users' ? 'on' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="user" size="sm" />
          <span>จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)</span>
          <span className="c">{USERS.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'matrix'}
          className={`tab ${activeTab === 'matrix' ? 'on' : ''}`}
          onClick={() => setActiveTab('matrix')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="layers" size="sm" />
          <span>Matrix สิทธิ์ตามบทบาท</span>
          <span className="c">{permKeys.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'companies'}
          className={`tab ${activeTab === 'companies' ? 'on' : ''}`}
          onClick={() => setActiveTab('companies')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="building" size="sm" />
          <span>บริษัทและ ORG_ID</span>
          <span className="c">{companiesList.length}</span>
        </button>
      </div>

      <div className="pg-scroll">
        {/* Tab 1: User Permission Admin Grid */}
        {activeTab === 'users' && (
          <div>
            {canManage ? (
              <div className="panel" style={{ marginBottom: 16 }}>
                <PermissionExcelGrid />
              </div>
            ) : (
              <div className="panel" style={{ marginBottom: 16 }}>
                <div className="panel-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>ผู้ใช้งานในระบบและการผูกบัญชี (ตารางที่ 5)</h3>
                  <span style={{ fontSize: 12, color: 'var(--s-500)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="lock" size="sm" />
                    มุมมองอ่านอย่างเดียว (เฉพาะผู้ดูแลระบบ IT เท่านั้นที่แก้ไขได้)
                  </span>
                </div>
                <div className="tbl-wrap">
                  <table className="t">
                    <thead>
                      <tr>
                        <th>ชื่อ</th>
                        <th>Active Directory / Email</th>
                        <th>บทบาท</th>
                        <th>หน่วยงาน</th>
                        <th>Oracle account (Receiver)</th>
                        <th>บริษัทที่รับผิดชอบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {USERS.map(u => (
                        <tr key={u.id}>
                          <td>
                            <b>{u.n}</b>
                          </td>
                          <td className="mono">{u.email}</td>
                          <td>
                            <span
                              className="role-pill"
                              style={{
                                background: ROLES[u.role].bg,
                                color: ROLES[u.role].c,
                              }}
                            >
                              {ROLES[u.role].n}
                            </span>
                          </td>
                          <td>{u.unit}</td>
                          <td className="mono">
                            {acctsOf(u).join(', ') || <span className="nac">—</span>}
                          </td>
                          <td>
                            {u.co.map(c => (
                              <span key={c} className="co" style={{ margin: '0 4px 0 0' }}>
                                {c}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Permission Matrix (Table 6) */}
        {activeTab === 'matrix' && (
          <div className="panel">
            <div className="panel-h">
              <h3>Matrix สิทธิ์ตามบทบาท (ตารางที่ 6)</h3>
            </div>
            <div className="tbl-wrap">
              <table className="t mx">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>สิทธิ์</th>
                    <th>คำอธิบาย</th>
                    {roleKeys.map(rk => (
                      <th key={rk} style={{ textAlign: 'center', width: 90 }}>
                        <span
                          className="role-pill"
                          title={ROLES[rk].n}
                          style={{ background: ROLES[rk].bg, color: ROLES[rk].c }}
                        >
                          {rk}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permKeys.map(pk => (
                    <tr key={pk}>
                      <td className="mono">{pk}</td>
                      <td>{PERMISSION_DESCRIPTIONS[pk]}</td>
                      {roleKeys.map(rk => {
                        const hasPerm = ROLES[rk].p.includes(pk)
                        return (
                          <td
                            key={rk}
                            className={hasPerm ? 'cell ok' : 'cell'}
                            style={{ textAlign: 'center' }}
                          >
                            {hasPerm ? (
                              <span style={{ color: 'var(--ok)', fontWeight: 'bold' }}>✓</span>
                            ) : (
                              <span className="nac">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Companies & ORG_ID (Table 4) */}
        {activeTab === 'companies' && (
          <div className="panel">
            <div className="panel-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3>บริษัทและ ORG_ID (ตารางที่ 4)</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--s-500)' }}>
                    แสดง {filteredCompanies.length} จาก {companiesList.length} บริษัท
                  </span>
                  {syncedAt && (
                    <span style={{ fontSize: 11, color: 'var(--s-500)' }}>
                      (อัปเดตล่าสุด: {syncedAt})
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: 320 }}>
                  <input
                    type="text"
                    role="searchbox"
                    aria-label="ค้นหาบริษัท"
                    placeholder="ค้นหาตามรหัสย่อ, ชื่อบริษัท, Tax ID หรือ ORG_ID..."
                    value={companySearch}
                    onChange={e => setCompanySearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 12px 6px 30px',
                      fontSize: 12.5,
                      border: '1px solid var(--b-300)',
                      borderRadius: 6,
                      background: 'var(--bg-card)',
                      color: 'inherit',
                    }}
                  />
                  <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>
                    <Icon name="search" size="sm" />
                  </span>
                  {companySearch && (
                    <button
                      type="button"
                      onClick={() => setCompanySearch('')}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--s-400)',
                        fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {syncStatus && (
                  <span style={{ fontSize: 12, color: syncStatus.includes('สำเร็จ') ? 'var(--ok)' : 'var(--err)' }}>
                    {syncStatus}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSyncCompanies}
                  disabled={isSyncing}
                  className="btn-xl-add"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    fontSize: 12.5,
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSyncing ? (
                    <>
                      <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                      กำลังซิงค์ข้อมูลจาก Oracle…
                    </>
                  ) : (
                    <>
                      <Icon name="refresh" size="sm" />
                      Sync ข้อมูลจาก Oracle
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="t">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>รหัสย่อ</th>
                    <th>ชื่อบริษัท (Legal Entity)</th>
                    <th>Operating Unit (OU Name)</th>
                    <th style={{ width: 140 }}>Tax ID</th>
                    <th style={{ width: 90 }}>ORG_ID</th>
                    <th>Ledger</th>
                    <th style={{ width: 80, textAlign: 'center' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map(c => (
                    <tr key={`${c.code}-${c.orgId}`}>
                      <td>
                        <span className="co" style={{ margin: 0 }}>
                          {c.code}
                        </span>
                      </td>
                      <td>{c.name}</td>
                      <td>{c.ouName || '—'}</td>
                      <td className="mono">{c.taxId || '—'}</td>
                      <td className="mono">{c.orgId || '—'}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{c.ledgerName || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 600,
                            background: c.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: c.isActive ? '#10b981' : '#ef4444',
                          }}
                        >
                          {c.isActive ? 'ใช้งาน' : 'ระงับ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--s-400)' }}>
                        ไม่พบบริษัทที่ตรงกับคำค้นหา &ldquo;{companySearch}&rdquo;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RbacPage
