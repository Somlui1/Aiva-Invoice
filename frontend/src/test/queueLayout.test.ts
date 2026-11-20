/**
 * v5.17 — adaptive 3-pane layout solver (queue · detail · PDF). Pure functions, no DOM.
 */
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LAYOUT_PREFS,
  MAX_PDF,
  MIN_DETAIL,
  MIN_PDF,
  ageInDays,
  autoQueueWidth,
  densityFor,
  isOverdue,
  midTrim,
  sanitizeLayoutPrefs,
  shortStatus,
  snapQueueWidth,
  solveQueueLayout,
  type LayoutPrefs,
} from '../lib/queueLayout'

const P = (over: Partial<LayoutPrefs> = {}): LayoutPrefs => ({ ...DEFAULT_LAYOUT_PREFS, ...over })

describe('queue density and auto width', () => {
  it('maps a column width to the row layout', () => {
    expect(densityFor(420)).toBe('full')
    expect(densityFor(340)).toBe('full')
    expect(densityFor(339)).toBe('compact')
    expect(densityFor(220)).toBe('compact')
    expect(densityFor(219)).toBe('slim')
    expect(densityFor(96)).toBe('slim')
    expect(densityFor(95)).toBe('edge')
  })
  it('auto width follows the work area', () => {
    expect(autoQueueWidth(1920)).toBe(360)
    expect(autoQueueWidth(1440)).toBe(260)
    expect(autoQueueWidth(1024)).toBe(160)
    expect(autoQueueWidth(900)).toBe(0)
  })
  it('snaps a dragged width, collapses below 96px', () => {
    expect(snapQueueWidth(150)).toEqual({ mode: 'slim', width: 160 })
    expect(snapQueueWidth(281)).toEqual({ mode: 'compact', width: 260 })
    expect(snapQueueWidth(372)).toEqual({ mode: 'full', width: 360 })
    expect(snapQueueWidth(200)).toEqual({ mode: 'custom', width: 200 })
    expect(snapQueueWidth(60)).toEqual({ mode: 'edge', width: 0 })
    expect(snapQueueWidth(999)).toEqual({ mode: 'custom', width: 420 })
  })
})

describe('solveQueueLayout', () => {
  it('PDF closed: the queue is a full column whatever the PDF-time mode is', () => {
    const l = solveQueueLayout({ workWidth: 1300, pdfOpen: false, prefs: P({ mode: 'edge' }), ratio: 0.4 })
    expect(l).toMatchObject({ queue: 'panel', queueWidth: 360, density: 'full', detailHidden: false })
  })

  it('PDF open, default: three panes, queue by screen width', () => {
    const l = solveQueueLayout({ workWidth: 1440, pdfOpen: true, prefs: P(), ratio: 0.4 })
    expect(l.queue).toBe('panel')
    expect(l.queueWidth).toBe(260)
    expect(l.density).toBe('compact')
    expect(l.detailHidden).toBe(false)
    expect(l.railClosesPdf).toBe(false)
  })

  it('width unknown (jsdom / first paint): no pixel limits, requested ratio kept', () => {
    const l = solveQueueLayout({ workWidth: 0, pdfOpen: true, prefs: P(), ratio: 0.4 })
    expect(l).toMatchObject({ queue: 'panel', queueWidth: 260, ratio: 0.4, detailHidden: false })
  })

  it('legacy mode: opening the PDF hides the queue behind a rail that closes the PDF', () => {
    const l = solveQueueLayout({ workWidth: 1440, pdfOpen: true, prefs: P({ pdfHidesQueue: true }), ratio: 0.4 })
    expect(l).toMatchObject({ queue: 'rail', queueWidth: 0, railClosesPdf: true })
  })

  it('a preference that does not fit is downgraded for now, not rewritten', () => {
    const prefs = P({ mode: 'full' })
    const l = solveQueueLayout({ workWidth: 1100, pdfOpen: true, prefs, ratio: 0.4 })
    expect(l.queueWidth).toBe(160)
    expect(l.notes.length).toBeGreaterThan(0)
    expect(prefs.mode).toBe('full')
    expect(solveQueueLayout({ workWidth: 1920, pdfOpen: true, prefs, ratio: 0.4 }).queueWidth).toBe(360)
  })

  it('too narrow even for rail + detail + PDF: the PDF replaces the detail', () => {
    const l = solveQueueLayout({ workWidth: 820, pdfOpen: true, prefs: P(), ratio: 0.4 })
    expect(l.queue).toBe('rail')
    expect(l.detailHidden).toBe(true)
  })

  it('keeps detail ≥ 440 and PDF between 360 and 900', () => {
    for (const W of [1000, 1200, 1366, 1440, 1600, 1920, 2560]) {
      for (const ratio of [0.2, 0.38, 0.5, 0.62, 0.8]) {
        const l = solveQueueLayout({ workWidth: W, pdfOpen: true, prefs: P(), ratio })
        if (l.detailHidden) continue
        const R = W - (l.queue === 'panel' ? l.queueWidth : 36)
        const pdf = R * l.ratio
        expect(pdf).toBeGreaterThanOrEqual(MIN_PDF - 1)
        expect(pdf).toBeLessThanOrEqual(MAX_PDF + 1)
        expect(R - pdf).toBeGreaterThanOrEqual(MIN_DETAIL - 1)
      }
    }
  })

  it('user turned the detail off: PDF only next to the queue', () => {
    const l = solveQueueLayout({ workWidth: 1440, pdfOpen: true, prefs: P({ showDetail: false }), ratio: 0.4 })
    expect(l).toMatchObject({ queue: 'panel', detailHidden: true })
  })
})

describe('stored preference', () => {
  it('drops unknown or broken values', () => {
    expect(sanitizeLayoutPrefs(null)).toEqual(DEFAULT_LAYOUT_PREFS)
    expect(sanitizeLayoutPrefs({ mode: 'huge', ratio: 9, customWidth: 'x', showDetail: 'yes' })).toEqual({
      ...DEFAULT_LAYOUT_PREFS,
      ratio: 0.8,
    })
    expect(sanitizeLayoutPrefs({ mode: 'slim', ratio: 0.55, pdfHidesQueue: true, customWidth: 10 })).toMatchObject({
      mode: 'slim',
      ratio: 0.55,
      pdfHidesQueue: true,
      customWidth: 96,
    })
  })
})

describe('row text helpers', () => {
  it('shortens ids in the middle, keeping the tail', () => {
    expect(midTrim('429075', 20)).toBe('429075')
    const t = midTrim('TLP-IV-69-09-0006', 12)
    expect(t.length).toBe(12)
    expect(t.endsWith('-0006')).toBe(true)
    expect(t).toContain('…')
  })
  it('short status labels', () => {
    expect(shortStatus('Manual Review')).toBe('Manual')
    expect(shortStatus('Auto-pass')).toBe('Auto')
    expect(shortStatus('Hold')).toBe('Hold')
  })
  it('age and overdue follow the queue rule (Auto-pass is never overdue)', () => {
    expect(ageInDays('2026-11-07', '2026-11-19')).toBe(12)
    expect(ageInDays('2026-11-20', '2026-11-19')).toBe(0)
    expect(isOverdue('Hold', 12, 7)).toBe(true)
    expect(isOverdue('Review', 7, 7)).toBe(false)
    expect(isOverdue('Auto-pass', 30, 7)).toBe(false)
  })
})
