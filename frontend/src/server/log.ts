/**
 * v5.16 — Portal terminal log (`docker compose logs -f portal` / `npm start`).
 *
 * One line per event, always with local date + time:
 *
 *   2026-11-09 09:41:23.481 INFO  [ingest]  ✓ DMS-1234 CREATED · Review · DR-00 · RESOLVED · 312ms · live→3
 *   2026-11-09 09:41:30.002 WARN  [http]    POST /api/documents/DMS-1234/action 409 · 41ms · u=somchai
 *   2026-11-09 09:55:00.000 INFO  [alive]   up 3h12m · ingest +12 (fail 0) · sse 4 · lock idle · rss 182MB · lag 3ms
 *
 * Quiet by design: health probes, SSE pings, static files and fast successful GETs are NOT logged
 * (set LOG_LEVEL=debug to see them).
 *
 * Env:
 *   LOG_LEVEL           debug | info (default) | warn | error
 *   LOG_TZ              time zone of the timestamp (default: TZ, else Asia/Bangkok)
 *   LOG_SLOW_MS         a GET slower than this is logged as WARN (default 1500)
 *   LOG_HEARTBEAT_MIN   minutes between "alive" lines (default 15, 0 = off)
 */
import { format } from 'node:util'

type Level = 'debug' | 'info' | 'warn' | 'error'
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

const envLevel = (): Level => {
  const v = String(process.env.LOG_LEVEL || 'info').toLowerCase()
  return (v in ORDER ? v : 'info') as Level
}
// Read lazily: ES imports run before `process.loadEnvFile()` in server/index.ts (npm start + .env).
let minLevel: Level | null = null
const level = (): Level => (minLevel ??= envLevel())
export const setLogLevel = (l: Level) => (minLevel = l)
export const isDebug = () => ORDER[level()] <= ORDER.debug

let fmt: Intl.DateTimeFormat | null | undefined
function getFmt(): Intl.DateTimeFormat | null {
  if (fmt !== undefined) return fmt
  try {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: process.env.LOG_TZ || process.env.TZ || 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
  } catch {
    fmt = null // unknown zone → fall back to the process clock below
  }
  return fmt
}

/** "2026-11-09 09:41:23.481" in LOG_TZ. */
export function stamp(d: Date = new Date()): string {
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  const fmt = getFmt()
  if (fmt) {
    const p: Record<string, string> = {}
    for (const x of fmt.formatToParts(d)) p[x.type] = x.value
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}.${ms}`
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms}`
}

const currentLevel = () => level()
const LABEL: Record<Level, string> = { debug: 'DEBUG', info: 'INFO ', warn: 'WARN ', error: 'ERROR' }

function write(level: Level, tag: string, msg: string) {
  if (ORDER[level] < ORDER[currentLevel()]) return
  if (process.env.NODE_ENV === 'test' && !process.env.LOG_IN_TESTS) return // keep vitest output clean
  const line = `${stamp()} ${LABEL[level]} ${`[${tag}]`.padEnd(9)} ${msg}\n`
  ;(level === 'error' || level === 'warn' ? process.stderr : process.stdout).write(line)
}

/** Short, single-line text of an error (stack only at debug). */
export function errText(e: unknown): string {
  if (e instanceof Error) {
    const code = (e as any).code ? ` [${(e as any).code}]` : ''
    const first = String(e.message || e.name).split('\n').find(Boolean) ?? e.name
    return `${e.name}${code}: ${first.slice(0, 300)}${isDebug() && e.stack ? `\n${e.stack}` : ''}`
  }
  return String(e).slice(0, 300)
}

export const log = {
  debug: (tag: string, msg: string) => write('debug', tag, msg),
  info: (tag: string, msg: string) => write('info', tag, msg),
  warn: (tag: string, msg: string) => write('warn', tag, msg),
  error: (tag: string, msg: string) => write('error', tag, msg),
}

/**
 * Existing `console.*` calls all over the server get the same timestamp + level prefix, so nothing
 * in the terminal is undated. Idempotent.
 */
let consolePatched = false
export function installConsoleTimestamps(): void {
  if (consolePatched || process.env.NODE_ENV === 'test') return
  consolePatched = true
  minLevel = envLevel() // .env is loaded by now
  fmt = undefined
  const mk =
    (level: Level) =>
    (...args: unknown[]) => {
      const text = format(...args)
      // "[Adapter Server] Ready …" → tag "Adapter Server", rest is the message
      const m = /^\[([^\]]{1,40})\]:?\s*([\s\S]*)$/.exec(text)
      write(level, m ? m[1].replace(/\s+/g, '-').toLowerCase().slice(0, 7) : 'app', m ? m[2] : text)
    }
  console.log = mk('info')
  console.info = mk('info')
  console.warn = mk('warn')
  console.error = mk('error')
  console.debug = mk('debug')
}

/** 1234567 → "1.2MB" */
export function bytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '?'
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`
  return `${(n / 1024 / 1024).toFixed(1)}MB`
}

/** seconds → "3h12m" / "4m05s" */
export function dur(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m${String(s % 60).padStart(2, '0')}s`
}
