/* =====================================================================
   AIVA v5.3 · Intro / Splash screen (ดีไซน์เดียวกับ aiva-react)
   · แสดงทุกครั้งที่โหลดหน้าใหม่ (~2.1 วินาที) · คลิกเพื่อข้ามได้
   · ถ้ายังมีเซสชันอยู่ → โหมด "Welcome back" + ชื่อ/บทบาท (~1.75 วินาที)
   · หลังจบ → แอนิเมชันเข้าแอป (ซูม/เลื่อนเข้าตำแหน่ง) + การ์ดต้อนรับ
     หรือ แอนิเมชันเปิดหน้า login ถ้ายังไม่เข้าสู่ระบบ
   · ถ้าเพิ่งกดเข้าสู่ระบบสำเร็จ (reload หลัง login) → ไม่แสดง splash ซ้ำ
     แต่เล่นแอนิเมชันเข้าแอป + การ์ด "เข้าสู่ระบบสำเร็จ" ทันที
   · prefers-reduced-motion → สั้นลงและไม่มีแอนิเมชัน

   UI-fix-1: บล็อก "Welcome back" ไม่ใช้แคปซูลมีกรอบซ้อนในการ์ดอีกต่อไป
           (อวาตาร์ → ชื่อ → บทบาทเป็นจุดสี + ตัวอักษร) · เอา tooltip ของเบราว์เซอร์ออก ใช้คำใบ้บนจอแทน
   ===================================================================== */
import { useEffect, useRef, useState } from 'react'
import { ROLES, USERS } from '../../mock/users'
import type { RoleKey } from '../../types/auth'
import { appIn, consumeJustLoggedIn, initialOf, loginIn, noFx, welcome, type FxRole } from '../../lib/fx'
import { BrandTile } from './BrandTile'
import '../../styles/aiva/splash-who.css'

interface SessionInfo {
  n: string
  role: RoleKey
}

/** อ่านเซสชันจาก localStorage แบบเดียวกับ AuthContext (ไม่ต้องอยู่ใต้ AuthProvider) */
export function readSession(): SessionInfo | null {
  if (typeof window === 'undefined') return null
  try {
    if (window.localStorage.getItem('aiva.test.unauthenticated') === 'true') return null
    const p = window.localStorage.getItem('aiva.auth.profile')
    if (p) {
      const o = JSON.parse(p)
      if (o && o.id && o.role) return { n: o.name || o.n || o.id, role: o.role }
    }
    const id = window.localStorage.getItem('aiva.auth.user')
    if (id) {
      const u = USERS.find(x => x.id === id || x.email === id)
      if (u) return { n: u.n, role: u.role }
      return { n: id, role: id.toLowerCase() === 'itsupport' ? 'SA' : 'EU' }
    }
  } catch {}
  return null
}

export function roleTone(role: RoleKey | string | undefined): FxRole {
  const r = role ? (ROLES as Record<string, { n: string; c: string; bg: string }>)[role] : undefined
  return r ? { n: r.n, c: r.c, bg: r.bg } : { n: '', c: 'var(--t-blue)', bg: 'var(--t-blue-bg)' }
}

/* คำนวณครั้งเดียวต่อการโหลดหน้า (กัน StrictMode เรียก initializer ซ้ำแล้ว flag หาย) */
interface Boot {
  show: boolean
  justLoggedIn: boolean
  session: SessionInfo | null
  onLogin: boolean
}
let BOOT: Boot | null = null
function boot(): Boot {
  if (BOOT) return BOOT
  if (typeof window === 'undefined') return (BOOT = { show: false, justLoggedIn: false, session: null, onLogin: false })
  const path = window.location.pathname || '/'
  const q = window.location.search + window.location.hash
  const onLogin = path === '/login'
  const session = onLogin ? null : readSession()
  const justLoggedIn = consumeJustLoggedIn() && !!session
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
  const show = !isTest && !justLoggedIn && !path.startsWith('/viewer/') && !/[?&#]nosplash\b/.test(q)
  BOOT = { show, justLoggedIn, session, onLogin }
  return BOOT
}

const TX_LOGIN = ['Initializing workspace…', 'Preparing workspace…', 'Almost ready…', 'Ready']
const TX_RESUME = ['Restoring session…', 'Verifying access…', 'Loading your queue…', 'Ready']

export function SplashScreen() {
  const b = boot()
  const [gone, setGone] = useState(!b.show)
  const [out, setOut] = useState(false)
  const [step, setStep] = useState(0)
  const finished = useRef(false)
  const resume = !!b.session

  // หลังเพิ่งเข้าสู่ระบบ: ไม่มี splash แต่เล่นเอฟเฟกต์เข้าแอป + การ์ดต้อนรับ
  useEffect(() => {
    if (!b.justLoggedIn || !b.session) return
    const s = b.session
    const t = window.setTimeout(() => {
      appIn({})
      welcome(s, roleTone(s.role), 'login')
    }, 60)
    return () => window.clearTimeout(t)
  }, [b])

  useEffect(() => {
    if (gone || !b.show) return
    const reduce = noFx()
    const total = resume ? (reduce ? 420 : 1750) : reduce ? 500 : 2100
    const tx = resume ? TX_RESUME : TX_LOGIN
    const iv = window.setInterval(() => setStep(k => Math.min(k + 1, tx.length - 1)), Math.max(120, total / 4))
    const done = () => {
      if (finished.current) return
      finished.current = true
      window.clearInterval(iv)
      setOut(true)
      if (b.session) {
        appIn({})
        welcome(b.session, roleTone(b.session.role), 'resume')
      } else {
        loginIn()
      }
      window.setTimeout(() => setGone(true), 650)
    }
    const to = window.setTimeout(done, total)
    const el = document.getElementById('splash')
    const onClick = () => {
      window.clearTimeout(to)
      done()
    }
    el?.addEventListener('click', onClick)
    return () => {
      window.clearTimeout(to)
      window.clearInterval(iv)
      el?.removeEventListener('click', onClick)
    }
  }, [gone, b, resume])

  if (gone) return null

  const tx = resume ? TX_RESUME : TX_LOGIN
  const tone = resume && b.session ? roleTone(b.session.role) : null

  return (
    <div
      id="splash"
      className={`${resume ? 'resume' : ''} ${out ? 'out' : ''}`.trim()}
      role="status"
      aria-label="กำลังเริ่มระบบ AIVA"
    >
      <div className="au a1" />
      <div className="au a2" />
      <div className="au a3" />
      <div className="card">
        <div className="emb">
          <div className="glow" />
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="pt" style={{ left: '6%', top: '18%', width: 5, height: 5, background: '#2dd4c4', boxShadow: '0 0 8px #2dd4c4' }} />
          <span className="pt" style={{ right: '5%', top: '26%', width: 6, height: 6, background: '#818cf8', boxShadow: '0 0 9px #818cf8', animationDelay: '.6s' }} />
          <span className="pt" style={{ left: '12%', bottom: '14%', width: 4, height: 4, background: '#60a5fa', boxShadow: '0 0 7px #60a5fa', animationDelay: '1.1s' }} />
          <span className="pt" style={{ right: '10%', bottom: '10%', width: 5, height: 5, background: '#2dd4c4', boxShadow: '0 0 8px #2dd4c4', animationDelay: '1.6s' }} />
          <BrandTile />
        </div>
        <h1>AIVA</h1>
        <p className="sub">{resume ? 'Welcome back' : 'Auto Invoice Matching'}</p>

        {resume && b.session && tone ? (
          <div className="sp-who">
            <span className="sp-av" style={{ background: tone.bg, color: tone.c }} aria-hidden="true">
              {initialOf(b.session.n)}
            </span>
            <div className="sp-name">{b.session.n}</div>
            <div className="sp-role">
              <i style={{ background: tone.c }} />
              {tone.n}
            </div>
          </div>
        ) : (
          <div className="bd">
            <span>OCR</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span>Match</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span>Post to Oracle</span>
          </div>
        )}

        <div className="bar">
          <b />
        </div>
        <div className="st" id="spSt">
          {tx[step]}
        </div>
      </div>
      <div className="sp-skip" aria-hidden="true">
        คลิกเพื่อข้าม
      </div>
    </div>
  )
}

export default SplashScreen
