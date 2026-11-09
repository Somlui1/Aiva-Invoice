/**
 * v5.16 — keep the Portal from hanging silently.
 *
 *  - heartbeat:   one "alive" line every LOG_HEARTBEAT_MIN minutes (uptime, ingest since last line,
 *                 SSE tabs, ingest lock, memory, event-loop lag) — proof in the log that the backend runs.
 *  - watchdog:    the process EXITS (code 1) when the database has been unreachable for
 *                 WATCHDOG_DB_FAILS checks in a row, or one ingest holds the lock longer than
 *                 WATCHDOG_INGEST_STUCK_SEC. Docker's `restart: always` brings it back clean.
 *                 (A hung event loop cannot run this check — Docker's healthcheck + autoheal cover that.)
 *
 * Env: WATCHDOG_ENABLED (default: true in production) · WATCHDOG_CHECK_SEC 15 · WATCHDOG_DB_FAILS 8 ·
 *      WATCHDOG_INGEST_STUCK_SEC 300 · LOG_HEARTBEAT_MIN 15
 */
import { log, dur } from './log'
import {
  dbProbe,
  envInt,
  eventLoopLagMs,
  ingestDeltaSinceBeat,
  ingestRunningForMs,
  ingestStats,
  uptimeSec,
} from './runtime'
import { openStreams } from './events'

const enabled = () => {
  const v = String(process.env.WATCHDOG_ENABLED ?? '').toLowerCase()
  if (v) return ['1', 'true', 'yes', 'on'].includes(v)
  return process.env.NODE_ENV === 'production'
}

export function aliveLine(): string {
  const d = ingestDeltaSinceBeat()
  const running = ingestRunningForMs()
  const lock = running ? `lock ${ingestStats.runningDoc} ${Math.round(running / 1000)}s` : 'lock idle'
  const last = ingestStats.lastAt ? `last ${ingestStats.lastDocId} ${dur((Date.now() - ingestStats.lastAt) / 1000)} ago` : 'no ingest yet'
  const rss = Math.round(process.memoryUsage().rss / 1024 / 1024)
  return `up ${dur(uptimeSec())} · ingest +${d.received} (rejected ${d.rejected}, failed ${d.failed}) · ${last} · sse ${openStreams()} · ${lock} · rss ${rss}MB · lag ${eventLoopLagMs()}ms`
}

export function startWatchdog(pingDatabase: () => Promise<void>, onFatal: (why: string) => void): void {
  const beatMin = envInt('LOG_HEARTBEAT_MIN', 15, 0)
  if (beatMin > 0) {
    setInterval(() => log.info('alive', aliveLine()), beatMin * 60_000).unref()
  }

  if (!enabled()) {
    log.info('watchdog', 'off (WATCHDOG_ENABLED=false)')
    return
  }
  const every = envInt('WATCHDOG_CHECK_SEC', 15, 5) * 1000
  const maxDbFails = envInt('WATCHDOG_DB_FAILS', 8, 2)
  const stuckMs = envInt('WATCHDOG_INGEST_STUCK_SEC', 300, 60) * 1000
  log.info('watchdog', `on · check ${every / 1000}s · exit after ${maxDbFails} failed DB checks or an ingest stuck >${stuckMs / 1000}s`)

  let busy = false
  setInterval(async () => {
    if (busy) return
    busy = true
    try {
      try {
        await pingDatabase()
      } catch {
        log.warn('watchdog', `database check failed (${dbProbe.consecutiveFails}/${maxDbFails}): ${dbProbe.lastError}`)
        if (dbProbe.consecutiveFails >= maxDbFails) return onFatal(`database unreachable for ${dbProbe.consecutiveFails} checks`)
      }
      const running = ingestRunningForMs()
      if (running > stuckMs) return onFatal(`ingest of ${ingestStats.runningDoc} stuck for ${Math.round(running / 1000)}s`)
    } finally {
      busy = false
    }
  }, every).unref()
}
