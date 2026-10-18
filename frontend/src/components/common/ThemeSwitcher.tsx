'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeSwitcher({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className={`theme-sw ${className}`.trim()}
      role="switch"
      aria-checked={theme === 'light'}
      aria-label="สลับโหมดสว่าง / มืด"
      title={theme === 'light' ? 'โหมดสว่าง · คลิกเพื่อสลับเป็นโหมดมืด' : 'โหมดมืด · คลิกเพื่อสลับเป็นโหมดสว่าง'}
      onClick={e => toggleTheme(e.currentTarget)}
      suppressHydrationWarning
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
  )
}

export default ThemeSwitcher
