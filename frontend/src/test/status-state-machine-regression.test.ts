import { describe, it, expect } from 'vitest'
import { ROLES, USERS } from '../mock/users'
import { allowedActionFor, ActionContext } from '../lib/queueFilters'
import { InvoiceDoc } from '../types/invoice'
import { User } from '../types/auth'

const makeCtx = (u: User): ActionContext => ({
  role: u.role,
  can: (p: string) => ROLES[u.role].p.includes(p as any)
})

describe('Document Status State Machine Invariance (SRS v1.1)', () => {
  it('guarantees role permissions match SRS v1.1 specifications', () => {
    // EU (Receiver)
    expect(ROLES.EU.p).toEqual(['VIEW_OWN', 'DMS', 'UPLOAD_NEW'])
    expect(ROLES.EU.scope).toBe('receiver')

    // ACC (Accountant)
    expect(ROLES.ACC.p).toContain('CONFIRM')
    expect(ROLES.ACC.p).toContain('REVIEW')
    expect(ROLES.ACC.p).toContain('HOLD')
    expect(ROLES.ACC.p).toContain('REJECT')
    expect(ROLES.ACC.p).not.toContain('UNCONFIRM')
    expect(ROLES.ACC.p).not.toContain('MANUAL_REVIEW')
    expect(ROLES.ACC.p).not.toContain('DUP_OVERRIDE')
    expect(ROLES.ACC.scope).toBe('company')

    // APR (Approver / Supervisor)
    expect(ROLES.APR.p).toContain('CONFIRM')
    expect(ROLES.APR.p).toContain('REVIEW')
    expect(ROLES.APR.p).toContain('HOLD')
    expect(ROLES.APR.p).toContain('REJECT')
    expect(ROLES.APR.p).toContain('UNCONFIRM')
    expect(ROLES.APR.p).toContain('MANUAL_REVIEW')
    expect(ROLES.APR.p).toContain('DUP_OVERRIDE')
    expect(ROLES.APR.p).toContain('POST')
    expect(ROLES.APR.scope).toBe('company')
    expect(ROLES.APR.postMax).toBe(1000000)

    // ADM (IT Admin)
    expect(ROLES.ADM.p).toEqual(['MAP', 'AUDIT'])
    expect(ROLES.ADM.scope).toBe('none')

    // SA (Super Admin)
    expect(ROLES.SA.p).toContain('CONFIRM')
    expect(ROLES.SA.p).toContain('UNCONFIRM')
    expect(ROLES.SA.p).toContain('MAP')
    expect(ROLES.SA.scope).toBe('all')
  })

  it('validates state transitions via allowedActionFor for Auto-pass doc', () => {
    const accUser = USERS.find(u => u.role === 'ACC')!
    const euUser = USERS.find(u => u.role === 'EU')!
    const aprUser = USERS.find(u => u.role === 'APR')!

    const autoPassDoc: InvoiceDoc = {
      doc: 'DMS-001',
      company: 'AH',
      vendor: 'Vendor A',
      stax: '1234567890123',
      inv: 'INV-001',
      dt: '2026-10-01',
      up: '2026-10-01',
      pages: 1,
      total: 1000,
      sub: 1000,
      vat: 0,
      po: 'PO-001',
      rcv: 'RCV-001',
      org: 101,
      oname: 'AH',
      sig: [1, 1],
      rtotal: 1000,
      status: 'Auto-pass',
      receiverActive: true,
      assigned: 'acc',
      codes: [],
      rules: [],
      history: [],
      lines: []
    }

    // EU cannot act on document status (upload only)
    expect(allowedActionFor(autoPassDoc, 'confirm', makeCtx(euUser)).ok).toBe(false)
    expect(allowedActionFor(autoPassDoc, 'review', makeCtx(euUser)).ok).toBe(false)
    expect(allowedActionFor(autoPassDoc, 'hold', makeCtx(euUser)).ok).toBe(false)
    expect(allowedActionFor(autoPassDoc, 'reject', makeCtx(euUser)).ok).toBe(false)

    // ACC can confirm, review, hold, reject Auto-pass
    expect(allowedActionFor(autoPassDoc, 'confirm', makeCtx(accUser)).ok).toBe(true)
    expect(allowedActionFor(autoPassDoc, 'review', makeCtx(accUser)).ok).toBe(true)
    expect(allowedActionFor(autoPassDoc, 'hold', makeCtx(accUser)).ok).toBe(true)
    expect(allowedActionFor(autoPassDoc, 'reject', makeCtx(accUser)).ok).toBe(true)
    expect(allowedActionFor(autoPassDoc, 'unconfirm', makeCtx(accUser)).ok).toBe(false)

    // APR can confirm, review, hold, reject Auto-pass
    expect(allowedActionFor(autoPassDoc, 'confirm', makeCtx(aprUser)).ok).toBe(true)
    expect(allowedActionFor(autoPassDoc, 'review', makeCtx(aprUser)).ok).toBe(true)
    expect(allowedActionFor(autoPassDoc, 'hold', makeCtx(aprUser)).ok).toBe(true)
    expect(allowedActionFor(autoPassDoc, 'reject', makeCtx(aprUser)).ok).toBe(true)
  })

  it('validates state transitions via allowedActionFor for Confirmed doc', () => {
    const accUser = USERS.find(u => u.role === 'ACC')!
    const aprUser = USERS.find(u => u.role === 'APR')!

    const confirmedDoc: InvoiceDoc = {
      doc: 'DMS-002',
      company: 'AH',
      vendor: 'Vendor A',
      stax: '1234567890123',
      inv: 'INV-002',
      dt: '2026-10-01',
      up: '2026-10-01',
      pages: 1,
      total: 1000,
      sub: 1000,
      vat: 0,
      po: 'PO-001',
      rcv: 'RCV-001',
      org: 101,
      oname: 'AH',
      sig: [1, 1],
      rtotal: 1000,
      status: 'Confirmed',
      receiverActive: true,
      assigned: 'acc',
      codes: [],
      rules: [],
      history: [],
      lines: []
    }

    // ACC cannot unconfirm
    expect(allowedActionFor(confirmedDoc, 'unconfirm', makeCtx(accUser)).ok).toBe(false)
    // APR CAN unconfirm
    expect(allowedActionFor(confirmedDoc, 'unconfirm', makeCtx(aprUser)).ok).toBe(true)
  })
})
