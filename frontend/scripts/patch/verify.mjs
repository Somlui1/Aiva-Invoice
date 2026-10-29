#!/usr/bin/env node
/**
 * Verify ONCE — typecheck → only the affected tests, in a single vitest run.
 *
 *   node scripts/patch/verify.mjs --patch 5.13.0          files from docs/change/applied.json
 *   node scripts/patch/verify.mjs --base origin/main      files from git diff (CI merge request)
 *   node scripts/patch/verify.mjs --files a.ts,b.tsx      explicit list
 *   node scripts/patch/verify.mjs --only src/test/x.test.ts   re-run just the tests that failed
 *   flags: --deep (transitive importers — CI merge request) · --full (whole suite — CI on main / tags)
 *          --build · --list (print plan, run nothing)
 *
 * Why: the suite runs file-by-file (fileParallelism:false, shared SQLite) ≈ 3 min. Running it after
 * every small edit is what made the agent slow. Edit everything first, then run this ONE time.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { APPLIED_LOG, ROOT, abs, affectedTests, gitChanged, readJson, writeJson } from './lib.mjs'

const args = process.argv.slice(2)
const val = k => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : undefined
}
const flag = f => args.includes(f)
const isWin = process.platform === 'win32'
const npx = isWin ? 'npx.cmd' : 'npx'
const npm = isWin ? 'npm.cmd' : 'npm'

function run(label, cmd, a) {
  const t0 = Date.now()
  console.log(`\n[verify] ▶ ${label}: ${cmd} ${a.join(' ')}`)
  const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: ROOT, shell: isWin })
  const sec = ((Date.now() - t0) / 1000).toFixed(1)
  const ok = r.status === 0
  console.log(`[verify] ${ok ? '✔' : '✖'} ${label} (${sec}s)`)
  return { label, ok, sec: Number(sec) }
}

// ---- which files changed -------------------------------------------------------------------
let changed = []
let source = ''
const patchVer = val('--patch')
if (patchVer) {
  const rec = readJson(APPLIED_LOG, []).find(r => r.version === patchVer)
  if (!rec) {
    console.error(`[verify] no applied record for ${patchVer}`)
    process.exit(1)
  }
  changed = [...rec.files.replaced, ...rec.files.added, ...rec.files.deleted, ...(rec.db ? ['prisma/schema.prisma'] : [])]
  source = `patch ${patchVer}`
} else if (val('--base')) {
  changed = gitChanged(val('--base')) ?? []
  source = `git diff ${val('--base')}`
} else if (val('--files')) {
  changed = val('--files').split(',').map(s => s.trim()).filter(Boolean)
  source = 'explicit'
}

// ---- plan ----------------------------------------------------------------------------------
let tests = []
let full = flag('--full')
let reason = full ? '--full' : ''
if (val('--only')) {
  tests = val('--only').split(',').map(s => s.trim()).filter(Boolean)
  reason = 'only failed tests'
} else if (!full) {
  const a = affectedTests(changed, { depth: flag('--deep') ? Infinity : 1 })
  full = a.full
  reason = a.reason || `${changed.length} changed file(s) via ${source || 'nothing'}`
  tests = a.tests
}
// tests listed in the manifest are always included
if (patchVer && !full) {
  const rec = readJson(APPLIED_LOG, []).find(r => r.version === patchVer)
  for (const t of rec?.tests || []) if (!tests.includes(t) && fs.existsSync(abs(t))) tests.push(t)
}
const schemaChanged = changed.includes('prisma/schema.prisma')

console.log('\n[verify] plan')
console.log(`  reason : ${reason}`)
console.log(`  tests  : ${full ? 'FULL SUITE' : tests.length ? tests.length + ' file(s)' : 'none (typecheck only)'}`)
if (!full) for (const t of tests) console.log(`           - ${t}`)
if (flag('--list')) process.exit(0)

// ---- run (stop at the first failure) ------------------------------------------------------
const steps = []
const t0 = Date.now()
if (schemaChanged) steps.push(run('prisma generate', npx, ['prisma', 'generate']))
if (steps.every(s => s.ok)) steps.push(run('typecheck', npx, ['tsc', '--noEmit']))
if (steps.every(s => s.ok) && (full || tests.length)) {
  steps.push(run(full ? 'tests (full)' : `tests (${tests.length})`, npx, ['vitest', 'run', ...(full ? [] : tests)]))
}
if (steps.every(s => s.ok) && flag('--build')) steps.push(run('build', npm, ['run', 'build']))

const ok = steps.every(s => s.ok)
const total = ((Date.now() - t0) / 1000).toFixed(1)

if (patchVer) {
  const log = readJson(APPLIED_LOG, [])
  const rec = log.find(r => r.version === patchVer)
  if (rec) {
    rec.verify = { ok, at: new Date().toISOString(), totalSec: Number(total), full, tests, steps }
    writeJson(APPLIED_LOG, log)
  }
}

console.log(`\n[verify] ${ok ? '✔ PASS' : '✖ FAIL'} in ${total}s`)
if (!ok) {
  console.log('[verify] next: fix the failing spot, then re-run ONLY what failed:')
  console.log('         node scripts/patch/verify.mjs --only src/test/<failed>.test.ts')
}
process.exit(ok ? 0 : 1)
