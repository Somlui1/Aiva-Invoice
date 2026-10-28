// 12 Aggregate reads — ONE ITEM for node 21, holding EVERY page the flow read, in engine order (v5.9).
//
// Why: the engine reads every page classify selected (single_pass.py:1044 `for p in selection["selected"]`),
// and build_extraction then merges those reads: header fields from the first page that prints them,
// sub_total/vat/grand_total from the LAST one (single_pass.py:590), rows admitted across pages and
// renumbered 1..n over the document, one signature vote per page, pages that repeat another sheet's rows
// dropped (drop_reprint_pages). None of that is possible when only one page ever reaches node 21 — which is
// what the old `$('10 …').first()` did: doc 26 (invoice on pages 1 and 3) reached the rules with page 1
// only, and the totals that live on page 3 were simply absent.
//
// This node also decides the R6-13 tax-id re-read the way the engine decides it, because the choice needs
// all pages at once: `problem = tax_id_problem(ans) if (self.taxid_retry_dpi and not taxid_spent)` inside
// the page loop, i.e. the FIRST page in selection order whose tax id fails the Thai rule, ONE page per
// document, and the second look happens at 300 DPI with the same rotation.
// node 12 is a plain Code node, so the tax-id rule is inlined here (harness/test_taxid_parity.py compares
// it with domain/normalize.py::tax_id + single_pass.py::tax_id_problem on real and broken ids).
const cfg = $('00 CONFIG (single point)').first().json;
// page_errors / adjudication live on 05e when the second look ran (see 06b for the same rule)
const n5 = (() => { try { return $('05e Parse adjudicate + reselect').first().json; } catch (e) { return $('05 Parse classify pick invoice pages').first().json; } })();

const items = $input.all();                                  // one item per page, node 10 output, pairing order
const reads = [], calls = [];
for (const it of items) {
  const j = it.json || {};
  if (j.read && j.read.page_no) reads.push(j.read);
  if (j.call) calls.push(j.call);
}
reads.sort((a, b) => Number(a.page_no) - Number(b.page_no));
if (!reads.length) throw new Error('12: no page read reached the aggregate (node 10 produced nothing)');

// ---------------------------------------------------------------- domain/normalize.py::tax_id + _problem
function taxIdProblem(answer) {                              // single_pass.tax_id_problem, same return strings
  const thai = (s) => String(s).replace(/[\u0D80-\u0DFF\u0E50-\u0E59]/g, (c) => {
    const d = String(c).charCodeAt(0);
    return (d >= 0x0E50 && d <= 0x0E59) ? String(d - 0x0E50) : String(d - 0x0D80);
  });
  const check = (raw) => {
    let d = thai(String(raw)).replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('0155')) {
      const cand = '011' + d.slice(2);
      const n = cand.split('').map((c) => parseInt(c, 10));
      let sum = 0; for (let i = 0; i < 12; i++) sum += n[i] * (13 - i);
      if ((11 - sum % 11) % 10 === n[12]) d = cand;
    }
    if (d.length !== 13) return 'TAX_ID_NOT_13_DIGITS';
    const n = d.split('').map((c) => parseInt(c, 10));
    let sum = 0; for (let i = 0; i < 12; i++) sum += n[i] * (13 - i);
    if ((11 - sum % 11) % 10 !== n[12]) return 'TAX_ID_CHECKSUM';
    return null;
  };
  const rawOf = (c) => {
    let v = (c && typeof c === 'object' && !Array.isArray(c))
      ? (c.raw !== undefined ? c.raw : (c.text !== undefined ? c.text : c.value)) : c;
    if (v === null || v === undefined) return null;
    const t = String(v).trim();
    return (t && ['null', 'none', '-', 'n/a'].indexOf(t.toLowerCase()) < 0) ? t : null;
  };
  const fields = (answer || {}).fields || {};
  for (const name of ['supplier_tax_id', 'customer_tax_id']) {
    const raw = rawOf(fields[name]);
    if (raw === null) { if (name === 'supplier_tax_id') return 'TAX_ID_MISSING'; continue; }
    const why = check(raw);
    if (why) return why;
  }
  return null;
}
const retryDpi = Number((cfg.taxid_retry_dpi === undefined || cfg.taxid_retry_dpi === '') ? 300 : cfg.taxid_retry_dpi);
// Watchdog, not a decision: node 09t already chose. This recomputes the same rule on the finished reads and
// asks one question — did any page ship a tax id that still fails the rule WITHOUT the engine's one second
// look having been spent on it? That is the signature of the retry branch being skipped or mis-wired, and a
// silent miss is exactly what this flow must not do. It reports into node 12's own json (never the payload),
// so it cannot change a verdict; node 21 surfaces it in the run summary. 
// v5.9 R6-13: the retry itself now happens on the canvas (09t -> 09r -> 09rot -> 09b -> 09c -> 09d -> 09z),
// between the model's answer and this node, exactly where the engine does it — inside the read loop, before
// bbox maths — so the aggregate below already contains the re-read's ANSWER and FRAME. What is left here is
// the bookkeeping: the engine's `taxid_retry` log and the extra `calls` entry the re-read produced, both of
// which are hashed contract (extra.taxid_retry / extra.calls).
let taxidRetry = [], taxidCalls = [];
for (const it of items) {
  const j = (it && it.json) || {};
  (j.taxid_retry || []).forEach((r) => { if (!taxidRetry.some((x) => x.page === r.page)) taxidRetry.push(r); });
  (j.taxid_calls || []).forEach((c) => { if (taxidCalls.indexOf(c) < 0) taxidCalls.push(c); });
}
const taxidWatchdog = [];
if (retryDpi > 0) {
  for (const r of reads) {
    const why = taxIdProblem(r.answer);
    const page = Number(r.page_no);
    if (why && !taxidRetry.some((x) => Number(x.page) === page)) {
      taxidWatchdog.push({ page_no: page, reason: why, expected: 'a tax-id re-read at ' + retryDpi + ' DPI never happened' });
    }
  }
}
const taxidNeed = null;   // kept as a key so older node-12 readers see the same shape; the decision moved to 09t
// The re-read's call record goes in the position the engine wrote it: _extract_one appends to `calls` the
// moment the read happens, so the retry sits DIRECTLY AFTER the first read of that page, not at the end of
// the list. extra.calls is copied verbatim into the payload, so its order is hashed contract too.
for (const c of taxidCalls) {
  let at = -1;
  for (let i = calls.length - 1; i >= 0; i--) {
    if (String(calls[i].kind) === 'extract' && Number(calls[i].page) === Number(c.page)) { at = i + 1; break; }
  }
  if (at < 0) calls.push(c); else calls.splice(at, 0, c);
}

const first = items[0];
// The outward binary contract of this node is not mine to change: node 21 forwards `input.binary` verbatim and
// Portal reads `page_original` (+ `annotated` when the parent drew it). The old node 12 renamed the rotated
// page to page_original; this aggregate has to keep doing that for EVERY read page, not just one.
const binaries = {};
for (let i = 0; i < items.length; i++) {
  const b = (items[i] && items[i].binary) || {};
  const key = 'page_original' + (items.length > 1 ? '_' + reads[i].page_no : '');
  if (b.page) binaries[key] = b.page;
}
try { const a = (first.binary || {}).annotated; if (a) binaries.annotated = a; } catch (e) { /* parent draws it */ }
if (binaries.page_original_1 && !binaries.page_original) {
  binaries.page_original = binaries.page_original_1;      // single-page documents keep the old key exactly
  delete binaries.page_original_1;
}
return [{
  json: {
    reads, calls,
    n_reads: reads.length,
    pages_read: reads.map((r) => Number(r.page_no)),
    adjudication: n5.adjudication || [],                     // [] unless the second look fired (R6-6)
    page_errors_in: n5.page_errors || {},                    // classify / adjudicate failures (engine page_errors)
    taxid_need: taxidNeed,
    taxid_retry: taxidRetry,                                 // engine extra["taxid_retry"]: page/reason/dpi/accepted
    taxid_retry_dpi: retryDpi,
    taxid_watchdog: taxidWatchdog,                             // [] when the branch behaved; see node 09t
    classify_usage: (() => { try { return ($('04 VLM step 1 classify pages').first().json.usage) || null; } catch (e) { return null; } })(),
    extract_usage: items.map((it) => ((it.json || {}).call || {}).usage || null),
    classify_call: (() => {
      try {
        const c = $('04 VLM step 1 classify pages').first().json;
        const u = c.usage || {};
        return { kind: 'classify', page: null, model: String(cfg.model || ''), ok: !n5.classify_failed, ms: null,
                 salvaged: !!n5.answer_salvaged,
                 usage: { completion_tokens: u.completion_tokens === undefined ? null : u.completion_tokens,
                          prompt_tokens: u.prompt_tokens === undefined ? null : u.prompt_tokens,
                          total_tokens: u.total_tokens === undefined ? null : u.total_tokens } };
      } catch (e) { return null; }
    })(),
    timings: { render_classify_ms: null, classify_ms: null, extract_ms: null, total_ms: null },  // engine numbers the flow cannot know
    images: {                                                            // what node 21 / the parent's draw step needs
      invoice_page: reads.length ? Number(reads[0].page_no) : null,
      pages: reads.map((r) => Number(r.page_no)),
      // node 10 reports `overlay` next to `read`, not inside it - take it from the item, or every row list
      // comes back empty and the draw step silently draws nothing.
      overlay: ((items[0] || {}).json || {}).overlay || [],              // page 1 rows, the historical shape
      overlays: items.map((it, i) => ({ page_no: Number(reads[i].page_no), overlay: ((it.json || {}).overlay) || [],
                                        img_w: (it.json || {}).img_w, img_h: (it.json || {}).img_h })),
      img_w: reads.length ? reads[0].img_w : null, img_h: reads.length ? reads[0].img_h : null,
      original_binary_key: 'page_original', annotated_binary_key: 'annotated',
      original_keys: Object.keys(binaries).filter((k) => k.indexOf('page_original') === 0),
    },
  },
  binary: Object.keys(binaries).length ? binaries : undefined,
}];
