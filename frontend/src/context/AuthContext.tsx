'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { User, Role, Permission } from '../types/auth'
import { InvoiceDoc } from '../types/invoice'
import { AuditEntry } from '../types/audit'
import { USERS, ROLES, acctsOf } from '../mock/users'

interface AuthContextType {
  currentUser: User
  currentRole: Role
  users: User[]
  can: (permission: Permission) => boolean
  scopeCheck: (doc: InvoiceDoc) => { ok: boolean; why?: string }
  switchUser: (userId: string) => void
  auditLogs: AuditEntry[]
  logAudit: (act: string, doc: string, detail: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const INITIAL_AUDIT: AuditEntry[] = [
  { dt: '2026-10-07', t: '08:30:00', who: 'สมศักดิ์ ใจดี', role: 'ผู้ใช้งาน (Receiver)', act: 'เข้าสู่ระบบ', doc: '—', detail: 'Entra ID somsak.j@aapico.com · Oracle account SOMSAK JAIDEE' }
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT)

  const currentRole = ROLES[currentUser.role]

  const can = useCallback((permission: Permission): boolean => {
    return currentRole.p.includes(permission)
  }, [currentRole])

  const scopeCheck = useCallback((doc: InvoiceDoc): { ok: boolean; why?: string } => {
    const r = currentRole
    if (r.scope === 'none') {
      return { ok: false, why: 'บทบาทนี้ไม่เข้าถึงเนื้อหาเอกสาร' }
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
  }, [currentRole, currentUser])

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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        users: USERS,
        can,
        scopeCheck,
        switchUser,
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
