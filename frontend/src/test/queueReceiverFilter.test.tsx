/**
 * Tests for Queue Receiver Filtering by Oracle Account for EU role
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { QueueToolbar } from '../components/queue/QueueToolbar'
import { useEffect } from 'react'

function QueueTestHarness({ targetUserId }: { targetUserId: string }) {
  const { currentUser, switchUser } = useAuth()
  const { filteredDocs, receiverFilter } = useInvoices()

  useEffect(() => {
    if (currentUser.id !== targetUserId) {
      switchUser(targetUserId)
    }
  }, [currentUser.id, targetUserId, switchUser])

  return (
    <div>
      <QueueToolbar />
      <div data-testid="receiver-filter-val">{receiverFilter || 'none'}</div>
      <div data-testid="doc-count">{filteredDocs.length}</div>
    </div>
  )
}

describe('Queue Receiver Filtering for EU Role', () => {
  it('renders receiver filter chips for EU user with multiple Oracle accounts and filters queue', async () => {
    render(
      <AuthProvider>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>
              <QueueTestHarness targetUserId="u8" />
            </InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    )

    // User u8 has multiple accounts: SOMSAK JAIDEE, WILAIWAN SRISUK, THANAKORN MANKONG
    expect(screen.getByText('ขอบเขต Receiver')).not.toBeNull()
    expect(screen.getByText('ทุก Receiver ของฉัน')).not.toBeNull()
    expect(screen.getByText('SOMSAK JAIDEE')).not.toBeNull()
    expect(screen.getByText('WILAIWAN SRISUK')).not.toBeNull()

    // Filter by SOMSAK JAIDEE
    const somsakChip = screen.getByText('SOMSAK JAIDEE')
    await act(async () => {
      fireEvent.click(somsakChip)
    })

    expect(screen.getByTestId('receiver-filter-val').textContent).toBe('SOMSAK JAIDEE')

    // Click 'ทุก Receiver ของฉัน' to reset
    const allChip = screen.getByText('ทุก Receiver ของฉัน')
    await act(async () => {
      fireEvent.click(allChip)
    })

    expect(screen.getByTestId('receiver-filter-val').textContent).toBe('none')
  })
})
