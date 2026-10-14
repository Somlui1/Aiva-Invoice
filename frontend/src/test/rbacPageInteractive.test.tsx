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
})
