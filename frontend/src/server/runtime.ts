/**
 * v5.16 — Portal runtime state: who am I (instance), is the ingest pipeline moving, is the process
 * healthy. Read by /api/health (Docker healthcheck), the watchdog and the "alive" log line.
 */
import os from 'node:os'
import crypto from 'node:crypto'
import { monitorEventLoopDelay } from 'node:perf_hooks'

const bootedAt = Date.now()

/**
 * Identifies THIS Portal + THIS database. The Engine logs it with every push, so "the Engine says it
 * sent the document but the Portal does not show it" can be checked at a glance: a different
 * instance id = the Engine wrote into another Portal / another database (e.g. `npm start` on the host).
 */
let _instance = ''
export function instanceIdOf(): string {
  if (_instance) return _instance
  const db = String(process.env.DATABASE_URL || '')
  const dbTag = crypto.createHash('sha1').update(db).digest('hex').slice(0, 8)
  return (_instance = `${os.hostname()}/${dbTag}`)
}

export function dbKindOf(): 'sqlite' | 'postgres' | 'sqlserver' | 'unknown' {
  const u = String(process.env.DATABASE_URL || '')
  if (u.startsWith('file:')) return 'sqlite'
  if (/^postgres(ql)?:/.test(u)) return 'postgres'
  if (u.startsWith('sqlserver:')) return 'sqlserver'
  return 'unknown'
}

// ---- ingest pipeline -------------------------------------------------------------------------------
export const ingestStats = {
  received: 0,
  created: 0,
  replayed: 0,
  rejected: 0, // 4xx (contract, identity, 409)
  failed: 0, // 5xx (database)
  lastAt: 0,
  lastDocId: '' as string,
  lastResult: '' as string,
  /** queue in front of the ingest lock (incl. the running one) */
  queued: 0,
  /** start time of the ingest currently holding the lock (0 = idle) */
  runningSince: 0,
  runningDoc: '' as string,
}

/** Counters since the previous "alive" line. */
let lastBeat = { received: 0, failed: 0, rejected: 0 }
export function ingestDeltaSinceBeat() {
  const d = {
    received: ingestStats.received - lastBeat.received,
    failed: ingestStats.failed - lastBeat.failed,
    rejected: ingestStats.rejected - lastBeat.rejected,
  }
  lastBeat = { received: ingestStats.received, failed: ingestStats.failed, rejected: ingestStats.rejected }
  return d
}

export function ingestRunningForMs(): number {
  return ingestStats.runningSince ? Date.now() - ingestStats.runningSince : 0
}

// ---- event loop --------------------------------------------------------------------------------------
const loop = monitorEventLoopDelay({ resolution: 50 })
loop.enable()
export function eventLoopLagMs(): number {
  const v = loop.mean / 1e6
  loop.reset()
  return Number.isFinite(v) ? Math.round(v) : 0
}

export const uptimeSec = () => (Date.now() - bootedAt) / 1000

// ---- database probe (shared by health + watchdog) --------------------------------------------------
export const dbProbe = { lastOkAt: Date.now(), consecutiveFails: 0, lastError: '' }

export const envInt = (name: string, def: number, min = 0) => {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n >= min ? n : def
}
