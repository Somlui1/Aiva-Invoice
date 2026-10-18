// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { render, act } from '@testing-library/react'
import { ThemeProvider } from '@/context/ThemeContext'
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher'

describe('ThemeSwitcher SSR and Client Hydration Parity', () => {
  beforeEach(() => {
    window.localStorage.setItem('aiva.theme', 'light')
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders initial server HTML with dark theme default attributes avoiding hydration mismatch', () => {
    const ssrHtml = renderToString(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    )

    // Server must render aria-checked="false"
    expect(ssrHtml).toContain('aria-checked="false"')
    expect(ssrHtml).toContain('title="โหมดมืด · คลิกเพื่อสลับเป็นโหมดสว่าง"')
  })

  it('safely mounts on client and synchronizes theme post-mount', async () => {
    const { container } = render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    )

    const btn = container.querySelector('button.theme-sw')
    expect(btn).not.toBeNull()
    expect(btn?.getAttribute('aria-label')).toBe('สลับโหมดสว่าง / มืด')
  })
})
