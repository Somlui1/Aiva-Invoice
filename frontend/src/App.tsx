'use client'

import React from 'react'
import { PortalShell } from '@/components/layout/PortalShell'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ToastModalProvider } from '@/context/ToastModalContext'
import { InvoiceProvider } from '@/context/InvoiceContext'
import { SimProvider } from '@/context/SimContext'
import type { PageKey } from '@/components/layout/Sidebar'
import type { User } from '@/types/auth'

export { PortalShell } from '@/components/layout/PortalShell'

export function App({
  initialPage = 'queue',
  initialUser,
}: {
  initialPage?: PageKey | string
  initialUser?: User | null
}) {
  return (
    <ThemeProvider>
      <AuthProvider initialUser={initialUser}>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>
              <SimProvider>
                <PortalShell initialPage={initialPage as PageKey} />
              </SimProvider>
            </InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
