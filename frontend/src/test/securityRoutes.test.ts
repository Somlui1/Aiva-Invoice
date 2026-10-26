/**
 * v5.5 security — every guard, through the real Express app (supertest + test database).
 * Plan: docs/plans/2026-10-26-production-hardening.md
 */
import { describe, it, expect, afterEach } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { asUser, cookieFor } from './helpers/session'

const app = createExpressApp()

afterEach(() => {
  delete process.env.ENGINE_INGEST_KEY
  delete process.env.ORACLE_CALLBACK_KEY
})

describe('no session = 401 on every protected route', () => {
  const protectedRoutes: [string, string][] = [
    ['get', '/api/documents'],
    ['get', '/api/documents/DMS-100'],
    ['get', '/api/documents/DMS-100/pdf'],
    ['post', '/api/documents/DMS-100/actions'],
    ['get', '/api/users'],
    ['post', '/api/users'],
    ['get', '/api/ad/search?q=somsak'],
    ['get', '/api/audit-logs'],
    ['get', '/api/ap/batches'],
    ['post', '/api/ap/batches'],
    ['post', '/api/oracle/sync-companies'],
  ]
  for (const [m, url] of protectedRoutes) {
    it(`${m.toUpperCase()} ${url}`, async () => {
      const res = await (request(app) as any)[m](url)
        .set('x-user-id', 'wajeepradit.p')
        .set('x-user-role', 'SA')
        .set('x-user-name', 'forged')
        .send({})
      expect(res.status).toBe(401)
    })
  }
})

describe('permissions come from the ROLES table', () => {
  it('EU cannot manage users, read the AD, sync Oracle or see AP batches', async () => {
    const eu = await asUser('sec-eu', 'EU', { receivers: ['RCV-1'] })
    expect((await request(app).get('/api/users').set('Cookie', eu)).status).toBe(403)
    expect((await request(app).post('/api/users').set('Cookie', eu).send({})).status).toBe(403)
    expect((await request(app).get('/api/ad/search?q=a').set('Cookie', eu)).status).toBe(403)
    expect((await request(app).post('/api/oracle/sync-companies').set('Cookie', eu)).status).toBe(403)
    expect((await request(app).get('/api/ap/batches').set('Cookie', eu)).status).toBe(403)
  })

  it('ACC sees AP batches but cannot send one (APR / ADM only)', async () => {
    const acc = await asUser('sec-acc', 'ACC', { companies: ['AH'] })
    expect((await request(app).get('/api/ap/batches').set('Cookie', acc)).status).toBe(200)
    const send = await request(app)
      .post('/api/ap/batches')
      .set('Cookie', acc)
      .set('x-user-role', 'APR') // forged header: ignored
      .send({ documentIds: ['DMS-100'], companyCode: 'AH' })
    expect(send.status).toBe(403)
  })

  it('ADM manages users', async () => {
    const adm = await asUser('sec-adm', 'ADM')
    expect((await request(app).get('/api/users').set('Cookie', adm)).status).toBe(200)
  })

  it('a role change applies on the next request (no re-login)', async () => {
    const c = await asUser('sec-flip', 'ADM')
    expect((await request(app).get('/api/users').set('Cookie', c)).status).toBe(200)
    await asUser('sec-flip', 'EU')
    expect((await request(app).get('/api/users').set('Cookie', c)).status).toBe(403)
  })

  it('a deactivated user is signed out at once', async () => {
    const c = await asUser('sec-off', 'ACC')
    await asUser('sec-off', 'ACC', { isActive: false })
    expect((await request(app).get('/api/documents').set('Cookie', c)).status).toBe(401)
  })
})

describe('machine keys', () => {
  it('engine ingest: with ENGINE_INGEST_KEY set, no key / wrong key = 401, right key passes the guard', async () => {
    process.env.ENGINE_INGEST_KEY = 'engine-key-for-test'
    expect((await request(app).post('/api/engine/ingest').send({})).status).toBe(401)
    expect((await request(app).post('/api/engine/ingest').set('Authorization', 'Bearer nope').send({})).status).toBe(401)
    // a signed-in person is not the Engine
    const sa = await asUser('sec-sa', 'SA')
    expect((await request(app).post('/api/engine/ingest').set('Cookie', sa).send({})).status).toBe(401)
    const ok = await request(app).post('/api/engine/ingest').set('Authorization', 'Bearer engine-key-for-test').send({})
    expect(ok.status).toBe(422) // past the guard; {} fails the contract
    const alt = await request(app).post('/api/engine/ingest').set('X-AIVA-Key', 'engine-key-for-test').send({})
    expect(alt.status).toBe(422)
  })

  it('AP callback: with ORACLE_CALLBACK_KEY set, a signed-in user cannot fake the Oracle result', async () => {
    process.env.ORACLE_CALLBACK_KEY = 'oracle-key-for-test'
    const apr = await asUser('sec-apr', 'APR')
    const res = await request(app).post('/api/ap/batches/AP-X/callback').set('Cookie', apr).send({ results: [{}] })
    expect(res.status).toBe(401)
  })
})

describe('login', () => {
  it('locks after 5 wrong passwords (HTTP 423 with retryAfterSec)', async () => {
    let last = 0
    for (let i = 0; i < 5; i++) {
      last = (await request(app).post('/api/auth/ldap').send({ username: 'lockout.test', password: `wrong${i}` })).status
    }
    expect(last).toBe(401)
    const locked = await request(app).post('/api/auth/ldap').send({ username: 'lockout.test', password: 'whatever' })
    expect(locked.status).toBe(423)
    expect(locked.body.retryAfterSec).toBeGreaterThan(0)
  })

  it('a successful login sets a signed, httpOnly cookie that /me accepts', async () => {
    const res = await request(app).post('/api/auth/ldap').send({ username: 'itsupport', password: 'support' })
    expect(res.status).toBe(200)
    const setCookie = String(res.headers['set-cookie'] ?? '')
    expect(setCookie).toMatch(/aiva_session=v1\./)
    expect(setCookie).toMatch(/HttpOnly/i)
    const cookie = setCookie.split(';')[0]
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(me.status).toBe(200)
    expect(me.body.user.id).toBe('itsupport')
  })

  it('logout clears the cookie on the server side', async () => {
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookieFor('itsupport'))
    expect(res.status).toBe(200)
    expect(String(res.headers['set-cookie'] ?? '')).toMatch(/aiva_session=;/)
  })

  it('dev-login (test / AUTH_DEV_LOGIN only) issues a working cookie', async () => {
    const res = await request(app)
      .post('/api/auth/dev-login')
      .send({ user: { id: 'dev-acc', email: 'dev-acc@test.aapico.local', name: 'Dev Acc', role: 'ACC', companies: ['AH'], oracleAccounts: [] } })
    expect(res.status).toBe(200)
    const cookie = String(res.headers['set-cookie']).split(';')[0]
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).body.user.role).toBe('ACC')
  })
})

describe('headers', () => {
  it('sends baseline security headers and hides the framework', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
