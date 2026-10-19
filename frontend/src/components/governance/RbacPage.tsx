'use client'

import { useState } from 'react'
import { PERMISSION_DESCRIPTIONS, ROLES, USERS, acctsOf } from '../../mock/users'
import { COMPANIES, CompanyInfo, ORG_NAMES } from '../../mock/companies'
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
  const [companiesData, setCompaniesData] = useState<Record<string, CompanyInfo>>(COMPANIES)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)

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
        const nextMap: Record<string, CompanyInfo> = { ...COMPANIES }
        for (const c of data.companies) {
          nextMap[c.code] = { name: c.name, tax: c.tax, orgs: c.orgs }
        }
        setCompaniesData(nextMap)
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
          <span className="c">{Object.keys(companiesData).filter(k => k !== '?').length}</span>
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
            <div className="panel-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>บริษัทและ ORG_ID (ตารางที่ 4)</h3>
                {syncedAt && (
                  <span style={{ fontSize: 11, color: 'var(--s-500)', marginLeft: 8 }}>
                    (อัปเดตล่าสุด: {syncedAt})
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                    <th>บริษัท</th>
                    <th>ชื่อ</th>
                    <th>Tax ID</th>
                    <th>ORG_ID</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(companiesData).map(([k, c]) => (
                    <tr key={k}>
                      <td>
                        <span className="co" style={{ margin: 0 }}>
                          {k}
                        </span>
                      </td>
                      <td>{c.name}</td>
                      <td className="mono">{c.tax}</td>
                      <td className="mono">
                        {c.orgs.map(o => `${o} ${ORG_NAMES[o] || ''}`).join(', ')}
                      </td>
                    </tr>
                  ))}
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
