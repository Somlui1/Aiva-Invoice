// เก็บ "หัว" ของแต่ละ doc ลง staticData เพื่อรวมสรุปหลังจบ loop
// ทำไมต้องเก็บเอง: output 'done' ของ Loop Over Items จะคืน "item ต้นทาง" เท่านั้น
// ไม่ได้เอา output ของ body (node 23) ออกมาด้วย
// แยกกระเป๋าตาม $execution.id กันรอบที่ซ้อนกัน (queued/parallel execution) แย่งของกัน
const st = $getWorkflowStaticData('global');
const bag = (st[$execution.id] = st[$execution.id] || { done: [], skipped: [] });
const out = [];
for (const it of $input.all()) {
  const v = (it.json && it.json.verification) || {};
  bag.done.push({
    doc_id: v.doc_id || null,
    verdict: v.verdict || null,
    exception_codes: v.exception_codes || [],
    halted_by: v.halted_by || null,
    max_severity: v.max_severity || null,
    engine_ok: v.engine_ok === undefined ? null : v.engine_ok,
    cards: v.cards || 0,
    missing: v.missing === undefined ? null : v.missing,
    payload_sha256: v.payload_sha256 || null,
    oracle_queries: v.oracle_queries === undefined ? null : v.oracle_queries,
    elapsed_ms: v.elapsed_ms === undefined ? null : v.elapsed_ms,
    boxes_drawn: (v.bbox_debug && v.bbox_debug.boxes_drawn) || null,
    at: new Date().toISOString()
  });
  // คืน item เท่าเดิม/ลำดับเดิม เพื่อไม่ให้สถานะ loop เพี้ยน
  out.push({ json: Object.assign({ collected: bag.done.length }, it.json), binary: it.binary || {} });
}
return out;
