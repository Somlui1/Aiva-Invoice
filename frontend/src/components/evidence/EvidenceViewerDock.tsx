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
import { InvoiceDoc, type Finding } from '../../types/invoice'
import { Icon } from '../common/Icon'
import { DockControls } from './DockControls'
import { FindingBanner } from './FindingBanner'
import { FindingStatusBar } from './FindingStatusBar'
import { documentFindings } from '../../features/evidence/findings'
import { clampTarget, stepFinding, stepTarget, viewerBoxId } from '../../features/evidence/focus'
import { EvidenceCanvas } from './EvidenceCanvas'
import { useInvoices } from '../../context/InvoiceContext'
import { useAuth } from '../../context/AuthContext'
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
import { uiZoom } from '../../lib/uiZoom'
import { checkPageFrame, frameMismatchText } from '../../features/pdf-viewer/lib/pageFrame'

const EMPTY_SIZE: SizeBox = { width: 0, height: 0 }

/** The dock's share of `.work`: the mockup's 60:40, and how far it may be dragged. */
const DOCK_RATIO_DEFAULT = 0.4
const DOCK_RATIO_MIN = 0.3
const DOCK_RATIO_MAX = 0.5

export function EvidenceViewerDock({ doc }: { doc: InvoiceDoc }) {
  const { currentUser } = useAuth()
  const {
    closeEvidenceDock,
    openEvidence,
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
  // We measure immediately, observe with ResizeObserver, and re-read as the
  // 350ms CSS grid transition (.work.pdf-open) settles.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const read = () => {
      if (el.clientWidth > 0) {
        setBodyWidth(el.clientWidth)
      }
    }
    read()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null
    observer?.observe(el)

    const t1 = setTimeout(read, 50)
    const t2 = setTimeout(read, 150)
    const t3 = setTimeout(read, 360)
    const t4 = setTimeout(read, 500)

    const workEl = document.getElementById('work')
    workEl?.addEventListener('transitionend', read)
    window.addEventListener('resize', read)

    return () => {
      observer?.disconnect()
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      workEl?.removeEventListener('transitionend', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  const fit = mockPageFitScale(bodyWidth)
  const surfaceStyle = mockSurfaceStyle({ fit, zoom, rotation })

  const { status, canvasRef, pageSize, reload, rendering, pageFramePt } = usePdfViewer({
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

  // Detail pane → PDF: jumping to a rule also turns to its page and enables evidence boxes.
  useEffect(() => {
    if (!evidenceDockFocus) return
    if (evidenceDockFocus.page) setCurrentPage(evidenceDockFocus.page)
    setShowEvidence(true)
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

  // ---- Finding focus (the 3-state button) -------------------------------------------------------
  // The chip strip, the status bar and the keyboard all walk the same list.
  const findingList = useMemo(() => documentFindings(doc), [doc])
  const focusFindingId = evidenceDockFocus?.findingId ?? null
  const focusFinding = useMemo(
    () => (focusFindingId ? findingList.find(f => f.id === focusFindingId) : undefined),
    [findingList, focusFindingId],
  )
  const focusTargetIdx = focusFinding ? clampTarget(focusFinding, evidenceDockFocus?.targetIdx ?? 0) : 0
  const focusTarget = focusFinding ? focusFinding.targets[focusTargetIdx] : undefined
  // A finding with no box never moves the PDF: no page turn, no scroll, nothing lit — banner only.
  const focusUnlocated = !!focusFindingId && evidenceDockFocus?.locatable === false

  // v5.11.1: never draw the Engine's boxes on a page of a different shape (another file / rotation).
  const frameCheck = useMemo(() => {
    if (!pageFramePt || pageFramePt.page !== currentPage) return { ok: true as const }
    const engine = doc.pageFrames?.find(p => p.pageNo === currentPage)
    return checkPageFrame(engine, pageFramePt)
  }, [doc.pageFrames, pageFramePt, currentPage])

  const pdfOverlayBoxes = useMemo(
    () =>
      !frameCheck.ok ? [] : projectOverlayBoxes(pdfBoxes, {
        page: currentPage,
        pageSize,
        rotation,
        padding: 2,
        focusRuleId,
        focusId: selectedId,
        activeRuleId: focusRuleId,
        activeFindingId: focusFindingId,
        activeExceptionCode: evidenceSelection?.exceptionCode,
        onlyEvidence: !showAllFields,
      }),
    [frameCheck.ok, pdfBoxes, currentPage, pageSize, rotation, focusRuleId, focusFindingId, selectedId, showAllFields, evidenceSelection?.exceptionCode],
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
        activeRuleId: focusRuleId,
        // Mock regions are per rule (no findingIds): the projector falls back to the rule.
        activeFindingId: focusFindingId,
        activeExceptionCode: evidenceSelection?.exceptionCode,
        onlyEvidence: !showAllFields,
      }),
    [mockBoxes, mockPageSize, focusRuleId, focusFindingId, selectedId, showAllFields, evidenceSelection?.exceptionCode],
  )

  const selectBox = (box: OverlayBox, surface: 'pdf' | 'mock') => {
    setSelectedId(box.id)
    setEvidenceSelection({
      ruleId: box.ruleId,
      lineNo: box.lineNo,
      label: box.tag ?? box.ruleId ?? null,
      // the finding the picked box belongs to (the active one when the box serves several)
      ...(box.findingIds?.length
        ? { findingId: focusFindingId && box.findingIds.includes(focusFindingId) ? focusFindingId : box.findingIds[0] }
        : {}),
      surface,
    })
  }

  const handleSelectFinding = (f: Finding, targetIdx = 0) => {
    setShowEvidence(true)
    openEvidence(f, targetIdx)
  }
  const handleStepTarget = (delta: 1 | -1) => {
    if (focusFinding) handleSelectFinding(focusFinding, stepTarget(focusFinding, focusTargetIdx, delta))
  }
  const handleStepFinding = (delta: 1 | -1) => {
    const next = stepFinding(findingList, focusFindingId, delta)
    if (next) handleSelectFinding(next)
  }

  // Alt+←/→ = boxes of the finding, Alt+↑/↓ = previous / next finding. Not while typing.
  // (`[` is the sidebar toggle, so plain keys are left alone.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const map: Record<string, () => void> = {
        ArrowLeft: () => handleStepTarget(-1),
        ArrowRight: () => handleStepTarget(1),
        ArrowUp: () => handleStepFinding(-1),
        ArrowDown: () => handleStepFinding(1),
      }
      const fn = map[e.key]
      if (!fn) return
      e.preventDefault()
      fn()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const handleSelectRule = (ruleId: string, page?: number) => {
    if (page) setCurrentPage(page)
    setShowEvidence(true)
    const matchingBox = (mockMode ? mockOverlayBoxes : pdfOverlayBoxes).find(b => b.ruleId === ruleId)
    if (matchingBox) {
      selectBox(matchingBox, mockMode ? 'mock' : 'pdf')
    } else {
      setSelectedId(null)
      setEvidenceSelection({
        ruleId,
        label: labelOf(ruleId) ?? ruleId,
        surface: mockMode ? 'mock' : 'pdf',
      })
    }
  }

  // Finding focus: light the box the request names. The mock page has no per-finding boxes (its
  // regions are per rule), so there the whole rule's region is lit instead of one box.
  useEffect(() => {
    if (!evidenceDockFocus?.findingId) return
    setSelectedId(!mockMode && focusTarget ? viewerBoxId(doc.doc, focusTarget.id) : null)
    // Keyed on the request itself: the target is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidenceDockFocus, mockMode])

  // Legacy rule focus (openEvidenceDock(page, rule)): match and select the rule's box.
  useEffect(() => {
    if (evidenceDockFocus?.findingId) return // finding focus is handled above (and by openEvidence)
    const targetRule = evidenceDockFocus?.ruleId
    if (!targetRule) return

    const boxes = mockMode ? mockOverlayBoxes : pdfOverlayBoxes
    // Exact match only: the old prefix match ("V-0" ~ "V-01") sent every request to the first box.
    const found = boxes.find(b => b.ruleId === targetRule || b.id === targetRule)
    if (found) {
      if (found.id !== selectedId) {
        setSelectedId(found.id)
      }
      setEvidenceSelection({
        ruleId: found.ruleId,
        lineNo: found.lineNo,
        label: found.tag ?? found.ruleId ?? null,
        surface: mockMode ? 'mock' : 'pdf',
      })
    } else {
      setEvidenceSelection({
        ruleId: targetRule,
        label: labelOf(targetRule) ?? targetRule,
        surface: mockMode ? 'mock' : 'pdf',
      })
    }
  }, [evidenceDockFocus, mockMode, mockOverlayBoxes, pdfOverlayBoxes, selectedId, setEvidenceSelection])

  // Auto-scroll to the focused bbox element — exactly once per request.
  //  • A finding with no box never scrolls (focusUnlocated).
  //  • A request arms the scroll only when its nonce is new. Arming on every dependency change made
  //    one open scroll several times (page turn and PDF-ready each re-armed it), so `lastScrollNonce`
  //    consumes a request exactly once; Alt+→ / Alt+← bump the nonce in DockControls, zoom does not.
  //  • A request that turns the page finds its box only after the new page is drawn, so the request
  //    stays "armed" and the box-count effect below retries until the box exists — the first box that
  //    is found disarms it, so nothing scrolls again for the same request.
  const scrollArmed = useRef(false)
  const lastScrollNonce = useRef<number | null>(null)
  const activeBoxCount = (mockMode ? mockOverlayBoxes : pdfOverlayBoxes).length

  const scrollToFocused = (): boolean => {
    const container = bodyRef.current
    if (!container) return false
    const targetRule = evidenceDockFocus?.ruleId ?? evidenceSelection?.ruleId
    const targetEl =
      (container.querySelector('.hl.focus') as HTMLElement | null) ||
      (selectedId ? (container.querySelector(`[data-id="${selectedId}"]`) as HTMLElement | null) : null) ||
      (targetRule ? (container.querySelector(`.hl[data-rule="${targetRule}"]`) as HTMLElement | null) : null)
    if (!targetEl) return false
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    return true
  }

  useEffect(() => {
    const nonce = evidenceDockFocus?.nonce
    const isNewRequest = nonce !== undefined && nonce !== lastScrollNonce.current
    // Consume the request before anything can bail out, so an unrelated re-render cannot arm it again.
    if (isNewRequest) lastScrollNonce.current = nonce

    if (focusUnlocated) {
      scrollArmed.current = false
      return
    }
    if (isNewRequest) scrollArmed.current = true
    if (!scrollArmed.current) return

    const targetRule = evidenceDockFocus?.ruleId ?? evidenceSelection?.ruleId
    if (!targetRule && !selectedId) {
      scrollArmed.current = false
      return
    }

    const timer = setTimeout(() => {
      if (scrollArmed.current && scrollToFocused()) scrollArmed.current = false
    }, 150)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidenceDockFocus?.nonce, evidenceDockFocus?.ruleId, selectedId, evidenceSelection?.ruleId, currentPage, mockMode, status.state, focusUnlocated])

  useEffect(() => {
    if (!scrollArmed.current || focusUnlocated || activeBoxCount === 0) return
    const timer = setTimeout(() => {
      if (scrollArmed.current && scrollToFocused()) scrollArmed.current = false
    }, 60)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoxCount, focusUnlocated])

  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  // The toolbar's PDF toggle reports the same flight this dock is waiting on, so
  // the two loading indicators can never disagree. Unmounting (dock closed
  // mid-flight) must not leave the button spinning.
  useEffect(() => {
    // Downloading, or parsed but the first page is not painted yet: both are "loading" to the user.
    setIsPdfLoading(status.state === 'loading' || (status.state === 'ready' && pageSize.width === 0))
    return () => setIsPdfLoading(false)
  }, [status.state, pageSize.width, setIsPdfLoading])

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
      // v5.10.2: clientX is visual px, clientWidth is layout px → scale by the app zoom
      const next = initialRatio + (startX - moveEvent.clientX) / (workWidth * uiZoom())
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
        doc={doc}
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
        onToggleEvidence={v => setShowEvidence(prev => (typeof v === 'boolean' ? v : !prev))}
        showAllFields={showAllFields}
        onToggleAllFields={() => setShowAllFields(v => !v)}
        boxCount={mockMode ? mockOverlayBoxes.length : pdfOverlayBoxes.length}
        activeRuleId={focusRuleId}
        onSelectRule={handleSelectRule}
        findings={findingList}
        activeFindingId={focusFindingId}
        onSelectFinding={f => handleSelectFinding(f)}
      />

      {showEvidence && focusFinding && (
        <FindingStatusBar
          finding={focusFinding}
          targetIdx={focusTargetIdx}
          position={Math.max(0, findingList.findIndex(f => f.id === focusFinding.id))}
          total={findingList.length}
          onStepTarget={handleStepTarget}
          onStepFinding={handleStepFinding}
        />
      )}
      {showEvidence && focusFinding && focusUnlocated && <FindingBanner finding={focusFinding} />}
      {showEvidence && !mockMode && !frameCheck.ok && (
        <div className="evd-frame-warn" role="alert" data-testid="pdf-frame-mismatch">
          <Icon name="alert" size="sm" />
          <span>{frameMismatchText(frameCheck)}</span>
        </div>
      )}

      <div className="dock-body evd" ref={bodyRef}>
        <PdfCanvasViewer
          canvasRef={canvasRef}
          status={status}
          pageSize={pageSize}
          rendering={rendering}
          boxes={pdfOverlayBoxes}
          visible={showEvidence}
          hoveredId={hoveredId}
          onSelect={box => selectBox(box, 'pdf')}
          onHover={box => setHoveredId(box?.id ?? null)}
          onRetry={reload}
          onClose={closeEvidenceDock}
          placeholder={mockSurface}
        />
      </div>

      <div className="dock-f" id="dockFoot">
        <Icon name="lock" size="sm" />
        <span>ลิงก์ชั่วคราว 10 นาที ออกโดย Portal หลังตรวจสิทธิ์ · ลายน้ำ</span>
        <span className="mono grow">
          {currentUser.email} · token {doc.doc}
        </span>
      </div>
    </section>
  )
}

export default EvidenceViewerDock
