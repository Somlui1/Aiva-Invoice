'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import '../styles/standaloneViewer.css'
import { loadPdfjs } from '../hooks/usePdfViewer'

export interface BBoxItem {
  id?: string
  pageNo?: number
  type: string
  label?: string
  text?: string
  bbox_norm: [number, number, number, number] // [x, y, w, h] normalized 0..1
}

export interface StandaloneBBoxViewerProps {
  docId: string
  title?: string
  pdfUrl?: string
  items?: BBoxItem[]
  pageCount?: number
}

export const BBOX_CATEGORIES = [
  'header',
  'supplier',
  'customer',
  'table',
  'line',
  'total',
  'payment',
  'signature',
  'stamp',
  'other',
] as const

export const BBOX_CATEGORY_COLORS: Record<string, string> = {
  header: '#d62728',
  supplier: '#ff7f0e',
  customer: '#9467bd',
  table: '#7f7f7f',
  line: '#1f77b4',
  total: '#2ca02c',
  payment: '#bcbd22',
  signature: '#e377c2',
  stamp: '#8c564b',
  other: '#17becf',
}

interface PageDimension {
  width: number
  height: number
}

export function StandaloneBBoxViewer({
  docId,
  title,
  pdfUrl,
  items = [],
  pageCount = 1,
}: StandaloneBBoxViewerProps) {
  const [scale, setScale] = useState(1.4)
  const [showLabels, setShowLabels] = useState(true)
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    () => new Set(BBOX_CATEGORIES),
  )
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    text: string
  }>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  })

  // PDF.js document state
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pageDims, setPageDims] = useState<Record<number, PageDimension>>({})

  // Compute number of pages
  const numPages = useMemo(() => {
    if (pdfDoc?.numPages) return pdfDoc.numPages
    const maxItemPage = items.reduce((max, it) => Math.max(max, it.pageNo || 1), 1)
    return Math.max(pageCount || 1, maxItemPage)
  }, [pdfDoc, items, pageCount])

  // Load PDF.js document if pdfUrl is given
  useEffect(() => {
    if (!pdfUrl || typeof window === 'undefined') return
    let cancelled = false

    loadPdfjs()
      .then((pdfjs) => {
        return pdfjs.getDocument({ url: pdfUrl, withCredentials: true }).promise
      })
      .then((doc) => {
        if (!cancelled) setPdfDoc(doc)
      })
      .catch((err) => {
        console.warn('PDF load warning in StandaloneBBoxViewer:', err)
      })

    return () => {
      cancelled = true
    }
  }, [pdfUrl])

  // Canvas refs map
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  // Render pages onto canvases when pdfDoc or scale changes
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
              await page.render({
                canvasContext: ctx,
                viewport: vp,
                transform: [ratio, 0, 0, ratio, 0, 0],
              }).promise
            }
          }
        } catch (e) {
          console.warn(`Error rendering page ${n}:`, e)
        }
      }
      if (!cancelled) {
        setPageDims(newDims)
      }
    }

    renderAll()

    return () => {
      cancelled = true
    }
  }, [pdfDoc, scale])

  // Group items by page number
  const itemsByPage = useMemo(() => {
    const map = new Map<number, BBoxItem[]>()
    for (let p = 1; p <= numPages; p++) {
      map.set(p, [])
    }
    for (const item of items) {
      const p = item.pageNo || 1
      if (!map.has(p)) map.set(p, [])
      map.get(p)!.push(item)
    }
    return map
  }, [items, numPages])

  // Standard A4 default aspect ratio: 595 x 842 points
  const baseWidth = 595
  const baseHeight = 842

  return (
    <div className={`standalone-viewer ${!showLabels ? 'hide-labels' : ''}`}>
      {/* Top sticky bar */}
      <div id="bar" className="standalone-bar">
        <b>{title || docId}</b>
        <button
          id="zo"
          aria-label="−"
          onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.2).toFixed(1))))}
        >
          −
        </button>
        <span id="zv" data-testid="zoom-val">
          {Math.round(scale * 100)}%
        </span>
        <button
          id="zi"
          aria-label="+"
          onClick={() => setScale((s) => Math.min(4.0, Number((s + 0.2).toFixed(1))))}
        >
          +
        </button>
        <label>
          <input
            type="checkbox"
            id="lb"
            aria-label="label"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          label
        </label>
        <span id="types" className="types-container">
          {BBOX_CATEGORIES.map((cat) => (
            <label
              key={cat}
              style={{ color: BBOX_CATEGORY_COLORS[cat] || BBOX_CATEGORY_COLORS.other }}
            >
              <input
                type="checkbox"
                data-t={cat}
                aria-label={cat}
                checked={visibleCategories.has(cat)}
                onChange={(e) => {
                  setVisibleCategories((prev) => {
                    const next = new Set(prev)
                    if (e.target.checked) {
                      next.add(cat)
                    } else {
                      next.delete(cat)
                    }
                    return next
                  })
                }}
              />
              {cat}
            </label>
          ))}
        </span>
      </div>

      {/* Pages Container */}
      <div id="pages" className="standalone-pages">
        {Array.from({ length: numPages }, (_, idx) => {
          const pageNo = idx + 1
          const dim = pageDims[pageNo] || {
            width: baseWidth * scale,
            height: baseHeight * scale,
          }
          const pageItems = itemsByPage.get(pageNo) || []

          return (
            <div
              key={pageNo}
              className="page"
              data-page-no={pageNo}
              style={{
                width: `${dim.width}px`,
                height: `${dim.height}px`,
              }}
            >
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNo, el)
                  else canvasRefs.current.delete(pageNo)
                }}
                width={dim.width}
                height={dim.height}
                style={{
                  width: `${dim.width}px`,
                  height: `${dim.height}px`,
                }}
              />
              {pageItems.map((item, itemIdx) => {
                const [x, y, w, h] = item.bbox_norm
                const color =
                  BBOX_CATEGORY_COLORS[item.type] || BBOX_CATEGORY_COLORS.other
                const isHidden = !visibleCategories.has(item.type)

                return (
                  <div
                    key={item.id || `${pageNo}-${itemIdx}`}
                    className="box"
                    data-t={item.type}
                    style={{
                      left: `${x * dim.width}px`,
                      top: `${y * dim.height}px`,
                      width: `${w * dim.width}px`,
                      height: `${h * dim.height}px`,
                      borderColor: color,
                      display: isHidden ? 'none' : undefined,
                    }}
                    onMouseMove={(e) => {
                      setTooltip({
                        visible: true,
                        x: e.clientX,
                        y: e.clientY,
                        text: `${item.label || item.type}: ${item.text ?? ''}  [${item.bbox_norm.join(', ')}]`,
                      })
                    }}
                    onMouseLeave={() => {
                      setTooltip((prev) => ({ ...prev, visible: false }))
                    }}
                  >
                    <span style={{ background: color }}>
                      {item.label || item.type}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Floating tooltip */}
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
