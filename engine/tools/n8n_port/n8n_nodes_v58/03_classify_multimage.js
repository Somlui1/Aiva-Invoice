// A2 (engine parity): ONE classify request that carries ALL pages as images - exactly the call the engine
// makes: single_pass.py:986-996 -> _ask("classify", None, text, [data_url(page) for every page], 160*n+400)
//
// ของเดิม (วัดจริงจาก exec 327) ยิงหน้าละ 1 request เพราะ gateway ตัวเก่าตอบ error "only one image"
// หลังอัปเกรด gateway แล้ว probe ใหม่: ยิง 2 ภาพในลูกเดียวผ่าน (HTTP 200) จึงกลับมา behave เหมือน engine ได้
// ผลพลอยได้: เอกสาร 5 หน้าเหลือ 1 call (exec 449 ยิง 5 calls) และโมเดลเห็นบริบทข้ามหน้าอย่างที่ prompt ขอ
//
// ข้อความที่ส่งต้อง byte-identical กับ engine: เนื้อหาไฟล์ prompt ตรง ๆ (ในไฟล์มี newline ปิดท้ายอยู่แล้ว)
// แล้วต่อท้ายด้วย newline สองตัว + "There are N images: Image 1 = page 1 ... Image N = page N."
// ตรงกับ f-string ของ python ทุกตัวอักษร  n8n และ UI ชอบ trim ช่องว่างท้ายสตริงของ node 00 จึงต้องเติม
// newline กลับถ้าหาย ไม่งั้น text_len ต่าง engine 1 ตัว ข้อความที่โมเดลได้ก็ไม่ตรงกับที่ทดสอบไว้
// (ใช้ String.fromCharCode(10) เพื่อหลบ backslash ตอน paste โค้ดเข้า UI)
// เทส: node harness/test_request_shape.mjs เทียบ body ที่ node นี้ผลิตกับ tape ที่ engine ยิงจริง
//
// chat_template_kwargs.enable_thinking = false คือค่าเดียวกับ engine (container.py PERCEPTION_THINKING=0
//   -> single_pass.py::_ask -> litellm_client.py:132-133) ถ้าไม่ปิด vLLM จะนับ reasoning_content เป็น
//   completion tokens กินโควตา max_tokens (exec 330/331 แตกเพราะแบบนี้: finish_reason=length, content หาย)
const cfg = $('00 CONFIG (single point)').first().json;
const bin = $input.first().binary || {};
const keys = Object.keys(bin).filter(function (k) { return k.indexOf('cls_') === 0; });
keys.sort(function (a, b) { return parseInt(a.replace(/[^0-9]/g, ''), 10) - parseInt(b.replace(/[^0-9]/g, ''), 10); });
const use = keys.slice(0, cfg.max_pages);
// knob enable_thinking: default ปิดเหมือน engine เปิดได้ 2 ทางโดยไม่ต้องแตะ node 00 -
//   (1) body.enable_thinking=true ส่งมาทาง Webhook (2) ใส่ entry 'enable_thinking' ใน node 00
// บทเรียน exec 336: cfg.body เป็น undefined เสมอ เพราะ node 00 เป็น Set (includeOtherFields=false) ที่ทิ้ง
//   field ของ webhook ออกทั้งก้อน จึงต้องอ่านจาก node Webhook ตรง ๆ ด้วย ไม่งั้น knob ไม่ทำงานเงียบ ๆ
let req = (cfg.body && typeof cfg.body === 'object') ? cfg.body : {};
try {
  const w = $('Webhook Invoice OCR').first().json;
  if (w && w.body && typeof w.body === 'object') { req = Object.assign({}, cfg.body, w.body); }
} catch (e) { /* ไม่ได้รันจาก Webhook (pin data / รัน node เดี่ยว) -> ใช้ค่าของ node 00 เท่านั้น */ }
const thinking = (req.enable_thinking !== undefined)
  ? (req.enable_thinking === true || String(req.enable_thinking).toLowerCase() === 'true')
  : (cfg.enable_thinking === true);
const clsMax = thinking
  ? (Number(req.max_tokens_classify || cfg.max_tokens_classify) || 8000)
  : (160 * use.length + 400);                 // เท่า 160 * n + 400 ของ python เป๊ะ (single_pass.py:996)
const NL = String.fromCharCode(10);
let prompt = String(cfg.prompt_classify);
if (!prompt.endsWith(NL)) { prompt = prompt + NL; }
prompt = prompt + NL + NL + 'There are ' + use.length + ' images: Image 1 = page 1 ... Image ' + use.length + ' = page ' + use.length + '.';
// อ่านกว้างxสูงจาก header ของภาพ (PNG IHDR / JPEG SOF) — ไม่ decode ทั้งไฟล์ เหมือน imgSize ใน node 08
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
const content = [];
const pageDims = [];
const binMeta = $input.first().binary || {};
for (let i = 0; i < use.length; i++) {
  const buf = await this.helpers.getBinaryDataBuffer(0, use[i]);
  const d = imgSize(buf);
  pageDims.push({ page_no: i + 1, key: use[i], w_px: d.w, h_px: d.h, bytes: buf.length,
                  mime: binMeta[use[i]] ? binMeta[use[i]].mimeType : null });   // ขนาดภาพทุกหน้า:
  content.push({ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + buf.toString('base64') } });
}
content.push({ type: 'text', text: prompt });   // เรียง image ก่อน text เหมือน _ask ของ engine
const body = { model: cfg.model, temperature: cfg.temperature, max_tokens: clsMax, chat_template_kwargs: { enable_thinking: thinking }, messages: [{ role: 'user', content: content }] };
// page_dims ต่อให้ node 05: path "ไม่มีหน้า invoice" ต้องสร้าง extraction ที่มี pages ครบทุกหน้าทั้งที่ไม่ได้ยิง extract
return [{ json: { n_pages: use.length, page_keys: use, thinking: thinking, max_tokens_used: clsMax, prompt_chars: prompt.length, page_dims: pageDims, llmBody: JSON.stringify(body) } }];
