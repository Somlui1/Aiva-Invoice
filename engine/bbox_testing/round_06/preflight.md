# Pre-flight ของ Final Full Round (19 ต.ค.) — ครบ 3 ข้อก่อนยิง

## (ข) backfill `source_images` ให้ครบทั้ง corpus — **เสร็จ**
ใช้ทางที่ระบบมีอยู่แล้ว (`scripts/test_invoice_single_pass.py --emit-source-images --ids-file ... --dpi 130`,
`RENDER_DPI=130` = ค่า default ของ harness เอง) ไม่ได้เขียนตัว render ใหม่

```
source_images: written=617 skipped_existing=0 errors=0     # bbox_testing/round_06/backfill_images.log
coverage: 223/223 docs have renders | missing 0
```

**cross-check ที่ทำให้เชื่อตัวเลขนี้:** API ของ Paperless รายงาน `page_count` รวม **793** สำหรับ 223 ฉบับ
และ PNG ที่ render ได้ก็มี **793 ไฟล์** — คนละแหล่งข้อมูล ตัวเลขตรงกันเป๊ะ (ถ้า render ขาด/เกินจะเห็นทันที)

## (ก) เอกสารไม่มี tag invoice — **เสร็จ: population ว่างเปล่า 0 ฉบับ จึงไม่มีอะไรให้สุ่ม**
รายละเอียดเต็ม + คำสั่งรันซ้ำอยู่ใน `bbox_testing/round_01/added_docs.md`
สาระ: ทั้งระบบมีเอกสารที่ token นี้เห็น 224 ฉบับ, ติด tag `invoice` 223 (= snapshot เป๊ะ), อีก 1 ฉบับคือ
`DMS-34` *ใบแต่งตั้งผู้รับผลประโยชน์* เป็น `image/jpeg` ไม่ใช่ invoice/PDF · tag แปลงกายของ invoice **ไม่มี**

## (ค) page & API-call estimate — **เสร็จ** (คำนวณจาก render จริง ไม่ใช่ ที่ runbook ประเมินไว้)

| | ค่า |
|---|---|
| เอกสาร | **223** ฉบับ |
| หน้าทั้งหมด | **793** หน้า (mean 3.56, median ~3) |
| histogram หน้า/ฉบับ | 1:1 · 2:68 · 3:78 · 4:24 · 5:28 · 6:14 · 7:4 · 8:1 · 11:2 · 12:1 · 13:1 · 19:1 |
| classify call (1 multi-image call/ฉบับ ที่ 80 DPI) | **223 calls** (รวม 793 page-thumbnails) |
| extract call (150 DPI เฉพาะหน้าที่เลือกเป็น invoice) | **≤ 785** calls |
| **vision calls รวม** | **≤ 1,008 calls** (จริงน่าจะน้อยกว่านี้ เพราะ classify เลือกแค่หน้า invoice) |
| ขนาด `source_images` | 983 MB, 793 PNG · เหลือในดิสก์ 554 GB |

ประเมินเดิมของ runbook "~800 หน้า" = ใกล้จริงมาก (793 จริง) และงบที่ System Owner อนุมัติ (ไม่จำกัด token แต่ห้ามฟุ่มเฟือย)
พอเหลือเฟือสำหรับ 1 รอบเต็ม **โดยไม่จำเป็นต้องรัน arm ควบคุมซ้ำทั้ง corpus** — A/B off/move ทำไปแล้วใน R4-15
(30 ฉบับที่มีงาน, n=2, เกิน noise ทั้งสอง metric) รอบนี้จึงรัน **default เดียว** ตามสั่ง และเก็บเงินไว้ทำ round_06
ถ้าตัวเลขบอกว่ามีอะไรให้แก้

## ⚠️ ข้อจำกัดที่ต้องแบกเข้า FFR (วัดไว้ก่อน ไม่ใช่ไปเจอเอาข้างหน้า)

1. **`max_pages = 12`** ของ `SinglePassPipeline` → **DMS-40 (13 หน้า)** และ **DMS-95 (19 หน้า)**
   มี 1 กับ 7 หน้าที่ไม่ถูกอ่านเลย (9.5% ของเนื้อหา 2 ฉบับ) — ถ้าสองฉบับนี้ FAIL ต้องแยกประเภทว่า
   "โมเดลอ่านผิด" หรือ "ระบบไม่เคยส่งหน้านั้นให้โมเดล" ไม่ใช่ฟาดรวมเป็น defect ของ BBox
2. 223/223 เป็น PDF และ page count ตรงกับ API ทุกฉบับ — ไม่มีเคส image-only ที่ต้องนับแยก
3. `align.py` วัดหน้าทีหมุนแล้วบางหน้าไม่ได้ (`DMS-59 p1`, `DMS-227 p1` เคยเจอใน R4-15) → ต้องรายงาน
   "หน้านอกไม้บรรทัด" เป็นตัวเลขแยก ห้ามยุบเข้า defect
