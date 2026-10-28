/**
 * v5.10.2 — Fit-to-screen zoom (ทุกครั้งที่เปิดแอป / ย่อขยายหน้าต่าง).
 *
 * The layout is designed for a DESIGN_W × DESIGN_H CSS-px canvas. On a smaller window the whole app
 * is scaled down with CSS `zoom` on <html> so it looks the same as on the design canvas (same as the
 * user pressing Ctrl − in the browser, but automatic). Never zooms in above 1.
 *
 * Side effects kept in one place:
 *  - `--uiz`   : current zoom factor
 *  - `--app-h` / `--app-w` : viewport size in *zoomed* px → `height: var(--app-h)` fills the screen
 *    exactly (100vh inside a zoomed root does not).
 *  - helpers `uiZoom()` / `toLayoutPx()` for code that mixes visual coordinates (clientX,
 *    getBoundingClientRect) with CSS px written into `style` (popovers, FX, drag handles).
 */

/** Design canvas — the size at which the portal looks right at 100 %. */
export const DESIGN_W = 1920
export const DESIGN_H = 1000
/** Never shrink below this (text stays readable on 1366 × 768). */
export const MIN_ZOOM = 0.67
/** Below this width (tablet / phone) the app is not scaled. */
const NO_ZOOM_BELOW = 900

let current = 1

export function computeZoom(w: number, h: number): number {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 1
  if (w < NO_ZOOM_BELOW) return 1
  const z = Math.min(1, w / DESIGN_W, h / DESIGN_H)
  return Math.max(MIN_ZOOM, Math.round(z * 1000) / 1000)
}

/** Current zoom factor applied to <html> (1 = none). */
export function uiZoom(): number {
  return current
}

/** Visual px (clientX, getBoundingClientRect, innerWidth) → CSS px inside the zoomed root. */
export function toLayoutPx(v: number): number {
  return v / current
}

function apply(): void {
  const root = document.documentElement
  const w = window.innerWidth
  const h = window.innerHeight
  const z = computeZoom(w, h)
  current = z
  root.style.setProperty('zoom', z === 1 ? '' : String(z))
  root.style.setProperty('--uiz', String(z))
  root.style.setProperty('--app-h', `${h / z}px`)
  root.style.setProperty('--app-w', `${w / z}px`)
}

let installed = false

/** Call once before the first render (main.tsx). Re-fits on window resize / browser zoom. */
export function installUiZoom(): void {
  if (installed || typeof window === 'undefined' || typeof document === 'undefined') return
  installed = true
  apply()
  let raf = 0
  const onResize = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      apply()
    })
  }
  window.addEventListener('resize', onResize)
  window.visualViewport?.addEventListener('resize', onResize)
}
