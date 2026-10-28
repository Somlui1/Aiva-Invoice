/**
 * Unit tests for LoginPage & Auth Bypass integration.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { LoginPage } from '../features/login/LoginPage'


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

  it('does NOT render yellow MOCK bar or bypass button in production', () => {
    const { container } = render(<LoginPage mock={false} />)

    // Ensure yellow mock bar and skip button are completely purged
    expect(screen.queryByRole('button', { name: /ข้ามหน้า login/i })).toBeNull()
    expect(screen.queryByText(/ผลจำลอง/i)).toBeNull()
    expect(screen.queryByText(/บัญชี Microsoft ทดสอบ/i)).toBeNull()
    expect(container.querySelector('.lg-dev')).toBeNull()
    expect(screen.queryByText(/Mock Prototype/i)).toBeNull()
    expect(container.querySelector('.nt')).toBeNull()
    expect(screen.queryByText(/Portal ไม่เก็บ URL ของ DMS/i)).toBeNull()
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
      { timeout: 10000 },
    )

    const [user, method] = onSuccess.mock.calls[0]
    expect(user).toHaveProperty('id')
    expect(method).toBe('m365')
  }, 15000)

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
      fireEvent.change(usernameInput, { target: { value: 'wajeepradit.p' } })
      fireEvent.change(passwordInput, { target: { value: 'anypassword' } })
    })

    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalled()
      },
      { timeout: 10000 },
    )

    const [user, method] = onSuccess.mock.calls[0]
    expect(user.email).toContain('wajeepradit.p')
    expect(method).toBe('ldap')
  }, 15000)

  it('speeds up animation constants and allows toggling auto-play smoothly', async () => {
    const { DWELL, STEP_MS, WF } = await import('../features/login/data/explainer')
    expect(DWELL.flow).toBe(10000)
    expect(DWELL.rules).toBe(12000)
    expect(STEP_MS.flow).toBe(1650)
    expect(WF[0].note).toBe('')

    render(<LoginPage mock={false} />)
    const toggleBtn = screen.getByRole('button', { name: /หยุดเล่นอัตโนมัติ/i })
    expect(toggleBtn).toBeTruthy()

    // Click to pause
    await act(async () => {
      fireEvent.click(toggleBtn)
    })
    expect(screen.getByRole('button', { name: /เล่นอัตโนมัติ/i })).toBeTruthy()

    // Click to resume
    const resumeBtn = screen.getByRole('button', { name: /เล่นอัตโนมัติ/i })
    await act(async () => {
      fireEvent.click(resumeBtn)
    })
    expect(screen.getByRole('button', { name: /หยุดเล่นอัตโนมัติ/i })).toBeTruthy()
  })
})
