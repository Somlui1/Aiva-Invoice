#!/usr/bin/env node
/**
 * List Thai UI strings in src/ that have no English in src/lib/i18n-en.json or i18n-en-extra.json.
 *   node scripts/i18n/extract-th.mjs            → prints missing strings (file: text)
 *   node scripts/i18n/extract-th.mjs --json     → JSON { "<thai>": "" } to fill and merge into "exact"
 * New translations go to src/lib/i18n-en-extra.json ("exact" / "patterns").
 * Skips tests, login demo/explainer, removed pages and mock data (data is not translated).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = f => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'))
  } catch {
    return { exact: {}, patterns: [] }
  }
}
const base = read('src/lib/i18n-en.json')
const extra = read('src/lib/i18n-en-extra.json')
const dict = { ...base.exact, ...extra.exact }
const TH = /[\u0E00-\u0E7F]/
const SKIP = /[\\/](test|mock)[\\/]|features[\\/]login[\\/](data|explainer)|StdPage|SimPage|CasesPage|governance[\\/]SettingsPage|lib[\\/]i18n|adAuth|SimContext/
const missing = new Map()
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.tsx?$/.test(e.name) && !SKIP.test(p)) scan(p)
  }
}
function add(s, f) {
  s = s.replace(/\s+/g, ' ').trim()
  if (s && TH.test(s) && !(s in dict) && !missing.has(s)) missing.set(s, path.relative(ROOT, f))
}
function scan(f) {
  const src = fs.readFileSync(f, 'utf8')
  if (!TH.test(src)) return
  const sf = ts.createSourceFile(f, src, 99, true, f.endsWith('x') ? 4 : 3)
  ;(function v(n) {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isJsxText(n)) add(n.text, f)
    else if (ts.isTemplateExpression(n)) [n.head, ...n.templateSpans.map(s => s.literal)].forEach(p => add(p.text, f))
    ts.forEachChild(n, v)
  })(sf)
}
walk(path.join(ROOT, 'src'))
if (process.argv.includes('--json')) console.log(JSON.stringify(Object.fromEntries([...missing.keys()].map(k => [k, ''])), null, 1))
else {
  for (const [s, f] of missing) console.log(`${f}: ${s}`)
  console.log(`\n${missing.size} Thai string(s) without English (search keywords and data can stay Thai)`)
}
