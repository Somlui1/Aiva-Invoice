/**
 * Findings: one evidence button per Engine evidence row (plan F1, F2, F10).
 * docs/plans/2026-10-26-evidence-findings-portal-implementation.md
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  transformEngineResultToPortalDoc,
  normalizeMissingReason,
  targetLabel,
} from '../features/engine/adapters/engineToPortalAdapter'
import {
  portalDocToInvoiceDoc,
  portalBboxesToRawPayload,
  isSignedValue,
} from '../features/engine/adapters/portalDocToInvoiceDoc'
import { engineResultV3Schema } from '../features/engine/schemas/engineResultV3Schema'
import {
  findingState,
  findingsOf,
  ruleEvidenceState,
  unlocatedBanner,
  MISSING_REASON_TH,
} from '../features/evidence/findings'
import type { RuleCheck } from '../types/invoice'

const DIR = path.resolve(process.cwd(), 'temp/paperless_invoices_v5')
const raw = (id: string) => JSON.parse(fs.readFileSync(path.join(DIR, `${id}_result.json`), 'utf-8'))
const portal = (id: string) => transformEngineResultToPortalDoc(raw(id))
const all = () =>
  fs
    .readdirSync(DIR)
    .filter(f => f.endsWith('_result.json'))
    .map(f => f.replace('_result.json', ''))

describe('F1 adapter: one finding per evidence row', () => {
  it('keeps every evidence row of every document, with unique ids', () => {
    for (const id of all()) {
      const r = raw(id)
      const p = transformEngineResultToPortalDoc(r)
      const fs_ = p.rules.flatMap(x => x.findings ?? [])
      expect(fs_.length, id).toBe(r.evidence.length)
      expect(new Set(fs_.map(f => f.id)).size, id).toBe(fs_.length)
      expect(p.exceptions.length, id).toBe(r.exceptions.length)
    }
  })

  it('DMS-27: V-07 has 10 findings, each on its own page', () => {
    const v07 = portal('DMS-27').rules.find(r => r.ruleId === 'V-07')!
    expect(v07.findings).toHaveLength(10)
    const page = (line: string) => v07.findings!.find(f => f.targets[0]?.label === line)?.targets[0].pageNo
    expect(page('L2')).toBe(1)
    expect(page('L5')).toBe(3)
    // rows sort before their cells
    const withCell = v07.findings!.find(f => f.targets.length > 1)!
    expect(withCell.targets[0].kind).toBe('row')
  })

  it('a field the reader could not place is unlocated with a reason', () => {
    const f = portal('DMS-123').rules.find(r => r.ruleId === 'V-01')!.findings![0]
    expect(findingState(f)).toBe('unlocated')
    expect(['NOT_PRESENT', 'NOT_LOCATED']).toContain(f.missingReason)
  })

  it('no reason from the Engine is reported as UNKNOWN, never as located', () => {
    const f = portal('DMS-40').rules.find(r => r.ruleId === 'V-01')!.findings![0]
    expect(f.targets).toEqual([])
    expect(f.missingReason).toBe('UNKNOWN')
    expect(normalizeMissingReason('SOMETHING_NEW')).toBe('UNKNOWN')
  })

  it('an element used by two rules links to both findings', () => {
    const shared = all()
      .map(portal)
      .flatMap(p => p.bboxes)
      .filter(b => (b.findingIds ?? []).length > 1)
    expect(shared.length).toBeGreaterThan(0)
  })

  it('labels rows and cells for the dock', () => {
    expect(targetLabel('lines[7].qty', 'D1-L7-qty')).toBe('L7 · qty')
    expect(targetLabel('lines[7]', 'D1-L7')).toBe('L7')
    expect(targetLabel('sub_total', 'D1-f-sub_total')).toBe('sub_total')
    expect(targetLabel(null, 'D1-x')).toBe('D1-x')
  })
})

describe('F10 schema 3.1: review rows and reason enum', () => {
  const v31 = () => {
    const r = raw('DMS-27')
    r.versions.schema = '3.1'
    const v08 = r.rule_results.find((x: { rule_id: string }) => x.rule_id === 'V-08')
    r.evidence.push({
      ...r.evidence[0],
      evidence_id: 'X99',
      rule_id: 'V-08',
      result: 'manual_review',
      exception_code: null,
      severity: null,
      kind: 'review',
      field_name: 'lines[2].qty',
      line_no: 2,
      message_th: 'เทียบจำนวนกับใบรับไม่ได้',
      bboxes: [],
      page_no: [],
      bbox_missing_reason: { element_ids: ['D1-L2-qty'], reason: 'LOW_CONFIDENCE' },
    })
    v08.evidence_ids = [...v08.evidence_ids, 'X99']
    return r
  }

  it('accepts a 3.1 payload and keeps review rows out of exceptions', () => {
    const r = v31()
    expect(engineResultV3Schema.safeParse(r).success).toBe(true)
    const p = transformEngineResultToPortalDoc(r)
    const review = p.rules.find(x => x.ruleId === 'V-08')!.findings!.find(f => f.id === 'X99')!
    expect(review.kind).toBe('review')
    expect(review.code).toBeNull()
    expect(review.missingReason).toBe('LOW_CONFIDENCE')
    expect(review.lineNo).toBe(2)
    expect(p.exceptions.length).toBe(r.exceptions.length)
    // rule-level fields still describe an exception row, not the review row
    expect(p.rules.find(x => x.ruleId === 'V-08')!.exceptionCode).toBe('E14')
  })

  it('degrades an unexpected bbox_missing_reason shape instead of rejecting the payload', () => {
    const r = raw('DMS-40')
    r.evidence[0].bbox_missing_reason = 'free text'
    expect(engineResultV3Schema.safeParse(r).success).toBe(true)
    expect(transformEngineResultToPortalDoc(r).rules[0].findings![0].missingReason).toBe('UNKNOWN')
  })
})

describe('F2 UI model', () => {
  it('rule PASS / SKIP never get a button', () => {
    for (const id of all()) {
      const ui = portalDocToInvoiceDoc(portal(id))
      for (const r of ui.rules) {
        if (r.status === 'PASS' || r.status === 'SKIP') expect(ruleEvidenceState(r, ui), `${id} ${r.rule}`).toBe('none')
      }
    }
  })

  it('legacy rules (mock / stored before findings) get one finding from their own fields', () => {
    const located: RuleCheck = {
      id: 'V-02', rule: 'V-02', name: 'x', status: 'FAIL', exception_code: 'E02', severity: 'High',
      bbox: { x: 0.1, y: 0.2, w: 0.3, h: 0.04, page: 2 },
    }
    const unlocated: RuleCheck = { id: 'V-01', rule: 'V-01', name: 'x', status: 'FAIL', exception_code: 'E01' }
    expect(findingsOf(located)[0].targets[0].pageNo).toBe(2)
    expect(ruleEvidenceState(located)).toBe('located')
    expect(ruleEvidenceState(unlocated)).toBe('unlocated')
    expect(findingsOf(unlocated)[0].missingReason).toBe('UNKNOWN')
    expect(findingsOf({ ...located, status: 'PASS' })).toEqual([])
  })

  it('banner never shows blanks', () => {
    const f = portal('DMS-40').rules[0].findings![0]
    const b = unlocatedBanner(f)
    expect(b.reason).toBe(MISSING_REASON_TH.UNKNOWN)
    expect(b.actual).toBe('—')
    expect(b.expected).toBe('—')
  })

  it('one raw evidence group per located finding; a shared box sits in every group', () => {
    const p = portal('DMS-27')
    const payload = portalBboxesToRawPayload(p)
    const located = p.rules.flatMap(r => r.findings ?? []).filter(f => f.targets.length)
    expect(payload.evidence).toHaveLength(located.length)
    expect(payload.evidence.every(g => g.finding_id)).toBe(true)
  })

  it('a located review finding is a group too, with no code, and does not take the box colour', () => {
    const r = raw('DMS-27')
    const src = r.evidence.find((e: { rule_id: string }) => e.rule_id === 'V-07')
    r.evidence.push({
      ...src,
      evidence_id: 'X98',
      result: 'manual_review',
      exception_code: null,
      severity: null,
      kind: 'review',
      bbox_missing_reason: null,
    })
    r.rule_results.find((x: { rule_id: string }) => x.rule_id === 'V-07').evidence_ids.push('X98')
    const p = transformEngineResultToPortalDoc(r)
    const group = portalBboxesToRawPayload(p).evidence.find(g => g.finding_id === 'X98')!
    expect(group).toBeTruthy()
    expect(group.exception_code).toBeUndefined()
    expect(group.severity).toBeUndefined()
    expect(group.bboxes.length).toBeGreaterThan(0)
    const shared = p.bboxes.find(b => b.id === group.bboxes[0].element_id)!
    expect(shared.exceptionCode).toBe('E11')
    expect(shared.findingIds).toContain('X98')
  })

  it('signature glyph: only "signed" / "true" count, an empty box does not', () => {
    for (const v of ['signed', 'true', ' Signed ']) expect(isSignedValue(v)).toBe(true)
    for (const v of ['empty', 'false', '0', '', null, undefined]) expect(isSignedValue(v)).toBe(false)
  })
})
