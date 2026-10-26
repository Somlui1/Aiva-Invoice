import fs from 'node:fs'
import path from 'node:path'

/**
 * Which database the Prisma client opens. Kept separate from `prisma.ts` so it can be tested.
 *
 * Rules (v5.5):
 *  1. A non-file URL (sqlserver://, postgresql://) is used as is — production on SQL Server.
 *  2. An absolute file URL (file:/abs, file:C:/abs) is used as is.
 *  3. A relative file URL is resolved like the Prisma CLI does: against the `prisma/` folder
 *     (`file:./test.db` = prisma/test.db). A cwd-relative file that already exists is still accepted
 *     (`file:./prisma/dev.db`), for old .env files.
 *  4. When DATABASE_URL is set we NEVER fall back to another file. Before v5.5, `file:./test.db` did not
 *     exist relative to cwd, so the test run silently opened prisma/dev.db and wrote into it.
 *  5. DATABASE_URL unset: development looks for prisma/dev.db; production returns undefined (Prisma
 *     then fails loudly instead of opening a stray file).
 */
export function resolveDatasourceUrl(
  envUrl: string | undefined,
  opts: { cwd?: string; production?: boolean; exists?: (p: string) => boolean } = {},
): string | undefined {
  const cwd = opts.cwd ?? process.cwd()
  const exists = opts.exists ?? fs.existsSync
  const url = (envUrl ?? '').trim()

  if (url) {
    if (!url.startsWith('file:')) return url
    const raw = url.slice('file:'.length)
    if (raw.startsWith('/') || /^[A-Za-z]:[\\/]/.test(raw)) return url
    const clean = raw.replace(/^\.\//, '')
    const viaPrismaDir = path.resolve(cwd, 'prisma', clean)
    const viaCwd = path.resolve(cwd, clean)
    if (!exists(viaPrismaDir) && exists(viaCwd)) return `file:${viaCwd}`
    return `file:${viaPrismaDir}`
  }

  if (opts.production) return undefined
  const candidates = [path.resolve(cwd, 'prisma/dev.db'), path.resolve(cwd, '../prisma/dev.db')]
  const found = candidates.find(c => exists(c))
  return found ? `file:${found}` : undefined
}
