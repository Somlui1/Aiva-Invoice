'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RoleKey } from '@/types/auth'
import { ROLES } from '@/mock/users'
import { COMPANIES, assignableCompanies, companyChipLabel } from '@/mock/companies'
import { ReceiverPicker } from './ReceiverPicker'
import '@/styles/aiva/aum.css'

interface DirectoryEmployee {
  samAccount: string
  name: string
  email: string
  empId: string
  title: string
  unit: string
}

/** v5.11.1: from the company master (the hard-coded list missed AHA). */
/** v5.13: read on every render (the master can change after a sync) · includes "?" (company unknown) */
const availableCompanies = () => assignableCompanies()

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
  const [receivers, setReceivers] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedEmp(null)
      setRole('EU')
      setCompanies([])
      setReceivers([])
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
    // v5.11.1: no guessed Oracle account. The AD display name upper-cased is not an Oracle receiver
    // name, and a wrong binding silently showed the End User nothing — the admin types the real one.
    setReceivers([])
  }

  const toggleCompany = (co: string) => {
    setCompanies(prev => (prev.includes(co) ? prev.filter(c => c !== co) : [...prev, co]))
  }

  const addReceiver = (name: string) => {
    const val = name.normalize('NFKC').replace(/\s+/g, ' ').trim()
    if (val && !receivers.some(r => r.toUpperCase() === val.toUpperCase())) {
      setReceivers(prev => [...prev, val])
    }
  }

  const handleRemoveReceiver = (rcv: string) => {
    setReceivers(prev => prev.filter(r => r !== rcv))
  }

  const scopeMissing =
    role === 'EU' && receivers.length === 0
      ? 'End User ต้องผูก Oracle account อย่างน้อย 1 บัญชี'
      : (role === 'ACC' || role === 'APR') && companies.length === 0
        ? 'ฝ่ายบัญชีต้องเลือกบริษัทอย่างน้อย 1 บริษัท'
        : null
  const canConfirm = !!selectedEmp && !scopeMissing

  const handleConfirm = () => {
    if (!selectedEmp || scopeMissing) return
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

  const ROLE_HINT: Record<RoleKey, string> = {
    EU: 'เห็นเฉพาะเอกสารที่ตนเป็น Receiver',
    ACC: 'ตรวจสอบและยืนยันเอกสารตามบริษัท',
    APR: 'อนุมัติ ส่งเข้า AP Interface',
    ADM: 'ผู้ดูแลระบบ จัดการสิทธิ์',
    SA: 'ผู้ดูแลระบบระดับสูง สิทธิ์เต็มทุกระบบ',
  }

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(searchResults.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const emp = searchResults[Math.max(0, activeIdx)]
      if (emp) handleSelectEmp(emp)
    }
  }

  // v5.3.1: portal ไป document.body กัน overlay ถูกกักใน parent ที่มี transform/backdrop-filter
  // v5.12: every colour from the theme tokens (aum.css) — the inline #fff / #F8FAFC made the dark
  // theme show blank white boxes with unreadable text.
  return createPortal(
    <div className="aum-ov" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="aum" role="dialog" aria-modal="true" aria-labelledby="aum-title" onKeyDown={e => e.key === 'Escape' && onClose()}>
        <header className="aum-h">
          <div>
            <h3 id="aum-title">เพิ่มผู้ใช้จาก AD (LDAP)</h3>
            <p>ค้นหาจากบัญชีองค์กร แล้วกำหนดบทบาทและขอบเขต</p>
          </div>
          <button type="button" className="aum-x" onClick={onClose} aria-label="ปิด">
            ✕
          </button>
        </header>

        <div className="aum-b">
          {!selectedEmp ? (
            <div>
              <label className="aum-lab" htmlFor="aum-q">
                ค้นหาผู้ใช้จาก Active Directory
              </label>
              <input
                id="aum-q"
                type="text"
                className="aum-in"
                placeholder="พิมพ์ชื่อ, username หรือรหัสพนักงาน…"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setActiveIdx(0)
                }}
                onKeyDown={onSearchKey}
                role="combobox"
                aria-expanded={searchResults.length > 0}
                aria-controls="aum-results"
                aria-activedescendant={searchResults[activeIdx] ? `aum-r-${activeIdx}` : undefined}
                autoComplete="off"
                autoFocus
              />
              <div className="aum-hint" aria-live="polite">
                {isSearching
                  ? 'กำลังค้นหา…'
                  : searchQuery.trim() && !searchResults.length
                    ? 'ไม่พบผู้ใช้'
                    : searchResults.length
                      ? `พบ ${searchResults.length} คน · ↑ ↓ เลือก · Enter ยืนยัน`
                      : 'อย่างน้อย 1 ตัวอักษร'}
              </div>

              {searchResults.length > 0 && (
                <ul className="aum-list" id="aum-results" role="listbox" aria-label="ผลการค้นหา">
                  {searchResults.map((emp, i) => (
                    <li key={emp.samAccount} role="option" id={`aum-r-${i}`} aria-selected={i === activeIdx}>
                      <button
                        type="button"
                        className={`aum-row${i === activeIdx ? ' on' : ''}`}
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => handleSelectEmp(emp)}
                      >
                        <span className="aum-av" aria-hidden="true">
                          {(emp.name || '?').trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="aum-who">
                          <b>{emp.name}</b> <span className="aum-mut">({emp.samAccount})</span>
                          <span className="aum-sub">
                            {[emp.email, emp.unit, emp.title].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        {emp.empId && <span className="aum-tag">รหัส {emp.empId}</span>}
                        <span className="aum-pick">เลือก</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              <div className="aum-sel">
                <span className="aum-av lg" aria-hidden="true">
                  {(selectedEmp.name || '?').trim().charAt(0).toUpperCase()}
                </span>
                <div className="aum-who">
                  <b>{selectedEmp.name}</b>
                  <span className="aum-sub">
                    {selectedEmp.email} · {selectedEmp.samAccount}
                    {selectedEmp.empId ? ` · รหัส ${selectedEmp.empId}` : ''}
                  </span>
                  <span className="aum-sub">{[selectedEmp.unit, selectedEmp.title].filter(Boolean).join(' · ')}</span>
                </div>
                <button type="button" className="aum-btn sm" onClick={() => setSelectedEmp(null)}>
                  เปลี่ยนคน
                </button>
              </div>

              <fieldset className="aum-fs">
                <legend className="aum-lab">บทบาท (Role)</legend>
                <div className="aum-roles">
                  {(['EU', 'ACC', 'APR', 'ADM', 'SA'] as RoleKey[]).map(rk => (
                    <label key={rk} className={`aum-role${role === rk ? ' on' : ''}`}>
                      <input type="radio" name="aum-role" value={rk} checked={role === rk} onChange={() => setRole(rk)} />
                      <span>
                        <b>
                          {ROLES[rk].n} ({rk})
                        </b>
                        <small>{ROLE_HINT[rk]}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {role === 'EU' && (
                <div className="aum-sec">
                  <label className="aum-lab" htmlFor="aum-rcv">
                    Oracle account (ชื่อ Receiver ในใบรับ) <span className="aum-req">*</span>
                  </label>
                  {/* v5.14: pick from the Receivers on documents (or type a new one) */}
                  <ReceiverPicker
                    inputId="aum-rcv"
                    variant="field"
                    value={receivers}
                    onAdd={addReceiver}
                    placeholder="พิมพ์ชื่อ เช่น AHT Die Making 03 หรือเลือกจากรายการ"
                  />
                  <div className="aum-chips">
                    {receivers.length === 0 && <span className="aum-mut">ยังไม่มีบัญชี</span>}
                    {receivers.map(r => (
                      <span key={r} className="aum-chip">
                        {r}
                        <button type="button" onClick={() => handleRemoveReceiver(r)} aria-label={`ลบ ${r}`}>
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(role === 'ACC' || role === 'APR') && (
                <div className="aum-sec">
                  <span className="aum-lab">
                    บริษัทที่รับผิดชอบ <span className="aum-req">*</span>
                  </span>
                  <div className="aum-chips" role="group" aria-label="บริษัท">
                    {availableCompanies().map(co => (
                      <button
                        key={co}
                        type="button"
                        className={`aum-co${companies.includes(co) ? ' on' : ''}`}
                        aria-pressed={companies.includes(co)}
                        title={COMPANIES[co]?.name}
                        onClick={() => toggleCompany(co)}
                      >
                        {companies.includes(co) ? '✓ ' : ''}
                        {companyChipLabel(co)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(role === 'ADM' || role === 'SA') && (
                <p className="aum-note">
                  {role === 'ADM' ? 'ผู้ดูแลระบบไม่เห็นเนื้อหาเอกสาร จึงไม่ต้องกำหนดบริษัทหรือ Oracle account' : 'Super Admin เห็นทุกบริษัท'}
                </p>
              )}
            </div>
          )}
        </div>

        <footer className="aum-f">
          <span className="aum-why" role="status">
            {!selectedEmp ? 'เลือกผู้ใช้ก่อน' : scopeMissing ?? ''}
          </span>
          <button type="button" className="aum-btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="button" className="aum-btn pri" onClick={handleConfirm} disabled={!canConfirm} title={scopeMissing ?? undefined}>
            เพิ่มผู้ใช้
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
