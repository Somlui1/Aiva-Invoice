// สรุปทั้งรอบ (ต่อจาก output 'done' ของ LOOP 5 docs ซึ่งคืน item ต้นทางทุกฉบับ)
// node 23 ราย doc ยังดูได้จาก execution ของแต่ละ iteration ที่นี่รวมเฉพาะ header ให้ frontend/table
const st = $getWorkflowStaticData('global');
const bag = st[$execution.id] || { done: [], skipped: [] };
const docs = $input.all().map((i) => i.json);
const doneIds = new Set(bag.done.map((x) => String(x.doc_id)));
const skipIds = new Set(bag.skipped.map((x) => String(x.doc_id)));
const summary = {
  ok: true,
  source: 'staticData keyed by $execution.id',
  total_docs_from_paperless: docs.length,
  processed: bag.done.length,
  skipped: bag.skipped.length,
  never_touched: docs.filter((d) => !doneIds.has(String(d.doc_id)) && !skipIds.has(String(d.doc_id))).map((d) => d.doc_id),
  verdict_counts: bag.done.reduce((m, x) => { m[x.verdict] = (m[x.verdict] || 0) + 1; return m; }, {}),
  results: bag.done,
  skipped_detail: bag.skipped,
  docs: docs.map((d) => ({ doc_id: d.doc_id, title: d.title }))
};
delete st[$execution.id];   // เคลียร์กระเป๋า กันโตข้ามรอบ
return [{ json: summary }];
