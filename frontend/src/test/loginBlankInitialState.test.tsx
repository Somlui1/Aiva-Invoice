// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginPage } from '@/features/login/LoginPage'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}))

describe('LoginPage Blank State & No Default IT Support', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders blank username and password inputs without default itsupport or fake user', () => {
    render(<LoginPage />)
    
    // Switch to LDAP tab
    const ldapTab = screen.getByRole('tab', { name: /LDAP ภายใน/i })
    fireEvent.click(ldapTab)

    const userInput = screen.getByPlaceholderText('ชื่อผู้ใช้ภายในบริษัท') as HTMLInputElement
    const passInput = screen.getByPlaceholderText('รหัสผ่าน') as HTMLInputElement

    expect(userInput.value).toBe('')
    expect(passInput.value).toBe('')
    expect(userInput.value).not.toBe('itsupport')
    expect(userInput.value).not.toBe('somsak.j')
  })
})
