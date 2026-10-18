'use client'

import { useState, useEffect } from 'react'

export interface SplashScreenProps {
  autoDismissMs?: number
  onDismiss?: () => void
  statusText?: string
  user?: { name?: string; n?: string; role?: string } | null
}

const PHASES_INIT = ['Initializing workspace…', 'Preparing workspace…', 'Almost ready…', 'Ready']
const PHASES_RESUME = ['Restoring session…', 'Verifying access…', 'Loading your queue…', 'Ready']

const ROLES_INFO: Record<string, { label: string; c: string; bg: string }> = {
  EU: { label: 'ผู้ใช้งาน (Receiver)', c: 'var(--t-blue, #60a5fa)', bg: 'rgba(96, 165, 250, .15)' },
  ACC: { label: 'เจ้าหน้าที่บัญชี', c: 'var(--t-teal, #2dd4c4)', bg: 'rgba(45, 212, 196, .15)' },
  APR: { label: 'ผู้อนุมัติ (Approver)', c: 'var(--t-purple, #a78bfa)', bg: 'rgba(167, 139, 250, .15)' },
  ADM: { label: 'ผู้ดูแลระบบ (IT)', c: 'var(--t-orange, #fb923c)', bg: 'rgba(251, 146, 60, .15)' },
  SA: { label: 'Super Admin', c: 'var(--t-red, #f87171)', bg: 'rgba(248, 113, 113, .15)' },
}

export function SplashScreen({
  autoDismissMs = 1200,
  onDismiss,
  statusText,
  user,
}: SplashScreenProps) {
  const [isFading, setIsFading] = useState(false)
  const [isDestroyed, setIsDestroyed] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [activeUser, setActiveUser] = useState<{ n: string; role: string } | null>(() => {
    if (user) return { n: user.name || user.n || '', role: user.role || 'EU' }
    return null
  })

  useEffect(() => {
    if (!activeUser && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('aiva.auth.profile')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && (parsed.name || parsed.n)) {
            setActiveUser({ n: parsed.name || parsed.n, role: parsed.role || 'EU' })
          }
        }
      } catch {}
    }
  }, [activeUser])

  const isResume = Boolean(activeUser)
  const phases = isResume ? PHASES_RESUME : PHASES_INIT

  useEffect(() => {
    if (!autoDismissMs || autoDismissMs <= 0) return

    const stepMs = Math.max(150, Math.floor(autoDismissMs / 4))
    const interval = setInterval(() => {
      setPhaseIndex(prev => Math.min(prev + 1, phases.length - 1))
    }, stepMs)

    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, autoDismissMs)

    const destroyTimer = setTimeout(() => {
      setIsDestroyed(true)
      onDismiss?.()
    }, autoDismissMs + 450)

    return () => {
      clearInterval(interval)
      clearTimeout(fadeTimer)
      clearTimeout(destroyTimer)
    }
  }, [autoDismissMs, onDismiss, phases.length])

  if (isDestroyed) return null

  const handleImmediateDismiss = () => {
    setIsDestroyed(true)
    onDismiss?.()
  }

  const roleMeta = (activeUser && ROLES_INFO[activeUser.role]) || {
    label: activeUser?.role || 'ผู้ใช้งาน',
    c: 'var(--t-blue, #60a5fa)',
    bg: 'rgba(96, 165, 250, .15)',
  }
  const initialChar = activeUser?.n ? activeUser.n.trim().charAt(0) : 'A'

  return (
    <div
      id="splash"
      className={`${isResume ? 'resume' : ''} ${isFading ? 'fade-out' : ''}`.trim()}
      role="status"
      aria-label="กำลังเริ่มระบบ AIVA"
      onClick={handleImmediateDismiss}
      style={{ cursor: 'pointer' }}
    >
      <div className="au a1" />
      <div className="au a2" />
      <div className="au a3" />
      <div className="card">
        <div className="emb">
          <div className="glow" />
          <span className="ring r1" />
          <span className="ring r2" />
          <span
            className="pt"
            style={{
              left: '6%',
              top: '18%',
              width: '5px',
              height: '5px',
              background: '#2dd4c4',
              boxShadow: '0 0 8px #2dd4c4',
            }}
          />
          <span
            className="pt"
            style={{
              right: '5%',
              top: '26%',
              width: '6px',
              height: '6px',
              background: '#818cf8',
              boxShadow: '0 0 9px #818cf8',
              animationDelay: '.6s',
            }}
          />
          <span
            className="pt"
            style={{
              left: '12%',
              bottom: '14%',
              width: '4px',
              height: '4px',
              background: '#60a5fa',
              boxShadow: '0 0 7px #60a5fa',
              animationDelay: '1.1s',
            }}
          />
          <span
            className="pt"
            style={{
              right: '10%',
              bottom: '10%',
              width: '5px',
              height: '5px',
              background: '#2dd4c4',
              boxShadow: '0 0 8px #2dd4c4',
              animationDelay: '1.6s',
            }}
          />
          <span className="brand-tile">
            <span className="logo-mark" role="img" aria-label="AIVA" />
          </span>
        </div>
        <h1>AIVA</h1>
        <p className="sub">{isResume ? 'Welcome back' : 'Auto Invoice Matching'}</p>
        <div className="bd">
          {isResume && activeUser ? (
            <>
              <span className="uav" style={{ background: roleMeta.bg, color: roleMeta.c }}>
                {initialChar}
              </span>
              <b>{activeUser.n}</b>
              <em>{roleMeta.label}</em>
            </>
          ) : (
            <>
              <span>OCR</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
              <span>Match</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
              <span>Post to Oracle</span>
            </>
          )}
        </div>
        <div className="bar">
          <b />
        </div>
        <div className="st" id="spSt">
          {statusText || phases[phaseIndex]}
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
