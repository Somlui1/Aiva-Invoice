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
    await screen.findByText('สิทธิ์และการเชื่อมบัญชี')
  } else if (user.role === 'APR' || user.role === 'SA') {
    await screen.findByText('คิวตรวจสอบ')
  } else {
    await screen.findByText('งานของฉัน')
  }
}

const REMOVED_V57 = ['ชุดเอกสารทดสอบ', 'มาตรฐาน Payload', 'Document Simulation', 'เครื่องมือทดสอบและพัฒนา', 'ตั้งค่า']

function expectRemovedMenusAbsent() {
  for (const label of REMOVED_V57) expect(screen.queryByText(label)).toBeNull()
}

describe('Sidebar Role-Based Menu Visibility (v5.7: test tools + settings removed)', () => {
  it('End User (EU): work + governance only', async () => {
    await renderSidebarFor('u1')
    expect(screen.getByText('งานของฉัน')).not.toBeNull()
    expect(screen.getByText('สิทธิ์และการเชื่อมบัญชี')).not.toBeNull()
    expectRemovedMenusAbsent()
  })

  it('Accounting Lead (APR): queue, AP, audit', async () => {
    await renderSidebarFor('u6')
    expect(screen.getByText('คิวตรวจสอบ')).not.toBeNull()
    expect(screen.getByText('ส่งเข้า AP Interface')).not.toBeNull()
    expect(screen.getByText('บันทึกการเข้าถึง')).not.toBeNull()
    expectRemovedMenusAbsent()
  })

  it('Admin (ADM): governance only — no test / dev section any more', async () => {
    await renderSidebarFor('u7')
    expect(screen.getByText('สิทธิ์และการเชื่อมบัญชี')).not.toBeNull()
    expect(screen.queryByText('คิวตรวจสอบ')).toBeNull()
    expectRemovedMenusAbsent()
  })

  it('Support Admin (itsupport): work + governance, no settings / dev tools', async () => {
    await renderSidebarFor('itsupport')
    expect(screen.getByText('คิวตรวจสอบ')).not.toBeNull()
    expect(screen.getByText('ส่งเข้า AP Interface')).not.toBeNull()
    expect(screen.getByText('สิทธิ์และการเชื่อมบัญชี')).not.toBeNull()
    expect(screen.getByText('บันทึกการเข้าถึง')).not.toBeNull()
    expectRemovedMenusAbsent()
  })
})
