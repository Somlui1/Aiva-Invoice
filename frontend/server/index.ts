import { createExpressApp } from './app'
import { ensureProductionSampleData } from '../src/lib/autoSeedSample'
import { printServiceHealthReport } from '../src/lib/serviceHealth'

async function start() {
  console.log('[Adapter Server] Bootstrapping background adapter service...')

  // Auto seed on boot if empty
  await ensureProductionSampleData().catch((err) => {
    console.warn('[Adapter Server] Auto-seed warning:', err)
  })

  // Print preflight health check report
  await printServiceHealthReport().catch((err) => {
    console.warn('[Adapter Server] Health check warning:', err)
  })

  const app = createExpressApp()
  const isProd = process.env.NODE_ENV === 'production'
  const PORT = process.env.PORT || (isProd ? 3000 : 3001)

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
