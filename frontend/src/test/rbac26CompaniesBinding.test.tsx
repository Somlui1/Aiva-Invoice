// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserInspectorPane } from '../components/governance/rbac/UserInspectorPane'
import { ManagedUser } from '../components/governance/rbac/PermissionExcelGrid'
import { COMPANIES_26 } from '../mock/companies26'

describe('RBAC 26 Companies Scope Binding in UserInspectorPane', () => {
  const sampleUser: ManagedUser = {
    id: 'test.user',
    name: 'Test Employee',
    email: 'test@aapico.com',
    samAccount: 'test.user',
    role: 'ACC',
    companies: ['AH'],
    receivers: [],
  }

  const all26CompanyCodes = Object.keys(COMPANIES_26)

  it('renders all 26 AAPICO companies when provided as availableCompanies', () => {
    const handleToggle = vi.fn()
    const handleRole = vi.fn()

    render(
      <UserInspectorPane
        user={sampleUser}
        onRoleChange={handleRole}
        onToggleCompany={handleToggle}
        availableCompanies={all26CompanyCodes}
      />
    )

    // Check header displays company count
    expect(screen.getByText(/1 \/ 26 บริษัท/)).not.toBeNull()

    // Verify key 26-company codes are present in the DOM
    expect(screen.getByText('AH')).not.toBeNull()
    expect(screen.getByText('AHA')).not.toBeNull()
    expect(screen.getByText('AITS')).not.toBeNull()
    expect(screen.getByText('ASP')).not.toBeNull()
    expect(screen.getByText('AF')).not.toBeNull()
    expect(screen.getByText('APR')).not.toBeNull()
    expect(screen.getByText('AL')).not.toBeNull()
  })

  it('provides quick select all and clear all company actions', () => {
    const handleToggle = vi.fn()
    const handleRole = vi.fn()
    const handleSetCompanies = vi.fn()

    render(
      <UserInspectorPane
        user={sampleUser}
        onRoleChange={handleRole}
        onToggleCompany={handleToggle}
        onSetCompanies={handleSetCompanies}
        availableCompanies={all26CompanyCodes}
      />
    )

    const selectAllBtn = screen.getByRole('button', { name: /เลือกทั้งหมด/i })
    expect(selectAllBtn).not.toBeNull()
    fireEvent.click(selectAllBtn)
    expect(handleSetCompanies).toHaveBeenCalledWith(all26CompanyCodes)

    const clearAllBtn = screen.getByRole('button', { name: /ล้างทั้งหมด/i })
    expect(clearAllBtn).not.toBeNull()
    fireEvent.click(clearAllBtn)
    expect(handleSetCompanies).toHaveBeenCalledWith([])
  })
})
