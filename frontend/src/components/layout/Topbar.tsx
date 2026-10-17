'use client'

import { useEffect, useState } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { checkBackendHealth, BackendHealth } from '../../lib/backendApi'
import { isSoundMuted, toggleSoundMuted } from '../../lib/soundEffects'
import { MyProfileModal } from './MyProfileModal'

interface TopbarProps {
  isNavCollapsed: boolean
  onToggleNav: () => void
  onOpenCmdk?: () => void
  currentPageTitle?: string
}

export function Topbar({ onToggleNav, onOpenCmdk, currentPageTitle }: TopbarProps) {
  const { currentUser, currentRole, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [backendStatus, setBackendStatus] = useState<BackendHealth | null>(null)
  const [checking, setChecking] = useState<boolean>(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [soundMuted, setSoundMutedState] = useState<boolean>(() => isSoundMuted())

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

  return (
    <header className="topbar">
      <button
        type="button"
        className="ibtn"
        onClick={onToggleNav}
        title="ย่อ / ขยายเมนู"
        aria-label="ย่อ / ขยายเมนู"
      >
        <Icon name="menu" size="lg" />
      </button>

      {/* Breadcrumb Pill (v5.2) */}
      <div className="crumb" title="AIVA · Auto Invoice Matching">
        <i className="d" />
        <b>AIVA</b>
        <svg className="sep ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span className="pg-t" id="crumbT">
          {currentPageTitle || 'คิวตรวจสอบ'}
        </span>
      </div>

      {/* Command Palette Trigger Button (v5.2) */}
      <button
        type="button"
        className="cmdk-btn"
        id="cmdkBtn"
        aria-label="ค้นหา / คำสั่ง"
        title="ค้นหา / คำสั่ง (Ctrl K)"
        onClick={onOpenCmdk}
      >
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />
        </svg>
        <span>ค้นหาเอกสาร / คำสั่ง…</span>
        <span className="kk">
          <kbd>Ctrl</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      <span className="grow" />

      {/* Sound Mute / Unmute Toggle */}
      <button
        type="button"
        className="ibtn sound-toggle-btn"
        onClick={() => {
          const next = toggleSoundMuted()
          setSoundMutedState(next)
        }}
        title={soundMuted ? 'เปิดเสียงแจ้งเตือนเอกสารใหม่' : 'ปิดเสียงแจ้งเตือนเอกสารใหม่'}
        aria-label={soundMuted ? 'เปิดเสียงแจ้งเตือน' : 'ปิดเสียงแจ้งเตือน'}
        style={{ marginRight: 2 }}
      >
        <span style={{ fontSize: 15 }}>{soundMuted ? '🔇' : '🔔'}</span>
      </button>

      {/* Dark / Light Theme Switcher (v5.2) */}
      <button
        type="button"
        className="theme-sw"
        role="switch"
        aria-checked={theme === 'light'}
        aria-label="สลับโหมดสว่าง / มืด"
        title={theme === 'light' ? 'โหมดสว่าง · คลิกเพื่อสลับเป็นโหมดมืด' : 'โหมดมืด · คลิกเพื่อสลับเป็นโหมดสว่าง'}
        onClick={e => toggleTheme(e.currentTarget)}
      >
        <svg className="ico i-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <svg className="ico i-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <i className="kn" />
      </button>

      {/* Backend Engine Status Indicator */}
      <button
        type="button"
        className="env"
        onClick={verifyBackend}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
        title={`คลิกเพื่อตรวจสอบสถานะ Engine ใหม่\nโหมด: ${backendStatus?.mode || 'sandbox'}\nเซอร์วิส: ${backendStatus?.service || 'System A'}`}
      >
        <i
          style={{
            background: backendStatus?.mode === 'live' ? 'var(--ok, #10b981)' : 'var(--warn, #f59e0b)',
            boxShadow: backendStatus?.mode === 'live' ? '0 0 6px var(--ok)' : 'none',
          }}
        />
        {checking
          ? 'Checking...'
          : backendStatus?.mode === 'live'
          ? `Engine: Live (${backendStatus.ruleset || 'v6.6'})`
          : 'Backend: Sandbox Mode'}
      </button>

      <div className="who">
        <button
          type="button"
          className="user-profile-btn"
          aria-label="โปรไฟล์และสิทธิ์"
          onClick={() => setIsProfileOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--line-strong)',
            borderRadius: 999,
            padding: '3px 12px',
            cursor: 'pointer',
          }}
          title="คลิกเพื่อดูข้อมูลผู้ใช้และสิทธิ์การใช้งานของฉัน"
        >
          <span className="user-name" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--s-900)' }}>
            {currentUser.n}
          </span>
          <span
            className="role-pill"
            id="rolebadge"
            style={{ background: currentRole.bg, color: currentRole.c, margin: 0 }}
          >
            {currentRole.n}
          </span>
        </button>
        <button
          type="button"
          className="ibtn"
          onClick={logout}
          title="ออกจากระบบ (ไปหน้าเข้าสู่ระบบ)"
          aria-label="ออกจากระบบ"
          style={{ marginLeft: 4 }}
        >
          <Icon name="logout" size="md" />
        </button>
      </div>

      <MyProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  )
}

export default Topbar
