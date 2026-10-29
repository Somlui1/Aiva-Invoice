/**
 * v5.13 — (1) "?" assignable to accountants · (2) company master sync is saved and used.
 * Real Express app + SQLite test DB. Cleans the Company table afterwards (other files expect it empty).
 */
import request from 'supertest'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser } from './helpers/session'
import { BUILTIN_COMPANIES, COMPANIES, applyCompanyMaster, assignableCompanies, companyOfOrg, companyOfTax } from '../mock/companies'

const app = createExpressApp()
const DOC = 'DMS-951301'
const EMAIL = 'v513-acc@test.aapico.local'
const NEW_TAX = '0105599999991'

const restoreBuiltin = () =>
  applyCompanyMaster(Object.entries(BUILTIN_COMPANIES).filter(([k]) => k !== '?').map(([code, c]) => ({ code, ...c })))

afterEach(async () => {
  await prisma.document.deleteMany({ where: { id: DOC } })
  const u = await prisma.user.findMany({ where: { email: EMAIL }, select: { id: true } })
  await prisma.user.deleteMany({ where: { id: { in: u.map((x: { id: string }) => x.id) } } })
})
afterAll(async () => {
  await prisma.company.deleteMany({})
  await prisma.auditLog.deleteMany({ where: { docId: 'MASTER_DATA' } })
  await prisma.user.deleteMany({ where: { id: { in: ['v513-adm', 'v513-sa', 'v513-acc-q'] } } })
  restoreBuiltin()
})

describe('v5.13 "?" company is assignable', () => {
  it('assignable list ends with "?"', () => {
    const list = assignableCompanies()
    expect(list[list.length - 1]).toBe('?')
    expect(list).toContain('AH')
  })

  it('ADM can give an accountant "?" and that accountant sees the unknown-company document', async () => {
    const adm = await asUser('v513-adm', 'ADM')
    const r = await request(app).post('/api/users').set('Cookie', adm).send({ email: EMAIL, name: 'Q', role: 'ACC', companies: ['?'] })
    expect(r.status, JSON.stringify(r.body)).toBe(200)

    await prisma.document.create({
      data: {
        id: DOC, dmsDocId: DOC, packageId: `PKG-${DOC}`, fileSha256: `sha256:${DOC}`, pageCount: 1, invoiceNum: DOC,
        invoiceDate: '2026-10-01', companyCode: '?', supplierTaxId: '1', supplierName: 'S', grandTotal: 1,
        status: 'Review', recommendation: 'REVIEW', maxSeverity: 'Medium', receiverName: null,
        payloadJson: JSON.stringify({
          id: DOC, dmsDocId: DOC, packageId: `PKG-${DOC}`, fileSha256: `sha256:${DOC}`, pageCount: 1, contentKind: 'invoice',
          invoiceNum: DOC, invoiceDate: '2026-10-01', companyCode: '?', companyName: '?', companyTaxId: '', supplierName: 'S',
          supplierTaxId: '1', currency: 'THB', subtotal: 1, vat: 0, grandTotal: 1, poNumbers: [], receiptFound: false, receiptNums: [],
          lineItems: [], recommendation: 'REVIEW', status: 'Review', maxSeverity: 'Medium', stepProgress: {}, rules: [], exceptions: [],
          pages: [], bboxes: [], assignedRole: 'ACC', apStatus: 'unconfirmed', duplicateStatus: 'none',
          createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', history: [],
        }),
      },
    })
    const q = await asUser('v513-acc-q', 'ACC', { companies: ['?'] })
    const ah = await asUser('v513-acc-ah', 'ACC', { companies: ['AH'] })
    const seenQ = (await request(app).get('/api/documents?limit=500').set('Cookie', q)).body.documents.map((d: any) => d.doc)
    const seenAh = (await request(app).get('/api/documents?limit=500').set('Cookie', ah)).body.documents.map((d: any) => d.doc)
    expect(seenQ).toContain(DOC)
    expect(seenAh).not.toContain(DOC)
    await prisma.user.deleteMany({ where: { id: 'v513-acc-ah' } })
  })
})

describe('v5.13 company master sync', () => {
  it('import (SA only) saves known companies, parks unknown Tax IDs as pending, activation makes them usable', async () => {
    const adm = await asUser('v513-adm', 'ADM')
    const feed = {
      companies: [
        { tax: '0107545000179', name: 'AAPICO HITECH PCL', orgs: [{ id: 101 }, { id: 103 }, { id: 222 }, { id: 9001, name: 'AH NEW OU' }] },
        { tax: NEW_TAX, name: 'NEW SUBSIDIARY CO LTD', orgs: [{ id: 556, name: 'MGP' }] },
      ],
    }
    expect((await request(app).post('/api/oracle/sync-companies').set('Cookie', adm).send(feed)).status).toBe(403)

    const sa = await asUser('v513-sa', 'SA')
    const res = await request(app).post('/api/oracle/sync-companies').set('Cookie', sa).send(feed)
    expect(res.status, JSON.stringify(res.body)).toBe(200)
    expect(res.body.source).toBe('import')
    expect(res.body.persisted).toBe(true)
    expect(res.body.result.updated).toContain('AH')
    expect(res.body.pending.map((p: any) => p.tax)).toContain(NEW_TAX)

    // saved + applied in memory: new ORG_ID resolves to AH; built-in companies stay
    expect(companyOfOrg(9001)).toBe('AH')
    expect(Object.keys(COMPANIES)).toEqual(expect.arrayContaining(['AH', 'AHT', 'AHP', 'AHA', 'AM', '?']))
    // pending is not used for matching yet
    expect(companyOfTax(NEW_TAX)).toBe('?')

    const bad = await request(app).post('/api/oracle/companies/activate').set('Cookie', adm).send({ tax: NEW_TAX, code: 'AH' })
    expect(bad.status).toBe(409)
    const ok = await request(app).post('/api/oracle/companies/activate').set('Cookie', adm).send({ tax: NEW_TAX, code: 'ngs' })
    expect(ok.status, JSON.stringify(ok.body)).toBe(200)
    expect(ok.body.company.code).toBe('NGS')
    expect(companyOfTax(NEW_TAX)).toBe('NGS')
    // ORG 556 moved from "?" to the real company
    expect(companyOfOrg(556)).toBe('NGS')
    expect(COMPANIES['?'].orgs).not.toContain(556)
    // and it can now be assigned
    expect(assignableCompanies()).toContain('NGS')

    const list = await request(app).get('/api/companies').set('Cookie', await asUser('v513-acc-q', 'ACC', { companies: ['AH'] }))
    expect(list.status).toBe(200)
    expect(list.body.companies.map((c: any) => c.code)).toEqual(expect.arrayContaining(['NGS', '?']))
    expect(list.body.pending).toBeUndefined()
  })
})
