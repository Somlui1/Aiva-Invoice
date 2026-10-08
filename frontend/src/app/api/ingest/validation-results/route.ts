import { NextRequest, NextResponse } from 'next/server'

const PSTD = { contract: 'aiva.portal.ingest/1.0' }
const REC_ENUM = ['AUTO_PASS', 'REVIEW', 'HOLD', 'MANUAL_REVIEW', 'SYSTEM_ERROR']
const ID_ENUM = ['RESOLVED', 'NOT_FOUND', 'UNRESOLVED']

const seenMessages = new Map<string, any>()

export async function POST(req: NextRequest) {
  let p: any
  try {
    p = await req.json()
  } catch {
    return NextResponse.json({ http: 400, result: 'BAD_JSON', error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Contract validation
  const errors: string[] = []
  if (!p || typeof p !== 'object') {
    return NextResponse.json({ http: 422, result: 'VALIDATION_FAILED', errors: ['Payload must be an object'] }, { status: 422 })
  }
  if (p.contract !== PSTD.contract) {
    errors.push(`contract must be ${PSTD.contract}`)
  }
  if (!p.message_id) {
    errors.push('message_id is required')
  }

  const idStatus = p.identity?.status
  if (!idStatus || !ID_ENUM.includes(idStatus)) {
    errors.push(`identity.status must be one of ${ID_ENUM.join(' | ')}`)
  }

  const rid = p.identity?.receive_id
  if (idStatus === 'RESOLVED' && (!rid || !/^[A-Z0-9-]{4,30}$/.test(rid))) {
    errors.push('RESOLVED must have valid identity.receive_id (4-30 chars)')
  }
  if (idStatus === 'UNRESOLVED' && (!p.identity?.missing_keys || !p.identity.missing_keys.length)) {
    errors.push('UNRESOLVED must include identity.missing_keys')
  }

  const rec = p.decision?.recommendation
  if (rec !== undefined && !REC_ENUM.includes(rec)) {
    errors.push(`decision.recommendation must be one of ${REC_ENUM.join(' | ')}`)
  }

  if (errors.length > 0) {
    return NextResponse.json(
      {
        http: 422,
        result: 'VALIDATION_FAILED',
        message_id: p.message_id || null,
        errors
      },
      { status: 422 }
    )
  }

  // Idempotency check
  const mid = p.message_id
  if (seenMessages.has(mid)) {
    return NextResponse.json({
      ...seenMessages.get(mid),
      http: 200,
      result: 'ALREADY_PROCESSED'
    })
  }

  // Determine status & rules
  const baseStatus =
    idStatus === 'UNRESOLVED'
      ? 'Manual Review'
      : rec === 'AUTO_PASS'
      ? 'Auto-pass'
      : rec === 'REVIEW'
      ? 'Review'
      : rec === 'HOLD'
      ? 'Hold'
      : 'Manual Review'

  const pid = `DMS-INGEST-${p.document?.dms_doc_id || String(Date.now()).slice(-6)}`
  const ack = {
    http: 201,
    result: 'CREATED',
    message_id: mid,
    portal_doc_id: pid,
    applied_rule: 'DR-07',
    status: baseStatus,
    ingested_at: new Date().toISOString()
  }

  seenMessages.set(mid, ack)
  return NextResponse.json(ack, { status: 201 })
}
