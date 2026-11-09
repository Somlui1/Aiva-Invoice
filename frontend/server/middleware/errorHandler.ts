import type { Request, Response, NextFunction } from 'express'
import { log, errText, bytes } from '../../src/server/log'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500
  // v5.16: one dated line with the route; a too-large / broken JSON body (Engine payload!) says so plainly
  const path = req.originalUrl.split('?')[0]
  if (err?.type === 'entity.too.large') {
    log.error('http', `${req.method} ${path} 413 body too large (${bytes(Number(err.length))} > limit ${bytes(Number(err.limit))}) — raise BODY_LIMIT`)
  } else if (err?.type === 'entity.parse.failed') {
    log.warn('http', `${req.method} ${path} 400 invalid JSON body · ${errText(err)}`)
  } else if (status >= 500) {
    log.error('http', `${req.method} ${path} ${status} · ${errText(err)}`)
  } else {
    log.warn('http', `${req.method} ${path} ${status} · ${errText(err)}`)
  }
  res.locals.logged = true
  // Production: a 5xx never echoes internals (SQL, paths, stack) to the browser — the log has them.
  const hide = status >= 500 && process.env.NODE_ENV === 'production'
  res.status(status).json({
    ok: false,
    error: hide ? 'Internal Server Error' : err.message || 'Internal Server Error',
    issues: hide ? undefined : err.issues || undefined,
  })
}
