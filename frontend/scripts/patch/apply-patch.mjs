#!/usr/bin/env node
/**
 * Apply a versioned patch package — ONE step, no tests in between (verify runs once afterwards).
 *
 *   node scripts/patch/apply-patch.mjs docs/change/inbox/aiva-patch-v5.13.0        (folder)
 *   node scripts/patch/apply-patch.mjs docs/change/inbox/aiva-patch-v5.13.0.zip    (zip)
 *   options: --dry-run · --force (base version mismatch) · --no-verify
 *            --in-place (files are already in the tree — made by make-patch.mjs: backup comes from git HEAD)
 *   rollback: node scripts/patch/apply-patch.mjs --rollback 5.13.0
 *
 * What it does (format: docs/change/README.md)
 *   1. reads manifest.json · checks `base` == package.json version (refuses unless --force)
 *   2. backs up every file it will touch → .patch-backup/<version>/ (for --rollback)
 *   3. copies files/ over the project, deletes manifest.delete[]
 *   4. bumps package.json "version", prepends CHANGE.md to docs/change/CHANGELOG.md (ONE changelog file)
 *   5. records the patch in docs/change/applied.json · moves the package to docs/change/applied/
 *   6. runs scripts/patch/verify.mjs ONCE (typecheck → affected tests) unless --no-verify
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { APPLIED_LOG, CHANGELOG, ROOT, abs, cmpVersion, pkgVersion, readJson, rel, writeJson } from './lib.mjs'

const args = process.argv.slice(2)
const flag = f => args.includes(f)
const positional = args.filter(a => !a.startsWith('--'))

function die(msg) {
  console.error(`\n[patch] ✖ ${msg}\n`)
  process.exit(1)
}

function listFiles(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) listFiles(p, base, out)
    else out.push(path.relative(base, p).split(path.sep).join('/'))
  }
  return out
}

function extractZip(zip) {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'aiva-patch-'))
  // Windows 10+ tar (bsdtar) reads zip; Linux CI images have unzip
  const tries = [
    ['tar', ['-xf', zip, '-C', dest]],
    ['unzip', ['-q', zip, '-d', dest]],
  ]
  for (const [cmd, a] of tries) {
    const r = spawnSync(cmd, a, { stdio: 'pipe' })
    if (r.status === 0) {
      // a zip may contain one top folder
      const top = fs.readdirSync(dest)
      return top.length === 1 && fs.statSync(path.join(dest, top[0])).isDirectory() && !fs.existsSync(path.join(dest, 'manifest.json'))
        ? path.join(dest, top[0])
        : dest
    }
  }
  die(`cannot extract ${zip} (need tar or unzip)`)
}

function rollback(version) {
  const log = readJson(APPLIED_LOG, [])
  const rec = log.find(r => r.version === version)
  if (!rec) die(`no applied record for ${version}`)
  const bdir = abs(`.patch-backup/${version}`)
  if (!fs.existsSync(bdir)) die(`no backup at ${rel(bdir)}`)
  for (const f of rec.files.replaced) fs.copyFileSync(path.join(bdir, f), abs(f))
  for (const f of rec.files.added) fs.rmSync(abs(f), { force: true })
  for (const f of rec.files.deleted) {
    fs.mkdirSync(path.dirname(abs(f)), { recursive: true })
    fs.copyFileSync(path.join(bdir, f), abs(f))
  }
  for (const f of ['package.json', 'docs/change/CHANGELOG.md']) {
    if (fs.existsSync(path.join(bdir, f))) fs.copyFileSync(path.join(bdir, f), abs(f))
    else fs.rmSync(abs(f), { force: true }) // did not exist before this patch
  }
  rec.rolledBackAt = new Date().toISOString()
  writeJson(APPLIED_LOG, log)
  console.log(`[patch] ↩ rolled back ${version} → package.json ${pkgVersion()}`)
}

if (flag('--rollback')) {
  rollback(positional[0] || die('usage: --rollback <version>'))
  process.exit(0)
}

const input = positional[0] || die('usage: apply-patch.mjs <patch-folder|patch.zip> [--dry-run] [--force] [--no-verify]')
const src = path.resolve(input)
if (!fs.existsSync(src)) die(`not found: ${input}`)
const dir = src.endsWith('.zip') ? extractZip(src) : src
const manifest = readJson(path.join(dir, 'manifest.json'), null) || die('manifest.json missing or invalid')
const { version, base, title = '' } = manifest
if (!/^\d+\.\d+\.\d+$/.test(version || '')) die('manifest.version must be x.y.z')

const current = pkgVersion()
if (base && base !== current && !flag('--force')) die(`patch is for ${base}, project is ${current} (apply the missing patches first, or --force)`)
if (cmpVersion(version, current) <= 0 && !flag('--force')) die(`patch ${version} is not newer than ${current}`)
const log = readJson(APPLIED_LOG, [])
if (log.some(r => r.version === version && !r.rolledBackAt) && !flag('--force')) die(`${version} was already applied`)

const filesDir = path.join(dir, 'files')
const incoming = fs.existsSync(filesDir) ? listFiles(filesDir) : []
const deletes = Array.isArray(manifest.delete) ? manifest.delete : []
for (const f of [...incoming, ...deletes]) {
  if (f.includes('..') || path.isAbsolute(f)) die(`unsafe path in patch: ${f}`)
  if (f === 'package.json' || f === 'docs/change/CHANGELOG.md') die(`${f} is managed by the patch tool — use manifest.packageJson / CHANGE.md`)
}

const inPlace = flag('--in-place')
const inHead = f => {
  try {
    execFileSync('git', ['cat-file', '-e', `HEAD:./${f}`], { cwd: ROOT, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
const added = incoming.filter(f => (inPlace ? !inHead(f) : !fs.existsSync(abs(f))))
const replaced = incoming.filter(f => (inPlace ? inHead(f) : fs.existsSync(abs(f))))
const deleted = deletes.filter(f => (inPlace ? inHead(f) : fs.existsSync(abs(f))))

console.log(`\n[patch] ${current} → ${version}  ${title}`)
console.log(`        replace ${replaced.length} · add ${added.length} · delete ${deleted.length}${manifest.db ? ' · DB schema change' : ''}`)
if (flag('--dry-run')) {
  for (const f of replaced) console.log(`  M ${f}`)
  for (const f of added) console.log(`  A ${f}`)
  for (const f of deleted) console.log(`  D ${f}`)
  process.exit(0)
}

// 1) backup (files we overwrite/delete + the two managed files)
const bdir = abs(`.patch-backup/${version}`)
for (const f of [...replaced, ...deleted, 'package.json', 'docs/change/CHANGELOG.md']) {
  const to = path.join(bdir, f)
  const managed = f === 'package.json' || f === 'docs/change/CHANGELOG.md'
  if (inPlace && !managed) {
    // the tree already has the new content → the original is in git HEAD
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.writeFileSync(to, execFileSync('git', ['show', `HEAD:./${f}`], { cwd: ROOT }))
    continue
  }
  if (!fs.existsSync(abs(f))) continue
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(abs(f), to)
}

// 2) write
if (!inPlace) {
  for (const f of incoming) {
    fs.mkdirSync(path.dirname(abs(f)), { recursive: true })
    fs.copyFileSync(path.join(filesDir, f), abs(f))
  }
  for (const f of deleted) fs.rmSync(abs(f), { force: true })
}

// 3) package.json: version (+ optional scripts / deps merge)
const pkg = readJson(abs('package.json'), {})
pkg.version = version
for (const k of ['scripts', 'dependencies', 'devDependencies']) {
  if (manifest.packageJson?.[k]) pkg[k] = { ...(pkg[k] || {}), ...manifest.packageJson[k] }
}
writeJson(abs('package.json'), pkg)

// 4) ONE changelog: newest entry on top
const entryFile = path.join(dir, 'CHANGE.md')
const entry = fs.existsSync(entryFile) ? fs.readFileSync(entryFile, 'utf8').trim() : `## ${version} — ${title}`
const head =
  '# AIVA Portal — CHANGELOG\n\n<!-- newest first · written by scripts/patch/apply-patch.mjs -->\n\n' +
  '## ก่อน v5.13\nประวัติเดิมอยู่ใน `CHANGELOG-v5.3.md` … `CHANGELOG-v5.12.md` (โฟลเดอร์เดียวกัน) — ไม่เพิ่มไฟล์แบบนี้อีก\n'
let cl = fs.existsSync(CHANGELOG) ? fs.readFileSync(CHANGELOG, 'utf8') : head
if (!cl.includes('<!-- newest first')) cl = head + '\n' + cl
cl = cl.replace(/(<!-- newest first[^\n]*-->\n)/, `$1\n${entry}\n\n`)
fs.mkdirSync(path.dirname(CHANGELOG), { recursive: true })
fs.writeFileSync(CHANGELOG, cl)

// 5) record + archive the package
let commit = null
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
} catch {}
log.push({
  version,
  base: current,
  title,
  appliedAt: new Date().toISOString(),
  baseCommit: commit,
  db: !!manifest.db,
  files: { replaced, added, deleted: deleted },
  tests: manifest.tests || [],
  verify: null,
})
writeJson(APPLIED_LOG, log)
if (src.startsWith(abs('docs/change/inbox'))) {
  const archive = abs(`docs/change/applied/${path.basename(src)}`)
  fs.mkdirSync(path.dirname(archive), { recursive: true })
  fs.renameSync(src, archive)
}

console.log(`[patch] ✔ applied ${version} (backup: ${rel(bdir)})`)
if (manifest.db) console.log('[patch] ⚠ DB schema changed: dev DB → `npx prisma db push` · Docker applies it at container start')

// 6) verify ONCE
if (!flag('--no-verify')) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/patch/verify.mjs'), '--patch', version], { stdio: 'inherit', cwd: ROOT, env: { ...process.env, AIVA_ROOT: ROOT } })
  process.exit(r.status ?? 1)
}
