/**
 * Copy PDF.js's worker into `public/pdfjs/` so the browser can load it as a
 * plain module URL.
 *
 * Next.js cannot bundle a worker declared as `new URL('pdf.worker.min.mjs',
 * import.meta.url)` inside a client component — PDF.js constructs the worker
 * itself from `GlobalWorkerOptions.workerSrc`. Serving the file statically is
 * the documented workaround, and copying it (rather than committing it) keeps
 * the worker byte-identical to the installed `pdfjs-dist` version, which PDF.js
 * checks at startup.
 *
 * Runs from `postinstall`/`predev`; skipped when the file is already current.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const SRC = path.join('node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
const DEST_DIR = path.join('public', 'pdfjs')
const DEST = path.join(DEST_DIR, 'pdf.worker.min.mjs')

const root = process.cwd()
const src = path.join(root, SRC)
const dest = path.join(root, DEST)

if (!existsSync(src)) {
  console.warn(`[pdfjs] worker not found at ${SRC} — run npm install; the viewer falls back to the mock page.`)
  process.exit(0)
}

const source = readFileSync(src)
const current = existsSync(dest) ? readFileSync(dest) : null

if (current && current.equals(source)) {
  console.log(`[pdfjs] ${DEST} is up to date (${statSync(dest).size} bytes)`)
} else {
  mkdirSync(DEST_DIR, { recursive: true })
  copyFileSync(src, dest)
  console.log(`[pdfjs] copied worker → ${DEST} (${source.length} bytes)`)
}
