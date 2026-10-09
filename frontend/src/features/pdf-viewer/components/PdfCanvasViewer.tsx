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

export interface PdfCanvasViewerProps {
  /** Canvas owned by `usePdfViewer`; the viewer only sizes and shows it. */
  canvasRef: RefObject<HTMLCanvasElement | null>
  status: PdfViewerStatus
  /** CSS px size of the rendered page, from the same hook. */
  pageSize: SizeBox
  /** Boxes already projected onto `pageSize`. */
  boxes: OverlayBox[]
  onSelect?: (box: OverlayBox) => void
  onHover?: (box: OverlayBox | null) => void
  hoveredId?: string | null
  /** Hide every evidence box: the dock's evidence toggle. */
  visible?: boolean
  /** Simulated invoice page shown until a real page can be painted. */
  placeholder?: ReactNode
  onRetry?: () => void
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
}: PdfCanvasViewerProps) {
  const ready = status.state === 'ready' && pageSize.width > 0 && pageSize.height > 0

  return (
    <div className="evd-pdf" data-pdf-source={status.source ?? 'none'} data-pdf-state={status.state}>
      {ready ? null : (
        <div className="evd-pdf-fallback" role="status">
          {status.state === 'loading' ? (
            <div className="evd-loading-center">
              <span className="spin lg" aria-hidden="true" />
              <span className="evd-pdf-note">
                กำลังดาวน์โหลดและเรนเดอร์เอกสาร PDF จาก DMS…
              </span>
            </div>
          ) : (
            <span className="evd-pdf-note bad">
              แสดงเอกสารจำลอง — {status.reason || 'เปิดไฟล์ PDF ไม่ได้'}
              {onRetry ? (
                <button type="button" className="btn btn-ghost xs" onClick={onRetry}>
                  ลองใหม่
                </button>
              ) : null}
            </span>
          )}
          {placeholder}
        </div>
      )}

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
    </div>
  )
}

export default PdfCanvasViewer
