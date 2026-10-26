import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * SQLite URL for the throwaway test database: an ABSOLUTE path to prisma/test.db.
 *
 * It used to be the relative `file:./test.db`. The Prisma CLI reads that against `prisma/`, but
 * `src/lib/prisma.ts` resolved it against the working directory, did not find it, and fell back to
 * `prisma/dev.db` — so `vitest run` wrote test rows into the developer database. An absolute path
 * means both sides open the same file (and src/lib/prismaUrl.ts no longer falls back at all).
 */
const here = path.dirname(fileURLToPath(import.meta.url))
export const TEST_DATABASE_PATH = path.resolve(here, 'prisma', 'test.db')
export const TEST_DATABASE_URL = `file:${TEST_DATABASE_PATH.replace(/\\/g, '/')}`
