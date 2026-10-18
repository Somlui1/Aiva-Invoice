'use client'

import { useState, useMemo } from 'react'
import { Icon } from '../common/Icon'
import { StatusBadge } from '../common/StatusBadge'
import { useInvoices, TODAY } from '../../context/InvoiceContext'
import { useSettings } from '../../context/SettingsContext'
import { useAuth } from '../../context/AuthContext'
import { SEVERITY_OF_CODE } from '../../mock/rules'
import { ColumnFilterPopover, ColumnFilterValue, ColumnFilterType } from './ColumnFilterPopover'

interface ColumnDef {
  key: string
  label: string
  type: ColumnFilterType
  isNum?: boolean
}

const COLUMNS: ColumnDef[] = [
  { key: 'inv', label: 'เลขที่ใบแจ้งหนี้', type: 'text' },
  { key: 'company', label: 'บริษัท', type: 'select' },
  { key: 'vendor', label: 'ผู้ขาย', type: 'text' },
  { key: 'stax', label: 'Tax ID ผู้ขาย', type: 'text' },
  { key: 'po', label: 'PO', type: 'text' },
  { key: 'receiver', label: 'Receiver', type: 'text' },
  { key: 'total', label: 'ยอดรวม', type: 'range', isNum: true },
  { key: 'status', label: 'สถานะ', type: 'select' },
  { key: 'codes', label: 'รหัส', type: 'text' },
  { key: 'assigned', label: 'ผู้รับผิดชอบ', type: 'select' },
  { key: 'up', label: 'เข้าระบบ', type: 'text' },
  { key: 'age', label: 'อายุ', type: 'range', isNum: true },
]

export function QueueTableView() {
  const { currentUser, currentRole } = useAuth()
  const isUnassigned = (!currentUser.co || currentUser.co.length === 0) && currentRole.scope !== 'all'
  const {
    filteredDocs,
    selectedDocId,
    selectDoc,
    setViewMode,
    searchQuery,
    setSearchQuery,
    staleDocs
  } = useInvoices()
  const { orgSettings } = useSettings()

  const [colFilters, setColFilters] = useState<Record<string, ColumnFilterValue>>({})
  const [activeColKey, setActiveColKey] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const calcAge = (upDate: string): number => {
    return Math.max(
      0,
      Math.round(
        (new Date(TODAY + 'T00:00:00Z').getTime() - new Date(upDate + 'T00:00:00Z').getTime()) / 864e5
      )
    )
  }

  // Filtered docs after applying column filters
  const displayedDocs = useMemo(() => {
    return filteredDocs.filter(d => {
      for (const [key, filter] of Object.entries(colFilters)) {
        if (!filter) continue

        if (filter.type === 'text' && filter.text) {
          const q = filter.text.toLowerCase()
          if (key === 'codes') {
            const hasMatch = (d.codes || []).some(c => c.toLowerCase().includes(q))
            if (!hasMatch) return false
          } else {
            const val = String((d as any)[key] ?? '').toLowerCase()
            if (!val.includes(q)) return false
          }
        }

        if (filter.type === 'select' && filter.selected && filter.selected.length > 0) {
          const val = String((d as any)[key] ?? '')
          if (!filter.selected.includes(val)) return false
        }

        if (filter.type === 'range') {
          const numVal = key === 'age' ? calcAge(d.up) : Number((d as any)[key] ?? 0)
          if (filter.min != null && numVal < filter.min) return false
          if (filter.max != null && numVal > filter.max) return false
        }
      }
      return true
    })
  }, [filteredDocs, colFilters])

  // Active filter chip list
  const activeChips = useMemo(() => {
    return Object.entries(colFilters)
      .filter(([_, f]) => {
        if (!f) return false
        if (f.type === 'text') return Boolean(f.text)
        if (f.type === 'select') return Boolean(f.selected && f.selected.length > 0)
        if (f.type === 'range') return f.min != null || f.max != null
        return false
      })
      .map(([key, f]) => {
        const col = COLUMNS.find(c => c.key === key)
        const label = col?.label || key
        let display = ''
        if (f.type === 'text') display = `มีคำว่า "${f.text}"`
        else if (f.type === 'select') display = f.selected?.join(', ') || ''
        else if (f.type === 'range') {
          if (f.min != null && f.max != null) display = `${f.min} – ${f.max}`
          else if (f.min != null) display = `≥ ${f.min}`
          else if (f.max != null) display = `≤ ${f.max}`
        }
        return { key, label, display }
      })
  }, [colFilters])

  // Get distinct values for active column in select mode
  const activeDistinctValues = useMemo(() => {
    if (!activeColKey) return []
    const counts = new Map<string, number>()
    for (const d of filteredDocs) {
      const val = String((d as any)[activeColKey] ?? '')
      counts.set(val, (counts.get(val) || 0) + 1)
    }
    return Array.from(counts.entries()).map(([value, count]) => ({ value, count }))
  }, [activeColKey, filteredDocs])

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

  const activeColDef = COLUMNS.find(c => c.key === activeColKey)

  return (
    <div className="tview" id="tview">
      <div className="panel">
        <div className="panel-h">
          <h3>ตารางสรุปคิวเอกสาร</h3>
          <span className="muted sm" id="tcount">
            {displayedDocs.length} ฉบับ
            {displayedDocs.length !== filteredDocs.length && ` (จากทั้งหมด ${filteredDocs.length})`}
          </span>
          <span className="grow" />
          <div className="tsrch">
            <Icon name="search" size="sm" />
            <input
              id="tq"
              type="search"
              placeholder="ค้นหาเลขที่ใบแจ้งหนี้ / Tax ID / PO / ผู้ขาย"
              aria-label="ค้นหาในตาราง"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="thint">
            <Icon name="split" size="sm" />
            คลิกแถว หรือ <kbd>Enter</kbd> เปิดแบบ 2 ฝั่ง
          </span>
        </div>

        {/* Active Column Filters Chip Bar (.cfbar) */}
        {activeChips.length > 0 && (
          <div className="cfbar">
            <span className="cfl">
              <Icon name="sliders" size="sm" />
              ตัวกรองคอลัมน์:
            </span>
            {activeChips.map(chip => (
              <span key={chip.key} className="cfchip">
                <button
                  type="button"
                  className="cfchip-t"
                  onClick={() => {
                    setActiveColKey(chip.key)
                    setAnchorEl(null)
                  }}
                >
                  {chip.label}: {chip.display}
                </button>
                <button
                  type="button"
                  className="cfchip-x"
                  onClick={() => {
                    setColFilters(prev => {
                      const next = { ...prev }
                      delete next[chip.key]
                      return next
                    })
                  }}
                  aria-label={`ลบตัวกรอง ${chip.label}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => setColFilters({})}
              style={{ fontSize: 11.5, marginLeft: 'auto' }}
            >
              ล้างทั้งหมด
            </button>
          </div>
        )}

        <div className="tbl-wrap">
          <table className="t">
            <thead>
              <tr>
                {COLUMNS.map(col => {
                  const hasFilter = Boolean(colFilters[col.key])
                  const isOpen = activeColKey === col.key
                  return (
                    <th
                      key={col.key}
                      className={`${col.isNum ? 'num' : ''} ${hasFilter ? 'cf-on' : ''}`}
                    >
                      <div className="th-in">
                        <span className="th-t">{col.label}</span>
                        <button
                          type="button"
                          className="cf-btn"
                          aria-label={`กรองคอลัมน์ ${col.label}`}
                          aria-expanded={isOpen}
                          onClick={e => {
                            if (activeColKey === col.key) {
                              setActiveColKey(null)
                              setAnchorEl(null)
                            } else {
                              setActiveColKey(col.key)
                              setAnchorEl(e.currentTarget)
                            }
                          }}
                        >
                          <Icon name="sliders" size="sm" />
                        </button>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody id="tbody">
              {displayedDocs.length > 0 ? (
                displayedDocs.map(d => {
                  const isSelected = d.doc === selectedDocId
                  const age = calcAge(d.up)
                  const isOld = ['Review', 'Hold', 'Manual Review', 'Duplicate'].includes(d.status) && age > orgSettings.staleDays

                  return (
                    <tr
                      key={d.doc}
                      className={`click ${isSelected ? 'sel' : ''}`}
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
                      <td>{d.vendor}</td>
                      <td className="mono">{d.stax}</td>
                      <td className="mono">
                        {d.po}
                        {d.release ? `-${d.release}` : ''}
                      </td>
                      <td>
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
                    <div className="empty" style={{ padding: '48px 16px', textAlign: 'center' }}>
                      <Icon name={isUnassigned ? 'shield' : 'inbox'} size="lg" />
                      <div style={{ fontWeight: 700, marginTop: 8, fontSize: 14, color: 'var(--text)' }}>
                        {isUnassigned
                          ? 'ยังไม่ได้รับการกำหนดสิทธิ์เข้าถึงข้อมูลบริษัท (Zero-Trust Security)'
                          : 'ไม่มีเอกสารในขอบเขตสิทธิ์และตัวกรองนี้'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--s-400)', marginTop: 4, maxWidth: 420, marginInline: 'auto', lineHeight: 1.5 }}>
                        {isUnassigned
                          ? 'บัญชีของคุณเข้าสู่ระบบสำเร็จแล้ว แต่ยังไม่ได้รับการกำหนดขอบเขตบริษัทหรือบทบาท กรุณาติดต่อผู้ดูแลระบบ (IT Administrator) เพื่อกำหนดสิทธิ์ในหน้า RBAC Console'
                          : (staleDocs.length > 0 ? 'มีเอกสารค้างนอกช่วงที่เลือก' : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา')}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeColDef && (
        <ColumnFilterPopover
          isOpen={Boolean(activeColKey)}
          onClose={() => {
            setActiveColKey(null)
            setAnchorEl(null)
          }}
          columnKey={activeColDef.key}
          columnLabel={activeColDef.label}
          type={activeColDef.type}
          initialValue={colFilters[activeColDef.key]}
          distinctValues={activeDistinctValues}
          totalCount={filteredDocs.length}
          matchingCount={displayedDocs.length}
          anchorEl={anchorEl}
          onApply={val => {
            setColFilters(prev => ({
              ...prev,
              [activeColDef.key]: val,
            }))
          }}
          onClear={() => {
            setColFilters(prev => {
              const next = { ...prev }
              delete next[activeColDef.key]
              return next
            })
          }}
        />
      )}
    </div>
  )
}

export default QueueTableView
