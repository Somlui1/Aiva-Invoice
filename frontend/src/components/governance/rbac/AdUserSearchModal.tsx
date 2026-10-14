'use client'

import React, { useState, useEffect } from 'react'
import { RoleKey } from '@/types/auth'
import { ROLES } from '@/mock/users'

interface DirectoryEmployee {
  samAccount: string
  name: string
  email: string
  empId: string
  title: string
  unit: string
}

const AVAILABLE_COMPANIES = ['AH', 'AHT', 'AHP', 'AM']

interface Props {
  isOpen: boolean
  onClose: () => void
  onAddUser: (user: {
    name: string
    email: string
    samAccount: string
    empId: string
    unit: string
    role: RoleKey
    companies: string[]
    receivers: string[]
  }) => void
}

export function AdUserSearchModal({ isOpen, onClose, onAddUser }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DirectoryEmployee[]>([])
  const [selectedEmp, setSelectedEmp] = useState<DirectoryEmployee | null>(null)
  const [role, setRole] = useState<RoleKey>('EU')
  const [companies, setCompanies] = useState<string[]>([])
  const [receiverInput, setReceiverInput] = useState('')
  const [receivers, setReceivers] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedEmp(null)
      setRole('EU')
      setCompanies([])
      setReceivers([])
      setReceiverInput('')
      return
    }

    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const res = await fetch(`/api/ad/search?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.results || [])
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, isOpen])

  if (!isOpen) return null

  const handleSelectEmp = (emp: DirectoryEmployee) => {
    setSelectedEmp(emp)
    setSearchQuery('')
    setSearchResults([])
    // Auto-map Oracle receiver default if EU
    if (emp.name) {
      // Suggest capitalized name as standard Oracle receiver
      const suggestedRcv = emp.name.toUpperCase()
      setReceivers([suggestedRcv])
    }
  }

  const toggleCompany = (co: string) => {
    setCompanies(prev => (prev.includes(co) ? prev.filter(c => c !== co) : [...prev, co]))
  }

  const handleAddReceiver = () => {
    const val = receiverInput.trim().toUpperCase()
    if (val && !receivers.includes(val)) {
      setReceivers(prev => [...prev, val])
      setReceiverInput('')
    }
  }

  const handleRemoveReceiver = (rcv: string) => {
    setReceivers(prev => prev.filter(r => r !== rcv))
  }

  const handleConfirm = () => {
    if (!selectedEmp) return
    onAddUser({
      name: selectedEmp.name,
      email: selectedEmp.email,
      samAccount: selectedEmp.samAccount,
      empId: selectedEmp.empId,
      unit: selectedEmp.unit,
      role,
      companies: role === 'ACC' || role === 'APR' ? companies : [],
      receivers: role === 'EU' ? receivers : [],
    })
    onClose()
  }

  return (
    <div className="modal-ov" role="dialog" aria-modal="true">
      <div className="modal-box">
        <div className="modal-h">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>เพิ่มผู้ใช้จาก AD (LDAP)</h3>
            <p style={{ fontSize: 12, color: '#64748B' }}>
              ค้นหาจากบัญชีองค์กร และเชื่อมโยงสิทธิ์ด้วยอีเมล
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        <div className="modal-b">
          {!selectedEmp ? (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                ค้นหาผู้ใช้จาก Active Directory (LDAP)
              </label>
              <input
                type="text"
                className="perm-rin"
                style={{
                  border: '1px solid #B8C0CC',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 6,
                }}
                placeholder="พิมพ์ชื่อ, username หรือรหัสพนักงาน…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />

              {isSearching && (
                <div style={{ padding: 12, fontSize: 12, color: '#64748B' }}>กำลังค้นหา…</div>
              )}

              {searchResults.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    maxHeight: 220,
                    overflow: 'auto',
                  }}
                >
                  {searchResults.map(emp => (
                    <div
                      key={emp.samAccount}
                      onClick={() => handleSelectEmp(emp)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <div>
                        <b>{emp.name}</b> <span style={{ color: '#64748B' }}>({emp.samAccount})</span>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {emp.email} · {emp.unit} · {emp.title}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, background: '#E2E8F0', padding: '2px 6px', borderRadius: 4 }}>
                        รหัส {emp.empId}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Selected Employee Card with Auto-mapped fields */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#F1FAF4',
                  border: '1px solid #217346',
                  borderRadius: 8,
                  marginBottom: 14,
                }}
              >
                <div>
                  <b style={{ fontSize: 14 }}>{selectedEmp.name}</b>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                    <span>{selectedEmp.email}</span> · <span>{selectedEmp.samAccount}</span> · รหัส{' '}
                    <span>{selectedEmp.empId}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                    {selectedEmp.unit} · {selectedEmp.title}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmp(null)}
                  style={{
                    background: '#fff',
                    border: '1px solid #CBD5E1',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  เปลี่ยน
                </button>
              </div>

              {/* Role Selection */}
              <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                เลือกบทบาท (Role)
              </label>
              <div className="role-cards">
                {(['EU', 'ACC', 'APR', 'ADM'] as RoleKey[]).map(rk => (
                  <div
                    key={rk}
                    className={`role-card ${role === rk ? 'on' : ''}`}
                    onClick={() => setRole(rk)}
                  >
                    <div>
                      <b style={{ color: ROLES[rk].c }}>{ROLES[rk].n} ({rk})</b>
                      <small>
                        {rk === 'EU' && 'เห็นเฉพาะเอกสารที่ตนเป็น Receiver'}
                        {rk === 'ACC' && 'ตรวจสอบและยืนยันเอกสารตามบริษัท'}
                        {rk === 'APR' && 'อนุมัติ ส่งเข้า AP Interface'}
                        {rk === 'ADM' && 'ผู้ดูแลระบบ จัดการสิทธิ์'}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Scope Configuration */}
              <div style={{ marginTop: 16 }}>
                {role === 'EU' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                      Oracle Receiver Account (ชื่อในใบรับของ)
                    </label>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <input
                        type="text"
                        className="perm-rin"
                        style={{ border: '1px solid #B8C0CC', borderRadius: 4, padding: '0 8px' }}
                        placeholder="เช่น SOMSAK JAIDEE"
                        value={receiverInput}
                        onChange={e => setReceiverInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddReceiver())}
                      />
                      <button
                        type="button"
                        onClick={handleAddReceiver}
                        style={{
                          padding: '0 10px',
                          background: '#0D274D',
                          color: '#fff',
                          border: 0,
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        เพิ่ม
                      </button>
                    </div>
                    <div className="chip-wrap">
                      {receivers.map(r => (
                        <span key={r} className="perm-chip">
                          {r}
                          <button onClick={() => handleRemoveReceiver(r)}>✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(role === 'ACC' || role === 'APR') && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                      บริษัทที่รับผิดชอบ (Company Scope)
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {AVAILABLE_COMPANIES.map(co => (
                        <button
                          key={co}
                          type="button"
                          onClick={() => toggleCompany(co)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: `1px solid ${companies.includes(co) ? '#2563EB' : '#CBD5E1'}`,
                            background: companies.includes(co) ? '#EFF6FF' : '#fff',
                            color: companies.includes(co) ? '#1D4ED8' : '#334155',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {co} {companies.includes(co) ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {role === 'ADM' && (
                  <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 6, fontSize: 12, color: '#64748B' }}>
                    บทบาทผู้ดูแลระบบ (IT Admin) ไม่ต้องกำหนดขอบเขตบริษัทหรือใบรับของ
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-f">
          <button
            onClick={onClose}
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
            onClick={handleConfirm}
            disabled={!selectedEmp}
            style={{
              padding: '6px 16px',
              borderRadius: 5,
              border: 0,
              background: selectedEmp ? '#217346' : '#94A3B8',
              color: '#fff',
              fontWeight: 600,
              cursor: selectedEmp ? 'pointer' : 'not-allowed',
            }}
          >
            เพิ่มผู้ใช้
          </button>
        </div>
      </div>
    </div>
  )
}
