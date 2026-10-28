// =================================================================================================
// n8n node "21 Validate (port)" — the logic, kept OUTSIDE n8n (Option A).
// The n8n Code node only loads port_config.json, fetches this file, evaluates it and calls run(ctx).
// Everything it needs arrives through ctx: no n8n sandbox globals are used inside this file.
//
// ctx = { PORT, helpers, cfg, n12, n05, n08, n10, binary }
// =================================================================================================

async function run(ctx) {
  const PORT = ctx.PORT, helpers = ctx.helpers;

  // ---- 1. the ported engine + the active Standard v6.6 --------------------------------------
  const mod = { exports: {} };
  new Function('module', 'exports', await helpers.httpRequest({ url: PORT.bundle, timeout: 60000 }))(mod, mod.exports);
  const P = mod.exports;
  const standard = await helpers.httpRequest({ url: PORT.standard, timeout: 30000 });

  // ---- 2. aiva.extraction/2.0 : this flow's OCR, or the parity fixture ---------------------
  // dms_doc_id: the Paperless document id is the DMS doc id (doc 23 == paperless id 23).
  // node 00's cfg.doc_id is only a manual-test fallback (it resolves to null on a manual trigger).
  const pl = ((ctx.paperless || {}).results || [{}])[0] || {};          // Paperless node -> { results: [ {id, versions:[{checksum}]} ] }
  let extraction, docId = String(pl.id || ctx.cfg.doc_id || 0);
  const fileSha256 = ((pl.versions || [{}])[0] || {}).checksum
    ? 'sha256:' + pl.versions[0].checksum : 'sha256:unknown';            // paperless stores the file's sha256
  if (PORT.fixtureCase) {
    const fx = await helpers.httpRequest({ url: PORT.fixture, timeout: 30000 });
    extraction = fx.extraction;
    docId = String(extraction.dms_doc_id);
  } else {
    extraction = P.buildExtraction({
      n05: ctx.n05, n08: ctx.n08, n10: ctx.n10, cfg: ctx.cfg,
      docId: docId, fileSha256: fileSha256, packageId: 'PKG-' + docId
    });
  }

  // ---- 3. Oracle through the ORDS MCP endpoint (<= 7 queries, budget owned by the port) ---
  const sqlRun = async (sql) => {
    const r = await helpers.httpRequest({
      method: 'POST', url: PORT.oracleUrl, timeout: Number(PORT.timeoutMs || 120000), returnFullResponse: true,
      headers: {
        'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
        Authorization: 'Bearer ' + PORT.oracleToken
      },
      body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'sql_run', arguments: { database: 'default', sql: sql } } }
    });
    if (r.statusCode >= 400) throw new Error('ORDS HTTP ' + r.statusCode + ': ' + String(r.body).slice(0, 300));
    return P.mcpTextOf(typeof r.body === 'string' ? r.body : JSON.stringify(r.body));   // -> CSV text
  };

  // ---- 4. validate + assemble. The payload hash is computed HERE (see STATUS.md: Decimal is  -
  //        BigInt-backed and the payload carries typed geometry, so it must not cross a node     -
  //        boundary through JSON), and it is the port's own sha256 -> no n8n Crypto node.        -
  const stamp = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const out = await P.runInFlow(extraction, {
    standard: standard, sqlRun: sqlRun,
    request: { validation_id: 'VAL-' + stamp, correlation_id: 'corr-' + stamp, document_revision: 1, validation_round: 1 },
    models: PORT.fixtureCase ? (PORT.fixtureModels === undefined ? {} : PORT.fixtureModels)   // parity: same as the harness
            : { ocr: String(ctx.cfg.model), line_matcher: null, qty_judge: null }
  });
  const payload = out.payload;

  return [{
    json: {
      ok: true, doc_id: docId,
      port: {
        mode: PORT.fixtureCase ? 'fixture:' + PORT.fixtureCase : 'live',
        elapsed_ms: out.elapsed_ms,
        oracle_queries: ((payload.metrics || {}).sql_audit || []).length,
        recommendation: payload.recommendation.value,
        halted_by: payload.recommendation.halted_by,
        payload_sha256: payload.integrity.payload_sha256
      },
      steps: ctx.n12.steps,
      result: payload,
      images: ctx.n12.images
    },
    binary: ctx.binary
  }];
}

module.exports = { run: run };
