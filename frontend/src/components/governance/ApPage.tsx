'use client'

import { useState, useEffect } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useInvoices, inPerDoc } from '../../context/InvoiceContext'
import { USERS } from '../../mock/users'
import { ActionModalDialog } from '../queue/ActionModals'
import type { InvoiceDoc } from '../../types/invoice'
import { SmartSearchBox } from '../queue/SmartSearchBox'
import { matchesSearchQuery } from '../../lib/queueFilters'
import { requestOpenDocument } from '../../lib/openDocument'

interface BatchItem {
  id: string
  at: string
  by: string
  docs: string[]
}

const INITIAL_BATCHES: BatchItem[] = [
  { id: 'B-261002-01', at: '2026-10-02 10:15', by: 'u6', docs: ['DMS-2026-000101', 'DMS-2026-000102'] },
  { id: 'B-261001-01', at: '2026-10-01 16:30', by: 'u6', docs: ['DMS-2026-000095'] }
]

export function ApPage({ initialTab = 'pending' }: { initialTab?: 'pending' | 'sent' | 'done' | 'failed' } = {}) {
  const { can } = useAuth()
  const {
    visibleDocs,
    allowedAction,
    periodFilter,
    precheckPost,
    batchPost
  } = useInvoices()

  const [apTab, setApTab] = useState<'pending' | 'sent' | 'done' | 'failed'>(initialTab)
  const [apSel, setApSel] = useState<Set<string>>(new Set())
  const [batches, setBatches] = useState<BatchItem[]>(INITIAL_BATCHES)
  const [coFilter] = useState<string>('')
  const [byFilter] = useState<string>('')
  // v5.13: hooks above the early return (before, `sending` was declared after it → hook order changed
  // when VIEW_AP flipped, e.g. entering / leaving "view as")
  const [sending, setSending] = useState(false)
  const [unconfirmDoc, setUnconfirmDoc] = useState<InvoiceDoc | null>(null)
  // v5.14: search inside this page (every tab) — number · vendor · PO · receipt · Batch · Oracle message …
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    async function loadBatches() {
      try {
        const res = await fetch('/api/ap/batches')
        if (res.ok) {
          const data = await res.json()
          if (active && data.ok && Array.isArray(data.batches) && data.batches.length > 0) {
            const mapped: BatchItem[] = data.batches.map((b: any) => ({
              id: b.id,
              at: b.sentAt ? new Date(b.sentAt).toLocaleString('th-TH') : b.createdAt,
              by: b.createdBy,
              docs: new Array(b.totalDocs).fill(''),
            }))
            setBatches(mapped)
          }
        }
      } catch {}
    }
    loadBatches()
    return () => {
      active = false
    }
  }, [])


  if (!can('VIEW_AP')) {
    return (
      <div className="pg-scroll">
        <div className="panel">
          <div className="empty">
            <Icon name="lock" />
            ไม่มีสิทธิ์เข้าถึงหน้านี้
          </div>
        </div>
      </div>
    )
  }

  const uName = (id?: string | null) => {
    if (!id) return '—'
    return USERS.find(u => u.id === id)?.n || id
  }

  const statusMap = {
    pending: 'Confirmed',
    sent: 'Sent',
    done: 'Posted',
    failed: 'Import Failed'
  }

  const currentStatus = statusMap[apTab]
  // v5.13: the same scope as the queue (docScope) — before, a hard-coded ACC/APR + company filter
  // showed SA an empty AP page although SA holds VIEW_AP / POST.
  const inPage = (d: InvoiceDoc) =>
    (!coFilter || d.company === coFilter) &&
    (!byFilter || d.confirmedBy === byFilter) &&
    inPerDoc(d, periodFilter) &&
    matchesSearchQuery(d, query)
  const rows = visibleDocs.filter(d => d.status === currentStatus).filter(inPage)

  // Only what is on screen is sent: a row selected before a search hid it is NOT in the Batch.
  const selRows = rows.filter(d => apSel.has(d.doc))
  const hiddenSel = apSel.size - selRows.length
  const canSend = can('POST')
  const canUnconfirm = can('UNCONFIRM')
  const showActions = apTab === 'pending' && canUnconfirm

  const toggleSelect = (docId: string, checked: boolean) => {
    setApSel(prev => {
      const next = new Set(prev)
      if (checked) next.add(docId)
      else next.delete(docId)
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setApSel(new Set(rows.map(r => r.doc)))
    } else {
      setApSel(new Set())
    }
  }

  /** v5.14: open the document where it lives (closed page for Confirmed / Sent / Posted, queue for
   *  Import Failed) with the PDF preview open — see lib/openDocument.ts */
  const handleOpenDoc = (docId: string) => requestOpenDocument(docId, { pdf: true })

  const handleSendBatch = async () => {
    if (!canSend || sending) return
    const ids = selRows.map(d => d.doc)
    if (!ids.length) return
    setSending(true)
    const res = await batchPost(ids).finally(() => setSending(false))
    if (res.ok) {
      setApSel(new Set())
      setApTab('sent')
    }
  }

  const tabDefs = [
    { k: 'pending' as const, label: 'รอส่ง', status: 'Confirmed', icon: 'clock' as const },
    { k: 'sent' as const, label: 'ส่งแล้ว รอ Import', status: 'Sent', icon: 'send' as const },
    { k: 'done' as const, label: 'Import สำเร็จ', status: 'Posted', icon: 'checkc' as const },
    { k: 'failed' as const, label: 'Import ไม่ผ่าน', status: 'Import Failed', icon: 'alert' as const }
  ]

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">ขั้นตอนหลังยืนยัน</span>
        <span className="scope-note">
          ตรวจซ้ำในฐานข้อมูล Portal → ผู้ยืนยัน ≠ ผู้ส่ง → ตรวจวงเงิน → ส่งเป็น Batch → รับผล Import
        </span>
        <span className="grow" />
        <span
          className="pill"
          style={canSend ? { background: 'var(--ok-bg)', color: 'var(--ok)', borderColor: 'var(--ok-bd)' } : {}}
        >
          <Icon name={canSend ? 'send' : 'lock'} size="sm" />
          {canSend
            ? 'ส่งได้ (วงเงิน ≤ 1,000,000)'
            : canUnconfirm
              ? 'ยกเลิก Confirm ได้ · ส่ง Batch ได้เฉพาะหัวหน้าฝ่ายบัญชี'
              : 'ดูอย่างเดียว · ส่งได้เฉพาะหัวหน้าฝ่ายบัญชี'}
        </span>
      </div>

      <div className="pg-scroll">
        {/* KPI Tab Cards */}
        <div className="kpis">
          {tabDefs.map(t => {
            const count = visibleDocs.filter(d => d.status === t.status && (!query.trim() || inPage(d))).length
            return (
              <button
                key={t.k}
                type="button"
                className={`kpi ${apTab === t.k ? 'on' : ''}`}
                onClick={() => {
                  setApTab(t.k)
                  setApSel(new Set())
                }}
              >
                <span className="k-l">{t.label}</span>
                <span className="k-v">{count}</span>
                <span className="k-i" style={{ background: 'var(--s-100)', color: 'var(--s-600)' }}>
                  <Icon name={t.icon} />
                </span>
              </button>
            )
          })}
        </div>

        {/* Filter Bar */}
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="panel-h">
            <h3>{tabDefs.find(t => t.k === apTab)?.label}</h3>
            <span className="muted sm">{rows.length} ฉบับ</span>
            <div className="tsrch aps-search">
              <SmartSearchBox
                id="apq"
                variant="table"
                value={query}
                onChange={setQuery}
                placeholder="ค้นหาเลขที่ ผู้ขาย ใบรับ Batch ข้อความ Oracle…"
              />
            </div>
            <span className="grow" />
            {apTab === 'pending' && canSend && (
              <>
                <span className="muted sm">
                  เลือก <b>{selRows.length}</b> ฉบับ ·{' '}
                  <b className="mono">
                    {selRows.reduce((acc, d) => acc + d.total, 0).toLocaleString()}
                  </b>{' '}
                  ฿
                  {hiddenSel > 0 && (
                    <span className="aps-hidden" title="แถวที่ถูกการค้นหาซ่อนไว้จะไม่ถูกส่ง">
                      {` · ซ่อนอยู่ ${hiddenSel} ฉบับ (ไม่ส่ง)`}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn-info sm"
                  disabled={!selRows.length || sending}
                  aria-busy={sending}
                  onClick={handleSendBatch}
                >
                  <Icon name="send" size="sm" />
                  {sending ? 'กำลังส่ง…' : 'ส่งเข้า AP Interface (Batch)'}
                </button>
              </>
            )}
          </div>

          <div className="tbl-wrap">
            <table className="t">
              <thead>
                <tr>
                  {apTab === 'pending' && canSend && (
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && rows.every(r => apSel.has(r.doc))}
                        onChange={e => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                  )}
                  <th>บริษัท</th>
                  <th>เลขที่ใบแจ้งหนี้</th>
                  <th>Tax ID ผู้ขาย</th>
                  <th>ชื่อผู้ขายใน Oracle</th>
                  <th>เลขที่ใบรับ</th>
                  <th className="num">ก่อนภาษี</th>
                  <th className="num">VAT</th>
                  <th className="num">ยอดรวม</th>
                  <th>ผู้ยืนยัน</th>
                  <th>วันที่ยืนยัน</th>
                  <th>เข้าระบบ</th>
                  {apTab === 'pending' && <th>ผลตรวจก่อนส่ง</th>}
                  {apTab === 'sent' && <th>Batch</th>}
                  {apTab === 'done' && <th>Oracle Invoice ID</th>}
                  {apTab === 'failed' && <th>ข้อความจาก Oracle</th>}
                  {showActions && <th className="ap-act-h">จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map(d => {
                    const pre = precheckPost(d)
                    return (
                      <tr key={d.doc} className={!pre.ok && apTab === 'pending' ? 'row-bad' : ''}>
                        {apTab === 'pending' && canSend && (
                          <td>
                            <input
                              type="checkbox"
                              checked={apSel.has(d.doc)}
                              onChange={e => toggleSelect(d.doc, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <span className="co" style={{ margin: 0 }}>
                            {d.company}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="link aps-open"
                            onClick={() => handleOpenDoc(d.doc)}
                            title="เปิดเอกสารพร้อม PDF"
                          >
                            {d.inv}
                            <Icon name="file" size="sm" />
                          </button>
                        </td>
                        <td className="mono">{d.stax}</td>
                        <td>{d.oname || d.vendor}</td>
                        <td className="mono">{d.rcv || '—'}</td>
                        <td className="num">
                          {(d.sub || Math.round(d.total / 1.07)).toLocaleString()}
                        </td>
                        <td className="num">
                          {(d.vat || Math.round(d.total - (d.sub || Math.round(d.total / 1.07)))).toLocaleString()}
                        </td>
                        <td className="num">
                          <b>{d.total.toLocaleString()}</b>
                        </td>
                        <td>{uName(d.confirmedBy)}</td>
                        <td className="mono">{d.confirmedAt || '—'}</td>
                        <td className="mono">{d.up}</td>
                        {apTab === 'pending' && (
                          <td>
                            <span className={pre.ok ? 'pre-ok' : 'pre-x'}>
                              {pre.ok ? '✓ พร้อมส่ง' : `✕ ${pre.why}`}
                            </span>
                          </td>
                        )}
                        {apTab === 'sent' && <td className="mono">{d.batch || '—'}</td>}
                        {apTab === 'done' && <td className="mono">{d.apId || '—'}</td>}
                        {apTab === 'failed' && (
                          <td className="sm" style={{ color: 'var(--err)' }}>
                            {d.apErr || 'SQL Integrity Violation'}
                          </td>
                        )}
                        {showActions && (() => {
                          // v5.13: per row (no bulk) — one document, one reason, one request
                          const chk = allowedAction(d, 'unconfirm')
                          const off = !chk.ok || sending || apSel.has(d.doc)
                          const why = apSel.has(d.doc)
                            ? 'เอาเครื่องหมายเลือกออกก่อน (อยู่ในรายการที่จะส่ง Batch)'
                            : sending
                              ? 'กำลังส่ง Batch'
                              : chk.ok
                                ? 'ยกเลิก Confirm · เอกสารกลับไปคิวตรวจสอบ (Review)'
                                : chk.why
                          return (
                            <td className="ap-act">
                              <button
                                type="button"
                                className="btn btn-danger sm ap-unconfirm"
                                disabled={off}
                                title={why}
                                aria-label={`ยกเลิก Confirm ${d.inv}`}
                                onClick={() => setUnconfirmDoc(d)}
                              >
                                <Icon name="undo" size="sm" />
                                ยกเลิก Confirm
                              </button>
                            </td>
                          )
                        })()}
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={15}>
                      <div className="empty">
                        <Icon name="inbox" />
                        {query.trim() ? 'ไม่พบเอกสารที่ตรงกับคำค้นในแท็บนี้' : 'ไม่มีเอกสารในสถานะและช่วงเวลานี้'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batches Table */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-h">
            <h3>ประวัติ Batch</h3>
            <span className="muted sm">{batches.length} batch</span>
          </div>
          <div className="tbl-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>เวลาส่ง</th>
                  <th>ผู้ส่ง</th>
                  <th className="num">จำนวน</th>
                  <th>ผล Import</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b.id}>
                    <td className="mono">{b.id}</td>
                    <td className="mono">{b.at}</td>
                    <td>{uName(b.by)}</td>
                    <td className="num">{b.docs.length}</td>
                    <td>
                      <span className="pre-ok">สำเร็จ {b.docs.length}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {unconfirmDoc && (
        <ActionModalDialog
          key={unconfirmDoc.doc}
          doc={unconfirmDoc}
          action="unconfirm"
          onClose={() => setUnconfirmDoc(null)}
        />
      )}
    </div>
  )
}

export default ApPage
