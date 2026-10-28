// =================================================================================================
// src_extract.js — the flow's OCR output  ->  aiva.extraction/2.0   (contracts.ExtractionResult)
//
// v5.9: this file is a port of perception/single_pass.py's PURE half — build_extraction() and everything
// it calls (PageAnswer.region/_px without the ink correction, _rf, admit_rows/classify_row,
// drop_reprint_pages, _page_signature, tax_id_warnings, the pages/documents grouping, the `extra` keys).
// It is not a "simplified flow version" any more, and that is deliberate:
//
//   assembler.py:255 puts `extraction.extra` VERBATIM into the payload, and :240-244 puts pages/documents
//   there too, and all of it is inside integrity.payload_sha256 (only request/metrics/summary and the
//   *_at stamps are excluded). Every word of build_extraction therefore IS contract. A port that "meant the
//   same thing" but wrote agreement=true where python writes False, or R1-1 where python writes SP-R001,
//   or one document group where python builds one group per run of same-typed pages, produces a payload
//   the Portal cannot tell apart from the engine's while not being it.
//
//   The older gates could not see any of this: parity_rec.py and test_live_exec.py both hand ONE side's
//   extraction to the OTHER side (engine extraction -> port, port extraction -> engine), so the seam that
//   turns node outputs into an ExtractionResult was never compared. harness/test_payload_parity.py does,
//   on documents with more than one invoice page (DMS-26: pages 1+3, 19 rows; DMS-129: page 3 NO_GEOMETRY).
//
// Two things the flow cannot reproduce, both reported by that test rather than hidden:
//   * pages[].width_pt / height_pt — the engine reads the PDF page rectangle (595.0 x 842.0 pt); the flow
//     only ever sees pixels and reconstructs pt = px * 72 / dpi, which differs by up to half a pixel.
//   * ink snap (coords.py::snap_box_to_ink, default "move") — correcting a box onto its printed line needs
//     a decoded page and an Otsu ink map. An n8n Code node has no image library, so the flow delivers the
//     model's raw boxes: the engine's PERCEPTION_INK_SNAP=off arm. The comparison therefore runs the
//     engine with that knob off, and the difference against the engine's shipped default is measured, not
//     asserted away.
// =================================================================================================

const PAGE_TYPE_MAP = { tax_invoice: 'TAX_INVOICE', invoice: 'INVOICE', delivery: 'DELIVERY_NOTE',
                        po: 'PO', other: 'SUPPORTING' };                        // single_pass.TYPE_TO_PAGE
const TYPE_TO_DOCTYPE = { tax_invoice: 'tax_invoice', invoice: 'invoice', delivery: 'delivery_note',
                          po: 'purchase_order', other: 'other' };
const SP_HEADER_FIELDS = ['invoice_num', 'invoice_date', 'po_number', 'supplier_name', 'supplier_tax_id',
                       'customer_name', 'customer_tax_id', 'customer_address', 'currency'];
const TOTAL_FIELDS = ['sub_total', 'vat', 'grand_total'];              // taken from the LAST page that prints them
const ALL_FIELDS = SP_HEADER_FIELDS.concat(TOTAL_FIELDS);   // single_pass.ALL_FIELDS (po_number/invoice_date included; src_assemble has its own list)
const OCCURRENCE_FIELDS = ['invoice_num', 'po_number', 'supplier_tax_id', 'customer_tax_id'];
const OCCURRENCE_LABEL = { invoice_num: 'doc_no', po_number: 'po_number',
                           supplier_tax_id: 'supplier_tax_id', customer_tax_id: 'customer_tax_id' };
const CELLS = ['item_code', 'description', 'qty', 'uom', 'unit_price', 'amount'];
const NUMBER_CELLS = ['qty', 'unit_price', 'amount'];
const REGION_KIND = { table: 'table', stamp: 'stamp', signature: 'signature_box' };
const SIGNATURE_SLOT = { receiver_signature: 'receiver', received_stamp: 'receiver',
                         deliverer_signature: 'deliverer', authorized_signature: 'deliverer',
                         company_stamp: 'deliverer' };
// engine single_pass.__init__: self.prompt_version = "+".join(self._pid(n) for n in PROMPTS) and _pid reads
// "prompt_id: X version: Y" from the first 200 characters of the prompt FILE. The flow has the same text in
// node 00, so it derives the same string instead of trusting an operator to retype it: a prompt edited
// without bumping a copied version string would otherwise keep claiming the old wording.
function promptVersion(cfg, n5) {
  const explicit = String((cfg && cfg.prompt_version) || (n5 && n5.prompt_version) || '');
  if (explicit) return explicit;
  const order = [['single_pass_classify', 'prompt_classify'], ['single_pass_extract', 'prompt_extract'],
                 ['single_pass_adjudicate', 'prompt_adjudicate']];
  return order.map((pair) => {
    const head = String((cfg && cfg[pair[1]]) || '').slice(0, 200);
    const m = /prompt_id:\s*([a-z0-9_-]+)\s+version:\s*([0-9.]+)/.exec(head);
    return m ? m[1] + '@' + m[2] : pair[0] + '@unversioned';
  }).join('+');
}

const ENGINE_NAME = 'single-pass/1.4.0';                                  // single_pass.ENGINE
const PLACEHOLDER_VALUES = ['', '-', '--', '---', '\u2013', '\u2014', '/', 'n/a', 'na', 'none', 'null', 'nil'];

const _HEADER_ROW = /DESCRIPTION|QUANTITY|UNIT\s*PRICE|AMOUNT|รายการสินค้า|รายการ$|จำนวนเงิน|ราคาต่อหน่วย|รหัสสินค้า|^หน่วย$|^UNIT$|^ITEM$|^NO\.?$|^ลำดับ$/i;
const _TOTAL_ROW = /SUB\s*-?\s*TOTAL|GRAND\s*TOTAL|TOTAL|VAT|รวม|ภาษี|ยอดยก|CARRIED|BROUGHT|ส่วนลด|DISCOUNT|ค่าขนส่ง|DELIVERY\s*CHARGE/i;

function isPlaceholder(v) {                                               // coords.PLACEHOLDER_VALUES
  return PLACEHOLDER_VALUES.indexOf(String(v === null || v === undefined ? '' : v).trim().toLowerCase()) >= 0;
}
function _raw(cell) {                                                     // single_pass._raw
  let v;
  if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
    v = cell.raw !== undefined ? cell.raw : (cell.text !== undefined ? cell.text : cell.value);
  } else v = cell;
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return (t && ['null', 'none', '-', 'n/a'].indexOf(t.toLowerCase()) < 0) ? t : null;
}
function _box(cell) {                                                     // single_pass._box
  const b = (cell && typeof cell === 'object') ? cell.bbox_2d : null;
  if (!Array.isArray(b) || b.length !== 4) return null;
  const n = b.map((v) => { const f = Number(v); return f; });
  return n.some((v) => isNaN(v) || !isFinite(v)) ? null : n;
}

// ----------------------------------------------------------------------------- coords.py (geometry)
function xyxyPx(box, imgW, imgH, mode) {                                  // coords.xyxy_px
  let x1 = Number(box[0]), y1 = Number(box[1]), x2 = Number(box[2]), y2 = Number(box[3]);
  if (mode === 'norm1000') { x1 = x1 * imgW / 1000; x2 = x2 * imgW / 1000; y1 = y1 * imgH / 1000; y2 = y2 * imgH / 1000; }
  else if (mode === 'norm1') { x1 *= imgW; x2 *= imgW; y1 *= imgH; y2 *= imgH; }
  const clipX = (v) => Math.min(Math.max(v, 0), imgW), clipY = (v) => Math.min(Math.max(v, 0), imgH);
  const xs = [clipX(x1), clipX(x2)].sort((a, b) => a - b);
  const ys = [clipY(y1), clipY(y2)].sort((a, b) => a - b);
  return [xs[0], ys[0], xs[1], ys[1]];
}
function pxToXywh(rect, imgW, imgH) {                                     // coords.px_to_xywh
  const w = Math.max(imgW, 1), h = Math.max(imgH, 1);
  const r4 = (v) => Math.round(v * 10000) / 10000;
  const x = Math.max(0, Math.min(1, rect[0] / w)), y = Math.max(0, Math.min(1, rect[1] / h));
  return [r4(x), r4(y), r4(Math.max(0, Math.min(1 - x, (rect[2] - rect[0]) / w))),
          r4(Math.max(0, Math.min(1 - y, (rect[3] - rect[1]) / h)))];
}
function sanitizeXyxy(box, tol) {                                         // coords.sanitize_xyxy (tol 0.10)
  if (!box || box.length !== 4) return null;
  let x1 = Number(box[0]), y1 = Number(box[1]), x2 = Number(box[2]), y2 = Number(box[3]);
  if ([x1, y1, x2, y2].some((v) => isNaN(v) || !isFinite(v))) return null;
  if ([x1, y1, x2, y2].some((v) => v > 1.5)) { x1 /= 1000; y1 /= 1000; x2 /= 1000; y2 /= 1000; }
  let tx = Math.min(x1, x2), bx = Math.max(x1, x2), ty = Math.min(y1, y2), by = Math.max(y1, y2);
  const t = tol === undefined ? 0.10 : tol;
  if (tx < -t || ty < -t || bx > 1 + t || by > 1 + t) return null;
  tx = Math.max(0, tx); ty = Math.max(0, ty); bx = Math.min(1, bx); by = Math.min(1, by);
  if (bx - tx <= 0.001 || by - ty <= 0.001) return null;
  const r4 = (v) => Math.round(v * 10000) / 10000;
  return [r4(tx), r4(ty), r4(bx), r4(by)];
}
function validateLineBox(box) {                                           // single_pass.validate_line_bbox
  const sb = sanitizeXyxy(box);
  if (!sb) return false;
  const w = sb[2] - sb[0], h = sb[3] - sb[1];
  if (h <= 0) return false;
  return (w / h) >= 1.5 && w >= 0.45 && h <= 0.25;
}
function rowBoxFromCells(row, tableBox) {                                 // single_pass.compute_row_bbox_from_cells
  const boxes = [], yc = [];
  for (const [k, v] of Object.entries(row || {})) {
    if (k === 'line_bbox' || k === 'line_no' || k === 'page_no') continue;
    const b = _box(typeof v === 'object' && v ? v : { bbox_2d: v });
    if (!b) continue;
    const sb = sanitizeXyxy(b);
    if (sb) { boxes.push(sb); yc.push((sb[1] + sb[3]) / 2); }
  }
  if (!boxes.length) return null;
  const sorted = yc.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const kept = boxes.filter((b, i) => Math.abs(yc[i] - med) <= 0.05);
  if (!kept.length) return null;
  let minX = Math.min.apply(null, kept.map((b) => b[0])), minY = Math.min.apply(null, kept.map((b) => b[1]));
  let maxX = Math.max.apply(null, kept.map((b) => b[2])), maxY = Math.max.apply(null, kept.map((b) => b[3]));
  if (tableBox) {
    const st = sanitizeXyxy(tableBox);
    if (st) { minX = Math.min(minX, st[0]); maxX = Math.max(maxX, st[2]); }
  }
  const r4 = (v) => Math.round(v * 10000) / 10000;
  return [r4(minX), r4(minY), r4(maxX), r4(maxY)];
}

// coords.rotate_image builds M with cv2.getRotationMatrix2D(center, -angle, 1) and then shifts it so the
// rotated picture is centred in a ceil()'d canvas. For the four angles classify may answer (0/90/180/270)
// that matrix is an exact permutation of the pixel grid, so inverting it needs no numerics.
function rotationMatrix(angle, w, h) {
  if (!angle) return [[1, 0, 0], [0, 1, 0]];
  const rad = angle * Math.PI / 180, sinA = Math.abs(Math.sin(rad)), cosA = Math.abs(Math.cos(rad));
  const newW = Math.ceil(h * sinA + w * cosA), newH = Math.ceil(h * cosA + w * sinA);
  const cx = w / 2, cy = h / 2, th = -angle * Math.PI / 180;             // cv2 positive = counter-clockwise
  const cos = Math.cos(th), sin = Math.sin(th);
  return [[cos, -sin, (newW / 2) - (cos * cx - sin * cy)], [sin, cos, (newH / 2) - (sin * cx + cos * cy)]];
}
function invertAffine(M) {                                                // cv2.invertAffineTransform
  const a = M[0][0], b = M[0][1], tx = M[0][2], c = M[1][0], d = M[1][1], ty = M[1][2];
  const det = a * d - b * c;
  const ia = d / det, ib = -b / det, ic = -c / det, id = a / det;
  return [[ia, ib, -(ia * tx + ib * ty)], [ic, id, -(ic * tx + id * ty)]];
}
function applyAffine(M, p) { return [M[0][0] * p[0] + M[0][1] * p[1] + M[0][2], M[1][0] * p[0] + M[1][1] * p[1] + M[1][2]]; }

// coords.rotate_px_box_back — a rectangle measured in the rotated frame -> the two boxes of the ORIGINAL page
function rotatePxBoxBack(rect, rotW, rotH, origW, origH, M) {
  const r4 = (v) => Math.round(v * 10000) / 10000;
  const x1 = Number(rect[0]), y1 = Number(rect[1]), x2 = Number(rect[2]), y2 = Number(rect[3]);
  if (!M || (Math.abs(M[0][0] - 1) < 1e-4 && Math.abs(M[0][1]) < 1e-4 && Math.abs(M[0][2]) < 1e-4 &&
            Math.abs(M[1][1] - 1) < 1e-4 && Math.abs(M[1][0]) < 1e-4 && Math.abs(M[1][2]) < 1e-4)) {
    const bbox = pxToXywh([x1, y1, x2, y2], origW, origH);
    return [bbox, [r4(bbox[0] + bbox[2] / 2), r4(bbox[1] + bbox[3] / 2), bbox[2], bbox[3], 0.0]];
  }
  const Minv = invertAffine(M);
  const pts = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]].map((p) => applyAffine(Minv, p));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
  const bx = r4(Math.max(0, Math.min(1, minX / origW))), by = r4(Math.max(0, Math.min(1, minY / origH)));
  const bw = r4(Math.max(0, Math.min(1 - bx, (maxX - minX) / origW)));
  const bh = r4(Math.max(0, Math.min(1 - by, (maxY - minY) / origH)));
  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  let cx = r4(Math.max(0, Math.min(1, mean(xs) / origW))), cy = r4(Math.max(0, Math.min(1, mean(ys) / origH)));
  const norm = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  let edgeW = norm(pts[1], pts[0]) / origW, edgeH = norm(pts[2], pts[1]) / origH;
  let angle = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) * 180 / Math.PI;
  while (angle > 45) { angle -= 90; const t = edgeW; edgeW = edgeH; edgeH = t; }
  while (angle <= -45) { angle += 90; const t = edgeW; edgeW = edgeH; edgeH = t; }
  if (Math.abs(angle) < 0.05) {
    angle = 0; edgeW = bw; edgeH = bh;
    cx = r4(bx + bw / 2); cy = r4(by + bh / 2);
  }
  return [[bx, by, bw, bh], [cx, cy, Math.round(edgeW * 10000) / 10000, Math.round(edgeH * 10000) / 10000,
                              Math.round(angle * 100) / 100]];
}

// ---------------------------------------------------------------- PageAnswer.region/_px (ink snap = node 10's map)
// node 10 asked the helper (the engine's own code) to correct this page's field/cell boxes and carries the
// result in `read.snap.map` as [[raw_px, corrected_px, note], ...]. The adoption rule stays the engine's and
// stays in the engine's place — single_pass.py:381 `if note != "unchanged": rect = corrected` — which is why
// the map only holds boxes the helper actually moved: an untouched box is never re-quantised (R4-9 control arm).
// Keying by the raw px rect means this lookup cannot drift from what node 10 sent.
function snapArm(reads) {                          // 'move'|'grow'|'both'|'off' — which arm made this payload
  let mode = null;
  for (const r of reads || []) {
    const m = ((r && r.snap) || {}).mode || 'off';
    if (mode !== null && mode !== m) {
      throw new Error('buildExtraction: pages disagree about ink-snap mode (' + mode + ' vs ' + m
                      + '); one run is one arm (single_pass.py:391)');
    }
    mode = m;
  }
  return { mode: mode || 'off' };
}

function pxKey(r) {                                // node 10 keys its map by the ROUNDED px rect
  return r.map((v) => Math.round(Number(v))).join(',');
}

function snapLookup(read) {
  const m = new Map();
  (((read && read.snap) || {}).map || []).forEach((e) => { m.set(pxKey(e[0]), e[1]); });
  // xyxyPx here keeps fractions (the port divides and rounds later), while node 10 sends whole pixels —
  // keying raw "223.2,1184.6…" against "223,1185…" missed every box, which is why the row box stayed at the
  // model's own line_bbox and DMS-26 line 14 never grew to the snapped description cell.
  return (rect) => { const f = m.get(pxKey(rect)); return f ? f.slice() : rect; };
}

function makeRegionFn(read) {
  const M = rotationMatrix(Number(read.rotate_degrees || 0), Number(read.orig_w), Number(read.orig_h));
  const dropped = [];
  const snapped = snapLookup(read);          // engine Page.mask, precomputed by the helper
  const fn = (b, contains) => {
    if (!b) return null;
    const mode = (Math.max.apply(null, b.map(Number)) <= 1.0) ? 'norm1' : (read.coord || 'norm1000');
    let rect = xyxyPx(b, Number(read.rot_w), Number(read.rot_h), mode);
    if (contains && contains.length) {
      // engine `region()` keeps the UNCORRECTED box as the row frame and corrects only the cells inside it
      // (single_pass.py:400-412), so the row grows to the snapped cells instead of being snapped itself.
      const frame = rect;
      for (const cell of contains) {
        const drawn = xyxyPx(cell, Number(read.rot_w), Number(read.rot_h),
                             (Math.max.apply(null, cell.map(Number)) <= 1.0) ? 'norm1' : (read.coord || 'norm1000'));
        if (drawn[1] >= frame[3] || drawn[3] <= frame[1]) continue;      // not in this row to begin with
        const moved = snapped(drawn);                                    // engine _px(cell, snap=True)
        rect = [Math.min(rect[0], moved[0]), Math.min(rect[1], moved[1]),
                Math.max(rect[2], moved[2]), Math.max(rect[3], moved[3])];
      }
    } else {
      rect = snapped(rect);
    }
    const back = rotatePxBoxBack(rect, Number(read.rot_w), Number(read.rot_h),
                                 Number(read.orig_w), Number(read.orig_h), M);
    const bbox = back[0];
    if ((rect[2] - rect[0]) <= 0 || (rect[3] - rect[1]) <= 0) {          // engine keeps the raw box as a trace
      if (dropped.length < 12 && !dropped.some((d) => JSON.stringify(d) === JSON.stringify(b))) dropped.push(b.slice());
      return null;
    }
    return { page: Number(read.page_no), bbox: bbox, rbox: back[1] };
  };
  fn.dropped = dropped;
  return fn;
}
function rawField(cell, regionFn) {                                       // single_pass._rf
  const raw = _raw(cell);
  const box = _box(cell);
  if (raw === null) {
    return { raw: null, confidence: null, agreement: true, region: cell ? regionFn(box) : null,
             word_ids: [], source: 'ocr', null_reason: 'NOT_PRESENT' };
  }
  return { raw, confidence: null, agreement: false, region: regionFn(box),
           word_ids: [], source: 'vlm', null_reason: null };
}

// ------------------------------------------------------------------ rows: single_pass.classify_row/admit_rows
function classifyRow(row) {
  const nums = NUMBER_CELLS.map((k) => _raw(row[k]));
  const desc = [ _raw(row.item_code), _raw(row.description) ].filter((t) => t).join(' ');
  const uom = _raw(row.uom);
  if (!nums.some((t) => t) && !desc && !uom) return 'empty';
  const hasDigit = nums.some((n) => n && /\d/.test(thaiToArabic(n)));
  const joined = [desc, uom].concat(nums).filter((t) => t).join(' ');
  if (!hasDigit && _HEADER_ROW.test(joined)) return 'header';
  if (_TOTAL_ROW.test(desc || '') && !_raw(row.qty) && !_raw(row.unit_price)) return 'total_line';
  if (!nums.some((t) => t)) return 'continuation';
  return 'item';
}
function admitRows(rowsByPage) {                                          // -> [items, folded, excluded]
  const items = [], folded = [], excluded = [];
  for (const [page, rows] of rowsByPage) {
    (rows || []).forEach((row, idx) => {
      if (!row || typeof row !== 'object') return;
      const status = classifyRow(row);
      const rec = { page, page_line_no: row.line_no !== undefined && row.line_no !== null ? row.line_no : (idx + 1),
                    row, status };
      if (status === 'item') items.push(rec);
      else if (status === 'continuation' && items.length && items[items.length - 1].page === page) {
        const prev = items[items.length - 1].row;
        const extraTxt = [_raw(row.item_code), _raw(row.description)].filter((t) => t).join(' ');
        const d = (prev.description && typeof prev.description === 'object')
          ? JSON.parse(JSON.stringify(prev.description)) : {};
        d.raw = ((_raw(prev.description) || '') + ' ' + extraTxt).trim();
        if (d.bbox_2d === undefined) d.bbox_2d = _box(row.description);
        prev.description = d;
        folded.push(Object.assign({}, rec, { into_page_line_no: items[items.length - 1].page_line_no, text: extraTxt }));
      } else {
        excluded.push(Object.assign({}, rec, { status: status === 'continuation' ? 'orphan_text' : status }));
      }
    });
  }
  items.forEach((it, i) => { it.line_no = i + 1; });
  return [items, folded, excluded];
}

// engine single_pass.py::norm_key — the comparison form of a DOCUMENT NUMBER:
//     "".join(ch for ch in thai_to_arabic(str(s or "")).upper() if ch.isalnum())
// It belongs HERE, under its own name, and not borrowed from src_invoice_keys.js, whose `normKey` is
//     thai_to_arabic(...).upper() with WHITESPACE removed and punctuation kept
// and mirrors a different engine function. The port used that one for the page signature, and the difference
// is not cosmetic: two scans of the same sheet are never byte-identical (here, `1,2,U04-1` vs `1,2U04-1`), so
// with punctuation left in the key, drop_reprint_pages never fires — the duplicated sheet stays in the
// payload, the documents are grouped differently, and the recommendation moves in the unsafe direction.
// DMS-129 is that exact case: the engine folds page 3 into page 1 (extra.reprint_pages), the port kept both.
// See harness/test_tape_identity.py, which reports the fold the engine's own way (header totals + row cells).
function normKeyDoc(s) {                                   // single_pass.norm_key
  return thaiToArabic(String(s === null || s === undefined ? '' : s)).toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// -------------------------------------------------- drop_reprint_pages / _page_signature (same sheet twice)
function pageSignature(answer) {
  const f = (answer || {}).fields || {};
  const head = ['invoice_num', 'sub_total', 'vat', 'grand_total'].map((k) => normKeyDoc(_raw(f[k]))).join('#');
  const rows = [];
  for (const row of (answer || {}).line_items || []) {
    if (!row || typeof row !== 'object') continue;
    const cells = CELLS.map((k) => normKeyDoc(_raw(row[k])));
    if (cells.some((c) => c)) rows.push(cells.join('#'));
  }
  return [head, rows.join('@')];
}
function dropReprintPages(readsByPage, selected) {
  const kept = [], seen = {}, reprints = [];
  for (const p of selected) {
    const answer = (readsByPage[p] || {}).answer || {};
    const sig = pageSignature(answer);
    if (!sig[1]) { kept.push(p); continue; }
    const key = sig[0] + '@@' + sig[1];
    if (seen[key] !== undefined) {
      reprints.push({ page: p, same_as_page: seen[key], rows: sig[1].split('@').length,
                      invoice_num: _raw(((answer.fields || {}).invoice_num)) });
      continue;
    }
    seen[key] = p; kept.push(p);
  }
  return [kept, reprints];
}
function taxIdWarnings(fields, fieldPage) {                               // single_pass.tax_id_warnings
  const out = [];
  for (const name of ['supplier_tax_id', 'customer_tax_id']) {
    const raw = (fields[name] || {}).raw;
    if (raw === null || raw === undefined || raw === '') continue;
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length < 8 || digits.length === 13) continue;
    out.push({ field: name, raw: String(raw), digits: digits.length, rule: 'thai_tax_id_13_digits',
               page: (fieldPage || {})[name] === undefined ? null : fieldPage[name] });
  }
  return out;
}
function countAnswerValues(answer) {                                      // single_pass.count_answer_values
  let n = 0;
  for (const v of Object.values((answer || {}).fields || {})) { if (_raw(v) !== null) n++; }
  for (const row of (answer || {}).line_items || []) {
    if (row && typeof row === 'object') for (const k of CELLS) { if (_raw(row[k]) !== null) n++; }
  }
  return n;
}

// ================================================================================================
function buildExtraction(o) {
  const n5 = o.n05, cfg = o.cfg || {};
  // ---- reads: one entry per page the flow actually sent to the VLM, in classify order (engine: reads{})
  const reads = (o.reads || []).filter((r) => r && r.page_no).slice()
    .sort((a, b) => Number(a.page_no) - Number(b.page_no));
  const legacy = (!o.reads && o.n10) ? [{ page_no: Number((o.n08 || {}).page_no || (o.n10 || {}).page_no || 0),
                                          orig_w: Number((o.n08 || {}).img_w), orig_h: Number((o.n08 || {}).img_h),
                                          rot_w: Number((o.n08 || {}).img_w), rot_h: Number((o.n08 || {}).img_h),
                                          rotate_degrees: Number((o.n08 || {}).rotate_degrees || 0),
                                          render_dpi: Number(cfg.dpi_extract || 150),
                                          answer: o.n10.answer || {}, answer_salvaged: !!o.n10.answer_salvaged,
                                          coord: String(cfg.coord || 'norm1000') }] : [];
  const allReads = reads.length ? reads : legacy;
  const byPage = {};
  for (const r of allReads) byPage[Number(r.page_no)] = r;
  const emptyRead = allReads.length === 0;

  const selection = n5.selection || { selected: n5.selected_invoice_pages || [], pages_complete: !!n5.pages_complete };
  const classified = n5.pages_classification || [];
  const dpiE = Number(cfg.dpi_extract || 150), dpiC = Number(cfg.dpi_classify || cfg.classify_dpi || 80);
  const pageErrors = {};
  for (const [k, v] of Object.entries(o.pageErrors || {})) pageErrors[String(k)] = v;   // classify/adjudicate/...
  for (const r of allReads) {
    if (r.page_error) pageErrors[String(r.page_no)] = r.page_error;
    else if (r.answer_salvaged) pageErrors[String(r.page_no)] = 'TRUNCATED_JSON_SALVAGED';   // engine: step 2
  }

  // ---- selection -> what was really read (engine drops pages with no read, then duplicate sheets)
  let selected = (selection.selected || []).map(Number).filter((p) => byPage[p] !== undefined);
  const [kept, reprintPages] = dropReprintPages(byPage, selected);
  selected = kept;

  // ---- regions (engine numbering SP-R001 runs in the order add_region is called, nowhere else)
  const regions = [];
  let rid = 0;
  const regionFns = {};
  for (const r of allReads) regionFns[Number(r.page_no)] = makeRegionFn(r);
  function addRegion(pageNo, kind, label, text, b) {
    const reg = regionFns[pageNo] ? regionFns[pageNo](b) : null;
    if (!reg) return null;
    rid += 1;
    regions.push({ region_id: 'SP-R' + String(rid).padStart(3, '0'), page: pageNo, kind, label,
                   text: text === null || text === undefined ? null : String(text).slice(0, 500),
                   confidence: null, bbox: reg.bbox, rbox: reg.rbox, parent_id: null });
    return 'SP-R' + String(rid).padStart(3, '0');
  }

  // ---- header/totals fields: first page that prints them, totals from the LAST page (single_pass:590)
  const fields = {}, fieldPage = {};
  for (const name of ALL_FIELDS) {
    const order = TOTAL_FIELDS.indexOf(name) >= 0 ? selected.slice().reverse() : selected;
    for (const p of order) {
      const cell = ((byPage[p].answer || {}).fields || {})[name];
      if (_raw(cell) !== null) {
        fields[name] = rawField(cell, regionFns[p]); fieldPage[name] = p;
        break;
      }
    }
  }
  for (const name of (o.requiredFields || [])) {
    if (!fields[name]) fields[name] = { raw: null, confidence: null, agreement: true, region: null,
                                        word_ids: [], source: 'ocr', null_reason: 'NOT_PRESENT' };
  }

  // ---- occurrences + handwriting -> the keys a receipt can be found with (engine: items_by_page)
  const itemsByPage = {};
  for (const p of selected) {
    const pg = byPage[p], lst = itemsByPage[String(p)] = [];
    const occ = pg.answer.occurrences || {};
    for (const name of OCCURRENCE_FIELDS) {
      const entries = (occ[name] || []).filter((e) => e && typeof e === 'object' && _raw(e));
      const primary = (pg.answer.fields || {})[name];
      // engine single_pass.py:618 compares occurrences with norm_key as well
      if (_raw(primary) && !entries.some((e) => normKeyDoc(_raw(e)) === normKeyDoc(_raw(primary)))) {
        entries.push({ raw: _raw(primary), label_text: '', bbox_2d: _box(primary) });
      }
      for (const e of entries) {
        const reg = regionFns[p](_box(e));
        lst.push({ type: 'header', label: OCCURRENCE_LABEL[name], text: _raw(e),
                   label_text: _raw(e.label_text), bbox: reg ? reg.bbox : null, source: 'single_pass_occurrence' });
        addRegion(p, 'other', 'occurrence:' + name, _raw(e), _box(e));
      }
    }
    for (const h of pg.answer.handwritten_refs || []) {
      if (h && typeof h === 'object' && _raw(h)) {
        const reg = regionFns[p](_box(h));
        lst.push({ type: 'other', label: 'handwriting', text: _raw(h), bbox: reg ? reg.bbox : null });
        addRegion(p, 'other', 'handwriting', _raw(h), _box(h));
      }
    }
  }
  for (const c of classified) {                                     // handwriting on pages never extracted
    if (selected.indexOf(Number(c.page_no)) >= 0) continue;
    for (const h of c.handwritten || []) {
      // engine line 638: items_by_page.setdefault(page, []).append(...) — the key appears when an item is
      // appended, not when a page is merely classified. Eager creation here invented "4": [], "5": [] rows
      // the engine never emits, which is a payload diff on a field Portal can read.
      const lst = itemsByPage[String(c.page_no)] || (itemsByPage[String(c.page_no)] = []);
      lst.push({ type: 'other', label: 'handwriting', text: String(h), bbox: null, source: 'classify' });
    }
  }

  // ---- rows: admitted across every page, renumbered 1..n over the document (single_pass.admit_rows)
  const [items, folded, excluded] = admitRows(selected.map((p) => [p, (byPage[p].answer || {}).line_items || []]));
  const lines = [];
  const rowBoxes = [];
  for (const it of items) {
    const pg = byPage[it.page], row = it.row, rf = regionFns[it.page];
    const cells = {};
    for (const k of CELLS) {
      if (row[k] === undefined || row[k] === null) continue;
      cells[k] = rawField(row[k], rf);
    }
    const rawBox = _box({ bbox_2d: row.line_bbox });
    let effective = null, source = null;
    if (validateLineBox(rawBox)) { effective = sanitizeXyxy(rawBox); source = 'line_bbox'; }
    else {
      let tableBox = null;
      for (const r of ((pg.answer || {}).regions || [])) {
        if (r && typeof r === 'object' && (r.label === 'items_table' || String(r.type || '').toLowerCase() === 'table')) {
          const tb = _box(r);
          if (tb) { tableBox = tb; break; }
        }
      }
      const cand = rowBoxFromCells(row, tableBox);
      if (validateLineBox(cand)) { effective = cand; source = 'cells_union'; }
    }
    if (source) rowBoxes.push({ line_no: it.line_no, page: it.page, source });
    const contains = effective ? CELLS.filter((k) => row[k] !== undefined && row[k] !== null)
      .map((k) => _box(row[k])).filter((b) => b) : [];
    lines.push({ line_no: it.line_no, region: effective ? rf(effective, contains) : null, cells });
  }
  for (const ex of excluded) {
    const txt = CELLS.map((k) => _raw(ex.row[k])).filter((t) => t).join(' | ');
    ex.region_id = addRegion(ex.page, 'other', 'excluded_row:' + ex.status, txt, _box({ bbox_2d: ex.row.line_bbox }));
  }
  for (const fo of folded) {
    fo.region_id = addRegion(fo.page, 'other', 'folded_row', fo.text, _box({ bbox_2d: fo.row.line_bbox }));
  }

  // ---- regions the model reported, then the signature slots (V-06)
  const sigVotes = { receiver: [], deliverer: [] };
  for (const p of selected) {
    const pg = byPage[p];
    for (const r of (pg.answer.regions || [])) {
      if (!r || typeof r !== 'object') continue;
      const label = String(r.label || r.type || 'region').trim().toLowerCase();
      const kind = REGION_KIND[String(r.type || '').toLowerCase()] || 'other';
      const t = String(r.present === null || r.present === undefined ? '' : r.present).trim().toLowerCase();
      const present = ['signed', 'stamped', 'present', 'true', 'yes'].indexOf(t) >= 0 ? true
        : ['empty', 'blank', 'false', 'no', 'unsigned'].indexOf(t) >= 0 ? false : null;
      const text = (kind === 'stamp' || kind === 'signature_box')
        ? ((present === true ? (kind === 'stamp' ? 'stamped' : 'signed') : present === false ? 'empty' : 'unclear'))
        : (r.label === undefined ? null : r.label);
      addRegion(p, kind, label, text, _box(r));
      let slot = (kind === 'stamp' || kind === 'signature_box') ? signatureSlot(kind, label) : null;
      if (slot) sigVotes[slot].push([present, regionFns[p](_box(r)), label, kind]);
    }
  }
  const signatures = {};
  for (const [slot, votes] of Object.entries(sigVotes)) {
    const marked = votes.filter((v) => v[0] === true);
    const boxes = votes.filter((v) => v[3] === 'signature_box' && v[1] !== null);
    if (marked.length) {
      const pick = marked.filter((v) => v[3] === 'signature_box')[0] || marked[0];
      signatures[slot] = { present: true, confidence: null, kind: pick[2], region: pick[1] };
    } else if (votes.length) {
      const pick = (boxes[0] || votes[0]);
      signatures[slot] = { present: false, confidence: null, kind: pick[2], region: pick[1] };
    }
  }

  // ---- pages / documents (engine grouping: D1 = the invoice, then one group per run of same-typed pages)
  const dimOf = {};
  for (const d of (n5.page_dims || [])) dimOf[String(d.page_no)] = d;
  const clsByPage = {};
  for (const c of classified) clsByPage[Number(c.page_no)] = c;
  const pages = [];
  for (const c of classified) {
    const p = Number(c.page_no), read = byPage[p], d = dimOf[String(p)];
    const dpi = read ? Number(read.render_dpi || dpiE) : dpiE;                     // engine: dpi_by_page or self.dpi
    const px = read ? [Number(read.orig_w), Number(read.orig_h)] : (d ? [Number(d.w_px), Number(d.h_px)] : [0, 0]);
    const usedDpi = read ? Number(read.render_dpi || dpiE) : dpiC;               // px were measured at that DPI
    pages.push({ page_no: p, width_pt: Math.round(px[0] * 72 / usedDpi * 100) / 100,
                 height_pt: Math.round(px[1] * 72 / usedDpi * 100) / 100,
                 rotation: Number(c.rotate_degrees || 0), render_dpi: dpi,
                 page_type: PAGE_TYPE_MAP[String(c.doc_type || '').toLowerCase()] || 'UNKNOWN',
                 type_confidence: null, ocr_quality: null });
  }
  const documents = [{ document_id: 'D1', document_type: 'INVOICE', pages: selected.slice(), confidence: null }];
  let run = [];
  const rest = pages.map((p) => p.page_no).filter((p) => selected.indexOf(p) < 0);
  for (const p of rest.concat([null])) {
    const tPrev = run.length ? (clsByPage[run[run.length - 1]] || {}).doc_type : null;
    if (run.length && (p === null || p !== run[run.length - 1] + 1 ||
                       (clsByPage[p] || {}).doc_type !== tPrev)) {
      documents.push({ document_id: 'D' + (documents.length + 1),
                       document_type: PAGE_TYPE_MAP[String(tPrev || '').toLowerCase()] || 'UNKNOWN',
                       pages: run.slice(), confidence: null });
      run = [];
    }
    if (p !== null) run.push(p);
  }

  // ---- "a page delivered values but no box anywhere" (single_pass, decided BEFORE complete)
  for (const p of (selection.selected || []).map(Number).filter((x) => byPage[x] !== undefined)) {
    const rf = regionFns[p];
    const offered = countAnswerValues(byPage[p].answer || {});
    let located = 0;
    for (const f of Object.values(fields)) { if (f.raw !== null && f.region && f.region.page === p) located++; }
    for (const ln of lines) { for (const c of Object.values(ln.cells)) { if (c.raw !== null && c.region && c.region.page === p) located++; } }
    if (offered && !located) {
      const sample = (rf.dropped.slice(0, 3).concat((byPage[p].unmapped || []).slice(0, 3 - rf.dropped.length)))
        .map((d) => JSON.stringify(d)).join('; ');
      pageErrors[String(p)] = 'NO_GEOMETRY: ' + offered + ' values read, none with a usable box (unmapped: ' +
                              (sample || 'none reported') + ')';
    }
  }
  const complete = !!selection.pages_complete && selected.length > 0 &&
                   (selection.selected || []).map(Number).every((p) => pageErrors[String(p)] === undefined);

  const model = String(cfg.model || (o.reads && o.reads[0] && o.reads[0].model) || '');
  const coordByPage = {};
  for (const p of Object.keys(byPage)) coordByPage[String(p)] = byPage[p].coord || String(cfg.coord || 'norm1000');

  return {
    contract: 'aiva.extraction/2.0',
    package_id: o.packageId, dms_doc_id: String(o.docId),
    // Paperless hands back a bare hex checksum; the engine's sha always carries its algorithm prefix, and the
    // prefix is part of what Portal/store keys on. Normalise here rather than in every caller.
    file_sha256: String(o.fileSha256 || '').indexOf(':') >= 0 ? String(o.fileSha256)
      : (o.fileSha256 ? 'sha256:' + String(o.fileSha256) : ''),
    pages, documents, invoice_document_id: 'D1', pages_complete: complete,
    fields, lines, signatures, words: [], regions,
    extra: {
      engine: ENGINE_NAME, selection, classify: classified,
      items_by_page: itemsByPage,
      doc_type_by_page: Object.fromEntries(classified.map((c) => [String(c.page_no),
        TYPE_TO_DOCTYPE[String(c.doc_type || 'other')] || 'other'])),
      field_page: fieldPage,
      lines_meta: items.map((it) => ({ line_no: it.line_no, page: it.page, page_line_no: it.page_line_no })),
      // single_pass.py:328/331 build these entries as {**rec, ...} — rec contains the WHOLE row object — and
      // :743-744 copies each dict verbatim into extra, so `row` is hashed contract. The port used to publish
      // only the ids and an invented `text` for excluded rows; on DMS-116/117 that was a missing `row` plus a
      // key the engine never emits. The reviewer (and Portal) is owed the row that was folded away, exactly as
      // the engine hands it over: same keys, same values, nothing extra.
      folded_rows: folded.map((f) => ({ page: f.page, page_line_no: f.page_line_no, row: f.row, status: f.status,
                                        into_page_line_no: f.into_page_line_no, text: f.text,
                                        region_id: f.region_id })),
      excluded_rows: excluded.map((e) => ({ page: e.page, page_line_no: e.page_line_no, row: e.row,
                                            status: e.status, region_id: e.region_id })),
      reprint_pages: reprintPages,
      format_warnings: taxIdWarnings(fields, fieldPage),
      coord_mode_by_page: coordByPage,
      // which arm of the R4-3c A/B made this payload (single_pass.py:748-749). The flow used to be
      // hard-wired to the off arm; it now reports the mode the helper actually ran with.
      ink_snap: snapArm(reads || []).mode !== 'off',
      ink_snap_mode: snapArm(reads || []).mode,
      adjudication: (o.adjudication || []),
      taxid_retry: (o.taxidRetry || []),
      orientation: Object.fromEntries(classified.map((c) => [String(c.page_no), {
        r: Number(c.rotate_degrees || 0), confidence: 1.0, uncertain: false, skew: 0.0,
        total: Number(c.rotate_degrees || 0), runtime: 'vlm_classify' }])),
      page_errors: pageErrors,
      // engine `calls` is ONE list, appended as the run happens: the classify record first
      // (single_pass._classify), then the adjudicate records (R6-6), then one record per page read (and one per
      // tax-id re-read, inserted by node 12 next to its page). It is copied verbatim into extra.calls, so a
      // missing classify entry is a payload difference — and it was: the live draft run of DMS-100 carried two
      // extract records where the engine recorded three (harness/test_live_vs_engine.py).
      calls: [].concat(o.classifyCalls || [], o.adjudicateCalls || [], o.calls || []),
      timings_ms: (o.timingsMs || {}),
      invoice_pages: selected.slice(),
      // the flow's own additions, kept out of the engine's key names so a reviewer can see what came from here
      flow: { node21_build: (o.flowMeta || {}).build || null, selected_pages: (n5.selected_invoice_pages || []),
              empty_read: emptyRead, row_boxes_from_cells: rowBoxes,
              note: 'extraction assembled from n8n node outputs; geometry = model boxes, ink snap off' }
    },
    extractor: { vlm: model, prompts: promptVersion(cfg, n5),
                 pipeline: ENGINE_NAME, consensus: 'single-read+evidence' }
  };
}

function signatureSlot(kind, label) {                                     // single_pass.signature_slot
  const l = String(label || '');
  const slot = SIGNATURE_SLOT[l];
  if (slot || kind !== 'stamp') return slot || null;
  return (l.indexOf('receiv') >= 0 || l.indexOf('รับ') >= 0) ? 'receiver' : 'deliverer';
}
