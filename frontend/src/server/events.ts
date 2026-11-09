/**
 * v5.12 — real-time document events (Server-Sent Events), in process.
 *
 *   publishDocEvent(...)  ← ingest, document actions, ผูกใบรับ, AP batch, Oracle callback
 *   GET /api/events       → one SSE stream per open browser tab
 *
 * Every event goes ONLY to users who may see that document (the same `docVisibleTo` rule as the
 * API). ADM / SA also get a content-free `audit` tick so "บันทึกการเข้าถึง" can refresh for them.
 *
 * Limit: one Portal process. Running several containers needs a shared bus (e.g. Redis pub/sub)
 * behind `publishDocEvent` — the browser side would not change.
 */
import { EventEmitter } from 'node:events'
import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { docVisibleTo } from './viewAs'
import { log } from './log'

export type DocEventKind = 'new' | 'updated' | 'status' | 'sent' | 'posted' | 'failed'

export interface DocEvent {
  kind: DocEventKind
  docId: string
  status: string
  company: string
  receiver: string | null
  title: string
  detail?: string
  /** User who caused it — the browser of that user does not notify itself. */
  actorId?: string
  at?: string
  seq?: number
}

const bus = new EventEmitter()
bus.setMaxListeners(0)
let seq = 0
/** Streams that received the event being emitted (EventEmitter.emit is synchronous). */
let delivered = 0

/**
 * Returns how many open browser tabs were told about the event (v5.16, for the ingest log:
 * "live→0" means nobody who may see the document had the Portal open).
 */
export function publishDocEvent(e: DocEvent): number {
  delivered = 0
  try {
    bus.emit('doc', { ...e, at: new Date().toISOString(), seq: ++seq })
  } catch (err) {
    log.warn('events', `publish failed: ${String((err as Error)?.message ?? err)}`)
  }
  return delivered
}

/** For tests / health: how many streams are open. */
export const openStreams = () => bus.listenerCount('doc')

const pingMs = () => {
  const s = Number(process.env.EVENTS_PING_SEC ?? 25)
  return (Number.isFinite(s) && s >= 5 ? s : 25) * 1000
}

/** GET /api/events — mounted behind requireAuth. */
export function eventsHandler(req: Request, res: Response) {
  const user = req.sessionUser
  if (!user) return res.status(401).end()
  const role = String(user.role || '').toUpperCase()
  const seesAllAudit = role === 'ADM' || role === 'SA'

  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // nginx: do not buffer the stream
  res.flushHeaders?.()

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }
  send('ready', { at: new Date().toISOString(), retryMs: 5000 })
  res.write('retry: 5000\n\n')

  const onDoc = (e: DocEvent) => {
    try {
      if (docVisibleTo({ company: e.company, receiver: e.receiver }, user).ok) {
        send('doc', e)
        delivered++
      } else if (seesAllAudit) send('audit', { at: e.at, seq: e.seq })
    } catch {
      close() // a broken socket must not stop the other tabs from being notified
    }
  }
  bus.on('doc', onDoc)
  log.debug('events', `stream open · ${user.id} · ${openStreams()} open`)

  // Keep-alive, and drop the stream at once when the user was deactivated meanwhile.
  const timer = setInterval(async () => {
    try {
      res.write(`: ping\n\n`)
    } catch {
      return close()
    }
    try {
      const u = await prisma.user.findUnique({ where: { id: user.id }, select: { isActive: true } })
      if (u && u.isActive === false) close()
    } catch {
      /* database hiccup: keep the stream */
    }
  }, pingMs())

  let closed = false
  function close() {
    if (closed) return
    closed = true
    clearInterval(timer)
    bus.off('doc', onDoc)
    try {
      res.end()
    } catch {}
    log.debug('events', `stream closed · ${user?.id ?? 'anon'} · ${openStreams()} open`)
  }
  req.on('close', close)
}
