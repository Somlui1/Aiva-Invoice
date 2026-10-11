/**
 * Bounding-box model for the evidence overlay (design §4.2 / §4.3).
 *
 * Both viewer modes end up in the same shape: a `ViewerBBox[]` that
 * `projectOverlayBoxes()` turns into positioned `OverlayBox[]`.
 *
 *   • real PDF  → `viewerBoxesFromInvoiceDoc()` (rule boxes + the Engine's OCR
 *                 elements and evidence links, kept in `raw_payload`)
 *   • mock page → `mockEvidenceViewerBBoxes()` (regions measured off
 *                 `EvidenceCanvas`, mapped rule → region exactly like the
 *                 mockup's `regions()` helper)
 *
 * Keeping one pipeline means the overlay, the click/focus linking and the
 * colouring behave identically whichever surface is showing the document.
 */
import type { ExceptionSeverity, InvoiceDoc, RuleCheck } from '../../../types/invoice'
import {
  expandPixelBox,
  normalizedToPixelBox,
  normalizeBBox,
  rotateNormalizedBox,
  type NormalizedBBox,
  type PixelBox,
  type SizeBox,
} from './coordinateTransform'
import { getValidationCategory, type ValidationCategory } from './validationCategories'

export type ViewerBBoxOrigin = 'rule' | 'engine' | 'mock-region'

/** One box as the viewer understands it, before projection onto pixels. */
export interface ViewerBBox {
  /** Stable key, also used to focus a single box. */
  id: string
  pageNo: number
  /** `[x, y, w, h]` normalised 0..1, top-left origin, on the rotated page. */
  bbox: NormalizedBBox
  origin: ViewerBBoxOrigin
  ruleId?: string
  exceptionCode?: string
  severity?: ExceptionSeverity
  /** Rich tag text (`E10 · ยอดไม่ตรง`); the short tag is derived when drawing. */
  label?: string | null
  fieldName?: string | null
  value?: string | null
  confidence?: number | null
  elementType?: string | null
  /** Table row this box belongs to, for PDF → detail-pane row highlighting. */
  lineNo?: number
}

/** A box positioned in the CSS pixels of the page surface. */
export interface OverlayBox extends PixelBox {
  id: string
  pageNo: number
  ruleId?: string
  lineNo?: number
  severity: ExceptionSeverity
  category?: ValidationCategory
  /** Tag text, set on one box per rule only (the mockup does the same). */
  tag: string | null
  tooltip: string
  focused: boolean
  elementType?: string | null
}

export interface ProjectOptions {
  /** Page currently shown; boxes from other pages are dropped. */
  page: number
  /** CSS pixel size of the page surface — this is where zoom lives. */
  pageSize: SizeBox
  /** Viewer rotation (degrees). The page's own `/Rotate` is already in the coordinates. */
  rotation?: number
  /** Grow every box by this many CSS px, then keep it on the page. */
  padding?: number
  /** Highlight all boxes of a rule (detail pane → PDF). */
  focusRuleId?: string | null
  /** Highlight exactly one box; wins over `focusRuleId`. */
  focusId?: string | null
  /** Draw only boxes tied to a rule. Default `false` — the caller sets the policy. */
  onlyEvidence?: boolean
  /** Filter to only display boxes belonging to this specific validation rule. */
  activeRuleId?: string | null
  /** Optional exception code to further scope the active validation. */
  activeExceptionCode?: string | null
}

/** Rules that point at whole regions of the mock page rather than at rows. */
export const RULE_REGION_KEYS: Readonly<Record<string, string[]>> = Object.freeze({
  'V-01': ['header'],
  'V-02': ['lines'],
  'V-03': ['totals'],
  'V-04': ['supplier', 'header'],
  'V-05': ['customer'],
  'V-06': ['sig_rcv', 'sig_sup'],
  'V-07': ['lines'],
  'V-08': ['lines'],
  'V-09': ['totals'],
})

/** Thai region names, for the tooltip in mock mode. */
export const REGION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  header: 'หัวเอกสาร',
  supplier: 'ผู้ขาย',
  customer: 'ลูกค้า',
  po: 'PO / Release',
  lines: 'ตารางรายการ',
  totals: 'ยอดรวม',
  signatures: 'ลายเซ็น',
  sig_rcv: 'ลายเซ็นผู้รับของ',
  sig_sup: 'ลายเซ็นผู้ส่งของ',
})

/** Rules that produced evidence, mirroring `evidenceOf()` in the mockup. */
function ruleHasEvidence(r: RuleCheck): boolean {
  return r.result === 'fail' || r.result === 'manual_review' || r.status === 'FAIL' || r.status === 'WARN'
}

function tagLabel(
  exceptionCode: string | undefined,
  ruleId: string | undefined,
  labelOf?: (code?: string) => string | undefined,
): string | null {
  if (exceptionCode) {
    const name = labelOf?.(exceptionCode)
    return name ? `${exceptionCode} · ${name}` : exceptionCode
  }
  return ruleId ?? null
}

const shortTag = (b: ViewerBBox): string | null => b.exceptionCode ?? b.ruleId ?? null

const area = (b: PixelBox): number => b.width * b.height

function tooltipOf(b: ViewerBBox): string {
  const parts: string[] = []
  const name = b.fieldName ?? REGION_LABELS[b.id.split(':').pop() ?? '']
  if (name) parts.push(name)
  if (b.value != null && b.value !== '') parts.push(String(b.value))
  if (typeof b.confidence === 'number' && Number.isFinite(b.confidence)) {
    parts.push(`${Math.round(b.confidence * 100)}%`)
  }
  return parts.join(' · ')
}

/**
 * Turn a `ViewerBBox[]` into the boxes to draw on the page that is showing.
 *
 * Order matters: the result is sorted largest-first so a cell box painted after
 * its enclosing row box stays on top of it and keeps its own hover/click.
 */
export function projectOverlayBoxes(boxes: ViewerBBox[], opts: ProjectOptions): OverlayBox[] {
  // The projector draws what it is handed; *which* boxes to hand it (evidence
  // only, or every OCR field) is the dock's business.
  const onlyEvidence = opts.onlyEvidence ?? false
  const padding = opts.padding ?? 0
  const rotation = opts.rotation ?? 0
  const activeRule = opts.activeRuleId ?? null
  const activeCode = opts.activeExceptionCode ?? null

  const placed: Array<OverlayBox & { viewer: ViewerBBox }> = []
  for (const b of boxes) {
    if (!b || b.pageNo !== opts.page) continue
    if (onlyEvidence && !b.ruleId) continue

    if (activeRule) {
      const matchRule =
        b.ruleId === activeRule ||
        b.id === activeRule ||
        (b.id && b.id.includes(`:${activeRule}`)) ||
        (b.ruleId && (activeRule.startsWith(b.ruleId) || b.ruleId.startsWith(activeRule)))
      if (!matchRule) continue
    }
    if (activeCode && b.exceptionCode && b.exceptionCode !== activeCode) continue

    const norm = normalizeBBox(b.bbox)
    if (!norm) continue
    const raw = normalizedToPixelBox(rotateNormalizedBox(norm, rotation), opts.pageSize)
    if (!raw || raw.width <= 0 || raw.height <= 0) continue

    const px = expandPixelBox(raw, padding, opts.pageSize)
    if (px.width <= 0 || px.height <= 0) continue

    placed.push({
      ...px,
      id: b.id,
      pageNo: b.pageNo,
      ruleId: b.ruleId,
      lineNo: b.lineNo,
      severity: b.severity ?? 'Medium',
      category: getValidationCategory(b.exceptionCode, b.ruleId),
      tag: null,
      tooltip: tooltipOf(b),
      focused: false,
      elementType: b.elementType,
      viewer: b,
    })
  }

  placed.sort((a, b) => area(b) - area(a) || a.id.localeCompare(b.id))

  // One tag per rule, on its largest box — the mockup does the same so a rule
  // that flags five rows shows one legend chip, not five.
  const taggedRules = new Set<string>()
  for (const box of placed) {
    const ruleKey = box.ruleId ?? box.id
    if (!taggedRules.has(ruleKey)) {
      taggedRules.add(ruleKey)
      box.tag = shortTag(box.viewer)
    }
    box.focused = !!opts.focusId
      ? box.id === opts.focusId
      : activeRule
        ? true
        : !!opts.focusRuleId && box.ruleId === opts.focusRuleId
  }

  return placed.map(({ viewer: _viewer, ...box }) => box)
}

// ---------------------------------------------------------------------------
// Mode 1 — the real PDF: boxes supplied by the Engine
// ---------------------------------------------------------------------------

interface EngineElementLite {
  element_id?: string
  document_id?: string
  page_no?: number
  element_type?: string
  field_name?: string | null
  raw_value?: string | null
  normalized_value?: string | number | null
  confidence?: number | null
  bbox?: unknown
}

interface EngineEvidenceLite {
  rule_id?: string
  exception_code?: string
  severity?: ExceptionSeverity
  bboxes?: Array<{ element_id?: string; page_no?: number; bbox?: unknown }>
}

interface EnginePayloadLite {
  ocr?: { elements?: EngineElementLite[] }
  evidence?: EngineEvidenceLite[]
}

export interface ViewerBBoxOptions {
  /** Resolve an exception code to its catalog name for the tag text. */
  labelOf?: (code?: string) => string | undefined
}

/**
 * Boxes available for a queue document.
 *
 * Reads two sources, in this order of trust: `rules[].bbox` (a rule that carries
 * its own coordinates) and the raw Engine result kept with the document, whose
 * `evidence[].bboxes` tie OCR elements to a rule/exception. Page-level container
 * elements are skipped — they cover the whole page and would hide every box
 * drawn on top of them.
 */
export function viewerBoxesFromInvoiceDoc(doc: InvoiceDoc, opts: ViewerBBoxOptions = {}): ViewerBBox[] {
  const out: ViewerBBox[] = []
  const seen = new Set<string>()
  const push = (b: ViewerBBox): void => {
    if (seen.has(b.id)) return
    seen.add(b.id)
    out.push(b)
  }

  for (const r of doc.rules ?? []) {
    const bb = r.bbox
    if (!bb || !(bb.w > 0) || !(bb.h > 0)) continue
    const bbox = normalizeBBox([bb.x, bb.y, bb.w, bb.h])
    if (!bbox) continue
    const ruleId = r.rule || r.id
    push({
      id: `${doc.doc}:${ruleId ?? r.id}`,
      pageNo: bb.page ?? r.page ?? 1,
      bbox,
      origin: 'rule',
      ruleId,
      exceptionCode: r.exception_code,
      severity: r.severity,
      label: tagLabel(r.exception_code, ruleId, opts.labelOf),
      value: r.actual != null ? String(r.actual) : r.evidence ?? null,
    })
  }

  const raw = (doc.raw_payload ?? undefined) as EnginePayloadLite | undefined
  if (!raw || typeof raw !== 'object') return out

  // Which rule/exception each OCR element is evidence for.
  const links = new Map<string, EngineEvidenceLite>()
  for (const ev of raw.evidence ?? []) {
    for (const b of ev?.bboxes ?? []) {
      const key = b?.element_id
      if (key && !links.has(key)) links.set(key, ev)
    }
  }

  for (const el of raw.ocr?.elements ?? []) {
    const id = el?.element_id
    const bbox = normalizeBBox(el?.bbox)
    if (!id || !bbox) continue
    if (el.element_type === 'page') continue // full-page container, not a field
    const link = links.get(id)
    const value = el.raw_value ?? el.normalized_value
    push({
      id: `${doc.doc}:${id}`,
      pageNo: el.page_no ?? 1,
      bbox,
      origin: 'engine',
      ruleId: link?.rule_id,
      exceptionCode: link?.exception_code,
      severity: link?.severity,
      label: tagLabel(link?.exception_code, link?.rule_id, opts.labelOf),
      fieldName: el.field_name ?? null,
      value: value == null ? null : String(value),
      confidence: typeof el.confidence === 'number' ? el.confidence : null,
      elementType: el.element_type ?? null,
    })
  }

  // Evidence whose element is missing from `ocr.elements` must still be drawn.
  for (const ev of raw.evidence ?? []) {
    for (const b of ev?.bboxes ?? []) {
      const bbox = normalizeBBox(b?.bbox)
      if (!b?.element_id || !bbox) continue
      push({
        id: `${doc.doc}:${b.element_id}`,
        pageNo: b.page_no ?? 1,
        bbox,
        origin: 'engine',
        ruleId: ev?.rule_id,
        exceptionCode: ev?.exception_code,
        severity: ev?.severity,
        label: tagLabel(ev?.exception_code, ev?.rule_id, opts.labelOf),
      })
    }
  }

  return out
}

// ---------------------------------------------------------------------------
// Mode 2 — the mock page: boxes measured from `EvidenceCanvas`
// ---------------------------------------------------------------------------

export interface MockEvidenceInput {
  doc: InvoiceDoc
  /** Region key → normalised box, measured from the rendered mock page. */
  regions: Record<string, NormalizedBBox>
  labelOf?: (code?: string) => string | undefined
  /** The simulated page is always page 1. */
  page?: number
}

/**
 * Rows a line-level rule disagrees about — the React port of the mockup's
 * `regions()`.
 *
 * `po_qty`/`po_price` on `InvoiceDoc` hold the *receipt* figures (see
 * `src/mock/initialDocs.ts`), and a row without `po_line` was never evaluated by
 * the Engine, so it can never be flagged.
 */
export function mockLineNumbersForRule(doc: InvoiceDoc, ruleId: string): number[] {
  const lines = doc.lines ?? []
  const out: number[] = []
  lines.forEach((l, i) => {
    const no = l.no ?? i + 1
    if (ruleId === 'V-02') {
      if (Math.abs(l.qty * l.price - l.amount) > 0.005) out.push(no)
      return
    }
    if (ruleId !== 'V-07' && ruleId !== 'V-08') return
    if (l.po_line == null) return // not evaluated
    if (ruleId === 'V-07' && l.po_price != null && l.po_price !== l.price) out.push(no)
    if (ruleId === 'V-08' && l.po_qty != null && l.po_qty !== l.qty) out.push(no)
  })
  return out
}

/**
 * Evidence boxes for the simulated page. The regions come from the DOM, so this
 * stays a pure mapping and is testable without a browser.
 */
export function mockEvidenceViewerBBoxes({
  doc,
  regions,
  labelOf,
  page = 1,
}: MockEvidenceInput): ViewerBBox[] {
  const out: ViewerBBox[] = []
  for (const r of doc.rules ?? []) {
    if (!ruleHasEvidence(r)) continue
    const ruleId = r.rule || r.id
    if (!ruleId) continue

    const lineNos = mockLineNumbersForRule(doc, ruleId)
    const rowKeys = lineNos.map(n => `line${n}`).filter(k => !!regions[k])
    const keys = rowKeys.length ? rowKeys : RULE_REGION_KEYS[ruleId] ?? []

    for (const key of keys) {
      const bbox = regions[key]
      if (!bbox) continue
      out.push({
        id: `mock:${ruleId}:${key}`,
        pageNo: page,
        bbox,
        origin: 'mock-region',
        ruleId,
        exceptionCode: r.exception_code,
        severity: r.severity,
        label: tagLabel(r.exception_code, ruleId, labelOf),
        fieldName: REGION_LABELS[key] ?? key,
        lineNo: rowKeys.length ? Number(key.slice(4)) : undefined,
      })
    }
  }
  return out
}
