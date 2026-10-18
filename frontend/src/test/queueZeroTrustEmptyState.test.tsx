// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '../context/AuthContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { QueuePage } from '../components/queue/QueuePage'
import { QueueTableView } from '../components/queue/QueueTableView'
import { User } from '../types/auth'

// Mock global fetch to return sample documents
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/documents')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          ok: true,
          documents: [
            {
              doc: 'DMS-001',
              inv: 'INV-001',
              vendor: 'Vendor A',
              stax: 'TAX-001',
              company: 'AH',
              up: '2026-10-01',
              status: 'Auto-pass',
              assigned: 'eu',
              receiver: 'SOMSAK',
              po: 'PO-001',
              items: 1,
              diff: 0,
              cur: 'THB',
              base: 100,
              tax: 7,
              net: 107,
              wht: 0,
              hold: 0,
              codes: [],
              pageType: 'tax_invoice',
              pages: 1,
              fileSha256: 'sha1',
              confidence: 99,
              haltedBy: null,
              ocrConfidence: 99,
              rawStatus: 'Auto-pass',
              progressSteps: [],
            },
          ],
        }),
      })
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) })
  }))
})

describe('Queue Zero-Trust Empty State', () => {
  const unassignedUser: User = {
    id: 'unassigned.user',
    n: 'Unassigned User',
    email: 'unassigned@aapico.com',
    role: 'EU',
    rcvName: '—',
    emp: null,
    co: [], // Zero-Trust: no assigned company
    unit: 'Operations',
  }

  it('renders a dedicated zero-trust empty state in QueuePage when user has no assigned companies', async () => {
    render(
      <ToastModalProvider>
        <AuthProvider initialUser={unassignedUser}>
          <SettingsProvider>
            <InvoiceProvider>
              <QueuePage />
            </InvoiceProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastModalProvider>
    )

    // Should indicate zero documents in queue
    expect(screen.getByText('0 ฉบับ')).not.toBeNull()

    // Should render the zero-trust empty notice
    const emptyNotice = await screen.findByText(/ยังไม่ได้รับการกำหนดสิทธิ์เข้าถึงข้อมูลบริษัท/i)
    expect(emptyNotice).not.toBeNull()
    expect(screen.getByText(/กรุณาติดต่อผู้ดูแลระบบ/i)).not.toBeNull()
  })

  it('renders a dedicated zero-trust empty row in QueueTableView when user has no assigned companies', async () => {
    render(
      <ToastModalProvider>
        <AuthProvider initialUser={unassignedUser}>
          <SettingsProvider>
            <InvoiceProvider>
              <QueueTableView />
            </InvoiceProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastModalProvider>
    )

    // In table view, zero-trust notice should be displayed in tbody empty state
    const emptyTableNotice = await screen.findByText(/ยังไม่ได้รับการกำหนดสิทธิ์เข้าถึงข้อมูลบริษัท/i)
    expect(emptyTableNotice).not.toBeNull()
  })
})
