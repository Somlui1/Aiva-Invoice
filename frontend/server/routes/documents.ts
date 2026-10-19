import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma'
import { loadQueueDocs } from '../../src/server/portalDocs'
import { matchesSearchQuery, sortDocsFor } from '../../src/lib/queueFilters'
import type { InvoiceDoc } from '../../src/types/invoice'

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
      .filter((d) => (q.from ? d.up >= q.from : true))
      .filter((d) => (q.to ? d.up <= q.to : true))
      .filter((d) => matchesSearchQuery(d, q.q ?? ''))

    const sorted = sortDocsFor(filtered)
    const page = sorted.slice(q.offset, q.offset + q.limit)

    return res.json({
      ok: true,
      source: 'portal_db',
      total: filtered.length,
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

/**
 * GET /api/documents/:id
 */
documentsRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        runs: { orderBy: { validationRound: 'desc' } },
        bboxes: true,
      },
    })

    if (!doc) {
      return res.status(404).json({ ok: false, error: `Document ${id} not found` })
    }

    let payload: any = {}
    try {
      payload = JSON.parse(doc.payloadJson)
    } catch {}

    return res.json({
      ok: true,
      document: {
        ...payload,
        id: doc.id,
        status: doc.status,
        isLocked: doc.isLocked,
        apStatus: doc.apStatus,
        validationRuns: doc.validationRuns,
      },
    })
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message })
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

  const session = req.sessionUser
  const userId = session?.id || (req.headers['x-user-id'] as string) || 'wajeepradit.p'
  const userRole = (session?.role || (req.headers['x-user-role'] as string) || 'SA').toUpperCase()
  const userName = session?.name || (req.headers['x-user-name'] ? decodeURIComponent(req.headers['x-user-name'] as string) : 'Wajeepradit Prompan')

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

    if (action === 'confirm' && userRole === 'EU') {
      return res.status(403).json({ ok: false, error: 'บทบาท ผู้ใช้งาน (EU) ไม่มีสิทธิ์ Confirm เอกสาร' })
    }

    let nextStatus = doc.status
    let assignedLane = doc.assignedRole || 'acc'
    let apStatus = doc.apStatus || 'unconfirmed'

    switch (action) {
      case 'confirm':
        nextStatus = 'Confirmed'
        apStatus = 'confirmed'
        break
      case 'unconfirm':
        nextStatus = 'Review'
        apStatus = 'unconfirmed'
        break
      case 'review':
        nextStatus = 'Review'
        break
      case 'hold':
        nextStatus = 'Hold'
        break
      case 'reject':
        nextStatus = 'Rejected'
        break
      case 'manual_review':
        nextStatus = 'Manual Review'
        break
      case 'dup_override':
        nextStatus = 'Review'
        break
      case 'returnf':
        nextStatus = 'Review'
        apStatus = 'unconfirmed'
        break
      case 'upload_revision':
        nextStatus = (simOutcome as any) || 'Auto-pass'
        break
    }

    let payload: any = {}
    try {
      payload = JSON.parse(doc.payloadJson)
    } catch {}

    payload.status = nextStatus
    payload.apStatus = apStatus
    const nowIso = new Date().toISOString()
    const nowTime = nowIso.slice(11, 19)
    const today = nowIso.slice(0, 10)

    payload.history = payload.history || []
    payload.history.push({
      dt: today,
      t: nowTime,
      who: `${userName} (${userRole})`,
      act: ACTION_NAMES[action] || action,
      d: `${doc.status} → ${nextStatus}${reason ? ' · ' + reason : ''}${note ? ' (' + note + ')' : ''}`,
      k: 'h',
    })

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status: nextStatus,
        assignedRole: assignedLane,
        apStatus,
        payloadJson: JSON.stringify(payload),
      },
    })

    await prisma.auditLog.create({
      data: {
        who: `${userName} (${userId})`,
        role: userRole,
        docId: id,
        act: ACTION_NAMES[action] || action,
        action,
        reason: reason || undefined,
        detail: `${doc.status} → ${nextStatus} · ${reason || 'ไม่มีเหตุผลระบุ'}${note ? ' · ' + note : ''}`,
      },
    })

    return res.json({
      ok: true,
      message: `${ACTION_NAMES[action]} เอกสาร ${id} สำเร็จ`,
      document: {
        id: updated.id,
        status: updated.status,
        apStatus: updated.apStatus,
      },
    })
  } catch (err: any) {
    console.error(`Action ${action} on ${id} error:`, err)
    return res.status(500).json({ ok: false, error: 'Database update failed' })
  }
})
