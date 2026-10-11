/**
 * Coordinate transform for the PDF.js canvas viewer and its BBox overlay
 * (design §4.2).
 *
 * One coordinate system is used everywhere in the Portal: the Engine's
 * `[x, y, w, h]` normalised box, origin **top-left**, measured on the
 * **rotated** page (`engine/src/system_a/perception/coords.py`, which is the
 * frame `pdf_ingest.py` records as `width_pt`/`height_pt` from PyMuPDF's
 * `page.rect`). PDF.js draws in PDF user space (points, origin bottom-left) and
 * the browser paints CSS pixels, so every conversion in either direction lives
 * here rather than inside a component — that is what makes the overlay testable
 * without a DOM (see `src/test/coordinateTransform.test.ts`).
 */

/** `[x, y, w, h]` normalised 0..1, top-left origin. */
export type NormalizedBBox = readonly [number, number, number, number]

export interface SizeBox {
  width: number
  height: number
}

/** A box in the surface's own pixels, positioned from its top-left corner. */
export interface PixelBox {
  left: number
  top: number
  width: number
  height: number
}

/** PDF points (1/72 in) → CSS pixels (1/96 in). */
export const PT_TO_CSS_PX = 96 / 72

/** The mockup's A4 surface (`EvidenceCanvas`, `.evd-page`): 794 × 1123 CSS px. */
export const A4_CSS_SIZE: Readonly<SizeBox> = Object.freeze({ width: 794, height: 1123 })

/**
 * Browsers stop painting past roughly this many device pixels on one edge, so a
 * 4× canvas on a large page would silently render blank.
 */
export const MAX_CANVAS_EDGE = 16384

/** OCR boxes arrive with float dust (0.09999999999999998); 9 dp is below any real resolution. */
const round9 = (n: number): number => Number(n.toFixed(9))

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

/** Shape check for boxes coming from the Engine/DB, before any arithmetic. */
export function isNormalizedBBox(value: unknown): value is NormalizedBBox {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    (value as unknown[]).every(v => typeof v === 'number' && Number.isFinite(v))
  )
}

/**
 * Clip a box to the unit page and return it, or `null` when it cannot be
 * placed at all. Clipping (rather than rejecting) matters because a few Engine
 * boxes touch or overrun the page edge, and dropping them would hide evidence.
 */
export function normalizeBBox(value: unknown): NormalizedBBox | null {
  if (!isNormalizedBBox(value)) return null
  const [x, y, w, h] = value
  if (w < 0 || h < 0) return null

  const left = clamp01(x)
  const top = clamp01(y)
  const right = clamp01(x + w)
  const bottom = clamp01(y + h)
  const width = right - left
  const height = bottom - top
  if (width < 0 || height < 0) return null

  return [round9(left), round9(top), round9(width), round9(height)]
}

/**
 * Normalised box → pixels of the surface that shows the page. The surface size
 * carries the zoom, so the overlay needs no zoom factor of its own.
 */
export function normalizedToPixelBox(bbox: NormalizedBBox, size: SizeBox): PixelBox | null {
  if (!finite(size.width) || !finite(size.height) || size.width <= 0 || size.height <= 0) return null
  const norm = normalizeBBox(bbox)
  if (!norm) return null
  return {
    left: norm[0] * size.width,
    top: norm[1] * size.height,
    width: norm[2] * size.width,
    height: norm[3] * size.height,
  }
}

/**
 * Pixels → normalised box. Used by the mock-canvas mode, where boxes are
 * measured with `getBoundingClientRect()`: dividing measured pixels by the
 * *measured* page size cancels any CSS scale, so a zoomed page still yields
 * the same normalised coordinates.
 */
export function pixelBoxToNormalized(box: PixelBox, size: SizeBox): NormalizedBBox | null {
  if (!finite(size.width) || !finite(size.height) || size.width <= 0 || size.height <= 0) return null
  if (![box.left, box.top, box.width, box.height].every(finite)) return null
  return [
    box.left / size.width,
    box.top / size.height,
    box.width / size.width,
    box.height / size.height,
  ]
}

/**
 * Grow a box by `padding` on every side and keep it on the page. The mockup
 * pads evidence boxes so a 2 px border does not sit on the glyphs themselves.
 */
export function expandPixelBox(box: PixelBox, padding: number, size: SizeBox): PixelBox {
  const pad = finite(padding) ? Math.max(0, padding) : 0
  const maxW = finite(size.width) && size.width > 0 ? size.width : Number.POSITIVE_INFINITY
  const maxH = finite(size.height) && size.height > 0 ? size.height : Number.POSITIVE_INFINITY

  const left = Math.max(0, box.left - pad)
  const top = Math.max(0, box.top - pad)
  const right = Math.min(maxW, box.left + box.width + pad)
  const bottom = Math.min(maxH, box.top + box.height + pad)
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

const turn = (deg: number): number => {
  const d = finite(deg) ? ((deg % 360) + 360) % 360 : 0
  return Math.round(d / 90) * 90 % 360
}

/**
 * Re-express a box in the frame of a page that has been turned `rotationDeg`
 * clockwise.
 *
 * The Engine's coordinates already include the PDF's own `/Rotate`, and the
 * PDF.js viewport is built with that same rotation, so the only rotation left
 * to apply here is the viewer's rotate button — which is how canvas and overlay
 * stay glued together.
 */
export function rotateNormalizedBox(bbox: NormalizedBBox, rotationDeg: number): NormalizedBBox {
  const [x, y, w, h] = bbox
  switch (turn(rotationDeg)) {
    case 90:
      return [1 - (y + h), x, h, w]
    case 180:
      return [1 - (x + w), 1 - (y + h), w, h]
    case 270:
      return [y, 1 - (x + w), h, w]
    default:
      return [x, y, w, h]
  }
}

/** PDF points → CSS px at scale 1. */
export function pointsToCss(widthPt: number, heightPt: number): SizeBox {
  return { width: widthPt * PT_TO_CSS_PX, height: heightPt * PT_TO_CSS_PX }
}

/**
 * CSS size of a rendered page, matching what `PDFPageProxy.getViewport()`
 * reports: quarter turns swap the axes.
 */
export function cssPageGeometry(
  widthPt: number,
  heightPt: number,
  opts: { scale?: number; rotation?: number } = {},
): SizeBox {
  const requested = opts.scale ?? 1
  const scale = finite(requested) && requested > 0 ? requested : 1
  const base = pointsToCss(widthPt, heightPt)
  const swapped = turn(opts.rotation ?? 0) % 180 === 90
  const unit = swapped ? { width: base.height, height: base.width } : base
  return { width: unit.width * scale, height: unit.height * scale }
}

/**
 * The PDF.js `scale` that renders a page `cssWidth` wide in CSS pixels — the
 * fit-to-dock rule that keeps every page of a document the same width on screen.
 *
 * In PDF.js, `pdfPage.getViewport({ scale, rotation })` computes:
 *   viewport.width = basePtWidth * scale
 * Therefore, to achieve `viewport.width === cssWidth`, the scale passed to
 * PDF.js must be `cssWidth / basePtWidth`.
 */
export function scaleToFitWidth(
  widthPt: number,
  heightPt: number,
  opts: { cssWidth: number; rotation?: number } = { cssWidth: A4_CSS_SIZE.width },
): number {
  const swapped = turn(opts.rotation ?? 0) % 180 === 90
  const ptWidth = swapped ? heightPt : widthPt
  if (!finite(ptWidth) || ptWidth <= 0) return 1
  const targetWidth = finite(opts.cssWidth) && opts.cssWidth > 0 ? opts.cssWidth : A4_CSS_SIZE.width
  return targetWidth / ptWidth
}

/**
 * Canvas backing-store size for a CSS surface. Past the browser's per-edge
 * limit the long edge is capped and the aspect ratio kept, so the page renders
 * slightly softer instead of blank.
 */export function devicePixelSize(css: SizeBox, dpr = 1, maxEdge = MAX_CANVAS_EDGE): SizeBox {
  const ratio = finite(dpr) && dpr > 0 ? dpr : 1
  let width = Math.round((css.width || 0) * ratio)
  let height = Math.round((css.height || 0) * ratio)
  const longEdge = Math.max(width, height)
  if (longEdge > maxEdge && longEdge > 0) {
    const shrink = maxEdge / longEdge
    width = Math.round(width * shrink)
    height = Math.round(height * shrink)
  }
  return { width: Math.max(1, width), height: Math.max(1, height) }
}

// ---------------------------------------------------------------------------
// The evidence dock's own zoom model (mockup `fitPages` / `pdfZoom`)
// ---------------------------------------------------------------------------

/**
 * Padding the dock's scrolling body keeps around the page, in CSS px: 16px of
 * mat on each side plus a hair for the scrollbar gutter. The mockup uses 32
 * (`fitPages`), and "พอดีหน้า" is defined against that number — if the React dock
 * measures a different inset, its pages land slightly narrower or wider than the
 * mockup the analysts approved.
 */
export const DOCK_BODY_INSET = 32

/** The simulated invoice page is laid out at A4 CSS px and scaled from there. */
export const MOCK_PAGE_CSS_SIZE: Readonly<SizeBox> = A4_CSS_SIZE

/** The page width the fit formula divides by — the mockup's `PAGE_W`. */
export const MOCK_PAGE_WIDTH_CSS = MOCK_PAGE_CSS_SIZE.width

/** Smallest page scale worth rendering; below it the sheet is unreadable mush. */
export const MIN_PAGE_FIT = 0.2

/** Zoom the ± buttons walk between, matching the mockup's clamp. */
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 2.5

/**
 * Scale that makes the simulated page fill the dock body: the mockup's
 * `fitPages()`, `(bodyClientWidth - 32) / 794`.
 *
 * `bodyWidth` is the body's **raw `clientWidth`** (borders and scrollbar
 * included, padding not subtracted) — subtracting the inset happens here, once.
 */
export function mockPageFitScale(bodyWidth: number, pageWidth = MOCK_PAGE_CSS_SIZE.width): number {
  if (!finite(bodyWidth) || bodyWidth <= 0 || !finite(pageWidth) || pageWidth <= 0) return 1
  return Math.max(MIN_PAGE_FIT, (bodyWidth - DOCK_BODY_INSET) / pageWidth)
}

/**
 * The style the mock surface carries while it sits in the dock.
 *
 * `--s` is the *only* scale in the system: `.evd-page` sizes its box by it and
 * `.ivp` transforms its 794×1123 content by it, so one number moves the sheet
 * and every highlight with it. A second `scale()` on a wrapper — which an
 * earlier revision of this dock had — multiplies the page by zoom twice and
 * makes 150% render at 225%.
 *
 * Rotation is carried as `--rot` and applied by `.ivp-in` around the page's own
 * centre, again exactly like the mockup, so it stays independent of zoom.
 */
export function mockSurfaceStyle(input: { fit: number; zoom: number; rotation: number }): Record<string, string> {
  const fit = finite(input.fit) && input.fit > 0 ? input.fit : 1
  const zoom = finite(input.zoom) ? input.zoom : 1
  return {
    // Four decimals is what the mockup writes; more would only add sub-pixel
    // jitter, and CSS custom properties must be strings to inherit.
    '--s': (fit * zoom).toFixed(4),
    '--rot': `${input.rotation}deg`,
  }
}

/**
 * The ± buttons: `pdfZoom(delta)` in the mockup. `round(… * 10) / 10` keeps the
 * steps on clean tenths, so 1 → 1.1 → 1.2 instead of floating-point drift.
 * `'fit'` is the reset button and means "show the whole page width".
 */
export function zoomForStep(zoom: number, delta: number | 'fit'): number {
  if (delta === 'fit') return 1
  if (!finite(zoom)) return 1
  const next = Math.round((zoom + delta) * 10) / 10
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
}
