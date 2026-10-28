// ทดสอบ 01c กับ shape จริงของ Paperless (ยืนยันจาก API: total=275, results=[{id,title,tags}])
import fs from 'node:fs';
const code = fs.readFileSync('n8n_nodes/loop/01c_map_doc_id.js', 'utf8');
const run = (items) => new Function('$input', 'console', code)(
  { all: () => items, first: () => items[0] }, { log: () => {}, warn: () => {} });
let fail = 0; const ok = (c, m) => { console.log((c ? '  OK   ' : '  FAIL ') + m); if (!c) fail++; };
const I = (json) => ({ json, binary: {} });

// เคส 1: shape จริงที่พัง — pagination ทั้งก้อนเป็น 1 item (ตัวที่ user เจอ)
const wrapper = I({ count: 275, next: 'http://…/api/documents/?page=2', previous: null,
  all: [287, 282], results: [
    { id: 287, title: 'DOC171026-A', tags: [11, 5] },
    { id: 282, title: 'DOC171026-B', tags: [11, 5] }] });
let o = run([wrapper]);
ok(o.length === 2, 'คลี่ pagination wrapper -> 2 item (ไม่ติด item เข้า=1 อีกแล้ว): ' + o.length);
ok(o.map((x) => x.json.doc_id).join(',') === '287,282', 'doc_id มาถูก + ไม่ซ้ำกับ all[]: ' + o.map((x) => x.json.doc_id).join(','));
ok(o[0].json.title === 'DOC171026-A', 'title มาพร้อม');

// เคส 2: node เวอร์ชันแยก 1 item/เอกสาร (still supported)
o = run([I({ id: 89, title: 'INV-89', tags: [5] }), I({ id: 90 })]);
ok(o.length === 2 && o[0].json.doc_id === '89', 'ยังรองรับแบบ 1 item/เอกสาร: ' + o.length);

// เคส 3: คืน array ใต้ key อื่น
o = run([I({ documents: [{ document_id: 7 }] })]);
ok(o.length === 1 && o[0].json.doc_id === '7', 'รองรับ key documents + document_id: ' + JSON.stringify(o[0] && o[0].json));

// เคส 4: คืน id ล้วน (all[])
o = run([I({ all: null, results: [42] })]);
ok(o.length === 1 && o[0].json.doc_id === '42', 'รองรับ row เป็น number: ' + JSON.stringify(o[0] && o[0].json));

// เคส 5: พังจริง -> error ต้องบอก key ให้เจาะได้
try { run([I({ foo: 1, bar: [2] })]); ok(false, 'ต้อง throw'); }
catch (e) { ok(/key ที่เห็น=foo\|bar/.test(e.message), 'error บอก key จริงของ item: ' + e.message.slice(0, 96)); }
console.log(fail ? '\nFAIL ' + fail : '\nALL PASS 0');
process.exit(fail ? 1 : 0);
