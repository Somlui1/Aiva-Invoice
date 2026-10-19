/**
 * Webhook receiver for Engine results — `POST /api/engine/ingest`.
 *
 * This is the contract boundary between the Matching Engine and the Portal:
 *  1. the payload must satisfy `aiva.system_a.result/3.0` (Zod), which also
 *     rejects Portal-owned workflow keys, so the Engine can never drive Portal
 *     state by smuggling fields into its payload;
 *  2. idempotency is keyed on `validation_id`, cross-checked against
 *     `file_sha256` (design §6): an exact replay answers 200 without writing,
 *     while the same validation_id carrying a different file is a conflict;
 *  3. a new `validation_id` for a known document appends a `ValidationRun` and
 *     refreshes the Document to the latest round.
 *
 * The route never reads Engine fields for business meaning — it stores the raw
 * payload for audit and persists the Portal document produced by the adapter.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../../lib/prisma'
import { engineResultV3Schema } from '../../../../features/engine/schemas/engineResultV3Schema'
import {
  EngineResultValidationError,
  transformValidatedEngineResult,
} from '../../../../features/engine/adapters/engineToPortalAdapter'
import type { PortalInvoiceDocument } from '../../../../features/engine/types/portalDomain'

const badRequest = (error: string) =>
  NextResponse.json({ ok: false, error, http: 400 }, { status: 400 })

const unprocessable = (error: string, errors: string[]) =>
  NextResponse.json({ ok: false, error, errors, http: 422 }, { status: 422 })

const replay = (dmsDocId: string, validationId: string, validationRound: number) =>
  NextResponse.json({
    ok: true,
    result: 'ALREADY_PROCESSED',
    idempotent_replay: true,
    dmsDocId,
    portalDocId: dmsDocId,
    validationId,
    validationRound,
    http: 200,
  })

export async function POST(req: NextRequest) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return badRequest('Request body is not valid JSON')
  }

  // 1. Contract validation (includes the Portal-owned-key decoupling guard).
  const parsed = engineResultV3Schema.safeParse(raw)
  if (!parsed.success) {
    return unprocessable(
      'Payload failed contract validation (aiva.system_a.result/3.0)',
      parsed.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`),
    )
  }
  const engine = parsed.data

  const validationId = engine.request.validation_id
  const fileSha256 = engine.package.file_sha256
  const dmsDocId = engine.request.dms_doc_id ?? engine.package.dms_doc_id

  // 2. Idempotency: validation_id is unique, and must belong to one file only.
  const existingRun = await prisma.validationRun.findUnique({
    where: { validationId },
    include: { document: { select: { id: true, fileSha256: true } } },
  })
  if (existingRun) {
    const storedSha =
      existingRun.document?.fileSha256 ?? safeSha(existingRun.rawEngineResult)
    if (storedSha === fileSha256) {
      return replay(existingRun.documentId, validationId, existingRun.validationRound)
    }
    return NextResponse.json(
      {
        ok: false,
        error: `validation_id "${validationId}" was already ingested for a different file_sha256`,
        http: 409,
      },
      { status: 409 },
    )
  }

  // 3. Transform into the Portal contract.
  let doc: PortalInvoiceDocument
  try {
    doc = transformValidatedEngineResult(engine)
  } catch (e) {
    if (e instanceof EngineResultValidationError) {
      return unprocessable('Payload failed contract validation', e.issues)
    }
    throw e
  }

  const receiptNum = doc.receiptNums[0] ?? null

  // Document columns that mirror the latest Portal view of the invoice.
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
    // Document upsert + run insert must land together, otherwise a failed run
    // insert would leave the document describing a round that was never stored.
    await prisma.$transaction(async tx => {
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
  } catch (e) {
    // Lost a race against a concurrent identical push: treat as a replay.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const raced = await prisma.validationRun.findUnique({ where: { validationId } })
      if (raced) return replay(raced.documentId, validationId, raced.validationRound)
    }
    return NextResponse.json(
      { ok: false, error: 'Ingestion failed while writing to the database', http: 500 },
      { status: 500 },
    )
  }

  return NextResponse.json({
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
  })
}

/** Best-effort sha recovery for rows written before the column existed. */
function safeSha(rawJson: string): string | undefined {
  try {
    const parsed = JSON.parse(rawJson) as { package?: { file_sha256?: string } }
    return parsed?.package?.file_sha256
  } catch {
    return undefined
  }
}

function isoToDate(value: string | null | undefined): Date | undefined {
  if (typeof value !== 'string') return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}
