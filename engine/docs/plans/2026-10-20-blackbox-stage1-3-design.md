# Design — Stage 1-3 เป็น blackbox sub-workflow (ใส่ doc_id → ได้ final payload)

Date: 2026-10-20 · Parent workflow: `soWzNNLrZ1c4Absf` · ผู้ใช้เลือก **โหมดรับ `doc_id`** (ไม่ใช่ไฟล์ PDF)

## 1. เป้าหมายของผู้ใช้ (คำพูดจริง)

> "อยากมองว่า stage 1-3 นั้นเป็น blackbox ที่เอามาต่อแล้วคืน final schema
> ส่วนของ debug เอาไว้ตรวจสอบผล bbox ของรอบนั้นๆ เฉยๆ, config ก็เอาไว้ใน blackbox,
> ฉันมีหน้าที่แค่เอา PDF ใส่เข้าไปแล้วได้ final payload และจะเห็นส่วนของ bbox ที่ debug group"

⇒ parent บางมาก: `doc_id` → blackbox → final payload (+เห็นรูป bbox จาก Debug group)

## 2. สถาปัตยกรรม

```
PARENT "DMS Invoice OCR + BBox (Explained) v2"
  Webhook/Manual trigger  {doc_id: 89}
    -> Execute Sub-workflow [BLACKBOX]        (รอผล, คืน 1 item)
    -> 11a Page to BMP          ┐
       11b Draw bbox outlines   ├ group "Debug" = ดู bbox ของรอบนี้เท่านั้น
       11c Annotated to JPEG    ┘
    -> 23 Build API response    (input-driven อยู่แล้ว ไม่ต้องแก้)
    -> Respond to Webhook (json)

BLACKBOX "DMS Invoice OCR + Validate (blackbox)"
  When Executed by Another Workflow  ({doc_id})
    -> 00 CONFIG (single point)        ← config อยู่ข้างในตามที่ขอ
    -> Get a document (Paperless)      ← ดึง PDF จาก doc_id, checksum = file_sha256
    -> 02 03 04 05                     (classify + เลือกหน้า invoice)
    -> 06 07 08 09 10                  (150 DPI + หมุน + OCR + bbox math)
    -> 12 Build final JSON + images    (envelope + overlay[] + ขนาดภาพ + page_original)
    -> 21 Validate (port)              (engine Oracle + payload + sha256)
    -> 22 Verification report          (input-driven แล้ว)
  คืน item เดียว: { …report ของ 22…, engine: payload, binary: {page_original}, overlay, img_w, img_h }
```

**ทำไม Debug group อยู่ parent**: 11b ต้องการแค่ `overlay[]` (พิกเซล) + ภาพหน้าสะอาด ซึ่ง blackbox คืนได้
การวาดกรอบจึงเป็น pure display ไม่แตะผล validate เลย — ตรงนิยาม "ดูผล bbox ของรอบนั้นๆ เฉยๆ"

**ทำไม `00 CONFIG` ถึงไม่พัง**: ref `$('00 CONFIG')` ของ 03/04/06/09/10/12 กลายเป็น ref *ภายใน workflow เดียว*
และ `$('04')/$('05')/$('09')/$('10')` ของ node 12 ก็เช่นกัน ⇒ ไม่ต้อง refactor 6 จุดที่เคยเตือน

## 3. สัญญาข้อมูลระหว่างกัน (contract)

เข้า (parent → blackbox): `{ "doc_id": <int> }` (ไม่ส่ง binary)

ออก (blackbox → parent):
| คีย์ | ที่มา | ใช้ทำอะไร |
|---|---|---|
| `engine` | output ของ node 22 (คีย์ `engine`) | `23` ประกอบเป็น top-level result/3.0 |
| `table` / `report_text` / `verdict` / `halted_by` / `max_severity` / `exception_codes` / `parity_ok` / `parity_expected` / `payload_sha256` / `mode` / `doc_id` / `cards` / `missing` / `engine_ok` / `engine_source` | node 22 | `23` ยัดเข้า `verification` |
| `overlay`, `img_w`, `img_h` | node 10/12 (ลากผ่าน 12/21/22) | `11b` วาดกรอบ |
| `binary.page_original` | node 12/21 ส่งต่อ | 11a-11c เอาไปวาด แล้วได้ `annotated` |

`22` ต้องส่ง `overlay`/`img_w`/`img_h` ต่อด้วย (ตอนนี้ยังไม่ส่ง) → เพิ่ม 3 คีย์

## 4. ความเสี่ยงที่ต้องพิสูจน์ก่อน (Task 0) — **พิสูจน์แล้ว: ผ่าน ✅**

สร้าง workflow คู่ทิ้ง (`ZZ PROBE Binary Parent` → `ZZ PROBE Binary Out (child)`, exec **396** แล้ว archive ทั้งคู่)

| คำถาม | ผล |
|---|---|
| binary ที่ child สร้าง **คืนถึง parent ไหม** | **ได้** — parent เห็น `probe_out` mime `image/png` 70 B, id `filesystem-v2:workflows/GkI5kUiyz9UqmDbW/executions/396/binary_data/4a4dc119…` (n8n จัดเก็บใหม่ใต้ execution ของ parent ⇒ อ่านได้จริงปลายทาง) |
| json คืนครบไหม | ครบ (`{probe:'child-ran'}`) |
| binary **ขาเข้า** (parent → child) | **ไม่ผ่าน** (`got_binaries: []`) — trigger type นี้รับเฉพาะ json |

⇒ **โครงที่วาดไว้ในข้อ 2 ใช้ได้จริง** Debug group วาดกรอบที่ parent ได้ เพราะหน้า PNG สะอาดไหลออกมาจาก blackbox
⇒ ไม่ต้องใช้แผนสำรอง base64 สำหรับขาออก
⇒ และ **ยืนยันว่าโหมด "ส่ง `doc_id`" เป็นตัวเลือกที่ถูก**: ถ้าจะส่ง *ตัว PDF* จาก parent ต้องแปลงเป็น base64 ใน json
   (Execute Sub-workflow v1.2 ไม่มีออปชันส่ง binary ขาเข้า — `options` มีแค่ `waitForSubWorkflow`)

ข้อควรระวังที่ตามมา: image ขนาด ~1 MB ต่อรอบจะไหลข้ามขอบทุกครั้ง — ยอมรับได้ (เคยค้าง UI ที่ 8.4 MB)

## 5. งานที่ต้องทำ (ลำดับ)

0. **probe binary round-trip** (workflow ทิ้ง 2 ตัว → ลบทิ้ง)
1. สร้าง blackbox workflow + `When Executed by Another Workflow` + ย้าย node ชุด Stage 1-3 + `12` เข้าไป
2. สร้าง node `21 Validate (port)` ใน blackbox (ตัวเดิมถูกลบไปแล้ว) — **ต้อง paste มือ**
   จาก `engine/temp/n8n_port/dist/node21_inline.js` (260,072 ตัวอักษร; ส่งผ่าน API ไม่ได้)
3. แก้ `12`: ส่งออก `page_original` + `overlay` + `img_w/img_h` (เลิกพึ่ง `annotated` เพราะจะไปเกิดที่ parent)
4. แก้ `22`: ส่ง `overlay`/`img_w`/`img_h` ต่อ
5. แก้ `11b`: `...$input.first().json` (ปัจจุบันคืน json ตัวเองอย่างเดียว ผล engine จะหลุด)
6. parent: ใส่ trigger + `Execute Sub-workflow` → ต่อ `11a → 11b → 11c → 23`
7. รันเทียบผล: ต้องได้ `payload_sha256` เดิมของเอกสารเดิม (เทียบ exec เก่า 395 = `sha256:d8ff7ac5…`)
   และ 9 แถว verdict เท่าเดิม

## 6. สิ่งที่ไม่ทำ

* ไม่ย้าย `23` เข้า blackbox (ต้องอยู่ parent เพราะต้องเอา `annotated` ที่ parent วาด ขึ้น response)
* ไม่ส่งรูปกลับแบบ base64 ถ้า probe แล้วยังไม่ต้องใช้
* ไม่แก้ `21` (inline engine) — ห้ามแตะ เพราะ parity ผูกกับไฟล์นั้นทั้งก้อน

## 7. เกณฑ์ผ่าน

* parent รันด้วย `doc_id` เดิมแล้ว `engine.integrity.payload_sha256` == ของเดิม (parity ไม่เปลี่ยน)
* Debug group แสดง `annotated` ที่มี **กรอบ ไม่ใช่กล่องทึบ** (exec 382 พิสูจน์วิธีวาดไว้แล้ว)
* `verification.missing = 0` และ `engine_ok = true`
* parent ไม่มี `$()` ที่ชี้เข้า blackbox (ไม่อย่างนั้นจะพังแบบเงียบ)
