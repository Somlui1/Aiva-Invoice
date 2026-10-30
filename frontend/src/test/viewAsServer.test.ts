/**
 * v5.10 — SA "view as": server side (X-View-As).
 */
import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createExpressApp } from '../../server/app'
import { asUser } from './helpers/session'
import { prisma } from '../lib/prisma'
import { docVisibleTo, parseViewAs } from '../server/viewAs'

describe('parseViewAs', () => {
  it('reads user and role targets, rejects anything else', () => {
    expect(parseViewAs('user:u4')).toEqual({ kind: 'user', userId: 'u4' })
    expect(parseViewAs('role:eu;co=aht,AH;rcv=AHT%20Die%20Making%2003%2C%20K.V')).toEqual({
      kind: 'role',
      role: 'EU',
      companies: ['AHT', 'AH'],
      receivers: ['AHT Die Making 03, K.V'],
    })
    for (const bad of ['role:SA', 'user:../x', 'x', '', 'role:', 42]) expect(parseViewAs(bad as any)).toBeNull()
  })

  it('scope rule = the browser rule', () => {
    const doc = { company: 'AHT', receiver: 'R1' }
    expect(docVisibleTo(doc, { role: 'EU', companies: ['AHT'], receivers: ['R1'] }).ok).toBe(true)
    expect(docVisibleTo(doc, { role: 'EU', companies: ['AHT'], receivers: ['R2'] }).ok).toBe(false)
    expect(docVisibleTo(doc, { role: 'ACC', companies: ['AH'], receivers: [] }).ok).toBe(false)
    expect(docVisibleTo(doc, { role: 'ADM', companies: [], receivers: [] }).ok).toBe(false)
  })
})

describe('X-View-As on the API', () => {
  const app = createExpressApp()

  it('only a real SA may send it', async () => {
    const acc = await asUser('va-acc', 'ACC')
    const res = await request(app).get('/api/documents').set('Cookie', acc).set('X-View-As', 'role:EU')
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('VIEW_AS_FORBIDDEN')
  })

  it('malformed / SA targets are refused', async () => {
    const sa = await asUser('va-sa', 'SA')
    await asUser('va-sa2', 'SA')
    expect((await request(app).get('/api/documents').set('Cookie', sa).set('X-View-As', 'role:SA')).status).toBe(400)
    expect((await request(app).get('/api/documents').set('Cookie', sa).set('X-View-As', 'user:va-sa2')).status).toBe(400)
  })

  it('v5.14: writes run as the target (debugging) and are recorded under the real SA', async () => {
    const sa = await asUser('va-sa', 'SA', { name: 'SA Real' })
    const asAdm = await request(app)
      .post('/api/documents/DMS-VA-NONE/actions')
      .set('Cookie', sa)
      .set('X-View-As', 'role:ADM')
      .send({ action: 'confirm', reason: 'x' })
    expect(asAdm.body.code).not.toBe('PREVIEW_READ_ONLY')
    const log = await prisma.auditLog.findFirst({ where: { action: 'view_as_write', docId: 'DMS-VA-NONE' }, orderBy: { createdAt: 'desc' } })
    expect(log?.who).toBe('SA Real')
    expect(log?.detail).toContain('role ADM')
    await prisma.auditLog.deleteMany({ where: { action: 'view_as_write', docId: 'DMS-VA-NONE' } })
  })

  it('VIEW_AS_ACTIONS=off restores read-only', async () => {
    const sa = await asUser('va-sa', 'SA')
    process.env.VIEW_AS_ACTIONS = 'off'
    try {
      const res = await request(app)
        .post('/api/documents/DMS-1/actions')
        .set('Cookie', sa)
        .set('X-View-As', 'role:ACC;co=AH')
        .send({ action: 'confirm' })
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('PREVIEW_READ_ONLY')
    } finally {
      delete process.env.VIEW_AS_ACTIONS
    }
  })

  it('reads answer with the target scope; ADM sees no documents', async () => {
    const sa = await asUser('va-sa', 'SA')
    const own = await request(app).get('/api/documents').set('Cookie', sa)
    const adm = await request(app).get('/api/documents').set('Cookie', sa).set('X-View-As', 'role:ADM')
    expect(adm.status).toBe(200)
    expect(adm.headers['x-view-as-active']).toBeTruthy()
    expect(adm.body.total).toBe(0)
    if (own.body.total > 0) {
      const co = own.body.documents[0].company
      const one = await request(app).get('/api/documents').set('Cookie', sa).set('X-View-As', `role:ACC;co=${co}`)
      expect(one.body.documents.every((d: any) => d.company === co)).toBe(true)
    }
  })

  it('/api/auth/* is never re-scoped: /me still answers the real SA', async () => {
    const sa = await asUser('va-sa', 'SA', { name: 'Real SA' })
    const me = await request(app).get('/api/auth/me').set('Cookie', sa).set('X-View-As', 'role:EU')
    expect(me.status).toBe(200)
    expect(me.body.user.role).toBe('SA')
  })

  it('POST /api/auth/view-as resolves the target; a non-SA is refused', async () => {
    const sa = await asUser('va-sa', 'SA')
    await asUser('va-eu', 'EU', { name: 'Receiver One', companies: ['AHT'], receivers: ['R1'] })
    const ok = await request(app).post('/api/auth/view-as').set('Cookie', sa).send({ target: 'user:va-eu' })
    expect(ok.status).toBe(200)
    expect(ok.body.user).toMatchObject({ id: 'va-eu', role: 'EU', companies: ['AHT'], oracleAccounts: ['R1'] })
    const acc = await asUser('va-acc', 'ACC')
    expect((await request(app).post('/api/auth/view-as').set('Cookie', acc).send({ target: 'role:EU' })).status).toBe(403)
  })
})
