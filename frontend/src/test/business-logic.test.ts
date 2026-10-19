import { describe, it, expect } from 'vitest'
import { ROLES, acctsOf, bound } from '../mock/users'
import { User } from '../types/auth'
import { INITIAL_DOCS } from '../mock/initialDocs'
import { validatePayload } from '../context/SimContext'

describe('Business Logic & Access Control Tests', () => {
  it('correctly checks scope for different roles (SEC-10)', () => {
    const euUser: User = { id: 'u1', n: 'EU Test User', email: 'eu@aapico.com', role: 'EU', rcvName: '—', emp: 10231, co: ['AH'], unit: 'คลังวัตถุดิบ' }
    const accUser: User = { id: 'u4', n: 'ACC Test User', email: 'acc@aapico.com', role: 'ACC', rcvName: '—', emp: 11020, co: ['AH', 'AHT'], unit: 'ฝ่ายบัญชี AH/AHT' }
    const admUser: User = { id: 'u7', n: 'ADM Test User', email: 'adm@aapico.com', role: 'ADM', rcvName: '—', emp: null, co: [], unit: 'IT' }

    // Document for receiver in AH
    const doc1 = INITIAL_DOCS.find(d => Boolean(d.receiver) && d.company === 'AH')!
    expect(doc1).toBeDefined()

    // EU can see their own doc in their company when mapped
    const sampleMaps = [
      { id: 'm1', user: 'u1', acct: doc1.receiver!, by: 'admin', at: '2026-10-01', req: 'ticket-101' }
    ]
    const euAccounts = acctsOf(euUser, sampleMaps)
    expect(euAccounts).toContain(doc1.receiver!)
    expect(euUser.co).toContain(doc1.company)

    // Document for another receiver
    const doc2 = INITIAL_DOCS.find(d => Boolean(d.receiver) && d.receiver !== doc1.receiver)!
    expect(doc2).toBeDefined()
    // Somsak cannot see another receiver's doc
    expect(euAccounts).not.toContain(doc2.receiver)

    // ACC can see docs in AH and AHT
    expect(accUser.co).toContain(doc1.company)
    expect(accUser.co).toContain(doc2.company)

    // ADM has scope 'none' (cannot access document contents)
    expect(ROLES[admUser.role].scope).toBe('none')
  })

  it('correctly maps Oracle receiver accounts to users (bound check)', () => {
    const testEuUser: User = { id: 'u1', n: 'EU Test User', email: 'eu@aapico.com', role: 'EU', rcvName: '—', emp: 10231, co: ['AH'], unit: 'คลังสินค้า' }
    const sampleMaps = [
      { id: 'm1', user: 'u1', acct: 'SOMSAK JAIDEE', by: 'admin', at: '2026-10-01', req: 'ticket-101' }
    ]
    // Mapped account is bound
    expect(bound('SOMSAK JAIDEE', sampleMaps, [testEuUser])).toBe(true)
    // Non-existent receiver account is not bound
    expect(bound('UNBOUND_UNKNOWN_USER', sampleMaps, [testEuUser])).toBe(false)
    // Empty receiver is treated as bound or unassigned
    expect(bound(undefined as any, sampleMaps, [testEuUser])).toBe(true)
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
