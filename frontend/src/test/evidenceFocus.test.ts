/**
 * F4 / F8 — the focus the dock (and the standalone viewer) is asked to show, as plain data.
 * The rule under test: a finding with no box never moves the PDF.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import { portalDocToInvoiceDoc } from '../features/engine/adapters/portalDocToInvoiceDoc'
import { documentFindings, findingsOf } from '../features/evidence/findings'
import {
  clampTarget,
  findFinding,
  findingWhere,
  focusForFinding,
  focusForPage,
  selectionForFinding,
  stepFinding,
  stepTarget,
  viewerBoxId,
} from '../features/evidence/focus'
import { parseViewerQuery, viewerFocusFor } from '../features/evidence/viewerFocus'
import { projectOverlayBoxes, viewerBoxesFromInvoiceDoc } from '../features/pdf-viewer/lib/overlayModel'
import type { Finding, RuleCheck } from '../types/invoice'

const DIR = path.resolve(process.cwd(), 'temp/paperless_invoices_v5')
const doc = (id: string) =>
  portalDocToInvoiceDoc(
    transformEngineResultToPortalDoc(JSON.parse(fs.readFileSync(path.join(DIR, `${id}_result.json`), 'utf-8'))),
    { includeBoxes: true },
  )

const finding = (over: Partial<Finding> = {}): Finding => ({
  id: 'X1',
  ruleId: 'V-07',
  kind: 'exception',
  result: 'fail',
  code: 'E11',
  severity: 'Medium',
  messageTh: 'm',
  actual: null,
  expected: null,
  relatedElementIds: [],
  oracleRefs: [],
  targets: [
    { id: 'D1:D1-L2', elementId: 'D1-L2', pageNo: 3, bbox: [0.1, 0.2, 0.5, 0.03], kind: 'row', label: 'L2' },
    { id: 'D1:D1-L2-qty', elementId: 'D1-L2-qty', pageNo: 3, bbox: [0.4, 0.2, 0.05, 0.03], kind: 'cell', label: 'L2 · qty' },
    { id: 'D1:D1-L2-amount', elementId: 'D1-L2-amount', pageNo: 4, bbox: [0.6, 0.2, 0.05, 0.03], kind: 'cell', label: 'L2 · amount' },
  ],
  ...over,
})
const unlocated = (): Finding => finding({ id: 'X7', ruleId: 'V-01', code: 'E01', targets: [], missingReason: 'NOT_PRESENT' })

describe('focusForFinding', () => {
  it('located: turns to the page of the chosen box', () => {
    expect(focusForFinding(finding(), 0, 1)).toEqual({
      page: 3, ruleId: 'V-07', findingId: 'X1', targetIdx: 0, locatable: true, nonce: 1,
    })
    expect(focusForFinding(finding(), 2, 1).page).toBe(4)
  })

  it('unlocated: no page at all, so the PDF stays where it is', () => {
    const f = focusForFinding(unlocated(), 0, 1)
    expect(f.locatable).toBe(false)
    expect(f.page).toBeUndefined()
    expect('page' in f).toBe(false)
    expect(f.findingId).toBe('X7')
  })

  it('clamps a stale target index', () => {
    expect(clampTarget(finding(), 99)).toBe(2)
    expect(clampTarget(finding(), -3)).toBe(0)
    expect(clampTarget(unlocated(), 5)).toBe(0)
    expect(focusForFinding(finding(), 99, 1).targetIdx).toBe(2)
  })

  it('legacy page request is unchanged', () => {
    expect(focusForPage(2, 'V-03', 5)).toEqual({ page: 2, ruleId: 'V-03', locatable: true, nonce: 5 })
    expect(focusForPage(undefined, undefined, 5).page).toBe(1)
  })
})

describe('selectionForFinding (the reverse link the detail pane reads)', () => {
  it('names the finding and marks the line row for a row/cell target', () => {
    expect(selectionForFinding(finding(), 1)).toEqual({
      ruleId: 'V-07', exceptionCode: 'E11', findingId: 'X1', targetIdx: 1, locatable: true,
      label: 'E11', lineNo: 2, surface: 'pdf',
    })
  })

  it('no code (review) and no box', () => {
    const s = selectionForFinding(finding({ id: 'R1', code: null, kind: 'review', targets: [] }))
    expect(s.exceptionCode).toBeUndefined()
    expect(s.locatable).toBe(false)
    expect(s.lineNo).toBeUndefined()
    expect(s.label).toBe('V-07')
  })

  it('a field target does not claim a table row', () => {
    const f = finding({ targets: [{ id: 'D1:D1-f-po', elementId: 'D1-f-po', pageNo: 1, bbox: [0, 0, 0.1, 0.1], kind: 'field', label: 'po_number' }] })
    expect(selectionForFinding(f).lineNo).toBeUndefined()
  })
})

describe('stepping and labels', () => {
  it('‹ › wraps over the boxes of one finding', () => {
    const f = finding()
    expect(stepTarget(f, 0, 1)).toBe(1)
    expect(stepTarget(f, 2, 1)).toBe(0)
    expect(stepTarget(f, 0, -1)).toBe(2)
    expect(stepTarget(unlocated(), 0, 1)).toBe(0)
  })

  it('finding ↑ ↓ wraps over the list, and starts at an end when nothing is active', () => {
    const list = [finding({ id: 'A' }), finding({ id: 'B' }), finding({ id: 'C' })]
    expect(stepFinding(list, 'A', 1)?.id).toBe('B')
    expect(stepFinding(list, 'C', 1)?.id).toBe('A')
    expect(stepFinding(list, 'A', -1)?.id).toBe('C')
    expect(stepFinding(list, null, 1)?.id).toBe('A')
    expect(stepFinding(list, null, -1)?.id).toBe('C')
    expect(stepFinding([], 'A', 1)).toBeUndefined()
  })

  it('findingWhere names the box or says there is none', () => {
    expect(findingWhere(finding(), 1)).toBe('L2 · qty · หน้า 3')
    expect(findingWhere(unlocated())).toBe('ไม่มีตำแหน่ง')
  })

  it('viewerBoxId prefixes the document once', () => {
    expect(viewerBoxId('DMS-27', 'D1:D1-L2')).toBe('DMS-27:D1:D1-L2')
    expect(viewerBoxId('DMS-27', 'DMS-27:V-02')).toBe('DMS-27:V-02')
  })
})

describe('on real documents', () => {
  it('DMS-27: every box of every located finding is lit alone on the page it turns to', () => {
    const d = doc('DMS-27')
    const vb = viewerBoxesFromInvoiceDoc(d)
    for (const f of documentFindings(d)) {
      for (let i = 0; i < f.targets.length; i++) {
        const focus = focusForFinding(f, i, 1)
        const out = projectOverlayBoxes(vb, {
          page: focus.page!,
          pageSize: { width: 800, height: 1100 },
          activeFindingId: f.id,
          activeRuleId: f.ruleId,
          focusId: viewerBoxId(d.doc, f.targets[focus.targetIdx!].id),
        })
        expect(out.filter(b => b.focused).map(b => b.id), `${f.id}#${i}`).toEqual([viewerBoxId(d.doc, f.targets[i].id)])
        expect(out.filter(b => !b.focused).every(b => b.dim), `${f.id}#${i}`).toBe(true)
      }
    }
  })

  it('DMS-123: the unlocated field asks the dock for nothing but the banner', () => {
    const d = doc('DMS-123')
    const f = documentFindings(d).find(x => x.targets.length === 0)!
    const focus = focusForFinding(f)
    expect(focus.locatable).toBe(false)
    expect(focus.page).toBeUndefined()
    const out = projectOverlayBoxes(viewerBoxesFromInvoiceDoc(d), {
      page: 1, pageSize: { width: 800, height: 1100 }, activeFindingId: f.id, activeRuleId: f.ruleId,
    })
    expect(out).toEqual([])
  })

  it('findFinding looks through legacy rules too', () => {
    const legacy: RuleCheck = { id: 'V-02', rule: 'V-02', name: 'x', status: 'FAIL', exception_code: 'E02', bbox: { x: 0.1, y: 0.1, w: 0.2, h: 0.1, page: 2 } }
    const d = { doc: 'DMS-1', rules: [legacy] }
    const id = findingsOf(legacy, d)[0].id
    expect(findFinding(d, id)?.targets[0].pageNo).toBe(2)
    expect(findFinding(d, 'nope')).toBeUndefined()
    expect(findFinding(d, null)).toBeUndefined()
  })
})

describe('F8: /viewer/:id?finding=', () => {
  it('parses the query', () => {
    expect(parseViewerQuery('?finding=X3&t=2')).toEqual({ finding: 'X3', target: 2 })
    expect(parseViewerQuery('finding=X3')).toEqual({ finding: 'X3', target: 0 })
    expect(parseViewerQuery('?t=-4')).toEqual({ finding: undefined, target: 0 })
    expect(parseViewerQuery('')).toEqual({ finding: undefined, target: 0 })
  })

  it('a located finding lights its boxes and scrolls to the chosen one', () => {
    const d = doc('DMS-27')
    const f = documentFindings(d).find(x => x.targets.length > 1)!
    const v = viewerFocusFor(d, f.id, 1)!
    expect(v.ids).toEqual(f.targets.map(t => t.id))
    expect(v.firstId).toBe(f.targets[1].id)
    expect(v.note).toContain(`หน้า ${f.targets[1].pageNo}`)
  })

  it('an unlocated finding lights nothing and says why', () => {
    const d = doc('DMS-123')
    const f = documentFindings(d).find(x => x.targets.length === 0)!
    const v = viewerFocusFor(d, f.id)!
    expect(v.ids).toEqual([])
    expect(v.firstId).toBeUndefined()
    expect(v.note).toContain('ไม่พบตำแหน่ง')
  })

  it('no finding asked = no focus; an unknown id says so', () => {
    const d = doc('DMS-27')
    expect(viewerFocusFor(d, undefined)).toBeNull()
    expect(viewerFocusFor(null, 'X1')).toBeNull()
    expect(viewerFocusFor(d, 'X999')!.ids).toEqual([])
  })
})
