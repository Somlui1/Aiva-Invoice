'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Icon, IconName } from '../common/Icon'
import { useInvoices } from '../../context/InvoiceContext'
import { useTheme } from '../../context/ThemeContext'
import { PageKey } from './Sidebar'

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: PageKey) => void
  onSelectInvoice?: (invoiceId: string) => void
}

type TabKey = 'all' | 'doc' | 'nav' | 'act'

interface PaletteItem {
  id: string
  type: 'doc' | 'nav' | 'act'
  title: string
  subtitle: string
  icon: IconName
  tag?: string
  action: () => void
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSelectInvoice,
}: CommandPaletteProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { docs, selectDoc } = useInvoices()
  const { theme, toggleTheme } = useTheme()

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Build items catalog
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = []

    // 1. Navigation items
    const navItems: Array<{ key: PageKey; title: string; subtitle: string; icon: IconName }> = [
      { key: 'queue', title: 'คิวตรวจสอบใบแจ้งหนี้', subtitle: 'หน้าหลักแสดงรายการเอกสารทั้งหมด', icon: 'inbox' },
      { key: 'ap', title: 'ส่งเข้า AP Interface', subtitle: 'ส่งออกใบแจ้งหนี้ไปยัง Oracle AP', icon: 'send' },
      { key: 'rbac', title: 'สิทธิ์และการเชื่อมบัญชี', subtitle: 'จัดการผู้ใช้งานและสิทธิ์ Oracle / DMS', icon: 'shield' },
      { key: 'audit', title: 'บันทึกการเข้าถึงและแก้ไข', subtitle: 'ประวัติ Audit Trail ระบบ', icon: 'log' },
      { key: 'settings', title: 'ตั้งค่าระบบ', subtitle: 'การตั้งค่าทั่วไปและบัญชีที่ไม่ได้ผูก', icon: 'sliders' },
      { key: 'cases', title: 'ชุดเอกสารทดสอบ', subtitle: 'ชุดข้อมูลจำลองทดสอบเคสต่างๆ', icon: 'layers' },
      { key: 'std', title: 'มาตรฐาน Payload', subtitle: 'โครงสร้าง Schema และกฎการตรวจสอบ', icon: 'code' },
      { key: 'sim', title: 'Document Simulation', subtitle: 'เครื่องมือจำลองผลการรันกฎ', icon: 'flask' },
    ]

    for (const nav of navItems) {
      items.push({
        id: `nav-${nav.key}`,
        type: 'nav',
        title: nav.title,
        subtitle: nav.subtitle,
        icon: nav.icon,
        tag: 'หน้า',
        action: () => {
          onNavigate(nav.key)
          onClose()
        },
      })
    }

    // 2. Action items
    items.push({
      id: 'act-theme',
      type: 'act',
      title: theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง (Light Mode)' : 'เปลี่ยนเป็นโหมดมืด (Dark Mode)',
      subtitle: 'สลับชุดสีธีมของระบบ AIVA',
      icon: 'sliders',
      tag: 'คำสั่ง',
      action: () => {
        toggleTheme()
        onClose()
      },
    })

    // 3. Document items (from InvoiceContext)
    for (const doc of docs) {
      const docId = doc.doc || doc.inv
      items.push({
        id: `doc-${docId}`,
        type: 'doc',
        title: `${doc.inv || doc.doc} · ${doc.vendor || 'ไม่ระบุผู้ขาย'}`,
        subtitle: `Doc: ${doc.doc} · PO: ${doc.po || '-'} · ยอด: ${(doc.total || 0).toLocaleString('th-TH')} บาท · สถานะ: ${doc.status}`,
        icon: 'file',
        tag: doc.status,
        action: () => {
          selectDoc(doc.doc)
          onSelectInvoice?.(doc.doc)
          onNavigate('queue')
          onClose()
        },
      })
    }

    return items
  }, [docs, theme, onNavigate, onClose, selectDoc, onSelectInvoice, toggleTheme])

  // Filter items by active tab and search query
  const filteredItems = useMemo(() => {
    let result = allItems
    if (activeTab !== 'all') {
      result = result.filter(item => item.type === activeTab)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.tag?.toLowerCase().includes(q)
      )
    }
    return result
  }, [allItems, activeTab, query])

  // Ensure active index is within bounds
  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(Math.max(0, filteredItems.length - 1))
    }
  }, [filteredItems.length, activeIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        const tabs: TabKey[] = ['all', 'doc', 'nav', 'act']
        const currentIdx = tabs.indexOf(activeTab)
        const nextIdx = (currentIdx + (e.shiftKey ? -1 : 1) + tabs.length) % tabs.length
        setActiveTab(tabs[nextIdx])
        setActiveIndex(0)
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, filteredItems.length - 1)))
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const selected = filteredItems[activeIndex]
        if (selected) {
          selected.action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeTab, activeIndex, filteredItems, onClose])

  if (!isOpen) return null

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'doc', label: 'เอกสาร' },
    { key: 'nav', label: 'หน้า / เมนู' },
    { key: 'act', label: 'คำสั่ง' },
  ]

  return (
    <div
      className="cmdk-ov"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="ค้นหา / คำสั่ง"
      >
        <div className="cmdk-in">
          <span className="ic">
            <Icon name="search" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="พิมพ์เลขที่ใบแจ้งหนี้ ผู้ขาย PO หรือคำสั่ง…"
            aria-label="ค้นหา"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="esc"
            onClick={onClose}
            title="กดเพื่อปิด (Esc)"
          >
            ESC
          </button>
        </div>

        <div className="cmdk-tabs" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`cmdk-tab ${activeTab === tab.key ? 'on' : ''}`}
              onClick={() => {
                setActiveTab(tab.key)
                setActiveIndex(0)
                inputRef.current?.focus()
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="cmdk-list" role="listbox" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: 'var(--s-400)',
                fontSize: 13,
              }}
            >
              ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === activeIndex
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`cmdk-it ${isSelected ? 'on' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="tl">
                    <Icon name={item.icon} size="sm" />
                  </span>
                  <span className="tx">
                    <b>{item.title}</b>
                    <span>{item.subtitle}</span>
                  </span>
                  {item.tag && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: 'var(--mono)',
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--line-soft)',
                        color: 'var(--s-500)',
                      }}
                    >
                      {item.tag}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="cmdk-ft">
          <span>
            <kbd className="k2">↑</kbd>
            <kbd className="k2">↓</kbd>
            {' '}เลือก
          </span>
          <span>
            <kbd className="k2">↵</kbd>
            {' '}เปิด
          </span>
          <span>
            <kbd className="k2">Tab</kbd>
            {' '}สลับหมวด
          </span>
          <span>
            <kbd className="k2">Esc</kbd>
            {' '}ปิด
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'var(--s-400)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--teal)',
                display: 'inline-block',
              }}
            />
            AIVA · Auto Invoice Matching
          </span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
