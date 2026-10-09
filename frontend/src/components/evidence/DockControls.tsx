'use client'

import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import type { PdfProxySource } from '../../features/pdf-viewer/types'
import {
  MIN_ZOOM,
  MAX_ZOOM,
  zoomForStep,
} from '../../features/pdf-viewer/lib/coordinateTransform'

interface DockControlsProps {
  currentPage: number
  totalPages: number
  zoom: number
  onPageChange: (p: number) => void
  onZoomChange: (z: number) => void
  onRotate: () => void
  onClose: () => void
  /** Which surface is showing, so the analyst knows what they are looking at. */
  mode?: 'pdf' | 'mock'
  /** Where the bytes came from, from `X-PDF-Source`. */
  source?: PdfProxySource
  showEvidence?: boolean
  onToggleEvidence?: () => void
  showAllFields?: boolean
  onToggleAllFields?: () => void
  /** Evidence boxes currently drawn on the page. */
  boxCount?: number
}

/** Human label for the proxy source, shown next to the document title. */
const SOURCE_LABEL: Record<PdfProxySource, string> = {
  dms_live: 'DMS (สด)',
  cache: 'คลังเอกสาร',
  fallback_mock: 'เอกสารจำลอง',
}

export function DockControls({
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange,
  onRotate,
  onClose,
  mode = 'pdf',
  source,
  showEvidence = true,
  onToggleEvidence,
  showAllFields = false,
  onToggleAllFields,
  boxCount = 0
}: DockControlsProps) {
  const { currentUser } = useAuth()

  return (
    <div className="dock-ctl">
      <span className="dock-title">
        <Icon name="file" size="sm" />
        เอกสาร PDF
      </span>

      <span className="vsep" />

      {/* Pagination */}
      <button
        type="button"
        className="btn btn-ghost sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        title="หน้าก่อนหน้า"
      >
        <Icon name="chevL" size="sm" />
      </button>
      <span className="mono sm">
        หน้า {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-ghost sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        title="หน้าถัดไป"
      >
        <Icon name="chevR" size="sm" />
      </button>

      <span className="vsep" />

      {/* Zoom controls */}
      <button
        type="button"
        className="btn btn-ghost sm"
        disabled={zoom <= MIN_ZOOM}
        onClick={() => onZoomChange(zoomForStep(zoom, -0.1))}
        title="ย่อขนาด"
      >
        <Icon name="minus" size="sm" />
      </button>
      <button
        type="button"
        className="btn btn-ghost sm mono"
        onClick={() => onZoomChange(zoomForStep(zoom, 'fit'))}
        title="ขนาดเดิม 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className="btn btn-ghost sm"
        disabled={zoom >= MAX_ZOOM}
        onClick={() => onZoomChange(zoomForStep(zoom, 0.1))}
        title="ขยายขนาด"
      >
        <Icon name="plus" size="sm" />
      </button>

      {/* Rotate */}
      <button
        type="button"
        className="btn btn-ghost sm"
        onClick={onRotate}
        title="หมุนหน้าเอกสาร"
      >
        <Icon name="rotate" size="sm" />
      </button>

      <span className="vsep" />

      {/* What is on screen, and where it came from */}
      <span className={`dock-source ${mode === 'pdf' ? 'live' : 'mock'}`} title="แหล่งที่มาของเอกสารที่แสดงอยู่">
        <Icon name={mode === 'pdf' ? 'file' : 'flask'} size="sm" />
        {source ? SOURCE_LABEL[source] : mode === 'pdf' ? 'PDF' : 'เอกสารจำลอง'}
      </span>

      {/* Evidence overlay toggles */}
      <button
        type="button"
        className={`btn btn-ghost sm ${showEvidence ? 'on' : ''}`}
        onClick={onToggleEvidence}
        title="แสดง/ซ่อนกรอบหลักฐาน"
        aria-pressed={showEvidence}
      >
        <Icon name="target" size="sm" />
        หลักฐาน {showEvidence ? boxCount : 0}
      </button>
      <button
        type="button"
        className={`btn btn-ghost sm ${showAllFields ? 'on' : ''}`}
        onClick={onToggleAllFields}
        title="แสดงทุกลิงก์ข้อมูลที่ OCR อ่านได้ (ไม่ใช่เฉพาะที่มีข้อยกเว้น)"
        aria-pressed={showAllFields}
      >
        <Icon name="layers" size="sm" />
        ทุกลิงก์ข้อมูล
      </button>

      <span className="grow" />

      {/* Watermark notice */}
      <span className="muted xs" style={{ marginRight: 8 }}>
        ดูผ่าน AIVA Portal · {currentUser.email}
      </span>

      {/* Close dock */}
      <button
        type="button"
        id="pdfClose"
        className="btn btn-danger sm"
        onClick={onClose}
        title="ปิด PDF (P / Esc)"
      >
        <Icon name="x" size="sm" />
        ปิด PDF
      </button>
    </div>
  )
}

export default DockControls
