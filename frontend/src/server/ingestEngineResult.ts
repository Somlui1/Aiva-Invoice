import { prisma } from '../lib/prisma'
import { engineResultV3Schema, type EngineResultV3 } from '../features/engine/schemas/engineResultV3Schema'
import {
  EngineResultValidationError,
  transformValidatedEngineResult,
} from '../features/engine/adapters/engineToPortalAdapter'
import type { PortalHistoryEntry, PortalInvoiceDocument } from '../features/engine/types/portalDomain'
import { IdentityValidationError, resolveIdentity, type DocumentIdentity } from './businessKey'
import { ENGINE_RANK, decide, type DrCandidate, type DrDecision } from './duplicateResolution'

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
  /** RESOLVED | NOT_FOUND | UNRESOLVED (null only for a row written before business keys existed). */
  identity_status: string | null
  /** DR rule applied when the document was ingested: DR-01 … DR-05, DR-07. */
  applied_rule: string | null
  /** RECEIVE_ID | SECONDARY_KEY when an earlier document of the same invoice was found. */
  matched_by: string | null
  /** DR-01 / DR-02: the older document this one superseded. */
  supersedes: string | null
  /** DR-03 / DR-04: the current document this one duplicates. */
  duplicate_of: string | null
  http: 200
}

export interface IngestErrorResult {
  ok: false
  error: string
  /** Machine-readable reason for the 409s below. */
  code?: 'DOCUMENT_NOT_REVALIDATABLE' | 'STALE_VALIDATION_ROUND'
  errors?: string[]
  issues?: string[]
  http: number
}

export type IngestResult = IngestSuccessResult | IngestErrorResult

/** Columns of the document an idempotent replay reports back. */
const REPLAY_DOC_SELECT = {
  id: true,
  fileSha256: true,
  status: true,
  recommendation: true,
  identityStatus: true,
  drRule: true,
  drMatchedBy: true,
  supersedesId: true,
  duplicateOfId: true,
} as const

interface ReplayDocRow {
  id: string
  fileSha256: string
  status: string
  recommendation: string
  identityStatus: string | null
  drRule: string | null
  drMatchedBy: string | null
  supersedesId: string | null
  duplicateOfId: string | null
}

interface ExistingRun {
  documentId: string
  validationRound: number
  rawEngineResult: string
  document: ReplayDocRow | null
}

const replay = (run: ExistingRun, validationId: string): IngestSuccessResult => ({
  ok: true,
  result: 'ALREADY_PROCESSED',
  idempotent_replay: true,
  dmsDocId: run.documentId,
  portalDocId: run.documentId,
  validationId,
  validationRound: run.validationRound,
  status: run.document?.status ?? 'Auto-pass',
  recommendation: run.document?.recommendation ?? 'AUTO_PASS',
  exceptions: 0,
  identity_status: run.document?.identityStatus ?? null,
  applied_rule: run.document?.drRule ?? null,
  matched_by: run.document?.drMatchedBy ?? null,
  supersedes: run.document?.supersedesId ?? null,
  duplicate_of: run.document?.duplicateOfId ?? null,
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

/** A validation_id belongs to one file only: same file = replay, different file = conflict. */
function classifyExistingRun(run: ExistingRun, validationId: string, fileSha256: string): IngestResult {
  const storedSha = run.document?.fileSha256 ?? safeSha(run.rawEngineResult)
  if (storedSha === fileSha256) return replay(run, validationId)
  return {
    ok: false,
    error: `validation_id "${validationId}" was already ingested for a different file_sha256`,
    http: 409,
  }
}

/**
 * Duplicate resolution reads the current document of an invoice and then writes; two concurrent
 * ingests of the same invoice would both see "no current document". Serialising the critical
 * section makes the decision race-free inside one Node process (the deployment is a single
 * container). A multi-instance deployment needs a database-level lock instead — see the changelog.
 */
let ingestTail: Promise<unknown> = Promise.resolve()
function withIngestLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = ingestTail.then(fn)
  ingestTail = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

const asRecord = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

function identityInputFor(engine: EngineResultV3, doc: PortalInvoiceDocument) {
  const os = asRecord(engine.oracle_snapshot)
  return {
    identity: engine.identity ?? null,
    receiptNums: Array.isArray(os.receipt_nums)
      ? os.receipt_nums.filter((n): n is string => typeof n === 'string')
      : [],
    oracleQueried: typeof os.queried === 'boolean' ? os.queried : null,
    lookupPath: typeof os.lookup_path === 'string' ? os.lookup_path : null,
    supplierTaxId: doc.supplierTaxId,
    invoiceNum: doc.invoiceNum,
  }
}

/** Earlier documents that could be "the same invoice" (the pure rules re-check every one). */
export async function findCandidates(db: any, identity: DocumentIdentity, excludeId: string): Promise<DrCandidate[]> {
  const or: Record<string, unknown>[] = []
  if (identity.status === 'RESOLVED' && identity.receiveId) {
    or.push({ receiveId: identity.receiveId })
    // Same invoice under any receive_id (v5.11: 1 invoice = 1 receive_id), including an earlier
    // NOT_FOUND scan that has no receive_id at all.
    if (identity.secondaryKey) or.push({ secondaryKey: identity.secondaryKey })
  } else if (identity.status === 'NOT_FOUND' && identity.secondaryKey) {
    or.push({ secondaryKey: identity.secondaryKey })
  }
  if (or.length === 0) return [] // UNRESOLVED, or a key too incomplete to match on

  return db.document.findMany({
    where: { id: { not: excludeId }, OR: or },
    select: {
      id: true,
      status: true,
      identityStatus: true,
      receiveId: true,
      secondaryKey: true,
      isLocked: true,
      createdAt: true,
    },
  })
}

const matchedByText = (identity: DocumentIdentity, by: DrDecision['matchedBy']) =>
  by === 'RECEIVE_ID' ? `receive_id ${identity.receiveId}` : 'supplier_tax_id + invoice_num'

function historyFor(
  identity: DocumentIdentity,
  decision: DrDecision,
  engineStatus: string,
  at: string,
): PortalHistoryEntry[] {
  const entry = (act: string, detail: string): PortalHistoryEntry => ({
    dt: at,
    who: 'ระบบ Portal (DR)',
    role: 'SYSTEM',
    act,
    detail,
  })

  if (identity.status === 'UNRESOLVED') {
    return [
      entry(
        'Manual Review · UNRESOLVED (DR-07)',
        `อ่านคีย์ไม่ได้ (${identity.missingKeys.join(', ')}) → ไม่จับคู่อัตโนมัติ · ไม่ทราบเจ้าของ · รอ APR ตัดสิน (Reject ได้ · Confirm ไม่ได้)`,
      ),
    ]
  }
  const cur = decision.current
  switch (decision.rule) {
    case 'DR-01':
    case 'DR-02':
      return [
        entry(
          `แทนที่ ${cur!.id} (${decision.rule})`,
          `ฉบับใหม่${decision.rule === 'DR-01' ? 'ดีกว่า' : 'เท่าเดิม'} (${engineStatus} vs ${cur!.status}) → ฉบับเดิม ${cur!.id} เป็น Superseded · จับคู่ด้วย ${matchedByText(identity, decision.matchedBy)}`,
        ),
      ]
    case 'DR-03':
      return [
        entry(
          `Duplicate ของ ${cur!.id} (DR-03)`,
          `ฉบับใหม่แย่กว่า (${engineStatus} vs ${cur!.status}) → ฉบับใหม่ Duplicate · จับคู่ด้วย ${matchedByText(identity, decision.matchedBy)}`,
        ),
      ]
    case 'DR-04':
      return [
        entry(
          `Duplicate ของ ${cur!.id} (DR-04)`,
          `ฉบับเดิม ${cur!.id} อยู่ในสถานะ ${cur!.status} → ฉบับใหม่ Duplicate ทันที · จับคู่ด้วย ${matchedByText(identity, decision.matchedBy)}`,
        ),
      ]
    case 'DR-06':
      return [
        entry(
          `Duplicate ของ ${cur!.id} (DR-06)`,
          `receive_id ${identity.receiveId} เป็นของใบแจ้งหนี้อื่นอยู่แล้ว (${cur!.id} · ${cur!.status}) → ฉบับใหม่ Duplicate · 1 ใบแจ้งหนี้ = 1 ใบรับ ข้อมูลขัดแย้ง ต้องตรวจเอกสาร`,
        ),
      ]
    default:
      return []
  }
}

/**
 * Merge the identity + the DR decision into the Portal document that will be stored.
 * Everything here is Portal-owned state; the Engine's findings (rules, bboxes, exceptions) pass
 * through untouched.
 */
function applyDecision(
  doc: PortalInvoiceDocument,
  identity: DocumentIdentity,
  decision: DrDecision,
  previous: Partial<PortalInvoiceDocument> | null,
  at: string,
): PortalInvoiceDocument {
  const engineStatus = doc.status
  const out: PortalInvoiceDocument = {
    ...doc,
    status: decision.newStatus as PortalInvoiceDocument['status'],
    identity: {
      status: identity.status,
      reason: identity.reason,
      receiveId: identity.receiveId,
      secondaryKey: identity.secondaryKey,
      missingKeys: identity.missingKeys,
      lookupPath: identity.lookupPath,
      source: identity.source,
    },
  }

  if (identity.status === 'UNRESOLVED') {
    // Owner = Unknown, APR only. The Engine cannot lift it: status is forced by `decide`.
    out.assignedRole = 'APR'
    delete out.receiverName
    delete out.receiverAccount
  }

  // A re-validation of the same DMS document keeps what the Portal already recorded about it.
  const carried = previous?.history ?? []
  const fresh = historyFor(identity, decision, engineStatus, at)
  out.history = [...carried]
  if (fresh.length) {
    if (out.history.length === 0) {
      out.history.push({
        dt: doc.updatedAt || at,
        who: 'ระบบตรวจสอบอัตโนมัติ (System A)',
        role: 'Engine',
        act: 'ตรวจเอกสารเสร็จสิ้น',
        detail: `ผลตรวจ ${engineStatus} · ความรุนแรงสูงสุด ${doc.maxSeverity}`,
      })
    }
    out.history.push(...fresh)
  }

  if (decision.supersede) {
    out.supersedes = decision.supersede.id
    out.supRule = decision.rule
  } else if (previous?.supersedes) {
    out.supersedes = previous.supersedes
    out.supRule = previous.supRule
  }

  if (decision.duplicateOf) {
    out.duplicateOf = decision.duplicateOf.id
    out.dupRule = decision.rule
    out.duplicateStatus = 'potential_duplicate'
    out.stepProgress = { ...out.stepProgress, step4: { status: 'warn', label: 'อาจซ้ำ' } }
  }
  return out
}

type TxOutcome =
  | { kind: 'result'; result: IngestResult }
  | { kind: 'created'; doc: PortalInvoiceDocument; decision: DrDecision }

/**
 * Core engine result ingestion function.
 *
 * 1. Validates the payload against the Engine contract.
 * 2. Guarantees idempotency on validation_id + file_sha256 (an exact retry changes nothing).
 * 3. Resolves the business identity (RESOLVED / NOT_FOUND / UNRESOLVED) — a violation is a 422.
 * 4. Inside ONE transaction: finds the current document of the same invoice, applies the duplicate
 *    resolution rules (src/server/duplicateResolution.ts), writes Document + ValidationRun, marks
 *    a superseded document, and records the audit trail.
 *
 * `Document.id` (the DMS id) is the only technical unique key; receive_id is never unique, because
 * Superseded / Duplicate history of the same receipt must stay stored.
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
    include: { document: { select: REPLAY_DOC_SELECT } },
  })
  if (existingRun) return classifyExistingRun(existingRun as ExistingRun, validationId, fileSha256)

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

  // 4. Business identity — resolved and validated BEFORE anything is written.
  let identity: DocumentIdentity
  try {
    identity = resolveIdentity(identityInputFor(engine, doc))
  } catch (e) {
    if (e instanceof IdentityValidationError) {
      return {
        ok: false,
        error: 'Payload failed identity validation',
        errors: e.issues,
        issues: e.issues,
        http: 422,
      }
    }
    throw e
  }

  const completedAt = isoToDate(engine.request.completed_at) ?? new Date()
  const nowIso = new Date().toISOString()

  let outcome: TxOutcome
  try {
    outcome = await withIngestLock(() =>
      prisma.$transaction(
        async (tx: any): Promise<TxOutcome> => {
          // A concurrent identical request may have won while this one waited for the lock.
          const raced = await tx.validationRun.findUnique({
            where: { validationId },
            include: { document: { select: REPLAY_DOC_SELECT } },
          })
          if (raced) return { kind: 'result', result: classifyExistingRun(raced as ExistingRun, validationId, fileSha256) }

          // The same DMS document arriving again with a NEW validation_id is a re-validation.
          // Only a document still in an Engine state may be re-validated in place; anything the
          // Portal has taken over (Confirmed … Rejected, Superseded, Duplicate, locked) is closed —
          // the new scan must come in under a new dms_doc_id and go through duplicate resolution.
          const existing = await tx.document.findUnique({
            where: { id: doc.id },
            select: { id: true, status: true, isLocked: true, payloadJson: true },
          })
          let previous: Partial<PortalInvoiceDocument> | null = null
          if (existing) {
            if (existing.isLocked || !(existing.status in ENGINE_RANK)) {
              return {
                kind: 'result',
                result: {
                  ok: false,
                  code: 'DOCUMENT_NOT_REVALIDATABLE',
                  error: `Document ${doc.id} is ${existing.isLocked ? 'locked' : existing.status} and cannot be re-validated; submit the new scan under a new dms_doc_id`,
                  http: 409,
                },
              }
            }
            const latest = await tx.validationRun.findFirst({
              where: { documentId: doc.id },
              orderBy: { validationRound: 'desc' },
              select: { validationRound: true },
            })
            if (latest && engine.request.validation_round < latest.validationRound) {
              return {
                kind: 'result',
                result: {
                  ok: false,
                  code: 'STALE_VALIDATION_ROUND',
                  error: `validation_round ${engine.request.validation_round} is older than the stored round ${latest.validationRound} for ${doc.id}`,
                  http: 409,
                },
              }
            }
            try {
              previous = JSON.parse(existing.payloadJson) as Partial<PortalInvoiceDocument>
            } catch {
              previous = null
            }
          }

          // Duplicate resolution against the current document of the same invoice.
          const candidates = await findCandidates(tx, identity, doc.id)
          const decision = decide({ identity, engineStatus: doc.status, candidates })
          const final = applyDecision(doc, identity, decision, previous, nowIso)

          const base = {
            dmsDocId: final.dmsDocId,
            packageId: final.packageId,
            fileSha256: final.fileSha256,
            pageCount: final.pageCount,
            invoiceNum: final.invoiceNum,
            invoiceDate: final.invoiceDate,
            companyCode: final.companyCode,
            supplierTaxId: final.supplierTaxId,
            supplierName: final.supplierName,
            grandTotal: final.grandTotal,
            currency: final.currency,
            status: final.status,
            recommendation: final.recommendation,
            maxSeverity: final.maxSeverity,
            receiverName: final.receiverName ?? null,
            receiptNum: identity.receiveId,
            linesMatched: final.linesMatched ?? null,
            assignedRole: final.assignedRole,
            apStatus: final.apStatus,
            identityStatus: identity.status,
            receiveId: identity.receiveId,
            secondaryKey: identity.secondaryKey,
            missingKeys: identity.missingKeys.length ? JSON.stringify(identity.missingKeys) : null,
            duplicateOfId: decision.duplicateOf?.id ?? null,
            drRule: decision.rule,
            drMatchedBy: decision.matchedBy,
            payloadJson: JSON.stringify(final),
          }

          await tx.document.upsert({
            where: { id: final.id },
            create: { id: final.id, ...base, supersedesId: decision.supersede?.id ?? null },
            // A re-validation must not forget which document it already replaced.
            update: decision.supersede ? { ...base, supersedesId: decision.supersede.id } : base,
          })

          await tx.validationRun.create({
            data: {
              documentId: final.id,
              validationId,
              correlationId: engine.request.correlation_id ?? null,
              validationRound: engine.request.validation_round,
              rawEngineResult: JSON.stringify(raw),
              completedAt,
            },
          })

          if (decision.supersede) {
            const old = decision.supersede
            const oldRow = await tx.document.findUnique({ where: { id: old.id }, select: { payloadJson: true } })
            let oldPayloadJson: string | undefined
            try {
              const p = JSON.parse(oldRow?.payloadJson ?? '{}') as Record<string, any>
              const history = Array.isArray(p.history) ? [...p.history] : []
              history.push({
                dt: nowIso,
                who: 'ระบบ Portal (DR)',
                role: 'SYSTEM',
                act: `ถูกแทนที่ (Superseded) โดย ${final.id} (${decision.rule})`,
                detail: decision.reason,
              })
              p.status = 'Superseded'
              p.supersededBy = final.id
              p.supRule = decision.rule
              p.history = history
              oldPayloadJson = JSON.stringify(p)
            } catch {
              oldPayloadJson = undefined // unreadable payload: the columns still carry the state
            }
            await tx.document.update({
              where: { id: old.id },
              data: {
                status: 'Superseded',
                supersededById: final.id,
                ...(oldPayloadJson ? { payloadJson: oldPayloadJson } : {}),
              },
            })
            await tx.auditLog.create({
              data: {
                docId: old.id,
                who: 'ระบบ Portal (DR)',
                role: 'SYSTEM',
                act: 'SUPERSEDED',
                action: 'SUPERSEDE',
                fromStatus: old.status,
                toStatus: 'Superseded',
                reason: decision.rule,
                detail: `${decision.rule}: ถูกแทนที่โดย ${final.id} · ${decision.reason}`,
              },
            })
          }

          if (decision.duplicateOf) {
            await tx.auditLog.create({
              data: {
                docId: final.id,
                who: 'ระบบ Portal (DR)',
                role: 'SYSTEM',
                act: 'DUPLICATE',
                action: 'DUPLICATE',
                fromStatus: doc.status,
                toStatus: 'Duplicate',
                reason: decision.rule,
                detail: `${decision.rule}: Duplicate ของ ${decision.duplicateOf.id} · ${decision.reason}`,
              },
            })
          }

          return { kind: 'created', doc: final, decision }
        },
        { timeout: 20_000 },
      ),
    )
  } catch (e: any) {
    if (e?.code === 'P2002') {
      // Lost a unique-constraint race on validation_id: answer as the replay it is.
      const raced = await prisma.validationRun.findUnique({
        where: { validationId },
        include: { document: { select: REPLAY_DOC_SELECT } },
      })
      if (raced) return classifyExistingRun(raced as ExistingRun, validationId, fileSha256)
    }
    console.error(`[ingest] ${dmsDocId} (${validationId}) failed while writing:`, e)
    return {
      ok: false,
      error: 'Ingestion failed while writing to the database',
      http: 500,
    }
  }

  if (outcome.kind === 'result') return outcome.result

  const { doc: stored, decision } = outcome
  return {
    ok: true,
    result: 'CREATED',
    idempotent_replay: false,
    dmsDocId,
    portalDocId: stored.id,
    validationId,
    validationRound: engine.request.validation_round,
    status: stored.status,
    recommendation: stored.recommendation,
    exceptions: stored.exceptions.length,
    identity_status: identity.status,
    applied_rule: decision.rule,
    matched_by: decision.matchedBy,
    supersedes: decision.supersede?.id ?? null,
    duplicate_of: decision.duplicateOf?.id ?? null,
    http: 200,
  }
}
