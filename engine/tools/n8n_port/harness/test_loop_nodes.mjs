// unit test โหนด loop ตัวใหม่ด้วย input สังเคราะห์ — ไม่แตะ n8n, ไม่รัน workflow
// mock เฉพาะ API ที่ Code node ใช้: $input, $getWorkflowStaticData, $execution, console
import fs from 'node:fs';
const D = 'n8n_nodes/loop/';
const load = (f) => fs.readFileSync(D + f, 'utf8');
const run = (code, { items = [], static_ = {}, execId = 'exec-test' } = {}) =>
  new Function('$input', '$getWorkflowStaticData', '$execution', 'console', code)(
    { all: () => items, first: () => items[0] },
    () => static_,
    { id: execId },
    { log: () => {}, warn: () => {} });
let fail = 0; const ok = (c, m) => { console.log((c ? '  OK   ' : '  FAIL ') + m); if (!c) fail++; };
const I = (json, binary) => ({ json, binary: binary || {} });

console.log('== 01c Map to doc_id ==');
let o = run(load('01c_map_doc_id.js'), { items: [I({ id: 89, title: 'INV-89', tags: [5] }), I({ id: 90, title_or_file_name: 'f90.pdf' }), I({ title: 'ไม่มี id ไม่มี' })] });
ok(o.length === 2, 'ทิ้ง item ไม่มี id (3 เข้า -> 2 ออก) ได้ ' + o.length);
ok(o[0].json.doc_id === '89' && o[0].json.title === 'INV-89', 'doc_id เป็น string + title มาถูก: ' + JSON.stringify(o[0].json));
ok(o[1].json.title === 'f90.pdf', 'title ตกไปใช้ title_or_file_name');
try { run(load('01c_map_doc_id.js'), { items: [I({ foo: 1 })] }); ok(false, 'ต้อง throw เมื่อไม่มีเอกสารเลย'); }
catch (e) { ok(true, 'throw เมื่อไม่พบเอกสาร: ' + e.message.slice(0, 40)); }

console.log('== 04 Alias page key (batch 5 item) ==');
const bin5 = Array.from({ length: 5 }, (_, i) => I({ doc_id: String(90 + i) }, { page_original: { id: 'p' + i } }));
const broken = I({ doc_id: '95', error: 'sub-workflow failed: HTTP 500' }, {});
o = run(load('04_alias_page_key.js'), { items: [...bin5, broken] });
ok(o.length === 6, 'จำนวน item คงเดิม 6: ' + o.length);
ok(o.slice(0, 5).every((x) => x.json.bb_ok === true && x.binary.page && x.binary.page.id.startsWith('p')), 'ทั้ง 5 มี bb_ok=true + alias page');
ok(o[5].json.bb_ok === false && /HTTP 500/.test(o[5].json.bb_skip_reason), 'doc พัง -> bb_ok=false + เหตุผลจาก error: ' + o[5].json.bb_skip_reason);
ok(o[0].json.doc_id === '90' && o[4].json.doc_id === '94', 'doc_id รายตัวไม่ตกหล่น (สำคัญ: เวอร์ชันเก่าใช้ .first() แล้วหายหมด)');

console.log('== 04c Log doc ที่ข้าม (staticData bag) ==');
// โหนดทั้ง 3 ตัวใช้ st[$execution.id] เป็นกระเป๋า => mock ต้องเป็น global ที่ยังว่าง
const st1 = {};
run(load('04c_log_skipped.js'), { items: [I({ doc_id: '95', bb_ok: false, bb_skip_reason: 'sub-workflow failed: HTTP 500' })], static_: st1 });
const bag1 = st1['exec-test'];
ok(!!bag1 && bag1.skipped.length === 1 && bag1.skipped[0].doc_id === '95', 'สร้างกระเป๋าตาม exec.id + จด doc ที่ข้าม: ' + JSON.stringify(bag1 && bag1.skipped[0]).slice(0, 60));
run(load('15_collect_result.js'), { items: [I({ verification: { doc_id: '89', verdict: 'HOLD' } })], static_: st1 });
ok(st1['exec-test'].done.length === 1, '15 เขียนกระเป๋าใบเดียวกัน (global -> exec.id) ได้: done=' + st1['exec-test'].done.length);

console.log('== 13 Pick this doc ==');
o = run(load('13_pick_this_doc.js'), { items: [I({ doc_id: '91', overlay: [1, 2] }, { page: { id: 'p' } })] });
ok(o.length === 1 && o[0].json.doc_id === '91' && o[0].json.debug_step === '13', 'คืน 1 item + ติด anchor');
ok(!!o[0].binary.page, 'binary ติดไปด้วย (11a ต้องอ่านได้)');

console.log('== 15 Collect result (ต่อจาก 23) ==');
const st2 = {};
const doc = (id, v) => I({ doc_id: id, verification: { doc_id: id, verdict: v, exception_codes: ['E01'], cards: 9, missing: 0, payload_sha256: 'sha:' + id, elapsed_ms: 2600, bbox_debug: { boxes_drawn: 20 } } }, { annotated: { id: 'a' + id } });
o = run(load('15_collect_result.js'), { items: [doc('89', 'HOLD'), doc('90', 'AUTO_PASS')], static_: st2 });
const bag2 = st2['exec-test'];
ok(bag2.done.length === 2, 'เก็บ 2 doc ลง bag: ' + bag2.done.length);
ok(bag2.done[0].verdict === 'HOLD' && bag2.done[1].payload_sha256 === 'sha:90' && bag2.done[0].boxes_drawn === 20, 'หัวผลครบ verdict/sha/boxes_drawn');
ok(o.length === 2 && o[1].json.doc_id === '90' && o[0].binary.annotated, 'จำนวน item + binary คงเดิม (loop ไม่เพี้ยน)');

console.log('== 16 Final summary ==');
const st3 = { 'exec-test': { done: bag2.done, skipped: [{ doc_id: '95', reason: 'HTTP 500' }] } };
o = run(load('16_final_summary.js'), { items: ['89', '90', '95', '96'].map((d) => I({ doc_id: d, title: 'T' + d })), static_: st3 });
const s = o[0].json;
ok(s.total_docs_from_paperless === 4 && s.processed === 2 && s.skipped === 1, 'นับ 4/2/1 ถูก: ' + [s.total_docs_from_paperless, s.processed, s.skipped].join('/'));
ok(s.never_touched.join(',') === '96', 'จับ doc ที่ไม่เคยถูกแตะ = [96]: ' + JSON.stringify(s.never_touched));
ok(s.verdict_counts.HOLD === 1 && s.verdict_counts.AUTO_PASS === 1, 'verdict_counts: ' + JSON.stringify(s.verdict_counts));
ok(s.results.length === 2 && s.skipped_detail.length === 1, 'results + skipped_detail ติดมาใน response');
ok(st3['exec-test'] === undefined, 'เคลียร์กระเป๋าของ exec นี้หลังสรุปเสร็จ (ไม่เก็บข้ามรอบ)');
console.log(fail ? '\nFAIL ' + fail : '\nALL PASS 0');
process.exit(fail ? 1 : 0);
