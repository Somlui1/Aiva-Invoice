'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { User, Role, RoleKey, Permission } from '../types/auth'
import { InvoiceDoc } from '../types/invoice'
import { AuditEntry } from '../types/audit'
import { USERS, ROLES, acctsOf } from '../mock/users'

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
  const [currentUser, setCurrentUser] = useState<User>(() => {
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
              const companies = Array.isArray(p.companies) && p.companies.length > 0 ? p.companies : ['AH', 'AHA', 'AHT', 'AHP', 'AM']
              const rcv = Array.isArray(p.oracleAccounts) && p.oracleAccounts.length > 0 ? p.oracleAccounts[0] : (p.rcvName || '—')
              return {
                id: p.id,
                n: p.name || p.n || p.id,
                email: p.email || `${p.id}@aapico.com`,
                role: p.role,
                rcvName: rcv,
                emp: p.empId ? parseInt(String(p.empId).replace(/\D/g, ''), 10) || null : (p.emp || null),
                co: companies,
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
      if (process.env.NODE_ENV === 'test') {
        return USERS.find(u => u.role === 'ACC') || USERS[0]
      }
    }
    return ANONYMOUS_USER
  })
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT)

  // Sync latest user profile & permissions from /api/auth/me
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'test') return

    const unauth = window.localStorage.getItem('aiva.test.unauthenticated') === 'true'
    if (unauth) return

    const savedId = window.localStorage.getItem('aiva.auth.user')
    const query = savedId ? `?userId=${encodeURIComponent(savedId)}` : ''

    fetch(`/api/auth/me${query}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.ok && data.user) {
          const u = data.user
          const companies = Array.isArray(u.companies) && u.companies.length > 0 ? u.companies : ['AH', 'AHA', 'AHT', 'AHP', 'AM']
          const rcv = Array.isArray(u.oracleAccounts) && u.oracleAccounts.length > 0 ? u.oracleAccounts[0] : '—'
          setCurrentUser(prev => ({
            id: u.id,
            n: u.name || prev.n || u.id,
            email: u.email || prev.email,
            role: u.role || prev.role,
            rcvName: rcv,
            emp: u.empId ? parseInt(String(u.empId).replace(/\D/g, ''), 10) || null : prev.emp,
            co: companies,
            unit: u.unit || prev.unit || 'AH',
          }))
          window.localStorage.setItem('aiva.auth.profile', JSON.stringify(u))
        }
      })
      .catch(() => {})
  }, [])

  const isAuthenticated = Boolean(currentUser && currentUser.id !== '' && currentUser.id !== ANONYMOUS_USER.id)
  const currentRole = ROLES[currentUser.role]

  const can = useCallback((permission: Permission): boolean => {
    if (!isAuthenticated) return false
    return currentRole.p.includes(permission)
  }, [currentRole, isAuthenticated])

  const scopeCheck = useCallback((doc: InvoiceDoc): { ok: boolean; why?: string } => {
    if (!isAuthenticated) {
      return { ok: false, why: 'ยังไม่ได้เข้าสู่ระบบ' }
    }
    const r = currentRole
    if (r.scope === 'none') {
      return { ok: false, why: 'บทบาทนี้ไม่เข้าถึงเนื้อหาเอกสาร' }
    }
    if (r.scope === 'all' || currentUser.co.includes('ALL')) {
      return { ok: true }
    }
    if (currentUser.co.length > 0 && !currentUser.co.includes(doc.company)) {
      return { ok: false, why: `เอกสารอยู่นอกบริษัทที่ได้รับมอบหมาย (${doc.company})` }
    }
    if (r.scope === 'receiver') {
      const myAccts = acctsOf(currentUser)
      if (myAccts.length > 0) {
        if (!doc.receiver) {
          return { ok: false, why: 'เอกสารยังไม่มี Receiver ในใบรับ · ฝ่ายบัญชีดำเนินการ' }
        }
        if (!myAccts.includes(doc.receiver)) {
          return { ok: false, why: `ไม่ได้เป็น Receiver ของใบรับนี้ (Receiver = ${doc.receiver})` }
        }
      }
    }
    return { ok: true }
  }, [currentRole, currentUser, isAuthenticated])

  const logAudit = useCallback((act: string, doc: string, detail: string) => {
    const now = new Date().toTimeString().slice(0, 8)
    const today = '2026-10-07'
    setAuditLogs(prev => [
      {
        dt: today,
        t: now,
        who: currentUser.n,
        role: currentRole.n,
        act,
        doc,
        detail
      },
      ...prev
    ])
  }, [currentUser, currentRole])

  const switchUser = useCallback((userId: string) => {
    const user = USERS.find(u => u.id === userId)
    if (!user) return
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
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('aiva.auth.user')
        window.localStorage.removeItem('aiva.auth.profile')
        document.cookie = 'aiva_session=; path=/; max-age=0'
        setCurrentUser(ANONYMOUS_USER)
        window.location.href = '/login'
      }
    } catch {}
  }, [])

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
        logAudit
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
