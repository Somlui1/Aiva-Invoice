// Draw bbox OUTLINES in pure JavaScript inside the Code node - no require, no image library,
// nothing running outside n8n. Edit Image can only FILL a rectangle (its draw op calls
// gmInstance.fill(color) before drawRectangle), so each frame is written pixel by pixel here.
// Node 11a re-encodes the page as an uncompressed BMP, this node edits those pixels and writes
// a new BMP, node 11c re-encodes that to JPEG. Thickness = engine overlay
// (scripts/run_single_pass.py -> ImageDraw.rectangle(..., outline=color, width=3)).
const THICK = 3;
const item = $input.first();
const bin = item.binary || {};
let srcKey = bin.bmp ? 'bmp' : Object.keys(bin).find((k) => bin[k].mimeType === 'image/bmp') || null;
if (!srcKey) throw new Error('no BMP binary from node 11a, saw keys: ' + Object.keys(bin).join(','));
const raw = await this.helpers.getBinaryDataBuffer(0, srcKey);
const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
let biSize = 0;
let W = 0;
let H = 0;
let bpp = 0;
let comp = 0;
let clrUsed = 0;
let pixOff = 0;
let stride = 0;
const hx = [];
for (let i = 0; i < 34 && i < dv.byteLength; i++) hx.push(dv.getUint8(i).toString(16).padStart(2, '0'));
function lay(m) {
  return m + ' | biSize=' + biSize + ' W=' + W + ' H=' + H + ' bpp=' + bpp + ' comp=' + comp +
    ' clrUsed=' + clrUsed + ' pixOff=' + pixOff + ' stride=' + stride + ' bytes=' + dv.byteLength +
    ' | bytes: ' + hx.join(' ');
}
if (dv.byteLength < 54 || dv.getUint8(0) !== 0x42 || dv.getUint8(1) !== 0x4D) throw new Error(lay('input is not a BMP'));
biSize = dv.getUint32(14, true);
pixOff = dv.getUint32(10, true);
if (biSize === 12) {
  W = dv.getInt16(18, true);
  H = dv.getInt16(20, true);
  bpp = dv.getUint16(24, true);
} else {
  W = dv.getInt32(18, true);
  H = dv.getInt32(22, true);
  bpp = dv.getUint16(28, true);
  comp = dv.getUint32(30, true);
  clrUsed = dv.getUint32(32, true);
}
const topDown = H < 0;
if (topDown) H = -H;
stride = Math.floor((W * bpp + 31) / 32) * 4;
if (comp !== 0) throw new Error(lay('compressed BMP not supported'));
if ([1, 8, 24, 32].indexOf(bpp) < 0) throw new Error(lay('unsupported BMP bit depth'));
if (!W || !H || pixOff + stride * H > dv.byteLength) throw new Error(lay('bad BMP size or pixel offset'));
const palStep = biSize === 12 ? 3 : 4;
const palOff = 14 + biSize;
let palCount = clrUsed || (bpp < 24 ? 1 << bpp : 0);
while (palCount > 0 && palOff + palCount * palStep > dv.byteLength) palCount--;
const pal = [];
for (let i = 0; i < palCount; i++) {
  const o = palOff + i * palStep;
  pal.push([dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2)]);
}

// read into a tight top-down RGB buffer so painting is simple
const px = new Uint8Array(W * H * 3);
for (let y = 0; y < H; y++) {
  const rowStart = pixOff + (topDown ? y : H - 1 - y) * stride;
  for (let x = 0; x < W; x++) {
    const d = (y * W + x) * 3;
    let r = 0;
    let g = 0;
    let b = 0;
    if (bpp >= 24) {
      const s = rowStart + x * (bpp / 8);
      b = dv.getUint8(s);
      g = dv.getUint8(s + 1);
      r = dv.getUint8(s + 2);
    } else if (bpp === 8) {
      const c = pal[dv.getUint8(rowStart + x)] || [0, 0, 0];
      b = c[0]; g = c[1]; r = c[2];
    } else {
      const c = pal[(dv.getUint8(rowStart + Math.floor(x / 8)) >> (7 - x % 8)) & 1] || [0, 0, 0];
      b = c[0]; g = c[1]; r = c[2];
    }
    px[d] = r;
    px[d + 1] = g;
    px[d + 2] = b;
  }
}

function toRgb(hex) {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function paint(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const d = (y * W + x) * 3;
  px[d] = c[0];
  px[d + 1] = c[1];
  px[d + 2] = c[2];
}

function barH(y, x0, x1, c) {
  for (let x = x0; x <= x1; x++) for (let t = 0; t < THICK; t++) paint(x, y + t, c);
}

function barV(x, y0, y1, c) {
  for (let y = y0; y <= y1; y++) for (let t = 0; t < THICK; t++) paint(x + t, y, c);
}

const boxes = Array.isArray(item.json.overlay) ? item.json.overlay : [];
let drawn = 0;
let skipped = 0;
for (const bx of boxes) {
  const x0 = Math.round(bx.x0);
  const y0 = Math.round(bx.y0);
  const x1 = Math.round(bx.x1);
  const y1 = Math.round(bx.y1);
  if (!(x1 > x0 + 1 && y1 > y0 + 1)) { skipped++; continue; }   // node 10 pads unused slots as 1x1
  const c = toRgb(bx.color);
  barH(y0, x0, x1, c);
  barH(Math.max(y0, y1 - THICK + 1), x0, x1, c);
  barV(x0, y0, y1, c);
  barV(Math.max(x0, x1 - THICK + 1), y0, y1, c);
  drawn++;
}
if (!drawn) throw new Error(lay('no drawable box on the overlay array'));

// write a 24-bit bottom-up BMP, no compression
const rowPad = Math.floor((W * 3 + 3) / 4) * 4;
const fileSize = 54 + rowPad * H;
const out = new Uint8Array(fileSize);
const ov = new DataView(out.buffer);
out[0] = 0x42;
out[1] = 0x4D;
ov.setUint32(2, fileSize, true);
ov.setUint32(10, 54, true);
ov.setUint32(14, 40, true);
ov.setInt32(18, W, true);
ov.setInt32(22, H, true);
ov.setUint16(26, 1, true);
ov.setUint16(28, 24, true);
ov.setUint32(30, 0, true);
ov.setUint32(34, rowPad * H, true);
ov.setInt32(38, 2835, true);
ov.setInt32(42, 2835, true);
for (let y = 0; y < H; y++) {
  const dst = 54 + (H - 1 - y) * rowPad;
  for (let x = 0; x < W; x++) {
    const s = (y * W + x) * 3;
    const d = dst + x * 3;
    out[d] = px[s + 2];
    out[d + 1] = px[s + 1];
    out[d + 2] = px[s];
  }
}
const payload = typeof Buffer !== 'undefined' ? Buffer.from(out.buffer, out.byteOffset, out.byteLength) : out;
const prepared = await this.helpers.prepareBinaryData(payload, 'invoice_annotated.bmp', 'image/bmp');

// node 12 reads node 10 by name and only consumes binaries, so this json stays small
return [{
  json: {
    ok: true,
    step: '11b',
    how: 'pure JS BMP pixel writer inside the Code node',
    source_key: srcKey,
    width: W,
    height: H,
    bpp_in: bpp,
    bi_size: biSize,
    pixel_offset: pixOff,
    row_stride: stride,
    palette_used: palCount,
    compression_in: comp,
    top_down_in: topDown,
    thickness_px: THICK,
    boxes_drawn: drawn,
    slots_skipped: skipped,
    bmp_bytes_out: fileSize
  },
  binary: { page: bin.page, annotated_bmp: prepared }
}];