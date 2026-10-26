import { Router } from 'express'

export const simulationIngestRouter = Router()

const PSTD = { contract: 'aiva.portal.ingest/1.0' }
const REC_ENUM = ['AUTO_PASS', 'REVIEW', 'HOLD', 'MANUAL_REVIEW', 'SYSTEM_ERROR']
const ID_ENUM = ['RESOLVED', 'NOT_FOUND', 'UNRESOLVED']

const seenMessages = new Map<string, any>()

function handleIngest(req: any, res: any) {
  const p = req.body
  if (!p || typeof p !== 'object') {
    return res.status(422).json({
      http: 422,
      result: 'VALIDATION_FAILED',
      errors: ['Payload must be an object']
    })
  }

  // Contract validation
  const errors: string[] = []
  if (p.contract !== PSTD.contract && p.contract !== 'aiva.system_a.result/3.0') {
    errors.push(`contract must be ${PSTD.contract} or aiva.system_a.result/3.0`)
  }
  if (!p.message_id && !p.request?.validation_id) {
    errors.push('message_id is required')
  }

  const idStatus = p.identity?.status || (p.request ? 'RESOLVED' : undefined)
  if (!idStatus || !ID_ENUM.includes(idStatus)) {
    errors.push(`identity.status must be one of ${ID_ENUM.join(' | ')}`)
  }

  const rid = p.identity?.receive_id
  if (idStatus === 'RESOLVED' && rid != null && !/^[A-Z0-9-]{4,30}$/.test(rid)) {
    errors.push('RESOLVED must have valid identity.receive_id (4-30 chars)')
  }
  if (idStatus === 'UNRESOLVED' && (!p.identity?.missing_keys || !p.identity.missing_keys.length)) {
    errors.push('UNRESOLVED must include identity.missing_keys')
  }

  const rec = p.decision?.recommendation || p.recommendation?.value
  if (rec !== undefined && !REC_ENUM.includes(rec)) {
    errors.push(`decision.recommendation must be one of ${REC_ENUM.join(' | ')}`)
  }

  if (errors.length > 0) {
    return res.status(422).json({
      http: 422,
      result: 'VALIDATION_FAILED',
      message_id: p.message_id || null,
      errors
    })
  }

  // Idempotency check
  const mid = p.message_id || p.request?.validation_id
  if (seenMessages.has(mid)) {
    return res.status(200).json({
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

  const pid = `DMS-INGEST-${p.document?.dms_doc_id || p.request?.dms_doc_id || String(Date.now()).slice(-6)}`
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
  return res.status(201).json(ack)
}

simulationIngestRouter.post('/validation-results', handleIngest)
simulationIngestRouter.post('/', handleIngest)
