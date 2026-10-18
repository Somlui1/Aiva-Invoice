// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, act } from '@testing-library/react'
import { PortalShell } from '@/components/layout/PortalShell'
import { AuthProvider, ANONYMOUS_USER } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ToastModalProvider } from '@/context/ToastModalContext'
import { InvoiceProvider } from '@/context/InvoiceContext'
import { SimProvider } from '@/context/SimContext'

describe('PortalShell Hook Order Integrity', () => {
  it('does not alter hook execution order when auth state transitions from unauthenticated to authenticated', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const validUser = {
      id: 'wajeepradit.p',
      n: 'Wajeepradit Prompan',
      email: 'wajeepradit.p@aapico.com',
      role: 'EU' as const,
      rcvName: '—',
      emp: 12345,
      co: ['AH'],
      unit: 'Engineering',
    }

    const { rerender } = render(
      <AuthProvider initialUser={ANONYMOUS_USER}>
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
    )

    // Re-render as authenticated
    act(() => {
      rerender(
        <AuthProvider initialUser={validUser}>
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
      )
    })

    const hookErrors = errorSpy.mock.calls.filter(call =>
      call.some(arg => typeof arg === 'string' && (arg.includes('change in the order of Hooks') || arg.includes('Rendered more hooks') || arg.includes('Rendered fewer hooks')))
    )

    expect(hookErrors).toHaveLength(0)
    errorSpy.mockRestore()
  })
})
