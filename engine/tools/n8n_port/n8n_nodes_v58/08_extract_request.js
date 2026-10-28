// 08 Build extract request — ONE REQUEST PER SELECTED PAGE (v5.9).
//
// Engine: single_pass.py:1044-1053 per page — render at self.dpi, rotate_image(orig, orientation.total),
// _data_url(rot_img) = **JPEG quality 90**, text = prompts["single_pass_extract"].replace("{page_no}", page),
// _ask("extract", page, text, [that one image], self.max_tokens).
//
// What changed in v5.9 and why each line is load-bearing:
//  * `$('…').first()` → `$json` / `$('06b …').item` — the old version asked node 05 for "the" invoice page,
//    so every item in the batch got page 1's number, page 1's prompt and page 1's dims. A 2-page invoice
//    produced the same question twice and the second page's rows/totals never existed.
//  * data URL mime png → jpeg: node 07 now re-encodes to JPEG q90 exactly like `_data_url(img, quality=90)`,
//    and the URL must say what the bytes are (the engine labels what it sends, and a wrong label is a
//    different request body from the one the prompt was tuned against).
//  * `{page_no}` is replaced per item, which is the only way the model can tell page 1 from page 3 when both
//    are read — the engine's prompt asks it to report the page it is looking at.
//
// The knobs block (enable_thinking / max_tokens) is unchanged from v5.7: default off, like the engine
// (container.py PERCEPTION_THINKING=0 -> _ask -> litellm_client.py:132-133). Measured on this instance:
// with thinking on, one extract burned 6,211 reasoning tokens out of max_tokens 8,000 and
// finish_reason=length swallowed message.content entirely (exec 331).
const cfg = $('00 CONFIG (single point)').first().json;
let req = (cfg.body && typeof cfg.body === 'object') ? cfg.body : {};
try {
  const w = $('Webhook Invoice OCR').first().json;
  if (w && w.body && typeof w.body === 'object') { req = Object.assign({}, cfg.body, w.body); }
} catch (e) { /* manual/BB trigger run: no webhook item, so node 00's own values stand */ }
const thinking = (req.enable_thinking !== undefined)
  ? (req.enable_thinking === true || String(req.enable_thinking).toLowerCase() === 'true')
  : (cfg.enable_thinking === true);
const extMax = thinking
  ? (Number(req.max_tokens || cfg.max_tokens_thinking) || 16000)
  : Number(cfg.max_tokens || 8000);

// This node runs Run Once for All Items and LOOPS: in "Run Once for Each Item" mode n8n forbids .first()
// altogether (exec 465: "Can't use .first() here [line 21, for item 0]") and node 00's config is only
// reachable through .first(). Looping also keeps the binaries flowing — the HTTP node copies the INPUT
// binaries to its output, so anything dropped here is gone for good by node 10.
const itemsIn = $input.all();
if (!itemsIn.length) throw new Error('08: no items reached this node — node 06b produced nothing to read');
function imgSize(b) {
  if (b[0] === 0xFF && b[1] === 0xD8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xFF) { i = i + 1; continue; }
      const m = b[i + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) { return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; }
      i = i + 2 + b.readUInt16BE(i + 2);
    }
    return { w: 0, h: 0 };
  }
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const NL = String.fromCharCode(10);                          // this text is pasted into the UI: avoid backslashes
const basePrompt = String(cfg.prompt_extract);
const promptText0 = basePrompt.endsWith(NL) ? basePrompt : basePrompt + NL;   // node 00 trims one newline

const out = [];
for (let i = 0; i < itemsIn.length; i++) {
  const src = itemsIn[i].json || {};                       // node 06b's page info, carried through node 07
  const page = Number(src.page_no);
  if (!page) throw new Error('08: item ' + i + ' carries no page_no (json: ' + JSON.stringify(src).slice(0, 120) + ')');
  const buf = await this.helpers.getBinaryDataBuffer(i, 'page');     // the rotated frame the model answers in
  const preBuf = await this.helpers.getBinaryDataBuffer(i, 'pre');   // unrotated render = the engine's orig frame
  const rot = imgSize(buf), orig = imgSize(preBuf);
  const bin = (itemsIn[i].binary || {}).page || {};
  const mime = bin.mimeType || 'image/jpeg';
  const prompt = promptText0.split('{page_no}').join(String(page));  // engine: prompt.replace('{page_no}', page)
  const content = [{ type: 'image_url', image_url: { url: 'data:' + mime + ';base64,' + buf.toString('base64') } },
                   { type: 'text', text: prompt }];       // image first, text last: same order as _ask
  const body = { model: cfg.model, temperature: cfg.temperature, max_tokens: extMax,
                 chat_template_kwargs: { enable_thinking: thinking },
                 messages: [{ role: 'user', content: content }] };
  out.push({ json: { page_no: page, img_w: rot.w, img_h: rot.h, orig_w: orig.w, orig_h: orig.h,
                     rotate_degrees: Number(src.rotate_degrees || 0),
                     render_dpi: Number(src.render_dpi || cfg.dpi_extract),
                     image_mime: mime, n_bytes: buf.length, thinking: thinking, max_tokens_used: extMax,
                     prompt_chars: prompt.length, llmBody: JSON.stringify(body) },
             binary: itemsIn[i].binary });                 // keep page/pre alive through node 09
}
return out;
