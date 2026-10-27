'use client'

/**
 * PDF.js canvas stage with the evidence overlay on top (design §4.2).
 *
 * The canvas is *always* mounted — PDF.js can only paint into a node that
 * exists, so while the document is loading or has fallen back, the simulated
 * invoice passed in as `placeholder` is drawn in its place instead. That is what
 * makes the PDF/mock switch a state change rather than a mount/unmount race, and
 * it is why the caller (the dock) never has to keep the canvas alive itself.
 */
import type { ReactNode } from 'react'
import type { RefObject } from 'react'
import type { SizeBox } from '../lib/coordinateTransform'
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
  /** PDF.js is painting the page (from `usePdfViewer`). */
  rendering?: boolean
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
}

export function PdfCanvasViewer({
  canvasRef,
  status,
  pageSize,
  rendering = false,
  boxes,
  onSelect,
  onHover,
  hoveredId = null,
  visible = true,
  placeholder,
  onRetry,
  onClose,
}: PdfCanvasViewerProps) {
  const painted = pageSize.width > 0 && pageSize.height > 0
  const ready = status.state === 'ready' && painted
  /**
   * v5.7: "loading" = downloading the bytes OR parsed-but-not-painted. In both cases the preview is
   * hidden and only the spinner shows — previously the gap between `ready` and the first paint fell
   * through to the simulated-document fallback, which flashed a fake invoice while the real one loaded.
   */
  const firstLoad = status.state === 'loading' || (status.state === 'ready' && !painted)
  /** Page turn / zoom / rotate on an already painted document: keep the page, overlay the spinner. */
  const repainting = ready && rendering
  const progressState: 'idle' | 'loading' | 'ready' | 'error' =
    firstLoad || repainting
      ? 'loading'
      : ready
        ? 'ready'
        : status.state === 'error'
          ? 'error'
          : 'idle'

  return (
    <div
      className="evd-pdf"
      data-pdf-source={status.source ?? 'none'}
      data-pdf-state={firstLoad ? 'loading' : status.state}
      aria-busy={firstLoad || repainting}
    >
      <PdfTopProgressBar state={progressState} />
      {ready ? null : firstLoad ? (
        <div className="evd-loading-minimal" role="status" aria-live="polite" data-testid="pdf-loading">
          <span className="spin lg" aria-hidden="true" />
          <span className="evd-loading-txt">กำลังโหลดเอกสาร…</span>
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
      {repainting && (
        <div className="evd-repaint" role="status" aria-live="polite" data-testid="pdf-repainting">
          <span className="spin lg" aria-label="กำลังแสดงหน้าเอกสาร" />
        </div>
      )}

      <div
        className={`evd-page evd-pdf-page${ready ? ' on' : ''}${repainting ? ' is-repainting' : ''}`}
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
    </div>
  )
}

export default PdfCanvasViewer
