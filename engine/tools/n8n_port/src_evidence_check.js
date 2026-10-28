// src_evidence_check.js — port of engine/src/system_a/application/evidence_check.py (77 lines, pure).
//
// Why it belongs in node 21 and not only in node 22: the ENGINE writes the result into the payload it sends
// (assembler.py:278 -> payload["metrics"]["evidence_violations"]). Portal reads that key. A flow that runs
// the same nine rules in a downstream report node but leaves the key out of the payload is not equivalent —
// the payload would be missing a field the consumer is allowed to depend on.
//
// Read-only and non-raising, same as the engine's warn mode. The engine's AIVA_EVIDENCE_STRICT=1 arm raises
// in tests/CI only; in n8n a throw inside a Code node loses the whole document, so the strict arm stays on
// the engine side and the flow always ships the payload plus its violations.
const REASONS = ['PAGES_INCOMPLETE', 'NOT_PRESENT', 'LOW_CONFIDENCE', 'NOT_LOCATED', 'NO_ELEMENT'];
const MAX_ELEMENTS_PER_FINDING = 12;                     // advisory only (R2)

function checkEvidence(payload) {
  const out = [];
  const v = (code, xid, detail) => { out.push({ code, evidence_id: xid, detail }); };
  const els = {};
  for (const e of ((payload || {}).ocr || {}).elements || []) els[(e || {}).element_id] = true;
  const seen = {}, byId = {};
  for (const e of (payload || {}).evidence || []) {
    const xid = e.evidence_id;
    if (!xid || seen[xid]) v('R1_EVIDENCE_ID', xid, 'missing or duplicate evidence_id');
    seen[xid] = true;
    byId[xid] = e;
    const boxes = e.bboxes || [];
    const reason = e.bbox_missing_reason;
    if (!boxes.length && !reason) {
      v('R3_NO_LOCATION_NO_REASON', xid, `${e.rule_id}: no bbox and no bbox_missing_reason`);
    }
    if (reason && REASONS.indexOf(reason.reason) < 0) v('R4_BAD_REASON', xid, `reason=${JSON.stringify(reason.reason)}`);
    const pages = Object.keys(boxes.reduce((m, b) => { m[b.page_no] = true; return m; }, {}))
      .sort((a, b) => (isNaN(Number(a)) || isNaN(Number(b)) ? String(a).localeCompare(String(b)) : Number(a) - Number(b)))
      .map((p) => (isNaN(Number(p)) ? p : Number(p)));
    // Python sorted({b["page_no"]}) over ints; JSON turns page_no into string keys, so sort numerically and
    // put None where Python would (None sorts first). Keep it explicit rather than relying on key order.
    const hasNone = boxes.some((b) => b.page_no === null || b.page_no === undefined);
    const pyPages = hasNone ? [null].concat(pages) : pages;
    if (JSON.stringify(e.page_no || []) !== JSON.stringify(pyPages)) {
      v('R5_PAGE_MISMATCH', xid, `page_no=${JSON.stringify(e.page_no)} bboxes=${JSON.stringify(pyPages)}`);
    }
    const related = e.related_element_ids || [];
    const unknown = related.filter((i) => !els[i]).slice(0, 5);
    if (unknown.length) v('R6_UNKNOWN_ELEMENT', xid, unknown.join(', '));
    if (related.length > MAX_ELEMENTS_PER_FINDING) v('R2_WIDE_FINDING', xid, `${related.length} elements`);
  }
  for (const r of (payload || {}).rule_results || []) {
    const ev = (r.evidence_ids || []).map((i) => byId[i]).filter(Boolean);
    if (r.result === 'manual_review' && !ev.length) v('R7_REVIEW_WITHOUT_EVIDENCE', null, r.rule_id);
    if (r.result === 'fail' && !ev.some((x) => x && x.exception_code)) v('R8_FAIL_WITHOUT_EVIDENCE', null, r.rule_id);
  }
  for (const e of ((payload || {}).ocr || {}).elements || []) {
    const fn = String(e.field_name || '');
    if (fn.indexOf('signatures.') === 0 && !(e.normalized_value === true || e.normalized_value === false
      || e.normalized_value === null)) {
      v('R10_SIGNATURE_NOT_BOOL', null, `${e.element_id}=${JSON.stringify(e.normalized_value)}`);
    }
  }
  return out;
}
