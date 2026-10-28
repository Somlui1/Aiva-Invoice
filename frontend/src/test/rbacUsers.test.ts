/**
 * v5.11.1 — user / company / Oracle-account administration must really work, and the document API
 * must apply the same scope to everyone (real Express app, real Prisma / SQLite test DB).
 */
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser, cookieFor } from './helpers/session'

const app = createExpressApp()
const EMAILS = ['rb-eu@test.aapico.local', 'rb-acc@test.aapico.local', 'rb-sa2@test.aapico.local']
const DOCS = ['DMS-940001', 'DMS-940002']

afterEach(async () => {
  const users = await prisma.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } })
  await prisma.user.deleteMany({ where: { id: { in: users.map((u: { id: string }) => u.id) } } })
  await prisma.auditLog.deleteMany({ where: { docId: { in: DOCS } } })
  await prisma.document.deleteMany({ where: { id: { in: DOCS } } })
})

const save = async (cookie: string, body: Record<string, unknown>) => request(app).post('/api/users').set('Cookie', cookie).send(body)
const userByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email }, include: { companies: true, receivers: true } })

describe('POST /api/users', () => {
  it('saves companies (incl. AHA) and Oracle accounts; duplicates and spacing are cleaned', async () => {
    const adm = await asUser('rb-adm', 'ADM')
    const r1 = await save(adm, { email: 'RB-ACC@test.aapico.local', name: 'Acc', role: 'ACC', companies: ['aha', 'AH', 'AH'] })
    expect(r1.status, JSON.stringify(r1.body)).toBe(200)
    expect((await userByEmail('rb-acc@test.aapico.local'))!.companies.map((c: any) => c.companyCode).sort()).toEqual(['AH', 'AHA'])

    const r2 = await save(adm, { email: 'rb-eu@test.aapico.local', name: 'Eu', role: 'EU', receivers: ['AHT Die Making 03,  K.V', 'aht die making 03, k.v'] })
    expect(r2.status, JSON.stringify(r2.body)).toBe(200)
    expect((await userByEmail('rb-eu@test.aapico.local'))!.receivers.map((r: any) => r.receiverName)).toEqual(['AHT Die Making 03, K.V'])
  })

  it('refuses what would leave a user without scope, and unknown companies', async () => {
    const adm = await asUser('rb-adm', 'ADM')
    expect((await save(adm, { email: 'rb-eu@test.aapico.local', name: 'Eu', role: 'EU' })).status).toBe(400)
    expect((await save(adm, { email: 'rb-acc@test.aapico.local', name: 'Acc', role: 'ACC' })).status).toBe(400)
    expect((await save(adm, { email: 'rb-acc@test.aapico.local', name: 'Acc', role: 'ACC', companies: ['XYZ'] })).status).toBe(400)
  })

  it('only an SA manages SA accounts; nobody changes their own role', async () => {
    const adm = await asUser('rb-adm', 'ADM')
    expect((await save(adm, { email: 'rb-sa2@test.aapico.local', name: 'Sa2', role: 'SA' })).status).toBe(403)
    const self = await prisma.user.findUnique({ where: { id: 'rb-adm' } })
    expect((await save(adm, { email: self!.email, name: 'x', role: 'SA' })).status).toBe(403)
    const sa = await asUser('rb-sa', 'SA')
    expect((await save(sa, { email: 'rb-sa2@test.aapico.local', name: 'Sa2', role: 'SA' })).status).toBe(200)
  })
})

describe('DELETE /api/users/:id', () => {
  it('deactivates: the user is signed out at once and no longer listed as active; saving re-activates', async () => {
    const adm = await asUser('rb-adm', 'ADM')
    await save(adm, { email: 'rb-acc@test.aapico.local', name: 'Acc', role: 'ACC', companies: ['AH'] })
    const u = (await userByEmail('rb-acc@test.aapico.local'))!
    const del = await request(app).delete(`/api/users/${u.id}`).set('Cookie', adm)
    expect(del.status).toBe(200)
    expect((await request(app).get('/api/documents').set('Cookie', cookieFor(u.id))).status).toBe(401)
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.isActive).toBe(false)

    await save(adm, { email: 'rb-acc@test.aapico.local', name: 'Acc', role: 'ACC', companies: ['AH'] })
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.isActive).toBe(true)
  })

  it('cannot deactivate yourself', async () => {
    const adm = await asUser('rb-adm', 'ADM')
    expect((await request(app).delete('/api/users/rb-adm').set('Cookie', adm)).status).toBe(403)
  })
})

describe('document API: the same scope for every user (not only under "view as")', () => {
  const mk = (id: string, companyCode: string, receiverName: string | null) =>
    prisma.document.create({
      data: {
        id, dmsDocId: id, packageId: `PKG-${id}`, fileSha256: `sha256:${id}`, pageCount: 1, invoiceNum: id,
        invoiceDate: '2026-10-01', companyCode, supplierTaxId: '1', supplierName: 'S', grandTotal: 1,
        status: 'Review', recommendation: 'REVIEW', maxSeverity: 'Medium', receiverName,
        payloadJson: JSON.stringify({
          id, dmsDocId: id, packageId: `PKG-${id}`, fileSha256: `sha256:${id}`, pageCount: 1, contentKind: 'invoice',
          invoiceNum: id, invoiceDate: '2026-10-01', companyCode, companyName: companyCode, companyTaxId: '', supplierName: 'S',
          supplierTaxId: '1', currency: 'THB', subtotal: 1, vat: 0, grandTotal: 1, poNumbers: [], receiverName: receiverName ?? undefined,
          receiptFound: !!receiverName, receiptNums: [], lineItems: [], recommendation: 'REVIEW', status: 'Review', maxSeverity: 'Medium',
          stepProgress: {}, rules: [], exceptions: [], pages: [], bboxes: [], assignedRole: 'ACC', apStatus: 'unconfirmed',
          duplicateStatus: 'none', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', history: [],
        }),
      },
    })

  it('an End User lists only its Receiver; an accountant only its companies; out-of-scope reads/actions are 403', async () => {
    await mk('DMS-940001', 'AH', 'Receiver One')
    await mk('DMS-940002', 'AHT', 'Receiver Two')
    const eu = await asUser('rb-eu-x', 'EU', { companies: [], receivers: ['RECEIVER ONE'] })
    const acc = await asUser('rb-acc-x', 'ACC', { companies: ['AHT'] })

    const euList = (await request(app).get('/api/documents?limit=500').set('Cookie', eu)).body.documents.map((d: any) => d.doc)
    expect(euList).toContain('DMS-940001')
    expect(euList).not.toContain('DMS-940002')

    const accList = (await request(app).get('/api/documents?limit=500').set('Cookie', acc)).body.documents.map((d: any) => d.doc)
    expect(accList).toContain('DMS-940002')
    expect(accList).not.toContain('DMS-940001')

    expect((await request(app).get('/api/documents/DMS-940001').set('Cookie', acc)).status).toBe(403)
    expect((await request(app).post('/api/documents/DMS-940001/actions').set('Cookie', acc).send({ action: 'hold', reason: 'x' })).status).toBe(403)
    await prisma.user.deleteMany({ where: { id: { in: ['rb-eu-x', 'rb-acc-x'] } } })
  })

  it('an End User with no Oracle account sees nothing', async () => {
    await mk('DMS-940001', 'AH', 'Receiver One')
    const eu = await asUser('rb-eu-y', 'EU', { companies: ['AH'], receivers: [] })
    expect((await request(app).get('/api/documents?limit=500').set('Cookie', eu)).body.total).toBe(0)
    await prisma.user.deleteMany({ where: { id: 'rb-eu-y' } })
  })

  it('"ยังไม่เชื่อมบัญชี" is real: receiverActive follows the active End User bindings', async () => {
    await mk('DMS-940001', 'AH', 'Receiver One')
    const sa = await asUser('rb-sa-z', 'SA')
    const before = (await request(app).get('/api/documents/DMS-940001').set('Cookie', sa)).body.document
    expect(before.receiverActive).toBe(false)
    await asUser('rb-eu-z', 'EU', { receivers: ['receiver one'] })
    const after = (await request(app).get('/api/documents/DMS-940001').set('Cookie', sa)).body.document
    expect(after.receiverActive).toBe(true)
    await prisma.user.deleteMany({ where: { id: { in: ['rb-sa-z', 'rb-eu-z'] } } })
  })
})
