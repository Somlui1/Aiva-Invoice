// =================================================================================================
// n8n node "21 Validate (port)" — runs the JS port of system_a inside the flow.
// Injected into workflow soWzNNLrZ1c4Absf as a Code node (jsMode: runOnceForAllItems).
// Keep this file as the source of truth for that node's jsCode; regenerate the node from it.
// =================================================================================================
const PORT = {
  bundle: 'http://10.10.20.87:8799/dist/bundle.js',      // the ported engine (build.mjs output)
  standard: 'http://10.10.20.87:8799/standard.json',    // active Standard v6.6 (policy + prompts)
  fixture: 'http://10.10.20.87:8799/fixtures/extraction.json',
  oracleUrl: 'http://ahebs.aapico.com:8080/mcp',
  oracleToken: 'PASTE_ORACLE_MCP_TOKEN',
  fixtureCase: '',      // 'exec357' = replay the pinned fixture (proves flow == engine); '' = live OCR
  timeoutMs: 120000
};

const cfg = $('00 CONFIG (single point)').first().json;
const n12 = $input.first().json;

// ---- 1. load the port + the active Standard -------------------------------------------------
const mod = { exports: {} };
new Function('module', 'exports', await this.helpers.httpRequest({ url: PORT.bundle, timeout: 60000 }))(mod, mod.exports);
const P = mod.exports;
const standard = await this.helpers.httpRequest({ url: PORT.standard, timeout: 30000 });

// ---- 2. aiva.extraction/2.0 : either the live OCR of this flow, or the parity fixture -------
let extraction, docId = String(cfg.doc_id);
if (PORT.fixtureCase) {
  const fx = await this.helpers.httpRequest({ url: PORT.fixture, timeout: 30000 });
  extraction = fx.extraction;
  docId = String(extraction.dms_doc_id);
} else {
  extraction = P.buildExtraction({
    n05: $('05 Parse classify pick invoice pages').first().json,
    n08: $('08 Build extract request').first().json,
    n10: $('10 Bbox math pixels + sanitize').first().json,
    cfg: cfg, docId: docId,
    fileSha256: 'sha256:unknown',                       // node 01 does not hash the PDF yet
    packageId: 'PKG-' + String(cfg.doc_id)
  });
}

// ---- 3. Oracle through the ORDS MCP endpoint (<= 7 queries, all inside the port) ------------
const sqlRun = async (sql) => {
  const r = await this.helpers.httpRequest({
    method: 'POST', url: PORT.oracleUrl, timeout: PORT.timeoutMs, returnFullResponse: true,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
               Authorization: 'Bearer ' + PORT.oracleToken },
    body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'sql_run', arguments: { database: 'default', sql: sql } } }
  });
  if (r.statusCode >= 400) throw new Error('ORDS HTTP ' + r.statusCode + ': ' + String(r.body).slice(0, 300));
  return P.mcpTextOf(typeof r.body === 'string' ? r.body : JSON.stringify(r.body));   // -> CSV text
};

// ---- 4. validate + assemble (hash computed here, see STATUS.md) -----------------------------
const stamp = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const out = await P.runInFlow(extraction, {
  standard: standard, sqlRun: sqlRun,
  request: { validation_id: 'VAL-' + stamp, correlation_id: 'corr-' + stamp, document_revision: 1, validation_round: 1 },
  models: { ocr: String(cfg.model), line_matcher: null, qty_judge: null }
});
const payload = out.payload;

return [{
  json: {
    ok: true, doc_id: docId,
    port: { mode: PORT.fixtureCase ? 'fixture:' + PORT.fixtureCase : 'live', elapsed_ms: out.elapsed_ms,
            oracle_queries: ((payload.metrics || {}).sql_audit || []).length,
            recommendation: payload.recommendation.value, halted_by: payload.recommendation.halted_by,
            payload_sha256: payload.integrity.payload_sha256 },
    steps: n12.steps,
    result: payload,
    images: n12.images
  },
  binary: $input.first().binary
}];
