export type InvoiceStatus =
  | 'Auto-pass'
  | 'Review'
  | 'Hold'
  | 'Manual Review'
  | 'Confirmed'
  | 'Sent'
  | 'Posted'
  | 'Rejected'
  | 'Superseded'
  | 'Duplicate'
  | 'Import Failed'

import type {
  PortalOracleReceiptLine,
  PortalBoundingBox,
  PortalFinding,
  PortalFindingTarget,
  FindingMissingReason,
} from '../features/engine/types/portalDomain'
export type { PortalOracleReceiptLine, PortalBoundingBox, FindingMissingReason }

/** One evidence button: an Engine evidence row (see `src/features/evidence/findings.ts`). */
export type Finding = PortalFinding
export type FindingTarget = PortalFindingTarget

export type ExceptionSeverity = 'High' | 'Medium' | 'Low'

export interface RuleCheck {
  id: string
  exception_code?: string
  rule: string
  name: string
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP'
  result?: 'pass' | 'fail' | 'not_evaluated' | 'manual_review'
  severity?: ExceptionSeverity
  detail?: string
  evidence?: string
  diff?: number
  expected?: number | string
  actual?: number | string
  page?: number
  halted_by?: string
  /** @deprecated single box per rule; use `findings[].targets` (one button per finding). */
  bbox?: { x: number; y: number; w: number; h: number; page?: number }
  /**
   * Every Engine evidence row of this rule. Absent on mock / pre-findings documents — read it
   * through `findingsOf()` which falls back to one finding built from the fields above.
   */
  findings?: Finding[]
}

export interface InvoiceLineItem {
  no: number
  desc: string
  qty: number
  unit: string
  price: number
  amount: number
  po_line?: number
  po_qty?: number
  po_price?: number
  gr_line?: number
  gr_qty?: number
  match_level?: string
  diff?: boolean
}

export interface DocumentHistoryEntry {
  dt: string
  t: string
  who: string
  role?: string
  act: string
  d?: string
  rs?: string
  nt?: string
  k?: string
}

export interface InvoiceDoc {
  doc: string
  company: string
  vendor: string
  stax: string
  inv: string
  dt: string
  total: number
  sub?: number
  vat?: number
  po?: string
  rcv?: string
  org?: number | null
  release?: string | null
  oname?: string | null
  upl?: string
  sig?: number[]
  custOn?: string
  rtotal?: number | null
  receiver?: string
  receiverActive?: boolean
  assigned?: 'eu' | 'acc'
  status: InvoiceStatus
  up: string
  /** v5.7: วันที่สร้างเอกสารใน Portal (YYYY-MM-DD) — ตัวกรอง "วันที่สร้างเอกสาร" · ไม่มี = ใช้ `up` */
  created?: string
  codes: string[]
  rules: RuleCheck[]
  lines?: InvoiceLineItem[]
  oracleReceiptLines?: PortalOracleReceiptLine[]
  pages: number
  /**
   * v5.11.1: page geometry the Engine measured its boxes on (PyMuPDF `page.rect`, incl. /Rotate).
   * The viewer compares it with the PDF it opened: a different page shape means a different file
   * (e.g. the Paperless archive instead of the original) and the boxes would land in the wrong place.
   */
  pageFrames?: { pageNo: number; widthPt: number; heightPt: number; rotation: number }[]
  history: DocumentHistoryEntry[]
  unres?: boolean
  /**
   * Business identity of the document (RESOLVED | NOT_FOUND | UNRESOLVED). UNRESOLVED = OCR could
   * not read the lookup keys: APR only, Confirm disabled, Reject allowed. Absent on pre-v5.6 rows.
   */
  identityStatus?: 'RESOLVED' | 'NOT_FOUND' | 'UNRESOLVED'
  grp?: string
  duplicate_of?: string
  dup?: string
  tc?: string
  halted?: boolean
  supersededBy?: string
  supersedes?: string
  supRule?: string
  dupRule?: string
  dupOverrideBy?: string
  confirmedBy?: string | null
  confirmedAt?: string
  batch?: string | null
  apErr?: string | null
  apId?: string
  round?: number
  owner?: string
  ownerSrc?: string
  ent?: Record<string, unknown>
  badAddr?: string
  bboxes?: PortalBoundingBox[]
  raw_payload?: Record<string, unknown>
}


/**
 * One evidence box picked on the evidence surface, in either direction:
 * detail pane → PDF (focus a rule) or PDF/mock → detail pane (focus a row).
 */
export interface EvidenceSelection {
  ruleId?: string
  exceptionCode?: string
  /** Table row of the picked box, for line-level linking. */
  lineNo?: number
  /** Tag text drawn on the box, reused as the detail-pane chip. */
  label?: string | null
  /** Which surface produced it: `pdf` or `mock`. */
  surface?: 'pdf' | 'mock'
  /** The finding (evidence row) the selection is about — the unit of the 3-state button. */
  findingId?: string
  /** Index into `finding.targets` currently focused (‹ n/m ›). */
  targetIdx?: number
  /** `false` = the finding has no box: the PDF must not move, a banner explains why. */
  locatable?: boolean
}
