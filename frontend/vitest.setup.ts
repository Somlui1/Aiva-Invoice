import { TEST_DATABASE_URL } from './vitest.db-url'

/**
 * Runs inside every test worker before the test module is imported, so the
 * PrismaClient singleton in `src/lib/prisma` binds to the test DB instead of
 * `dev.db`. Verified: a real DATABASE_URL env var takes precedence over the
 * value Prisma would otherwise read from `.env`.
 */
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = TEST_DATABASE_URL
// v5.5: sessions are HMAC-signed. A fixed secret keeps test cookies (src/test/helpers/session.ts) valid.
process.env.AUTH_SECRET = 'test-only-secret-0123456789abcdef0123456789abcdef'
// Machine keys stay unset in tests (= open outside production); securityGuards.test.ts sets them per test.
delete process.env.ENGINE_INGEST_KEY
delete process.env.ORACLE_CALLBACK_KEY
