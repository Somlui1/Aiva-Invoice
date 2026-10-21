import { printServiceHealthReport } from '../src/lib/serviceHealth'

async function main() {
  await printServiceHealthReport()
}

main().catch((err) => {
  console.error('Service check error:', err)
  process.exit(1)
})
