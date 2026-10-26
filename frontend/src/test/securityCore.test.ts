/**
 * v5.5 security core — pure functions, no database, no HTTP.
 * Plan: docs/plans/2026-10-26-production-hardening.md
 */
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { signSession, verifySession, safeEqual } from '../server/auth/sessionToken'
import {
  devAuthEnabled,
  productionConfigProblems,
  sessionSecret,
  sessionTtlSec,
  simulationEnabled,
  sampleSeedEnabled,
  pdfFallbacksEnabled,
} from '../server/auth/config'
import { LoginLimiter } from '../server/auth/loginLimiter'
import { hasPermission, presentedKey, requireAuth, requirePerm, requireRole } from '../server/auth/guards'
import { escapeLdapFilter, SAM_PATTERN } from '../lib/adAuth'
import { resolveDatasourceUrl } from '../lib/prismaUrl'
import { backupPathFor, checkResetAllowed } from '../server/dbReset'
import { resolveLoginFlags } from '../features/login/config'

const SECRET = 'x'.repeat(40)
const NOW = 1_800_000_000

describe('session token', () => {
  it('round-trips the user id', () => {
    const t = signSession('u4', SECRET, 3600, NOW)
    expect(verifySession(t, SECRET, NOW + 10)?.sub).toBe('u4')
  })
  it('rejects expiry, tampering, another secret, the old formats and junk', () => {
    const t = signSession('u4', SECRET, 3600, NOW)
    expect(verifySession(t, SECRET, NOW + 3600)).toBeNull()
    const [v, body, mac] = t.split('.')
    const forged = Buffer.from(JSON.stringify({ sub: 'itsupport', iat: NOW, exp: NOW + 3600 })).toString('base64url')
    expect(verifySession(`${v}.${forged}.${mac}`, SECRET, NOW)).toBeNull()
    expect(verifySession(`${v}.${body}.${mac.slice(0, -2)}xx`, SECRET, NOW)).toBeNull()
    expect(verifySession(t, 'y'.repeat(40), NOW)).toBeNull()
    expect(verifySession('wajeepradit.p', SECRET, NOW)).toBeNull()
    expect(verifySession(JSON.stringify({ id: 'u1', role: 'SA' }), SECRET, NOW)).toBeNull()
    for (const junk of [undefined, null, 42, '', 'v1..', 'a'.repeat(5000)]) expect(verifySession(junk, SECRET, NOW)).toBeNull()
  })
  it('rejects a token issued in the future', () => {
    expect(verifySession(signSession('u4', SECRET, 3600, NOW + 600), SECRET, NOW)).toBeNull()
  })
  it('safeEqual compares keys exactly', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
})

describe('config — production fails closed', () => {
  const good = {
    NODE_ENV: 'production',
    AUTH_SECRET: 'f'.repeat(64),
    LDAP_URL: 'ldaps://dc.aapico.com:636',
    LDAP_BIND_DN: 'CN=svc-aiva,OU=ServiceAccounts,DC=aapico,DC=com',
    LDAP_BIND_PASSWORD: 's3cret!',
    LDAP_SEARCH_BASE: 'DC=aapico,DC=com',
    ENGINE_INGEST_KEY: 'k1',
    ORACLE_CALLBACK_KEY: 'k2',
    DATABASE_URL: 'file:/app/data/aiva.db',
    PAPERLESS_URL: 'https://dms.aapico.com',
    PAPERLESS_TOKEN: 't',
  }
  it('a complete configuration has no problems', () => {
    expect(productionConfigProblems(good)).toEqual([])
  })
  it('lists each unsafe setting', () => {
    const p = (over: Record<string, string | undefined>) => productionConfigProblems({ ...good, ...over }).join(' | ')
    expect(p({ AUTH_SECRET: 'short' })).toMatch(/AUTH_SECRET/)
    expect(p({ AUTH_SECRET: 'change-this-in-production-aiva-secret-key-12345' })).toMatch(/template/)
    expect(p({ LDAP_URL: 'ldap://10.10.10.250:389' })).toMatch(/ldaps/)
    expect(p({ LDAP_BIND_DN: 'itsupport@aapico.com' })).toMatch(/itsupport/)
    expect(p({ LDAP_BIND_PASSWORD: 'support' })).toMatch(/LDAP_BIND_PASSWORD/)
    expect(p({ ENGINE_INGEST_KEY: '' })).toMatch(/ENGINE_INGEST_KEY/)
    expect(p({ ORACLE_CALLBACK_KEY: '' })).toMatch(/ORACLE_CALLBACK_KEY/)
    expect(p({ PAPERLESS_TOKEN: '' })).toMatch(/PAPERLESS_TOKEN/)
    expect(p({ AUTH_DEV_LOGIN: 'true' })).toMatch(/AUTH_DEV_LOGIN/)
    expect(p({ VITE_AUTH_MOCK: 'true' })).toMatch(/VITE_AUTH_MOCK/)
  })
  it('developer shortcuts are off in production whatever the flags say', () => {
    expect(devAuthEnabled({ NODE_ENV: 'production', AUTH_DEV_LOGIN: 'true' })).toBe(false)
    expect(devAuthEnabled({ NODE_ENV: 'development', AUTH_DEV_LOGIN: 'true' })).toBe(true)
    expect(devAuthEnabled({ NODE_ENV: 'development' })).toBe(false)
    expect(simulationEnabled({ NODE_ENV: 'production' })).toBe(false)
    expect(sampleSeedEnabled({ NODE_ENV: 'production' })).toBe(false)
    expect(sampleSeedEnabled({ NODE_ENV: 'development', AIVA_SEED_SAMPLE: 'false' })).toBe(false)
    expect(pdfFallbacksEnabled({ NODE_ENV: 'production' })).toBe(false)
  })
  it('production has no session secret without AUTH_SECRET', () => {
    expect(() => sessionSecret({ NODE_ENV: 'production' })).toThrow()
    expect(sessionSecret({ NODE_ENV: 'production', AUTH_SECRET: 'z'.repeat(32) })).toBe('z'.repeat(32))
  })
  it('session lifetime: 8 h default, clamped to 1–24 h', () => {
    expect(sessionTtlSec({})).toBe(8 * 3600)
    expect(sessionTtlSec({ AUTH_SESSION_TTL_HOURS: '100' })).toBe(24 * 3600)
    expect(sessionTtlSec({ AUTH_SESSION_TTL_HOURS: '0' })).toBe(3600)
  })
})

describe('login lockout', () => {
  it('locks a user after 5 failures for 15 minutes, success clears it', () => {
    const l = new LoginLimiter()
    for (let i = 0; i < 4; i++) l.fail('somsak.j', '10.0.0.1', NOW + i)
    expect(l.retryAfter('somsak.j', '10.0.0.1', NOW + 5)).toBe(0)
    l.fail('Somsak.J', '10.0.0.1', NOW + 5)
    expect(l.retryAfter('somsak.j', '10.0.0.2', NOW + 6)).toBeGreaterThan(800)
    expect(l.retryAfter('somsak.j', '10.0.0.1', NOW + 5 + 15 * 60 + 1)).toBe(0)
    l.success('somsak.j')
    expect(l.retryAfter('somsak.j', '10.0.0.9', NOW + 7)).toBe(0)
  })
  it('old failures fall out of the window', () => {
    const l = new LoginLimiter()
    for (let i = 0; i < 4; i++) l.fail('a', 'ip', NOW + i)
    l.fail('a', 'ip', NOW + 16 * 60)
    expect(l.retryAfter('a', 'ip', NOW + 16 * 60)).toBe(0)
  })
  it('one IP trying many accounts is locked too', () => {
    const l = new LoginLimiter()
    for (let i = 0; i < 20; i++) l.fail(`user${i}`, '10.9.9.9', NOW + i)
    expect(l.retryAfter('someone-else', '10.9.9.9', NOW + 21)).toBeGreaterThan(0)
  })
})

describe('guards', () => {
  const run = (mw: any, sessionUser: any, headers: Record<string, string> = {}) => {
    let status = 200
    let nexted = false
    const res: any = { status(s: number) { status = s; return res }, json() { return res } }
    mw({ sessionUser, headers }, res, () => { nexted = true })
    return nexted ? 'next' : status
  }
  it('requireAuth', () => {
    expect(run(requireAuth, null)).toBe(401)
    expect(run(requireAuth, null, { 'x-user-id': 'u7', 'x-user-role': 'SA' })).toBe(401)
    expect(run(requireAuth, { id: 'u1', role: 'EU' })).toBe('next')
  })
  it('requirePerm uses the same ROLES table as the UI', () => {
    expect(run(requirePerm('MAP'), { id: 'a', role: 'ADM' })).toBe('next')
    expect(run(requirePerm('MAP'), { id: 'a', role: 'ACC' })).toBe(403)
    expect(run(requirePerm('VIEW_AP'), { id: 'a', role: 'EU' })).toBe(403)
    expect(run(requirePerm('VIEW_AP'), { id: 'a', role: 'ACC' })).toBe('next')
    expect(run(requirePerm('MAP'), { id: 'a', role: 'NOPE' })).toBe(403)
    expect(hasPermission('SA', 'AUDIT')).toBe(true)
  })
  it('requireRole', () => {
    expect(run(requireRole('APR', 'ADM'), { id: 'a', role: 'ACC' })).toBe(403)
    expect(run(requireRole('APR', 'ADM'), { id: 'a', role: 'APR' })).toBe('next')
  })
  it('presentedKey reads Bearer or X-AIVA-Key', () => {
    expect(presentedKey({ headers: { authorization: 'Bearer abc' } } as any)).toBe('abc')
    expect(presentedKey({ headers: { 'x-aiva-key': ' k ' } } as any)).toBe('k')
    expect(presentedKey({ headers: {} } as any)).toBe('')
  })
})

describe('LDAP input', () => {
  it('escapes filter metacharacters (RFC 4515)', () => {
    expect(escapeLdapFilter('a*)(uid=*')).toBe('a\\2a\\29\\28uid=\\2a')
    expect(escapeLdapFilter('back\\slash')).toBe('back\\5cslash')
    expect(escapeLdapFilter('somsak.j')).toBe('somsak.j')
  })
  it('accepts only plain sAMAccountNames', () => {
    expect(SAM_PATTERN.test('somsak.j')).toBe(true)
    expect(SAM_PATTERN.test('*')).toBe(false)
    expect(SAM_PATTERN.test('a)(b')).toBe(false)
  })
})

describe('database URL', () => {
  const cwd = path.resolve('/repo/frontend')
  const at = (...p: string[]) => path.resolve(cwd, ...p)
  const none = () => false
  it('relative file URLs resolve against prisma/ and never fall back to dev.db', () => {
    expect(resolveDatasourceUrl('file:./test.db', { cwd, exists: none })).toBe(`file:${at('prisma', 'test.db')}`)
    expect(resolveDatasourceUrl('file:./test.db', { cwd, exists: p => p === at('prisma', 'dev.db') })).toBe(`file:${at('prisma', 'test.db')}`)
  })
  it('old cwd-relative URLs still work when that file exists', () => {
    expect(resolveDatasourceUrl('file:./prisma/dev.db', { cwd, exists: p => p === at('prisma', 'dev.db') })).toBe(`file:${at('prisma', 'dev.db')}`)
  })
  it('absolute and server URLs pass through', () => {
    expect(resolveDatasourceUrl('file:/app/data/aiva.db', { cwd })).toBe('file:/app/data/aiva.db')
    expect(resolveDatasourceUrl('file:C:/x/prisma/test.db', { cwd })).toBe('file:C:/x/prisma/test.db')
    const ss = 'sqlserver://mssql:1433;database=aiva;encrypt=true'
    expect(resolveDatasourceUrl(ss, { cwd })).toBe(ss)
  })
  it('unset: dev finds prisma/dev.db, production gets nothing', () => {
    expect(resolveDatasourceUrl(undefined, { cwd, exists: p => p === at('prisma', 'dev.db') })).toBe(`file:${at('prisma', 'dev.db')}`)
    expect(resolveDatasourceUrl(undefined, { cwd, production: true, exists: () => true })).toBeUndefined()
  })
})

describe('db reset gate', () => {
  const cwd = path.resolve('/repo/frontend')
  const ok = { cwd, yes: true, nodeEnv: 'development' }
  it('allows the local dev/test/staging files with --yes', () => {
    for (const u of ['file:./dev.db', 'file:./test.db', 'file:./staging.db', 'file:./uat-2.db']) {
      expect(checkResetAllowed({ ...ok, databaseUrl: u }).ok, u).toBe(true)
    }
  })
  it('refuses production, SQL Server, other folders, other names, and missing --yes', () => {
    const r = (o: any) => checkResetAllowed({ ...ok, ...o })
    expect(r({ nodeEnv: 'production', databaseUrl: 'file:./dev.db' }).ok).toBe(false)
    expect(r({ databaseUrl: 'sqlserver://mssql:1433;database=aiva' }).ok).toBe(false)
    expect(r({ databaseUrl: `file:${path.resolve('/app/data/aiva.db')}` }).ok).toBe(false)
    expect(r({ databaseUrl: 'file:./aiva.db' }).ok).toBe(false)
    expect(r({ databaseUrl: 'file:./dev.db', yes: false }).ok).toBe(false)
    expect(r({ databaseUrl: undefined }).ok).toBe(false)
  })
  it('backups go to prisma/backups with a timestamp', () => {
    const file = path.resolve(cwd, 'prisma', 'dev.db')
    expect(backupPathFor(file, new Date(2026, 9, 26, 14, 5, 9))).toBe(path.join(cwd, 'prisma', 'backups', 'dev-20261026-140509.db'))
  })
})

describe('login page flags (Vite)', () => {
  it('a production build never mocks or bypasses, whatever the variables say', () => {
    expect(resolveLoginFlags({ PROD: true, MODE: 'production', VITE_AUTH_MOCK: 'true', VITE_AUTH_BYPASS: 'true' })).toEqual({ mock: false, bypass: false })
  })
  it('dev server defaults to mock; flags can turn it off', () => {
    expect(resolveLoginFlags({ DEV: true, MODE: 'development' })).toEqual({ mock: true, bypass: true })
    expect(resolveLoginFlags({ DEV: true, MODE: 'development', VITE_AUTH_MOCK: 'false' })).toEqual({ mock: false, bypass: false })
    expect(resolveLoginFlags({ DEV: true, MODE: 'development', VITE_AUTH_BYPASS: 'false' })).toEqual({ mock: true, bypass: false })
  })
  it('the old bug: an empty env (process.env = {}) is not "development" any more', () => {
    expect(resolveLoginFlags({})).toEqual({ mock: false, bypass: false })
  })
})
