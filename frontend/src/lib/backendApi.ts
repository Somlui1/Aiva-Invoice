import { InvoiceDoc, InvoiceStatus, RuleCheck } from '../types/invoice'
import { SEVERITY_OF_CODE } from '../mock/rules'
import { companyOfOrg, companyOfTax, COMPANIES } from '../mock/companies'

export interface BackendHealth {
  ok: boolean
  mode: 'live' | 'sandbox'
  service: string
  engineUrl?: string
  ruleset?: string
  standard?: string
  timestamp: string
  details?: Record<string, unknown>
}

export interface ValidationSubmitResponse {
  validation_id: string
  status: 'running' | 'completed' | 'failed'
  idempotent_replay: boolean
  result?: any
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn('Backend health check error:', err)
  }
  return {
    ok: false,
    mode: 'sandbox',
    service: 'System A Mock Engine',
    ruleset: 'v6.6',
    standard: '6.6',
    timestamp: new Date().toISOString()
  }
}

export async function submitValidation(extraction: Record<string, unknown>, portalRefs = { document_revision: 1, validation_round: 1 }): Promise<ValidationSubmitResponse> {
  const res = await fetch('/api/validations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      extraction,
      portal_refs: portalRefs,
      options: { ruleset: 'v6.6' }
    })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Validation submit failed (${res.status}): ${text}`)
  }
  return await res.json()
}

export async function getValidationStatus(id: string): Promise<{ validation_id: string; status: string; error?: any }> {
  const res = await fetch(`/api/validations/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
  return await res.json()
}

export async function getValidationResult(id: string): Promise<any> {
  const res = await fetch(`/api/validations/${id}/result`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Fetch result failed: ${res.status}`)
  return await res.json()
}


export async function ingestValidationResult(payload: Record<string, unknown>): Promise<any> {
  const res = await fetch('/api/ingest/validation-results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Ingest failed with status ${res.status}`)
  }
  return await res.json()
}

/**
 * Converts a System A result 3.0 payload (from Python backend or simulation)
 * into an InvoiceDoc for the Portal Queue.
 */
export function convertSystemAResultToInvoiceDoc(payload: any): InvoiceDoc {
  const norm = payload.normalized_fields || {}
  const snap = payload.oracle_snapshot || {}
  const recVal = payload.recommendation?.value || 'MANUAL_REVIEW'
  const codes: string[] = payload.decision?.exception_codes || payload.recommendation?.exception_codes || []

  const statusMap: Record<string, InvoiceStatus> = {
    AUTO_PASS: 'Auto-pass',
    REVIEW: 'Review',
    HOLD: 'Hold',
    MANUAL_REVIEW: 'Manual Review',
    SYSTEM_ERROR: 'Manual Review'
  }
  const status: InvoiceStatus = statusMap[recVal] || 'Manual Review'

  // Extract rules
  const rulesList: RuleCheck[] = (payload.rule_results || []).map((r: any) => {
    const isPass = r.result === 'pass'
    const code = r.exception_code || (codes[0] && !isPass ? codes[0] : undefined)
    const sev = code ? SEVERITY_OF_CODE[code] : undefined
    return {
      id: r.rule_id,
      rule: r.rule_id,
      name: `กฎ ${r.rule_id}`,
      status: isPass ? 'PASS' : r.result === 'not_evaluated' ? 'SKIP' : 'FAIL',
      result: r.result,
      exception_code: code,
      severity: sev,
      detail: r.detail || (isPass ? 'ผ่านการตรวจสอบ' : 'พบข้อผิดพลาด')
    }
  })

  const orgId = snap.org_id || 103
  const co = companyOfOrg(orgId) || companyOfTax(norm.customer_tax_id || '') || 'AH'
  const docId = payload.request?.dms_doc_id ? `DMS-${payload.request.dms_doc_id}` : `SYS-${payload.request?.validation_id || Date.now()}`

  return {
    doc: docId,
    inv: norm.invoice_num || 'INV-UNKNOWN',
    company: co,
    vendor: norm.supplier_name || 'SUPPLIER',
    stax: norm.supplier_tax_id || '—',
    dt: norm.invoice_date || new Date().toISOString().slice(0, 10),
    up: (payload.request?.completed_at || new Date().toISOString()).slice(0, 10),
    total: parseFloat(norm.grand_total || '0'),
    sub: parseFloat(norm.sub_total || '0'),
    vat: parseFloat(norm.vat || '0'),
    po: norm.po_number || snap.query_keys?.po_number || '—',
    rcv: snap.receipt_nums?.[0] || '—',
    receiver: snap.receiver || undefined,
    receiverActive: !!snap.receiver,
    assigned: !snap.receiver ? 'acc' : codes.length > 0 ? 'eu' : 'acc',
    status,
    codes,
    rules: rulesList,
    pages: payload.package?.page_count || 1,
    history: [
      {
        dt: new Date().toISOString().slice(0, 10),
        t: new Date().toTimeString().slice(0, 8),
        who: 'System A Backend',
        act: 'ประมวลผลคำนวณและตรวจสอบ',
        d: `ผลลัพธ์ ${recVal} · ${payload.recommendation?.reason || 'เสร็จสมบูรณ์'}`,
        k: 's'
      }
    ]
  }
}
