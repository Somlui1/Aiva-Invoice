// 09b Build re-read request — the tax-id re-read prompt, byte-identical to a normal extract call.
// Engine: single_pass.py::_extract_one is the SAME call for the re-read as for the first read: same prompt
// file (single_pass_extract.md with {page_no} substituted), same max_tokens, same temperature, image first /
// text last. The ONLY difference is the pixels (rendered at PERCEPTION_TAXID_RETRY_DPI), which node 09r/09rot
// produced. Nothing here invents a "tax-id prompt": a second look at the same question is the whole design.
const item = $input.first();
const cfg = $('00 CONFIG (single point)').first().json;
const src = item.json;
const page = Number(src.page_no);
const buf = await this.helpers.getBinaryDataBuffer(0, 'page');          // rotated 300 DPI frame (node 09rot)
const rot = imgSize(buf);
const preBuf = await this.helpers.getBinaryDataBuffer(0, 'hi_raw');     // the engine's orig frame for this read
const orig = imgSize(preBuf);
const mime = (item.binary && item.binary.page && item.binary.page.mimeType) || 'image/jpeg';
const extMax = Number(src.max_tokens_used || cfg.max_tokens || 8000);   // same max_tokens as the first read
const thinking = (cfg.thinking_models || []).indexOf(cfg.model) >= 0;

const NL = String.fromCharCode(10);
let prompt = String(cfg.prompt_extract);
if (!prompt.endsWith(NL)) prompt = prompt + NL;
prompt = prompt.split('{page_no}').join(String(page));
const content = [{ type: 'image_url', image_url: { url: 'data:' + mime + ';base64,' + buf.toString('base64') } },
                 { type: 'text', text: prompt }];
const body = { model: cfg.model, temperature: cfg.temperature, max_tokens: extMax,
               chat_template_kwargs: { enable_thinking: thinking },
               messages: [{ role: 'user', content: content }] };
return [{ json: { page_no: page, img_w: rot.w, img_h: rot.h, orig_w: orig.w, orig_h: orig.h,
                  rotate_degrees: Number(src.rotate_degrees || 0), render_dpi: Number(src.render_dpi || 300),
                  taxid_reason: src.taxid_reason, answer_index: Number(src.answer_index || 0),
                  first_answer_text: src.first_answer_text, max_tokens_used: extMax, model: String(cfg.model),
                  image_mime: mime, n_bytes: buf.length, llmBody: JSON.stringify(body) } }];

function imgSize(b) {                                                    // read JPEG SOF for real pixels
  for (let i = 0; i < b.length - 9; i++) {
    if (b[i] === 0xff && (b[i + 1] === 0xc0 || b[i + 1] === 0xc2)) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
  }
  throw new Error('09b: no JPEG SOF marker in the re-read image');
}
