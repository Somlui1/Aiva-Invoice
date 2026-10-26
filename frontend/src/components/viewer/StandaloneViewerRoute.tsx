import React, { useEffect, useMemo, useState } from 'react'
import { parseViewerQuery, viewerFocusFor } from '../../features/evidence/viewerFocus'
import {
  StandaloneBBoxViewer,
  type BBoxItem,
  mapBBoxType,
} from '../../features/pdf-viewer/components/StandaloneBBoxViewer'

export function StandaloneViewerRoute({ docId: propDocId }: { docId?: string }) {
  let docId = propDocId
  if (!docId && typeof window !== 'undefined') {
    const match = window.location.pathname.match(/\/viewer\/([^/?#]+)/)
    if (match) docId = match[1]
  }
  const effectiveId = docId ? (docId.startsWith('DMS-') ? docId : `DMS-${docId}`) : 'DMS-UNKNOWN'

  const [doc, setDoc] = useState<any>(null)
  const [items, setItems] = useState<BBoxItem[]>([])
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    if (!effectiveId || effectiveId === 'DMS-UNKNOWN') return
    let active = true

    fetch(`/api/documents/${effectiveId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
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
      .catch(err => {
        console.warn('Could not load doc for standalone viewer:', err)
      })

    return () => {
      active = false
    }
  }, [effectiveId])

  // `?finding=X3&t=0`: open on one finding (the dock's "open in new tab" carries it).
  const query = useMemo(
    () => parseViewerQuery(typeof window !== 'undefined' ? window.location.search : ''),
    [],
  )
  const focus = useMemo(() => viewerFocusFor(doc, query.finding, query.target), [doc, query])

  return (
    <StandaloneBBoxViewer
      focusIds={focus?.ids}
      scrollToId={focus?.firstId}
      focusNote={focus?.note}
      docId={effectiveId}
      title={`${effectiveId}${doc?.inv ? ` · ${doc.inv}` : ''}`}
      pdfUrl={`/api/documents/${effectiveId}/pdf`}
      items={items}
      pageCount={pageCount}
    />
  )
}
