'use client'

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { InvoiceDoc, InvoiceStatus, EvidenceSelection, type Finding } from '../types/invoice'
import { focusForFinding, focusForPage, selectionForFinding, type EvidenceDockFocus } from '../features/evidence/focus'
import { INITIAL_DOCS } from '../mock/initialDocs'
import { EU_CODES, ACTION_CONFIG, ActionType } from '../mock/rules'
import { useAuth } from './AuthContext'
import { useSettings } from './SettingsContext'
import { useToastModal } from './ToastModalContext'
import { ROLES } from '../mock/users'
import { convertSystemAResultToInvoiceDoc } from '../lib/backendApi'
import { isClosedViewStatus } from '../lib/closedDocs'
import { PREVIEW_BLOCK_REASON } from '../lib/viewAs'
import {
  TODAY,
  OPEN_STATUSES,
  CLOSED_STATUSES,
  RANK,
  perRange,
  inPerOf,
  hasHighSeverity as queueHasHighSeverity,
  isEuPending as queueIsEuPending,
  pendingBind as queuePendingBind,
  filterDocsFor,
  kpiCountsFor,
  staleDocsFor,
  allowedActionFor,
  precheckPostFor,
  statusForAction,
  applyLiveDocs,
  inPerDoc,
  type PeriodFilter,
  type PeriodField,
} from '../lib/queueFilters'

export {
  TODAY,
  perRange,
  inPerOf,
  inPerDoc,
  type PeriodFilter,
  type PeriodField,
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
  receiverFilter: string | null
  setReceiverFilter: (rcv: string | null) => void
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
  /**
   * Legacy "open the dock on this page / rule". Kept for the toolbar button and existing callers;
   * the 3-state evidence button opens a *finding* (`openEvidence`).
   */
  openEvidenceDock: (page?: number, ruleId?: string) => void
  /**
   * Show one finding (evidence row) in the dock. With a box it turns to its page and lights box
   * `targetIdx`; without one it opens the dock but does NOT move the PDF — the dock explains why.
   */
  openEvidence: (finding: Finding, targetIdx?: number) => void
  closeEvidenceDock: () => void
  /**
   * Share of `.work` given to the PDF dock (0.30–0.50, default 0.40 = the
   * mockup's 60:40 split). `QueuePage` turns it into `--mc` / `--dc`.
   */
  dockSplitRatio: number
  setDockSplitRatio: (ratio: number) => void
  /** True while the dock is fetching/rasterising the PDF; drives the spinners. */
  isPdfLoading: boolean
  setIsPdfLoading: (loading: boolean) => void
  evidenceDockFocus: EvidenceDockFocus | null
  /**
   * Last box the analyst picked on the evidence surface — the reverse link of
   * `evidenceDockFocus`. The detail pane highlights the matching rule/row.
   */
  evidenceSelection: EvidenceSelection | null
  setEvidenceSelection: (selection: EvidenceSelection | null) => void
  allowedAction: (doc: InvoiceDoc, act: ActionType) => { ok: boolean; why?: string; perm?: string }
  /** v5.10: ask the closed-documents page to open a document (Ctrl K, links). */
  closedFocus: { id: string; nonce: number } | null
  focusClosedDoc: (id: string) => void
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
  ) => Promise<{ ok: boolean; msg: string }>
  precheckPost: (doc: InvoiceDoc) => { ok: boolean; code?: string; why: string }
  batchPost: (docIds: string[]) => Promise<{ ok: boolean; count: number; msg: string }>
  refreshQueue: () => Promise<boolean>
  ingestResultToQueue: (payload: any) => void
}

const InvoiceContext = createContext<InvoiceContextType | null>(null)

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, currentRole, can, scopeCheck, logAudit, isPreview } = useAuth()
  const { orgSettings } = useSettings()
  const { toast } = useToastModal()

  const [docs, setDocs] = useState<InvoiceDoc[]>(INITIAL_DOCS)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(INITIAL_DOCS[0]?.doc || null)
  const [companyFilter, setCompanyFilter] = useState<Set<string>>(new Set())
  const [receiverFilter, setReceiverFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>(currentUser.role === 'EU' ? 'mine' : 'all')
  const [periodFilter, setPeriodFilterState] = useState<PeriodFilter>({
    k: currentUser.role === 'EU' ? 'all' : orgSettings.period || 'month'
  })
  // v5.9: closed documents have their own page ("เอกสารที่ปิดแล้ว"); the queue never mixes them in.
  const [showClosed, setShowClosed] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<'table' | 'split'>('table')
  const [activeDetailTab, setActiveDetailTab] = useState<string>('sum')
  const [isEvidenceDockOpen, setIsEvidenceDockOpen] = useState<boolean>(false)
  const [dockSplitRatio, setDockSplitRatio] = useState<number>(0.4)
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false)
  const [evidenceDockFocus, setEvidenceDockFocus] = useState<EvidenceDockFocus | null>(null)
  // Strictly increasing, so two requests in the same millisecond still differ (the dock re-scrolls on change).
  const focusNonce = useRef(0)
  const nextNonce = useCallback(() => (focusNonce.current = Math.max(Date.now(), focusNonce.current + 1)), [])
  const [evidenceSelection, setEvidenceSelection] = useState<EvidenceSelection | null>(null)
  const [closedFocus, setClosedFocus] = useState<{ id: string; nonce: number } | null>(null)
  const focusClosedDoc = useCallback((id: string) => setClosedFocus({ id, nonce: Date.now() }), [])

  useEffect(() => {
    let active = true
    async function loadLiveQueue() {
      try {
        const res = await fetch('/api/documents?include=boxes')
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          if (active) {
            setDocs(prev => {
              const applied = applyLiveDocs({
                prevDocs: prev,
                liveDocs: [],
                selectedDocId,
                error: errData.error || `HTTP ${res.status}`,
              })
              return applied.docs
            })
          }
          return
        }
        const data = await res.json()
        if (active && data.ok && Array.isArray(data.documents)) {
          setSelectedDocId(prevSelected => {
            const applied = applyLiveDocs({
              prevDocs: [],
              liveDocs: data.documents,
              selectedDocId: prevSelected,
            })
            return applied.selectedDocId
          })
          setDocs(data.documents)
        }
      } catch (err: any) {
        if (active) {
          setDocs(prev => {
            const applied = applyLiveDocs({
              prevDocs: prev,
              liveDocs: [],
              selectedDocId,
              error: err?.message || 'Network error',
            })
            return applied.docs
          })
        }
      }
    }
    loadLiveQueue()
    return () => {
      active = false
    }
  }, [])

  const openEvidenceDock = useCallback((page = 1, ruleId?: string) => {
    setViewMode('split')
    setIsEvidenceDockOpen(true)
    setEvidenceDockFocus(focusForPage(page, ruleId, nextNonce()))
  }, [nextNonce])

  const openEvidence = useCallback((finding: Finding, targetIdx = 0) => {
    setViewMode('split')
    setIsEvidenceDockOpen(true)
    setEvidenceDockFocus(focusForFinding(finding, targetIdx, nextNonce()))
    // The reverse link (detail pane marks the card / row) is set in the same step, so a caller
    // cannot open a finding and forget to mark it.
    setEvidenceSelection(selectionForFinding(finding, targetIdx, 'pdf'))
  }, [nextNonce])

  const closeEvidenceDock = useCallback(() => {
    setIsEvidenceDockOpen(false)
    setEvidenceDockFocus(null)
    setEvidenceSelection(null)
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
    setReceiverFilter(null)
    setStatusFilter(currentUser.role === 'EU' ? 'mine' : 'all')
    setSearchQuery('')
    setPeriodFilterState(p => ({ k: 'all', field: p.field }))
  }, [currentUser.role])

  // Scope check visible docs
  const visibleDocs = useMemo(() => {
    return docs.filter(d => scopeCheck(d).ok)
  }, [docs, scopeCheck])

  const hasHighSeverity = useCallback((d: InvoiceDoc): boolean => queueHasHighSeverity(d), [])
  const isEuPending = useCallback((d: InvoiceDoc): boolean => queueIsEuPending(d), [])
  const pendingBind = useCallback((d: InvoiceDoc): boolean => queuePendingBind(d), [])

  // Stale docs outside period
  const staleDocs = useMemo(() => {
    return staleDocsFor({
      docs: visibleDocs,
      statusFilter,
      companyFilter,
      periodFilter,
      searchQuery,
      showClosed,
      role: currentUser.role,
    })
  }, [visibleDocs, statusFilter, companyFilter, periodFilter, searchQuery, showClosed, currentUser.role])

  // Filtered docs list
  const filteredDocs = useMemo(() => {
    const list = filterDocsFor({
      docs: visibleDocs,
      statusFilter,
      companyFilter,
      periodFilter,
      searchQuery,
      showClosed,
      role: currentUser.role,
    })
    // v5.9: closed documents live on their own page. A status card that names a closed status
    // explicitly (EU "Rejected"/"Superseded", APR "Duplicate" override) still lists those.
    const open = list.filter(d => !isClosedViewStatus(d.status) || statusFilter === d.status)
    if (currentUser.role === 'EU' && receiverFilter) {
      return open.filter(d => d.receiver === receiverFilter)
    }
    return open
  }, [visibleDocs, statusFilter, companyFilter, periodFilter, searchQuery, showClosed, currentUser.role, receiverFilter])

  // Selected doc
  const selectedDoc = useMemo(() => {
    if (!selectedDocId) return null
    return docs.find(d => d.doc === selectedDocId) || null
  }, [docs, selectedDocId])

  const selectedIdRef = useRef(selectedDocId)
  selectedIdRef.current = selectedDocId
  const selectDoc = useCallback((id: string | null) => {
    if (selectedIdRef.current !== id) {
      // v5.7: a finding / box picked on the previous document must not follow the user to the
      // next one (its ids do not exist there). The dock, if open, restarts on page 1.
      setEvidenceSelection(null)
      setEvidenceDockFocus(f => (f ? focusForPage(1, undefined, nextNonce()) : null))
    }
    setSelectedDocId(id)
  }, [nextNonce])

  // Dynamic KPI counts
  const kpiCounts = useMemo(() => {
    const docsToCount = currentUser.role === 'EU' && receiverFilter
      ? visibleDocs.filter(d => d.receiver === receiverFilter)
      : visibleDocs
    const input = { docs: docsToCount, statusFilter, companyFilter, periodFilter, searchQuery, showClosed, role: currentUser.role }
    // v5.10: cards count what the list can show — closed documents only on a card that names their
    // status (ACC/APR "ซ้ำ" / "ถูกแทนที่"), never inside "ทั้งหมด" / "ใบรับของฉัน".
    const counts = kpiCountsFor({ ...input, docs: docsToCount.filter(d => !isClosedViewStatus(d.status)) })
    const full = kpiCountsFor(input)
    for (const k of Object.keys(counts)) if (isClosedViewStatus(k)) counts[k] = full[k]
    return counts
  }, [visibleDocs, statusFilter, companyFilter, periodFilter, searchQuery, showClosed, currentUser.role, receiverFilter])

  // Allowed action calculation per SRS v1.1
  const allowedAction = useCallback(
    (d: InvoiceDoc, act: ActionType): { ok: boolean; why?: string; perm?: string } => {
      const r = allowedActionFor(d, act, { role: currentUser.role, can: p => can(p as any) })
      // v5.10: "view as" is read-only. The target's own answer is kept in the message, so the SA
      // still sees whether that user *could* do it — but nothing can be executed.
      if (isPreview) {
        return {
          ok: false,
          perm: r.perm,
          why: r.ok ? `${PREVIEW_BLOCK_REASON} · ผู้ใช้นี้ทำได้` : `${PREVIEW_BLOCK_REASON} · ผู้ใช้นี้ทำไม่ได้: ${r.why ?? 'ไม่มีสิทธิ์'}`,
        }
      }
      return r
    },
    [currentUser.role, can, isPreview]
  )

  // Execute workflow action
  const executeAction = useCallback(
    async (
      docId: string,
      action: ActionType,
      reason: string,
      note: string,
      simOutcome = 'Auto-pass',
      uploadFile = 'revision.pdf'
    ): Promise<{ ok: boolean; msg: string }> => {
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

        // Persist upload revision to server API
        try {
          fetch(`/api/documents/${encodeURIComponent(doc.doc)}/actions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser.id,
              'x-user-role': currentUser.role,
              'x-user-name': encodeURIComponent(currentUser.n),
            },
            body: JSON.stringify({
              action: 'upload_revision',
              reason: rule,
              simOutcome,
              uploadFile,
            }),
          }).catch(err => console.warn('Upload revision persistence error:', err))
        } catch (err) {
          console.warn('Upload revision request error:', err)
        }

        return { ok: true, msg: `อัปโหลดแล้ว · ${rule}` }
      }

      // Normal state transitions.
      // v5.11: the server decides first. Before, the UI changed the row optimistically and ignored the
      // server's answer, so a refused Confirm (422 / 409) still showed "Confirmed" until reload.
      // Only when the server cannot be reached at all (mock / offline demo) does the local rule apply.
      let serverStatus: InvoiceStatus | null = null
      try {
        const res = await fetch(`/api/documents/${encodeURIComponent(docId)}/actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
            'x-user-role': currentUser.role,
            'x-user-name': encodeURIComponent(currentUser.n),
          },
          body: JSON.stringify({ action, reason, note, simOutcome, uploadFile }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.ok === false) {
          const err = data?.error || `ดำเนินการไม่สำเร็จ (HTTP ${res.status})`
          toast(err, true)
          return { ok: false, msg: err }
        }
        if (typeof data?.toStatus === 'string') serverStatus = data.toStatus as InvoiceStatus
      } catch (err) {
        console.warn('Action persistence network error (applied locally only):', err)
      }

      const newStatus: InvoiceStatus = serverStatus ?? statusForAction(action) ?? doc.status
      let msg = ''
      let k = 'h'

      if (newStatus === 'Confirmed') {
        k = 'g'
        msg = 'Confirmed · ย้ายไปหน้า AP Interface'
      } else if (newStatus === 'Review') {
        msg = 'ย้ายเป็น Review แล้ว'
      } else if (newStatus === 'Hold') {
        k = 'c'
        msg = 'Hold แล้ว'
      } else if (newStatus === 'Rejected') {
        k = 'c'
        msg = 'Reject แล้ว'
      } else {
        msg = `${ACTION_CONFIG[action].title} แล้ว`
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
      return precheckPostFor(d, { userId: currentUser.id, postMax: currentRole?.postMax })
    },
    [currentUser.id, currentRole?.postMax]
  )

  // AP Batch post.
  // v5.11: the server is the authority — it may take documents out as Duplicate (receive_id guard),
  // and only the documents it actually sent become Sent here.
  const batchPost = useCallback(
    async (docIds: string[]): Promise<{ ok: boolean; count: number; msg: string }> => {
      if (!can('POST')) return { ok: false, count: 0, msg: 'ไม่มีสิทธิ์ส่งเอกสารเข้า AP Interface' }

      let batchId = `AP-${TODAY.replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
      const nowTime = new Date().toTimeString().slice(0, 8)
      const eligible = docIds.filter(id => {
        const d = docs.find(x => x.doc === id)
        return !!d && precheckPost(d).ok
      })
      if (!eligible.length) return { ok: false, count: 0, msg: 'ไม่มีเอกสารที่ผ่านการตรวจก่อนส่ง' }

      let sent = eligible
      let excluded: { id: string; duplicateOf: string; receiveId: string }[] = []
      try {
        const res = await fetch('/api/ap/batches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
            'x-user-role': currentUser.role,
            'x-user-name': encodeURIComponent(currentUser.n),
          },
          body: JSON.stringify({ batchId, documentIds: eligible }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.ok === false) {
          const err = data?.error || `ส่ง Batch ไม่สำเร็จ (HTTP ${res.status})`
          toast(err, true)
          return { ok: false, count: 0, msg: err }
        }
        if (Array.isArray(data?.documentIds)) sent = data.documentIds
        if (Array.isArray(data?.excluded)) excluded = data.excluded
        if (data?.batch?.id) batchId = data.batch.id
      } catch (err) {
        console.warn('AP batch persistence error (applied locally only):', err)
      }

      setDocs(prev =>
        prev.map(d => {
          if (sent.includes(d.doc)) {
            return {
              ...d,
              status: 'Sent' as InvoiceStatus,
              batch: batchId,
              history: [
                ...d.history,
                { dt: TODAY, t: nowTime, who: currentUser.n, act: `ส่งเข้า AP Interface (${batchId})`, d: `ส่งโดย ${currentUser.n} (หัวหน้าฝ่ายบัญชี)`, k: 'g' }
              ]
            }
          }
          const ex = excluded.find(e => e.id === d.doc)
          if (ex) {
            return {
              ...d,
              status: 'Duplicate' as InvoiceStatus,
              duplicate_of: ex.duplicateOf,
              dupRule: 'AP-GUARD',
              history: [
                ...d.history,
                { dt: TODAY, t: nowTime, who: 'ระบบ Portal', act: 'Duplicate (ตัดออกจาก Batch)', d: `ใบรับ ${ex.receiveId} ถูกใช้โดย ${ex.duplicateOf} แล้ว`, k: 'c' }
              ]
            }
          }
          return d
        })
      )

      const count = sent.length
      const exTxt = excluded.length ? ` · ตัดออก ${excluded.length} ฉบับ (ใบรับซ้ำ → Duplicate)` : ''
      if (count) logAudit('ส่งเข้า AP Interface', `${count} ฉบับ`, `Batch ${batchId}${exTxt}`)
      toast(count ? `ส่งเข้า AP Interface แล้ว ${count} ฉบับ (${batchId})${exTxt}` : `ไม่มีเอกสารถูกส่ง${exTxt}`, !count)
      return { ok: count > 0, count, msg: count ? `ส่ง ${count} ฉบับสำเร็จ (${batchId})${exTxt}` : `ไม่มีเอกสารถูกส่ง${exTxt}` }
    },
    [can, docs, precheckPost, currentUser.id, currentUser.role, currentUser.n, logAudit, toast]
  )

  /** Re-read the queue from the server (after a change the server decided, e.g. ผูกใบรับ). */
  const refreshQueue = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/documents?include=boxes')
      if (!res.ok) return false
      const data = await res.json()
      if (data?.ok && Array.isArray(data.documents)) {
        setDocs(data.documents)
        return true
      }
    } catch (err) {
      console.warn('Queue refresh failed:', err)
    }
    return false
  }, [])

  const ingestResultToQueue = useCallback(
    (payload: any) => {
      try {
        const newDoc = convertSystemAResultToInvoiceDoc(payload)
        setDocs(prev => [newDoc, ...prev.filter(d => d.doc !== newDoc.doc)])
        setSelectedDocId(newDoc.doc)
        toast(`นำเข้าเอกสาร ${newDoc.inv} จาก Engine สำเร็จ (${newDoc.status})`)
      } catch (e: any) {
        toast(`นำเข้าไม่สำเร็จ: ${e.message}`, true)
      }
    },
    [toast]
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
        receiverFilter,
        setReceiverFilter,
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
        openEvidence,
        closeEvidenceDock,
        dockSplitRatio,
        setDockSplitRatio,
        isPdfLoading,
        setIsPdfLoading,
        evidenceDockFocus,
        evidenceSelection,
        setEvidenceSelection,
        allowedAction,
        closedFocus,
        focusClosedDoc,
        hasHighSeverity,
        isEuPending,
        pendingBind,
        executeAction,
        precheckPost,
        batchPost,
        refreshQueue,
        ingestResultToQueue
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
