/**
 * F7 — backfilling `findings` into payloads stored before they existed.
 * `mergeFindings` is pure; `scripts/backfill-findings.ts` does the database I/O.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import { mergeFindings } from '../server/backfillFindings'
import type { PortalInvoiceDocument } from '../features/engine/types/portalDomain'

const DIR = path.resolve(process.cwd(), 'temp/paperless_invoices_v5')
const raw = (id: string) => JSON.parse(fs.readFileSync(path.join(DIR, `${id}_result.json`), 'utf-8'))
const all = () => fs.readdirSync(DIR).filter(f => f.endsWith('_result.json')).map(f => f.replace('_result.json', ''))
const strip = (p: unknown) => JSON.parse(JSON.stringify(p, (k, v) => (k === 'findings' || k === 'findingIds' ? undefined : v)))

/** A row ingested before findings existed: no `findings`, no `findingIds`. */
const oldRow = (id: string): PortalInvoiceDocument => strip(transformEngineResultToPortalDoc(raw(id)))

describe('F7: mergeFindings', () => {
  it('fills findings and findingIds on an old row, equal to what the adapter makes today', () => {
    const stored = oldRow('DMS-27')
    expect(stored.rules.every(r => r.findings === undefined)).toBe(true)
    const out = mergeFindings(stored, raw('DMS-27'))
    expect(out.status).toBe('updated')
    if (out.status !== 'updated') return
    const fresh = transformEngineResultToPortalDoc(raw('DMS-27'))
    expect(out.payload.rules.map(r => r.findings)).toEqual(fresh.rules.map(r => r.findings))
    expect(out.payload.bboxes.map(b => b.findingIds)).toEqual(fresh.bboxes.map(b => b.findingIds))
    expect(out.findings).toBe(raw('DMS-27').evidence.length)
  })

  it('touches nothing the Portal changed after ingest', () => {
    const stored = oldRow('DMS-27')
    stored.status = 'Confirmed' as PortalInvoiceDocument['status']
    stored.history = [...stored.history, { dt: '2026-10-22 09:00', who: 'acc01', role: 'ACC', act: 'Confirm' }]
    const out = mergeFindings(stored, raw('DMS-27'))
    expect(out.status).toBe('updated')
    if (out.status !== 'updated') return
    expect(strip(out.payload)).toEqual(strip(stored))
    expect(out.payload.status).toBe('Confirmed')
  })

  it('is idempotent: a second run changes nothing', () => {
    const first = mergeFindings(oldRow('DMS-27'), raw('DMS-27'))
    expect(first.status).toBe('updated')
    if (first.status !== 'updated') return
    expect(mergeFindings(first.payload, raw('DMS-27')).status).toBe('unchanged')
  })

  it('a row that already has findings is unchanged', () => {
    expect(mergeFindings(transformEngineResultToPortalDoc(raw('DMS-95')), raw('DMS-95')).status).toBe('unchanged')
  })

  it('skips a run for a different file', () => {
    expect(mergeFindings(oldRow('DMS-27'), raw('DMS-95'))).toMatchObject({ status: 'skipped', reason: 'DIFFERENT_FILE' })
  })

  it('skips a run that is not the one the rules came from', () => {
    const stored = oldRow('DMS-27')
    stored.rules = stored.rules.map(r => (r.ruleId === 'V-07' ? { ...r, evidenceIds: [...r.evidenceIds, 'X404'] } : r))
    expect(mergeFindings(stored, raw('DMS-27'))).toMatchObject({ status: 'skipped', reason: 'STALE_RUN' })
  })

  it('skips an unreadable engine result instead of throwing', () => {
    expect(mergeFindings(oldRow('DMS-27'), { not: 'an engine result' })).toMatchObject({ status: 'skipped', reason: 'UNREADABLE_RUN' })
  })

  it('every document of the corpus backfills; exceptions never change', () => {
    for (const id of all()) {
      const stored = oldRow(id)
      const out = mergeFindings(stored, raw(id))
      expect(out.status, id).toBe('updated')
      if (out.status !== 'updated') continue
      expect(out.payload.bboxes.length, id).toBe(stored.bboxes.length)
      expect(out.payload.exceptions, id).toEqual(stored.exceptions)
      const ids = new Set(out.payload.rules.flatMap(r => (r.findings ?? []).map(f => f.id)))
      for (const b of out.payload.bboxes) for (const f of b.findingIds ?? []) expect(ids.has(f), `${id} ${b.id}`).toBe(true)
    }
  })
})
