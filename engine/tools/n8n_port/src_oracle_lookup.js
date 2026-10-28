// =================================================================================================
// src_oracle_lookup.js — node 16: OracleSession + the ORDS-MCP repository + document keys.
// Mirrors application/oracle_lookup.py, adapters/oracle/mcp_repository.py (query side),
//          application/invoice_keys.py, application/receipt_scope.py.
// `sqlRun(sqlText)` is the only IO: n8n supplies it via this.helpers.httpRequest (ORDS MCP sql_run);
// the local harness supplies a fixture replayer, so both sides see the same rows.
// =================================================================================================

const LEGACY_MODE = 'legacy_po_invoice', TAX_MODE = 'tax_invoice';
const DEFAULT_MATCH_COLUMNS = ['SHIPMENT_NUM', 'PACKING_SLIP', 'WAYBILL_AIRBILL_NUM'];
const _TAX_SHAPE = /^\d{13}$/, _PO_SHAPE = /^\d{8}$/;
const COLUMN_ATTR = { SHIPMENT_NUM: 'shipment_num', PACKING_SLIP: 'packing_slip', WAYBILL_AIRBILL_NUM: 'waybill_num' };

class QueryBudgetExceeded extends OracleTechnicalError { }

function lookupMode(policy) {
  const mode = String((((policy || {}).oracle || {}).lookup || {}).mode || LEGACY_MODE);
  if (mode !== LEGACY_MODE && mode !== TAX_MODE) throw new OracleTechnicalError('UNKNOWN_LOOKUP_MODE:' + mode);
  return mode;
}
function validSupplierTax(value) {
  const s = String(value === null || value === undefined ? '' : value).trim();
  if (!_TAX_SHAPE.test(s)) return null;
  try { return taxId(s); } catch (e) { return null; }
}
const _norm = (v) => normNoSpace(v);                // UPPER(REPLACE(col,' ',''))
function matchedColumn(rows, variants, columns) {
  const want = new Set((variants || []).map(_norm));
  for (const col of columns || DEFAULT_MATCH_COLUMNS) {
    const attr = COLUMN_ATTR[String(col).toUpperCase()];
    if (attr && rows.some(r => want.has(_norm(r[attr])))) return String(col).toUpperCase();
  }
  return null;
}

// ---------------------------------------------------------------- repository over ORDS MCP
class McpOracleRepository {
  constructor(sqlRun, opts) {
    const o = opts || {};
    this.sqlRun = sqlRun; this.rowCap = o.rowCap === undefined ? 50 : o.rowCap; this.rowCaps = o.rowCaps || {}; this.database = o.database || 'default';
    this.matchColumns = o.matchColumns === undefined ? null : o.matchColumns;
    this.sql = { RCV_V01, PO_SUPPLIER_TAX, RCV_V02, TAX_INV: taxInvSql(this.matchColumns), PO_LIST, RCV_BY_NUM, INV_BY_PO_VENDOR: invByPoVendorSql(this.matchColumns) };
    this.audit = []; this.rejected = [];
  }
  _cap(sql, queryId) {
    const cap = this.rowCaps[queryId] !== undefined ? this.rowCaps[queryId] : this.rowCap;
    if (/FETCH\s+FIRST/i.test(sql)) return sql.replace(/FETCH\s+FIRST\s+\d+\s+ROWS\s+ONLY/gi, `FETCH FIRST ${cap} ROWS ONLY`);
    return String(sql).trimEnd().replace(/;+$/, '') + `\nFETCH FIRST ${cap} ROWS ONLY`;
  }
  async _query(queryId, template, binds, expect) {
    const entry = { query_id: queryId, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), sql: null, binds: {}, rows: null, ms: null, error: null };
    for (const [k, v] of Object.entries(binds)) entry.binds[k] = v[1];
    const t0 = Date.now();
    let sql, rows;
    try {
      sql = this._cap(renderSql(template, binds), queryId);
      entry.sql = sql;
    } catch (e) {
      if (e instanceof OracleInputRejected) { entry.error = String(e.message); this.audit.push(entry); this.rejected.push({ ...entry }); throw e; }
      entry.error = (e.name || 'Error') + ': ' + String(e.message).slice(0, 200); entry.ms = Date.now() - t0; this.audit.push(entry); throw e;
    }
    try {
      const text = await this.sqlRun(ensureReadOnly(sql));
      rows = parseCsvRowsText(text, expect || ['RECEIPT_NUM']);
    } catch (e) {
      entry.error = (e.name || 'Error') + ': ' + String(e.message).slice(0, 200); entry.ms = Date.now() - t0;
      this.audit.push(entry);
      if (e instanceof OracleInputRejected) { this.rejected.push({ ...entry }); throw e; }
      throw e instanceof OracleTechnicalError ? e : new OracleTechnicalError(String(e.message || e));
    }
    entry.rows = rows.length; entry.ms = Date.now() - t0; this.audit.push(entry);
    return rows;
  }
  async rcvV01(poNumber, invoiceNum) {
    const rows = await this._query('RCV-V01', this.sql.RCV_V01, { p_po_number: ['po_number', poNumber], p_invoice_num: ['invoice_num', invoiceNum], p_invoice_in: ['invoice_in', invoiceVariants(invoiceNum)] });
    return rows.map(r => rowFrom(r, false));
  }
  async supplierTaxByPo(poNumber) {
    const rows = await this._query('PO-SUPPLIER', this.sql.PO_SUPPLIER_TAX, { p_po_number: ['po_number', poNumber] }, ['SUPPLIER_TAX_ID']);
    if (!rows.length) return null;
    const val = rows[0].SUPPLIER_TAX_ID || rows[0].supplier_tax_id;
    return val && String(val).trim() ? String(val).trim() : null;
  }
  async rcvV02(supplierTaxId, invoiceNum) {
    const rows = await this._query('RCV-V02', this.sql.RCV_V02, { p_supplier_tax_id: ['tax_id', supplierTaxId], p_invoice_num: ['invoice_num', invoiceNum], p_invoice_in: ['invoice_in', invoiceVariants(invoiceNum)] });
    return rows.map(r => rowFrom(r, false));
  }
  _variants(list) { return (list || []).map(v => String(v).trim()).filter(v => v && WHITELIST.invoice_num.test(v)); }
  async receiptsByTaxInvoice(supplierTaxId, variants) {
    const vs = this._variants(variants);
    if (!vs.length) return [];
    const rows = await this._query('TAX-INV', this.sql.TAX_INV, { p_supplier_tax_id: ['tax_id', supplierTaxId], p_invoice_in: ['invoice_in', vs] }, MULTI_EXPECT);
    return rows.map(r => rowFrom(r, true));
  }
  async receiptsByTaxInvoiceSuffix(supplierTaxId, suffixes) {
    const keys = (suffixes || []).map(k => String(k).trim()).filter(k => WHITELIST.invoice_num.test('/' + k));
    if (!keys.length) return [];
    const [template, binds] = taxInvSuffixSql(keys, this.matchColumns);
    const rows = await this._query('TAX-INV-SUFFIX', template, { p_supplier_tax_id: ['tax_id', supplierTaxId], ...binds }, MULTI_EXPECT);
    return rows.map(r => rowFrom(r, true));
  }
  async receiptsByPoVendorInvoice(poNumber, variants) {
    const vs = this._variants(variants);
    if (!vs.length) return [];
    const rows = await this._query('INV-BY-PO-VENDOR', this.sql.INV_BY_PO_VENDOR, { p_po_number: ['po_number', poNumber], p_invoice_in: ['invoice_in', vs] }, MULTI_EXPECT);
    return rows.map(r => rowFrom(r, true));
  }
  async receiptsByReceiptNum(supplierTaxId, receiptNum) {
    const rows = await this._query('RCV-BY-NUM', this.sql.RCV_BY_NUM, { p_receipt_num: ['receipt_num', receiptNum], p_supplier_tax_id: ['tax_id', supplierTaxId] }, MULTI_EXPECT);
    return rows.map(r => rowFrom(r, true));
  }
  async receiptsByPoList(poNumbers) {
    const set = new Set();
    for (const p of poNumbers || []) { const s = String(p).trim(); if (s && WHITELIST.po_number.test(s)) set.add(s); }
    const pos = sortedStr([...set]);
    if (!pos.length) return [];
    const rows = await this._query('PO-LIST', this.sql.PO_LIST, { p_po_in: ['po_in', pos] }, MULTI_EXPECT);
    return rows.map(r => rowFrom(r, true));
  }
  sqlAudit() { return this.audit.slice(); }
}

// ---------------------------------------------------------------- session
class OracleSession {
  constructor(repo, rowCap, opts) {
    this.repo = repo; this.rowCap = rowCap; this.calls = 0; this._memo = {};
    const o = opts || {};
    this.rowCaps = Object.fromEntries(Object.entries(o.rowCaps || {}).map(([k, v]) => [String(k), parseInt(v, 10)]));
    this.rejected = []; this.maxQueries = o.maxQueries === undefined ? null : o.maxQueries;
    this.cfg = Object.assign({}, o.lookupCfg || {}); this.trace = [];
  }
  async _call(name, fn, ...args) {
    const key = name + '|' + JSON.stringify(args.map(String));
    if (!(key in this._memo)) {
      if (this.maxQueries !== null && this.calls >= this.maxQueries) throw new QueryBudgetExceeded('QUERY_BUDGET_EXCEEDED:' + this.maxQueries);
      this.calls += 1; this.trace.push(name);
      try { this._memo[key] = await fn(...args); }
      catch (e) {
        if (e instanceof OracleInputRejected) { this.rejected.push({ query_id: name, reason: String(e.message), args: args.map(String) }); throw e; }
        if (e instanceof OracleTechnicalError) throw e;
        throw new OracleTechnicalError((e && e.name ? e.name : 'Error') + ': ' + (e && e.message ? e.message : e));
      }
    }
    return this._memo[key];
  }
  async lookup(poNumber, invoiceNum) {
    const keys = { po_number: poNumber, invoice_num: invoiceNum };
    let rows = await this._call('RCV-V01', (a, b) => this.repo.rcvV01(a, b), poNumber, invoiceNum), path = 'RCV-V01';
    if (!rows.length) {
      const tax = await this._call('PO-SUPPLIER', (a) => this.repo.supplierTaxByPo(a), poNumber);
      if (tax) {
        keys.supplier_tax_id = tax;
        const rows2 = await this._call('RCV-V02', (a, b) => this.repo.rcvV02(a, b), tax, invoiceNum);
        if (rows2.length) { rows = rows2; path = 'RCV-V02'; }
      }
    }
    return this._snapshot(keys, rows, rows.length ? path : null, [], new Date().toISOString().replace(/\.\d+Z$/, 'Z'));
  }
  async lookupTaxInvoice(invoiceNum, opts) {
    const o = opts || {}, cfg = this.cfg;
    const specs = cfg.invoice_variants || [];
    const limit = parseInt(cfg.max_invoice_keys || 12, 10);
    const po = (o.poNumber && _PO_SHAPE.test(String(o.poNumber))) ? o.poNumber : null;
    let keys = { invoice_num: invoiceNum, invoice_variants: [], po_number: po, supplier_tax_id: null, supplier_tax_id_source: null };
    let invNum = invoiceNum;
    if (invNum && po && cfg.reject_invoice_equal_po && _norm(invNum).replace(/^PO\./, '') === po) {
      keys.invoice_num_rejected = { value: invNum, reason: 'equals po_number' };
      invNum = null;
    }
    const primary = invNum ? buildVariants(invNum, specs) : [];
    keys.invoice_variants = primary;
    const owner = {};                                  // spelling -> candidate key ("" = read invoice_num)
    for (const v of primary) if (!(normKey(v) in owner)) owner[normKey(v)] = '';
    const cands = (o.invoiceCandidates || []).map(c => ({ ...c }));
    for (const c of cands) {
      for (const v of buildVariants(c.key, specs)) {
        if (Object.keys(owner).length >= limit) break;
        if (!(normKey(v) in owner)) owner[normKey(v)] = c.key;
      }
    }
    const allKeys = Object.keys(owner);
    if (cands.length) keys.invoice_candidates = cands;
    const rcands = (o.receiptCandidates || []).map(r => ({ ...r }));
    if (!allKeys.length && !rcands.length) { keys.invoice_rejected = true; return this._snapshot(keys, [], null, allKeys); }
    if (!primary.length && invNum) keys.invoice_rejected = true;

    let tax = null, source = null;
    if (cfg.use_ocr_supplier_tax_id !== false) {
      tax = validSupplierTax(o.ocrSupplierTaxId);
      if (tax && cfg.reject_supplier_tax_equal_customer && o.customerTaxId && tax === String(o.customerTaxId).trim()) {
        keys.supplier_tax_id_rejected = { value: tax, reason: 'equals customer_tax_id' };
        tax = null;
      }
      source = tax ? 'ocr' : null;
    }
    if (tax === null && po) {
      const fromOracle = await this._call('PO-SUPPLIER', (a) => this.repo.supplierTaxByPo(a), po);
      tax = validSupplierTax(fromOracle);
      source = tax ? 'oracle_po' : null;
      if (fromOracle && !tax) keys.supplier_tax_id_unusable = String(fromOracle);
    }
    keys.supplier_tax_id = tax; keys.supplier_tax_id_source = source;

    let rows = [], path = null, rcvTax = tax;
    const subTotal = o.subTotal === null || o.subTotal === undefined ? null : D(o.subTotal);
    const totalTol = D(o.totalTol === undefined ? '0.50' : o.totalTol);
    if (tax && allKeys.length) {
      const found = (await this._call('TAX-INV', (a, b) => this.repo.receiptsByTaxInvoice(a, b), tax, allKeys));
      rows = OracleSession._keepInvoiceReceipts(found, owner, cands, keys, subTotal, totalTol);
      path = rows.length ? 'TAX-INV' : null;
    }
    if (!rows.length && allKeys.length && po && source === 'ocr' && cfg.supplier_from_po_on_miss) {
      const fromOracle = await this._call('PO-SUPPLIER', (a) => this.repo.supplierTaxByPo(a), po);
      const poTax = validSupplierTax(fromOracle);
      rcvTax = poTax || tax;
      if (poTax && poTax !== tax) {
        const found = (await this._call('TAX-INV', (a, b) => this.repo.receiptsByTaxInvoice(a, b), poTax, allKeys));
        rows = OracleSession._keepInvoiceReceipts(found, owner, cands, keys, subTotal, totalTol);
        if (rows.length) {
          keys.supplier_tax_id_ocr_unmatched = tax;
          tax = poTax; source = 'oracle_po'; path = 'TAX-INV';
          keys.supplier_tax_id = tax; keys.supplier_tax_id_source = source;
        }
      } else if (!poTax) {
        const found = (await this._call('INV-BY-PO-VENDOR', (a, b) => this.repo.receiptsByPoVendorInvoice(a, b), po, allKeys));
        rows = OracleSession._keepInvoiceReceipts(found, owner, cands, keys, subTotal, totalTol);
        if (rows.length) {
          keys.supplier_tax_id_ocr_unmatched = tax;
          keys.supplier_from_po_vendor = { po_number: po, oracle_tax_id: fromOracle };
          path = 'INV-BY-PO-VENDOR';
        }
      }
    }
    if (!rows.length && rcvTax && cfg.invoice_suffix_match) {
      const got = await this._suffixLookup(rcvTax, invNum, cands, keys, subTotal, totalTol);
      rows = got[0]; path = got[1];
    }
    if (!rows.length && rcvTax && rcands.length && cfg.receipt_num_lookup) {
      const tried = [];
      const limitR = parseInt(cfg.receipt_num_max_candidates || 2, 10);
      for (const rc of rcands.slice(0, limitR)) {
        const got = (await this._call('RCV-BY-NUM', (a, b) => this.repo.receiptsByReceiptNum(a, b), rcvTax, rc.receipt_num));
        const act = got.filter(r => dIsPos(D(r.qty)));
        let total = null; for (const r of act) total = dAdd(total, D(r.line_amount));
        total = total === null ? D(0) : total;
        const ok = act.length > 0 && subTotal !== null && dCmp(dAbs(dSub(total, subTotal)), totalTol) <= 0;
        const why = ok ? 'accepted: supplier + amount equal' : (!act.length ? 'no receipt for this supplier'
          : (subTotal === null ? 'sub_total unreadable' : `amount differs: receipt ${dStr(total)} vs sub_total ${dStr(subTotal)}`));
        tried.push({ ...rc, rows: got.length, receipt_total: dStr(total), accepted: ok, reason: why });
        if (ok) { rows = got; path = 'RCV-BY-NUM'; break; }
      }
      keys.receipt_num_lookup = tried;
    }
    if (!rows.length && po && cfg.po_list_fallback !== false) {
      rows = (await this._call('PO-LIST', (a) => this.repo.receiptsByPoList(a), [po]));
      path = rows.length ? 'PO-LIST' : null;
    }
    if (rcands.length && path !== 'RCV-BY-NUM') {
      const gotN = new Set(rows.map(r => r.receipt_num));
      keys.receipt_num_candidates = rcands.map(rc => ({ ...rc, equals_found_receipt: gotN.has(rc.receipt_num) }));
    }
    return this._snapshot(keys, rows, path, allKeys);
  }
  async _suffixLookup(tax, invoiceNum, cands, keys, subTotal, tol) {
    const mind = parseInt(this.cfg.invoice_suffix_min_digits || 4, 10);
    const pool = (invoiceNum ? [invoiceNum] : []).concat(cands.map(c => c.key));
    const sfx = [];
    for (let k of pool) {
      k = _norm(k);
      if (k && k.indexOf('/') < 0 && /^[A-Za-z0-9]+$/.test(k) && (k.match(/[0-9]/g) || []).length >= mind && sfx.indexOf(k) < 0) sfx.push(k);
    }
    if (!sfx.length || subTotal === null) return [[], null];
    const found = (await this._call('TAX-INV-SUFFIX', (a, b) => this.repo.receiptsByTaxInvoiceSuffix(a, b), tax, sfx));
    const byRcv = {};
    for (const r of found) (byRcv[r.receipt_num] = byRcv[r.receipt_num] || []).push(r);
    const ok = [];
    for (const [n, rs] of Object.entries(byRcv)) {
      let total = null;
      for (const r of rs) if (dIsPos(D(r.qty))) total = dAdd(total, D(r.line_amount));
      total = total === null ? D(0) : total;
      if (dCmp(dAbs(dSub(total, subTotal)), tol) <= 0) ok.push(n);
    }
    keys.invoice_suffix_match = {
      suffixes: sfx, receipts_found: sortedStr(Object.keys(byRcv)), accepted: ok.length === 1 ? ok.slice(0, 1) : [],
      rule: 'header ends in /<printed number>, same supplier, receipt total = sub_total'
    };
    if (ok.length !== 1) return [[], null];
    const rows = byRcv[ok[0]];
    const heads = new Set();
    for (const r of rows) for (const a of ['shipment_num', 'packing_slip', 'waybill_num']) heads.add(_norm(r[a]));
    const key = sfx.find(s => [...heads].some(h => h.endsWith('/' + s))) || sfx[0];
    let stored = null; for (const h of heads) if (h.endsWith('/' + key)) { stored = h; break; }
    const src = cands.find(c => _norm(c.key) === key) || { key, source: 'read_invoice_num' };
    keys.invoice_key_matched = { ...src, key, stored_in_ebs: stored, receipts: ok, match: 'suffix' };
    return [rows, 'TAX-INV-SUFFIX'];
  }
  static _keepInvoiceReceipts(found, owner, cands, keys, subTotal, tol) {
    if (!found.length || !Object.values(owner).some(v => v !== '')) return found;
    const byRcv = {};
    for (const r of found) (byRcv[r.receipt_num] = byRcv[r.receipt_num] || []).push(r);
    const who = (rs) => {
      const heads = new Set();
      for (const r of rs) for (const a of ['shipment_num', 'packing_slip', 'waybill_num']) heads.add(_norm(r[a]));
      const hit = [];
      for (const h of heads) if (h in owner) hit.push(owner[h]);
      if (!hit.length) return '';
      return hit.indexOf('') >= 0 ? '' : sortedStr(hit)[0];
    };
    const tag = {}; for (const [n, rs] of Object.entries(byRcv)) tag[n] = who(rs);
    let keep;
    if (Object.values(tag).indexOf('') >= 0) keep = Object.keys(tag).filter(n => tag[n] === '');
    else {
      let matched = sortedStr([...new Set(Object.values(tag))]);
      if (matched.length > 1 && subTotal !== null) {
        const tot = {};
        for (const k of matched) {
          let s = null;
          for (const [n, t] of Object.entries(tag)) if (t === k) for (const r of byRcv[n]) if (dIsPos(D(r.qty))) s = dAdd(s, D(r.line_amount));
          tot[k] = s === null ? D(0) : s;
        }
        const equal = matched.filter(k => dCmp(dAbs(dSub(tot[k], subTotal)), tol) <= 0);
        if (equal.length === 1) matched = equal;
      }
      if (matched.length > 1) keys.invoice_candidates_ambiguous = matched;
      keep = Object.keys(tag).filter(n => matched.indexOf(tag[n]) >= 0);
      const info = cands.find(c => c.key === matched[0]) || { key: matched[0] };
      keys.invoice_key_matched = { ...info, receipts: sortedStr(keep) };
    }
    const aside = sortedStr(Object.keys(byRcv).filter(n => keep.indexOf(n) < 0));
    if (aside.length) keys.receipts_set_aside = aside;
    const keepSet = new Set(keep);
    return found.filter(r => keepSet.has(r.receipt_num));
  }
  _snapshot(keys, rows, path, variants, at) {
    const cap = this.rowCaps[path || ''] !== undefined ? this.rowCaps[path || ''] : this.rowCap;
    const pos = sortedStr([...new Set(rows.map(r => r.po_number).filter(x => x !== null && x !== undefined && x !== ''))]);
    return {
      queried_at: at || new Date().toISOString().replace(/\.\d+Z$/, 'Z'), lookup_path: path, query_keys: keys,
      rows, row_cap_hit: rows.length >= cap, calls: this.calls, po_numbers: pos,
      matched_on_column: matchedColumn(rows, variants, this.cfg.invoice_match_columns)
    };
  }
  static active(snap) { return snap.rows.filter(r => dIsPos(D(r.qty))); }
  static receiptNums(snap) { return sortedStr([...new Set(OracleSession.active(snap).map(r => r.receipt_num))]); }
  static orgId(snap) { const a = OracleSession.active(snap); return a.length ? a[0].org_id : null; }
    // contracts.py:301 - json.dumps(default=str, sort_keys=True), i.e. ensure_ascii=True: see canonicalJsonAscii
  static fingerprint(snap) { return 'sha256:' + sha256hex(canonicalJsonAscii(snap.rows.map(rowPayload))); }
}
