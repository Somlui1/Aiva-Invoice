/**
 * Engine push simulator — `npm run seed:engine`
 *
 * Replays the 125 real Engine result payloads from `temp/paperless_invoices_v5/`
 * through the Portal's ingestion boundary, then prints a queue distribution that
 * can be compared against the Engine's own `summary.json`.
 *
 * Two transports:
 *  - default: calls the real route handler in-process. Same code path as
 *    production, no server required, deterministic.
 *  - `--http http://localhost:3000`: literal network POSTs to a running server.
 *
 * Pass `--reset` to clear Document/ValidationRun first, so a run is a true
 * cold-start measurement. Default is additive: an already-ingested payload
 * returns as an idempotent replay, which keeps re-runs safe.
 */
import fs from 'node:fs'
import path from 'node:path'
import { ingestEngineResult } from '../src/server/ingestEngineResult'

const DEFAULT_DIR = 'temp/paperless_invoices_v5'
/** Only real Engine results count; `summary.json` is the Engine's own index. */
const RESULT_FILE = /^DMS-.*_result\.json$/

export interface SimOptions {
  /** Corpus directory, relative to the frontend package root. */
  dir?: string
  /** Base URL of a running server. Omit to call the route handler in-process. */
  baseUrl?: string
  log?: (line: string) => void
}

export interface SimStats {
  /** JSON files inspected, including the index file. */
  scanned: number
  /** JSON files inspected but not treated as documents. */
  skipped: number
  skippedFiles: string[]
  /** Engine result payloads pushed. */
  files: number
  ingested: number
  replayed: number
  conflicted: number
  failed: number
  byStatus: Record<string, number>
  durationMs: number
  failures: { file: string; error: string }[]
}

interface IngestResponse {
  ok?: boolean
  result?: string
  idempotent_replay?: boolean
  status?: string
  error?: string
  errors?: string[]
}

export async function runIngestSimulation(opts: SimOptions = {}): Promise<SimStats> {
  const dir = path.resolve(process.cwd(), opts.dir ?? DEFAULT_DIR)
  const log = opts.log ?? (() => {})
  const baseUrl = opts.baseUrl?.replace(/\/$/, '')

  const stats: SimStats = {
    scanned: 0,
    skipped: 0,
    skippedFiles: [],
    files: 0,
    ingested: 0,
    replayed: 0,
    conflicted: 0,
    failed: 0,
    byStatus: {},
    durationMs: 0,
    failures: [],
  }

  if (!fs.existsSync(dir)) {
    stats.failures.push({ file: dir, error: 'corpus directory not found' })
    return stats
  }

  const entries = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  stats.scanned = entries.length

  // Fail fast on a wrong/unreachable URL: 125 identical failures tell you less
  // than one clear message, and a stale dev server can answer 200 for `/` while
  // returning an HTML error page for the route.
  if (baseUrl) {
    const probe = await preflight(baseUrl)
    if (probe) {
      stats.failed = 1
      stats.failures.push({ file: '(preflight)', error: probe })
      log(formatReport(stats))
      return stats
    }
  }

  const started = Date.now()
  for (const file of entries.sort()) {
    if (!RESULT_FILE.test(file)) {
      stats.skipped++
      stats.skippedFiles.push(file)
      continue
    }

    stats.files++
    const body = fs.readFileSync(path.join(dir, file), 'utf-8')

    try {
      let status: number
      let payload: IngestResponse | null = null
      let text: string = ''

      if (baseUrl) {
        const res = await fetch(`${baseUrl}/api/engine/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
        const resp = await readIngestResponse(res)
        status = resp.status
        payload = resp.payload
        text = resp.text
      } else {
        const res = await ingestEngineResult(JSON.parse(body))
        status = res.http
        payload = res
        text = JSON.stringify(res)
      }
      if (!payload) {
        stats.failed++
        stats.failures.push({ file, error: `HTTP ${status} non-JSON response: ${snip(text)}` })
        continue
      }

      if (status === 200 && payload.idempotent_replay) {
        stats.replayed++
      } else if (status === 200 && payload.ok) {
        stats.ingested++
        const s = payload.status ?? 'Unknown'
        stats.byStatus[s] = (stats.byStatus[s] || 0) + 1
      } else if (status === 409) {
        stats.conflicted++
        stats.failures.push({ file, error: `409 conflict: ${payload.error ?? ''}` })
      } else {
        stats.failed++
        const detail = payload.errors?.join('; ') ?? payload.error ?? `HTTP ${status}`
        stats.failures.push({ file, error: `${status} ${detail}` })
      }
    } catch (e) {
      stats.failed++
      stats.failures.push({ file, error: String(e instanceof Error ? e.message : e) })
    }
  }
  stats.durationMs = Date.now() - started

  log(formatReport(stats))
  return stats
}

export function formatReport(s: SimStats): string {
  const secs = (s.durationMs / 1000).toFixed(2)
  const perSec = s.durationMs > 0 ? ((s.files / s.durationMs) * 1000).toFixed(1) : 'n/a'
  const line = (k: string, v: string | number) => `  ${k.padEnd(22)}${v}`
  return [
    'Engine push simulation report',
    line('Scanned JSON', s.scanned),
    line('Skipped (index)', `${s.skipped} [${s.skippedFiles.join(', ')}]`),
    line('Documents pushed', s.files),
    line('Total ingested', s.ingested),
    line('Idempotent replays', s.replayed),
    line('Conflicts', s.conflicted),
    line('Failed', s.failed),
    '',
    'Queue distribution (ingested only)',
    line('Auto-pass', s.byStatus['Auto-pass'] ?? 0),
    line('Review', s.byStatus['Review'] ?? 0),
    line('Hold', s.byStatus['Hold'] ?? 0),
    line('Manual Review', s.byStatus['Manual Review'] ?? 0),
    '',
    line('Duration', `${secs}s (${perSec} doc/s)`),
    ...(s.failures.length
      ? ['', `First failures:`, ...s.failures.slice(0, 5).map(f => `  ${f.file}: ${f.error}`)]
      : []),
  ].join('\n')
}

/** Returns a problem description, or null when the endpoint looks usable. */
async function preflight(baseUrl: string): Promise<string | null> {
  const url = `${baseUrl}/api/engine/ingest`
  let res: Response
  try {
    res = await fetch(url, { method: 'GET' })
  } catch (e) {
    return `cannot reach ${url}: ${String(e instanceof Error ? e.message : e)}. Is the server running, and on this port?`
  }
  // A POST-only route answers GET with 405; 404 usually means a stale .next build.
  if (res.status === 405 || res.status === 200) return null
  const body = await res.text().catch(() => '')
  if (res.status === 404)
    return `${url} -> 404. The route is not compiled on this server (stale .next?); restart the dev server.`
  return `${url} -> unexpected HTTP ${res.status}: ${snip(body)}`
}

async function readIngestResponse(res: Response): Promise<{ status: number; payload: IngestResponse | null; text: string }> {
  const text = await res.text()
  try {
    return { status: res.status, payload: JSON.parse(text) as IngestResponse, text }
  } catch {
    return { status: res.status, payload: null, text }
  }
}

function snip(s: string): string {
  const oneLine = (s ?? '').replace(/\s+/g, ' ').trim()
  return oneLine.length > 120 ? oneLine.slice(0, 120) + '…' : oneLine
}

/** Wipe Portal tables so the next pass is a genuine cold start. */
async function resetTables(): Promise<void> {
  const { prisma } = await import('../src/lib/prisma')
  const runs = await prisma.validationRun.deleteMany()
  const docs = await prisma.document.deleteMany()
  console.log(`Reset: removed ${runs.count} validation runs, ${docs.count} documents`)
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const httpIdx = argv.indexOf('--http')
  const baseUrl = httpIdx >= 0 ? argv[httpIdx + 1] : undefined
  const dirIdx = argv.indexOf('--dir')
  const dir = dirIdx >= 0 ? argv[dirIdx + 1] : undefined

  if (argv.includes('--reset')) await resetTables()

  console.log(`Pushing ${dir ?? DEFAULT_DIR} -> ${baseUrl ? `HTTP ${baseUrl}` : 'in-process route handler'}`)
  const stats = await runIngestSimulation({ baseUrl, dir, log: console.log })

  // The judge is a separate module: the simulator must not grade its own work.
  const { verifyAgainstEngineSummary, reportVerification } = await import('./verify-against-engine-summary')
  const verdict = reportVerification(await verifyAgainstEngineSummary(dir), stats)

  if (stats.failed > 0 || stats.conflicted > 0 || !verdict) process.exitCode = 1
  await closeClient()
}

async function closeClient(): Promise<void> {
  try {
    const { prisma } = await import('../src/lib/prisma')
    await prisma.$disconnect()
  } catch {
    /* client may never have connected (pure HTTP mode) */
  }
}

if (process.argv[1] && path.resolve(process.argv[1]).includes('simulate-engine-push')) {
  main().catch(e => {
    console.error(e)
    process.exitCode = 1
  })
}
