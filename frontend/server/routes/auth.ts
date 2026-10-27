import { Router, type Request, type Response } from 'express'
import { prisma } from '../../src/lib/prisma'
import { authenticateWithAd, type AdUserData } from '../../src/lib/adAuth'
import { bootstrapAdmins, devAuthEnabled, isProduction, sessionSecret, sessionTtlSec } from '../../src/server/auth/config'
import { SESSION_COOKIE, signSession } from '../../src/server/auth/sessionToken'
import { loginLimiter } from '../../src/server/auth/loginLimiter'
import { parseViewAs, resolveViewAs } from '../../src/server/viewAs'
import {
  EntraError,
  OIDC_COOKIE,
  OIDC_COOKIE_PATH,
  OIDC_TTL_SEC,
  authorizeUrl,
  decodeJwtPayload,
  entraConfig,
  entraEnabled,
  exchangeCode,
  identityFromClaims,
  newTransaction,
  openTransaction,
  safeNext,
  sealTransaction,
  type EntraIdentity,
} from '../../src/server/auth/entra'

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

type AccessResult =
  | { ok: true; userId: string; role: RoleKey; companies: string[]; receivers: string[] }
  | { ok: false; error: string; auditRole: string; auditDetail: string }

/**
 * Portal provisioning rule, shared by LDAP and Microsoft 365 (v5.7): the person must already exist
 * (added by an ADM in the permission screen) and be active. Exceptions: AUTH_BOOTSTRAP_ADMINS become
 * SA on first sign-in; development gives unknown users EU. Creates / refreshes the user row.
 */
export async function resolvePortalAccess(adUser: AdUserData, via: 'LDAP' | 'Microsoft 365'): Promise<AccessResult> {
  const adSam = adUser.samAccount.toLowerCase()
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: adUser.email }, { samAccount: adUser.samAccount }] },
    include: { companies: true, receivers: true },
  })

  if (existing && existing.isActive === false) {
    return { ok: false, error: 'บัญชีนี้ถูกปิดการใช้งานใน AIVA Portal', auditRole: existing.role, auditDetail: `บัญชีถูกปิดใช้งานใน Portal (${via}): ${adSam}` }
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
    return {
      ok: false,
      error: 'ยังไม่ได้รับสิทธิ์ใช้งาน AIVA Portal กรุณาติดต่อผู้ดูแลระบบ',
      auditRole: 'GUEST',
      auditDetail: `ผ่าน ${via === 'LDAP' ? 'AD' : via} แต่ยังไม่ได้รับสิทธิ์ใน Portal: ${adSam}`,
    }
  }

  const userId = existing?.id || adUser.samAccount
  try {
    await prisma.user.upsert({
      where: { email: existing?.email || adUser.email },
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
  return { ok: true, userId, role, companies, receivers }
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
    const access = await resolvePortalAccess(adUser, 'LDAP')
    if (!access.ok) {
      await audit(adUser.name, access.auditRole, 'login_noaccess', 'เข้าสู่ระบบไม่สำเร็จ', access.auditDetail)
      return res.status(403).json({ ok: false, kind: 'noaccess', error: access.error })
    }
    const { userId, role, companies } = access

    loginLimiter.success(sam)
    await audit(adUser.name, role, 'login_ldap', 'เข้าสู่ระบบสำเร็จ', `เข้าสู่ระบบสำเร็จผ่าน Active Directory (LDAP): ${adUser.samAccount}`)
    issueSessionCookie(req, res, userId)

    return res.json({
      ok: true,
      user: { id: userId, email: adUser.email, name: adUser.name, role, companies, oracleAccounts: access.receivers, unit: adUser.unit || 'General' },
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
/**
 * v5.10 — POST /api/auth/view-as  { target: "user:<id>" | "role:EU;co=AH;rcv=..." }
 * Validates (real SA only, target not SA / inactive), writes the audit line and returns the resolved
 * target so the browser shows exactly what the server will apply. DELETE = leave (audit only).
 * Lives under /api/auth so it is never blocked by the read-only rule of the view-as middleware.
 */
authRouter.post('/view-as', async (req, res) => {
  const real = req.sessionUser
  if (!real) return res.status(401).json({ ok: false, error: 'Unauthenticated' })
  if (String(real.role).toUpperCase() !== 'SA') return res.status(403).json({ ok: false, code: 'VIEW_AS_FORBIDDEN', error: 'เฉพาะ Super Admin' })
  const parsed = parseViewAs(req.body?.target)
  if (!parsed) return res.status(400).json({ ok: false, code: 'VIEW_AS_INVALID', error: 'รูปแบบเป้าหมายไม่ถูกต้อง' })
  const target = await resolveViewAs(parsed)
  if (!target.ok) return res.status(400).json({ ok: false, code: 'VIEW_AS_INVALID', error: target.error })
  await audit(real.name, 'SA', 'view_as_start', 'เริ่มดูในมุมมองของผู้อื่น', `ดูในมุมมอง ${target.label} (อ่านอย่างเดียว)`)
  const u = target.user
  return res.json({
    ok: true,
    label: target.label,
    user: { id: u.id, name: u.name, email: u.email, role: u.role, companies: u.companies, oracleAccounts: u.receivers ?? [] },
  })
})

authRouter.delete('/view-as', async (req, res) => {
  const real = req.sessionUser
  if (!real) return res.status(401).json({ ok: false, error: 'Unauthenticated' })
  const label = typeof req.body?.label === 'string' ? req.body.label.slice(0, 200) : ''
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 40) : 'user'
  if (String(real.role).toUpperCase() === 'SA') {
    await audit(real.name, 'SA', 'view_as_stop', 'ออกจากมุมมองของผู้อื่น', `${label || 'ไม่ระบุ'} · ${reason}`)
  }
  return res.json({ ok: true })
})

authRouter.get('/me', (req, res) => {
  if (!req.sessionUser) return res.status(401).json({ ok: false, error: 'Unauthenticated', user: null })
  const { id, email, name, role, companies, receivers } = req.sessionUser
  return res.json({ ok: true, user: { id, email, name, role, companies, oracleAccounts: receivers || [] } })
})

/**
 * GET /api/auth/providers — which sign-in methods this server offers (the login page hides the
 * Microsoft 365 tab when Entra ID is not configured). Public; reveals no configuration values.
 */
authRouter.get('/providers', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  return res.json({ ok: true, ldap: true, m365: entraEnabled() })
})

function oidcCookieOptions(req: Request) {
  return {
    httpOnly: true,
    // Lax: the callback is a top-level GET navigation from login.microsoftonline.com.
    sameSite: 'lax' as const,
    secure: isProduction() || req.secure || req.headers['x-forwarded-proto'] === 'https',
    path: OIDC_COOKIE_PATH,
  }
}

/** Callback URL registered in Entra (env first; otherwise derived from the request — dev only). */
function redirectUriFor(req: Request): string {
  const configured = entraConfig().redirectUri
  if (configured) return configured
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim()
  return `${proto}://${req.get('host')}/api/auth/microsoft/callback`
}

/** Back to the login page with a reason the page already knows how to explain. */
function loginError(res: Response, kind: 'cred' | 'noaccess' | 'timeout') {
  return res.redirect(302, `/login?method=m365&error=${kind}`)
}

/**
 * GET /api/auth/microsoft/start?next=/path — Microsoft 365 (Entra ID) sign-in, step 1.
 * Not configured: development keeps the old mock shortcut; production returns to /login with an error.
 */
authRouter.get('/microsoft/start', (req, res) => {
  if (!entraEnabled()) {
    if (devAuthEnabled()) return res.json({ ok: true, redirectUrl: '/login?method=m365&bypass=true' })
    return loginError(res, 'timeout')
  }
  const tx = newTransaction(String(req.query.next ?? '/'))
  res.cookie(OIDC_COOKIE, sealTransaction(tx, sessionSecret()), { ...oidcCookieOptions(req), maxAge: OIDC_TTL_SEC * 1000 })
  res.setHeader('Cache-Control', 'no-store')
  return res.redirect(302, authorizeUrl(entraConfig(), tx, redirectUriFor(req)))
})

/** GET /api/auth/microsoft/callback?code&state — step 2: code → id_token → Portal session. */
authRouter.get('/microsoft/callback', async (req, res) => {
  const ip = clientIp(req)
  const tx = openTransaction(req.cookies?.[OIDC_COOKIE], sessionSecret())
  res.clearCookie(OIDC_COOKIE, oidcCookieOptions(req))
  res.setHeader('Cache-Control', 'no-store')

  if (!entraEnabled()) return loginError(res, 'timeout')

  // The user cancelled, or Entra refused (consent / conditional access / not assigned to the app).
  if (req.query.error) {
    const code = String(req.query.error)
    await audit('—', 'GUEST', 'login_failed', 'เข้าสู่ระบบไม่สำเร็จ', `Microsoft 365: ${code} จาก ${ip}`)
    return loginError(res, code === 'access_denied' ? 'noaccess' : 'cred')
  }
  const code = typeof req.query.code === 'string' ? req.query.code : ''
  const state = typeof req.query.state === 'string' ? req.query.state : ''
  if (!tx || !code || !state || state !== tx.state) {
    await audit('—', 'GUEST', 'login_failed', 'เข้าสู่ระบบไม่สำเร็จ', `Microsoft 365: state ไม่ถูกต้องหรือหมดอายุ จาก ${ip}`)
    return loginError(res, 'cred')
  }

  let identity: EntraIdentity
  try {
    const cfg = entraConfig()
    const tokens = await exchangeCode(cfg, code, tx.verifier, redirectUriFor(req))
    identity = identityFromClaims(decodeJwtPayload(tokens.id_token), cfg, tx.nonce)
  } catch (e) {
    const err = e instanceof EntraError ? e : new EntraError('timeout', String((e as Error)?.message || e))
    console.warn('[auth] Microsoft 365 sign-in failed:', err.message)
    await audit('—', 'GUEST', 'login_failed', 'เข้าสู่ระบบไม่สำเร็จ', `Microsoft 365: ${err.message} จาก ${ip}`)
    return loginError(res, err.kind)
  }

  try {
    const adUser: AdUserData = { samAccount: identity.sam, name: identity.name, email: identity.email }
    const access = await resolvePortalAccess(adUser, 'Microsoft 365')
    if (!access.ok) {
      await audit(identity.name, access.auditRole, 'login_noaccess', 'เข้าสู่ระบบไม่สำเร็จ', access.auditDetail)
      return loginError(res, 'noaccess')
    }
    await audit(identity.name, access.role, 'login_m365', 'เข้าสู่ระบบสำเร็จ', `เข้าสู่ระบบสำเร็จผ่าน Microsoft 365 (Entra ID): ${identity.username}`)
    issueSessionCookie(req, res, access.userId)
    return res.redirect(302, `/login?sso=1&next=${encodeURIComponent(safeNext(tx.next))}`)
  } catch (err) {
    console.error('[auth] Microsoft 365 provisioning error:', err)
    return loginError(res, 'timeout')
  }
})

/** POST /api/auth/logout — the httpOnly cookie can only be cleared by the server. */
authRouter.post('/logout', async (req, res) => {
  const u = req.sessionUser
  if (u) await audit(u.name, u.role, 'logout', 'ออกจากระบบ', u.id)
  res.clearCookie(SESSION_COOKIE, { path: '/', httpOnly: true, sameSite: 'lax', secure: isProduction() || req.secure })
  return res.json({ ok: true })
})
