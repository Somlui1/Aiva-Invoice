/**
 * Empty (and optionally re-seed) a LOCAL / STAGING SQLite database for testing.
 *
 *   npx tsx scripts/db-reset.ts --yes                                  # empty schema
 *   npx tsx scripts/db-reset.ts --yes --seed temp/paperless_invoices_v5    # + ingest an Engine result folder
 *   npx tsx scripts/db-reset.ts --yes --seed temp/paperless_invoices_v5_7 --admin wajeepradit.p
 *   DATABASE_URL=file:./staging.db npx tsx scripts/db-reset.ts --yes      # another allowed file
 *
 * (or `npm run db:reset -- --yes …` after adding the script line to package.json)
 *
 * Refuses: NODE_ENV=production, any non-SQLite URL (SQL Server), any file outside prisma/ or with a
 * name other than dev.db, test.db, staging-x.db, uat-x.db or local-x.db, and any run without --yes. Always copies the file
 * to prisma/backups/ first (the newest 10 are kept). Restore = copy a backup over the file.
 *
 * Seeding goes through the real ingest code (same as the Engine push), so documents look exactly as
 * they would in production.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { backupPathFor, checkResetAllowed } from '../src/server/dbReset'

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile()
  } catch {}
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main() {
  const cwd = process.cwd()
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
  const yes = process.argv.includes('--yes') || process.env.npm_config_yes === 'true'
  const check = checkResetAllowed({ nodeEnv: process.env.NODE_ENV, databaseUrl, cwd, yes })
  if (!check.ok) {
    console.error(`[db:reset] refused: ${check.reason}`)
    process.exit(2)
  }
  const file = check.file
  const seedDir = arg('--seed')
  const admin = arg('--admin')
  if (seedDir && !fs.existsSync(path.resolve(cwd, seedDir))) {
    console.error(`[db:reset] refused: seed folder ${seedDir} not found`)
    process.exit(2)
  }

  // 1. Backup (and keep the newest 10)
  if (fs.existsSync(file)) {
    const backup = backupPathFor(file)
    fs.mkdirSync(path.dirname(backup), { recursive: true })
    fs.copyFileSync(file, backup)
    console.log(`[db:reset] backup  ${path.relative(cwd, backup)}`)
    const dir = path.dirname(backup)
    const stem = path.basename(file, '.db') + '-'
    const old = fs.readdirSync(dir).filter(f => f.startsWith(stem) && f.endsWith('.db')).sort().reverse().slice(10)
    for (const f of old) fs.rmSync(path.join(dir, f))
  }

  // 2. Empty schema (same command the test suite uses)
  const url = `file:${file.replace(/\\/g, '/')}`
  const prismaCli = path.resolve(cwd, 'node_modules/prisma/build/index.js')
  execFileSync(process.execPath, [prismaCli, 'db', 'push', '--force-reset', '--skip-generate'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  })
  console.log(`[db:reset] emptied ${path.relative(cwd, file)}`)

  // 3. Optional seed through the real ingest path
  process.env.DATABASE_URL = url
  const { prisma } = await import('../src/lib/prisma')
  if (seedDir) {
    const { runIngestSimulation, formatReport } = await import('./simulate-engine-push')
    const stats = await runIngestSimulation({ dir: seedDir })
    console.log(formatReport(stats))
    if (stats.failed > 0) process.exitCode = 1
  }

  // 4. Optional first admin (so somebody can log in and grant the rest)
  if (admin) {
    const sam = admin.toLowerCase()
    await prisma.user.upsert({
      where: { email: `${sam}@aapico.com` },
      create: { id: sam, email: `${sam}@aapico.com`, name: sam, samAccount: sam, role: 'SA',
        companies: { create: ['AH', 'AHA', 'AHT', 'AHP', 'AM'].map(c => ({ companyCode: c })) } },
      update: { role: 'SA', isActive: true },
    })
    console.log(`[db:reset] admin   ${sam} (SA)`)
  }

  const byStatus = await prisma.document.groupBy({ by: ['status'], _count: { _all: true } }).catch(() => [])
  const summary = byStatus.map((g: any) => `${g.status}=${g._count._all}`).join(' · ') || 'no documents'
  console.log(`[db:reset] now     ${summary} · users=${await prisma.user.count()} · runs=${await prisma.validationRun.count()}`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('[db:reset] failed:', err)
  process.exit(1)
})
