/**
 * Tests for Topbar Production Profile Header & My Profile & Permissions Modal
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '../context/AuthContext'
import { Topbar } from '../components/layout/Topbar'
import { USERS } from '../mock/users'

describe('Topbar Production Profile & MyProfileModal', () => {
  it('does NOT render demo user-selector dropdown', () => {
    render(
      <AuthProvider initialUser={USERS[0]}>
        <Topbar isNavCollapsed={false} onToggleNav={() => {}} />
      </AuthProvider>
    )

    // Ensure the dev dropdown is completely gone
    expect(screen.queryByLabelText(/สลับผู้ใช้/i)).toBeNull()
    expect(document.getElementById('user-selector')).toBeNull()
  })

  it('renders current user name, role badge, and opens MyProfileModal when clicked', async () => {
    render(
      <AuthProvider initialUser={USERS[0]}>
        <Topbar isNavCollapsed={false} onToggleNav={() => {}} />
      </AuthProvider>
    )

    // Check user info displayed
    expect(screen.getByText('Wajeepradit Prompan (AH)')).not.toBeNull()
    expect(screen.getByText(/Super Admin/)).not.toBeNull()

    // Modal should initially be closed
    expect(screen.queryByText('ข้อมูลและสิทธิ์การใช้งานของฉัน')).toBeNull()

    // Click profile trigger
    const profileBtn = screen.getByRole('button', { name: /โปรไฟล์และสิทธิ์/i })
    fireEvent.click(profileBtn)

    // Modal should now be open
    expect(screen.getByText('ข้อมูลและสิทธิ์การใช้งานของฉัน')).not.toBeNull()
    expect(screen.getByText('wajeepradit.p@aapico.com')).not.toBeNull()
    expect(screen.getByText('IT Support')).not.toBeNull()

    // Verify permission list rendered
    expect(screen.getByText(/สิทธิ์ที่ได้รับอนุญาต/i)).not.toBeNull()
    expect(screen.getByText('ดูบันทึกการเข้าถึง')).not.toBeNull()

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /ปิดหน้าต่างโปรไฟล์/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByText('ข้อมูลและสิทธิ์การใช้งานของฉัน')).toBeNull()
  })
})
