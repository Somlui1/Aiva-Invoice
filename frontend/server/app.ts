import express, { type Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import fs from 'node:fs'
import { sessionMiddleware } from './middleware/session'
import { errorHandler } from './middleware/errorHandler'
import { authRouter } from './routes/auth'
import { documentsRouter } from './routes/documents'
import { pdfProxyRouter } from './routes/pdfProxy'
import { engineIngestRouter } from './routes/engineIngest'
import { prisma } from '../src/lib/prisma'

export function createExpressApp(): Express {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(cookieParser())
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))
  app.use(sessionMiddleware)

  // API routes
  app.use('/api/auth', authRouter)
  app.use('/api/documents', pdfProxyRouter)
  app.use('/api/documents', documentsRouter)
  app.use('/api/engine', engineIngestRouter)

  // Preflight healthcheck
  app.get('/api/health', async (_req, res) => {
    try {
      const docCount = await prisma.document.count().catch(() => 0)
      const userCount = await prisma.user.count().catch(() => 0)
      res.json({
        ok: true,
        service: 'AIVA Backend Adapter Service',
        mode: 'live',
        ruleset: 'v6.6',
        timestamp: new Date().toISOString(),
        details: {
          documents: docCount,
          users: userCount,
          database: 'connected',
        },
      })
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message })
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
