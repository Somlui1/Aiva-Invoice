/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Topbar } from '../components/layout/Topbar'
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'

describe('Topbar v5.2 Component', () => {
  const defaultUser = {
    id: 'u1',
    n: 'ทดสอบ ผู้ใช้งาน',
    role: 'EU' as const,
    email: 'test@aapico.com',
    companies: ['AH'],
  }

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders breadcrumb, cmdk button, and theme switcher', () => {
    render(
      <ThemeProvider>
        <AuthProvider initialUser={defaultUser}>
          <Topbar
            isNavCollapsed={false}
            onToggleNav={vi.fn()}
            onOpenCmdk={vi.fn()}
            currentPageTitle="คิวตรวจสอบ"
          />
        </AuthProvider>
      </ThemeProvider>
    )

    // Check breadcrumb
    expect(screen.getByText('AIVA')).toBeDefined()
    expect(screen.getByText('คิวตรวจสอบ')).toBeDefined()

    // Check cmdk trigger button
    const cmdkBtn = screen.getByRole('button', { name: /ค้นหา \/ คำสั่ง/i })
    expect(cmdkBtn).toBeDefined()

    // Check theme switcher
    const themeSw = screen.getByRole('switch', { name: /สลับโหมดสว่าง \/ มืด/i })
    expect(themeSw).toBeDefined()
    expect(themeSw.getAttribute('aria-checked')).toBe('false') // Default dark
  })

  it('toggles theme when clicking theme-sw button in Topbar', () => {
    render(
      <ThemeProvider>
        <AuthProvider initialUser={defaultUser}>
          <Topbar
            isNavCollapsed={false}
            onToggleNav={vi.fn()}
            onOpenCmdk={vi.fn()}
            currentPageTitle="คิวตรวจสอบ"
          />
        </AuthProvider>
      </ThemeProvider>
    )

    const themeSw = screen.getByRole('switch', { name: /สลับโหมดสว่าง \/ มืด/i })
    expect(themeSw.getAttribute('aria-checked')).toBe('false')

    act(() => {
      fireEvent.click(themeSw)
    })

    expect(themeSw.getAttribute('aria-checked')).toBe('true')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('calls onOpenCmdk when clicking cmdk button', () => {
    const onOpenCmdkMock = vi.fn()
    render(
      <ThemeProvider>
        <AuthProvider initialUser={defaultUser}>
          <Topbar
            isNavCollapsed={false}
            onToggleNav={vi.fn()}
            onOpenCmdk={onOpenCmdkMock}
          />
        </AuthProvider>
      </ThemeProvider>
    )

    const cmdkBtn = screen.getByRole('button', { name: /ค้นหา \/ คำสั่ง/i })
    act(() => {
      fireEvent.click(cmdkBtn)
    })

    expect(onOpenCmdkMock).toHaveBeenCalledTimes(1)
  })
})
