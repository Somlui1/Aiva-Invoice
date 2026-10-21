# Autonomous Invoice OCR & BBox Perfection Loop — Plan & Prompt Specification

- **Target Agent:** PI Agent (Autonomous Pair / Worker Agent)
- **Target Corpus:** All Invoice documents in Paperless (tag: invoice)
  - **รอบย่อย:** ใช้ชุดสุ่มคงที่ 50 ฉบับ (`config/eval_staged_50_ids.json` สุ่มด้วย seed=42) เพื่อความรวดเร็วในการ Debug
  - **รอบปิดงาน (Final Full Round):** บังคับรันและยืนยันผลกับ **Invoice ทั้งหมดใน Paperless** (~125 ฉบับ)
- **Execution Mode:** Multi-Round Autonomous Visual Inspection Loop (สูงสุด 8 รอบ)

---

## 1. ขอบเขตและสิทธิ์ของ PI Agent

### 1.1 Paperless
- **READ-ONLY เท่านั้น** — ห้ามแก้ Tag, ห้ามลบเอกสาร, ห้ามเขียนข้อมูลกลับไปยัง Paperless
- การคัดเอกสารออกหรือดึงเอกสารเข้าชุดทดสอบ ให้บันทึกไว้ในไฟล์ของรอบนั้นเท่านั้น

### 1.2 ไฟล์ที่อนุญาตให้แก้ (Whitelist)
- Prompts: `config/prompts/single_pass_extract.md`, `config/prompts/single_pass_classify.md`
- Perception: `src/system_a/perception/coords.py`, `src/system_a/perception/single_pass.py` (select_invoice_pages, normalize_classify), `src/system_a/perception/assembler.py`, `src/system_a/perception/cache.py`
- Scripts & Config: `scripts/test_invoice_single_pass.py`, `scripts/render_debug_bboxes.py`, `config/eval_staged_50_ids.json`
- Tests: `tests/test_coords_rotation.py`, `tests/test_single_pass.py`, `tests/test_ocr_improvements.py`
- Workspace: `bbox_testing/` (อยู่ใน .gitignore แล้ว ไม่ต้อง commit รูปภาพ)

### 1.3 ไฟล์ที่ห้ามแตะ
`src/system_a/matching.py`, `src/system_a/rules.py` (V-01..V-08), Oracle, Frontend

### 1.4 Test & Git
- ⚠️ **ห้ามลบ ห้ามแก้ หรือผ่อน assert เดิมใน unit test** — เพิ่ม test case ใหม่ได้อย่างเดียว
- ก่อนเริ่มรอบ 1 ให้รัน baseline `pytest tests/` และบันทึกผล (ปัจจุบันผ่าน 19/19)
- ก่อนจบทุกรอบ: `pytest tests/` ต้องผ่าน 100% แล้ว commit 1 ครั้งต่อรอบ (เฉพาะโค้ดและ prompt)

---

## 2. DPI, Determinism และ Cache

- **DPI = 130 ทุกขั้นตอน** (กำหนดที่ `RENDER_DPI = int(os.getenv("RENDER_DPI", "130"))` ใน `scripts/test_invoice_single_pass.py`)
  - แปลง PDF เป็นรูปใน `source_images/`
  - ส่งรูปให้ VLM
  - วาด BBox ใน `rendered/`
  - ⚠️ ถ้า DPI ต่างกัน พิกัดจะเลื่อนทั้งเอกสาร
- **temperature = 0** ในทุก API call
- **เกณฑ์ "เปลี่ยน" ระหว่างรอบ:**
  - พิกัดขยับ **มากกว่า 5 px** (หรือ delta > 0.005 ใน normalized scale)
  - ข้อความเปลี่ยนแม้ตัวอักษรเดียว
- **Cache:** ล้างหรือบายพาส `.cache/perception/` ของเอกสารที่ทดสอบทุกรอบ

---

## 3. สำเนา vs การคัดเอกสารออก

### กรณีที่ 1: PDF มีหน้าต้นฉบับ + หน้าสำเนา/เอกสารอื่นในไฟล์เดียวกัน
- ตัวอย่าง: p1 ใบกำกับภาษีต้นฉบับ, p2 สำเนา, p3 ใบส่งของ
- ➡️ แก้ `select_invoice_pages()` และ `single_pass_classify.md` ให้เลือกเฉพาะหน้าต้นฉบับ
- ➡️ **เก็บเอกสารไว้ในชุดทดสอบต่อ ห้ามคัดออก**
- ➡️ หน้าที่ไม่ถูกเลือก **ต้องไม่มี BBox** ถ้าระบบเลือกหน้าผิด หรือดึงข้อมูลจากหน้าสำเนา ให้นับเป็น **CLASSIFY FAIL**

### กรณีที่ 2: ทั้งไฟล์ไม่มีหน้า Invoice ต้นฉบับเลย
- ตัวอย่าง: ใบส่งของล้วน, PO ล้วน, ใบเสร็จที่ไม่ใช่ใบกำกับภาษี
- ➡️ คัดทั้งฉบับออก และบันทึกใน `round_XX/excluded_docs.md` พร้อมเหตุผลและรูปหลักฐาน
- ➡️ ปรับ `single_pass_classify.md` ให้จำแนกเอกสารประเภทนี้ได้ถูกต้อง

### กรณีที่ 3: Invoice จริงที่ไม่มี tag: invoice (จากการสุ่มตรวจรอบ 1)
- ➡️ ดึงเข้าชุดทดสอบ และบันทึกใน `round_XX/added_docs.md` (ห้ามแก้ tag ใน Paperless)

---

## 4. โครงสร้างโฟลเดอร์ (ใช้แบบนี้แบบเดียว, รหัส DMS-<id>)

```
bbox_testing/
  source_images/
    DMS-<id>_p<page>.png            ← รูปต้นฉบับ 130 DPI (สร้างครั้งเดียว ไม่แก้)
  round_01/
    rendered/
      DMS-<id>_p<page>_bbox.png     ← รูปที่วาด BBox + label + สีแยกประเภท
    crops/
      DMS-<id>_<field>.png          ← รูปซูมเฉพาะจุด
    ocr/
      DMS-<id>.json                 ← ผล OCR และพิกัด
    review/
      DMS-<id>.md                   ← บันทึกการตรวจรายฉบับ
    excluded_docs.md                ← เอกสารที่ไม่ใช่ Invoice ทั้งฉบับ
    added_docs.md                   ← Invoice ที่ดึงเข้ามาจากนอก tag (ถ้ามี)
    scorecard.md                    ← สรุปผลประจำรอบ
  round_02/
    ...
```

---

## 5. วิธีดูรูปและขอบเขตการตรวจ

### 5.1 วิธีดูรูป
1. เปิด `rendered/DMS-<id>_p<page>_bbox.png` ด้วยเครื่องมืออ่านรูป **ห้ามตัดสินจาก JSON หรือตัวเลขอย่างเดียว**
2. เปิด `source_images/DMS-<id>_p<page>.png` หน้าเดียวกันมาเทียบเสมอ
3. ถ้าตัวอักษรเล็กหรือกรอบชิดกันจนมองไม่ชัด ให้ crop ขยาย เก็บใน `crops/` แล้วเปิดดูอีกครั้ง
4. วาด BBox พร้อม label ชื่อ field และสีแยกประเภท
5. ตรวจครบทุกหน้า (p1..pN) รวมหน้าที่ไม่ถูกเลือก เพื่อยืนยันว่าไม่มี BBox หลุดไป

### 5.2 ขอบเขตการตรวจแต่ละรอบ
- **รอบ 1 (Baseline — ชุด 50 ฉบับ):**
  - รันทั้ง 50 ฉบับ และ**เปิดดูรูปครบ 100%**
  - สุ่มตรวจเอกสารที่ไม่มี tag: invoice เพิ่ม 5–10 ฉบับ (ดูกรณีที่ 3)
- **รอบ 2 ขึ้นไป (ชุด 50 ฉบับเดิม):**
  - รันใหม่ทั้ง 50 ฉบับ
  - เปิดดูรูป**ทุกฉบับที่รอบก่อน FAIL** (100%)
  - เทียบ `ocr/DMS-<id>.json` กับรอบก่อน: **ฉบับที่ข้อความเปลี่ยนหรือพิกัดขยับเกิน 5 px ต้องเปิดดู 100%**
  - ฉบับที่ผลไม่เปลี่ยน: สุ่มเปิดดูอย่างน้อย 10 ฉบับ (หรือ 20% ถ้ามากกว่า)
  - ⚠️ ถ้าฉบับที่เคย PASS พังลง (Regression) ต้องแก้หรือ rollback ก่อนเริ่มรอบถัดไป
- **รอบปิดงาน (Final Full Round — Invoice ทั้งหมด):**
  - รันกับ Invoice ทั้งหมด
  - **ฉบับนอกชุด 50 ที่ยังไม่เคยตรวจ ต้องเปิดดูรูป 100%**
  - ชุด 50 ฉบับเดิม: ตรวจตามเกณฑ์ของรอบ 2 ขึ้นไป

---

## 6. เกณฑ์การตัดสิน

### 6.1 BBox ตรง (ต้องผ่านทุกข้อ)
- กรอบครอบข้อความของ field ครบ ไม่ตัดหรือแหว่งตัวอักษร
- ไม่มีพื้นที่ว่างเกินจนกินข้อความข้างเคียง
- ไม่จับ field อื่น หรือจับ label แทนค่า (เช่น จับคำว่า "วันที่" แทนตัววันที่)
- ไม่มีกรอบซ้ำของ field เดียวกัน
- ตำแหน่งไม่เลื่อนจากข้อความจริง (สเกลและการหมุนถูกต้อง)
- line_bbox ต้องเป็นแนวนอนคลุมทั้งแถว **Aspect Ratio (กว้าง/สูง) ≥ 1.5** ห้ามเป็นแท่งแนวตั้ง
- **ห้ามมีกรอบหลอน:** ถ้าบนเอกสารไม่มี field นั้น แต่มีกรอบ ให้นับเป็น BBOX FAIL

### 6.2 OCR ครบ
- **Field บังคับ:** invoice_num, invoice_date, supplier_name, supplier_tax_id, customer_name, line_items (ทุกแถว), sub_total, vat, grand_total
- line_items: บันทึก **จำนวนแถวในรูป เทียบกับจำนวนแถวที่ OCR อ่านได้**
- มีในรูปต้นฉบับแต่ OCR ไม่มี ➡️ **ขาด (FAIL)**
- ไม่มีในรูปต้นฉบับจริง ➡️ บันทึก **"ไม่มีในเอกสาร"** ไม่นับเป็นความผิด
- ค่าต้องตรงกับรูปต้นฉบับ ทั้งตัวเลข ทศนิยม และวันที่

---

## 7. รูปแบบ review/DMS-<id>.md (ต้องมีทุกฉบับที่ตรวจ)

```
doc_id: DMS-<id>
ไฟล์ที่เปิดดู: rendered/DMS-<id>_p1..pN_bbox.png, source_images/DMS-<id>_p1..pN.png
หน้าที่ระบบเลือกเป็นต้นฉบับ: p<X> | หน้าที่ไม่ถูกเลือก: p<Y>, p<Z> (ไม่มี BBox: ใช่/ไม่ใช่)
เป็น Invoice จริงไหม: ใช่ / ไม่ใช่ (ใบส่งของล้วน, PO, ใบเสร็จ ฯลฯ)
สิ่งที่เห็นในรูป: <อธิบายจากสิ่งที่เห็นจริง เช่น "กรอบ grand_total ครอบ 12,500.00 พอดี, ตารางสินค้ามี 5 แถว">
การตรวจตารางสินค้า: จำนวนแถวในรูป <N> | จำนวนแถวที่ OCR อ่านได้ <N>
BBox: ผ่าน / ไม่ผ่าน — <field ที่ผิด + ผิดอย่างไร>
OCR: ครบ / ขาด — <field ที่ขาด + ค่าจริงที่เห็นในรูป>
ประเภทปัญหา: BBOX / OCR / CLASSIFY / MODEL_LIMIT / ไม่มี
วิธีที่ลองแก้แล้ว (MODEL_LIMIT ต้องมี ≥ 2 วิธี):
  1. <วิธีที่ 1>
  2. <วิธีที่ 2>
ผลสรุป: PASS / FAIL / MODEL_LIMIT
```

> ช่อง "สิ่งที่เห็นในรูป" ห้ามว่าง ถ้าไม่มีรายละเอียด ให้ถือว่ายังไม่ได้ตรวจ

---

## 8. การแยกประเภทปัญหาและสิ่งที่ต้องแก้

| ประเภท | อาการ | สิ่งที่ต้องแก้ |
|---|---|---|
| **BBOX** | กรอบเลื่อน ตัดขอบ จับผิด field กล่องแนวตั้ง กรอบหลอน | `coords.py`, prompt ส่วน layout ใน `single_pass_extract.md` |
| **OCR** | field ขาด อ่านค่าผิด ทศนิยมเพี้ยน แถวสินค้าไม่ครบ | prompt ส่วน OCR ใน `single_pass_extract.md`, logic parsing ใน `assembler.py` |
| **CLASSIFY** | เลือกหน้าสำเนา/หน้าผิด, เอกสารอื่นถูกคัดเป็น Invoice | `single_pass_classify.md`, `select_invoice_pages()` (ดูหัวข้อ 3) |
| **MODEL_LIMIT** | ลองแก้แล้ว ≥ 2 วิธีแต่ยังผิดแบบเดิม (หมึกจาง ตัวกลืน) | บันทึกหลักฐานรูปและวิธีที่ลองแล้วใน review ไม่ต้องแก้ต่อ |

---

## 9. รูปแบบ excluded_docs.md

```
# Excluded Documents — Round <XX>
| doc_id | ประเภทเอกสารจริง | เหตุผลที่คัดออก | รูปหลักฐาน |
|---|---|---|---|
| DMS-<id> | <เช่น ใบส่งของล้วน> | <เหตุผล> | [ดูรูป](../source_images/DMS-<id>_p1.png) |
```

---

## 10. รูปแบบ scorecard.md

```
# Scorecard — Round <XX>
ชุดเอกสารรอบนี้: ชุด 50 ฉบับ / Full Corpus
เอกสารที่สแกนทั้งหมด: <N_scanned> ฉบับ
คัดออก (ไม่ใช่ Invoice ทั้งฉบับ): <N_excluded> ฉบับ (ดู excluded_docs.md)
ดึงเข้า (Invoice นอก tag): <N_added> ฉบับ (ดู added_docs.md)
Net Active Pool: <N_net> ฉบับ
จำนวนฉบับที่เปิดดูรูปรอบนี้: <N_viewed> ฉบับ

## 1. เทียบกับรอบก่อน (ชุดเอกสารเดียวกัน)
| รายการ | รอบก่อน | รอบนี้ | ผลต่าง |
|---|---|---|---|
| PASS | <n> | <n> | <+/-> |
| FAIL | <n> | <n> | <+/-> |
| MODEL_LIMIT | <n> | <n> | <+/-> |
| PASS Rate | <x>% | <x>% | <+/->% |

## 2. แยกตามประเภทปัญหา
- BBOX: <n> | OCR: <n> | CLASSIFY: <n> | MODEL_LIMIT: <n>

## 3. ฉบับที่ยังไม่ผ่าน
| doc_id | ประเภท | รายละเอียด | รูป |
|---|---|---|---|
| DMS-<id> | <ประเภท> | <รายละเอียด> | [เปิดดู](rendered/DMS-<id>_p1_bbox.png) |

## 4. สิ่งที่แก้ในรอบนี้
- ไฟล์/ฟังก์ชันที่แก้: <...>
- ฉบับที่ดีขึ้น: <...>
- Regression (ถ้ามี) และวิธีแก้/rollback: <...>
- pytest: <ผ่าน x/x> | commit: <hash>
```

---

## 11. เงื่อนไขหยุด

**เข้าสู่ Final Full Round** เมื่อเข้าข้อใดข้อหนึ่ง:
1. ชุด 50 ฉบับเป็น PASS หรือ MODEL_LIMIT ครบ 100%
2. 2 รอบติดกันที่ PASS Rate ของชุด 50 ฉบับไม่เพิ่มขึ้น
3. ใช้ไปแล้ว 7 รอบ (รอบ 8 บังคับเป็น Final Full Round)

**หลัง Final Full Round:**
- ถ้าทุกฉบับใน Net Active Pool เป็น PASS หรือ MODEL_LIMIT ➡️ **จบงาน**
- ถ้ายังมี FAIL และยังเหลือรอบ (ไม่เกิน 8) ➡️ แก้ได้ 1 รอบ แล้วรัน Full Corpus ซ้ำ
- ถ้าครบ 8 รอบแล้ว ➡️ **ห้ามแก้โค้ดเพิ่ม** รายงานฉบับที่ยัง FAIL ใน scorecard แล้วจบงาน

⚠️ ห้ามประกาศจบงานโดยยังไม่ได้รัน Full Corpus อย่างน้อย 1 รอบ

---

## 12. PI Agent Ready-to-Run Prompt

คัดลอกทั้งหมดใน code block ด้านล่างไปสั่ง PI Agent

````
# ภารกิจ: ปรับปรุง OCR & BBox ของ Invoice ใน Paperless แบบวนรอบ จนได้ผลดีที่สุด

## 1. สิทธิ์และความปลอดภัย
คุณคือ PI Agent ทำงานในไดเรกทอรี `engine/`
- Paperless API: READ-ONLY ห้ามแก้ tag ห้ามลบเอกสาร ห้ามเขียนข้อมูลกลับ
- แก้ไขได้เฉพาะ:
  - config/prompts/single_pass_extract.md
  - config/prompts/single_pass_classify.md
  - src/system_a/perception/coords.py
  - src/system_a/perception/single_pass.py (select_invoice_pages, normalize_classify)
  - src/system_a/perception/assembler.py
  - src/system_a/perception/cache.py
  - scripts/test_invoice_single_pass.py, scripts/render_debug_bboxes.py, config/eval_staged_50_ids.json
  - tests/test_coords_rotation.py, tests/test_single_pass.py, tests/test_ocr_improvements.py
  - bbox_testing/ (อยู่ใน .gitignore ไม่ต้อง commit รูป)
- ห้ามแตะ: src/system_a/matching.py, src/system_a/rules.py (V-01..V-08), Oracle, Frontend
- ห้ามลบ ห้ามแก้ หรือผ่อน assert เดิมใน test เพิ่ม test ใหม่ได้อย่างเดียว
- ก่อนเริ่มรอบ 1 รัน baseline `pytest tests/` และบันทึกผล (ปัจจุบัน 19/19)
- ก่อนจบทุกรอบ `pytest tests/` ต้องผ่าน 100% แล้ว commit 1 ครั้งต่อรอบ (เฉพาะโค้ดและ prompt)

## 2. ชุดเอกสาร
- รอบย่อย: ชุดคงที่ 50 ฉบับใน config/eval_staged_50_ids.json (seed=42)
- รอบปิดงาน (Final Full Round): Invoice ทั้งหมดใน Paperless (~125 ฉบับ)
- รอบ 1: สุ่มตรวจเอกสารที่ไม่มี tag: invoice เพิ่ม 5–10 ฉบับ ถ้าเป็น Invoice จริงให้ดึงเข้าชุดทดสอบและบันทึกใน added_docs.md

## 3. สำเนา vs การคัดออก
- PDF มีหน้าต้นฉบับ + สำเนา/เอกสารอื่น: แก้ select_invoice_pages() และ single_pass_classify.md ให้เลือกเฉพาะหน้าต้นฉบับ และเก็บเอกสารไว้ในชุดทดสอบต่อ (ห้ามคัดออก) หน้าที่ไม่ถูกเลือกต้องไม่มี BBox ถ้าเลือกหน้าผิดหรือดึงข้อมูลจากหน้าสำเนา = CLASSIFY FAIL
- ทั้งไฟล์ไม่ใช่ Invoice: คัดออก บันทึกใน round_XX/excluded_docs.md พร้อมเหตุผลและรูปหลักฐาน

## 4. โครงสร้างโฟลเดอร์ (แบบเดียว)
bbox_testing/
  source_images/DMS-<id>_p<page>.png          (130 DPI สร้างครั้งเดียว ไม่แก้)
  round_XX/
    rendered/DMS-<id>_p<page>_bbox.png        (BBox + label + สีแยกประเภท)
    crops/DMS-<id>_<field>.png
    ocr/DMS-<id>.json
    review/DMS-<id>.md
    excluded_docs.md
    added_docs.md
    scorecard.md

## 5. DPI, Determinism, Cache
- RENDER_DPI = 130 ทุกขั้นตอน (แปลง PDF, ส่ง VLM, วาด BBox)
- temperature = 0 ทุก API call
- นับว่า "เปลี่ยน" เมื่อพิกัดขยับ > 5 px (delta > 0.005) หรือข้อความเปลี่ยน
- ล้าง/บายพาส .cache/perception/ ของเอกสารที่ทดสอบทุกรอบ

## 6. วิธีตรวจรูป
1. เปิด rendered/..._bbox.png ด้วยเครื่องมืออ่านรูป ห้ามตัดสินจาก JSON หรือตัวเลขอย่างเดียว
2. เปิด source_images/... หน้าเดียวกันมาเทียบเสมอ
3. มองไม่ชัดให้ crop ขยาย เก็บใน crops/ แล้วเปิดดูอีกครั้ง
4. ตรวจครบทุกหน้า p1..pN รวมหน้าที่ไม่ถูกเลือก

ขอบเขตการตรวจ:
- รอบ 1: รันชุด 50 ฉบับ เปิดดูรูปครบ 100%
- รอบ 2 ขึ้นไป: รันชุด 50 ฉบับใหม่ทั้งหมด เปิดดูทุกฉบับที่รอบก่อน FAIL, ทุกฉบับที่ข้อความเปลี่ยนหรือพิกัดขยับ > 5 px และสุ่มฉบับที่ไม่เปลี่ยนอย่างน้อย 10 ฉบับ (หรือ 20%)
- Final Full Round: ฉบับนอกชุด 50 ที่ยังไม่เคยตรวจ ต้องเปิดดู 100% ส่วนชุด 50 เดิมตรวจตามเกณฑ์รอบ 2 ขึ้นไป
- ถ้าฉบับที่เคย PASS พังลง ต้องแก้หรือ rollback ก่อนเริ่มรอบถัดไป

## 7. เกณฑ์การตัดสิน
BBox ตรง (ต้องผ่านทุกข้อ):
- ครอบข้อความครบ ไม่ตัดตัวอักษร
- ไม่มีพื้นที่ว่างเกินจนกินข้อความข้างเคียง
- ไม่จับ field อื่นหรือจับ label แทนค่า
- ไม่มีกรอบซ้ำของ field เดียวกัน
- ตำแหน่งไม่เลื่อน (สเกลและการหมุนถูกต้อง)
- line_bbox เป็นแนวนอนคลุมทั้งแถว Aspect Ratio (กว้าง/สูง) >= 1.5
- ไม่มีกรอบหลอน: ไม่มี field บนเอกสารแต่มีกรอบ = BBOX FAIL

OCR ครบ:
- Field บังคับ: invoice_num, invoice_date, supplier_name, supplier_tax_id, customer_name, line_items (ทุกแถว), sub_total, vat, grand_total
- มีในรูปแต่ OCR ไม่มี = ขาด (FAIL)
- ไม่มีในรูปจริง = บันทึก "ไม่มีในเอกสาร" ไม่นับเป็นความผิด
- ค่าต้องตรงกับรูป ทั้งตัวเลข ทศนิยม และวันที่

## 8. review/DMS-<id>.md (ต้องมีทุกฉบับที่ตรวจ)
doc_id: DMS-<id>
ไฟล์ที่เปิดดู: rendered/DMS-<id>_p1..pN_bbox.png, source_images/DMS-<id>_p1..pN.png
หน้าที่ระบบเลือกเป็นต้นฉบับ: p<X> | หน้าที่ไม่ถูกเลือก: p<Y> (ไม่มี BBox: ใช่/ไม่ใช่)
เป็น Invoice จริงไหม: ใช่ / ไม่ใช่ (<ประเภทเอกสาร>)
สิ่งที่เห็นในรูป: <อธิบายจากสิ่งที่เห็นจริง>
การตรวจตารางสินค้า: จำนวนแถวในรูป <N> | จำนวนแถวที่ OCR อ่านได้ <N>
BBox: ผ่าน / ไม่ผ่าน — <field + ผิดอย่างไร>
OCR: ครบ / ขาด — <field ที่ขาด + ค่าจริงในรูป>
ประเภทปัญหา: BBOX / OCR / CLASSIFY / MODEL_LIMIT / ไม่มี
วิธีที่ลองแก้แล้ว (MODEL_LIMIT ต้องมี >= 2 วิธี):
  1. <...>
  2. <...>
ผลสรุป: PASS / FAIL / MODEL_LIMIT
* ช่อง "สิ่งที่เห็นในรูป" ห้ามว่าง ถ้าว่างให้ถือว่ายังไม่ได้ตรวจ

## 9. ประเภทปัญหาและจุดที่ต้องแก้
- BBOX -> coords.py / prompt ส่วน layout ใน single_pass_extract.md
- OCR -> prompt ส่วน OCR ใน single_pass_extract.md / parsing ใน assembler.py
- CLASSIFY -> single_pass_classify.md / select_invoice_pages() (ทำตามข้อ 3)
- MODEL_LIMIT -> ลองแก้แล้ว >= 2 วิธีแต่ยังผิดแบบเดิม บันทึกหลักฐานใน review แล้วไม่ต้องแก้ต่อ

## 10. scorecard.md (ทุกรอบ)
1. ชุดเอกสารรอบนี้ (50 / Full), จำนวนที่สแกน, คัดออก, ดึงเข้า, Net Active Pool, จำนวนฉบับที่เปิดดูรูป
2. ตารางเทียบกับรอบก่อนในชุดเดียวกัน: PASS, FAIL, MODEL_LIMIT, PASS Rate
3. จำนวนแยกตามประเภท: BBOX, OCR, CLASSIFY, MODEL_LIMIT
4. รายชื่อฉบับที่ยังไม่ผ่าน พร้อมลิงก์รูป
5. ไฟล์/ฟังก์ชันที่แก้, ฉบับที่ดีขึ้น, regression และวิธีแก้, ผล pytest, commit hash

## 11. เงื่อนไขหยุด
เข้าสู่ Final Full Round เมื่อเข้าข้อใดข้อหนึ่ง:
1. ชุด 50 ฉบับเป็น PASS หรือ MODEL_LIMIT ครบ 100%
2. 2 รอบติดกันที่ PASS Rate ของชุด 50 ฉบับไม่เพิ่ม
3. ใช้ไปแล้ว 7 รอบ (รอบ 8 บังคับเป็น Final Full Round)

หลัง Final Full Round:
- ทุกฉบับเป็น PASS หรือ MODEL_LIMIT -> จบงาน
- ยังมี FAIL และยังไม่ครบ 8 รอบ -> แก้ได้ 1 รอบ แล้วรัน Full Corpus ซ้ำ
- ครบ 8 รอบแล้ว -> ห้ามแก้โค้ดเพิ่ม รายงานฉบับที่ยัง FAIL ใน scorecard แล้วจบงาน
ห้ามประกาศจบงานโดยยังไม่ได้รัน Full Corpus อย่างน้อย 1 รอบ
````
