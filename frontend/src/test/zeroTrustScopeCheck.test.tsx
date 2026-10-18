// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { InvoiceDoc } from '../types/invoice'
import { User } from '../types/auth'

const sampleAhDoc: InvoiceDoc = {
  doc: 'DMS-101',
  inv: 'INV-2026-001',
  vendor: 'Sample Vendor',
  stax: 'TAX-001',
  company: 'AH',
  up: '2026-10-01',
  status: 'Auto-pass',
  assigned: 'eu',
  receiver: 'SOMSAK JAIDEE',
  po: 'PO-001',
  items: 1,
  diff: 0,
  cur: 'THB',
  base: 1000,
  tax: 70,
  net: 1070,
  wht: 0,
  hold: 0,
  codes: [],
  pageType: 'tax_invoice',
  pages: 1,
  fileSha256: 'sha-001',
  confidence: 99,
  haltedBy: null,
  ocrConfidence: 99,
  rawStatus: 'Auto-pass',
  progressSteps: [],
}

const sampleAhtDoc: InvoiceDoc = {
  ...sampleAhDoc,
  doc: 'DMS-102',
  company: 'AHT',
}

describe('Zero-Trust scopeCheck & Company Scoping', () => {
  it('rejects access to any document when an authenticated user has empty companies (unassigned)', () => {
    const unassignedUser: User = {
      id: 'new.employee',
      n: 'New Employee (Unassigned)',
      email: 'new.employee@aapico.com',
      role: 'EU',
      rcvName: '—',
      emp: null,
      co: [], // Zero-Trust: unassigned by Admin
      unit: 'Engineering',
    }

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialUser={unassignedUser}>{children}</AuthProvider>
      ),
    })

    const checkAh = result.current.scopeCheck(sampleAhDoc)
    expect(checkAh.ok).toBe(false)
    expect(checkAh.why).toContain('ยังไม่ได้รับการกำหนดสิทธิ์บริษัท')

    const checkAht = result.current.scopeCheck(sampleAhtDoc)
    expect(checkAht.ok).toBe(false)
  })

  it('allows access only to assigned companies for managed users', () => {
    const managedAccUser: User = {
      id: 'acc.employee',
      n: 'Accounting Staff',
      email: 'acc.staff@aapico.com',
      role: 'ACC',
      rcvName: '—',
      emp: 12345,
      co: ['AH'], // Managed: only AH
      unit: 'Finance',
    }

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialUser={managedAccUser}>{children}</AuthProvider>
      ),
    })

    const checkAh = result.current.scopeCheck(sampleAhDoc)
    expect(checkAh.ok).toBe(true)

    const checkAht = result.current.scopeCheck(sampleAhtDoc)
    expect(checkAht.ok).toBe(false)
    expect(checkAht.why).toContain('อยู่นอกบริษัทที่ได้รับมอบหมาย')
  })

  it('requires EU role to have matching Oracle receiver account', () => {
    const euNoReceiver: User = {
      id: 'receiver.user',
      n: 'Warehouse Staff',
      email: 'warehouse@aapico.com',
      role: 'EU',
      rcvName: '—',
      emp: 54321,
      co: ['AH'],
      unit: 'Warehouse',
    }

    const { result: noRcvResult } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialUser={euNoReceiver}>{children}</AuthProvider>
      ),
    })

    // No receiver mapped -> rejected
    expect(noRcvResult.current.scopeCheck(sampleAhDoc).ok).toBe(false)

    const euWithReceiver: User = {
      ...euNoReceiver,
      rcvName: 'SOMSAK JAIDEE',
    }

    const { result: withRcvResult } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialUser={euWithReceiver}>{children}</AuthProvider>
      ),
    })

    // Receiver matches -> accepted
    expect(withRcvResult.current.scopeCheck(sampleAhDoc).ok).toBe(true)

    // Receiver mismatch -> rejected
    const differentReceiverDoc: InvoiceDoc = {
      ...sampleAhDoc,
      receiver: 'OTHER RECEIVER',
    }
    expect(withRcvResult.current.scopeCheck(differentReceiverDoc).ok).toBe(false)
  })

  it('allows Super Admin (SA) global access to all companies', () => {
    const superAdmin: User = {
      id: 'admin.super',
      n: 'Super Admin',
      email: 'sa@aapico.com',
      role: 'SA',
      rcvName: '—',
      emp: null,
      co: [],
      unit: 'IT',
    }

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialUser={superAdmin}>{children}</AuthProvider>
      ),
    })

    expect(result.current.scopeCheck(sampleAhDoc).ok).toBe(true)
    expect(result.current.scopeCheck(sampleAhtDoc).ok).toBe(true)
  })
})
