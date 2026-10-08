# System A — patch v4 (2026-10-07, ฉบับแก้ไข v4.1)

วางทับ `system_a/` และ `config/` ระดับเดียวกับของเดิม (ฐานของ diff คือ patch v3)
`tests/` เป็นไฟล์ใหม่ ส่วน `optional/` เลือกลงได้ (ดูหัวข้อ "ก่อนรันจริง")
ผล replay 98 ฉบับอยู่ใน `results/`

## หลักการ
- **หาใบรับจาก Invoice + ผู้ขายเท่านั้น:** ได้บรรทัดใบรับของ Invoice นั้นครบทุก PO
- **ปิด PO-LIST:** ไม่เดาใบรับจากประวัติ PO (`po_list_fallback: false`)
- **เพดานแถว:** ไม่ใช่ข้อจำกัดทางธุรกิจ (TAX-INV 500) ถ้าชนเพดานจะส่งให้คนตรวจ

## สิ่งที่แก้ (ทุกข้อปิดได้ใน `policy.yaml`)
| # | ปัญหา | แก้ | switch |
|---|---|---|---|
| 1 | DMS-110 `IV.26/0144` ไม่ถูกส่งไปค้น | `invoice_variants` รับ `.` `_` และเพิ่ม variant แบบตัดจุด | `lookup.invoice_variants` |
| 2 | DMS-111 EBS เก็บ `IM 3031` | TAX-INV เทียบ `UPPER(REPLACE(col,' ',''))` | (SQL) |
| 3 | DMS-38 Tax ID มี `2` นำหน้า / อยู่ใน `TCA_SYNC_VAT_REG_NUM` | `SUBSTR(COALESCE(TCA_SYNC_VAT_REG_NUM, VAT_REGISTRATION_NUM, NUM_1099), -13)` | (SQL) |
| 4 | DMS-40/47/64 อ่านเลข Invoice ผิดตัว | ส่งเลข Invoice อื่นที่พิมพ์บนหน้าใบกำกับ/ใบแจ้งหนี้/ใบส่งของ และจากการ crop ไปใน TAX-INV เดียวกัน ถ้าเจอใช้เป็น `invoice_num` (เก็บค่าเดิมใน V-01 data) | `invoice_candidates_from_document`, `evidence.invoice_num_from_document_candidate` |
| 5 | Tax ID ผู้ขายจาก OCR ผิด หรือ EBS ไม่มี Tax ID | ไม่ใช้ค่าที่เท่ากับ Tax ID ลูกค้า; ถ้าไม่พบ ใช้ผู้ขายของ PO แล้วค้นเลข Invoice ซ้ำ (หรือ `INV-BY-PO-VENDOR`) | `reject_supplier_tax_equal_customer`, `supplier_from_po_on_miss` |
| 6 | **v4.1** DMS-77/96 อ่านเลข PO เป็นเลข Invoice | ไม่ใช้เป็นคีย์ ถ้าไม่พบใบรับด้วยเลขอื่นจะเป็น E01 | `reject_invoice_equal_po` |
| 7 | **v4.1** EBS เก็บเลขเล่มนำหน้า (`1819/157446`, `076/3793`) แต่เอกสารพิมพ์แค่ `157446` | `TAX-INV-SUFFIX`: header ลงท้าย `/<เลขที่พิมพ์>` ผู้ขายเดียวกัน **และยอดใบรับ = sub_total** ใบเดียวเท่านั้น ไม่ใช้ LIKE | `invoice_suffix_match` |
| 8 | เลขใบรับที่เขียนด้วยมือ | `RCV-BY-NUM` ใช้เมื่อค้นด้วยเลข Invoice ไม่พบ ต้องผู้ขายและยอดตรง ผล V-04 = manual_review แต่ตรวจ V-05..V-09 ต่อครบ | `receipt_num_lookup` |
| 9 | ไม่พบด้วยทุกเลข → E05 HOLD | V-04 manual_review พร้อมรายการเลขที่ลอง; เลขใช้ค้นไม่ได้ = E01 | `not_found_result` |
| 10 | งวด milestone ได้ E09 + E14 | V-07/V-08 manual_review "วางบิลเป็นงวด" (รอเจ้าของ Standard) | `validation.milestone_installment` |
| 11 | DMS-26 แถวพิมพ์ซ้ำ | ตัดเมื่อแถวที่เหลือรวม = sub_total หรือยอดใบรับพอดี | `evidence.collapse_duplicate_block` |
| 12 | เพดาน 50 แถว | `oracle.row_caps` แยกตาม query | `row_caps` |

## ผลทดสอบ
- **sandbox:** 62/62 (S46–S62 ใหม่) ผ่าน `--schema` ส่วน golden S01–S45 ไม่เปลี่ยนยกเว้น S27 (ตั้งใจ: E05 → E01) pin ใหม่ใน `tests/golden_legacy_integrity.json` (ของ v3 อยู่ใน `golden_v3_integrity.json`) และ pytest ผ่าน 5/5
- **replay ผล v3 98 ฉบับ:** ใช้ extraction และแถวใบรับที่ v3 บันทึกไว้ V-07 ใช้กลุ่ม AI จากรอบจริง ส่วน V-05/V-08 ใช้ simulator
  - **ภาพรวม:** HOLD 12 → 4, AUTO_PASS 38 → 38, ใช้ PO-LIST 18 → 0
  - **ไม่มีฉบับไหนผลแย่ลง** (DMS-96 กลับมาเป็น AUTO_PASS ด้วยข้อ 7)
  - **ข้อจำกัด:** DMS-38/40/47/64/65/110 ต้องรันกับ Oracle จริง ใบรับจริงไม่อยู่ในข้อมูลที่ v3 บันทึก แต่เลขที่ถูกต้องถูกส่งไปค้นครบแล้ว

## ก่อนรันจริง
- **วัดความเร็ว SQL:** TAX-INV และ TAX-INV-SUFFIX มีเงื่อนไขที่ห่อคอลัมน์ด้วยฟังก์ชัน ถ้าช้าให้ใช้ endpoint ORA-03 ผ่าน `sql_overrides`
- **`optional/perception_v4_optional.diff`:** เลือกเลข Invoice จากหน้า TAX_INVOICE/INVOICE ก่อน และขยายกรอบ crop ยังไม่รวมเพราะ cache ผูกกับ hash ของโค้ด ถ้าลงต้องอ่านเอกสารใหม่ทั้งหมด ลงด้วย `git apply optional/perception_v4_optional.diff`

## คำสั่ง
```
PYTHONPATH=src python -m system_a.sandbox.scenarios --golden --schema
PYTHONPATH=src python -m pytest -q tests
REPLAY_DUMP_DIR=out python tools/replay_results.py src results/paperless_invoices_v3 replay_v4.json schemas/result-3.0.schema.json
```
