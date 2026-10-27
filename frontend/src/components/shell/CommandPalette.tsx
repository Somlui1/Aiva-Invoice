/* =====================================================================
   AIVA UI-fix-1 · Command Palette (Ctrl K)
   · หมวด: ทั้งหมด · หน้า · เอกสาร · ระบบ  (Tab / Shift+Tab สลับหมวด)
   · ↑ ↓ เลือก · Enter เปิด · Esc ปิด · คลิกพื้นหลังเพื่อปิด
   · เอกสาร = visibleDocs จาก InvoiceContext (ผ่าน scopeCheck ตามสิทธิ์แล้ว) · ไม่มี API ใหม่
   · ADM ไม่เห็นหมวดเอกสาร

   UI-fix-1: แก้กล่องแสดงผลไม่เต็ม/ซ้อนทับ
     1) เขียน CSS ใหม่ (.cp-* ใน styles/aiva/command-palette.css) — แถบหมวด/ช่องค้นหา/ท้ายกล่องเป็น flex:none
        มีเฉพาะรายการที่เลื่อนได้ (เดิมแถบหมวดโดน flexbox บีบจนปุ่มโดนเส้นรายการทับ)
     2) render ผ่าน createPortal ไป document.body — ไม่ถูกกักด้วย transform/filter ของ parent
        (เช่นระหว่างแอนิเมชันเข้าแอป) แบบเดียวกับที่แก้ MyProfileModal ใน v5.3.1
   ===================================================================== */
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName } from '../common/Icon'
import { StatusBadge } from '../common/StatusBadge'
import { openViewAsPicker } from '../viewas/ViewAs'
import { isClosedViewStatus } from '../../lib/closedDocs'
import { useAuth } from '../../context/AuthContext'
import { useInvoices } from '../../context/InvoiceContext'
import { useToastModal } from '../../context/ToastModalContext'
import { CLOSED_STATUSES, filterDocsFor } from '../../lib/queueFilters'
import { appIn, logoutOut, welcome } from '../../lib/fx'
import { getTheme, setTheme } from '../../lib/theme'
import { useNavSections, type PageKey } from '../layout/Sidebar'
import type { InvoiceDoc } from '../../types/invoice'
import '../../styles/aiva/command-palette.css'

export const CMDK_EVENT = 'aiva:cmdk'

/** เปิดกล่องค้นหาจากที่ใดก็ได้ (เช่นปุ่มใน Topbar) */
export function openCommandPalette() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CMDK_EVENT))
}

type Kind = 'page' | 'doc' | 'sys'
type Tab = 'all' | Kind
type Tone = 'info' | 'ok' | 'warn' | 'vio' | 'err'

interface Item {
  k: Kind
  t: string
  d: string
  tag?: string
  badge?: ReactNode
  tone: Tone
  icon: IconName
  kw?: string
  disabled?: boolean
  run: () => void
}

const TABS: [Tab, string, IconName][] = [
  ['all', 'ทั้งหมด', 'sparkle'],
  ['page', 'หน้า', 'layers'],
  ['doc', 'เอกสาร', 'file'],
  ['sys', 'ระบบ', 'sliders'],
]
const GROUP: Record<Kind, string> = { page: 'หน้า', doc: 'เอกสาร', sys: 'ระบบ' }
const TONE: Record<Tone, [string, string]> = {
  info: ['var(--t-blue)', 'var(--t-blue-bg)'],
  ok: ['var(--t-ok)', 'var(--t-ok-bg)'],
  warn: ['var(--t-warn)', 'var(--t-warn-bg)'],
  vio: ['var(--t-vio)', 'var(--t-vio-bg)'],
  err: ['var(--t-err)', 'var(--t-err-bg)'],
}

const fm = (n: number) => {
  try {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } catch {
    return String(n)
  }
}

interface Props {
  onNavigate: (page: PageKey) => void
  onToggleNav: () => void
}

export function CommandPalette({ onNavigate, onToggleNav }: Props) {
  const { currentUser, currentRole, logout, realUser, isPreview, stopViewAs } = useAuth()
  const inv = useInvoices()
  const { toast } = useToastModal()
  const sections = useNavSections()

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [act, setAct] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<Element | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    const p = prevFocus.current as HTMLElement | null
    try {
      p?.focus?.()
    } catch {}
  }, [])

  const show = useCallback(() => {
    prevFocus.current = document.activeElement
    setQ('')
    setTab('all')
    setAct(0)
    setOpen(true)
  }, [])

  /* เปิดเอกสาร: ไปหน้าคิว → ถ้าเอกสารถูกตัวกรองซ่อนอยู่ ล้าง/ปรับตัวกรองให้เห็น → เลือกเอกสาร */
  const openDoc = useCallback(
    (d: InvoiceDoc) => {
      // v5.10: closed documents live on their own page
      if (isClosedViewStatus(d.status)) {
        inv.focusClosedDoc(d.doc)
        onNavigate('closed')
        return
      }
      onNavigate('queue')
      const base = {
        docs: inv.visibleDocs,
        companyFilter: inv.companyFilter,
        periodFilter: inv.periodFilter,
        searchQuery: inv.searchQuery,
        showClosed: inv.showClosed,
        statusFilter: inv.statusFilter,
        role: currentUser.role,
      }
      const inList = (o: Partial<typeof base>, receiver: string | null = null) =>
        filterDocsFor({ ...base, ...o }).some(x => x.doc === d.doc) &&
        (currentUser.role !== 'EU' || !receiver || d.receiver === receiver)

      if (!inList({}, inv.receiverFilter)) {
        const cleared = {
          companyFilter: new Set<string>(),
          periodFilter: { k: 'all' } as typeof base.periodFilter,
          searchQuery: '',
          statusFilter: currentUser.role === 'EU' ? 'mine' : 'all',
        }
        inv.clearFilters()
        let showClosed = inv.showClosed
        if (!inList(cleared) && CLOSED_STATUSES.includes(d.status) && !showClosed) {
          inv.toggleShowClosed()
          showClosed = true
        }
        if (!inList({ ...cleared, showClosed })) inv.setStatusFilter(d.status)
        toast(`ปรับตัวกรองคิวเพื่อเปิดเอกสาร ${d.inv}`)
      }
      inv.selectDoc(d.doc)
    },
    [inv, currentUser.role, onNavigate, toast],
  )

  const all = useMemo<Item[]>(() => {
    if (!open) return []
    const L: Item[] = []
    sections.forEach(sec =>
      sec.items.forEach(it => {
        if (!it.isAllowed) return
        L.push({
          k: 'page',
          t: it.label,
          d: `ไปที่หน้า · ${sec.title}`,
          tag: it.count ? String(it.count) : it.tag,
          tone: 'info',
          icon: it.icon,
          run: () => onNavigate(it.key),
        })
      }),
    )
    if (currentUser.role !== 'ADM') {
      inv.visibleDocs.forEach(d =>
        L.push({
          k: 'doc',
          t: d.inv,
          d: `${d.doc} · ${d.vendor}${d.po ? ` · PO ${d.po}` : ''} · ${fm(d.total)} บาท`,
          badge: <StatusBadge status={d.status} />,
          tone: 'ok',
          icon: 'file',
          kw: [d.doc, d.po, d.rcv, d.receiver, d.status, d.stax, d.oname, d.company].filter(Boolean).join(' '),
          run: () => openDoc(d),
        }),
      )
    }
    const light = getTheme() === 'light'
    L.push({
      k: 'sys',
      t: light ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง',
      d: 'สลับธีมของแอป · มีเอฟเฟกต์เปลี่ยนโหมด',
      tag: light ? 'Dark' : 'Light',
      tone: 'vio',
      icon: light ? 'moon' : 'sun',
      kw: 'theme dark light ธีม โหมด มืด สว่าง',
      run: () => setTheme(light ? 'dark' : 'light', document.querySelector('.topbar .theme-sw')),
    })
    L.push({
      k: 'sys',
      t: 'เล่นเอฟเฟกต์เข้าแอปอีกครั้ง',
      d: 'ดูแอนิเมชันตอนกลับเข้าแอป (ต้อนรับ + จัดวางหน้า)',
      tag: 'FX',
      tone: 'info',
      icon: 'sparkle',
      kw: 'effect fx welcome เอฟเฟกต์ ต้อนรับ แอนิเมชัน intro',
      run: () =>
        window.setTimeout(() => {
          appIn({})
          welcome(currentUser, currentRole, 'resume')
        }, 260),
    })
    L.push({
      k: 'sys',
      t: 'ย่อ / ขยายเมนูด้านข้าง',
      d: 'เพิ่มพื้นที่ทำงานของตาราง · คีย์ลัด [',
      tag: 'Sidebar',
      tone: 'info',
      icon: 'chevsL',
      kw: 'sidebar เมนู ย่อ ขยาย',
      run: onToggleNav,
    })
    if (realUser.role === 'SA') {
      L.push({
        k: 'sys',
        t: isPreview ? 'สลับมุมมอง…' : 'ดูในมุมมองของ…',
        d: 'Super Admin · ดูหน้าจอแบบที่ role / ผู้ใช้อื่นเห็น (อ่านอย่างเดียว)',
        tag: 'View as',
        tone: 'vio',
        icon: 'eye',
        kw: 'view as impersonate preview debug มุมมอง สลับ role ผู้ใช้',
        run: openViewAsPicker,
      })
      if (isPreview) {
        L.push({
          k: 'sys',
          t: 'ออกจากมุมมอง',
          d: 'กลับเป็น Super Admin',
          tag: 'View as',
          tone: 'err',
          icon: 'logout',
          kw: 'exit view as ออก มุมมอง',
          run: () => stopViewAs('user'),
        })
      }
    }
    L.push({
      k: 'sys',
      t: 'ออกจากระบบ',
      d: 'สิ้นสุดเซสชัน และกลับไปหน้า login',
      tag: 'Session',
      tone: 'err',
      icon: 'logout',
      kw: 'logout sign out ออก',
      run: () => logoutOut(logout),
    })
    return L
  }, [open, sections, inv.visibleDocs, currentUser, currentRole, onNavigate, onToggleNav, openDoc, logout, realUser.role, isPreview, stopViewAs])

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: all.length, page: 0, doc: 0, sys: 0 }
    all.forEach(it => (c[it.k] += 1))
    return c
  }, [all])

  const items = useMemo(() => {
    const qq = q.trim().toLowerCase()
    let out = all.filter(it => {
      if (tab !== 'all' && it.k !== tab) return false
      if (!qq) return true
      return `${it.t} ${it.d} ${it.tag || ''} ${it.kw || ''}`.toLowerCase().includes(qq)
    })
    if (!qq && tab === 'all') {
      const c: Record<Kind, number> = { page: 0, doc: 0, sys: 0 }
      const cap: Record<Kind, number> = { page: 12, doc: 6, sys: 4 }
      out = out.filter(it => ++c[it.k] <= cap[it.k])
    } else {
      out = out.slice(0, qq ? 40 : 60)
    }
    return out
  }, [all, q, tab])

  const active = Math.min(act, Math.max(0, items.length - 1))

  const run = useCallback(
    (i: number) => {
      const it = items[i]
      if (!it) return
      close()
      try {
        it.run()
      } catch (e) {
        console.error(e)
      }
    },
    [items, close],
  )

  /* คีย์ลัดระดับหน้า: Ctrl/⌘ + K เปิด-ปิด · Esc ปิด (ดักที่ window เพื่อให้ปิดได้แม้โฟกัสหลุด) · event จากปุ่ม Topbar */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        if (open) close()
        else show()
      } else if (open && e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        close()
      }
    }
    const onOpen = () => show()
    window.addEventListener('keydown', onKey, true)
    window.addEventListener(CMDK_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener(CMDK_EVENT, onOpen)
    }
  }, [open, close, show])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const a = listRef.current?.querySelector('.cp-it.on') as HTMLElement | null
    a?.scrollIntoView?.({ block: 'nearest' })
  }, [active, open, items])

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const n = items.length
      if (!n) return
      setAct((active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(active)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const ix = TABS.findIndex(t => t[0] === tab)
      setTab(TABS[(ix + (e.shiftKey ? -1 : 1) + TABS.length) % TABS.length][0])
      setAct(0)
    }
  }

  if (!open || typeof document === 'undefined') return null

  let last: Kind | '' = ''
  return createPortal(
    <div
      id="cmdkOv"
      className="cp-ov"
      onMouseDown={e => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="cp" id="cmdkBox" role="dialog" aria-modal="true" aria-label="ค้นหา / คำสั่ง" onKeyDown={onKeyDown}>
        <div className="cp-in">
          <Icon name="search" />
          <input
            ref={inputRef}
            id="cmdkIn"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="พิมพ์เลขที่ใบแจ้งหนี้ ผู้ขาย PO หรือคำสั่ง…"
            aria-label="ค้นหา"
            value={q}
            onChange={e => {
              setQ(e.target.value)
              setAct(0)
            }}
          />
          <kbd className="cp-esc">Esc</kbd>
        </div>

        <div className="cp-tabs" role="tablist">
          {TABS.map(([k, label, icon]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={`cp-tab ${tab === k ? 'on' : ''}`}
              onClick={() => {
                setTab(k)
                setAct(0)
                inputRef.current?.focus()
              }}
            >
              <Icon name={icon} />
              {label} <span className="n">{counts[k] || 0}</span>
            </button>
          ))}
        </div>

        <div className="cp-list" role="listbox" ref={listRef}>
          {items.length === 0 ? (
            <div className="cp-empty">
              <Icon name="search" />
              ไม่พบรายการที่ตรงกับ “{q}”
            </div>
          ) : (
            items.map((it, i) => {
              const [col, bg] = TONE[it.tone]
              const showHead = tab === 'all' && it.k !== last
              last = it.k
              return (
                <Fragment key={`${it.k}-${it.t}-${i}`}>
                  {showHead ? <div className="cp-grp">{!q && it.k === 'doc' ? 'เอกสารล่าสุดในคิว' : GROUP[it.k]}</div> : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    className={`cp-it ${i === active ? 'on' : ''}`}
                    onMouseMove={() => i !== active && setAct(i)}
                    onClick={() => run(i)}
                  >
                    <span className="tl">
                      <Icon name={it.icon} />
                    </span>
                    <span className="tx">
                      <span className="tt">
                        <span className="tn">{it.t}</span>
                        {it.badge}
                        {it.tag && !it.badge ? (
                          <span className="tg" style={{ color: col, background: bg }}>
                            {it.tag}
                          </span>
                        ) : null}
                      </span>
                      <span className="ds">{it.d}</span>
                    </span>
                    <span className="go">
                      Enter <Icon name="corner" />
                    </span>
                  </button>
                </Fragment>
              )
            })
          )}
        </div>

        <div className="cp-ft">
          <span>
            <kbd className="cp-k">↑</kbd>
            <kbd className="cp-k">↓</kbd>เลือก
          </span>
          <span>
            <kbd className="cp-k">↵</kbd>เปิด
          </span>
          <span>
            <kbd className="cp-k">Tab</kbd>สลับหมวด
          </span>
          <span>
            <kbd className="cp-k">Esc</kbd>ปิด
          </span>
          <span className="br hide-sm">AIVA · Auto Invoice Matching</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CommandPalette
