'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { User, Role, Permission } from '../types/auth'
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

        const saved = window.localStorage.getItem('aiva.auth.user')
        if (saved) {
          const found = USERS.find(u => u.id === saved || u.email === saved)
          if (found) return found
        }
      } catch {}
      if (process.env.NODE_ENV === 'test') {
        return USERS.find(u => u.role === 'ACC') || USERS[0]
      }
    }
    return ANONYMOUS_USER
  })
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT)

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
    if (r.scope === 'all') {
      return { ok: true }
    }
    if (!currentUser.co.includes(doc.company)) {
      return { ok: false, why: `เอกสารอยู่นอกบริษัทที่ได้รับมอบหมาย (${doc.company})` }
    }
    if (r.scope === 'receiver' && !doc.receiver) {
      return { ok: false, why: 'เอกสารยังไม่มี Receiver ในใบรับ · ฝ่ายบัญชีดำเนินการ' }
    }
    if (r.scope === 'receiver' && !acctsOf(currentUser).includes(doc.receiver || '')) {
      return { ok: false, why: `ไม่ได้เป็น Receiver ของใบรับนี้ (Receiver = ${doc.receiver})` }
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
