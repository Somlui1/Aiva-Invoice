'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { PERMISSION_DESCRIPTIONS, ROLES, USERS, acctsOf } from '../../mock/users'
import { COMPANIES_26, CompanyMasterInfo } from '../../mock/companies26'
import { RoleKey, Permission } from '../../types/auth'
import { useAuth } from '../../context/AuthContext'
import { useToastModal } from '../../context/ToastModalContext'
import { PermissionExcelGrid, ManagedUser } from './rbac/PermissionExcelGrid'
import { UserInspectorPane } from './rbac/UserInspectorPane'
import { RolePermissionMatrix } from './rbac/RolePermissionMatrix'
import { CompanyScopeMatrix } from './rbac/CompanyScopeMatrix'
import { VisibilityTester } from './rbac/VisibilityTester'
import { AdUserSearchModal } from './rbac/AdUserSearchModal'
import { SaveDiffModal, UserDiff } from './rbac/SaveDiffModal'
import { Icon } from '../common/Icon'

type RbacTab = 'users' | 'matrix' | 'companies' | 'tester'

export function RbacPage() {
  const { can } = useAuth()
  const { toast } = useToastModal()
  const permKeys = Object.keys(PERMISSION_DESCRIPTIONS) as Permission[]
  const canManage = can('MAP')

  const [activeTab, setActiveTab] = useState<RbacTab>('users')
  const [companiesList, setCompaniesList] = useState<CompanyMasterInfo[]>(Object.values(COMPANIES_26))
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)

  // Users and draft state
  const [initialUsers, setInitialUsers] = useState<ManagedUser[]>([])
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false)

  // Load companies
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

  // Load users
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        if (data.ok && Array.isArray(data.users)) {
          setInitialUsers(JSON.parse(JSON.stringify(data.users)))
          setUsers(data.users)
          setSelectedUserId(prev => prev || (data.users.length > 0 ? data.users[0].id : null))
        }
      }
    } catch (err) {
      console.warn('Failed to load users in RbacPage:', err)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Track differences between initialUsers and users
  const diffs = useMemo<UserDiff[]>(() => {
    const res: UserDiff[] = []
    for (const u of users) {
      if (u.isNew) {
        res.push({ user: u, type: 'added' })
      } else if (u.isDeleted) {
        res.push({ user: u, type: 'deleted' })
      } else {
        const orig = initialUsers.find(o => o.email === u.email)
        if (
          orig &&
          (orig.role !== u.role ||
            JSON.stringify(orig.companies.sort()) !== JSON.stringify(u.companies.sort()) ||
            JSON.stringify(orig.receivers.sort()) !== JSON.stringify(u.receivers.sort()))
        ) {
          res.push({ user: u, type: 'modified' })
        }
      }
    }
    return res
  }, [users, initialUsers])

  const hasDirtyChanges = diffs.length > 0

  // Undo changes
  const handleUndo = useCallback(() => {
    if (!hasDirtyChanges) return
    setUsers(JSON.parse(JSON.stringify(initialUsers)))
    toast('ยกเลิกการแก้ไขสิทธิ์ทั้งหมดแล้ว')
  }, [hasDirtyChanges, initialUsers, toast])

  // Keyboard shortcut Ctrl+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (hasDirtyChanges && !isDiffModalOpen && !isAddModalOpen) {
          e.preventDefault()
          handleUndo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasDirtyChanges, isDiffModalOpen, isAddModalOpen, handleUndo])

  // Handlers for user mutations
  const handleRoleChange = (id: string, newRole: RoleKey) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id) return u
        return { ...u, role: newRole, isDirty: true }
      })
    )
  }

  const handleToggleCompany = (co: string) => {
    if (!selectedUserId) return
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== selectedUserId) return u
        const nextCos = u.companies.includes(co)
          ? u.companies.filter(c => c !== co)
          : [...u.companies, co]
        return { ...u, companies: nextCos, isDirty: true }
      })
    )
  }

  const handleRemoveCompany = (id: string, co: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id) return u
        return { ...u, companies: u.companies.filter(c => c !== co), isDirty: true }
      })
    )
  }

  const handleAddCompany = (id: string, co: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id || u.companies.includes(co)) return u
        return { ...u, companies: [...u.companies, co], isDirty: true }
      })
    )
  }

  const handleRemoveReceiver = (id: string, rcv: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id) return u
        return { ...u, receivers: u.receivers.filter(r => r !== rcv), isDirty: true }
      })
    )
  }

  const handleAddReceiver = (id: string, rcv: string) => {
    const trimmed = rcv.trim().toUpperCase()
    if (!trimmed) return
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id || u.receivers.includes(trimmed)) return u
        return { ...u, receivers: [...u.receivers, trimmed], isDirty: true }
      })
    )
  }

  const handleDeleteUser = (id: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id) return u
        return { ...u, isDeleted: true, isDirty: true }
      })
    )
  }

  const handleAddFromAd = (newUser: {
    name: string
    email: string
    samAccount: string
    empId: string
    unit: string
    role: RoleKey
    companies: string[]
    receivers: string[]
  }) => {
    if (users.some(u => u.email === newUser.email && !u.isDeleted)) {
      toast(`ผู้ใช้ ${newUser.email} มีอยู่ในระบบแล้ว`, true)
      return
    }

    const created: ManagedUser = {
      id: `u_${Date.now()}`,
      ...newUser,
      isNew: true,
      isDirty: true,
    }

    setUsers(prev => [created, ...prev])
    setSelectedUserId(created.id)
    setIsAddModalOpen(false)
    toast(`เพิ่ม ${newUser.name} เรียบร้อยแล้ว (รอยืนยันบันทึก)`)
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      for (const diff of diffs) {
        if (diff.type === 'added' || diff.type === 'modified') {
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: diff.user.email,
              name: diff.user.name,
              samAccount: diff.user.samAccount,
              empId: diff.user.empId,
              unit: diff.user.unit,
              role: diff.user.role,
              companies: diff.user.companies,
              receivers: diff.user.receivers,
            }),
          })
        }
      }
      toast('บันทึกการเปลี่ยนแปลงสิทธิ์ทั้งหมดสำเร็จ!')
      setIsDiffModalOpen(false)
      await loadUsers()
    } catch (err: any) {
      toast(err.message || 'บันทึกไม่สำเร็จ', true)
    } finally {
      setIsSaving(false)
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

  const selectedUser = users.find(u => u.id === selectedUserId) || null

  return (
    <div className="pg pm">
      <div className="tbar">
        <span className="lab">สิทธิ์และการเชื่อมบัญชี</span>
        <span className="scope-note">
          Active Directory ↔ RECEIVER (Oracle) ↔ บริษัท · ผู้ดูแลระบบจัดการได้ แต่ไม่เห็นเนื้อหาเอกสาร
        </span>
      </div>

      {/* 4-Tab Header */}
      <div className="tabs pm-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`tab ${activeTab === 'users' ? 'on' : ''} ${hasDirtyChanges ? 'dirty' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="user" size="sm" />
          <span>จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)</span>
          <span className="c pm-n">{users.length || USERS.length}</span>
          <span className="pm-dot" />
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
          <span className="c pm-n">{permKeys.length}</span>
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
          <span className="c pm-n">{companiesList.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tester'}
          className={`tab ${activeTab === 'tester' ? 'on' : ''}`}
          onClick={() => setActiveTab('tester')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="search" size="sm" />
          <span>Visibility Tester</span>
          <span className="c pm-n">Sandbox</span>
        </button>
      </div>

      <div className="pm-body" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Tab 1: User Permission Admin Grid & Inspector */}
        {activeTab === 'users' && (
          <div className="pm-users" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px' }}>
            <div className="pm-main" style={{ minWidth: 0, minHeight: 0, overflow: 'auto', borderRight: '1px solid var(--line-strong)' }}>
              {canManage ? (
                <div style={{ padding: 12 }}>
                  <PermissionExcelGrid
                    users={users}
                    diffs={diffs}
                    selectedUserId={selectedUserId}
                    onSelectUser={u => setSelectedUserId(u.id)}
                    onRoleChange={handleRoleChange}
                    onRemoveCompany={handleRemoveCompany}
                    onAddCompany={handleAddCompany}
                    onRemoveReceiver={handleRemoveReceiver}
                    onAddReceiver={handleAddReceiver}
                    onDeleteUser={handleDeleteUser}
                    onOpenAddModal={() => setIsAddModalOpen(true)}
                    onOpenDiffModal={() => setIsDiffModalOpen(true)}
                    isLoading={isLoadingUsers}
                    isSaving={isSaving}
                  />
                </div>
              ) : (
                <div style={{ padding: 16 }}>
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
                            <tr
                              key={u.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const found = users.find(x => x.email === u.email)
                                if (found) setSelectedUserId(found.id)
                              }}
                            >
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
                </div>
              )}
            </div>

            {/* Inspector Pane on Right */}
            <UserInspectorPane
              user={selectedUser}
              onRoleChange={newRole => {
                if (selectedUserId) handleRoleChange(selectedUserId, newRole)
              }}
              onToggleCompany={handleToggleCompany}
              onAddReceiver={rcv => {
                if (selectedUserId) handleAddReceiver(selectedUserId, rcv)
              }}
              onRemoveReceiver={rcv => {
                if (selectedUserId) handleRemoveReceiver(selectedUserId, rcv)
              }}
            />
          </div>
        )}

        {/* Tab 2: Permission Matrix */}
        {activeTab === 'matrix' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16 }}>
            <RolePermissionMatrix />
          </div>
        )}

        {/* Tab 3: Companies & ORG_ID */}
        {activeTab === 'companies' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16 }}>
            <CompanyScopeMatrix
              companies={companiesList}
              onSyncOracle={handleSyncCompanies}
              isSyncing={isSyncing}
              syncStatus={syncStatus}
              syncedAt={syncedAt}
            />
          </div>
        )}

        {/* Tab 4: Visibility Tester */}
        {activeTab === 'tester' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <VisibilityTester />
          </div>
        )}
      </div>

      {/* Footer Status Bar (.pm-foot) */}
      <div className={`pm-foot ${hasDirtyChanges ? 'dirty' : ''}`} data-testid="pm-draft-foot">
        <div className="pm-fs">
          {hasDirtyChanges ? (
            <>
              <Icon name="alert" size="sm" />
              <span>
                มีการแก้ไขสิทธิ์ที่ยังไม่ได้บันทึก: <b>{diffs.length}</b> รายการ (กด <code>Ctrl+Z</code> เพื่อยกเลิก)
              </span>
            </>
          ) : (
            <>
              <Icon name="check" size="sm" />
              <span>ข้อมูลสิทธิ์เป็นปัจจุบัน ไม่มีการแก้ไขค้างบันทึก</span>
            </>
          )}
        </div>

        {hasDirtyChanges && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn sm"
              onClick={handleUndo}
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 5,
                border: '1px solid var(--line-strong)',
                background: 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              ยกเลิกการเปลี่ยนแปลง (Undo)
            </button>
            <button
              type="button"
              className="btn-xl-save sm"
              onClick={() => setIsDiffModalOpen(true)}
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 5,
                border: 0,
                background: 'var(--navy-800)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ตรวจสอบและบันทึก ({diffs.length})
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AdUserSearchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddUser={handleAddFromAd}
      />

      <SaveDiffModal
        isOpen={isDiffModalOpen}
        diffs={diffs}
        isSaving={isSaving}
        onClose={() => setIsDiffModalOpen(false)}
        onConfirm={handleSaveAll}
      />
    </div>
  )
}
