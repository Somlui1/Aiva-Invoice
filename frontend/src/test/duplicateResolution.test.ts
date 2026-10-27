/**
 * Pure rules of the business key + duplicate resolution (no database).
 * The integration tests (businessKeyIngest.test.ts) prove the same rules end to end through
 * POST /api/engine/ingest; these pin each rule and edge on its own so a failure names the rule.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  IdentityValidationError,
  buildSecondaryKey,
  normalizeInvoiceNum,
  normalizeTaxId,
  resolveIdentity,
  type DocumentIdentity,
} from '../server/businessKey'
import { allowedActionFor } from '../lib/queueFilters'
import type { InvoiceDoc } from '../types/invoice'
import {
  decide,
  isProtected,
  matchKind,
  selectCurrent,
  type DrCandidate,
} from '../server/duplicateResolution'

// ---------------------------------------------------------------------------- fixtures

const TAX = '0105540008888'
const INV = 'INV-001'

const resolved = (receiveId = 'RCV-1001'): DocumentIdentity => ({
  status: 'RESOLVED',
  reason: 'FOUND',
  receiveId,
  secondaryKey: buildSecondaryKey(TAX, INV),
  missingKeys: [],
  lookupPath: 'TAX-INV',
  source: 'derived',
})
const notFound = (): DocumentIdentity => ({
  status: 'NOT_FOUND',
  reason: 'RECEIPT_NOT_FOUND',
  receiveId: null,
  secondaryKey: buildSecondaryKey(TAX, INV),
  missingKeys: [],
  lookupPath: null,
  source: 'derived',
})
const unresolved = (): DocumentIdentity => ({
  status: 'UNRESOLVED',
  reason: 'KEYS_UNREADABLE',
  receiveId: null,
  secondaryKey: null,
  missingKeys: ['invoice_num'],
  lookupPath: null,
  source: 'derived',
})

let n = 0
const cand = (over: Partial<DrCandidate> = {}): DrCandidate => ({
  id: `DMS-${++n}`,
  status: 'Review',
  identityStatus: 'RESOLVED',
  receiveId: 'RCV-1001',
  secondaryKey: buildSecondaryKey(TAX, INV),
  isLocked: false,
  createdAt: new Date(2026, 9, 1, 8, 0, n),
  ...over,
})

// ---------------------------------------------------------------------------- identity

describe('resolveIdentity — validation (explicit identity block)', () => {
  const base = { supplierTaxId: TAX, invoiceNum: INV }

  it('RESOLVED requires a receive_id', () => {
    expect(() => resolveIdentity({ ...base, identity: { status: 'RESOLVED', receive_id: null } })).toThrow(
      IdentityValidationError,
    )
    expect(() => resolveIdentity({ ...base, identity: { status: 'RESOLVED' } })).toThrow(/receive_id/)
  })

  it('RESOLVED receive_id must match ^[A-Z0-9-]{4,30}$', () => {
    expect(() => resolveIdentity({ ...base, identity: { status: 'RESOLVED', receive_id: 'ab' } })).toThrow(/A-Z0-9/)
    expect(() => resolveIdentity({ ...base, identity: { status: 'RESOLVED', receive_id: 'has space 1' } })).toThrow(
      IdentityValidationError,
    )
    const ok = resolveIdentity({ ...base, identity: { status: 'RESOLVED', receive_id: ' rcv-1001 ' } })
    expect(ok.receiveId).toBe('RCV-1001') // trimmed + upper-cased
  })

  it('NOT_FOUND requires receive_id = null', () => {
    expect(() => resolveIdentity({ ...base, identity: { status: 'NOT_FOUND', receive_id: 'RCV-1001' } })).toThrow(
      /NOT_FOUND requires receive_id = null/,
    )
    expect(() => resolveIdentity({ ...base, identity: { status: 'NOT_FOUND', receive_id: '' } })).toThrow(
      IdentityValidationError,
    )
    const ok = resolveIdentity({ ...base, identity: { status: 'NOT_FOUND', receive_id: null } })
    expect(ok.receiveId).toBeNull()
    expect(ok.secondaryKey).toBe(`${TAX}|${INV}`)
  })

  it('UNRESOLVED requires receive_id = null and missing_keys', () => {
    expect(() => resolveIdentity({ ...base, identity: { status: 'UNRESOLVED', receive_id: null, missing_keys: [] } })).toThrow(
      /missing_keys/,
    )
    expect(() => resolveIdentity({ ...base, identity: { status: 'UNRESOLVED', missing_keys: ['invoice_num'] } })).not.toThrow()
    expect(() =>
      resolveIdentity({ ...base, identity: { status: 'UNRESOLVED', receive_id: 'RCV-1001', missing_keys: ['invoice_num'] } }),
    ).toThrow(/receive_id = null/)
  })

  it('reports every violation at once and rejects a reason that contradicts the status', () => {
    try {
      resolveIdentity({ ...base, identity: { status: 'UNRESOLVED', receive_id: 'X', reason: 'FOUND', missing_keys: [] } })
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(IdentityValidationError)
      expect((e as IdentityValidationError).issues.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('UNRESOLVED never carries a secondary key, even when OCR read both halves', () => {
    const id = resolveIdentity({ ...base, identity: { status: 'UNRESOLVED', missing_keys: ['po_number'] } })
    expect(id.secondaryKey).toBeNull()
    expect(id.missingKeys).toEqual(['po_number'])
  })
})

describe('resolveIdentity — derived from the Oracle snapshot (engine without an identity block)', () => {
  it('receipt found → RESOLVED, receive_id = first receipt', () => {
    const id = resolveIdentity({ receiptNums: ['50220043288', '50220043289'], supplierTaxId: TAX, invoiceNum: INV })
    expect(id).toMatchObject({ status: 'RESOLVED', reason: 'FOUND', receiveId: '50220043288', source: 'derived' })
  })

  it('keys readable, no receipt → NOT_FOUND with the secondary key', () => {
    const id = resolveIdentity({ receiptNums: [], oracleQueried: true, supplierTaxId: TAX, invoiceNum: INV })
    expect(id).toMatchObject({ status: 'NOT_FOUND', reason: 'RECEIPT_NOT_FOUND', receiveId: null })
    expect(id.secondaryKey).toBe(`${TAX}|${INV}`)
  })

  it('Oracle never queried → NOT_FOUND / HALTED_BEFORE_LOOKUP', () => {
    const id = resolveIdentity({ receiptNums: [], oracleQueried: false, supplierTaxId: TAX, invoiceNum: INV })
    expect(id.reason).toBe('HALTED_BEFORE_LOOKUP')
  })

  it('a key that OCR could not read → UNRESOLVED with missing_keys', () => {
    expect(resolveIdentity({ receiptNums: [], supplierTaxId: TAX, invoiceNum: '' })).toMatchObject({
      status: 'UNRESOLVED',
      reason: 'KEYS_UNREADABLE',
      missingKeys: ['invoice_num'],
      secondaryKey: null,
    })
    expect(resolveIdentity({ receiptNums: [], supplierTaxId: null, invoiceNum: null }).missingKeys).toEqual([
      'supplier_tax_id',
      'invoice_num',
    ])
  })

  it('a receipt wins even when the invoice number was unreadable (found through another path)', () => {
    const id = resolveIdentity({ receiptNums: ['RCV-1001'], supplierTaxId: TAX, invoiceNum: '' })
    expect(id.status).toBe('RESOLVED')
    expect(id.secondaryKey).toBeNull() // half a key is not a key
  })
})

describe('secondary key normalisation', () => {
  it('ignores case, spacing and hyphens in the tax id; case and spacing in the invoice number', () => {
    expect(normalizeTaxId('0105-5400 08888')).toBe('0105540008888')
    expect(normalizeInvoiceNum('  inv   001 ')).toBe('INV 001')
    expect(buildSecondaryKey('0105540008888', 'inv-001')).toBe(buildSecondaryKey(' 0105 5400 08888', 'INV-001 '))
  })
  it('needs both halves', () => {
    expect(buildSecondaryKey(TAX, '')).toBeNull()
    expect(buildSecondaryKey(null, INV)).toBeNull()
  })
})

// ---------------------------------------------------------------------------- matching

describe('matchKind — which earlier rows are "the same invoice"', () => {
  it('RESOLVED matches on receive_id', () => {
    expect(matchKind(resolved(), cand())).toBe('RECEIVE_ID')
    expect(matchKind(resolved('RCV-9999'), cand())).toBeNull()
  })

  it('RESOLVED finds an earlier NOT_FOUND row through the secondary key', () => {
    const earlier = cand({ identityStatus: 'NOT_FOUND', receiveId: null })
    expect(matchKind(resolved(), earlier)).toBe('SECONDARY_KEY')
  })

  it('two RESOLVED rows with different receive_ids are different receipts, even with equal invoice numbers', () => {
    expect(matchKind(resolved('RCV-2000'), cand({ receiveId: 'RCV-1001' }))).toBeNull()
  })

  it('NOT_FOUND matches on the secondary key — including an earlier RESOLVED row', () => {
    expect(matchKind(notFound(), cand({ identityStatus: 'NOT_FOUND', receiveId: null }))).toBe('SECONDARY_KEY')
    expect(matchKind(notFound(), cand())).toBe('SECONDARY_KEY')
    expect(matchKind(notFound(), cand({ secondaryKey: buildSecondaryKey(TAX, 'OTHER') }))).toBeNull()
  })

  it('NOT_FOUND with half a key never matches anything', () => {
    const keyless = { ...notFound(), secondaryKey: null }
    expect(matchKind(keyless, cand())).toBeNull()
  })

  it('UNRESOLVED never matches, and is never matched', () => {
    expect(matchKind(unresolved(), cand())).toBeNull()
    expect(matchKind(resolved(), cand({ identityStatus: 'UNRESOLVED', receiveId: null, secondaryKey: null }))).toBeNull()
    expect(matchKind(notFound(), cand({ identityStatus: 'UNRESOLVED', secondaryKey: buildSecondaryKey(TAX, INV) }))).toBeNull()
  })

  it('rows written before business keys existed (identityStatus null) are not matched', () => {
    expect(matchKind(resolved(), cand({ identityStatus: null }))).toBeNull()
  })
})

// ---------------------------------------------------------------------------- selecting the current document

describe('selectCurrent — the authoritative document, not the newest insert', () => {
  it('ignores Duplicate / Superseded / Rejected', () => {
    const rows = [cand({ status: 'Duplicate' }), cand({ status: 'Superseded' }), cand({ status: 'Rejected' })]
    expect(selectCurrent(rows)).toBeNull()
    const keep = cand({ status: 'Hold', createdAt: new Date(2026, 9, 1) })
    const newerDup = cand({ status: 'Duplicate', createdAt: new Date(2026, 9, 5) })
    expect(selectCurrent([newerDup, keep])?.id).toBe(keep.id)
  })

  it('an AP-protected row outranks everything, however old', () => {
    const confirmed = cand({ status: 'Confirmed', createdAt: new Date(2026, 9, 1) })
    const newerAutoPass = cand({ status: 'Auto-pass', createdAt: new Date(2026, 9, 9) })
    expect(selectCurrent([newerAutoPass, confirmed])?.id).toBe(confirmed.id)
  })

  it('otherwise the best Engine rank wins and the newest row only breaks a tie', () => {
    const hold = cand({ status: 'Hold', createdAt: new Date(2026, 9, 9) })
    const review = cand({ status: 'Review', createdAt: new Date(2026, 9, 1) })
    expect(selectCurrent([hold, review])?.id).toBe(review.id)
    const review2 = cand({ status: 'Review', createdAt: new Date(2026, 9, 3) })
    expect(selectCurrent([review, review2])?.id).toBe(review2.id)
  })

  it('treats a locked row, and a status this code does not know, as protected', () => {
    expect(isProtected({ status: 'Review', isLocked: true })).toBe(true)
    expect(isProtected({ status: 'Some Future Status', isLocked: false })).toBe(true)
    for (const s of ['Confirmed', 'Sent', 'Posted', 'Import Failed']) expect(isProtected({ status: s })).toBe(true)
    for (const s of ['Auto-pass', 'Review', 'Hold', 'Manual Review']) expect(isProtected({ status: s })).toBe(false)
  })
})

// ---------------------------------------------------------------------------- decide

describe('decide — DR rules', () => {
  const run = (engineStatus: string, current: Partial<DrCandidate>, identity = resolved()) =>
    decide({ identity, engineStatus, candidates: [cand(current)] })

  describe('Engine ranking Auto-pass > Review > Hold > Manual Review', () => {
    const ladder = ['Auto-pass', 'Review', 'Hold', 'Manual Review']
    for (const [i, oldStatus] of ladder.entries()) {
      for (const [j, newStatus] of ladder.entries()) {
        const expected = j < i ? 'DR-01' : j === i ? 'DR-02' : 'DR-03'
        it(`new ${newStatus} vs current ${oldStatus} → ${expected}`, () => {
          const d = run(newStatus, { status: oldStatus })
          expect(d.rule).toBe(expected)
          if (expected === 'DR-03') {
            expect(d.newStatus).toBe('Duplicate')
            expect(d.supersede).toBeNull()
            expect(d.duplicateOf?.status).toBe(oldStatus)
          } else {
            expect(d.newStatus).toBe(newStatus)
            expect(d.supersede?.status).toBe(oldStatus)
            expect(d.duplicateOf).toBeNull()
          }
        })
      }
    }
  })

  it('DR-04: Confirmed / Sent / Posted / Import Failed are never superseded — even by a better result', () => {
    for (const status of ['Confirmed', 'Sent', 'Posted', 'Import Failed']) {
      const d = run('Auto-pass', { status })
      expect(d).toMatchObject({ rule: 'DR-04', newStatus: 'Duplicate', supersede: null })
      expect(d.duplicateOf?.status).toBe(status)
    }
  })

  it('DR-04 also protects a locked document (AP batch being built)', () => {
    expect(run('Auto-pass', { status: 'Review', isLocked: true }).rule).toBe('DR-04')
  })

  it('DR-05: only history rows match → a normal new document with the Engine status', () => {
    const d = decide({
      identity: resolved(),
      engineStatus: 'Hold',
      candidates: [cand({ status: 'Duplicate' }), cand({ status: 'Superseded' }), cand({ status: 'Rejected' })],
    })
    expect(d).toMatchObject({ rule: 'DR-05', newStatus: 'Hold', supersede: null, duplicateOf: null })
  })

  it('DR-07: nothing matches → new document, Engine status', () => {
    expect(decide({ identity: resolved(), engineStatus: 'Review', candidates: [] })).toMatchObject({
      rule: 'DR-07',
      newStatus: 'Review',
    })
    expect(decide({ identity: resolved('RCV-5555'), engineStatus: 'Review', candidates: [cand()] }).rule).toBe('DR-07')
  })

  it('compares against the current document, not the newest row', () => {
    const current = cand({ status: 'Review', createdAt: new Date(2026, 9, 1) })
    const newerDuplicate = cand({ status: 'Duplicate', createdAt: new Date(2026, 9, 8) })
    const d = decide({ identity: resolved(), engineStatus: 'Auto-pass', candidates: [newerDuplicate, current] })
    expect(d.rule).toBe('DR-01')
    expect(d.supersede?.id).toBe(current.id)
  })

  it('Duplicate / Superseded / Rejected next to a Confirmed row: the Confirmed row is current (DR-04)', () => {
    const confirmed = cand({ status: 'Confirmed' })
    const d = decide({
      identity: resolved(),
      engineStatus: 'Auto-pass',
      candidates: [cand({ status: 'Superseded' }), confirmed, cand({ status: 'Rejected' })],
    })
    expect(d.rule).toBe('DR-04')
    expect(d.duplicateOf?.id).toBe(confirmed.id)
  })

  it('NOT_FOUND → RESOLVED: the earlier NOT_FOUND row is found by the secondary key and superseded', () => {
    const earlier = cand({ status: 'Hold', identityStatus: 'NOT_FOUND', receiveId: null })
    const d = decide({ identity: resolved(), engineStatus: 'Review', candidates: [earlier] })
    expect(d).toMatchObject({ rule: 'DR-01', matchedBy: 'SECONDARY_KEY', newStatus: 'Review' })
    expect(d.supersede?.id).toBe(earlier.id)
  })

  it('NOT_FOUND → RESOLVED against a Confirmed NOT_FOUND row is a Duplicate', () => {
    const earlier = cand({ status: 'Confirmed', identityStatus: 'NOT_FOUND', receiveId: null })
    expect(decide({ identity: resolved(), engineStatus: 'Auto-pass', candidates: [earlier] }).rule).toBe('DR-04')
  })

  it('UNRESOLVED: always a new Manual Review document, never matched, whatever the Engine said', () => {
    const d = decide({
      identity: unresolved(),
      engineStatus: 'Auto-pass',
      candidates: [cand({ status: 'Review' }), cand({ status: 'Confirmed' })],
    })
    expect(d).toMatchObject({
      rule: 'DR-07',
      newStatus: 'Manual Review',
      current: null,
      supersede: null,
      duplicateOf: null,
      matchedBy: null,
    })
  })

  it('an unrecognised Engine status is ranked as Manual Review, never as better than something', () => {
    const d = decide({ identity: resolved(), engineStatus: 'Mystery', candidates: [cand({ status: 'Hold' })] })
    expect(d.rule).toBe('DR-03')
    expect(d.newStatus).toBe('Duplicate')
  })
})

describe('resolveIdentity — defence in depth', () => {
  it('rejects an identity.status outside the enum even if the schema layer let it through', () => {
    expect(() =>
      resolveIdentity({ supplierTaxId: TAX, invoiceNum: INV, identity: { status: 'MAYBE' as never, receive_id: null } }),
    ).toThrow(/identity\.status/)
  })
})

describe('schema guard — history must stay storable', () => {
  // Superseded / Duplicate rows of one receipt coexist, so no business key may be UNIQUE.
  const schema = fs.readFileSync(path.resolve(process.cwd(), 'prisma/schema.prisma'), 'utf-8')
  const documentModel = /model Document \{[\s\S]*?\n\}/.exec(schema)![0]

  it.each(['receiptNum', 'receiveId', 'secondaryKey', 'identityStatus'])('%s is not unique', field => {
    const line = documentModel.split('\n').find(l => new RegExp(`^\\s*${field}\\s`).test(l))
    expect(line, `${field} column`).toBeDefined()
    expect(line).not.toMatch(/@unique|@id/)
    expect(documentModel).not.toMatch(new RegExp(`@@unique\\([^)]*${field}`))
  })

  it('the DMS document id stays the technical unique id', () => {
    expect(documentModel).toMatch(/\n\s*id\s+String\s+@id/)
    expect(documentModel).toMatch(/\n\s*dmsDocId\s+String\s+@unique/)
  })
})

describe('queue actions for an UNRESOLVED document (UI mirror of the server guard)', () => {
  const doc = (over: Record<string, unknown> = {}) =>
    ({
      doc: 'DMS-9',
      status: 'Manual Review',
      identityStatus: 'UNRESOLVED',
      unres: true,
      receiver: undefined,
      rcv: '—',
      codes: [],
      rules: [],
      ...over,
    }) as unknown as InvoiceDoc
  const can = () => true

  it('APR: Reject allowed; Confirm and the rest disabled', () => {
    expect(allowedActionFor(doc(), 'reject', { role: 'APR', can }).ok).toBe(true)
    for (const act of ['confirm', 'review', 'hold', 'unconfirm', 'returnf'] as const) {
      expect(allowedActionFor(doc(), act, { role: 'APR', can }).ok, act).toBe(false)
    }
  })

  it('ACC cannot act on it at all', () => {
    for (const act of ['reject', 'confirm'] as const) {
      expect(allowedActionFor(doc(), act, { role: 'ACC', can }).ok, act).toBe(false)
    }
  })

  it('a document without an identity (pre-v5.6 row) behaves exactly as before', () => {
    const legacy = doc({ identityStatus: undefined, rcv: 'RCV-1', receiver: 'X' })
    expect(allowedActionFor(legacy, 'confirm', { role: 'APR', can }).ok).toBe(true)
  })
})
