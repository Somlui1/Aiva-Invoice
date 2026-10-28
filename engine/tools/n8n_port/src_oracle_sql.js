// =================================================================================================
// src_oracle_sql.js — VERBATIM port of adapters/oracle/mcp_repository.py SQL + row mapping.
// If a template here differs from the Python one, the payload is wrong: do not "improve" it.
// =================================================================================================

const SUPPLIER_TAX_EXPR = "SUBSTR(COALESCE(sup.TCA_SYNC_VAT_REG_NUM, pv.VAT_REGISTRATION_NUM, sup.NUM_1099), -13)";
const _SUPPLIER_JOIN = "JOIN AP.AP_SUPPLIERS sup ON sup.VENDOR_ID = ph.VENDOR_ID";
const EXTRA_COLUMNS = ["PO_NUM", "ITEM_CODE", "SHIPMENT_NUM", "PACKING_SLIP", "QTY_BILLED", "MATCH_MODE"];
const MULTI_EXPECT = ["RECEIPT_NUM", "LINE", "PO_NUM"];
const ALLOWED_INVOICE_COLUMNS = { SHIPMENT_NUM: "h.SHIPMENT_NUM", PACKING_SLIP: "h.PACKING_SLIP", WAYBILL_AIRBILL_NUM: "h.WAYBILL_AIRBILL_NUM" };
const INVOICE_COLUMNS = ["SHIPMENT_NUM", "PACKING_SLIP", "WAYBILL_AIRBILL_NUM"];

const INV_KEYS = "h.SHIPMENT_NUM IN (:p_invoice_in)\n";
const INV_PREFIX = "     OR (INSTR(h.SHIPMENT_NUM, '-') > 0 AND INSTR(h.SHIPMENT_NUM, ph.SEGMENT1) > 0\n" +
  "          AND UPPER(SUBSTR(h.SHIPMENT_NUM, 1, INSTR(h.SHIPMENT_NUM, '-') - 1)) = UPPER(:p_invoice_num))\n";
const MATCH_MODE = "CASE WHEN h.SHIPMENT_NUM = :p_invoice_num THEN 'EXACT'\n" +
  "       WHEN h.SHIPMENT_NUM IN (:p_invoice_in) THEN 'NORMALIZED'\n" +
  "       ELSE 'PREFIX' END AS MATCH_MODE";
const _LINE_COLS = "ph.ORG_ID AS ORG_ID, h.RECEIPT_NUM AS RECEIPT_NUM, v.RECEIVER AS RECEIVER, l.LINE_NUM AS LINE,\n" +
  "       l.ITEM_DESCRIPTION AS ITEM, l.QUANTITY_RECEIVED AS QTY, l.UNIT_OF_MEASURE AS UOM,\n" +
  "       pl.UNIT_PRICE AS UNIT_PRICE, l.QUANTITY_RECEIVED * pl.UNIT_PRICE AS LINE_AMOUNT,\n" +
  "       ph.SEGMENT1 AS PO_NUM, msi.SEGMENT1 AS ITEM_CODE, h.SHIPMENT_NUM AS SHIPMENT_NUM,\n" +
  "       h.PACKING_SLIP AS PACKING_SLIP, NVL(pll.QUANTITY_BILLED, 0) AS QTY_BILLED";
const _RECEIPT_FROM = "FROM PO.RCV_SHIPMENT_LINES l\n" +
  "JOIN PO.RCV_SHIPMENT_HEADERS h ON h.SHIPMENT_HEADER_ID = l.SHIPMENT_HEADER_ID\n" +
  "JOIN PO.PO_LINES_ALL pl ON pl.PO_LINE_ID = l.PO_LINE_ID\n" +
  "JOIN PO.PO_HEADERS_ALL ph ON ph.PO_HEADER_ID = l.PO_HEADER_ID\n" +
  "JOIN APPS.RCV_VRC_HDS_V v ON v.SHIPMENT_HEADER_ID = h.SHIPMENT_HEADER_ID\n" +
  "LEFT JOIN PO.PO_LINE_LOCATIONS_ALL pll ON pll.LINE_LOCATION_ID = l.PO_LINE_LOCATION_ID\n" +
  "LEFT JOIN APPS.MTL_SYSTEM_ITEMS_B msi ON msi.INVENTORY_ITEM_ID = l.ITEM_ID AND msi.ORGANIZATION_ID = l.TO_ORGANIZATION_ID";

const RCV_V01 = `\nSELECT ${_LINE_COLS},\n       ${MATCH_MODE}\n${_RECEIPT_FROM}\nWHERE (${INV_KEYS}${INV_PREFIX})\n  AND ph.SEGMENT1 = :p_po_number\nORDER BY h.RECEIPT_NUM, l.LINE_NUM\nFETCH FIRST 50 ROWS ONLY`;
const PO_SUPPLIER_TAX = `\nSELECT ${SUPPLIER_TAX_EXPR} AS SUPPLIER_TAX_ID\nFROM PO.PO_HEADERS_ALL ph\nJOIN APPS.PO_VENDORS pv ON pv.VENDOR_ID = ph.VENDOR_ID\n${_SUPPLIER_JOIN}\nWHERE ph.SEGMENT1 = :p_po_number\nFETCH FIRST 1 ROWS ONLY`;
const RCV_V02 = `\nSELECT ${_LINE_COLS},\n       ${MATCH_MODE}\n${_RECEIPT_FROM}\nJOIN APPS.PO_VENDORS pv ON pv.VENDOR_ID = ph.VENDOR_ID\nWHERE (${INV_KEYS})\n  AND COALESCE(pv.VAT_REGISTRATION_NUM, pv.NUM_1099) = :p_supplier_tax_id\nORDER BY h.RECEIPT_NUM, l.LINE_NUM\nFETCH FIRST 50 ROWS ONLY`;

const _MULTI_COLS = "ph.ORG_ID AS ORG_ID, ph.ORG_ID AS OU_ORG_ID, hou.NAME AS OU_NAME,\n" +
  "       fsp.VAT_REGISTRATION_NUM AS CUSTOMER_TAX_ID, ph.SEGMENT1 AS PO_NUM,\n" +
  "       h.RECEIPT_NUM AS RECEIPT_NUM, v.RECEIVER AS RECEIVER, l.LINE_NUM AS LINE,\n" +
  `       ${SUPPLIER_TAX_EXPR} AS SUPPLIER_TAX_ID, pv.VENDOR_NAME AS SUPPLIER_NAME,\n` +
  "       msi.SEGMENT1 AS ITEM_CODE, l.ITEM_DESCRIPTION AS ITEM, l.QUANTITY_RECEIVED AS QTY,\n" +
  "       l.UNIT_OF_MEASURE AS UOM, pl.UNIT_PRICE AS UNIT_PRICE,\n" +
  "       l.QUANTITY_RECEIVED * pl.UNIT_PRICE AS LINE_AMOUNT, l.SHIPMENT_LINE_STATUS_CODE AS LINE_STATUS,\n" +
  "       pll.CLOSED_CODE AS PO_LINE_STATUS, NVL(pll.QUANTITY_BILLED, 0) AS QTY_BILLED,\n" +
  "       h.SHIPMENT_NUM AS SHIPMENT_NUM, h.PACKING_SLIP AS PACKING_SLIP,\n" +
  "       h.WAYBILL_AIRBILL_NUM AS WAYBILL_AIRBILL_NUM";
const _MULTI_FROM = _RECEIPT_FROM + "\n" +
  "LEFT JOIN APPS.PO_VENDORS pv ON pv.VENDOR_ID = ph.VENDOR_ID\n" +
  "LEFT JOIN AP.AP_SUPPLIERS sup ON sup.VENDOR_ID = ph.VENDOR_ID\n" +
  "LEFT JOIN APPS.HR_OPERATING_UNITS hou ON hou.ORGANIZATION_ID = ph.ORG_ID\n" +
  "LEFT JOIN APPS.FINANCIALS_SYSTEM_PARAMS_ALL fsp ON fsp.ORG_ID = ph.ORG_ID";

function colsOrThrow(matchColumns) {
  const cols = (matchColumns && matchColumns.length ? matchColumns : Object.keys(ALLOWED_INVOICE_COLUMNS)).map(c => String(c).toUpperCase());
  const bad = cols.filter(c => !(c in ALLOWED_INVOICE_COLUMNS));
  if (bad.length || !cols.length) throw new OracleTechnicalError('INVOICE_MATCH_COLUMN_NOT_ALLOWED:' + (bad.length ? bad.join(',') : 'empty'));
  return cols;
}
function taxInvSql(matchColumns) {
  const preds = [];
  for (const c of colsOrThrow(matchColumns)) {
    const col = ALLOWED_INVOICE_COLUMNS[c];
    preds.push(`${col} IN (:p_invoice_in)`);
    preds.push(`UPPER(REPLACE(${col}, ' ', '')) IN (:p_invoice_in)`);
  }
  return `SELECT ${_MULTI_COLS}\n${_MULTI_FROM}\nWHERE ${SUPPLIER_TAX_EXPR} = :p_supplier_tax_id\n  AND (${preds.join('\n    OR ')})\nORDER BY h.RECEIPT_NUM, l.LINE_NUM\nFETCH FIRST 500 ROWS ONLY`;
}
function taxInvSuffixSql(suffixes, matchColumns) {
  const preds = [], binds = {};
  suffixes.forEach((sfx, i) => {
    const lit = '/' + String(sfx);
    binds['p_sfx' + i] = ['invoice_num', lit];
    for (const c of colsOrThrow(matchColumns)) {
      const col = ALLOWED_INVOICE_COLUMNS[c];
      preds.push(`SUBSTR(UPPER(REPLACE(${col}, ' ', '')), -${lit.length}) = :p_sfx${i}`);
    }
  });
  const pred = preds.length ? preds.join('\n    OR ') : '1 = 0';
  return [`SELECT ${_MULTI_COLS}\n${_MULTI_FROM}\nWHERE ${SUPPLIER_TAX_EXPR} = :p_supplier_tax_id\n  AND (${pred})\nORDER BY h.RECEIPT_NUM, l.LINE_NUM\nFETCH FIRST 200 ROWS ONLY`, binds];
}
function invByPoVendorSql(matchColumns) {
  return taxInvSql(matchColumns).replace(`WHERE ${SUPPLIER_TAX_EXPR} = :p_supplier_tax_id`,
    "WHERE ph.VENDOR_ID = (SELECT p2.VENDOR_ID FROM PO.PO_HEADERS_ALL p2\n" +
    "                      WHERE p2.SEGMENT1 = :p_po_number AND ROWNUM = 1)");
}
const RCV_BY_NUM = `SELECT ${_MULTI_COLS}\n${_MULTI_FROM}\nWHERE h.RECEIPT_NUM = :p_receipt_num\n  AND ${SUPPLIER_TAX_EXPR} = :p_supplier_tax_id\nORDER BY h.RECEIPT_NUM, l.LINE_NUM\nFETCH FIRST 200 ROWS ONLY`;
const PO_LIST = `SELECT ${_MULTI_COLS}\n${_MULTI_FROM}\nWHERE ph.SEGMENT1 IN (:p_po_in)\nORDER BY h.RECEIPT_NUM, l.LINE_NUM\nFETCH FIRST 50 ROWS ONLY`;

// ------------------------------------------------------------------ MCP protocol (parse side)
function mcpTextOf(raw) {                            // McpSqlClient -> parse_mcp_payload
  const text = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!text) return '';
  const contentOf = (data) => {
    if (data.error) {
      const err = data.error, msg = (err && typeof err === 'object') ? err.message : String(err);
      const code = (err && typeof err === 'object') ? err.code : '';
      throw new OracleTechnicalError(`MCP_ERROR ${code}: ${String(msg).slice(0, 300)}`);
    }
    const res = data.result;
    if (!res || typeof res !== 'object') return null;
    if (res.isError) {
      let txt = ''; for (const c of (res.content || [])) txt += String((c || {}).text || '');
      throw new OracleTechnicalError('MCP_TOOL_ERROR: ' + txt.slice(0, 300));
    }
    for (const c of (res.content || [])) if (c && typeof c === 'object' && c.text !== null && c.text !== undefined) return String(c.text);
    return null;
  };
  const fromJson = (chunk) => { let d; try { d = JSON.parse(chunk); } catch (e) { return null; } return (d && typeof d === 'object' && !Array.isArray(d)) ? contentOf(d) : null; };
  let got = fromJson(text);
  if (got === null && text.indexOf('data:') >= 0) {
    for (const line of text.split('\n')) {
      const l = line.trim();
      if (l.indexOf('data:') !== 0) continue;
      got = fromJson(l.slice(5).trim());
      if (got !== null) break;
    }
  }
  if (got === null) throw new OracleTechnicalError('MCP_PROTOCOL: unparsable response ' + JSON.stringify(text.slice(0, 160)));
  return got.toLowerCase().indexOf('no rows selected') >= 0 ? '' : got;
}
function parseCsvRows(text) {                           // csv.reader over the MCP answer
  const rows = []; let cur = [], field = '', inQ = false, started = false;
  const t = String(text === null || text === undefined ? '' : text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"') { if (t[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c;
      continue;
    }
    if (c === '"') { inQ = true; started = true; continue; }
    if (c === ',') { cur.push(field); field = ''; started = true; continue; }
    if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; started = false; continue; }
    field += c; started = true;
  }
  if (started || field !== '' || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}
const FOOTER_ROW = /^\s*\d+\s+rows?\s+selected\.?\s*$/i;
function stripSqlplusFooter(text) { return String(text || '').split('\n').filter(l => !FOOTER_ROW.test(l)).join('\n'); }
function csvHeader(text) {
  const line = (String(text || '').split('\n').filter(l => l.trim() !== '')[0]) || '';
  const r = parseCsvRows(line)[0] || [];
  return r.map(c => String(c || '').trim().toUpperCase());
}
function parseCsvRowsText(text, expect) {            // parse_csv_rows
  if (!text || !String(text).trim() || String(text).toLowerCase().indexOf('no rows selected') >= 0) return [];
  const body = stripSqlplusFooter(text);
  if (expect && expect.length) {
    const head = new Set(csvHeader(body));
    let hit = false; for (const e of expect) if (head.has(String(e).toUpperCase())) hit = true;
    if (!hit) throw new OracleTechnicalError(`MCP_PROTOCOL: result has no expected column ${JSON.stringify(expect.slice(0, 3))} — got ${JSON.stringify([...head].slice(0, 6))}`);
  }
  const rows = parseCsvRows(body.trim());
  if (!rows.length) return [];
  const header = rows[0].map(h => String(h).trim().toUpperCase());
  const out = [];
  for (const r of rows.slice(1)) {
    const vals = header.map((h, i) => (r[i] === undefined ? '' : r[i]));
    if (!vals.length || vals.every(v => v === null || v === '')) continue;
    const o = {}; header.forEach((h, i) => { o[h] = (r[i] === undefined ? '' : r[i]); });
    out.push(o);
  }
  return out;
}

// ------------------------------------------------------------------ row mapping
function _get(d, ...keys) {
  for (const k of keys) {
    const v = (k in d) ? d[k] : d[String(k).toLowerCase()];
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}
function _optInt(d, ...keys) { const v = _get(d, ...keys); return (v && /^[0-9.]+$/.test(v)) ? parseInt(v, 10) : null; }
function _dec(v, def) {
  const s = String(v === null || v === undefined || String(v).trim() === '' ? (def || '0') : v).replace(/,/g, '').trim();
  const x = D(s); if (x === null || x.nan) throw new OracleTechnicalError('BAD_DECIMAL:' + s);
  return x;
}
function rowFrom(dIn, extended) {                    // repositories._row / mcp row_from_csv
  const d = {}; for (const [k, v] of Object.entries(dIn)) d[String(k).toUpperCase()] = (typeof v === 'string' ? v.trim() : v);
  const g = (k) => (k in d) ? d[k] : d[k.toLowerCase()];
  const extra = {};
  for (const k of EXTRA_COLUMNS) { const v = g(k); if (v !== null && v !== undefined && String(v) !== '') extra[k] = v; }
  const qty = _dec(g('QTY')), price = _dec(g('UNIT_PRICE'));
  const rawAmt = g('LINE_AMOUNT');
  const qtyS = dStr(qty), priceS = dStr(price);
  const r = {
    org_id: g('ORG_ID') === null || g('ORG_ID') === undefined || String(g('ORG_ID')).trim() === '' ? null : parseInt(String(g('ORG_ID')), 10),
    receipt_num: String(g('RECEIPT_NUM') === null || g('RECEIPT_NUM') === undefined ? 'None' : g('RECEIPT_NUM')),
    receiver: g('RECEIVER'), line: parseInt(String(g('LINE') || '0'), 10) || 0,
    item: String(g('ITEM') || ''), qty: qtyS, uom: String(g('UOM') || ''), unit_price: priceS,
    line_amount: (rawAmt === null || rawAmt === undefined || String(rawAmt).trim() === '') ? dStr(dMul(qty, price)) : dStr(_dec(rawAmt)),
    extra
  };
  if (extended) {
    Object.assign(r, {
      po_number: _get(d, 'PO_NUM', 'PO_NUMBER'), item_code: _get(d, 'ITEM_CODE'),
      qty_billed: dStr(_dec(g('QTY_BILLED'))), po_line_status: _get(d, 'PO_LINE_STATUS'),
      line_status: _get(d, 'LINE_STATUS'), supplier_tax_id: _get(d, 'SUPPLIER_TAX_ID'),
      supplier_name: _get(d, 'SUPPLIER_NAME'), customer_tax_id: _get(d, 'CUSTOMER_TAX_ID'),
      ou_org_id: _optInt(d, 'OU_ORG_ID'), ou_name: _get(d, 'OU_NAME'),
      shipment_num: _get(d, 'SHIPMENT_NUM'), packing_slip: _get(d, 'PACKING_SLIP'),
      waybill_num: _get(d, 'WAYBILL_AIRBILL_NUM', 'WAYBILL_NUM')
    });
  }
  r.rcv_line_id = r.rcv_line_id_override || (r.receipt_num + '-' + r.line);
  return r;
}
const ROW_OPTIONAL_DEFAULTS = { po_number: null, item_code: null, qty_billed: null, po_line_status: null, line_status: null, supplier_tax_id: null, supplier_name: null, customer_tax_id: null, ou_org_id: null, ou_name: null, shipment_num: null, packing_slip: null, waybill_num: null, rcv_line_id_override: null };
function rowPayload(r) {                             // contracts.row_payload (Decimal -> str via default=str)
  const out = {};
  for (const k of ['org_id', 'receipt_num', 'receiver', 'line', 'item', 'qty', 'uom', 'unit_price', 'line_amount', 'extra']) {
    out[k] = r[k];
  }
  for (const k of Object.keys(ROW_OPTIONAL_DEFAULTS)) {
    const v = r[k];
    if (k === 'qty_billed') { if (dCmp(D(v), D(0)) !== 0) out[k] = v; continue; }
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}
