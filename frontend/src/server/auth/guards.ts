/**
 * Route guards. Identity comes ONLY from the verified session (server/middleware/session.ts).
 * Headers such as x-user-id / x-user-role / x-user-name are never trusted — anyone can send them.
 *
 * Permissions are the same table the UI uses (`ROLES[role].p` in src/mock/users.ts), so a menu the
 * UI hides is also refused by the server.
 */
import type { NextFunction, Request, Response } from 'express'
import { ROLES } from '../../mock/users'
import type { Permission, RoleKey } from '../../types/auth'
import { integrationKey, isProduction } from './config'
import { safeEqual } from './sessionToken'

type Mw = (req: Request, res: Response, next: NextFunction) => void

export function permissionsOf(role: string | undefined | null): readonly Permission[] {
  return (role && ROLES[role as RoleKey]?.p) || []
}

export function hasPermission(role: string | undefined | null, perm: Permission): boolean {
  return permissionsOf(role).includes(perm)
}

const unauthenticated = (res: Response) =>
  res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบ', code: 'UNAUTHENTICATED' })
const forbidden = (res: Response, what: string) =>
  res.status(403).json({ ok: false, error: `ไม่มีสิทธิ์ ${what}`, code: 'FORBIDDEN' })

export const requireAuth: Mw = (req, res, next) => {
  if (!req.sessionUser) return void unauthenticated(res)
  next()
}

/** Signed in and holding at least one of the permissions. */
export function requirePerm(...perms: Permission[]): Mw {
  return (req, res, next) => {
    const u = req.sessionUser
    if (!u) return void unauthenticated(res)
    if (!perms.some(p => hasPermission(u.role, p))) return void forbidden(res, perms.join(' / '))
    next()
  }
}

/** Signed in with one of the roles (use only where the rule is about a role, not a permission). */
export function requireRole(...roles: RoleKey[]): Mw {
  return (req, res, next) => {
    const u = req.sessionUser
    if (!u) return void unauthenticated(res)
    if (!roles.includes(u.role as RoleKey)) return void forbidden(res, `(${roles.join(', ')})`)
    next()
  }
}

/** The key a machine caller sent: `Authorization: Bearer <key>` or `X-AIVA-Key: <key>`. */
export function presentedKey(req: Pick<Request, 'headers'>): string {
  const auth = String(req.headers['authorization'] ?? '')
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim()
  return String(req.headers['x-aiva-key'] ?? '').trim()
}

/**
 * Machine-to-machine calls (engine push, Oracle callback).
 * Production: the key must be configured and match — no key configured = refuse everything.
 * Elsewhere: no key configured = open (local development and the test suite).
 */
export function requireIntegrationKey(name: 'engine' | 'oracle'): Mw {
  return (req, res, next) => {
    const expected = integrationKey(name)
    if (!expected) {
      if (isProduction()) {
        return void res.status(503).json({ ok: false, error: `integration key for ${name} is not configured`, code: 'KEY_NOT_CONFIGURED' })
      }
      return next()
    }
    const got = presentedKey(req)
    if (!got || !safeEqual(got, expected)) {
      return void res.status(401).json({ ok: false, error: 'invalid integration key', code: 'BAD_KEY' })
    }
    next()
  }
}

/** Either a valid integration key or a signed-in user. */
export function requireKeyOrAuth(name: 'engine' | 'oracle'): Mw {
  const byKey = requireIntegrationKey(name)
  return (req, res, next) => {
    if (req.sessionUser) return next()
    if (!integrationKey(name) && !isProduction()) return void unauthenticated(res)
    byKey(req, res, next)
  }
}
