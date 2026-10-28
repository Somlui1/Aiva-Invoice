/**
 * v5.11.1 pure rules: who sees a document (production scope), and the PDF page-frame guard.
 */
import { describe, expect, it } from 'vitest'
import { explainScope, normalizeReceiverName, receiverMatches } from '../lib/docScope'
import { checkPageFrame } from '../features/pdf-viewer/lib/pageFrame'

const doc = (company: string, receiver?: string) => ({ company, receiver })

describe('explainScope — a missing assignment is NO access', () => {
  it('ACC / APR without a company see nothing (before: every company)', () => {
    for (const role of ['ACC', 'APR']) {
      expect(explainScope(doc('AH'), { role, companies: [], accounts: [] }).ok, role).toBe(false)
    }
  })

  it('ACC / APR see only their companies', () => {
    expect(explainScope(doc('AHA'), { role: 'ACC', companies: ['AHA'], accounts: [] }).ok).toBe(true)
    expect(explainScope(doc('AH'), { role: 'APR', companies: ['AHA'], accounts: [] }).ok).toBe(false)
  })

  it('EU without an Oracle account sees nothing (before: the company, or everything)', () => {
    expect(explainScope(doc('AH', 'R1'), { role: 'EU', companies: [], accounts: [] }).ok).toBe(false)
    expect(explainScope(doc('AH', 'R1'), { role: 'EU', companies: ['AH'], accounts: [] }).ok).toBe(false)
    expect(explainScope(doc('AH', 'R1'), { role: 'EU', companies: ['AH'], accounts: ['—'] }).ok).toBe(false)
  })

  it('EU sees the documents of its Receivers, any company unless companies are set', () => {
    const eu = { role: 'EU', companies: [] as string[], accounts: ['AHT Die Making 03, K.Vinitda Jitpilai', 'R2'] }
    expect(explainScope(doc('AHT', 'AHT DIE MAKING 03,  K.VINITDA JITPILAI'), eu).ok).toBe(true)
    expect(explainScope(doc('AH', 'r2'), eu).ok).toBe(true)
    expect(explainScope(doc('AH', 'R3'), eu).ok).toBe(false)
    expect(explainScope(doc('AH'), eu).ok).toBe(false)
    expect(explainScope(doc('AH', 'R2'), { ...eu, companies: ['AHT'] }).ok).toBe(false)
  })

  it('ADM nothing, SA everything, ALL everything', () => {
    expect(explainScope(doc('AH', 'R1'), { role: 'ADM', companies: ['AH'], accounts: [] }).ok).toBe(false)
    expect(explainScope(doc('ZZ'), { role: 'SA', companies: [], accounts: [] }).ok).toBe(true)
    expect(explainScope(doc('ZZ'), { role: 'ACC', companies: ['ALL'], accounts: [] }).ok).toBe(true)
  })

  it('receiver names compare without case / extra spaces, punctuation kept', () => {
    expect(normalizeReceiverName('  aht  die\tmaking 03, k.v ')).toBe('AHT DIE MAKING 03, K.V')
    expect(receiverMatches(['AHT Die Making 03, K.V'], 'AHT DIE MAKING 03 K.V')).toBe(false)
    expect(receiverMatches([], 'X')).toBe(false)
    expect(receiverMatches(['X'], '')).toBe(false)
  })
})

describe('checkPageFrame — boxes only on the page the Engine measured', () => {
  it('same shape → ok (scale does not matter)', () => {
    expect(checkPageFrame({ widthPt: 1191, heightPt: 842 }, { widthPt: 1191, heightPt: 842 }).ok).toBe(true)
    expect(checkPageFrame({ widthPt: 595, heightPt: 842 }, { widthPt: 612, heightPt: 866 }).ok).toBe(true)
  })

  it('the page turned a quarter (e.g. Paperless archive vs original) → turned', () => {
    const c = checkPageFrame({ widthPt: 1191, heightPt: 842 }, { widthPt: 842, heightPt: 1191 })
    expect(c).toMatchObject({ ok: false, kind: 'turned' })
  })

  it('another page size → shape', () => {
    expect(checkPageFrame({ widthPt: 595, heightPt: 842 }, { widthPt: 612, heightPt: 792 })).toMatchObject({ ok: false, kind: 'shape' })
  })

  it('nothing to compare → ok, never a false alarm', () => {
    expect(checkPageFrame(undefined, { widthPt: 1, heightPt: 1 }).ok).toBe(true)
    expect(checkPageFrame({ widthPt: 0, heightPt: 842 }, { widthPt: 1, heightPt: 1 }).ok).toBe(true)
    expect(checkPageFrame({ widthPt: 595, heightPt: 842 }, null).ok).toBe(true)
  })
})
