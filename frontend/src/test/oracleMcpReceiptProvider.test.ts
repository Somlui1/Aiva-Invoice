import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import {
  parseOracleCsv,
  OracleMcpReceiptProvider,
  FallbackReceiptProvider,
  FixtureProvider,
  getReceiptLookupProvider,
  ReceiptLookupUnavailable,
} from '../server/receiptLookup'

describe('parseOracleCsv', () => {
  it('parses standard CSV with SQL*Plus footer', () => {
    const raw = `
"ORG_ID","OU_NAME","PO_NUM","RECEIPT_NUM","RECEIVER","LINE","SUPPLIER_TAX_ID","SUPPLIER_NAME","ITEM_CODE","ITEM","QTY","UOM","UNIT_PRICE","LINE_AMOUNT","SHIPMENT_NUM","PACKING_SLIP","RECEIPT_DATE"
101,"AH","40117545","510517699","K.Receiver",1,"0135537003456","บริษัท จรูญรัตน์ โปรดักส์ จำกัด","A-01","ตัวอย่างรายการรับ",10,"PCS",44.2,442,"SQ26/071249","SQ26/071249","2026-07-08"

1 row selected.
    `.trim()

    const rows = parseOracleCsv(raw)
    expect(rows).toHaveLength(1)
    expect(rows[0]['ORG_ID']).toBe('101')
    expect(rows[0]['OU_NAME']).toBe('AH')
    expect(rows[0]['RECEIPT_NUM']).toBe('510517699')
    expect(rows[0]['SUPPLIER_NAME']).toBe('บริษัท จรูญรัตน์ โปรดักส์ จำกัด')
    expect(rows[0]['QTY']).toBe('10')
    expect(rows[0]['UNIT_PRICE']).toBe('44.2')
  })

  it('handles empty results and no rows selected', () => {
    expect(parseOracleCsv('no rows selected')).toHaveLength(0)
    expect(parseOracleCsv('')).toHaveLength(0)
    expect(parseOracleCsv('0 rows selected.')).toHaveLength(0)
  })

  it('handles escaped quotes inside quoted text', () => {
    const raw = `
"CODE","NAME"
"ITEM-1","SCREW 1/2"" STEEL"
    `.trim()
    const rows = parseOracleCsv(raw)
    expect(rows).toHaveLength(1)
    expect(rows[0]['CODE']).toBe('ITEM-1')
    expect(rows[0]['NAME']).toBe('SCREW 1/2" STEEL')
  })
})

describe('OracleMcpReceiptProvider', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('findReceipts sends sql_run to Oracle MCP and groups multiple lines', async () => {
    const csvOutput = `
"ORG_ID","OU_NAME","PO_NUM","RECEIPT_NUM","RECEIVER","LINE","SUPPLIER_TAX_ID","SUPPLIER_NAME","ITEM_CODE","ITEM","QTY","UOM","UNIT_PRICE","LINE_AMOUNT","SHIPMENT_NUM","PACKING_SLIP","RECEIPT_DATE"
101,"AH","PO-100","RCV-999","K.Jane",1,"0105500000001","Alpha Corp","ITEM-A","Part A",2,"PCS",150,300,"INV-2026","INV-2026","2026-08-01"
101,"AH","PO-100","RCV-999","K.Jane",2,"0105500000001","Alpha Corp","ITEM-B","Part B",1,"PCS",200,200,"INV-2026","INV-2026","2026-08-01"

2 rows selected.
    `.trim()

    let capturedBody: any = null
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: any) => {
      capturedBody = JSON.parse(init.body)
      return {
        ok: true,
        status: 200,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { content: [{ type: 'text', text: csvOutput }] },
        }),
      } as any
    }) as any

    const provider = new OracleMcpReceiptProvider('http://oracle-mcp-test/mcp', 'test-token')
    const receipts = await provider.findReceipts({ supplierTaxId: '0105500000001', invoiceNum: 'INV-2026' })

    expect(capturedBody).toMatchObject({
      method: 'tools/call',
      params: { name: 'sql_run' },
    })
    expect(capturedBody.params.arguments.database).toBe('default')
    expect(capturedBody.params.arguments.sql).toContain('PO.RCV_SHIPMENT_LINES')
    expect(capturedBody.params.arguments.sql).toContain('INV-2026')

    expect(receipts).toHaveLength(1)
    const r = receipts[0]
    expect(r.receiveId).toBe('RCV-999')
    expect(r.companyCode).toBe('AH')
    expect(r.supplierTaxId).toBe('0105500000001')
    expect(r.lines).toHaveLength(2)
    expect(r.lines[0].itemDesc).toBe('Part A')
    expect(r.lines[1].itemDesc).toBe('Part B')
    expect(r.total).toBe(500)
  })

  it('throws ReceiptLookupUnavailable when token is expired (HTTP 401)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as any) as any

    const provider = new OracleMcpReceiptProvider('http://oracle-mcp-test/mcp', 'expired-token')
    await expect(provider.findReceipts({ supplierTaxId: '0105500000001', invoiceNum: 'INV-1' })).rejects.toThrow(
      ReceiptLookupUnavailable,
    )
  })

  it('suppliersByPo queries PO headers and returns deduplicated suppliers', async () => {
    const csvOutput = `
"SUPPLIER_TAX_ID","SUPPLIER_NAME"
"0105500000001","Alpha Corp"

1 row selected.
    `.trim()

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: { content: [{ type: 'text', text: csvOutput }] },
      }),
    } as any) as any

    const provider = new OracleMcpReceiptProvider('http://oracle-mcp-test/mcp', 'test-token')
    const suppliers = await provider.suppliersByPo('PO-100')
    expect(suppliers).toEqual([{ supplierTaxId: '0105500000001', supplierName: 'Alpha Corp' }])
  })
})

describe('FallbackReceiptProvider', () => {
  const fixturePath = path.resolve(__dirname, '../../docs/receipt-lookup.fixture.example.json')

  it('delegates to fixture when primary Oracle MCP provider throws', async () => {
    const failingPrimary = {
      name: 'oracle-mcp',
      suppliersByPo: vi.fn().mockRejectedValue(new ReceiptLookupUnavailable('Token expired')),
      findReceipts: vi.fn().mockRejectedValue(new ReceiptLookupUnavailable('Token expired')),
    }
    const fixture = new FixtureProvider(fixturePath)
    const composite = new FallbackReceiptProvider(failingPrimary, fixture)

    // Test suppliers by PO fallback (PO 40117545 from fixture)
    const suppliers = await composite.suppliersByPo('40117545')
    expect(suppliers).toHaveLength(1)
    expect(suppliers[0].supplierTaxId).toBe('0135537003456')

    // Test receipt lookup fallback
    const receipts = await composite.findReceipts({ supplierTaxId: '0135537003456', invoiceNum: 'SQ26/071249' })
    expect(receipts).toHaveLength(1)
    expect(receipts[0].receiveId).toBe('510517699')
  })
})

describe('getReceiptLookupProvider', () => {
  beforeEach(() => {
    delete process.env.ORACLE_MCP_URL
    delete process.env.ORACLE_MCP_TOKEN
    delete process.env.RECEIPT_LOOKUP_URL
    delete process.env.RECEIPT_LOOKUP_KEY
    delete process.env.RECEIPT_LOOKUP_FIXTURE
  })

  it('returns FallbackReceiptProvider when both ORACLE_MCP and FIXTURE are configured', () => {
    process.env.ORACLE_MCP_URL = 'http://test-oracle/mcp'
    process.env.ORACLE_MCP_TOKEN = 'test-token'
    process.env.RECEIPT_LOOKUP_FIXTURE = path.resolve(__dirname, '../../docs/receipt-lookup.fixture.example.json')

    const p = getReceiptLookupProvider()
    expect(p).not.toBeNull()
    expect(p?.name).toContain('oracle-mcp')
    expect(p?.name).toContain('fixture')
  })

  it('returns null when no provider environment variables are configured', () => {
    expect(getReceiptLookupProvider()).toBeNull()
  })
})
