import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma'
import { loadQueueDocs } from '../../src/server/portalDocs'
import { docDateFor, matchesSearchQuery, sortDocsFor } from '../../src/lib/queueFilters'
import type { InvoiceDoc } from '../../src/types/invoice'
import { auditViewAs, docVisibleTo } from '../../src/server/viewAs'

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
      // v5.10: under "view as" the server answers with the target's scope (what that user really gets)
      .filter((d) => (req.viewAs && req.sessionUser ? docVisibleTo(d, req.sessionUser).ok : true))

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

import { loadQueueDoc, UnreadableDocumentError } from '../../src/server/portalDocs'

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
    if (req.viewAs && req.sessionUser) {
      const vis = docVisibleTo(document, req.sessionUser)
      void auditViewAs(req, id, vis.ok ? 'เปิดดูเอกสาร' : `ถูกปฏิเสธ: ${vis.why}`)
      if (!vis.ok) return res.status(403).json({ ok: false, code: 'OUT_OF_SCOPE', error: vis.why })
    }
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
    'manual_review',
    'dup_override',
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
  dup_override: 'ยืนยันไม่ซ้ำ',
  unconfirm: 'ยกเลิกการยืนยัน',
  returnf: 'Return Import Failed',
  upload_revision: 'อัปโหลดเอกสารใหม่',
}

/**
 * POST /api/documents/:id/actions
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

  const { action, reason = '', note = '', simOutcome = 'Auto-pass', uploadFile = 'revision.pdf' } = parsed.data

  // Identity comes from the signed session only (the route is mounted behind requireAuth).
  // Before v5.5 a request without a session acted as role SA and the x-user-* headers were trusted.
  const session = req.sessionUser
  if (!session) return res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบ', code: 'UNAUTHENTICATED' })
  const userId = session.id
  const userRole = String(session.role || '').toUpperCase()
  const userName = session.name

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
    })

    if (!doc) {
      return res.status(404).json({ ok: false, error: `ไม่พบเอกสาร ${id} ในระบบ` })
    }

    if (doc.isLocked || doc.status === 'Sent' || doc.status === 'Posted') {
      return res.status(423).json({ ok: false, error: `เอกสาร ${id} ถูกล็อกแล้ว (${doc.status}) ไม่อนุญาตให้แก้ไขสถานะ` })
    }

    // UNRESOLVED (OCR could not read the lookup keys): no key, owner Unknown. APR only, Confirm is
    // closed, Reject is the one decision. Enforced here as well as in the UI (src/lib/queueFilters.ts).
    const isUnresolved = doc.identityStatus === 'UNRESOLVED'
    if (isUnresolved) {
      if (userRole !== 'APR') {
        return res.status(403).json({ ok: false, error: 'เอกสาร UNRESOLVED (อ่านคีย์ไม่ได้) ตัดสินได้เฉพาะหัวหน้าฝ่ายบัญชี (APR)' })
      }
      if (action !== 'reject') {
        return res.status(422).json({ ok: false, error: 'เอกสาร UNRESOLVED ไม่มีคีย์ใบรับ: ทำได้เฉพาะ Reject (Confirm ไม่ได้)' })
      }
    }

    // 2. Role permission checks
    if (action === 'confirm' && userRole === 'EU') {
      return res.status(403).json({ ok: false, error: 'บทบาท ผู้ใช้งาน (EU) ไม่มีสิทธิ์ Confirm เอกสาร' })
    }

    if (['manual_review', 'dup_override', 'unconfirm'].includes(action) && userRole !== 'APR' && userRole !== 'ADM') {
      return res.status(403).json({ ok: false, error: 'การดำเนินการนี้สงวนไว้สำหรับหัวหน้าฝ่ายบัญชี (APR) เท่านั้น' })
    }

    // 3. State transition validity
    const currentStatus = doc.status
    let targetStatus = currentStatus

    switch (action) {
      case 'confirm':
        if (!['Auto-pass', 'Review'].includes(currentStatus)) {
          return res.status(422).json({ ok: false, error: `ไม่สามารถ Confirm เอกสารจากสถานะ "${currentStatus}" ได้` })
        }
        targetStatus = 'Confirmed'
        break

      case 'review':
        if (!['Hold', 'Auto-pass', 'Confirmed', 'Import Failed'].includes(currentStatus)) {
          return res.status(422).json({ ok: false, error: `ไม่สามารถย้ายเอกสารจากสถานะ "${currentStatus}" เป็น Review ได้` })
        }
        targetStatus = 'Review'
        break

      case 'hold':
        if (!['Auto-pass', 'Review'].includes(currentStatus)) {
          return res.status(422).json({ ok: false, error: `ไม่สามารถ Hold เอกสารจากสถานะ "${currentStatus}" ได้` })
        }
        if (!reason) {
          return res.status(400).json({ ok: false, error: 'การ Hold เอกสารต้องระบุเหตุผลเสมอ' })
        }
        targetStatus = 'Hold'
        break

      case 'reject':
        if (!['Auto-pass', 'Review', 'Hold', ...(isUnresolved ? ['Manual Review'] : [])].includes(currentStatus)) {
          return res.status(422).json({ ok: false, error: `ไม่สามารถ Reject เอกสารจากสถานะ "${currentStatus}" ได้` })
        }
        if (!reason) {
          return res.status(400).json({ ok: false, error: 'การ Reject เอกสารต้องระบุเหตุผลเสมอ' })
        }
        targetStatus = 'Rejected'
        break

      case 'manual_review':
        if (currentStatus !== 'Manual Review') {
          return res.status(422).json({ ok: false, error: `เอกสารไม่ได้อยู่ในสถานะ Manual Review (ปัจจุบัน: ${currentStatus})` })
        }
        targetStatus = 'Review'
        break

      case 'dup_override':
        if (currentStatus !== 'Duplicate') {
          return res.status(422).json({ ok: false, error: `เอกสารไม่ได้อยู่ในสถานะ Duplicate (ปัจจุบัน: ${currentStatus})` })
        }
        targetStatus = 'Review'
        break

      case 'unconfirm':
        if (currentStatus !== 'Confirmed') {
          return res.status(422).json({ ok: false, error: `เอกสารไม่ได้อยู่ในสถานะ Confirmed (ปัจจุบัน: ${currentStatus})` })
        }
        targetStatus = 'Review'
        break

      case 'returnf':
        if (currentStatus !== 'Import Failed') {
          return res.status(422).json({ ok: false, error: `เอกสารไม่ได้อยู่ในสถานะ Import Failed (ปัจจุบัน: ${currentStatus})` })
        }
        targetStatus = 'Review'
        break

      case 'upload_revision':
        targetStatus = (simOutcome as any) || 'Auto-pass'
        break

      default:
        return res.status(400).json({ ok: false, error: `Unknown action: ${action}` })
    }

    let payload: Record<string, any> = {}
    try {
      payload = JSON.parse(doc.payloadJson || '{}')
    } catch {
      payload = {}
    }
    const history = Array.isArray(payload.history) ? [...payload.history] : []
    const today = new Date().toISOString().slice(0, 10)
    const nowTime = new Date().toTimeString().slice(0, 8)
    const actTitle = ACTION_NAMES[action] || action.toUpperCase()
    const detailStr = `${userName} (${userRole}) · ${reason}${note ? ' · ' + note : ''}`

    history.push({
      dt: today,
      t: nowTime,
      who: userName,
      act: `${actTitle} (${currentStatus} → ${targetStatus})`,
      d: detailStr,
      k: action === 'confirm' ? 'g' : action === 'hold' || action === 'reject' ? 'c' : 'h',
      rs: reason,
      nt: note,
    })

    payload.history = history
    payload.status = targetStatus

    const [updatedDoc] = await prisma.$transaction([
      prisma.document.update({
        where: { id },
        data: {
          status: targetStatus,
          confirmedBy: action === 'confirm' ? userId : action === 'unconfirm' ? null : doc.confirmedBy,
          confirmedAt: action === 'confirm' ? new Date() : action === 'unconfirm' ? null : doc.confirmedAt,
          importError: action === 'returnf' ? null : doc.importError,
          payloadJson: JSON.stringify(payload),
        },
      }),
      prisma.auditLog.create({
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
      }),
    ])

    return res.json({
      ok: true,
      message: `${actTitle} สำเร็จ (${currentStatus} → ${targetStatus})`,
      document: {
        ...updatedDoc,
        doc: updatedDoc.id,
      },
    })
  } catch (err: any) {
    console.error(`Action ${action} on ${id} error:`, err)
    return res.status(500).json({ ok: false, error: 'Database update failed' })
  }
})
