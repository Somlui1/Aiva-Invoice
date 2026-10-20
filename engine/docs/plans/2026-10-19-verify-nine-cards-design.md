# Design — 9 verification cards ต่อท้าย `21 Validate (port)`

Date: 2026-10-19 · Workflow: `soWzNNLrZ1c4Absf` (DMS Invoice OCR + BBox (Explained) v2)
Owner choice: **ทางเลือก A** — engine ยังเป็น Code node เดียว, 9 node ใหม่เป็น "การ์ดแสดงผล" ที่อ่านอย่างเดียว

## 1. ปัญหา / แรงบันดาลใจ

ผู้ใช้ muốnเห็นการตรวจ **9 ข้อ (V-01 … V-09)** เป็น 9 node บน canvas แทนที่จะเป็นก้อนเดียว 260 KB

แต่ 9 rule ไม่ได้อิสระต่อกัน (ถอดจาก `application/orchestrator.py`):

| ข้อเท็จจริง | บรรทัด | ผลต่อการแตก node |
|---|---|---|
| `for rule in R.STEP1` รันก่อน Oracle | 76 | STEP1 (V-01/V-02/V-03/V-06) ต้องอยู่ก่อนการยิง Oracle |
| gate `V-02 fail → halted="V-02"` | 100 | ตัดสินก่อน Oracle lookup |
| V-01 ล้ม → ข้าม Oracle ทั้งขั้น | 106-112 | ลำดับสัมบูรณ์ |
| `V-05` ต้องมี ORG_ID จากแถวใบรับที่ active ไม่งั้น `halted_by="V-04"` | 166-171 | V-05 กิน output ของ V-04 ตรง ๆ |
| STEP3 (V-07→V-08/V-09) ต้องการผล line matching | 183 | ไม่ใช่แค่ผลของ rule ก่อนหน้า |
| **STEP1 ถูกประเมินซ้ำ** บนเอกสารที่รวม evidence แล้ว และ V-01 โดน `replace()` เติม data | 192-202 | rule เดียวต้องรัน 2 รอบในลูกเดียว |

บวกกับ state ที่ข้าม JSON ระหว่าง node ไม่ได้ (Decimal = BigInt, `PyInts`, int-vs-float literal ที่
canonical JSON ใช้ตอนคิด hash) ⇒ **ถ้าแตก 9 node ตาม rule จริงจะต้อง clone `ctx` + ทำ loop ย้อน
ให้ STEP1 รันสองรอบ + parity ป้องกันไม่ได้** จึงเลือก A

## 2. สถาปัตยกรรม

```
21 Validate (port)                       ← ไม่แตะเลย (jsCode 260,072 ตัวอักษร, parity พิสูจน์แล้ว)
 ├─ 13 Respond JSON                      ← คงเดิม (ยัง disabled)
 └─ 20a V-01 → 20b V-02 → 20c V-03 → 20d V-04 → 20e V-05
        → 20f V-06 → 20g V-07 → 20h V-08 → 20i V-09
        → 22 Verification report (9 rules)
```

**กฎเหล็ก 2 ข้อ**

1. **ทุก node อ่านด้วย node reference** `$('21 Validate (port)').first().json.payload` — ไม่ได้ส่ง
   payload ต่อทอดกัน ⇒ item ในสายเล็ก (~0.5 KB) ต่อ node ตลอดสาย 10 node (บทเรียนจาก exec ที่
   UI ค้างเพราะ 8.4 MB)
2. **เรียงอนุกรม ไม่แยกกิ่งขนาน** — n8n ไม่รับประกันลำดับการรันกิ่งขนาน ถ้า node 22 อ่าน
   `$('20a V-01 …')` ข้ามกิ่งอาจอ่านก่อนกิ่งนั้นรันเสร็จ อนุกรม + การ์ดแต่ละใบ append ผลตัวเอง
   ต่อท้าย array `rules[]` = ลำดับชัวร์และได้ผลรวมที่ node 22 ที่เดียว

ลำดับการ์ด = ลำดับที่ engine ประเมินจริง ไม่ใช่ V-01..V-09 เรียงเลข:
`V-01, V-02, V-03, V-06` (STEP1) → `V-04, V-05` (STEP2/Oracle) → `V-07, V-08, V-09` (STEP3)

## 3. Schema ของการ์ด

ทุกฟิลด์มาจาก payload ของ engine ล้วน ไม่ได้แต่งเพิ่ม:

```json
{ "ok": true, "from": "21 Validate (port)",
  "rules": [
    { "rule_id": "V-04", "rule_name": "v04_receipt", "rule_version": "2.0",
      "step": 2, "engine": "logic", "gate": false,
      "result": "fail", "halted_by": null,
      "detail": "<ข้อความไทยที่ engine พิมพ์เอง>",
      "exceptions": [ { "code": "E03", "name": "Receipt Not Found", "severity": "High" } ],
      "evidence_ids": ["X3"], "data": { "…เฉพาะของข้อนี้…" : null } }
  ] }
```

* `rule_name` = ชื่อฟังก์ชันจริงใน `domain/rules.py` (`v01_required`, `v02_line_math`,
  `v03_doc_totals`, `v04_receipt`, `v05_customer`, `v06_signatures`, `v07_line_match`,
  `v08_quantity`, `v09_total_vs_receipt`) — **ไม่ตั้งชื่อไทยเอง** เพราะ Standard v6.6 ไม่มีชื่อ
  rule (มีแค่ `version`/`step`/`engine`/`gate`) และข้อความไทยที่แสดงคือของ engine
* `step`/`engine`/`gate`/`rule_version` อ่านจาก `standard.rules.rules` ที่ export ไว้ใน payload
  (`versions.ruleset`) หรือ hard-map ค่าที่ถอดมาจาก Standard v6.6 ฉบับที่ฝังใน node 21
* `exceptions` = join `payload.exceptions[]` ด้วย `rule_id` (มี `code`/`name`/`severity` อยู่แล้ว)
* `data` ติดมาเฉพาะของ rule นั้นไว้ดีบัก ไม่ดึง `payload.ocr.elements` หรือ oracle rows มาไว้ในสาย

**fail-safe:** ถ้า node 21 พัง / ไม่มี payload → การ์ดไม่ throw แต่คืน
`{rule_id, result: "not_evaluated", detail: "no payload from node 21"}` และ `parity_ok` จะไม่ปรากฏ
ที่ node 22 (เห็นได้ทันทีว่าไม่ใช่ผลจริง)

## 4. node 22 Verification report (9 rules)

output =
* `verdict` / `halted_by` / `max_severity` / `exception_codes` (จาก `payload.recommendation`)
* `parity_ok`, `mode`, `payload_sha256` (จาก output ของ node 21) — ยืนยันว่า 9 ข้อนี้คือผลที่ hash จริง
* `table`: 9 แถวตามที่ engine ประเมิน
* `report_text`: อ่านง่ายแถวละบรรทัด `[V-04] v04_receipt  fail   High E03 — <detail>`

## 5. ต้นทุน / ความเสี่ยง

* node 18 → 28; จะจัดเข้า group เดียวชื่อ `VERIFY 9 ข้อ` ซึ่งช่วยลด warning
  `TOP_LEVEL_ITEMS_OVER_CEILING` (ตอนนี้ 9 กล่อง over ceiling) ไปด้วย
* โค้ด 10 node ≈ 12 KB → **inject ผ่าน `update_workflow` ได้เลย ไม่ต้องใช้ clipboard** (ต่างจาก
  node 21 ที่ 260 KB ซึ่งต้อง paste มือ)
* ความเสี่ยงเดียวที่เหลือคือ drift เมื่อ engine เปลี่ยน — การ์ดไม่คำนวณอะไรเลย จึงพังแบบ
  "เห็นชัด" (ฟิลด์หาย = ขึ้น `not_evaluated`) ไม่ใช่เพี้ยนเงียบเหมือนกรณี split logic
* **ไม่แตะ** `21 Validate (port)`, `12`, `13` และภาพ/binary เดิม

## 6. แผนทดสอบ (single-flow, มีหลักฐาน)

1. inject 10 nodes + group → `validate_workflow` ผ่าน, ไม่มี disconnected node
2. รันด้วย `fixtureCase='exec357'` (36 ms, ไม่แตะ Oracle) → อ่านเฉพาะ output node 22 (เล็ก)
3. เทียบ `rules[]` 9 ข้อกับ `temp/n8n_port/fixtures/payload_inline_exec357.json` ของ engine
   ทีละข้อ: `rule_id`/`result`/`halted_by`/exception codes ต้องตรง 9/9
4. flips `fixtureCase: ''` (บรรทัด 69 ของ SECTION A — **ผู้ใช้แก้ใน UI**) → รัน live ซ้ำ เพื่อดู
   9 การ์ดบนข้อมูลจริง + `parity_ok`/`mode: live`
5. อัปเดต `docs/plans/task.md` (แถวใหม่) + `temp/n8n_port/STATUS.md`

## 7. สิ่งที่ไม่ทำ (YAGNI)

* ไม่แตก logic ของ rule ออก node แยก (ดู §1)
* ไม่ทำ 9 node แบบขนาน
* ไม่แก้ response shape ของ node 13 (consumer เดิมต้องได้ของเดิม)
* ไม่ย้าย `fixtureCase` ออกจาก SECTION A (ถ้าจะย้ายต้อง paste node 21 ใหม่ทั้งก้อน — แยกเป็นงานต่างหาก)
