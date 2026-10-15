'use client'

import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { PERMISSION_DESCRIPTIONS, acctsOf } from '../../mock/users'
import { Icon } from '../common/Icon'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function MyProfileModal({ isOpen, onClose }: Props) {
  const { currentUser, currentRole } = useAuth()

  if (!isOpen) return null

  const accounts = acctsOf(currentUser)
  const isEu = currentUser.role === 'EU'

  return (
    <div
      className="modal-ov"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
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
        className="modal-box"
        style={{
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
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
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                ข้อมูลและสิทธิ์การใช้งานของฉัน
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
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
              color: '#64748B',
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
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>ชื่อ - นามสกุล</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{currentUser.n}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>บทบาท (Role)</span>
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
              <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>อีเมลองค์กร (Entra ID)</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#2563EB' }}>{currentUser.email}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>หน่วยงาน / สังกัด</span>
              <span style={{ fontSize: 13, color: '#334155' }}>{currentUser.unit || '—'}</span>
            </div>
            {currentUser.emp && (
              <div>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>รหัสพนักงาน</span>
                <span style={{ fontSize: 13, color: '#334155' }}>{currentUser.emp}</span>
              </div>
            )}
          </div>

          {/* Scope Access Card */}
          <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: '#334155' }}>
              ขอบเขตข้อมูลที่เข้าถึงได้ (Scope Access)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#64748B', width: 130 }}>บริษัทที่รับผิดชอบ:</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {currentUser.co.length > 0 ? (
                    currentUser.co.map(c => (
                      <span
                        key={c}
                        style={{
                          background: '#E2E8F0',
                          color: '#1E293B',
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
                    <span style={{ color: '#64748B' }}>ทุกบริษัท (ผู้ดูแลระบบ)</span>
                  )}
                </div>
              </div>

              {isEu && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#64748B', width: 130 }}>Oracle Receiver:</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {accounts.length > 0 ? (
                      accounts.map(a => (
                        <span
                          key={a}
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #BFDBFE',
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
                      <span style={{ color: '#64748B' }}>— ยังไม่มีบัญชีเชื่อมโยง</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: '#334155' }}>
              สิทธิ์ที่ได้รับอนุญาต ({currentRole.p.length} รายการ)
            </h4>
            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                overflow: 'hidden',
                maxHeight: 220,
                overflowY: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', width: 40, textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '8px 12px', width: 140 }}>รหัสสิทธิ์</th>
                    <th style={{ padding: '8px 12px' }}>คำอธิบายสิทธิ์</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRole.p.map(perm => (
                    <tr key={perm} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#16A34A', fontWeight: 'bold' }}>
                        ✓
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                        {perm}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>
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
            borderTop: '1px solid #F1F5F9',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              background: '#fff',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyProfileModal
