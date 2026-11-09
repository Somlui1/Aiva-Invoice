import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { sessionMiddleware } from './middleware/session'
import { viewAsMiddleware } from '../src/server/viewAs'
import { errorHandler } from './middleware/errorHandler'
import { authRouter } from './routes/auth'
import { documentsRouter } from './routes/documents'
import { pdfProxyRouter } from './routes/pdfProxy'
import { engineIngestRouter } from './routes/engineIngest'
import { simulationIngestRouter } from './routes/simulationIngest'
import {
  usersRouter,
  adRouter,
  auditLogsRouter,
  apRouter,
  oracleRouter,
  companiesHandler,
} from './routes/governance'
import { prisma } from '../src/lib/prisma'
import { eventsHandler } from '../src/server/events'
import { corsOrigins, isProduction, simulationEnabled } from '../src/server/auth/config'
import { requireAuth, requireIntegrationKey, requireKeyOrAuth, requirePerm } from '../src/server/auth/guards'
import { requestLog } from './middleware/requestLog'
import { dbProbe, envInt, ingestRunningForMs, ingestStats, instanceIdOf, uptimeSec } from '../src/server/runtime'
import { openStreams } from '../src/server/events'

/** DB ping that cannot hang the healthcheck (a stuck query used to keep /api/health pending). */
export async function pingDatabase(timeoutMs = 3_000): Promise<void> {
  let t: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        t = setTimeout(() => reject(new Error(`database ping exceeded ${timeoutMs}ms`)), timeoutMs)
      }),
    ])
    dbProbe.lastOkAt = Date.now()
    dbProbe.consecutiveFails = 0
    dbProbe.lastError = ''
  } catch (e: any) {
    dbProbe.consecutiveFails++
    dbProbe.lastError = String(e?.message ?? e).slice(0, 200)
    throw e
  } finally {
    if (t) clearTimeout(t)
  }
}

/** Baseline security headers (no extra dependency). The reverse proxy adds HSTS. */
function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'same-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
}

const notFound = (_req: Request, res: Response) => res.status(404).json({ ok: false, error: 'Not found' })

export function createExpressApp(): Express {
  const app = express()
  app.disable('x-powered-by')
  // Behind the reverse proxy: trust its X-Forwarded-* so req.ip / req.secure are the client's.
  const trust = (process.env.TRUST_PROXY ?? '').trim()
  app.set('trust proxy', trust ? (/^\d+$/.test(trust) ? Number(trust) : trust) : isProduction() ? 1 : false)

  app.use(securityHeaders)
  app.use(requestLog) // v5.16: dated, filtered HTTP log (server/middleware/requestLog.ts)
  // Same-origin SPA: no CORS needed. Other origins only when listed in CORS_ORIGINS.
  const origins = corsOrigins()
  if (origins.length) app.use(cors({ origin: origins, credentials: true }))
  else if (!isProduction()) app.use(cors({ origin: true, credentials: true }))
  app.use(cookieParser())
  // v5.16: BODY_LIMIT (default 50mb) — a larger Engine payload is logged as 413 instead of vanishing
  const bodyLimit = process.env.BODY_LIMIT || '50mb'
  app.use(express.json({ limit: bodyLimit }))
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }))
  app.use(sessionMiddleware)
  // v5.10: SA "view as" — read-only, re-scopes req.sessionUser to the target (see src/server/viewAs.ts)
  app.use(viewAsMiddleware)

  // ---- API routes: every guard is visible here -------------------------------------------------
  //  public            /api/auth/*, /api/health
  //  signed in         documents, PDF, audit log (scoped by role inside)
  //  permission        users / AD / Oracle sync = MAP · AP batches = VIEW_AP (+ APR/ADM to send)
  //  machine key       /api/engine/ingest (ENGINE_INGEST_KEY) · AP callback (ORACLE_CALLBACK_KEY)
  app.use('/api/auth', authRouter)
  app.use('/api/documents', requireAuth, pdfProxyRouter)
  app.use('/api/documents', requireAuth, documentsRouter)
  app.use('/api/engine', requireIntegrationKey('engine'), engineIngestRouter)
  if (simulationEnabled()) {
    app.use('/api/ingest', requireKeyOrAuth('engine'), simulationIngestRouter)
    app.use('/api/v1/ingest', requireKeyOrAuth('engine'), simulationIngestRouter)
  } else {
    app.use(['/api/ingest', '/api/v1/ingest'], notFound)
  }
  app.use('/api/users', requirePerm('MAP'), usersRouter)
  app.use('/api/ad', requirePerm('MAP'), adRouter)
  app.use('/api/audit-logs', requireAuth, auditLogsRouter)
  // v5.12: real-time document events (SSE), scoped per user
  app.get('/api/events', requireAuth, eventsHandler)
  app.use('/api/ap', apRouter) // per-route guards inside (VIEW_AP / session / Oracle key)
  app.use('/api/oracle', requirePerm('MAP'), oracleRouter)
  // v5.13: active company master (names / Tax ID / ORG_ID) for every signed-in screen — no pending rows
  app.get('/api/companies', requireAuth, companiesHandler)

  // Health: liveness for the container / monitoring. Counts only outside production.
  // v5.16: also unhealthy (503) when the ingest pipeline is stuck — before, the Portal answered "ok"
  // while no Engine document could get in, so Docker never noticed.
  app.get('/api/health', async (_req, res) => {
    const ingest = {
      queued: ingestStats.queued,
      running_s: Math.round(ingestRunningForMs() / 1000),
      last_at: ingestStats.lastAt ? new Date(ingestStats.lastAt).toISOString() : null,
      last_result: ingestStats.lastResult || null,
    }
    const stuckSec = envInt('INGEST_STUCK_SEC', 120, 30)
    try {
      await pingDatabase()
      if (ingest.running_s > stuckSec) {
        return res.status(503).json({ ok: false, error: `ingest stuck for ${ingest.running_s}s`, instance: instanceIdOf(), ingest })
      }
      const details = isProduction()
        ? { database: 'connected' }
        : {
            documents: await prisma.document.count().catch(() => 0),
            users: await prisma.user.count().catch(() => 0),
            database: 'connected',
          }
      res.json({
        ok: true,
        service: 'AIVA Backend Adapter Service',
        mode: 'live',
        ruleset: 'v6.6',
        timestamp: new Date().toISOString(),
        instance: instanceIdOf(),
        uptime_s: Math.round(uptimeSec()),
        sse_streams: openStreams(),
        ingest,
        details,
      })
    } catch (err: any) {
      res.status(503).json({ ok: false, error: isProduction() ? 'database unavailable' : err.message, instance: instanceIdOf(), ingest })
    }
  })

  // In production: serve Vite static assets from dist/
  const distPath = path.resolve(__dirname, '../dist')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    // SPA fallback middleware
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        return res.sendFile(path.join(distPath, 'index.html'))
      }
      next()
    })
  }

  app.use(errorHandler)

  return app
}
