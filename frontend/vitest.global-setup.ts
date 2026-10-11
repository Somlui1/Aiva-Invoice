import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { TEST_DATABASE_URL } from './vitest.db-url'

/**
 * Runs once per vitest invocation, before any test worker starts.
 * Creates a fresh schema in the throwaway test DB (force-reset = empty tables),
 * so ingestion tests can assert exact row counts deterministically.
 */
export default function globalSetup(): void {
  const prismaCli = path.resolve('node_modules/prisma/build/index.js')
  execFileSync(process.execPath, [prismaCli, 'db', 'push', '--force-reset', '--skip-generate'], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  })
}
