# 9 Verification Cards Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** เพิ่ม 10 node read-only ต่อท้าย `21 Validate (port)` เพื่อแสดงการตรวจ V-01…V-09 เป็นการ์ดทีละข้อ โดยไม่แตะ logic ของ engine เลย

**Architecture:** node 21 คงเป็น Code node ก้อนเดียว (parity พิสูจน์แล้ว) · การ์ด 9 ใบเรียง **อนุกรม** ตามลำดับที่ engine ประเมินจริง และอ่าน payload ด้วย `$('21 Validate (port)')` (node reference) ไม่ได้ส่ง payload ต่อทอดกัน ⇒ item ในสายเล็กตลอดสาย · node 22 รวมผลเป็นตาราง + `report_text`

**Tech Stack:** n8n Code node (JS, sandbox ไม่มี `require`), MCP `aiva-n8n_update_workflow` / `get_workflow_execution`, Python venv สำหรับ diff หลักฐาน

**Design:** `docs/plans/2026-10-19-verify-nine-cards-design.md`

---

## Template ของการ์ด (ใช้ซ้ำ 9 ใบ ต่างกันแค่ 4 ค่า)

```js
// Verification card <N>/9 — <RID> read-only: อ่าน payload จาก node 21 ด้วย node reference
// ไม่ได้คำนวณอะไรเลย จึงไม่มีทางทำให้ผล engine เปลี่ยน (ดู docs/plans/2026-10-19-verify-nine-cards-design.md)
const RID = '<RID>';
const META = { rule_name: '<FN>', step: <STEP>, engine: '<ENGINE>', gate: <GATE> };
const src = $('21 Validate (port)').first().json;
const p = src.payload || null;
const prev = Array.isArray($input.first().json.rules) ? $input.first().json.rules : [];
const card = { rule_id: RID, ...META, rule_version: null, result: 'not_evaluated', halted_by: null,
  detail: 'no payload from node 21', exceptions: [], evidence_ids: [], data: null };
if (p) {
  const r = (p.rule_results || []).find((x) => x.rule_id === RID);
  if (r) {
    card.rule_version = r.rule_version;
    card.result = r.result;
    card.halted_by = r.halted_by;
    card.detail = r.detail;
    card.evidence_ids = r.evidence_ids || [];
    card.data = r.data || null;
    card.exceptions = (p.exceptions || []).filter((e) => e.rule_id === RID)
      .map((e) => ({ code: e.code, name: e.name, severity: e.severity }));
  } else {
    card.detail = 'engine did not return this rule';
  }
}
return [{ json: { ok: true, from: '21 Validate (port)', card_of: <N>, rules: [...prev, card] } }];
```

ตารางค่าที่ต่างกัน 9 แถว (ถอดจาก `standard.json` ของ Standard v6.6 + ชื่อฟังก์ชันใน
`src/system_a/domain/rules.py` — **ไม่ตั้งชื่อ rule เอง**, Standard ไม่มี field ชื่อ):

| node | RID | FN | STEP | ENGINE | GATE | ลำดับที่ engine ประเมิน |
|---|---|---|---|---|---|---|
| 20a V-01 required fields | V-01 | v01_required | 1 | logic | false | 1 |
| 20b V-02 line math | V-02 | v02_line_math | 1 | logic | **true** | 2 |
| 20c V-03 doc totals | V-03 | v03_doc_totals | 1 | logic | false | 3 |
| 20d V-06 signatures | V-06 | v06_signatures | 1 | logic+vision | false | 4 |
| 20e V-04 receipt | V-04 | v04_receipt | 2 | logic | false | 5 |
| 20f V-05 customer | V-05 | v05_customer | 2 | logic+ai | false | 6 |
| 20g V-07 line match | V-07 | v07_line_match | 3 | logic(M1)+ai(M3/M4/M5) | false | 7 |
| 20h V-08 quantity | V-08 | v08_quantity | 3 | logic | false | 8 |
| 20i V-09 total vs receipt | V-09 | v09_total_vs_receipt | 3 | logic | false | 9 |

## node 22 Verification report (9 rules)

```js
// รวม 9 การ์ดเป็นตาราง + ข้อความอ่านง่าย — อ่านอย่างเดียว ไม่คำนวณ verdict ใหม่
const src = $('21 Validate (port)').first().json;
const p = src.payload || {};
const rec = p.recommendation || {};
const rules = Array.isArray($input.first().json.rules) ? $input.first().json.rules : [];
const line = (r) => '[' + r.rule_id + '] ' + r.rule_name + '  ' + r.result +
  (r.halted_by ? '  halted_by=' + r.halted_by : '') + '  ' +
  r.exceptions.map((e) => e.code + ':' + e.severity).join(' ') +
  (r.detail ? '  — ' + r.detail : '');
return [{ json: {
  ok: true, mode: src.mode || null, doc_id: src.doc_id || null,
  parity_ok: src.parity_ok === undefined ? null : src.parity_ok,
  payload_sha256: src.payload_sha256 || null,
  verdict: rec.value || null, halted_by: rec.halted_by || null,
  max_severity: rec.max_severity || null, exception_codes: rec.exception_codes || [],
  cards: rules.length, missing: 9 - rules.length, table: rules,
  report_text: rules.map(line).join('\n')
} }];
```

---

### Task 1: inject 10 nodes + group เดียว

**Files:** แก้ใน n8n เท่านั้น (workflow `soWzNNLrZ1c4Absf`) · อ้างอิง template ด้านบน

**Step 1:** เรียก `aiva-n8n_update_workflow` 1 ครั้งด้วย ops:
`addNode` × 10 (type `n8n-nodes-base.code`, typeVersion 2, `mode: runOnceForAllItems`, position พาด
เป็นแถวใต้ node 21) + `addConnection` `21 → 20a → … → 20i → 22` (สายเดิม `21 → 13` คงไว้)

**Step 2:** ตรวจว่า nodeCount = 28 และ `validationWarnings` ไม่มี `DISCONNECTED_NODE` /
`INVALID_CONNECTION` (warning `TOP_LEVEL_ITEMS_OVER_CEILING` เดิมควรลดลง/หมดไป เพราะต่อสายเป็น
กิ่งเดียวแล้ว)

### Task 2: validate graph ก่อนรัน

**Step 1:** `aiva-n8n_validate_workflow` (workflowId เดิม)
**Step 2:** Expected: `valid: true`, ไม่มี error เกี่ยวกับ node ใหม่ (ถ้ามี error ให้แก้ก่อนไป Task 3)

### Task 3: รันด้วย fixture mode (เร็ว ฟรี ไม่แตะ Oracle)

**Pre-req:** `fixtureCase` ยังเป็น `'exec357'` อยู่ (ยังไม่ต้องแก้) ⇒ node 21 replay tape, ~36 ms

**Step 1:** `aiva-n8n_execute_workflow` mode `manual` → จำ executionId
**Step 2:** `get_workflow_execution` `includeData:false` → Expected `status: success`
**Step 3:** `get_workflow_execution` `includeData:true`, `nodeNames:["22 Verification report (9 rules)"]`,
`truncateData: 200` → Expected `cards: 9`, `missing: 0`, `verdict: "MANUAL_REVIEW"`,
`halted_by: "V-04"`, `payload_sha256: "sha256:0a9446bd6ecf1993…"`
**Step 4:** ถ้ามี node fail: ตั้ง `onError: continueRegularOutput` ชั่วคราวที่ node นั้นแล้วรันซ้ำ
เพื่อให้อ่าน error จาก item เล็ก ๆ (เทคนิคที่ใช้ได้ผลกับ exec 378/379/381) แล้วถอดคืน

### Task 4: เทียบ 9 ข้อกับ output ของ engine (หลักฐาน field-by-field)

**Files:**
- Expected: `engine/temp/n8n_port/fixtures/payload_inline_exec357.json`
- Create: `engine/temp/n8n_port/fixtures/cards_exec357.json` (วาง `table` ที่ copy มาจาก node 22)

**Step 1:** save `table` ของ node 22 ลง `fixtures/cards_exec357.json`
**Step 2:** รัน

```bash
cd engine && src/test-portal/.venv/Scripts/python.exe - <<'EOF'
import json
cards = json.load(open('temp/n8n_port/fixtures/cards_exec357.json', encoding='utf-8'))
eng = {r['rule_id']: r for r in json.load(open(
    'temp/n8n_port/fixtures/payload_inline_exec357.json', encoding='utf-8'))['rule_results']}
exc = json.load(open('temp/n8n_port/fixtures/payload_inline_exec357.json', encoding='utf-8'))['exceptions']
bad = 0
for c in cards:
    e = eng.get(c['rule_id'])
    want = sorted(x['code'] + ':' + x['severity'] for x in exc if x.get('rule_id') == c['rule_id'])
    got = sorted(e2['code'] + ':' + e2['severity'] for e2 in c['exceptions'])
    okc = e and c['result'] == e['result'] and c['halted_by'] == e.get('halted_by') and want == got \
          and c['rule_version'] == e['rule_version'] and (c['detail'] or None) == (e.get('detail') or None)
    bad += 0 if okc else 1
    print(('OK  ' if okc else 'DIFF'), c['rule_id'], c['result'], c['halted_by'], got)
print('CARDS:', len(cards), 'DIFFS:', bad, 'ALL MATCH:', bool(len(cards) == 9 and bad == 0))
EOF
```

Expected: `CARDS: 9 DIFFS: 0 ALL MATCH: True`

### Task 5: หลักฐาน live + ปิดงาน

**Step 1:** ผู้ใช้แก้ node 21 `SECTION A` บรรทัด 69 → `fixtureCase: '',`
**Step 2:** รันซ้ำ → node 22 ต้องขึ้น `mode: "live"`, `parity_ok: null/true`, `cards: 9`, verdict ตามจริง
**Step 3:** อัปเดต `engine/docs/plans/task.md` (แถว `n8n Task 12`) + `engine/temp/n8n_port/STATUS.md`
**Step 4:** `git add docs/plans/ && git commit -m "docs(n8n): nine verification cards design + plan"`
(โค้ด การ์ด อยู่ใน workflow + template ในไฟล์ plan นี้ — ไม่เพิ่มไฟล์ใน repo ที่ซ้ำซ้อน)

---

## หมายเหตุความสอดคล้อง (parity)

* การ์ด **ไม่ import ไม่คำนวณ money ไม่แตะ hash** ⇒ ไม่มีทางทำให้ `payload_sha256` เปลี่ยน
* `step`/`engine`/`gate` เป็น display metadata ที่ hard-map จาก Standard v6.6 ถ้ายก version เป็น v6.7
  แล้วลืมแก้ → เพี้ยนแค่ label (ยังเห็นเพราะ `rule_version` มาจาก engine จริง)
* node 22 ส่งออก `payload_sha256` ของ node 21 ด้วยเสมอ ⇒ ยืนยันได้ว่า 9 ข้อนี้คือผลของ payload
  ชุดเดียวกับที่ถูก hash

---

## Results (2026-10-20)

* Task 1-2: inject สำเร็จ nodeCount 18 → 28 (group `VERIFY 9 ขอ (read-only`) · op แรกถูก reject
  เพราะ `addNodeGroup` ขาด field `name` (atomic ⇒ ไม่เซฟครึ่งก้อน)
* Task 3: exec 386 = **bug ที่จับได้จริง** ทุกการ์ดออก `not_evaluated / no payload from node 21`
  เพราะอ่าน `json.payload` ซึ่งไม่มีอยู่ · node 21 วาง payload ที่ **`json.result`** และ meta ที่
  **`json.port`** ⇒ แก้ 10 node ด้วย `setNodeParameter /jsCode`
* Task 3 (rerun): exec 387 `status: success`, `cards: 9`, `missing: 0`, `parity_ok: true`,
  `payload_sha256 == parity_expected == sha256:0a9446bd6ecf1993…`, verdict `MANUAL_REVIEW`,
  `halted_by: V-04`, codes `E01,E03`
* Task 4: diff ที้ละข้อกับ `fixtures/payload_inline_exec357.json` → **`CARDS: 9 DIFFS: 0
  ALL MATCH: True`** หลักฐานเก็บที่ `temp/n8n_port/fixtures/cards_exec357.json`
* Task 5: ยังค้าง 1 ขั้นของผู้ใช้ — `fixtureCase` (node 21 SECTION A บรรทัด 69) เป็น `''` เพื่อรัน
  live จริง แล้ว node 22 จะแสดง `mode: live` + verdict ของเอกสารจริง
* ผลข้างเคียงที่บันทึกไว้: group เดิม `Stage 3` ถูกลบอัตโนมัติ (group ต้องมี exit เดียว) และการสร้าง
  group ใหม่ที่ไม่มี `21` ถูกปฏิเสธเพราะ `13 Respond JSON` กิน input จาก `21` เช่นกัน

