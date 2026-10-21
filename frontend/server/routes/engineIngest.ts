import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'
import { engineResultV3Schema } from '../../src/features/engine/schemas/engineResultV3Schema'
import {
  EngineResultValidationError,
  transformValidatedEngineResult,
} from '../../src/features/engine/adapters/engineToPortalAdapter'
import type { PortalInvoiceDocument } from '../../src/features/engine/types/portalDomain'

export const engineIngestRouter = Router()

const replay = (dmsDocId: string, validationId: string, validationRound: number) => ({
  ok: true,
  result: 'ALREADY_PROCESSED',
  idempotent_replay: true,
  dmsDocId,
  portalDocId: dmsDocId,
  validationId,
  validationRound,
  http: 200,
})

function safeSha(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { package?: { file_sha256?: string } }
    return parsed?.package?.file_sha256 ?? ''
  } catch {
    return ''
  }
}

function isoToDate(v: unknown): Date | null {
  if (typeof v !== 'string' || v.trim() === '') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * POST /api/engine/ingest
 */
engineIngestRouter.post('/ingest', async (req, res) => {
  const raw = req.body
  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
    return res.status(422).json({
      ok: false,
      error: 'Payload failed contract validation (aiva.system_a.result/3.0)',
      issues: ['Request body is not valid or empty'],
      http: 422,
    })
  }

  // 1. Contract validation
  const parsed = engineResultV3Schema.safeParse(raw)
  if (!parsed.success) {
    return res.status(422).json({
      ok: false,
      error: 'Payload failed contract validation (aiva.system_a.result/3.0)',
      issues: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
      http: 422,
    })
  }
  const engine = parsed.data

  const validationId = engine.request.validation_id
  const fileSha256 = engine.package.file_sha256
  const dmsDocId = engine.request.dms_doc_id ?? engine.package.dms_doc_id

  // 2. Idempotency check
  const existingRun = await prisma.validationRun.findUnique({
    where: { validationId },
    include: { document: { select: { id: true, fileSha256: true } } },
  })
  if (existingRun) {
    const storedSha = existingRun.document?.fileSha256 ?? safeSha(existingRun.rawEngineResult)
    if (storedSha === fileSha256) {
      return res.json(replay(existingRun.documentId, validationId, existingRun.validationRound))
    }
    return res.status(409).json({
      ok: false,
      error: `validation_id "${validationId}" was already ingested for a different file_sha256`,
      http: 409,
    })
  }

  // 3. Transform into Portal contract
  let doc: PortalInvoiceDocument
  try {
    doc = transformValidatedEngineResult(engine)
  } catch (e: any) {
    if (e instanceof EngineResultValidationError) {
      return res.status(422).json({ ok: false, error: 'Payload failed contract validation', issues: e.issues, http: 422 })
    }
    throw e
  }

  const receiptNum = doc.receiptNums[0] ?? null

  const docData = {
    dmsDocId: doc.dmsDocId,
    packageId: doc.packageId,
    fileSha256: doc.fileSha256,
    pageCount: doc.pageCount,
    invoiceNum: doc.invoiceNum,
    invoiceDate: doc.invoiceDate,
    companyCode: doc.companyCode,
    supplierTaxId: doc.supplierTaxId,
    supplierName: doc.supplierName,
    grandTotal: doc.grandTotal,
    currency: doc.currency,
    status: doc.status,
    recommendation: doc.recommendation,
    maxSeverity: doc.maxSeverity,
    receiverName: doc.receiverName ?? null,
    receiptNum,
    linesMatched: doc.linesMatched ?? null,
    assignedRole: doc.assignedRole,
    apStatus: doc.apStatus,
    payloadJson: JSON.stringify(doc),
  }

  const completedAt = isoToDate(engine.request.completed_at) ?? new Date()

  try {
    await prisma.$transaction(async (tx) => {
      await tx.document.upsert({
        where: { id: doc.id },
        create: { id: doc.id, ...docData },
        update: docData,
      })
      await tx.validationRun.create({
        data: {
          documentId: doc.id,
          validationId,
          correlationId: engine.request.correlation_id ?? null,
          validationRound: engine.request.validation_round,
          rawEngineResult: JSON.stringify(raw),
          completedAt,
        },
      })
    })
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const raced = await prisma.validationRun.findUnique({ where: { validationId } })
      if (raced) return res.json(replay(raced.documentId, validationId, raced.validationRound))
    }
    throw e
  }

  return res.json({
    ok: true,
    result: 'STORED',
    dmsDocId: doc.dmsDocId,
    portalDocId: doc.id,
    validationId,
    validationRound: engine.request.validation_round,
    http: 200,
  })
})
