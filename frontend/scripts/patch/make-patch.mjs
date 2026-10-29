#!/usr/bin/env node
/**
 * Package the current working-tree changes (vs git HEAD) as a versioned patch.
 *
 *   node scripts/patch/make-patch.mjs --version 5.13.1 --title "แก้ … " [--tests src/test/a.test.ts,…] [--db]
 *   → docs/change/inbox/aiva-patch-v5.13.1/{manifest.json, files/…, CHANGE.md}
 *
 * Then record it WITHOUT copying files again (they are already in the tree):
 *   node scripts/patch/apply-patch.mjs docs/change/inbox/aiva-patch-v5.13.1 --in-place
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { ROOT, abs, pkgVersion, writeJson } from './lib.mjs'

const args = process.argv.slice(2)
const val = k => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : undefined
}
const version = val('--version')
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('usage: make-patch.mjs --version x.y.z --title "…" [--tests a,b] [--db]')
  process.exit(1)
}
const MANAGED = new Set(['package.json', 'docs/change/CHANGELOG.md', 'docs/change/applied.json'])
const SKIP = [/^docs\/change\/(inbox|applied)\//, /^\.patch-backup\//, /^\.deploy\//, /^docs\/plans\/task\.md$/]

const git = a => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' })
const prefix = git(['rev-parse', '--show-prefix']).trim()
const lines = git(['status', '--porcelain', '-uall', '--', '.']).split(/\r?\n/).filter(Boolean)
const files = []
const deleted = []
for (const l of lines) {
  const st = l.slice(0, 2)
  let f = l.slice(3).trim()
  if (f.includes(' -> ')) f = f.split(' -> ')[1]
  f = f.replace(/^"|"$/g, '')
  if (prefix && f.startsWith(prefix)) f = f.slice(prefix.length)
  if (MANAGED.has(f) || SKIP.some(r => r.test(f))) continue
  if (st.includes('D')) deleted.push(f)
  else files.push(f)
}
if (!files.length && !deleted.length) {
  console.error('[make-patch] no changes against HEAD')
  process.exit(1)
}

const out = abs(`docs/change/inbox/aiva-patch-v${version}`)
fs.rmSync(out, { recursive: true, force: true })
for (const f of files) {
  const to = path.join(out, 'files', f)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(abs(f), to)
}
writeJson(path.join(out, 'manifest.json'), {
  version,
  base: pkgVersion(),
  title: val('--title') || '',
  db: args.includes('--db') || files.includes('prisma/schema.prisma'),
  tests: (val('--tests') || '').split(',').map(s => s.trim()).filter(Boolean),
  delete: deleted,
})
const date = new Date().toISOString().slice(0, 10)
fs.writeFileSync(
  path.join(out, 'CHANGE.md'),
  `## ${version} — ${val('--title') || ''} (${date})\n\n### เปลี่ยนอะไร\n- \n\n### ผลต่อผู้ใช้ / การ deploy\n- \n\n### รอตัดสินใจ\n- (ไม่มี)\n`,
)
console.log(`[make-patch] ✔ ${path.relative(ROOT, out)} · ${files.length} file(s), ${deleted.length} deleted`)
console.log('[make-patch] fill CHANGE.md, then: node scripts/patch/apply-patch.mjs ' + path.relative(ROOT, out).split(path.sep).join('/') + ' --in-place')
