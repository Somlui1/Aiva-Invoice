'use client'

import { useEffect, useState } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { checkBackendHealth, BackendHealth } from '../../lib/backendApi'
import { logoutOut, initialOf } from '../../lib/fx'
import { MyProfileModal } from './MyProfileModal'
import { ThemeSwitch } from '../shell/ThemeSwitch'
import { openCommandPalette } from '../shell/CommandPalette'
import { openViewAsPicker } from '../viewas/ViewAs'

interface TopbarProps {
  isNavCollapsed: boolean
  onToggleNav: () => void
  /** v5.7: the app menu is hidden (PDF focus mode) — show a button that brings it back. */
  navHidden?: boolean
  /** ชื่อหน้าปัจจุบันสำหรับ breadcrumb (AIVA › หน้า) */
  pageTitle?: string
}

/**
 * v5.3 — แถบบนแบบ aiva-react: breadcrumb · ปุ่มค้นหา (Ctrl K) · สถานะ Engine · สวิตช์ธีม · โปรไฟล์ · ออกจากระบบ
 * การทำงานเดิมคงไว้ทั้งหมด (ตรวจสถานะ Engine ทุก 30 วินาที · เปิด MyProfileModal · logout)
 */
export function Topbar({ pageTitle = '', navHidden = false, onToggleNav }: TopbarProps) {
  const { currentUser, currentRole, logout, realUser, isPreview } = useAuth()
  const [backendStatus, setBackendStatus] = useState<BackendHealth | null>(null)
  const [checking, setChecking] = useState<boolean>(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const verifyBackend = async () => {
    setChecking(true)
    const status = await checkBackendHealth()
    setBackendStatus(status)
    setChecking(false)
  }

  useEffect(() => {
    verifyBackend()
    const timer = setInterval(verifyBackend, 30000)
    return () => clearInterval(timer)
  }, [])

  const live = backendStatus?.mode === 'live'

  return (
    <header className="topbar">
      {navHidden && (
        <button
          type="button"
          className="ibtn tb-menu"
          onClick={onToggleNav}
          title="แสดงเมนู (ปิด PDF) · [ "
          aria-label="แสดงเมนูหลัก"
        >
          <Icon name="menu" />
        </button>
      )}
      <div className="crumb" title="AIVA · Auto Invoice Matching" style={{ ['--i' as string]: 0 }}>
        <i className="d" />
        <b>AIVA</b>
        <svg className="sep" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span className="pg-t" id="crumbT">
          {pageTitle}
        </span>
      </div>

      <button
        type="button"
        className="cmdk-btn"
        id="cmdkBtn"
        aria-label="ค้นหา / คำสั่ง"
        title="ค้นหา / คำสั่ง (Ctrl K)"
        onClick={() => openCommandPalette()}
        style={{ ['--i' as string]: 1 }}
      >
        <Icon name="search" />
        <span>ค้นหาเอกสาร / คำสั่ง…</span>
        <span className="kk">
          <kbd>Ctrl</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      <span className="grow" />

      {/* Backend Engine Status Indicator */}
      <button
        type="button"
        className={`env engine ${live ? 'live' : 'sbx'}`}
        onClick={verifyBackend}
        style={{ ['--i' as string]: 2 }}
        title={`คลิกเพื่อตรวจสอบสถานะ Engine ใหม่\nโหมด: ${backendStatus?.mode || 'sandbox'}\nเซอร์วิส: ${backendStatus?.service || 'System A'}`}
      >
        <i />
        {checking
          ? 'Checking...'
          : live
          ? `Engine: Live (${backendStatus?.ruleset || 'v6.6'})`
          : 'Backend: Sandbox Mode'}
      </button>

      {realUser.role === 'SA' && (
        <button
          type="button"
          className={`ibtn tb-viewas${isPreview ? ' on' : ''}`}
          onClick={openViewAsPicker}
          title={isPreview ? 'สลับมุมมอง (กำลังดูในมุมมองของผู้อื่น)' : 'ดูในมุมมองของ… (Super Admin · อ่านอย่างเดียว)'}
          aria-label="ดูในมุมมองของผู้ใช้หรือบทบาทอื่น"
        >
          <Icon name="eye" />
        </button>
      )}

      <ThemeSwitch />

      <div className="who" style={{ ['--i' as string]: 4 }}>
        <button
          type="button"
          className="user-profile-btn"
          aria-label="โปรไฟล์และสิทธิ์"
          onClick={() => setIsProfileOpen(true)}
          title="คลิกเพื่อดูข้อมูลผู้ใช้และสิทธิ์การใช้งานของฉัน"
        >
          <span className="uav" style={{ background: currentRole.bg, color: currentRole.c }} aria-hidden="true">
            {initialOf(currentUser.n)}
          </span>
          <span className="user-name">{currentUser.n}</span>
          <span className="role-pill" id="rolebadge" style={{ background: currentRole.bg, color: currentRole.c }}>
            {currentRole.n}
          </span>
        </button>
        <button
          type="button"
          className="ibtn logout-btn"
          onClick={() => logoutOut(logout)}
          title="ออกจากระบบ (ไปหน้าเข้าสู่ระบบ)"
          aria-label="ออกจากระบบ"
        >
          <Icon name="logout" />
        </button>
      </div>

      <MyProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  )
}

export default Topbar
