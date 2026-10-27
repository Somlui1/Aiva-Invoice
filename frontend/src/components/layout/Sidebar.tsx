'use client'

import { Fragment } from 'react'
import { Icon, IconName } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useInvoices } from '../../context/InvoiceContext'
import { useToastModal } from '../../context/ToastModalContext'
import { BrandTile } from '../shell/BrandTile'
import { closedVisibleFor } from '../../lib/closedDocs'

/**
 * v5.7: menus "ชุดเอกสารทดสอบ" (cases), "มาตรฐาน Payload" (std), "Document Simulation" (sim) and
 * the whole "ตั้งค่า" (settings) entry were removed from the navigation and the router.
 */
export type PageKey = 'queue' | 'closed' | 'ap' | 'failed' | 'rbac' | 'audit'

interface SidebarProps {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  onToggleNav: () => void
}

export interface NavItemConfig {
  key: PageKey
  label: string
  icon: IconName
  isAllowed: boolean
  count?: number
  tag?: string
  /** v5.10 badge tone: act = work to do · alert = urgent · ref = reference count (gray). */
  tone?: 'act' | 'alert' | 'ref'
}

export interface NavSection {
  title: string
  isSpecial?: boolean
  items: NavItemConfig[]
}

/** โครงเมนูตามบทบาท (ใช้ร่วมกันระหว่าง Sidebar และกล่องค้นหา Ctrl K) */
export function useNavSections(): NavSection[] {
  const { currentUser, can } = useAuth()
  const { visibleDocs } = useInvoices()


  // Calculate dynamic badge counts
  const qn = visibleDocs.filter(d =>
    currentUser.role === 'EU'
      ? d.assigned === 'eu' &&
        !['Posted', 'Rejected', 'Confirmed', 'Sent', 'Superseded', 'Duplicate'].includes(d.status)
      : !['Posted', 'Rejected', 'Confirmed', 'Sent', 'Import Failed', 'Auto-pass'].includes(d.status)
  ).length

  const apCount = visibleDocs.filter(d => d.status === 'Confirmed').length
  const closedCount = visibleDocs.filter(d => closedVisibleFor(d.status, currentUser.role)).length

  const failedCount = visibleDocs.filter(d => d.status === 'Import Failed').length
  const isEu = currentUser.role === 'EU'
  const isAdm = currentUser.role === 'ADM'

  /**
   * v5.10 — grouped by the work flow: ต้องดำเนินการ → ส่งจ่าย (AP) → ติดตามและประวัติ → การกำกับดูแล.
   * Badge tone: `act` (needs work, coloured) · `alert` (urgent) · `ref` (reference only, gray).
   */
  const todo: NavSection = {
    title: 'ต้องดำเนินการ',
    items: [
      { key: 'queue', label: isEu ? 'งานของฉัน' : 'คิวตรวจสอบ', icon: 'inbox', isAllowed: true, count: qn, tone: 'act' },
    ],
  }

  const ap: NavSection = {
    title: 'ส่งจ่าย (AP)',
    items: [
      { key: 'ap', label: 'ส่งเข้า AP Interface', icon: 'send', isAllowed: true, count: apCount, tone: 'act' },
      // Only while there is something to fix — an empty "failed" menu is noise.
      ...(failedCount > 0
        ? [{ key: 'failed' as PageKey, label: 'นำเข้า Oracle ไม่สำเร็จ', icon: 'alert' as IconName, isAllowed: true, count: failedCount, tone: 'alert' as const }]
        : []),
    ],
  }

  const track: NavSection = {
    title: 'ติดตามและประวัติ',
    items: [
      {
        key: 'closed',
        // EU sees the outcome of what they sent; accounting sees closed work.
        label: isEu ? 'ผลการส่งเอกสาร' : 'เอกสารที่ปิดแล้ว',
        icon: 'history',
        isAllowed: true,
        count: closedCount,
        tone: 'ref',
      },
    ],
  }

  const gov: NavSection = {
    title: 'การกำกับดูแล',
    items: [
      { key: 'rbac', label: 'สิทธิ์และการเชื่อมบัญชี', icon: 'shield', isAllowed: true },
      { key: 'audit', label: 'บันทึกการเข้าถึง', icon: 'log', isAllowed: can('AUDIT') },
    ],
  }

  // Sections a role has no item in are not shown at all (no "locked" menus to wonder about).
  if (isAdm) return [gov]
  return [todo, ...(can('VIEW_AP') ? [ap] : []), track, gov]
}

export function Sidebar({ currentPage, onNavigate, onToggleNav }: SidebarProps) {
  const { toast } = useToastModal()
  const sections = useNavSections()

  const handleClick = (item: NavItemConfig) => {
    if (!item.isAllowed) {
      toast('ไม่มีสิทธิ์เข้าหน้านี้', true)
      return
    }
    onNavigate(item.key)
  }

  return (
    <aside className="nav" aria-label="เมนูหลัก">
      <div className="nav-org">
        <BrandTile />
        <div className="tx">
          <b>AIVA</b>
          <span>Auto Invoice Matching</span>
        </div>
        <button
          type="button"
          className="ibtn nav-tg"
          onClick={onToggleNav}
          title="ย่อ / ขยายเมนู ( [ )"
          aria-label="ย่อ / ขยายเมนู"
        >
          <Icon name="split" />
        </button>
      </div>

      <nav className="nav-list" id="navlist">
        {sections.map((sec, si) => (
          <Fragment key={sec.title}>
            <div className={`nav-sec ${sec.isSpecial ? 'sp' : ''}`} style={{ ['--i' as string]: si * 4 }}>{sec.title}</div>
            {sec.items.map((it, ii) => {
              const isActive = currentPage === it.key
              return (
                <button
                  key={it.key}
                  type="button"
                  className={`nav-it ${isActive ? 'on' : ''} ${
                    it.isAllowed ? '' : 'dis'
                  } ${it.count ? 'has-cnt' : ''}`}
                  title={`${it.label}${it.isAllowed ? '' : ' (ไม่มีสิทธิ์)'}`}
                  aria-current={isActive ? 'page' : undefined}
                  style={{ ['--i' as string]: si * 4 + ii + 1 }}
                  onClick={() => handleClick(it)}
                >
                  <Icon name={it.icon} size="lg" />
                  <span className="lbl">{it.label}</span>
                  {!it.isAllowed && (
                    <span className="lock">
                      <Icon name="lock" size="sm" />
                    </span>
                  )}
                  {!!it.count && <span className={`cnt cnt-${it.tone ?? 'act'}`}>{it.count}</span>}
                </button>
              )
            })}
          </Fragment>
        ))}
      </nav>


      <div className="nav-foot">
        <span className="lbl grow">
          <b>Standard</b> v6.10 · schema 1.7
        </span>
        <button
          type="button"
          className="ibtn"
          onClick={onToggleNav}
          title="ย่อ / ขยาย"
          aria-label="ย่อ / ขยาย"
        >
          <Icon name="chevsL" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
