'use client'

import React, { useState } from 'react'
import { USERS, ROLES, acctsOf } from '@/mock/users'
import { Icon } from '@/components/common/Icon'

const TEST_COMPANIES = ['AH', 'AHT', 'AHP', 'AM', 'AAP', 'AEV']
const TEST_RECEIVERS = ['SOMSAK JAIDEE', 'WILAIWAN SRISOOK', 'SUPAPORN K', 'ANY OTHER']

export function VisibilityTester() {
  const [selectedUserId, setSelectedUserId] = useState(USERS[0].id)
  const [targetCompany, setTargetCompany] = useState('AH')
  const [targetReceiver, setTargetReceiver] = useState('SOMSAK JAIDEE')

  const selectedUser = USERS.find(u => u.id === selectedUserId) || USERS[0]
  const roleInfo = ROLES[selectedUser.role]

  // Visibility logic evaluation
  const isSuperAdmin = selectedUser.role === 'SA'
  const isCompanyAllowed = isSuperAdmin || selectedUser.co.includes(targetCompany)
  
  let isReceiverAllowed = true
  if (selectedUser.role === 'EU') {
    // End users require receiver match
    const userRecs = acctsOf(selectedUser).map((r: string) => r.toUpperCase())
    isReceiverAllowed = userRecs.includes(targetReceiver.toUpperCase())
  }

  const isVisible = isSuperAdmin || (isCompanyAllowed && isReceiverAllowed)

  return (
    <div className="pm-tst" data-testid="visibility-tester">
      {/* Left rail: User personas */}
      <aside className="pm-rail">
        <div className="ph">เลือก Persona เพื่อจำลอง</div>
        {USERS.map(u => {
          const r = ROLES[u.role]
          const isSelected = u.id === selectedUserId
          return (
            <button
              key={u.id}
              type="button"
              className={`pm-ri ${isSelected ? 'on' : ''}`}
              onClick={() => setSelectedUserId(u.id)}
            >
              <div
                className="pm-av"
                style={{ background: r.bg, color: r.c }}
              >
                {u.n[0]}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <b>{u.n}</b>
                <span className="s">{u.role} · {u.unit}</span>
              </div>
              <span className="n" style={{ color: r.c }}>{u.role}</span>
            </button>
          )
        })}
      </aside>

      {/* Main pane: Tester controls & evaluation */}
      <div className="pm-tmain">
        <div className="panel-h" style={{ padding: '4px 0', border: 0 }}>
          <div>
            <h3>จำลองการมองเห็นเอกสาร (Visibility Tester Sandbox)</h3>
            <span style={{ fontSize: 12, color: 'var(--s-500)', display: 'block', marginTop: 2 }}>
              ทดสอบกฎการเข้าถึงเอกสาร Invoice ตาม Role, Company Scopes และ Oracle Receiver Mapping
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="pm-tctl">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--s-600)' }}>
              บริษัทของเอกสาร:
            </span>
            <select
              value={targetCompany}
              onChange={e => setTargetCompany(e.target.value)}
              className="sel"
              style={{ height: 30, fontSize: 12 }}
            >
              {TEST_COMPANIES.map(co => (
                <option key={co} value={co}>
                  {co}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--s-600)' }}>
              Oracle Receiver บนเอกสาร:
            </span>
            <select
              value={targetReceiver}
              onChange={e => setTargetReceiver(e.target.value)}
              className="sel"
              style={{ height: 30, fontSize: 12 }}
            >
              {TEST_RECEIVERS.map(rcv => (
                <option key={rcv} value={rcv}>
                  {rcv}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Evaluation Result Card */}
        <div
          className="panel"
          style={{
            padding: 16,
            background: isVisible ? 'var(--ok-bg)' : 'var(--err-bg)',
            borderColor: isVisible ? 'var(--ok-bd)' : 'var(--err-bd)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: isVisible ? 'var(--ok)' : 'var(--err)',
                color: '#fff',
              }}
            >
              <Icon name={isVisible ? 'check' : 'x'} size="md" />
            </span>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: isVisible ? 'var(--ok)' : 'var(--err)' }}>
                {isVisible ? 'อนุญาตให้มองเห็นและประมวลผลเอกสาร' : 'ปฏิเสธการเข้าถึง (เอกสารจะไม่แสดงในคิว)'}
              </h4>
              <span style={{ fontSize: 12, color: 'var(--s-600)' }}>
                ผู้ใช้ {selectedUser.n} ({selectedUser.role}) · เอกสารบริษัท {targetCompany} · Receiver {targetReceiver}
              </span>
            </div>
          </div>

          {/* Evaluation Rules Breakdown */}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--s-500)', fontWeight: 700 }}>1. บทบาทและสิทธิ์พิเศษ</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="role-pill" style={{ background: roleInfo.bg, color: roleInfo.c }}>
                  {selectedUser.role}
                </span>
                <span>{isSuperAdmin ? '✓ สิทธิ์สูงสุด (เห็นทุกบริษัท)' : 'ตรวจสอบเงื่อนไขขอบเขต'}</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--s-500)', fontWeight: 700 }}>2. ขอบเขตบริษัท (Company Scope)</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: isCompanyAllowed ? 'var(--ok)' : 'var(--err)' }}>
                {isCompanyAllowed ? '✓ ผ่าน (มีสิทธิ์ในบริษัทนี้)' : '✕ ไม่ผ่าน (ไม่อยู่ใน Scope)'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--s-500)', marginTop: 2 }}>
                สิทธิ์ที่มี: {selectedUser.co.join(', ') || 'ไม่มี'}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 6, border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--s-500)', fontWeight: 700 }}>3. ผู้ตรวจรับ (Oracle Receiver)</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: isReceiverAllowed ? 'var(--ok)' : 'var(--err)' }}>
                {selectedUser.role !== 'EU' ? '— ละเว้น (ไม่ใช่ EU)' : isReceiverAllowed ? '✓ ตรงกับบัญชีที่ผูกไว้' : '✕ ไม่ตรงกับบัญชีที่ผูก'}
              </div>
              {selectedUser.role === 'EU' && (
                <div style={{ fontSize: 11, color: 'var(--s-500)', marginTop: 2 }}>
                  บัญชีที่ผูก: {acctsOf(selectedUser).join(', ') || 'ไม่มี'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Visibility Matrix Table */}
        <div className="panel" style={{ marginTop: 8 }}>
          <div className="panel-h">
            <h4>ตารางตรวจสอบขอบเขตบริษัททั้งหมดสำหรับ {selectedUser.n}</h4>
          </div>
          <table className="pm-vm">
            <thead>
              <tr>
                <th>Company</th>
                {TEST_COMPANIES.map(co => (
                  <th key={co}>{co}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, textAlign: 'left', paddingLeft: 8 }}>ผลการมองเห็น</td>
                {TEST_COMPANIES.map(co => {
                  const allowed = isSuperAdmin || selectedUser.co.includes(co)
                  return (
                    <td key={co} className={allowed ? 'h' : ''}>
                      {allowed ? '✓' : '—'}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
