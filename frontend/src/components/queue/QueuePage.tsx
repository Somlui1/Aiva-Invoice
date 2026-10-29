'use client'

import { useCallback, useRef, useState } from 'react'
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

export function QueuePage() {
  const { currentUser } = useAuth()
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
    closeEvidenceDock,
    dockSplitRatio
  } = useInvoices()

  const [modalAction, setModalAction] = useState<ActionType | null>(null)
  /**
   * v5.7.1 — no overlay any more. Two exclusive layouts:
   *  - PDF open  → menu + queue hidden (auto), Validate | PDF full width, a 36px rail on the left.
   *  - rail click → the PDF closes automatically and the queue comes back (menu too).
   * Only one of queue / PDF exists at a time, so nothing can stack on top of anything.
   */
  const railRef = useRef<HTMLButtonElement>(null)

  // The dock column is the grid's fourth track, and `queue.css` sizes it from
  // `--dc` (default `0fr`, i.e. zero width). Until the same condition that mounts
  // `<EvidenceViewerDock/>` also opens that track, the dock renders into a
  // 0-pixel column: the button flips to "ปิด PDF" and nothing appears.
  const dockVisible = isEvidenceDockOpen && !!selectedDoc

  /** Show the queue = close the PDF preview (focus mode ends, menu and queue return). */
  const showQueue = useCallback(() => {
    closeEvidenceDock()
    requestAnimationFrame(() => {
      const sel = document.querySelector<HTMLElement>('#list .qi.on') || document.querySelector<HTMLElement>('#list .qi')
      sel?.scrollIntoView({ block: 'nearest' })
      sel?.focus?.({ preventScroll: true })
    })
  }, [closeEvidenceDock])

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
          className={`work${dockVisible ? ' pdf-open q-hide' : ''}`}
          id="work"
          style={
            {
              '--rc': dockVisible ? 'var(--q-rail-w, 36px)' : '0px',
              '--qc': dockVisible ? '0px' : 'var(--q-w)',
              '--mc': dockVisible ? `${((1 - dockSplitRatio) * 100).toFixed(1)}fr` : '100fr',
              '--dc': dockVisible ? `${(dockSplitRatio * 100).toFixed(1)}fr` : '0fr',
            } as React.CSSProperties
          }
        >
          {/* Rail (PDF open only): show the queue → closes the PDF preview automatically */}
          {dockVisible && (
            <button
              ref={railRef}
              type="button"
              className="qrail"
              title="แสดงคิวตรวจสอบ (ปิดตัวอย่าง PDF อัตโนมัติ)"
              aria-label={`แสดงคิวตรวจสอบ ${filteredDocs.length} ฉบับ และปิดตัวอย่าง PDF`}
              onClick={showQueue}
            >
              <Icon name="chevR" size="sm" />
              <span className="vt">{currentUser.role === 'EU' ? 'ใบรับของฉัน' : 'คิวตรวจสอบ'}</span>
              <span className="n">{filteredDocs.length}</span>
            </button>
          )}

          {/* Left Column: Queue List — not rendered at all while the PDF is open */}
          {!dockVisible && (
          <aside className="col q47" id="queue-panel" aria-label="คิวเอกสาร">
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
                    onClick={() => selectDoc(d.doc)}
                  />
                ))
              ) : (
                <div className="empty">
                  <Icon name="inbox" />
                  ไม่มีเอกสารในขอบเขตสิทธิ์และตัวกรองนี้
                </div>
              )}
            </div>
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
