/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { RbacPage } from '../components/governance/RbacPage'
import { AuthProvider } from '../context/AuthContext'
import { ToastModalProvider } from '../context/ToastModalContext'

const mockCompanies = [
  {
    code: 'AH',
    name: 'AAPICO HITECH PUBLIC COMPANY LIMITED',
    taxId: '0107545000131',
    ouName: 'Aapico Hitech Legal',
    ledgerName: 'AH_Ledger',
    orgId: 82,
    isActive: true,
  },
  {
    code: 'AHP',
    name: 'AAPICO HITECH PARTS CO., LTD.',
    taxId: '0135548003612',
    ouName: 'Aapico Hitech Parts Legal',
    ledgerName: 'AHP_Ledger',
    orgId: 176,
    isActive: true,
  },
  {
    code: 'AEV',
    name: 'ABLE EV CO., LTD.',
    taxId: '0135566030351',
    ouName: 'Able EV Legal',
    ledgerName: 'AEV_Ledger',
    orgId: 535,
    isActive: true,
  },
]

describe('RbacPage Tab 3: Company Master Search & Oracle Sync', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn().mockImplementation((url: string, init?: any) => {
      if (url.includes('/api/companies')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            companies: mockCompanies,
            count: mockCompanies.length,
          }),
        } as Response)
      }
      if (url.includes('/api/oracle/sync-companies')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            source: 'oracle_mcp',
            companies: [
              ...mockCompanies,
              {
                code: 'NEW_CO',
                name: 'NEW SYNCED COMPANY LTD',
                taxId: '9999999999999',
                ouName: 'New OU Legal',
                ledgerName: 'NEW_Ledger',
                orgId: 999,
                isActive: true,
              },
            ],
            syncedAt: new Date().toISOString(),
          }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response)
    })
  })

  it('renders company search bar and counter in Tab 3', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    // Switch to Companies tab
    const companyTab = screen.getByRole('tab', { name: /บริษัทและ ORG_ID/i })
    fireEvent.click(companyTab)

    // Search input should exist
    const searchInput = screen.getByPlaceholderText(/ค้นหาตามรหัสย่อ, ชื่อบริษัท, Tax ID หรือ ORG_ID/i)
    expect(searchInput).toBeDefined()

    // Counter badge should display companies count
    await waitFor(() => {
      expect(screen.getByText(/แสดง 3 จาก 3 บริษัท/i)).toBeDefined()
    })
  })

  it('filters companies instantly when user types in search input', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    const companyTab = screen.getByRole('tab', { name: /บริษัทและ ORG_ID/i })
    fireEvent.click(companyTab)

    const searchInput = screen.getByPlaceholderText(/ค้นหาตามรหัสย่อ, ชื่อบริษัท, Tax ID หรือ ORG_ID/i)

    // Initially all 3 mock companies are rendered
    await waitFor(() => {
      expect(screen.getByText('ABLE EV CO., LTD.')).toBeDefined()
      expect(screen.getByText('AAPICO HITECH PARTS CO., LTD.')).toBeDefined()
    })

    // Search by code "AEV"
    fireEvent.change(searchInput, { target: { value: 'AEV' } })

    expect(screen.getByText('ABLE EV CO., LTD.')).toBeDefined()
    expect(screen.queryByText('AAPICO HITECH PARTS CO., LTD.')).toBeNull()
    expect(screen.getByText(/แสดง 1 จาก 3 บริษัท/i)).toBeDefined()

    // Search by ORG_ID "176"
    fireEvent.change(searchInput, { target: { value: '176' } })

    expect(screen.getByText('AAPICO HITECH PARTS CO., LTD.')).toBeDefined()
    expect(screen.queryByText('ABLE EV CO., LTD.')).toBeNull()

    // Search by non-matching query
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } })
    expect(screen.getByText(/ไม่พบบริษัทที่ตรงกับคำค้นหา/i)).toBeDefined()
  })

  it('triggers Oracle MCP sync and updates company list', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    const companyTab = screen.getByRole('tab', { name: /บริษัทและ ORG_ID/i })
    fireEvent.click(companyTab)

    // Wait for initial mount fetch to complete
    await waitFor(() => {
      expect(screen.getByText('ABLE EV CO., LTD.')).toBeDefined()
    })

    const syncBtn = screen.getByRole('button', { name: /Sync ข้อมูลจาก Oracle/i })
    fireEvent.click(syncBtn)

    await waitFor(() => {
      expect(screen.getByText(/ซิงค์ข้อมูลสำเร็จ จาก Oracle ERP/i)).toBeDefined()
      expect(screen.getByText('NEW SYNCED COMPANY LTD')).toBeDefined()
    })
  })
})
