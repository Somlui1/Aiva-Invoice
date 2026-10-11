/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { InvoiceProvider } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import type { InvoiceDoc } from '../types/invoice'
import type { PortalOracleReceiptLine } from '../features/engine/types/portalDomain'

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>{children}</SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

describe('Task 3: Oracle Receipts UI Tab in InvoiceDetailPane', () => {
  const sampleReceiptLines: PortalOracleReceiptLine[] = [
    {
      poNumber: '43026973',
      receiptNum: '530336710',
      lineNo: 1,
      rcvLineId: '530336710-1',
      itemCode: '507A04JJ0A',
      itemDesc: 'PLATE ASSY-FLUIDE G',
      qty: 240,
      uom: 'PCS',
      unitPrice: 789.6,
      lineAmount: 189504,
      qtyBilled: 0,
      lineStatus: 'FULLY RECEIVED',
      poLineStatus: 'CLOSED',
      receiver: 'AHT Receiver 1',
    },
    {
      poNumber: '43026973',
      receiptNum: '530336710',
      lineNo: 2,
      rcvLineId: '530336710-2',
      itemCode: '511305KA0A',
      itemDesc: 'HOOK ASSY-RR TOWING',
      qty: 10,
      uom: 'PCS',
      unitPrice: 100,
      lineAmount: 1000,
      qtyBilled: 0,
      lineStatus: 'FULLY RECEIVED',
      poLineStatus: 'CLOSED',
      receiver: 'AHT Receiver 1',
    },
    {
      poNumber: '43041729',
      receiptNum: '530336710',
      lineNo: 3,
      rcvLineId: '530336710-3',
      itemCode: '509908AM0B',
      itemDesc: 'BRKT ASSY-FR UNDER',
      qty: 80,
      uom: 'PCS',
      unitPrice: 7.59,
      lineAmount: 607.2,
      qtyBilled: 80,
      lineStatus: 'BILLED',
      poLineStatus: 'CLOSED',
      receiver: 'AHT Receiver 2',
    },
  ]

  const mockDoc: InvoiceDoc = {
    doc: 'DMS-35',
    company: 'AH',
    vendor: 'DELTA TRADING',
    stax: '0105546011116',
    inv: 'INV-2026-001',
    dt: '2026-10-05',
    total: 207704.55,
    sub: 194116.4,
    vat: 13588.15,
    po: '43026973, 43041729',
    rcv: '530336710',
    receiver: 'SOMSAK JAIDEE',
    status: 'Review',
    up: '2026-10-05',
    codes: [],
    rules: [],
    lines: [],
    pages: 1,
    history: [],
    oracleReceiptLines: sampleReceiptLines,
  }

  it('renders tab button with badge count and switches pane on click', async () => {
    render(
      <Providers>
        <InvoiceDetailPane doc={mockDoc} onOpenActionModal={() => {}} />
      </Providers>
    )

    // Tab button should exist with label and count 3
    const tabBtn = screen.getByRole('tab', { name: /ใบรับ Oracle/i })
    expect(tabBtn).toBeDefined()
    expect(tabBtn.textContent).toContain('3')

    // Click tab
    await act(async () => {
      fireEvent.click(tabBtn)
    })

    // Now receipts view should be active
    expect(screen.getByTestId('oracle-receipts-pane')).toBeDefined()
    expect(screen.getByText('PLATE ASSY-FLUIDE G')).toBeDefined()
    expect(screen.getByText('HOOK ASSY-RR TOWING')).toBeDefined()
    expect(screen.getByText('BRKT ASSY-FR UNDER')).toBeDefined()
  })

  it('shows multi-PO summary cards and filters lines by PO chips', async () => {
    render(
      <Providers>
        <InvoiceDetailPane doc={mockDoc} onOpenActionModal={() => {}} />
      </Providers>
    )

    const tabBtn = screen.getByRole('tab', { name: /ใบรับ Oracle/i })
    await act(async () => {
      fireEvent.click(tabBtn)
    })

    // PO Filter chips
    const chipAll = screen.getByRole('button', { name: /ทั้งหมด \(3\)/i })
    const chipPO1 = screen.getByRole('button', { name: /PO 43026973/i })
    const chipPO2 = screen.getByRole('button', { name: /PO 43041729/i })
    expect(chipAll).toBeDefined()
    expect(chipPO1).toBeDefined()
    expect(chipPO2).toBeDefined()

    // Filter by PO 43041729 (which has only 1 line)
    await act(async () => {
      fireEvent.click(chipPO2)
    })

    const rows = document.querySelectorAll('tr[data-rcv-line]')
    expect(rows).toHaveLength(1)
    expect(screen.getByText('BRKT ASSY-FR UNDER')).toBeDefined()
    expect(screen.queryByText('PLATE ASSY-FLUIDE G')).toBeNull()

    // Filter back to all
    await act(async () => {
      fireEvent.click(chipAll)
    })
    const allRows = document.querySelectorAll('tr[data-rcv-line]')
    expect(allRows).toHaveLength(3)
  })

  it('renders clean empty state when no oracle receipt lines exist', async () => {
    const docNoReceipts: InvoiceDoc = {
      ...mockDoc,
      oracleReceiptLines: [],
    }

    render(
      <Providers>
        <InvoiceDetailPane doc={docNoReceipts} onOpenActionModal={() => {}} />
      </Providers>
    )

    const tabBtn = screen.getByRole('tab', { name: /ใบรับ Oracle/i })
    await act(async () => {
      fireEvent.click(tabBtn)
    })

    expect(screen.getByText(/ไม่พบรายการรับใน Oracle/i)).toBeDefined()
  })
})
