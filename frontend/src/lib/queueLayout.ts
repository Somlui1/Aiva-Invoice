/**
 * v5.17 — Adaptive 3-pane layout for the queue page (queue · detail · PDF).
 *
 * Pure functions only: no React, no DOM. QueuePage measures the width of `.work` and asks
 * `solveQueueLayout` what to show; the user's choices (LayoutPrefs) are never rewritten by the
 * result — "preference" is what the user set, "effective" is what fits on this screen now.
 *
 * Wireframe: AIVA-Adaptive-3Pane-Wireframe-v6.html (session 2026-11-19).
 */

export type QueueMode = 'auto' | 'full' | 'compact' | 'slim' | 'edge' | 'custom'
export type QueueDensity = 'full' | 'compact' | 'slim'

export interface LayoutPrefs {
  v: 1
  /** How wide the queue is while the PDF is open. `custom` = dragged to `customWidth`. */
  mode: QueueMode
  customWidth: number
  /** The PDF dock's share of the space next to the queue (detail gets the rest). */
  ratio: number
  /** false = while the PDF is open, show only the PDF (the detail column steps aside). */
  showDetail: boolean
  /** true = the pre-v5.17 behaviour: opening the PDF hides the queue behind a rail. */
  pdfHidesQueue: boolean
}

export const DEFAULT_LAYOUT_PREFS: Readonly<LayoutPrefs> = Object.freeze({
  v: 1,
  mode: 'auto',
  customWidth: 260,
  ratio: 0.4,
  showDetail: true,
  pdfHidesQueue: false,
})

/** Snap targets of the queue splitter, and the width each fixed mode uses. */
export const QUEUE_SNAP: Readonly<Record<QueueDensity, number>> = Object.freeze({ full: 360, compact: 260, slim: 160 })
export const QUEUE_SNAP_TOLERANCE = 24
/** Dropping the queue splitter below this collapses the queue to the rail. */
export const QUEUE_COLLAPSE_BELOW = 96
export const QUEUE_MAX = 420
/** Width of the queue when it opens over the PDF from the rail (a flyout, not a column). */
export const QUEUE_FLYOUT_WIDTH = 300

export const MIN_DETAIL = 440
export const MIN_PDF = 360
export const MAX_PDF = 900
export const RATIO_MIN = 0.2
export const RATIO_MAX = 0.8
/** Presets offered in the layout menu (the PDF's share). */
export const RATIO_PRESETS = Object.freeze({ data: 0.38, balanced: 0.5, pdf: 0.62 })

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Which row layout a queue column of `width` px gets. Below the collapse limit there is no column. */
export function densityFor(width: number): QueueDensity | 'edge' {
  if (width >= 340) return 'full'
  if (width >= 220) return 'compact'
  if (width >= QUEUE_COLLAPSE_BELOW) return 'slim'
  return 'edge'
}

/** Automatic queue width while the PDF is open, from the width of the work area. */
export function autoQueueWidth(workWidth: number): number {
  if (workWidth >= 1720) return QUEUE_SNAP.full
  if (workWidth >= 1360) return QUEUE_SNAP.compact
  if (workWidth >= 976) return QUEUE_SNAP.slim
  return 0
}

/** Where a dragged queue width lands: a snap target when close to one, 0 (rail) when too narrow. */
export function snapQueueWidth(width: number): { mode: QueueMode; width: number } {
  if (width < QUEUE_COLLAPSE_BELOW) return { mode: 'edge', width: 0 }
  for (const d of ['slim', 'compact', 'full'] as const) {
    if (Math.abs(width - QUEUE_SNAP[d]) <= QUEUE_SNAP_TOLERANCE) return { mode: d, width: QUEUE_SNAP[d] }
  }
  return { mode: 'custom', width: Math.round(clamp(width, QUEUE_COLLAPSE_BELOW, QUEUE_MAX)) }
}

/** The queue width the user asked for (before the screen has a say). 0 = rail. */
export function requestedQueueWidth(prefs: LayoutPrefs, workWidth: number, pdfOpen: boolean): number {
  if (!pdfOpen) {
    // Without the PDF the queue has room: fixed modes keep their size, everything else is full.
    if (prefs.mode === 'compact' || prefs.mode === 'slim') return QUEUE_SNAP[prefs.mode]
    if (prefs.mode === 'custom') return clamp(prefs.customWidth, QUEUE_COLLAPSE_BELOW, QUEUE_MAX)
    return QUEUE_SNAP.full
  }
  if (prefs.pdfHidesQueue) return 0
  switch (prefs.mode) {
    case 'auto':
      // width unknown (first paint, tests without layout): assume a normal desktop
      return workWidth > 0 ? autoQueueWidth(workWidth) : QUEUE_SNAP.compact
    case 'edge':
      return 0
    case 'custom':
      return clamp(prefs.customWidth, QUEUE_COLLAPSE_BELOW, QUEUE_MAX)
    default:
      return QUEUE_SNAP[prefs.mode]
  }
}

export interface QueueLayout {
  /** `panel` = a queue column · `rail` = the thin rail (click = flyout, or close the PDF in legacy mode). */
  queue: 'panel' | 'rail'
  queueWidth: number
  density: QueueDensity
  /** The PDF's effective share of the space next to the queue (respects the pixel limits). */
  ratio: number
  /** PDF open but no room / no wish for the detail column next to it. */
  detailHidden: boolean
  /** legacy rail: clicking it closes the PDF (pre-v5.17) instead of opening the flyout. */
  railClosesPdf: boolean
  /** Why the effective layout differs from the preference (shown in the layout menu). */
  notes: string[]
}

export interface SolveInput {
  /** Width of `.work` in layout px; 0 = not measured (jsdom, first paint) → no pixel limits. */
  workWidth: number
  pdfOpen: boolean
  prefs: LayoutPrefs
  /** The PDF share as stored in InvoiceContext (`dockSplitRatio`). */
  ratio: number
}

const RAIL_W = 36

export function solveQueueLayout({ workWidth, pdfOpen, prefs, ratio }: SolveInput): QueueLayout {
  const notes: string[] = []
  const want = clamp(ratio, RATIO_MIN, RATIO_MAX)
  let qw = requestedQueueWidth(prefs, workWidth, pdfOpen)
  const legacy = pdfOpen && prefs.pdfHidesQueue

  if (!pdfOpen) {
    return {
      queue: 'panel',
      queueWidth: qw,
      density: densityFor(qw) === 'edge' ? 'slim' : (densityFor(qw) as QueueDensity),
      ratio: want,
      detailHidden: false,
      railClosesPdf: false,
      notes,
    }
  }

  const known = workWidth > 0
  const wantsDetail = prefs.showDetail
  const need = wantsDetail ? MIN_DETAIL + MIN_PDF : MIN_PDF
  const rest = () => workWidth - (qw > 0 ? qw : RAIL_W)

  if (known && qw > QUEUE_SNAP.slim && rest() < need) {
    qw = QUEUE_SNAP.slim
    notes.push('พื้นที่ไม่พอ → คิวลดเป็น Slim ชั่วคราว')
  }
  if (known && qw > 0 && rest() < need) {
    qw = 0
    notes.push('พื้นที่ไม่พอ → คิวพับเป็นแถบด้านซ้ายชั่วคราว')
  }

  let detailHidden = !wantsDetail
  let eff = want
  if (known && wantsDetail) {
    const R = rest()
    if (R < MIN_DETAIL + MIN_PDF) {
      // Not even rail + both columns fit: the PDF replaces the detail (close the PDF to get it back),
      // the same rule the narrow-screen layout has always had.
      detailHidden = true
      notes.push('พื้นที่ไม่พอวางผลตรวจคู่กับ PDF → แสดงทีละส่วน (ปิด PDF เพื่อกลับไปที่ผลตรวจ)')
    } else {
      let pdf = R * want
      if (pdf < MIN_PDF) {
        pdf = MIN_PDF
        notes.push(`PDF ต่ำกว่า ${MIN_PDF}px → ยืมพื้นที่จากผลตรวจ`)
      }
      if (R - pdf < MIN_DETAIL) {
        pdf = R - MIN_DETAIL
        notes.push(`ผลตรวจต่ำกว่า ${MIN_DETAIL}px → ยืมพื้นที่จาก PDF`)
      }
      if (pdf > MAX_PDF) {
        pdf = MAX_PDF
        notes.push(`PDF เกิน ${MAX_PDF}px → คืนพื้นที่ให้ผลตรวจ`)
      }
      eff = pdf / R
    }
  }

  const d = densityFor(qw)
  return {
    queue: qw > 0 ? 'panel' : 'rail',
    queueWidth: qw,
    density: d === 'edge' ? 'compact' : d,
    ratio: Math.round(eff * 1000) / 1000,
    detailHidden,
    railClosesPdf: legacy,
    notes,
  }
}

/** Read whatever is stored, keep only known fields with sane values. */
export function sanitizeLayoutPrefs(raw: unknown): LayoutPrefs {
  const p: LayoutPrefs = { ...DEFAULT_LAYOUT_PREFS }
  if (!raw || typeof raw !== 'object') return p
  const r = raw as Record<string, unknown>
  const modes: QueueMode[] = ['auto', 'full', 'compact', 'slim', 'edge', 'custom']
  if (typeof r.mode === 'string' && modes.includes(r.mode as QueueMode)) p.mode = r.mode as QueueMode
  if (typeof r.customWidth === 'number' && Number.isFinite(r.customWidth))
    p.customWidth = Math.round(clamp(r.customWidth, QUEUE_COLLAPSE_BELOW, QUEUE_MAX))
  if (typeof r.ratio === 'number' && Number.isFinite(r.ratio)) p.ratio = clamp(r.ratio, RATIO_MIN, RATIO_MAX)
  if (typeof r.showDetail === 'boolean') p.showDetail = r.showDetail
  if (typeof r.pdfHidesQueue === 'boolean') p.pdfHidesQueue = r.pdfHidesQueue
  return p
}

/**
 * Shorten an id in the middle, keeping the tail (invoices of one supplier differ at the end):
 * `TLP-IV-69-09-0006` → `TLP-IV…09-0006`. Returns the text unchanged when it fits.
 */
export function midTrim(text: string, maxChars: number): string {
  const s = String(text ?? '')
  const n = Math.max(5, Math.floor(maxChars))
  if (s.length <= n) return s
  const tail = Math.min(5, Math.floor((n - 1) / 2))
  return `${s.slice(0, n - 1 - tail)}…${s.slice(-tail)}`
}

/** Short status label for narrow rows (the full name stays in the tooltip). */
export function shortStatus(status: string): string {
  const map: Record<string, string> = {
    'Manual Review': 'Manual',
    'Auto-pass': 'Auto',
    'Import Failed': 'Import',
  }
  return map[status] ?? status
}

/** Days since `up` (YYYY-MM-DD) up to `today`; the same arithmetic the queue row has always used. */
export function ageInDays(up: string, today: string): number {
  const a = new Date(`${today}T00:00:00Z`).getTime()
  const b = new Date(`${String(up).slice(0, 10)}T00:00:00Z`).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.max(0, Math.round((a - b) / 864e5))
}

/** "เกินกำหนด": a document still waiting for a person, older than the org's staleDays. */
export function isOverdue(status: string, age: number, staleDays: number): boolean {
  return ['Review', 'Hold', 'Manual Review', 'Duplicate'].includes(status) && age > staleDays
}
