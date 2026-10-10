'use client'

import { useEffect, useState } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { checkBackendHealth, BackendHealth } from '../../lib/backendApi'

interface TopbarProps {
  isNavCollapsed: boolean
  onToggleNav: () => void
}

export function Topbar({ onToggleNav }: TopbarProps) {
  const { currentUser, currentRole, users, switchUser, logout } = useAuth()
  const [backendStatus, setBackendStatus] = useState<BackendHealth | null>(null)
  const [checking, setChecking] = useState<boolean>(false)

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

      <div className="brand">
        <span className="brand-mark">AI</span>
        <div>
          <div className="brand-name">
            AIVA Portal <span className="brand-ver">v4.18 Next.js</span>
          </div>
          <div className="brand-sub">System A Engine · Next.js Edition</div>
        </div>
      </div>

      <span className="grow" />

      {/* Backend Engine Status Indicator */}
      <button
        type="button"
        className="env"
        onClick={verifyBackend}
        style={{ cursor: 'pointer', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center' }}
        title={`คลิกเพื่อตรวจสอบสถานะ Engine ใหม่\nโหมด: ${backendStatus?.mode || 'sandbox'}\nเซอร์วิส: ${backendStatus?.service || 'System A'}`}
      >
        <i
          style={{
            background: backendStatus?.mode === 'live' ? 'var(--clr-ok, #10b981)' : 'var(--clr-warn, #f59e0b)',
            boxShadow: backendStatus?.mode === 'live' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            marginRight: 6
          }}
        />
        {checking
          ? 'Checking...'
          : backendStatus?.mode === 'live'
          ? `Engine: Live (${backendStatus.ruleset || 'v6.6'})`
          : 'Backend: Sandbox Mode'}
      </button>

      <div className="who">
        <span
          className="role-pill"
          id="rolebadge"
          style={{ background: currentRole.bg, color: currentRole.c }}
        >
          {currentRole.n}
        </span>
        <label className="sr" htmlFor="user-selector">
          สลับผู้ใช้
        </label>
        <select
          id="user-selector"
          className="user-sel"
          value={currentUser.id}
          onChange={e => switchUser(e.target.value)}
          aria-label="สลับผู้ใช้"
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.n} — {u.unit || u.role}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ibtn"
          onClick={logout}
          title="ออกจากระบบ (ไปหน้าเข้าสู่ระบบ)"
          aria-label="ออกจากระบบ"
          style={{ marginLeft: 6 }}
        >
          <Icon name="logout" size="md" />
        </button>
      </div>
    </header>
  )
}

export default Topbar
