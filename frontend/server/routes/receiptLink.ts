/**
 * v5.11 Phase 1 — Confirm + ผูกใบรับ API (portal server; the engine is not called).
 *
 *   GET  /api/receipts/:num                 ACC / APR / SA (CONFIRM) — Oracle receipt, only in the
 *                                           caller's companies (the old /api/oracle needs MAP)
 *   GET  /api/documents/:id/link            context for the "ผูกใบรับ" screen (+ evaluation)
 *   POST /api/documents/:id/link/evaluate   evaluation for the current form (no write)
 *   POST /api/documents/:id/link            op = save | confirm | hold | reject | close_duplicate
 *
 * Every write carries `version` (Document.updatedAt as opened) → 409 STALE when someone changed the
 * document since. "View as" writes never get here (viewAsMiddleware answers 403 PREVIEW_READ_ONLY).
 */
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma'
import { requirePerm } from '../../src/server/auth/guards'
import { loadQueueDoc } from '../../src/server/portalDocs'
import { docVisibleTo } from '../../src/server/viewAs'
import { lookupReceipt } from '../../src/server/receiptLink/oracleReceipts'
import {
  LinkError,
  assertVersion,
  documentsOnReceipt,
  engineStatusOf,
  evaluateFor,
  loadRowOr404,
  versionOf,
  type Evaluated,
} from '../../src/server/receiptLink/service'
import {
  CONFIRM_REASON_CODES,
  canOpenLink,
  confirmStatusGate,
  isApproverRole,
  needsApproverForDoc,
  reasonLabel,
  receiptInScope,
  receiptUsage,
  type Actor,
  type LinkInput,
} from '../../src/lib/receiptLink'
import type { PortalManualValue } from '../../src/features/engine/types/portalDomain'

export const receiptsRouter = Router()
export const documentLinkRouter = Router()

const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/

function actorOf(req: Request): Actor & { id: string; name: string } {
  const u = req.sessionUser!
  return { id: u.id, name: u.name, role: String(u.role || '').toUpperCase(), companies: u.companies ?? [] }
}

function fail(res: Response, err: unknown) {
  if (err instanceof LinkError) return res.status(err.status).json({ ok: false, code: err.code, error: err.message, ...err.extra })
  console.error('[receiptLink]', err)
  return res.status(500).json({ ok: false, code: 'INTERNAL', error: 'ทำรายการไม่สำเร็จ' })
}

/** The document is in the caller's scope (APR / SA also see unknown-company documents). */
function assertScope(actor: Actor, company: string, receiver?: string | null) {
  const vis = docVisibleTo({ company, receiver }, { role: actor.role, companies: actor.companies, receivers: [] })
  if (!vis.ok) throw new LinkError(403, 'OUT_OF_SCOPE', vis.why ?? 'เอกสารอยู่นอกขอบเขต')
}

// ---------------------------------------------------------------------------------------------
// GET /api/receipts/:num
// ---------------------------------------------------------------------------------------------

receiptsRouter.get('/:num', requirePerm('CONFIRM'), async (req, res) => {
  try {
    const actor = actorOf(req)
    const r = await lookupReceipt(String(req.params.num ?? ''))
    if (!r.ok) {
      return res.status(r.code === 'BAD_RECEIPT' ? 400 : 503).json({ ok: false, code: r.code, error: r.error })
    }
    if (!r.receipt) return res.status(404).json({ ok: false, code: 'RECEIPT_NOT_FOUND', error: 'ไม่พบใบรับใน Oracle' })
    if (!receiptInScope(r.receipt.companyCode, actor)) {
      return res.status(403).json({ ok: false, code: 'OUT_OF_SCOPE', error: `ใบรับอยู่บริษัท ${r.receipt.companyCode} ซึ่งไม่ได้รับมอบหมาย` })
    }
    const docId = typeof req.query.docId === 'string' && SAFE_ID.test(req.query.docId) ? req.query.docId : ''
    const usage = receiptUsage(docId, await documentsOnReceipt(r.receipt.receiptNum))
    return res.json({ ok: true, source: r.source, receipt: r.receipt, usage })
  } catch (err) {
    return fail(res, err)
  }
})

// ---------------------------------------------------------------------------------------------
// Document link screen
// ---------------------------------------------------------------------------------------------

const MANUAL = z
  .object({
    invoiceNum: z.string().max(60).optional(),
    invoiceNumConfirm: z.string().max(60).optional(),
    grandTotal: z.union([z.string().max(30), z.number()]).optional(),
    grandTotalConfirm: z.union([z.string().max(30), z.number()]).optional(),
  })
  .optional()

const FORM = z.object({
  receiptNum: z.string().max(40).nullable().optional(),
  reasonCode: z.string().max(40).nullable().optional(),
  reasonText: z.string().max(500).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
  manual: MANUAL,
  acceptReceiptCompany: z.boolean().optional(),
  acceptReceiptSupplier: z.boolean().optional(),
})

const WRITE = FORM.extend({
  op: z.enum(['save', 'confirm', 'hold', 'reject', 'close_duplicate']),
  version: z.string().min(10).max(40),
})

/** The UI document, or null when the stored payload is not a full Portal document. */
async function uiDocOrNull(id: string) {
  try {
    return await loadQueueDoc(id)
  } catch {
    return null
  }
}

function contextBody(ev: Evaluated, actor: Actor) {
  return {
    ok: true,
    version: versionOf(ev.row),
    lookup: ev.lookup,
    evaluation: ev.evaluation,
    pairs: ev.pairs,
    canOpen: canOpenLink(actor.role, ev.facts),
    savedLink: ev.payload.receiptLink ?? null,
    manualValues: ev.payload.manualValues ?? [],
  }
}

async function guardDoc(req: Request) {
  const id = String(req.params.id ?? '')
  if (!SAFE_ID.test(id)) throw new LinkError(400, 'BAD_ID', 'รหัสเอกสารไม่ถูกต้อง')
  const actor = actorOf(req)
  if (!['ACC', 'APR', 'SA'].includes(actor.role)) throw new LinkError(403, 'FORBIDDEN', 'เฉพาะฝ่ายบัญชี (ACC / APR)')
  const row = await loadRowOr404(id)
  assertScope(actor, row.companyCode, row.receiverName)
  return { id, actor, row }
}

documentLinkRouter.get('/:id/link', async (req, res) => {
  try {
    const { id, actor, row } = await guardDoc(req)
    const ev = await evaluateFor(row, actor, {})
    const document = await uiDocOrNull(id)
    return res.json({ ...contextBody(ev, actor), document })
  } catch (err) {
    return fail(res, err)
  }
})

documentLinkRouter.post('/:id/link/evaluate', async (req, res) => {
  try {
    const parsed = FORM.safeParse(req.body ?? {})
    if (!parsed.success) return res.status(400).json({ ok: false, code: 'BAD_INPUT', error: 'ข้อมูลไม่ถูกต้อง' })
    const { actor, row } = await guardDoc(req)
    const ev = await evaluateFor(row, actor, parsed.data as LinkInput)
    return res.json(contextBody(ev, actor))
  } catch (err) {
    return fail(res, err)
  }
})

documentLinkRouter.post('/:id/link', async (req, res) => {
  const parsed = WRITE.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res.status(400).json({ ok: false, code: 'BAD_INPUT', error: 'ข้อมูลไม่ถูกต้อง', issues: parsed.error.issues })
  }
  const body = parsed.data
  try {
    const { id, actor, row } = await guardDoc(req)
    assertVersion(row, body.version)

    const st = confirmStatusGate(row.status)
    if (st) throw new LinkError(422, 'BAD_STATUS', st.msg)
    const apr = needsApproverForDoc({ status: row.status, identityStatus: row.identityStatus, companyCode: row.companyCode })
    if (apr && !isApproverRole(actor.role)) throw new LinkError(403, 'APR_ONLY', `${apr}: เฉพาะหัวหน้าฝ่ายบัญชี (APR)`)

    const ev = await evaluateFor(row, actor, body as LinkInput)
    const now = new Date()
    const nowIso = now.toISOString()
    const payload: any = { ...ev.payload }
    const history = Array.isArray(payload.history) ? [...payload.history] : []
    const e = ev.evaluation
    const receipt = ev.lookup.state === 'found' ? ev.lookup.receipt : null
    const data: Record<string, unknown> = {}
    let act = ''
    let toStatus = row.status
    let reason = ''
    const note = String(body.note ?? '').trim()

    // -- receipt + manual values (save and confirm both write them) ------------------------------
    const writeLinkAndManual = () => {
      if (receipt && (e.receiptManual || !payload.receiptLink)) {
        payload.receiptLink = {
          receiptNum: receipt.receiptNum,
          receiver: receipt.receiver,
          manual: e.receiptManual,
          companyFromReceipt: e.effective.companyFromReceipt,
          supplierFromReceipt: e.effective.supplierFromReceipt,
          orgId: receipt.orgId,
          receiptTotal: receipt.total,
          byId: actor.id,
          byName: actor.name,
          at: nowIso,
        }
        data.receiptNum = receipt.receiptNum
        data.receiptManual = e.receiptManual
        data.linkedBy = actor.id
        data.linkedAt = now
        if (receipt.receiver) {
          data.receiverName = receipt.receiver
          payload.receiverName = receipt.receiver
        }
        if (e.effective.companyFromReceipt) {
          data.companyCode = e.effective.companyCode
          payload.companyCode = e.effective.companyCode
          if (receipt.orgId != null) payload.orgId = receipt.orgId
        }
        if (e.effective.supplierFromReceipt) {
          data.supplierTaxId = e.effective.supplierTaxId
          data.supplierName = e.effective.supplierName
          payload.supplierTaxId = e.effective.supplierTaxId
          payload.supplierName = e.effective.supplierName
        }
      }
      const mv: PortalManualValue[] = Array.isArray(payload.manualValues) ? [...payload.manualValues] : []
      const why = reasonLabel(body.reasonCode, body.reasonText) || 'OCR อ่านไม่ได้'
      const put = (field: PortalManualValue['field'], value: string | number, ocrValue: string | number | null) => {
        const i = mv.findIndex(x => x.field === field)
        const item = { field, value, ocrValue, byId: actor.id, byName: actor.name, at: nowIso, reason: why }
        if (i >= 0) mv[i] = item
        else mv.push(item)
      }
      // The OCR columns (invoiceNum / grandTotal) are kept as read; only the effective values move.
      if (e.requireManualInvoiceNum && e.effective.invoiceNum && e.effective.invoiceNum !== row.invoiceNum) {
        put('invoiceNum', e.effective.invoiceNum, row.invoiceNum || null)
      }
      if (e.requireManualTotal && e.effective.grandTotal != null) put('grandTotal', e.effective.grandTotal, row.grandTotal || null)
      if (mv.length) {
        payload.manualValues = mv
        data.hasManualValues = true
      }
    }

    switch (body.op) {
      case 'save': {
        if (receipt && ev.evaluation.gates.some(g => g.key === 'company_mismatch' || g.key === 'rcv_scope' || g.key === 'rcv_company_unknown')) {
          throw new LinkError(422, 'RECEIPT_REFUSED', ev.evaluation.gates.find(g => g.level === 'block')!.msg)
        }
        if (body.receiptNum && !receipt) {
          throw new LinkError(422, 'RECEIPT_NOT_USABLE', ev.evaluation.gates.find(g => g.key.startsWith('rcv_'))?.msg ?? 'ใช้ใบรับนี้ไม่ได้')
        }
        writeLinkAndManual()
        act = 'บันทึกการผูกใบรับ'
        reason = receipt ? `ใบรับ ${receipt.receiptNum}` : 'บันทึกค่า'
        break
      }
      case 'confirm': {
        if (e.duplicateOf) {
          throw new LinkError(409, 'DUPLICATE_IN_AP', e.gates.find(g => g.key === 'duplicate')!.msg, { duplicateOf: e.duplicateOf, evaluation: e })
        }
        if (!e.canConfirm) throw new LinkError(422, 'NOT_READY', `ยังขาด: ${e.missing.join(' · ')}`, { evaluation: e })
        if (e.requireReason && body.reasonCode && !CONFIRM_REASON_CODES.includes(body.reasonCode)) {
          throw new LinkError(400, 'BAD_REASON', 'เหตุผลไม่อยู่ในรายการ')
        }
        writeLinkAndManual()
        toStatus = 'Confirmed'
        act = 'Confirm (ผูกใบรับ)'
        reason = reasonLabel(body.reasonCode, body.reasonText)
        const codes = ev.facts.codes.map(c => c.code)
        const engineStatus = engineStatusOf(row.recommendation)
        payload.confirmMeta = {
          statusAtConfirm: row.status,
          engineStatus,
          outsideAutoPass: row.status !== 'Auto-pass',
          codes,
          reasonCode: body.reasonCode ?? null,
          reasonText: body.reasonCode === 'OTHER' ? String(body.reasonText ?? '').trim() : null,
          note: note || null,
          receiptManual: e.receiptManual,
          byId: actor.id,
          byName: actor.name,
          byRole: actor.role,
          at: nowIso,
        }
        Object.assign(data, {
          status: 'Confirmed',
          confirmedBy: actor.id,
          confirmedAt: now,
          engineStatus,
          confirmOutsideAutopass: row.status !== 'Auto-pass',
          confirmReasonCode: body.reasonCode ?? null,
          confirmReasonText: body.reasonCode === 'OTHER' ? String(body.reasonText ?? '').trim() : null,
          confirmNote: note || null,
          confirmCodes: JSON.stringify(codes),
        })
        break
      }
      case 'hold': {
        if (!['Auto-pass', 'Review', 'Manual Review', 'Hold'].includes(row.status)) {
          throw new LinkError(422, 'BAD_STATUS', `Hold จากสถานะ ${row.status} ไม่ได้`)
        }
        toStatus = 'Hold'
        act = 'Hold รอใบรับ'
        reason = 'รอใบรับ'
        data.status = 'Hold'
        break
      }
      case 'reject': {
        if (note.length < 3) throw new LinkError(400, 'NOTE_REQUIRED', 'การปฏิเสธต้องระบุเหตุผลในหมายเหตุ')
        toStatus = 'Rejected'
        act = 'Reject'
        reason = note
        data.status = 'Rejected'
        break
      }
      case 'close_duplicate': {
        if (!e.duplicateOf) throw new LinkError(422, 'NOT_DUPLICATE', 'ไม่พบเอกสารเดิมที่ซ้ำ (เลขใบแจ้งหนี้ + ผู้ขาย) ที่อยู่ใน AP flow')
        toStatus = 'Duplicate'
        act = 'ปิดเป็นเอกสารซ้ำ'
        reason = `ซ้ำกับ ${e.duplicateOf}`
        data.status = 'Duplicate'
        data.duplicateOfId = e.duplicateOf
        data.drRule = 'MANUAL'
        payload.duplicateOf = e.duplicateOf
        payload.dupRule = 'MANUAL'
        break
      }
    }

    const detail = [`${actor.name} (${actor.role})`, reason, note && body.op !== 'reject' ? note : '', e.receiptManual && receipt ? `ใบรับกรอกเอง ${receipt.receiptNum}` : '']
      .filter(Boolean)
      .join(' · ')
    history.push({
      dt: nowIso.slice(0, 10),
      t: now.toTimeString().slice(0, 8),
      who: actor.name,
      role: actor.role,
      act: toStatus !== row.status ? `${act} (${row.status} → ${toStatus})` : act,
      d: detail,
      detail,
      k: body.op === 'confirm' ? 'g' : body.op === 'save' ? 'h' : 'c',
      rs: reason,
      nt: note,
    })
    payload.history = history
    payload.status = toStatus
    payload.updatedAt = nowIso
    data.payloadJson = JSON.stringify(payload)

    // Atomic version check: only the row as opened is updated.
    const written = await prisma.$transaction(async tx => {
      const upd = await tx.document.updateMany({ where: { id, updatedAt: row.updatedAt }, data: data as any })
      if (upd.count !== 1) return false
      await tx.auditLog.create({
        data: {
          docId: id,
          whoId: actor.id,
          who: actor.name,
          role: actor.role,
          act,
          action: `LINK_${body.op.toUpperCase()}`,
          fromStatus: row.status,
          toStatus,
          reason,
          note,
          detail,
          ipAddress: req.ip ?? null,
        },
      })
      return true
    })
    if (!written) throw new LinkError(409, 'STALE', 'เอกสารถูกแก้ไขพร้อมกันโดยผู้อื่น · โหลดหน้าใหม่')

    const fresh = await loadRowOr404(id)
    const document = await uiDocOrNull(id)
    return res.json({ ok: true, message: `${act} สำเร็จ`, version: versionOf(fresh), document })
  } catch (err) {
    return fail(res, err)
  }
})
