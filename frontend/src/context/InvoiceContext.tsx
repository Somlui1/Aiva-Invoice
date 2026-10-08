import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { InvoiceDoc, InvoiceStatus } from '../types/invoice'
import { INITIAL_DOCS } from '../mock/initialDocs'
import { EU_CODES, ACTION_CONFIG, ActionType } from '../mock/rules'
import { useAuth } from './AuthContext'
import { useSettings } from './SettingsContext'
import { useToastModal } from './ToastModalContext'
import { ROLES } from '../mock/users'


export const TODAY = '2026-10-07'
const OPEN_STATUSES = ['Review', 'Hold', 'Manual Review', 'Duplicate']
const CLOSED_STATUSES = ['Posted', 'Rejected', 'Confirmed', 'Sent', 'Superseded', 'Duplicate']
const RANK: Record<string, number> = { 'Auto-pass': 1, Review: 2, Hold: 3, 'Manual Review': 4 }

export interface PeriodFilter {
  k: string
  ym?: string
  from?: string
  to?: string
}

interface InvoiceContextType {
  docs: InvoiceDoc[]
  selectedDocId: string | null
  selectedDoc: InvoiceDoc | null
  selectDoc: (docId: string | null) => void
  visibleDocs: InvoiceDoc[]
  filteredDocs: InvoiceDoc[]
  companyFilter: Set<string>
  toggleCompanyFilter: (company: string) => void
  setAllCompanies: () => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  periodFilter: PeriodFilter
  setPeriodFilter: (p: PeriodFilter) => void
  showClosed: boolean
  toggleShowClosed: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  viewMode: 'table' | 'split'
  setViewMode: (v: 'table' | 'split') => void
  clearFilters: () => void
  kpiCounts: Record<string, number>
  staleDocs: InvoiceDoc[]
  activeDetailTab: string
  setActiveDetailTab: (tab: string) => void
  isEvidenceDockOpen: boolean
  openEvidenceDock: (page?: number, ruleId?: string) => void
  closeEvidenceDock: () => void
  evidenceDockFocus: { page: number; ruleId?: string } | null
  allowedAction: (doc: InvoiceDoc, act: ActionType) => { ok: boolean; why?: string; perm?: string }
  hasHighSeverity: (doc: InvoiceDoc) => boolean
  isEuPending: (doc: InvoiceDoc) => boolean
  pendingBind: (doc: InvoiceDoc) => boolean
  executeAction: (
    docId: string,
    action: ActionType,
    reason: string,
    note: string,
    simOutcome?: string,
    uploadFile?: string
  ) => { ok: boolean; msg: string }
  precheckPost: (doc: InvoiceDoc) => { ok: boolean; code?: string; why: string }
  batchPost: (docIds: string[]) => { ok: boolean; count: number; msg: string }
}

const InvoiceContext = createContext<InvoiceContextType | null>(null)

const isoD = (t: Date) => t.toISOString().slice(0, 10)
const dAdd = (x: string, n: number) => {
  const t = new Date(x + 'T00:00:00Z')
  t.setUTCDate(t.getUTCDate() + n)
  return isoD(t)
}
const mRange = (ym: string): [string, string] => {
  const [y, m] = ym.split('-').map(Number)
  return [ym + '-01', isoD(new Date(Date.UTC(y, m, 0)))]
}

export function perRange(p: PeriodFilter): [string, string] | null {
  const ym = TODAY.slice(0, 7)
  switch (p.k) {
    case 'today':
      return [TODAY, TODAY]
    case '7d':
      return [dAdd(TODAY, -6), TODAY]
    case 'month':
      return mRange(ym)
    case 'lastm': {
      const [y, m] = ym.split('-').map(Number)
      return mRange(isoD(new Date(Date.UTC(y, m - 2, 1))).slice(0, 7))
    }
    case 'period':
      return mRange(p.ym || ym)
    case 'custom':
      return p.from || p.to ? [p.from || '0000-01-01', p.to || '9999-12-31'] : null
    default:
      return null
  }
}

export function inPerOf(dt?: string, p?: PeriodFilter): boolean {
  if (!p) return true
  const r = perRange(p)
  return !r || (!!dt && dt >= r[0] && dt <= r[1])
}

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, currentRole, can, scopeCheck, logAudit } = useAuth()
  const { orgSettings } = useSettings()
  const { toast } = useToastModal()

  const [docs, setDocs] = useState<InvoiceDoc[]>(INITIAL_DOCS)
  const [selectedDocId, setSelectedDocId] = useState<string | null>('DMS-2026-000123')
  const [companyFilter, setCompanyFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>(currentUser.role === 'EU' ? 'mine' : 'all')
  const [periodFilter, setPeriodFilterState] = useState<PeriodFilter>({
    k: currentUser.role === 'EU' ? 'all' : orgSettings.period || 'month'
  })
  const [showClosed, setShowClosed] = useState<boolean>(!orgSettings.hideClosed)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<'table' | 'split'>('table')
  const [activeDetailTab, setActiveDetailTab] = useState<string>('sum')
  const [isEvidenceDockOpen, setIsEvidenceDockOpen] = useState<boolean>(false)
  const [evidenceDockFocus, setEvidenceDockFocus] = useState<{ page: number; ruleId?: string } | null>(null)

  const openEvidenceDock = useCallback((page = 1, ruleId?: string) => {
    setIsEvidenceDockOpen(true)
    setEvidenceDockFocus({ page, ruleId })
  }, [])

  const closeEvidenceDock = useCallback(() => {
    setIsEvidenceDockOpen(false)
    setEvidenceDockFocus(null)
  }, [])

  const toggleCompanyFilter = useCallback((co: string) => {
    setCompanyFilter(prev => {
      const next = new Set(prev)
      if (next.has(co)) next.delete(co)
      else next.add(co)
      return next
    })
  }, [])

  const setAllCompanies = useCallback(() => {
    setCompanyFilter(new Set())
  }, [])

  const toggleShowClosed = useCallback(() => {
    setShowClosed(prev => !prev)
  }, [])

  const setPeriodFilter = useCallback((p: PeriodFilter) => {
    setPeriodFilterState(p)
  }, [])

  const clearFilters = useCallback(() => {
    setCompanyFilter(new Set())
    setStatusFilter(currentUser.role === 'EU' ? 'mine' : 'all')
    setSearchQuery('')
    setPeriodFilterState({ k: 'all' })
  }, [currentUser.role])

  // Scope check visible docs
  const visibleDocs = useMemo(() => {
    return docs.filter(d => scopeCheck(d).ok)
  }, [docs, scopeCheck])

  const hasHighSeverity = useCallback((d: InvoiceDoc): boolean => {
    return d.rules.some(
      r => (r.status === 'FAIL' || r.result === 'fail') && r.severity === 'High'
    )
  }, [])

  const isEuPending = useCallback((d: InvoiceDoc): boolean => {
    return d.codes.some(c => EU_CODES.has(c)) && !!d.receiver && !!d.receiverActive
  }, [])

  const pendingBind = useCallback((d: InvoiceDoc): boolean => {
    return !!d.receiver && !d.receiverActive && d.codes.some(c => EU_CODES.has(c))
  }, [])

  // Filter matching rule
  const matchStatus = useCallback(
    (k: string, d: InvoiceDoc): boolean => {
      if (k === 'all') {
        return showClosed || currentUser.role === 'EU' || !CLOSED_STATUSES.includes(d.status)
      }
      if (k === 'bind') return pendingBind(d)
      if (k === 'unres') return !!d.unres && d.status === 'Manual Review'
      if (k === 'mine') {
        return (
          d.assigned === 'eu' &&
          !['Posted', 'Rejected', 'Confirmed', 'Sent', 'Superseded', 'Duplicate'].includes(d.status)
        )
      }
      return d.status === k
    },
    [showClosed, currentUser.role, pendingBind]
  )

  // Stale docs outside period
  const staleDocs = useMemo(() => {
    return visibleDocs.filter(
      d =>
        OPEN_STATUSES.includes(d.status) &&
        (companyFilter.size === 0 || companyFilter.has(d.company)) &&
        !inPerOf(d.up, periodFilter)
    )
  }, [visibleDocs, companyFilter, periodFilter])

  // Filtered docs list
  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return visibleDocs
      .filter(d => matchStatus(statusFilter, d))
      .filter(d => companyFilter.size === 0 || companyFilter.has(d.company))
      .filter(d => inPerOf(d.up, periodFilter))
      .filter(d => {
        if (!q) return true
        const str = `${d.inv} ${d.po || ''} ${d.release || ''} ${d.vendor} ${d.stax} ${d.doc}`.toLowerCase()
        return str.includes(q)
      })
      .sort((a, b) => {
        if (statusFilter === 'mine') return a.up.localeCompare(b.up)
        return b.up.localeCompare(a.up)
      })
  }, [visibleDocs, matchStatus, statusFilter, companyFilter, periodFilter, searchQuery])

  // Selected doc
  const selectedDoc = useMemo(() => {
    if (!selectedDocId) return null
    return docs.find(d => d.doc === selectedDocId) || null
  }, [docs, selectedDocId])

  const selectDoc = useCallback((id: string | null) => {
    setSelectedDocId(id)
  }, [])

  // Dynamic KPI counts
  const kpiCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const keys =
      currentUser.role === 'EU'
        ? ['mine', 'all', 'Hold', 'Review', 'Rejected', 'Superseded']
        : ['all', 'Auto-pass', 'Review', 'Hold', 'Manual Review', 'unres', 'bind', 'Duplicate', 'Superseded']

    keys.forEach(k => {
      counts[k] = visibleDocs.filter(
        d =>
          matchStatus(k, d) &&
          (companyFilter.size === 0 || companyFilter.has(d.company)) &&
          inPerOf(d.up, periodFilter)
      ).length
    })
    return counts
  }, [visibleDocs, currentUser.role, matchStatus, companyFilter, periodFilter])

  // Allowed action calculation per SRS v1.1
  const allowedAction = useCallback(
    (d: InvoiceDoc, act: ActionType): { ok: boolean; why?: string; perm?: string } => {
      const st = d.status
      const noRcv = !d.receiver
      const R = currentUser.role

      const no = (w: string) => ({ ok: false, why: w })
      const yes = (p: any) => ({
        ok: can(p),
        why: can(p) ? undefined : `บทบาทนี้ไม่มีสิทธิ์ (${p})`,
        perm: p
      })

      if (R === 'EU') {
        if (act !== 'upload') return no('End User อัปโหลดเอกสารใหม่ได้อย่างเดียว')
        if (['Superseded', 'Duplicate', 'Confirmed', 'Sent', 'Posted'].includes(st)) {
          return no(`สถานะ ${st} อัปโหลดแทนไม่ได้`)
        }
        return yes('UPLOAD_NEW')
      }

      if (act === 'upload') return no('อัปโหลดเอกสารใหม่ทำโดย End User')
      if (['Sent', 'Posted', 'Rejected', 'Superseded'].includes(st)) {
        return no('เอกสารปิดหรืออยู่ระหว่าง Import')
      }
      if (pendingBind(d)) {
        return no(`รอผูกบัญชี: IT Admin ต้องผูก Oracle account ${d.receiver} ก่อน (มีรหัสที่ Receiver ต้องแก้)`)
      }
      if (act === 'unconfirm') {
        return st === 'Confirmed' ? yes('UNCONFIRM') : no('ใช้กับ Confirmed เท่านั้น')
      }
      if (act === 'returnf') {
        return st === 'Import Failed' ? yes('RETURN_FAILED') : no('ใช้กับ Import Failed เท่านั้น')
      }
      if (['Confirmed', 'Import Failed'].includes(st)) {
        return no('ดำเนินการที่หน้า AP Interface')
      }
      if (st === 'Manual Review') {
        if (d.unres && act === 'reject') return yes('REJECT')
        if (act === 'confirm') {
          if (!d.rcv || d.rcv === '—') return no('ยังไม่พบใบรับ')
          if (hasHighSeverity(d)) return no('มีรหัส High')
          return yes('MANUAL_REVIEW')
        }
        if (act === 'reject') return yes('MANUAL_REVIEW')
        return no('Manual Review: Confirm / Reject เท่านั้น')
      }
      if (st === 'Duplicate') {
        if (act === 'confirm') return yes('DUP_OVERRIDE')
        if (act === 'reject') return yes('REJECT')
        return no('Duplicate: Confirm (APR) / Reject เท่านั้น')
      }
      if (st === 'Hold' && noRcv) {
        if (act === 'reject') return yes('REJECT')
        return no('ไม่มี Receiver: Reject เท่านั้น')
      }
      if (act === 'confirm') {
        if (isEuPending(d)) return no('รอ End User แก้ไข (มีรหัสของผู้ใช้งานค้าง)')
        return yes('CONFIRM')
      }
      if (act === 'review') {
        if (st === 'Review') return no('อยู่ใน Review แล้ว')
        return yes('REVIEW')
      }
      if (act === 'hold') {
        if (st === 'Hold') return no('อยู่ใน Hold แล้ว')
        return yes('HOLD')
      }
      if (act === 'reject') return yes('REJECT')
      return no('ไม่รองรับ')
    },
    [currentUser.role, can, pendingBind, hasHighSeverity, isEuPending]
  )

  // Execute workflow action
  const executeAction = useCallback(
    (
      docId: string,
      action: ActionType,
      reason: string,
      note: string,
      simOutcome = 'Auto-pass',
      uploadFile = 'revision.pdf'
    ): { ok: boolean; msg: string } => {
      const doc = docs.find(d => d.doc === docId)
      if (!doc) return { ok: false, msg: 'ไม่พบเอกสาร' }

      const chk = allowedAction(doc, action)
      if (!chk.ok) return { ok: false, msg: chk.why || 'ไม่มีสิทธิ์' }

      const nowTime = new Date().toTimeString().slice(0, 8)
      const who = `${currentUser.n} (${ROLES[currentUser.role].n})`
      const fromStatus = doc.status

      if (action === 'upload') {
        // Create revision doc per DR-01..07
        const revCount = docs.filter(x => x.doc.startsWith(doc.doc.replace(/-R\d+$/, ''))).length
        const newDocId = `${doc.doc.replace(/-R\d+$/, '')}-R${revCount}`
        const n: InvoiceDoc = JSON.parse(JSON.stringify(doc))
        n.doc = newDocId
        n.round = (doc.round || 1) + 1
        n.status = simOutcome as any
        n.history = []
        n.supersedes = undefined
        n.supersededBy = undefined
        n.duplicate_of = undefined
        n.dup = undefined
        n.supRule = undefined
        n.dupRule = undefined
        n.confirmedBy = undefined
        n.up = TODAY

        if (simOutcome === 'Auto-pass') {
          n.rules.forEach(r => {
            if (r.status !== 'PASS') {
              r.status = 'PASS'
              r.result = 'pass'
              r.exception_code = undefined
              r.severity = undefined
              r.detail = 'ฉบับแก้ไข'
            }
          })
          n.codes = []
          n.sig = [1, 1]
        } else if (simOutcome === 'Review') {
          n.rules.forEach(r => {
            if (r.status === 'FAIL' && r.severity === 'High') {
              r.status = 'PASS'
              r.result = 'pass'
              r.exception_code = undefined
              r.severity = undefined
            }
          })
          n.codes = n.rules.filter(r => r.status === 'FAIL').map(r => r.exception_code!).filter(Boolean)
          if (!n.codes.length) {
            const r = n.rules.find(x => x.rule === 'V-08')
            if (r) {
              r.status = 'FAIL'
              r.result = 'fail'
              r.exception_code = 'E15'
              r.severity = 'Medium'
              r.detail = 'จำนวนน้อยกว่าใบรับ (จำลอง)'
              n.codes = ['E15']
            }
          }
        } else if (simOutcome === 'Hold') {
          if (!hasHighSeverity(n)) {
            const r = n.rules.find(x => x.rule === 'V-06')
            if (r) {
              r.status = 'FAIL'
              r.result = 'fail'
              r.exception_code = 'E08'
              r.severity = 'High'
              r.detail = 'ไม่พบลายเซ็นผู้รับของ (จำลอง)'
              n.sig = [1, 0]
              n.codes = Array.from(new Set([...n.codes, 'E08']))
            }
          }
        }

        n.assigned =
          !n.receiver || !n.receiverActive || ['Manual Review', 'Auto-pass'].includes(simOutcome)
            ? 'acc'
            : n.codes.some(c => EU_CODES.has(c))
            ? 'eu'
            : 'acc'

        // Apply DR duplicate / superseding rules
        let rule = ''
        let oldTo: string | null = null
        let newTo = simOutcome

        if (['Rejected', 'Superseded', 'Duplicate'].includes(fromStatus)) {
          rule = `DR-05 ไม่ใช้ฉบับเดิม (${fromStatus}) เป็นคู่เทียบ`
        } else if (['Confirmed', 'Sent', 'Posted', 'Import Failed'].includes(fromStatus)) {
          rule = `DR-04 ฉบับเดิม ${fromStatus} → ฉบับใหม่ Duplicate`
          newTo = 'Duplicate'
        } else {
          const rankNew = RANK[simOutcome] || 9
          const rankOld = RANK[fromStatus] || 9
          const cmp = rankNew < rankOld ? 'ดีกว่า' : rankNew === rankOld ? 'เท่าเดิม' : 'แย่กว่า'
          if (cmp === 'แย่กว่า') {
            rule = `DR-03 ฉบับใหม่แย่กว่า (${simOutcome} vs ${fromStatus}) → ฉบับใหม่ Duplicate`
            newTo = 'Duplicate'
          } else {
            rule = `${cmp === 'ดีกว่า' ? 'DR-01' : 'DR-02'} ฉบับใหม่${cmp} (${simOutcome} vs ${fromStatus}) → ฉบับเดิม Superseded`
            oldTo = 'Superseded'
          }
        }

        n.status = newTo as any
        n.history.push(
          {
            dt: TODAY,
            t: nowTime,
            who: currentUser.n,
            act: 'อัปโหลดเอกสารใหม่',
            d: `${who} · ${reason}${note ? ' · ' + note : ''} · ไฟล์ ${uploadFile}`,
            k: 'h'
          },
          { dt: TODAY, t: nowTime, who: 'ระบบ AIVA', act: 'AIVA ตรวจรอบที่ 1', d: `ผลตรวจ ${simOutcome}`, k: 's' }
        )

        if (newTo === 'Duplicate') {
          n.duplicate_of = doc.doc
          n.dupRule = rule
          n.dup = doc.doc
          n.assigned = 'acc'
          n.history.push({ dt: TODAY, t: nowTime, who: 'Portal', act: 'Portal ตรวจเอกสารซ้ำ', d: rule, k: 'c' })
        }

        const updatedDocs = docs.map(d => {
          if (d.doc === doc.doc && oldTo) {
            return {
              ...d,
              status: 'Superseded' as InvoiceStatus,
              supersededBy: n.doc,
              supRule: rule,
              history: [
                ...d.history,
                { dt: TODAY, t: nowTime, who: 'Portal', act: 'Superseded', d: `${rule} · ฉบับใหม่ ${n.doc}`, k: 'c' }
              ]
            }
          }
          return d
        })

        if (oldTo) {
          n.supersedes = doc.doc
          n.supRule = rule
          n.history.push({
            dt: TODAY,
            t: nowTime,
            who: 'Portal',
            act: 'แทนที่ฉบับเดิม',
            d: `${rule} · ฉบับเดิม ${doc.doc}`,
            k: 'g'
          })
        }

        setDocs([n, ...updatedDocs])
        setSelectedDocId(n.doc)
        logAudit('อัปโหลดเอกสารใหม่', n.doc, rule)
        toast(`อัปโหลดแล้ว · ${rule}`)
        return { ok: true, msg: `อัปโหลดแล้ว · ${rule}` }
      }

      // Normal state transitions
      let newStatus: InvoiceStatus = doc.status
      let msg = ''
      let k = 'h'

      if (action === 'confirm') {
        newStatus = 'Confirmed'
        k = 'g'
        msg = 'Confirmed · ย้ายไปหน้า AP Interface'
      } else if (action === 'review' || action === 'unconfirm' || action === 'returnf') {
        newStatus = 'Review'
        msg = 'ย้ายเป็น Review แล้ว'
      } else if (action === 'hold') {
        newStatus = 'Hold'
        k = 'c'
        msg = 'Hold แล้ว'
      } else if (action === 'reject') {
        newStatus = 'Rejected'
        k = 'c'
        msg = 'Reject แล้ว'
      }

      setDocs(prev =>
        prev.map(d => {
          if (d.doc !== docId) return d
          const updatedHist = [
            ...d.history,
            {
              dt: TODAY,
              t: nowTime,
              who: currentUser.n,
              act: `${ACTION_CONFIG[action].title} (${fromStatus} → ${newStatus})`,
              d: `${who} · ${reason}${note ? ' · ' + note : ''}`,
              k,
              rs: reason,
              nt: note
            }
          ]
          return {
            ...d,
            status: newStatus,
            confirmedBy: action === 'confirm' ? currentUser.id : action === 'unconfirm' ? null : d.confirmedBy,
            confirmedAt: action === 'confirm' ? TODAY : d.confirmedAt,
            batch: action === 'returnf' || action === 'unconfirm' ? null : d.batch,
            apErr: action === 'returnf' ? null : d.apErr,
            history: updatedHist
          }
        })
      )

      logAudit(ACTION_CONFIG[action].title, doc.doc, `${fromStatus} → ${newStatus} · ${reason}`)
      toast(msg)
      return { ok: true, msg }
    },
    [docs, allowedAction, currentUser, hasHighSeverity, logAudit, toast]
  )

  // AP Precheck
  const precheckPost = useCallback(
    (d: InvoiceDoc): { ok: boolean; code?: string; why: string } => {
      if ((d as any).dupAtPost) {
        return { ok: false, code: 'dup', why: `Portal พบเอกสารซ้ำ: ${(d as any).dupAtPost}` }
      }
      if (d.confirmedBy === currentUser.id) {
        return { ok: false, code: 'sod', why: 'ผู้ส่งเป็นผู้ยืนยันเอกสารนี้ (ผู้ยืนยัน ≠ ผู้ส่ง)' }
      }
      const lim = currentRole.postMax
      if (lim && d.total > lim) {
        return {
          ok: false,
          code: 'lim',
          why: `ยอด ${d.total.toLocaleString()} เกินวงเงินตั้งหนี้ ${lim.toLocaleString()}`
        }
      }
      return { ok: true, why: 'พร้อมส่ง' }
    },
    [currentUser.id, currentRole.postMax]
  )

  // AP Batch post
  const batchPost = useCallback(
    (docIds: string[]): { ok: boolean; count: number; msg: string } => {
      if (!can('POST')) return { ok: false, count: 0, msg: 'ไม่มีสิทธิ์ส่งเอกสารเข้า AP Interface' }

      const batchId = `AP-${TODAY.replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
      const nowTime = new Date().toTimeString().slice(0, 8)

      let count = 0
      setDocs(prev =>
        prev.map(d => {
          if (!docIds.includes(d.doc)) return d
          const chk = precheckPost(d)
          if (!chk.ok) return d
          count++
          return {
            ...d,
            status: 'Sent' as InvoiceStatus,
            batch: batchId,
            history: [
              ...d.history,
              {
                dt: TODAY,
                t: nowTime,
                who: currentUser.n,
                act: `ส่งเข้า AP Interface (${batchId})`,
                d: `ส่งโดย ${currentUser.n} (หัวหน้าฝ่ายบัญชี)`,
                k: 'g'
              }
            ]
          }
        })
      )

      logAudit('ส่งเข้า AP Interface', `${count} ฉบับ`, `Batch ${batchId}`)
      toast(`ส่งเข้า AP Interface แล้ว ${count} ฉบับ (${batchId})`)
      return { ok: true, count, msg: `ส่ง ${count} ฉบับสำเร็จ (${batchId})` }
    },
    [can, precheckPost, currentUser.n, logAudit, toast]
  )

  return (
    <InvoiceContext.Provider
      value={{
        docs,
        selectedDocId,
        selectedDoc,
        selectDoc,
        visibleDocs,
        filteredDocs,
        companyFilter,
        toggleCompanyFilter,
        setAllCompanies,
        statusFilter,
        setStatusFilter,
        periodFilter,
        setPeriodFilter,
        showClosed,
        toggleShowClosed,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        clearFilters,
        kpiCounts,
        staleDocs,
        activeDetailTab,
        setActiveDetailTab,
        isEvidenceDockOpen,
        openEvidenceDock,
        closeEvidenceDock,
        evidenceDockFocus,
        allowedAction,
        hasHighSeverity,
        isEuPending,
        pendingBind,
        executeAction,
        precheckPost,
        batchPost
      }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

export function useInvoices() {
  const ctx = useContext(InvoiceContext)
  if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider')
  return ctx
}
