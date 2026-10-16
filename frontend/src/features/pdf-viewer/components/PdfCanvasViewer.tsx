'use client'

/**
 * PDF.js canvas stage with continuous vertical multi-page scrolling and evidence overlay (design §4.2).
 *
 * Supports both single-page mode and continuous multi-page vertical scroll mode.
 * The clean document is displayed first (showEvidence = false by default),
 * and bounding boxes appear only when requested.
 */
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import {
  devicePixelSize,
  scaleToFitWidth,
  type SizeBox,
} from '../lib/coordinateTransform'
import type { OverlayBox } from '../lib/overlayModel'
import type { PdfViewerStatus } from '../types'
import { BoundingBoxOverlay } from './BoundingBoxOverlay'
import { PdfTopProgressBar } from './PdfTopProgressBar'
import { PdfErrorView } from './PdfErrorView'

export interface PdfCanvasViewerProps {
  /** Canvas owned by `usePdfViewer`; the viewer only sizes and shows it. */
  canvasRef: RefObject<HTMLCanvasElement | null>
  status: PdfViewerStatus
  /** CSS px size of the rendered page, from the same hook. */
  pageSize: SizeBox
  boxes: OverlayBox[]
  onSelect?: (box: OverlayBox) => void
  onHover?: (box: OverlayBox | null) => void
  hoveredId?: string | null
  /** Hide every evidence box: the dock's evidence toggle. */
  visible?: boolean
  /** Simulated invoice page shown until a real page can be painted. */
  placeholder?: ReactNode
  onRetry?: () => void
  onClose?: () => void

  /** Multi-page continuous scrolling extensions */
  pdfDoc?: any
  containerWidth?: number
  rotation?: number
  zoom?: number
  onPageVisible?: (pageNum: number) => void
  renderOverlayForPage?: (pageNum: number, size: SizeBox) => OverlayBox[]
}

function ContinuousPdfPage({
  pdfDoc,
  pageNum,
  containerWidth,
  rotation,
  zoom,
  renderOverlayForPage,
  visible,
  onSelect,
  onHover,
  hoveredId,
  onVisible,
  isPrimary,
  primaryCanvasRef,
  defaultPageSize,
  defaultBoxes,
}: {
  pdfDoc: any
  pageNum: number
  containerWidth: number
  rotation: number
  zoom: number
  renderOverlayForPage?: (pageNum: number, size: SizeBox) => OverlayBox[]
  visible: boolean
  onSelect?: (box: OverlayBox) => void
  onHover?: (box: OverlayBox | null) => void
  hoveredId?: string | null
  onVisible?: (pageNum: number) => void
  isPrimary?: boolean
  primaryCanvasRef?: RefObject<HTMLCanvasElement | null>
  defaultPageSize: SizeBox
  defaultBoxes: OverlayBox[]
}) {
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [pageSize, setPageSize] = useState<SizeBox>(defaultPageSize)

  useEffect(() => {
    if (isPrimary && primaryCanvasRef && localCanvasRef.current) {
      ;(primaryCanvasRef as any).current = localCanvasRef.current
    }
  }, [isPrimary, primaryCanvasRef])

  useEffect(() => {
    if (!pdfDoc) return
    let disposed = false

    void (async () => {
      try {
        const page = await pdfDoc.getPage(pageNum)
        if (disposed) return
        const canvas = localCanvasRef.current
        if (!canvas) return

        const totalRotation = rotation + page.rotate
        const [x0, y0, x1, y1] = page.view
        const widthPt = Math.abs(x1 - x0)
        const heightPt = Math.abs(y1 - y0)
        const cssWidth = Math.max(1, containerWidth)
        const scale = scaleToFitWidth(widthPt, heightPt, { cssWidth, rotation: totalRotation }) * zoom
        const viewport = page.getViewport({ scale, rotation: totalRotation })

        const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
        const backing = devicePixelSize({ width: viewport.width, height: viewport.height }, dpr)
        const sx = backing.width / viewport.width
        const sy = backing.height / viewport.height

        canvas.width = backing.width
        canvas.height = backing.height
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        const task = page.render({ canvas, viewport, transform: [sx, 0, 0, sy, 0, 0] })
        await task.promise
        if (disposed) return

        setPageSize({ width: viewport.width, height: viewport.height })
      } catch {
        // Fallback or ignore render cancellation
      }
    })()

    return () => {
      disposed = true
    }
  }, [pdfDoc, pageNum, containerWidth, rotation, zoom])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el || !onVisible || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            onVisible(pageNum)
          }
        }
      },
      { threshold: [0.4, 0.7] }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pageNum, onVisible])

  const pageBoxes = renderOverlayForPage
    ? renderOverlayForPage(pageNum, pageSize)
    : defaultBoxes.filter(b => b.pageNo === pageNum)

  return (
    <div
      ref={wrapperRef}
      id={`pdf-page-${pageNum}`}
      className="evd-page evd-pdf-page on evd-continuous-page"
      style={{
        width: pageSize.width || undefined,
        height: pageSize.height || undefined,
        marginBottom: 16,
      }}
      data-page-num={pageNum}
    >
      <canvas ref={localCanvasRef} className="evd-pdf-canvas" />
      <BoundingBoxOverlay
        boxes={pageBoxes}
        pageSize={pageSize}
        visible={visible}
        onSelect={onSelect}
        onHover={onHover}
        hoveredId={hoveredId}
      />
    </div>
  )
}

export function PdfCanvasViewer({
  canvasRef,
  status,
  pageSize,
  boxes,
  onSelect,
  onHover,
  hoveredId = null,
  visible = true,
  placeholder,
  onRetry,
  onClose,
  pdfDoc,
  containerWidth = 600,
  rotation = 0,
  zoom = 1,
  onPageVisible,
  renderOverlayForPage,
}: PdfCanvasViewerProps) {
  const ready = status.state === 'ready' && pageSize.width > 0 && pageSize.height > 0
  const progressState: 'idle' | 'loading' | 'ready' | 'error' =
    status.state === 'loading'
      ? 'loading'
      : ready
        ? 'ready'
        : status.state === 'error'
          ? 'error'
          : 'idle'

  const hasMultiPages = Boolean(ready && pdfDoc && pdfDoc.numPages > 1)
  const pageNumbers = hasMultiPages
    ? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1)
    : []

  return (
    <div className="evd-pdf" data-pdf-source={status.source ?? 'none'} data-pdf-state={status.state}>
      <PdfTopProgressBar state={progressState} />
      {ready ? null : status.state === 'loading' ? (
        <div className="evd-loading-minimal" role="status">
          <span className="spin lg" aria-label="กำลังโหลดเอกสาร" />
        </div>
      ) : status.state === 'error' && status.error ? (
        <PdfErrorView
          error={status.error}
          onRetry={onRetry}
          onClose={onClose || (() => {})}
        />
      ) : (
        <div className="evd-pdf-fallback" role="status">
          <span className="evd-pdf-note bad">
            แสดงเอกสารจำลอง — {status.reason || 'เปิดไฟล์ PDF ไม่ได้'}
            {onRetry ? (
              <button type="button" className="btn btn-ghost xs" onClick={onRetry}>
                ลองใหม่
              </button>
            ) : null}
          </span>
          {placeholder}
        </div>
      )}

      {hasMultiPages ? (
        <div className="evd-continuous-scroll">
          {pageNumbers.map(p => (
            <ContinuousPdfPage
              key={p}
              pdfDoc={pdfDoc}
              pageNum={p}
              containerWidth={containerWidth}
              rotation={rotation}
              zoom={zoom}
              renderOverlayForPage={renderOverlayForPage}
              visible={visible}
              onSelect={onSelect}
              onHover={onHover}
              hoveredId={hoveredId}
              onVisible={onPageVisible}
              isPrimary={p === 1}
              primaryCanvasRef={canvasRef}
              defaultPageSize={pageSize}
              defaultBoxes={boxes}
            />
          ))}
        </div>
      ) : (
        <div
          className={`evd-page evd-pdf-page${ready ? ' on' : ''}`}
          style={{ width: pageSize.width || undefined, height: pageSize.height || undefined }}
        >
          <canvas ref={canvasRef} className="evd-pdf-canvas" />
          <BoundingBoxOverlay
            boxes={boxes}
            pageSize={pageSize}
            visible={visible}
            onSelect={onSelect}
            onHover={onHover}
            hoveredId={hoveredId}
          />
        </div>
      )}
    </div>
  )
}

export default PdfCanvasViewer
