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
