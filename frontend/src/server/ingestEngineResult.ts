import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { engineResultV3Schema } from '../features/engine/schemas/engineResultV3Schema'
import {
  EngineResultValidationError,
  transformValidatedEngineResult,
} from '../features/engine/adapters/engineToPortalAdapter'
import type { PortalInvoiceDocument } from '../features/engine/types/portalDomain'

export interface IngestSuccessResult {
  ok: true
  result: 'CREATED' | 'ALREADY_PROCESSED'
  idempotent_replay: boolean
  dmsDocId: string
  portalDocId: string
  validationId: string
  validationRound: number
  status: string
  recommendation: string
  exceptions: number
  http: 200
}

export interface IngestErrorResult {
  ok: false
  error: string
  errors?: string[]
  issues?: string[]
  http: number
}

export type IngestResult = IngestSuccessResult | IngestErrorResult

const replay = (
  dmsDocId: string,
  validationId: string,
  validationRound: number,
  status: string = 'Auto-pass',
  recommendation: string = 'AUTO_PASS',
): IngestSuccessResult => ({
  ok: true,
  result: 'ALREADY_PROCESSED',
  idempotent_replay: true,
  dmsDocId,
  portalDocId: dmsDocId,
  validationId,
  validationRound,
  status,
  recommendation,
  exceptions: 0,
  http: 200,
})

function safeSha(rawJson: string): string | undefined {
  try {
    const parsed = JSON.parse(rawJson) as { package?: { file_sha256?: string } }
    return parsed?.package?.file_sha256
  } catch {
    return undefined
  }
}

function isoToDate(value: string | null | undefined): Date | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/**
 * Core engine result ingestion function.
 * Validates payload schema, guarantees idempotency on validationId + fileSha256,
 * writes to Document and ValidationRun atomically, and returns structured result.
 */
export async function ingestEngineResult(raw: unknown): Promise<IngestResult> {
  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
    return {
      ok: false,
      error: 'Payload failed contract validation (aiva.system_a.result/3.0)',
      errors: ['Request body is not valid or empty'],
      issues: ['Request body is not valid or empty'],
      http: 422,
    }
  }

  // 1. Contract validation (includes the Portal-owned-key decoupling guard).
  const parsed = engineResultV3Schema.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`)
    return {
      ok: false,
      error: 'Payload failed contract validation (aiva.system_a.result/3.0)',
      errors: issues,
      issues,
      http: 422,
    }
  }

  const engine = parsed.data
  const validationId = engine.request.validation_id
  const fileSha256 = engine.package.file_sha256
  const dmsDocId = engine.request.dms_doc_id ?? engine.package.dms_doc_id

  // 2. Idempotency: validation_id is unique, and must belong to one file only.
  const existingRun = await prisma.validationRun.findUnique({
    where: { validationId },
    include: { document: { select: { id: true, fileSha256: true, status: true, recommendation: true } } },
  })

  if (existingRun) {
    const storedSha = existingRun.document?.fileSha256 ?? safeSha(existingRun.rawEngineResult)
    if (storedSha === fileSha256) {
      return replay(
        existingRun.documentId,
        validationId,
        existingRun.validationRound,
        existingRun.document?.status ?? 'Auto-pass',
        existingRun.document?.recommendation ?? 'AUTO_PASS',
      )
    }
    return {
      ok: false,
      error: `validation_id "${validationId}" was already ingested for a different file_sha256`,
      http: 409,
    }
  }

  // 3. Transform into the Portal contract.
  let doc: PortalInvoiceDocument
  try {
    doc = transformValidatedEngineResult(engine)
  } catch (e) {
    if (e instanceof EngineResultValidationError) {
      return {
        ok: false,
        error: 'Payload failed contract validation',
        errors: e.issues,
        issues: e.issues,
        http: 422,
      }
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
    await prisma.$transaction(async (tx: any) => {
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
    if (e?.code === 'P2002') {
      const raced = await prisma.validationRun.findUnique({
        where: { validationId },
        include: { document: { select: { status: true, recommendation: true } } },
      })
      if (raced) {
        return replay(
          raced.documentId,
          validationId,
          raced.validationRound,
          raced.document?.status ?? 'Auto-pass',
          raced.document?.recommendation ?? 'AUTO_PASS',
        )
      }
    }
    return {
      ok: false,
      error: 'Ingestion failed while writing to the database',
      http: 500,
    }
  }

  return {
    ok: true,
    result: 'CREATED',
    idempotent_replay: false,
    dmsDocId,
    portalDocId: doc.id,
    validationId,
    validationRound: engine.request.validation_round,
    status: doc.status,
    recommendation: doc.recommendation,
    exceptions: doc.exceptions.length,
    http: 200,
  }
}
