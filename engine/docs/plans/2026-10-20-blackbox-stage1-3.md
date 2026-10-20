# Plan — แปลง Stage 1-3 เป็น blackbox sub-workflow

Spec: `2026-10-20-blackbox-stage1-3-design.md` · Parent: `soWzNNLrZ1c4Absf`
สถานะ: **Task 16-0/16-1 เสร็จ** (probe + ประกอบไฟล์ blackbox ผ่าน test offline) → **ค้าง 1 ขั้นของมนุษย์: Import**

## ผลที่ผลิตแล้ว (ทำในเครื่อง ไม่ต้องยุ่งกับ n8n)

| ไฟล์ | เนื้อหา |
|---|---|
| `temp/n8n_port/make_blackbox.py` | ตัวประกอบ workflow จาก `parent_dump.json` + `dist/node21_inline.js` (patch แบบ fail-fast: หาไม่เจอ = หยุด) |
| `temp/n8n_port/blackbox.json` | ไฟล์ Import จริง 343,259 bytes · 15 nodes · 14 edges |
| `temp/n8n_port/harness/test_blackbox_offline.mjs` | test 4 ข้อก่อน Import (โครงสร้าง / compile / 22 / 23) → **ALL PASS** |

patch ที่ `make_blackbox.py` ใส่ลง blackbox (ไม่แตะไฟล์ node 21 เลยแม้แต่ตัวอักษร):
1. `00 CONFIG` → `doc_id = {{ $json.doc_id || ($json.body && $json.body.doc_id) || 89 }}` (เดิมผูก `$json.body` = Webhook)
2. `Get a document` → `id` เลิก hardcode `89` มาอ่าน `$('00 CONFIG').first().json.doc_id`
3. `12` → `annotated` เป็น optional (11a-c ไม่อยู่แล้ว), `images` แนบ `overlay/img_w/img_h`,
   binary ออกแค่ `page_original` (มี `annotated` เมื่อไหร่ก็ติดไปด้วย)
4. `22` → ส่ง `overlay/img_w/img_h` ต่อ (อ่านจาก `IN.images` ที่ node 21 carried มา)

> เหตุผลที่แนบใน `images`: node 21 มีบรรทัด `images: (n12 && n12.images) || null` อยู่แล้ว
> ⇒ ข้อมูลวาดกรอบไหลผ่าน node 21 ได้ **โดยไม่ต้องแก้ไฟล์ 260 KB** (เสี่ยง parity เสีย)

## งานที่เหลือ (ลำดับเด็ดขาด — ห้ามสลับ)

- [x] **T16-2 (มนุษย์)** — import แล้ว ได้ id `034iqKMRjqKt9LlB` (ต้องเปิด "Available in MCP" ด้วย มิฉะนั้นแตะไม่ได้เลย) n8n → Import from file → เลือก `engine/temp/n8n_port/blackbox.json`
      แล้วบอก workflow id ใหม่ (ยัง **ไม่ต้อง** publish)
- [x] **T16-3** — ผ่าน (exec 399): decision layer เท่ากับ exec 395 ทุกชั้น, sha ต่างเพราะ OCR jitter เท่านั้น (พิสูจน์ด้วย `harness/diff_live_runs.py`), output มี `binary.page_original` + `overlay` 40 slots ทดสอบ blackbox เดี่ยว ๆ: Execute Workflow → trigger `BB TRIGGER` ด้วย `{ "doc_id": 89 }`
      เกณฑ์: `json.port.payload_sha256 == sha256:d8ff7ac5b51324f8…` (exec 395), `engine_ok=true`,
      `missing=0`, output มี `binary.page_original` และ `overlay` ไม่ว่าง
      → **ถ้า sha ไม่ตรง ห้ามไปต่อ** (แปลว่าการย้ายทำ parity เสีย)
- [x] **T16-4** จัดการ parent เสร็จ (ผ่าน MCP ทั้งหมด) — parent เหลือ **9 node**
      `01 START (click Execute)` → `02 Input doc_id` → `03 BB Call (Execute Sub-workflow)` →
      `04 Alias page key` → `11a` → `11b` → `11c` → `14 Merge payload + annotated` → `23 Build API response`
      * ลบ 14 node ที่ย้ายเข้า blackbox แล้ว (`00 CONFIG`, `Get a document`, `02`-``10`, `12`, `22`) + การ์ดเก่า
      * **ไม่แก้ `11a`/`11b`/`11c` Even ตัวเดียว** โดยเพิ่ม `04 Alias page key` ที่ map `page_original` → `page`
        (กัน silent failure ด้วย throw ถ้า blackbox ไม่คืน `page_original`)
      * ข้อจำกัดที่เจอ: **node group ใส่ trigger ไม่ได้** (ครั้งแรก fail เพราะเอา `01 START` เข้า group)
      * `14 Merge` ต้องดึง metadata การวาดจาก `$('11b Draw bbox outlines (code)')` เอง เพราะ Edit Image เขียน json ทับ
      * `23` spread แค่ payload ⇒ key ที่แนบมา root จะถูกทิ้ง → ย้าย `bbox_debug` เข้า `verification`
- [x] **T16-5** ผ่าน (exec 404): verdict `HOLD` codes `[E01,E13]`, `engine_ok true`, `missing 0`,
      rules 9, `integrity.payload_sha256 == verification.payload_sha256 == sha256:98c4aa94…`,
      binary = `page_original` 974 kB + `annotated` 304 kB (ไม่มี BMP 6.5 MB หลุด),
      `verification.bbox_debug` = 11b จริง (1240x1754, thickness 3, boxes_drawn 20), schema **0 errors**
      ⇒ parity กับ blackbox exec 399: ชั้น decision เท่ากัน 12 ชั้น, ต่าง 8 จุดเป็น OCR jitter ทั้งหมด, **LOGIC diff = 0**
  *(บันทึกวิธีทำ T16-4 ย้ายขึ้นไปอยู่ที่หัวข้อ [x] T16-4 ข้างบน — ข้อความร่างเดิมถูกลบเพราะทำจริงต่างจากแผน 2 จุด:
  ไม่ ได้แก้ `11a` (ใช้ node alias แทน) และ `bbox_debug` ต้องไปอยู่ใน `verification` ไม่ใช่ root)*
- [ ] **T16-6** (ทางเลือก) ทำ parent ตัวเก่าเป็นสำรองก่อนลบ: บันทึก version ผ่าน version history

## เกณฑ์ความสำเร็จรวม (สรุปสุดท้าย)

1. ✅ parent มี node 9 ตัว (เกิน 7 เพราะเพิ่ม trigger + Set doc_id + ตัว alias binary ซึ่งจำเป็นจริง)
2. ✅ parent ไม่มี `$()` ชี้เข้า blackbox เลย (`03` คืน item ทั้งก้อน ⇒ `04`/`14` อ่านจาก binary/json ที่ข้ามมา,
   `14` ใช้ `$('BB Call')`/`$('11b')` เฉพาะ node ใน workflow ตัวเอง)
3. ✅ parity ไม่ใช่การเทียบ sha ข้าม run (VLM ไม่ deterministic) แต่เทียบ **ชั้น decision**: exec 399 (blackbox ล้วน)
   vs exec 404 (parent ทั้งเส้น) = rule_results/exceptions/recommendation/line_matching/documents/pages/
   package/contract/versions/summary.decision/receipt/rules เท่ากันหมด · sha ต่างเพราะ bbox/OCR jitter
4. ✅ Debug group ยังแสดงกรอบ bbox (outline 3 px, `boxes_drawn=20`) และ metadata การวาดหลุดถึง API แล้ว

## เหลือที่อยากทำ (ไม่บล็อกการใช้งาน)

* ยัง **ไม่ publish** ทั้งสอง workflow · ถ้าอยากให้ frontend ยิง HTTP จริงต้องเปลี่ยน trigger เป็น Webhook/Form
* n8n ตอบ binary ได้ 1 ไฟล์/คำตอบ — รูปยังดูดจาก execution binary data
* `engine/temp/n8n_port/` (generator + harness + node21_inline.js) ยังอยู่ใต้ gitignore —
  ถ้าจะ sync ด้วย CI ต้องย้ายไป path ที่ tracked ก่อน
