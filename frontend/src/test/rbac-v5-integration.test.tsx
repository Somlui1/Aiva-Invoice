/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { RbacPage } from '../components/governance/RbacPage'
import { AuthProvider } from '../context/AuthContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { USERS } from '../mock/users'

// Mock global fetch for testing
;(globalThis as any).fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes('/api/companies')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, companies: [] })
    })
  }
  if (url.includes('/api/users')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, users: [] })
    })
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ ok: true })
  })
})

describe('RBAC Page Production Integration', () => {
  it('renders all 4 tabs including PermissionExcelGrid, Role Matrix, Company Scope, and Visibility Tester', () => {
    const itAdmin = USERS.find(u => u.role === 'ADM') || USERS[6]
    render(
      <AuthProvider initialUser={itAdmin}>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    expect(screen.getByText('จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)')).toBeDefined()
    expect(screen.getByText('Matrix สิทธิ์ตามบทบาท')).toBeDefined()
    expect(screen.getByText('บริษัทและ ORG_ID')).toBeDefined()
    expect(screen.getByText('Visibility Tester')).toBeDefined()
  })

  it('has + เพิ่มผู้ใช้ button for Active Directory search', () => {
    const itAdmin = USERS.find(u => u.role === 'ADM') || USERS[6]
    render(
      <AuthProvider initialUser={itAdmin}>
        <ToastModalProvider>
          <RbacPage />
        </ToastModalProvider>
      </AuthProvider>
    )

    expect(screen.getByText(/เพิ่มผู้ใช้/i)).toBeDefined()
  })
})
