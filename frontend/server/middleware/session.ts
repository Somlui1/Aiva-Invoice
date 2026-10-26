import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../src/lib/prisma'
import { USERS } from '../../src/mock/users'

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

export async function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const rawCookie = req.cookies?.['aiva_session']
    const headerUserId = req.headers['x-user-id'] as string | undefined

    let userId: string | null = null

    if (rawCookie) {
      try {
        const parsed = JSON.parse(rawCookie)
        userId = parsed.id || parsed.userId || null
      } catch {
        userId = rawCookie
      }
    } else if (headerUserId) {
      userId = headerUserId
    }

    if (!userId) {
      req.sessionUser = null
      return next()
    }

    // Lookup user in DB first
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: userId }, { samAccount: userId }],
      },
      include: {
        companies: true,
        receivers: true,
      },
    })

    if (dbUser) {
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

    // Fallback to USERS in mock/users.ts if found
    const staticUser = USERS.find((u) => u.id === userId || u.email === userId)
    if (staticUser) {
      req.sessionUser = {
        id: staticUser.id,
        name: staticUser.n,
        email: staticUser.email,
        role: staticUser.role,
        companies: staticUser.co,
        receivers: [],
      }
      return next()
    }

    req.sessionUser = null
    return next()
  } catch (err) {
    console.warn('[sessionMiddleware] error:', err)
    req.sessionUser = null
    next()
  }
}
