if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile()
  } catch {}
}

import { createExpressApp, pingDatabase } from './app'
import { ensureProductionSampleData } from '../src/lib/autoSeedSample'
import { printServiceHealthReport } from '../src/lib/serviceHealth'
import { loadCompanyMaster } from '../src/server/companyMaster'
import { isProduction, productionConfigProblems } from '../src/server/auth/config'
import { installConsoleTimestamps, log, errText, stamp } from '../src/server/log'
import { dbKindOf, instanceIdOf } from '../src/server/runtime'
import { startWatchdog } from '../src/server/watchdog'
import { prisma } from '../src/lib/prisma'

// v5.16: every terminal line carries date + time (LOG_TZ), including the existing console.* calls
installConsoleTimestamps()

// v5.16: never die silently — log, then exit so Docker (restart: always) starts a clean process
process.on('unhandledRejection', (reason) => {
  log.error('fatal', `unhandledRejection · ${errText(reason)}`)
  process.exit(1)
})
process.on('uncaughtException', (err) => {
  log.error('fatal', `uncaughtException · ${errText(err)}`)
  process.exit(1)
})

/** SQLite: WAL lets the queue read while an ingest writes (fewer "database is locked"). SQLITE_WAL=false to skip. */
async function tuneSqlite() {
  if (dbKindOf() !== 'sqlite' || String(process.env.SQLITE_WAL ?? 'true').toLowerCase() === 'false') return
  try {
    const rows: any = await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;')
    const mode = Array.isArray(rows) && rows[0] ? Object.values(rows[0])[0] : '?'
    log.info('db', `sqlite journal_mode=${mode}`)
  } catch (e) {
    log.warn('db', `sqlite WAL not enabled: ${errText(e)}`)
  }
}

async function start() {
  console.log('[Adapter Server] Bootstrapping background adapter service...')
  log.info('boot', `instance ${instanceIdOf()} · db ${dbKindOf()} · TZ ${process.env.TZ || '(system)'} · now ${stamp()} · LOG_LEVEL ${process.env.LOG_LEVEL || 'info'}`)

  // Production fails closed: no demo secret, no plain LDAP, no open ingest, no fake PDFs.
  if (isProduction()) {
    const problems = productionConfigProblems()
    if (problems.length) {
      console.error('[Adapter Server] Refusing to start — production configuration is incomplete:')
      for (const p of problems) console.error(`  - ${p}`)
      process.exit(1)
    }
  }

  // Development only (see sampleSeedEnabled): sample invoices into an empty database.
  await ensureProductionSampleData().catch((err) => {
    console.warn('[Adapter Server] Auto-seed warning:', err)
  })

  // Print preflight health check report
  await printServiceHealthReport().catch((err) => {
    console.warn('[Adapter Server] Health check warning:', err)
  })

  // v5.13: synced company master (table Company) → company matching for Engine ingest / receipts
  const companies = await loadCompanyMaster().catch(err => {
    console.warn('[Adapter Server] Company master warning:', err)
    return 0
  })
  console.log(`[Adapter Server] Company master: ${companies ? `${companies} synced companies` : 'built-in list'}`)

  await tuneSqlite()

  const app = createExpressApp()
  const PORT = process.env.PORT || (isProduction() ? 3000 : 3001)

  const server = app.listen(PORT, () => {
    console.log(`[Adapter Server] Ready on http://localhost:${PORT}`)
  })
  // Keep-alive longer than typical proxy idle timeouts; SSE streams are long-lived by design.
  server.keepAliveTimeout = 65_000
  server.headersTimeout = 66_000

  let stopping = false
  const shutdown = (why: string, code: number) => {
    if (stopping) return
    stopping = true
    log.warn('boot', `shutting down (${why})`)
    const force = setTimeout(() => process.exit(code), 10_000)
    force.unref()
    server.close(() => {
      prisma.$disconnect().finally(() => process.exit(code))
    })
    // SSE streams never end by themselves
    ;(server as any).closeAllConnections?.()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM', 0))
  process.on('SIGINT', () => shutdown('SIGINT', 0))

  startWatchdog(pingDatabase, (why) => {
    log.error('watchdog', `${why} → exiting so Docker restarts the Portal`)
    shutdown(`watchdog: ${why}`, 1)
  })
}

if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    console.error('[Adapter Server] Fatal startup error:', err)
    process.exit(1)
  })
}
