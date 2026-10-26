/**
 * Failed-login lockout, per (username) and per (client IP). In memory: enough for one Portal
 * container; if the Portal is ever scaled out, move this to the database or Redis.
 *
 *   5 failures within 15 minutes  ->  locked for 15 minutes  (HTTP 423, the login page shows a countdown)
 *
 * The UI has its own 5-failure lock, but that is only UX — this is the one that holds.
 */
export interface LimiterOptions {
  maxFailures: number
  windowSec: number
  lockSec: number
}

const DEFAULTS: LimiterOptions = { maxFailures: 5, windowSec: 15 * 60, lockSec: 15 * 60 }

interface Entry {
  failures: number[]
  lockedUntil: number
}

export class LoginLimiter {
  private readonly map = new Map<string, Entry>()
  constructor(private readonly opt: LimiterOptions = DEFAULTS) {}

  private keys(user: string, ip: string): string[] {
    return [`u:${user.trim().toLowerCase()}`, `ip:${ip}`]
  }

  /** Seconds until the caller may try again, or 0 when not locked. */
  retryAfter(user: string, ip: string, nowSec = Date.now() / 1000): number {
    let wait = 0
    for (const k of this.keys(user, ip)) {
      const e = this.map.get(k)
      if (e && e.lockedUntil > nowSec) wait = Math.max(wait, Math.ceil(e.lockedUntil - nowSec))
    }
    return wait
  }

  fail(user: string, ip: string, nowSec = Date.now() / 1000): void {
    for (const k of this.keys(user, ip)) {
      const e = this.map.get(k) ?? { failures: [], lockedUntil: 0 }
      e.failures = [...e.failures.filter(t => t > nowSec - this.opt.windowSec), nowSec]
      // The per-IP key tolerates more (several people behind one NAT).
      const limit = k.startsWith('ip:') ? this.opt.maxFailures * 4 : this.opt.maxFailures
      if (e.failures.length >= limit) {
        e.lockedUntil = nowSec + this.opt.lockSec
        e.failures = []
      }
      this.map.set(k, e)
    }
    if (this.map.size > 10_000) this.prune(nowSec)
  }

  success(user: string): void {
    this.map.delete(`u:${user.trim().toLowerCase()}`)
  }

  private prune(nowSec: number) {
    for (const [k, e] of this.map) if (e.lockedUntil < nowSec && e.failures.every(t => t < nowSec - this.opt.windowSec)) this.map.delete(k)
  }
}

export const loginLimiter = new LoginLimiter()
