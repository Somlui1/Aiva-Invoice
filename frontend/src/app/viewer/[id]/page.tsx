'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  StandaloneBBoxViewer,
  type BBoxItem,
} from '@/features/pdf-viewer/components/StandaloneBBoxViewer'

export function mapBBoxType(fieldName?: string, elementType?: string): string {
  const f = (fieldName || '').toLowerCase()
  const t = (elementType || '').toLowerCase()
  if (
    t === 'header' ||
    f.includes('header') ||
    f.includes('title') ||
    f.includes('inv_num') ||
    f.includes('doc_')
  ) {
    return 'header'
  }
  if (t === 'supplier' || f.includes('supplier') || f.includes('vendor')) {
    return 'supplier'
  }
  if (t === 'customer' || f.includes('customer') || f.includes('buyer')) {
    return 'customer'
  }
  if (t === 'table' || f.includes('table')) {
    return 'table'
  }
  if (
    t === 'line' ||
    f.includes('line') ||
    f.includes('item') ||
    f.includes('desc') ||
    f.includes('qty') ||
    f.includes('price')
  ) {
    return 'line'
  }
  if (
    t === 'total' ||
    f.includes('total') ||
    f.includes('vat') ||
    f.includes('subtotal') ||
    f.includes('amount')
  ) {
    return 'total'
  }
  if (
    t === 'payment' ||
    f.includes('payment') ||
    f.includes('credit') ||
    f.includes('term') ||
    f.includes('bank') ||
    f.includes('due')
  ) {
    return 'payment'
  }
  if (t === 'signature' || f.includes('sign')) {
    return 'signature'
  }
  if (t === 'stamp' || f.includes('stamp')) {
    return 'stamp'
  }
  return 'other'
}

export default function StandaloneViewerPage() {
  const params = useParams()
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id || ''
  const docId = rawId ? (rawId.startsWith('DMS-') ? rawId : `DMS-${rawId}`) : 'DMS-UNKNOWN'

  const [doc, setDoc] = useState<any>(null)
  const [items, setItems] = useState<BBoxItem[]>([])
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    if (!docId || docId === 'DMS-UNKNOWN') return
    let active = true

    fetch(`/api/documents/${docId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return
        if (data?.document) {
          const d = data.document
          setDoc(d)
          setPageCount(d.pages || 1)
          if (Array.isArray(d.bboxes)) {
            const mapped: BBoxItem[] = d.bboxes.map((b: any, idx: number) => ({
              id: b.id || `b-${idx}`,
              pageNo: b.pageNo || 1,
              type: mapBBoxType(b.fieldName, b.elementType),
              label: b.fieldName || b.elementType || `box_${idx + 1}`,
              text: b.rawValue || '',
              bbox_norm: b.bbox || [0, 0, 0, 0],
            }))
            setItems(mapped)
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load doc for standalone viewer:', err)
      })

    return () => {
      active = false
    }
  }, [docId])

  return (
    <StandaloneBBoxViewer
      docId={docId}
      title={`${docId}${doc?.inv ? ` · ${doc.inv}` : ''}`}
      pdfUrl={`/api/documents/${docId}/pdf`}
      items={items}
      pageCount={pageCount}
    />
  )
}
