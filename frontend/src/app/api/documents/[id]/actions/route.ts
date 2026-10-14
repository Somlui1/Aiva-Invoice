import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = (await ctx.params) ?? { id: '' }
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing document id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = ACTION_SCHEMA.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request data', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { action, reason = '', note = '' } = parsed.data

  // User credentials from headers or defaults (AuthContext / Session)
  const userId = req.headers.get('x-user-id') || 'u4'
  const userRole = (req.headers.get('x-user-role') || 'ACC').toUpperCase()
  const rawUserName = req.headers.get('x-user-name') || 'ปณิดา รักงาน'
  let userName = rawUserName
  try {
    userName = decodeURIComponent(rawUserName)
  } catch {}

  // Fetch document
  const doc = await prisma.document.findUnique({
    where: { id },
  })

  if (!doc) {
    return NextResponse.json(
      { ok: false, error: `ไม่พบเอกสาร ${id} ในระบบ` },
      { status: 404 },
    )
  }

  // 1. Locking Check
  if (doc.isLocked || doc.status === 'Sent' || doc.status === 'Posted') {
    return NextResponse.json(
      {
        ok: false,
        error: `เอกสาร ${id} ถูกล็อกแล้ว (${doc.status}) ไม่อนุญาตให้แก้ไขสถานะ`,
      },
      { status: 423 },
    )
  }

  // 2. Role permission checks
  if (action === 'confirm' && userRole === 'EU') {
    return NextResponse.json(
      { ok: false, error: 'บทบาท ผู้ใช้งาน (EU) ไม่มีสิทธิ์ Confirm เอกสาร' },
      { status: 403 },
    )
  }

  if (['manual_review', 'dup_override', 'unconfirm'].includes(action) && userRole !== 'APR' && userRole !== 'ADM') {
    return NextResponse.json(
      { ok: false, error: 'การดำเนินการนี้สงวนไว้สำหรับหัวหน้าฝ่ายบัญชี (APR) เท่านั้น' },
      { status: 403 },
    )
  }

  // 3. State transition validity
  const currentStatus = doc.status
  let targetStatus = currentStatus

  switch (action) {
    case 'confirm':
      if (!['Auto-pass', 'Review'].includes(currentStatus)) {
        return NextResponse.json(
          { ok: false, error: `ไม่สามารถ Confirm เอกสารจากสถานะ "${currentStatus}" ได้` },
          { status: 422 },
        )
      }
      targetStatus = 'Confirmed'
      break

    case 'review':
      if (!['Hold', 'Auto-pass', 'Confirmed', 'Import Failed'].includes(currentStatus)) {
        return NextResponse.json(
          { ok: false, error: `ไม่สามารถย้ายเอกสารจากสถานะ "${currentStatus}" เป็น Review ได้` },
          { status: 422 },
        )
      }
      targetStatus = 'Review'
      break

    case 'hold':
      if (!['Auto-pass', 'Review'].includes(currentStatus)) {
        return NextResponse.json(
          { ok: false, error: `ไม่สามารถ Hold เอกสารจากสถานะ "${currentStatus}" ได้` },
          { status: 422 },
        )
      }
      if (!reason) {
        return NextResponse.json(
          { ok: false, error: 'การ Hold เอกสารต้องระบุเหตุผลเสมอ' },
          { status: 400 },
        )
      }
      targetStatus = 'Hold'
      break

    case 'reject':
      if (!['Auto-pass', 'Review', 'Hold'].includes(currentStatus)) {
        return NextResponse.json(
          { ok: false, error: `ไม่สามารถ Reject เอกสารจากสถานะ "${currentStatus}" ได้` },
          { status: 422 },
        )
      }
      if (!reason) {
        return NextResponse.json(
          { ok: false, error: 'การ Reject เอกสารต้องระบุเหตุผลเสมอ' },
          { status: 400 },
        )
      }
      targetStatus = 'Rejected'
      break

    case 'manual_review':
      if (currentStatus !== 'Manual Review') {
        return NextResponse.json(
          { ok: false, error: `เอกสารไม่ได้อยู่ในสถานะ Manual Review (ปัจจุบัน: ${currentStatus})` },
          { status: 422 },
        )
      }
      targetStatus = 'Review'
      break

    case 'dup_override':
      if (currentStatus !== 'Duplicate') {
        return NextResponse.json(
          { ok: false, error: `เอกสารไม่ได้อยู่ในสถานะ Duplicate (ปัจจุบัน: ${currentStatus})` },
          { status: 422 },
        )
      }
      targetStatus = 'Review'
      break

    case 'unconfirm':
      if (currentStatus !== 'Confirmed') {
        return NextResponse.json(
          { ok: false, error: `เอกสารไม่ได้อยู่ในสถานะ Confirmed (ปัจจุบัน: ${currentStatus})` },
          { status: 422 },
        )
      }
      targetStatus = 'Review'
      break

    case 'returnf':
      if (currentStatus !== 'Import Failed') {
        return NextResponse.json(
          { ok: false, error: `เอกสารไม่ได้อยู่ในสถานะ Import Failed (ปัจจุบัน: ${currentStatus})` },
          { status: 422 },
        )
      }
      targetStatus = 'Review'
      break

    default:
      return NextResponse.json(
        { ok: false, error: `Unknown action: ${action}` },
        { status: 400 },
      )
  }

  // Parse existing payloadJson to append history entry
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

  // 4. Atomic Prisma Transaction
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

  return NextResponse.json({
    ok: true,
    document: {
      ...updatedDoc,
      doc: updatedDoc.id,
    },
    message: `${actTitle} สำเร็จ (${currentStatus} → ${targetStatus})`,
  })
}
