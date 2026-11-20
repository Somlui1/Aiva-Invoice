/**
 * v5.17 — POST /api/engine/presence (pure part): request parsing and the answer per document.
 */
import { describe, it, expect } from 'vitest'
import { buildPresence, parsePresenceRequest, PRESENCE_MAX_IDS, type PresenceRow } from '../server/presenceCore'

const row = (over: Partial<PresenceRow> = {}): PresenceRow => ({
  id: 'DMS-1',
  dmsDocId: 'DMS-1',
  status: 'Review',
  isLocked: false,
  companyCode: 'AHT',
  receiverName: 'AHT Die Making 03',
  readable: true,
  ...over,
})

describe('parsePresenceRequest', () => {
  it('accepts DMS ids, drops duplicates', () => {
    expect(parsePresenceRequest({ dms_doc_ids: ['DMS-1', 'DMS-22', 'DMS-1'] })).toEqual({ ok: true, ids: ['DMS-1', 'DMS-22'] })
  })
  it('refuses anything else', () => {
    expect(parsePresenceRequest({}).ok).toBe(false)
    expect(parsePresenceRequest({ dms_doc_ids: 'DMS-1' }).ok).toBe(false)
    expect(parsePresenceRequest({ dms_doc_ids: ['DMS-1', "x' OR 1=1"] }).ok).toBe(false)
    expect(parsePresenceRequest({ dms_doc_ids: Array.from({ length: PRESENCE_MAX_IDS + 1 }, (_, i) => `DMS-${i}`) }).ok).toBe(false)
  })
})

describe('buildPresence', () => {
  it('reports found / missing / unreadable / closed per id', () => {
    const out = buildPresence(
      ['DMS-1', 'DMS-2', 'DMS-3', 'DMS-4'],
      [row(), row({ id: 'DMS-3', dmsDocId: 'DMS-3', readable: false }), row({ id: 'DMS-4', dmsDocId: 'DMS-4', status: 'Posted' })],
    )
    expect(out['DMS-1']).toMatchObject({ found: true, status: 'Review', readable: true, revalidatable: true })
    expect(out['DMS-2']).toEqual({ found: false })
    expect(out['DMS-3']).toMatchObject({ found: true, readable: false, revalidatable: true })
    expect(out['DMS-4']).toMatchObject({ found: true, revalidatable: false })
  })
  it('a locked document is never re-validatable', () => {
    expect(buildPresence(['DMS-1'], [row({ isLocked: true })])['DMS-1'].revalidatable).toBe(false)
  })
})
