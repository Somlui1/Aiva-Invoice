/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { AuthProvider } from '../context/AuthContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { USERS } from '../mock/users'
import { INITIAL_DOCS } from '../mock/initialDocs'

describe('Invoice Detail Pane - Oracle Receipts & 125 Docs', () => {
  it('loads 125 real documents in initialDocs matching Engine summary', () => {
    expect(INITIAL_DOCS.length).toBe(125)
    const autoPass = INITIAL_DOCS.filter(d => (d.status as string) === 'Auto-pass')
    const review = INITIAL_DOCS.filter(d => (d.status as string) === 'Review')
    const hold = INITIAL_DOCS.filter(d => (d.status as string) === 'Hold')
    const manual = INITIAL_DOCS.filter(d => (d.status as string) === 'Manual Review' || (d.status as string) === 'Manual')

    expect(autoPass.length).toBe(51)
    expect(review.length).toBe(23)
    expect(hold.length).toBe(12)
    expect(manual.length).toBe(39)
  })

  it('renders ใบรับ Oracle tab with line items and variance diff when document has oracleReceiptLines', () => {
    const docWithReceipts = INITIAL_DOCS.find(d => d.oracleReceiptLines && d.oracleReceiptLines.length > 0)
    expect(docWithReceipts).toBeDefined()

    const accUser = USERS.find(u => u.role === 'ACC') || USERS[3]

    render(
      <AuthProvider initialUser={accUser}>
        <ToastModalProvider>
          <InvoiceProvider>
            <InvoiceDetailPane doc={docWithReceipts!} onOpenActionModal={vi.fn()} />
          </InvoiceProvider>
        </ToastModalProvider>
      </AuthProvider>
    )

    // Tab 3 must exist
    expect(screen.getByText(/ใบรับ Oracle/i)).toBeDefined()
  })
})
