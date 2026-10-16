/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentAlertToast } from '../features/notifications/DocumentAlertToast'

describe('DocumentAlertToast Component', () => {
  const mockDoc = {
    id: 'DMS-105',
    invoiceNum: 'INV-8888',
    supplierName: 'AAPICO Hitech PCL',
    companyCode: 'AH',
    grandTotal: 12500,
  }

  it('renders new document toast with company badge, invoice num, and supplier', () => {
    const onView = vi.fn()
    const onClose = vi.fn()

    render(<DocumentAlertToast doc={mockDoc} onView={onView} onClose={onClose} />)
    expect(screen.getByText('DMS-105')).toBeDefined()
    expect(screen.getByText(/INV-8888/)).toBeDefined()
    expect(screen.getByText('AH')).toBeDefined()
    expect(screen.getByText(/AAPICO Hitech PCL/)).toBeDefined()
  })

  it('triggers onView when user clicks view button', () => {
    const onView = vi.fn()
    const onClose = vi.fn()

    render(<DocumentAlertToast doc={mockDoc} onView={onView} onClose={onClose} />)
    const viewBtn = screen.getByRole('button', { name: /เปิดดู/i })
    fireEvent.click(viewBtn)
    expect(onView).toHaveBeenCalledWith(mockDoc)
  })

  it('triggers onClose when user clicks dismiss button', () => {
    const onView = vi.fn()
    const onClose = vi.fn()

    render(<DocumentAlertToast doc={mockDoc} onView={onView} onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: /ปิดการแจ้งเตือน/i })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
