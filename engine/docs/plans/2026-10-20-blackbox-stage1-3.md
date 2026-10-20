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

- [ ] **T16-2 (มนุษย์)** n8n → Import from file → เลือก `engine/temp/n8n_port/blackbox.json`
      แล้วบอก workflow id ใหม่ (ยัง **ไม่ต้อง** publish)
- [ ] **T16-3** ทดสอบ blackbox เดี่ยว ๆ: Execute Workflow → trigger `BB TRIGGER` ด้วย `{ "doc_id": 89 }`
      เกณฑ์: `json.port.payload_sha256 == sha256:d8ff7ac5b51324f8…` (exec 395), `engine_ok=true`,
      `missing=0`, output มี `binary.page_original` และ `overlay` ไม่ว่าง
      → **ถ้า sha ไม่ตรง ห้ามไปต่อ** (แปลว่าการย้ายทำ parity เสีย)
- [ ] **T16-4** จัดการ parent (ผ่าน MCP ทั้งหมด):
      * เพิ่ม trigger (Manual หรือ Webhook) + node `BB Call (Execute Sub-workflow)` ชี้ id จาก T16-2
        (`mode: 'each'`, `source: 'database'`, `workflowInputs: omitted` เพราะ trigger เป็น passthrough)
      * ลบ nodeที่ย้ายไปแล้ว: `00 CONFIG`, `Get a document`, `02`-`10`, `12`, `22`
      * `11a Page to BMP`: `dataPropertyName` จาก `page` → **`page_original`** (BB ส่ง key นี้กลับมา)
      * เพิ่ม node `14 Merge payload + annotated` ระหว่าง `11c` → `23` (โค้ดสั้น เขียนใหม่ ไม่แตะ `11b` 6.3 KB):
        ```js
        const bb = $('BB Call (Execute Sub-workflow)').first();
        const cur = $input.first();
        return [{ json: { ...bb.json, bbox_debug: cur.json },
                  binary: { page_original: (bb.binary||{}).page_original, annotated: (cur.binary||{}).annotated } }];
        ```
        เหตุผลที่ใช้ node ใหม่แทนการแก้ `11b`: `11b` คืน json ของตัวเอง (ผล engine หลุด) —
        แก้ที่ปลายทางถูกกว่าและไม่ต้อง print โค้ด pixel-writer 160 บรรทัดกลับเข้าไป (เสี่ยง typo)
      * สายใหม่: `trigger → BB Call → 11a → 11b → 11c → 14 → 23`
- [ ] **T16-5** รัน parent ทั้งเส้นด้วย `doc_id 89` → เทียบ sha กับ exec 395 + ดู `annotated` ใน Debug group
      ว่ายังเป็น **กรอบ** ไม่ใช่กล่องทึบ
- [ ] **T16-6** (ทางเลือก) ทำ parent ตัวเก่าเป็นสำรองก่อนลบ: บันทึก version ผ่าน version history

## เกณฑ์ความสำเร็จรวม

1. parent มี node ≤ 7 ตัว: trigger, BB Call, 11a, 11b, 11c, 14, 23
2. parent ไม่มี `$()` ชี้เข้า blackbox เลย (อ่านจาก input / `$('BB Call')` ของตัวเองเท่านั้น)
3. `payload_sha256` ของ doc เดิม == ของเดิมก่อนย้าย ( parity)
4. Debug group ยังแสดงรูป bbox ของรอบนั้น ๆ ได้ตามต้องการของผู้ใช้
