// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { LoginForm } from '@/features/login/LoginForm'
import { ThemeProvider } from '@/context/ThemeContext'

describe('LoginForm Brand Hero Parity', () => {
  const dummyController: any = {
    method: 'ldap',
    busy: false,
    busyMethod: null,
    locked: false,
    lockRemaining: 0,
    exiting: false,
    progress: 0,
    u: 'test',
    p: '',
    keep: false,
    alert: null,
    fieldErr: { U: false, P: false },
    step: 0,
    switchMethod: vi.fn(),
    setU: vi.fn(),
    setP: vi.fn(),
    setKeep: vi.fn(),
    go: vi.fn(),
    dismissAlert: vi.fn(),
  }

  it('renders .lg-hero with .brand-tile.md, .logo-mark, wordmark AIVA, and no legacy "AI" box', () => {
    const { container } = render(
      <ThemeProvider>
        <LoginForm c={dummyController} mock={false} onSupport={vi.fn()} />
      </ThemeProvider>
    )

    // No legacy "AI" span
    const legacyMarks = container.querySelectorAll('.brand-mark')
    expect(legacyMarks.length).toBe(0)

    // Has authentic .lg-hero and .brand-tile.md
    const hero = container.querySelector('.lg-hero')
    expect(hero).toBeTruthy()
    const brandTile = hero?.querySelector('.brand-tile.md .logo-mark')
    expect(brandTile).toBeTruthy()

    // Wordmark & process pills
    expect(hero?.querySelector('.wm.wordmark')?.textContent).toBe('AIVA')
    expect(hero?.querySelector('.tg')?.textContent).toBe('Auto Invoice Matching')
    expect(hero?.querySelector('.pp2')?.textContent).toContain('OCR')
    expect(hero?.querySelector('.pp2')?.textContent).toContain('Match')
    expect(hero?.querySelector('.pp2')?.textContent).toContain('Post to Oracle')

    // Has theme switcher
    const themeSw = container.querySelector('.lg-theme .theme-sw')
    expect(themeSw).toBeTruthy()
  })
})
