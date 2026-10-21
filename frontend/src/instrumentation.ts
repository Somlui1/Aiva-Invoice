export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on actual server runtime, not during static build compilation
    const isBuildPhase =
      process.env.npm_lifecycle_event === 'build' ||
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.argv.some(arg => typeof arg === 'string' && arg.includes('build'))

    if (isBuildPhase) {
      return
    }

    const { ensureProductionSampleData } = await import('./lib/autoSeedSample')
    await ensureProductionSampleData().catch((err) => {
      console.warn('[AIVA Bootstrap] Sample auto-seed error:', err)
    })

    const { printServiceHealthReport } = await import('./lib/serviceHealth')
    await printServiceHealthReport().catch((err) => {
      console.warn('[AIVA Preflight] Health check error:', err)
    })
  }
}
