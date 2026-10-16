/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuditPage } from '../components/governance/AuditPage'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'

const mockLogs = [
  {
    id: 'log-1',
    dt: '2026-10-16',
    t: '10:00:00',
    category: 'INGESTION',
    who: 'System A OCR Engine',
    role: 'SYSTEM',
    act: 'INGEST',
    doc: 'DMS-101',
    detail: 'นำเข้าเอกสารใบแจ้งหนี้ DMS-101',
  },
  {
    id: 'log-2',
    dt: '2026-10-16',
    t: '10:05:00',
    category: 'RBAC_USER',
    who: 'IT Administrator',
    role: 'ADM',
    act: 'สร้างผู้ใช้ใหม่',
    doc: 'USER_MANAGEMENT',
    detail: 'สร้างผู้ใช้ใหม่: นายทดสอบ',
  },
  {
    id: 'log-3',
    dt: '2026-10-16',
    t: '10:10:00',
    category: 'DOCUMENT',
    who: 'สมศักดิ์ บัญชี',
    role: 'ACC',
    act: 'อนุมัติเอกสาร',
    doc: 'DMS-101',
    detail: 'อนุมัติเอกสารเรียบร้อย',
  },
]

describe('Unified Audit Logs UI (AuditPage)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/audit-logs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, logs: mockLogs }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    }) as any
  })

  function renderPage() {
    return render(
      <AuthProvider
        initialUser={{
          id: 'u7',
          n: 'IT Admin',
          email: 'admin@aapico.com',
          role: 'ADM',
          rcvName: '—',
          emp: 7777,
          co: ['AH', 'AHP'],
          unit: 'IT',
        }}
      >
        <SettingsProvider>
          <ToastModalProvider>
            <AuditPage />
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    )
  }

  it('renders search input and category dropdown filter in toolbar', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ค้นหา/i)).toBeDefined()
      expect(screen.getByRole('combobox', { name: /กรองประเภท log/i })).toBeDefined()
    })
  })

  it('renders category badges in the table rows with proper labels', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getAllByText('DMS-101').length).toBeGreaterThan(0)
      expect(screen.getByText('USER_MANAGEMENT')).toBeDefined()
    })

    // Badges for categories
    expect(screen.getAllByText(/นำเข้าเอกสาร/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/จัดการผู้ใช้/i).length).toBeGreaterThan(0)
  })

  it('fetches logs with updated category and search query parameters when changed', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ค้นหา/i)).toBeDefined()
    })

    const searchInput = screen.getByPlaceholderText(/ค้นหา/i)
    fireEvent.change(searchInput, { target: { value: 'ทดสอบ' } })

    const categorySelect = screen.getByRole('combobox', { name: /กรองประเภท log/i })
    fireEvent.change(categorySelect, { target: { value: 'RBAC_USER' } })

    await waitFor(() => {
      const calls = (global.fetch as any).mock.calls.map((c: any) => c[0])
      expect(calls.some((url: string) => url.includes('category=RBAC_USER') && url.includes('search='))).toBe(true)
    })
  })
})
