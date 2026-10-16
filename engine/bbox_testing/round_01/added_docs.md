# added_docs.md — แผน §3 เคส 3: เอกสาร invoice ที่ **ไม่มี** tag `invoice`

บันทึกตอน Pre-flight ของ Final Full Round (19 ต.ค.) — อ่านอย่างเดียวทั้งหมด ไม่แตะ Paperless เขียน/แก้ใด ๆ

## คำถามของเคส 3
corpus snapshot (`config/full_corpus_ids.json`) คัดด้วย `tags__name__iexact=invoice` —
ถ้ามี invoice จริงที่ **ไม่ติด tag** หรือติด tag ชื่อแปลกแปร่ง มันจะหลุดจาก 223 ฉบับ และ FFR จะไม่ได้วัดมัน
แผนจึงสั่งให้ "สุ่ม invoice ที่ไม่มี tag 5–10 ฉบับ" มาตรวจ

## สิ่งที่วัดได้ (Paperless จริง ณ 19 ต.ค.)

| สิ่งที่ตั้งคำถาม | ผลที่วัด |
|---|---|
| เอกสารทั้งหมดที่ token นี้มองเห็น | **224** (API `count` = 224, fetch ครบ 224) |
| ติด tag `invoice` (id=5) | **223** → ตรงกับ snapshot 100% |
| **ไม่**ติด tag `invoice` | **1 ฉบับ = `DMS-34`** ชื่อ *"19 เอกสารแนบ 7 (ใบแต่งตั้งผู้รับผลประโยชน์)"* mime `image/jpeg` → **ไม่ใช่ invoice** (เป็นเอกสารแนบประกันชีวิต และไม่ใช่ PDF ด้วย — engine ประมวลผล PDF) |
| tag ชื่อแปลงกายของ invoice (`Invoice`, `Invoices`, `ใบแจ้งหนี้`, `bill`, `receipt`) | **ไม่มี** — tag ทั้งระบบมี 8 ตัว: `invoice(223)`, `AHT(115)`, `check n8n(90)`, `AH(47)`, `AHA(42)`, `AHP(19)`, `paperless-gpt-ocr-complete(2)`, `paperless-gpt-failed(1)` |
| document_type / owner ที่อาจกีดกันการมองเห็น | `document_type` = None ทุกฉบับ; owner ว่าง 222 / user `2` 2 ฉบับ |
| id ช่วง 15–242 ที่หายไป | 4 id (16, 17, 18, 97) = 0.8% ของช่วง ไม่มีร่องรอยว่าเป็น invoice ที่ถูกซ่อน (เรียก `document()` ตรง ๆ ไม่ได้ข้อมูล) |

## สรุป: **population ของเคส 3 ในระบบนี้ว่างเปล่า (0 ฉบับ) จึงไม่มีอะไรให้สุ่ม**

ไม่มีการ "หาไม่เจอ" แบบเงียบ ๆ ในรอบนี้ — 223 ฉบับของ snapshot คือ universe ของ invoice ทั้งหมดที่ DMS ทำงานด้วยได้จริง
(ไม่ใช่เพราะเราเชื่อ แต่เพราะทั้งระบบมีเอกสารที่ไม่มี tag invoice แค่ฉบับเดียว และมันไม่ใช่ invoice)

**ข้อจำกัดที่ต้องพูดให้ครบ:** `/api/index/` (ตัวเลขทั้ง instance ไม่สน permission) เป็น UI view โดน 302 ไป login
จึง **วัดไม่ได้ว่า token นี้ถูกซ่อนเอกสารอะไรบ้าง** — แต่เอกสารที่ token นี้มองไม่เห็น **production DMS ก็มองไม่เห็นเหมือนกัน**
(corpus จึง inherits blind spot ของ production โดยโครงสร้าง ไม่ใช่ความบกพร่องของ eval) ถ้าวันไหนอยากวัดจริง ต้องใช้ token ระดับ admin
แล้วเทียบ count — จดไว้เป็นงาน of record ไม่ใช่เรื่องที่ปิดได้จากตรงนี้

## เอกสารที่เพิ่มเข้า FFR
**ไม่มีรายการเพิ่ม** — FFR รันบน 223 ฉบับตาม snapshot เดิม (`config/full_corpus_ids.json`, ไฟล์อ่านอย่างเดียว)

## พยานที่รันซ้ำได้
```bash
cd engine && PYTHONPATH=src python - <<'PY'   # read-only probe
from system_a.envfile import load_env; load_env()
from system_a.container import Settings
from system_a.adapters.paperless.reader import PaperlessReader
s = Settings(); r = PaperlessReader(s.paperless_url, s.paperless_token, timeout_s=s.paperless_timeout_s)
docs = r.list_documents(); inv = [i for i, n in r.tag_ids_for(["invoice"])][0]
print("visible", len(docs), "| tagged", sum(1 for d in docs if inv in d.tags),
      "| untagged", [(d.doc_id, d.title, d.mime_type) for d in docs if inv not in d.tags])
PY
```
