/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RbacPage } from '../components/governance/RbacPage'
import { AuthProvider } from '../context/AuthContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import React from 'react'

describe('Interactive RbacPage with Mockup v3 Excel Grid', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.setItem('aiva.auth.user', 'u7') // IT Admin

    vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = String(url)
      if (urlStr.includes('/api/users')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            users: [
              {
                id: 'u1',
                email: 'somsak.j@aapico.com',
                name: 'สมศักดิ์ ใจดี',
                samAccount: 'somsak.j',
                empId: '10231',
                unit: 'คลังวัตถุดิบ',
                role: 'EU',
                companies: [],
                receivers: ['SOMSAK JAIDEE'],
              },
            ],
          }),
        } as Response
      }
      if (urlStr.includes('/api/ad/search')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            results: [
              {
                name: 'วิไลวรรณ ศรีสุข',
                email: 'wilaiwan.s@aapico.com',
                samAccount: 'wilaiwan.s',
                empId: '20417',
                title: 'เจ้าหน้าที่ซ่อมบำรุง',
                unit: 'ฝ่ายซ่อมบำรุง',
                ou: 'OU=Maintenance,DC=aapico,DC=com',
                enabled: true,
              },
            ],
          }),
        } as Response
      }
      if (urlStr.includes('/api/oracle/sync-companies')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            source: 'oracle_mcp',
            companies: [
              { code: 'AH', name: 'อาปิโก ไฮเทค (มหาชน)', tax: '0107545000179', orgs: [101, 103, 222] },
              { code: 'AHT', name: 'อาปิโก ไฮเทค ทูลลิ่ง', tax: '0145548001557', orgs: [195, 196, 352] },
            ],
          }),
        } as Response
      }
      return { ok: true, json: async () => ({}) } as Response
    })
  })

  it('renders Excel Grid toolbar with Add User button and opens search modal', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    const addBtn = await screen.findByRole('button', { name: /เพิ่มผู้ใช้/i })
    expect(addBtn).not.toBeNull()
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/พิมพ์ชื่อ, username หรือรหัสพนักงาน/i)).not.toBeNull()
    })
  })

  it('renders 3 tabs and switches views between Admin Grid, Matrix, and Companies', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    // Check tabs existence
    const userTab = screen.getByRole('tab', { name: /จัดการสิทธิ์ผู้ใช้งาน/i })
    const matrixTab = screen.getByRole('tab', { name: /Matrix สิทธิ์/i })
    const companyTab = screen.getByRole('tab', { name: /บริษัทและ ORG_ID/i })

    expect(userTab).toBeDefined()
    expect(matrixTab).toBeDefined()
    expect(companyTab).toBeDefined()

    // Assert that tabs contain SVG icons and NO raw emojis
    expect(userTab.querySelector('svg')).not.toBeNull()
    expect(matrixTab.querySelector('svg')).not.toBeNull()
    expect(companyTab.querySelector('svg')).not.toBeNull()
    expect(userTab.textContent).not.toMatch(/[👤📋🏢🔒🔄]/)
    expect(matrixTab.textContent).not.toMatch(/[👤📋🏢🔒🔄]/)
    expect(companyTab.textContent).not.toMatch(/[👤📋🏢🔒🔄]/)

    // Default tab is user admin grid
    expect(userTab.classList.contains('on')).toBe(true)
    expect(screen.getByRole('button', { name: /เพิ่มผู้ใช้/i })).toBeDefined()
    expect(screen.queryByText(/Matrix สิทธิ์ตามบทบาท \(ตารางที่ 6\)/i)).toBeNull()

    // Switch to Matrix tab
    fireEvent.click(matrixTab)
    expect(matrixTab.classList.contains('on')).toBe(true)
    expect(screen.getByText(/Matrix สิทธิ์ตามบทบาท \(ตารางที่ 6\)/i)).toBeDefined()
    expect(screen.queryByRole('button', { name: /เพิ่มผู้ใช้/i })).toBeNull()

    // Switch to Companies tab
    fireEvent.click(companyTab)
    expect(companyTab.classList.contains('on')).toBe(true)
    expect(screen.getByText(/บริษัทและ ORG_ID \(ตารางที่ 4\)/i)).toBeDefined()
    const syncBtn = screen.getByRole('button', { name: /Sync ข้อมูลจาก Oracle/i })
    expect(syncBtn).toBeDefined()
    expect(syncBtn.textContent).not.toMatch(/[🔄]/)
    expect(syncBtn.querySelector('svg')).not.toBeNull()
  })

  it('triggers company sync from Oracle in Tab 3', async () => {
    render(
      <AuthProvider>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    // Go to Companies tab
    const companyTab = screen.getByRole('tab', { name: /บริษัทและ ORG_ID/i })
    fireEvent.click(companyTab)

    const syncBtn = screen.getByRole('button', { name: /Sync ข้อมูลจาก Oracle/i })
    expect(syncBtn).toBeDefined()
    fireEvent.click(syncBtn)

    await waitFor(() => {
      expect(screen.getByText(/ซิงค์ข้อมูลสำเร็จ/i)).toBeDefined()
    })
  })
})

