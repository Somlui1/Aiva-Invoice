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

import type { PortalOracleReceiptLine, PortalBoundingBox } from '../features/engine/types/portalDomain'
export type { PortalOracleReceiptLine, PortalBoundingBox }

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
  bbox?: { x: number; y: number; w: number; h: number; page?: number }
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
  codes: string[]
  rules: RuleCheck[]
  lines?: InvoiceLineItem[]
  oracleReceiptLines?: PortalOracleReceiptLine[]
  pages: number
  history: DocumentHistoryEntry[]
  unres?: boolean
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
}
