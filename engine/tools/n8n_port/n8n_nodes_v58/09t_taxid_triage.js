// 09t Tax-id triage — R6-13, the decision half. Engine: single_pass.py::extract, inside the per-page loop —
//   problem = tax_id_problem(ans) if (self.taxid_retry_dpi and not taxid_spent) else None
// so the retry is (a) switched off when PERCEPTION_TAXID_RETRY_DPI=0, (b) worth ONE page per document, and
// (c) spent on the FIRST page (in selection order) whose answer fails the tax-id rule.
//
// Why this is a node and not an IF expression: "first page in order that fails" is a rule over the whole
// batch, and n8n's IF node evaluates per item — an IF here would fire the re-read on EVERY page that fails,
// spending a call the engine never spends and re-reading pages the engine leaves alone.
//
// tax_id_problem (single_pass.py:472) is re-implemented here from the same three failure modes the engine
// measures: not 13 digits; 13 digits whose Thai check digit is wrong; supplier id simply absent. An absent
// CUSTOMER id is deliberately not a trigger. lib_answer_decode.js carries the same taxId() rule the port's
// Oracle/normalise layer already uses, so the check cannot drift from the engine's tax_id().
const cfg = $('00 CONFIG (single point)').first().json;
const reqs = $('08 Build extract request').all().map((r) => r.json);
// Node 09 is an HTTP request, and n8n's HTTP node REPLACES the item — its output carries the response body
// and no binaries at all (exec 467/468: node 09 items show binary []). Anything the downstream nodes still
// need has to be picked back up here, from the nodes that own it, by index, with a count guard:
//   page / pre  — the rotated 150 DPI frame and its unrotated twin (node 07), needed for annotation + Portal
//   pdf         — the document itself, needed if the tax-id branch re-renders at 300 DPI (node 09r)
const frames = $('07 Rotate invoice page upright').all();
if (frames.length !== reqs.length) {
  throw new Error('09t: ' + frames.length + ' rotated frames for ' + reqs.length
    + ' extract requests — cannot hand frames to the wrong page');
}
const docBin = (() => {
  try {
    const b = ($('Get a document').first().binary || {});
    const pdf = b.pdf || b.data || null;
    if (!pdf) throw new Error('no pdf binary on the document item (have: ' + Object.keys(b) + ')');
    return pdf;
  } catch (e) {
    // Only fatal if the retry would actually be needed: a failed lookup must not break a run that never re-reads.
    return null;
  }
})();
const answers = $input.all();
if (answers.length !== reqs.length) {
  throw new Error('09t: ' + answers.length + ' extract answers for ' + reqs.length
    + ' requests — cannot decide a re-read over a batch it cannot identify');
}
const decode = (function () {                                  // strict-then-salvage, same as nodes 05/10
  const FENCE = /^\s*```(?:json)?\s*|\s*```\s*$/gi, THINK = /<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi;
  const strip = (t) => String(t == null ? '' : t).replace(THINK, '').replace(FENCE, '').trim();
  const fix = (s) => s.replace(/,(\s*[}\]])/g, '$1');
  function strict(text) {
    const s = strip(text), start = s.indexOf('{');
    if (start < 0) throw new Error('no JSON object');
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true; else if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) return JSON.parse(fix(s.slice(start, i + 1))); }
    }
    throw new Error('truncated JSON object');
  }
  return function (text) { try { return strict(text); } catch (e) { return null; } };
})();

function thaiToArabic(s) {                                // domain.normalize.thai_to_arabic
  // The codepoints come from the ENGINE's table, not from what the Thai comment above suggests:
  // normalize.py:11 builds THAI_DIGITS from U+0E50-U+0E59 (Tai Tham), while ordinary Thai digits live
  // at U+0E60-U+0E69 — so the engine converts one set and not the other. Copying that is deliberate:
  // 'fixing' it here would make the flow accept a reading the engine rejects (divergence, not parity).
  // harness/test_taxid_parity.py asserts the same asymmetry on both sides.
  return String(s == null ? '' : s).replace(/[๐-๙]/g, (c) => String(c.charCodeAt(0) - 0x0E50));
}
function taxId(raw) {                                     // domain.normalize.tax_id; throws like Invalid
  let d = thaiToArabic(raw).replace(/\D/g, '');
  if (d.length === 12 && d.indexOf('0155') === 0) {       // the 0155xxxxxxxxx shorthand for 011xxxxxxxxxx
    const cand = '011' + d.slice(2);
    const cn = cand.split('').map(Number);
    let s2 = 0;
    for (let i = 0; i < 12; i++) s2 += cn[i] * (13 - i);
    if ((11 - (s2 % 11)) % 10 === cn[12]) d = cand;
  }
  if (d.length !== 13) throw new Error('TAX_ID_NOT_13_DIGITS');
  const n = d.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += n[i] * (13 - i);
  if ((11 - (sum % 11)) % 10 !== n[12]) throw new Error('TAX_ID_CHECKSUM');
  return d;
}
function taxIdProblem(answer) {                            // perception/single_pass.py::tax_id_problem
  const fields = (answer || {}).fields || {};
  const rawOf = (c) => {
    let v = c && typeof c === 'object' ? (c.raw !== undefined ? c.raw : (c.text !== undefined ? c.text : c.value)) : c;
    if (v == null) return null;
    const t = String(v).trim();
    if (!t || ['null', 'none', '-', 'n/a'].indexOf(t.toLowerCase()) >= 0) return null;
    return t;
  };
  for (const name of ['supplier_tax_id', 'customer_tax_id']) {
    const raw = rawOf(fields[name]);
    if (raw === null || raw === '') {
      if (name === 'supplier_tax_id') return 'TAX_ID_MISSING';    // printed on nearly every Thai tax invoice
      continue;                                                   // an absent customer id is not a trigger
    }
    try { taxId(raw); } catch (e) { return String(e.message); }
  }
  return null;
}
const retryDpi = Number(cfg.taxid_retry_dpi === undefined || cfg.taxid_retry_dpi === '' ? 300 : cfg.taxid_retry_dpi);
let spent = false;                                        // engine: taxid_spent, one re-read per document
const out = [];
for (let i = 0; i < reqs.length; i++) {
  const dim = reqs[i];
  const msg = ((((answers[i].json || {}).choices) || [])[0] || {}).message || {};
  const text = msg.content || '{}';
  const ans = decode(text);
  const problem = (retryDpi > 0 && !spent) ? taxIdProblem(ans) : null;
  const fire = !!problem && ans !== null;
  if (fire) spent = true;
  out.push({
    json: {
      page_no: Number(dim.page_no), answer_index: i,
      taxid_retry_page: fire ? Number(dim.page_no) : null,   // exactly one item carries a page number
      taxid_reason: problem, taxid_retry_dpi: retryDpi,
      answer_text: text,                                      // 09d needs it when the re-read is rejected
      orig_w: dim.orig_w, orig_h: dim.orig_h, img_w: dim.img_w, img_h: dim.img_h,
      rotate_degrees: Number(dim.rotate_degrees || 0), render_dpi: Number(dim.render_dpi || 150),
      max_tokens_used: Number(dim.max_tokens_used || cfg.max_tokens || 8000),
      model: String(dim.model || cfg.model || ''),
    },
    binary: Object.assign({}, (frames[i] || {}).binary, docBin ? { pdf: docBin } : {}),
  });
}
return out;
