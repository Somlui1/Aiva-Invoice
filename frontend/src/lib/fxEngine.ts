// AIVA v5.2 FX Animation Engine (Ported from prototype lines 6034–6106)
'use client'

const EASE = 'cubic-bezier(.45,.05,.2,1)'
const DUR = 860

function isNoFx(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return (
      window.localStorage.getItem('aiva.nofx') === 'true' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}

export function layer(): HTMLElement | null {
  if (typeof document === 'undefined') return null
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

function el(cls: string, css?: string): HTMLElement {
  const e = document.createElement('div')
  e.className = cls
  if (css) e.style.cssText = css
  const l = layer()
  if (l) l.appendChild(e)
  return e
}

function kill(e: HTMLElement, ms: number) {
  setTimeout(() => {
    if (e && e.parentNode) e.parentNode.removeChild(e)
  }, ms)
}

function anim(e: HTMLElement, kf: Keyframe[] | PropertyIndexedKeyframes, opt: KeyframeAnimationOptions) {
  try {
    return e.animate(kf, opt)
  } catch {
    return null
  }
}

export function center(node?: HTMLElement | null, fx: number = 0, fy: number = 0): [number, number] {
  if (!node || !node.getBoundingClientRect) return [fx, fy]
  const r = node.getBoundingClientRect()
  return r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] : [fx, fy]
}

export function bloom(x: number, y: number, col: string, size?: number) {
  if (typeof document === 'undefined' || isNoFx()) return
  const b = el('fx-bloom', `left:${x}px;top:${y}px;--c:${col}${size ? `;width:${size}px;height:${size}px` : ''}`)
  anim(
    b,
    [
      { transform: 'translate(-50%,-50%) scale(.1)', opacity: 0.95 },
      { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 0 },
    ],
    { duration: 950, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }
  )
  kill(b, 1050)
}

export function sparks(x: number, y: number, light: boolean, n: number = 24) {
  if (typeof document === 'undefined' || isNoFx()) return
  const cols = light
    ? ['#f59e0b', '#fbbf24', '#ffffff', '#60a5fa', '#2563eb']
    : ['#2dd4c4', '#5b9bff', '#b49cff', '#ffffff', '#7ff3e6']
  for (let i = 0; i < n; i++) {
    const c = cols[i % cols.length]
    const sz = 2 + Math.random() * 3.6
    const a = Math.random() * Math.PI * 2
    const d = 70 + Math.random() * 200
    const s = el(
      'fx-spark',
      `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${c};box-shadow:0 0 9px ${c}`
    )
    anim(
      s,
      [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${(Math.cos(a) * d).toFixed(1)}px),calc(-50% + ${(Math.sin(a) * d).toFixed(1)}px)) scale(.2)`,
          opacity: 0,
        },
      ],
      {
        duration: 650 + Math.random() * 600,
        easing: 'cubic-bezier(.1,.7,.3,1)',
        delay: Math.random() * 90,
        fill: 'forwards',
      }
    )
    kill(s, 1500)
  }
}

export function ring(x: number, y: number, R: number, cls: string = '', delay: number = 0) {
  if (typeof document === 'undefined' || isNoFx()) return
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
    { duration: DUR, easing: EASE, delay: delay, fill: 'both' }
  )
  kill(r, DUR + delay + 200)
}

export function sweep(delay: number = 0) {
  if (typeof document === 'undefined' || isNoFx()) return
  const s = el('fx-sweep')
  anim(
    s,
    [{ transform: 'translateX(-110%)' }, { transform: 'translateX(110%)' }],
    { duration: 1100, easing: 'cubic-bezier(.4,0,.2,1)', delay: delay, fill: 'both' }
  )
  kill(s, delay + 1300)
}

export function hud(light: boolean) {
  if (typeof document === 'undefined' || isNoFx()) return
  const h = el(`fx-hud ${light ? 'l' : 'd'}`)
  const sunIco = `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
  const moonIco = `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
  
  h.innerHTML = `<span class="ic">${light ? sunIco : moonIco}</span><span class="tx"><b>${light ? 'โหมดสว่าง Porcelain' : 'โหมดมืด Graphite'}</b><small>${light ? 'คมชัด สบายตา อ่านเอกสารง่าย' : 'สบายตา ลดแสงจ้า ใช้งานยาวนาน'}</small></span><i class="pg"></i>`
  h.style.transform = 'translate(-50%,26px) scale(.94)'
  anim(
    h,
    [
      { opacity: 0, transform: 'translate(-50%,26px) scale(.94)' },
      { opacity: 1, transform: 'translate(-50%,0) scale(1)' },
    ],
    { duration: 560, easing: 'cubic-bezier(.2,1.3,.3,1)', delay: 260, fill: 'both' }
  )
  setTimeout(() => {
    anim(
      h,
      [
        { opacity: 1, transform: 'translate(-50%,0) scale(1)' },
        { opacity: 0, transform: 'translate(-50%,12px) scale(.97)' },
      ],
      { duration: 340, fill: 'forwards' }
    )
  }, 2500)
  kill(h, 3000)
}

export function triggerThemeFx(triggerEl?: HTMLElement | null, toLight: boolean = false) {
  if (typeof window === 'undefined' || isNoFx()) return
  const p = center(triggerEl, window.innerWidth - 60, 28)
  const x = p[0]
  const y = p[1]
  const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 40

  if (triggerEl && triggerEl.classList) {
    triggerEl.classList.add('pop')
    setTimeout(() => triggerEl.classList.remove('pop'), 950)
  }

  bloom(x, y, toLight ? 'rgba(251,191,36,.6)' : 'rgba(45,212,196,.5)')
  sparks(x, y, toLight)
  hud(toLight)
  ring(x, y, R, '', 0)
  ring(x, y, R, 'e2', 110)
  sweep(DUR * 0.5)
}

export const FX = {
  warp(x: number, y: number) {
    if (typeof document === 'undefined' || isNoFx()) return
    const w = el('fx-warp', `left:${x}px;top:${y}px`)
    anim(
      w,
      [
        { transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 },
        { transform: 'translate(-50%,-50%) scale(24)', opacity: 0 },
      ],
      { duration: 780, easing: 'cubic-bezier(.3,.6,.2,1)', fill: 'forwards' }
    )
    kill(w, 900)
    bloom(x, y, 'rgba(45,212,196,.5)', 480)
    sparks(x, y, false, 16)
  },

  welcome(user?: { n?: string; role?: string } | null, message?: string, isSkip?: boolean, isResume?: boolean) {
    if (typeof document === 'undefined' || isNoFx() || !user) return
    const name = user.n || 'User'
    const role = user.role || 'EU'
    const initial = name.replace(/^[เแโใไ]/, '').charAt(0).toUpperCase() || 'A'
    const w = el('fx-welcome')
    w.innerHTML = `<span class="av">${initial}<i class="rg"></i></span><span class="tx"><small>${isResume ? 'ยินดีต้อนรับกลับ' : isSkip ? 'เข้าสู่ระบบ (ข้ามขั้นตอน)' : 'เข้าสู่ระบบสำเร็จ'}</small><b>${name}</b><em>${role}</em></span><span class="ok">✓</span><i class="pg"></i>`
    anim(
      w,
      [
        { opacity: 0, transform: 'translate(-50%,-26px) scale(.93)' },
        { opacity: 1, transform: 'translate(-50%,0) scale(1)' },
      ],
      { duration: 600, easing: 'cubic-bezier(.2,1.25,.3,1)', delay: isResume ? 150 : 380, fill: 'both' }
    )
    setTimeout(() => {
      anim(
        w,
        [
          { opacity: 1, transform: 'translate(-50%,0) scale(1)' },
          { opacity: 0, transform: 'translate(-50%,-14px) scale(.97)' },
        ],
        { duration: 380, fill: 'forwards' }
      )
    }, 3100)
    kill(w, 3700)
  },

  appIn(options: { lite?: boolean } = {}) {
    if (typeof document === 'undefined' || isNoFx()) return
    const root = document.documentElement
    root.classList.remove('fx-in', 'fx-lite')
    void root.offsetWidth
    root.classList.add('fx-in')
    if (options.lite) root.classList.add('fx-lite')
    setTimeout(() => {
      root.classList.remove('fx-in', 'fx-lite')
    }, options.lite ? 1500 : 2400)
    if (!options.lite) {
      sweep(0)
    }
  },

  cascade() {
    this.appIn({ lite: true })
  },

  loginIn() {
    if (typeof document === 'undefined' || isNoFx()) return
    const l = document.getElementById('lg') || document.querySelector('.aiva-login')
    if (!l) return
    l.classList.remove('lg-enter')
    void (l as HTMLElement).offsetWidth
    l.classList.add('lg-enter')
    setTimeout(() => {
      l.classList.remove('lg-enter')
    }, 1500)
  },
}
