'use client'

import { Icon } from '../common/Icon'
import { StatusBadge } from '../common/StatusBadge'
import { useInvoices, TODAY } from '../../context/InvoiceContext'
import { useSettings } from '../../context/SettingsContext'
import { SEVERITY_OF_CODE } from '../../mock/rules'
import { SmartSearchBox } from './SmartSearchBox'
import { useLive } from '../../context/LiveContext'

export function QueueTableView() {
  const {
    filteredDocs,
    selectedDocId,
    selectDoc,
    setViewMode,
    staleDocs
  } = useInvoices()
  const { orgSettings } = useSettings()
  const { freshIds } = useLive()

  const calcAge = (upDate: string): number => {
    return Math.max(
      0,
      Math.round(
        (new Date(TODAY + 'T00:00:00Z').getTime() - new Date(upDate + 'T00:00:00Z').getTime()) / 864e5
      )
    )
  }

  const dmy = (isoStr: string): string => {
    if (!isoStr || isoStr.length < 10) return '…'
    return `${isoStr.slice(8, 10)}/${isoStr.slice(5, 7)}/${isoStr.slice(0, 4)}`
  }

  const handleRowClick = (docId: string) => {
    selectDoc(docId)
    setViewMode('split')
  }

  const handleRowKeyDown = (e: React.KeyboardEvent, docId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick(docId)
    }
  }

  return (
    <div className="tview" id="tview">
      <div className="panel">
        <div className="panel-h">
          <h3>ตารางสรุปคิวเอกสาร</h3>
          <span className="muted sm" id="tcount">
            {filteredDocs.length} ฉบับ
          </span>
          <span className="grow" />
          <div className="tsrch">
            <SmartSearchBox id="tq" variant="table" />
          </div>
          <span className="thint">
            <Icon name="split" size="sm" />
            คลิกแถว หรือ <kbd>Enter</kbd> เปิดแบบ 2 ฝั่ง
          </span>
        </div>

        <div className="tbl-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>เลขที่ใบแจ้งหนี้</th>
                <th>บริษัท</th>
                <th>ผู้ขาย</th>
                <th>Tax ID ผู้ขาย</th>
                <th>PO</th>
                <th>Receiver</th>
                <th className="num">ยอดรวม</th>
                <th>สถานะ</th>
                <th>รหัส</th>
                <th>ผู้รับผิดชอบ</th>
                <th>เข้าระบบ</th>
                <th className="num">อายุ</th>
              </tr>
            </thead>
            <tbody id="tbody">
              {filteredDocs.length > 0 ? (
                filteredDocs.map(d => {
                  const isSelected = d.doc === selectedDocId
                  const age = calcAge(d.up)
                  const isOld = ['Review', 'Hold', 'Manual Review', 'Duplicate'].includes(d.status) && age > orgSettings.staleDays

                  return (
                    <tr
                      key={d.doc}
                      className={`click ${isSelected ? 'sel' : ''}${freshIds.has(d.doc) ? ' is-fresh' : ''}`}
                      data-doc={d.doc}
                      tabIndex={0}
                      aria-label={`เปิด ${d.inv}`}
                      onClick={() => handleRowClick(d.doc)}
                      onKeyDown={e => handleRowKeyDown(e, d.doc)}
                    >
                      <td>
                        <b>{d.inv}</b>
                      </td>
                      <td>
                        <span className="co" style={{ margin: 0 }}>
                          {d.company}
                        </span>
                      </td>
                      <td className="fit-td" title={d.vendor}>{d.vendor}</td>
                      <td className="mono">{d.stax}</td>
                      <td className="mono">
                        {d.po}
                        {d.release ? `-${d.release}` : ''}
                      </td>
                      <td className="fit-td" title={d.receiver || undefined}>
                        {d.receiver ? (
                          <>
                            {d.receiver}
                            {!d.receiverActive && (
                              <span className="pre-x xs"> (ยังไม่เชื่อม)</span>
                            )}
                          </>
                        ) : (
                          <span className="pre-x">ไม่มี</span>
                        )}
                      </td>
                      <td className="num">{d.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td>
                        {d.codes.length > 0 ? (
                          d.codes.map(c => (
                            <span key={c} className={`code ${SEVERITY_OF_CODE[c] || 'High'}`} style={{ marginRight: 4 }}>
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="nac">—</span>
                        )}
                      </td>
                      <td>{d.assigned === 'eu' ? 'ผู้ใช้งาน' : 'ฝ่ายบัญชี'}</td>
                      <td className="mono">{dmy(d.up)}</td>
                      <td className="num">
                        <span className={`age ${isOld ? 'old' : ''}`} title={`นับจากวันที่เข้าระบบ ${dmy(d.up)}`}>
                          อายุ {age} วัน
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={12}>
                    <div className="empty">
                      <Icon name="inbox" />
                      ไม่มีเอกสารในขอบเขตสิทธิ์และตัวกรองนี้
                      {staleDocs.length > 0 && ' · มีเอกสารค้างนอกช่วงที่เลือก'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default QueueTableView
