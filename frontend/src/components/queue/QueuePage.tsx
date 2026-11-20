'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { QueueToolbar } from './QueueToolbar'
import { QueueKpiCards } from './QueueKpiCards'
import { QueueTableView } from './QueueTableView'
import { QueueListItem } from './QueueListItem'
import { InvoiceDetailPane } from './InvoiceDetailPane'
import { ActionModalDialog } from './ActionModals'
import { SmartSearchBox } from './SmartSearchBox'
import { EvidenceViewerDock } from '../evidence/EvidenceViewerDock'
import { QueueLiveBanner } from './QueueLiveBanner'
import { useInvoices } from '../../context/InvoiceContext'
import { useAuth } from '../../context/AuthContext'
import { ActionType } from '../../mock/rules'
import { publishEffectiveLayout, saveLayoutPrefs, useLayoutPrefs } from '../../lib/layoutPrefs'
import {
  QUEUE_COLLAPSE_BELOW,
  QUEUE_FLYOUT_WIDTH,
  QUEUE_MAX,
  clamp,
  densityFor,
  snapQueueWidth,
  solveQueueLayout,
} from '../../lib/queueLayout'
import { uiZoom } from '../../lib/uiZoom'

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

export function QueuePage() {
  const { currentUser, can } = useAuth()
  const {
    viewMode,
    setViewMode,
    filteredDocs,
    selectedDoc,
    selectedDocId,
    selectDoc,
    staleDocs,
    periodFilter,
    setPeriodFilter,
    isEvidenceDockOpen,
    openEvidenceDock,
    closeEvidenceDock,
    dockSplitRatio
  } = useInvoices()
  const prefs = useLayoutPrefs()

  const [modalAction, setModalAction] = useState<ActionType | null>(null)
  const railRef = useRef<HTMLButtonElement>(null)

  // The dock column is the grid's fourth track, and `queue.css` sizes it from
  // `--dc` (default `0fr`, i.e. zero width). Until the same condition that mounts
  // `<EvidenceViewerDock/>` also opens that track, the dock renders into a
  // 0-pixel column: the button flips to "ปิด PDF" and nothing appears.
  const dockVisible = isEvidenceDockOpen && !!selectedDoc

  // ---- v5.17 adaptive 3-pane layout ------------------------------------------------------------
  // The width of `.work` decides what fits; the user's preference is never rewritten by it.
  const workRef = useRef<HTMLDivElement | null>(null)
  const [workWidth, setWorkWidth] = useState(0)
  useEffect(() => {
    const el = workRef.current
    if (!el) return
    const read = () => setWorkWidth(el.clientWidth || 0)
    read()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [viewMode])

  const layout = useMemo(
    () => solveQueueLayout({ workWidth, pdfOpen: dockVisible, prefs, ratio: dockSplitRatio }),
    [workWidth, dockVisible, prefs, dockSplitRatio],
  )
  useEffect(() => {
    publishEffectiveLayout({ ...layout, workWidth, pdfOpen: dockVisible })
    return () => publishEffectiveLayout(null)
  }, [layout, workWidth, dockVisible])

  /** The queue opened over the PDF from the rail (v5.17 "พับ" / too narrow). Not in legacy mode. */
  const [flyout, setFlyout] = useState(false)
  useEffect(() => {
    if (layout.queue !== 'rail' || !dockVisible) setFlyout(false)
  }, [layout.queue, dockVisible])

  const showPanel = layout.queue === 'panel' || flyout
  const panelWidth = layout.queue === 'panel' ? layout.queueWidth : QUEUE_FLYOUT_WIDTH
  const density = layout.queue === 'panel' ? layout.density : (densityFor(QUEUE_FLYOUT_WIDTH) as 'compact')

  /** Show the queue = close the PDF preview (focus mode ends, menu and queue return). Legacy rail. */
  const showQueue = useCallback(() => {
    closeEvidenceDock()
    requestAnimationFrame(() => {
      const sel = document.querySelector<HTMLElement>('#list .qi.on') || document.querySelector<HTMLElement>('#list .qi')
      sel?.scrollIntoView({ block: 'nearest' })
      sel?.focus?.({ preventScroll: true })
    })
  }, [closeEvidenceDock])

  const onRail = useCallback(() => {
    if (layout.railClosesPdf) showQueue()
    else setFlyout(v => !v)
  }, [layout.railClosesPdf, showQueue])

  const pick = useCallback(
    (id: string) => {
      selectDoc(id)
      setFlyout(false)
    },
    [selectDoc],
  )

  // Keep the selected row in view when it changes from the keyboard (J/K) or elsewhere.
  useEffect(() => {
    if (!selectedDocId) return
    const el = document.querySelector<HTMLElement>(`#list .qi[data-doc="${selectedDocId.replace(/["\\]/g, '')}"]`)
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedDocId, showPanel])

  // J / K = next / previous document · P = PDF on/off · Esc closes the flyout before the PDF.
  const stateRef = useRef({ filteredDocs, selectedDocId, dockVisible, flyout, modalAction, viewMode, canDms: can('DMS') })
  stateRef.current = { filteredDocs, selectedDocId, dockVisible, flyout, modalAction, viewMode, canDms: can('DMS') }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = stateRef.current
      if (st.viewMode !== 'split' || st.modalAction) return
      if (e.key === 'Escape' && st.flyout) {
        e.preventDefault()
        e.stopPropagation()
        setFlyout(false)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
      if (document.querySelector('.lm-pop, [aria-modal="true"]')) return
      const k = e.key.toLowerCase()
      if (k === 'j' || k === 'k') {
        const list = st.filteredDocs
        if (!list.length) return
        e.preventDefault()
        const i = list.findIndex(d => d.doc === st.selectedDocId)
        const next = i < 0 ? (k === 'j' ? 0 : list.length - 1) : clamp(i + (k === 'j' ? 1 : -1), 0, list.length - 1)
        selectDoc(list[next].doc)
      } else if (k === 'p' && st.selectedDocId && st.canDms) {
        e.preventDefault()
        if (st.dockVisible) closeEvidenceDock()
        else openEvidenceDock(1)
      }
    }
    // capture: Esc on the flyout must not also reach the shell's "Esc closes the PDF"
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [selectDoc, openEvidenceDock, closeEvidenceDock])

  // ---- queue splitter: drag (snaps to Slim / Compact / Full, collapses below 96px) + keyboard ----
  const [dragW, setDragW] = useState<number | null>(null)
  const startQueueDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || layout.queue !== 'panel') return
    const work = workRef.current
    if (!work) return
    e.preventDefault()
    const left = work.getBoundingClientRect().left
    const zoom = uiZoom() || 1
    let w = layout.queueWidth
    work.classList.add('dragging')
    const move = (ev: PointerEvent) => {
      w = clamp((ev.clientX - left) / zoom, 0, QUEUE_MAX)
      setDragW(Math.round(w))
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      work.classList.remove('dragging')
      setDragW(null)
      const snapped = snapQueueWidth(w)
      saveLayoutPrefs(snapped.mode === 'custom' ? { mode: 'custom', customWidth: snapped.width } : { mode: snapped.mode })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }
  const onQueueSplitterKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 48 : 16
    if (e.key === 'Home') {
      e.preventDefault()
      saveLayoutPrefs({ mode: 'auto' })
      return
    }
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = layout.queueWidth + dir * step
    if (next < QUEUE_COLLAPSE_BELOW) saveLayoutPrefs({ mode: 'edge' })
    else saveLayoutPrefs({ mode: 'custom', customWidth: Math.round(clamp(next, QUEUE_COLLAPSE_BELOW, QUEUE_MAX)) })
  }

  const qWidth = dragW ?? panelWidth
  const qDensity = dragW != null ? (densityFor(dragW) === 'edge' ? 'slim' : (densityFor(dragW) as typeof density)) : density
  const detailHidden = dockVisible && layout.detailHidden
  const r = layout.ratio

  return (
    <div className="pg" data-pg="queue">
      {/* Top Toolbar */}
      <QueueToolbar />
      <QueueLiveBanner />

      {/* Stale Warning Banner */}
      {staleDocs.length > 0 && (
        <div className="stale" role="status">
          <Icon name="alert" size="sm" />
          <span>
            มีเอกสารค้างนอกช่วงที่เลือก <b>{staleDocs.length} ฉบับ</b> · เข้าระบบเก่าสุด{' '}
            {staleDocs.map(d => d.up).sort()[0]}
          </span>
          <span className="grow" />
          <button
            type="button"
            className="btn btn-sec sm"
            onClick={() => setPeriodFilter({ k: 'all', field: periodFilter.field })}
          >
            <Icon name="layers" size="sm" />
            แสดงทั้งหมด
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <QueueKpiCards />

      {/* Main Views */}
      {viewMode === 'table' ? (
        <QueueTableView />
      ) : (
        <div
          ref={workRef}
          className={[
            'work',
            dockVisible ? 'pdf-open' : '',
            layout.queue === 'rail' ? 'q-hide' : '',
            flyout ? 'q-peek' : '',
            detailHidden ? 'd-hide' : '',
            `qd-${qDensity}`,
          ]
            .filter(Boolean)
            .join(' ')}
          id="work"
          style={
            {
              '--rc': layout.queue === 'rail' ? 'var(--q-rail-w, 36px)' : '0px',
              '--qc': layout.queue === 'panel' ? `${qWidth}px` : '0px',
              '--q-w': `${qWidth}px`,
              '--mc': dockVisible ? `${(detailHidden ? 0 : (1 - r) * 100).toFixed(1)}fr` : '100fr',
              '--dc': dockVisible ? `${(detailHidden ? 100 : r * 100).toFixed(1)}fr` : '0fr',
            } as React.CSSProperties
          }
        >
          {/* Rail: legacy mode = show the queue and close the PDF · v5.17 = open the queue over the PDF */}
          {layout.queue === 'rail' && (
            <button
              ref={railRef}
              type="button"
              className="qrail"
              title={layout.railClosesPdf ? 'แสดงคิวตรวจสอบ (ปิดตัวอย่าง PDF อัตโนมัติ)' : 'เปิดคิวตรวจสอบ (ไม่ปิด PDF)'}
              aria-label={
                layout.railClosesPdf
                  ? `แสดงคิวตรวจสอบ ${filteredDocs.length} ฉบับ และปิดตัวอย่าง PDF`
                  : `เปิดคิวตรวจสอบ ${filteredDocs.length} ฉบับ`
              }
              aria-expanded={layout.railClosesPdf ? undefined : flyout}
              onClick={onRail}
            >
              <Icon name={flyout ? 'chevL' : 'chevR'} size="sm" />
              <span className="vt">{currentUser.role === 'EU' ? 'ใบรับของฉัน' : 'คิวตรวจสอบ'}</span>
              <span className="n">{filteredDocs.length}</span>
            </button>
          )}
          {flyout && <div className="qscrim" onClick={() => setFlyout(false)} aria-hidden="true" />}

          {/* Left Column: Queue List — a column, or a flyout over the PDF (legacy mode: not rendered) */}
          {showPanel && (
          <aside className={`col q47 qd-${qDensity}`} id="queue-panel" aria-label="คิวเอกสาร">
            <div className="ph">
              <span>{currentUser.role === 'EU' ? 'ใบรับของฉัน' : 'คิวตรวจสอบ'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{filteredDocs.length} ฉบับ</span>
                <button
                  type="button"
                  className="ibtn"
                  onClick={() => setViewMode('table')}
                  title="กลับไปมุมมองตาราง (Esc)"
                  aria-label="กลับไปมุมมองตาราง"
                >
                  <Icon name="table" size="sm" />
                </button>
              </span>
            </div>

            <div className="srch">
              <SmartSearchBox id="q" variant="list" resultCount={filteredDocs.length} />
            </div>

            <div className="scroll" id="list" role="listbox" aria-label="รายการเอกสาร">
              {filteredDocs.length > 0 ? (
                filteredDocs.map(d => (
                  <QueueListItem
                    key={d.doc}
                    doc={d}
                    isSelected={d.doc === selectedDocId}
                    onClick={() => pick(d.doc)}
                    density={qDensity}
                    width={qWidth}
                  />
                ))
              ) : (
                <div className="empty">
                  <Icon name="inbox" />
                  ไม่มีเอกสารในขอบเขตสิทธิ์และตัวกรองนี้
                </div>
              )}
            </div>
            {layout.queue === 'panel' && dockVisible && (
              <div
                className="q-rz"
                role="separator"
                aria-orientation="vertical"
                aria-label="ปรับความกว้างคิว"
                aria-valuemin={0}
                aria-valuemax={QUEUE_MAX}
                aria-valuenow={qWidth}
                tabIndex={0}
                title="ลากเพื่อปรับความกว้างคิว (ชิด 160 / 260 / 360px · ลากต่ำกว่า 96px = พับ) · ดับเบิลคลิก = อัตโนมัติ"
                onPointerDown={startQueueDrag}
                onDoubleClick={() => saveLayoutPrefs({ mode: 'auto' })}
                onKeyDown={onQueueSplitterKey}
              />
            )}
          </aside>
          )}

          {/* Middle Column: Invoice Details */}
          {selectedDoc ? (
            <InvoiceDetailPane
              // Remount on another document *or* a new engine result for the same one, so no DOM
              // from the previous render can survive (the doubled cards / two action bars bug).
              key={`${selectedDoc.doc}:${selectedDoc.status}:${selectedDoc.rules.length}:${selectedDoc.history.length}`}
              doc={selectedDoc}
              onOpenActionModal={act => setModalAction(act)}
            />
          ) : (
            <section className="col detail" id="detail">
              <div className="empty" style={{ margin: 'auto' }}>
                <Icon name="file" />
                เลือกเอกสารจากคิวด้านซ้าย
              </div>
            </section>
          )}

          {/* Right Column: PDF Dock */}
          {dockVisible && selectedDoc && (
            // Keyed by document: page / zoom / rotation / focus never leak from the previous document.
            <EvidenceViewerDock key={selectedDoc.doc} doc={selectedDoc} />
          )}
        </div>
      )}

      {/* Action Dialog Modal */}
      {modalAction && selectedDoc && (
        <ActionModalDialog
          doc={selectedDoc}
          action={modalAction}
          onClose={() => setModalAction(null)}
        />
      )}
    </div>
  )
}

export default QueuePage
