/**
 * Focus Task 3: Revalidate Purge Tests
 * @vitest-environment jsdom
 */
import React, { useEffect } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { INITIAL_DOCS } from '../mock/initialDocs'
import * as backendApi from '../lib/backendApi'

function DetailHarness({ targetUserId }: { targetUserId: string }) {
  const { currentUser, switchUser } = useAuth()
  useEffect(() => {
    if (currentUser.id !== targetUserId) {
      switchUser(targetUserId)
    }
  }, [currentUser.id, targetUserId, switchUser])

  if (currentUser.id !== targetUserId) {
    return <div>loading...</div>
  }

  return <InvoiceDetailPane doc={INITIAL_DOCS[0]} onOpenActionModal={() => {}} />
}

describe('focus-task-3: Revalidate Purge', () => {
  it('does not export revalidateInvoice from backendApi', () => {
    expect((backendApi as any).revalidateInvoice).toBeUndefined()
  })

  it('does not have revalidateDocWithBackend on InvoiceContext', () => {
    let contextValue: any = null
    function Consumer() {
      contextValue = useInvoices()
      return <div>consumer</div>
    }

    render(
      <AuthProvider>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>
              <Consumer />
            </InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    )

    expect(contextValue.revalidateDocWithBackend).toBeUndefined()
  })

  it('does not render Revalidate Engine button in InvoiceDetailPane for ACC user', async () => {
    render(
      <AuthProvider>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>
              <DetailHarness targetUserId="u4" />
            </InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    )

    await screen.findByText(/สกัดและตรวจเอกสาร/i)
    const revalBtn = screen.queryByRole('button', { name: /revalidate/i })
    expect(revalBtn).toBeNull()
  })
})
