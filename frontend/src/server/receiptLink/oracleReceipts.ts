/**
 * v5.11 Phase 1 — look a receipt up in Oracle (portal side; the engine is not called).
 *
 * Sources, in order:
 *   1. ORACLE_MCP_URL + ORACLE_MCP_TOKEN → `sql_run` (same MCP the company sync uses).
 *   2. Outside production only: the receipt lines the engine already stored on any document
 *      (`payloadJson.oracleReceiptLines`) — a snapshot good enough for local work and tests.
 *   3. Production without MCP → `unavailable` (the UI shows "Oracle ล่ม" and offers Hold).
 *
 * The receipt number is validated (A-Z 0-9 -, 4–30) before it is put into SQL text, because
 * `sql_run` takes a string, not bind variables.
 *
 * NOT VERIFIED against the real MCP: the SQL (RCV_SHIPMENT_HEADERS / LINES join) and the shape of
 * the MCP answer (`result.content[0].text` JSON rows, or `result.rows`). See CHANGELOG "ยังไม่ได้ทดสอบ".
 */
import { prisma } from '../../lib/prisma'
import { companyOfOrg } from '../../mock/companies'
import { isProduction } from '../auth/config'
import { RECEIPT_INPUT_RE, normalizeReceiptInput, round2, type OracleReceipt, type ReceiptLine } from '../../lib/receiptLink'

export type OracleLookupResult =
  | { ok: true; receipt: OracleReceipt | null; source: 'oracle_mcp' | 'db_snapshot' }
  | { ok: false; error: string; code: 'ORACLE_UNAVAILABLE' | 'BAD_RECEIPT' }

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}
const str = (v: unknown): string | null => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim())

export function receiptSql(receiptNum: string): string {
  // receiptNum already matched RECEIPT_INPUT_RE: no quote can reach the SQL text.
  return `
    SELECT rsh.RECEIPT_NUM, rsl.LINE_NUM, rsl.SHIPMENT_LINE_ID, rsh.SHIP_TO_ORG_ID AS ORG_ID,
           hou.NAME AS OU_NAME, pv.VENDOR_NAME, pv.VAT_REGISTRATION_NUM AS SUPPLIER_TAX_ID,
           ppf.FULL_NAME AS RECEIVER, pha.SEGMENT1 AS PO_NUM, pla.LINE_NUM AS PO_LINE_NUM,
           msi.SEGMENT1 AS ITEM_CODE, rsl.ITEM_DESCRIPTION, rsl.QUANTITY_RECEIVED AS QTY,
           rsl.UNIT_OF_MEASURE AS UOM, pla.UNIT_PRICE
      FROM RCV_SHIPMENT_HEADERS rsh
      JOIN RCV_SHIPMENT_LINES rsl ON rsl.SHIPMENT_HEADER_ID = rsh.SHIPMENT_HEADER_ID
      LEFT JOIN PO_HEADERS_ALL pha ON pha.PO_HEADER_ID = rsl.PO_HEADER_ID
      LEFT JOIN PO_LINES_ALL pla ON pla.PO_LINE_ID = rsl.PO_LINE_ID
      LEFT JOIN AP_SUPPLIERS pv ON pv.VENDOR_ID = rsh.VENDOR_ID
      LEFT JOIN HR_OPERATING_UNITS hou ON hou.ORGANIZATION_ID = pha.ORG_ID
      LEFT JOIN PER_ALL_PEOPLE_F ppf ON ppf.PERSON_ID = rsl.DELIVER_TO_PERSON_ID
           AND SYSDATE BETWEEN ppf.EFFECTIVE_START_DATE AND ppf.EFFECTIVE_END_DATE
      LEFT JOIN MTL_SYSTEM_ITEMS_B msi ON msi.INVENTORY_ITEM_ID = rsl.ITEM_ID
           AND msi.ORGANIZATION_ID = rsl.TO_ORGANIZATION_ID
     WHERE UPPER(rsh.RECEIPT_NUM) = '${receiptNum}'
     ORDER BY rsl.LINE_NUM`.trim()
}

/** Rows (any key case) → one receipt; null when there is no row. */
export function receiptFromRows(receiptNum: string, rows: Array<Record<string, unknown>>): OracleReceipt | null {
  if (!rows.length) return null
  const up = rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toUpperCase(), v])))
  const first = up[0]
  const orgId = num(first.ORG_ID) ?? num(first.OU_ORG_ID)
  const lines: ReceiptLine[] = up.map((r, idx) => {
    const qty = num(r.QTY) ?? 0
    const unitPrice = num(r.UNIT_PRICE) ?? 0
    const lineNo = num(r.LINE_NUM) ?? num(r.LINE) ?? idx + 1
    return {
      rcvLineId: str(r.RCV_LINE_ID) ?? `${receiptNum}-${lineNo}`,
      lineNo,
      poNumber: str(r.PO_NUM) ?? '',
      itemCode: str(r.ITEM_CODE),
      itemDesc: str(r.ITEM_DESCRIPTION) ?? str(r.ITEM) ?? '',
      qty,
      uom: str(r.UOM) ?? '',
      unitPrice,
      lineAmount: num(r.LINE_AMOUNT) ?? round2(qty * unitPrice),
    }
  })
  return {
    receiptNum,
    orgId,
    companyCode: orgId != null ? companyOfOrg(orgId) : '?',
    ouName: str(first.OU_NAME),
    supplierName: str(first.VENDOR_NAME) ?? str(first.SUPPLIER_NAME),
    supplierTaxId: str(first.SUPPLIER_TAX_ID),
    receiver: str(first.RECEIVER),
    poNumbers: [...new Set(lines.map(l => l.poNumber).filter(Boolean))],
    lines,
    total: round2(lines.reduce((s, l) => s + l.lineAmount, 0)),
  }
}

/** MCP JSON-RPC answer → rows. Accepts `result.rows`, `result.content[0].text` (JSON) or an array. */
export function rowsFromMcp(body: any): Array<Record<string, unknown>> | null {
  const r = body?.result
  if (!r || body?.error) return null
  if (Array.isArray(r)) return r
  if (Array.isArray(r.rows)) return r.rows
  const text = r.content?.[0]?.text
  if (typeof text === 'string') {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed
      if (Array.isArray(parsed?.rows)) return parsed.rows
    } catch {
      return null
    }
  }
  return null
}

async function fromMcp(url: string, token: string, receiptNum: string): Promise<OracleLookupResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'sql_run', arguments: { sql: receiptSql(receiptNum) } } }),
      signal: AbortSignal.timeout(Number(process.env.ORACLE_LOOKUP_TIMEOUT_MS) || 6000),
    })
    if (!res.ok) return { ok: false, code: 'ORACLE_UNAVAILABLE', error: `Oracle MCP HTTP ${res.status}` }
    const rows = rowsFromMcp(await res.json())
    if (!rows) return { ok: false, code: 'ORACLE_UNAVAILABLE', error: 'Oracle MCP ตอบกลับในรูปแบบที่อ่านไม่ได้' }
    return { ok: true, receipt: receiptFromRows(receiptNum, rows), source: 'oracle_mcp' }
  } catch (err: any) {
    return { ok: false, code: 'ORACLE_UNAVAILABLE', error: err?.name === 'TimeoutError' ? 'Oracle ไม่ตอบภายในเวลาที่กำหนด' : 'เชื่อมต่อ Oracle ไม่ได้' }
  }
}

/** Dev / test: receipt lines the engine already stored on documents. */
async function fromDbSnapshot(receiptNum: string): Promise<OracleLookupResult> {
  const rows = await prisma.document.findMany({ select: { payloadJson: true } })
  const lines: Array<Record<string, unknown>> = []
  let header: Record<string, unknown> = {}
  for (const row of rows) {
    let p: any
    try {
      p = JSON.parse(row.payloadJson)
    } catch {
      continue
    }
    const rl = Array.isArray(p?.oracleReceiptLines) ? p.oracleReceiptLines : []
    const mine = rl.filter((l: any) => normalizeReceiptInput(l?.receiptNum) === receiptNum)
    if (!mine.length) continue
    header = { ORG_ID: p.orgId ?? null, OU_NAME: p.ouName ?? null, VENDOR_NAME: p.supplierName, SUPPLIER_TAX_ID: p.supplierTaxId, RECEIVER: p.receiverName ?? mine[0].receiver ?? null }
    for (const l of mine) {
      lines.push({ ...header, RCV_LINE_ID: l.rcvLineId, LINE_NUM: l.lineNo, PO_NUM: l.poNumber, ITEM_CODE: l.itemCode, ITEM_DESCRIPTION: l.itemDesc, QTY: l.qty, UOM: l.uom, UNIT_PRICE: l.unitPrice, LINE_AMOUNT: l.lineAmount })
    }
    break // one document's snapshot is the receipt; others carry the same lines
  }
  return { ok: true, receipt: receiptFromRows(receiptNum, lines), source: 'db_snapshot' }
}

export type ReceiptLookupFn = (receiptNum: string) => Promise<OracleLookupResult>

let override: ReceiptLookupFn | null = null
/** Tests: replace the lookup (e.g. to simulate Oracle down). Pass null to restore. */
export function __setReceiptLookupForTests(fn: ReceiptLookupFn | null) {
  override = fn
}

export async function lookupReceipt(raw: string): Promise<OracleLookupResult> {
  const receiptNum = normalizeReceiptInput(raw)
  if (!receiptNum || !RECEIPT_INPUT_RE.test(receiptNum)) {
    return { ok: false, code: 'BAD_RECEIPT', error: 'รูปแบบเลขใบรับไม่ถูกต้อง (A-Z 0-9 - ยาว 4–30)' }
  }
  if (override) return override(receiptNum)
  const url = process.env.ORACLE_MCP_URL
  const token = process.env.ORACLE_MCP_TOKEN
  if (url && token) return fromMcp(url, token, receiptNum)
  if (isProduction()) return { ok: false, code: 'ORACLE_UNAVAILABLE', error: 'ยังไม่ได้ตั้งค่า ORACLE_MCP_URL' }
  return fromDbSnapshot(receiptNum)
}
