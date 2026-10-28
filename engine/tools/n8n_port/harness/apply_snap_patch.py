"""One-shot patch: wire the engine's ink-snap helper into node 10 + src_extract.js.

Kept in the repo (not deleted) so a reviewer can re-apply / audit exactly what changed on 27 Oct.
"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rd(p):
    return io.open(os.path.join(ROOT, p), encoding='utf-8').read()


def wr(p, s):
    io.open(os.path.join(ROOT, p), 'w', encoding='utf-8', newline='\n').write(s)


# ------------------------------------------------------------------------ node 10
p = 'n8n_nodes_v58/10_parse_extract.js'
s = rd(p)
Q = "function px(b) {\n  const k = Math.max.apply(null, b) <= 1.0 ? 1.0 : 1000.0;"
assert Q in s and 'snapPrep' not in s
s = s.replace(Q, "function pxRaw(b) {\n  const k = Math.max.apply(null, b) <= 1.0 ? 1.0 : 1000.0;", 1)

SNAP = r'''// ---- R4-9 ink snap, run by the ENGINE'S OWN code through the helper -----------------------------------
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
  if (!pend.length) { snapInfo = { mode: mode, moved: 0, boxes: 0, map: [] }; return; }
  let pdfBuf = null;
  try { const src = $('Get a document').first(); pdfBuf = src && src.binary && (src.binary.data || src.binary.pdf); }
  catch (e) {
    throw new Error('10: snap_url is set but "Get a document" is not reachable — the engine masks the lossless '
                    + 'render at the extract DPI, so a snap without the source PDF cannot be trusted');
  }
  if (!pdfBuf) throw new Error('10: snap_url is set but no source PDF binary is reachable (no mask, no snap)');
  let j = null;
  try {
    const res = await helpers.httpRequest({
      method: 'POST', url: url, timeout: Number(cfg.snap_timeout_ms || 20000),
      body: { pdf_b64: Buffer.from(pdfBuf).toString('base64'), page_no: page,
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
'''
ANCHOR = "const elements = []; const boxes = []; const dropped = [];"
assert ANCHOR in s
s = s.replace(ANCHOR, SNAP + ANCHOR, 1)
s = s.replace("const fields = {};\nF.forEach(", "await snapPrep();                     // before any box is used (engine corrects inside _px)\nconst fields = {};\nF.forEach(", 1)
OLD_F = ("const F = ['invoice_num', 'invoice_date', 'po_number', 'supplier_name', 'supplier_tax_id', "
         "'customer_name', 'customer_tax_id', 'customer_address', 'sub_total', 'vat', 'grand_total', 'currency'];\n")
assert OLD_F in s
s = s.replace(OLD_F, "", 1)
s = s.replace("               orig_w: Number(dim.orig_w || dim.img_w), orig_h: Number(dim.orig_h || dim.img_h),",
              "               snap: snapInfo,               // {mode, moved, boxes, map} — carried to node 21 via node 12\n"
              "               orig_w: Number(dim.orig_w || dim.img_w), orig_h: Number(dim.orig_h || dim.img_h),", 1)
wr(p, s)

# ------------------------------------------------------------------------ src_extract
p = 'src_extract.js'
s = rd(p)
OLD = """// ---------------------------------------------------------------- PageAnswer.region/_px (no ink snap here)
function makeRegionFn(read) {"""
assert OLD in s
NEW = """// ---------------------------------------------------------------- PageAnswer.region/_px (ink snap = node 10's map)
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

function snapLookup(read) {
  const m = new Map();
  (((read && read.snap) || {}).map || []).forEach((e) => { m.set(e[0].join(','), e[1]); });
  return (rect) => { const f = m.get(rect.join(',')); return f ? f.slice() : rect; };
}

function makeRegionFn(read) {"""
s = s.replace(OLD, NEW, 1)

OLD_BODY = """    let rect = xyxyPx(b, Number(read.rot_w), Number(read.rot_h), mode);
    if (contains && contains.length) {
      const frame = xyxyPx(b, Number(read.rot_w), Number(read.rot_h), mode);
      for (const cell of contains) {
        const drawn = xyxyPx(cell, Number(read.rot_w), Number(read.rot_h),
                             (Math.max.apply(null, cell.map(Number)) <= 1.0) ? 'norm1' : (read.coord || 'norm1000'));
        if (drawn[1] >= frame[3] || drawn[3] <= frame[1]) continue;      // not in this row to begin with
        rect = [Math.min(rect[0], drawn[0]), Math.min(rect[1], drawn[1]),
                Math.max(rect[2], drawn[2]), Math.max(rect[3], drawn[3])];
      }
    }"""
assert OLD_BODY in s
NEW_BODY = """    let rect = xyxyPx(b, Number(read.rot_w), Number(read.rot_h), mode);
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
    }"""
s = s.replace(OLD_BODY, NEW_BODY, 1)
s = s.replace("  const dropped = [];\n  const fn = (b, contains) => {",
              "  const dropped = [];\n  const snapped = snapLookup(read);          // engine Page.mask, precomputed by the helper\n"
              "  const fn = (b, contains) => {", 1)
OLD_FLAG = "      ink_snap: false, ink_snap_mode: 'off',        // a Code node has no image library: the flow is the off arm"
assert OLD_FLAG in s
s = s.replace(OLD_FLAG,
              "      // which arm of the R4-3c A/B made this payload (single_pass.py:748-749). The flow used to be\n"
              "      // hard-wired to the off arm; it now reports the mode the helper actually ran with.\n"
              "      ink_snap: snapArm(reads || []).mode !== 'off',\n"
              "      ink_snap_mode: snapArm(reads || []).mode,", 1)
wr(p, s)
print('OK: node 10 + src_extract wired to the snap helper')
