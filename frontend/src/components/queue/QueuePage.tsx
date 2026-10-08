'use client'

import { useState } from 'react'
import { Icon } from '../common/Icon'
import { QueueToolbar } from './QueueToolbar'
import { QueueKpiCards } from './QueueKpiCards'
import { QueueTableView } from './QueueTableView'
import { QueueListItem } from './QueueListItem'
import { InvoiceDetailPane } from './InvoiceDetailPane'
import { ActionModalDialog } from './ActionModals'
import { EvidenceViewerDock } from '../evidence/EvidenceViewerDock'
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
    searchQuery,
    setSearchQuery,
    staleDocs,
    setPeriodFilter,
    isEvidenceDockOpen
  } = useInvoices()

  const [modalAction, setModalAction] = useState<ActionType | null>(null)

  return (
    <div className="pg" data-pg="queue">
      {/* Top Toolbar */}
      <QueueToolbar />

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
            onClick={() => setPeriodFilter({ k: 'all' })}
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
        <div className="work" id="work">
          {/* Left Column: Queue List */}
          <aside className="col q47" aria-label="คิวเอกสาร">
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
              <Icon name="search" size="sm" />
              <input
                id="q"
                type="search"
                placeholder="ค้นหาเลขที่ใบแจ้งหนี้ / Tax ID / PO / ผู้ขาย"
                aria-label="ค้นหาเอกสาร"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
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

          {/* Middle Column: Invoice Details */}
          {selectedDoc ? (
            <InvoiceDetailPane
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
          {isEvidenceDockOpen && selectedDoc && (
            <EvidenceViewerDock doc={selectedDoc} />
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
