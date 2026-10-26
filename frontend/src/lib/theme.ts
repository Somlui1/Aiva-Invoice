/* =====================================================================
   AIVA v5.3 · ธีม Dark / Light
   · ค่าเริ่มต้น Dark · จำค่าใน localStorage "aiva.theme" (คีย์เดียวกับ aiva-react)
   · index.html ตั้ง data-theme ก่อนวาดหน้าแรกแล้ว (กันกะพริบ)
   · สลับด้วย View Transition (วงกลมขยายจากปุ่ม) + bloom/sparks/ring/HUD
   ===================================================================== */
import { useEffect, useState } from 'react'
import { FX_DUR, centerOf, noFx, themeSwitchFx, type ThemeName } from './fx'

export type { ThemeName }

export const THEME_KEY = 'aiva.theme'
export const THEME_EVENT = 'aiva:theme'

export function getTheme(): ThemeName {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

export function applyTheme(t: ThemeName) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', t)
  try {
    window.localStorage.setItem(THEME_KEY, t)
  } catch {}
  const m = document.querySelector('meta[name=theme-color]')
  if (m) m.setAttribute('content', t === 'light' ? '#f3f5f9' : '#0b0b0e')
  try {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: t }))
  } catch {}
}

/** ใช้ตอนเริ่มแอป (กรณีเปิดผ่าน test / ไม่ผ่าน index.html) */
export function initTheme() {
  if (typeof document === 'undefined') return
  if (document.documentElement.getAttribute('data-theme')) return
  let t: ThemeName = 'dark'
  try {
    t = window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {}
  applyTheme(t)
}

let busy = false

type VTDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> }
}

export function setTheme(t: ThemeName, from?: Element | null) {
  if (t === getTheme() || busy) return
  if (noFx()) {
    applyTheme(t)
    return
  }
  busy = true
  window.setTimeout(() => {
    busy = false
  }, FX_DUR + 250)

  const [x, y] = centerOf(from, window.innerWidth - 60, 28)
  const fx = themeSwitchFx(x, y, t === 'light', from)
  const root = document.documentElement
  const doc = document as VTDoc

  if (typeof doc.startViewTransition === 'function') {
    root.classList.add('fx-vt')
    let vt: { ready: Promise<void>; finished: Promise<void> }
    try {
      vt = doc.startViewTransition(() => applyTheme(t))
    } catch {
      root.classList.remove('fx-vt')
      applyTheme(t)
      fx.rings()
      return
    }
    const end = () => root.classList.remove('fx-vt')
    vt.finished.then(end, end)
    vt.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${fx.radius}px at ${x}px ${y}px)`] },
          { duration: FX_DUR, easing: 'cubic-bezier(.45,.05,.2,1)', pseudoElement: '::view-transition-new(root)' },
        )
        fx.rings()
      })
      .catch(end)
  } else {
    applyTheme(t)
    fx.rings()
  }
}

export function toggleTheme(from?: Element | null) {
  setTheme(getTheme() === 'light' ? 'dark' : 'light', from)
}

/** hook อ่านธีมปัจจุบัน (re-render เมื่อมีการสลับ) */
export function useTheme(): ThemeName {
  const [t, setT] = useState<ThemeName>(() => getTheme())
  useEffect(() => {
    const on = () => setT(getTheme())
    window.addEventListener(THEME_EVENT, on)
    return () => window.removeEventListener(THEME_EVENT, on)
  }, [])
  return t
}
