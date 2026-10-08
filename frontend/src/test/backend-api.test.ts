import { describe, it, expect } from 'vitest'
import { convertSystemAResultToInvoiceDoc } from '../lib/backendApi'
import { generateSandboxResult, saveValidation, getValidation } from '../lib/validationStore'

describe('Backend Logic & System A Result 3.0 Adapter', () => {
  it('converts modern System A result 3.0 payload to InvoiceDoc correctly', () => {
    const mockPayload = {
      contract: 'aiva.system_a.result/3.0',
      request: {
        validation_id: 'VAL-2026-TEST-001',
        dms_doc_id: 'DMS-2026-999',
        completed_at: '2026-10-07T12:00:00Z'
      },
      package: {
        page_count: 2
      },
      normalized_fields: {
        invoice_num: 'INV-TEST-888',
        supplier_name: 'THAI WORTH CO., LTD.',
        supplier_tax_id: '0105537063173',
        customer_tax_id: '0107545000179',
        grand_total: '10700.00',
        sub_total: '10000.00',
        vat: '700.00',
        po_number: '42052405'
      },
      oracle_snapshot: {
        org_id: 103,
        receiver: 'SOMSAK JAIDEE',
        receipt_nums: ['50220043196']
      },
      rule_results: [
        { rule_id: 'V-01', result: 'pass', detail: 'Fields valid' },
        { rule_id: 'V-08', result: 'fail', exception_code: 'E15', detail: 'Qty discrepancy' }
      ],
      recommendation: {
        value: 'REVIEW',
        reason: 'Tolerance check flagged',
        exception_codes: ['E15']
      }
    }

    const doc = convertSystemAResultToInvoiceDoc(mockPayload)

    expect(doc.doc).toBe('DMS-DMS-2026-999')
    expect(doc.inv).toBe('INV-TEST-888')
    expect(doc.vendor).toBe('THAI WORTH CO., LTD.')
    expect(doc.status).toBe('Review')
    expect(doc.total).toBe(10700)
    expect(doc.po).toBe('42052405')
    expect(doc.rcv).toBe('50220043196')
    expect(doc.receiver).toBe('SOMSAK JAIDEE')
    expect(doc.codes).toContain('E15')
    expect(doc.rules.length).toBe(2)
    expect(doc.rules[1].severity).toBe('Medium')
  })

  it('generates sandbox validation conforming to result 3.0 schema', () => {
    const vid = 'VAL-SANDBOX-TEST'
    const extraction = {
      invoice: {
        invoice_num: 'INV-DEMO-001',
        grand_total: 5350
      }
    }

    const res = generateSandboxResult(vid, extraction, 1)

    expect(res.contract).toBe('aiva.system_a.result/3.0')
    expect(res.request.validation_id).toBe(vid)
    expect(res.versions.schema).toBe('3.0')
    expect(res.versions.standard).toBe('6.6')
    expect(res.rule_results.length).toBe(9)
    expect(res.recommendation.value).toBe('AUTO_PASS')
  })

  it('stores and retrieves validation jobs in validationStore', () => {
    const testJob = {
      id: 'VAL-STORE-TEST',
      status: 'completed' as const,
      request: { test: true },
      result: { ok: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    saveValidation(testJob)
    const fetched = getValidation('VAL-STORE-TEST')

    expect(fetched).toBeDefined()
    expect(fetched?.id).toBe('VAL-STORE-TEST')
    expect(fetched?.status).toBe('completed')
  })
})
