import type { NextFunction, Request, Response } from 'express'
import { log, isDebug } from '../../src/server/log'
import { envInt } from '../../src/server/runtime'

/**
 * v5.16 — HTTP log that stays readable.
 *
 * Logged:   every write (POST/PUT/PATCH/DELETE) · every 4xx (WARN) / 5xx (ERROR) · GETs slower than
 *           LOG_SLOW_MS (WARN) · login / logout.
 * Skipped:  /api/health, /api/events (SSE), static files / SPA pages, fast successful GETs,
 *           routes that log themselves (res.locals.logged — e.g. /api/engine/ingest).
 * LOG_LEVEL=debug logs every /api request.
 */
const QUIET = /^\/api\/(health|events)(\/|$)/
const slowMs = () => envInt('LOG_SLOW_MS', 1500, 100)

export function requestLog(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl.split('?')[0]
  if (!path.startsWith('/api/') || (QUIET.test(path) && !isDebug())) return next()
  const t0 = process.hrtime.bigint()
  res.on('finish', () => {
    if (res.locals.logged) return
    const ms = Number((process.hrtime.bigint() - t0) / 1_000_000n)
    const st = res.statusCode
    const write = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS'
    const slow = ms >= slowMs()
    const who = req.sessionUser?.id ? ` · u=${req.sessionUser.id}` : ''
    const line = `${req.method} ${path} ${st} · ${ms}ms${who}`
    if (st >= 500) log.error('http', line)
    else if (st >= 400 && st !== 401) log.warn('http', line)
    else if (slow) log.warn('http', `${line} · slow`)
    else if (write) log.info('http', line)
    else log.debug('http', line)
  })
  next()
}
