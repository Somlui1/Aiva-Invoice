export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { printServiceHealthReport } = await import('./lib/serviceHealth')
    await printServiceHealthReport().catch((err) => {
      console.warn('[AIVA Preflight] Health check error:', err)
    })
  }
}
