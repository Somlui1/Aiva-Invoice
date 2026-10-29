'use client'

import { Fragment } from 'react'
import { Icon, IconName } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useInvoices } from '../../context/InvoiceContext'
import { useToastModal } from '../../context/ToastModalContext'
import { BrandTile } from '../shell/BrandTile'
import { closedVisibleFor } from '../../lib/closedDocs'
import { useLive } from '../../context/LiveContext'
import { useT } from '../../lib/i18n'

/**
 * v5.7: menus "ชุดเอกสารทดสอบ" (cases), "มาตรฐาน Payload" (std), "Document Simulation" (sim) and
 * the whole "ตั้งค่า" (settings) entry were removed from the navigation and the router.
 * v5.13: "ตั้งค่า › ตั้งค่าทั่วไป" (settings) is back — personal preferences only (menu language, theme).
 *        Every role sees it; it never shows document content.
 */
export type PageKey = 'queue' | 'closed' | 'ap' | 'failed' | 'rbac' | 'audit' | 'settings'

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
  const t = useT()

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
    title: t('nav.sec.todo'),
    items: [
      { key: 'queue', label: isEu ? t('nav.queue.eu') : t('nav.queue'), icon: 'inbox', isAllowed: true, count: qn, tone: 'act' },
    ],
  }

  const ap: NavSection = {
    title: t('nav.sec.ap'),
    items: [
      { key: 'ap', label: t('nav.ap'), icon: 'send', isAllowed: true, count: apCount, tone: 'act' },
      // Only while there is something to fix — an empty "failed" menu is noise.
      ...(failedCount > 0
        ? [{ key: 'failed' as PageKey, label: t('nav.failed'), icon: 'alert' as IconName, isAllowed: true, count: failedCount, tone: 'alert' as const }]
        : []),
    ],
  }

  const track: NavSection = {
    title: t('nav.sec.track'),
    items: [
      {
        key: 'closed',
        // EU sees the outcome of what they sent; accounting sees closed work.
        label: isEu ? t('nav.closed.eu') : t('nav.closed'),
        icon: 'history',
        isAllowed: true,
        count: closedCount,
        tone: 'ref',
      },
    ],
  }

  const gov: NavSection = {
    title: t('nav.sec.gov'),
    items: [
      { key: 'rbac', label: t('nav.rbac'), icon: 'shield', isAllowed: true },
      { key: 'audit', label: t('nav.audit'), icon: 'log', isAllowed: can('AUDIT') },
    ],
  }

  // v5.13: ตั้งค่า › ตั้งค่าทั่วไป — every role (personal preferences only)
  const settings: NavSection = {
    title: t('nav.sec.settings'),
    items: [{ key: 'settings', label: t('nav.settings'), icon: 'settings', isAllowed: true }],
  }

  // Sections a role has no item in are not shown at all (no "locked" menus to wonder about).
  if (isAdm) return [gov, settings]
  return [todo, ...(can('VIEW_AP') ? [ap] : []), track, gov, settings]
}

export function Sidebar({ currentPage, onNavigate, onToggleNav }: SidebarProps) {
  const { toast } = useToastModal()
  const live = useLive()
  const sections = useNavSections()
  const t = useT()

  const handleClick = (item: NavItemConfig) => {
    if (!item.isAllowed) {
      toast(t('nav.noPerm'), true)
      return
    }
    onNavigate(item.key)
  }

  return (
    <aside className="nav" aria-label={t('nav.aria')}>
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
          title={`${t('nav.toggle')} ( [ )`}
          aria-label={t('nav.toggle')}
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
                  title={`${it.label}${it.isAllowed ? '' : t('nav.noPerm.suffix')}`}
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
                  {it.key === 'queue' && live.pendingNew.length > 0 && (
                    <span className="nav-new" title={t('nav.newDocs', { n: live.pendingNew.length })}>
                      +{live.pendingNew.length}
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
          title={t('nav.toggle.short')}
          aria-label={t('nav.toggle.short')}
        >
          <Icon name="chevsL" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
