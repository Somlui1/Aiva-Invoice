'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  StandaloneBBoxViewer,
  type BBoxItem,
  mapBBoxType,
} from '@/features/pdf-viewer/components/StandaloneBBoxViewer'

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
          const rawBoxes =
            Array.isArray(d.bboxes) && d.bboxes.length > 0
              ? d.bboxes
              : Array.isArray(d.raw_payload?.ocr?.elements)
                ? d.raw_payload.ocr.elements.map((el: any) => ({
                    id: el.element_id,
                    pageNo: el.page_no,
                    bbox: el.bbox,
                    fieldName: el.field_name,
                    rawValue: el.raw_value,
                    elementType: el.element_type,
                  }))
                : []

          const mapped: BBoxItem[] = rawBoxes.map((b: any, idx: number) => ({
            id: b.id || `b-${idx}`,
            pageNo: b.pageNo || b.page_no || 1,
            type: mapBBoxType(b.fieldName || b.field_name, b.elementType || b.element_type),
            label: b.fieldName || b.field_name || b.elementType || b.element_type || `box_${idx + 1}`,
            text: b.rawValue ?? b.raw_value ?? '',
            bbox_norm: b.bbox || [0, 0, 0, 0],
          }))
          setItems(mapped)
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
