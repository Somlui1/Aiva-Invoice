import type { Request, Response, NextFunction } from 'express'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Adapter Server Error]:', err)
  const status = err.status || err.statusCode || 500
  // Production: a 5xx never echoes internals (SQL, paths, stack) to the browser — the log has them.
  const hide = status >= 500 && process.env.NODE_ENV === 'production'
  res.status(status).json({
    ok: false,
    error: hide ? 'Internal Server Error' : err.message || 'Internal Server Error',
    issues: hide ? undefined : err.issues || undefined,
  })
}
