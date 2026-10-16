'use client'

import React from 'react'

export interface AlertDocument {
  id: string
  invoiceNum: string
  supplierName: string
  companyCode: string
  grandTotal: number
  currency?: string
  status?: string
}

export interface DocumentAlertToastProps {
  doc: AlertDocument
  onView: (doc: AlertDocument) => void
  onClose: () => void
}

export function DocumentAlertToast({ doc, onView, onClose }: DocumentAlertToastProps) {
  const formattedAmount = new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(doc.grandTotal)

  return (
    <div className="doc-alert-toast" role="alert" aria-live="assertive">
      <div className="doc-alert-pulse-line" />
      <div className="doc-alert-content">
        <div className="doc-alert-header">
          <div className="doc-alert-tags">
            <span className="doc-alert-badge-company">{doc.companyCode}</span>
            <span className="doc-alert-badge-id">{doc.id}</span>
          </div>
          <button
            type="button"
            className="doc-alert-close-btn"
            onClick={onClose}
            aria-label="ปิดการแจ้งเตือน"
            title="ปิด"
          >
            ✕
          </button>
        </div>

        <div className="doc-alert-body">
          <div className="doc-alert-title">
            <span className="doc-alert-inv">เลขที่ {doc.invoiceNum}</span>
            <span className="doc-alert-amount">{formattedAmount} {doc.currency || 'THB'}</span>
          </div>
          <div className="doc-alert-supplier" title={doc.supplierName}>
            {doc.supplierName}
          </div>
        </div>

        <div className="doc-alert-actions">
          <span className="doc-alert-incoming-label">⚡ เอกสารใหม่จาก OCR</span>
          <button
            type="button"
            className="btn btn-primary xs doc-alert-view-btn"
            onClick={() => onView(doc)}
          >
            เปิดดูเอกสาร
          </button>
        </div>
      </div>
    </div>
  )
}
