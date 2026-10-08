import { useState } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useInvoices, inPerOf } from '../../context/InvoiceContext'
import { USERS } from '../../mock/users'

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

export function ApPage() {
  const { currentUser, can } = useAuth()
  const {
    docs,
    periodFilter,
    selectDoc,
    setViewMode,
    precheckPost,
    batchPost
  } = useInvoices()

  const [apTab, setApTab] = useState<'pending' | 'sent' | 'done' | 'failed'>('pending')
  const [apSel, setApSel] = useState<Set<string>>(new Set())
  const [batches] = useState<BatchItem[]>(INITIAL_BATCHES)
  const [coFilter] = useState<string>('')
  const [byFilter] = useState<string>('')


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
  const rows = docs
    .filter(
      d =>
        d.status === currentStatus &&
        ['ACC', 'APR'].includes(currentUser.role) &&
        currentUser.co.includes(d.company)
    )
    .filter(d => (!coFilter || d.company === coFilter) && (!byFilter || d.confirmedBy === byFilter))
    .filter(d => inPerOf(d.up, periodFilter))

  const selRows = rows.filter(d => apSel.has(d.doc))
  const canSend = can('POST')

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

  const handleOpenDoc = (docId: string) => {
    selectDoc(docId)
    setViewMode('split')
  }

  const handleSendBatch = () => {
    if (!canSend) return
    const ids = Array.from(apSel)
    if (!ids.length) return
    const res = batchPost(ids)
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
          {canSend ? 'ส่งได้ (วงเงิน ≤ 1,000,000)' : 'ดูอย่างเดียว · ส่งได้เฉพาะหัวหน้าฝ่ายบัญชี'}
        </span>
      </div>

      <div className="pg-scroll">
        {/* KPI Tab Cards */}
        <div className="kpis">
          {tabDefs.map(t => {
            const count = docs.filter(
              d =>
                d.status === t.status &&
                ['ACC', 'APR'].includes(currentUser.role) &&
                currentUser.co.includes(d.company)
            ).length
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
            <span className="grow" />
            {apTab === 'pending' && canSend && (
              <>
                <span className="muted sm">
                  เลือก <b>{selRows.length}</b> ฉบับ ·{' '}
                  <b className="mono">
                    {selRows.reduce((acc, d) => acc + d.total, 0).toLocaleString()}
                  </b>{' '}
                  ฿
                </span>
                <button
                  type="button"
                  className="btn btn-info sm"
                  disabled={!selRows.length}
                  onClick={handleSendBatch}
                >
                  <Icon name="send" size="sm" />
                  ส่งเข้า AP Interface (Batch)
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
                            className="link"
                            onClick={() => handleOpenDoc(d.doc)}
                          >
                            {d.inv}
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
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={14}>
                      <div className="empty">
                        <Icon name="inbox" />
                        ไม่มีเอกสารในสถานะและช่วงเวลานี้
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
    </div>
  )
}

export default ApPage
