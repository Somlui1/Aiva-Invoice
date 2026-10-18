import { describe, it, expect } from 'vitest'
import { scopeCheckFor, visibleDocsFor } from '@/lib/queueFilters'
import { ROLES } from '@/mock/users'
import type { InvoiceDoc } from '@/types/invoice'
import type { User } from '@/types/auth'

describe('Strict Zero-Trust RBAC Scoping', () => {
  const sampleDocs = [
    {
      id: 'DMS-101',
      doc: 'DMS-101',
      inv: 'INV-001',
      vendor: 'Supplier A',
      company: 'AH',
      receiver: 'SOMSAK JAIDEE',
      status: 'Auto-pass',
      rules: [],
      codes: [],
      up: '2026-10-07 10:00:00',
    },
    {
      id: 'DMS-102',
      doc: 'DMS-102',
      inv: 'INV-002',
      vendor: 'Supplier B',
      company: 'AHT',
      receiver: 'WILAIWAN SRISOOK',
      status: 'Review',
      rules: [],
      codes: [],
      up: '2026-10-07 10:05:00',
    },
  ] as unknown as InvoiceDoc[]

  it('strictly returns 0 documents for newly logged-in user without granted company permissions', () => {
    const unassignedUser: User = {
      id: 'new.employee',
      n: 'New Employee',
      email: 'new.employee@aapico.com',
      role: 'EU',
      rcvName: '—',
      emp: null,
      co: [], // Zero-trust: No companies assigned by Admin!
      unit: 'General',
    }

    const scopeCheck = (d: InvoiceDoc) => scopeCheckFor(d, unassignedUser, ROLES.EU, [])
    const visibleDocs = visibleDocsFor(sampleDocs, scopeCheck)
    
    expect(visibleDocs).toHaveLength(0)
  })

  it('allows access to documents matching explicitly assigned companies once granted by Admin', () => {
    const grantedUser: User = {
      id: 'granted.employee',
      n: 'Granted Employee',
      email: 'granted.employee@aapico.com',
      role: 'ACC',
      rcvName: '—',
      emp: null,
      co: ['AH'], // Admin assigned AH
      unit: 'AP Team',
    }

    const scopeCheck = (d: InvoiceDoc) => scopeCheckFor(d, grantedUser, ROLES.ACC, [])
    const visibleDocs = visibleDocsFor(sampleDocs, scopeCheck)
    
    expect(visibleDocs).toHaveLength(1)
    expect(visibleDocs[0].company).toBe('AH')
  })
})
