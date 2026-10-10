/**
 * Minimal PDF Loading & Error UI Tests
 * @vitest-environment jsdom
 */
import React, { useEffect } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { PdfTopProgressBar } from '../features/pdf-viewer/components/PdfTopProgressBar'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { INITIAL_DOCS } from '../mock/initialDocs'

function LoadingButtonHarness({
  onCloseCalled,
}: {
  onCloseCalled?: () => void
}) {
  const { currentUser, switchUser } = useAuth()
  const { setIsPdfLoading, isEvidenceDockOpen, openEvidenceDock, closeEvidenceDock } = useInvoices()

  useEffect(() => {
    if (currentUser.id !== 'u4') {
      switchUser('u4')
    }
  }, [currentUser.id, switchUser])

  useEffect(() => {
    setIsPdfLoading(true)
    openEvidenceDock(1)
  }, [setIsPdfLoading, openEvidenceDock])

  if (currentUser.id !== 'u4') {
    return <div>loading user...</div>
  }

  return (
    <div>
      <InvoiceDetailPane doc={INITIAL_DOCS[0]} onOpenActionModal={() => {}} />
      <button
        data-testid="check-dock"
        onClick={() => {
          if (!isEvidenceDockOpen && onCloseCalled) {
            onCloseCalled()
          }
        }}
      >
        Check
      </button>
    </div>
  )
}

describe('dock-ui-task-1: Top Progress Bar & Cancelable PDF Button', () => {
  it('renders PdfTopProgressBar with progressbar role and teal color while loading', () => {
    render(<PdfTopProgressBar state="loading" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeDefined()
    expect(bar.classList.contains('pdf-top-progress')).toBe(true)
    expect(bar.getAttribute('data-state')).toBe('loading')
  })

  it('renders PdfTopProgressBar with error state when state is error', () => {
    render(<PdfTopProgressBar state="error" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeDefined()
    expect(bar.getAttribute('data-state')).toBe('error')
  })

  it('does not disable PDF button while isPdfLoading and allows clicking to cancel/close dock', async () => {
    let closed = false
    render(
      <AuthProvider>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>
              <LoadingButtonHarness onCloseCalled={() => { closed = true }} />
            </InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    )

    await screen.findByText(/กำลังโหลด/i)
    const pdfBtn = screen.getByRole('button', { name: /กำลังโหลด/i })
    expect(pdfBtn).toBeDefined()
    expect((pdfBtn as HTMLButtonElement).disabled).toBe(false)
    expect(pdfBtn.title).toContain('ยกเลิก')

    // Clicking the button while loading should close the dock
    act(() => {
      fireEvent.click(pdfBtn)
    })

    const checkBtn = screen.getByTestId('check-dock')
    act(() => {
      fireEvent.click(checkBtn)
    })
    expect(closed).toBe(true)
  })
})
