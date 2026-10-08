import { describe, it, expect } from 'vitest'
import { USERS, ROLES, acctsOf, bound } from '../mock/users'
import { INITIAL_DOCS } from '../mock/initialDocs'
import { validatePayload } from '../context/SimContext'

describe('Business Logic & Access Control Tests', () => {
  it('correctly checks scope for different roles (SEC-10)', () => {
    const euUser = USERS.find(u => u.id === 'u1')! // somsak, receiver SOMSAK JAIDEE in AH
    const accUser = USERS.find(u => u.id === 'u4')! // panida in AH, AHT
    const admUser = USERS.find(u => u.id === 'u7')! // IT Admin (scope: none)

    // Document for Somsak Jaidee in AH
    const doc1 = INITIAL_DOCS.find(d => d.receiver === 'SOMSAK JAIDEE' && d.company === 'AH')!
    expect(doc1).toBeDefined()

    // EU can see their own doc in their company
    const euAccounts = acctsOf(euUser)
    expect(euAccounts).toContain('SOMSAK JAIDEE')
    expect(euUser.co).toContain(doc1.company)

    // Document for Wilaiwan in AHT
    const doc2 = INITIAL_DOCS.find(d => d.receiver === 'WILAIWAN SRISUK')!
    expect(doc2).toBeDefined()
    // Somsak cannot see Wilaiwan's doc
    expect(euAccounts).not.toContain(doc2.receiver)

    // ACC can see docs in AH and AHT
    expect(accUser.co).toContain(doc1.company)
    expect(accUser.co).toContain(doc2.company)

    // ADM has scope 'none' (cannot access document contents)
    expect(ROLES[admUser.role].scope).toBe('none')
  })

  it('correctly maps Oracle receiver accounts to users (bound check)', () => {
    // Somsak Jaidee is bound to an active EU user
    expect(bound('SOMSAK JAIDEE')).toBe(true)
    // Non-existent receiver account is not bound
    expect(bound('UNBOUND_UNKNOWN_USER')).toBe(false)
    // Empty receiver is treated as bound or unassigned
    expect(bound(undefined as any)).toBe(true)
  })

  it('validates aiva.portal.ingest/1.0 payloads correctly', () => {
    const validPayload = {
      contract: 'aiva.portal.ingest/1.0',
      message_id: 'msg-test-001',
      identity: {
        status: 'RESOLVED',
        receive_id: 'RCV-12345'
      },
      decision: {
        recommendation: 'AUTO_PASS'
      }
    }

    const res1 = validatePayload(validPayload)
    expect(res1.errors.length).toBe(0)

    const invalidPayload = {
      contract: 'invalid_contract',
      identity: {
        status: 'UNKNOWN'
      }
    }

    const res2 = validatePayload(invalidPayload)
    expect(res2.errors.length).toBeGreaterThan(0)
    expect(res2.errors.some(e => e.includes('contract'))).toBe(true)
    expect(res2.errors.some(e => e.includes('message_id'))).toBe(true)
  })
})
