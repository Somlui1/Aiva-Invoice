/**
 * SQLite URL for the throwaway test database.
 *
 * Prisma resolves relative `file:` paths against `prisma/`, so this lands in
 * `prisma/test.db` (gitignored via `prisma/*.db`). Keeping tests off `dev.db`
 * means the ingestion harness in Task 5 and a developer's local data are never
 * disturbed by a test run, and every run starts from a known-empty schema.
 */
export const TEST_DATABASE_URL = 'file:./test.db'
