'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { RoleKey } from '@/types/auth'
import { ROLES } from '@/mock/users'
import { COMPANIES } from '@/mock/companies'
import { AdUserSearchModal } from './AdUserSearchModal'
import { SaveDiffModal, UserDiff } from './SaveDiffModal'
import { useToastModal } from '@/context/ToastModalContext'
import { Icon } from '../../common/Icon'
import '@/styles/permissionGrid.css' // ยังใช้กับ modal (.modal-*, .perm-chip, .role-card)
import '@/styles/aiva/user-admin.css'

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
  isActive?: boolean
}

/** v5.11.1: from the company master — the hard-coded list missed AHA, so no one could be given AHA. */
const AVAILABLE_COMPANIES = Object.keys(COMPANIES).filter(k => k !== '?')

const sameSet = (a: string[], b: string[]) => {
  const x = [...a].map(s => s.toUpperCase()).sort()
  const y = [...b].map(s => s.toUpperCase()).sort()
  return x.length === y.length && x.every((v, i) => v === y[i])
}

/** Why a row cannot be saved as it is (mirrors the server's rules), or null. */
export function userRowProblem(u: Pick<ManagedUser, 'role' | 'companies' | 'receivers'>): string | null {
  if (u.role === 'EU' && u.receivers.length === 0) return 'End User ต้องผูก Oracle account อย่างน้อย 1 บัญชี'
  if ((u.role === 'ACC' || u.role === 'APR') && u.companies.length === 0) return 'ฝ่ายบัญชีต้องได้รับมอบหมายบริษัทอย่างน้อย 1 บริษัท'
  return null
}

/** ตัวอักษรแรกของชื่อ (ข้ามสระนำภาษาไทย) สำหรับอวาตาร์ */
const initialOf = (name: string): string => {
  const t = String(name || '').trim().replace(/^[เแโใไ]/, '')
  return t ? t.charAt(0).toUpperCase() : '?'
}

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
          // Deactivated users are history: not listed (re-adding the same e-mail re-activates them).
          const active = data.users.filter((u: ManagedUser) => u.isActive !== false)
          setInitialUsers(JSON.parse(JSON.stringify(active)))
          setUsers(active)
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
        // Compared on copies: `.sort()` on the state arrays used to reorder them in place.
        if (orig && (orig.role !== u.role || !sameSet(orig.companies, u.companies) || !sameSet(orig.receivers, u.receivers))) {
          res.push({ user: u, type: 'modified' })
        }
      }
    }
    return res
  }, [users, initialUsers])

  const hasDirtyChanges = diffs.length > 0
  // แถวที่ "ต่างจากค่าที่บันทึกไว้จริง" เท่านั้นที่ขึ้นป้ายแก้ไข (เลือกค่าเดิมกลับมาแล้วป้ายหายไป)
  const modifiedIds = useMemo(
    () => new Set(diffs.filter(d => d.type === 'modified').map(d => d.user.id)),
    [diffs]
  )

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
    // Kept as typed (Oracle names are mixed case, e.g. "AHT Die Making 03, K.Vinitda"); the
    // comparison is case-insensitive. Upper-casing it used to break the match with the document.
    const trimmed = rcv.normalize('NFKC').replace(/\s+/g, ' ').trim()
    if (!trimmed) return
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id || u.receivers.some(r => r.toUpperCase() === trimmed.toUpperCase())) return u
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

  /**
   * v5.11.1: every row is sent and its answer checked. Before, a refused row (or a network error)
   * still showed "saved", and a deleted row was never sent at all — the user kept every right.
   */
  const handleSaveAll = async () => {
    const invalid = diffs.filter(d => d.type !== 'deleted').map(d => ({ d, why: userRowProblem(d.user) })).filter(x => x.why)
    if (invalid.length) {
      toast(`${invalid[0].d.user.name}: ${invalid[0].why}`, true)
      return
    }
    setIsSaving(true)
    const failed: string[] = []
    try {
      for (const diff of diffs) {
        try {
          let res: Response | null = null
          if (diff.type === 'deleted') {
            if (diff.user.isNew) continue
            res = await fetch(`/api/users/${encodeURIComponent(diff.user.id)}`, { method: 'DELETE' })
          } else {
            res = await fetch('/api/users', {
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
                receivers: diff.user.role === 'EU' ? diff.user.receivers : [],
              }),
            })
          }
          const body = await res.json().catch(() => ({}))
          if (!res.ok || body?.ok === false) failed.push(`${diff.user.name}: ${body?.error || `HTTP ${res.status}`}`)
        } catch (err: any) {
          failed.push(`${diff.user.name}: ${err?.message || 'เชื่อมต่อไม่ได้'}`)
        }
      }
      if (failed.length) {
        toast(`บันทึกไม่สำเร็จ ${failed.length} รายการ · ${failed[0]}`, true)
      } else {
        toast('บันทึกการเปลี่ยนแปลงสิทธิ์ทั้งหมดสำเร็จ')
        setIsDiffModalOpen(false)
      }
      await loadUsers()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="ua">
      {/* แถบเครื่องมือ — ปุ่มใช้ .btn ของธีม: เพิ่ม = รอง · บันทึก = หลัก */}
      <div className="ua-bar">
        <label className="ua-search">
          <Icon name="search" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, username, email…"
            aria-label="ค้นหาผู้ใช้"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <span className="ua-count">{filteredUsers.length} คน</span>
        <span className="ua-sp" />
        <button type="button" className="btn btn-sec" onClick={() => setIsAddModalOpen(true)}>
          <Icon name="plus" size="sm" />
          เพิ่มผู้ใช้จาก AD (LDAP)
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!hasDirtyChanges || isSaving}
          onClick={() => setIsDiffModalOpen(true)}
        >
          <Icon name="save" size="sm" />
          บันทึกการเปลี่ยนแปลง{hasDirtyChanges ? ` (${diffs.length})` : ''}
        </button>
      </div>

      {isLoading ? (
        <div className="ua-state">กำลังโหลดข้อมูลผู้ใช้…</div>
      ) : (
        <div className="ua-wrap">
          <table className="ua-table">
            <thead>
              <tr>
                <th className="c-user">ผู้ใช้ (ชื่อ · username · email)</th>
                <th className="c-role">สิทธิ์ (Role)</th>
                <th>ขอบเขต (Company / Oracle Receiver)</th>
                <th className="c-act" aria-label="การจัดการ" />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="ua-state">
                    ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isRowDirty = u.isNew || modifiedIds.has(u.id)
                  return (
                    <tr key={u.id} className={u.isNew ? 'is-new' : isRowDirty ? 'is-dirty' : ''}>
                      <td>
                        <div className="ua-person">
                          <span
                            className="ua-av"
                            aria-hidden="true"
                            style={{ background: ROLES[u.role].bg, color: ROLES[u.role].c }}
                          >
                            {initialOf(u.name)}
                          </span>
                          <div className="ua-id">
                            <div className="ua-name">
                              <span title={u.name}>{u.name}</span>
                              {u.isNew ? (
                                <span className="ua-tag new">ใหม่</span>
                              ) : isRowDirty ? (
                                <span className="ua-tag dirty">แก้ไข</span>
                              ) : null}
                            </div>
                            <div className="ua-sub">
                              <span className="mono">{u.samAccount}</span>
                              <i>·</i>
                              <span className="mono" title={u.email}>
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ua-selwrap">
                          <select
                            className="ua-sel"
                            aria-label={`สิทธิ์ของ ${u.name}`}
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value as RoleKey)}
                          >
                            {(['EU', 'ACC', 'APR', 'ADM', 'SA'] as RoleKey[]).map(rk => (
                              <option key={rk} value={rk}>
                                {rk} — {ROLES[rk].n}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="ua-chips">
                          {u.role === 'EU' ? (
                            <>
                              {u.receivers.map(r => (
                                <span key={r} className="ua-chip rcv">
                                  {r}
                                  <button type="button" aria-label={`เอา ${r} ออก`} onClick={() => handleRemoveReceiver(u.id, r)}>
                                    <Icon name="x" />
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                className="ua-rcv-in"
                                placeholder="+ เพิ่ม Receiver (กด Enter)"
                                aria-label={`เพิ่ม Receiver ของ ${u.name}`}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddReceiver(u.id, e.currentTarget.value)
                                    e.currentTarget.value = ''
                                  }
                                }}
                                onBlur={e => {
                                  // พิมพ์ค้างแล้วคลิกที่อื่น (เช่นปุ่มบันทึก) ก็ถือว่าเพิ่ม — กันค่าหาย
                                  if (e.currentTarget.value.trim()) {
                                    handleAddReceiver(u.id, e.currentTarget.value)
                                    e.currentTarget.value = ''
                                  }
                                }}
                              />
                            </>
                          ) : u.role === 'ACC' || u.role === 'APR' ? (
                            <>
                              {u.companies.map(co => (
                                <span key={co} className="ua-chip">
                                  {co}
                                  <button type="button" aria-label={`เอา ${co} ออก`} onClick={() => handleRemoveCompany(u.id, co)}>
                                    <Icon name="x" />
                                  </button>
                                </span>
                              ))}
                              {AVAILABLE_COMPANIES.filter(c => !u.companies.includes(c)).map(c => (
                                <button key={c} type="button" className="ua-add" onClick={() => handleAddCompany(u.id, c)}>
                                  + {c}
                                </button>
                              ))}
                            </>
                          ) : (
                            <span className="ua-none">ไม่ใช้ขอบเขต (Admin ทั้งระบบ)</span>
                          )}
                        </div>
                      </td>
                      <td className="c-act">
                        <button
                          type="button"
                          className="ua-del"
                          title="ลบผู้ใช้"
                          aria-label={`ลบผู้ใช้ ${u.name}`}
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Icon name="trash" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="ua-foot">
        ชื่อ Receiver ต้องตรงกับค่า RECEIVER ใน Oracle ทุกตัวอักษร · ระบบจะแสดงรายการที่เปลี่ยนให้ตรวจก่อนบันทึกเสมอ
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
