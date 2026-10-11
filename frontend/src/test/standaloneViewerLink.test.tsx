/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { DockControls } from '../components/evidence/DockControls'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { SimProvider } from '../context/SimContext'
import type { InvoiceDoc } from '../types/invoice'

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

const mockDoc: InvoiceDoc = {
  doc: 'DMS-100',
  inv: 'INV-2026-001',
  company: 'AH',
  vendor: 'THAI STEEL CO',
  stax: '0105500000000',
  dt: '2026-10-01',
  up: '2026-10-02',
  total: 53660.85,
  sub: 50150.33,
  vat: 3510.52,
  po: '42052823',
  rcv: '530340001',
  receiver: 'SOMSAK JAIDEE',
  receiverActive: true,
  assigned: 'eu',
  status: 'Auto-pass',
  codes: [],
  rules: [],
  pages: 2,
  history: [],
}

describe('Task 5: Link to Standalone BBox Viewer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders link to standalone viewer in InvoiceDetailPane header with target="_blank"', async () => {
    await act(async () => {
      render(
        <Providers>
          <InvoiceDetailPane doc={mockDoc} onOpenActionModal={() => {}} />
        </Providers>
      )
    })

    const link = screen.getByTestId('open-standalone-viewer') as HTMLAnchorElement
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/viewer/DMS-100')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.textContent).toContain('ตรวจ BBox (แท็บใหม่)')
  })

  it('triggers window.open with /viewer/[id] when clicking new tab button in DockControls', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(
      <AuthProvider>
        <DockControls
          doc={mockDoc}
          currentPage={1}
          totalPages={2}
          zoom={1.0}
          onPageChange={vi.fn()}
          onZoomChange={vi.fn()}
          onClose={vi.fn()}
        />
      </AuthProvider>
    )

    const newTabBtn = screen.getByRole('button', { name: 'เปิดในแท็บใหม่' })
    expect(newTabBtn).toBeDefined()

    await act(async () => {
      fireEvent.click(newTabBtn)
    })

    expect(openSpy).toHaveBeenCalledWith('/viewer/DMS-100', '_blank')
  })
})
