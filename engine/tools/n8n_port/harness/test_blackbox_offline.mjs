// ตรวจ blackbox.json ก่อน Import โดยไม่ต้องรันใน n8n:
//  1) โครงสร้าง: ทุก connection ชี้ไป node ที่มีจริง + ทุก node มี keys จำเป็น
//  2) jsCode ของทุก Code node ต้อง compile ได้ (async) — กัน typo จาก patch
//  3) รัน jsCode ของ node 22 (ฉบับ patch แล้ว) ด้วย envelope จำลอง -> ต้องส่ง overlay/img_w/img_h ต่อ
//  4) ส่งต่อให้ node 23 ของ parent -> payload ยังผ่าน schema + sha เดิม
import fs from 'node:fs';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const bb = JSON.parse(fs.readFileSync('blackbox.json', 'utf8'));
const byName = Object.fromEntries(bb.nodes.map((n) => [n['name'], n]));
let fail = 0;
const bad = (m) => { console.log('  ✗ ' + m); fail++; };

// 1) โครงสร้าง
const names = new Set(bb.nodes.map((n) => n.name));
for (const n of bb.nodes) {
  if (!n.type || !n.typeVersion || !n.position) bad('node ขาด field จำเป็น: ' + n.name);
  if (n.parameters === undefined) bad('node ไม่มี parameters: ' + n.name);
}
let edges = 0;
for (const [src, c] of Object.entries(bb.connections)) {
  if (!names.has(src)) bad('connection จาก node ไม่มีจริง: ' + src);
  for (const out of c.main || []) for (const t of out || []) {
    edges++;
    if (!names.has(t.node)) bad('connection ชี้ไป node ไม่มีจริง: ' + t.node);
  }
}
const roots = new Set(bb.nodes.map((n) => n.name));
for (const c of Object.values(bb.connections)) for (const out of c.main || []) for (const t of out || []) roots.delete(t.node);
console.log('โครงสร้าง : nodes=%d edges=%d roots=%s', bb.nodes.length, edges, [...roots].join(','));
// roots ต้องมี 2 ตัวเท่านั้ัน: trigger จริง (parent เรียก) + Manual Trigger สำรอง (เทสต์เดี่ยว)
const EXPECT_ROOTS = ['BB TRIGGER (doc_id from parent)', '00 MANUAL TEST (doc_id=89)'];
if ([...roots].sort().join('|') !== EXPECT_ROOTS.slice().sort().join('|')) bad('roots ต้องเป็น 2 trigger นี้เท่านั้น ได้เป็น ' + [...roots].join(','));
// Manual Trigger ต้องเข้าสายที่ 00 CONFIG ตัวเดียวกัน (ไม่งั้นเทสต์เดี่ยวไม่ผ่าน CONFIG)
const mc = (bb.connections['00 MANUAL TEST (doc_id=89)']?.main?.[0] || []).map((t) => t.node);
if (mc.length !== 1 || !mc[0].startsWith('00 CONFIG')) bad('Manual Trigger ไม่ต่อเข้า 00 CONFIG: ' + mc.join(','));

// 1b) node groups: 3 Stage + ทุก node อยู่ถูกที่ + trigger/CONFIG อยู่นอก group
const GROUP_NAMES = ['Stage 1 - Paperless + แยกหน้า', 'Stage 2 - OCR หน้า Invoice', 'Stage 3 - ประกอบ payload + validate'];
const G = bb.nodeGroups || [];
if (G.map((g) => g.name).join('|') !== GROUP_NAMES.join('|')) bad('nodeGroups ไม่ครบ/ชื่อต่าง: ' + G.map((g) => g.name).join(' | '));const inGroup = new Set(G.flatMap((g) => g.nodeNames));
for (const g of G) for (const x of g.nodeNames) if (!names.has(x)) bad('group ชี้ node ไม่มีจริง: ' + x);
const outside = bb.nodes.map((n) => n.name).filter((x) => !inGroup.has(x)).sort();
const EXPECT_OUT = ['00 CONFIG (single point)', '00 MANUAL TEST (doc_id=89)', 'BB TRIGGER (doc_id from parent)'];
if (outside.join('|') !== EXPECT_OUT.join('|')) bad('node นอก group ผิดคาดหวัง: ' + outside.join(','));
// group ต้องมี exit ไม่เกิน 1 เส้น ไม่งั้น n8n ลบ group ทิ้ง (เจอมาแล้วกับ parent)
for (const g of G) {
  const m = new Set(g.nodeNames);
  const ex = Object.entries(bb.connections).flatMap(([s, c]) =>
    m.has(s) ? (c.main || []).flatMap((o) => o || []).map((t) => t.node).filter((t) => !m.has(t)) : []);
  if (ex.length > 1) bad('group ' + g.name + ' มี exit ' + ex.length + ' เส้น (n8n จะลบ): ' + ex.join(','));
  else console.log('group      : ' + g.name.padEnd(34) + ' exit=' + (ex[0] || '(จบท้าย)'));
}

// 2) compile jsCode ทุก Code node (ไม่รัน)
for (const n of bb.nodes.filter((x) => x.type === 'n8n-nodes-base.code')) {
  const js = n.parameters.jsCode || '';
  try { new AsyncFunction('$input', '$', '$json', '$execution', '$workflow', js); console.log('compile    : ✓ %-38s %7s chars', n.name, js.length.toLocaleString()); }
  catch (e) { bad('jsCode compile ไม่ผ่าน [' + n.name + ']: ' + e.message); }
}

// 3) node 22 ฉบับ patch - รันจริงด้วย envelope จำลอง (รูปแบบ output ของ node 21)
const payload = JSON.parse(fs.readFileSync('fixtures/payload_inline_exec357.json', 'utf8'));
const $inputOf = (item) => ({ first: () => item });
const envelope = {
  ok: true, doc_id: '23',
  port: { mode: 'fixture:exec357 — DMS-23', elapsed_ms: 36, oracle_queries: 3, recommendation: 'MANUAL_REVIEW',
          halted_by: 'V-04', payload_sha256: payload.integrity.payload_sha256,
          parity_expected: payload.integrity.payload_sha256, parity_ok: true },
  steps: [], result: payload,
  images: { invoice_page: 1, overlay: [{ x0: 10, y0: 20, x1: 30, y1: 40, color: '#ff0000' }], img_w: 1240, img_h: 1754 },
};
// ใช้วิธีตรง: แยก body แล้วเรียกแบบ function ปกติ (jsCode ของ 22 ไม่มี await)
const body22 = byName['22 Verification report (9 rules)'].parameters.jsCode;
const out22 = new Function('$input', body22)($inputOf({ json: envelope, binary: { page_original: { id: 'p1' } } }))[0];
console.log('node 22    : cards=%s missing=%s verdict=%s overlay=%d img=%sx%s binary=%s',
  out22.json.cards, out22.json.missing, out22.json.verdict,
  out22.json.overlay.length, out22.json.img_w, out22.json.img_h, Object.keys(out22.binary || {}).join(','));
if (out22.json.cards !== 9 || out22.json.missing !== 0) bad('22 ตารางไม่ครบ');
if (out22.json.overlay.length !== 1 || out22.json.img_w !== 1240 || out22.json.img_h !== 1754) bad('22 ไม่ส่ง overlay/img_w/img_h ต่อ');
if (!out22.binary || !out22.binary.page_original) bad('22 ทำ binary หาย');
if (out22.json.result !== undefined) bad('22 ไม่ควรส่ง result ค้าง (ใช้ คีย์ engine)');

// 4) 11b จำลอง (อ่าน overlay จาก input) + node 23 ของ parent ต้องได้ payload + verification ครบ
const parent = JSON.parse(fs.readFileSync('parent_dump.json', 'utf8'));
const body23 = parent.nodes.find((n) => n.name.startsWith('23 Build API response')).parameters.jsCode;
// parent chain จริง: 22 -> 11a -> 11b -> 11c -> 23 ; 11a/11c เป็น GM node ที่คง json ไว้ จึงทดสอบข้ามได้
const out23 = new Function('$input', body23)($inputOf(out22))[0];
fs.writeFileSync('fixtures/api_response_blackbox.json', JSON.stringify(out23.json, null, 1));
console.log('node 23    : top-level keys=%d verification.rules=%d overlayตกถึงparent=%s',
  Object.keys(out23.json).length, out23.json.verification.rules.length, out22.json.overlay.length === 1);
if (!out23.json.verification || out23.json.verification.rules.length !== 9) bad('23 ไม่มี verification ครบ 9');
if (out23.json.integrity?.payload_sha256 !== payload.integrity.payload_sha256) bad('23 sha เปลี่ยน');
console.log(fail ? '\nFAIL %d ข้อ' : '\nALL PASS', fail);
