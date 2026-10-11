import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { engineToPortalAdapter } from '../features/engine/adapters/engineToPortalAdapter'
import { portalDocToInvoiceDoc } from '../features/engine/adapters/portalDocToInvoiceDoc'

describe('Task 2: Oracle Receipt Adapter & Multi-PO Mapping', () => {
  const dms100Path = path.resolve(__dirname, '../../temp/paperless_invoices_v5/DMS-100_result.json')
  const dms35Path = path.resolve(__dirname, '../../temp/paperless_invoices_v5/DMS-35_result.json')

  it('maps single-PO DMS-100 receipt lines correctly', () => {
    const raw = JSON.parse(fs.readFileSync(dms100Path, 'utf-8'))
    const portalDoc = engineToPortalAdapter(raw)

    expect(portalDoc.oracleReceiptLines).toBeDefined()
    expect(portalDoc.oracleReceiptLines).toHaveLength(2)

    const line1 = portalDoc.oracleReceiptLines![0]
    expect(line1.poNumber).toBe('42051905')
    expect(line1.receiptNum).toBe('50220043288')
    expect(line1.lineNo).toBe(1)
    expect(line1.rcvLineId).toBe('50220043288-1')
    expect(line1.itemCode).toBe('MSP0001337A')
    expect(line1.itemDesc).toContain('CRANE PART')
    expect(line1.qty).toBe(1)
    expect(line1.unitPrice).toBe(23100)
    expect(line1.lineAmount).toBe(23100)
    expect(line1.lineStatus).toBe('FULLY RECEIVED')
    expect(line1.poLineStatus).toBe('CLOSED')

    // Verify mapping into InvoiceDoc
    const invoiceDoc = portalDocToInvoiceDoc(portalDoc)
    expect(invoiceDoc.oracleReceiptLines).toBeDefined()
    expect(invoiceDoc.oracleReceiptLines).toHaveLength(2)
  })

  it('maps multi-PO DMS-35 receipt lines with distinct PO numbers', () => {
    const raw = JSON.parse(fs.readFileSync(dms35Path, 'utf-8'))
    const portalDoc = engineToPortalAdapter(raw)

    expect(portalDoc.oracleReceiptLines).toBeDefined()
    expect(portalDoc.oracleReceiptLines).toHaveLength(3)

    // DMS-35 has 3 lines from 3 different POs
    const [l1, l2, l3] = portalDoc.oracleReceiptLines!
    expect(l1.poNumber).toBe('43026973')
    expect(l1.receiptNum).toBe('530336710')
    expect(l1.lineNo).toBe(1)
    expect(l1.qty).toBe(240)

    expect(l2.poNumber).toBe('43041729')
    expect(l2.receiptNum).toBe('530336710')
    expect(l2.lineNo).toBe(2)
    expect(l2.qty).toBe(248)

    expect(l3.poNumber).toBe('43043027')
    expect(l3.receiptNum).toBe('530336710')
    expect(l3.lineNo).toBe(3)
    expect(l3.qty).toBe(80)

    // Forwarding to InvoiceDoc maintains all 3 distinct POs
    const invoiceDoc = portalDocToInvoiceDoc(portalDoc)
    expect(invoiceDoc.oracleReceiptLines).toHaveLength(3)
    expect(invoiceDoc.oracleReceiptLines![0].poNumber).toBe('43026973')
    expect(invoiceDoc.oracleReceiptLines![1].poNumber).toBe('43041729')
    expect(invoiceDoc.oracleReceiptLines![2].poNumber).toBe('43043027')
  })
})
