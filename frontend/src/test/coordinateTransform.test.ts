/**
 * Task 7 — coordinate transform for the PDF.js canvas + interactive BBox overlay.
 *
 * The Engine emits every box as `[x, y, w, h]` normalised 0..1 with a top-left
 * origin, measured on the *rotated* page (`engine/src/system_a/perception/coords.py`
 * → `contracts.COORDINATE_SYSTEM`). The overlay draws those boxes on a surface
 * whose pixel size changes with zoom, rotation and device pixel ratio, so this
 * mapping is the one part of the viewer that has to be exactly right: a wrong
 * factor here looks like a "broken OCR" bug somewhere else.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  A4_CSS_SIZE,
  PT_TO_CSS_PX,
  clamp01,
  cssPageGeometry,
  devicePixelSize,
  expandPixelBox,
  isNormalizedBBox,
  normalizeBBox,
  normalizedToPixelBox,
  pixelBoxToNormalized,
  pointsToCss,
  rotateNormalizedBox,
  scaleToFitWidth,
  type NormalizedBBox,
} from '../features/pdf-viewer/lib/coordinateTransform'
import {
  RULE_REGION_KEYS,
  mockEvidenceViewerBBoxes,
  mockLineNumbersForRule,
  projectOverlayBoxes,
  viewerBoxesFromInvoiceDoc,
  type ViewerBBox,
} from '../features/pdf-viewer/lib/overlayModel'
import type { InvoiceDoc } from '../types/invoice'

/** A4 at 96 dpi — the surface the mockup (and `EvidenceCanvas`) draws on. */
const A4 = A4_CSS_SIZE // 794 × 1123

const box = (over: Partial<ViewerBBox> & { id: string; bbox: NormalizedBBox }): ViewerBBox =>
  ({
    pageNo: 1,
    origin: 'engine',
    ...over,
  }) as ViewerBBox

describe('normalized bbox guard', () => {
  it('accepts a real engine box', () => {
    expect(isNormalizedBBox([0.685, 0.122, 0.185, 0.024])).toBe(true)
  })

  it('rejects malformed shapes', () => {
    expect(isNormalizedBBox([0.1, 0.1, 0.1])).toBe(false)
    expect(isNormalizedBBox([0.1, 0.1, 0.1, 0.1, 0.1])).toBe(false)
    expect(isNormalizedBBox(['0.1', 0.1, 0.1, 0.1])).toBe(false)
    expect(isNormalizedBBox(null)).toBe(false)
    expect(isNormalizedBBox({ x: 0 })).toBe(false)
  })

  it('clamps out-of-range edges back inside the page', () => {
    // A box that overruns the right/bottom edge keeps its origin and shrinks.
    expect(normalizeBBox([0.9, 0.95, 0.5, 0.2])).toEqual([0.9, 0.95, 0.1, 0.05])
    expect(normalizeBBox([-0.2, 0, 0.4, 0.1])).toEqual([0, 0, 0.2, 0.1])
  })

  it('refuses boxes it cannot place', () => {
    expect(normalizeBBox([Number.NaN, 0.1, 0.1, 0.1])).toBeNull()
    expect(normalizeBBox([0.1, 0.1, -0.1, 0.1])).toBeNull()
    expect(normalizeBBox([0.1, 0.1, 0.1])).toBeNull()
  })

  it('clamp01 pins both ends', () => {
    expect(clamp01(-3)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(1.7)).toBe(1)
  })
})

describe('normalizedToPixelBox', () => {
  it('maps a normalised box onto the A4 canvas', () => {
    const px = normalizedToPixelBox([0.685, 0.122, 0.185, 0.024], A4)
    expect(px).not.toBeNull()
    expect(px!.left).toBeCloseTo(0.685 * 794, 6)
    expect(px!.top).toBeCloseTo(0.122 * 1123, 6)
    expect(px!.width).toBeCloseTo(0.185 * 794, 6)
    expect(px!.height).toBeCloseTo(0.024 * 1123, 6)
    expect(px!.left).toBeCloseTo(543.89, 1)
    expect(px!.top).toBeCloseTo(136.999, 1)
  })

  it('treats the whole page as [0,0,1,1] with a top-left origin', () => {
    expect(normalizedToPixelBox([0, 0, 1, 1], A4)).toEqual({
      left: 0,
      top: 0,
      width: 794,
      height: 1123,
    })
    // y = 0 is the *top* of the page, not the bottom (PDF user space differs).
    const nearTop = normalizedToPixelBox([0, 0, 0.1, 0.1], A4)!
    expect(nearTop.top).toBe(0)
  })

  it('keeps a zero-area box at zero size (dropping is the caller\'s job)', () => {
    expect(normalizedToPixelBox([0.5, 0.5, 0, 0], A4)).toEqual({
      left: 397,
      top: 561.5,
      width: 0,
      height: 0,
    })
  })

  it('scales with the surface, which is how zoom stays correct', () => {
    const bbox: [number, number, number, number] = [0.25, 0.5, 0.2, 0.1]
    const small = normalizedToPixelBox(bbox, { width: 794, height: 1123 })!
    const large = normalizedToPixelBox(bbox, { width: 1588, height: 2246 })!
    expect(large.left).toBe(small.left * 2)
    expect(large.width).toBe(small.width * 2)
  })

  it('returns null for a surface it cannot measure', () => {
    expect(normalizedToPixelBox([0, 0, 1, 1], { width: 0, height: 1123 })).toBeNull()
    expect(normalizedToPixelBox([0, 0, 1, 1], { width: 794, height: Number.NaN })).toBeNull()
  })
})

describe('pixelBoxToNormalized', () => {
  it('inverts normalizedToPixelBox', () => {
    const bbox: [number, number, number, number] = [0.685, 0.122, 0.185, 0.024]
    const px = normalizedToPixelBox(bbox, A4)!
    const back = pixelBoxToNormalized(px, A4)!
    back.forEach((v, i) => expect(v).toBeCloseTo(bbox[i], 10))
  })

  it('is scale-invariant, which is why measured mock boxes need no zoom math', () => {
    // The mock canvas is laid out at 794×1123 and then CSS-scaled, so
    // getBoundingClientRect() returns scaled pixels. Dividing by the scaled page
    // rect cancels the factor out.
    const bbox: [number, number, number, number] = [0.1, 0.2, 0.3, 0.04]
    const scaled = normalizedToPixelBox(bbox, { width: 794 * 2, height: 1123 * 2 })!
    const back = pixelBoxToNormalized(scaled, { width: 794 * 2, height: 1123 * 2 })!
    back.forEach((v, i) => expect(v).toBeCloseTo(bbox[i], 10))
  })

  it('returns null for an unmeasurable surface', () => {
    expect(pixelBoxToNormalized({ left: 0, top: 0, width: 10, height: 10 }, { width: 0, height: 0 })).toBeNull()
  })
})

describe('expandPixelBox', () => {
  it('pads every side', () => {
    const px = normalizedToPixelBox([0.5, 0.5, 0.2, 0.1], A4)!
    const padded = expandPixelBox(px, 3, A4)
    expect(padded.left).toBeCloseTo(px.left - 3, 6)
    expect(padded.top).toBeCloseTo(px.top - 3, 6)
    expect(padded.width).toBeCloseTo(px.width + 6, 6)
    expect(padded.height).toBeCloseTo(px.height + 6, 6)
  })

  it('never grows past the page edge', () => {
    const edge = normalizedToPixelBox([0, 0, 0.5, 0.5], A4)!
    const padded = expandPixelBox(edge, 10, A4)
    expect(padded.left).toBe(0)
    expect(padded.top).toBe(0)
    const far = normalizedToPixelBox([0.5, 0.5, 0.5, 0.5], A4)!
    const paddedFar = expandPixelBox(far, 10, A4)
    expect(paddedFar.left + paddedFar.width).toBeCloseTo(794, 6)
    expect(paddedFar.top + paddedFar.height).toBeCloseTo(1123, 6)
  })
})

describe('rotateNormalizedBox', () => {
  const b: [number, number, number, number] = [0.1, 0.2, 0.3, 0.04]

  it('is the identity for whole turns, including negative ones', () => {
    expect(rotateNormalizedBox(b, 0)).toEqual(b)
    expect(rotateNormalizedBox(b, 360)).toEqual(b)
    expect(rotateNormalizedBox(b, -360)).toEqual(b)
  })

  it('maps 90° clockwise', () => {
    // The old top-left corner travels to the top-right of the turned page.
    expect(rotateNormalizedBox(b, 90).map(v => +v.toFixed(6))).toEqual(
      [1 - (0.2 + 0.04), 0.1, 0.04, 0.3].map(v => +v.toFixed(6)),
    )
  })

  it('maps 180°', () => {
    expect(rotateNormalizedBox(b, 180).map(v => +v.toFixed(6))).toEqual(
      [1 - (0.1 + 0.3), 1 - (0.2 + 0.04), 0.3, 0.04].map(v => +v.toFixed(6)),
    )
  })

  it('maps 270°', () => {
    expect(rotateNormalizedBox(b, 270).map(v => +v.toFixed(6))).toEqual(
      [0.2, 1 - (0.1 + 0.3), 0.04, 0.3].map(v => +v.toFixed(6)),
    )
  })

  it('normalises -90 to the 270° turn', () => {
    const minus = rotateNormalizedBox(b, -90).map(v => +v.toFixed(6))
    expect(minus).toEqual(rotateNormalizedBox(b, 270).map(v => +v.toFixed(6)))
  })

  it('four quarter turns land back where they started and preserve area', () => {
    let cur: NormalizedBBox = b
    for (const deg of [90, 90, 90, 90]) {
      const next = rotateNormalizedBox(cur, deg)
      expect(next[2] * next[3]).toBeCloseTo(cur[2] * cur[3], 10)
      cur = next
    }
    cur.forEach((v, i) => expect(v).toBeCloseTo(b[i], 10))
  })
})

describe('page geometry helpers', () => {
  it('converts PDF points to CSS pixels (72 dpi → 96 dpi)', () => {
    expect(PT_TO_CSS_PX).toBeCloseTo(96 / 72, 10)
    // A4: 595×842 pt → 794×1123 px, the exact box the mockup draws.
    const css = pointsToCss(595, 842)
    expect(css.width).toBeCloseTo(793.333, 2)
    expect(css.height).toBeCloseTo(1122.667, 2)
  })

  it('swaps axes for quarter turns, like the PDF.js viewport', () => {
    const upright = cssPageGeometry(595, 842)
    expect(upright.width).toBeLessThan(upright.height)
    const turned = cssPageGeometry(595, 842, { rotation: 90 })
    expect(turned.width).toBeCloseTo(upright.height, 6)
    expect(turned.height).toBeCloseTo(upright.width, 6)
    expect(cssPageGeometry(595, 842, { rotation: 180 })).toEqual(upright)
  })

  it('applies the render scale on top of the unit geometry', () => {
    const base = cssPageGeometry(595, 842, { scale: 1 })
    expect(cssPageGeometry(595, 842, { scale: 1.5 })).toEqual({
      width: base.width * 1.5,
      height: base.height * 1.5,
    })
  })

  it('solves the PDF.js scale that fits a page to a target width', () => {
    // A4 portrait fitted to the mockup's 794 px page width: scale = 794 / 595.
    expect(scaleToFitWidth(595, 842, { cssWidth: 794 })).toBeCloseTo(794 / 595, 8)
    expect(scaleToFitWidth(595, 842, { cssWidth: 794 })).toBeCloseTo(1.3345, 3)
    // Turned portrait becomes landscape: same width, so base width is 842 pt.
    const turned = scaleToFitWidth(595, 842, { cssWidth: 794, rotation: 90 })
    expect(turned).toBeCloseTo(794 / 842, 8)
    expect(turned).toBeCloseTo(0.943, 3)
  })

  it('sizes the canvas backing store and refuses absurd surfaces', () => {
    expect(devicePixelSize({ width: 794, height: 1123 }, 2)).toEqual({ width: 1588, height: 2246 })
    expect(devicePixelSize({ width: 794, height: 1123 }, 1)).toEqual({ width: 794, height: 1123 })
    // Browsers fail silently past ~16k px per side; cap the long edge instead.
    const huge = devicePixelSize({ width: 4000, height: 6000 }, 4)
    expect(Math.max(huge.width, huge.height)).toBeLessThanOrEqual(16384)
    expect(huge.width / huge.height).toBeCloseTo(4000 / 6000, 2)
  })
})

describe('projectOverlayBoxes — bbox set → positioned overlay', () => {
  const opts = { page: 1, pageSize: A4 }

  it('positions and labels one evidence box', () => {
    const out = projectOverlayBoxes(
      [box({ id: 'b1', bbox: [0.5, 0.25, 0.2, 0.05], ruleId: 'V-07', exceptionCode: 'E10', severity: 'High' })],
      opts,
    )
    expect(out).toHaveLength(1)
    expect(out[0].left).toBeCloseTo(397, 6)
    expect(out[0].top).toBeCloseTo(280.75, 6)
    expect(out[0].severity).toBe('High')
    expect(out[0].tag).toBe('E10')
    expect(out[0].focused).toBe(false)
  })

  it('only keeps boxes from the page being shown', () => {
    const out = projectOverlayBoxes(
      [box({ id: 'p1', bbox: [0, 0, 0.1, 0.1], pageNo: 1 }), box({ id: 'p2', bbox: [0, 0, 0.1, 0.1], pageNo: 2 })],
      { page: 2, pageSize: A4 },
    )
    expect(out.map(b => b.id)).toEqual(['p2'])
    expect(out[0].pageNo).toBe(2)
  })

  it('draws what it is handed, and can narrow itself to evidence', () => {
    const boxes = [
      box({ id: 'ev', bbox: [0.1, 0.1, 0.2, 0.02], ruleId: 'V-03' }),
      box({ id: 'el', bbox: [0.4, 0.4, 0.05, 0.01], fieldName: 'invoice_num' }),
    ]
    // Raw OCR fields are opt-in (the dock's "all fields" toggle).
    expect(projectOverlayBoxes(boxes, opts).map(b => b.id).sort()).toEqual(['el', 'ev'])
    expect(projectOverlayBoxes(boxes, { ...opts, onlyEvidence: true }).map(b => b.id)).toEqual(['ev'])
  })

  it('drops zero-area and unusable boxes', () => {
    const out = projectOverlayBoxes(
      [
        box({ id: 'flat', bbox: [0.1, 0.1, 0.2, 0] }),
        box({ id: 'junk', bbox: [0.1, 0.1, Number.NaN, 0.1] }),
        box({ id: 'ok', bbox: [0.1, 0.1, 0.2, 0.02] }),
      ],
      opts,
    )
    expect(out.map(b => b.id)).toEqual(['ok'])
  })

  it('pads the box and keeps it on the page', () => {
    const out = projectOverlayBoxes([box({ id: 'edge', bbox: [0, 0, 0.2, 0.02] })], { ...opts, padding: 3 })
    expect(out[0].left).toBe(0)
    expect(out[0].top).toBe(0)
    // Hugging the top-left corner, the box only grows on its free edges.
    expect(out[0].width).toBeCloseTo(0.2 * 794 + 3, 6)
    expect(out[0].height).toBeCloseTo(0.02 * 1123 + 3, 6)

    const middle = projectOverlayBoxes([box({ id: 'mid', bbox: [0.4, 0.4, 0.2, 0.02] })], { ...opts, padding: 3 })
    expect(middle[0].width).toBeCloseTo(0.2 * 794 + 6, 6)
    expect(middle[0].height).toBeCloseTo(0.02 * 1123 + 6, 6)
  })

  it('draws big boxes first so the small ones stay clickable', () => {
    const out = projectOverlayBoxes(
      [
        box({ id: 'small', bbox: [0.1, 0.1, 0.02, 0.01] }),
        box({ id: 'big', bbox: [0.05, 0.05, 0.5, 0.4] }),
      ],
      opts,
    )
    expect(out.map(b => b.id)).toEqual(['big', 'small'])
  })

  it('tags one box per rule (the largest) and gives the rest tooltips only', () => {
    const out = projectOverlayBoxes(
      [
        box({ id: 'row2', bbox: [0.1, 0.5, 0.5, 0.02], ruleId: 'V-07', exceptionCode: 'E10' }),
        box({ id: 'row1', bbox: [0.1, 0.3, 0.5, 0.08], ruleId: 'V-07', exceptionCode: 'E10' }),
      ],
      opts,
    )
    expect(out.map(b => b.id)).toEqual(['row1', 'row2'])
    expect(out[0].tag).toBe('E10')
    expect(out[1].tag).toBeNull()
  })

  it('falls back to the rule id when there is no exception code', () => {
    const out = projectOverlayBoxes([box({ id: 'x', bbox: [0, 0, 0.1, 0.1], ruleId: 'V-06' })], opts)
    expect(out[0].tag).toBe('V-06')
    expect(out[0].severity).toBe('Medium')
  })

  it('focuses every box of the focused rule, or one box by id', () => {
    const boxes = [
      box({ id: 'a1', bbox: [0.1, 0.1, 0.1, 0.02], ruleId: 'V-07' }),
      box({ id: 'a2', bbox: [0.1, 0.4, 0.1, 0.02], ruleId: 'V-07' }),
      box({ id: 'b1', bbox: [0.4, 0.1, 0.1, 0.02], ruleId: 'V-03' }),
    ]
    const byRule = projectOverlayBoxes(boxes, { ...opts, focusRuleId: 'V-07' })
    expect(byRule.filter(b => b.focused).map(b => b.id).sort()).toEqual(['a1', 'a2'])
    const byId = projectOverlayBoxes(boxes, { ...opts, focusRuleId: 'V-07', focusId: 'b1' })
    expect(byId.filter(b => b.focused).map(b => b.id)).toEqual(['b1'])
  })

  it('rotates boxes into the turned page frame', () => {
    const straight = projectOverlayBoxes([box({ id: 'r', bbox: [0.1, 0.2, 0.3, 0.04] })], opts)[0]
    const turned = projectOverlayBoxes([box({ id: 'r', bbox: [0.1, 0.2, 0.3, 0.04] })], {
      ...opts,
      rotation: 90,
    })[0]
    expect(turned.left).toBeCloseTo((1 - 0.24) * 794, 1)
    expect(turned.top).toBeCloseTo(0.1 * 1123, 1)
    expect(turned.width).toBeCloseTo(0.04 * 794, 1)
    expect(turned.height).toBeCloseTo(0.3 * 1123, 1)
    expect(turned.left).not.toBeCloseTo(straight.left, 1)
  })

  it('builds a tooltip from field name, OCR value and confidence', () => {
    const out = projectOverlayBoxes(
      [
        box({
          id: 'f',
          bbox: [0.1, 0.1, 0.2, 0.02],
          fieldName: 'grand_total',
          value: '34,989.00',
          confidence: 0.94,
        }),
      ],
      opts,
    )
    expect(out[0].tooltip).toContain('grand_total')
    expect(out[0].tooltip).toContain('34,989.00')
    expect(out[0].tooltip).toContain('94%')
  })

  it('clamps a box that starts outside the page instead of rendering off-screen', () => {
    const out = projectOverlayBoxes([box({ id: 'oob', bbox: [0.9, 0.95, 0.5, 0.2] })], opts)
    expect(out).toHaveLength(1)
    expect(out[0].left + out[0].width).toBeLessThanOrEqual(794 + 1e-6)
    expect(out[0].top + out[0].height).toBeLessThanOrEqual(1123 + 1e-6)
  })
})

describe('viewerBoxesFromInvoiceDoc', () => {
  const lite = (over: Partial<InvoiceDoc>) => over as unknown as InvoiceDoc

  it('returns nothing when the document carries no coordinates', () => {
    const doc = lite({ doc: 'DMS-1', pages: 1, rules: [{ id: 'r1', rule: 'V-03', name: 'x', status: 'FAIL' }] })
    expect(viewerBoxesFromInvoiceDoc(doc)).toEqual([])
  })

  it('maps rule-level bboxes, keeping the page and the exception link', () => {
    const doc = lite({
      doc: 'DMS-1',
      pages: 2,
      rules: [
        {
          id: 'r1',
          rule: 'V-07',
          name: 'จับคู่รายบรรทัดและราคา',
          status: 'FAIL',
          exception_code: 'E10',
          severity: 'High',
          bbox: { x: 0.1, y: 0.5, w: 0.4, h: 0.05, page: 2 },
        },
        { id: 'r2', rule: 'V-01', name: 'x', status: 'PASS' },
      ],
    })
    const out = viewerBoxesFromInvoiceDoc(doc, { labelOf: code => (code === 'E10' ? 'Line Arithmetic' : undefined) })
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('DMS-1:V-07')
    expect(out[0].pageNo).toBe(2)
    expect(out[0].ruleId).toBe('V-07')
    expect(out[0].exceptionCode).toBe('E10')
    expect(out[0].severity).toBe('High')
    expect(out[0].bbox).toEqual([0.1, 0.5, 0.4, 0.05])
    expect(out[0].origin).toBe('rule')
    // Tag text is code + Thai/English label, matching the mockup chip.
    expect(out[0].label).toBe('E10 · Line Arithmetic')
  })

  it('reads the Engine evidence boxes carried in the stored raw payload', () => {
    const file = path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json')
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8'))
    const doc = lite({
      doc: 'DMS-100',
      pages: raw.package?.page_count ?? 1,
      rules: (raw.rule_results || []).map((r: any) => ({
        id: r.rule_id,
        rule: r.rule_id,
        name: r.rule_id,
        status: r.result === 'pass' ? 'PASS' : 'FAIL',
        exception_code: r.exception_code,
      })),
      raw_payload: raw,
    })

    const out = viewerBoxesFromInvoiceDoc(doc)
    expect(out.length).toBeGreaterThan(0)

    const ids = out.map(b => b.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const b of out) {
      expect(b.bbox).toHaveLength(4)
      expect(b.pageNo).toBeGreaterThanOrEqual(1)
      for (const v of b.bbox) {
        expect(Number.isFinite(v)).toBe(true)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
    // Evidence-linked boxes are what the overlay shows by default.
    expect(out.filter(b => b.ruleId).length).toBeGreaterThan(0)
    expect(out.filter(b => b.origin === 'engine').length).toBeGreaterThan(0)
    // Coordinates came from the Engine, so they must sit on a real page.
    expect(out.some(b => b.pageNo > 1)).toBe(true)
  })
})

describe('mock canvas region map', () => {
  it('covers every shipped rule', () => {
    expect(Object.keys(RULE_REGION_KEYS).sort()).toEqual([
      'V-01',
      'V-02',
      'V-03',
      'V-04',
      'V-05',
      'V-06',
      'V-07',
      'V-08',
      'V-09',
    ])
  })

  it('only names regions EvidenceCanvas tags with data-k', () => {
    // Drift here would silently drop highlights in mock mode.
    const rendered = new Set([
      'header',
      'supplier',
      'customer',
      'po',
      'lines',
      'totals',
      'signatures',
      'sig_rcv',
      'sig_sup',
    ])
    for (const keys of Object.values(RULE_REGION_KEYS)) {
      for (const k of keys) expect(rendered.has(k)).toBe(true)
    }
  })

  const lines = [
    { no: 1, desc: 'A', qty: 10, unit: 'pcs', price: 5, amount: 50 },
    { no: 2, desc: 'B', qty: 10, unit: 'pcs', price: 5, amount: 55, po_line: 10, po_qty: 12, po_price: 5 },
    { no: 3, desc: 'C', qty: 4, unit: 'pcs', price: 10, amount: 40, po_line: 20, po_qty: 4, po_price: 12 },
    { no: 4, desc: 'D', qty: 1, unit: 'pcs', price: 7, amount: 7, po_line: 30, po_qty: 1, po_price: 7 },
  ]
  const doc = { doc: 'DMS-9', pages: 1, rules: [], lines } as unknown as InvoiceDoc

  it('flags rows whose own arithmetic does not add up (V-02)', () => {
    expect(mockLineNumbersForRule(doc, 'V-02')).toEqual([2])
  })

  it('flags receipt price mismatch for V-07', () => {
    expect(mockLineNumbersForRule(doc, 'V-07')).toEqual([3])
  })

  it('flags receipt quantity mismatch for V-08', () => {
    expect(mockLineNumbersForRule(doc, 'V-08')).toEqual([2])
  })

  it('never flags rows the Engine did not evaluate', () => {
    const noReceipt = {
      ...doc,
      lines: [{ no: 1, desc: 'A', qty: 10, unit: 'pcs', price: 5, amount: 50 }],
    } as unknown as InvoiceDoc
    expect(mockLineNumbersForRule(noReceipt, 'V-07')).toEqual([])
    expect(mockLineNumbersForRule(noReceipt, 'V-08')).toEqual([])
  })

  it('returns nothing for region-level rules', () => {
    expect(mockLineNumbersForRule(doc, 'V-03')).toEqual([])
    expect(mockLineNumbersForRule(doc, 'V-99')).toEqual([])
  })
})

describe('mockEvidenceViewerBBoxes', () => {
  const regions: Record<string, [number, number, number, number]> = {
    header: [0.55, 0.08, 0.35, 0.1],
    supplier: [0.06, 0.06, 0.4, 0.12],
    customer: [0.06, 0.22, 0.4, 0.07],
    lines: [0.05, 0.35, 0.9, 0.25],
    totals: [0.6, 0.63, 0.35, 0.08],
    sig_rcv: [0.06, 0.8, 0.28, 0.08],
    sig_sup: [0.4, 0.8, 0.28, 0.08],
    line2: [0.05, 0.4, 0.9, 0.02],
    line3: [0.05, 0.42, 0.9, 0.02],
  }
  const failingDoc = {
    doc: 'DMS-9',
    pages: 1,
    rules: [
      { id: 'V-03', rule: 'V-03', name: 'ยอดรวม', status: 'FAIL', result: 'fail', exception_code: 'E03', severity: 'High' },
      { id: 'V-06', rule: 'V-06', name: 'ลายเซ็น', status: 'WARN', result: 'manual_review', exception_code: 'E08', severity: 'High' },
      { id: 'V-01', rule: 'V-01', name: 'ฟิลด์บังคับ', status: 'PASS', result: 'pass' },
    ],
    lines: [],
  } as unknown as InvoiceDoc

  it('draws boxes only for rules that produced evidence', () => {
    const out = mockEvidenceViewerBBoxes({ doc: failingDoc, regions })
    expect(out.map(b => b.ruleId).sort()).toEqual(['V-03', 'V-06', 'V-06'])
    expect(out.every(b => b.origin === 'mock-region')).toBe(true)
    expect(out.every(b => b.pageNo === 1)).toBe(true)
  })

  it('uses the region geometry that was measured', () => {
    const out = mockEvidenceViewerBBoxes({ doc: failingDoc, regions })
    const totals = out.find(b => b.ruleId === 'V-03')!
    expect(totals.bbox).toEqual(regions.totals)
    expect(totals.id).toBe('mock:V-03:totals')
    expect(out.filter(b => b.ruleId === 'V-06').map(b => b.id).sort()).toEqual([
      'mock:V-06:sig_rcv',
      'mock:V-06:sig_sup',
    ])
  })

  it('skips rules whose regions were never measured', () => {
    const partial = { ...regions }
    delete (partial as Record<string, unknown>).totals
    const out = mockEvidenceViewerBBoxes({ doc: failingDoc, regions: partial })
    expect(out.map(b => b.ruleId)).toEqual(['V-06', 'V-06'])
  })

  it('prefers the measured row box when the rule names specific lines', () => {
    const doc = {
      ...failingDoc,
      rules: [
        { id: 'V-07', rule: 'V-07', name: 'รายบรรทัด', status: 'FAIL', result: 'fail', exception_code: 'E10', severity: 'High' },
      ],
      lines: [
        { no: 1, desc: 'A', qty: 1, unit: 'p', price: 1, amount: 1, po_line: 1, po_qty: 1, po_price: 1 },
        { no: 2, desc: 'B', qty: 1, unit: 'p', price: 1, amount: 1, po_line: 2, po_qty: 1, po_price: 2 },
        { no: 3, desc: 'C', qty: 1, unit: 'p', price: 2, amount: 2, po_line: 3, po_qty: 1, po_price: 3 },
      ],
    } as unknown as InvoiceDoc
    const out = mockEvidenceViewerBBoxes({ doc, regions })
    expect(out.map(b => b.id)).toEqual(['mock:V-07:line2', 'mock:V-07:line3'])
    expect(out[0].lineNo).toBe(2)
    expect(out[0].bbox).toEqual(regions.line2)
  })

  it('falls back to the whole table when individual rows were not measured', () => {
    const partial = { ...regions } as Record<string, unknown>
    delete partial.line2
    delete partial.line3
    const doc = {
      ...failingDoc,
      rules: [
        { id: 'V-02', rule: 'V-02', name: 'คณิตศาสตร์', status: 'FAIL', result: 'fail', exception_code: 'E02', severity: 'High' },
      ],
      lines: [{ no: 2, desc: 'B', qty: 1, unit: 'p', price: 1, amount: 2 }],
    } as unknown as InvoiceDoc
    const out = mockEvidenceViewerBBoxes({ doc, regions: partial as Record<string, [number, number, number, number]> })
    expect(out.map(b => b.id)).toEqual(['mock:V-02:lines'])
  })

  it('labels the box with the exception code and its catalog name', () => {
    const out = mockEvidenceViewerBBoxes({
      doc: failingDoc,
      regions,
      labelOf: code => (code === 'E03' ? 'Total Mismatch' : undefined),
    })
    expect(out.find(b => b.ruleId === 'V-03')!.label).toBe('E03 · Total Mismatch')
    // No catalog entry → still a usable tag.
    expect(out.find(b => b.ruleId === 'V-06')!.label).toBe('E08')
    expect(out.find(b => b.ruleId === 'V-03')!.severity).toBe('High')
  })

  it('returns nothing without rules or without measurements', () => {
    expect(mockEvidenceViewerBBoxes({ doc: { ...failingDoc, rules: [] } as unknown as InvoiceDoc, regions })).toEqual([])
    expect(mockEvidenceViewerBBoxes({ doc: failingDoc, regions: {} })).toEqual([])
  })

  it('feeds straight into the projector, so both modes share one pipeline', () => {
    const boxes = mockEvidenceViewerBBoxes({ doc: failingDoc, regions })
    const out = projectOverlayBoxes(boxes, { page: 1, pageSize: A4, focusRuleId: 'V-03' })
    expect(out).toHaveLength(3)
    expect(out.filter(b => b.focused).map(b => b.ruleId)).toEqual(['V-03'])
    expect(out.filter(b => b.tag).map(b => b.tag).sort()).toEqual(['E03', 'E08'])
  })
})