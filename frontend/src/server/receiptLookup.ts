/**
 * Receipt lookup for "ผูกใบรับ" (v5.11).
 *
 * The user does not know the receive_id. They know what is printed on the invoice: the supplier tax
 * id (or a PO number, which leads to the supplier) and the invoice number. This module turns that
 * into exactly ONE Oracle receipt, or says why it cannot.
 *
 * The real source is the Oracle API that will be built later. Until then a provider is chosen by
 * environment, read on every call:
 *
 *   RECEIPT_LOOKUP_URL      HTTP provider (the Oracle API). Contract:
 *                             GET {url}/po/{po}/suppliers
 *                               → { suppliers: [{ supplierTaxId, supplierName }] }
 *                             GET {url}/receipts?supplier_tax_id=…&invoice_num=…
 *                               → { receipts: ReceiptRecord[] }
 *                           Auth: `Authorization: Bearer ${RECEIPT_LOOKUP_KEY}` when the key is set.
 *   RECEIPT_LOOKUP_FIXTURE  path to a JSON file { receipts: ReceiptRecord[] } — dev / UAT stand-in
 *   (neither)               not configured → the drawer says so; nothing can be bound
 *
 * Nothing here writes. Binding happens in server/routes/documents.ts, which re-runs the lookup itself
 * and never trusts a receive_id sent by the browser.
 */
import fs from 'node:fs'
import type { PortalOracleReceiptLine } from '@/features/engine/types/portalDomain'
import { normalizeInvoiceNum, normalizeReceiveId, normalizeTaxId } from './businessKey'

export interface ReceiptRecord {
  receiveId: string
  receiptDate?: string | null
  supplierTaxId: string
  supplierName: string
  invoiceNum?: string | null
  companyCode?: string | null
  companyName?: string | null
  orgId?: number | null
  ouName?: string | null
  receiverName?: string | null
  poNumbers: string[]
  /** Receipt total (sum of line amounts when the source does not send one). */
  total?: number | null
  lines: PortalOracleReceiptLine[]
}

export interface ReceiptLookupProvider {
  readonly name: string
  suppliersByPo(po: string): Promise<{ supplierTaxId: string; supplierName: string }[]>
  findReceipts(q: { supplierTaxId: string; invoiceNum: string }): Promise<ReceiptRecord[]>
}

export class ReceiptLookupUnavailable extends Error {
  constructor(msg = 'ยังไม่ได้เชื่อมต่อแหล่งข้อมูลใบรับ (Oracle API)') {
    super(msg)
    this.name = 'ReceiptLookupUnavailable'
  }
}

// ---------------------------------------------------------------------------- providers

import { companyOfOrg, COMPANIES } from '../mock/companies'

export class FixtureProvider implements ReceiptLookupProvider {
  readonly name = 'fixture'
  constructor(private readonly file: string) {}
  private all(): ReceiptRecord[] {
    try {
      const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'))
      return Array.isArray(raw?.receipts) ? raw.receipts : []
    } catch (err: any) {
      throw new ReceiptLookupUnavailable(`อ่านไฟล์ข้อมูลใบรับจำลองไม่ได้: ${err?.message ?? err}`)
    }
  }
  async suppliersByPo(po: string) {
    const want = po.trim().toUpperCase()
    const seen = new Map<string, string>()
    for (const r of this.all()) {
      if (r.poNumbers.some(p => p.trim().toUpperCase() === want)) seen.set(normalizeTaxId(r.supplierTaxId) ?? r.supplierTaxId, r.supplierName)
    }
    return [...seen].map(([supplierTaxId, supplierName]) => ({ supplierTaxId, supplierName }))
  }
  async findReceipts(q: { supplierTaxId: string; invoiceNum: string }) {
    return this.all().filter(
      r => normalizeTaxId(r.supplierTaxId) === normalizeTaxId(q.supplierTaxId) && normalizeInvoiceNum(r.invoiceNum) === normalizeInvoiceNum(q.invoiceNum),
    )
  }
}

export class HttpProvider implements ReceiptLookupProvider {
  readonly name = 'oracle-api'
  constructor(private readonly base: string, private readonly key?: string) {}
  private async get(path: string): Promise<any> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    try {
      const res = await fetch(`${this.base.replace(/\/$/, '')}${path}`, {
        headers: this.key ? { Authorization: `Bearer ${this.key}` } : {},
        signal: ctrl.signal,
      })
      if (res.status === 404) return null
      if (!res.ok) throw new ReceiptLookupUnavailable(`Oracle API ตอบ HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      if (err instanceof ReceiptLookupUnavailable) throw err
      throw new ReceiptLookupUnavailable(`เรียก Oracle API ไม่สำเร็จ: ${err?.name === 'AbortError' ? 'timeout' : err?.message ?? err}`)
    } finally {
      clearTimeout(timer)
    }
  }
  async suppliersByPo(po: string) {
    const body = await this.get(`/po/${encodeURIComponent(po)}/suppliers`)
    return Array.isArray(body?.suppliers) ? body.suppliers : []
  }
  async findReceipts(q: { supplierTaxId: string; invoiceNum: string }) {
    const qs = new URLSearchParams({ supplier_tax_id: q.supplierTaxId, invoice_num: q.invoiceNum })
    const body = await this.get(`/receipts?${qs}`)
    return Array.isArray(body?.receipts) ? body.receipts : []
  }
}

/**
 * Parses Oracle SQL*Plus CSV output into structured objects.
 * Handles quoted cells with commas/newlines and strips SQL*Plus footers (e.g. "1 row selected.").
 */
export function parseOracleCsv(csvText: string): Record<string, string>[] {
  const cleaned = csvText
    .replace(/\r/g, '')
    .replace(/\n*\d+\s+rows?\s+selected\.?\s*$/i, '')
    .replace(/^no rows selected\.?\s*$/i, '')
    .trim()
  if (!cleaned) return []

  const lines: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      cur += ch
    } else if (ch === '\n' && !inQuotes) {
      if (cur.trim()) lines.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.trim()) lines.push(cur)
  if (lines.length < 2) return []

  const parseRow = (line: string): string[] => {
    const cells: string[] = []
    let cell = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (quoted && line[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          quoted = !quoted
        }
      } else if (c === ',' && !quoted) {
        cells.push(cell.trim())
        cell = ''
      } else {
        cell += c
      }
    }
    cells.push(cell.trim())
    return cells
  }

  const header = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toUpperCase())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]).map(v => v.replace(/^"|"$/g, '').trim())
    if (values.length === 1 && values[0] === '') continue
    const row: Record<string, string> = {}
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] ?? ''
    }
    rows.push(row)
  }
  return rows
}

/**
 * Direct Oracle MCP (ORDS) query provider using standard ERP queries for receipt lookup.
 */
export class OracleMcpReceiptProvider implements ReceiptLookupProvider {
  readonly name = 'oracle-mcp'
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly database: string = process.env.ORACLE_MCP_DATABASE || 'default',
  ) {}

  async sqlRun(sql: string): Promise<Record<string, string>[]> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'sql_run',
            arguments: {
              database: this.database,
              sql,
            },
          },
        }),
        signal: ctrl.signal,
      })

      if (res.status === 401 || res.status === 403) {
        throw new ReceiptLookupUnavailable(`Oracle MCP Authentication Failed (HTTP ${res.status}): Token อาจหมดอายุ กรุณาอัปเดต ORACLE_MCP_TOKEN`)
      }
      if (!res.ok) {
        throw new ReceiptLookupUnavailable(`Oracle MCP ตอบกลับ HTTP ${res.status}`)
      }

      const data = await res.json()
      if (data?.error) {
        throw new ReceiptLookupUnavailable(`Oracle MCP Error: ${data.error.message || JSON.stringify(data.error)}`)
      }

      const text = data?.result?.content?.[0]?.text || ''
      return parseOracleCsv(text)
    } catch (err: any) {
      if (err instanceof ReceiptLookupUnavailable) throw err
      throw new ReceiptLookupUnavailable(`เรียก Oracle MCP ไม่สำเร็จ: ${err?.name === 'AbortError' ? 'timeout' : err?.message ?? err}`)
    } finally {
      clearTimeout(timer)
    }
  }

  async suppliersByPo(po: string) {
    const cleanPo = po.trim().replace(/[^a-zA-Z0-9_\-\/]/g, '')
    if (!cleanPo) return []

    const sql = `
SELECT SUBSTR(COALESCE(sup.TCA_SYNC_VAT_REG_NUM, pv.VAT_REGISTRATION_NUM, sup.NUM_1099), -13) AS SUPPLIER_TAX_ID,
       pv.VENDOR_NAME AS SUPPLIER_NAME
FROM PO.PO_HEADERS_ALL ph
JOIN APPS.PO_VENDORS pv ON pv.VENDOR_ID = ph.VENDOR_ID
JOIN AP.AP_SUPPLIERS sup ON sup.VENDOR_ID = ph.VENDOR_ID
WHERE ph.SEGMENT1 = '${cleanPo}'
FETCH FIRST 10 ROWS ONLY
    `.trim()

    const rows = await this.sqlRun(sql)
    const seen = new Map<string, string>()
    for (const r of rows) {
      const rawTax = r['SUPPLIER_TAX_ID']
      const name = r['SUPPLIER_NAME'] || ''
      const tax = normalizeTaxId(rawTax) || rawTax
      if (tax) seen.set(tax, name)
    }
    return [...seen].map(([supplierTaxId, supplierName]) => ({ supplierTaxId, supplierName }))
  }

  async findReceipts(q: { supplierTaxId: string; invoiceNum: string }) {
    const cleanTax = (normalizeTaxId(q.supplierTaxId) || q.supplierTaxId).trim().replace(/[^0-9A-Za-z]/g, '')
    const cleanInv = q.invoiceNum.trim().toUpperCase().replace(/['"\\]/g, '')
    if (!cleanTax || !cleanInv) return []

    const sql = `
SELECT ph.ORG_ID AS ORG_ID,
       hou.NAME AS OU_NAME,
       ph.SEGMENT1 AS PO_NUM,
       h.RECEIPT_NUM AS RECEIPT_NUM,
       v.RECEIVER AS RECEIVER,
       l.LINE_NUM AS LINE,
       SUBSTR(COALESCE(sup.TCA_SYNC_VAT_REG_NUM, pv.VAT_REGISTRATION_NUM, sup.NUM_1099), -13) AS SUPPLIER_TAX_ID,
       pv.VENDOR_NAME AS SUPPLIER_NAME,
       msi.SEGMENT1 AS ITEM_CODE,
       l.ITEM_DESCRIPTION AS ITEM,
       l.QUANTITY_RECEIVED AS QTY,
       l.UNIT_OF_MEASURE AS UOM,
       pl.UNIT_PRICE AS UNIT_PRICE,
       l.QUANTITY_RECEIVED * pl.UNIT_PRICE AS LINE_AMOUNT,
       h.SHIPMENT_NUM AS SHIPMENT_NUM,
       h.PACKING_SLIP AS PACKING_SLIP,
       TO_CHAR(h.CREATION_DATE, 'YYYY-MM-DD') AS RECEIPT_DATE
FROM PO.RCV_SHIPMENT_LINES l
JOIN PO.RCV_SHIPMENT_HEADERS h ON h.SHIPMENT_HEADER_ID = l.SHIPMENT_HEADER_ID
JOIN PO.PO_LINES_ALL pl ON pl.PO_LINE_ID = l.PO_LINE_ID
JOIN PO.PO_HEADERS_ALL ph ON ph.PO_HEADER_ID = l.PO_HEADER_ID
JOIN APPS.RCV_VRC_HDS_V v ON v.SHIPMENT_HEADER_ID = h.SHIPMENT_HEADER_ID
LEFT JOIN APPS.PO_VENDORS pv ON pv.VENDOR_ID = ph.VENDOR_ID
LEFT JOIN AP.AP_SUPPLIERS sup ON sup.VENDOR_ID = ph.VENDOR_ID
LEFT JOIN APPS.HR_OPERATING_UNITS hou ON hou.ORGANIZATION_ID = ph.ORG_ID
LEFT JOIN APPS.MTL_SYSTEM_ITEMS_B msi ON msi.INVENTORY_ITEM_ID = l.ITEM_ID AND msi.ORGANIZATION_ID = l.TO_ORGANIZATION_ID
WHERE (UPPER(h.SHIPMENT_NUM) = '${cleanInv}' OR UPPER(h.PACKING_SLIP) = '${cleanInv}')
  AND SUBSTR(COALESCE(sup.TCA_SYNC_VAT_REG_NUM, pv.VAT_REGISTRATION_NUM, sup.NUM_1099), -13) = '${cleanTax}'
ORDER BY h.RECEIPT_NUM, l.LINE_NUM
FETCH FIRST 50 ROWS ONLY
    `.trim()

    const rows = await this.sqlRun(sql)
    const byReceiptNum = new Map<string, ReceiptRecord>()

    for (const row of rows) {
      const rcvId = String(row['RECEIPT_NUM'] || '').trim()
      if (!rcvId) continue

      const orgIdNum = parseInt(row['ORG_ID'] || '', 10)
      const validOrgId = isNaN(orgIdNum) ? null : orgIdNum
      const compCode = validOrgId != null ? companyOfOrg(validOrgId) : null
      const compName = compCode && COMPANIES[compCode] ? COMPANIES[compCode].name : null

      if (!byReceiptNum.has(rcvId)) {
        const poNum = String(row['PO_NUM'] || '').trim()
        byReceiptNum.set(rcvId, {
          receiveId: rcvId,
          receiptDate: row['RECEIPT_DATE'] || null,
          supplierTaxId: normalizeTaxId(row['SUPPLIER_TAX_ID']) || row['SUPPLIER_TAX_ID'] || cleanTax,
          supplierName: row['SUPPLIER_NAME'] || '',
          invoiceNum: row['SHIPMENT_NUM'] || row['PACKING_SLIP'] || cleanInv,
          companyCode: compCode,
          companyName: compName,
          orgId: validOrgId,
          ouName: row['OU_NAME'] || null,
          receiverName: row['RECEIVER'] || null,
          poNumbers: poNum ? [poNum] : [],
          lines: [],
          total: 0,
        })
      }

      const rec = byReceiptNum.get(rcvId)!
      const poNum = String(row['PO_NUM'] || '').trim()
      if (poNum && !rec.poNumbers.includes(poNum)) {
        rec.poNumbers.push(poNum)
      }

      const lineNo = parseInt(row['LINE'] || '1', 10) || (rec.lines.length + 1)
      const qty = parseFloat(row['QTY'] || '0') || 0
      const unitPrice = parseFloat(row['UNIT_PRICE'] || '0') || 0
      const lineAmount = parseFloat(row['LINE_AMOUNT'] || '0') || Math.round(qty * unitPrice * 100) / 100

      rec.lines.push({
        poNumber: poNum,
        receiptNum: rcvId,
        lineNo,
        rcvLineId: `${rcvId}-${lineNo}`,
        itemCode: row['ITEM_CODE'] || null,
        itemDesc: row['ITEM'] || '',
        qty,
        uom: row['UOM'] || '',
        unitPrice,
        lineAmount,
        qtyBilled: 0,
        lineStatus: 'FULLY RECEIVED',
        receiver: row['RECEIVER'] || null,
        ouName: row['OU_NAME'] || null,
      })
    }

    for (const rec of byReceiptNum.values()) {
      rec.total = Math.round(rec.lines.reduce((s, l) => s + l.lineAmount, 0) * 100) / 100
    }

    return [...byReceiptNum.values()]
  }
}

/**
 * Composite provider: tries primary first; if primary is unavailable (e.g. 401 token expired or network down),
 * falls back to fixture so UI operations remain functional.
 */
export class FallbackReceiptProvider implements ReceiptLookupProvider {
  readonly name: string
  constructor(
    private readonly primary: ReceiptLookupProvider,
    private readonly fallback: ReceiptLookupProvider,
  ) {
    this.name = `${primary.name}+${fallback.name}`
  }

  async suppliersByPo(po: string) {
    try {
      return await this.primary.suppliersByPo(po)
    } catch (err: any) {
      console.warn(`[ReceiptLookup] Primary (${this.primary.name}) failed, falling back to ${this.fallback.name}:`, err?.message ?? err)
      return await this.fallback.suppliersByPo(po)
    }
  }

  async findReceipts(q: { supplierTaxId: string; invoiceNum: string }) {
    try {
      return await this.primary.findReceipts(q)
    } catch (err: any) {
      console.warn(`[ReceiptLookup] Primary (${this.primary.name}) failed, falling back to ${this.fallback.name}:`, err?.message ?? err)
      return await this.fallback.findReceipts(q)
    }
  }
}

let testProvider: ReceiptLookupProvider | null = null
/** Tests swap the provider; pass null to go back to the environment. */
export function setReceiptLookupProvider(p: ReceiptLookupProvider | null) {
  testProvider = p
}

export function getReceiptLookupProvider(): ReceiptLookupProvider | null {
  if (testProvider) return testProvider

  let primary: ReceiptLookupProvider | null = null
  if (process.env.ORACLE_MCP_URL && process.env.ORACLE_MCP_TOKEN) {
    primary = new OracleMcpReceiptProvider(process.env.ORACLE_MCP_URL, process.env.ORACLE_MCP_TOKEN)
  } else if (process.env.RECEIPT_LOOKUP_URL) {
    primary = new HttpProvider(process.env.RECEIPT_LOOKUP_URL, process.env.RECEIPT_LOOKUP_KEY)
  }

  const fixturePath = process.env.RECEIPT_LOOKUP_FIXTURE
  const fallback = fixturePath ? new FixtureProvider(fixturePath) : null

  if (primary && fallback) {
    return new FallbackReceiptProvider(primary, fallback)
  }
  if (primary) return primary
  if (fallback) return fallback
  return null
}

// ---------------------------------------------------------------------------- the lookup itself

export interface ReceiptLookupInput {
  supplierTaxId?: string | null
  invoiceNum?: string | null
  poNumber?: string | null
  /** Tax id the OCR read on the document (null for UNRESOLVED / unreadable). */
  documentTaxId?: string | null
}

export type ReceiptLookupResult =
  | { status: 'FOUND'; receipt: ReceiptRecord; supplierTaxId: string; invoiceNum: string; supplierFromPo: boolean }
  | {
      status: 'NEED_KEYS' | 'PO_NOT_FOUND' | 'PO_MULTIPLE_SUPPLIERS' | 'NOT_FOUND' | 'MULTIPLE' | 'SUPPLIER_MISMATCH'
      message: string
      count?: number
    }

/** Sum of line amounts, rounded to satang. */
export const receiptTotalOf = (r: ReceiptRecord): number =>
  typeof r.total === 'number' ? r.total : Math.round(r.lines.reduce((s, l) => s + (Number(l.lineAmount) || 0), 0) * 100) / 100

export async function lookupReceipt(input: ReceiptLookupInput, provider = getReceiptLookupProvider()): Promise<ReceiptLookupResult> {
  if (!provider) throw new ReceiptLookupUnavailable()

  const invoiceNum = normalizeInvoiceNum(input.invoiceNum)
  let taxId = normalizeTaxId(input.supplierTaxId)
  let supplierFromPo = false

  if (!taxId && input.poNumber?.trim()) {
    const suppliers = await provider.suppliersByPo(input.poNumber.trim())
    if (suppliers.length === 0) return { status: 'PO_NOT_FOUND', message: `ไม่พบ PO ${input.poNumber.trim()}` }
    const distinct = new Set(suppliers.map(s => normalizeTaxId(s.supplierTaxId)))
    if (distinct.size > 1) {
      return { status: 'PO_MULTIPLE_SUPPLIERS', message: `PO นี้มีผู้ขาย ${distinct.size} ราย · กรุณาระบุเลขผู้เสียภาษีผู้ขาย`, count: distinct.size }
    }
    taxId = normalizeTaxId(suppliers[0].supplierTaxId)
    supplierFromPo = true
  }
  if (!taxId || !invoiceNum) {
    return { status: 'NEED_KEYS', message: 'ต้องมีเลขที่ใบแจ้งหนี้ และเลขผู้เสียภาษีผู้ขาย (หรือ PO)' }
  }

  const receipts = (await provider.findReceipts({ supplierTaxId: taxId, invoiceNum })).filter(r => normalizeReceiveId(r.receiveId))
  if (receipts.length === 0) return { status: 'NOT_FOUND', message: 'ไม่พบใบรับ · ตรวจเลขผู้เสียภาษีและเลขที่ใบแจ้งหนี้' }
  const ids = new Set(receipts.map(r => normalizeReceiveId(r.receiveId)))
  if (ids.size > 1) {
    return {
      status: 'MULTIPLE',
      message: `พบ ${ids.size} ใบรับสำหรับใบแจ้งหนี้เดียว · ข้อมูลผิดปกติ (1 ใบแจ้งหนี้ = 1 ใบรับ) ติดต่อผู้ดูแล Oracle`,
      count: ids.size,
    }
  }
  const receipt = { ...receipts[0], receiveId: normalizeReceiveId(receipts[0].receiveId)! }

  const docTax = normalizeTaxId(input.documentTaxId)
  if (docTax && normalizeTaxId(receipt.supplierTaxId) !== docTax) {
    return {
      status: 'SUPPLIER_MISMATCH',
      message: `ผู้ขายในใบรับ (${receipt.supplierTaxId}) ไม่ตรงกับเอกสาร (${docTax})`,
    }
  }
  return { status: 'FOUND', receipt, supplierTaxId: taxId, invoiceNum, supplierFromPo }
}
