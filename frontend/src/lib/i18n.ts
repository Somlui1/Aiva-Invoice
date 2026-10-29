/**
 * v5.13 — ภาษาเมนู ไทย / English
 *
 * ขอบเขตรอบนี้: เมนูและโครงแอป (Sidebar · Topbar breadcrumb · กล่องค้นหา Ctrl K · หน้า "ตั้งค่าทั่วไป")
 * เนื้อหาในหน้า (คิว, ตาราง, กล่องยืนยัน) ยังเป็นภาษาไทย — แปลเพิ่มทีละหน้าโดยเพิ่ม key ใน DICT
 *
 * - ไม่มี Provider: ใช้ store เล็ก ๆ + useSyncExternalStore → ใช้ได้ทุกที่ รวมถึง portal (Ctrl K)
 * - เก็บค่าใน localStorage `aiva.lang` (ต่อเบราว์เซอร์) · ค่าเริ่มต้น = 'th'
 * - key ที่ไม่มีคำแปลภาษาอังกฤษ → แสดงภาษาไทย (ไม่มีวันขึ้นเป็น key ดิบ)
 */
import { useCallback, useSyncExternalStore } from 'react'

export type Lang = 'th' | 'en'
export const LANGS: readonly Lang[] = ['th', 'en'] as const
const STORAGE_KEY = 'aiva.lang'
export const LANG_EVENT = 'aiva:lang'

const TH = {
  // ---- sidebar sections ----
  'nav.sec.todo': 'ต้องดำเนินการ',
  'nav.sec.ap': 'ส่งจ่าย (AP)',
  'nav.sec.track': 'ติดตามและประวัติ',
  'nav.sec.gov': 'การกำกับดูแล',
  'nav.sec.settings': 'ตั้งค่า',
  // ---- sidebar items ----
  'nav.queue': 'คิวตรวจสอบ',
  'nav.queue.eu': 'งานของฉัน',
  'nav.ap': 'ส่งเข้า AP Interface',
  'nav.failed': 'นำเข้า Oracle ไม่สำเร็จ',
  'nav.closed': 'เอกสารที่ปิดแล้ว',
  'nav.closed.eu': 'ผลการส่งเอกสาร',
  'nav.rbac': 'สิทธิ์และการเชื่อมบัญชี',
  'nav.audit': 'บันทึกการเข้าถึง',
  'nav.settings': 'ตั้งค่าทั่วไป',
  // ---- sidebar chrome ----
  'nav.aria': 'เมนูหลัก',
  'nav.toggle': 'ย่อ / ขยายเมนู',
  'nav.toggle.short': 'ย่อ / ขยาย',
  'nav.noPerm': 'ไม่มีสิทธิ์เข้าหน้านี้',
  'nav.noPerm.suffix': ' (ไม่มีสิทธิ์)',
  'nav.newDocs': 'เอกสารใหม่ {n} รายการ · กดเพื่อดู',
  // ---- command palette ----
  'cp.placeholder': 'พิมพ์เลขที่ใบแจ้งหนี้ ผู้ขาย PO หรือคำสั่ง…',
  'cp.aria': 'ค้นหา / คำสั่ง',
  'cp.search': 'ค้นหา',
  'cp.tab.all': 'ทั้งหมด',
  'cp.tab.page': 'หน้า',
  'cp.tab.doc': 'เอกสาร',
  'cp.tab.sys': 'ระบบ',
  'cp.goto': 'ไปที่หน้า · {sec}',
  'cp.recentDocs': 'เอกสารล่าสุดในคิว',
  'cp.empty': 'ไม่พบรายการที่ตรงกับ “{q}”',
  'cp.ft.pick': 'เลือก',
  'cp.ft.open': 'เปิด',
  'cp.ft.tab': 'สลับหมวด',
  'cp.ft.close': 'ปิด',
  'cp.lang': 'เปลี่ยนภาษาเมนูเป็น English',
  'cp.lang.d': 'ภาษาของเมนูและโครงแอป · ตั้งค่า › ตั้งค่าทั่วไป',
  // ---- settings › general ----
  'set.title': 'ตั้งค่าทั่วไป',
  'set.note': 'ค่าส่วนบุคคลของคุณ · มีผลเฉพาะเบราว์เซอร์นี้',
  'set.lang.h': 'ภาษาที่แสดง',
  'set.lang.d': 'ภาษาของเมนู แถบด้านบน และกล่องค้นหา (Ctrl K) · เนื้อหาเอกสารและข้อความจากระบบยังเป็นภาษาไทย',
  'set.lang.th': 'ไทย',
  'set.lang.en': 'English',
  'set.lang.saved': 'เปลี่ยนภาษาเป็นภาษาไทยแล้ว',
  'set.theme.h': 'ธีม',
  'set.theme.d': 'โหมดสว่าง / มืด',
  'set.theme.light': 'สว่าง',
  'set.theme.dark': 'มืด',
} as const

export type I18nKey = keyof typeof TH

const EN: Partial<Record<I18nKey, string>> = {
  'nav.sec.todo': 'To do',
  'nav.sec.ap': 'Payables (AP)',
  'nav.sec.track': 'Tracking & history',
  'nav.sec.gov': 'Governance',
  'nav.sec.settings': 'Settings',
  'nav.queue': 'Review queue',
  'nav.queue.eu': 'My tasks',
  'nav.ap': 'Send to AP Interface',
  'nav.failed': 'Oracle import failed',
  'nav.closed': 'Closed documents',
  'nav.closed.eu': 'Submission results',
  'nav.rbac': 'Access & account mapping',
  'nav.audit': 'Access log',
  'nav.settings': 'General',
  'nav.aria': 'Main menu',
  'nav.toggle': 'Collapse / expand menu',
  'nav.toggle.short': 'Collapse / expand',
  'nav.noPerm': 'You do not have access to this page',
  'nav.noPerm.suffix': ' (no access)',
  'nav.newDocs': '{n} new document(s) · click to view',
  'cp.placeholder': 'Type invoice no., vendor, PO or a command…',
  'cp.aria': 'Search / commands',
  'cp.search': 'Search',
  'cp.tab.all': 'All',
  'cp.tab.page': 'Pages',
  'cp.tab.doc': 'Documents',
  'cp.tab.sys': 'System',
  'cp.goto': 'Go to page · {sec}',
  'cp.recentDocs': 'Recent documents in queue',
  'cp.empty': 'Nothing matches “{q}”',
  'cp.ft.pick': 'select',
  'cp.ft.open': 'open',
  'cp.ft.tab': 'switch tab',
  'cp.ft.close': 'close',
  'cp.lang': 'Switch menu language to ไทย',
  'cp.lang.d': 'Language of menus and app chrome · Settings › General',
  'set.title': 'General',
  'set.note': 'Your personal preferences · this browser only',
  'set.lang.h': 'Display language',
  'set.lang.d': 'Language of the menu, top bar and search (Ctrl K) · document content and system messages stay in Thai',
  'set.lang.th': 'ไทย',
  'set.lang.en': 'English',
  'set.lang.saved': 'Language changed to English',
  'set.theme.h': 'Theme',
  'set.theme.d': 'Light / dark mode',
  'set.theme.light': 'Light',
  'set.theme.dark': 'Dark',
}

const DICT: Record<Lang, Partial<Record<I18nKey, string>>> = { th: TH, en: EN }

function isLang(v: unknown): v is Lang {
  return v === 'th' || v === 'en'
}

function readStored(): Lang {
  try {
    if (typeof window === 'undefined') return 'th'
    const v = window.localStorage.getItem(STORAGE_KEY)
    return isLang(v) ? v : 'th'
  } catch {
    return 'th'
  }
}

const listeners = new Set<() => void>()

/** อ่านจาก storage ทุกครั้ง (ถูกพอ) → ไม่มีค่าค้างข้ามเทสต์ / ข้ามแท็บ */
export function getLang(): Lang {
  return readStored()
}

export function setLang(lang: Lang): void {
  if (!isLang(lang)) return
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {}
  try {
    document.documentElement.lang = lang
  } catch {}
  listeners.forEach(l => l())
  try {
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }))
  } catch {}
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb()
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
  }
}

export function translate(lang: Lang, key: I18nKey, vars?: Record<string, string | number>): string {
  let s = DICT[lang][key] ?? TH[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

/** ภาษาปัจจุบัน (re-render เมื่อเปลี่ยน) */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => 'th')
}

/** `const t = useT(); t('nav.queue')` */
export function useT() {
  const lang = useLang()
  return useCallback((key: I18nKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])
}
