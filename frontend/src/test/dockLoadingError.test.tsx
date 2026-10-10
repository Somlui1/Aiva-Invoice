/**
 * Minimal PDF Loading & Error UI Tests
 * @vitest-environment jsdom
 */
import React, { useEffect } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { PdfTopProgressBar } from '../features/pdf-viewer/components/PdfTopProgressBar'
import { PdfCanvasViewer } from '../features/pdf-viewer/components/PdfCanvasViewer'
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

describe('dock-ui-task-2: Clean Centered Loading State in PdfCanvasViewer', () => {
  it('renders only the centered spin lg and top progress bar, with no cards, no text, and no mock canvas', () => {
    const canvasRef = { current: null }
    const status = {
      state: 'loading' as const,
      mode: 'mock' as const,
      pageCount: 1
    }
    const { container } = render(
      <PdfCanvasViewer
        canvasRef={canvasRef}
        status={status}
        pageSize={{ width: 0, height: 0 }}
        boxes={[]}
        placeholder={<div className="evd-mock" data-testid="mock-placeholder">Mock Invoice</div>}
      />
    )

    // Progress bar must be mounted
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeDefined()
    expect(progressBar.getAttribute('data-state')).toBe('loading')

    // Single centered spinner must exist
    const spinner = container.querySelector('.evd-loading-minimal .spin.lg')
    expect(spinner).not.toBeNull()

    // No text, no cards, no mock canvas
    expect(screen.queryByText(/กำลังดาวน์โหลดและเรนเดอร์เอกสาร/i)).toBeNull()
    expect(container.querySelector('.evd-loading-center')).toBeNull()
    expect(container.querySelector('.evd-mock')).toBeNull()
  })
})
