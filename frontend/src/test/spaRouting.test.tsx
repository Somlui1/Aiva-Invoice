/**
 * Tests for React SPA Client Routing in App.tsx
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '../App'
import { USERS } from '../mock/users'

vi.mock('../features/pdf-viewer/components/StandaloneBBoxViewer', () => ({
  StandaloneBBoxViewer: ({ docId, title }: { docId: string; title: string }) => (
    <div data-testid="mock-standalone-viewer">
      <span>{docId}</span>
      <span>{title}</span>
    </div>
  ),
  mapBBoxType: vi.fn(() => 'field'),
  bboxTagOf: vi.fn(() => 'field'),
}))

describe('SPA Client Routing (App.tsx)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders LoginPage directly when route is /login', () => {
    render(<App route="/login" />)
    expect(screen.getByRole('main', { name: /เข้าสู่ระบบ AIVA Portal/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /ลงชื่อเข้าใช้ด้วย Microsoft/i })).toBeTruthy()
  })

  it('renders StandaloneBBoxViewer when route starts with /viewer/', () => {
    render(<App route="/viewer/DMS-INV-2026-001" />)
    const viewer = screen.getByTestId('mock-standalone-viewer')
    expect(viewer).toBeTruthy()
    expect(viewer.textContent).toContain('DMS-INV-2026-001')
  })

  it('renders PortalShell for authenticated user on root route', () => {
    const { container } = render(<App initialUser={USERS[0]} route="/" />)
    expect(container.querySelector('.shell')).toBeTruthy()
    expect(container.querySelector('.topbar')).toBeTruthy()
  })

  it('renders auth-redirect-guard for unauthenticated visitors on root route', () => {
    render(<App initialUser={null} route="/" />)
    expect(screen.getByTestId('auth-redirect-guard')).toBeTruthy()
    expect(screen.getByText(/กำลังนำทางไปหน้าเข้าสู่ระบบ.../i)).toBeTruthy()
  })
})
