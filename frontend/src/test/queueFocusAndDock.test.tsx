/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { QueuePage } from '../components/queue/QueuePage'
import { DockControls } from '../components/evidence/DockControls'
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SettingsProvider } from '../context/SettingsContext'

const mockUser = {
  id: 'u-1',
  n: 'สมศักดิ์ ใจดี',
  role: 'EU' as const,
  rcvName: 'SOMSAK JAIDEE',
  emp: 10231,
  co: ['AH'],
  email: 'somsak@example.com',
  unit: 'คลังสินค้า',
}

// Helper to set split mode
function QueueInSplitMode() {
  const { setViewMode } = useInvoices()
  React.useEffect(() => {
    setViewMode('split')
  }, [setViewMode])
  return <QueuePage />
}

// Helper to open PDF dock inside InvoiceContext
function QueueWithDockTrigger({ openDock = false }: { openDock?: boolean }) {
  const { openEvidenceDock, selectDoc, docs, setViewMode } = useInvoices()

  React.useEffect(() => {
    setViewMode('split')
    if (openDock && docs.length > 0) {
      selectDoc(docs[0].doc)
      openEvidenceDock()
    }
  }, [openDock, docs, selectDoc, openEvidenceDock, setViewMode])

  return <QueuePage />
}

describe('QueuePage v5.2 Focus Layout & .qrail', () => {
  beforeEach(() => {
    // ResizeObserver stub for jsdom
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any
  })

  it('renders normal grid when PDF dock is closed', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <SettingsProvider>
            <ToastModalProvider>
              <InvoiceProvider>
                <QueueInSplitMode />
              </InvoiceProvider>
            </ToastModalProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    const work = container.querySelector('#work')
    expect(work).toBeTruthy()
    expect(work?.classList.contains('pdf-open')).toBe(false)
    expect(work?.classList.contains('q-hide')).toBe(false)
  })

  it('applies pdf-open and q-hide and renders .qrail when PDF dock is open', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <SettingsProvider>
            <ToastModalProvider>
              <InvoiceProvider>
                <QueueWithDockTrigger openDock={true} />
              </InvoiceProvider>
            </ToastModalProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    const work = container.querySelector('#work')
    expect(work).toBeTruthy()
    expect(work?.classList.contains('pdf-open')).toBe(true)
    expect(work?.classList.contains('q-hide')).toBe(true)

    // .qrail is rendered
    const qrail = container.querySelector('.qrail')
    expect(qrail).toBeTruthy()
    expect(qrail?.querySelector('.vt')?.textContent).toContain('คิวตรวจสอบ')
  })

  it('toggles .work.q-peek and .qscrim when clicking .qrail', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <SettingsProvider>
            <ToastModalProvider>
              <InvoiceProvider>
                <QueueWithDockTrigger openDock={true} />
              </InvoiceProvider>
            </ToastModalProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    const work = container.querySelector('#work')
    const qrail = container.querySelector('.qrail') as HTMLElement
    expect(qrail).toBeTruthy()
    expect(work?.classList.contains('q-peek')).toBe(false)

    // Click qrail to peek
    fireEvent.click(qrail)
    expect(work?.classList.contains('q-peek')).toBe(true)

    // Scrim is rendered
    const qscrim = container.querySelector('.qscrim') as HTMLElement
    expect(qscrim).toBeTruthy()

    // Click scrim to close peek
    fireEvent.click(qscrim)
    expect(work?.classList.contains('q-peek')).toBe(false)
  })
})

describe('DockControls v5.2 prev/next navigation (.navpn)', () => {
  it('renders .navpn buttons with current index and triggers navigation', () => {
    const onPrevDoc = vi.fn()
    const onNextDoc = vi.fn()

    const { container } = render(
      <AuthProvider initialUser={mockUser}>
        <DockControls
          currentPage={1}
          totalPages={3}
          zoom={1}
          onPageChange={vi.fn()}
          onZoomChange={vi.fn()}
          onClose={vi.fn()}
          docIndex={1}
          docTotal={5}
          onPrevDoc={onPrevDoc}
          onNextDoc={onNextDoc}
        />
      </AuthProvider>
    )

    const navpn = container.querySelector('.navpn')
    expect(navpn).toBeTruthy()
    expect(navpn?.textContent).toContain('2 / 5')

    const buttons = navpn?.querySelectorAll('button')
    expect(buttons?.length).toBe(2)

    // Click next
    if (buttons?.[1]) {
      fireEvent.click(buttons[1])
      expect(onNextDoc).toHaveBeenCalled()
    }

    // Click prev
    if (buttons?.[0]) {
      fireEvent.click(buttons[0])
      expect(onPrevDoc).toHaveBeenCalled()
    }
  })
})
