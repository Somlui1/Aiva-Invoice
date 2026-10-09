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

export type CompanyCode = 'AH' | 'AHT' | 'AHP' | 'AM'

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

export type PortalStepStatus = 'ok' | 'warn' | 'fail'

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
  pageType: 'TAX_INVOICE' | 'DELIVERY_ORDER' | 'PO' | 'RECEIPT' | 'UNKNOWN'
}

export interface PortalBoundingBox {
  id: string
  pageNo: number
  /** `[x, y, w, h]` normalized 0..1 (top-left origin). */
  bbox: [number, number, number, number]
  elementType: 'field' | 'table' | 'row' | 'cell' | 'word' | 'signature'
  fieldName?: string
  rawValue?: string
  confidence: number
  /** Associated rule (e.g. "V-07"). */
  ruleId?: string
  /** Associated exception (e.g. "E10"). */
  exceptionCode?: string
  severity?: 'Low' | 'Medium' | 'High'
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
  lookupPath?: string
  orgId?: number
  ouName?: string
  receiptTotal?: number
  invoiceVsReceiptDiff?: number
  linesMatched?: string
  lineItems: PortalLineItem[]

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
}
