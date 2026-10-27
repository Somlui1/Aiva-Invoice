/**
 * Microsoft 365 sign-in (Microsoft Entra ID, OpenID Connect) — v5.7.
 *
 * Flow: Authorization Code + PKCE, confidential client (client secret stays on the server).
 *
 *   browser ─► GET /api/auth/microsoft/start?next=/x
 *               server: state + nonce + PKCE verifier → signed, httpOnly `aiva_oidc` cookie (10 min)
 *               302 → https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?...
 *   Microsoft ─► GET /api/auth/microsoft/callback?code&state
 *               server: check state (cookie) → POST /token (code + verifier + client secret)
 *                       → id_token claims: iss / aud / tid / exp / nonce checked
 *                       → same Portal provisioning rule as LDAP (must already exist in RBAC)
 *                       → `aiva_session` cookie → 302 /login?sso=1&next=/x
 *
 * The id_token arrives straight from the token endpoint over TLS in exchange for our client secret,
 * which OIDC Core §3.1.3.7 accepts in place of a signature check; the claims are still validated.
 *
 * Environment (all three required to enable; see docs/m365-entra-sso.md):
 *   ENTRA_TENANT_ID       Directory (tenant) ID — a GUID (single-tenant app)
 *   ENTRA_CLIENT_ID       Application (client) ID
 *   ENTRA_CLIENT_SECRET   Client secret *value* (Certificates & secrets)
 *   ENTRA_REDIRECT_URI    optional; default `${PUBLIC_BASE_URL}/api/auth/microsoft/callback`
 *                         or derived from the request. Must match the app registration exactly.
 *   ENTRA_AUTHORITY_HOST  optional; default https://login.microsoftonline.com
 */
import crypto from 'node:crypto'

type Env = Record<string, string | undefined>
const trim = (v: string | undefined) => (v ?? '').trim()

export const OIDC_COOKIE = 'aiva_oidc'
export const OIDC_COOKIE_PATH = '/api/auth/microsoft'
export const OIDC_TTL_SEC = 600
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface EntraConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  redirectUri: string | null
  authorityHost: string
}

export function entraConfig(env: Env = process.env): EntraConfig {
  const base = trim(env.PUBLIC_BASE_URL).replace(/\/+$/, '')
  return {
    tenantId: trim(env.ENTRA_TENANT_ID),
    clientId: trim(env.ENTRA_CLIENT_ID),
    clientSecret: trim(env.ENTRA_CLIENT_SECRET),
    redirectUri: trim(env.ENTRA_REDIRECT_URI) || (base ? `${base}/api/auth/microsoft/callback` : null),
    authorityHost: (trim(env.ENTRA_AUTHORITY_HOST) || 'https://login.microsoftonline.com').replace(/\/+$/, ''),
  }
}

/** Microsoft 365 sign-in is offered only when the three app credentials are set. */
export function entraEnabled(env: Env = process.env): boolean {
  const c = entraConfig(env)
  return !!(c.tenantId && c.clientId && c.clientSecret)
}

/** Production problems (added to productionConfigProblems). Empty when M365 is simply not used. */
export function entraConfigProblems(env: Env = process.env): string[] {
  const c = entraConfig(env)
  const any = c.tenantId || c.clientId || c.clientSecret || trim(env.ENTRA_REDIRECT_URI)
  if (!any) return []
  const p: string[] = []
  if (!c.tenantId) p.push('ENTRA_TENANT_ID: required when Microsoft 365 sign-in is configured')
  else if (!GUID.test(c.tenantId)) p.push('ENTRA_TENANT_ID: must be the Directory (tenant) ID GUID, not "common"/"organizations"')
  if (!c.clientId) p.push('ENTRA_CLIENT_ID: required when Microsoft 365 sign-in is configured')
  if (!c.clientSecret) p.push('ENTRA_CLIENT_SECRET: required when Microsoft 365 sign-in is configured')
  if (!c.redirectUri) p.push('ENTRA_REDIRECT_URI (or PUBLIC_BASE_URL): required in production')
  else if (!c.redirectUri.startsWith('https://')) p.push('ENTRA_REDIRECT_URI: must be https:// in production')
  return p
}

// ---------------------------------------------------------------------------------------------
// PKCE + signed state cookie
// ---------------------------------------------------------------------------------------------

const b64url = (b: Buffer) => b.toString('base64url')
const rnd = (n = 32) => b64url(crypto.randomBytes(n))
const hmac = (secret: string, data: string) => b64url(crypto.createHmac('sha256', secret).update(data).digest())

export interface OidcTx {
  state: string
  nonce: string
  verifier: string
  next: string
  exp: number
}

export function newTransaction(next: string, nowSec = Math.floor(Date.now() / 1000)): OidcTx {
  return { state: rnd(), nonce: rnd(), verifier: rnd(48), next: safeNext(next), exp: nowSec + OIDC_TTL_SEC }
}

export function pkceChallenge(verifier: string): string {
  return b64url(crypto.createHash('sha256').update(verifier).digest())
}

export function sealTransaction(tx: OidcTx, secret: string): string {
  const body = b64url(Buffer.from(JSON.stringify(tx), 'utf8'))
  return `${body}.${hmac(secret, `oidc.${body}`)}`
}

export function openTransaction(token: unknown, secret: string, nowSec = Math.floor(Date.now() / 1000)): OidcTx | null {
  if (typeof token !== 'string' || token.length > 4096) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const want = Buffer.from(hmac(secret, `oidc.${body}`))
  const got = Buffer.from(sig)
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null
  try {
    const tx = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as OidcTx
    if (!tx?.state || !tx.nonce || !tx.verifier || typeof tx.exp !== 'number' || tx.exp <= nowSec) return null
    return tx
  } catch {
    return null
  }
}

/** Only an in-app path may follow the sign-in (no open redirect). */
export function safeNext(next: unknown): string {
  const n = typeof next === 'string' ? next : ''
  return n.startsWith('/') && !n.startsWith('//') && !n.includes('\\') && !n.startsWith('/api/') ? n : '/'
}

export function authorizeUrl(c: EntraConfig, tx: OidcTx, redirectUri: string): string {
  const q = new URLSearchParams({
    client_id: c.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email',
    state: tx.state,
    nonce: tx.nonce,
    code_challenge: pkceChallenge(tx.verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  return `${c.authorityHost}/${encodeURIComponent(c.tenantId)}/oauth2/v2.0/authorize?${q}`
}

// ---------------------------------------------------------------------------------------------
// Token exchange + id_token claims
// ---------------------------------------------------------------------------------------------

export interface EntraIdentity {
  oid: string
  tid: string
  /** UPN / sign-in name, lower-case (e.g. wajeepradit.p@aapico.com). */
  username: string
  email: string
  name: string
  /** Local part of the UPN = sAMAccountName in a hybrid directory synced from on-prem AD. */
  sam: string
}

export class EntraError extends Error {
  constructor(
    public kind: 'cred' | 'timeout',
    message: string,
  ) {
    super(message)
  }
}

export function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split('.')
  if (parts.length !== 3) throw new EntraError('cred', 'id_token is not a JWT')
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    throw new EntraError('cred', 'id_token payload unreadable')
  }
}

/** Validate the claims Microsoft returned and turn them into a Portal identity. */
export function identityFromClaims(
  claims: Record<string, unknown>,
  c: EntraConfig,
  nonce: string,
  nowSec = Math.floor(Date.now() / 1000),
): EntraIdentity {
  const str = (k: string) => (typeof claims[k] === 'string' ? (claims[k] as string) : '')
  const tid = str('tid')
  const aud = claims.aud
  const audOk = aud === c.clientId || (Array.isArray(aud) && aud.includes(c.clientId))
  if (!audOk) throw new EntraError('cred', 'id_token audience mismatch')
  if (tid.toLowerCase() !== c.tenantId.toLowerCase()) throw new EntraError('cred', 'id_token from another tenant')
  // v2.0 endpoint issuer: https://login.microsoftonline.com/{tid}/v2.0
  if (str('iss') !== `${c.authorityHost}/${tid}/v2.0`) throw new EntraError('cred', 'id_token issuer mismatch')
  const exp = typeof claims.exp === 'number' ? claims.exp : 0
  if (exp + 300 < nowSec) throw new EntraError('cred', 'id_token expired')
  if (str('nonce') !== nonce) throw new EntraError('cred', 'id_token nonce mismatch')

  const username = (str('preferred_username') || str('upn') || str('email')).toLowerCase()
  const email = (str('email') || username).toLowerCase()
  if (!username || !username.includes('@')) throw new EntraError('cred', 'id_token has no usable sign-in name')
  return {
    oid: str('oid'),
    tid,
    username,
    email,
    name: str('name') || username,
    sam: username.split('@')[0],
  }
}

/** Exchange the authorization code for tokens (server → Microsoft, client secret attached). */
export async function exchangeCode(
  c: EntraConfig,
  code: string,
  verifier: string,
  redirectUri: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 10_000,
): Promise<{ id_token: string }> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetchImpl(`${c.authorityHost}/${encodeURIComponent(c.tenantId)}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: c.clientId,
        client_secret: c.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
        scope: 'openid profile email',
      }).toString(),
      signal: ctl.signal,
    })
    const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string; error_description?: string }
    if (!res.ok || !data.id_token) {
      // invalid_grant / invalid_client etc. are configuration or replay problems, not an outage.
      throw new EntraError(res.status >= 500 ? 'timeout' : 'cred', `token endpoint: ${data.error || res.status} ${String(data.error_description || '').split('\n')[0]}`)
    }
    return { id_token: data.id_token }
  } catch (e) {
    if (e instanceof EntraError) throw e
    throw new EntraError('timeout', `token endpoint unreachable: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}
