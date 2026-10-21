# Inspection protocol — Round 03 (ปรับปรุงจาก round_01 ด้วยข้อมูล stability)

กฎตรวจภาพ (ข้อ 1-3) เหมือน `../round_01/INSPECTION_PROTOCOL.md` ทุกฉบับ — **ห้ามลด**
  1. เปิด `rendered/DMS-<id>_p<page>_bbox.png` **ทุกหน้าที่ระบบเลือก** ของทุกฉบับ (บังคับ)
  2. `source_images/*` เปิดเมื่อเข้า trigger: (i) OCR สงสัยผิด/หาย (ii) box บัง Text (iii) ต้อง crop
  3. หน้าที่ไม่ถูกเลือก: เช็ค JSON ว่าไม่มี BBox + รอบนี้/รอบแรก เปิดหน้าแรกที่ไม่ถูกเลือก 1 หน้า
  4. automated checks ใช้จัดคิวเท่านั้น ห้ามแทนการดูด้วยตา

## สิ่งที่ต่างจาก round 01-02 (วัดแล้ว ไม่ใช่ความเห็น)
- **box ที่เลื่อนไม่ใช้เป็นหลักฐาน FAIL** — measurement: รันโค้ดเดิมซ้ำ 2 ครั้ง field box ขยับ p90 = 67.7 px
  ใช้เกณฑ์ "ตำแหน่งผิด" เมื่อ **box ไม่ครอบ Text ที่น่าจะเป็นค่าจริง** (ดูจากรูป) หรือ box หายไปทั้งอัน
- **คิวตรวจ** = `round_diff.json → view_queue` (material docs + previously failed + sample)
  ไม่ใช่ทั้ง corpus — ถ้าท่านสั่ง "ตรวจทั้ง 50" ก็ตรวจทั้ง 50 ได้ แต่คิวนี้คือขั้นต่ำ
- verdict ที่เขียนใน `review/DMS-<id>.md` ให้ระบุว่า "BBox ผิดตำแหน่งจริง" หรือ "OCR ตัวเลขผิด"
  พร้อมตัวเลขในรูป (sub_total + vat = grand_total) เสมอ

## เกณฑ์ severity ของข้อบกพร่อง BBox (ใช้เหมือนกันทุกฉบับ — ตัดสินจากรูปเท่านั้น)
- **❌ FAIL** — กล่อง **ไม่ครอบข้อความของค่าจริง**: ค่าอยู่นอกกล่องทั้งหมด/กล่องว่าง (0 ink), กล่องไปอยู่บรรทัดอื่น,
  กล่องไปทับ element อื่น (header/บรรทัดที่อยู่), กรอบหลอน (ไม่มีอะไรบนกระดาษ), line_bbox แนวตั้ง (AR<1.5),
  แถวสินค้าขาด/เกิน, OCR ค่าผิด, เลือกหน้าผิด
- **⚠ NOTE (ไม่ทำให้ FAIL)** — กล่องครอบค่าจริงแต่ตัดขอบบางส่วน (ครอบคลุม ink ≳80%), กินข้อความ label เข้ามาในกล่อง,
  เลื่อนจาก owner วัดแล้ว ≤ ~15% ของความสูงตัวอักษร, `currency` phantom (gated ตาม §4 ของ runbook)
  → บันทึกใน review ให้ครบ เพื่อใช้เป็นที่ทำงานความเนี้ยบ แต่ไม่นับเป็น FAIL
- เหตุผล: owner ตัดสินไว้แล้วว่า box shift เป็น noise (p90 67.7 px) จึงใช้เกณฑ์ "กล่องครอบค่าที่น่าจะเป็นค่าจริงหรือไม่"

## เครื่องมือต่อฉบับ (ประหยัด context, ไม่ตัดสินแทนตา)
```bash
python bbox_testing/round_03/check.py <id>        # digest + view/*.jpg ที่ต้องเปิด
python bbox_testing/round_03/montage.py <id> ...  # crops/<id>_flags.jpg = ต้นฉบับ+กล่องจริง ทุก field บังคับ
python bbox_testing/round_03/align.py <id> --all  # วัด coverage ของกล่องเทียบกับ text ที่กล่องทับ
```
- `crops/<id>_flags.jpg` = รูป 130 DPI + ลากกล่องจริง (ไม่มี label บังตัวอักษร) → **ใช้ตัดสิน "กล่องครอบค่าไหม"**
- `align.py` v2 (`align_report.txt` ทั้ง corpus) = วัดว่ากล่องทับ ink line ไหน / ครอบ line กี่ % (v) และ
  ครอบ "คำ" ที่กล่องทับกี่ % (h) โดยตัดเส้นตาราง/เส้นประใต้บรรทัดออก — ใช้ **จัดคิว + วัดความคืบหน้ารอบ 4**

### สิ่งที่ align.py v2 ตัดสินได้ / ไม่ได้ (calibrate กับ 12 ฉบับที่เปิดตาดูแล้ว)
| กรณี | ผลวัด | เทียบกับตา |
|---|---|---|
| กล่องว่าง / ไปอยู่ช่องว่าง | `no_line_under_box` | ตรง (DMS-163 invoice_date, DMS-59 vat) |
| กล่องทับค่าแต่ตัดขอบบน-ล่าง-ซ้าย-ขวา | `covers_44%`..`covers_79%` | ตรง (DMS-47 grand_total 72%) |
| กล่องอยู่บรรทัดคนละบรรทัดกับค่า (tax id/เลขที่) | `value_above/below_100%` + v<0.5 | ตรง (DMS-106 customer_tax_id 37%) |
| `line_N` (กรอบแถว) vs cell ของแถว | arithmetic `row_misses_<cell>_%` | ตรง — v1 วัดจาก pixel แล้ว **ลวง** เพราะเส้นตารางเป็น ink line เหมือนกัน (DMS-47 line_1 ที่จริงถูกต้อง 100%) |
| **กล่องทับอีกบรรทัดหนึ่งอย่างสะอาด** (ชื่อ/ที่อยู่) | รายงาน `ok` = **ผลบวกปลอม** | เช่น DMS-107 customer_name: กล่องครอบบรรทัดที่อยู่แน่น (v=h=1.0) แต่ชื่อจริงอยู่เหนือกล่อง → **ยังต้องดูตา** |

→ เกณฑ์ปฏิบัติ: `align_report` ใช้เรียงฉบับ + เรียง field ที่ต้องเปิดตา / field ที่เป็นตัวเลขถาวรวัดจาก metric ได้
 แต่ field ประเภทชื่อ-ที่อยู่-ชื่อบริษัท ต้องยืนยันจาก `crops/<id>_flags.jpg` เท่านั้น

## คำสั่ง
```bash
# หมายเหตุ: ไม่ส่ง --stability-report ในรอบนี้ เพราะ list ใน report นับ cosmetic ด้วย
# (จะตัด field บังคับทิ้งเกือบหมด = over-gate) ขณะที่เกณฑ์ material ตัด cosmetic ออกอยู่แล้ว
python scripts/test_invoice_single_pass.py --compare-rounds bbox_testing/round_02 bbox_testing/round_03

# triage / คิว / resume
python scripts/test_invoice_single_pass.py --audit-round bbox_testing/round_03

# crop เมื่อเข้า trigger
python scripts/test_invoice_single_pass.py --crop <id> --round-dir bbox_testing/round_03 --crop-field grand_total
```
ไฟล์ที่เปิดดูต้องบันทึกลง `review/DMS-<id>.md` หัวข้อ "ไฟล์ที่เปิดดู"

## Calibration ที่เพิ่มจากการดูตา (Round 3)
| กรณี | ผลของ `align.py` | ปฏิบัติ |
|---|---|---|
| **เอกสารเขียนด้วยมือ** (เช่น DMS-76) | under-report — ink ลายมือไม่ต่อเนื่อง วัด coverage 0% ทั้งที่กล่องครอบตัวเลขครบ | ตัดสินด้วยตา ห้ามใช้ metric เป็นหลักฐาน FAIL |
| หน้าที่ pipeline หมุน (DMS-59, DMS-224) | ต้องหมุน scan ตาม `meta.pages_classification[].rotate_degrees` ก่อนวัด (ตรงกันกับ coarse correlation) | tool ทำแล้ว — ถ้า payload ไม่มีค่า ให้ใช้ correlation |
| หน้าที่ print วิ่งแนวนอนแต่กล่องอยู่ในเฟรมไม่หมุน (DMS-227) | ไม่มีเฟรมแนวนอนให้วัด | รายงาน `sideways_page_eye_only` → เปิด overlay ตัดสินเอง |
| กล่องทับอีกบรรทัดหนึ่ง "อย่างสะอาด" (DMS-107/233 customer_name) | รายงาน `ok` = ผลบวกปลอม | field ชื่อ/ที่อยู่ ต้องดู `crops/<id>_flags.jpg` เสมอ |
| row box กับ cell เพี้ยนไปพร้อมกัน (DMS-224) | `row_misses` ผ่าน | โหลด overlay ทั้งหน้าดูด้วย เมื่อฉบับนั้น field อื่นหลุดบรรทัดหมด |
