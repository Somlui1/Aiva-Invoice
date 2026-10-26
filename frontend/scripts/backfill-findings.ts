/**
 * Add `findings` to the Portal documents already in the database (plan F7).
 *
 *   npx tsx scripts/backfill-findings.ts --dry-run      # report only, writes nothing
 *   npx tsx scripts/backfill-findings.ts                # update every document that needs it
 *   npx tsx scripts/backfill-findings.ts --id DMS-27    # one document
 *
 * (or `npm run backfill:findings -- …` after adding the script line to package.json)
 *
 * Idempotent: a document that already carries matching findings is left alone, so it is safe to run
 * again after ingesting a new Engine version. Only `rules[].findings` and `bboxes[].findingIds` are
 * written. A skipped row keeps working: the UI rebuilds one finding per rule (`legacyFindings`).
 */
import { mergeFindings, type BackfillSkipReason } from '../src/server/backfillFindings'
import type { PortalInvoiceDocument } from '../src/features/engine/types/portalDomain'

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const idArg = args.includes('--id') ? args[args.indexOf('--id') + 1] : undefined

  const { prisma } = await import('../src/lib/prisma')
  const rows = await prisma.document.findMany({
    where: idArg ? { id: idArg } : undefined,
    orderBy: { id: 'asc' },
    select: { id: true, payloadJson: true },
  })

  const count = { updated: 0, unchanged: 0, noRun: 0, badRow: 0 }
  const skipped: Record<BackfillSkipReason, string[]> = { DIFFERENT_FILE: [], STALE_RUN: [], UNREADABLE_RUN: [] }
  let findings = 0

  for (const row of rows) {
    let stored: PortalInvoiceDocument
    try {
      stored = JSON.parse(row.payloadJson) as PortalInvoiceDocument
      if (stored.id !== row.id || !Array.isArray(stored.rules) || !Array.isArray(stored.bboxes)) throw new Error('shape')
    } catch {
      count.badRow++
      console.warn(`[backfill] ${row.id}: payloadJson unreadable — left alone`)
      continue
    }

    const run = await prisma.validationRun.findFirst({
      where: { documentId: row.id },
      orderBy: [{ validationRound: 'desc' }, { completedAt: 'desc' }],
      select: { rawEngineResult: true },
    })
    if (!run) {
      count.noRun++
      continue
    }

    let raw: unknown
    try {
      raw = JSON.parse(run.rawEngineResult)
    } catch {
      skipped.UNREADABLE_RUN.push(row.id)
      continue
    }

    const out = mergeFindings(stored, raw)
    if (out.status === 'skipped') {
      skipped[out.reason].push(row.id)
      continue
    }
    if (out.status === 'unchanged') {
      count.unchanged++
      continue
    }
    findings += out.findings
    count.updated++
    if (!dryRun) {
      await prisma.document.update({ where: { id: row.id }, data: { payloadJson: JSON.stringify(out.payload) } })
    }
  }

  const skippedTotal = Object.values(skipped).reduce((n, l) => n + l.length, 0)
  console.log(
    `[backfill] ${dryRun ? 'DRY RUN — nothing written. ' : ''}${rows.length} documents: ` +
      `${count.updated} ${dryRun ? 'would be ' : ''}updated (${findings} findings), ${count.unchanged} already current, ` +
      `${skippedTotal} skipped, ${count.noRun} without a validation run, ${count.badRow} unreadable`,
  )
  for (const [reason, ids] of Object.entries(skipped)) {
    if (ids.length) console.log(`[backfill]   ${reason}: ${ids.slice(0, 20).join(', ')}${ids.length > 20 ? ` … +${ids.length - 20}` : ''}`)
  }
  await prisma.$disconnect()
  if (skippedTotal > 0 || count.badRow > 0) process.exitCode = 2 // not an error, but someone should look
}

main().catch(err => {
  console.error('[backfill] failed:', err)
  process.exit(1)
})
