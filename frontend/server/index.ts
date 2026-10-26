import { createExpressApp } from './app'
import { ensureProductionSampleData } from '../src/lib/autoSeedSample'
import { printServiceHealthReport } from '../src/lib/serviceHealth'
import { isProduction, productionConfigProblems } from '../src/server/auth/config'

async function start() {
  console.log('[Adapter Server] Bootstrapping background adapter service...')

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

  const app = createExpressApp()
  const PORT = process.env.PORT || (isProduction() ? 3000 : 3001)

  app.listen(PORT, () => {
    console.log(`[Adapter Server] Ready on http://localhost:${PORT}`)
  })
}

if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    console.error('[Adapter Server] Fatal startup error:', err)
    process.exit(1)
  })
}
