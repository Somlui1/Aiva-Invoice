'use client'

import React from 'react'
import type { PdfViewerError } from '../types'

export interface PdfErrorViewProps {
  error: PdfViewerError
  onRetry?: () => void
  onClose: () => void
}

export function PdfErrorView({ error, onRetry, onClose }: PdfErrorViewProps) {
  return (
    <div className="evd-error-mat" role="alert">
      <div className="evd-error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="evd-error-title">โหลดเอกสารไม่สำเร็จ</div>
      <div className="evd-error-desc">{error.message}</div>
      <div className="evd-error-code">
        {error.code} · {error.ref}
      </div>

      <div className="evd-error-actions">
        {error.retryable && onRetry ? (
          <button type="button" className="btn btn-sec sm" onClick={onRetry}>
            ลองอีกครั้ง
          </button>
        ) : null}
        <button type="button" className="btn btn-ghost sm" onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  )
}

export default PdfErrorView
