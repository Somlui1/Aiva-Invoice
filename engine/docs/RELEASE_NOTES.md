# Engine Release Notes — AIVA System A

> **เวอร์ชันที่ใช้งานอยู่ / current release: Engine `v5.5`**
> git tag: **`engine-v5.5`** · branch `engine` · 2 remotes: `origin` (GitLab `apigw.aapico.com/gitlab/ah/aiva-invoice`)
> และ GitHub mirror `Somlui1/Aiva-Invoice` — tag และ branch ถูก push ขึ้น **ทั้ง 2 ที่แล้ว**
> Standard ที่ engine ตรวจ: `AH-IT-DOC-PO-INV-Matching-Standard v6.6` (คนละอย่างกับเวอร์ชัน engine)

---

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
