/**
 * Session guard (v5.7) — keeps the React state and the server's `aiva_session` cookie in step.
 *
 * The problem it solves (DMS-401 / state desync): the SPA restores "who am I" from localStorage, but
 * the only thing the API trusts is the signed httpOnly cookie. When the cookie expires (8 h TTL), is
 * revoked, or the server restarts with a new AUTH_SECRET, the UI still looks signed in while every
 * call — including `/api/documents/:id/pdf` — answers 401.
 *
 * Two mechanisms, one exit:
 *  1. `verifySession()`   — asks `GET /api/auth/me` (on app load and when the tab becomes visible again).
 *  2. `installSessionInterceptor()` — wraps `window.fetch` once; any same-origin `/api/*` 401 while the
 *     client believes it is signed in means the session is gone.
 *  Both call `expireSession()`: clear the cached profile, remember a one-shot notice, and send the
 *  browser to `/login?expired=1&next=<where the user was>`. The login page shows
 *  "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่".
 *
 * Note: the cookie is httpOnly, so the browser can never read it — "is there a session" can only be
 * answered by the server. That is why the check is a request and not a cookie lookup.
 */

import { clearViewAs } from './viewAs'

export const AUTH_USER_KEY = 'aiva.auth.user'
export const AUTH_PROFILE_KEY = 'aiva.auth.profile'
/** sessionStorage flag: the next /login render shows the "session expired" notice. */
export const SESSION_EXPIRED_FLAG = 'aiva.auth.expired'
export const SESSION_EXPIRED_EVENT = 'aiva:session-expired'
export const SESSION_EXPIRED_MESSAGE = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'

/**
 * 401s from these endpoints are answers, not an expired session: a wrong password on the login
 * form, the probe itself, logout.
 */
const AUTH_EXEMPT = [
  '/api/auth/ldap',
  '/api/auth/dev-login',
  '/api/auth/microsoft',
  '/api/auth/providers',
  '/api/auth/logout',
  '/api/auth/me',
]

let expiring = false
let installed = false
let navigate = (url: string) => window.location.replace(url)

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

/** True when the SPA has a cached signed-in profile (i.e. the UI believes it is logged in). */
export function hasClientSession(): boolean {
  const s = storage()
  if (!s) return false
  return !!(s.getItem(AUTH_PROFILE_KEY) || s.getItem(AUTH_USER_KEY))
}

export function clearClientSession(): void {
  const s = storage()
  if (!s) return
  s.removeItem(AUTH_USER_KEY)
  s.removeItem(AUTH_PROFILE_KEY)
}

/** Path of a same-origin `/api/*` request, or null for anything else. */
export function apiPathOf(input: RequestInfo | URL): string | null {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const u = new URL(raw, base)
    if (typeof window !== 'undefined' && u.origin !== window.location.origin) return null
    return u.pathname.startsWith('/api/') ? u.pathname : null
  } catch {
    return null
  }
}

export function isSessionExpiryResponse(path: string | null, status: number): boolean {
  if (status !== 401 || !path) return false
  return !AUTH_EXEMPT.some(p => path === p || path.startsWith(`${p}/`))
}

/** Login URL that brings the user back to where they were after signing in again. */
export function loginUrlForExpiry(loc: Pick<Location, 'pathname' | 'search'> | null): string {
  const here = loc ? `${loc.pathname}${loc.search}` : '/'
  const next = here.startsWith('/login') ? '' : `&next=${encodeURIComponent(here)}`
  return `/login?expired=1${next}`
}

/**
 * The single exit for an expired / invalid session. Idempotent: ten parallel 401s produce one
 * redirect. Full navigation (not pushState) so every context restarts clean.
 */
export function expireSession(reason = 'unauthenticated'): void {
  if (typeof window === 'undefined' || expiring) return
  expiring = true
  clearClientSession()
  clearViewAs() // v5.10: a new sign-in never starts inside an old "view as"
  try {
    window.sessionStorage.setItem(SESSION_EXPIRED_FLAG, reason)
  } catch {
    /* private mode: the ?expired=1 query still carries the notice */
  }
  try {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }))
  } catch {
    /* old browsers */
  }
  if (!window.location.pathname.startsWith('/login')) {
    navigate(loginUrlForExpiry(window.location))
  } else {
    expiring = false
  }
}

/** Read-and-clear the one-shot "session expired" notice for the login page. */
export function consumeExpiredNotice(search: string): boolean {
  let flagged = false
  try {
    flagged = !!window.sessionStorage.getItem(SESSION_EXPIRED_FLAG)
    window.sessionStorage.removeItem(SESSION_EXPIRED_FLAG)
  } catch {
    /* ignore */
  }
  return flagged || new URLSearchParams(search).get('expired') === '1'
}

export interface ServerSessionUser {
  id: string
  email?: string
  name?: string
  role?: string
  companies?: string[]
  oracleAccounts?: string[]
  unit?: string
}

export type SessionCheck =
  | { state: 'valid'; user: ServerSessionUser }
  | { state: 'invalid' }
  /** Network down / 5xx: say nothing — a flaky link must not sign people out. */
  | { state: 'unknown' }

/** Ask the server who the cookie belongs to. Never throws. */
/** Structural fetch type (the global `typeof fetch` also carries `preconnect` under bun-types). */
export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function verifySession(fetchImpl: FetchLike = fetch): Promise<SessionCheck> {
  try {
    const res = await fetchImpl('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
    if (res.status === 401) return { state: 'invalid' }
    if (!res.ok) return { state: 'unknown' }
    const data = (await res.json().catch(() => null)) as { ok?: boolean; user?: ServerSessionUser } | null
    return data?.ok && data.user ? { state: 'valid', user: data.user } : { state: 'invalid' }
  } catch {
    return { state: 'unknown' }
  }
}

/**
 * Wrap `window.fetch` once so any `/api/*` 401 ends the session cleanly. Requests made before the
 * user signs in (no cached profile) are left alone — the login page handles its own errors.
 */
export function installSessionInterceptor(): void {
  if (typeof window === 'undefined' || installed || typeof window.fetch !== 'function') return
  installed = true
  const original = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await original(input, init)
    if (res.status === 401 && hasClientSession() && isSessionExpiryResponse(apiPathOf(input), res.status)) {
      expireSession('api_401')
    }
    return res
  }) as typeof fetch
}

/** Re-check the session when a tab that sat in the background for a while becomes visible again. */
export function watchSessionOnFocus(minIntervalMs = 60_000): () => void {
  if (typeof document === 'undefined') return () => {}
  let last = Date.now()
  const onVisible = () => {
    if (document.visibilityState !== 'visible' || !hasClientSession()) return
    if (Date.now() - last < minIntervalMs) return
    last = Date.now()
    void verifySession().then(r => {
      if (r.state === 'invalid') expireSession('revalidate')
    })
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}

/** Test hook: reset the module's one-shot guards and (optionally) capture navigation. */
export function __resetSessionGuardForTests(nav?: (url: string) => void): void {
  expiring = false
  installed = false
  navigate = nav ?? ((url: string) => window.location.replace(url))
}
