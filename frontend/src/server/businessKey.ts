/**
 * Business identity of an ingested invoice (design: Portal standard `identity.*`).
 *
 *   RESOLVED   → Oracle found the receipt. PRIMARY key   = receive_id
 *   NOT_FOUND  → Oracle was asked / halted, no receipt.  SECONDARY key = supplier_tax_id + invoice_num
 *   UNRESOLVED → the keys themselves could not be read.  NO key — never matched automatically
 *
 * Pure module: no database, no zod runtime. `ingestEngineResult` resolves the identity once, before
 * anything is written, so a contract violation is a clean 422 and never a half-written document.
 *
 * The identity is NOT a database key. `Document.id` (DMS id) stays the only technical unique id;
 * `receiveId` / `secondaryKey` are plain indexed columns because Superseded / Duplicate rows of the
 * same invoice must remain stored.
 */

export const IDENTITY_STATUSES = ['RESOLVED', 'NOT_FOUND', 'UNRESOLVED'] as const
export type IdentityStatus = (typeof IDENTITY_STATUSES)[number]

export type IdentityReason = 'FOUND' | 'RECEIPT_NOT_FOUND' | 'HALTED_BEFORE_LOOKUP' | 'KEYS_UNREADABLE'

/** Portal standard: `identity.receive_id` for RESOLVED. */
export const RECEIVE_ID_PATTERN = /^[A-Z0-9-]{4,30}$/

export interface DocumentIdentity {
  status: IdentityStatus
  reason: IdentityReason
  /** Normalised. Non-null only when `status === 'RESOLVED'`. */
  receiveId: string | null
  /** Normalised `taxId|invoiceNum`. Null for UNRESOLVED and whenever either half is unreadable. */
  secondaryKey: string | null
  /** UNRESOLVED only: which keys OCR could not read. Empty otherwise. */
  missingKeys: string[]
  lookupPath: string | null
  /** `payload` = the Engine sent an `identity` block; `derived` = the Portal worked it out. */
  source: 'payload' | 'derived'
}

/** The contract was violated; `issues` are returned verbatim in the 422 body. */
export class IdentityValidationError extends Error {
  readonly issues: string[]
  constructor(issues: string[]) {
    super(`Identity failed validation: ${issues.join('; ')}`)
    this.name = 'IdentityValidationError'
    this.issues = issues
  }
}

export interface IdentityInput {
  /** `engine.identity` as sent, or undefined when the Engine does not send the block. */
  identity?: {
    status: IdentityStatus
    reason?: IdentityReason
    receive_id?: string | null
    lookup_path?: string | null
    missing_keys?: string[]
  } | null
  /** `oracle_snapshot.receipt_nums` — used only when `identity` is absent. */
  receiptNums?: readonly string[]
  /** `oracle_snapshot.queried` — false means the run halted before the Oracle lookup. */
  oracleQueried?: boolean | null
  lookupPath?: string | null
  /** OCR values, raw. */
  supplierTaxId?: string | null
  invoiceNum?: string | null
}

// ---------------------------------------------------------------------------- normalisation

const blank = (v: unknown): v is null | undefined | '' =>
  v == null || (typeof v === 'string' && v.trim() === '')

/** `0105-5400 08888` → `0105540008888`. OCR spacing / hyphens must not split one supplier in two. */
export function normalizeTaxId(v: string | null | undefined): string | null {
  if (blank(v)) return null
  const out = String(v).normalize('NFKC').replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  return out === '' ? null : out
}

/** Case and surrounding / repeated whitespace are noise; characters inside the number are not. */
export function normalizeInvoiceNum(v: string | null | undefined): string | null {
  if (blank(v)) return null
  const out = String(v).normalize('NFKC').trim().replace(/\s+/g, ' ').toUpperCase()
  return out === '' ? null : out
}

export function normalizeReceiveId(v: string | null | undefined): string | null {
  if (blank(v)) return null
  return String(v).normalize('NFKC').trim().toUpperCase()
}

/**
 * Secondary key = supplier_tax_id + invoice_num. Both halves are required: a half-read key is not a
 * key (matching on "any invoice of this supplier" or "any supplier with invoice 001" would merge
 * unrelated documents).
 */
export function buildSecondaryKey(
  supplierTaxId: string | null | undefined,
  invoiceNum: string | null | undefined,
): string | null {
  const tax = normalizeTaxId(supplierTaxId)
  const inv = normalizeInvoiceNum(invoiceNum)
  return tax && inv ? `${tax}|${inv}` : null
}

// ---------------------------------------------------------------------------- resolution

const REASON_FOR_STATUS: Record<IdentityStatus, readonly IdentityReason[]> = {
  RESOLVED: ['FOUND'],
  NOT_FOUND: ['RECEIPT_NOT_FOUND', 'HALTED_BEFORE_LOOKUP'],
  UNRESOLVED: ['KEYS_UNREADABLE'],
}

/** The keys the Oracle lookup needs (PO number is display-only and never decides a lookup). */
function missingLookupKeys(supplierTaxId: string | null | undefined, invoiceNum: string | null | undefined) {
  const missing: string[] = []
  if (!normalizeTaxId(supplierTaxId)) missing.push('supplier_tax_id')
  if (!normalizeInvoiceNum(invoiceNum)) missing.push('invoice_num')
  return missing
}

/**
 * Decide the identity of one Engine result, or throw `IdentityValidationError`.
 *
 * With an explicit `identity` block the block is authoritative and must satisfy:
 *   RESOLVED   → receive_id present and ^[A-Z0-9-]{4,30}$
 *   NOT_FOUND  → receive_id === null
 *   UNRESOLVED → receive_id === null and missing_keys non-empty
 * Without a block (engine v6.6 corpus) the identity is derived from the Oracle snapshot:
 *   receipt found → RESOLVED · keys readable, no receipt → NOT_FOUND · keys unreadable → UNRESOLVED.
 */
export function resolveIdentity(input: IdentityInput): DocumentIdentity {
  const block = input.identity ?? null
  const issues: string[] = []

  let status: IdentityStatus
  let reason: IdentityReason
  let receiveId: string | null
  let missingKeys: string[]
  let lookupPath = input.lookupPath ?? null
  let source: DocumentIdentity['source']

  if (block) {
    source = 'payload'
    if (!(IDENTITY_STATUSES as readonly string[]).includes(block.status)) {
      throw new IdentityValidationError([
        `identity.status: must be one of ${IDENTITY_STATUSES.join(' | ')} (got ${String(block.status)})`,
      ])
    }
    status = block.status
    receiveId = normalizeReceiveId(block.receive_id)
    missingKeys = (block.missing_keys ?? []).filter(k => typeof k === 'string' && k.trim() !== '')
    lookupPath = block.lookup_path ?? lookupPath

    if (status === 'RESOLVED') {
      if (receiveId == null) issues.push('identity.receive_id: RESOLVED requires a receive_id')
      else if (!RECEIVE_ID_PATTERN.test(receiveId)) {
        issues.push('identity.receive_id: RESOLVED requires a receive_id matching ^[A-Z0-9-]{4,30}$')
      }
    } else {
      // NOT_FOUND / UNRESOLVED: "no receive_id" means null — an empty string is not null.
      if (block.receive_id != null) issues.push(`identity.receive_id: ${status} requires receive_id = null`)
      if (status === 'UNRESOLVED' && missingKeys.length === 0) {
        issues.push('identity.missing_keys: UNRESOLVED requires at least one missing key')
      }
    }

    reason = block.reason ?? (REASON_FOR_STATUS[status][0] as IdentityReason)
    if (block.reason && !REASON_FOR_STATUS[status].includes(block.reason)) {
      issues.push(`identity.reason: ${block.reason} is not valid for ${status}`)
    }
    if (status !== 'UNRESOLVED') missingKeys = []
  } else {
    source = 'derived'
    const found = normalizeReceiveId((input.receiptNums ?? []).find(n => !blank(n)))
    const missing = missingLookupKeys(input.supplierTaxId, input.invoiceNum)
    if (found) {
      status = 'RESOLVED'
      reason = 'FOUND'
      receiveId = found
      missingKeys = []
      if (!RECEIVE_ID_PATTERN.test(found)) {
        issues.push('oracle_snapshot.receipt_nums[0]: receive_id must match ^[A-Z0-9-]{4,30}$')
      }
    } else if (missing.length === 0) {
      status = 'NOT_FOUND'
      reason = input.oracleQueried === false ? 'HALTED_BEFORE_LOOKUP' : 'RECEIPT_NOT_FOUND'
      receiveId = null
      missingKeys = []
    } else {
      status = 'UNRESOLVED'
      reason = 'KEYS_UNREADABLE'
      receiveId = null
      missingKeys = missing
    }
  }

  if (issues.length) throw new IdentityValidationError(issues)

  return {
    status,
    reason,
    receiveId: status === 'RESOLVED' ? receiveId : null,
    // UNRESOLVED has no reliable key by definition, even if OCR happened to read both halves.
    secondaryKey: status === 'UNRESOLVED' ? null : buildSecondaryKey(input.supplierTaxId, input.invoiceNum),
    missingKeys,
    lookupPath,
    source,
  }
}
