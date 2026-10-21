/**
 * Sidebar Role-Based Menu Isolation Tests.
 * Design: docs/plans/2026-10-09-pdf-dock-focus-sidebar-cleanup-design.md
 * Plan:   docs/plans/2026-10-09-pdf-dock-focus-sidebar-cleanup.md
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AuthProvider, useAuth } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { useEffect } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { USERS } from '../mock/users'
import { User } from '../types/auth'

async function renderSidebarFor(userOrId: string | User) {
  const user: User = typeof userOrId === 'string'
    ? (USERS.find(u => u.id === userOrId) || {
        id: userOrId,
        n: userOrId,
        email: `${userOrId}@aapico.com`,
        role: (userOrId === 'u7' ? 'ADM' : userOrId === 'u6' ? 'APR' : userOrId === 'itsupport' ? 'SA' : 'EU'),
        rcvName: '—',
        emp: null,
        co: ['AH', 'AHA', 'AHT', 'AHP', 'AM'],
        unit: 'IT',
      })
    : userOrId

  render(
    <AuthProvider initialUser={user}>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <Sidebar currentPage="queue" onNavigate={() => {}} onToggleNav={() => {}} />
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>,
  )
  if (user.role === 'ADM') {
    await screen.findByText('เครื่องมือทดสอบและพัฒนา')
  } else if (user.role === 'APR' || user.role === 'SA') {
    await screen.findByText('คิวตรวจสอบ')
  } else {
    await screen.findByText('งานของฉัน')
  }
}

describe('Sidebar Role-Based Menu Visibility', () => {
  it('hides test tools and developer items for regular End User (EU)', async () => {
    // u1 = สมศักดิ์ ใจดี (EU)
    await renderSidebarFor('u1')

    // Regular work items should exist
    expect(screen.getByText('งานของฉัน')).not.toBeNull()
    expect(screen.getByText('สิทธิ์และการเชื่อมบัญชี')).not.toBeNull()

    // Test & dev tools must NOT be rendered
    expect(screen.queryByText('ชุดเอกสารทดสอบ')).toBeNull()
    expect(screen.queryByText('มาตรฐาน Payload')).toBeNull()
    expect(screen.queryByText('Document Simulation')).toBeNull()
    expect(screen.queryByText('สำหรับนักพัฒนา')).toBeNull()
    expect(screen.queryByText('เครื่องมือพิเศษ')).toBeNull()
  })

  it('hides test tools and developer items for Accounting Lead (APR)', async () => {
    // u6 = สมชาย วงศ์ทอง (APR)
    await renderSidebarFor('u6')

    // Real production items should exist
    expect(screen.getByText('คิวตรวจสอบ')).not.toBeNull()
    expect(screen.getByText('ส่งเข้า AP Interface')).not.toBeNull()
    expect(screen.getByText('บันทึกการเข้าถึง')).not.toBeNull()

    // Test & dev tools must NOT be rendered
    expect(screen.queryByText('ชุดเอกสารทดสอบ')).toBeNull()
    expect(screen.queryByText('มาตรฐาน Payload')).toBeNull()
    expect(screen.queryByText('Document Simulation')).toBeNull()
  })

  it('shows test tools and dev items under IT section for Admin (ADM)', async () => {
    // u7 = อนุชา ไอที (ADM)
    await renderSidebarFor('u7')

    // IT testing & dev tools should exist
    expect(screen.getByText('ชุดเอกสารทดสอบ')).not.toBeNull()
    expect(screen.getByText('มาตรฐาน Payload')).not.toBeNull()
    expect(screen.getByText('Document Simulation')).not.toBeNull()
    expect(screen.getByText('เครื่องมือทดสอบและพัฒนา')).not.toBeNull()
  })

  it('shows ALL menu sections (Work, Governance, Dev/Testing) for Support Admin (itsupport)', async () => {
    // itsupport user
    await renderSidebarFor('itsupport')

    // Work items must exist
    expect(screen.getByText('คิวตรวจสอบ')).not.toBeNull()
    expect(screen.getByText('ส่งเข้า AP Interface')).not.toBeNull()

    // Governance items must exist
    expect(screen.getByText('สิทธิ์และการเชื่อมบัญชี')).not.toBeNull()
    expect(screen.getByText('บันทึกการเข้าถึง')).not.toBeNull()
    expect(screen.getByText('ตั้งค่า')).not.toBeNull()

    // Dev/Testing tools must ALSO exist
    expect(screen.getByText('เครื่องมือทดสอบและพัฒนา')).not.toBeNull()
    expect(screen.getByText('ชุดเอกสารทดสอบ')).not.toBeNull()
    expect(screen.getByText('มาตรฐาน Payload')).not.toBeNull()
    expect(screen.getByText('Document Simulation')).not.toBeNull()
  })
})
