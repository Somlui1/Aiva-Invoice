'use client'

import React from 'react'
import { DocumentAlertToast, type AlertDocument } from './DocumentAlertToast'
import { useDocumentAlerts } from './useDocumentAlerts'
import { useInvoices } from '../../context/InvoiceContext'

interface DocumentAlertHostProps {
  onNavigateQueue?: () => void
}

export function DocumentAlertHost({ onNavigateQueue }: DocumentAlertHostProps) {
  const { activeAlerts, dismissAlert } = useDocumentAlerts()
  const { selectDoc, refreshFromBackend } = useInvoices()

  if (activeAlerts.length === 0) return null

  const handleView = (doc: AlertDocument) => {
    dismissAlert(doc.id)
    if (onNavigateQueue) {
      onNavigateQueue()
    }
    if (refreshFromBackend) {
      refreshFromBackend().catch(() => {})
    }
    selectDoc(doc.id)
  }

  return (
    <div className="doc-alerts-container" aria-label="รายการแจ้งเตือนเอกสารใหม่">
      {activeAlerts.map((doc) => (
        <DocumentAlertToast
          key={doc.id}
          doc={doc}
          onView={handleView}
          onClose={() => dismissAlert(doc.id)}
        />
      ))}
    </div>
  )
}
