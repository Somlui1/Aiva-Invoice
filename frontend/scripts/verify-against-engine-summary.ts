/**
 * Independent cross-check of the Portal database against the Engine's own
 * `summary.json`. Deliberately separate from the push simulator: the code that
 * produces a result must not also be the code that judges it.
 */
import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/lib/prisma'
import type { SimStats } from './simulate-engine-push'

const CORPUS = 'temp/paperless_invoices_v5'

const RECO_TO_STATUS: Record<string, string> = {
  AUTO_PASS: 'Auto-pass',
  REVIEW: 'Review',
  HOLD: 'Hold',
  MANUAL_REVIEW: 'Manual Review',
  SYSTEM_ERROR: 'Manual Review',
}

export interface Verification {
  ok: boolean
  expected: Record<string, number>
  actual: Record<string, number>
  mismatches: string[]
  documentsInDb: number
  runsInDb: number
}

export async function verifyAgainstEngineSummary(dir = CORPUS): Promise<Verification> {
  const summaryPath = path.resolve(process.cwd(), dir, 'summary.json')
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
  const cases: any[] = summary.cases

  const expected: Record<string, number> = {}
  for (const c of cases) {
    const status = RECO_TO_STATUS[c.recommendation]
    expected[status] = (expected[status] || 0) + 1
  }

  const grouped = await prisma.document.groupBy({ by: ['status'], _count: { _all: true } })
  const actual: Record<string, number> = {}
  for (const g of grouped) actual[g.status] = g._count._all

  const mismatches: string[] = []

  for (const [status, count] of Object.entries(expected)) {
    if ((actual[status] ?? 0) !== count) {
      mismatches.push(`aggregate ${status}: db=${actual[status] ?? 0} engine=${count}`)
    }
  }
  for (const [status, count] of Object.entries(actual)) {
    if (!(status in expected)) mismatches.push(`unexpected status in db: ${status} (${count})`)
  }

  // Per-document check: aggregates can agree while individual rows are wrong.
  for (const c of cases) {
    const id = String(c.output_file).replace(/_result\.json$/, '')
    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) {
      mismatches.push(`${id}: missing from database`)
      continue
    }
    const want = RECO_TO_STATUS[c.recommendation]
    if (doc.status !== want) mismatches.push(`${id}: status ${doc.status} != engine ${want}`)
    if (doc.maxSeverity !== c.max_severity)
      mismatches.push(`${id}: maxSeverity ${doc.maxSeverity} != engine ${c.max_severity}`)
    if (Math.abs(doc.grandTotal - Number(c.grand_total)) > 0.005)
      mismatches.push(`${id}: grandTotal ${doc.grandTotal} != engine ${c.grand_total}`)
  }

  return {
    ok: mismatches.length === 0,
    expected,
    actual,
    mismatches,
    documentsInDb: await prisma.document.count(),
    runsInDb: await prisma.validationRun.count(),
  }
}

/** Prints the verdict and returns whether the Portal genuinely matches. */
export function reportVerification(v: Verification, stats?: SimStats): boolean {
  console.log('')
  console.log('Cross-check vs Engine summary.json')
  for (const [status, count] of Object.entries(v.expected)) {
    const got = v.actual[status] ?? 0
    const mark = got === count ? 'OK ' : 'BAD'
    console.log(`  ${mark} ${status.padEnd(14)} db=${String(got).padStart(3)} engine=${String(count).padStart(3)}`)
  }
  console.log(`  Documents in db: ${v.documentsInDb}`)
  console.log(`  Validation runs in db: ${v.runsInDb}`)
  if (stats) console.log(`  Pushed this run: ${stats.files} (ingested ${stats.ingested}, replayed ${stats.replayed}, failed ${stats.failed})`)

  // A database that already holds good data matches the Engine even if every
  // push in this run failed, so the push outcome must gate the verdict. Without
  // this gate a wrong --http URL still prints "Portal matches Engine exactly".
  const pushClean = !stats || (stats.failed === 0 && stats.conflicted === 0)

  if (v.ok && pushClean) {
    console.log('  VERDICT: Portal matches Engine exactly (aggregate + per document)')
    return true
  }
  if (!v.ok) {
    console.log(`  VERDICT: MISMATCH (${v.mismatches.length} problems)`)
    for (const m of v.mismatches.slice(0, 10)) console.log(`    - ${m}`)
    return false
  }
  console.log(`  VERDICT: NOT VERIFIED — database matches, but ${stats!.failed} push(es) failed,`)
  console.log('           so this run proved nothing about ingestion. Fix the push and re-run.')
  return false
}
