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

const AVAILABLE_COMPANIES = ['AH', 'AHT', 'AHP', 'AM']

export function PermissionExcelGrid() {
  const { toast } = useToastModal()
  const [initialUsers, setInitialUsers] = useState<ManagedUser[]>([])
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load users from backend
  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        if (data.ok && Array.isArray(data.users)) {
          setInitialUsers(JSON.parse(JSON.stringify(data.users)))
          setUsers(data.users)
        }
      }
    } catch (err) {
      console.warn('Failed to load users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

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

  // Track differences
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

  const handleRoleChange = (id: string, newRole: RoleKey) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id) return u
        return { ...u, role: newRole, isDirty: true }
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

    setUsers(prev => [created, ...prev])
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

  return (
    <div className="perm-admin">
      {/* Top Toolbar */}
      <div className="perm-bar">
        <div className="perm-ttl">
          <span>สิทธิ์และการเชื่อมบัญชี (Admin Grid)</span>
          <span style={{ fontSize: 11, background: '#E2E8F0', padding: '2px 8px', borderRadius: 999 }}>
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
            onClick={() => setIsAddModalOpen(true)}
          >
            + เพิ่มผู้ใช้จาก AD (LDAP)
          </button>

          <button
            type="button"
            className="btn-xl-save"
            disabled={!hasDirtyChanges || isSaving}
            onClick={() => setIsDiffModalOpen(true)}
          >
            บันทึกการเปลี่ยนแปลง {hasDirtyChanges && `(${diffs.length})`}
          </button>
        </div>
      </div>

      {/* Excel Sheet */}
      <div className="perm-sheet">
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>กำลังโหลดข้อมูลผู้ใช้…</div>
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>
                    ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isRowDirty = u.isNew || u.isDirty
                  return (
                    <tr key={u.id} className={u.isNew ? 'newr' : isRowDirty ? 'dirty' : ''}>
                      <td className="n">{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ fontFamily: 'monospace', color: '#475569' }}>{u.samAccount}</td>
                      <td style={{ fontFamily: 'monospace', color: '#2563EB' }}>{u.email}</td>
                      <td>
                        <select
                          className="perm-rin"
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value as RoleKey)}
                        >
                          {(['EU', 'ACC', 'APR', 'ADM'] as RoleKey[]).map(rk => (
                            <option key={rk} value={rk}>
                              {rk} — {ROLES[rk].n}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
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
                                  onClick={() => handleAddCompany(u.id, c)}
                                  style={{
                                    border: '1px dashed #B8C0CC',
                                    borderRadius: 4,
                                    background: '#fff',
                                    fontSize: 10,
                                    padding: '1px 5px',
                                    cursor: 'pointer',
                                    color: '#64748B',
                                  }}
                                >
                                  + {c}
                                </button>
                              ))}
                            </>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>ไม่ใช้ขอบเขต (Admin ทั้งระบบ)</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="perm-del-btn"
                          title="ลบผู้ใช้"
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
      <AdUserSearchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddUser={handleAddFromAd}
      />

      {/* Save Diff Modal */}
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
