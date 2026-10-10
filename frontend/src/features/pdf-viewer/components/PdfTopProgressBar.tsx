'use client'

import React, { useEffect, useState, useRef } from 'react'

export interface PdfTopProgressBarProps {
  state: 'idle' | 'loading' | 'ready' | 'error'
  onFinished?: () => void
}

export function PdfTopProgressBar({ state, onFinished }: PdfTopProgressBarProps) {
  const [progress, setProgress] = useState<number>(() => (state === 'loading' ? 8 : 0))
  const [visible, setVisible] = useState<boolean>(() => state !== 'idle')
  const [fading, setFading] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)

    if (state === 'idle') {
      setProgress(0)
      setVisible(false)
      setFading(false)
      return
    }

    setVisible(true)
    setFading(false)

    if (state === 'loading') {
      setProgress(prev => (prev > 0 ? prev : 8))
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 94) return 94
          // Trickle decay towards 94%
          const step = Math.max(0.5, (94 - p) * 0.08)
          return Math.min(94, p + step)
        })
      }, 150)
    } else if (state === 'ready' || state === 'error') {
      setProgress(100)
      fadeTimerRef.current = setTimeout(() => {
        setFading(true)
        fadeTimerRef.current = setTimeout(() => {
          setVisible(false)
          onFinished?.()
        }, 350)
      }, 200)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [state, onFinished])

  if (!visible) return null

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      data-state={state}
      className={`pdf-top-progress ${state} ${fading ? 'fade' : ''}`}
      style={{
        width: `${progress}%`,
        opacity: fading ? 0 : 1,
      }}
    />
  )
}

export default PdfTopProgressBar
