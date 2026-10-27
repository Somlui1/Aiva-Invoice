import React, { useEffect, useMemo, useState } from 'react'
import { parseViewerQuery, viewerFocusFor } from '../../features/evidence/viewerFocus'
import {
  StandaloneBBoxViewer,
  type BBoxItem,
  bboxTagOf,
} from '../../features/pdf-viewer/components/StandaloneBBoxViewer'

/**
 * Boxes for the inspector, from the Portal payload (`bboxes[]`, flattened from System A's
 * `ocr.elements[]` by the engine adapter) or — for rows stored before that — the raw result/3.0.
 * Tag = `element_type`; nothing is moved, resized or invented.
 */
export function bboxItemsFromDocument(d: any): BBoxItem[] {
  const fromPortal = Array.isArray(d?.bboxes) && d.bboxes.length > 0
  const raw: any[] = fromPortal
    ? d.bboxes
    : Array.isArray(d?.raw_payload?.ocr?.elements)
      ? d.raw_payload.ocr.elements
      : []
  const out: BBoxItem[] = []
  raw.forEach((b: any, idx: number) => {
    const box = b.bbox
    if (!Array.isArray(box) || box.length !== 4 || box.some((v: unknown) => typeof v !== 'number' || !Number.isFinite(v))) return
    const elementType = b.elementType ?? b.element_type
    const fieldName = b.fieldName ?? b.field_name
    const rawValue = b.rawValue ?? b.raw_value ?? (b.normalized_value == null ? '' : String(b.normalized_value))
    const code = b.exceptionCode ?? b.exception_code
    out.push({
      id: b.id || b.element_id || `b-${idx}`,
      pageNo: b.pageNo || b.page_no || 1,
      type: bboxTagOf(elementType),
      label: fieldName || bboxTagOf(elementType),
      text: rawValue ?? '',
      bbox_norm: [box[0], box[1], box[2], box[3]],
      confidence: typeof b.confidence === 'number' ? b.confidence : undefined,
      codes: code ? [String(code)] : undefined,
      severity: b.severity,
    })
  })
  return out
}

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
  const [docLoading, setDocLoading] = useState(true)

  useEffect(() => {
    if (!effectiveId || effectiveId === 'DMS-UNKNOWN') {
      setDocLoading(false)
      return
    }
    let active = true
    setDocLoading(true)

    // credentials: the httpOnly session cookie; a 401 is handled by the session guard (main.tsx).
    fetch(`/api/documents/${effectiveId}`, { credentials: 'same-origin', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active || !data?.document) return
        const d = data.document
        setDoc(d)
        setPageCount(d.pages || 1)
        setItems(bboxItemsFromDocument(d))
      })
      .catch(err => {
        console.warn('Could not load doc for standalone viewer:', err)
      })
      .finally(() => active && setDocLoading(false))

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
      loading={docLoading}
    />
  )
}
