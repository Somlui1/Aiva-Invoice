/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { RbacPage } from '../components/governance/RbacPage'
import { AuthProvider } from '../context/AuthContext'
import { ToastModalProvider } from '../context/ToastModalContext'

const mockUsers = [
  {
    id: 'u1',
    name: 'สมศักดิ์ ใจดี',
    email: 'somsak.j@aapico.com',
    samAccount: 'somsak.j',
    empId: '10231',
    unit: 'คลังวัตถุดิบ',
    role: 'EU',
    companies: ['AH'],
    receivers: ['SOMSAK JAIDEE'],
  },
  {
    id: 'u2',
    name: 'พรทิพย์ สุขเกษม',
    email: 'porntip.s@aapico.com',
    samAccount: 'porntip.s',
    empId: '10442',
    unit: 'การเงินและบัญชี',
    role: 'ACC',
    companies: ['AH', 'AHT'],
    receivers: [],
  },
]

describe('AIVA v5.2 / v4.22 4-Tab Admin Permission Console in /rbac', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.setItem('aiva.auth.user', 'u7') // IT Admin

    ;(global as any).fetch = vi.fn().mockImplementation(async (url: any) => {
      const urlStr = String(url)
      if (urlStr.includes('/api/users')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            users: JSON.parse(JSON.stringify(mockUsers)),
          }),
        } as Response
      }
      if (urlStr.includes('/api/companies')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            companies: [
              { code: 'AH', name: 'อาปิโก ไฮเทค (มหาชน)', taxId: '0107545000179', orgId: 82, isActive: true },
              { code: 'AHT', name: 'อาปิโก ไฮเทค ทูลลิ่ง', taxId: '0145548001557', orgId: 195, isActive: true },
            ],
          }),
        } as Response
      }
      return { ok: true, json: async () => ({ ok: true }) } as Response
    })
  })

  it('renders all 4 tabs: Users, Role Matrix, Companies, and Visibility Tester', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    const userTab = screen.getByRole('tab', { name: /จัดการสิทธิ์ผู้ใช้งาน/i })
    const matrixTab = screen.getByRole('tab', { name: /Matrix สิทธิ์/i })
    const companyTab = screen.getByRole('tab', { name: /บริษัทและ ORG_ID/i })
    const testerTab = screen.getByRole('tab', { name: /Visibility Tester/i })

    expect(userTab).toBeDefined()
    expect(matrixTab).toBeDefined()
    expect(companyTab).toBeDefined()
    expect(testerTab).toBeDefined()
  })

  it('displays user in inspector pane when selected in grid and allows role editing with draft footer', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    // Wait for user to load in grid
    const userElements = await screen.findAllByText('สมศักดิ์ ใจดี')
    expect(userElements.length).toBeGreaterThan(0)
    const userRow = userElements[0]

    // Click on row to select
    fireEvent.click(userRow)

    // Inspector pane should now show user details
    const inspPane = screen.getByTestId('user-inspector-pane')
    expect(inspPane).toBeDefined()
    expect(inspPane.textContent).toContain('สมศักดิ์ ใจดี')
    expect(inspPane.textContent).toContain('somsak.j@aapico.com')

    // Find ACC role card in inspector and switch role
    const accRoleCard = screen.getByTestId('role-card-ACC')
    fireEvent.click(accRoleCard)

    // Footer banner (.pm-foot.dirty) should become active with pending count
    const footBanner = await screen.findByTestId('pm-draft-foot')
    expect(footBanner.classList.contains('dirty')).toBe(true)
    expect(footBanner.textContent).toContain('1')

    // Click Review & Save to verify SaveDiffModal opens
    const saveBtn = screen.getByRole('button', { name: /ตรวจสอบและบันทึก/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText(/ตรวจสอบรายการแก้ไขสิทธิ์ก่อนบันทึก/i)).toBeDefined()
    })
  })

  it('switches to Role Matrix tab and displays .pm-mx table with 5 roles', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    const matrixTab = screen.getByRole('tab', { name: /Matrix สิทธิ์/i })
    fireEvent.click(matrixTab)

    expect(screen.getByTestId('role-permission-matrix')).toBeDefined()
    expect(screen.getByText('EU')).toBeDefined()
    expect(screen.getByText('ACC')).toBeDefined()
    expect(screen.getByText('APR')).toBeDefined()
    expect(screen.getByText('ADM')).toBeDefined()
    expect(screen.getByText('SA')).toBeDefined()
  })

  it('switches to Visibility Tester tab and evaluates user access', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    const testerTab = screen.getByRole('tab', { name: /Visibility Tester/i })
    fireEvent.click(testerTab)

    expect(screen.getByTestId('visibility-tester')).toBeDefined()
    expect(screen.getByText(/จำลองการมองเห็นเอกสาร/i)).toBeDefined()
  })
})
