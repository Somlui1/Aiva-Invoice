/**
 * Unit tests for LoginPage & Auth Bypass integration.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { LoginPage } from '../features/login/LoginPage'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}))

describe('LoginPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders login form with method tabs and explainer panel', () => {
    render(<LoginPage mock={true} />)

    expect(screen.getByRole('main', { name: /เข้าสู่ระบบ AIVA Portal/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Microsoft 365/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /LDAP ภายใน/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /ลงชื่อเข้าใช้ด้วย Microsoft/i })).toBeTruthy()
    expect(screen.getByText(/ระบบทำงานอย่างไร/i)).toBeTruthy()
  })

  it('shows MOCK bar with bypass button and triggers onSuccess when clicked', async () => {
    const onSuccess = vi.fn()
    render(<LoginPage mock={true} onSuccess={onSuccess} />)

    const skipButton = screen.getByRole('button', { name: /ข้ามหน้า login/i })
    expect(skipButton).toBeTruthy()

    await act(async () => {
      fireEvent.click(skipButton)
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    const [user, method] = onSuccess.mock.calls[0]
    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('email')
    expect(method).toBe('m365')
    expect(localStorage.getItem('aiva.auth.user')).toBe(user.id)
  })

  it('allows Microsoft 365 login in mock mode', async () => {
    const onSuccess = vi.fn()
    render(<LoginPage mock={true} onSuccess={onSuccess} />)

    const msButton = screen.getByRole('button', { name: /ลงชื่อเข้าใช้ด้วย Microsoft/i })
    await act(async () => {
      fireEvent.click(msButton)
    })

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalled()
      },
      { timeout: 5000 },
    )

    const [user, method] = onSuccess.mock.calls[0]
    expect(user).toHaveProperty('id')
    expect(method).toBe('m365')
  })

  it('switches to LDAP tab and allows instant login in bypass mode', async () => {
    const onSuccess = vi.fn()
    const { container } = render(<LoginPage mock={true} onSuccess={onSuccess} />)

    const ldapTab = screen.getByRole('tab', { name: /LDAP ภายใน/i })
    await act(async () => {
      fireEvent.click(ldapTab)
    })

    const usernameInput = container.querySelector('#lgU') as HTMLInputElement
    const passwordInput = container.querySelector('#lgP') as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i })

    expect(usernameInput).toBeTruthy()
    expect(passwordInput).toBeTruthy()

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'somsak.j' } })
      fireEvent.change(passwordInput, { target: { value: 'anypassword' } })
    })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalled()
      },
      { timeout: 5000 },
    )

    const [user, method] = onSuccess.mock.calls[0]
    expect(user.email).toContain('somsak.j')
    expect(method).toBe('ldap')
  })
})
