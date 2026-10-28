// 05c Adjudicate request — ONE ITEM PER PAGE, the harder question the engine asks before it throws a whole
// document away (R6-6). Engine: single_pass.py::_adjudicate, called from extract() only when
//   self.adjudicate and not selection["selected"] and not page_errors.get("classify")
// and, per page: `_render(page, self.adjudicate_dpi=150)` (NOT rotated — the model is asked to read the
// printed title, not to be helped by a turn), `_data_url(img, quality=85)`, prompt
// single_pass_adjudicate, max_tokens 900. It changes the EVIDENCE, never the gate.
//
// Why this branch exists in the flow at all: without it the flow refuses 12-document-class documents that
// the engine reads — Round 6 discarded twelve documents on one classify vote, five of which printed a title
// naming both roles (ต้นฉบับใบกำกับภาษี/ใบส่งของ) and were real invoices. Refusing safely is still refusing.
//
// 85 not 90: _data_url(img, quality=85) here, quality=90 in the extract pass. The bytes are different
// requests and the tape/keys depend on it.
const cfg = $('00 CONFIG (single point)').first().json;
const n5 = $('05 Parse classify pick invoice pages').first().json;
const bin = $input.first().binary || {};                    // node 06r output: ext_page_N (unrotated, 150 DPI)
const pages = n5.pages_classification || [];
const NL = String.fromCharCode(10);
let prompt = String(cfg.prompt_adjudicate || '');
if (!prompt) throw new Error('05c: node 00 has no prompt_adjudicate — the second look cannot be asked');
if (!prompt.endsWith(NL)) { prompt = prompt + NL; }          // node 00 trims one newline vs the prompt file

const out = [];
for (const c of pages) {                                     // EVERY page, engine order, not just the invoices
  const p = Number(c.page_no);
  const key = 'ext_page_' + p;
  if (!bin[key]) continue;
  const buf = await this.helpers.getBinaryDataBuffer(0, key);
  const body = { model: cfg.model, temperature: 0, max_tokens: 900,
                 chat_template_kwargs: { enable_thinking: false },
                 messages: [{ role: 'user', content: [
                   { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + buf.toString('base64') } },
                   { type: 'text', text: prompt } ] }] };
  out.push({ json: { page_no: p, was_doc_type: c.doc_type, adjudicate_dpi: 150, prompt_chars: prompt.length,
                    n_bytes: buf.length, llmBody: JSON.stringify(body) } });
}
return out;
