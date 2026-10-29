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
} from './routes/governance'
import { prisma } from '../src/lib/prisma'
import { eventsHandler } from '../src/server/events'
import { corsOrigins, isProduction, simulationEnabled } from '../src/server/auth/config'
import { requireAuth, requireIntegrationKey, requireKeyOrAuth, requirePerm } from '../src/server/auth/guards'

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
  // Same-origin SPA: no CORS needed. Other origins only when listed in CORS_ORIGINS.
  const origins = corsOrigins()
  if (origins.length) app.use(cors({ origin: origins, credentials: true }))
  else if (!isProduction()) app.use(cors({ origin: true, credentials: true }))
  app.use(cookieParser())
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))
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

  // Health: liveness for the container / monitoring. Counts only outside production.
  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
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
        details,
      })
    } catch (err: any) {
      res.status(503).json({ ok: false, error: isProduction() ? 'database unavailable' : err.message })
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
