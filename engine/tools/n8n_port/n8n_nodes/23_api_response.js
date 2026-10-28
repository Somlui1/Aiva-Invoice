// ก้อนสุดท้ายที่ frontend อ่าน - อ่านจาก input ทั้งหมด ไม่มี $('...') จึงย้ายข้าม workflow ได้
// exec 402 พบว่า bbox_debug หายเพราะ node นี้ spread เฉพาะ payload -> ย้าย metadata การวาดเข้าใน verification แทน
// payload aiva.system_a.result/3.0 วางระดับบนสุด + ต่อ key verification (ผ่าน schemas/result-3.0.schema.json)
const IN = $input.first().json || {};
const payload = IN.engine || IN.result || (IN.rule_results ? IN : {});
return [{
  json: {
    ...payload,
    verification: {
      source: 'blackbox (Stage 1-3 + validate) -> 14 Merge -> 23',
      engine_ok: IN.engine_ok === undefined ? null : IN.engine_ok,
      engine_source: IN.engine_source || null,
      mode: IN.mode || null,
      doc_id: IN.doc_id || null,
      parity_ok: IN.parity_ok === undefined ? null : IN.parity_ok,
      parity_expected: IN.parity_expected || null,
      payload_sha256: IN.payload_sha256 || null,
      oracle_queries: IN.oracle_queries === undefined ? null : IN.oracle_queries,
      elapsed_ms: IN.elapsed_ms === undefined ? null : IN.elapsed_ms,
      verdict: IN.verdict || null,
      halted_by: IN.halted_by || null,
      max_severity: IN.max_severity || null,
      exception_codes: IN.exception_codes || [],
      cards: IN.cards || 0,
      missing: IN.missing === undefined ? null : IN.missing,
      report_text: IN.report_text || '',
      bbox_debug: IN.bbox_debug || null,   // metadata จาก 11b: boxes_drawn / thickness_px / ขนาดภาพ
      rules: IN.table || []
    }
  },
  binary: $input.first().binary || {}
}];
