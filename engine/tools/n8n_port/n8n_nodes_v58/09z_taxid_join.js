// 09z Assemble extract reads — the join point after the optional tax-id re-read branch.
//
// Two branches can arrive here: the pages whose first read stands (09i false) and, at most once per document,
// the page that was re-read at 300 DPI (09d). Downstream, node 10 wants ONE item per selected page, in the
// same order the pages were sent, carrying the answer text AND the frame that answer belongs to. Merging here
// keeps that join in one visible place instead of leaving node 10 to guess which branch each item came from.
//
// The frame matters as much as the text: engine single_pass.py:1057 replaces `infos[p]` with the hi-res pair,
// so the re-read's box maths, annotation and page geometry all use the 300 DPI pixels. Taking the answer text
// while keeping the 150 DPI dims would scale hi-res boxes onto low-res pixels.
const tri = $('09t Tax-id triage').all();
const cfg = $('00 CONFIG (single point)').first().json;
let merged = [];
try { merged = $('09d Merge tax-id re-read').all().filter((it) => it && it.json && it.json.page_no); }
catch (e) { merged = []; }                              // branch never ran: nothing to merge (normal case)
const byPage = {};
merged.forEach((it) => {
  if (it.json.replaced) { byPage[Number(it.json.page_no)] = it; }
  else if (it.json.taxid_note) { byPage[Number(it.json.page_no) + ':rejected'] = it.json.taxid_note; }
});
// Node 09c is an HTTP node: its item has no binaries (see node 09t's note). The frame the accepted answer
// belongs to is the one node 09rot produced, so take the image from there.
let hiFrame = null;
try {
  const rot = $('09rot Rotate re-read upright').all();
  hiFrame = rot.length ? (((rot[0].binary || {}).page) || null) : null;
} catch (e) { hiFrame = null; }
if (merged.some((it) => it.json.replaced) && !hiFrame) {
  throw new Error('09z: a tax-id re-read was accepted but its 300 DPI frame is missing — annotating the '
    + '150 DPI page instead would draw hi-res boxes on the wrong grid');
}
const taxidRetry = [];
merged.forEach((it) => { (it.json.taxid_retry || []).forEach((r) => taxidRetry.push(r)); });
const taxidCalls = merged.map((it) => it.json.taxid_call).filter(Boolean);

const out = [];
for (let i = 0; i < tri.length; i++) {
  const t = tri[i].json;
  const page = Number(t.page_no);
  const hit = byPage[page];
  if (hit) {
    const r = hit.json.read;
    out.push({
      json: {
        page_no: page, answer_text: r.answer_text, answer_parse_error: r.answer_parse_error,
        img_w: r.rot_w, img_h: r.rot_h, orig_w: r.orig_w, orig_h: r.orig_h,
        rotate_degrees: r.rotate_degrees, render_dpi: r.render_dpi, coord: r.coord, model: r.model,
        taxid_retry: taxidRetry, taxid_replaced: true, taxid_calls: taxidCalls,
        max_tokens_used: Number(t.max_tokens_used || 0), n_bytes: null,
      },
      binary: Object.assign({}, tri[i].binary, hiFrame ? { page: hiFrame } : {}),   // annotate the read frame
    });
    continue;
  }
  const rej = byPage[page + ':rejected'];
  out.push({
    json: {
      page_no: page, answer_text: t.answer_text, answer_parse_error: null,
      img_w: Number(t.img_w), img_h: Number(t.img_h), orig_w: Number(t.orig_w), orig_h: Number(t.orig_h),
      rotate_degrees: Number(t.rotate_degrees || 0), render_dpi: Number(t.render_dpi || cfg.dpi_extract || 150),
      coord: String(cfg.coord || 'norm1000'), model: String(t.model || cfg.model || ''),
      taxid_retry: taxidRetry, taxid_rejected_note: rej || null, taxid_calls: taxidCalls,
      max_tokens_used: Number(t.max_tokens_used || 0), n_bytes: null,
    },
    binary: tri[i].binary,
  });
}
if (out.length !== tri.length) throw new Error('09z: lost a page while merging (in ' + tri.length + ', out ' + out.length + ')');
return out;
