// 09d Merge tax-id re-read — the engine's accept policy, kept exactly.
//
// Engine (single_pass.py:1056-1067):
//     if ans_hi and tax_id_problem(ans_hi) is None:
//         infos[p] = (hi, hi_rot)          # bbox math, annotation and page geometry follow the frame read
//         image, rot = hi, hi_rot
//         ans, usage, ms, salvaged = ans_hi, usage_hi, ms_hi, salv_hi
//         dpi_used = self.taxid_retry_dpi
//         accepted = True
//     except Exception as exc:  logger.warning(...)          # the FIRST read stays in force
//     taxid_retry.append({"page": p, "reason": problem, "dpi": ..., "accepted": accepted})
//
// So: the whole hi-res answer replaces the first one only when it no longer breaks the rule — a re-read that
// is still wrong, empty, or unparseable loses and the first read stands. The retry is LOGGED either way, so
// "we looked again and it did not help" is visible in the payload (extra.taxid_retry), not lost in a log.
//
// An HTTP failure on node 09c arrives here as an error item (that node runs onError=continueOnFail, which is
// the flow's version of the engine's try/except): keep the first read, accepted=false, reason unchanged.
const cfg = $('00 CONFIG (single point)').first().json;
const req = $('09b Build re-read request').first().json;
const item = $input.first();
const err = item.json && item.json.error;
const decode = (function () {
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
  return function (text) { try { return { obj: strict(text), error: null }; } catch (e) { return { obj: null, error: String(e.message).slice(0, 160) }; }; };
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
const usage = ((item.json || {}).usage) || {};
const msg = ((((item.json || {}).choices) || [])[0] || {}).message || {};
const dec = err ? { obj: null, error: 're-read request failed: ' + String(err.message || err).slice(0, 140) }
                : decode(msg.content || '{}');
const problemAfter = dec.obj === null ? (dec.error || 'unparseable') : taxIdProblem(dec.obj);
const accepted = !err && dec.obj !== null && problemAfter === null;
const callRec = { kind: 'extract', page: Number(req.page_no), model: String(req.model || cfg.model || ''),
                  ok: !err && dec.error === null, ms: null, salvaged: false,
                  usage: { completion_tokens: usage.completion_tokens === undefined ? null : usage.completion_tokens,
                           prompt_tokens: usage.prompt_tokens === undefined ? null : usage.prompt_tokens,
                           total_tokens: usage.total_tokens === undefined ? null : usage.total_tokens } };
return [{
  json: {
    page_no: Number(req.page_no),
    taxid_retry: [{ page: Number(req.page_no), reason: req.taxid_reason,
                    dpi: Number(req.render_dpi || cfg.taxid_retry_dpi || 300), accepted: accepted }],
    taxid_note: accepted ? 'tax id re-read accepted' : ('tax id re-read rejected: ' + String(problemAfter || err || '').slice(0, 140)),
    read: {                                          // the frame + answer node 10 must use if accepted
      page_no: Number(req.page_no), answer_text: (msg.content || '{}'),
      answer_parse_error: dec.error, orig_w: Number(req.orig_w), orig_h: Number(req.orig_h),
      rot_w: Number(req.img_w), rot_h: Number(req.img_h), rotate_degrees: Number(req.rotate_degrees || 0),
      render_dpi: Number(req.render_dpi || 300), coord: String(cfg.coord || 'norm1000'),
      model: String(req.model || cfg.model || ''), unmapped: [],
    },
    taxid_call: callRec,
    replaced: accepted,
  },
  binary: item.binary,                                // the 300 DPI page travels with it (node 12 annotates it)
}];
