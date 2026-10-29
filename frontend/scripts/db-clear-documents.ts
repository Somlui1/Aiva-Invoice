/**
 * v5.12 — "ล้างเฉพาะเอกสาร": empty the document side of the database, keep users and rights.
 *
 *   npm run db:clear-docs -- --yes                    # local (DATABASE_URL from .env)
 *   docker compose exec portal npm run db:clear-docs -- --yes     # the Docker database
 *   … -- --yes --keep-audit                           # keep the audit lines of the removed documents
 *
 * Removed: Document (+ ValidationRun, DocumentBBox by cascade), ApBatch, and the audit lines that
 * belong to documents. Kept: User, UserCompany, UserReceiverMap, user-management / sign-in / master-
 * data audit lines. Signed-in users stay signed in. A copy of the SQLite file is written to
 * <db folder>/backups/ first (newest 10 kept); restore = stop the app, copy the backup over the file.
 */
import fs from 'node:fs'
import path from 'node:path'
import { backupPathFor, checkClearAllowed } from '../src/server/dbReset'

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile()
  } catch {}
}

const KEPT_AUDIT_IDS = ['USER_MANAGEMENT', 'MASTER_DATA', 'AUTH', 'MAINTENANCE']

async function main() {
  const cwd = process.cwd()
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
  const yes = process.argv.includes('--yes') || process.env.npm_config_yes === 'true'
  const check = checkClearAllowed({
    databaseUrl,
    cwd,
    yes,
    production: process.env.NODE_ENV === 'production',
  })
  if (!check.ok) {
    console.error(`[db:clear-docs] refused: ${check.reason}`)
    process.exit(2)
  }
  const keepAudit = process.argv.includes('--keep-audit')

  if (fs.existsSync(check.file)) {
    const backup = backupPathFor(check.file)
    fs.mkdirSync(path.dirname(backup), { recursive: true })
    fs.copyFileSync(check.file, backup)
    console.log(`[db:clear-docs] backup  ${backup}`)
    const dir = path.dirname(backup)
    const stem = path.basename(check.file, '.db') + '-'
    for (const f of fs.readdirSync(dir).filter(f => f.startsWith(stem) && f.endsWith('.db')).sort().reverse().slice(10)) {
      fs.rmSync(path.join(dir, f))
    }
  }

  const { prisma } = await import('../src/lib/prisma')
  const result = await prisma.$transaction(async (tx: any) => {
    const docs = await tx.document.deleteMany({})
    const batches = await tx.apBatch.deleteMany({})
    const audits = keepAudit ? { count: 0 } : await tx.auditLog.deleteMany({ where: { docId: { notIn: KEPT_AUDIT_IDS } } })
    await tx.auditLog.create({
      data: {
        docId: 'MAINTENANCE',
        who: 'db:clear-docs',
        role: 'SYSTEM',
        act: 'ล้างเฉพาะเอกสาร',
        action: 'CLEAR_DOCUMENTS',
        detail: `ลบเอกสาร ${docs.count} · AP batch ${batches.count} · audit ${audits.count} · เก็บผู้ใช้และสิทธิ์ไว้`,
      },
    })
    return { docs: docs.count, batches: batches.count, audits: audits.count }
  })
  console.log(
    `[db:clear-docs] removed documents=${result.docs} batches=${result.batches} audit=${result.audits} · kept users=${await prisma.user.count()}`,
  )
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('[db:clear-docs] failed:', err)
  process.exit(1)
})
