/**
 * Signed session token for the `aiva_session` cookie.
 *
 *   v1.<base64url(JSON {sub, iat, exp})>.<base64url(HMAC-SHA256(secret, "v1." + body))>
 *
 * Only the user id travels in the cookie. Role, companies and receivers are read from the database on
 * every request, so a permission change (or deactivation) takes effect on the next call, not at the
 * next login. The old cookie (plain JSON / plain user id) is rejected, so every user logs in once
 * after the upgrade.
 */
import crypto from 'node:crypto'

export const SESSION_COOKIE = 'aiva_session'

export interface SessionClaims {
  /** Portal user id. */
  sub: string
  /** Issued at / expires at, unix seconds. */
  iat: number
  exp: number
}

const b64 = (b: Buffer) => b.toString('base64url')
const mac = (secret: string, data: string) => b64(crypto.createHmac('sha256', secret).update(data).digest())

export function signSession(userId: string, secret: string, ttlSec: number, nowSec = Math.floor(Date.now() / 1000)): string {
  if (!userId) throw new Error('signSession: userId is required')
  const claims: SessionClaims = { sub: userId, iat: nowSec, exp: nowSec + ttlSec }
  const body = b64(Buffer.from(JSON.stringify(claims), 'utf8'))
  return `v1.${body}.${mac(secret, `v1.${body}`)}`
}

/** The claims of a valid, unexpired token — otherwise null (never throws). */
export function verifySession(token: unknown, secret: string, nowSec = Math.floor(Date.now() / 1000)): SessionClaims | null {
  if (typeof token !== 'string' || token.length > 2048) return null
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return null
  const expected = Buffer.from(mac(secret, `v1.${parts[1]}`))
  const given = Buffer.from(parts[2])
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null
  try {
    const c = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as SessionClaims
    if (typeof c?.sub !== 'string' || !c.sub || typeof c.exp !== 'number' || typeof c.iat !== 'number') return null
    if (c.exp <= nowSec || c.iat > nowSec + 60) return null
    return c
  } catch {
    return null
  }
}

/** Constant-time comparison for shared integration keys. */
export function safeEqual(a: string, b: string): boolean {
  const x = crypto.createHash('sha256').update(a).digest()
  const y = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(x, y) && a.length === b.length
}
