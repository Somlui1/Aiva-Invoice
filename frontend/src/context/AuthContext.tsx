'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { User, Role, RoleKey, Permission } from '../types/auth'
import { InvoiceDoc } from '../types/invoice'
import { AuditEntry } from '../types/audit'
import { USERS, ROLES, acctsOf } from '../mock/users'
import { SESSION_EXPIRED_EVENT, expireSession, hasClientSession, verifySession, watchSessionOnFocus } from '../lib/session'
import {
  VIEW_AS_EVENT,
  VIEW_AS_TTL_MS,
  clearViewAs,
  headerFor,
  readViewAs,
  viewAsKeyOf,
  writeViewAs,
  type ViewAsState,
  type ViewAsTarget,
} from '../lib/viewAs'
import { explainScope } from '../lib/docScope'

export const ANONYMOUS_USER: User = {
  id: '',
  n: 'ผู้เยี่ยมชม (ยังไม่ได้เข้าสู่ระบบ)',
  email: '',
  role: 'EU',
  rcvName: '—',
  emp: null,
  co: [],
  unit: 'ยังไม่ได้เข้าสู่ระบบ'
}

interface AuthContextType {
  currentUser: User
  currentRole: Role
  isAuthenticated: boolean
  users: User[]
  can: (permission: Permission) => boolean
  scopeCheck: (doc: InvoiceDoc) => { ok: boolean; why?: string }
  switchUser: (userId: string) => void
  logout: () => void
  auditLogs: AuditEntry[]
  logAudit: (act: string, doc: string, detail: string) => void
  /** v5.10: the signed-in person (differs from `currentUser` only while a SA uses "view as"). */
  realUser: User
  /** Active SA "view as" (read-only), or null. */
  viewAs: ViewAsState | null
  /** '' when not previewing; changes on every start / switch / stop (used to remount app state). */
  viewAsKey: string
  isPreview: boolean
  startViewAs: (target: ViewAsTarget) => Promise<{ ok: boolean; error?: string }>
  stopViewAs: (reason?: 'user' | 'expired' | 'logout') => void
  /** Oracle accounts of `currentUser` (the target's while previewing). */
  accountsOf: (u?: User) => string[]
}

const AuthContext = createContext<AuthContextType | null>(null)

const INITIAL_AUDIT: AuditEntry[] = [
  { dt: '2026-10-07', t: '08:30:00', who: 'สมศักดิ์ ใจดี', role: 'ผู้ใช้งาน (Receiver)', act: 'เข้าสู่ระบบ', doc: '—', detail: 'Entra ID somsak.j@aapico.com · Oracle account SOMSAK JAIDEE' }
]

export function AuthProvider({
  children,
  initialUser
}: {
  children: React.ReactNode
  initialUser?: User | null
}) {
  const [realUser, setCurrentUser] = useState<User>(() => {
    if (initialUser !== undefined) return initialUser || ANONYMOUS_USER
    if (typeof window !== 'undefined') {
      try {
        const unauth = window.localStorage.getItem('aiva.test.unauthenticated') === 'true'
        if (unauth) return ANONYMOUS_USER

        // 1. Try restoring rich session profile (stored by LoginPage)
        const savedProfileStr = window.localStorage.getItem('aiva.auth.profile')
        if (savedProfileStr) {
          try {
            const p = JSON.parse(savedProfileStr)
            if (p && p.id && p.role) {
              // v5.11.1: no assignment means no assignment — never "every company" (the server
              // enforces the same scope; defaulting here only showed rows the API then refused).
              const companies = Array.isArray(p.companies) ? p.companies : []
              const accts: string[] = Array.isArray(p.oracleAccounts) ? p.oracleAccounts : []
              const rcv = accts.length > 0 ? accts[0] : (p.rcvName || '—')
              return {
                id: p.id,
                n: p.name || p.n || p.id,
                email: p.email || `${p.id}@aapico.com`,
                role: p.role,
                rcvName: rcv,
                emp: p.empId ? parseInt(String(p.empId).replace(/\D/g, ''), 10) || null : (p.emp || null),
                co: companies,
                accts,
                unit: p.unit || 'AH',
              }
            }
          } catch {}
        }

        // 2. Try restoring user ID string
        const saved = window.localStorage.getItem('aiva.auth.user')
        if (saved) {
          const found = USERS.find(u => u.id === saved || u.email === saved)
          if (found) return found

          // Support any genuine AD employee outside the mock roster
          return {
            id: saved,
            n: saved,
            email: saved.includes('@') ? saved : `${saved}@aapico.com`,
            role: (saved.toLowerCase() === 'itsupport' ? 'SA' : 'EU') as RoleKey,
            rcvName: '—',
            emp: null,
            co: ['AH', 'AHA', 'AHT', 'AHP', 'AM'],
            unit: 'AH',
          }
        }
      } catch {}
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
        return USERS.find(u => u.role === 'ACC') || USERS[0]
      }
    }
    return ANONYMOUS_USER
  })
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT)

  // ---- v5.10 SA "view as" -----------------------------------------------------------------------
  const [viewAs, setViewAsState] = useState<ViewAsState | null>(() => readViewAs())
  // Only a real SA can be in view-as; anything else found in storage is dropped.
  const activeViewAs = viewAs && realUser.role === 'SA' ? viewAs : null
  const currentUser: User = useMemo(() => {
    if (!activeViewAs) return realUser
    const t = activeViewAs.user
    return {
      id: t.id,
      n: t.name,
      email: t.email,
      role: t.role,
      rcvName: t.receivers[0] ?? '—',
      accts: t.receivers,
      emp: null,
      co: t.companies,
      unit: 'มุมมองจำลอง',
    }
  }, [activeViewAs, realUser])

  useEffect(() => {
    if (viewAs && realUser.id && realUser.role !== 'SA') {
      clearViewAs()
      setViewAsState(null)
    }
  }, [viewAs, realUser.id, realUser.role])

  // Other code (expiry, logout, session expiry, another component) changes the stored view → follow it.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setViewAsState(readViewAs())
    window.addEventListener(VIEW_AS_EVENT, sync)
    return () => window.removeEventListener(VIEW_AS_EVENT, sync)
  }, [])

  const stopViewAs = useCallback((reason: 'user' | 'expired' | 'logout' = 'user') => {
    const cur = readViewAs(0) ?? viewAs
    clearViewAs()
    setViewAsState(null)
    if (cur && typeof fetch === 'function') {
      void fetch('/api/auth/view-as', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: cur.label, reason }),
      }).catch(() => undefined)
    }
  }, [viewAs])

  // Expiry: checked every 15 s (and on focus); the stored entry also self-expires on read.
  useEffect(() => {
    if (!activeViewAs) return
    const check = () => {
      if (Date.now() >= activeViewAs.expiresAt) stopViewAs('expired')
    }
    const id = window.setInterval(check, 15_000)
    window.addEventListener('focus', check)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', check)
    }
  }, [activeViewAs, stopViewAs])

  const startViewAs = useCallback(
    async (target: ViewAsTarget): Promise<{ ok: boolean; error?: string }> => {
      if (realUser.role !== 'SA') return { ok: false, error: 'เฉพาะ Super Admin' }
      if (target.kind === 'role' && (target.role as string) === 'SA') return { ok: false, error: 'เลือก SA ไม่ได้' }
      let resolved: ViewAsState['user'] | null = null
      let label = ''
      let serverChecked = false
      try {
        const res = await fetch('/api/auth/view-as', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: headerFor(target) }),
        })
        const data = await res.json().catch(() => null)
        if (res.ok && data?.ok && data.user) {
          resolved = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email || '',
            role: data.user.role,
            companies: data.user.companies || [],
            receivers: data.user.oracleAccounts || [],
          }
          label = data.label
          serverChecked = true
        } else if (res.status === 400 || res.status === 403) {
          return { ok: false, error: data?.error || 'เลือกเป้าหมายนี้ไม่ได้' }
        }
      } catch {
        /* no backend (mock / offline) → local resolution below */
      }
      if (!resolved) {
        if (target.kind === 'user') {
          const u = USERS.find(x => x.id === target.userId)
          if (!u || u.role === 'SA') return { ok: false, error: 'ไม่พบผู้ใช้ หรือเลือกผู้ใช้นี้ไม่ได้' }
          resolved = { id: u.id, name: u.n, email: u.email, role: u.role, companies: u.co, receivers: acctsOf(u) }
          label = `${u.n} (${u.role})`
        } else {
          const companies = target.companies.length ? target.companies : ['AH', 'AHA', 'AHT', 'AHP', 'AM']
          resolved = { id: `view-as:${target.role}`, name: `มุมมอง ${target.role}`, email: '', role: target.role, companies, receivers: target.receivers }
          label = `role ${target.role} · ${companies.join(',')}`
        }
      }
      if (resolved.role === 'SA') return { ok: false, error: 'ดูในมุมมองของ Super Admin คนอื่นไม่ได้' }
      const now = Date.now()
      const next: ViewAsState = { target, user: resolved, label, startedAt: now, expiresAt: now + VIEW_AS_TTL_MS, serverChecked }
      writeViewAs(next)
      setViewAsState(next)
      return { ok: true }
    },
    [realUser.role],
  )

  // v5.7: verify the server session on load (and when the tab comes back) — the cached profile in
  // localStorage is only a hint; the httpOnly `aiva_session` cookie is the truth. Invalid → clear the
  // cache, tell the user "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" on /login and redirect (lib/session.ts).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return
    if (window.localStorage.getItem('aiva.test.unauthenticated') === 'true') return

    let alive = true
    void verifySession().then(r => {
      if (!alive) return
      if (r.state === 'invalid') {
        if (hasClientSession()) {
          setCurrentUser(ANONYMOUS_USER)
          expireSession('startup_check')
        }
        return
      }
      if (r.state !== 'valid') return
      const u = r.user
      const companies = Array.isArray(u.companies) ? u.companies : []
      const accts: string[] = Array.isArray(u.oracleAccounts) ? u.oracleAccounts : []
      const rcv = accts.length > 0 ? accts[0] : '—'
      setCurrentUser(prev => ({
        id: u.id,
        n: u.name || prev.n || u.id,
        email: u.email || prev.email,
        role: (u.role as RoleKey) || prev.role,
        rcvName: rcv,
        emp: prev.emp,
        co: companies,
        accts,
        unit: u.unit || prev.unit || 'AH',
      }))
      window.localStorage.setItem('aiva.auth.user', u.id)
      window.localStorage.setItem('aiva.auth.profile', JSON.stringify(u))
    })

    // A 401 caught by the fetch interceptor anywhere in the app drops the in-memory user at once.
    const onExpired = () => setCurrentUser(ANONYMOUS_USER)
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    const stopWatch = watchSessionOnFocus()
    return () => {
      alive = false
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
      stopWatch()
    }
  }, [])

  const isAuthenticated = Boolean(realUser && realUser.id !== '' && realUser.id !== ANONYMOUS_USER.id)
  const currentRole = ROLES[currentUser.role]

  const accountsOf = useCallback(
    (u: User = currentUser): string[] => (activeViewAs && u.id === currentUser.id ? activeViewAs.user.receivers : acctsOf(u)),
    [activeViewAs, currentUser],
  )

  const can = useCallback((permission: Permission): boolean => {
    if (!isAuthenticated) return false
    return currentRole.p.includes(permission)
  }, [currentRole, isAuthenticated])

  const scopeCheck = useCallback((doc: InvoiceDoc): { ok: boolean; why?: string } => {
    if (!isAuthenticated) {
      return { ok: false, why: 'ยังไม่ได้เข้าสู่ระบบ' }
    }
    // v5.10: one shared rule (lib/docScope) — the server applies the same one under "view as".
    const r = explainScope(doc, { role: currentUser.role, companies: currentUser.co, accounts: accountsOf(currentUser) })
    return r.ok ? { ok: true } : { ok: false, why: r.why }
  }, [currentUser, isAuthenticated, accountsOf])

  const logAudit = useCallback((act: string, doc: string, detail: string) => {
    const now = new Date().toTimeString().slice(0, 8)
    const today = '2026-10-07'
    setAuditLogs(prev => [
      {
        dt: today,
        t: now,
        who: realUser.n,
        role: ROLES[realUser.role].n,
        act,
        doc,
        detail
      },
      ...prev
    ])
  }, [realUser])

  const switchUser = useCallback((userId: string) => {
    const user: User = USERS.find(u => u.id === userId) || {
      id: userId,
      n: userId,
      email: userId.includes('@') ? userId : `${userId}@aapico.com`,
      role: (userId === 'itsupport' ? 'SA' : userId === 'u7' ? 'ADM' : userId === 'u6' ? 'APR' : 'EU') as RoleKey,
      rcvName: '—',
      emp: null,
      co: ['AH', 'AHA', 'AHT', 'AHP', 'AM'],
      unit: 'AH',
    }
    setCurrentUser(user)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('aiva.auth.user', user.id)
      }
    } catch {}
    const now = new Date().toTimeString().slice(0, 8)
    const accounts = acctsOf(user).join(', ') || '—'
    setAuditLogs(prev => [
      {
        dt: '2026-10-07',
        t: now,
        who: user.n,
        role: ROLES[user.role].n,
        act: 'เข้าสู่ระบบ',
        doc: '—',
        detail: `Entra ID ${user.email}${user.role === 'EU' ? ` · Oracle account ${accounts}` : ''}`
      },
      ...prev
    ])
  }, [])

  const logout = useCallback(() => {
    if (readViewAs(0)) stopViewAs('logout')
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('aiva.auth.user')
        window.localStorage.removeItem('aiva.auth.profile')
        setCurrentUser(ANONYMOUS_USER)
        // The session cookie is httpOnly: only the server can clear it (document.cookie cannot).
        const go = () => {
          window.location.href = '/login'
        }
        fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).then(go, go)
      }
    } catch {}
  }, [stopViewAs])

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        users: USERS,
        can,
        scopeCheck,
        switchUser,
        logout,
        auditLogs,
        logAudit,
        realUser,
        viewAs: activeViewAs,
        viewAsKey: viewAsKeyOf(activeViewAs),
        isPreview: !!activeViewAs,
        startViewAs,
        stopViewAs,
        accountsOf
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
