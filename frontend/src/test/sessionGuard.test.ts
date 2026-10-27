/**
 * v5.7 — session guard: React state ↔ aiva_session cookie (DMS-401 / state desync).
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_PROFILE_KEY,
  AUTH_USER_KEY,
  SESSION_EXPIRED_EVENT,
  SESSION_EXPIRED_FLAG,
  __resetSessionGuardForTests,
  apiPathOf,
  consumeExpiredNotice,
  expireSession,
  installSessionInterceptor,
  isSessionExpiryResponse,
  loginUrlForExpiry,
  verifySession,
} from '../lib/session'

const signIn = () => {
  localStorage.setItem(AUTH_USER_KEY, 'u4')
  localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify({ id: 'u4', role: 'ACC' }))
}
const res = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('session guard', () => {
  let nav: ReturnType<typeof vi.fn>
  const realFetch = window.fetch

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    nav = vi.fn()
    __resetSessionGuardForTests(nav)
  })
  afterEach(() => {
    window.fetch = realFetch
  })

  it('treats a 401 from a data API as an expired session, but not from the auth endpoints', () => {
    expect(isSessionExpiryResponse('/api/documents/DMS-1/pdf', 401)).toBe(true)
    expect(isSessionExpiryResponse('/api/documents', 403)).toBe(false)
    expect(isSessionExpiryResponse('/api/auth/ldap', 401)).toBe(false)
    expect(isSessionExpiryResponse('/api/auth/me', 401)).toBe(false)
    expect(isSessionExpiryResponse(null, 401)).toBe(false)
  })

  it('only same-origin /api/* paths are watched', () => {
    expect(apiPathOf('/api/documents?x=1')).toBe('/api/documents')
    expect(apiPathOf('https://login.microsoftonline.com/api/x')).toBeNull()
    expect(apiPathOf('/assets/app.js')).toBeNull()
  })

  it('brings the user back where they were', () => {
    expect(loginUrlForExpiry({ pathname: '/ap', search: '?b=1' })).toBe('/login?expired=1&next=%2Fap%3Fb%3D1')
    expect(loginUrlForExpiry({ pathname: '/login', search: '' })).toBe('/login?expired=1')
  })

  it('expireSession clears the cached profile, flags the notice, fires the event and redirects once', () => {
    signIn()
    const onEvent = vi.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, onEvent)
    expireSession('test')
    expireSession('test-again')
    expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull()
    expect(localStorage.getItem(AUTH_PROFILE_KEY)).toBeNull()
    expect(sessionStorage.getItem(SESSION_EXPIRED_FLAG)).toBe('test')
    expect(onEvent).toHaveBeenCalledTimes(1)
    expect(nav).toHaveBeenCalledTimes(1)
    expect(nav.mock.calls[0][0]).toMatch(/^\/login\?expired=1/)
    window.removeEventListener(SESSION_EXPIRED_EVENT, onEvent)
  })

  it('the fetch interceptor ends the session on a PDF 401 while signed in', async () => {
    signIn()
    window.fetch = vi.fn(async () => res(401, { code: 'UNAUTHENTICATED' })) as any
    installSessionInterceptor()
    const r = await fetch('/api/documents/DMS-7/pdf')
    expect(r.status).toBe(401) // the caller still gets its response
    expect(nav).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(AUTH_PROFILE_KEY)).toBeNull()
  })

  it('the interceptor ignores 401s when nobody is signed in (login page) and wrong passwords', async () => {
    window.fetch = vi.fn(async () => res(401)) as any
    installSessionInterceptor()
    await fetch('/api/documents')
    signIn()
    await fetch('/api/auth/ldap', { method: 'POST' })
    expect(nav).not.toHaveBeenCalled()
  })

  it('verifySession: valid / invalid / unknown (network trouble never signs people out)', async () => {
    expect(await verifySession(async () => res(200, { ok: true, user: { id: 'u4' } }))).toEqual({ state: 'valid', user: { id: 'u4' } })
    expect((await verifySession(async () => res(401))).state).toBe('invalid')
    expect((await verifySession(async () => res(503))).state).toBe('unknown')
    expect((await verifySession(async () => { throw new Error('offline') })).state).toBe('unknown')
  })

  it('the login page notice is one-shot', () => {
    sessionStorage.setItem(SESSION_EXPIRED_FLAG, 'x')
    expect(consumeExpiredNotice('')).toBe(true)
    expect(consumeExpiredNotice('')).toBe(false)
    expect(consumeExpiredNotice('?expired=1')).toBe(true)
  })
})
