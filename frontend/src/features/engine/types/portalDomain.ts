/**
 * Portal Standard Domain Model — the Portal's own published contract.
 *
 * The Engine never writes this shape. `EngineToPortalAdapter` (Task 3) is the
 * only place allowed to translate `aiva.system_a.result/3.0` into these types,
 * so Engine schema changes can never leak into the UI.
 *
 * Field names and optionality follow
 * `docs/plans/2026-10-09-enterprise-portal-engine-integration-design.md` §3.1-3.2.
 */

export type PortalDocumentStatus =
  | 'Auto-pass'
  | 'Review'
  | 'Hold'
  | 'Manual Review'
  | 'Confirmed'
  | 'Posted'
  | 'Rejected'
  | 'Duplicate'

/**
 * Company codes owned by the Portal. Extended (approved 2026-10-09) with AHA
 * (org 413) and '?' as the explicit fallback when a document's company cannot be
 * resolved from oracle org_id / customer_tax_id.
 */
export const PORTAL_COMPANY_CODES = ['AH', 'AHT', 'AHP', 'AM', 'AHA', '?'] as const

export type CompanyCode = (typeof PORTAL_COMPANY_CODES)[number]

export type EngineRecommendationValue =
  | 'AUTO_PASS'
  | 'REVIEW'
  | 'HOLD'
  | 'MANUAL_REVIEW'
  | 'SYSTEM_ERROR'

/** `'None'` is used when the Engine reports a clean pass. */
export type PortalSeverity = 'Low' | 'Medium' | 'High' | 'None'

export type PortalAssignedRole = 'EU' | 'ACC' | 'APR' | 'ADM'

export type PortalApStatus = 'unconfirmed' | 'confirmed' | 'sent' | 'posted' | 'failed'

export type PortalDuplicateStatus = 'none' | 'potential_duplicate' | 'overridden'

export type PortalContentKind = 'pdf' | 'image'

/**
 * Portal-owned page classification. Declared as a runtime-readable const so the
 * union is assertable, not just typed. Extended (approved 2026-10-09) to cover
 * what the Engine really emits across the 125-doc corpus — TAX_INVOICE, INVOICE,
 * DELIVERY_NOTE, PO, OSP, SUPPORTING — while keeping the original design-doc
 * members (DELIVERY_ORDER, RECEIPT, UNKNOWN).
 */
export const PORTAL_PAGE_TYPES = [
  'TAX_INVOICE',
  'INVOICE',
  'DELIVERY_NOTE',
  'DELIVERY_ORDER',
  'PO',
  'RECEIPT',
  'OSP',
  'SUPPORTING',
  'UNKNOWN',
] as const

export type PortalPageType = (typeof PORTAL_PAGE_TYPES)[number]

export type PortalStepStatus = 'ok' | 'warn' | 'fail'

/**
 * Overlay element kinds. Declared as a const so the union is assertable.
 * Extended (same approved principle as PORTAL_PAGE_TYPES) to cover all 9
 * `ocr.elements[].element_type` values found in the corpus — the original 6
 * covered only 52.1% of real elements, and dropping `section` (41.8% of all
 * elements), `page` and `stamp` would gut the PDF overlay feature.
 */
export const PORTAL_BBOX_ELEMENT_TYPES = [
  'field',
  'table',
  'row',
  'cell',
  'word',
  'signature',
  'page',
  'section',
  'stamp',
] as const

export type PortalBBoxElementType = (typeof PORTAL_BBOX_ELEMENT_TYPES)[number]

export type PortalStepKey = 'step1' | 'step2' | 'step3' | 'step4'

export interface PortalStepIndicator {
  status: PortalStepStatus
  label: string
}

/** The 4-step progress strip rendered at the top of the Queue / Detail pane. */
export interface PortalStepProgress {
  step1: PortalStepIndicator
  step2: PortalStepIndicator
  step3: PortalStepIndicator
  step4: PortalStepIndicator
}

export interface PortalLineItem {
  no: number
  desc: string
  qty: number
  unit: string
  price: number
  amount: number
  poLine?: number | null
  poQty?: number | null
  poPrice?: number | null
  grLine?: number | null
  grQty?: number | null
  /** Receipt line the Engine matched this invoice line to. */
  rcvLineId?: string | null
  matchLevel?: string | null
  /** True when invoice vs receipt disagrees for this line. */
  diff?: boolean
  pageNo?: number | null
  /** OCR element id, for bi-directional BBox linking. */
  elementId?: string | null
}

export interface PortalOracleReceiptLine {
  poNumber: string
  receiptNum: string
  lineNo: number
  rcvLineId: string
  itemCode?: string | null
  itemDesc: string
  qty: number
  uom: string
  unitPrice: number
  lineAmount: number
  qtyBilled?: number
  lineStatus?: string | null
  poLineStatus?: string | null
  receiver?: string | null
  ouName?: string | null
  extra?: Record<string, unknown>
}

export interface PortalRuleCheck {
  /** V-01 .. V-09 */
  ruleId: string
  ruleVersion: string
  /** Engine verdict, preserved verbatim. */
  result: 'pass' | 'fail' | 'not_evaluated' | 'manual_review'
  /** UI-normalized badge state. */
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP'
  exceptionCode?: string | null
  severity?: PortalSeverity | null
  detail?: string | null
  /** Engine's Thai explanation shown in the detail pane. */
  messageTh?: string | null
  actualValue?: string | number | null
  expectedValue?: string | number | null
  pageNos?: number[]
  evidenceIds: string[]
  haltedBy?: string | null
  evaluatedAt?: string | null
  /**
   * One entry per Engine evidence row of this rule (button-level evidence). The single-valued
   * fields above stay = the first exception finding, for backward compatibility. Optional because
   * payloads stored before this field existed do not carry it (see `legacyFindings`).
   */
  findings?: PortalFinding[]
}

/** Why a finding has no box on the document. `UNKNOWN` = the Engine gave no (valid) reason. */
export type FindingMissingReason =
  | 'NOT_PRESENT'
  | 'NOT_LOCATED'
  | 'PAGES_INCOMPLETE'
  | 'LOW_CONFIDENCE'
  | 'NO_ELEMENT'
  | 'UNKNOWN'

export const FINDING_MISSING_REASONS: readonly FindingMissingReason[] = [
  'NOT_PRESENT', 'NOT_LOCATED', 'PAGES_INCOMPLETE', 'LOW_CONFIDENCE', 'NO_ELEMENT', 'UNKNOWN',
] as const

export type FindingTargetKind = 'row' | 'cell' | 'field' | 'signature' | 'other'

export interface PortalFindingTarget {
  /** Same key as `PortalBoundingBox.id` (`<document_id>:<element_id>`). */
  id: string
  elementId: string
  pageNo: number
  /** `[x, y, w, h]` normalized 0..1. */
  bbox: [number, number, number, number]
  kind: FindingTargetKind
  /** Short display label, e.g. "L7 · qty", "sub_total", "signatures.receiver". */
  label?: string
}

/** One thing the reviewer can look at = one evidence button. */
export interface PortalFinding {
  /** Engine `evidence_id`, or `${ruleId}#${index}` when absent. Unique within the document. */
  id: string
  ruleId: string
  /** `review` = manual_review evidence: no exception code, never an exception. */
  kind: 'exception' | 'review'
  result: PortalRuleCheck['result']
  code: string | null
  severity: 'Low' | 'Medium' | 'High' | null
  messageTh: string | null
  actual: string | number | null
  expected: string | number | null
  fieldName?: string | null
  lineNo?: number | null
  relatedElementIds: string[]
  oracleRefs: string[]
  /** Empty = "no position on the document" (3-state button: unlocated). */
  targets: PortalFindingTarget[]
  missingReason?: FindingMissingReason
  missingElementIds?: string[]
}

export interface PortalException {
  /** Engine `exception_id`. */
  id: string
  /** E01 .. E15 */
  code: string
  name: string
  severity: 'Low' | 'Medium' | 'High'
  ruleId: string
  evidenceIds: string[]
  pageNos?: number[]
  messageTh?: string | null
}

/** Portal-owned audit trail entry (mirrors the `AuditLog` table). */
export interface PortalHistoryEntry {
  dt: string
  who: string
  role: string
  act: string
  detail?: string
}

export interface PortalPageMeta {
  pageNo: number
  widthPt: number
  heightPt: number
  rotation: number
  pageType: PortalPageType
}

export interface PortalBoundingBox {
  id: string
  pageNo: number
  /** `[x, y, w, h]` normalized 0..1 (top-left origin). */
  bbox: [number, number, number, number]
  elementType: PortalBBoxElementType
  fieldName?: string
  rawValue?: string
  confidence: number
  /** Associated rule (e.g. "V-07"). */
  ruleId?: string
  /** Associated exception (e.g. "E10"). */
  exceptionCode?: string
  severity?: 'Low' | 'Medium' | 'High'
  /**
   * Every finding this box is evidence for (an element can serve several rules, e.g. `sub_total`
   * for V-03 and V-09). `ruleId` / `exceptionCode` above stay = the first one.
   */
  findingIds?: string[]
}

/**
 * Business identity of a document (v5.6). `receiveId` is the primary business key (RESOLVED only);
 * NOT_FOUND falls back to `secondaryKey` (supplier_tax_id + invoice_num); UNRESOLVED has no key.
 * Written by ingestion (`src/server/businessKey.ts`) — never by the Engine adapter.
 */
export interface PortalIdentity {
  status: 'RESOLVED' | 'NOT_FOUND' | 'UNRESOLVED'
  reason: 'FOUND' | 'RECEIPT_NOT_FOUND' | 'HALTED_BEFORE_LOOKUP' | 'KEYS_UNREADABLE'
  receiveId: string | null
  secondaryKey: string | null
  missingKeys: string[]
  lookupPath?: string | null
  source: 'payload' | 'derived'
}

export interface PortalInvoiceDocument {
  // 1. Identity & DMS Reference
  id: string
  dmsDocId: string
  packageId: string
  fileSha256: string
  pageCount: number
  contentKind: PortalContentKind

  // 2. Invoice Master Data (ERP Ready)
  invoiceNum: string
  /** YYYY-MM-DD */
  invoiceDate: string
  dueDate?: string
  companyCode: CompanyCode
  companyName: string
  companyTaxId: string
  supplierName: string
  supplierTaxId: string
  supplierBranch?: string
  currency: string
  subtotal: number
  vat: number
  grandTotal: number
  poNumbers: string[]
  receiverName?: string
  receiverAccount?: string

  // 3. Oracle Receipt & Matching
  receiptFound: boolean
  /** Oracle receipt numbers the invoice was looked up against. */
  receiptNums: string[]
  lookupPath?: string
  orgId?: number
  ouName?: string
  receiptTotal?: number
  invoiceVsReceiptDiff?: number
  linesMatched?: string
  lineItems: PortalLineItem[]
  oracleReceiptLines?: PortalOracleReceiptLine[]

  // 4. Validation & Rule Results
  recommendation: EngineRecommendationValue
  status: PortalDocumentStatus
  maxSeverity: PortalSeverity
  stepProgress: PortalStepProgress
  rules: PortalRuleCheck[]
  exceptions: PortalException[]

  // 5. OCR & Bounding Box Data
  pages: PortalPageMeta[]
  bboxes: PortalBoundingBox[]

  // 6. Workflow & Governance (Portal Owned)
  assignedRole: PortalAssignedRole
  assignedUserId?: string
  apStatus: PortalApStatus
  apBatchId?: string
  duplicateStatus: PortalDuplicateStatus
  createdAt: string
  updatedAt: string
  history: PortalHistoryEntry[]

  // 7. Business identity & duplicate resolution (Portal owned, written at ingest; absent on older rows)
  identity?: PortalIdentity
  /** DR-01 / DR-02: the older document this one replaced. */
  supersedes?: string
  /** The newer document that replaced this one (set on the old row when it becomes Superseded). */
  supersededBy?: string
  /** DR-03 / DR-04: the current document this one duplicates. */
  duplicateOf?: string
  supRule?: string
  dupRule?: string
}
