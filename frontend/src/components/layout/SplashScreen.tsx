'use client'

import { useState, useEffect } from 'react'

export interface SplashScreenProps {
  autoDismissMs?: number
  onDismiss?: () => void
  statusText?: string
}

const PHASES = ['Initializing workspace…', 'Preparing workspace…', 'Almost ready…', 'Ready']

export function SplashScreen({
  autoDismissMs = 1200,
  onDismiss,
  statusText,
}: SplashScreenProps) {
  const [isFading, setIsFading] = useState(false)
  const [isDestroyed, setIsDestroyed] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)

  useEffect(() => {
    if (!autoDismissMs || autoDismissMs <= 0) return

    const stepMs = Math.max(150, Math.floor(autoDismissMs / 4))
    const interval = setInterval(() => {
      setPhaseIndex(prev => Math.min(prev + 1, PHASES.length - 1))
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
  }, [autoDismissMs, onDismiss])

  if (isDestroyed) return null

  const handleImmediateDismiss = () => {
    setIsDestroyed(true)
    onDismiss?.()
  }

  return (
    <div
      id="splash"
      className={isFading ? 'fade-out' : ''}
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
        <p className="sub">Auto Invoice Matching</p>
        <div className="bd">
          <span>OCR</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" />
          </svg>
          <span>Match</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" />
          </svg>
          <span>Post</span>
        </div>
        <div className="bar">
          <b />
        </div>
        <div className="st" id="spSt">
          {statusText || PHASES[phaseIndex]}
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
