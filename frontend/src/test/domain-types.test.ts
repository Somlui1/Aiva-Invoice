import { describe, it, expect } from 'vitest'
import { COMPANIES, companyOfOrg, companyOfTax } from '../mock/companies'
import { USERS, ROLES, INITIAL_MAPS } from '../mock/users'
import { EXCEPTION_RULES, SEVERITIES } from '../mock/rules'
import { INITIAL_DOCS } from '../mock/initialDocs'

describe('Domain Models & Master Data Integrity', () => {
  it('contains expected AAPICO companies with tax IDs and ORG_IDs', () => {
    expect(COMPANIES.AH.name).toContain('อาปิโก ไฮเทค (มหาชน)')
    expect(COMPANIES.AH.tax).toBe('0107545000179')
    // AH master data extended (approved 2026-10-09) with real engine org 101.
    expect(COMPANIES.AH.orgs).toEqual([101, 103, 222])

    expect(companyOfOrg(103)).toBe('AH')
    expect(companyOfOrg(352)).toBe('AHT')
    expect(companyOfTax('0107545000179')).toBe('AH')
    expect(companyOfTax('unknown')).toBe('?')
  })

  it('contains valid mock users with assigned roles and initial mappings', () => {
    expect(USERS).toHaveLength(8)
    const u1 = USERS.find(u => u.id === 'u1')
    expect(u1?.n).toBe('สมศักดิ์ ใจดี')
    expect(u1?.role).toBe('EU')
    expect(u1?.rcvName).toBe('SOMSAK JAIDEE')

    const apr = USERS.find(u => u.role === 'APR')
    expect(apr?.n).toBe('สมชาย วงศ์ทอง')

    expect(ROLES.EU.p).toContain('VIEW_OWN')
    expect(ROLES.APR.p).toContain('POST')
    expect(INITIAL_MAPS.length).toBeGreaterThanOrEqual(6)
  })

  it('contains Standard v6.10 exception codes E01-E15 with correct severities', () => {
    expect(EXCEPTION_RULES.E01).toBeDefined()
    expect(EXCEPTION_RULES.E15).toBeDefined()
    expect(SEVERITIES.E02).toBe('High')
    expect(SEVERITIES.E04).toBe('Low')
    expect(SEVERITIES.E01).toBe('Medium')
  })

  it('contains complete initial document dataset with diverse statuses', () => {
    expect(INITIAL_DOCS.length).toBeGreaterThan(10)
    const statuses = new Set(INITIAL_DOCS.map(d => d.status))
    expect(statuses.has('Auto-pass')).toBe(true)
    expect(statuses.has('Review')).toBe(true)
    expect(statuses.has('Hold')).toBe(true)
    expect(statuses.has('Manual Review')).toBe(true)
  })
})
