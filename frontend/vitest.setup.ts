import { TEST_DATABASE_URL } from './vitest.db-url'

/**
 * Runs inside every test worker before the test module is imported, so the
 * PrismaClient singleton in `src/lib/prisma` binds to the test DB instead of
 * `dev.db`. Verified: a real DATABASE_URL env var takes precedence over the
 * value Prisma would otherwise read from `.env`.
 */
process.env.DATABASE_URL = TEST_DATABASE_URL
