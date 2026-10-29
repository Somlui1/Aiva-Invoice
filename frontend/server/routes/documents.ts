import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma'
import { loadQueueDocs } from '../../src/server/portalDocs'
import { docDateFor, matchesSearchQuery, sortDocsFor } from '../../src/lib/queueFilters'
import type { InvoiceDoc } from '../../src/types/invoice'
import { auditViewAs, docVisibleTo } from '../../src/server/viewAs'
import { simulationEnabled } from '../../src/server/auth/config'
import { EU_CODES } from '../../src/mock/rules'
import { publishDocEvent } from '../../src/server/events'
import { canBindReceipt, transitionFor } from '../../src/lib/docTransitions'
import { findReceiveIdHolder, holderMessage, receiveIdOf } from '../../src/server/receiveIdGuard'
import { decideBind } from '../../src/server/duplicateResolution'
import { buildSecondaryKey, normalizeReceiveId, type DocumentIdentity } from '../../src/server/businessKey'
import { lookupReceipt, receiptTotalOf, ReceiptLookupUnavailable } from '../../src/server/receiptLookup'

export const documentsRouter = Router()

const STATUS_VALUES = [
  'Auto-pass',
  'Review',
  'Hold',
  'Manual Review',
  'Duplicate',
  'Confirmed',
  'Posted',
  'Sent',
  'Rejected',
  'Superseded',
  'Import Failed',
] as const

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const isoDate = z
  .string()
  .regex(DATE_RE, 'expected YYYY-MM-DD')
  .refine((v) => {
    const [y, m, d] = v.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  }, 'not a real date')

const LIST_QUERY = z.object({
  status: z.enum(STATUS_VALUES).optional(),
  company: z.string().regex(/^[A-Za-z0-9?_-]{1,8}$/, 'unknown company code').optional(),
  assigned: z.enum(['eu', 'acc']).optional(),
  q: z.string().max(120).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  /** v5.7: which date from/to apply to — `updated` (default, as before) · `created` · `invoice`. */
  date_field: z.enum(['updated', 'created', 'invoice']).default('updated'),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
  include: z.enum(['boxes']).optional(),
})

/**
 * GET /api/documents
 */
documentsRouter.get('/', async (req, res) => {
  const parsed = LIST_QUERY.safeParse(req.query)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const where = first?.path.join('.') ?? 'query'
    return res.status(400).json({ ok: false, source: 'portal_db', error: `${where}: ${first?.message ?? 'invalid parameter'}` })
  }
  const q = parsed.data
  if (q.from && q.to && q.from > q.to) {
    return res.status(400).json({ ok: false, source: 'portal_db', error: 'from: ต้องไม่เกิน to' })
  }

  try {
    const { docs, skipped } = await loadQueueDocs(
      q.company ? { companyCode: q.company } : {},
      { includeBoxes: q.include === 'boxes' },
    )

    const filtered = docs
      .filter((d) => (q.status ? d.status === q.status : true))
      .filter((d) => (q.assigned ? d.assigned === q.assigned : true))
      .filter((d) => (q.from || q.to ? !!docDateFor(d, q.date_field) : true))
      .filter((d) => (q.from ? docDateFor(d, q.date_field) >= q.from : true))
      .filter((d) => (q.to ? docDateFor(d, q.date_field) <= q.to : true))
      .filter((d) => matchesSearchQuery(d, q.q ?? ''))
      // v5.11.1: every caller gets only the documents their scope allows (before: only under "view
      // as"; everyone else received every document and the browser merely hid them)
      .filter((d) => (req.sessionUser ? docVisibleTo(d, req.sessionUser).ok : false))

    const sorted = sortDocsFor(filtered, q.status ?? 'all')
    const page = sorted.slice(q.offset, q.offset + q.limit)

    return res.json({
      ok: true,
      source: 'portal_db',
      total: filtered.length,
      count: page.length,
      limit: q.limit,
      offset: q.offset,
      documents: page,
      skipped: skipped.length ? skipped : undefined,
    })
  } catch (err: any) {
    console.error('Failed to load queue docs:', err)
    return res.status(500).json({ ok: false, source: 'portal_db', error: 'Database read failed' })
  }
})

import { loadQueueDoc, SAFE_DOC_ID, UnreadableDocumentError } from '../../src/server/portalDocs'

/**
 * GET /api/documents/:id
 */
documentsRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  if (!id || id.includes('..') || id.includes(' ') || id.includes('/') || id.includes('\\')) {
    return res.status(400).json({
      ok: false,
      source: 'portal_db',
      error: 'รหัสเอกสารไม่ถูกต้อง (รูปแบบที่รองรับ: DMS-ตามด้วยตัวเลข)',
    })
  }

  try {
    const document = await loadQueueDoc(id)
    if (!document) {
      return res.status(404).json({
        ok: false,
        source: 'portal_db',
        error: `ไม่พบเอกสาร ${id} ในฐานข้อมูล`,
      })
    }
    if (!req.sessionUser) return res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบ' })
    const vis = docVisibleTo(document, req.sessionUser)
    if (req.viewAs) void auditViewAs(req, id, vis.ok ? 'เปิดดูเอกสาร' : `ถูกปฏิเสธ: ${vis.why}`)
    if (!vis.ok) return res.status(403).json({ ok: false, code: 'OUT_OF_SCOPE', error: vis.why })
    return res.json({
      ok: true,
      source: 'portal_db',
      document,
    })
  } catch (err: any) {
    if (err instanceof UnreadableDocumentError) {
      return res.status(422).json({ ok: false, source: 'portal_db', error: err.message })
    }
    return res.status(500).json({ ok: false, source: 'portal_db', error: `อ่านฐานข้อมูลไม่สำเร็จ: ${err.message}` })
  }
})

const ACTION_SCHEMA = z.object({
  action: z.enum([
    'confirm',
    'review',
    'hold',
    'reject',
    // Legacy alias (before v5.11 the client never sent it; old scripts may): = confirm on Manual Review.
    'manual_review',
    'unconfirm',
    'returnf',
    'upload_revision',
  ]),
  reason: z.string().optional(),
  note: z.string().optional(),
  simOutcome: z.string().optional(),
  uploadFile: z.string().optional(),
})

const ACTION_NAMES: Record<string, string> = {
  confirm: 'Confirm',
  review: 'ย้ายเป็น Review',
  hold: 'Hold',
  reject: 'Reject',
  manual_review: 'ตัดสิน Manual Review',
  unconfirm: 'ยกเลิกการยืนยัน',
  returnf: 'Return Import Failed',
  upload_revision: 'อัปโหลดเอกสารใหม่',
}

/** A refusal raised inside a transaction; the route turns it into the HTTP answer. */
class ActionRefused extends Error {
  constructor(public readonly http: number, message: string, public readonly extra: Record<string, unknown> = {}) {
    super(message)
  }
}

/**
 * SQLite refuses the second of two concurrent writing transactions ("database is locked" / Prisma
 * P2034) instead of letting it overwrite. To the user that is the same as losing the race: 409.
 */
export const isWriteConflict = (err: any): boolean =>
  err?.code === 'P2034' || /database is locked|SQLITE_BUSY|write conflict|deadlock/i.test(String(err?.message ?? ''))

const parsePayload = (json: string | null | undefined): Record<string, any> => {
  try {
    const v = JSON.parse(json || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

const nowParts = () => {
  const now = new Date()
  return { now, dt: now.toISOString().slice(0, 10), t: now.toTimeString().slice(0, 8) }
}

/**
 * POST /api/documents/:id/actions
 *
 * v5.11: the status table is `transitionFor` (src/lib/docTransitions.ts), shared with the queue
 * buttons. Confirm also passes the receive_id guard (src/server/receiveIdGuard.ts). Check and write
 * run in one interactive transaction, and the write is conditional on the status that was checked,
 * so two people acting on related documents at once cannot both succeed.
 */
documentsRouter.post('/:id/actions', async (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Missing document id' })
  }

  const parsed = ACTION_SCHEMA.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid request data', issues: parsed.error.issues })
  }

  const { reason = '', note = '', simOutcome = 'Auto-pass' } = parsed.data
  const action = parsed.data.action === 'manual_review' ? 'confirm' : parsed.data.action

  // Identity comes from the signed session only (the route is mounted behind requireAuth).
  const session = req.sessionUser
  if (!session) return res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบ', code: 'UNAUTHENTICATED' })
  const userId = session.id
  const userRole = String(session.role || '').toUpperCase()
  const userName = session.name

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const doc = await tx.document.findUnique({ where: { id } })
      if (!doc) throw new ActionRefused(404, `ไม่พบเอกสาร ${id} ในระบบ`)
      // v5.11.1: acting needs the same right as seeing (before: any accountant could act on any company).
      const vis = docVisibleTo({ company: doc.companyCode, receiver: doc.receiverName }, session)
      if (!vis.ok) throw new ActionRefused(403, vis.why ?? 'คุณไม่มีสิทธิ์ในเอกสารนี้')
      if (doc.isLocked || doc.status === 'Sent' || doc.status === 'Posted') {
        throw new ActionRefused(423, `เอกสาร ${id} ถูกล็อกแล้ว (${doc.status}) ไม่อนุญาตให้แก้ไขสถานะ`)
      }

      const currentStatus: string = doc.status
      let targetStatus: string
      let rid: string | null = null

      if (action === 'upload_revision') {
        // Demo / simulation only (a real re-scan arrives from the DMS through the Engine). Before
        // v5.11.1 `simOutcome` was written as-is, so any caller could set any status — Posted,
        // Confirmed — past every rule and the receive_id guard.
        if (!simulationEnabled()) throw new ActionRefused(403, 'อัปโหลดเอกสารใหม่ผ่าน DMS (ปิดใน production)')
        if (!['Auto-pass', 'Review', 'Hold', 'Manual Review'].includes(simOutcome)) {
          throw new ActionRefused(400, 'ผลจำลองต้องเป็น Auto-pass / Review / Hold / Manual Review')
        }
        if (!['Auto-pass', 'Review', 'Hold', 'Manual Review'].includes(currentStatus)) {
          throw new ActionRefused(422, `สถานะ ${currentStatus} อัปโหลดแทนไม่ได้`)
        }
        targetStatus = simOutcome
      } else {
        rid = receiveIdOf(doc)
        const t = transitionFor(
          { status: currentStatus, identityStatus: doc.identityStatus, hasReceipt: !!rid, role: userRole },
          action,
        )
        if (!t.ok) throw new ActionRefused(t.http, t.why)
        // v5.12: accounting may Confirm while the Receiver still has codes to fix (or no bound
        // account) — never blocked, but the reason is mandatory, as the confirm dialog says.
        const receiverWork =
          action === 'confirm' &&
          !!doc.receiverName &&
          (() => {
            try {
              const ex = JSON.parse(doc.payloadJson || '{}')?.exceptions
              return Array.isArray(ex) && ex.some((e: any) => EU_CODES.has(String(e?.code)))
            } catch {
              return false
            }
          })()
        if ((t.reasonRequired || receiverWork) && !reason.trim() && !note.trim()) {
          throw new ActionRefused(400, `${ACTION_NAMES[action] ?? action} จากสถานะ ${currentStatus} ต้องระบุเหตุผล`)
        }
        targetStatus = t.to

        if (targetStatus === 'Confirmed') {
          const holder = await findReceiveIdHolder(tx, rid, [id])
          if (holder) throw new ActionRefused(409, holderMessage(rid!, holder), { code: 'RECEIVE_ID_HELD', heldBy: holder.id, heldStatus: holder.status })
        }
      }

      const payload = parsePayload(doc.payloadJson)
      const history = Array.isArray(payload.history) ? [...payload.history] : []
      const { now, dt, t: time } = nowParts()
      const actTitle = ACTION_NAMES[action] || action.toUpperCase()
      const detailStr = `${userName} (${userRole}) · ${reason}${note ? ' · ' + note : ''}`
      history.push({
        dt,
        t: time,
        who: userName,
        act: `${actTitle} (${currentStatus} → ${targetStatus})`,
        d: detailStr,
        k: action === 'confirm' ? 'g' : action === 'hold' || action === 'reject' ? 'c' : 'h',
        rs: reason,
        nt: note,
      })
      payload.history = history
      payload.status = targetStatus

      // Conditional on the status we checked: a concurrent change makes this a 409, never a lost update.
      const written = await tx.document.updateMany({
        where: { id, status: currentStatus, isLocked: false },
        data: {
          status: targetStatus,
          confirmedBy: action === 'confirm' ? userId : action === 'unconfirm' ? null : doc.confirmedBy,
          confirmedAt: action === 'confirm' ? now : action === 'unconfirm' ? null : doc.confirmedAt,
          importError: action === 'returnf' ? null : doc.importError,
          payloadJson: JSON.stringify(payload),
        },
      })
      if (written.count !== 1) throw new ActionRefused(409, `เอกสาร ${id} ถูกเปลี่ยนสถานะโดยผู้อื่นระหว่างนี้ · โหลดใหม่แล้วลองอีกครั้ง`)

      await tx.auditLog.create({
        data: {
          docId: id,
          whoId: userId,
          who: userName,
          role: userRole,
          act: actTitle,
          action: action.toUpperCase(),
          fromStatus: currentStatus,
          toStatus: targetStatus,
          reason,
          note,
          detail: detailStr,
        },
      })
      const updated = await tx.document.findUnique({ where: { id } })
      return { updated, currentStatus, targetStatus, actTitle }
    })

    publishDocEvent({
      kind: 'status',
      docId: id,
      status: result.targetStatus,
      company: result.updated.companyCode,
      receiver: result.updated.receiverName ?? null,
      title: `${result.actTitle} (${result.currentStatus} → ${result.targetStatus})`,
      detail: `โดย ${userName}`,
      actorId: userId,
    })

    return res.json({
      ok: true,
      message: `${result.actTitle} สำเร็จ (${result.currentStatus} → ${result.targetStatus})`,
      fromStatus: result.currentStatus,
      toStatus: result.targetStatus,
      document: {
        ...result.updated,
        doc: result.updated.id,
      },
    })
  } catch (err: any) {
    if (err instanceof ActionRefused) return res.status(err.http).json({ ok: false, error: err.message, ...err.extra })
    if (isWriteConflict(err)) return res.status(409).json({ ok: false, code: 'WRITE_CONFLICT', error: 'มีผู้อื่นแก้ไขเอกสารที่เกี่ยวข้องพร้อมกัน · โหลดใหม่แล้วลองอีกครั้ง' })
    console.error(`Action ${action} on ${id} error:`, err)
    return res.status(500).json({ ok: false, error: 'Database update failed' })
  }
})

// ============================================================================ ผูกใบรับ (bind receipt)

const LOOKUP_SCHEMA = z.object({
  supplierTaxId: z.string().max(40).optional().nullable(),
  invoiceNum: z.string().max(60).optional().nullable(),
  poNumber: z.string().max(40).optional().nullable(),
})

const BIND_SCHEMA = LOOKUP_SCHEMA.extend({
  reason: z.string().trim().min(1, 'ต้องระบุเหตุผล').max(500),
  /** The receive_id the person saw in the preview. A different answer now → 409. */
  expectedReceiveId: z.string().min(1).max(60),
  /** The outcome the preview showed (Confirmed / Duplicate). A different answer now → 409. */
  expectedStatus: z.enum(['Confirmed', 'Duplicate']).optional(),
})

const BIND_CANDIDATE_SELECT = {
  id: true,
  status: true,
  identityStatus: true,
  receiveId: true,
  secondaryKey: true,
  isLocked: true,
  createdAt: true,
} as const

/** Session + visibility + bindable state, shared by preview and bind. */
async function loadBindable(req: any, id: string) {
  const session = req.sessionUser
  if (!session) throw new ActionRefused(401, 'กรุณาเข้าสู่ระบบ')
  if (!SAFE_DOC_ID.test(id)) throw new ActionRefused(400, 'รหัสเอกสารไม่ถูกต้อง')
  const row = await prisma.document.findUnique({ where: { id } })
  if (!row) throw new ActionRefused(404, `ไม่พบเอกสาร ${id} ในระบบ`)
  // "ใครเห็นเอกสารก็ผูกได้": the same scope rule as the queue.
  const ui = await loadQueueDoc(id)
  if (!ui || !docVisibleTo(ui, session).ok) throw new ActionRefused(403, 'คุณไม่มีสิทธิ์เห็นเอกสารนี้')
  const can = canBindReceipt({ status: row.status, identityStatus: row.identityStatus, hasReceipt: !!receiveIdOf(row), isLocked: row.isLocked })
  if (!can.ok) throw new ActionRefused(422, can.why!)
  return { session, row }
}

function boundIdentity(receiveId: string, supplierTaxId: string, invoiceNum: string): DocumentIdentity {
  return {
    status: 'RESOLVED',
    reason: 'FOUND',
    receiveId,
    secondaryKey: buildSecondaryKey(supplierTaxId, invoiceNum),
    missingKeys: [],
    lookupPath: 'MANUAL-BIND',
    source: 'derived',
  }
}

/** Outcome of binding `receiveId` to document `id`, as it stands right now in `db`. */
async function bindOutcome(db: any, id: string, identity: DocumentIdentity) {
  const candidates = await db.document.findMany({
    where: { id: { not: id }, OR: [{ receiveId: identity.receiveId }, ...(identity.secondaryKey ? [{ secondaryKey: identity.secondaryKey }] : [])] },
    select: BIND_CANDIDATE_SELECT,
  })
  const decision = decideBind({ identity, candidates })
  if (decision.newStatus === 'Confirmed') {
    // Legacy rows (receipt number only, no identity) are invisible to the DR rules; the guard sees them.
    const holder = await findReceiveIdHolder(db, identity.receiveId, [id])
    if (holder) {
      return {
        ...decision,
        newStatus: 'Duplicate' as const,
        rule: 'DR-04' as const,
        duplicateOf: { id: holder.id, status: holder.status, identityStatus: null, receiveId: identity.receiveId, secondaryKey: null, createdAt: 0 },
        supersede: [],
      }
    }
  }
  return decision
}

const lookupHttp = (status: string) =>
  status === 'NEED_KEYS' ? 400 : status === 'NOT_FOUND' || status === 'PO_NOT_FOUND' ? 404 : 422

/**
 * POST /api/documents/:id/receipt-lookup — preview only, writes nothing.
 * Body: { supplierTaxId?, invoiceNum, poNumber? }. Answers the receipt with its lines and what
 * binding it would do (Confirmed / Duplicate of …, Superseded …).
 */
documentsRouter.post('/:id/receipt-lookup', async (req, res) => {
  const parsed = LOOKUP_SCHEMA.safeParse(req.body ?? {})
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' })
  try {
    const { row } = await loadBindable(req, req.params.id)
    const found = await lookupReceipt({ ...parsed.data, documentTaxId: row.identityStatus === 'UNRESOLVED' ? null : row.supplierTaxId })
    if (found.status !== 'FOUND') return res.status(lookupHttp(found.status)).json({ ok: false, code: found.status, error: found.message })

    const identity = boundIdentity(found.receipt.receiveId, found.supplierTaxId, found.invoiceNum)
    const outcome = await bindOutcome(prisma, row.id, identity)
    const receiptTotal = receiptTotalOf(found.receipt)
    return res.json({
      ok: true,
      receipt: { ...found.receipt, total: receiptTotal },
      supplierTaxId: found.supplierTaxId,
      invoiceNum: found.invoiceNum,
      supplierFromPo: found.supplierFromPo,
      invoiceTotal: row.grandTotal,
      amountDiff: Math.round((row.grandTotal - receiptTotal) * 100) / 100,
      outcome: {
        newStatus: outcome.newStatus,
        rule: outcome.rule,
        duplicateOf: outcome.duplicateOf ? { id: outcome.duplicateOf.id, status: outcome.duplicateOf.status } : null,
        supersede: outcome.supersede.map(c => ({ id: c.id, status: c.status })),
      },
    })
  } catch (err: any) {
    if (err instanceof ActionRefused) return res.status(err.http).json({ ok: false, error: err.message })
    if (err instanceof ReceiptLookupUnavailable) return res.status(503).json({ ok: false, code: 'LOOKUP_UNAVAILABLE', error: err.message })
    console.error('receipt-lookup error:', err)
    return res.status(500).json({ ok: false, error: 'ค้นหาใบรับไม่สำเร็จ' })
  }
})

/**
 * POST /api/documents/:id/bind-receipt — bind the receipt and decide, in one transaction.
 * Re-runs the lookup on the server (the browser's receive_id is only compared, never used).
 *   no other holder → this document Confirmed; open documents of the same receipt/invoice Superseded
 *   a holder in the AP flow → this document Duplicate of it (DR-04 / DR-06)
 */
documentsRouter.post('/:id/bind-receipt', async (req, res) => {
  const parsed = BIND_SCHEMA.safeParse(req.body ?? {})
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' })
  const body = parsed.data
  const id = req.params.id
  try {
    const { session, row } = await loadBindable(req, id)
    const found = await lookupReceipt({ ...body, documentTaxId: row.identityStatus === 'UNRESOLVED' ? null : row.supplierTaxId })
    if (found.status !== 'FOUND') return res.status(lookupHttp(found.status)).json({ ok: false, code: found.status, error: found.message })
    const r = found.receipt
    if (normalizeReceiveId(body.expectedReceiveId) !== r.receiveId) {
      return res.status(409).json({ ok: false, code: 'RECEIPT_CHANGED', error: `ผลค้นหาเปลี่ยนไป (ตอนนี้คือใบรับ ${r.receiveId}) · ตรวจรายการใหม่อีกครั้ง` })
    }
    const identity = boundIdentity(r.receiveId, found.supplierTaxId, found.invoiceNum)
    const receiptTotal = receiptTotalOf(r)
    const role = String(session.role || '').toUpperCase()

    const result = await prisma.$transaction(async (tx: any) => {
      const doc = await tx.document.findUnique({ where: { id } })
      const can = doc && canBindReceipt({ status: doc.status, identityStatus: doc.identityStatus, hasReceipt: !!receiveIdOf(doc), isLocked: doc.isLocked })
      if (!doc || !can?.ok) throw new ActionRefused(409, `เอกสาร ${id} เปลี่ยนไประหว่างนี้ (${doc?.status ?? 'ไม่พบ'}) · โหลดใหม่`)

      const outcome = await bindOutcome(tx, id, identity)
      if (body.expectedStatus && body.expectedStatus !== outcome.newStatus) {
        throw new ActionRefused(409, `ผลการผูกเปลี่ยนไป (ตอนนี้จะเป็น ${outcome.newStatus}) · ตรวจใหม่อีกครั้ง`, { code: 'OUTCOME_CHANGED' })
      }

      const { now, dt, t } = nowParts()
      const fromStatus: string = doc.status
      const toStatus = outcome.newStatus
      const payload = parsePayload(doc.payloadJson)
      const history = Array.isArray(payload.history) ? [...payload.history] : []
      const dupText = outcome.duplicateOf ? ` · ใบรับนี้ถูกใช้โดย ${outcome.duplicateOf.id} (${outcome.duplicateOf.status}) → Duplicate (${outcome.rule})` : ''
      const supText = outcome.supersede.length ? ` · แทนที่ ${outcome.supersede.map(c => c.id).join(', ')}` : ''
      history.push({
        dt,
        t,
        who: session.name,
        act: toStatus === 'Confirmed' ? `Confirm โดยผูกใบรับ (${fromStatus} → Confirmed)` : `ผูกใบรับ (${fromStatus} → Duplicate)`,
        d: `${session.name} (${role}) · ใบรับ ${r.receiveId} · ${body.reason}${supText}${dupText}`,
        k: toStatus === 'Confirmed' ? 'g' : 'c',
        rs: body.reason,
      })

      Object.assign(payload, {
        status: toStatus,
        history,
        invoiceNum: payload.invoiceNum || found.invoiceNum,
        supplierTaxId: found.supplierTaxId,
        supplierName: r.supplierName || payload.supplierName,
        companyCode: r.companyCode || payload.companyCode,
        companyName: r.companyName || payload.companyName,
        orgId: r.orgId ?? payload.orgId,
        ouName: r.ouName ?? payload.ouName,
        receiptFound: true,
        receiptNums: [r.receiveId],
        receiptTotal,
        invoiceVsReceiptDiff: Math.round(((doc.grandTotal ?? 0) - receiptTotal) * 100) / 100,
        oracleReceiptLines: r.lines,
        poNumbers: Array.isArray(payload.poNumbers) && payload.poNumbers.length ? payload.poNumbers : r.poNumbers,
        identity: {
          status: 'RESOLVED',
          reason: 'FOUND',
          receiveId: r.receiveId,
          secondaryKey: identity.secondaryKey,
          missingKeys: [],
          lookupPath: 'MANUAL-BIND',
          source: 'derived',
        },
      })
      if (r.receiverName) payload.receiverName = r.receiverName
      if (outcome.duplicateOf) {
        payload.duplicateOf = outcome.duplicateOf.id
        payload.dupRule = outcome.rule
        payload.duplicateStatus = 'potential_duplicate'
      }
      if (outcome.supersede.length) {
        payload.supersedes = outcome.supersede[0].id
        payload.supRule = 'BIND'
      }

      const written = await tx.document.updateMany({
        where: { id, status: fromStatus, isLocked: false },
        data: {
          status: toStatus,
          identityStatus: 'RESOLVED',
          receiveId: r.receiveId,
          receiptNum: r.receiveId,
          secondaryKey: identity.secondaryKey,
          missingKeys: null,
          supplierTaxId: found.supplierTaxId,
          supplierName: r.supplierName || doc.supplierName,
          invoiceNum: doc.invoiceNum || found.invoiceNum,
          companyCode: r.companyCode || doc.companyCode,
          receiverName: r.receiverName ?? doc.receiverName,
          confirmedBy: toStatus === 'Confirmed' ? session.id : doc.confirmedBy,
          confirmedAt: toStatus === 'Confirmed' ? now : doc.confirmedAt,
          duplicateOfId: outcome.duplicateOf?.id ?? doc.duplicateOfId,
          supersedesId: outcome.supersede[0]?.id ?? doc.supersedesId,
          drRule: outcome.rule === 'BIND' ? 'BIND' : outcome.rule,
          drMatchedBy: 'RECEIVE_ID',
          payloadJson: JSON.stringify(payload),
        },
      })
      if (written.count !== 1) throw new ActionRefused(409, `เอกสาร ${id} ถูกเปลี่ยนสถานะโดยผู้อื่นระหว่างนี้ · โหลดใหม่`)

      for (const old of outcome.supersede) {
        const o = await tx.document.findUnique({ where: { id: old.id } })
        if (!o || o.status !== old.status || o.isLocked) throw new ActionRefused(409, `เอกสาร ${old.id} เปลี่ยนไประหว่างนี้ · โหลดใหม่`)
        const op = parsePayload(o.payloadJson)
        op.status = 'Superseded'
        op.supersededBy = id
        op.history = [
          ...(Array.isArray(op.history) ? op.history : []),
          { dt, t, who: session.name, act: 'Superseded (ผูกใบรับ)', d: `${id} ผูกใบรับ ${r.receiveId} และ Confirm แล้ว → ฉบับนี้ถูกแทนที่`, k: 'c' },
        ]
        await tx.document.update({ where: { id: old.id }, data: { status: 'Superseded', supersededById: id, payloadJson: JSON.stringify(op) } })
        await tx.auditLog.create({
          data: { docId: old.id, whoId: session.id, who: session.name, role, act: 'Superseded (ผูกใบรับ)', action: 'BIND_SUPERSEDE', fromStatus: old.status, toStatus: 'Superseded', reason: body.reason, detail: `แทนที่โดย ${id} · ใบรับ ${r.receiveId}` },
        })
      }

      await tx.auditLog.create({
        data: {
          docId: id,
          whoId: session.id,
          who: session.name,
          role,
          act: toStatus === 'Confirmed' ? 'Confirm โดยผูกใบรับ' : 'ผูกใบรับ (Duplicate)',
          action: 'BIND_RECEIPT',
          fromStatus,
          toStatus,
          reason: body.reason,
          detail: `ใบรับ ${r.receiveId} · ยอดใบรับ ${receiptTotal}${supText}${dupText}`,
        },
      })
      return { fromStatus, toStatus, outcome }
    })

    const company = r.companyCode || row.companyCode
    publishDocEvent({
      kind: 'status', docId: id, status: result.toStatus, company, receiver: r.receiverName ?? row.receiverName ?? null,
      title: result.toStatus === 'Confirmed' ? 'Confirm โดยผูกใบรับ' : 'ผูกใบรับ (Duplicate)', detail: `ใบรับ ${r.receiveId} · โดย ${session.name}`, actorId: session.id,
    })
    for (const s of result.outcome.supersede) {
      publishDocEvent({ kind: 'status', docId: s.id, status: 'Superseded', company, receiver: null, title: 'ถูกแทนที่ (ผูกใบรับ)', detail: `โดย ${id}`, actorId: session.id })
    }

    return res.json({
      ok: true,
      fromStatus: result.fromStatus,
      toStatus: result.toStatus,
      receiveId: r.receiveId,
      duplicateOf: result.outcome.duplicateOf?.id ?? null,
      superseded: result.outcome.supersede.map(c => c.id),
      message:
        result.toStatus === 'Confirmed'
          ? `ผูกใบรับ ${r.receiveId} และ Confirm แล้ว${result.outcome.supersede.length ? ` · แทนที่ ${result.outcome.supersede.map(c => c.id).join(', ')}` : ''}`
          : `ผูกใบรับ ${r.receiveId} แล้ว · เป็น Duplicate ของ ${result.outcome.duplicateOf?.id}`,
    })
  } catch (err: any) {
    if (err instanceof ActionRefused) return res.status(err.http).json({ ok: false, error: err.message, ...err.extra })
    if (err instanceof ReceiptLookupUnavailable) return res.status(503).json({ ok: false, code: 'LOOKUP_UNAVAILABLE', error: err.message })
    if (isWriteConflict(err)) return res.status(409).json({ ok: false, code: 'WRITE_CONFLICT', error: 'มีผู้อื่นแก้ไขเอกสารที่เกี่ยวข้องพร้อมกัน · ค้นหาใหม่แล้วลองอีกครั้ง' })
    console.error('bind-receipt error:', err)
    return res.status(500).json({ ok: false, error: 'ผูกใบรับไม่สำเร็จ' })
  }
})
