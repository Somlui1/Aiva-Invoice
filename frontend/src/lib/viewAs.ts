/**
 * v5.10 — Super Admin "ดูในมุมมองของ…" (view as), browser side.
 *
 * State lives in sessionStorage (this tab only — a new tab never starts in view-as), survives F5,
 * expires after 30 minutes, and is cleared on logout / session expiry.
 * While active, `installViewAsInterceptor()` adds `X-View-As` to every same-origin /api/* request
 * except /api/auth/* — the server then answers with the target's scope and refuses every write.
 */
import type { RoleKey } from '../types/auth'

export const VIEW_AS_STORAGE = 'aiva.viewAs.v1'
export const VIEW_AS_EVENT = 'aiva:view-as-changed'
export const VIEW_AS_TTL_MS = 30 * 60 * 1000
export const VIEW_AS_ROLES: RoleKey[] = ['EU', 'ACC', 'APR', 'ADM']
/** Request header that makes one call go out as the real SA (stripped before sending). */
export const VIEW_AS_BYPASS = 'X-View-As-Bypass'
export const PREVIEW_BLOCK_REASON = 'โหมดดูในมุมมอง · ทำรายการไม่ได้'

export type ViewAsTarget =
  | { kind: 'user'; userId: string }
  | { kind: 'role'; role: RoleKey; companies: string[]; receivers: string[] }

export interface ViewAsState {
  target: ViewAsTarget
  /** Resolved identity of the target (from the server when it answered, else local). */
  user: { id: string; name: string; email: string; role: RoleKey; companies: string[]; receivers: string[] }
  label: string
  startedAt: number
  expiresAt: number
  /** false = the server could not be asked; only the browser-side scope is simulated. */
  serverChecked: boolean
}

/** `X-View-As` value for a target. */
export function headerFor(t: ViewAsTarget): string {
  if (t.kind === 'user') return `user:${t.userId}`
  const parts = [`role:${t.role}`]
  if (t.companies.length) parts.push(`co=${t.companies.map(encodeURIComponent).join(',')}`)
  if (t.receivers.length) parts.push(`rcv=${t.receivers.map(encodeURIComponent).join(',')}`)
  return parts.join(';')
}

/** Stable identity of the active view ('' = none); used to remount the app state on a switch. */
export function viewAsKeyOf(s: ViewAsState | null): string {
  return s ? `${headerFor(s.target)}@${s.startedAt}` : ''
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

function isState(v: any): v is ViewAsState {
  return (
    !!v &&
    typeof v === 'object' &&
    !!v.target &&
    (v.target.kind === 'user' || v.target.kind === 'role') &&
    !!v.user &&
    typeof v.user.role === 'string' &&
    typeof v.expiresAt === 'number'
  )
}

/** The active, unexpired view (expired / malformed entries are removed). */
export function readViewAs(now = Date.now()): ViewAsState | null {
  const s = storage()
  if (!s) return null
  try {
    const raw = s.getItem(VIEW_AS_STORAGE)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (!isState(v) || v.expiresAt <= now || v.user.role === 'SA') {
      s.removeItem(VIEW_AS_STORAGE)
      return null
    }
    return v
  } catch {
    s.removeItem(VIEW_AS_STORAGE)
    return null
  }
}

export function writeViewAs(v: ViewAsState | null): void {
  const s = storage()
  if (!s) return
  if (v) s.setItem(VIEW_AS_STORAGE, JSON.stringify(v))
  else s.removeItem(VIEW_AS_STORAGE)
  try {
    window.dispatchEvent(new CustomEvent(VIEW_AS_EVENT, { detail: v }))
  } catch {
    /* old browsers */
  }
}

export function clearViewAs(): void {
  if (storage()?.getItem(VIEW_AS_STORAGE)) writeViewAs(null)
}

let installed = false

/** Same-origin /api/* path (not /api/auth/*) of a request, or null. */
function scopedApiPath(input: RequestInfo | URL): string | null {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const u = new URL(raw, window.location.origin)
    if (u.origin !== window.location.origin || !u.pathname.startsWith('/api/')) return null
    return u.pathname.startsWith('/api/auth/') ? null : u.pathname
  } catch {
    return null
  }
}

/** Wrap fetch once: add `X-View-As` while a view is active. */
export function installViewAsInterceptor(): void {
  if (typeof window === 'undefined' || installed || typeof window.fetch !== 'function') return
  installed = true
  const original = window.fetch.bind(window)
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const v = readViewAs()
    if (!v || !scopedApiPath(input)) return original(input, init)
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
    // The SA's own tools (e.g. the user list of the picker) opt out explicitly.
    if (headers.has(VIEW_AS_BYPASS)) {
      headers.delete(VIEW_AS_BYPASS)
      return original(input, { ...init, headers })
    }
    headers.set('X-View-As', headerFor(v.target))
    return original(input, { ...init, headers })
  }) as typeof fetch
}

/** Test hook. */
export function __resetViewAsForTests(): void {
  installed = false
  storage()?.removeItem(VIEW_AS_STORAGE)
}

/** "28 นาที" / "45 วินาที" */
export function remainingText(ms: number): string {
  if (ms <= 0) return 'หมดอายุแล้ว'
  const min = Math.floor(ms / 60000)
  return min >= 1 ? `${min} นาที` : `${Math.ceil(ms / 1000)} วินาที`
}
