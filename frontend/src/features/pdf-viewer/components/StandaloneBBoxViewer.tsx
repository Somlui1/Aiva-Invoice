'use client'

/**
 * "ตรวจ BBox (แท็บใหม่)" — full-screen BBox inspector (v5.7).
 *
 * Aligned with the Engine's own reference viewer (`engine/src/test-portal/webapp/view.py` + `static/app.js`):
 *  - a box's **tag is its `element_type`** exactly as System A labels it in `ocr.elements[]`
 *    (field · row · cell · table · section · signature · stamp · word · page) — no guessing from
 *    field names any more (the old 10 "header / supplier / total…" categories were the portal's
 *    invention and disagreed with the engine);
 *  - same colours as the test portal (colour-vision-safe palette);
 *  - default tags on: field, row, signature, stamp — chips list only the tags present, with counts,
 *    and the choice is remembered (localStorage `aiva.viewer.types.v1`);
 *  - label = `field_name` (or the tag), cut at 22 characters; boxes are drawn as delivered
 *    (`bbox` = [x, y, w, h] normalised 0..1, top-left origin), min height 0.35 % so a hairline
 *    row stays visible;
 *  - boxes that are evidence for an exception carry its code in the tooltip and a severity mark.
 *
 * Loading: the PDF is fetched with the session cookie (a 401 goes through the session guard) and
 * the pages stay hidden behind a spinner until the first page is painted.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react'
import '../styles/standaloneViewer.css'
import { loadPdfjs } from '../hooks/usePdfViewer'
import { uiZoom } from '../../../lib/uiZoom'

/** System A's element types, in the order the engine's test portal lists them. */
export const BBOX_TAGS = ['field', 'row', 'cell', 'table', 'section', 'signature', 'stamp', 'word', 'page'] as const
export type BBoxTag = (typeof BBOX_TAGS)[number]

/** Same palette as engine/src/test-portal/webapp/view.py `COLORS`. */
export const BBOX_TAG_COLORS: Record<string, string> = {
  field: '#1f77b4',
  row: '#2ca02c',
  cell: '#9edae5',
  table: '#17becf',
  section: '#bcbd22',
  signature: '#d62728',
  stamp: '#e377c2',
  word: '#7f7f7f',
  page: '#ff7f0e',
}
export const BBOX_TAG_DEFAULT: readonly string[] = ['field', 'row', 'signature', 'stamp']
const UNKNOWN_COLOR = '#888888'
const TYPES_KEY = 'aiva.viewer.types.v1'
const LABEL_MAX = 22
const MIN_H = 0.0035

/** The tag of an element = its `element_type` (lower-case). Unknown/empty types stay visible as-is. */
export function bboxTagOf(elementType?: string | null): string {
  const t = String(elementType || '').trim().toLowerCase()
  return t || 'field'
}

/** @deprecated v5.7 — tags are `element_type` now; kept so old imports keep compiling. */
export const mapBBoxType = (_fieldName?: string, elementType?: string) => bboxTagOf(elementType)

export interface BBoxItem {
  id?: string
  pageNo?: number
  /** Tag = System A `element_type`. */
  type: string
  /** `field_name` (shown as the box label). */
  label?: string
  text?: string
  /** [x, y, w, h] normalised 0..1, top-left origin — drawn exactly as delivered. */
  bbox_norm: [number, number, number, number]
  confidence?: number
  /** Exception codes this box is evidence for (from the Portal payload). */
  codes?: string[]
  severity?: 'Low' | 'Medium' | 'High'
}

export interface StandaloneBBoxViewerProps {
  docId: string
  title?: string
  pdfUrl?: string
  items?: BBoxItem[]
  pageCount?: number
  /** Ids of the boxes to light (one finding, `?finding=`); the rest are faded. */
  focusIds?: string[]
  /** Box to scroll to once the pages are drawn. */
  scrollToId?: string
  /** One line about the focused finding (shown in the bar). */
  focusNote?: string
  /** The document metadata is still loading (route-level fetch). */
  loading?: boolean
}

interface PageDimension {
  width: number
  height: number
}

type PdfState = 'idle' | 'loading' | 'ready' | 'error'

function readSavedTags(): string[] | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(TYPES_KEY) : null
    const v = raw ? JSON.parse(raw) : null
    return Array.isArray(v) && v.length ? v.map(String) : null
  } catch {
    return null
  }
}

export function StandaloneBBoxViewer({
  docId,
  title,
  pdfUrl,
  items = [],
  pageCount = 1,
  focusIds,
  scrollToId,
  focusNote,
  loading = false,
}: StandaloneBBoxViewerProps) {
  const focusSet = useMemo(() => new Set(focusIds ?? []), [focusIds])
  const hasFocus = focusSet.size > 0
  const [scale, setScale] = useState(1.4)
  const [showLabels, setShowLabels] = useState(true)
  const [visibleTags, setVisibleTags] = useState<Set<string>>(() => new Set(readSavedTags() ?? BBOX_TAG_DEFAULT))
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  })

  // Tags actually present in this document (engine order first, then anything unexpected), with counts.
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const it of items) m.set(it.type, (m.get(it.type) || 0) + 1)
    return m
  }, [items])
  const tagsPresent = useMemo(() => {
    const known = BBOX_TAGS.filter(t => tagCounts.has(t)) as string[]
    const extra = [...tagCounts.keys()].filter(t => !(BBOX_TAGS as readonly string[]).includes(t)).sort()
    return [...known, ...extra]
  }, [tagCounts])

  const toggleTag = (tag: string, on: boolean) => {
    setVisibleTags(prev => {
      const next = new Set(prev)
      if (on) next.add(tag)
      else next.delete(tag)
      try {
        window.localStorage.setItem(TYPES_KEY, JSON.stringify([...next]))
      } catch {
        /* private mode */
      }
      return next
    })
  }

  // PDF.js document state
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pdfState, setPdfState] = useState<PdfState>(pdfUrl ? 'loading' : 'idle')
  const [pdfError, setPdfError] = useState<string>('')
  const [pageDims, setPageDims] = useState<Record<number, PageDimension>>({})
  const [painted, setPainted] = useState(false)

  const numPages = useMemo(() => {
    if (pdfDoc?.numPages) return pdfDoc.numPages
    const maxItemPage = items.reduce((max, it) => Math.max(max, it.pageNo || 1), 1)
    return Math.max(pageCount || 1, maxItemPage)
  }, [pdfDoc, items, pageCount])

  // Load the PDF: bytes via fetch (session cookie, 401 → session guard), then PDF.js parses them.
  useEffect(() => {
    if (!pdfUrl || typeof window === 'undefined') {
      setPdfState('idle')
      return
    }
    let cancelled = false
    setPdfState('loading')
    setPainted(false)
    setPdfError('')

    ;(async () => {
      try {
        const res = await fetch(pdfUrl, { credentials: 'same-origin', cache: 'no-store' })
        if (!res.ok) throw new Error(res.status === 401 ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : `โหลดไฟล์ PDF ไม่สำเร็จ (HTTP ${res.status})`)
        if (res.headers.get('X-PDF-Source') === 'fallback_mock') {
          throw new Error(res.headers.get('X-PDF-Fallback-Reason') || 'ไม่พบไฟล์ PDF ของเอกสารนี้')
        }
        const data = new Uint8Array(await res.arrayBuffer())
        const pdfjs = await loadPdfjs()
        const doc = await pdfjs.getDocument({ data }).promise
        if (cancelled) {
          void doc.destroy()
          return
        }
        setPdfDoc(doc)
        setPdfState('ready')
      } catch (err) {
        if (cancelled) return
        console.warn('PDF load warning in StandaloneBBoxViewer:', err)
        setPdfError(err instanceof Error ? err.message : String(err))
        setPdfState('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pdfUrl])

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  // Paint every page when the document or the zoom changes.
  useEffect(() => {
    if (!pdfDoc || typeof window === 'undefined') return
    let cancelled = false

    const renderAll = async () => {
      const newDims: Record<number, PageDimension> = {}
      for (let n = 1; n <= pdfDoc.numPages; n++) {
        if (cancelled) break
        try {
          const page = await pdfDoc.getPage(n)
          const vp = page.getViewport({ scale })
          newDims[n] = { width: vp.width, height: vp.height }

          const canvas = canvasRefs.current.get(n)
          if (canvas) {
            const ratio = window.devicePixelRatio || 1
            canvas.width = vp.width * ratio
            canvas.height = vp.height * ratio
            canvas.style.width = `${vp.width}px`
            canvas.style.height = `${vp.height}px`
            const ctx = canvas.getContext('2d')
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport: vp, transform: [ratio, 0, 0, ratio, 0, 0] }).promise
            }
          }
        } catch (e) {
          console.warn(`Error rendering page ${n}:`, e)
        }
        // Reveal as soon as page 1 is on screen; the rest paint below the fold.
        if (n === 1 && !cancelled) {
          setPageDims(d => ({ ...d, 1: newDims[1] }))
          setPainted(true)
        }
      }
      if (!cancelled) setPageDims(newDims)
    }

    renderAll()
    return () => {
      cancelled = true
    }
  }, [pdfDoc, scale])

  const itemsByPage = useMemo(() => {
    const map = new Map<number, BBoxItem[]>()
    for (let p = 1; p <= numPages; p++) map.set(p, [])
    for (const item of items) {
      const p = item.pageNo || 1
      if (!map.has(p)) map.set(p, [])
      map.get(p)!.push(item)
    }
    return map
  }, [items, numPages])

  // Scroll once to the focused box, after the pages have their real size.
  const scrolledFor = useRef<string | null>(null)
  useEffect(() => {
    if (!scrollToId || scrolledFor.current === scrollToId || typeof document === 'undefined') return
    if (pdfUrl && !painted) return
    const el = document.querySelector(`.standalone-pages .box[data-id="${CSS.escape(scrollToId)}"]`)
    if (el) {
      el.scrollIntoView({ block: 'center', inline: 'center' })
      scrolledFor.current = scrollToId
    }
  }, [scrollToId, pageDims, items, pdfUrl, painted])

  // A4 placeholder until PDF.js reports the real page size.
  const baseWidth = 595
  const baseHeight = 842
  const busy = loading || pdfState === 'loading' || (pdfState === 'ready' && !painted)
  const shownCount = items.filter(it => visibleTags.has(it.type) || (!!it.id && focusSet.has(it.id))).length

  return (
    <div className={`standalone-viewer ${!showLabels ? 'hide-labels' : ''}`} aria-busy={busy}>
      <div id="bar" className="standalone-bar">
        <b>{title || docId}</b>
        {focusNote && (
          <span className="focus-note" role="status">
            {focusNote}
          </span>
        )}
        <button id="zo" aria-label="−" onClick={() => setScale(s => Math.max(0.4, Number((s - 0.2).toFixed(1))))}>
          −
        </button>
        <span id="zv" data-testid="zoom-val">
          {Math.round(scale * 100)}%
        </span>
        <button id="zi" aria-label="+" onClick={() => setScale(s => Math.min(4.0, Number((s + 0.2).toFixed(1))))}>
          +
        </button>
        <label>
          <input
            type="checkbox"
            id="lb"
            aria-label="label"
            checked={showLabels}
            onChange={e => setShowLabels(e.target.checked)}
          />
          label
        </label>
        <span id="types" className="types-container" role="group" aria-label="ชนิดกรอบ (element_type)">
          {tagsPresent.map(tag => {
            const color = BBOX_TAG_COLORS[tag] || UNKNOWN_COLOR
            const on = visibleTags.has(tag)
            return (
              <label key={tag} className={`tg${on ? ' on' : ''}`} style={{ borderColor: color }}>
                <input
                  type="checkbox"
                  data-t={tag}
                  aria-label={tag}
                  checked={on}
                  onChange={e => toggleTag(tag, e.target.checked)}
                />
                <span className="sw" style={{ background: color }} aria-hidden="true" />
                {tag}
                <span className="tg-n">{tagCounts.get(tag)}</span>
              </label>
            )
          })}
        </span>
        <span className="bar-count" data-testid="bbox-count">
          แสดง {shownCount}/{items.length} กรอบ
        </span>
      </div>

      {busy && (
        <div className="standalone-loading" role="status" aria-live="polite" data-testid="viewer-loading">
          <span className="sv-spin" aria-hidden="true" />
          <span>กำลังโหลดเอกสาร…</span>
        </div>
      )}
      {!busy && pdfState === 'error' && (
        <div className="standalone-error" role="alert">
          {pdfError || 'โหลดไฟล์ PDF ไม่สำเร็จ'} · แสดงกรอบบนหน้าว่างแทน
        </div>
      )}

      <div id="pages" className={`standalone-pages${busy ? ' is-loading' : ''}`} aria-hidden={busy || undefined}>
        {Array.from({ length: numPages }, (_, idx) => {
          const pageNo = idx + 1
          const dim = pageDims[pageNo] || { width: baseWidth * scale, height: baseHeight * scale }
          const pageItems = itemsByPage.get(pageNo) || []

          return (
            <div
              key={pageNo}
              className="page"
              data-page-no={pageNo}
              style={{ width: `${dim.width}px`, height: `${dim.height}px` }}
            >
              <canvas
                ref={el => {
                  if (el) canvasRefs.current.set(pageNo, el)
                  else canvasRefs.current.delete(pageNo)
                }}
                width={dim.width}
                height={dim.height}
                style={{ width: `${dim.width}px`, height: `${dim.height}px` }}
              />
              {pageItems.map((item, itemIdx) => {
                const [x, y, w, h] = item.bbox_norm
                const color = BBOX_TAG_COLORS[item.type] || UNKNOWN_COLOR
                const focused = !!item.id && focusSet.has(item.id)
                // A focused box is shown even when its tag is switched off.
                const isHidden = !focused && !visibleTags.has(item.type)
                const label = String(item.label || item.type).slice(0, LABEL_MAX)
                const codes = item.codes?.length ? ` · ${item.codes.join(', ')}` : ''
                const conf = typeof item.confidence === 'number' ? ` · conf ${item.confidence.toFixed(2)}` : ''

                return (
                  <div
                    key={item.id || `${pageNo}-${itemIdx}`}
                    className={`box${focused ? ' bx-focus' : hasFocus ? ' bx-dim' : ''}${item.codes?.length ? ' bx-ev' : ''}${item.severity ? ` bx-sev-${item.severity.toLowerCase()}` : ''}`}
                    data-t={item.type}
                    data-id={item.id}
                    style={{
                      left: `${x * dim.width}px`,
                      top: `${y * dim.height}px`,
                      width: `${w * dim.width}px`,
                      height: `${Math.max(h, MIN_H) * dim.height}px`,
                      borderColor: color,
                      display: isHidden ? 'none' : undefined,
                    }}
                    onMouseMove={e => {
                      setTooltip({
                        visible: true,
                        x: e.clientX / uiZoom(),
                        y: e.clientY / uiZoom(),
                        text: `[${item.type}] ${item.label || ''}: ${item.text ?? ''}${conf}${codes}  [x y w h ${item.bbox_norm.map(v => (+v).toFixed(3)).join(' ')}]`,
                      })
                    }}
                    onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
                  >
                    <span style={{ background: color }}>{label}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div
        id="tip"
        data-testid="bbox-tooltip"
        className="standalone-tip"
        style={{
          display: tooltip.visible ? 'block' : 'none',
          left: `${tooltip.x + 12}px`,
          top: `${tooltip.y + 12}px`,
        }}
      >
        {tooltip.text}
      </div>
    </div>
  )
}
