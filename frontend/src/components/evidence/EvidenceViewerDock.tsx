'use client'

/**
 * Evidence dock (design §4.2).
 *
 * The dock shows one document on one of two surfaces:
 *
 *   • **PDF** — PDF.js paints the file served by `api/documents/[id]/pdf`.
 *   • **mock** — the simulated invoice from `EvidenceCanvas`.
 *
 * Which one is authoritative is decided by the Task 6 proxy, which reports its
 * source in `X-PDF-Source`; the hook turns that into `status.mode`. The switch is
 * never a blank panel: the mock page stays on screen while the PDF loads and
 * returns whenever the proxy could not produce a real file.
 *
 * Both surfaces share one overlay pipeline — `projectOverlayBoxes()` maps the
 * Engine's normalised boxes onto the surface's CSS pixels, so the highlight
 * look, the exception tag and the click-through to the detail pane are identical
 * whichever surface produced them.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { InvoiceDoc } from '../../types/invoice'
import { DockControls } from './DockControls'
import { EvidenceCanvas } from './EvidenceCanvas'
import { useInvoices } from '../../context/InvoiceContext'
import { EXCEPTION_RULES } from '../../mock/rules'
import { PdfCanvasViewer } from '../../features/pdf-viewer/components/PdfCanvasViewer'
import { BoundingBoxOverlay } from '../../features/pdf-viewer/components/BoundingBoxOverlay'
import { usePdfViewer } from '../../features/pdf-viewer/hooks/usePdfViewer'
import { useMeasuredRegions } from '../../features/pdf-viewer/hooks/useMeasuredRegions'
import {
  mockEvidenceViewerBBoxes,
  projectOverlayBoxes,
  viewerBoxesFromInvoiceDoc,
  type OverlayBox,
} from '../../features/pdf-viewer/lib/overlayModel'
import {
  DOCK_BODY_INSET,
  mockPageFitScale,
  mockSurfaceStyle,
  type SizeBox,
} from '../../features/pdf-viewer/lib/coordinateTransform'

const EMPTY_SIZE: SizeBox = { width: 0, height: 0 }

/** The dock's share of `.work`: the mockup's 60:40, and how far it may be dragged. */
const DOCK_RATIO_DEFAULT = 0.4
const DOCK_RATIO_MIN = 0.3
const DOCK_RATIO_MAX = 0.5

export function EvidenceViewerDock({ doc }: { doc: InvoiceDoc }) {
  const {
    closeEvidenceDock,
    evidenceDockFocus,
    evidenceSelection,
    setEvidenceSelection,
    dockSplitRatio,
    setDockSplitRatio,
    setIsPdfLoading,
  } = useInvoices()

  const [currentPage, setCurrentPage] = useState<number>(evidenceDockFocus?.page || 1)
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [showEvidence, setShowEvidence] = useState<boolean>(true)
  const [showAllFields, setShowAllFields] = useState<boolean>(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const [bodyWidth, setBodyWidth] = useState<number>(0)
  const [mockPageEl, setMockPageEl] = useState<HTMLDivElement | null>(null)

  // The page has to be measured, not guessed: fit-to-width is what keeps a
  // five-page document readable without a horizontal scrollbar.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const read = () => setBodyWidth(el.clientWidth)
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fit = mockPageFitScale(bodyWidth)
  const surfaceStyle = mockSurfaceStyle({ fit, zoom, rotation })

  const { status, canvasRef, pageSize, reload } = usePdfViewer({
    documentId: doc.doc,
    containerWidth: Math.max(0, bodyWidth - DOCK_BODY_INSET),
    page: currentPage,
    rotation,
    zoom,
  })

  const mockMode = status.mode === 'mock'
  const totalPages = mockMode ? doc.pages || 1 : Math.max(1, status.pageCount)

  // A document switch or a shorter page list must not leave the pager on a page
  // that no longer exists.
  useEffect(() => {
    setCurrentPage(prev => (prev > totalPages ? 1 : prev))
  }, [totalPages, doc.doc])

  // Detail pane → PDF: jumping to a rule also turns to its page.
  useEffect(() => {
    if (evidenceDockFocus?.page) setCurrentPage(evidenceDockFocus.page)
  }, [evidenceDockFocus])

  useEffect(() => {
    setSelectedId(null)
    setHoveredId(null)
  }, [doc.doc])

  const labelOf = (code?: string) => (code ? EXCEPTION_RULES[code]?.name : undefined)

  const pdfBoxes = useMemo(
    () => (status.state === 'ready' ? viewerBoxesFromInvoiceDoc(doc, { labelOf }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc, status.state],
  )

  // Mock mode has no OCR layer, so its regions are measured off the rendered
  // page and put through the same projector.
  const measured = useMeasuredRegions(mockPageEl, mockMode && rotation === 0)
  const mockBoxes = useMemo(
    () => (mockMode ? mockEvidenceViewerBBoxes({ doc, regions: measured.regions, labelOf }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc, mockMode, measured.regions],
  )

  const focusRuleId = evidenceDockFocus?.ruleId ?? evidenceSelection?.ruleId ?? null

  const pdfOverlayBoxes = useMemo(
    () =>
      projectOverlayBoxes(pdfBoxes, {
        page: currentPage,
        pageSize,
        rotation,
        padding: 2,
        focusRuleId,
        focusId: selectedId,
        onlyEvidence: !showAllFields,
      }),
    [pdfBoxes, currentPage, pageSize, rotation, focusRuleId, selectedId, showAllFields],
  )

  const mockPageSize = mockMode && measured.pageSize.width > 0 ? measured.pageSize : EMPTY_SIZE
  const mockOverlayBoxes = useMemo(
    () =>
      projectOverlayBoxes(mockBoxes, {
        page: 1,
        pageSize: mockPageSize,
        // The mock page is turned by a CSS transform, which already carries the
        // boxes with it, so the projector must not rotate them a second time.
        rotation: 0,
        padding: 2,
        focusRuleId,
        focusId: selectedId,
        onlyEvidence: !showAllFields,
      }),
    [mockBoxes, mockPageSize, focusRuleId, selectedId, showAllFields],
  )

  const selectBox = (box: OverlayBox, surface: 'pdf' | 'mock') => {
    setSelectedId(box.id)
    setEvidenceSelection({
      ruleId: box.ruleId,
      lineNo: box.lineNo,
      label: box.tag ?? box.ruleId ?? null,
      surface,
    })
  }

  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  // The toolbar's PDF toggle reports the same flight this dock is waiting on, so
  // the two loading indicators can never disagree. Unmounting (dock closed
  // mid-flight) must not leave the button spinning.
  useEffect(() => {
    setIsPdfLoading(status.state === 'loading')
    return () => setIsPdfLoading(false)
  }, [status.state, setIsPdfLoading])

  /**
   * Drag the dock edge. The width that matters is `.work`'s, because `--mc`/`--dc`
   * are fractions of that grid — measuring the dock itself would feed the ratio
   * back into itself. Pointer listeners live on the window so the pointer may
   * leave the 8px handle mid-drag.
   */
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const workEl = document.getElementById('work')
    const workWidth = workEl?.clientWidth ?? 0
    if (!workEl || !workWidth) return
    e.preventDefault()

    const startX = e.clientX
    const initialRatio = dockSplitRatio
    workEl.classList.add('dragging')

    const onPointerMove = (moveEvent: PointerEvent) => {
      // Pulling the handle left widens the dock, so the delta is inverted.
      const next = initialRatio + (startX - moveEvent.clientX) / workWidth
      const clamped = Math.min(DOCK_RATIO_MAX, Math.max(DOCK_RATIO_MIN, next))
      setDockSplitRatio(Number(clamped.toFixed(3)))
    }

    const onDragEnd = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onDragEnd)
      window.removeEventListener('pointercancel', onDragEnd)
      workEl.classList.remove('dragging')
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onDragEnd)
    window.addEventListener('pointercancel', onDragEnd)
  }

  const handleResizeReset = () => setDockSplitRatio(DOCK_RATIO_DEFAULT)

  const mockSurface = (
    <div
      className="evd-mock"
      style={surfaceStyle as CSSProperties}
    >
      <EvidenceCanvas
        doc={doc}
        pageNumber={currentPage}
        scale={zoom}
        onPageElement={setMockPageEl}
        overlay={
          <BoundingBoxOverlay
            boxes={mockOverlayBoxes}
            pageSize={mockPageSize}
            visible={showEvidence}
            hoveredId={hoveredId}
            onSelect={box => selectBox(box, 'mock')}
            onHover={box => setHoveredId(box?.id ?? null)}
          />
        }
      />
    </div>
  )

  return (
    <section className="col dock" id="dock" aria-label="เอกสาร PDF">
      <div
        className="dock-rz"
        role="separator"
        aria-orientation="vertical"
        title="ลากเพื่อปรับความกว้าง (รายละเอียด 50–70%) · ดับเบิลคลิกเพื่อกลับเป็น 60:40"
        onPointerDown={handleResizeStart}
        onDoubleClick={handleResizeReset}
      />
      <DockControls
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        onPageChange={p => setCurrentPage(p)}
        onZoomChange={setZoom}
        onRotate={handleRotate}
        onClose={closeEvidenceDock}
        mode={mockMode ? 'mock' : 'pdf'}
        source={status.source}
        showEvidence={showEvidence}
        onToggleEvidence={() => setShowEvidence(v => !v)}
        showAllFields={showAllFields}
        onToggleAllFields={() => setShowAllFields(v => !v)}
        boxCount={mockMode ? mockOverlayBoxes.length : pdfOverlayBoxes.length}
      />

      <div className="dock-body evd" ref={bodyRef}>
        <PdfCanvasViewer
          canvasRef={canvasRef}
          status={status}
          pageSize={pageSize}
          boxes={pdfOverlayBoxes}
          visible={showEvidence}
          hoveredId={hoveredId}
          onSelect={box => selectBox(box, 'pdf')}
          onHover={box => setHoveredId(box?.id ?? null)}
          onRetry={reload}
          placeholder={mockSurface}
        />
      </div>
    </section>
  )
}

export default EvidenceViewerDock
