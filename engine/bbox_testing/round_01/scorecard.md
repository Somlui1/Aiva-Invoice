# Scorecard — Round 01

ชุดเอกสารรอบนี้: **ชุด 50 ฉบับ** (`config/eval_staged_50_ids.json`, seed=42 จาก snapshot 223 ฉบับ)
เอกสารที่สแกนทั้งหมด: **50** ฉบับ | รันสำเร็จ **48** | pipeline error **2** (DMS-208, DMS-224)
คัดออก (ไม่ใช่ Invoice ทั้งฉบับ): **1** ฉบับ → DMS-223 (ดู `excluded_docs.md`)
ดึงเข้า (Invoice นอก tag): **0** ฉบับ (ยังไม่ทำ — ค้างรอบ 1, ดูหัวข้อ "ค้าง" ด้านล่าง)
Net Active Pool: **49** ฉบับ (50 − 1 ที่คัดออก)
จำนวนฉบับที่เปิดดูรูปรอบนี้: **11/49** ฉบับ (ยังไม่ครบ 100% — รอบ 1 ยังไม่ปิด, ต่อจากรอบหน้า)

## 1. เทียบกับรอบก่อน (ชุดเอกสารเดียวกัน)

| รายการ | รอบก่อน | รอบนี้ | ผลต่าง |
|---|---|---|---|
| PASS | — | 0 | baseline |
| FAIL | — | 11 | baseline |
| MODEL_LIMIT | — | 0 | baseline |
| PASS Rate | — | 0% (จากที่ตรวจแล้ว 11 ฉบับ) | baseline |

> รอบ 1 = baseline ตามแผนข้อ 5.2 ยังคิดอัตรา PASS จริงไม่ได้จนกว่าจะตรวจครบ 49 ฉบับ

## 2. แยกตามประเภทปัญหา (จาก 11 ฉบับที่ตรวจด้วยตาแล้ว)
- BBOX: **8** (DMS-25, DMS-26, DMS-47, DMS-69, DMS-106, DMS-117, DMS-233, DMS-234)
- CLASSIFY: **2** (DMS-134 เลือกสำเนา+ใบวางบิล, DMS-223 ใบส่งของล้วน)
- OCR: **1** (DMS-24 จับ "เลขที่ใบส่งสินค้า" เป็น invoice_num)
- MODEL_LIMIT: 0

## 3. ฉบับที่ยังไม่ผ่าน (ที่ตรวจแล้ว)

| doc_id | ประเภท | รายละเอียด | รูป |
|---|---|---|---|
| DMS-25 | BBOX | กล่อง `po_number` อยู่เหนือเลข 42052640 จริง ~20px บนช่องว่าง | [rendered](rendered/DMS-25_p2_bbox.png) · [crop](crops/DMS-25_po_number.png) |
| DMS-134 | CLASSIFY | สำเนา invoice เดียวกัน 3 หน้า (2213664477) ถูกเลือก 2 หน้า → แถวซ้ำ + เลือก "ใบวางบิล/ใบนำฝาก" (p4) เป็น Invoice และมีกรอบหลอน `currency` บน p4 | [rendered p4](rendered/DMS-134_p4_bbox.png) |
| DMS-223 | CLASSIFY | ทั้งไฟล์คือ ORIGINAL DELIVERY ORDER + PO ไม่มี invoice → คัดออก แต่ระบบยังดึงข้อมูลจากใบส่งของ | [source p1](../source_images/DMS-223_p1.png) |
| DMS-233 | BBOX | กล่อง header คอลัมน์ขวา (`invoice_num`/`invoice_date`/`po_number`) แตะขอบขวาบังเลขจริง; `customer_tax_id` อยู่บรรทัดผิด; `sub_total`/`vat`/`grand_total` เบียดกัน | [rendered](rendered/DMS-233_p1_bbox.png) |
| DMS-234 | BBOX | `line_1` เป็นแถบบาง AR=1.42; `customer_tax_id` วางบนบรรทัด "รหัสลูกค้า"; `currency` คร่อมเลข grand_total | [rendered](rendered/DMS-234_p1_bbox.png) |
| DMS-47 | BBOX | `region:company_stamp` วาด 2 กล่อง label ซ้ำ; `currency` วางบนคอลัมน์จำนวนเงิน; `invoice_num`/`invoice_date` ทับกัน | [rendered](rendered/DMS-47_p1_bbox.png) |
| DMS-69 | BBOX | `line_1` h=0.46 ครอบตารางว่างทั้งแถบ (AR 1.34) ทั้งที่ union ของ cell ให้ AR≈26; `po_number` อยู่เหนือค่าจริง; `customer_tax_id` อยู่บรรทัดที่อยู่ผู้ขาย | [rendered](rendered/DMS-69_p1_bbox.png) |
| DMS-106 | BBOX | `po_number` เป็นกล่องว่างใต้หัวคอลัมน์ "ใบสั่งซื้อเลขที่" ที่ว่างเปล่า (ต้อง crop ยืนยัน); `currency` ทับคอลัมน์ยอดรวม | [rendered](rendered/DMS-106_p1_bbox.png) |
| DMS-117 | BBOX | `po_number` เหนือค่าจริง 1 บรรทัด; `currency` ไปอยู่บนหัวคอลัมน์ "จำนวนเงิน"; กล่องยอดรวมถูกขอบขวาตัด (แถว 6/6 ตรง ✅) | [rendered](rendered/DMS-117_p1_bbox.png) |
| DMS-26 | BBOX | การเลือกหน้า **ถูกต้อง** (ต้นฉบับ 2 หน้า 1,3 / ทิ้งสำเนา 2,4+PO) แถวครบ 19/19 แต่ `line_*` ทุกกล่องวางบนเส้นขอบบนของแถว ไม่ครอบข้อความ | [rendered p1](rendered/DMS-26_p1_bbox.png) · [p3](rendered/DMS-26_p3_bbox.png) |
| DMS-24 | OCR | `invoice_num` = 89718392 คือ **เลขที่ใบส่งสินค้า** ของจริงคือ 9290186640 ("เลขที่เอกสาร"); กล่อง vat/grand_total ทับกัน 3px | [crop](crops/DMS-24_header_info_block.png) |

## 4. pattern ที่พบซ้ำ (ใช้เป็นโจทย์การแก้รอบ 2)

| # | pattern | หลักฐาน | จุดที่ต้องแก้ (แผนข้อ 8) |
|---|---|---|---|
| P1b | `line_bbox` วางบน **เส้นขอบบนของแถว** ตัวอักษรอยู่ใต้กล่อง (เจอบ everywhere ในตารางหลายแถว DMS-26 ทั้ง 19 แถว) | DMS-26 | prompt: ให้กล่องครอบเนื้อความของแถว ไม่ใช่เส้นแบ่งแถว |
| **P1 = แก้แล้ว (commit `6716b46`)** | `row_bbox()` รวม box จาก cell ของแถวนั้น (VLM ส่ง `bbox_2d` เป็น xyxy) แล้วเก็บ `line_bbox_model` ไว้ตรวจเทียบ | วัดจริงรอบ 1 → หลังแก้: DMS-69 AR 1.3→25.4, DMS-234 AR 1.4→8.1 (เปิดรูปยืนยัน: กล่องคลุมทั้งแถวจาก "PO.# 42052918" ถึง "12,720.00") | `scripts/test_invoice_single_pass.py` | ✅ **DONE** |
| P1 | กล่อง `line_bbox` = แบบที่ model คืนมาเป็น "แถบยาวจากหัวแถวลงไปถึงก้นตารางที่ว่าง" → AR < 1.5 ทั้งที่ cell จริงของแต่ละแถวแคบและแบน (union cell AR≈26) | DMS-69 (h=0.46), DMS-233 (0.465), DMS-234 (0.465) | `test_invoice_single_pass.py`: สร้าง `line_bbox` จาก union ของ cell (ตรงกับ `compute_row_bbox_from_cells` ใน production) + prompt ย้ำให้ครอบเฉพาะข้อความของแถว |
| P2 | กล่อง field คอลัมน์ขวา (`invoice_num`/`invoice_date`/`sub_total`/`vat`/`grand_total`/`currency`) เลื่อนไปชิด/แหว่งขอบขวาและ**ทับกันเอง** | DMS-233, DMS-47, DMS-234, DMS-69, DMS-106 | ส่วน layout ของ `single_pass_extract.md` (ห้ามให้กล่องซ้อนกัน, ให้ครอบเฉพาะตัวเลข) + sanity check ใน `coords.py` |
| P3 | กล่องวาง **เหนือ**ค่าจริง ~1 บรรทัด (anchored ที่ label ไม่ใช่ที่ value) | DMS-25 (`po_number`), DMS-24, DMS-69 (`po_number`), DMS-117 (`po_number`) | prompt: "กล่องต้องครอบตัวอักษรที่พิมพ์ค่า ไม่ใช่ label หรือช่องว่าง" |
| P4 | `currency` ถูกวางบนคอลัมน์ยอดรวม (ไม่มีคำว่า THB/BAHT ตรงนั้น) | DMS-47, DMS-106, DMS-117, DMS-234 | prompt + ไม่วาดกรอบถ้าไม่พบข้อความนั้นจริง |
| P5 | `customer_tax_id` ไปอยู่บรรทัดอื่น (ที่อยู่/รหัสลูกค้า) | DMS-233, DMS-234, DMS-69 | prompt ส่วน field-pairs + ตรวจ label/value alignment |
| P6 | สำเนาของ invoice เดียวกันไม่ถูก dedup + ฟอร์มอื่น (ใบวางบิล/ใบนำฝาก/ใบส่งของ) ถูกเลือกเป็น Invoice; `copy_status` ของหน้าพิมพ์ซ้ำยังเป็น `original` | DMS-134 (1,2 + p4), DMS-223 (delivery ทั้งไฟล์), DMS-24 (p2 ถูก mark original แต่เลือดยูถูก) | `single_pass_classify.md` + `select_invoice_pages()`: dedup ด้วย `doc_no_hint` เดียวกัน, คืน [] เมื่อไม่มีหน้า invoice, blacklist ฟอร์มวางบิล/นำฝาก/ชำระสินค้า |
| P7 | `region` label ซ้ำ (ตราบริษัท 2 แห่ง = 2 กล่องชื่อเดียวกัน) | DMS-47 | assembler/region: ตั้ง labelให้มีดัชนี (company_stamp#1/#2) หรือเก็บกล่องที่ครอบตราหลัก |
| P8 | OCR จับเลขผิดชนิด (เลขที่ใบส่งสินค้า → invoice_num) ทั้งที่ label กำกับชัดเจน | DMS-24 | ส่วน OCR ของ `single_pass_extract.md`: ให้อ่าน label ทางซ้ายของ cell แล้วmap ตาม label |
| P9 | pipeline error 2 ฉบับ: `float() None` ตอน parse และ VLM ตอบนอก JSON | DMS-208, DMS-224 (log `run.log`) | `assembler.py`/การ parse ในสคริปต์: กัน None + สกัด JSON จากข้อความที่มี text แทรก |

## 5. สิ่งที่แก้ในรอบนี้

* ไฟล์/ฟังก์ชันที่แก้ (เครื่องมือของ loop เท่านั้น — **ยังไม่แตะ prompt/coords/assembler เพื่อคง round 1 เป็น baseline สะอาด**):
  - `scripts/test_invoice_single_pass.py`: `--snapshot-corpus`, `--make-eval-subset`, `--ids-file`, `--download-only`, `--emit-source-images`, `--layout round`, `audit_doc()`, `--audit-round` (progress.json), `crop_rect_norm()`, `find_field_box()`, `--crop`
  - `config/full_corpus_ids.json`, `config/eval_staged_50_ids.json` (สร้างใหม่)
  - `tests/test_ocr_improvements.py`: +10 test ใหม่ (ไม่ลบ/ไม่ผ่อน assert เดิม)
* ฉบับที่ดีขึ้น: ยังไม่มี (round 1 = baseline, ยังไม่แก้การรู้จำ)
* Regression: ไม่มี — ยังไม่ได้เปลี่ยนพฤติกรรม extraction
* pytest: **ผ่าน 163/163** (baseline 153/153)
* commit: `8c2edeb` (round-0 prep) และ `8f09698` (crop + triage) — `git add` ทีละพาธ, ไม่ใช่ `git add -A`
  ```
  engine/config/eval_staged_50_ids.json      |   60 ++
  engine/config/full_corpus_ids.json         |  232 +++++
  engine/scripts/test_invoice_single_pass.py | 1253 ++++++++++++
  engine/tests/test_ocr_improvements.py      |  107 +++
  --
  engine/scripts/test_invoice_single_pass.py | 96 +++++-
  engine/tests/test_ocr_improvements.py      | 19 ++++
  2 files changed, 113 insertions(+), 2 deletions(-)
  ```
  (ไฟล์ค้างจากงานอื่น `frontend/**`, `config/standards/v6.6/*`, `src/system_a/sandbox/scenarios.py`, `.gitignore` ไม่ถูกแตะ/ไม่ถูก stage)

## 6. ค้างของรอบ 1 (ทำต่อใน session ถัดไป — resume จาก `progress.json`)

1. ตรวจด้วยตาให้ครบ **38 ฉบับที่เหลือ** (`pending_view` ใน `progress.json`) — ทุกฉบับต้องเปิด `rendered/*_bbox.png` ของหน้าที่ถูกเลือก + หน้าแรกของชุดที่ไม่ถูกเลือก
2. ตรวจแบบกรณีที่ 3: สุ่มเอกสาร **ไม่มี tag invoice** 5–10 ฉบับ ถ้าเป็น invoice จริงให้ดึงเข้าชุด + บันทึก `added_docs.md` (ตอนนี้ `added_docs.md` ยังไม่มี เพราะยังไม่ทำขั้นนี้)
3. แก้ P1–P9 (prompt/coords/assembler/`select_invoice_pages`) + เพิ่ม unit test ใหม่ แล้วรันรอบ 2 ทั้ง 50 ฉบับ
4. DMS-208 / DMS-224 รันใหม่หลังแก้ parser
