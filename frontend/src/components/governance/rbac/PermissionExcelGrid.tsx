'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { RoleKey } from '@/types/auth'
import { ROLES } from '@/mock/users'
import { AdUserSearchModal } from './AdUserSearchModal'
import { SaveDiffModal, UserDiff } from './SaveDiffModal'
import { useToastModal } from '@/context/ToastModalContext'
import '@/styles/permissionGrid.css'

export interface ManagedUser {
  id: string
  name: string
  email: string
  samAccount: string
  empId?: string | null
  unit?: string | null
  role: RoleKey
  companies: string[]
  receivers: string[]
  isNew?: boolean
  isDirty?: boolean
  isDeleted?: boolean
}

export interface PermissionExcelGridProps {
  users?: ManagedUser[]
  diffs?: UserDiff[]
  selectedUserId?: string | null
  onSelectUser?: (user: ManagedUser) => void
  onRoleChange?: (id: string, newRole: RoleKey) => void
  onRemoveCompany?: (id: string, co: string) => void
  onAddCompany?: (id: string, co: string) => void
  onRemoveReceiver?: (id: string, rcv: string) => void
  onAddReceiver?: (id: string, rcv: string) => void
  onDeleteUser?: (id: string) => void
  onOpenAddModal?: () => void
  onOpenDiffModal?: () => void
  onAddFromAd?: (newUser: {
    name: string
    email: string
    samAccount: string
    empId: string
    unit: string
    role: RoleKey
    companies: string[]
    receivers: string[]
  }) => void
  onSaveAll?: () => Promise<void>
  isSaving?: boolean
  isLoading?: boolean
}

const AVAILABLE_COMPANIES = ['AH', 'AHT', 'AHP', 'AM']

export function PermissionExcelGrid(props: PermissionExcelGridProps) {
  const { toast } = useToastModal()
  const [internalInitialUsers, setInternalInitialUsers] = useState<ManagedUser[]>([])
  const [internalUsers, setInternalUsers] = useState<ManagedUser[]>([])
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false)
  const [internalSaving, setInternalSaving] = useState(false)
  const [internalLoading, setInternalLoading] = useState(true)

  const isControlled = props.users !== undefined
  const users = isControlled ? props.users! : internalUsers
  const isLoading = isControlled ? props.isLoading ?? false : internalLoading
  const isSaving = isControlled ? props.isSaving ?? false : internalSaving
  const selectedUserId = props.selectedUserId !== undefined ? props.selectedUserId : internalSelectedId

  // Load users from backend if uncontrolled
  const loadUsers = async () => {
    setInternalLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        if (data.ok && Array.isArray(data.users)) {
          setInternalInitialUsers(JSON.parse(JSON.stringify(data.users)))
          setInternalUsers(data.users)
        }
      }
    } catch (err) {
      console.warn('Failed to load users:', err)
    } finally {
      setInternalLoading(false)
    }
  }

  useEffect(() => {
    if (!isControlled) {
      loadUsers()
    }
  }, [isControlled])

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      if (u.isDeleted) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.samAccount.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.receivers.some(r => r.toLowerCase().includes(q)) ||
        u.companies.some(c => c.toLowerCase().includes(q))
      )
    })
  }, [users, search])

  // Track differences if uncontrolled
  const internalDiffs = useMemo<UserDiff[]>(() => {
    const res: UserDiff[] = []
    for (const u of internalUsers) {
      if (u.isNew) {
        res.push({ user: u, type: 'added' })
      } else if (u.isDeleted) {
        res.push({ user: u, type: 'deleted' })
      } else {
        const orig = internalInitialUsers.find(o => o.email === u.email)
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
  }, [internalUsers, internalInitialUsers])

  const diffs = isControlled && props.diffs ? props.diffs : internalDiffs
  const hasDirtyChanges = diffs.length > 0

  const handleRoleChange = (id: string, newRole: RoleKey) => {
    if (props.onRoleChange) {
      props.onRoleChange(id, newRole)
    } else {
      setInternalUsers(prev =>
        prev.map(u => {
          if (u.id !== id) return u
          return { ...u, role: newRole, isDirty: true }
        })
      )
    }
  }

  const handleRemoveCompany = (id: string, co: string) => {
    if (props.onRemoveCompany) {
      props.onRemoveCompany(id, co)
    } else {
      setInternalUsers(prev =>
        prev.map(u => {
          if (u.id !== id) return u
          return { ...u, companies: u.companies.filter(c => c !== co), isDirty: true }
        })
      )
    }
  }

  const handleAddCompany = (id: string, co: string) => {
    if (props.onAddCompany) {
      props.onAddCompany(id, co)
    } else {
      setInternalUsers(prev =>
        prev.map(u => {
          if (u.id !== id || u.companies.includes(co)) return u
          return { ...u, companies: [...u.companies, co], isDirty: true }
        })
      )
    }
  }

  const handleRemoveReceiver = (id: string, rcv: string) => {
    if (props.onRemoveReceiver) {
      props.onRemoveReceiver(id, rcv)
    } else {
      setInternalUsers(prev =>
        prev.map(u => {
          if (u.id !== id) return u
          return { ...u, receivers: u.receivers.filter(r => r !== rcv), isDirty: true }
        })
      )
    }
  }

  const handleAddReceiver = (id: string, rcv: string) => {
    const trimmed = rcv.trim().toUpperCase()
    if (!trimmed) return
    if (props.onAddReceiver) {
      props.onAddReceiver(id, trimmed)
    } else {
      setInternalUsers(prev =>
        prev.map(u => {
          if (u.id !== id || u.receivers.includes(trimmed)) return u
          return { ...u, receivers: [...u.receivers, trimmed], isDirty: true }
        })
      )
    }
  }

  const handleDeleteUser = (id: string) => {
    if (props.onDeleteUser) {
      props.onDeleteUser(id)
    } else {
      setInternalUsers(prev =>
        prev.map(u => {
          if (u.id !== id) return u
          return { ...u, isDeleted: true, isDirty: true }
        })
      )
    }
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
    if (props.onAddFromAd) {
      props.onAddFromAd(newUser)
      return
    }

    // Check if user already exists
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

    setInternalUsers(prev => [created, ...prev])
    toast(`เพิ่ม ${newUser.name} เรียบร้อยแล้ว (รอยืนยันบันทึก)`)
  }

  const handleSaveAll = async () => {
    if (props.onSaveAll) {
      await props.onSaveAll()
      return
    }

    setInternalSaving(true)
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
      setInternalSaving(false)
    }
  }

  const handleRowClick = (u: ManagedUser) => {
    if (props.onSelectUser) {
      props.onSelectUser(u)
    } else {
      setInternalSelectedId(u.id)
    }
  }

  return (
    <div className="perm-admin">
      {/* Top Toolbar */}
      <div className="perm-bar">
        <div className="perm-ttl">
          <span>สิทธิ์และการเชื่อมบัญชี (Admin Grid)</span>
          <span style={{ fontSize: 11, background: 'var(--s-200)', padding: '2px 8px', borderRadius: 999 }}>
            {filteredUsers.length} คน
          </span>
        </div>

        <div className="perm-srch">
          <input
            type="text"
            placeholder="ค้นหาชื่อ, username, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn-xl-add"
            onClick={() => (props.onOpenAddModal ? props.onOpenAddModal() : setIsAddModalOpen(true))}
          >
            + เพิ่มผู้ใช้จาก AD (LDAP)
          </button>

          <button
            type="button"
            className="btn-xl-save"
            disabled={!hasDirtyChanges || isSaving}
            onClick={() => (props.onOpenDiffModal ? props.onOpenDiffModal() : setIsDiffModalOpen(true))}
          >
            บันทึกการเปลี่ยนแปลง {hasDirtyChanges && `(${diffs.length})`}
          </button>
        </div>
      </div>

      {/* Excel Sheet */}
      <div className="perm-sheet">
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--s-400)' }}>กำลังโหลดข้อมูลผู้ใช้…</div>
        ) : (
          <table className="xl-grid">
            <thead>
              <tr>
                <th className="n">#</th>
                <th style={{ width: 170 }}>ชื่อ - นามสกุล</th>
                <th style={{ width: 110 }}>Username</th>
                <th style={{ width: 190 }}>Email (Canonical ID)</th>
                <th style={{ width: 160 }}>สิทธิ์ (Role)</th>
                <th>ขอบเขต (Company / Oracle Receiver)</th>
                <th style={{ width: 44, textAlign: 'center' }}>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--s-400)' }}>
                    ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isRowDirty = u.isNew || u.isDirty
                  const isSelected = selectedUserId === u.id
                  return (
                    <tr
                      key={u.id}
                      className={`${u.isNew ? 'newr' : isRowDirty ? 'dirty' : ''} ${isSelected ? 'sel' : ''}`}
                      onClick={() => handleRowClick(u)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="n">{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--s-600)' }}>{u.samAccount}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-text)' }}>{u.email}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          className="perm-rin"
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value as RoleKey)}
                        >
                          {(['EU', 'ACC', 'APR', 'ADM', 'SA'] as RoleKey[]).map(rk => (
                            <option key={rk} value={rk}>
                              {rk} — {ROLES[rk].n}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="chip-wrap">
                          {u.role === 'EU' ? (
                            <>
                              {u.receivers.map(r => (
                                <span key={r} className="perm-chip">
                                  {r}
                                  <button onClick={() => handleRemoveReceiver(u.id, r)}>✕</button>
                                </span>
                              ))}
                              <input
                                type="text"
                                placeholder="+ พิมพ์ Receiver กด Enter"
                                style={{
                                  border: 0,
                                  outline: 0,
                                  fontSize: 11,
                                  width: 140,
                                  background: 'transparent',
                                  color: 'inherit',
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddReceiver(u.id, e.currentTarget.value)
                                    e.currentTarget.value = ''
                                  }
                                }}
                              />
                            </>
                          ) : u.role === 'ACC' || u.role === 'APR' ? (
                            <>
                              {u.companies.map(co => (
                                <span key={co} className="perm-chip co">
                                  {co}
                                  <button onClick={() => handleRemoveCompany(u.id, co)}>✕</button>
                                </span>
                              ))}
                              {AVAILABLE_COMPANIES.filter(c => !u.companies.includes(c)).map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleAddCompany(u.id, c)}
                                  style={{
                                    border: '1px dashed var(--s-300)',
                                    borderRadius: 4,
                                    background: 'var(--surface)',
                                    fontSize: 10,
                                    padding: '1px 5px',
                                    cursor: 'pointer',
                                    color: 'var(--s-600)',
                                  }}
                                >
                                  + {c}
                                </button>
                              ))}
                            </>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--s-400)' }}>ไม่ใช้ขอบเขต (Admin ทั้งระบบ)</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="perm-del"
                          title="ลบสิทธิ์ผู้ใช้นี้"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {!isControlled && (
        <>
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
        </>
      )}
    </div>
  )
}
