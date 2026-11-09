/**
 * v5.16 — the one clock of the Portal UI.
 *
 * Before: `TODAY = '2026-10-07'` (the mockup's frozen day) drove "วันนี้ / 7 วัน / เดือนนี้ / เดือนก่อน",
 * ages and history stamps — so the queue stayed on ต.ค. forever and documents arriving in a later
 * month were filtered out of the default "เดือนนี้" view.
 *
 * Now every "today" is the CLIENT's local calendar day (browser time zone). On the server the same
 * functions use the process time zone (set TZ=Asia/Bangkok in Docker).
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar day of `d` as YYYY-MM-DD (never UTC — `toISOString()` would be a day off before 07:00 in Thailand). */
export function localDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today on this client, YYYY-MM-DD. Call it — never cache it in a module constant. */
export function todayISO(): string {
  return localDay(new Date())
}

/** Local wall-clock time HH:MM:SS. */
export function localTime(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const HAS_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/
const DAY = /^(\d{4}-\d{2}-\d{2})/

/**
 * Calendar day of a stored timestamp, in local time.
 *  - full timestamp ("2026-10-31T23:30:00Z" / "+07:00") → converted to the local day ("2026-11-01" in TH)
 *  - date only ("2026-10-05") → unchanged (an invoice date is a calendar day, not an instant)
 */
export function isoToLocalDay(iso: string | null | undefined): string {
  if (!iso || typeof iso !== 'string') return ''
  if (HAS_TIME.test(iso)) {
    const t = new Date(iso)
    if (!Number.isNaN(t.getTime())) return localDay(t)
  }
  const m = DAY.exec(iso)
  return m ? m[1] : ''
}

/** Local HH:MM:SS of a stored timestamp ('' for a date-only value). */
export function isoToLocalTime(iso: string | null | undefined): string {
  if (!iso || typeof iso !== 'string' || !HAS_TIME.test(iso)) return ''
  const t = new Date(iso)
  return Number.isNaN(t.getTime()) ? '' : localTime(t)
}

/** Whole days from `fromDay` to `toDay` (both YYYY-MM-DD); 0 when either is missing. */
export function daysBetween(fromDay: string | undefined, toDay: string = todayISO()): number {
  if (!fromDay || !DAY.test(fromDay) || !DAY.test(toDay)) return 0
  const a = Date.UTC(+fromDay.slice(0, 4), +fromDay.slice(5, 7) - 1, +fromDay.slice(8, 10))
  const b = Date.UTC(+toDay.slice(0, 4), +toDay.slice(5, 7) - 1, +toDay.slice(8, 10))
  return Math.round((b - a) / 864e5)
}

/** Milliseconds until the next local midnight (+1 s), for re-rendering date filters at day change. */
export function msUntilNextLocalDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
  return Math.max(1_000, next.getTime() - now.getTime())
}
