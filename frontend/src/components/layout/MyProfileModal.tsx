'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { PERMISSION_DESCRIPTIONS, acctsOf } from '../../mock/users'
import { Icon } from '../common/Icon'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function MyProfileModal({ isOpen, onClose }: Props) {
  const { currentUser, currentRole } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const accounts = acctsOf(currentUser)
  const isEu = currentUser.role === 'EU'

  return createPortal(
    <div
      className="modal-ov profile-modal-ov"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-box profile-modal-box"
        style={{
          background: 'var(--glass-2, var(--surface))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 16,
          boxShadow: 'var(--e-3), 0 24px 64px rgba(0, 0, 0, 0.45)',
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--line-strong)',
          color: 'var(--s-900)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: currentRole.bg,
                color: currentRole.c,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="user" size="md" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--s-900)' }}>
                ข้อมูลและสิทธิ์การใช้งานของฉัน
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--s-500)' }}>
                โปรไฟล์ผู้ใช้และขอบเขตสิทธิ์ตามบทบาทองค์กร (RBAC)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างโปรไฟล์"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--s-500)',
              fontSize: 18,
              padding: 6,
              borderRadius: 6
            }}
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Identity Card */}
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: 'var(--s-500)', display: 'block', fontWeight: 600 }}>ชื่อ - นามสกุล</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--s-900)' }}>{currentUser.n}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--s-500)', display: 'block', fontWeight: 600 }}>บทบาท (Role)</span>
              <span
                className="role-pill"
                style={{
                  background: currentRole.bg,
                  color: currentRole.c,
                  display: 'inline-block',
                  marginTop: 2
                }}
              >
                {currentRole.n}
              </span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--s-500)', display: 'block', fontWeight: 600 }}>อีเมลองค์กร (Entra ID)</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--t-blue)' }}>{currentUser.email}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--s-500)', display: 'block', fontWeight: 600 }}>หน่วยงาน / สังกัด</span>
              <span style={{ fontSize: 13, color: 'var(--s-700)' }}>{currentUser.unit || '—'}</span>
            </div>
            {currentUser.emp && (
              <div>
                <span style={{ fontSize: 11, color: 'var(--s-500)', display: 'block', fontWeight: 600 }}>รหัสพนักงาน</span>
                <span style={{ fontSize: 13, color: 'var(--s-700)' }}>{currentUser.emp}</span>
              </div>
            )}
          </div>

          {/* Scope Access Card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: 'var(--s-900)' }}>
              ขอบเขตข้อมูลที่เข้าถึงได้ (Scope Access)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--s-500)', width: 130 }}>บริษัทที่รับผิดชอบ:</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {currentUser.co.length > 0 ? (
                    currentUser.co.map(c => (
                      <span
                        key={c}
                        style={{
                          background: 'var(--surface-2)',
                          color: 'var(--s-900)',
                          border: '1px solid var(--line)',
                          padding: '1px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                          fontSize: 11
                        }}
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--s-500)' }}>ทุกบริษัท (ผู้ดูแลระบบ)</span>
                  )}
                </div>
              </div>

              {isEu && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--s-500)', width: 130 }}>Oracle Receiver:</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {accounts.length > 0 ? (
                      accounts.map(a => (
                        <span
                          key={a}
                          style={{
                            background: 'var(--t-blue-bg)',
                            color: 'var(--t-blue)',
                            border: '1px solid var(--info-bd, var(--line))',
                            padding: '1px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: 11
                          }}
                        >
                          {a}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--s-500)' }}>— ยังไม่มีบัญชีเชื่อมโยง</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: 'var(--s-900)' }}>
              สิทธิ์ที่ได้รับอนุญาต ({currentRole.p.length} รายการ)
            </h4>
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 10,
                overflow: 'hidden',
                maxHeight: 220,
                overflowY: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', width: 40, textAlign: 'center', color: 'var(--s-600)' }}>สถานะ</th>
                    <th style={{ padding: '8px 12px', width: 140, color: 'var(--s-600)' }}>รหัสสิทธิ์</th>
                    <th style={{ padding: '8px 12px', color: 'var(--s-600)' }}>คำอธิบายสิทธิ์</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRole.p.map(perm => (
                    <tr key={perm} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--ok, #16A34A)', fontWeight: 'bold' }}>
                        ✓
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--s-900)' }}>
                        {perm}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--s-600)' }}>
                        {PERMISSION_DESCRIPTIONS[perm] || perm}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--line)',
            background: 'var(--surface-2)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 18px',
              borderRadius: 6,
              border: '1px solid var(--line-strong)',
              background: 'var(--surface)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--s-900)'
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default MyProfileModal
