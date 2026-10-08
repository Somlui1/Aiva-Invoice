'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PersonalPreferences, OrgSettings, SettingLogEntry } from '../types/settings'
import { AccountMapping } from '../types/auth'
import { ACTION_REASONS } from '../mock/rules'
import { INITIAL_MAPS } from '../mock/users'
import { useAuth } from './AuthContext'

interface SettingsContextType {
  pref: PersonalPreferences
  orgSettings: OrgSettings
  settingLogs: SettingLogEntry[]
  accountMaps: AccountMapping[]
  savePref: (newPref: PersonalPreferences) => void
  resetPref: () => void
  saveStaleDays: (days: number) => { ok: boolean; msg?: string }
  saveLimit: (limit: number, mfa: string) => { ok: boolean; msg?: string }
  saveReasons: (reasons: Record<string, string[]>) => { ok: boolean; msg?: string }
  saveEuVis: (mode: 'all' | 'reason' | 'none') => void
  savePrint: (print: { EU: boolean; ACC: boolean; APR: boolean }) => void
  saveQueueDef: (period: string, hideClosed: boolean) => void
  addMapping: (userId: string, acct: string, req: string) => { ok: boolean; msg?: string }
  delMapping: (id: string, req: string) => { ok: boolean; msg?: string }
  toggleUserCompany: (userId: string, co: string, req: string) => { ok: boolean; msg?: string }
}

const DEFAULT_ORG_SETTINGS: OrgSettings = {
  staleDays: 7,
  limit: { APR: 1000000 },
  hideClosed: true,
  period: 'month',
  euReason: 'reason',
  print: { EU: true, ACC: true, APR: true },
  reasons: JSON.parse(JSON.stringify(ACTION_REASONS))
}

const INITIAL_SET_LOG: SettingLogEntry[] = [
  { dt: '2026-10-05', t: '09:12:00', who: 'สมชาย วงศ์ทอง', role: 'หัวหน้าฝ่ายบัญชี', what: 'จำนวนวันค้างนาน', o: '5 วัน', n: '7 วัน', ref: '' },
  { dt: '2026-10-02', t: '14:40:00', who: 'อนุชา ไอที', role: 'ผู้ดูแลระบบ (IT)', what: 'ผูก Oracle account', o: '—', n: 'กิตติ สมบูรณ์ → SOMSAK JAIDEE', ref: 'ticket INC-1021' }
]

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, logAudit } = useAuth()
  const [pref, setPref] = useState<PersonalPreferences>({
    cols: { tax: true, po: true, rcv: true, own: true, up: true, age: true }
  })
  const [orgSettings, setOrgSettings] = useState<OrgSettings>(DEFAULT_ORG_SETTINGS)
  const [settingLogs, setSettingLogs] = useState<SettingLogEntry[]>(INITIAL_SET_LOG)
  const [accountMaps, setAccountMaps] = useState<AccountMapping[]>(INITIAL_MAPS)

  // Load preferences when active user changes
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`aiva.pref.${currentUser.id}`)
      if (stored) {
        setPref(JSON.parse(stored))
      } else {
        setPref({
          cols: { tax: true, po: true, rcv: true, own: true, up: true, age: true }
        })
      }
    } catch {
      // fallback
    }
  }, [currentUser.id])

  const savePref = useCallback((newPref: PersonalPreferences) => {
    setPref(newPref)
    try {
      window.localStorage.setItem(`aiva.pref.${currentUser.id}`, JSON.stringify(newPref))
    } catch {
      // ignore
    }
    logAudit('บันทึกการตั้งค่าส่วนตัว', '—', `ช่วงเวลา ${newPref.period || 'ตามค่ากลาง'} · มุมมอง ${newPref.view || 'ตามค่ากลาง'}`)
  }, [currentUser.id, logAudit])

  const resetPref = useCallback(() => {
    const defaultP: PersonalPreferences = {
      cols: { tax: true, po: true, rcv: true, own: true, up: true, age: true }
    }
    setPref(defaultP)
    try {
      window.localStorage.removeItem(`aiva.pref.${currentUser.id}`)
    } catch {
      // ignore
    }
    logAudit('คืนค่าเริ่มต้นส่วนตัว', '—', 'คืนค่าการตั้งค่าส่วนตัว')
  }, [currentUser.id, logAudit])

  const logSettingChange = useCallback((what: string, o: string, n: string, ref: string) => {
    const now = new Date().toTimeString().slice(0, 8)
    const entry: SettingLogEntry = {
      dt: '2026-10-07',
      t: now,
      who: currentUser.n,
      role: currentUser.role,
      what,
      o,
      n,
      ref
    }
    setSettingLogs(prev => [entry, ...prev])
    logAudit('เปลี่ยนการตั้งค่า', '—', `${what}: ${o} → ${n}${ref ? ` · อ้างอิง ${ref}` : ''}`)
  }, [currentUser, logAudit])

  const saveStaleDays = useCallback((days: number) => {
    if (currentUser.role !== 'APR') return { ok: false, msg: 'เฉพาะหัวหน้าฝ่ายบัญชี (APR) แก้ค่านี้ได้' }
    if (!Number.isInteger(days) || days < 1 || days > 90) return { ok: false, msg: 'ใส่จำนวนวันเป็นจำนวนเต็ม 1–90' }
    const old = orgSettings.staleDays
    setOrgSettings(prev => ({ ...prev, staleDays: days }))
    logSettingChange('จำนวนวันค้างนาน', `${old} วัน`, `${days} วัน`, '')
    return { ok: true }
  }, [currentUser.role, orgSettings.staleDays, logSettingChange])

  const saveLimit = useCallback((limit: number, mfa: string) => {
    if (currentUser.role !== 'APR') return { ok: false, msg: 'เฉพาะหัวหน้าฝ่ายบัญชี (APR) แก้ค่านี้ได้' }
    if (mfa !== '123456') return { ok: false, msg: 'รหัส MFA ไม่ถูกต้อง (mockup ใช้ 123456)' }
    const old = orgSettings.limit.APR
    setOrgSettings(prev => ({ ...prev, limit: { ...prev.limit, APR: limit } }))
    logSettingChange('วงเงินตั้งหนี้ต่อฉบับ (APR)', `${old.toLocaleString()} ฿`, `${limit.toLocaleString()} ฿`, 'MFA ผ่าน')
    return { ok: true }
  }, [currentUser.role, orgSettings.limit.APR, logSettingChange])

  const saveReasons = useCallback((newReasons: Record<string, string[]>) => {
    if (currentUser.role !== 'APR') return { ok: false, msg: 'เฉพาะหัวหน้าฝ่ายบัญชี (APR) แก้ค่านี้ได้' }
    setOrgSettings(prev => ({ ...prev, reasons: newReasons }))
    logSettingChange('รายการเหตุผล', 'เดิม', 'ปรับปรุงรายการเหตุผล', '')
    return { ok: true }
  }, [currentUser.role, logSettingChange])

  const saveEuVis = useCallback((mode: 'all' | 'reason' | 'none') => {
    if (currentUser.role !== 'APR') return
    const labels = { all: 'เห็นเหตุผลและหมายเหตุ', reason: 'เห็นเฉพาะเหตุผลที่เลือก', none: 'ไม่เห็น' }
    const old = orgSettings.euReason
    setOrgSettings(prev => ({ ...prev, euReason: mode }))
    logSettingChange('End User เห็นเหตุผล', labels[old], labels[mode], '')
  }, [currentUser.role, orgSettings.euReason, logSettingChange])

  const savePrint = useCallback((printConfig: { EU: boolean; ACC: boolean; APR: boolean }) => {
    if (currentUser.role !== 'APR') return
    setOrgSettings(prev => ({ ...prev, print: printConfig }))
    logSettingChange('สิทธิ์พิมพ์/ดาวน์โหลด PDF', 'เดิม', 'ปรับปรุง', '')
  }, [currentUser.role, logSettingChange])

  const saveQueueDef = useCallback((period: string, hideClosed: boolean) => {
    if (currentUser.role !== 'APR') return
    setOrgSettings(prev => ({ ...prev, period, hideClosed }))
    logSettingChange('ค่าเริ่มต้นของคิว', `${orgSettings.period}, ซ่อน: ${orgSettings.hideClosed}`, `${period}, ซ่อน: ${hideClosed}`, '')
  }, [currentUser.role, orgSettings.period, orgSettings.hideClosed, logSettingChange])

  const addMapping = useCallback((userId: string, acct: string, req: string) => {
    if (currentUser.role !== 'ADM') return { ok: false, msg: 'เฉพาะ IT Admin จัดการการผูกบัญชี' }
    if (!req.trim()) return { ok: false, msg: 'ระบุอ้างอิงคำขอ (ticket / อีเมล) ก่อนทุกครั้ง' }
    const cleanAcct = acct.trim().toUpperCase()
    if (!cleanAcct) return { ok: false, msg: 'ระบุชื่อ Oracle account' }
    if (accountMaps.some(m => m.user === userId && m.acct === cleanAcct)) {
      return { ok: false, msg: 'ผูกไว้แล้ว' }
    }
    const newId = 'm' + (accountMaps.length + 1)
    const newMap: AccountMapping = {
      id: newId,
      user: userId,
      acct: cleanAcct,
      by: currentUser.n,
      at: '2026-10-07',
      req: req.trim()
    }
    setAccountMaps(prev => [...prev, newMap])
    logSettingChange('ผูก Oracle account', '—', `${userId} → ${cleanAcct}`, req)
    return { ok: true }
  }, [currentUser, accountMaps, logSettingChange])

  const delMapping = useCallback((id: string, req: string) => {
    if (currentUser.role !== 'ADM') return { ok: false, msg: 'เฉพาะ IT Admin จัดการการผูกบัญชี' }
    if (!req.trim()) return { ok: false, msg: 'ระบุอ้างอิงคำขอ (ticket / อีเมล) ก่อนทุกครั้ง' }
    const m = accountMaps.find(x => x.id === id)
    if (!m) return { ok: false, msg: 'ไม่พบรายการ' }
    setAccountMaps(prev => prev.filter(x => x.id !== id))
    logSettingChange('ยกเลิกการผูก Oracle account', `${m.user} → ${m.acct}`, '—', req)
    return { ok: true }
  }, [currentUser.role, accountMaps, logSettingChange])

  const toggleUserCompany = useCallback((userId: string, co: string, req: string) => {
    if (currentUser.role !== 'ADM') return { ok: false, msg: 'เฉพาะ IT Admin จัดการ' }
    if (!req.trim()) return { ok: false, msg: 'ระบุอ้างอิงคำขอ (ticket / อีเมล) ก่อนทุกครั้ง' }
    logSettingChange(`บริษัทที่รับผิดชอบ · ${userId}`, co, 'สลับสิทธิ์', req)
    return { ok: true }
  }, [currentUser.role, logSettingChange])

  return (
    <SettingsContext.Provider
      value={{
        pref,
        orgSettings,
        settingLogs,
        accountMaps,
        savePref,
        resetPref,
        saveStaleDays,
        saveLimit,
        saveReasons,
        saveEuVis,
        savePrint,
        saveQueueDef,
        addMapping,
        delMapping,
        toggleUserCompany
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
