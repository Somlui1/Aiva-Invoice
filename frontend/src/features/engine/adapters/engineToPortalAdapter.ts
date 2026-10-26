/**
 * EngineToPortalAdapter — the only place allowed to translate
 * `aiva.system_a.result/3.0` into the Portal's own domain model.
 *
 * Nothing downstream (UI, context, API responses) may read Engine fields
 * directly, so Engine schema changes are contained here.
 *
 * Conventions ported from the shipped UI (`src/components/queue/InvoiceDetailPane.tsx`):
 *  - the 4-step strip groups rules as 1:[V-01,V-02,V-03,V-06] 2:[V-04,V-05]
 *    3:[V-07,V-08,V-09] and step 4 is the Portal-owned duplicate check;
 *  - a group fails only when a failing rule carries High severity, otherwise a
 *    failing / manual_review rule downgrades it to "warn".
 */
import { engineResultV3Schema, type EngineResultV3 } from '../schemas/engineResultV3Schema'
import {
  PORTAL_PAGE_TYPES,
  PORTAL_COMPANY_CODES,
  type PortalApStatus,
  type PortalAssignedRole,
  type PortalBoundingBox,
  type PortalDuplicateStatus,
  type PortalException,
  type PortalFinding,
  type PortalFindingTarget,
  type FindingMissingReason,
  type FindingTargetKind,
  FINDING_MISSING_REASONS,
  type PortalInvoiceDocument,
  type PortalLineItem,
  type PortalOracleReceiptLine,
  type PortalPageType,
  type PortalRuleCheck,
  type PortalSeverity,
  type PortalStepIndicator,
  type PortalStepProgress,
} from '../types/portalDomain'
import { companyOfOrg, companyOfTax } from '../../../mock/companies'

/** Thrown when a payload violates the Engine contract; Task 4 maps this to 422. */
export class EngineResultValidationError extends Error {
  readonly issues: string[]
  constructor(issues: string[]) {
    super(`Engine result failed contract validation: ${issues.slice(0, 5).join('; ')}`)
    this.name = 'EngineResultValidationError'
    this.issues = issues
  }
}

const RECOMMENDATION_TO_STATUS: Record<string, PortalInvoiceDocument['status']> = {
  AUTO_PASS: 'Auto-pass',
  REVIEW: 'Review',
  HOLD: 'Hold',
  MANUAL_REVIEW: 'Manual Review',
  // Engine-side crash: never auto-clear, a human must look at it.
  SYSTEM_ERROR: 'Manual Review',
}

const STEP_RULE_GROUPS: Record<1 | 2 | 3, string[]> = {
  1: ['V-01', 'V-02', 'V-03', 'V-06'],
  2: ['V-04', 'V-05'],
  3: ['V-07', 'V-08', 'V-09'],
}

const RULE_STATUS: Record<string, PortalRuleCheck['status']> = {
  pass: 'PASS',
  fail: 'FAIL',
  manual_review: 'WARN',
  not_evaluated: 'SKIP',
}

/** Engine numbers arrive as decimal strings; '' / null / NaN all become undefined. */
const num = (v: unknown): number | undefined => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.replace(/,/g, ''))
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v !== '' ? v : undefined

const round2 = (n: number): number => Math.round(n * 100) / 100

/** '50220043288-2' -> 2 (the receipt line number the Portal displays). */
const trailingInt = (v: unknown): number | null => {
  if (typeof v !== 'string') return null
  const m = v.match(/(\d+)\s*$/)
  return m ? Number(m[1]) : null
}

const asRecord = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

/** Company resolution: OCR tax id first, Oracle org_id as fallback, else '?'. */
export function resolveCompanyCode(customerTaxId?: string | null, orgId?: number | null) {
  const byTax = customerTaxId ? companyOfTax(customerTaxId) : '?'
  if ((PORTAL_COMPANY_CODES as readonly string[]).includes(byTax) && byTax !== '?') {
    return byTax as PortalInvoiceDocument['companyCode']
  }
  const byOrg = orgId != null ? companyOfOrg(orgId) : '?'
  if ((PORTAL_COMPANY_CODES as readonly string[]).includes(byOrg) && byOrg !== '?') {
    return byOrg as PortalInvoiceDocument['companyCode']
  }
  return '?' as PortalInvoiceDocument['companyCode']
}

/** Stable, collision-free key for bi-directional PDF<->field linking. */
const bboxId = (documentId: string | null, elementId: string) => `${documentId ?? 'D0'}:${elementId}`

export function transformEngineResultToPortalDoc(raw: unknown): PortalInvoiceDocument {
  const parsed = engineResultV3Schema.safeParse(raw)
  if (!parsed.success) {
    throw new EngineResultValidationError(
      parsed.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`),
    )
  }
  return transformValidatedEngineResult(parsed.data)
}

/**
 * Portal-owned duplicate verdict. The Engine is forbidden from owning this
 * (`duplicate_status` is on the not.anyOf list), and Tasks 4/6 add real
 * detection against previously ingested documents; a freshly ingested payload
 * starts clean.
 */
function deriveDuplicateStatus(_engine: EngineResultV3): PortalDuplicateStatus {
  return 'none'
}

export function transformValidatedEngineResult(engine: EngineResultV3): PortalInvoiceDocument {
  const nf = asRecord(engine.normalized_fields)
  const os = asRecord(engine.oracle_snapshot)
  const summary = asRecord(engine.summary)
  const itemsSummary = asRecord(nf.items_summary)

  const dmsDocId = engine.request.dms_doc_id ?? engine.package.dms_doc_id
  const orgId = typeof os.org_id === 'number' ? os.org_id : undefined
  const companyTaxId = str(nf.customer_tax_id)
  const companyCode = resolveCompanyCode(companyTaxId, orgId)

  const subtotal = num(nf.sub_total) ?? 0
  const vat = num(nf.vat) ?? 0
  const grandTotal = num(nf.grand_total) ?? 0

  /** Stable, collision-free key for bi-directional PDF<->field linking. */
  const docIdByElement = new Map<string, string>()
  for (const el of engine.ocr.elements) {
    if (!docIdByElement.has(el.element_id)) docIdByElement.set(el.element_id, el.document_id)
  }
  // Invoice line items and evidence rows reference an element_id without a
  // document_id, so the prefix must come from the OCR index or the two sides of
  // the linkage would never match.
  const linkKey = (elementId: string, documentId?: string | null) =>
    bboxId(documentId ?? docIdByElement.get(elementId) ?? null, elementId)

  // ---------- rules, enriched from the evidence rows the Engine emitted ----------
  const evByRule = new Map<string, Record<string, unknown>>()
  const evByException = new Map<string, Record<string, unknown>>()
  const severityByRule = new Map<string, PortalSeverity>()
  const pagesByRule = new Map<string, Set<number>>()
  const pagesByException = new Map<string, Set<number>>()

  for (const rawEv of engine.evidence) {
    const ev = asRecord(rawEv)
    // Rule-level fields describe the first *exception* row; a review row (schema 3.1, no code) is
    // only used when the rule has nothing else.
    const prev = evByRule.get(ev.rule_id as string)
    if (!prev || (prev.exception_code == null && typeof ev.exception_code === 'string')) {
      evByRule.set(ev.rule_id as string, ev)
    }
    const code = typeof ev.exception_code === 'string' ? ev.exception_code : undefined
    if (code && !evByException.has(code)) evByException.set(code, ev)

    const sev = typeof ev.severity === 'string' ? (ev.severity as PortalSeverity) : undefined
    if (sev && !severityByRule.has(ev.rule_id as string)) severityByRule.set(ev.rule_id as string, sev)

    const pageSetForRule = pagesByRule.get(ev.rule_id as string) ?? new Set<number>()
    const pageSetForCode = code ? pagesByException.get(code) ?? new Set<number>() : null
    for (const b of asArray(ev.bboxes)) {
      const bb = asRecord(b)
      if (typeof bb.page_no === 'number') {
        pageSetForRule.add(bb.page_no)
        pageSetForCode?.add(bb.page_no)
      }
    }
    pagesByRule.set(ev.rule_id as string, pageSetForRule)
    if (code && pageSetForCode) pagesByException.set(code, pageSetForCode)
  }

  // ---------- findings: one per evidence row (button-level evidence) ----------
  const { findingsByRule, findingIdsByElement } = buildFindings(engine, linkKey)

  const rules: PortalRuleCheck[] = engine.rule_results.map(rr => {
    const ev = evByRule.get(rr.rule_id)
    const severity =
      severityByRule.get(rr.rule_id) ??
      (typeof ev?.severity === 'string' ? (ev.severity as PortalSeverity) : null) ??
      engine.exceptions
        .filter(ex => ex.rule_id === rr.rule_id)
        .reduce<PortalSeverity | null>((acc, ex) => acc ?? (ex.severity as PortalSeverity), null)
    const pageNos = [...(pagesByRule.get(rr.rule_id) ?? [])].sort((a, b) => a - b)
    return {
      ruleId: rr.rule_id,
      ruleVersion: rr.rule_version,
      result: rr.result,
      status: RULE_STATUS[rr.result] ?? 'SKIP',
      exceptionCode:
        (typeof ev?.exception_code === 'string' ? (ev.exception_code as string) : null) ??
        engine.exceptions.find(ex => ex.rule_id === rr.rule_id)?.code ??
        null,
      severity,
      detail: rr.detail ?? null,
      messageTh: typeof ev?.message_th === 'string' ? (ev.message_th as string) : null,
      actualValue: (ev?.actual_value as string | number | null | undefined) ?? null,
      expectedValue: (ev?.expected_value as string | number | null | undefined) ?? null,
      pageNos: pageNos.length ? pageNos : undefined,
      evidenceIds: rr.evidence_ids,
      haltedBy: rr.halted_by ?? null,
      evaluatedAt: typeof ev?.evaluated_at === 'string' ? (ev.evaluated_at as string) : null,
      findings: findingsByRule.get(rr.rule_id) ?? [],
    }
  })

  const exceptions: PortalException[] = engine.exceptions.map(ex => {
    const ev = evByException.get(ex.code)
    const pageNos = [...(pagesByException.get(ex.code) ?? [])].sort((a, b) => a - b)
    return {
      id: ex.exception_id,
      code: ex.code,
      name: ex.name ?? '',
      severity: ex.severity,
      ruleId: ex.rule_id,
      evidenceIds: ex.evidence_ids,
      pageNos: pageNos.length ? pageNos : undefined,
      messageTh: typeof ev?.message_th === 'string' ? (ev.message_th as string) : null,
    }
  })

  // ---------- 4-step progress (same grouping/thresholds as the shipped UI) ----------
  const evalStep = (group: 1 | 2 | 3): PortalStepIndicator => {
    const matched = rules.filter(r => STEP_RULE_GROUPS[group].includes(r.ruleId))
    if (matched.length === 0 || matched.every(r => r.status === 'SKIP')) {
      return { status: 'ok', label: 'ไม่ได้ประเมิน' }
    }
    if (matched.some(r => r.status === 'FAIL' && r.severity === 'High')) {
      return { status: 'fail', label: 'พบ High' }
    }
    if (matched.some(r => r.status === 'FAIL' || r.status === 'WARN')) {
      return { status: 'warn', label: 'ต้องตรวจ' }
    }
    return { status: 'ok', label: 'ผ่าน' }
  }

  const duplicateStatus = deriveDuplicateStatus(engine)
  const apStatus: PortalApStatus = 'unconfirmed'
  const step4: PortalStepIndicator =
    duplicateStatus === 'potential_duplicate'
      ? { status: 'warn', label: 'อาจซ้ำ' }
      : duplicateStatus === 'overridden'
        ? { status: 'warn', label: 'ถูก override' }
        : { status: 'ok', label: 'ไม่ซ้ำ' }

  const stepProgress: PortalStepProgress = {
    step1: evalStep(1),
    step2: evalStep(2),
    step3: evalStep(3),
    step4,
  }

  // ---------- line items ----------
  const lineItems: PortalLineItem[] = asArray(nf.items).map((rawItem, i) => {
    const it = asRecord(rawItem)
    const match = asRecord(it.match)
    const qtyCheck = asRecord(it.qty_check)
    const lineMath = asRecord(it.line_math)
    const receipt = asRecord(asArray(match.receipt)[0])
    const rcvLineIds = asArray(match.rcv_line_ids)
    const elementId = str(it.element_id)
    return {
      no: num(it.line_no) ?? i + 1,
      desc: str(it.description) ?? '',
      qty: num(it.qty) ?? 0,
      unit: str(it.uom) ?? '',
      price: num(it.unit_price) ?? 0,
      amount: num(it.amount) ?? 0,
      poLine: null,
      poQty: null,
      poPrice: null,
      grLine: trailingInt(rcvLineIds[0]),
      grQty: num(receipt.qty) ?? null,
      rcvLineId: typeof rcvLineIds[0] === 'string' ? (rcvLineIds[0] as string) : null,
      matchLevel: str(match.level) ?? null,
      // Disagreeing when the Engine's qty check did not pass or the line math broke.
      diff: (str(qtyCheck.result) ?? 'pass') !== 'pass' || lineMath.ok === false,
      pageNo: num(it.page_no) ?? null,
      elementId: elementId ? linkKey(elementId) : null,
    }
  })

  // ---------- pages & bboxes ----------
  const pages = engine.pages.map(p => ({
    pageNo: p.page_no,
    widthPt: p.width_pt,
    heightPt: p.height_pt,
    rotation: p.rotation,
    pageType: (PORTAL_PAGE_TYPES as readonly string[]).includes(p.page_type)
      ? (p.page_type as PortalPageType)
      : ('UNKNOWN' as PortalPageType),
  }))

  // Which rule/exception each OCR element is evidence for (for overlay colouring). First row wins
  // for the colour; the full many-to-many link is `findingIds` (buildFindings).
  const evidenceByElement = new Map<string, { ruleId: string; exceptionCode?: string; severity?: string }>()
  for (const rawEv of engine.evidence) {
    const ev = asRecord(rawEv)
    for (const b of asArray(ev.bboxes)) {
      const bb = asRecord(b)
      const eid = typeof bb.element_id === 'string' ? bb.element_id : undefined
      if (!eid) continue
      const key = linkKey(eid)
      if (!evidenceByElement.has(key)) {
        evidenceByElement.set(key, {
          ruleId: ev.rule_id as string,
          exceptionCode: typeof ev.exception_code === 'string' ? (ev.exception_code as string) : undefined,
          severity: typeof ev.severity === 'string' ? (ev.severity as string) : undefined,
        })
      }
    }
  }

  const bboxes: PortalBoundingBox[] = []
  for (const el of engine.ocr.elements) {
    if (!el.bbox || el.page_no == null) continue
    const id = linkKey(el.element_id, el.document_id)
    const link = evidenceByElement.get(id)
    bboxes.push({
      id,
      pageNo: el.page_no,
      bbox: [el.bbox[0], el.bbox[1], el.bbox[2], el.bbox[3]],
      elementType: el.element_type as PortalBoundingBox['elementType'],
      fieldName: el.field_name ?? undefined,
      // Engine keeps the untouched OCR text in raw_value; prefer it for display.
      rawValue: el.raw_value ?? (el.normalized_value == null ? undefined : String(el.normalized_value)),
      confidence: el.confidence ?? 0,
      ruleId: link?.ruleId,
      exceptionCode: link?.exceptionCode,
      severity: link?.severity as PortalBoundingBox['severity'],
      findingIds: findingIdsByElement.get(id) ?? [],
    })
  }

  // ---------- receipt side ----------
  const receiptNums = asArray(os.receipt_nums).filter((x): x is string => typeof x === 'string')
  const receiptLines = asArray(os.receipt_lines).map(asRecord)
  const receiptTotal = receiptLines.length
    ? receiptLines.reduce((sum, l) => sum + (num(l.line_amount) ?? 0), 0)
    : undefined
  const poFromOracle = asArray(os.po_numbers).filter((x): x is string => typeof x === 'string')
  const poFromInvoice = str(nf.po_number)

  const oracleReceiptLines: PortalOracleReceiptLine[] = receiptLines.map((l, idx) => {
    const extra = asRecord(l.extra)
    const poNum =
      str(l.po_number) ??
      str(extra.PO_NUM) ??
      poFromOracle[0] ??
      poFromInvoice ??
      ''
    const receiptNum = str(l.receipt_num) ?? receiptNums[0] ?? ''
    const lineNo = num(l.line) ?? num(l.line_no) ?? idx + 1
    const rcvLineId =
      str(l.rcv_line_id) ?? (receiptNum ? `${receiptNum}-${lineNo}` : `rcv-${lineNo}`)
    const itemCode = str(l.item_code) ?? str(extra.ITEM_CODE) ?? null
    const itemDesc = str(l.item) ?? str(l.item_desc) ?? ''
    const qty = num(l.qty) ?? 0
    const uom = str(l.uom) ?? str(l.uom_group) ?? ''
    const unitPrice = num(l.unit_price) ?? 0
    const lineAmount = num(l.line_amount) ?? round2(qty * unitPrice)
    const qtyBilled = num(l.qty_billed) ?? num(extra.QTY_BILLED) ?? undefined
    const lineStatus = str(l.line_status) ?? null
    const poLineStatus = str(l.po_line_status) ?? null
    const receiver = str(l.receiver) ?? str(os.receiver) ?? null
    const ouName = str(l.ou_name) ?? str(os.ou_name) ?? null

    return {
      poNumber: poNum,
      receiptNum,
      lineNo,
      rcvLineId,
      itemCode,
      itemDesc,
      qty,
      uom,
      unitPrice,
      lineAmount,
      qtyBilled,
      lineStatus,
      poLineStatus,
      receiver,
      ouName,
      extra: Object.keys(extra).length > 0 ? extra : undefined,
    }
  })

  const recommendation = engine.recommendation.value
  const completedAt = engine.request.completed_at ?? new Date().toISOString()

  return {
    // 1. Identity & DMS reference
    id: dmsDocId,
    dmsDocId,
    packageId: engine.package.package_id,
    fileSha256: engine.package.file_sha256,
    pageCount: engine.package.page_count,
    contentKind: engine.request.content_kind === 'image' ? 'image' : 'pdf',

    // 2. Invoice master data
    invoiceNum: str(nf.invoice_num) ?? '',
    invoiceDate: str(nf.invoice_date) ?? '',
    companyCode,
    companyName: str(nf.customer_name) ?? '',
    companyTaxId: companyTaxId ?? '',
    supplierName: str(nf.supplier_name) ?? '',
    supplierTaxId: str(nf.supplier_tax_id) ?? '',
    currency: str(asRecord(summary.invoice).currency) ?? 'THB',
    subtotal,
    vat,
    grandTotal,
    poNumbers: poFromOracle.length ? poFromOracle : poFromInvoice ? [poFromInvoice] : [],

    // 3. Oracle receipt & matching
    receiptFound: receiptNums.length > 0,
    receiptNums,
    lookupPath: str(os.lookup_path),
    orgId,
    ouName: str(os.ou_name),
    receiverName: str(os.receiver),
    receiptTotal,
    // V-09 compares invoice subtotal against the receipt total.
    invoiceVsReceiptDiff: receiptTotal != null ? round2(subtotal - receiptTotal) : undefined,
    linesMatched:
      itemsSummary.line_count != null
        ? `${num(itemsSummary.lines_matched) ?? 0}/${num(itemsSummary.line_count) ?? 0}`
        : undefined,
    lineItems,
    oracleReceiptLines,

    // 4. Validation & rule results
    recommendation,
    status: RECOMMENDATION_TO_STATUS[recommendation] ?? 'Manual Review',
    maxSeverity: engine.recommendation.max_severity,
    stepProgress,
    rules,
    exceptions,

    // 5. OCR & bbox
    pages,
    bboxes,

    // 6. Workflow & governance — Portal-owned, defaulted for freshly ingested docs
    assignedRole: 'EU' as PortalAssignedRole,
    apStatus,
    duplicateStatus,
    createdAt: completedAt,
    updatedAt: completedAt,
    history: [],
  }
}

// ---------------------------------------------------------------------------- findings

const TARGET_KIND: Record<string, FindingTargetKind> = {
  row: 'row',
  cell: 'cell',
  field: 'field',
  signature: 'signature',
}
const TARGET_ORDER: Record<FindingTargetKind, number> = { row: 0, field: 1, cell: 1, signature: 1, other: 2 }

/** `lines[7].qty` -> `L7 · qty`, `lines[7]` -> `L7`, anything else verbatim. */
export function targetLabel(fieldName: string | null | undefined, elementId: string): string {
  if (!fieldName) return elementId
  const m = /^lines\[(\d+)\](?:\.(.+))?$/.exec(fieldName)
  if (m) return m[2] ? `L${m[1]} · ${m[2]}` : `L${m[1]}`
  return fieldName
}

/** Engine reason -> Portal enum. Anything unknown (or a missing reason with no box) is UNKNOWN. */
export function normalizeMissingReason(raw: unknown): FindingMissingReason {
  const r = typeof raw === 'string' ? raw : ''
  return (FINDING_MISSING_REASONS as readonly string[]).includes(r) ? (r as FindingMissingReason) : 'UNKNOWN'
}

/**
 * One `PortalFinding` per Engine evidence row, attached to its rule through
 * `rule_results[].evidence_ids` (rows without an id fall back to `rule_id`), plus the reverse index
 * element -> every finding that uses it (an element may be evidence for several rules).
 */
export function buildFindings(
  engine: EngineResultV3,
  linkKey: (elementId: string, documentId?: string | null) => string,
): { findingsByRule: Map<string, PortalFinding[]>; findingIdsByElement: Map<string, string[]> } {
  const elementById = new Map(engine.ocr.elements.map(el => [el.element_id, el] as const))
  const byId = new Map<string, PortalFinding>()
  const orphans = new Map<string, PortalFinding[]>()
  const findingIdsByElement = new Map<string, string[]>()
  const seen = new Set<string>()

  engine.evidence.forEach((ev, i) => {
    let id = ev.evidence_id ?? `${ev.rule_id}#${i}`
    if (seen.has(id)) id = `${id}#${i}` // never two buttons with one id
    seen.add(id)

    const targets: PortalFindingTarget[] = ev.bboxes.map(b => {
      const el = elementById.get(b.element_id)
      const key = linkKey(b.element_id, el?.document_id)
      const ids = findingIdsByElement.get(key) ?? []
      if (!ids.includes(id)) ids.push(id)
      findingIdsByElement.set(key, ids)
      return {
        id: key,
        elementId: b.element_id,
        pageNo: b.page_no,
        bbox: [b.bbox[0], b.bbox[1], b.bbox[2], b.bbox[3]],
        kind: TARGET_KIND[el?.element_type ?? ''] ?? 'other',
        label: targetLabel(el?.field_name, b.element_id),
      }
    })
    targets.sort(
      (a, b) =>
        TARGET_ORDER[a.kind] - TARGET_ORDER[b.kind] || a.pageNo - b.pageNo || a.bbox[1] - b.bbox[1],
    )

    const reason = ev.bbox_missing_reason ?? null
    const kind: PortalFinding['kind'] = ev.kind ?? (ev.exception_code == null ? 'review' : 'exception')
    const finding: PortalFinding = {
      id,
      ruleId: ev.rule_id,
      kind,
      result: ev.result,
      code: ev.exception_code ?? null,
      severity: ev.severity ?? null,
      messageTh: ev.message_th ?? null,
      actual: ev.actual_value ?? null,
      expected: ev.expected_value ?? null,
      fieldName: ev.field_name ?? null,
      lineNo: ev.line_no ?? null,
      relatedElementIds: [...ev.related_element_ids],
      oracleRefs: [...(ev.related_oracle_refs ?? [])],
      targets,
    }
    if (reason || targets.length === 0) {
      finding.missingReason = normalizeMissingReason(reason?.reason)
      finding.missingElementIds = reason ? [...reason.element_ids] : []
    }
    if (ev.evidence_id && !byId.has(ev.evidence_id)) byId.set(ev.evidence_id, finding)
    else {
      const list = orphans.get(ev.rule_id) ?? []
      list.push(finding)
      orphans.set(ev.rule_id, list)
    }
  })

  const findingsByRule = new Map<string, PortalFinding[]>()
  const used = new Set<string>()
  for (const rr of engine.rule_results) {
    const list: PortalFinding[] = []
    for (const eid of rr.evidence_ids) {
      const f = byId.get(eid)
      if (f && !used.has(f.id)) {
        list.push(f)
        used.add(f.id)
      }
    }
    list.push(...(orphans.get(rr.rule_id) ?? []))
    findingsByRule.set(rr.rule_id, list)
  }
  // Evidence that a rule result forgot to list is still shown under its own rule.
  for (const f of byId.values()) {
    if (used.has(f.id)) continue
    const list = findingsByRule.get(f.ruleId) ?? []
    list.push(f)
    findingsByRule.set(f.ruleId, list)
  }
  return { findingsByRule, findingIdsByElement }
}

export { transformEngineResultToPortalDoc as engineToPortalAdapter }
