/** v5.14 — GET /api/users/receivers (MAP only) */
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser } from './helpers/session'

const app = createExpressApp()
const ID = 'DMS-951401'

afterAll(async () => {
  await prisma.document.deleteMany({ where: { id: ID } })
  await prisma.user.deleteMany({ where: { id: { in: ['v514-adm', 'v514-acc'] } } })
})

describe('GET /api/users/receivers', () => {
  it('lists receivers found on documents for MAP holders; others are refused', async () => {
    await prisma.document.create({
      data: {
        id: ID, dmsDocId: ID, packageId: `PKG-${ID}`, fileSha256: `sha256:${ID}`, pageCount: 1, invoiceNum: ID,
        invoiceDate: '2026-10-01', companyCode: 'AHT', supplierTaxId: '1', supplierName: 'S', grandTotal: 1,
        status: 'Review', recommendation: 'REVIEW', maxSeverity: 'Medium', receiverName: 'V514 Receiver, K.Test',
        payloadJson: '{}',
      },
    })
    const adm = await asUser('v514-adm', 'ADM')
    const res = await request(app).get('/api/users/receivers').set('Cookie', adm)
    expect(res.status).toBe(200)
    const hit = res.body.receivers.find((r: any) => r.name === 'V514 Receiver, K.Test')
    expect(hit).toMatchObject({ docs: 1, companies: ['AHT'] })

    const acc = await asUser('v514-acc', 'ACC', { companies: ['AHT'] })
    expect((await request(app).get('/api/users/receivers').set('Cookie', acc)).status).toBe(403)
  })
})
