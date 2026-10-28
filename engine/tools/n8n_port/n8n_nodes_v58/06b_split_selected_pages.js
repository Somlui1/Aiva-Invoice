// 06b Split selected pages — ONE ITEM PER INVOICE PAGE THE ENGINE WOULD READ.
//
// Why this node exists: single_pass.py::extract loops `for p in selection["extract_pages"]` and sends
// every selected page to the VLM (single_pass.py:1044-1075). The flow used to read `$input.first()` at
// nodes 08/10, so a two-page invoice was validated on its first page only — the second page's rows,
// totals and signature never existed for the rules. Node 06 already renders EVERY page at 150 DPI into
// one item (binary ext_page_1..N); this node turns the selected ones into one item each so the whole
// extract branch (07 -> 08 -> 09 -> 10) runs per page, in classify order, with pairing intact.
//
// It copies bytes with helpers.prepareBinaryData rather than re-encoding anything: the pixels that leave
// this node are the pixels node 06 rendered.
//
// Engine: reads = {} keyed by page; build_extraction then iterates `selected` in order. Order here is
// therefore selection order (ascending page number), not binary-key string order.
// the selection may have been reopened by the R6-6 second look; read whichever branch actually ran
const sel = (() => { try { return $('05e Parse adjudicate + reselect').first().json; } catch (e) { return $('05 Parse classify pick invoice pages').first().json; } })();
const want = (sel.selected_invoice_pages || []).map(Number);
const bin = $input.first().binary || {};
const dpi = Number($('00 CONFIG (single point)').first().json.dpi_extract || 150);

function imgSize(b) {                                        // PNG IHDR / JPEG SOF, no full decode
  if (b[0] === 0xFF && b[1] === 0xD8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xFF) { i += 1; continue; }
      const m = b[i + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    return { w: 0, h: 0 };
  }
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const keyOf = {};                                            // ext_page_3 -> the binary that holds page 3
for (const k of Object.keys(bin)) {
  const m = k.match(/(?:^|_)(\d+)$/);
  if (m) keyOf[Number(m[1])] = k;
}
const out = [];
for (const p of want) {
  const key = keyOf[p];
  if (!key) continue;                                        // engine would raise; the IF node already gated this
  const buf = await this.helpers.getBinaryDataBuffer(0, key);
  const cls = (sel.pages_classification || []).find((c) => Number(c.page_no) === p) || {};
  out.push({
    json: {
      page_no: p,
      orig_key: 'pre',                                           // node 08 reads the orig frame here
      rotated_key: 'page',                                     // node 07 destinationKey; node 08 sends this one
      rotate_degrees: Number(cls.rotate_degrees || 0),        // same value the engine feeds rotate_image
      render_dpi: dpi,                                        // pages[].render_dpi in the payload
      mime_in: (bin[key] || {}).mimeType || null,
      bytes_in: buf.length,
      page_type: cls.doc_type || null,
      doc_no_hint: cls.doc_no_hint || null,
    },
    // The unrotated render, under the engine's own name. Node 07 (editImage rotate) then writes the rotated
    // JPEG into `page` (its destinationKey), so node 08 can measure BOTH frames: orig from this key, rot from
    // `page` — the same pair single_pass keeps (`pre` / `post`) for _map_box_back.
    // Engine keys are unique per page on purpose: a page cannot be mixed into another page's request. A
    // single shared `pre` would let .first() pick one page's geometry for every page.
    binary: {
      // await is not decoration: helpers.prepareBinaryData is ASYNC in this n8n version, and a
      // Promise serialises to {} - which is how exec 461 arrived at node 07 with an empty binary and
      // died inside BinaryDataService with "argument must be of type Buffer... received undefined".
      pre: await this.helpers.prepareBinaryData(buf, 'page_' + p + '.jpeg', (bin[key] || {}).mimeType || 'image/jpeg'),
    },
  });
}
if (!out.length) throw new Error('06b: node 05 selected ' + JSON.stringify(want) + ' but node 06 rendered ['
  + Object.keys(keyOf).join(',') + '] — the pages the selection wants are not on the canvas');
return out;
