import { Router, type Request, type Response } from 'express'
import { prisma } from '../../src/lib/prisma'
import { authenticateWithAd, type AdUserData } from '../../src/lib/adAuth'
import { bootstrapAdmins, devAuthEnabled, isProduction, sessionSecret, sessionTtlSec } from '../../src/server/auth/config'
import { SESSION_COOKIE, signSession } from '../../src/server/auth/sessionToken'
import { loginLimiter } from '../../src/server/auth/loginLimiter'

export const authRouter = Router()

const ALL_COMPANIES = ['AH', 'AHA', 'AHT', 'AHP', 'AM']
type RoleKey = 'EU' | 'ACC' | 'APR' | 'ADM' | 'SA'

function clientIp(req: Request): string {
  return String(req.ip || req.socket?.remoteAddress || 'unknown')
}

/** Signed, httpOnly cookie. `Secure` is always on in production (TLS terminates at the proxy). */
export function issueSessionCookie(req: Request, res: Response, userId: string) {
  const ttl = sessionTtlSec()
  res.cookie(SESSION_COOKIE, signSession(userId, sessionSecret(), ttl), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction() || req.secure || req.headers['x-forwarded-proto'] === 'https',
    maxAge: ttl * 1000,
    path: '/',
  })
}

async function audit(who: string, role: string, action: string, act: string, detail: string) {
  try {
    await prisma.auditLog.create({ data: { who, role, docId: 'AUTH', act, action, detail } })
  } catch {}
}

/**
 * Offline login for development / tests only (no AD reachable). Never runs in production —
 * `devAuthEnabled()` is false there whatever the environment says.
 */
async function devFallback(cleanUser: string, sam: string, password: string): Promise<AdUserData | null> {
  if (!devAuthEnabled()) return null
  if ((cleanUser === 'itsupport' || cleanUser === 'itsupport@aapico.com') && password === 'support') {
    return { samAccount: 'itsupport', name: 'IT Support', email: 'itsupport@aapico.com', unit: 'IT Support', title: 'IT Admin' }
  }
  const existing = await prisma.user.findFirst({ where: { OR: [{ samAccount: sam }, { email: cleanUser }, { id: sam }] } })
  if (existing && ['support', '1234', 'password'].includes(password)) {
    return { samAccount: existing.samAccount || existing.id, name: existing.name, email: existing.email, unit: existing.unit || 'General' }
  }
  return null
}

/**
 * POST /api/auth/ldap  { username, password }
 *
 *  400 missing input · 401 wrong credentials · 403 no Portal access (AD ok, not provisioned / inactive)
 *  423 locked (too many failures; body.retryAfterSec) · 502 AD unreachable
 *
 * Production provisioning rule: a person must already exist in the Portal (added by an ADM in the
 * permission screen) — AD membership alone gives no access. The only exception is
 * AUTH_BOOTSTRAP_ADMINS, which creates the first SA accounts.
 */
authRouter.post('/ldap', async (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ ok: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' })
    }

    const cleanUser = username.trim().toLowerCase()
    const sam = cleanUser.includes('@') ? cleanUser.split('@')[0] : cleanUser
    const ip = clientIp(req)

    const wait = loginLimiter.retryAfter(sam, ip)
    if (wait > 0) {
      return res.status(423).json({ ok: false, kind: 'locked', retryAfterSec: wait, error: 'ลองเข้าสู่ระบบผิดหลายครั้ง กรุณารอสักครู่' })
    }

    let adResult = await authenticateWithAd(cleanUser, password)
    if (!adResult.ok) {
      const dev = await devFallback(cleanUser, sam, password)
      if (dev) adResult = { ok: true, user: dev }
      else if (devAuthEnabled() && adResult.kind === 'timeout') {
        // No AD in this environment and the offline accounts did not match: a credential failure.
        adResult = { ok: false, kind: 'cred', error: 'ชื่อผู้ใช้หรือรหัสผ่าน Active Directory ไม่ถูกต้อง' }
      }
    }

    if (!adResult.ok) {
      if (adResult.kind === 'cred') loginLimiter.fail(sam, ip)
      await audit(sam, 'GUEST', 'login_failed', 'เข้าสู่ระบบไม่สำเร็จ', `${adResult.kind === 'cred' ? 'รหัสผ่านไม่ถูกต้อง' : 'เชื่อมต่อ AD ไม่ได้'}: ${sam} จาก ${ip}`)
      return res.status(adResult.kind === 'cred' ? 401 : 502).json({ ok: false, kind: adResult.kind, error: adResult.error })
    }

    const adUser = adResult.user
    const adSam = adUser.samAccount.toLowerCase()
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: adUser.email }, { samAccount: adUser.samAccount }] },
      include: { companies: true, receivers: true },
    })

    if (existing && existing.isActive === false) {
      await audit(adUser.name, existing.role, 'login_noaccess', 'เข้าสู่ระบบไม่สำเร็จ', `บัญชีถูกปิดใช้งานใน Portal: ${adSam}`)
      return res.status(403).json({ ok: false, kind: 'noaccess', error: 'บัญชีนี้ถูกปิดการใช้งานใน AIVA Portal' })
    }

    let role: RoleKey
    let companies: string[]
    let receivers: string[]
    if (existing) {
      role = existing.role as RoleKey
      companies = existing.companies.map((c: any) => c.companyCode)
      receivers = existing.receivers.map((r: any) => r.receiverName)
    } else if (bootstrapAdmins().includes(adSam)) {
      role = 'SA'
      companies = ALL_COMPANIES
      receivers = []
    } else if (devAuthEnabled()) {
      role = adSam === 'itsupport' ? 'SA' : 'EU'
      companies = ALL_COMPANIES
      receivers = []
    } else {
      await audit(adUser.name, 'GUEST', 'login_noaccess', 'เข้าสู่ระบบไม่สำเร็จ', `ผ่าน AD แต่ยังไม่ได้รับสิทธิ์ใน Portal: ${adSam}`)
      return res.status(403).json({ ok: false, kind: 'noaccess', error: 'ยังไม่ได้รับสิทธิ์ใช้งาน AIVA Portal กรุณาติดต่อผู้ดูแลระบบ' })
    }

    const userId = existing?.id || adUser.samAccount
    try {
      await prisma.user.upsert({
        where: { email: adUser.email },
        create: {
          id: userId,
          email: adUser.email,
          name: adUser.name,
          samAccount: adUser.samAccount,
          empId: adUser.empId || null,
          unit: adUser.unit || null,
          role,
          companies: { create: companies.map(c => ({ companyCode: c })) },
          receivers: { create: receivers.map(r => ({ receiverName: r, assignedBy: 'SYSTEM' })) },
        },
        update: { name: adUser.name, samAccount: adUser.samAccount, empId: adUser.empId || undefined, unit: adUser.unit || undefined },
      })
    } catch (e) {
      console.warn('[auth] user upsert warning:', e)
    }

    loginLimiter.success(sam)
    await audit(adUser.name, role, 'login_ldap', 'เข้าสู่ระบบสำเร็จ', `เข้าสู่ระบบสำเร็จผ่าน Active Directory (LDAP): ${adUser.samAccount}`)
    issueSessionCookie(req, res, userId)

    return res.json({
      ok: true,
      user: { id: userId, email: adUser.email, name: adUser.name, role, companies, oracleAccounts: receivers, unit: adUser.unit || 'General' },
    })
  } catch (err: any) {
    console.error('[auth] LDAP error:', err)
    return res.status(500).json({ ok: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' })
  }
})

/**
 * POST /api/auth/dev-login  { user: { id, name, email, role, companies, oracleAccounts } }
 * Development only: the mock login page calls this so the browser gets a real signed cookie and the
 * API behaves exactly as with a real login. 404 in production (and when AUTH_DEV_LOGIN is off).
 */
authRouter.post('/dev-login', async (req, res) => {
  if (!devAuthEnabled()) return res.status(404).json({ ok: false, error: 'Not found' })
  const u = req.body?.user
  if (!u?.id || !u?.email || !u?.role) return res.status(400).json({ ok: false, error: 'user {id, email, role} required' })
  const companies: string[] = Array.isArray(u.companies) ? u.companies : []
  const receivers: string[] = Array.isArray(u.oracleAccounts) ? u.oracleAccounts : []
  await prisma.user.upsert({
    where: { email: String(u.email) },
    create: {
      id: String(u.id),
      email: String(u.email),
      name: String(u.name || u.id),
      samAccount: String(u.id),
      role: String(u.role),
      companies: { create: companies.map(c => ({ companyCode: c })) },
      receivers: { create: receivers.map(r => ({ receiverName: r, assignedBy: 'DEV' })) },
    },
    update: {},
  })
  const row = await prisma.user.findUnique({ where: { email: String(u.email) } })
  issueSessionCookie(req, res, row?.id || String(u.id))
  return res.json({ ok: true, dev: true })
})

/** GET /api/auth/me — the signed-in user (from the session cookie only). */
authRouter.get('/me', (req, res) => {
  if (!req.sessionUser) return res.status(401).json({ ok: false, error: 'Unauthenticated', user: null })
  const { id, email, name, role, companies, receivers } = req.sessionUser
  return res.json({ ok: true, user: { id, email, name, role, companies, oracleAccounts: receivers || [] } })
})

/**
 * GET /api/auth/microsoft/start — Microsoft 365 (Entra ID) sign-in is not implemented on the server.
 * Production answers 501 instead of the old "?bypass=true" redirect.
 */
authRouter.get('/microsoft/start', (_req, res) => {
  if (!devAuthEnabled()) {
    return res.status(501).json({ ok: false, error: 'Microsoft 365 sign-in is not configured on this server' })
  }
  return res.json({ ok: true, redirectUrl: '/login?method=m365&bypass=true' })
})

/** POST /api/auth/logout — the httpOnly cookie can only be cleared by the server. */
authRouter.post('/logout', async (req, res) => {
  const u = req.sessionUser
  if (u) await audit(u.name, u.role, 'logout', 'ออกจากระบบ', u.id)
  res.clearCookie(SESSION_COOKIE, { path: '/', httpOnly: true, sameSite: 'lax', secure: isProduction() || req.secure })
  return res.json({ ok: true })
})
