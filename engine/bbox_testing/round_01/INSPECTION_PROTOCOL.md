# กติกาการตรวจรูป (Owner ruling 2026-10-15) — ใช้ทุก round รวมทั้ง Final Full Round

เอกสารนี้เป็นคำวินิจฉัยของผู้เป็นเจ้าของงาน มาแทนการตีความแผน
`docs/plans/2026-10-15-ocr-bbox-autonomous-improvement-loop.md` หัวข้อ 5 แบบตัวอักษรตรงตัว
ห้ามตีความเกินนี้

## 1. ขอบเขตการเปิดดูรูป (บังคับ)

| รายการ | กติกา |
|---|---|
| a) หน้าที่ระบบเลือกเป็นต้นฉบับ | เปิด `rendered/DMS-<id>_p<page>_bbox.png` **ทุกหน้า ทุกฉบับ** (บังคับ) |
| b) `source_images/DMS-<id>_p<page>.png` | **ไม่ต้องเปิดคู่ทุกหน้า** เปิดเฉพาะเมื่อ ① สงสัยว่า OCR อ่านค่าผิดหรือมี field ขาด ② กรอบบังข้อความจนอ่านไม่ออก ③ ต้อง crop ขยาย |
| c) หน้าที่ระบบไม่ได้เลือก (สำเนา/ใบส่งของ/PO) | ไม่ต้องเปิดทุกหน้า — เช็กจาก `ocr/DMS-<id>.json` ว่าไม่มี BBox ของหน้านั้น (**รอบ 1 และรอบปิดงาน**: เปิดดู *หน้าแรกของชุดที่ไม่ถูกเลือก* ของทุกฉบับ เพื่อยืนยันว่าไม่ได้ทิ้ง Invoice ต้นฉบับ) |
| ฉบับนอกชุด 50 ในรอบปิดงาน | ยังต้องเปิดดูด้วยตาครบ 100% ตามข้อ a) |
| การเช็กอัตโนมัติ | aspect ratio / กรอบซ้ำ / กรอบตกขอบ / BBox บนหน้าไม่ถูกเลือก ใช้ **จัดลำดับก่อนตรวจ** เท่านั้น ใช้แทนการดูรูปไม่ได้ |

ใน `review/DMS-<id>.md` ต้องระบุว่าเปิดไฟล์รูปไหนบ้าง (ตามข้อ b)

## 2. ขอบเขตชุดเอกสาร

* รอบย่อย 1–7: ชุดคงที่ 50 ฉบับ `config/eval_staged_50_ids.json` (seed=42, snapshot `config/full_corpus_ids.json` = 223 ฉบับ)
* รอบปิดงาน: ตรวจ **223 ฉบับ** ตามแผนเดิม (ไม่ลดรูป)
* PDF ที่ยังไม่มีใน cache ต้องดาวน์โหลดจาก Paperless แบบ **READ-ONLY** ก่อนเริ่ม และรายงานจำนวนใน scorecard

## 3. Git

* commit บน branch `engine` ตรง ๆ ได้ ไม่ต้องใช้ worktree
* `git add` **ทีละพาธเฉพาะไฟล์ใน whitelist ของแผน** — ห้าม `git add -A` / `git add .` / `git commit -a`
* ห้าม stage หรือแก้ไฟล์ที่ค้างจากงานอื่น: `frontend/**`, `config/standards/v6.6/*`, `src/system_a/sandbox/scenarios.py`, `.gitignore`
* ทุกครั้งก่อน commit: `git diff --cached --stat` แล้วแนบผลไว้ใน scorecard
* `pytest` ใช้ basetemp นอก repo เสมอ (ไม่ต้องแก้ `.gitignore`):
  `PYTHONPATH=src python -m pytest tests/ --basetemp="$TEMP/pi_pytest"`

## 4. Layout

* ห้ามลบ/ย้ายของเก่า: `bbox_testing/DMS-<id>/`, `bbox_testing/single_pass/`
* สร้างใหม่ข้างเคียง: `bbox_testing/source_images/`, `bbox_testing/round_XX/{rendered,crops,ocr,review}`

## 5. คำสั่งงานที่ใช้จริง

```bash
# (ครั้งเดียว) snapshot corpus + ชุด 50 คงที่ + ดาวน์โหลด PDF ที่ขาด + ทำรูปต้นฉบับ 130 DPI
python scripts/test_invoice_single_pass.py --snapshot-corpus config/full_corpus_ids.json --tag invoice
python scripts/test_invoice_single_pass.py --make-eval-subset config/eval_staged_50_ids.json \
        --corpus-file config/full_corpus_ids.json --eval-k 50 --eval-seed 42
python scripts/test_invoice_single_pass.py --ids-file config/full_corpus_ids.json --download-only
python scripts/test_invoice_single_pass.py --ids-file config/eval_staged_50_ids.json \
        --emit-source-images bbox_testing/source_images --dpi 130

# รันรอบ (DPI 130, temperature=0, layout ตามแผน)
python scripts/test_invoice_single_pass.py --ids-file config/eval_staged_50_ids.json \
        --out-dir bbox_testing/round_01 --layout round --dpi 130 --workers 4

# triage + ความคืบหน้า (เขียน round_XX/progress.json: inspected / pending_view / triage_order)
python scripts/test_invoice_single_pass.py --audit-round bbox_testing/round_01
```

**Cache:** สคริปต์นี้ใช้เฉพาะ `.cache/downloads/` (PDF) ไม่ได้แตะ `.cache/perception/`
ผลจึงไม่มีการ cache ของ perception ปนอยู่เลย — ยืนยันแล้วจากการอ่านโค้ด `fetch_pdf()`
