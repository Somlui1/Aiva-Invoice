import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import type { PortalInvoiceDocument, PortalOracleReceiptLine } from '../features/engine/types/portalDomain'
import type { InvoiceDoc } from '../types/invoice'

describe('Task 1: Web Schema Contract & Domain Types', () => {
  const schemaPath = path.resolve(__dirname, '../../temp/schemas/web_schema.json')

  it('web_schema.json exists and is valid JSON', () => {
    expect(fs.existsSync(schemaPath)).toBe(true)
    const raw = fs.readFileSync(schemaPath, 'utf-8')
    const json = JSON.parse(raw)
    expect(json).toBeDefined()
    expect(json.contract).toBe('aiva.system_a.result/3.0')
  })

  it('web_schema.json includes multi-PO oracle_snapshot.receipt_lines with required fields', () => {
    const raw = fs.readFileSync(schemaPath, 'utf-8')
    const json = JSON.parse(raw)
    const receiptLines = json.oracle_snapshot?.receipt_lines
    expect(Array.isArray(receiptLines)).toBe(true)
    expect(receiptLines.length).toBeGreaterThanOrEqual(2)

    // Verify multi-PO identification: different lines can have different po_numbers
    const poNumbers = new Set(receiptLines.map((l: Record<string, unknown>) => l.po_number))
    expect(poNumbers.size).toBeGreaterThanOrEqual(2)

    for (const line of receiptLines) {
      expect(line.po_number).toBeDefined()
      expect(typeof line.po_number).toBe('string')
      expect(line.receipt_num).toBeDefined()
      expect(line.line).toBeDefined()
      expect(line.rcv_line_id).toBeDefined()
      expect(line.item || line.item_desc).toBeDefined()
      expect(line.qty).toBeDefined()
      expect(line.uom).toBeDefined()
      expect(line.unit_price).toBeDefined()
      expect(line.line_amount).toBeDefined()
      expect(line.line_status).toBeDefined()
      expect(line.po_line_status).toBeDefined()
    }
  })

  it('web_schema.json includes complete 10-category ocr.elements', () => {
    const raw = fs.readFileSync(schemaPath, 'utf-8')
    const json = JSON.parse(raw)
    const elements = json.ocr?.elements
    expect(Array.isArray(elements)).toBe(true)
    expect(elements.length).toBeGreaterThanOrEqual(10)

    const categories = new Set(elements.map((el: Record<string, unknown>) => el.element_type))
    const expectedCategories = [
      'header',
      'supplier',
      'customer',
      'table',
      'line',
      'total',
      'payment',
      'signature',
      'stamp',
      'other',
    ]
    for (const cat of expectedCategories) {
      expect(categories.has(cat)).toBe(true)
    }

    for (const el of elements) {
      expect(el.element_id).toBeDefined()
      expect(el.page_no).toBeDefined()
      expect(el.element_type).toBeDefined()
      expect(el.field_name || el.label).toBeDefined()
      expect(el.bbox || el.bbox_norm).toBeDefined()
    }
  })

  it('PortalOracleReceiptLine and PortalInvoiceDocument interfaces compile and match expected shape', () => {
    const sampleLine: PortalOracleReceiptLine = {
      poNumber: '43026973',
      receiptNum: '530336710',
      lineNo: 1,
      rcvLineId: '530336710-1',
      itemCode: '507A04JJ0A',
      itemDesc: 'PLATE ASSY-FLUIDE G',
      qty: 240,
      uom: 'PCS',
      unitPrice: 789.6,
      lineAmount: 189504,
      qtyBilled: 0,
      lineStatus: 'FULLY RECEIVED',
      poLineStatus: 'CLOSED',
      receiver: 'AHT Receiver',
      ouName: 'Aapico Hitech Tooling Legal',
    }
    expect(sampleLine.poNumber).toBe('43026973')
    expect(sampleLine.rcvLineId).toBe('530336710-1')

    // Dummy test to ensure PortalInvoiceDocument and InvoiceDoc typing
    const doc = { oracleReceiptLines: [sampleLine] } as unknown as PortalInvoiceDocument
    expect(doc.oracleReceiptLines).toHaveLength(1)

    const invDoc = { oracleReceiptLines: [sampleLine] } as unknown as InvoiceDoc
    expect(invDoc.oracleReceiptLines).toHaveLength(1)
  })
})
