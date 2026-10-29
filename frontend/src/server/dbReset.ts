import path from 'node:path'
import { resolveDatasourceUrl } from '../lib/prismaUrl'

/**
 * Safety gate for `scripts/db-reset.ts` (pure, tested in src/test/dbReset.test.ts).
 *
 * A reset is allowed only when ALL hold:
 *  - NODE_ENV is not production;
 *  - the database is a SQLite file (production runs on SQL Server — a `sqlserver://` URL is refused,
 *    whatever else is set; production data is managed with backup/restore, never with this tool);
 *  - the file lives in <project>/prisma/ and is named dev.db, test.db, staging*.db or uat*.db;
 *  - the caller passed --yes.
 */
export type ResetCheck = { ok: true; file: string } | { ok: false; reason: string }

const ALLOWED_NAME = /^(dev|test|staging[\w-]*|uat[\w-]*|local[\w-]*)\.db$/i

export function checkResetAllowed(input: {
  nodeEnv?: string
  databaseUrl?: string
  cwd: string
  yes: boolean
}): ResetCheck {
  if ((input.nodeEnv ?? '').trim() === 'production') return { ok: false, reason: 'NODE_ENV=production — reset is never allowed here' }
  const url = resolveDatasourceUrl(input.databaseUrl, { cwd: input.cwd, production: false, exists: () => false })
  if (!url) return { ok: false, reason: 'DATABASE_URL is not set' }
  if (!url.startsWith('file:')) return { ok: false, reason: `not a SQLite file (${url.split(':')[0]}://…) — use backup/restore for server databases` }
  const file = path.resolve(url.slice('file:'.length))
  const prismaDir = path.resolve(input.cwd, 'prisma')
  if (path.dirname(file) !== prismaDir) return { ok: false, reason: `${file} is not inside ${prismaDir}` }
  if (!ALLOWED_NAME.test(path.basename(file))) {
    return { ok: false, reason: `${path.basename(file)} is not a resettable name (dev.db, test.db, staging*.db, uat*.db, local*.db)` }
  }
  if (!input.yes) return { ok: false, reason: 'add --yes to confirm (the database will be emptied; a backup is taken first)' }
  return { ok: true, file }
}

/**
 * v5.12 — gate for `scripts/db-clear-documents.ts` ("ล้างเฉพาะเอกสาร").
 *
 * Unlike the full reset this KEEPS users, companies, Oracle-account bindings and sign-in history, so
 * everyone can keep working; only documents, validation runs, boxes, AP batches (and, unless
 * --keep-audit, their audit lines) are removed. Therefore it is allowed in production (the Docker
 * database) — but only for a SQLite file (a backup copy is taken first) and only with --yes.
 */
export type ClearCheck = { ok: true; file: string } | { ok: false; reason: string }

export function checkClearAllowed(input: { databaseUrl?: string; cwd: string; yes: boolean; production: boolean }): ClearCheck {
  const url = resolveDatasourceUrl(input.databaseUrl, { cwd: input.cwd, production: input.production, exists: () => false })
  if (!url) return { ok: false, reason: 'DATABASE_URL is not set' }
  if (!url.startsWith('file:')) return { ok: false, reason: `not a SQLite file (${url.split(':')[0]}://…) — no file backup possible; use the database's own backup` }
  if (!input.yes) return { ok: false, reason: 'add --yes to confirm (documents will be removed; users and rights are kept; a backup is taken first)' }
  return { ok: true, file: path.resolve(url.slice('file:'.length)) }
}

/** prisma/backups/<name>-<yyyymmdd-hhmmss>.db */
export function backupPathFor(file: string, now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
  return path.join(path.dirname(file), 'backups', `${path.basename(file, '.db')}-${stamp}.db`)
}
