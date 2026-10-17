'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Icon } from '../common/Icon'

export type ColumnFilterType = 'text' | 'select' | 'range'

export interface ColumnFilterValue {
  type: ColumnFilterType
  text?: string
  selected?: string[]
  min?: number
  max?: number
}

export interface ColumnFilterPopoverProps {
  isOpen: boolean
  onClose: () => void
  columnKey: string
  columnLabel: string
  type: ColumnFilterType
  initialValue?: ColumnFilterValue
  distinctValues?: Array<{ value: string; count: number }>
  totalCount?: number
  matchingCount?: number
  onApply: (val: ColumnFilterValue) => void
  onClear: () => void
  anchorEl?: HTMLElement | null
}

export function ColumnFilterPopover({
  isOpen,
  onClose,
  columnKey,
  columnLabel,
  type,
  initialValue,
  distinctValues = [],
  totalCount = 0,
  matchingCount,
  onApply,
  onClear,
  anchorEl,
}: ColumnFilterPopoverProps) {
  const [text, setText] = useState(initialValue?.text || '')
  const [selectedItems, setSelectedItems] = useState<string[]>(initialValue?.selected || [])
  const [minVal, setMinVal] = useState<string>(initialValue?.min != null ? String(initialValue.min) : '')
  const [maxVal, setMaxVal] = useState<string>(initialValue?.max != null ? String(initialValue.max) : '')
  const [searchInList, setSearchInList] = useState('')

  useEffect(() => {
    if (isOpen) {
      setText(initialValue?.text || '')
      setSelectedItems(initialValue?.selected || [])
      setMinVal(initialValue?.min != null ? String(initialValue.min) : '')
      setMaxVal(initialValue?.max != null ? String(initialValue.max) : '')
      setSearchInList('')
    }
  }, [isOpen, initialValue])

  // Calculate popover position relative to anchor element
  const posStyle = useMemo<React.CSSProperties>(() => {
    if (!anchorEl || typeof window === 'undefined') {
      return { top: '20vh', left: '50%', transform: 'translateX(-50%)' }
    }
    const rect = anchorEl.getBoundingClientRect()
    const top = rect.bottom + 6
    let left = rect.left - 120
    if (left < 16) left = 16
    if (left + 332 > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - 348)
    }
    return { top: `${top}px`, left: `${left}px` }
  }, [anchorEl])

  // Filter distinct options in select mode
  const filteredOptions = useMemo(() => {
    if (!searchInList.trim()) return distinctValues
    const q = searchInList.trim().toLowerCase()
    return distinctValues.filter(opt => opt.value.toLowerCase().includes(q))
  }, [distinctValues, searchInList])

  if (!isOpen) return null

  const handleApply = () => {
    if (type === 'text') {
      onApply({ type: 'text', text: text.trim() })
    } else if (type === 'select') {
      onApply({ type: 'select', selected: selectedItems })
    } else if (type === 'range') {
      onApply({
        type: 'range',
        min: minVal ? Number(minVal) : undefined,
        max: maxVal ? Number(maxVal) : undefined,
      })
    }
    onClose()
  }

  const handleClear = () => {
    onClear()
    onClose()
  }

  const handleToggleItem = (val: string) => {
    setSelectedItems(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredOptions.map(o => o.value))
    } else {
      setSelectedItems([])
    }
  }

  const isAllSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every(o => selectedItems.includes(o.value))

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 310,
          background: 'transparent',
        }}
        onClick={onClose}
      />
      <div
        className="cfp"
        role="dialog"
        aria-modal="true"
        aria-label={`ตัวกรองคอลัมน์ ${columnLabel}`}
        style={posStyle}
      >
        <div className="cfp-h">
          <span className="t">กรอง: {columnLabel}</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="ibtn"
            onClick={onClose}
            aria-label="ปิดตัวกรอง"
          >
            <Icon name="x" size="sm" />
          </button>
        </div>

        <div className="cfp-sent">
          แสดงเฉพาะรายการที่มี <b>{columnLabel}</b> ตามเงื่อนไข
        </div>

        <div className="cfp-b">
          {type === 'text' && (
            <div>
              <input
                type="search"
                className="inp"
                placeholder={`พิมพ์ค้นหา ${columnLabel}...`}
                value={text}
                onChange={e => setText(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {type === 'select' && (
            <>
              {distinctValues.length > 5 && (
                <div className="cf-search">
                  <Icon name="search" size="sm" />
                  <input
                    type="search"
                    placeholder="ค้นหาในรายการ..."
                    value={searchInList}
                    onChange={e => setSearchInList(e.target.value)}
                  />
                </div>
              )}
              <label className="cf-all">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={e => handleSelectAll(e.target.checked)}
                />
                <span style={{ fontWeight: 600 }}>เลือกทั้งหมด</span>
              </label>
              <div className="cf-list">
                {filteredOptions.map(opt => {
                  const isChecked = selectedItems.includes(opt.value)
                  return (
                    <label key={opt.value} className="cf-it">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleItem(opt.value)}
                      />
                      <span className="cf-lab">{opt.value || '(ว่าง)'}</span>
                      <span className="cf-n">{opt.count}</span>
                    </label>
                  )
                })}
              </div>
            </>
          )}

          {type === 'range' && (
            <div className="cf-range">
              <div>
                <label style={{ fontSize: 11, color: 'var(--s-500)', display: 'block', marginBottom: 2 }}>
                  ต่ำสุด
                </label>
                <input
                  type="number"
                  className="inp"
                  placeholder="0"
                  value={minVal}
                  onChange={e => setMinVal(e.target.value)}
                />
              </div>
              <span className="cf-to">ถึง</span>
              <div>
                <label style={{ fontSize: 11, color: 'var(--s-500)', display: 'block', marginBottom: 2 }}>
                  สูงสุด
                </label>
                <input
                  type="number"
                  className="inp"
                  placeholder="ไม่จำกัด"
                  value={maxVal}
                  onChange={e => setMaxVal(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="cfp-f">
          <div className="cfp-pv">
            {matchingCount != null
              ? `พบ ${matchingCount} จาก ${totalCount} รายการ`
              : `ทั้งหมด ${totalCount} รายการ`}
          </div>
          <div className="cfp-ac">
            <button
              type="button"
              className="btn btn-pri sm"
              onClick={handleApply}
            >
              ใช้ตัวกรอง
            </button>
            <button
              type="button"
              className="btn btn-sec sm"
              onClick={handleClear}
            >
              ล้าง
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ColumnFilterPopover
