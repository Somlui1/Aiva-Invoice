'use client'

/**
 * v5.13.1 — every page of the PDF, one under the other, scrolled in the dock (continuous view).
 *
 * - Each page keeps its own canvas + evidence overlay, so a box is always drawn on ITS page.
 * - Pages are painted lazily: only pages within ~1.5 screens of the visible area are rendered
 *   (IntersectionObserver). The others keep their exact size, so the scrollbar and "scroll to page /
 *   box" are right before they are painted.
 * - Page sizes come from PDF.js up front (cheap: no rendering), so every placeholder has the page's
 *   real shape — a landscape page is landscape before it is painted.
 * - The page the reader is looking at is reported back (`onVisiblePageChange`) for the pager.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { devicePixelSize, scaleToFitWidth, type SizeBox } from '../lib/coordinateTransform'
import type { OverlayBox } from '../lib/overlayModel'
import { BoundingBoxOverlay } from './BoundingBoxOverlay'

export interface PageFramePt {
  page: number
  widthPt: number
  heightPt: number
}

export interface PdfPageStackProps {
  pdf: PDFDocumentProxy
  /** CSS px available for a page (dock width minus padding). */
  containerWidth: number
  zoom: number
  /** Viewer rotation (degrees), added to every page's own /Rotate. */
  rotation: number
  /** The scrolling element (the dock body). */
  scrollRoot: HTMLElement | null
  /** Evidence boxes for one page, projected onto that page's CSS size. */
  boxesForPage: (page: number, size: SizeBox) => OverlayBox[]
  visible?: boolean
  hoveredId?: string | null
  onSelect?: (box: OverlayBox) => void
  onHover?: (box: OverlayBox | null) => void
  /** A page finished painting (size in CSS px + its PDF frame in points, for the frame check). */
  onPagePainted?: (page: number, size: SizeBox, frame: PageFramePt) => void
  /** The page at the reading line (top third of the viewport) changed. */
  onVisiblePageChange?: (page: number) => void
  devicePixelRatio?: number
}

interface PageGeom {
  size: SizeBox
  frame: PageFramePt
}

const turn = (deg: number) => (((deg % 360) + 360) % 360)

function geomOf(p: PDFPageProxy, pageNo: number, cssWidth: number, zoom: number, rotation: number): PageGeom {
  const total = turn(rotation + p.rotate)
  const [x0, y0, x1, y1] = p.view
  const widthPt = Math.abs(x1 - x0)
  const heightPt = Math.abs(y1 - y0)
  const scale = scaleToFitWidth(widthPt, heightPt, { cssWidth: Math.max(1, cssWidth), rotation: total }) * zoom
  const vp = p.getViewport({ scale, rotation: total })
  const own = turn(p.rotate)
  const swapped = own === 90 || own === 270
  return {
    size: { width: vp.width, height: vp.height },
    frame: { page: pageNo, widthPt: swapped ? heightPt : widthPt, heightPt: swapped ? widthPt : heightPt },
  }
}

export function PdfPageStack({
  pdf,
  containerWidth,
  zoom,
  rotation,
  scrollRoot,
  boxesForPage,
  visible = true,
  hoveredId = null,
  onSelect,
  onHover,
  onPagePainted,
  onVisiblePageChange,
  devicePixelRatio,
}: PdfPageStackProps) {
  const pageCount = Math.max(1, pdf.numPages)
  const [proxies, setProxies] = useState<Record<number, PDFPageProxy>>({})
  const [near, setNear] = useState<Set<number>>(() => new Set([1]))
  const pageEls = useRef<Map<number, HTMLDivElement>>(new Map())

  // 1) page proxies (metadata only) → exact sizes for every placeholder
  useEffect(() => {
    let alive = true
    setProxies({})
    void (async () => {
      for (let n = 1; n <= pageCount && alive; n++) {
        try {
          const p = await pdf.getPage(n)
          if (!alive) return
          setProxies(prev => ({ ...prev, [n]: p }))
        } catch {
          /* a broken page keeps the size of the one before it */
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [pdf, pageCount])

  const geoms = useMemo(() => {
    const out: Record<number, PageGeom> = {}
    let last: PageGeom | null = null
    for (let n = 1; n <= pageCount; n++) {
      const p = proxies[n]
      if (p) last = geomOf(p, n, containerWidth, zoom, rotation)
      if (last) out[n] = p ? last : { size: last.size, frame: { ...last.frame, page: n } }
    }
    return out
  }, [proxies, pageCount, containerWidth, zoom, rotation])

  // 2) which pages are close to the visible area (paint those)
  useEffect(() => {
    if (!scrollRoot || typeof IntersectionObserver === 'undefined') {
      setNear(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)))
      return
    }
    const io = new IntersectionObserver(
      entries => {
        setNear(prev => {
          const next = new Set(prev)
          let changed = false
          for (const e of entries) {
            const n = Number((e.target as HTMLElement).dataset.page)
            if (e.isIntersecting && !next.has(n)) {
              next.add(n)
              changed = true
            }
          }
          return changed ? next : prev
        })
      },
      { root: scrollRoot, rootMargin: '150% 0px 150% 0px' },
    )
    pageEls.current.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [scrollRoot, pageCount, geoms])

  // 3) the page at the reading line → pager
  const lastReported = useRef(0)
  useEffect(() => {
    if (!scrollRoot || !onVisiblePageChange) return
    let raf = 0
    const read = () => {
      raf = 0
      const top = scrollRoot.getBoundingClientRect().top + scrollRoot.clientHeight / 3
      let page = 1
      pageEls.current.forEach((el, n) => {
        if (el.getBoundingClientRect().top <= top) page = Math.max(page, n)
      })
      if (page !== lastReported.current) {
        lastReported.current = page
        onVisiblePageChange(page)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    scrollRoot.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollRoot.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [scrollRoot, onVisiblePageChange])

  return (
    <div className="evd-stack" data-testid="pdf-page-stack" data-pages={pageCount}>
      {Array.from({ length: pageCount }, (_, i) => {
        const n = i + 1
        const g = geoms[n]
        return (
          <StackPage
            key={n}
            pageNo={n}
            pageCount={pageCount}
            proxy={proxies[n]}
            geom={g}
            paint={near.has(n)}
            rotation={rotation}
            devicePixelRatio={devicePixelRatio}
            boxes={g ? boxesForPage(n, g.size) : []}
            visible={visible}
            hoveredId={hoveredId}
            onSelect={onSelect}
            onHover={onHover}
            onPainted={onPagePainted}
            register={el => {
              if (el) pageEls.current.set(n, el)
              else pageEls.current.delete(n)
            }}
          />
        )
      })}
    </div>
  )
}

interface StackPageProps {
  pageNo: number
  pageCount: number
  proxy?: PDFPageProxy
  geom?: PageGeom
  paint: boolean
  rotation: number
  devicePixelRatio?: number
  boxes: OverlayBox[]
  visible: boolean
  hoveredId: string | null
  onSelect?: (box: OverlayBox) => void
  onHover?: (box: OverlayBox | null) => void
  onPainted?: (page: number, size: SizeBox, frame: PageFramePt) => void
  register: (el: HTMLDivElement | null) => void
}

function StackPage({
  pageNo,
  pageCount,
  proxy,
  geom,
  paint,
  rotation,
  devicePixelRatio,
  boxes,
  visible,
  hoveredId,
  onSelect,
  onHover,
  onPainted,
  register,
}: StackPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [painted, setPainted] = useState(false)
  const width = geom?.size.width ?? 0
  const height = geom?.size.height ?? 0

  useEffect(() => {
    if (!paint || !proxy || !geom || !canvasRef.current) return
    const canvas = canvasRef.current
    let disposed = false
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null
    void (async () => {
      try {
        const total = turn(rotation + proxy.rotate)
        const [x0, y0, x1, y1] = proxy.view
        const scale = geom.size.width / (turn(total) % 180 === 90 ? Math.abs(y1 - y0) : Math.abs(x1 - x0))
        const vp = proxy.getViewport({ scale, rotation: total })
        const dpr = devicePixelRatio && devicePixelRatio > 0 ? devicePixelRatio : window.devicePixelRatio || 1
        const backing = devicePixelSize({ width: vp.width, height: vp.height }, dpr)
        canvas.width = backing.width
        canvas.height = backing.height
        canvas.style.width = `${vp.width}px`
        canvas.style.height = `${vp.height}px`
        task = proxy.render({
          canvas,
          viewport: vp,
          transform: [backing.width / vp.width, 0, 0, backing.height / vp.height, 0, 0],
        } as never) as unknown as { cancel: () => void; promise: Promise<unknown> }
        await task.promise
        if (disposed) return
        setPainted(true)
        onPainted?.(pageNo, geom.size, geom.frame)
      } catch {
        /* cancelled (zoom / unmount) or a broken page: the white sheet stays */
      }
    })()
    return () => {
      disposed = true
      task?.cancel()
    }
    // geom changes with zoom / width / rotation → repaint
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paint, proxy, width, height, rotation, devicePixelRatio])

  return (
    <div
      ref={register}
      className={`evd-page evd-pdf-page on evd-stack-page${painted ? ' is-painted' : ''}`}
      data-page={pageNo}
      aria-label={`หน้า ${pageNo} / ${pageCount}`}
      style={{ width: width || undefined, height: height || undefined }}
    >
      <canvas ref={canvasRef} className="evd-pdf-canvas" />
      {!painted && (
        <span className="evd-stack-wait" aria-hidden="true">
          <span className="spin" />
        </span>
      )}
      {painted && geom && (
        <BoundingBoxOverlay
          boxes={boxes}
          pageSize={geom.size}
          visible={visible}
          onSelect={onSelect}
          onHover={onHover}
          hoveredId={hoveredId}
        />
      )}
      <span className="evd-stack-no" aria-hidden="true">
        {pageNo} / {pageCount}
      </span>
    </div>
  )
}

export default PdfPageStack
