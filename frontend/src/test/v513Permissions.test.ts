/**
 * v5.13 — the permission Matrix is the truth: what it shows is what the UI and the server allow.
 * + ยกเลิก Confirm (UNCONFIRM): ACC and APR, Confirmed → Review only · POST (Batch): APR / SA only.
 */
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createExpressApp } from '../../server/app'
import { prisma } from '../lib/prisma'
import { asUser } from './helpers/session'
import { ROLES } from '../mock/users'
import { MATRIX_PERMISSIONS } from '../lib/permissionMatrix'
import { ACTION_PERMISSION, transitionFor, type WorkflowAction } from '../lib/docTransitions'
import { hasPermission } from '../server/auth/guards'
import type { RoleKey } from '../types/auth'

const app = createExpressApp()
const ROLE_KEYS = Object.keys(ROLES) as RoleKey[]
const ACTIONS = Object.keys(ACTION_PERMISSION) as WorkflowAction[]
/** a status each action is valid from (so only the role decides) */
const FROM: Record<WorkflowAction, string> = {
  confirm: 'Review',
  review: 'Hold',
  hold: 'Review',
  reject: 'Review',
  unconfirm: 'Confirmed',
  returnf: 'Import Failed',
}

describe('Matrix ↔ rules', () => {
  it('every granted permission has a Matrix row, and every row is granted to someone', () => {
    const granted = new Set(ROLE_KEYS.flatMap(r => ROLES[r].p))
    for (const p of granted) expect(MATRIX_PERMISSIONS, p).toContain(p)
    for (const p of MATRIX_PERMISSIONS) expect(granted.has(p), p).toBe(true)
    expect(granted.has('DUP_OVERRIDE')).toBe(false)
  })

  for (const role of ROLE_KEYS)
    for (const action of ACTIONS)
      it(`${role} · ${action}: server rule follows the Matrix`, () => {
        const r = transitionFor({ status: FROM[action], hasReceipt: true, role, identityStatus: 'RESOLVED' }, action)
        const allowed = role !== 'EU' && ROLES[role].p.includes(ACTION_PERMISSION[action])
        expect(r.ok).toBe(allowed)
      })

  it('ยกเลิก Confirm: ACC + APR + SA, not ADM / EU; POST: APR + SA only', () => {
    expect(ROLE_KEYS.filter(r => hasPermission(r, 'UNCONFIRM')).sort()).toEqual(['ACC', 'APR', 'SA'])
    expect(ROLE_KEYS.filter(r => hasPermission(r, 'POST')).sort()).toEqual(['APR', 'SA'])
  })

  it('ยกเลิก Confirm only before the batch is sent', () => {
    for (const s of ['Review', 'Sent', 'Posted', 'Import Failed']) {
      expect(transitionFor({ status: s, hasReceipt: true, role: 'ACC' }, 'unconfirm').ok, s).toBe(false)
    }
    expect(transitionFor({ status: 'Confirmed', hasReceipt: true, role: 'ACC' }, 'unconfirm')).toEqual({ ok: true, to: 'Review', reasonRequired: true })
  })
})

describe('server: ยกเลิก Confirm / Batch', () => {
  const ID = 'DMS-951399'
  const mk = () =>
    prisma.document.create({
      data: {
        id: ID, dmsDocId: ID, packageId: `PKG-${ID}`, fileSha256: `sha256:${ID}`, pageCount: 1, invoiceNum: ID,
        invoiceDate: '2026-10-01', companyCode: 'AH', supplierTaxId: '1', supplierName: 'S', grandTotal: 1,
        status: 'Confirmed', recommendation: 'REVIEW', maxSeverity: 'Medium', receiverName: null, confirmedBy: 'v513-acc-u',
        payloadJson: JSON.stringify({
          id: ID, dmsDocId: ID, packageId: `PKG-${ID}`, fileSha256: `sha256:${ID}`, pageCount: 1, contentKind: 'invoice',
          invoiceNum: ID, invoiceDate: '2026-10-01', companyCode: 'AH', companyName: 'AH', companyTaxId: '', supplierName: 'S',
          supplierTaxId: '1', currency: 'THB', subtotal: 1, vat: 0, grandTotal: 1, poNumbers: [], receiptFound: false, receiptNums: [],
          lineItems: [], recommendation: 'REVIEW', status: 'Confirmed', maxSeverity: 'Medium', stepProgress: {}, rules: [], exceptions: [],
          pages: [], bboxes: [], assignedRole: 'ACC', apStatus: 'confirmed', duplicateStatus: 'none',
          createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', history: [],
        }),
      },
    })

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { docId: ID } })
    await prisma.document.deleteMany({ where: { id: ID } })
    await prisma.user.deleteMany({ where: { id: { in: ['v513-acc-u', 'v513-adm-u', 'v513-sa-u'] } } })
  })

  it('ACC cancels a Confirm (reason required) → Review, confirmedBy cleared, audit written', async () => {
    await mk()
    const acc = await asUser('v513-acc-u', 'ACC', { companies: ['AH'] })
    const noReason = await request(app).post(`/api/documents/${ID}/actions`).set('Cookie', acc).send({ action: 'unconfirm' })
    expect(noReason.status).toBe(400)
    const adm = await asUser('v513-adm-u', 'ADM')
    expect((await request(app).post(`/api/documents/${ID}/actions`).set('Cookie', adm).send({ action: 'unconfirm', reason: 'x' })).status).toBe(403)

    const ok = await request(app).post(`/api/documents/${ID}/actions`).set('Cookie', acc).send({ action: 'unconfirm', reason: 'Confirm ผิดฉบับ' })
    expect(ok.status, JSON.stringify(ok.body)).toBe(200)
    const row = await prisma.document.findUnique({ where: { id: ID } })
    expect(row?.status).toBe('Review')
    expect(row?.confirmedBy).toBeNull()
    expect(await prisma.auditLog.count({ where: { docId: ID, action: 'UNCONFIRM' } })).toBe(1)

    // a second click (stale screen) is refused, nothing written twice
    const again = await request(app).post(`/api/documents/${ID}/actions`).set('Cookie', acc).send({ action: 'unconfirm', reason: 'Confirm ผิดฉบับ' })
    expect(again.status).toBe(422)
  })

  it('Batch: ACC / ADM refused, SA passes the permission check', async () => {
    const send = async (cookie: string) => request(app).post('/api/ap/batches').set('Cookie', cookie).send({ documentIds: [] })
    expect((await send(await asUser('v513-acc-u', 'ACC', { companies: ['AH'] }))).status).toBe(403)
    expect((await send(await asUser('v513-adm-u', 'ADM'))).status).toBe(403)
    expect((await send(await asUser('v513-sa-u', 'SA'))).status).toBe(400) // past the guard: "เลือกเอกสารอย่างน้อย 1 ฉบับ"
  })
})
