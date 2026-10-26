import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../src/lib/prisma'
import { USERS } from '../../src/mock/users'
import { devAuthEnabled, sessionSecret } from '../../src/server/auth/config'
import { SESSION_COOKIE, verifySession } from '../../src/server/auth/sessionToken'

export interface SessionData {
  id: string
  name: string
  email: string
  role: string
  companies: string[]
  receivers?: string[]
}

declare global {
  namespace Express {
    interface Request {
      sessionUser?: SessionData | null
    }
  }
}

/**
 * Resolves `req.sessionUser` from the signed `aiva_session` cookie — and from nothing else.
 *
 * Removed on purpose (v5.5):
 *  - the `x-user-id` header (any client could send it and become any user);
 *  - plain / unsigned cookies (`aiva_session=<id>` or a JSON blob) — every user logs in once again;
 *  - the fallback to the demo users in src/mock/users.ts, which now applies only in development /
 *    tests (`devAuthEnabled()`), never in production.
 *
 * The user row is re-read on every request, so a role change or deactivation takes effect at once.
 */
export async function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.sessionUser = null
  try {
    const claims = verifySession(req.cookies?.[SESSION_COOKIE], sessionSecret())
    if (!claims) return next()
    const userId = claims.sub

    const dbUser = await prisma.user.findFirst({
      where: { id: userId },
      include: { companies: true, receivers: true },
    })

    if (dbUser) {
      if (dbUser.isActive === false) return next()
      req.sessionUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        companies: dbUser.companies.map((c: any) => c.companyCode),
        receivers: dbUser.receivers.map((r: any) => r.receiverName),
      }
      return next()
    }

    if (devAuthEnabled()) {
      const staticUser = USERS.find(u => u.id === userId)
      if (staticUser) {
        req.sessionUser = {
          id: staticUser.id,
          name: staticUser.n,
          email: staticUser.email,
          role: staticUser.role,
          companies: staticUser.co,
          receivers: [],
        }
      }
    }
    return next()
  } catch (err) {
    console.warn('[sessionMiddleware] error:', err)
    req.sessionUser = null
    next()
  }
}
