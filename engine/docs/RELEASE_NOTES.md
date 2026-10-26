# Engine Release Notes — AIVA System A

> **เวอร์ชันที่ใช้งานอยู่ / current release: Engine `v5.5`**
> git tag: **`engine-v5.5`** · branch `engine` · 2 remotes: `origin` (GitLab `apigw.aapico.com/gitlab/ah/aiva-invoice`)
> และ GitHub mirror `Somlui1/Aiva-Invoice` — tag และ branch ถูก push ขึ้น **ทั้ง 2 ที่แล้ว**
> Standard ที่ engine ตรวจ: `AH-IT-DOC-PO-INV-Matching-Standard v6.6` (คนละอย่างกับเวอร์ชัน engine)

---

## Engine v5.7 (candidate) — หลักฐานรายจุด (evidence per finding) ให้ตรงกับปุ่ม 3 สถานะของ Portal

**ผลตัดสินไม่เปลี่ยน:** `recommendation`, `max_severity`, `exception_codes`, `reasons` และผลของกฎ V-01..V-09 เหมือน v5.6 ทุกฉบับ
(replay 125 ฉบับ `paperless_invoices_v5` ต่าง 0 ฉบับ · sandbox 59/68 แถวเดียวกันทุกแถว รวมทั้งโหมด `AIVA_EVIDENCE_STRICT=1`)
**contract id ไม่เปลี่ยน** (`aiva.system_a.result/3.0`) · `versions.schema` = `3.1` (เพิ่มอย่างเดียว) · **Portal ต้องรับ schema 3.1 ก่อน (frontend F10)**

| ส่วน | สิ่งที่เปลี่ยน | ไฟล์ |
|---|---|---|
| E1 ตัวตรวจ | `check_evidence()` ตรวจ R1–R10 ก่อนส่งผล ใส่ใน `metrics.evidence_violations` (ไม่เข้า integrity) · `AIVA_EVIDENCE_STRICT=1` = raise | `application/evidence_check.py` (ใหม่), `assembler.py` |
| E2 เหตุผลไม่มีกรอบ | `bbox_missing_reason.reason` คำนวณจาก element จริง: `PAGES_INCOMPLETE` > `NOT_PRESENT` > `LOW_CONFIDENCE` > `NOT_LOCATED` > `NO_ELEMENT` (เดิมฮาร์ดโค้ด `NOT_LOCATED` และเป็น `null` เมื่อ finding ไม่มี element) · `details` เมื่อหลายเหตุผล · id ที่ไม่มี element ไม่อยู่ใน `related_element_ids` · สร้าง element ให้ row/cell ที่ normalize สร้างแต่ reader ไม่มี | `assembler.py` (`_locate`, `build_elements`), `contracts.py` (`Finding.missing_reason`) |
| E3 แยกหลักฐาน | V-01: 1 finding ต่อฟิลด์ / ต่อบรรทัด / หน้าไม่ครบ / geometry ต่อบรรทัด (เดิมรวมเป็น 1) · V-03: 1 finding ต่อการตรวจที่ผิด (เดิมชี้ 3 ยอดเสมอ) · severity/branch เดิมทุกกรณี | `domain/rules.py` |
| E4 manual_review | `ReviewPoint` → evidence `kind:"review"`, `exception_code/severity = null`, **ไม่เข้า `exceptions[]` และ `recommend()`** · V-04 (5 branch), V-05 (4), V-07 (งวด, ai_rejected), V-08 (รายบรรทัด, ไม่มี AI) · ตาข่ายสำรองใน assembler ให้ทุก rule ที่ manual_review มีแถวเสมอ · `summary.exceptions/rules.codes/lines.codes` นับเฉพาะแถวที่มี code + `summary.review_points` | `contracts.py`, `rules.py`, `assembler.py` |
| E5 ลายเซ็น | element `D1-sig-receiver/deliverer` มีครบทุก slot (slot ที่ไม่มีกล่อง = bbox null + `null_reason`) · `normalized_value` เป็น bool/null เท่านั้น · E08 ชี้ slot เสมอ | `assembler.py`, `rules.py` (V-06) |
| E6 ค่าใน banner | `actual/expected`: V-01 (ฟิลด์/บรรทัด vs required), V-03 (ต่อการตรวจ), V-06 (`empty`/`no box` vs `signed`), V-07 E11/E13 (`qty x price = amount` vs ใบรับ) | `rules.py` |
| E7 schema 3.1 | evidence += `kind`, `field_name`, `line_no`; `severity`/`exception_code` เป็น null ได้เฉพาะแถว review; enum ของ reason; แถวไม่มี bbox ต้องมี reason | `schemas/result-3.1.schema.json` (ใหม่), `api/app.py`, `sandbox/scenarios.py` |

**ผลบน replay 125 ฉบับ (row bbox คืนค่าครบ):** evidence 158 → 232 แถว (review 14) · exceptions 158 → 218 · violation R3 20 → 0, R7 2 → 0 ·
คงเหลือ advisory R2 1 ฉบับ (DMS-26 V-08 E14 กลุ่มราคา ชี้ทุกบรรทัดโดยตั้งใจ)
**Tests:** `tests/test_evidence_findings.py` ใหม่ 21 ข้อ · `test_v06_signature_detect.py` แก้ 1 ข้อ (E08 ไม่มีกล่องตอนนี้ชี้ slot element) ·
pytest ในเครื่องที่ตรวจ: **256 passed / 37 failed** — 37 ข้อเท่ากับก่อนแก้ทุกตัว (36 ไม่มี `openai` + 1 import `tests.test_single_pass`) — **ต้องรันซ้ำในเครื่องที่มี `openai`** (คาด 272 + 21 = 293 passed)
**Golden (`--golden`):** baseline ก่อนแก้ก็ DRIFT 19/19 อยู่แล้ว ⇒ ต้อง repin หลัง review (จำนวน evidence เปลี่ยนโดยตั้งใจ)

**สถานะซ้ำตอนติดตั้งเข้า working tree (session 2026-10-26 — เครื่องที่มี `openai` ครบ แทนบรรทัด “ต้องรันซ้ำ” ข้างบน):**
engine **293 passed, exit 0** (`AIVA_EVIDENCE_STRICT=1 PYTHONPATH=src python -m pytest -q`) — 272 ของ v5.6 + 21 ข้อใหม่, ใส่ `--basetemp` ภายนอก repo เพราะบน Windows การลบ `temp/pt-base` โดน `PermissionError` (เป็น error ของ harness ไม่ใช่ test fail)
· `system_a.cli scenarios` = **59/68** เท่า baseline แบบ row-by-row · `system_a.sandbox.scenarios` = **58/68 เท่า tree ก่อน patch ทุกแถว (diff ว่าง)** · `sandbox.scenarios --schema` = **all results valid** (result-3.1)

**Offline replay 125 ฉบับ** (`tools/replay_results.py` รันด้วย tree ก่อน patch และหลัง patch, dump ลง `temp/evidence-baseline/` + `temp/evidence-after/`):

| ตัวชี้วัด | v5.6 (E0) | v5.7 |
|---|---|---|
| `recommendation` / `exception_codes` / `max_severity` ที่ต่างกัน | — | **0 จาก 125 ฉบับ** |
| แถวหลักฐานรวม (exception / review) | 244 (244 / 0) | **542 (528 / 14)** — เปลี่ยน 79 ฉบับ |
| rule `manual_review` ที่ `evidence_ids` ว่าง | 2 | **0** |
| violation `R3_NO_LOCATION_NO_REASON` | 18 | **0** |
| violation `R7_REVIEW_WITHOUT_EVIDENCE` | 2 | **0** |
| advisory `R2_WIDE_FINDING` | 7 | 5 (หมดนี้เป็น V-08/E14 กลุ่มราคา DMS-26 — ข้อยกเว้นที่ plan บันทึกไว้; ตัวตรวจไม่ให้ raise กับ R2) |
| `bbox_missing_reason` | `NOT_LOCATED` 214 (ค่าเดียวทั้งชุด) | `NOT_LOCATED` 437 · `NOT_PRESENT` 38 · `PAGES_INCOMPLETE` 3 |
| ผลตรวจ fixture | — | DMS-27 V-07 = **10 findings** ✓ · DMS-40 → `PAGES_INCOMPLETE` ✓ · DMS-139 V-06 → `signatures.deliverer` + `NOT_PRESENT` ✓ · DMS-95 V-01 แตกเป็น **10 ปุ่ม** (plan ประมาณไว้ 9 — เกณฑ์จริง “1 ปุ่มต่อ 1 ฟิลด์/1 บรรทัด” ถือว่าครบ) |
| เพิ่มจาก checklist ซ้ำอีก 2 ข้อ | DMS-123 V-01 `customer_tax_id` → `NOT_PRESENT` + `actual/expected` ครบ ✓ · DMS-77 element `D1-f-sub_total` เป็นหลักฐานของ **ทั้ง V-03 (X8) และ V-09 (X14)** → `findingIds` ของ F1 ให้กรอบกับ 2 ปุ่ม ✓ |
| หมายเหตุ | ในชุด replay นี้ไม่มีเอกสารที่ **V-08 = manual_review** (V-08 วิ่งโหมด logic/simulator) จึงยังไม่มีตัวอย่าง “ปุ่มต้องตรวจต่อบรรทัด” ของ V-08 · review rows ที่เกิดจริง = V-07 12 + V-04 2 ใน 8 เอกสาร |

**Golden repin แล้ว** — `tests/golden_legacy_integrity.json` จาก 19 → **68 sids** (ของเดิม drift 19/19 ตั้งแต่ *ก่อน* patch จึงไม่ใช่สัญญาณถอยหลังของรอบนี้) gate ใหม่: `sandbox.scenarios --golden` = **68/68 unchanged**

**ยังไม่ทำ (ต้องได้รัน batch จริงก่อน):** ชุดผล `frontend/temp/paperless_invoices_v5_7/` — `replay_results.py` จำลอง Oracle/AI จึงเอา output ของมันมาแทน dataset จริงไม่ได้ (decision คนละชุดกับที่เก็บใน corpus) · ตามด้วย Portal F7 `backfill:findings`

## Engine v5.6 (candidate) — ลายเซ็น/ตรา V-06 ให้ตรงกับ Portal

**สถานะ:** engine 231 passed (ส่วนที่ fail 37 ข้อเป็นของเดิมที่ fail อยู่แล้ว เพราะ sandbox ไม่มี `openai` ไม่มีข้อใหม่), sandbox 58/68 เท่ากับ v5.5 (S18 E08 ยังผ่าน)

**สถานะซ้ำตอนติดตั้งเข้า working tree (session วันที่ 2026-10-21):** engine **272 passed exit 0** (`PYTHONPATH=src python -m pytest -q --basetemp=temp/pt-base`),
sandbox `system_a.cli scenarios` = **59/68 เท่ากับ v5.5 แบบ row-by-row (diff ว่าง)**, `sandbox.scenarios --schema` = **all results valid**,
offline replay 200 ฉบับจริง (`tools/replay_results.py` เทียบ tree ก่อน/หลัง patch) = V-06 เปลี่ยน 28 doc, E08 เพิ่ม 21 doc, เข้า HOLD เพิ่ม 16 doc

| ส่วน | สิ่งที่แก้ | ไฟล์ |
|---|---|---|
| OCR | prompt `extract@1.7.0`: present มีแค่ `signed`/`empty` (มีรอยหมึกหรือตราแม้จางก็นับว่า `signed`) และต้องคืนกล่องทั้ง 2 ช่องเสมอ แม้กล่องว่าง | `config/prompts/single_pass_extract.md` |
| OCR | `signature_slot()`: ตรารับของ (received) นับเป็นช่องผู้รับ ส่วนตราอื่นและ `authorized_signature` นับเป็นช่องผู้ส่ง ถ้าในช่องมีรอยอย่างน้อย 1 อัน = พบ ถ้าไม่พบให้เก็บกล่องว่างไว้เป็น evidence | `perception/single_pass.py` |
| Validate | V-06 v2.0: พบรอย = pass ไม่ดู confidence และไม่มี waiver Oracle ถ้าไม่พบ = E08 (ผู้รับ High / ผู้ส่ง Medium) ชี้ไปที่ `D1-sig-<slot>` และส่ง `data.signature_boxes` | `domain/rules.py`, `rules.yaml` |
| Validate | ตราใช้แทนลายเซ็นได้แม้ region ไม่มี confidence (ก่อนหน้านี้ fallback นี้ไม่ทำงานใน single_pass) | `domain/normalize.py` |
| Validate | **ปิดงานให้ตรงกับคำสั่งเจ้าของงาน "ไม่ต้องใช้ confidence — เจอรอยถือว่าเซ็น"**: fallback ตราทั้ง 2 ช่องไม่อ่าน `min_confidence` อีกเลย (ค่าที่ region ส่งมาถูกเก็บไว้เป็น audit data เท่านั้น) + หมายเหตุใน policy · test 4 ข้อ (red-green: 2 ข้อแรก fail ก่อนแก้) | `domain/normalize.py`, `policy.yaml`, `tests/test_v06_signature_detect.py` |
| Contract | element ลายเซ็นใช้ผลตัดสินสุดท้ายเดียวกับ V-06 และ `raw_value` = `signed`/`empty` | `application/assembler.py` |

**ยังไม่แก้ (เจ้าของงานสั่ง):** ฝั่ง Portal `frontend/src/features/engine/adapters/portalDocToInvoiceDoc.ts:201` นับ glyph จาก `rawValue` ที่ไม่ว่าง
⇒ กล่อง `empty` จะถูกมองว่ามีลายเซ็น · และ **ยังไม่ commit/tag**

## Engine v5.5 (release นี้คือฉบับที่ดีที่สุด ณ ตอนนี้)

**สถานะ:** ผ่านการตรวจใน session ที่ release — **engine 263 passed** (`PYTHONPATH=src python -m pytest -q`),
**test-portal 153 passed**, **sandbox 68/68 scenarios** โหลดครบ (รวม S63–S68 ของ v5) และรัน `system_a.cli scenarios` ผ่าน

### สิ่งที่อยู่ในฉบับนี้ (delta ของรอบ release)
| ส่วน | สิ่งที่แก้ | switch / ไฟล์ |
|---|---|---|
| V-08 | verdict มาจาก `COMPUTED_FACTS` (logic ล้วน ไม่เรียก LLM) — deterministic, เร็ว, ไม่เปลือง token · `ai` = โหวต 3 ครั้งแบบเดิม | `policy.ai.v08_mode: logic` · `rules.yaml` V-08 `engine: logic` |
| หน่วย (UOM) | ต่างกลุ่ม + ยอดบรรทัดเท่ากัน → **E10 (REVIEW)** · ต่างกลุ่ม + ยอดต่างกัน → **E10 + E09 (HOLD)** · หน่วยหายไปข้างหนึ่ง → ไม่เทียบหน่วย ให้ราคาตัดสิน | `policy.validation.uom_mismatch.{amount_check, unknown_unit_uses_price}` |
| PAC | `PAC` คือตัวย่อของ `PACK` ที่ใบกำกับภาษีพิมพ์จริง → อยู่ในกลุ่ม PACK | `config/standards/v6.6/uom_groups.yaml` |
| Milestone / งวด | ราคาต่อหน่วยต่างแต่ยอดบรรทัด = ยอดใบรับ → **E12 (REVIEW)** ไม่เป็น AUTO_PASS อีกต่อไป (v4 เคย `exact_amount_pass`) | `policy.validation.milestone_installment: review` + `installment_requires_lower_qty` |
| Sandbox | เคสใหม่ **S63–S68** (กฎหน่วย, ราคาต่าง/ยอดเท่า, V-08 แบบ logic) ผังเคสโหลดอัตโนมัติผ่าน `all_scenarios()` | `src/system_a/sandbox/v5_cases.py`, `scenarios.py` |
| Test portal | บอก URL ที่เปิดใช้งานได้จริงเมื่อ bind `0.0.0.0` (แปล wildcard เป็นเลข LAN) และเตือนเรื่อง "ไม่มี login" ทุกครั้งที่เปิดออกทุก interface | `src/test-portal/webapp/__main__.py`, `README.md`, `.env.example` |
| n8n OCR + BBox | design doc + ผลงาน Task 0–6 (flow 15 nodes, root cause "run สำเร็จแต่ผลลัพธ์ว่าง" = ขาด `enable_thinking:false`, ยืนยัน gateway รับ **1 รูป/request** และ classify ของ engine พังจริง) | `docs/plans/2026-10-17-n8n-invoice-ocr-bbox-explained-design.md`, `docs/plans/task.md` |

### งานที่มากับ baseline ก่อนหน้า (สรุปสิ่งที่ v5.5 สืบทอดมา)
single-pass extraction `extract@1.6.0` + นโยบาย ambiguity ของ label (`เลขที่` ชนะ `เล่มที่`), ink-snap และ line-merge,
tax-id checksum retry 300 DPI, orientation/bbox rotation-back, perception-cache defense, gate ที่ reopen ด้วยคำที่พิมพ์บนหน้าจริง

### กู้คืน version นี้กลับมาให้ครบ (กันหาย)
```bash
git fetch origin --tags
git checkout engine-v5.5                # snapshot ตรงตัว ของ v5.5
git switch -c engine-v5.5-fix           # ถ้าจะแก้ต่อ โดยไม่แตะ branch หลัก
```
ของ 2 อย่างที่ **ไม่ได้** commit (generate ใหม่ได้ ไม่ต้องกลัวหาย):
```bash
python -m system_a.cli export           # sandbox_data/*.json (input ของ API demo / app.py)
```

### ไฟล์ที่ไม่ได้ commit ในรอบนี้ (ตั้งใจ)
`engine/sandbox_data/` (generate ด้วย `make export`), `engine/.pi/*`, `engine/.pi_done`, `engine/temp/`, `engine/results/`,
`engine/bbox_testing/` · และ `frontend/docs/plans/task.md` (งาน frontend ยังไม่ปิด)
