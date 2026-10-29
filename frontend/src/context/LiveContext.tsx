'use client'

/**
 * v5.12 — real-time queue (SSE /api/events) with a polling fallback.
 *
 * Nothing on screen changes by itself while someone is working: new / changed documents are COLLECTED
 * and announced (queue banner, sidebar marker); the user presses "โหลดรายการ" to apply them, and the
 * rows that arrived are highlighted for a few seconds. "บันทึกการเข้าถึง" subscribes and refreshes.
 * Only Import Failed interrupts — a toast for the approver (APR), who sends the batches.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useInvoices } from './InvoiceContext'
import { useToastModal } from './ToastModalContext'

export type LiveState = 'connecting' | 'live' | 'polling' | 'off'

export interface LiveDocEvent {
  kind: 'new' | 'updated' | 'status' | 'sent' | 'posted' | 'failed'
  docId: string
  status: string
  title: string
  detail?: string
  actorId?: string
  at?: string
}

interface LiveContextValue {
  state: LiveState
  /** Documents that arrived since the list was loaded. */
  pendingNew: string[]
  /** Documents already in the list whose status changed elsewhere. */
  pendingChanged: string[]
  /** Apply what was collected (re-reads the queue); resolves when done. */
  applyPending: () => Promise<void>
  dismissPending: () => void
  /** Rows to highlight right after applying (cleared after a few seconds). */
  freshIds: ReadonlySet<string>
  /** Called for every event the user may see (and for ADM/SA audit ticks). Returns unsubscribe. */
  subscribe: (cb: (e: LiveDocEvent | { kind: 'audit' }) => void) => () => void
}

const noop = () => {}
const LiveCtx = createContext<LiveContextValue>({
  state: 'off',
  pendingNew: [],
  pendingChanged: [],
  applyPending: async () => {},
  dismissPending: noop,
  freshIds: new Set(),
  subscribe: () => noop,
})

export const useLive = () => useContext(LiveCtx)

const POLL_MS = 60_000
const FRESH_MS = 8_000

export function LiveProvider({ children }: { children: ReactNode }) {
  const { realUser, isAuthenticated } = useAuth()
  const { docs, refreshQueue } = useInvoices()
  const { toast } = useToastModal()

  const [state, setState] = useState<LiveState>('off')
  const [pendingNew, setPendingNew] = useState<string[]>([])
  const [pendingChanged, setPendingChanged] = useState<string[]>([])
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(new Set())
  const listeners = useRef(new Set<(e: any) => void>())

  // The list on screen, for deciding "new" vs "changed" and for the polling diff.
  const known = useRef(new Map<string, string>())
  useEffect(() => {
    known.current = new Map(docs.map(d => [d.doc, d.status]))
  }, [docs])

  const toastRef = useRef(toast)
  toastRef.current = toast
  const roleRef = useRef(realUser.role)
  roleRef.current = realUser.role

  const collect = useCallback((ids: { id: string; isNew: boolean }[]) => {
    const add = (prev: string[], xs: string[]) => {
      const next = [...prev]
      for (const x of xs) if (!next.includes(x)) next.push(x)
      return next.length === prev.length ? prev : next
    }
    const n = ids.filter(i => i.isNew).map(i => i.id)
    const c = ids.filter(i => !i.isNew).map(i => i.id)
    if (n.length) setPendingNew(p => add(p, n))
    if (c.length) setPendingChanged(p => add(p, c))
  }, [])

  const handle = useCallback(
    (e: LiveDocEvent) => {
      for (const l of listeners.current) l(e)
      if (e.actorId && e.actorId === realUser.id) return // own action: already on screen
      collect([{ id: e.docId, isNew: !known.current.has(e.docId) }])
      if (e.kind === 'failed' && roleRef.current === 'APR') {
        toastRef.current(`${e.docId} · Import ไม่สำเร็จ · ${e.detail ?? ''}`, true)
      }
    },
    [collect, realUser.id],
  )

  // ---- SSE, with polling while it is down --------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return
    let alive = true
    let es: EventSource | null = null
    let poll: ReturnType<typeof setInterval> | null = null

    const pollOnce = async () => {
      try {
        const res = await fetch('/api/documents?limit=500')
        if (!res.ok) return
        const body = await res.json()
        if (!alive || !Array.isArray(body?.documents)) return
        const diff: { id: string; isNew: boolean }[] = []
        for (const d of body.documents as { doc: string; status: string }[]) {
          const was = known.current.get(d.doc)
          if (was === undefined) diff.push({ id: d.doc, isNew: true })
          else if (was !== d.status) diff.push({ id: d.doc, isNew: false })
        }
        if (diff.length) collect(diff)
        for (const l of listeners.current) l({ kind: 'audit' })
      } catch {
        /* offline: try again next round */
      }
    }
    const startPolling = () => {
      if (poll) return
      setState('polling')
      poll = setInterval(pollOnce, POLL_MS)
    }
    const stopPolling = () => {
      if (poll) clearInterval(poll)
      poll = null
    }

    if (typeof EventSource === 'undefined') {
      startPolling()
    } else {
      setState('connecting')
      es = new EventSource('/api/events', { withCredentials: true })
      es.addEventListener('ready', () => {
        if (!alive) return
        stopPolling()
        setState('live')
      })
      es.addEventListener('doc', ev => {
        try {
          handle(JSON.parse((ev as MessageEvent).data))
        } catch {}
      })
      es.addEventListener('audit', () => {
        for (const l of listeners.current) l({ kind: 'audit' })
      })
      // The browser reconnects by itself (retry: 5000); meanwhile poll so nothing is missed.
      es.onerror = () => {
        if (alive) startPolling()
      }
    }
    return () => {
      alive = false
      es?.close()
      stopPolling()
      setState('off')
    }
  }, [isAuthenticated, realUser.id, handle, collect])

  const freshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const applyPending = useCallback(async () => {
    const ids = [...pendingNew, ...pendingChanged]
    const ok = await refreshQueue()
    if (!ok) {
      toast('โหลดรายการไม่สำเร็จ · ลองอีกครั้ง', true)
      return
    }
    setPendingNew([])
    setPendingChanged([])
    setFreshIds(new Set(ids))
    if (freshTimer.current) clearTimeout(freshTimer.current)
    freshTimer.current = setTimeout(() => setFreshIds(new Set()), FRESH_MS)
  }, [pendingNew, pendingChanged, refreshQueue, toast])

  const dismissPending = useCallback(() => {
    setPendingNew([])
    setPendingChanged([])
  }, [])

  const subscribe = useCallback((cb: (e: any) => void) => {
    listeners.current.add(cb)
    return () => {
      listeners.current.delete(cb)
    }
  }, [])

  const value = useMemo(
    () => ({ state, pendingNew, pendingChanged, applyPending, dismissPending, freshIds, subscribe }),
    [state, pendingNew, pendingChanged, applyPending, dismissPending, freshIds, subscribe],
  )
  return <LiveCtx.Provider value={value}>{children}</LiveCtx.Provider>
}
