'use client'

import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'

interface DockControlsProps {
  currentPage: number
  totalPages: number
  zoom: number
  onPageChange: (p: number) => void
  onZoomChange: (z: number) => void
  onRotate: () => void
  onClose: () => void
}

export function DockControls({
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange,
  onRotate,
  onClose
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
        disabled={zoom <= 0.6}
        onClick={() => onZoomChange(Math.max(0.6, zoom - 0.2))}
        title="ย่อขนาด"
      >
        <Icon name="minus" size="sm" />
      </button>
      <button
        type="button"
        className="btn btn-ghost sm mono"
        onClick={() => onZoomChange(1)}
        title="ขนาดเดิม 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className="btn btn-ghost sm"
        disabled={zoom >= 2}
        onClick={() => onZoomChange(Math.min(2, zoom + 0.2))}
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
