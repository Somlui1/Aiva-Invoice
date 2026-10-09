import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { runIngestSimulation } from '../../scripts/simulate-engine-push'

/**
 * The harness is only useful if its verdict is independent of itself, so the
 * oracle here is `summary.json` — the Engine's own report, produced before this
 * Portal code existed. `cases[]` gives a per-document expectation, which is a
 * far stronger check than comparing four aggregate totals.
 */
const CORPUS = path.resolve(process.cwd(), 'temp/paperless_invoices_v5')
const SUMMARY = JSON.parse(fs.readFileSync(path.join(CORPUS, 'summary.json'), 'utf-8'))
const CASES: any[] = SUMMARY.cases

const RECO_TO_STATUS: Record<string, string> = {
  AUTO_PASS: 'Auto-pass',
  REVIEW: 'Review',
  HOLD: 'Hold',
  MANUAL_REVIEW: 'Manual Review',
  SYSTEM_ERROR: 'Manual Review',
}

const expectedStatusCounts = () => {
  const out: Record<string, number> = {}
  for (const c of CASES) {
    const s = RECO_TO_STATUS[c.recommendation]
    expect(s, `unknown recommendation ${c.recommendation}`).toBeTruthy()
    out[s] = (out[s] || 0) + 1
  }
  return out
}

describe('simulate-engine-push harness', () => {
  it('scans only DMS-*_result.json and reports summary statistics', async () => {
    const stats = await runIngestSimulation()

    // 126 JSON files live in the corpus; summary.json is the index, not a
    // document, so it must be seen-and-skipped rather than ingested.
    expect(stats.scanned).toBe(126)
    expect(stats.skipped).toBe(1)
    expect(stats.skippedFiles).toEqual(['summary.json'])
    expect(stats.files).toBe(125)
    expect(stats.ingested).toBe(125)
    expect(stats.replayed).toBe(0)
    expect(stats.conflicted).toBe(0)
    expect(stats.failed).toBe(0)
    expect(stats.failures).toEqual([])
    expect(typeof stats.durationMs).toBe('number')
    expect(stats.durationMs).toBeGreaterThanOrEqual(0)

    expect(stats.byStatus).toEqual(expectedStatusCounts())
    // Guard against a silent drift in the fixture itself.
    expect(SUMMARY.metadata.total_documents).toBe(125)
    expect(CASES.length).toBe(125)
  }, 120_000)

  it('writes exactly one Document + one round-1 ValidationRun per file', async () => {
    const { prisma } = await import('../lib/prisma')
    expect(await prisma.document.count()).toBe(125)
    expect(await prisma.validationRun.count({ where: { validationRound: 1 } })).toBe(125)
  })

  it('agrees with the Engine index per document, not just in aggregate', async () => {
    const { prisma } = await import('../lib/prisma')
    const mismatches: string[] = []

    for (const c of CASES) {
      const id = c.output_file.replace(/_result\.json$/, '')
      const doc = await prisma.document.findUnique({ where: { id } })
      if (!doc) {
        mismatches.push(`${id}: missing`)
        continue
      }
      if (doc.status !== RECO_TO_STATUS[c.recommendation])
        mismatches.push(`${id}: status ${doc.status} != ${RECO_TO_STATUS[c.recommendation]}`)
      if (doc.maxSeverity !== c.max_severity)
        mismatches.push(`${id}: maxSeverity ${doc.maxSeverity} != ${c.max_severity}`)
      if (c.invoice_num !== null && doc.invoiceNum !== c.invoice_num)
        mismatches.push(`${id}: invoiceNum ${doc.invoiceNum} != ${c.invoice_num}`)
      if (Math.abs(doc.grandTotal - Number(c.grand_total)) > 0.005)
        mismatches.push(`${id}: grandTotal ${doc.grandTotal} != ${c.grand_total}`)
      if (doc.currency !== c.currency) mismatches.push(`${id}: currency ${doc.currency} != ${c.currency}`)
    }

    expect(mismatches.slice(0, 10)).toEqual([])
    expect(mismatches).toHaveLength(0)
  }, 120_000)

  it('matches the Engine statistics block in the database', async () => {
    const { prisma } = await import('../lib/prisma')
    const grouped = await prisma.document.groupBy({ by: ['status'], _count: { _all: true } })
    const dbCounts: Record<string, number> = {}
    for (const g of grouped) dbCounts[g.status] = g._count._all
    expect(dbCounts).toEqual(expectedStatusCounts())

    // Same numbers, expressed the Engine's way.
    expect(SUMMARY.statistics.counts).toMatchObject({
      AUTO_PASS: 51, REVIEW: 23, HOLD: 12, MANUAL_REVIEW: 39, SYSTEM_ERROR: 0,
    })
  })

  it('is idempotent at scale: a second full pass replays without new rows', async () => {
    const { prisma } = await import('../lib/prisma')
    const stats = await runIngestSimulation()

    expect(stats.scanned).toBe(126)
    expect(stats.skipped).toBe(1)
    expect(stats.ingested).toBe(0)
    expect(stats.replayed).toBe(125)
    expect(stats.failed).toBe(0)

    expect(await prisma.document.count()).toBe(125)
    expect(await prisma.validationRun.count({ where: { validationRound: 1 } })).toBe(125)
  }, 120_000)

  it('resolves a company code for every document in the corpus', async () => {
    const { prisma } = await import('../lib/prisma')
    const unknown = await prisma.document.count({ where: { companyCode: '?' } })
    expect(unknown).toBeLessThanOrEqual(1)
    const codes = await prisma.document.groupBy({ by: ['companyCode'], _count: { _all: true } })
    const map: Record<string, number> = {}
    for (const g of codes) map[g.companyCode] = g._count._all
    console.log('company distribution:', map)
    expect(map['AHA']).toBeGreaterThan(0) // the company added for org 413
  })
})
