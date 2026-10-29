/**
 * Shared helpers for the patch workflow (no dependencies — runs on Windows / Linux / CI).
 *   affectedTests(changed)  → which src/test/*.test.ts(x) can be affected by a set of changed files
 *   readManifest(dir)       → patch manifest (see docs/change/README.md)
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * Project root = the folder with package.json "aiva-portal".
 * cwd first (lets the very first patch run its own bundled copy of this tool: `cd frontend` then
 * `node <patch>/files/scripts/patch/apply-patch.mjs <patch>`), else relative to this file.
 */
function findRoot() {
  const isAiva = d => {
    try {
      return JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8')).name === 'aiva-portal'
    } catch {
      return false
    }
  }
  if (process.env.AIVA_ROOT) return path.resolve(process.env.AIVA_ROOT)
  if (isAiva(process.cwd())) return process.cwd()
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
}
export const ROOT = findRoot()
export const rel = p => path.relative(ROOT, p).split(path.sep).join('/')
export const abs = p => path.resolve(ROOT, p)

const SCAN_DIRS = ['src', 'server', 'scripts']
const EXTS = ['.ts', '.tsx', '.mts', '.js', '.mjs', '.css']
const TEST_RE = /^src\/test\/.+\.test\.tsx?$/

/** Files whose change makes every test suspect → run the full suite. */
export const GLOBAL_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'vitest.config.ts',
  'vitest.setup.ts',
  'vitest.global-setup.ts',
  'vitest.db-url.ts',
]

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (EXTS.includes(path.extname(e.name))) out.push(p)
  }
  return out
}

function resolveSpec(fromFile, spec) {
  let base
  if (spec.startsWith('@/')) base = path.join(ROOT, 'src', spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec)
  else return null
  const cands = [base, ...EXTS.map(x => base + x), ...EXTS.map(x => path.join(base, 'index' + x))]
  for (const c of cands) if (fs.existsSync(c) && fs.statSync(c).isFile()) return rel(c)
  return null
}

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|@import\s+['"]([^'"]+)['"]/g

/** reverse import graph: file → files that import it */
export function buildReverseGraph() {
  const rev = new Map()
  for (const d of SCAN_DIRS) {
    for (const f of walk(path.join(ROOT, d))) {
      const src = fs.readFileSync(f, 'utf8')
      for (const m of src.matchAll(IMPORT_RE)) {
        const spec = m[1] || m[2] || m[3] || m[4]
        const target = resolveSpec(f, spec)
        if (!target) continue
        if (!rev.has(target)) rev.set(target, new Set())
        rev.get(target).add(rel(f))
      }
    }
  }
  return rev
}

/**
 * @param {string[]} changed repo-relative paths (forward slashes)
 * @param {{ depth?: number }} opt  import hops from a test to a changed file.
 *   depth 1 (default, local agent): tests that import the changed file directly + manifest.tests.
 *   depth Infinity (`--deep`, CI merge requests): full transitive closure — wider but complete.
 *   Shared hubs (src/mock/companies.ts, server/app.ts) pull in most of the suite when deep.
 * @returns {{ full: boolean, reason?: string, tests: string[] }}
 */
export function affectedTests(changed, opt = {}) {
  const maxDepth = opt.depth ?? 1
  const norm = changed.map(c => c.replace(/\\/g, '/').replace(/^\.\//, ''))
  const g = norm.find(c => GLOBAL_FILES.includes(c))
  if (g) return { full: true, reason: `${g} changed`, tests: [] }

  const rev = buildReverseGraph()
  const seeds = new Set()
  for (const c of norm) {
    if (c === 'prisma/schema.prisma') seeds.add('src/lib/prisma.ts') // schema → every DB user
    else seeds.add(c)
  }
  const seen = new Set(seeds)
  const queue = [...seeds].map(f => [f, 0])
  while (queue.length) {
    const [cur, d] = queue.shift()
    if (d >= maxDepth) continue
    for (const imp of rev.get(cur) ?? []) {
      if (!seen.has(imp)) {
        seen.add(imp)
        queue.push([imp, d + 1])
      }
    }
  }
  const tests = new Set([...seen].filter(f => TEST_RE.test(f) && fs.existsSync(abs(f))))
  for (const t of routeTests(norm)) tests.add(t)
  return { full: false, tests: [...tests].sort() }
}

/**
 * server/routes/*.ts are imported only by server/app.ts, so the import graph cannot tell which tests
 * hit them. Map route file → mount paths (from app.ts) → tests that call those paths.
 */
export function routeTests(changed) {
  const appFile = abs('server/app.ts')
  if (!fs.existsSync(appFile)) return []
  const app = fs.readFileSync(appFile, 'utf8')
  const nameToFile = new Map()
  for (const m of app.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](\.\/routes\/[^'"]+)['"]/g)) {
    const file = resolveSpec(appFile, m[2])
    for (const n of m[1].split(',').map(x => x.trim().split(/\s+as\s+/).pop()).filter(Boolean)) nameToFile.set(n, file)
  }
  const paths = new Set()
  for (const m of app.matchAll(/app\.(?:use|get|post)\(\s*(\[[^\]]*\]|['"][^'"]+['"])([^\n]*)\)/g)) {
    const mountPaths = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1])
    const names = [...m[2].matchAll(/\b(\w+)\b/g)].map(x => x[1])
    if (names.some(n => changed.includes(nameToFile.get(n)))) mountPaths.forEach(p => paths.add(p))
  }
  if (!paths.size) return []
  const testDir = abs('src/test')
  return fs
    .readdirSync(testDir)
    .filter(f => /\.test\.tsx?$/.test(f))
    .filter(f => {
      const src = fs.readFileSync(path.join(testDir, f), 'utf8')
      return [...paths].some(p => src.includes(p))
    })
    .map(f => `src/test/${f}`)
}

export function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

export function writeJson(p, v) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n')
}

export function gitChanged(base) {
  try {
    const out = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' })
    const prefix = execFileSync('git', ['rev-parse', '--show-prefix'], { cwd: ROOT, encoding: 'utf8' }).trim()
    return out
      .split(/\r?\n/)
      .filter(Boolean)
      .filter(f => !prefix || f.startsWith(prefix))
      .map(f => (prefix ? f.slice(prefix.length) : f))
  } catch (e) {
    console.error(`[patch] git diff against ${base} failed: ${e.message}`)
    return null
  }
}

export const APPLIED_LOG = abs('docs/change/applied.json')
export const CHANGELOG = abs('docs/change/CHANGELOG.md')

export function pkgVersion() {
  return readJson(abs('package.json'), {}).version
}

/** compare "5.13.0" style versions: -1 / 0 / 1 */
export function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d) return d < 0 ? -1 : 1
  }
  return 0
}
