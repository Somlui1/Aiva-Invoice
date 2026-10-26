/**
 * F3 — the overlay projector selects by finding, not by rule prefix.
 * Plan: docs/plans/2026-10-26-evidence-findings-portal-implementation.md
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  boxMatchesActive,
  projectOverlayBoxes,
  viewerBoxesFromInvoiceDoc,
  type ViewerBBox,
} from '../features/pdf-viewer/lib/overlayModel'
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import { portalDocToInvoiceDoc } from '../features/engine/adapters/portalDocToInvoiceDoc'

const PAGE = { width: 794, height: 1123 }
const DIR = path.resolve(process.cwd(), 'temp/paperless_invoices_v5')
const liveDoc = (id: string) =>
  portalDocToInvoiceDoc(
    transformEngineResultToPortalDoc(JSON.parse(fs.readFileSync(path.join(DIR, `${id}_result.json`), 'utf-8'))),
    { includeBoxes: true },
  )

const box = (id: string, over: Partial<ViewerBBox> = {}): ViewerBBox => ({
  id,
  pageNo: 1,
  origin: 'engine',
  bbox: [0.1, 0.1, 0.2, 0.05],
  ruleId: 'V-01',
  exceptionCode: 'E01',
  severity: 'Medium',
  ...over,
})

describe('F3: exact rule match, no prefix', () => {
  it('"V-0" does not match "V-01" (the old startsWith did)', () => {
    expect(boxMatchesActive(box('a'), 'V-0', null)).toBe(false)
    expect(boxMatchesActive(box('a', { ruleId: 'V-0' }), 'V-01', null)).toBe(false)
    expect(boxMatchesActive(box('a'), 'V-01', null)).toBe(true)
  })

  it('a rule-origin id ("DMS-1:V-07") matches only its own rule', () => {
    expect(boxMatchesActive(box('DMS-1:V-07', { ruleId: undefined }), 'V-07', null)).toBe(true)
    expect(boxMatchesActive(box('DMS-1:V-07', { ruleId: undefined }), 'V-0', null)).toBe(false)
  })

  it('projector drops a prefix-only rule match', () => {
    const out = projectOverlayBoxes([box('a'), box('b', { ruleId: 'V-07' })], { page: 1, pageSize: PAGE, activeRuleId: 'V-0' })
    expect(out).toHaveLength(0)
  })
})

describe('F3: finding selection', () => {
  const boxes = [
    box('row2', { ruleId: 'V-07', exceptionCode: 'E11', findingIds: ['X2'] }),
    box('row5', { ruleId: 'V-07', exceptionCode: 'E11', findingIds: ['X3'], bbox: [0.1, 0.3, 0.2, 0.05] }),
    box('cell', { ruleId: 'V-07', exceptionCode: 'E11', findingIds: ['X3'], bbox: [0.12, 0.31, 0.05, 0.02] }),
    box('total', { ruleId: 'V-03', exceptionCode: 'E03', findingIds: ['X1', 'X9'] }),
    box('legacy', { ruleId: 'V-02' }), // no findingIds: mock / rule-origin / stored before findings
  ]

  it('shows only the boxes of the finding', () => {
    const out = projectOverlayBoxes(boxes, { page: 1, pageSize: PAGE, activeFindingId: 'X3', activeRuleId: 'V-07' })
    expect(out.map(b => b.id).sort()).toEqual(['cell', 'row5'])
  })

  it('a finding does not pull in other findings of the same rule', () => {
    const out = projectOverlayBoxes(boxes, { page: 1, pageSize: PAGE, activeFindingId: 'X2', activeRuleId: 'V-07' })
    expect(out.map(b => b.id)).toEqual(['row2'])
  })

  it('a box shared by two findings is drawn for either', () => {
    for (const f of ['X1', 'X9']) {
      const out = projectOverlayBoxes(boxes, { page: 1, pageSize: PAGE, activeFindingId: f })
      expect(out.map(b => b.id)).toEqual(['total'])
    }
  })

  it('a box without findingIds falls back to the rule', () => {
    const out = projectOverlayBoxes(boxes, { page: 1, pageSize: PAGE, activeFindingId: 'V-02#legacy', activeRuleId: 'V-02' })
    expect(out.map(b => b.id)).toEqual(['legacy'])
  })

  it("focusId lights one box and fades the finding's others", () => {
    const out = projectOverlayBoxes(boxes, {
      page: 1, pageSize: PAGE, activeFindingId: 'X3', activeRuleId: 'V-07', focusId: 'cell',
    })
    const by = Object.fromEntries(out.map(b => [b.id, b]))
    expect(by.cell.focused).toBe(true)
    expect(by.cell.dim).toBe(false)
    expect(by.row5.focused).toBe(false)
    expect(by.row5.dim).toBe(true)
  })

  it('without focusId every box of the finding is lit and none is faded', () => {
    const out = projectOverlayBoxes(boxes, { page: 1, pageSize: PAGE, activeFindingId: 'X3', activeRuleId: 'V-07' })
    expect(out.every(b => b.focused && !b.dim)).toBe(true)
  })

  it('the exception-code filter does not hide a shared box in finding mode', () => {
    const out = projectOverlayBoxes(boxes, { page: 1, pageSize: PAGE, activeFindingId: 'X9', activeExceptionCode: 'E09' })
    expect(out.map(b => b.id)).toEqual(['total'])
  })

  it('only the page that is showing is drawn', () => {
    const out = projectOverlayBoxes([box('p2', { pageNo: 2, findingIds: ['X1'] })], { page: 1, pageSize: PAGE, activeFindingId: 'X1' })
    expect(out).toHaveLength(0)
  })

  it('no active rule or finding keeps the old behaviour (every box)', () => {
    expect(projectOverlayBoxes(boxes, { page: 1, pageSize: PAGE })).toHaveLength(5)
  })
})

describe('F3: live documents (125-doc corpus)', () => {
  it('DMS-27: each V-07 finding selects its own boxes, on its own page', () => {
    const doc = liveDoc('DMS-27')
    const vb = viewerBoxesFromInvoiceDoc(doc)
    const v07 = doc.rules.find(r => r.rule === 'V-07')!.findings!
    expect(v07).toHaveLength(10)
    const seen = new Set<string>()
    for (const f of v07) {
      const out = projectOverlayBoxes(vb, { page: f.targets[0].pageNo, pageSize: PAGE, activeFindingId: f.id, activeRuleId: 'V-07' })
      expect(out.length, f.id).toBeGreaterThan(0)
      expect(out.length, f.id).toBeLessThanOrEqual(f.targets.length)
      for (const b of out) {
        expect(b.findingIds, f.id).toContain(f.id)
        seen.add(b.id)
      }
    }
    expect(seen.size).toBeGreaterThan(5) // different findings never collapse onto one first box
  })

  it('a rule that carries findings adds no extra rule-origin box', () => {
    expect(viewerBoxesFromInvoiceDoc(liveDoc('DMS-27')).some(b => b.origin === 'rule')).toBe(false)
  })

  it('an element shared by two rules carries both findings', () => {
    let shared = 0
    for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('_result.json'))) {
      shared += viewerBoxesFromInvoiceDoc(liveDoc(f.replace('_result.json', ''))).filter(b => (b.findingIds ?? []).length > 1).length
    }
    expect(shared).toBeGreaterThan(0)
  })

  it('an unlocated finding selects no box (the PDF highlights nothing)', () => {
    const doc = liveDoc('DMS-123')
    const f = doc.rules.find(r => r.rule === 'V-01')!.findings![0]
    expect(f.targets).toHaveLength(0)
    const out = projectOverlayBoxes(viewerBoxesFromInvoiceDoc(doc), {
      page: 1, pageSize: PAGE, activeFindingId: f.id, activeRuleId: 'V-01',
    })
    expect(out).toHaveLength(0)
  })
})
