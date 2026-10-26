/* =====================================================================
   AIVA v5.3 · FX layer (port จาก aiva-react/src/runtime/effects.js)
   ---------------------------------------------------------------------
   · เป็นเอฟเฟกต์ภาพล้วน: วาดลงใน #fxLayer (position:fixed, pointer-events:none)
     ที่ React ไม่ได้เป็นเจ้าของ จึงไม่ชนกับ virtual DOM
   · ไม่แตะ state / business logic ใด ๆ
   · เคารพ prefers-reduced-motion: ปิดแอนิเมชันทั้งหมด
   ===================================================================== */

import { PRISM_ICONS } from '../components/common/prismIcons'

export type ThemeName = 'dark' | 'light'

export interface FxRole {
  n: string
  c: string
  bg: string
}

const EASE = 'cubic-bezier(.45,.05,.2,1)'
export const FX_DUR = 860

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

export function noFx(): boolean {
  if (!isBrowser() || typeof window.matchMedia !== 'function') return true
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function layer(): HTMLElement {
  let l = document.getElementById('fxLayer')
  if (!l) {
    l = document.createElement('div')
    l.id = 'fxLayer'
    l.className = 'fx-layer'
    l.setAttribute('aria-hidden', 'true')
    document.body.appendChild(l)
  }
  return l
}

function el(cls: string, css?: string): HTMLDivElement {
  const e = document.createElement('div')
  e.className = cls
  if (css) e.style.cssText = css
  layer().appendChild(e)
  return e
}

function kill(e: Element | null, ms: number) {
  window.setTimeout(() => {
    if (e && e.parentNode) e.parentNode.removeChild(e)
  }, ms)
}

function anim(e: Element, kf: Keyframe[], opt: KeyframeAnimationOptions): Animation | null {
  try {
    return typeof (e as HTMLElement).animate === 'function' ? (e as HTMLElement).animate(kf, opt) : null
  } catch {
    return null
  }
}

export function centerOf(node: Element | null | undefined, fx: number, fy: number): [number, number] {
  const r = node && node.getBoundingClientRect ? node.getBoundingClientRect() : null
  return r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] : [fx, fy]
}

export function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)
}

export function initialOf(n: string): string {
  const t = String(n || '').trim().replace(/^[เแโใไ]/, '')
  return t ? t.charAt(0).toUpperCase() : 'A'
}

function bloom(x: number, y: number, col: string, size?: number) {
  const b = el('fx-bloom', `left:${x}px;top:${y}px;--c:${col}${size ? `;width:${size}px;height:${size}px` : ''}`)
  anim(
    b,
    [
      { transform: 'translate(-50%,-50%) scale(.1)', opacity: 0.95 },
      { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 0 },
    ],
    { duration: 950, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' },
  )
  kill(b, 1050)
}

function sparks(x: number, y: number, light: boolean, n = 24) {
  const cols = light
    ? ['#f59e0b', '#fbbf24', '#ffffff', '#60a5fa', '#2563eb']
    : ['#2dd4c4', '#5b9bff', '#b49cff', '#ffffff', '#7ff3e6']
  for (let i = 0; i < n; i++) {
    const c = cols[i % cols.length]
    const sz = 2 + Math.random() * 3.6
    const a = Math.random() * Math.PI * 2
    const d = 70 + Math.random() * 200
    const s = el('fx-spark', `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 9px ${c}`)
    anim(
      s,
      [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${(Math.cos(a) * d).toFixed(1)}px),calc(-50% + ${(Math.sin(a) * d).toFixed(1)}px)) scale(.2)`,
          opacity: 0,
        },
      ],
      { duration: 650 + Math.random() * 600, easing: 'cubic-bezier(.1,.7,.3,1)', delay: Math.random() * 90, fill: 'forwards' },
    )
    kill(s, 1500)
  }
}

function ring(x: number, y: number, R: number, cls = '', delay = 0) {
  const d = R * 2
  const r = el(`fx-ring ${cls}`, `left:${x - R}px;top:${y - R}px;width:${d}px;height:${d}px`)
  r.appendChild(document.createElement('i'))
  anim(
    r,
    [
      { transform: 'scale(0)', opacity: 1, offset: 0 },
      { opacity: 1, offset: 0.82 },
      { transform: 'scale(1)', opacity: 0, offset: 1 },
    ],
    { duration: FX_DUR, easing: EASE, delay, fill: 'both' },
  )
  kill(r, FX_DUR + delay + 200)
}

function sweep(delay: number) {
  const s = el('fx-sweep')
  anim(s, [{ transform: 'translateX(-110%)' }, { transform: 'translateX(110%)' }], {
    duration: 1100,
    easing: 'cubic-bezier(.4,0,.2,1)',
    delay,
    fill: 'both',
  })
  kill(s, delay + 1300)
}

/* ไอคอนสำหรับ HUD / welcome (SVG string จากชุด Prism เดียวกับ <Icon/> · ไม่ผ่าน React) */
function svgOf(name: string): string {
  const a = PRISM_ICONS[name]
  if (!a) return ''
  return (
    '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' +
    (a[1] ? `<path class="f" d="${a[1]}"/>` : '') +
    `<path d="${a[0]}"/>` +
    (a[2] ? `<path class="a" d="${a[2]}"/>` : '') +
    '</svg>'
  )
}
const SVG_SUN = svgOf('sun')
const SVG_MOON = svgOf('moon')
const SVG_CHECK = svgOf('check')

function hud(light: boolean) {
  const h = el(`fx-hud ${light ? 'l' : 'd'}`)
  h.innerHTML =
    `<span class="ic">${light ? SVG_SUN : SVG_MOON}</span><span class="tx"><b>${light ? 'โหมดสว่าง' : 'โหมดมืด'}</b>` +
    `<small>${light ? 'Porcelain · คมชัด อ่านเอกสารง่าย' : 'Graphite · สบายตา ลดแสงจ้า'}</small></span><i class="pg"></i>`
  h.style.transform = 'translate(-50%,26px) scale(.94)'
  anim(
    h,
    [
      { opacity: 0, transform: 'translate(-50%,26px) scale(.94)' },
      { opacity: 1, transform: 'translate(-50%,0) scale(1)' },
    ],
    { duration: 560, easing: 'cubic-bezier(.2,1.3,.3,1)', delay: 260, fill: 'both' },
  )
  window.setTimeout(() => {
    anim(
      h,
      [
        { opacity: 1, transform: 'translate(-50%,0) scale(1)' },
        { opacity: 0, transform: 'translate(-50%,12px) scale(.97)' },
      ],
      { duration: 340, fill: 'forwards' },
    )
  }, 2500)
  kill(h, 3000)
}

/* ---------------- Theme switch FX ---------------- */
export function themeSwitchFx(x: number, y: number, toLight: boolean, from?: Element | null) {
  const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 40
  if (from && (from as HTMLElement).classList) {
    ;(from as HTMLElement).classList.add('pop')
    window.setTimeout(() => (from as HTMLElement).classList.remove('pop'), 950)
  }
  bloom(x, y, toLight ? 'rgba(251,191,36,.6)' : 'rgba(45,212,196,.5)')
  sparks(x, y, toLight)
  hud(toLight)
  const root = document.documentElement
  root.classList.add('fx-theme')
  window.setTimeout(() => root.classList.remove('fx-theme'), 1700)
  return {
    radius: R,
    rings: () => {
      ring(x, y, R, '', 0)
      ring(x, y, R, 'e2', 110)
      sweep(FX_DUR * 0.5)
    },
  }
}

/* ---------------- App enter / welcome / logout ---------------- */
let appTimer: number | undefined

/** แอนิเมชันเข้าแอป: เมนู/แถบบน/การ์ด/แถวตาราง ค่อย ๆ ซูม-เลื่อนเข้าตำแหน่ง (html.fx-in) */
export function appIn(opts: { lite?: boolean } = {}) {
  if (!isBrowser() || noFx()) return
  const h = document.documentElement
  h.classList.remove('fx-in', 'fx-lite')
  void h.offsetWidth
  h.classList.add('fx-in')
  if (opts.lite) h.classList.add('fx-lite')
  window.clearTimeout(appTimer)
  appTimer = window.setTimeout(() => h.classList.remove('fx-in', 'fx-lite'), opts.lite ? 1500 : 2400)
  if (!opts.lite) {
    const c = centerOf(document.querySelector('.nav-org .brand-tile'), 60, 40)
    bloom(c[0], c[1], 'rgba(91,155,255,.55)', 520)
    window.setTimeout(() => sweep(0), 260)
  }
}

export function warp(x: number, y: number) {
  if (!isBrowser() || noFx()) return
  const w = el('fx-warp', `left:${x}px;top:${y}px`)
  anim(
    w,
    [
      { transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 },
      { transform: 'translate(-50%,-50%) scale(24)', opacity: 0 },
    ],
    { duration: 780, easing: 'cubic-bezier(.3,.6,.2,1)', fill: 'forwards' },
  )
  kill(w, 900)
  bloom(x, y, 'rgba(45,212,196,.5)', 480)
  sparks(x, y, false, 16)
}

/** ตอนกดเข้าสู่ระบบสำเร็จ: วาร์ปออกจากโลโก้ของหน้า login */
export function loginOut(root?: Element | null) {
  if (!isBrowser() || noFx()) return
  const c = centerOf(root ? root.querySelector('.brand-tile') : null, window.innerWidth * 0.12, 90)
  warp(c[0], c[1])
}

/** การ์ดต้อนรับมุมบน: เข้าสู่ระบบสำเร็จ / ยินดีต้อนรับกลับ */
export function welcome(user: { n: string }, role: FxRole | null | undefined, mode: 'login' | 'resume' | 'skip' = 'login') {
  if (!isBrowser() || noFx()) return
  const R = role || { n: '', c: 'var(--t-blue)', bg: 'var(--t-blue-bg)' }
  const label = mode === 'resume' ? 'ยินดีต้อนรับกลับ' : mode === 'skip' ? 'เข้าสู่ระบบ (ข้ามขั้นตอน)' : 'เข้าสู่ระบบสำเร็จ'
  const w = el('fx-welcome')
  w.innerHTML =
    `<span class="av" style="background:${R.bg};color:${R.c}">${esc(initialOf(user.n))}<i class="rg"></i></span>` +
    `<span class="tx"><small>${label}</small><b>${esc(user.n)}</b><em style="background:${R.bg};color:${R.c}">${esc(R.n)}</em></span>` +
    `<span class="ok">${SVG_CHECK}</span><i class="pg"></i>`
  anim(
    w,
    [
      { opacity: 0, transform: 'translate(-50%,-26px) scale(.93)' },
      { opacity: 1, transform: 'translate(-50%,0) scale(1)' },
    ],
    { duration: 600, easing: 'cubic-bezier(.2,1.25,.3,1)', delay: mode === 'resume' ? 150 : 380, fill: 'both' },
  )
  window.setTimeout(() => {
    anim(
      w,
      [
        { opacity: 1, transform: 'translate(-50%,0) scale(1)' },
        { opacity: 0, transform: 'translate(-50%,-14px) scale(.97)' },
      ],
      { duration: 380, fill: 'forwards' },
    )
  }, 3100)
  kill(w, 3700)
}

/** ออกจากระบบ: shell เบลอ-ย่อหายก่อน แล้วจึงเรียก logout จริง */
export function logoutOut(run: () => void) {
  if (!isBrowser() || noFx()) {
    run()
    return
  }
  const root = document.documentElement
  root.classList.add('fx-leave')
  window.setTimeout(() => {
    try {
      run()
    } finally {
      root.classList.remove('fx-leave')
    }
  }, 430)
}

/** เปิดหน้า login พร้อมแอนิเมชันเลื่อนเข้า (#lg.lg-enter) */
export function loginIn() {
  if (!isBrowser() || noFx()) return
  const l = document.getElementById('lg')
  if (!l) return
  l.classList.remove('lg-enter')
  void l.offsetWidth
  l.classList.add('lg-enter')
  window.setTimeout(() => l.classList.remove('lg-enter'), 1500)
}

/* ---------------- session flags ---------------- */
const JUST_LOGGED_IN = 'aiva.fx.justLoggedIn'

export function markJustLoggedIn() {
  try {
    window.sessionStorage.setItem(JUST_LOGGED_IN, '1')
  } catch {}
}

export function consumeJustLoggedIn(): boolean {
  try {
    const v = window.sessionStorage.getItem(JUST_LOGGED_IN) === '1'
    window.sessionStorage.removeItem(JUST_LOGGED_IN)
    return v
  } catch {
    return false
  }
}

export const AIVA_FX = { appIn, warp, loginOut, welcome, logoutOut, loginIn }
