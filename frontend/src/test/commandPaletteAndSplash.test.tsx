/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SplashScreen } from '../components/layout/SplashScreen'
import { CommandPalette } from '../components/layout/CommandPalette'
import { Sidebar } from '../components/layout/Sidebar'
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { ToastModalProvider } from '../context/ToastModalContext'

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

describe('SplashScreen component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders #splash with brand elements, title, and status bar', () => {
    const { container } = render(<SplashScreen autoDismissMs={500} />)
    const splash = container.querySelector('#splash')
    expect(splash).toBeTruthy()
    expect(splash?.getAttribute('role')).toBe('status')
    expect(screen.getByText('AIVA')).toBeTruthy()
    expect(screen.getByText('Auto Invoice Matching')).toBeTruthy()
    expect(container.querySelector('.ring.r1')).toBeTruthy()
    expect(container.querySelector('.ring.r2')).toBeTruthy()
    expect(container.querySelector('.bar b')).toBeTruthy()
  })

  it('fades out and calls onDismiss after autoDismissMs', () => {
    const onDismiss = vi.fn()
    const { container } = render(<SplashScreen autoDismissMs={300} onDismiss={onDismiss} />)
    const splash = container.querySelector('#splash')
    expect(splash?.classList.contains('fade-out')).toBe(false)

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(splash?.classList.contains('fade-out')).toBe(true)

    act(() => {
      vi.advanceTimersByTime(450)
    })
    expect(onDismiss).toHaveBeenCalled()
  })
})

describe('CommandPalette component', () => {
  it('opens on Ctrl+K and closes on Escape', () => {
    const onClose = vi.fn()
    const onNavigate = vi.fn()

    const { rerender } = render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <ToastModalProvider>
            <InvoiceProvider>
              <CommandPalette isOpen={false} onClose={onClose} onNavigate={onNavigate} />
            </InvoiceProvider>
          </ToastModalProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    // Palette is closed
    expect(screen.queryByRole('dialog', { name: /ค้นหา/i })).toBeNull()

    // Rerender open
    rerender(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <ToastModalProvider>
            <InvoiceProvider>
              <CommandPalette isOpen={true} onClose={onClose} onNavigate={onNavigate} />
            </InvoiceProvider>
          </ToastModalProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    const dialog = screen.getByRole('dialog', { name: /ค้นหา/i })
    expect(dialog).toBeTruthy()

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('filters results by category tab', () => {
    const onClose = vi.fn()
    const onNavigate = vi.fn()

    render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <ToastModalProvider>
            <InvoiceProvider>
              <CommandPalette isOpen={true} onClose={onClose} onNavigate={onNavigate} />
            </InvoiceProvider>
          </ToastModalProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    // Check category tabs
    const allTab = screen.getByRole('tab', { name: /ทั้งหมด/i })
    const docTab = screen.getByRole('tab', { name: /เอกสาร/i })
    const navTab = screen.getByRole('tab', { name: /หน้า/i })
    const actTab = screen.getByRole('tab', { name: /คำสั่ง/i })

    expect(allTab).toBeTruthy()
    expect(docTab).toBeTruthy()
    expect(navTab).toBeTruthy()
    expect(actTab).toBeTruthy()

    // Switch to Menus/Nav tab
    fireEvent.click(navTab)
    expect(navTab.classList.contains('on')).toBe(true)
  })

  it('navigates when clicking a menu item', () => {
    const onClose = vi.fn()
    const onNavigate = vi.fn()

    render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <ToastModalProvider>
            <InvoiceProvider>
              <CommandPalette isOpen={true} onClose={onClose} onNavigate={onNavigate} />
            </InvoiceProvider>
          </ToastModalProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    // Click on nav tab and then a page button
    const navTab = screen.getByRole('tab', { name: /หน้า/i })
    fireEvent.click(navTab)

    const queueBtn = screen.getByRole('option', { name: /คิวตรวจสอบ|งานของฉัน/i })
    fireEvent.click(queueBtn)

    expect(onNavigate).toHaveBeenCalledWith('queue')
    expect(onClose).toHaveBeenCalled()
  })

  it('searches and selects an invoice document', () => {
    const onClose = vi.fn()
    const onNavigate = vi.fn()
    const onSelectInvoice = vi.fn()

    render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <ToastModalProvider>
            <InvoiceProvider>
              <CommandPalette
                isOpen={true}
                onClose={onClose}
                onNavigate={onNavigate}
                onSelectInvoice={onSelectInvoice}
              />
            </InvoiceProvider>
          </ToastModalProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    const docTab = screen.getByRole('tab', { name: /เอกสาร/i })
    fireEvent.click(docTab)

    const searchInput = screen.getByRole('textbox', { name: /ค้นหา/i })
    fireEvent.change(searchInput, { target: { value: 'DMS' } })

    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
    fireEvent.click(options[0])

    expect(onNavigate).toHaveBeenCalledWith('queue')
    expect(onClose).toHaveBeenCalled()
    expect(onSelectInvoice).toHaveBeenCalled()
  })
})

describe('Sidebar v5.2 layout', () => {
  it('renders v5.2 brand tile with logo mark', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <ToastModalProvider>
            <InvoiceProvider>
              <Sidebar currentPage="queue" onNavigate={vi.fn()} onToggleNav={vi.fn()} />
            </InvoiceProvider>
          </ToastModalProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    const brandTile = container.querySelector('.nav-org .brand-tile')
    expect(brandTile).toBeTruthy()
    const logoMark = container.querySelector('.nav-org .logo-mark')
    expect(logoMark).toBeTruthy()
  })
})
