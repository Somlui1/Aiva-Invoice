// In-memory store for validations running in Next.js sandbox or proxy mode

export interface StoredValidation {
  id: string
  status: 'running' | 'completed' | 'failed'
  request: any
  result?: any
  error?: any
  createdAt: string
  updatedAt: string
}

const validationMap = new Map<string, StoredValidation>()

export function saveValidation(val: StoredValidation) {
  validationMap.set(val.id, val)
}

export function getValidation(id: string): StoredValidation | undefined {
  return validationMap.get(id)
}

export function listValidations(): StoredValidation[] {
  return Array.from(validationMap.values())
}

/**
 * Generates a realistic System A result 3.0 from extraction data in sandbox mode.
 */
export function generateSandboxResult(vid: string, extraction: any, round = 1) {
  const inv = extraction?.fields?.invoice_num?.value || extraction?.invoice?.invoice_num || 'INV-2026-001'
  const po = extraction?.fields?.po_number?.value || extraction?.invoice?.po_numbers?.[0] || '42052405'
  const total = Number(extraction?.fields?.grand_total?.value || extraction?.invoice?.grand_total || 52660.05)
  const sub = Math.round((total / 1.07) * 100) / 100
  const vat = Math.round((total - sub) * 100) / 100

  return {
    contract: 'aiva.system_a.result/3.0',
    request: {
      validation_id: vid,
      correlation_id: `corr-${vid}`,
      idempotency_key: null,
      document_revision: 1,
      validation_round: round,
      source: 'nextjs_portal_sandbox',
      run_id: 'sandbox-run',
      dms_doc_id: extraction?.document?.dms_doc_id || 'DMS-2026-SANDBOX',
      content_kind: 'pdf',
      declared_mime: 'application/pdf',
      completed_at: new Date().toISOString()
    },
    versions: {
      schema: '3.0',
      standard: '6.6',
      ruleset: 'v6.6-r4',
      models: {
        line_matcher: 'nvidia/Qwen3.8-Flash-Next-NVFP4',
        qty_judge: 'nvidia/Qwen3.8-Flash-Next-NVFP4',
        entity_judge: 'nvidia/Qwen3.8-Flash-Next-NVFP4',
        vision: 'nvidia/Qwen3.8-Flash-Next-NVFP4'
      },
      prompts: {
        'V-08': 'v08-qty@1.0.0',
        'V-07': 'v07-match@1.0.0',
        'V-05': 'v05-entity@1.0.0'
      }
    },
    package: {
      package_id: `PKG-${vid}`,
      dms_doc_id: extraction?.document?.dms_doc_id || '20',
      file_sha256: 'a'.repeat(64),
      page_count: 2,
      pages_complete: true,
      coordinate_system: {
        origin: 'top-left',
        unit: 'normalized',
        range: [0, 1],
        bbox_format: '[x, y, w, h]',
        reference: 'rendered page after rotation correction'
      }
    },
    pages: [
      {
        page_no: 1,
        width_pt: 595.0,
        height_pt: 842.0,
        rotation: 0,
        render_dpi: 150,
        page_type: 'TAX_INVOICE',
        type_confidence: 0.98,
        ocr_quality: 0.95
      }
    ],
    ocr: {
      elements: [
        {
          element_id: 'E_INV_NUM',
          page_no: 1,
          element_type: 'field',
          field_name: 'invoice_num',
          raw_value: inv,
          normalized_value: inv,
          confidence: 0.99,
          bbox: [0.685, 0.122, 0.185, 0.024]
        },
        {
          element_id: 'E_PO_NUM',
          page_no: 1,
          element_type: 'field',
          field_name: 'po_number',
          raw_value: po,
          normalized_value: po,
          confidence: 0.98,
          bbox: [0.685, 0.155, 0.185, 0.022]
        },
        {
          element_id: 'E_TOTAL',
          page_no: 1,
          element_type: 'field',
          field_name: 'grand_total',
          raw_value: total.toLocaleString(),
          normalized_value: String(total),
          confidence: 0.99,
          bbox: [0.75, 0.72, 0.15, 0.025]
        }
      ]
    },
    normalized_fields: {
      invoice_num: inv,
      invoice_date: '2026-10-01',
      po_number: po,
      supplier_name: extraction?.fields?.supplier_name?.value || 'บริษัท ทดสอบ จำกัด',
      supplier_tax_id: extraction?.fields?.supplier_tax_id?.value || '0105537063173',
      customer_name: 'บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)',
      customer_tax_id: '0107545000179',
      sub_total: String(sub),
      vat: String(vat),
      grand_total: String(total),
      currency: 'THB'
    },
    oracle_snapshot: {
      queried: true,
      queried_at: new Date().toISOString(),
      lookup_path: 'RCV-V01',
      query_keys: { po_number: po, invoice_num: inv },
      org_id: 103,
      receiver: 'SOMSAK JAIDEE',
      receipt_nums: ['50220043196'],
      receipt_lines: [
        {
          org_id: 103,
          receipt_num: '50220043196',
          receiver: 'SOMSAK JAIDEE',
          line: 1,
          item: 'STANDARD ITEM',
          qty: '10',
          uom: 'PCS',
          unit_price: String(sub / 10),
          line_amount: String(sub),
          rcv_line_id: '50220043196-1'
        }
      ]
    },
    line_matching: {
      groups: [
        {
          group_id: 'G1',
          relation: '1:1',
          level: 'M1',
          invoice_line_nos: [1],
          rcv_line_ids: ['50220043196-1'],
          confidence: 1.0,
          source: 'deterministic',
          rationale: 'Exact match'
        }
      ],
      ai_rejected: [],
      unmatched_rcv_line_ids: []
    },
    rule_results: [
      { rule_id: 'V-01', result: 'pass', detail: 'All required fields present' },
      { rule_id: 'V-02', result: 'pass', detail: 'Line items match' },
      { rule_id: 'V-03', result: 'pass', detail: 'Math check ok' },
      { rule_id: 'V-04', result: 'pass', detail: 'PO verified' },
      { rule_id: 'V-05', result: 'pass', detail: 'Buyer entity valid' },
      { rule_id: 'V-06', result: 'pass', detail: 'Receipt receiver confirmed' },
      { rule_id: 'V-07', result: 'pass', detail: 'Lines paired' },
      { rule_id: 'V-08', result: 'pass', detail: 'Quantities within tolerance' },
      { rule_id: 'V-09', result: 'pass', detail: 'Total amounts match' }
    ],
    recommendation: {
      value: 'AUTO_PASS',
      reason: 'All rules passed successfully with exact receipt matching',
      exception_codes: []
    }
  }
}
