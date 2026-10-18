// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortalShell } from '@/components/layout/PortalShell'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { InvoiceProvider } from '@/context/InvoiceContext'
import { SimProvider } from '@/context/SimContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ToastModalProvider } from '@/context/ToastModalContext'

describe('PortalShell Hydration Guard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders consistent loading/redirect state initially without throwing hydration errors', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider initialUser={null}>
          <SettingsProvider>
            <ToastModalProvider>
              <InvoiceProvider>
                <SimProvider>
                  <PortalShell initialPage="queue" />
                </SimProvider>
              </InvoiceProvider>
            </ToastModalProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    expect(container).toBeTruthy()
    const guard = container.querySelector('[data-testid="auth-redirect-guard"]')
    expect(guard).toBeTruthy()
    expect(guard?.textContent).toContain('กำลังนำทางไปหน้าเข้าสู่ระบบ...')
  })
})
