'use client'

import React from 'react'
import { createPortal } from 'react-dom'

import type { RoleKey } from '@/types/auth'

export interface UserDiff {
  user: {
    id: string
    name: string
    email: string
    samAccount?: string | null
    empId?: string | null
    unit?: string | null
    role: RoleKey
    companies: string[]
    receivers: string[]
    isNew?: boolean
  }
  type: 'added' | 'modified' | 'deleted'
}

interface Props {
  isOpen: boolean
  diffs: UserDiff[]
  isSaving: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SaveDiffModal({ isOpen, diffs, isSaving, onClose, onConfirm }: Props) {
  if (!isOpen) return null

  // v5.3.1: portal ไป document.body กัน overlay ถูกกักใน parent ที่มี transform/backdrop-filter (เช่นระหว่างแอนิเมชันเข้าแอป)
  return createPortal(
    <div className="modal-ov" role="dialog" aria-modal="true">
      <div className="modal-box" style={{ maxWidth: 540 }}>
        <div className="modal-h">
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>ยืนยันการบันทึกการเปลี่ยนแปลงสิทธิ์</h3>
          <button onClick={onClose} style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 18 }}>
            ✕
          </button>
        </div>

        <div className="modal-b">
          <p style={{ fontSize: 12.5, color: '#475569', marginBottom: 12 }}>
            พบรายการที่มีการเปลี่ยนแปลงทั้งหมด <b>{diffs.length}</b> รายการ ดังนี้:
          </p>

          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #E2E8F0', borderRadius: 6 }}>
            {diffs.map((d, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: d.type === 'added' ? '#F1FAF4' : d.type === 'deleted' ? '#FEF2F2' : '#FFFBEB',
                }}
              >
                <div>
                  <b>{d.user.name}</b> <span style={{ fontSize: 11, color: '#64748B' }}>({d.user.email})</span>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                    Role: <b>{d.user.role}</b> · Scope:{' '}
                    {d.user.role === 'EU'
                      ? d.user.receivers.join(', ') || '—'
                      : d.user.companies.join(', ') || '—'}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: d.type === 'added' ? '#D1FAE5' : d.type === 'deleted' ? '#FEE2E2' : '#FEF3C7',
                    color: d.type === 'added' ? '#065F46' : d.type === 'deleted' ? '#991B1B' : '#92400E',
                  }}
                >
                  {d.type === 'added' ? '+ เพิ่มใหม่' : d.type === 'deleted' ? '- ลบออก' : '✎ แก้ไข'}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 6,
              fontSize: 11.5,
              color: '#92400E',
            }}
          >
            การบันทึกจะเขียนข้อมูลลงฐานข้อมูลจริง พร้อมสร้างบันทึก Audit Trail ของ IT Admin ทันที
          </div>
        </div>

        <div className="modal-f">
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '6px 14px',
              borderRadius: 5,
              border: '1px solid #CBD5E1',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            style={{
              padding: '6px 16px',
              borderRadius: 5,
              border: 0,
              background: '#0D274D',
              color: '#fff',
              fontWeight: 600,
              cursor: isSaving ? 'wait' : 'pointer',
            }}
          >
            {isSaving ? 'กำลังบันทึก…' : 'ยืนยันบันทึก'}
          </button>
        </div>
      </div>
    </div>
    ,
    document.body,
  )
}
