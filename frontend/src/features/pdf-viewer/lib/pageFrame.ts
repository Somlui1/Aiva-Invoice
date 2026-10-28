/**
 * v5.11.1 — does the PDF on screen have the page shape the Engine measured its boxes on?
 *
 * The Engine normalises every box against PyMuPDF's `page.rect` (the page as the file turns it,
 * /Rotate included) and records that size as `pages[].width_pt / height_pt`. The viewer paints the
 * page PDF.js opened, turned by the same /Rotate. When both describe one file the two shapes agree.
 * When they do not (another file — e.g. the Paperless archive re-rotated by OCRmyPDF — or another
 * page size), every box lands in the wrong place, which on a production screen is worse than no
 * box: the viewer hides them and says why.
 *
 * Only the aspect ratio is compared (scanners and OCRmyPDF may rescale a page without changing what
 * a normalised box means). Tolerance 2 %.
 */
export interface PageFrame {
  widthPt: number
  heightPt: number
}

export type FrameCheck =
  | { ok: true }
  | { ok: false; kind: 'turned' | 'shape'; engine: PageFrame; viewer: PageFrame }

const TOLERANCE = 0.02

const ratio = (f: PageFrame) => f.widthPt / f.heightPt
const close = (a: number, b: number) => Math.abs(a - b) / Math.max(a, b) <= TOLERANCE
const valid = (f: PageFrame | null | undefined): f is PageFrame =>
  !!f && Number.isFinite(f.widthPt) && Number.isFinite(f.heightPt) && f.widthPt > 0 && f.heightPt > 0

/** `ok` when nothing can be compared (no Engine geometry, page not painted yet) — never a false alarm. */
export function checkPageFrame(engine: PageFrame | null | undefined, viewer: PageFrame | null | undefined): FrameCheck {
  if (!valid(engine) || !valid(viewer)) return { ok: true }
  if (close(ratio(engine), ratio(viewer))) return { ok: true }
  const turned = close(ratio(engine), 1 / ratio(viewer))
  return { ok: false, kind: turned ? 'turned' : 'shape', engine, viewer }
}

export function frameMismatchText(c: Exclude<FrameCheck, { ok: true }>): string {
  const fmt = (f: PageFrame) => `${Math.round(f.widthPt)}×${Math.round(f.heightPt)}pt`
  return c.kind === 'turned'
    ? `ไฟล์ PDF ที่เปิดถูกหมุนต่างจากไฟล์ที่ Engine ตรวจ (Engine ${fmt(c.engine)} · ไฟล์นี้ ${fmt(c.viewer)}) · ซ่อนกรอบเพื่อไม่ให้ชี้ผิดตำแหน่ง`
    : `ขนาดหน้าไม่ตรงกับไฟล์ที่ Engine ตรวจ (Engine ${fmt(c.engine)} · ไฟล์นี้ ${fmt(c.viewer)}) · ซ่อนกรอบเพื่อไม่ให้ชี้ผิดตำแหน่ง`
}
