/**
 * v5.7 — Microsoft 365 (Entra ID) sign-in: OIDC helpers + /api/auth/microsoft/* routes.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { asUser } from './helpers/session'
import { sessionSecret, productionConfigProblems } from '../server/auth/config'
import {
  EntraError,
  OIDC_COOKIE,
  authorizeUrl,
  entraConfig,
  entraConfigProblems,
  identityFromClaims,
  newTransaction,
  openTransaction,
  pkceChallenge,
  safeNext,
  sealTransaction,
} from '../server/auth/entra'

const TENANT = '11111111-2222-3333-4444-555555555555'
const CLIENT = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const ENV = {
  ENTRA_TENANT_ID: TENANT,
  ENTRA_CLIENT_ID: CLIENT,
  ENTRA_CLIENT_SECRET: 'top-secret',
  ENTRA_REDIRECT_URI: 'https://aiva.test/api/auth/microsoft/callback',
}
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
const idToken = (claims: Record<string, unknown>) => `${b64({ alg: 'RS256' })}.${b64(claims)}.sig`
const claimsFor = (nonce: string, over: Record<string, unknown> = {}) => ({
  aud: CLIENT,
  tid: TENANT,
  iss: `https://login.microsoftonline.com/${TENANT}/v2.0`,
  exp: Math.floor(Date.now() / 1000) + 600,
  nonce,
  preferred_username: 'Somsak.J@aapico.com',
  name: 'สมศักดิ์ ใจดี',
  oid: 'oid-1',
  ...over,
})

describe('Entra OIDC helpers', () => {
  const cfg = entraConfig(ENV)

  it('PKCE S256 challenge is base64url(sha256(verifier))', () => {
    // RFC 7636 appendix B
    expect(pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('the state cookie is signed and expires', () => {
    const tx = newTransaction('/ap')
    const sealed = sealTransaction(tx, 'k'.repeat(40))
    expect(openTransaction(sealed, 'k'.repeat(40))?.state).toBe(tx.state)
    expect(openTransaction(sealed, 'x'.repeat(40))).toBeNull()
    expect(openTransaction(sealed.replace(/.$/, c => (c === 'A' ? 'B' : 'A')), 'k'.repeat(40))).toBeNull()
    expect(openTransaction(sealed, 'k'.repeat(40), tx.exp + 1)).toBeNull()
  })

  it('next is always an in-app path', () => {
    expect(safeNext('/queue')).toBe('/queue')
    expect(safeNext('//evil.example')).toBe('/')
    expect(safeNext('https://evil.example')).toBe('/')
    expect(safeNext('/api/auth/logout')).toBe('/')
  })

  it('authorize URL: code + PKCE + nonce on the tenant endpoint', () => {
    const tx = newTransaction('/')
    const u = new URL(authorizeUrl(cfg, tx, ENV.ENTRA_REDIRECT_URI))
    expect(u.origin + u.pathname).toBe(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`)
    expect(u.searchParams.get('response_type')).toBe('code')
    expect(u.searchParams.get('code_challenge_method')).toBe('S256')
    expect(u.searchParams.get('nonce')).toBe(tx.nonce)
    expect(u.searchParams.get('client_id')).toBe(CLIENT)
    expect(u.searchParams.get('client_secret')).toBeNull()
  })

  it('id_token claims are checked (aud, tenant, issuer, expiry, nonce)', () => {
    const ok = identityFromClaims(claimsFor('n1'), cfg, 'n1')
    expect(ok).toMatchObject({ username: 'somsak.j@aapico.com', sam: 'somsak.j', email: 'somsak.j@aapico.com' })
    const bad = (over: Record<string, unknown>, nonce = 'n1') => () => identityFromClaims(claimsFor('n1', over), cfg, nonce)
    expect(bad({ aud: 'someone-else' })).toThrow(EntraError)
    expect(bad({ tid: '99999999-2222-3333-4444-555555555555' })).toThrow(/tenant/)
    expect(bad({ iss: 'https://evil.example/v2.0' })).toThrow(/issuer/)
    expect(bad({ exp: 1 })).toThrow(/expired/)
    expect(bad({}, 'other-nonce')).toThrow(/nonce/)
  })

  it('production config: all-or-nothing, GUID tenant, https redirect', () => {
    expect(entraConfigProblems({})).toEqual([])
    expect(entraConfigProblems(ENV)).toEqual([])
    expect(entraConfigProblems({ ENTRA_CLIENT_ID: CLIENT }).join(' ')).toMatch(/ENTRA_TENANT_ID.*ENTRA_CLIENT_SECRET/s)
    expect(entraConfigProblems({ ...ENV, ENTRA_TENANT_ID: 'common' }).join(' ')).toMatch(/GUID/)
    expect(entraConfigProblems({ ...ENV, ENTRA_REDIRECT_URI: 'http://aiva.test/cb' }).join(' ')).toMatch(/https/)
    expect(productionConfigProblems({ NODE_ENV: 'production', ENTRA_CLIENT_ID: CLIENT }).join(' ')).toMatch(/ENTRA_TENANT_ID/)
  })
})

describe('/api/auth Microsoft 365 routes', () => {
  const app = createExpressApp()
  const realFetch = globalThis.fetch

  afterEach(() => {
    vi.unstubAllEnvs()
    globalThis.fetch = realFetch
  })

  it('GET /api/auth/providers says whether M365 is configured', async () => {
    let res = await request(app).get('/api/auth/providers')
    expect(res.body).toMatchObject({ ok: true, ldap: true, m365: false })
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v)
    res = await request(app).get('/api/auth/providers')
    expect(res.body.m365).toBe(true)
    expect(JSON.stringify(res.body)).not.toContain('top-secret')
  })

  describe('configured', () => {
    beforeEach(() => {
      for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v)
    })

    it('start → 302 to Microsoft with an httpOnly state cookie', async () => {
      const res = await request(app).get('/api/auth/microsoft/start?next=%2Fap')
      expect(res.status).toBe(302)
      expect(res.headers.location).toMatch(new RegExp(`^https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize\\?`))
      const cookie = String(res.headers['set-cookie'])
      expect(cookie).toContain(`${OIDC_COOKIE}=`)
      expect(cookie).toMatch(/HttpOnly/i)
    })

    it('callback with a forged / missing state → /login?error=cred', async () => {
      const res = await request(app).get('/api/auth/microsoft/callback?code=abc&state=forged')
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/login?method=m365&error=cred')
    })

    it('callback with error=access_denied → /login?error=noaccess', async () => {
      const res = await request(app).get('/api/auth/microsoft/callback?error=access_denied')
      expect(res.headers.location).toBe('/login?method=m365&error=noaccess')
    })

    const runCallback = async (claimsOver: Record<string, unknown> = {}) => {
      const tx = newTransaction('/ap')
      const sealed = sealTransaction(tx, sessionSecret())
      globalThis.fetch = vi.fn(async () =>
        new Response(JSON.stringify({ id_token: idToken(claimsFor(tx.nonce, claimsOver)) }), { status: 200 }),
      ) as any
      return request(app)
        .get(`/api/auth/microsoft/callback?code=c0de&state=${tx.state}`)
        .set('Cookie', `${OIDC_COOKIE}=${sealed}`)
    }

    it('callback success for a provisioned user → aiva_session + /login?sso=1&next=/ap', async () => {
      await asUser('m365.user', 'ACC', { email: 'm365.user@aapico.com' })
      const res = await runCallback({ preferred_username: 'M365.User@aapico.com' })
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/login?sso=1&next=%2Fap')
      expect(String(res.headers['set-cookie'])).toContain('aiva_session=')
      const body = String((globalThis.fetch as any).mock.calls[0][1].body)
      expect(body).toContain('code_verifier=')
      expect(body).toContain('client_secret=top-secret')
    })

    it('callback for a deactivated Portal user → /login?error=noaccess, no session', async () => {
      await asUser('m365.off', 'ACC', { email: 'm365.off@aapico.com', isActive: false })
      const res = await runCallback({ preferred_username: 'm365.off@aapico.com' })
      expect(res.headers.location).toBe('/login?method=m365&error=noaccess')
      expect(String(res.headers['set-cookie'] ?? '')).not.toContain('aiva_session=v1')
    })

    it('callback with a token from another tenant → /login?error=cred', async () => {
      const res = await runCallback({ tid: '99999999-2222-3333-4444-555555555555' })
      expect(res.headers.location).toBe('/login?method=m365&error=cred')
    })
  })
})
