import type { Request, Response, NextFunction } from 'express'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Adapter Server Error]:', err)
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(status).json({
    ok: false,
    error: message,
    issues: err.issues || undefined,
  })
}
