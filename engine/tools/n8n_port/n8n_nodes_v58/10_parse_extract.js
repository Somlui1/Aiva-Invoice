// 10 Bbox math pixels + sanitize  —  repo copy ของ jsCode ที่รันบน canvas (n8n_nodes_v58 = รุ่น v5.8)
// port ของ: perception/single_pass.py::_box/validate_line_bbox + coords.py::xyxy_px (ฝั่ง flow วัด pixel เอง)
// แก้ใน v5.8: parse คำตอบ extract ด้วย ANSWER-DECODE ของ engine (strict -> salvage) แทน slice({..})+JSON.parse
//   คำตอบที่ถูกตัดกลาง (finish_reason=length) engine ยังเก็บ member ที่ครบไว้ — ของเดิมทิ้งทั้งหน้า = E01 ฟรี ๆ
//   harness/test_answer_decode.py เทียบ decoding กับ python บนคำตอบจริงที่บันทึกไว้ + กัน snippet เลื่อน
// >>> ANSWER-DECODE (inlined from lib_answer_decode.js — guarded by test_answer_decode.py) (verbatim copy of adapters/llm/litellm_client.py::extract_json_object +
// >>> salvage_json_object, the PURE half of LiteLLMClient.chat_json's decode chain).
// A n8n Code node has no require()/import, so this block is inlined into every node that parses a VLM
// answer (05 classify, 10 extract).  harness/test_answer_decode.py checks byte-for-byte that the copy in
// each node file still equals this file, and that decoding the recorded real answers gives the same
// object (and the same salvaged flag) as python.
//
// Why the flow needs it at all: the engine accepts an answer through extract_json_object first and only
// then salvage_json_object.  The flow used to do `text.slice(indexOf('{'), lastIndexOf('}')+1)` +
// JSON.parse, which throws on any answer whose closing brace never arrived (finish_reason=length).  The
// engine keeps every complete member of that same answer.  Losing it is what turned pages_complete false
// and produced E01 on readable invoices (measured 21 of 99 baseline documents).
//
// What the flow still cannot do: the two network recoveries in front of the salvage (REPAIR re-ask and
// enable_thinking=false re-ask).  They are reported as 'decode_recoveries_unavailable' in the node output.
const ANSWER_DECODE_VERSION = 'litellm_client.decode/1.0';
const SALVAGE_CUTS = 60;
const _FENCE = /^\s*```(?:json)?\s*|\s*```\s*$/gi;
const _THINK = /<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi;

function _stripFence(text) {
  return String(text === null || text === undefined ? '' : text).replace(_THINK, '').replace(_FENCE, '').trim();
}

// python: json.loads(re.sub(r",\s*([}\]])", r"\1", s[start:i + 1]))
function _fixTrailingCommas(s) { return s.replace(/,(\s*[}\]])/g, '$1'); }

function extractJsonObject(text) {
  if (text !== null && typeof text === 'object' && !Array.isArray(text)) return text;
  const s = _stripFence(text);
  const start = s.indexOf('{');
  if (start < 0) throw new Error('no JSON object');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; } else if (ch === '\\') { esc = true; } else if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; } else if (ch === '{') { depth += 1; } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return JSON.parse(_fixTrailingCommas(s.slice(start, i + 1)));
    }
  }
  throw new Error('truncated JSON object');
}

function salvageJsonObject(text) {
  const s = _stripFence(text);
  const start = s.indexOf('{');
  if (start < 0) return null;
  const fragment = s.slice(start);
  let cut = fragment.length;
  const closers = { '{': '}', '[': ']' };
  for (let attempt = 0; attempt < SALVAGE_CUTS; attempt++) {
    let pos = -1;
    for (let i = Math.min(cut, fragment.length) - 1; i >= 0; i--) { if (fragment[i] === '}') { pos = i; break; } }
    if (pos < 0) return null;
    const cand = fragment.slice(0, pos + 1);
    const stack = [];
    let inStr = false, esc = false;
    for (const ch of cand) {
      if (inStr) {
        if (esc) { esc = false; } else if (ch === '\\') { esc = true; } else if (ch === '"') { inStr = false; }
      } else if (ch === '"') { inStr = true; } else if (closers[ch]) { stack.push(closers[ch]); }
      else if (ch === '}' || ch === ']') { if (stack.length && stack[stack.length - 1] === ch) { stack.pop(); } }
    }
    if (!inStr) {
      // python: cand = re.sub(r",\s*$", "", cand.rstrip().rstrip(",")); json.loads(cand + "".join(reversed(stack)))
      const closed = cand.replace(/\s+$/, '').replace(/,+$/, '').replace(/,\s*$/, '') + stack.slice().reverse().join('');
      try { return JSON.parse(_fixTrailingCommas(closed)); } catch (e) { /* try the next cut */ }
    }
    cut = pos;
  }
  return null;
}

// The pair the engine runs when it is not allowed to spend another request: strict first, salvage second.
function decodeAnswer(text) {
  try { return { obj: extractJsonObject(text), salvaged: false, error: null }; }
  catch (e) {
    const first = String(e && e.message ? e.message : e);
    const got = salvageJsonObject(text);
    if (got) return { obj: got, salvaged: true, error: first };
    return { obj: {}, salvaged: false, error: first + ' | salvage: nothing recoverable' };
  }
}
const cfg = $('00 CONFIG (single point)').first().json;
// v5.9: one output item PER selected page. Run Once for All Items + an explicit loop, because "Run Once for
// Each Item" forbids every .first() (and node 00's config is only reachable through one).
// Node 09's response REPLACES the item json, so the frame metadata has to come back from node 08. The pairing
// that survives an HTTP node is ORDER, so zip by index and refuse loudly when the counts disagree: a page
// whose answer vanished must stop the run, never be quietly dropped (that is how a line goes missing).
// v5.9 R6-13: the answer text and its frame now arrive together from node 09z, because a tax-id re-read
// replaces BOTH (engine single_pass.py:1056-1062 swaps `ans` *and* `infos[p]`). Node 08 is still the page
// census: if 09z hands us a different number of pages than we asked the model to read, something was lost.
const asked = $('08 Build extract request').all();
const itemsIn = $input.all();
if (asked.length !== itemsIn.length) {
  throw new Error('10: ' + itemsIn.length + ' reads arrived for ' + asked.length
    + ' extract requests — a lost answer is a lost page, and a lost page must never pass');
}
const outAll = [];
const SLOTS = 40;                       // จำนวน ops จริงที่มีใน node 11 (Draw bbox overlay)
for (let i = 0; i < itemsIn.length; i++) {
const dim = itemsIn[i].json || {};
const W = Number(dim.img_w), H = Number(dim.img_h), page = Number(dim.page_no);
const rawAnswerText = dim.answer_text || '{}';
const dec = decodeAnswer(rawAnswerText);
const ans = dec.obj;
const parseError = dec.error;                        // เหมือนเดิม: มีค่าเมื่อ strict FAIL
// engine ตั้ง page_errors[p] = 'TRUNCATED_JSON_SALVAGED' เมื่อต้อง salvage — ส่งต่อนับใน extraction
const answerSalvaged = dec.salvaged;
function rawv(c) { let v; if (c && typeof c === 'object') { v = c.raw !== undefined ? c.raw : (c.text !== undefined ? c.text : c.value); } else { v = c; } if (v == null) { return null; } const t = String(v).trim(); if (!t || ['null', 'none', '-', 'n/a'].indexOf(t.toLowerCase()) >= 0) { return null; } return t; }
function boxv(c) { const b = c && typeof c === 'object' ? c.bbox_2d : null; if (!Array.isArray(b) || b.length !== 4) { return null; } const n = b.map(function (v) { return Number(v); }); return n.some(function (v) { return isNaN(v); }) ? null : n; }
// GraphicsMagick ไม่มีฟอนต์ไทย -> ป้ายบนภาพเอาแต่ ASCII (ค่าไทยเต็มๆ ยังอยู่ครบใน result.json ทุกฟิลด์)
function asciiOnly(s) { let out = ''; const t = String(s == null ? '' : s); for (const ch of t) { const code = ch.charCodeAt(0); if (code >= 32 && code <= 126) { out += ch; } } return out.replace(/\s+/g, ' ').trim(); }
function pxRaw(b) {
  const k = Math.max.apply(null, b) <= 1.0 ? 1.0 : 1000.0;
  let x0 = b[0] / k * W, y0 = b[1] / k * H, x1 = b[2] / k * W, y1 = b[3] / k * H;
  if (x1 < x0) { const t = x0; x0 = x1; x1 = t; }
  if (y1 < y0) { const t2 = y0; y0 = y1; y1 = t2; }
  x0 = Math.max(0, Math.min(W, x0)); x1 = Math.max(0, Math.min(W, x1)); y0 = Math.max(0, Math.min(H, y0)); y1 = Math.max(0, Math.min(H, y1));
  if (!(x1 > x0 && y1 > y0)) { return null; }
  return [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)];
}
// ---- R4-9 ink snap, run by the ENGINE'S OWN code through the helper -----------------------------------
// engine `_px` (single_pass.py:372-385) corrects a field/cell box against the page's own ink before anything
// else sees that box. A Code node has no image library, so the correction runs in snap_service/snap_server.py,
// which imports coords.snap_box_to_ink / ink_mask / strip_rules and SinglePassPipeline._render — same
// functions, same render, same mask, same knob pair. The baseline stays the engine's (INK_SNAP_DEFAULT="move");
// turning the engine off to make parity pass is forbidden, and so is quietly falling back to "off" here.
// The engine snaps exactly what `region(..., snap=...)` receives — header fields and line cells
// (single_pass.py:516/519, plus the `contains` cells at 408). Regions, occurrences, handwriting, the row box
// itself and folded/excluded rows are NOT snapped, so this pre-pass asks for that set and nothing else.
const F = ['invoice_num', 'invoice_date', 'po_number', 'supplier_name', 'supplier_tax_id', 'customer_name',
           'customer_tax_id', 'customer_address', 'sub_total', 'vat', 'grand_total', 'currency'];
const snapMap = new Map(); let snapInfo = null;
async function snapPrep() {
  const url = String(cfg.snap_url || '');
  const mode = String(cfg.snap_mode || 'move');
  if (!url || mode === 'off') { snapInfo = null; return; }
  const pend = [], seen = new Set();
  const want = (b) => { const p = pxRaw(b); if (!p) return; const k = p.join(',');
                        if (!seen.has(k)) { seen.add(k); pend.push({ id: k, rect: p }); } };
  F.forEach(function (n) { const c = (ans.fields || {})[n]; const r = rawv(c), b = boxv(c); if (r && b) want(b); });
  (ans.line_items || []).forEach(function (row) {
    ['item_code', 'description', 'qty', 'uom', 'unit_price', 'amount'].forEach(function (k) {
      const r = rawv(row[k]), b = boxv(row[k]); if (r && b) want(b); }); });
  if (!pend.length) { snapInfo = { mode: mode, moved: 0, boxes: 0, map: [], skipped: 'no snap-eligible boxes' }; return; }
  let pdfBuf = null;
  let pdfB64 = '', bodySnap = null;          // declared up-front: the image-mode block below runs first
  try { const src = $('Get a document').first(); pdfBuf = src && src.binary && (src.binary.data || src.binary.pdf); }
  catch (e) {
    throw new Error('10: snap_url is set but "Get a document" is not reachable — the engine masks the lossless '
                    + 'render at the extract DPI, so a snap without the source PDF cannot be trusted');
  }
  // SNAP_IMAGE_FROM_BINARY is the offline-harness path: the recorded scenario has the JPEG the VLM saw, not
  // the lossless render, so the mask is built from those bytes (see snap_service docstring). The live canvas
  // keeps the PDF path, which is the engine's own render path.
  if (cfg.snap_image_from_binary) {
    // mask the frame the boxes actually live in. On the canvas the 150 DPI frame comes from n8n's pdfConvert,
    // which is 1 px shorter than a fitz render at the same DPI (measured exec 477: 1240x1754 vs 1240x1755), so
    // re-rendering with PyMuPDF here would mask a different image than the one the model saw — the frame guard
    // would (correctly) refuse every page. Same rule the engine follows: mask the image the answer came from.
    const pb = (itemsIn[i].binary || {}).page;
    if (!pb) throw new Error('10: snap_image_from_binary is set but this item carries no page frame binary — '
                             + 'masking some pages from the frame and others from a re-render would make one '
                             + 'run two arms, so this stops here');
    pdfB64 = (await helpers.getBinaryDataBuffer(i, 'page')).toString('base64');   // never .data (see below)
    if (!pdfB64) throw new Error('10: getBinaryDataBuffer(i,"page") returned no bytes for the snap mask');
    bodySnap = { image_b64: pdfB64, page_no: page, mode: mode, boxes: pend };
  }
  if (!pdfBuf && !pdfB64) throw new Error('10: snap_url is set but no source PDF/page binary is reachable (no mask, no snap)');
  // The PDF must come through helpers.getBinaryDataBuffer, NOT by reading binary.data.
  // Measured on the canvas (exec 475 + harness/snap_recorder.py): a Code node's binary object in this n8n is
  // filesystem-backed, so `.data` is the string "filesystem-v2" — the helper then masked nothing and answered
  // 500. getBinaryDataBuffer resolves the stored file into real bytes; node 09t already carries the source
  // PDF on every read item under 'pdf', so that is the primary path. A string that is too short to be a PDF
  // is refused loudly rather than sent.
  const ownPdf = (itemsIn[i].binary || {}).pdf;
  if (ownPdf) pdfB64 = (await helpers.getBinaryDataBuffer(i, 'pdf')).toString('base64');
  else if (typeof pdfBuf === 'string') pdfB64 = pdfBuf;
  else if (pdfBuf && typeof pdfBuf.data === 'string' && pdfBuf.data.length > 4096) pdfB64 = pdfBuf.data;
  else if (typeof Buffer !== 'undefined' && pdfBuf && Buffer.isBuffer(pdfBuf)) pdfB64 = pdfBuf.toString('base64');
  if (!pdfB64) throw new Error('10: could not resolve the source PDF bytes for the snap helper');
  if (pdfB64.length < 4096) throw new Error('10: the "PDF" handed to the snap helper is ' + pdfB64.length
          + ' base64 chars ("' + pdfB64.slice(0, 24) + '…") — that is a binary POINTER, not the file. '
          + 'Use helpers.getBinaryDataBuffer; snapping against a non-PDF body would silently skip the ink.');
  let j = null;
  try {
    const res = await helpers.httpRequest({
      method: 'POST', url: url, timeout: Number(cfg.snap_timeout_ms || 20000),
      body: bodySnap || { pdf_b64: pdfB64, page_no: page,
              dpi: Number(dim.render_dpi || cfg.dpi_extract || 150),
              rotate_degrees: Number(dim.rotate_degrees || 0), mode: mode, boxes: pend },
      returnFullResponse: true, json: true, headers: { 'Content-Type': 'application/json' } });
    j = (res && typeof res.body === 'object') ? res.body : JSON.parse(String((res && res.body) || '{}'));
  } catch (e) {
    // engine has no try/except around the snap, so neither has the flow: a correction that cannot run stops
    // the run. Continuing with uncorrected boxes would ship the silent snap=off arm as if it were the engine.
    throw new Error('10: ink-snap helper failed on page ' + page + ' — ' + ((e && e.message) || e)
                    + ' (refusing to continue with uncorrected boxes)');
  }
  if (!j || !j.ok) throw new Error('10: ink-snap helper refused page ' + page + ': ' + JSON.stringify(j).slice(0, 300));
  const fr = j.frame || {};
  if (Number(fr.rot_w) !== W || Number(fr.rot_h) !== H) {
    throw new Error('10: ink-snap frame mismatch on page ' + page + ': helper rendered ' + fr.rot_w + 'x'
                    + fr.rot_h + ' but this answer lives in a ' + W + 'x' + H + ' frame — snapping into the '
                    + 'wrong frame is worse than not snapping (a 300 DPI re-read frame must not meet a 150 DPI mask)');
  }
  const list = [];
  (j.boxes || []).forEach(function (b) {
    if (b.note !== 'unchanged') { snapMap.set(b.in.join(','), b.out); list.push([b.in, b.out, b.note]); }
  });
  snapInfo = { mode: j.mode, moved: j.moved, boxes: (j.boxes || []).length, map: list };
}
function px(b) {                                  // engine _px(b, snap=True): raw box, then the ink correction
  const p = pxRaw(b);
  if (!p) return null;
  const fixed = snapMap.get(p.join(','));
  return fixed ? fixed.slice() : p;
}
const elements = []; const boxes = []; const dropped = [];
function push(kind, label, val, b, color) {
  const p = px(b);
  if (!p) { if (Array.isArray(b) && b.length === 4) { dropped.push({ label: label, bbox_2d: b, reason: 'degenerate_or_off_canvas' }); } return null; }
  elements.push({ element_id: 'E' + (elements.length + 1), element_type: kind, page_no: page, field_name: kind === 'field' ? label : null, raw_value: val == null ? null : String(val), bbox: [p[0] / W, p[1] / H, (p[2] - p[0]) / W, (p[3] - p[1]) / H], pixel_bbox: p, source: 'ocr', notes: [] });
  if (kind !== 'cell' && kind !== 'handwritten') { boxes.push({ kind: kind, label: label, val: val, color: color, x0: p[0], y0: p[1], x1: p[2], y1: p[3] }); }
  return p;
}
await snapPrep();                     // before any box is used (engine corrects inside _px)
const fields = {};
F.forEach(function (n) { const cell = (ans.fields || {})[n]; const r = rawv(cell), b = boxv(cell); fields[n] = { raw: r, bbox_2d: b, page_no: b ? page : null }; if (r && b) { push('field', n, r, b, cfg.colors.field); } else if (r) { dropped.push({ label: n, reason: 'value_without_bbox' }); } });
const occ = {};
Object.keys(ans.occurrences || {}).forEach(function (k) { occ[k] = (ans.occurrences[k] || []).map(function (o) { const r = rawv(o), b = boxv(o); if (r && b) { push('occurrence', k + '@' + ((o && o.label_text) || ''), r, b, cfg.colors.occurrence); } return { raw: r, label_text: (o && o.label_text) || '', bbox_2d: b }; }); });
const lines = [];
(ans.line_items || []).forEach(function (row, i) {
  const no = row.line_no != null ? row.line_no : (i + 1);
  const out = { line_no: no, page_no: page };
  ['item_code', 'description', 'qty', 'uom', 'unit_price', 'amount'].forEach(function (k) { const cell = row[k]; const r = rawv(cell), b = boxv(cell); out[k] = { raw: r, bbox_2d: b }; if (r && b) { push('cell', 'line_' + no + '.' + k, r, b, cfg.colors.line); } });
  const lb = boxv({ bbox_2d: row.line_bbox });
  let valid = false;
  if (lb) { const p = px(lb); if (p) { const w = p[2] - p[0], h = p[3] - p[1]; valid = h > 0 && (w / h) >= 1.5 && (w / W) >= 0.45 && (h / H) <= 0.25; } }
  if (lb && valid) { push('line', 'line_' + no, null, lb, cfg.colors.table); } else if (lb) { dropped.push({ label: 'line_' + no, bbox_2d: lb, reason: 'line_bbox_not_a_horizontal_row' }); }
  out.line_bbox = lb; out.line_bbox_valid = valid;
  lines.push(out);
});
const KIND = { table: 'table', stamp: 'stamp', signature: 'signature_box' };
const regions = (ans.regions || []).map(function (r) { const kind = KIND[(r && r.type) || 'other'] || 'other'; const b = boxv(r); if (b) { push('region', ((r && r.label) || (r && r.type) || 'region'), r && r.present, b, cfg.colors[kind] || cfg.colors.other); } return { kind: kind, label: (r && r.label) || null, present: (r && r.present) || null, bbox_2d: b }; });
const hw = (ans.handwritten_refs || []).map(function (h) { const r = rawv(h), b = boxv(h); if (r && b) { push('handwritten', 'handwritten_ref', r, b, cfg.colors.other); } return { raw: r, label_text: (h && h.label_text) || '', bbox_2d: b }; });
const cap = Math.min(cfg.max_boxes || SLOTS, SLOTS);
const drawn = boxes.slice(0, cap);
const overlay = drawn.map(function (b) {
  const a = asciiOnly(b.val);
  const lab = (a ? (b.label + ':' + a) : b.label).slice(0, cfg.label_max_chars);
  return { color: b.color, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, label: lab || ' ', tx: b.x0 + 2, ty: Math.max(0, b.y0 - 13) };
});
while (overlay.length < SLOTS) { overlay.push({ color: '#ffffff', x0: W + 10, y0: H + 10, x1: W + 11, y1: H + 11, label: ' ', tx: W + 10, ty: H + 10 }); }
const vlm = itemsIn[i].json || {};                              // node 09's response: usage + finish_reason
const usage = vlm.usage || {};
// engine: single_pass.py::extract records one `calls` entry per VLM call, and build_extraction puts that
// list into extra["calls"], which the assembler writes VERBATIM into the payload -> it is hashed contract.
const callRec = { kind: 'extract', page: page, model: String(dim.model || cfg.model || ''), ok: !parseError,
                  ms: null, salvaged: answerSalvaged,
                  usage: { completion_tokens: usage.completion_tokens === undefined ? null : usage.completion_tokens,
                           prompt_tokens: usage.prompt_tokens === undefined ? null : usage.prompt_tokens,
                           total_tokens: usage.total_tokens === undefined ? null : usage.total_tokens } };
const read = { page_no: page, answer: ans, answer_parse_error: parseError, answer_salvaged: answerSalvaged,
               snap: snapInfo,               // {mode, moved, boxes, map} — carried to node 21 via node 12
               orig_w: Number(dim.orig_w || dim.img_w), orig_h: Number(dim.orig_h || dim.img_h),
               rot_w: W, rot_h: H, rotate_degrees: Number(dim.rotate_degrees || 0),
               render_dpi: Number(dim.render_dpi || cfg.dpi_extract || 150),
               coord: String(dim.coord || cfg.coord || 'norm1000'),
               model: String(dim.model || cfg.model || ''),
               // engine PageAnswer.dropped (single_pass.py:402,419) holds ONLY boxes that were offered but
               // could not be mapped, and it is what the NO_GEOMETRY message quotes (single_pass.py:727).
               // A row box rejected by the row-shape test was mapped fine — it just is not a table row — so
               // it stays out of this list; putting it in changed DMS-129's message text and the payload hash.
               unmapped: (dropped || []).filter((d) => d.reason === 'degenerate_or_off_canvas')
                 .map((d) => d.bbox_2d).filter((b) => Array.isArray(b)),
               taxid_replaced: dim.taxid_replaced === true };
outAll.push({ json: { page_no: page, read: read, call: callRec,
                  elements: elements, overlay: overlay, boxes_candidates: boxes.length,
                  bboxes_drawn: drawn.length, truncated: boxes.length > drawn.length, draw_slots: SLOTS,
                  dropped_boxes: dropped, answer_parse_error: parseError, answer_salvaged: answerSalvaged,
                  decode_version: ANSWER_DECODE_VERSION,
                  taxid_retry: dim.taxid_retry || [], taxid_calls: dim.taxid_calls || [],
                  taxid_rejected_note: dim.taxid_rejected_note || null,
                  label_mode: 'ascii-only (Thai values stay intact in result.json)', cells_in_json_not_drawn: true,
                  img_w: W, img_h: H },
               binary: { page: ((itemsIn[i].binary || {}).page) } });
}
return outAll;
