/**
 * v5.10 — Super Admin "ดูในมุมมองของ…" (view as), server side.
 *
 * The browser keeps the SA's own `aiva_session` cookie and adds `X-View-As` to every /api/* call:
 *     X-View-As: user:<userId>
 *     X-View-As: role:<EU|ACC|APR|ADM>;co=AH,AHT;rcv=AHT Die Making 03   (rcv URL-encoded)
 *
 * `viewAsMiddleware` (after the session middleware):
 *  - ignores /api/auth/* (so /api/auth/me always answers the real SA — the session guard stays honest);
 *  - only a real SA may send the header → anyone else gets 403 VIEW_AS_FORBIDDEN (never silently ignored);
 *  - a target that is SA, inactive or unknown → 400 VIEW_AS_INVALID;
 *  - replaces `req.sessionUser` with the target (so every guard / scope answers as the target would)
 *    and keeps the SA in `req.realUser`;
 *  - refuses every non-GET/HEAD request → 403 PREVIEW_READ_ONLY (a UI bug can never write data).
 */
import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { USERS } from '../mock/users'
import { devAuthEnabled } from './auth/config'
import { explainScope } from '../lib/docScope'
import type { SessionData } from '../../server/middleware/session'

export const VIEW_AS_HEADER = 'x-view-as'
export const VIEW_AS_ROLES = ['EU', 'ACC', 'APR', 'ADM'] as const
export type ViewAsRole = (typeof VIEW_AS_ROLES)[number]
const ALL_COMPANIES = ['AH', 'AHA', 'AHT', 'AHP', 'AM']

declare global {
  namespace Express {
    interface Request {
      /** The signed-in SA while `X-View-As` is active (null otherwise). */
      realUser?: SessionData | null
      /** Normalised description of the active view, for audit lines. */
      viewAs?: { kind: 'user' | 'role'; label: string } | null
    }
  }
}

export type ParsedViewAs =
  | { kind: 'user'; userId: string }
  | { kind: 'role'; role: ViewAsRole; companies: string[]; receivers: string[] }

/** Parse the header; null when malformed. Never throws. */
export function parseViewAs(raw: unknown): ParsedViewAs | null {
  if (typeof raw !== 'string') return null
  const v = raw.trim()
  if (!v || v.length > 600) return null
  if (v.startsWith('user:')) {
    const userId = v.slice(5).trim()
    return /^[\w.@-]{1,120}$/.test(userId) ? { kind: 'user', userId } : null
  }
  if (v.startsWith('role:')) {
    const [rolePart, ...opts] = v.slice(5).split(';')
    const role = rolePart.trim().toUpperCase()
    if (!(VIEW_AS_ROLES as readonly string[]).includes(role)) return null
    let companies: string[] = []
    let receivers: string[] = []
    for (const o of opts) {
      const [k, val = ''] = o.split('=')
      const list = val
        .split(',')
        .map(x => {
          try {
            return decodeURIComponent(x).trim()
          } catch {
            return ''
          }
        })
        .filter(Boolean)
      if (k.trim() === 'co') companies = list.filter(c => /^[A-Za-z0-9_-]{1,8}$/.test(c)).map(c => c.toUpperCase())
      if (k.trim() === 'rcv') receivers = list.slice(0, 20).map(r => r.slice(0, 120))
    }
    return { kind: 'role', role: role as ViewAsRole, companies, receivers }
  }
  return null
}

/** Resolve the target into the same shape as a real session. */
export async function resolveViewAs(p: ParsedViewAs): Promise<{ ok: true; user: SessionData; label: string } | { ok: false; error: string }> {
  if (p.kind === 'role') {
    const companies = p.companies.length ? p.companies : ALL_COMPANIES
    return {
      ok: true,
      user: {
        id: `view-as:${p.role}`,
        name: `มุมมอง ${p.role}`,
        email: '',
        role: p.role,
        companies,
        receivers: p.receivers,
      },
      label: `role ${p.role} · ${companies.join(',')}${p.receivers.length ? ` · ${p.receivers.join(' / ')}` : ''}`,
    }
  }
  const row = await prisma.user.findFirst({
    where: { id: p.userId },
    include: { companies: true, receivers: true },
  })
  if (row) {
    if (row.isActive === false) return { ok: false, error: 'ผู้ใช้นี้ถูกปิดการใช้งาน' }
    if (String(row.role).toUpperCase() === 'SA') return { ok: false, error: 'ดูในมุมมองของ Super Admin คนอื่นไม่ได้' }
    return {
      ok: true,
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        companies: row.companies.map((c: any) => c.companyCode),
        receivers: row.receivers.map((r: any) => r.receiverName),
      },
      label: `${row.name} (${row.role})`,
    }
  }
  if (devAuthEnabled()) {
    const u = USERS.find(x => x.id === p.userId)
    if (u && u.role !== 'SA') {
      return {
        ok: true,
        user: { id: u.id, name: u.n, email: u.email, role: u.role, companies: u.co, receivers: u.rcvName && u.rcvName !== '—' ? [u.rcvName] : [] },
        label: `${u.n} (${u.role})`,
      }
    }
  }
  return { ok: false, error: 'ไม่พบผู้ใช้ หรือเลือกผู้ใช้นี้ไม่ได้' }
}

export async function viewAsMiddleware(req: Request, res: Response, next: NextFunction) {
  req.realUser = null
  req.viewAs = null
  const raw = req.headers[VIEW_AS_HEADER]
  if (raw === undefined || req.path.startsWith('/api/auth/') || !req.path.startsWith('/api/')) return next()

  const real = req.sessionUser
  if (!real) return next() // requireAuth answers 401 as usual
  if (String(real.role).toUpperCase() !== 'SA') {
    return res.status(403).json({ ok: false, code: 'VIEW_AS_FORBIDDEN', error: 'เฉพาะ Super Admin ใช้โหมดดูในมุมมองได้' })
  }
  const parsed = parseViewAs(Array.isArray(raw) ? raw[0] : raw)
  if (!parsed) return res.status(400).json({ ok: false, code: 'VIEW_AS_INVALID', error: 'รูปแบบ X-View-As ไม่ถูกต้อง' })
  try {
    const target = await resolveViewAs(parsed)
    if (!target.ok) return res.status(400).json({ ok: false, code: 'VIEW_AS_INVALID', error: target.error })
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(403).json({ ok: false, code: 'PREVIEW_READ_ONLY', error: 'โหมดดูในมุมมอง · ทำรายการไม่ได้' })
    }
    req.realUser = real
    req.sessionUser = target.user
    req.viewAs = { kind: parsed.kind, label: target.label }
    res.setHeader('X-View-As-Active', encodeURIComponent(target.label))
    return next()
  } catch (err) {
    console.warn('[viewAs] resolve failed:', err)
    return res.status(500).json({ ok: false, error: 'resolve view-as failed' })
  }
}

// ---------------------------------------------------------------------------------------------
// Document scope (server mirror of AuthContext.scopeCheck) — same answer for the same user.
// ---------------------------------------------------------------------------------------------

export interface ScopeDoc {
  company: string
  receiver?: string | null
}

/** Same rule as the browser (src/lib/docScope.ts). */
export function docVisibleTo(d: ScopeDoc, u: Pick<SessionData, 'role' | 'companies' | 'receivers'>): { ok: boolean; why?: string } {
  return explainScope(d, { role: u.role, companies: u.companies ?? [], accounts: u.receivers ?? [] })
}

/** Write one audit line for a view-as read (best effort, never blocks the response). */
export async function auditViewAs(req: Request, docId: string, detail: string) {
  if (!req.realUser || !req.viewAs) return
  try {
    await prisma.auditLog.create({
      data: {
        who: req.realUser.name,
        role: 'SA',
        docId,
        act: 'ดูในมุมมองของผู้อื่น',
        action: 'view_as_read',
        detail: `${detail} · ในมุมมอง ${req.viewAs.label}`,
      },
    })
  } catch {
    /* audit is best effort */
  }
}
