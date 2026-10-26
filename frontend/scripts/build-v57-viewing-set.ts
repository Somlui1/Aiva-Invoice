/**
 * Builds the **v5.7 evidence dataset for viewing** and ingests it into a Portal database.
 *
 *   npx tsx scripts/build-v57-viewing-set.ts                        # dataset only (no DB writes)
 *   npx tsx scripts/build-v57-viewing-set.ts --ingest               # + ingest into DATABASE_URL's DB
 *   npx tsx scripts/build-v57-viewing-set.ts --db v57 --ingest      # use prisma/v57.db (created if new)
 *
 * SOURCE — read this before using the result for anything but UI review:
 * `temp/paperless_invoices_v5_7/` is produced by `engine/tools/replay_results.py`, which replays the
 * saved OCR + Oracle snapshot of the v5 run through the **v5.7 code tree** with *simulated* V-05/V-08
 * AI and only the receipt rows the original run fetched. The evidence rows are therefore exactly what
 * engine v5.7 emits (`versions.schema = "3.1"`, one row per finding), but a document's
 * `recommendation` can differ from the live queue (e.g. more REVIEW, fewer AUTO_PASS).
 * ⇒ Use it to review the F1–F10 evidence UI. Do **not** treat the statuses as the real queue, and do
 *   not replace the seeded corpus with it. A live batch (VLM + Oracle) is still owed for that.
 *
 * What it fixes on the way: the replay wrote `request.validation_id = "replay"` for every document,
 * which would collide on ingest (`validation_id` is unique), so each file gets `V57-<DMS-id>`.
 */
import fs from 'node:fs'
import path from 'node:path'

const SRC_DEFAULT = path.resolve(process.cwd(), '..', 'engine', 'temp', 'evidence-after', 'replay')
const OUT_DIR = path.resolve(process.cwd(), 'temp', 'paperless_invoices_v5_7')
const RESULT = /^DMS-.*_result\.json$/

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}

function build(srcDir: string): { written: number; findings: number; statuses: Record<string, number> } {
  if (!fs.existsSync(srcDir)) {
    console.error(`[v57] source not found: ${srcDir}`)
    console.error('[v57] regenerate it from the engine:  REPLAY_DUMP_DIR=<this>/replay python tools/replay_results.py …')
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let written = 0
  let findings = 0
  const statuses: Record<string, number> = {}
  for (const f of fs.readdirSync(srcDir).filter(n => RESULT.test(n)).sort()) {
    const raw = JSON.parse(fs.readFileSync(path.join(srcDir, f), 'utf-8'))
    const id = raw.package?.dms_doc_id ?? f.replace(/_result\.json$/, '')
    raw.request = { ...raw.request, validation_id: `V57-${id}`, dms_doc_id: id, validation_round: raw.request?.validation_round ?? 1 }
    findings += (raw.evidence || []).length
    const rec = raw.recommendation?.value ?? '?'
    statuses[rec] = (statuses[rec] ?? 0) + 1
    fs.writeFileSync(path.join(OUT_DIR, `${id}_result.json`), JSON.stringify(raw, null, 1), { encoding: 'utf-8' })
    written++
  }
  console.log(`[v57] dataset: ${written} documents, ${findings} evidence rows -> ${path.relative(process.cwd(), OUT_DIR)}`)
  console.log('[v57] decisions in this replay set:', statuses)
  return { written, findings, statuses }
}

async function main(): Promise<void> {
  const srcDir = arg('--src') ?? SRC_DEFAULT
  const { written } = build(srcDir)
  if (!process.argv.includes('--ingest')) {
    console.log('[v57] dataset only — pass --ingest to load it into a database')
    return
  }

  const dbName = arg('--db') ?? 'v57'
  const dbPath = path.resolve(process.cwd(), 'prisma', `${dbName}.db`)
  const dbUrl = `file:${dbPath}`

  if (!fs.existsSync(dbPath)) {
    // Start from the seeded development database (users, companies, receivers) and empty the documents.
    const seed = path.resolve(process.cwd(), 'prisma', 'dev.db')
    if (!fs.existsSync(seed)) {
      console.error('[v57] no prisma/dev.db to clone — run npm run seed:v5 first')
      process.exit(1)
    }
    fs.copyFileSync(seed, dbPath)
    console.log(`[v57] created ${path.basename(dbPath)} from prisma/dev.db (keeps users/companies, clears documents)`)
  }
  process.env.DATABASE_URL = dbUrl

  const { prisma } = await import('../src/lib/prisma')
  console.log(`[v57] DATABASE_URL for this run: ${process.env.DATABASE_URL}`)
  await prisma.validationRun.deleteMany()
  await prisma.document.deleteMany()

  const { runIngestSimulation } = await import('./simulate-engine-push')
  const stats = await runIngestSimulation({ dir: 'temp/paperless_invoices_v5_7', log: line => console.log(line) })
  console.log(
    `[v57] ingested ${stats.ingested}/${stats.files} (replayed ${stats.replayed}, failed ${stats.failed}, conflicted ${stats.conflicted})`,
  )
  console.log('[v57] queue distribution in this database:', stats.byStatus)
  console.log(`[v57] documents: ${written} · view with:  DATABASE_URL="${dbUrl}" npm run dev`)
}

main().catch(err => {
  console.error('[v57] failed:', err)
  process.exit(1)
})
