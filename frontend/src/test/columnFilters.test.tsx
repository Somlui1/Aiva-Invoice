/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { QueueTableView } from '../components/queue/QueueTableView'
import { ColumnFilterPopover } from '../components/queue/ColumnFilterPopover'
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

describe('Column Filters in QueueTableView', () => {
  beforeEach(() => {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any
  })

  it('renders .cf-btn in table headers and opens .cfp popover on click', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <SettingsProvider>
            <ToastModalProvider>
              <InvoiceProvider>
                <QueueTableView />
              </InvoiceProvider>
            </ToastModalProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    const cfButtons = container.querySelectorAll('.cf-btn')
    expect(cfButtons.length).toBeGreaterThan(0)

    // Initially no popover
    expect(container.querySelector('.cfp')).toBeNull()

    // Click the first filter button (e.g., invoice number or company)
    fireEvent.click(cfButtons[0])

    // Popover is now open
    const popover = container.querySelector('.cfp')
    expect(popover).toBeTruthy()
    expect(popover?.querySelector('.cfp-h')).toBeTruthy()
  })

  it('applies text filter and renders .cfbar chip', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <SettingsProvider>
            <ToastModalProvider>
              <InvoiceProvider>
                <QueueTableView />
              </InvoiceProvider>
            </ToastModalProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    // Open filter for company or vendor
    const cfButtons = container.querySelectorAll('.cf-btn')
    fireEvent.click(cfButtons[0])

    const popover = container.querySelector('.cfp') as HTMLElement
    expect(popover).toBeTruthy()

    // Enter a filter value
    const input = popover.querySelector('input[type="text"], input[type="search"]') as HTMLInputElement
    if (input) {
      fireEvent.change(input, { target: { value: 'IV' } })
    }

    // Click Apply button
    const applyBtn = screen.getByRole('button', { name: /ใช้ตัวกรอง/i })
    fireEvent.click(applyBtn)

    // .cfbar should now be displayed
    const cfbar = container.querySelector('.cfbar')
    expect(cfbar).toBeTruthy()
    const chip = container.querySelector('.cfchip')
    expect(chip).toBeTruthy()

    // Click remove button on chip
    const removeBtn = chip?.querySelector('.cfchip-x') as HTMLElement
    expect(removeBtn).toBeTruthy()
    fireEvent.click(removeBtn)

    // .cfbar is now hidden
    expect(container.querySelector('.cfbar')).toBeNull()
  })

  it('clears all filters when clicking ล้างทั้งหมด', () => {
    const { container } = render(
      <ThemeProvider>
        <AuthProvider initialUser={mockUser}>
          <SettingsProvider>
            <ToastModalProvider>
              <InvoiceProvider>
                <QueueTableView />
              </InvoiceProvider>
            </ToastModalProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    )

    const cfButtons = container.querySelectorAll('.cf-btn')
    fireEvent.click(cfButtons[0])

    const popover = container.querySelector('.cfp') as HTMLElement
    const input = popover.querySelector('input[type="search"], input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'IV' } })

    const applyBtn = screen.getByRole('button', { name: /ใช้ตัวกรอง/i })
    fireEvent.click(applyBtn)

    expect(container.querySelector('.cfbar')).toBeTruthy()

    // Click ล้างทั้งหมด
    const clearAllBtn = screen.getByRole('button', { name: /ล้างทั้งหมด/i })
    fireEvent.click(clearAllBtn)

    expect(container.querySelector('.cfbar')).toBeNull()
  })
})
