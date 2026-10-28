// 09o Prep re-read frame — copy the ONE page the engine re-renders out of node 09r's 300 DPI render.
//
// Node 09r (Convert to PDF to JPEG) puts every page of the PDF in its own binary key and its own metadata
// object, so nothing in its output json says "this is the page we are re-reading". This node picks the page
// node 09t chose, copies that page's hi-res JPEG to the key the rotate node is configured to read, and puts
// the page number / rotation in the json — so the editImage node can address it with a plain $json expression
// instead of an .item() pairing that would depend on the PDF node happening to emit items in page order.
//
// Engine: single_pass.py:1053-1055
//     hi_orig = self._render(doc[p - 1], self.taxid_retry_dpi)
//     hi, hi_rot = self._orient(hi_orig, p, rot["rotate_degrees"])
// `_render` = this node + node 09r; `_orient` = node 09rot. `hi_orig` stays available as `pre` because the
// engine records the re-read's ORIGINAL (unrotated) dimensions alongside the rotated ones.
const cfg = $('00 CONFIG (single point)').first().json;
const tri = $('09t Tax-id triage').all().map((t) => t.json).filter((t) => t.taxid_retry_page);
if (tri.length !== 1) {
  throw new Error('09o: expected exactly one page flagged for the tax-id re-read, got ' + tri.length
    + ' — node 09t spends one retry per document, anything else is a bug');
}
const t = tri[0];
const srcKey = (cfg.ext_key || 'tax_page_') + t.page_no;
const buf = await this.helpers.getBinaryDataBuffer(0, srcKey);
const bin = await this.helpers.prepareBinaryData(buf, srcKey + '.jpg', 'image/jpeg');   // async on this n8n
return [{
  json: {
    page_no: t.page_no, rotate_degrees: t.rotate_degrees, hi_key: 'hi_raw',
    render_dpi: Number(cfg.taxid_retry_dpi || 300), taxid_reason: t.taxid_reason,
    answer_index: t.answer_index, first_answer_text: t.answer_text,
    first_img_w: t.img_w, first_img_h: t.img_h, max_tokens_used: t.max_tokens_used, model: t.model,
    n_bytes: buf.length,
  },
  binary: { hi_raw: bin, pre: (t.binary || {}).pre },          // pre = the 150 DPI original, unused for dims
}];
