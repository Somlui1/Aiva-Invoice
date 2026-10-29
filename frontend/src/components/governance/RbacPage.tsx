'use client'

import { useEffect, useState } from 'react'
import { PERMISSION_DESCRIPTIONS, ROLES, USERS, acctsOf } from '../../mock/users'
import { PERMISSION_MATRIX } from '../../lib/permissionMatrix'
import { COMPANIES, CompanyInfo, ORG_NAMES } from '../../mock/companies'
import { Permission } from '../../types/auth'
import { useAuth } from '../../context/AuthContext'
import { PermissionExcelGrid } from './rbac/PermissionExcelGrid'
import { Icon } from '../common/Icon'
import { applyCompanyRows } from '../../lib/companyMasterClient'

/** v5.13: นิติบุคคลที่พบจาก Oracle แต่ยังไม่มีรหัสในระบบ */
interface PendingCompany {
  tax: string
  name: string
  oracleName: string | null
  orgs: number[]
  orgNames: Record<number, string>
}

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
  const [pending, setPending] = useState<PendingCompany[]>([])
  const [codeDraft, setCodeDraft] = useState<Record<string, string>>({})
  const [activating, setActivating] = useState<string | null>(null)

  const takeMaster = (data: any) => {
    if (applyCompanyRows(data?.companies)) setCompaniesData({ ...COMPANIES })
    if (Array.isArray(data?.pending)) setPending(data.pending)
  }

  // v5.13: the saved master (and companies waiting for a code) — MAP only, as the sync itself
  useEffect(() => {
    if (!canManage || typeof fetch !== 'function') return
    let alive = true
    fetch('/api/oracle/companies')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (alive && d?.ok) takeMaster(d)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [canManage]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleActivate = async (p: PendingCompany) => {
    const code = (codeDraft[p.tax] || '').trim().toUpperCase()
    if (!/^[A-Z0-9]{2,8}$/.test(code)) {
      setSyncStatus('รหัสบริษัทต้องเป็น A–Z / 0–9 ยาว 2–8 ตัว')
      return
    }
    setActivating(p.tax)
    try {
      const res = await fetch('/api/oracle/companies/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tax: p.tax, code }),
      })
      const data = await res.json()
      if (!data.ok) {
        setSyncStatus(`เปิดใช้ไม่สำเร็จ: ${data.error || res.status}`)
        return
      }
      const r = await fetch('/api/oracle/companies')
      takeMaster(await r.json())
      setSyncStatus(`เปิดใช้บริษัท ${code} สำเร็จ · มอบหมายผู้ใช้และจับคู่เอกสารได้แล้ว`)
    } catch {
      setSyncStatus('เปิดใช้ไม่สำเร็จ: เชื่อมต่อ server ไม่ได้')
    } finally {
      setActivating(null)
    }
  }

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
        // v5.13: the server saved the result — apply it to every screen (not only this table)
        takeMaster(data)
        const r = data.result
        setSyncStatus(
          data.source === 'oracle_mcp' || data.source === 'import'
            ? `ซิงค์สำเร็จ · อัปเดต ${r?.updated?.length ?? 0} · เพิ่ม ${r?.added?.length ?? 0} · รอตั้งรหัส ${r?.pending?.length ?? 0}`
            : data.warning || 'ไม่ได้ซิงค์จาก Oracle · แสดงข้อมูลบริษัทในระบบ',
        )
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
              <span className="muted sm">ตารางเดียวกับที่ระบบใช้ตรวจสิทธิ์จริง · ทุกการกระทำต้องอยู่ในขอบเขตเอกสารที่เห็นด้วย</span>
            </div>
            <div className="tbl-wrap">
              <table className="t mx">
                <thead>
                  <tr>
                    <th>สิ่งที่ทำได้</th>
                    <th>ปุ่ม / หน้า</th>
                    {roleKeys.map(rk => (
                      <th key={rk} style={{ textAlign: 'center', width: 64 }}>
                        <span
                          className="role-pill"
                          title={ROLES[rk].n}
                          style={{ background: ROLES[rk].bg, color: ROLES[rk].c }}
                        >
                          {rk}
                        </span>
                      </th>
                    ))}
                    <th>เงื่อนไข</th>
                  </tr>
                </thead>
                {PERMISSION_MATRIX.map(g => (
                  <tbody key={g.title}>
                    <tr className="mx-grp">
                      <th colSpan={roleKeys.length + 3}>{g.title}</th>
                    </tr>
                    {g.rows.map(r => (
                      <tr key={r.perm}>
                        <td>
                          {PERMISSION_DESCRIPTIONS[r.perm]}
                          <span className="mono mx-code">{r.perm}</span>
                        </td>
                        <td className="sm">{r.where}</td>
                        {roleKeys.map(rk => {
                          const hasPerm = ROLES[rk].p.includes(r.perm)
                          return (
                            <td
                              key={rk}
                              className={hasPerm ? 'cell ok' : 'cell'}
                              style={{ textAlign: 'center' }}
                              aria-label={`${rk} ${hasPerm ? 'ทำได้' : 'ทำไม่ได้'}`}
                            >
                              {hasPerm ? (
                                <span style={{ color: 'var(--ok)', fontWeight: 'bold' }}>✓</span>
                              ) : (
                                <span className="nac">—</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="sm muted">{r.rule ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                ))}
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
                {canManage && (
                <button
                  type="button"
                  onClick={handleSyncCompanies}
                  disabled={isSyncing}
                  className="btn btn-sec"
                >
                  {isSyncing ? (
                    <>
                      <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      กำลังซิงค์ข้อมูลจาก Oracle…
                    </>
                  ) : (
                    <>
                      <Icon name="refresh" size="sm" />
                      Sync ข้อมูลจาก Oracle
                    </>
                  )}
                </button>
                )}
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
                      <td>
                        {c.name}
                        {k === '?' && (
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--s-500)' }}>
                            มอบหมายให้พนักงานบัญชีได้ที่แท็บ “จัดการสิทธิ์ผู้ใช้งาน” (บริษัท “? ไม่ระบุบริษัท”)
                          </span>
                        )}
                      </td>
                      <td className="mono">{c.tax}</td>
                      <td className="mono">
                        {c.orgs.map(o => `${o} ${ORG_NAMES[o] || ''}`).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* v5.13: entities found in Oracle that the Portal has no code for yet */}
            {canManage && pending.length > 0 && (
              <div className="tbl-wrap" style={{ marginTop: 16 }} data-testid="pending-companies">
                <div className="panel-h">
                  <h3>
                    พบใน Oracle · รอตั้งรหัสบริษัท <span className="c">{pending.length}</span>
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--s-500)' }}>
                    ยังไม่ใช้จับคู่เอกสาร (เอกสารของบริษัทเหล่านี้จะอยู่ใน “?”) จนกว่าจะตั้งรหัสและกดเปิดใช้
                  </span>
                </div>
                <table className="t">
                  <thead>
                    <tr>
                      <th>Tax ID</th>
                      <th>ชื่อตาม Oracle</th>
                      <th>ORG_ID</th>
                      <th>รหัสบริษัท</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(p => (
                      <tr key={p.tax}>
                        <td className="mono">{p.tax}</td>
                        <td>{p.oracleName || p.name}</td>
                        <td className="mono">{p.orgs.map(o => `${o} ${p.orgNames?.[o] || ''}`.trim()).join(', ') || '—'}</td>
                        <td>
                          <input
                            className="inp mono"
                            style={{ width: 110 }}
                            maxLength={8}
                            placeholder="เช่น AHR"
                            aria-label={`รหัสบริษัทสำหรับ Tax ID ${p.tax}`}
                            value={codeDraft[p.tax] ?? ''}
                            onChange={e => setCodeDraft(d => ({ ...d, [p.tax]: e.target.value.toUpperCase() }))}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sec"
                            disabled={activating === p.tax || !(codeDraft[p.tax] || '').trim()}
                            onClick={() => handleActivate(p)}
                          >
                            {activating === p.tax ? 'กำลังเปิดใช้…' : 'เปิดใช้'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RbacPage
