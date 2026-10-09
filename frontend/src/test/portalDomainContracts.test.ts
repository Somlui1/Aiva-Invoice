import { describe, it, expect } from 'vitest'
import { PORTAL_PAGE_TYPES, type PortalPageType } from '../features/engine/types/portalDomain'
import { companyOfOrg, companyOfTax, COMPANIES } from '../mock/companies'

/**
 * Approved contract amendment (2026-10-09):
 *  1. PortalPageMeta.pageType must cover the page types the Engine really emits.
 *  2. CompanyCode must cover company master incl. AHA (org 413) and the real orgs.
 * Both unions are runtime-readable constants so they can be asserted, not just typed.
 */
describe('Portal Contract Amendment — Page Types & Company Master', () => {
  it('page type union covers every value emitted by the 125-doc corpus', () => {
    // Values observed across all 125 sample payloads (pages[].page_type).
    const engineEmitted: string[] = ['TAX_INVOICE', 'INVOICE', 'DELIVERY_NOTE', 'PO', 'OSP', 'SUPPORTING']
    const covered = PORTAL_PAGE_TYPES as readonly string[]
    const missing = engineEmitted.filter(v => !covered.includes(v))
    expect(missing).toEqual([])
    // Original design-doc members are kept, not replaced.
    expect(covered).toContain('DELIVERY_ORDER')
    expect(covered).toContain('RECEIPT')
    expect(covered).toContain('UNKNOWN')
    expect(new Set(PORTAL_PAGE_TYPES).size).toBe(PORTAL_PAGE_TYPES.length)
  })

  it('page type union is assignable to PortalPageType at compile time', () => {
    const all: PortalPageType[] = [...PORTAL_PAGE_TYPES]
    expect(all.length).toBe(PORTAL_PAGE_TYPES.length)
  })

  it('resolves the real corpus org IDs to companies', () => {
    expect(companyOfOrg(101)).toBe('AH')   // tax 0107545000179
    expect(companyOfOrg(176)).toBe('AHP')  // tax 0145548001549
    expect(companyOfOrg(195)).toBe('AHT')  // tax 0145548001557
    expect(companyOfOrg(413)).toBe('AHA')  // tax 0145563000434
  })

  it('resolves the new AHA company by tax id', () => {
    expect(companyOfTax('0145563000434')).toBe('AHA')
    expect(COMPANIES.AHA.tax).toBe('0145563000434')
    expect(COMPANIES.AHA.orgs).toContain(413)
  })

  it('org id -> tax id -> company agree for every corpus org', () => {
    const pairs: Array<[number, string]> = [
      [101, '0107545000179'],
      [176, '0145548001549'],
      [195, '0145548001557'],
      [413, '0145563000434'],
    ]
    for (const [org, tax] of pairs) {
      expect(companyOfOrg(org), `org ${org}`).toBe(companyOfTax(tax))
    }
  })

  it('still returns ? for genuinely unknown org ids and tax ids', () => {
    expect(companyOfOrg(999999)).toBe('?')
    expect(companyOfTax('0000000000000')).toBe('?')
  })

  it('has no org id assigned to two companies', () => {
    const seen = new Map<number, string>()
    const dupes: string[] = []
    for (const code of Object.keys(COMPANIES)) {
      for (const org of COMPANIES[code].orgs) {
        if (seen.has(org)) dupes.push(`${org} -> ${seen.get(org)} & ${code}`)
        else seen.set(org, code)
      }
    }
    expect(dupes).toEqual([])
  })
})
