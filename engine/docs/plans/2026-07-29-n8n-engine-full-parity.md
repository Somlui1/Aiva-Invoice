# n8n ↔ Engine v5.7 Full Parity — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** ทำให้ n8n workflow `034iqKMRjqKt9LlB` ให้ผล "เหมือน engine v5.7 หัวปัจจุบัน" — คือ decision layer ให้ `payload_sha256` เท่ากัน byte-for-byte เมื่อ extraction + แถว Oracle เป็นชุดเดียวกัน และบนเอกสารจริง verdict/exception_codes/evidence rows ตรงกัน ≥ เป้าที่วัดและตกลงไว้

**Architecture:** ขยาย JS port ใน `engine/tools/n8n_port/` ให้มีชั้น AI ที่ engine ใช้จริง (V-07 matcher M3–M5, V-05 entity judge, V-08 qty judge) โดยเรียกผ่าน `helpers.httpRequest` ใน Code node (โครงเดิมที่ใช้อยู่กับ ORDS แล้ว) + ปรับชั้น perception ของ flow (classify multi-image, `response_format`, JSON salvage/repair, orientation, R6-13 re-read 300 DPI, R6-6 adjudicate) ให้ตรงกับ `src/system_a/perception/single_pass.py` ทุกการตรวจใช้ **tape** (บันทึกคำตอบ VLM/Oracle ครั้งเดียวแล้ว replay) เพื่อให้ deterministic และรัน offline ได้ก่อนแตะ canvas

**Tech stack:** Node.js (Code node typeVersion 2, async + `this.helpers.httpRequest`), Python 3.11 (engine เป็น ground truth), n8n MCP (`update_workflow` แบบ `setNodeParameter`), LiteLLM/OpenAI-compatible gateway `http://10.10.3.112:4000/v1`, model `nvidia/Qwen3.8-Flash-Next-NVFP4`

---

## กติกาของงานนี้ (บังคับทุก task)

1. **ห้ามแก้ canvas ก่อน parity ผ่าน offline ครบ** — upsert ทำเฉพาะเมื่อ Phase B เขียวทั้งหมด
2. ทุกคำตอบของ VLM/Oracle ที่ใช้ในห้องทดสอบต้องมาจาก **tape** (`fixtures/ai_tape_*.json`, `fixtures/oracle_rows_*.json`) — ห้ามเรียกของจริงในเทสต์ (Gateway มี 429 และการรันซ้ำไม่ได้ผลเดิม)
3. **ห้าม hardcode sha** — อ่าน sha เป้าหมายจาก reference payload ของ engine (บทเรียน 19 ต.ค. + build guard มีอยู่แล้ว)
4. upsert แล้วต้อง **GET version ที่ active กลับมาเทียบ byte-for-byte** ไม่ใช่เชื่อ flag
5. `fixtures/` และ `live/` เป็น gitignored (ข้อมูลจริง + token) — เก็บเฉพาะ code + harness + docs
6. ทำทีละ task, อัปเดต `docs/plans/task.md` ทุกครั้งที่เปลี่ยนสถานะ, review 2 ชั้น (spec → quality) ก่อนปิด task

## สถานะปัจจุบัน (ณ เริ่มแผน) — สิ่งที่ทำแล้วและสิ่งที่เหลือ

| ส่วน | สถานะ |
|---|---|
| decision layer (V-01..V-09, normalize, evidence, assembler, schema 3.1) | ✅ port แล้ว parity 5/5 byte-equal, ข้อความไทย 177 fragment ตรง |
| published canvas | ✅ `2532a1ff` = repo build (ยืนยันด้วย content ของ active version) |
| V-07 AI matcher (M3–M5) | ❌ `src_matching.js:204` throw `PortPending` |
| V-05 entity AI | ❌ `src_rules.js:362` throw |
| V-08 AI mode | ❌ `src_rules3.js:162` throw |
| R6-6 adjudicate / R6-13 300 DPI re-read | ❌ ไม่มีใน flow |
| classify | ⚠ ส่ง 1 ภาพ/request + **ไม่ส่ง `response_format`** ขณะที่ engine ยิงภาพทั้งหมดครั้งเดียวผ่าน `chat_json(json_mode=True)` |
| extract call | ⚠ ไม่ส่ง `response_format` และไม่มี repair/no-thinking/salvage chain แบบ `LiteLLMClient.chat_json` |
| page orientation | ⚠ flow ใช้ `rotate_degrees` ที่ VLM ตอบ (node 05→07 `editImage`) ส่วน engine ใช้โมเดล PP-LCNet ONNX (`perception/orientation.py`) |
| gateway รองรับ >1 image? | ✅ **ทดสอบแล้ว 29 ก.ค.: HTTP 200 ทั้ง 1 และ 2 images** ⇒ ข้อจำกัดเดิมล้าสมัย ทำได้ |
| เงิน/ตัวเลข | ✅ port ใช้ decimal BigInt (`src_core.js:9-61`) ไม่ใช่ float |

ผลกระทบที่วัดแล้ว (corpus 125 ฉบับ): doc ที่ V-07 ต้องใช้ AI = **47 (38%)**, ในนั้นหลุด HOLD ทันทีเมื่อมี AI = **6 ฉบับ**

---

## Phase A — ตรวจ request shape ทีละ call (ก่อนเขียนโค้ดใหม่)

> ถ้า request ที่ flow ยิงต่างจาก engine การตัดสินจะต่างตั้งแต่ยังไม่ต้องพูดถึง rule — ต้องรู้ก่อนว่าต่างตรงไหนบ้าง

### Task A1: สคริปต์ dump request เทียบข้าง
**Files:** Create `tools/n8n_port/harness/request_diff.py`; Read `live/PUBLISHED_2532a1ff.json`, `src/system_a/adapters/llm/litellm_client.py`, `src/system_a/perception/single_pass.py`
**Step 1:** เขียน `request_diff.py` ที่สร้าง body ที่ **engine** จะยิงสำหรับ doc หนึ่งฉบับ (classify / extract / adjudicate / crop-reread / v07 / v05 / v08) จากโค้ดจริง (`LiteLLMClient.chat_json` + `load_prompt`) โดย monkeypatch `_post` ให้ capture body แล้ว dump เป็น JSON
**Step 2:** อ่าน body ที่ **flow** ยิงจริงจาก execution (`get_workflow_execution(includeData)` → node 04/09 `jsonBody`) — เก็บเป็น `live/exec<id>_llm_bodies.json`
**Step 3:** พิมพ์ตารางเทียบ key-by-key: `model`, `temperature`, `max_tokens`, `response_format`, `chat_template_kwargs.enable_thinking`, ลำดับ/ชนิด content part, จำนวนภาพ, `system` prompt (เทียบ md5 กับ `config/prompts/*.md`)
**Verify:** `python harness/request_diff.py` ต้องได้ตารางครบทุก call และมีแถว "different" ที่อธิบายได้เท่านั้น
**Commit:** `tools/n8n_port/harness/request_diff.py` + ผลตารางใน `docs/plans/` (ไม่ต้อง commit body ที่มี image base64)

### Task A2: ปิดช่อง request ที่เจอจาก A1 (classify + extract)
**Files:** Modify `n8n_nodes/03_patched.js` (สร้างใหม่จาก canvas จริง), node `04`, `08 Build extract request`, node `09`
**Step 1:** เพิ่ม `response_format: {"type":"json_object"}` และ field อื่นที่ต่างกัน (ผลจาก A1)
**Step 2:** เปลี่ยน classify เป็น **multi-image request เดียว** (engine layout: `[{text}, {image_url}...]` + system message) — node 03 รวม image ทุกหน้าเป็น array เดียว, node 04 ยิงครั้งเดียว, node 05 parse คำตอบหลายหน้า
**Step 3:** ทดสอบ offline ด้วย tape: เขียน `harness/test_classify_multimage.mjs` ที่ replay คำตอบจริงของ engine (บันทึกจาก A1) แล้วตรวจว่า node 05 เลือกหน้าได้เหมือน `single_pass` เลือก
**Verify:** เทปผ่าน + ตาราง A1 แถวต่างเหลือ 0 (เฉพาะ classify/extract)
**Commit:** node jsCode ชุดใหม่ + harness

---

### Task A1 — ผลการวัด (รันแล้ว 29 ก.ค., `harness/request_diff.py`)

engine knobs จาก `.env`: model `nvidia/Qwen3.8-Flash-Next-NVFP4`, thinking False, json_mode False,
coord `norm1000`, extract 150 DPI, classify 80 DPI, max_pages 12 — **flow ตั้งค่าตรงกับทุกตัว**
(บรรทัดนี้เคยพลาด: harness ต้องโหลด `.env` ก่อน import `container` ไม่อย่างนั้นจะเห็นค่า default `qwen-vl`
แล้วรายงาน difference ที่ไม่มีอยู่จริง)

| call | ผล | สิ่งที่ต้องทำ |
|---|---|---|
| **extract** | ตรงกันทุก field (model/temperature/max_tokens 8000/response_format=None/enable_thinking=False/roles=['user']/ลำดับ content `[image,text]`) เหลือต่างเดียว = **trailing newline** (engine 9,620 vs flow 9,619 ตัวอักษร) | ตัด/เติม newline ให้ md5 ตรงกัน (งาน 5 นาที) |
| **classify** | engine ยิง **4 ภาพใน request เดียว**, flow ยิง **1 ภาพ** + ต่อท้ายข้อความ 59 ตัวอักษร `This request contains ONLY page i of N - answer "p" as i.` (สิ่งที่ยัดเข้าเพราะทำแบบ 1 ภาพ/req) | Task A2: รวมเป็น multi-image request เดียว + ลบ suffix นั้นออก → prompt จะตรงกับ engine เป๊ะ |
| **adjudicate** (R6-6) | **flow ไม่มี call นี้** engine เปิดใช้ (`adjudicate_from_env()` default on) | Task D4 |
| **v07_match / v08_qty / v05_entity** | **flow ไม่มี call เหล่านี้เลย** และ engine เรียกแบบ `layout:"system"` + `response_format={"type":"json_object"}` + `enable_thinking=True` (คนละแบบกับ perception ที่ thinking off) | Phase C ทั้งหมด |

ข้อสรุปสำคัญที่ได้จากการวัด (ไม่ได้อย่างนี้ถ้าเดา):
1. ชั้น perception ของ extract **แทบไม่ต่างเลย** — งานส่วนใหญ่จึงอยู่ที่ AI + adjudicate + classify ไม่ใช่ OCR
2. การเทียบ doc 89 ที่ผ่านมาใช้ model เดียวกัน (หายห่วงเรื่องเทียบข้าม model)
3. `response_format` ไม่มีในชั้น perception ทั้งสองฝั่ง (engine `json_mode=False`) — งาน port AI ต้องส่ง
   `response_format` เฉพาะ call ของ matcher/judge ตาม `ai_services.py` เท่านั้น

---

## Phase B — Harness แบบ tape ที่วัด "port vs engine" ได้จริง ( backbone ของทั้งแผน )

### Task B1: ขยาย corpus parity เป็นเอกสารจริง 20 ฉบับ
**Files:** Create `tools/n8n_port/harness/make_real_fixtures.py`; Output `fixtures/ext_<doc>.json`, `fixtures/oracle_rows_<doc>.json`
**Step 1:** เลือก 20 doc จาก `frontend/temp/paperless_invoices_v5` ให้ครบกลุ่ม: AUTO_PASS, REVIEW, MANUAL_REVIEW, HOLD, multi-page, docs ที่ `metrics.ai_line_matcher_called=true`, docs ที่มี V-05/V-08 AI
**Step 2:** สำหรับแต่ละ doc รัน `python scripts/run_single_pass.py --doc-ids <id> --validate` → ได้ `bbox_testing/single_pass/DMS-<id>/extraction.json` (extraction เต็ม ไม่ใช่ trimmed)
**Step 3:** บันทึก Oracle tape ต่อ doc ด้วย pattern ของ `harness/py_full.py --record`
**Step 4:** สร้าง meta ต่อ doc (`{"request","models"}`) ตาม payload จริง
**Verify:** `python harness/parity.py --corpus real` → engine payload 20 ฉบับ compute ผ่าน และ **port ต้องเท่า engine 20/20 ก่อนเพิ่ม AI** (ตอนนี้จะ fail เฉพาะ doc ที่ต้องเรียก AI = **นี่คือ failing test ที่ถูกต้อง** ของ Task B2)
**Commit:** harness (fixtures gitignored)

### Task B2: AI tape (บันทึกครั้งเดียว replay ตลอด)
**Files:** Create `tools/n8n_port/harness/ai_tape.py` (capture ฝั่ง Python), `tools/n8n_port/harness/js_ai.mjs` (replay ฝั่ง JS)
**Step 1:** monkeypatch `LiteLLMClient._post` เพื่อบันทึก `(body, response_text)` ของทุก AI call ต่อ doc → `fixtures/ai_tape_<doc>.json`
**Step 2:** ให้ `js_full.mjs` รับ `--ai-tape` และตอบจาก tape โดย match กับ body ที่ port สร้าง (ถ้า body ต่าง → เทสต์ fail ทันทีพร้อม diff = นี่คือตัวบังคับให้ request ตรง engine)
**Verify:** `node harness/js_full.mjs --ai-tape ...` กับ doc ที่ไม่มี AI call → ผลเท่าเดิม (ไม่มี regression)
**Commit:** tape harness

---

## Phase C — Port ชั้ น AI ของจริง

### Task C1: JSON decode layer ให้เท่า `LiteLLMClient`
**Files:** Create `tools/n8n_port/src_aiclient.js`; Test `tools/n8n_port/harness/test_aiclient.mjs`
**Step 1:** เขียนเทสต์จาก input จริง 6 เคส: fenced ```json, `<thinking>` tag, trailing comma, JSON ที่ถูกตัดกลาง (`finish_reason=length`), คำตอบที่ไม่ใช่ JSON เลย, HTTP 400
**Step 2:** port `extract_json_object`, `salvage_json_object` (SALVAGE_CUTS=60), REPAIR message, ลำดับการกู้คืน: parse → repair → **ปิด thinkingแล้วยิงซ้ำ** → salvage (ต้องเหมือน `chat_json` ทุกขั้น)
**Verify:** `node harness/test_aiclient.mjs` ผ่านทุกเคส และเทียบผลลัพธ์กับ Python บน input เดียวกัน (เทสต์เรียก `python -c` เทียบได้)
**Commit:** `src_aiclient.js` + test

### Task C2: V-07 AI matcher (M3–M5)
**Files:** Modify `tools/n8n_port/src_matching.js` (แก้ `PortPending` ที่บรรทัด 204), Modify `build_n8n_inline.mjs` (ฝัง prompt `v07_match.md` เป็น SECTION + ส่ง `ai` เข้า `runInFlow` แบบเดียวกับ `sqlRun`); Test ผ่าน B1/B2
**Step 1:** port `inv_payload` / `rcv_payload` ให้ตรงกับ `matching.py:196-227` (เพิ่ม `po_number` เฉพาะเมื่อ Oracle ยืนยัน, `item_code` เฉพาะเมื่อ Oracle ส่งมา)
**Step 2:** port AI branch ของ `resolve()` (`matching.py:301-330`): guardrail 4 ข้อ (`empty_group`, `unknown_or_reused_line`, `n_to_m_not_allowed`, `invalid_level`), `LEVEL_CONF {M3:0.90,M4:0.85,M5:0.80}`, `source:"ai"`, `ai_rejected` trace, และการ pop inv/rcv
**Step 3:** UNMATCHED ต้องเลือก `source` ตามลำดับเดิม (`guardrail` ถ้ามี ai_rejected → `ai` ถ้ายิง → `logic`)
**Verify:** `python harness/parity.py --corpus real` → **20/20 byte-equal** (รวมทั้ง 6 doc ที่ต้องเรียก AI) และ `line_matching.groups[].level/source/rationale` เท่า engine
**Commit:** src_matching + build

### Task C3: V-08 qty judge (n votes + vote)
**Files:** Modify `tools/n8n_port/src_rules3.js:162`; Test fixture ตัวใหม่ 1 ตัวที่เข้าโหมด AI ของ V-08
**Step 1:** port `v08mod.vote` + `policy.ai.v08_votes`, payload ที่ส่ง (`v08_qty.md` เป็น system)
**Step 2:** ตรวจว่า `ai_rejected`/review rows ที่เกิดจาก AI ตอบต่างจาก logic ยังเหมือน engine
**Verify:** parity corpus เขียว + fixture ใหม่ sha เท่า engine
**Commit:** src_rules3 + fixture generator

### Task C4: V-05 entity judge
**Files:** Modify `tools/n8n_port/src_rules.js:355-370`; Test fixture ที่ `customer_name` ไม่ตรงแบบ exact
**Step 1:** port `name_equivalent` (policy `v05_name_min_confidence`) และ `parse_address` (policy `v05_address_ai_enabled`) ตาม `rules.py:415-460`
**Step 2:** review points ที่เคย "unreachable" (comment ที่ `src_rules.js:367`) ต้อง reach ได้จริง
**Verify:** parity เขียว + `test_rule_text_parity.py` ยัง 0 missing
**Commit:** src_rules

---

## Phase D — Perception layer ของ flow ให้เท่า engine

### Task D1: JSON salvage/repair ฝั่ง flow (node 10)
**Files:** Modify `n8n_nodes/10_patched.js` (สร้างจาก canvas), reuse `src_aiclient.js` logic
**Step 1:** ตอนนี้ flow มีแค่ `answer_parse_error`/`fallback_used` — เพิ่ม repair → no-thinking retry → salvage ให้เหมือน engine (ผล: `pages_complete` ไม่พังฟรี ๆ ซึ่งเปลี่ยน E01 โดยตรง)
**Verify:** เทสต์จากเทปคำตอบที่ถูกตัดกลาง (พบจริง 21/99 doc ตามคอมเมนต์ใน `litellm_client.py`) → `pages_complete` เท่า engine
**Commit:** node 10 jsCode

### Task D2: page orientation ให้ตรงกัน
**Files:** Audit node 05/07; ทางเลือก (1) ย้าย PP-LCNet ไปเป็น sidecar/service ที่ flow เรียก (2) ยอมรับความต่างและบันทึกเป็นข้อจำกัด
**Step 1:** วัดก่อนว่าต่างกันจริงกี่ doc: รัน `orientation.py` เทียบกับ `rotate_degrees` ที่ VLM ตอบ บน 20 doc ของ corpus
**Step 2:** ถ้าต่าง ≤1-2 doc → บันทึกเป็นข้อจำกัด + ทำ (1) เฉพาะเมื่อ owner เห็นว่าคุ้ม
**Verify:** ตารางจำนวน doc ที่ rotate ต่างกัน
**Commit:** ผลวัดใน plan นี้

### Task D3: R6-13 re-read 300 DPI เฉพาะ tax id
**Files:** Create nodes `06b PDF to JPEG 300 DPI`, `08b crop+reread`, `10c merge corrected tax id`; Modify `10`; Port `single_pass.py:455-520` (`TAXID_RETRY_DPI_DEFAULT=300`, เงื่อนไข "น่าสงสัย", crop region)
**Step 1:** port เงื่อนไข trigger ให้ตรง (อ่านจากโค้ดจริง ไม่ใช่เดา)
**Step 2:** ตัดภาพตาม bbox: n8n `editImage` crop ได้ (`positionX/Y + width/height`) — ทดสอบว่า crop ตรงกับที่ engine crop (เทียบผล VLM บน 3 doc)
**Step 3:** ต้องไม่มีผลกับ doc ที่ไม่ trigger (parity corpus ต้องเขียวเหมือนเดิม)
**Verify:** parity 20/20 เหมือนเดิม + doc ที่ trigger ให้ tax id ตรง engine
**Commit:** node ใหม่ + jsCode

### Task D4: R6-6 adjudicate
**Files:** Port `single_pass.py:937-` (`_adjudicate`, `adjudicate_from_env`, `adjudicate_dpi=150`, prompt `single_pass_adjudicate.md`); Modify node 05/07/10 หรือยิงใน node 21
**Step 1:** กำหนดว่าจะวางตรงไหน: ถ้าทำก่อน node 12 ต้องเพิ่ม 1 request ต่อหน้าที่ต้อง adjudicate
**Step 2:** ตรวจว่า `metrics.adjudication` / `pages re-read` ปรากฏใน payload เหมือน engine
**Verify:** parity + doc ที่เคย "about to be discarded" ต้องไม่ HOLD ฟรี ๆ
**Commit:** nodes + port

---

## Phase E — Ship และวัดผลจริง

### Task E1: rebuild + full parity gate
`node build.mjs && node build_n8n_inline.mjs` → `python harness/parity.py --corpus real` (ต้อง 20/20) → `python harness/test_rule_text_parity.py` (0 missing) → `node harness/test_tail_v57.mjs` → `node harness/test_inline.mjs`

### Task E2: upsert ผ่าน MCP (backup + read-back byte-for-byte)
`python harness/n8n_mcp_sync.py --check` → `--only` ทีละ node (21 ก่อน, แล้ว 03/04/08/09/10 และ node ใหม่) → verify content ของ **active version** หลัง publish

### Task E3: live A/B บนเอกสารจริง 10 ฉบับ
รัน engine (`run_single_pass.py --doc-ids ... --validate`) และรัน flow (`execute_workflow mode=manual`) ด้วย doc เดียวกัน แล้วเทียบ **verdict + exception_codes + max_severity + evidence rows** (sha เท่าได้เมื่อ extraction ตรงกันเท่านั้น เพราะ VLM ไม่การันตี)
**Files:** Create `tools/n8n_port/harness/ab_docs.py` (ต่อยอดจาก `live_parity.py`)
**Verify (เป้าหมายที่ต้องรายงาน):** verdict ตรงกัน **≥ 9/10**; doc ที่ต่างต้องอธิบายได้ว่าเพราะอะไร (VLM nondeterminism / Oracle ข้อมูลขยับ / orientation)
**Commit:** harness + ผลรายงาน

### Task E4: เอกสาร + ปิดงาน
อัปเดต `tools/n8n_port/STATUS.md` (§ ผล A/B, ข้อจำกัดที่เหลือ), `docs/plans/task.md`, และ note เรื่อง secret (`llm_key` ถูก node 21 ใช้แล้ว — พิจารณาย้ายเข้า Credentials)

---

## ความเสี่ยงที่ต้องจับ

1. **เวลา execute**: AI call เพิ่ม 1–n ครั้ง/เอกสาร (V-08 มี n votes) + adjudicate/300DPI → ต้องตั้ง `executionTimeout` และวัด p95 (n8n ตั้งไว้ 600 s ที่ node 04)
2. **Gateway 429**: ต้องมี backoff ใน `src_aiclient.js` (MCP เจอ 429 บ่อยเป็นบทเรียนแล้ว)
3. **Token budget**: `enable_thinking=True` กิน reasoning tokens (เคยทำให้ body ถูกตัด 21/99 doc) — salvage layer (Task D1) คือตัวกัน
4. **VLM nondeterminism**: ทำให้ "sha เท่ากันบน doc จริง" เป็นเป้าหมายที่ 2; เป้าหมายที่ 1 คือ verdict/codes/evidence
5. **Orientaion (D2)** เป็นความเสี่ยงแบบ silent — ตรวจด้วยตัวเลขก่อนตัดสินใจ
