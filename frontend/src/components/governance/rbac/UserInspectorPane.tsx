'use client'

import React, { useState } from 'react'
import { RoleKey, Permission } from '@/types/auth'
import { ROLES, PERMISSION_DESCRIPTIONS } from '@/mock/users'
import { ManagedUser } from './PermissionExcelGrid'
import { Icon } from '@/components/common/Icon'

interface UserInspectorPaneProps {
  user: ManagedUser | null
  onRoleChange: (newRole: RoleKey) => void
  onToggleCompany: (company: string) => void
  onAddReceiver?: (receiver: string) => void
  onRemoveReceiver?: (receiver: string) => void
  availableCompanies?: string[]
}

const DEFAULT_COMPANIES = ['AH', 'AHT', 'AHP', 'AM']

export function UserInspectorPane({
  user,
  onRoleChange,
  onToggleCompany,
  onAddReceiver,
  onRemoveReceiver,
  availableCompanies = DEFAULT_COMPANIES,
}: UserInspectorPaneProps) {
  const [newReceiver, setNewReceiver] = useState('')

  if (!user) {
    return (
      <div className="pm-insp" data-testid="user-inspector-pane">
        <div className="empty" style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--s-400)' }}>
          <Icon name="user" size="lg" />
          <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>
            เลือกผู้ใช้งานในตารางเพื่อดูและแก้ไขสิทธิ์อย่างละเอียด
          </p>
          <span style={{ fontSize: 11.5 }}>
            สามารถปรับ Role, กำหนด Company Scope, ผูก Oracle Receiver และดูสิทธิ์ที่ได้รับ
          </span>
        </div>
      </div>
    )
  }

  const roleInfo = ROLES[user.role]
  const userInitials = user.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleAddRcv = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newReceiver.trim() && onAddReceiver) {
      e.preventDefault()
      onAddReceiver(newReceiver.trim())
      setNewReceiver('')
    }
  }

  const allPermissions = Object.keys(PERMISSION_DESCRIPTIONS) as Permission[]

  return (
    <aside className="pm-insp" data-testid="user-inspector-pane">
      {/* User Header */}
      <div className="pm-ih">
        <div
          className="pm-av lg"
          style={{ background: roleInfo.bg, color: roleInfo.c }}
        >
          {userInitials || 'U'}
        </div>
        <div className="pm-ihm">
          <b>
            <span>{user.name}</span>
            <span
              className="role-pill"
              style={{ background: roleInfo.bg, color: roleInfo.c, fontSize: 11 }}
            >
              {user.role} — {roleInfo.n}
            </span>
          </b>
          <div className="e">
            <Icon name="msg" size="sm" />
            <span>{user.email}</span>
          </div>
          {user.unit && (
            <div style={{ fontSize: 11, color: 'var(--s-500)', marginTop: 2 }}>
              แผนก/หน่วยงาน: {user.unit}
            </div>
          )}
        </div>
      </div>

      {/* Role Selection Section */}
      <div className="pm-sec">
        <div className="pm-sh">
          <h4>บทบาทในระบบ (Role)</h4>
          <span>เลือก 1 บทบาท</span>
        </div>
        <div className="pm-sb2">
          <div className="pm-rcs">
            {(['EU', 'ACC', 'APR', 'ADM', 'SA'] as RoleKey[]).map(rk => {
              const r = ROLES[rk]
              const isSelected = user.role === rk
              return (
                <button
                  key={rk}
                  type="button"
                  data-testid={`role-card-${rk}`}
                  className={`pm-rc ${isSelected ? 'on' : ''}`}
                  onClick={() => onRoleChange(rk)}
                >
                  <span
                    className="pm-rk"
                    style={{ background: r.bg, color: r.c }}
                  >
                    {rk}
                  </span>
                  <b>{r.n}</b>
                  <span className="s">{rk === 'SA' ? 'Super Admin' : r.p.length + ' สิทธิ์'}</span>
                  {isSelected && <Icon name="check" size="sm" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Company Scopes Section */}
      <div className="pm-sec">
        <div className="pm-sh">
          <h4>ขอบเขตบริษัท (Company Scope)</h4>
          <span>{user.companies.length} บริษัท</span>
        </div>
        <div className="pm-sb2">
          <div className="pm-tgs">
            {availableCompanies.map(co => {
              const isChecked = user.companies.includes(co)
              return (
                <button
                  key={co}
                  type="button"
                  className={`pm-tg ${isChecked ? 'on' : ''}`}
                  onClick={() => onToggleCompany(co)}
                >
                  <span className="pm-bx">
                    {isChecked && <Icon name="check" size="sm" />}
                  </span>
                  <span>{co}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Oracle Receivers Section (EU role only) */}
      {user.role === 'EU' && (
        <div className="pm-sec">
          <div className="pm-sh">
            <h4>Oracle Receiver Accounts</h4>
            <span>{user.receivers.length} บัญชี</span>
          </div>
          <div className="pm-sb2">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {user.receivers.length === 0 ? (
                <span style={{ fontSize: 11.5, color: 'var(--s-400)' }}>
                  ยังไม่ได้ผูกบัญชี Receiver
                </span>
              ) : (
                user.receivers.map(rcv => (
                  <span key={rcv} className="perm-chip">
                    {rcv}
                    {onRemoveReceiver && (
                      <button
                        type="button"
                        onClick={() => onRemoveReceiver(rcv)}
                        aria-label={`ลบ ${rcv}`}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))
              )}
            </div>
            {onAddReceiver && (
              <input
                type="text"
                placeholder="+ พิมพ์ Receiver Name กด Enter"
                value={newReceiver}
                onChange={e => setNewReceiver(e.target.value)}
                onKeyDown={handleAddRcv}
                style={{
                  width: '100%',
                  fontSize: 12,
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--line-strong)',
                  background: 'var(--surface)',
                  color: 'inherit',
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Permitted Operations Section */}
      <div className="pm-sec">
        <div className="pm-sh">
          <h4>สิทธิ์ที่ได้รับอนุญาต ({roleInfo.p.length}/{allPermissions.length})</h4>
          <span>อิงตาม {user.role}</span>
        </div>
        <div className="pm-sb2">
          <div className="pm-perm">
            {allPermissions.map(pk => {
              const hasPerm = roleInfo.p.includes(pk)
              return (
                <div
                  key={pk}
                  className={`pm-p ${hasPerm ? 'on' : ''}`}
                  title={PERMISSION_DESCRIPTIONS[pk]}
                >
                  <span>{pk}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
