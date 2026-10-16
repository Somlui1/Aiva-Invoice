# Round 6 — Final Full Round (FFR): 223 ฉบับ / 793 หน้า · 19 ต.ค.

รันด้วย **default ปัจจุบันของระบบ** (`PERCEPTION_INK_SNAP=1`, `ink_snap_mode="move"`,กติกา ink rules v2) — ไม่ arm ควบคุม
เพราะ A/B off/move ทำไปแล้วใน R4-15 (30 ฉบับ n=2 เกิน noise ทั้งสอง metric) · ไม้บรรทัด = `round_03/align.py`
เรียกผ่าน subprocess **ไม่แก้แม้แต่ไบต์เดียว** · payload + ภาพวาด BBox อยู่ใต้ `bbox_testing/round_06/ffr/run1/`

```
223/223 documents ok · page_errors = 0 · vision calls 447 (estimate <=1,008) · 224 bbox overlays drawn (345 MB)
calls/doc: 1 call -> 12 docs (= ไม่ extract เลย) · 2 calls -> 199 · 3 -> 11 · 4 -> 1
pages ที่ engine ส่งเข้าโมเดลจริง = 224 หน้า จาก 793 หน้าของ corpus (mean 1.00 หน้า/ฉบับ) — ที่เหลือ classify ตัดทิ้ง
```

## 1. ตัวเลขหลัก — เทียบได้เฉพาะ "rate" กับประชากรเดียวกัน

| ประชากร | docs | boxes the ruler judged | flagged | **defect rate** |
|---|---|---|---|---|
| **ทั้ง corpus** | 223 | 5,404 | 611 | **11.3%** |
| 50 ฉบับเดิมที่ Round 1-5 รู้จัก | 50 | 1,204 | 104 | **8.6%** |
| **173 ฉบับที่ไม่เคยถูกวัดเลย** | 173 | 4,200 | 507 | **12.1%** |
| 30 ฉบับที่ R4-15 ทำ A/B (move arm ได้ 8.2%) | 30 | 795 | 68 | **8.6%** |
| เฉพาะฉบับที่วัดได้ ≥8 กล่อง (199 ฉบับ) | 199 | 5,394 | 601 | **11.1%** |

- **บทเรียนใหญ่สุดของรอบนี้: ชุด 50 ฉบับ "ประนีประนอม" ให้เรา** — ของจริงทั้ง corpus แย่กว่า 3.5 pp
  และ **action queue 28 ฉบับ มีแค่ 2 ฉบับที่เรารู้จักจาก Round 1-5 อีก 26 ฉบับของใหม่ล้วน**
- ช่อง 30 ฉบับ (8.6%) เทียบกับ R4-15 (8.2% คนละรันคนละวัน) → ซ้ำกันได้ตรง 0.4 pp ซึ่งเป็นระดับ noise ที่วัดไว้
  = ตัวเลขรอบนี้ **ทำซ้ำได้** ไม่ใช่ฟลุค
- empty-box: **ink 1.6%** (81/5,176) · **print 15.1%** (781/5,176) — ไม้บรรทัดเส้นที่สองของ R4-15 ยังห่างกัน ~13 pp
  ทั้ง 81 กล่องว่างแบบ ink อยู่ใน **18 ฉบับ** และ 8 ใน 10 อันดับแรกเป็นหน้าที engine หมุน (DMS-118/119/62/49/20/64/225/32/59/36)

## 2. สิ่งที่ไม้วัด "มองไม่เห็น" — แยกไว้ห้ามยุบเข้า defect rate

| กลุ่ม | docs | คืออะไร |
|---|---|---|
| **0 กล่องที่วัดได้** | **14** | 12 ฉบับ engine ไม่ส่งอะไรเลย (ดู §3.1) + 2 ฉบับส่งครบแต่ไร้พิกัด (§3.2) |
| 1–7 กล่อง | 10 | หน้าที engine หมุน 90° (DMS-32/36/49/59/62/64/118/119/224/225) — `align` ไม่มีกรอบวัดหน้าหมุน |
| ≥8 กล่อง | 199 | ประชากรที่ใช้ตัดสินจริง (11.1%) |

⚠️ ถ้าไม้นับรวมแบบหยาบ จะได้ "10 ฉบับ defect 100%" จากกล่องเดียวต่อฉบับ — ของหลอกที่เกือบหลุดเข้ารายงาน
(เกณฑ์ที่ใช่: ≥8 กล่อง จึงคิด rate)

## 3. ของเสียใหม่ที่รอบ 50 ฉบับไม่เคยเจอ (พบเพราะขยายเป็น 223)

### 3.1 `classify` สรุปว่า "ไม่มีหน้า invoice" → engine ส่ง payload เปล่า — **12 ฉบับ (5.4% ของ corpus)**
`DMS-56, 93, 123, 124, 180, 195, 205, 206, 207, 223, 226, 227`
ทุกฉบับ: `calls=1` (classify อย่างเดียว), `extra.selection.no_invoice_page=True`, `fields=0`, `lines=0`, **`page_errors` ว่าง**
→ ไม่ใช่ error ไม่ใช่ timeout — เป็น **การตัดสินใจที่ไม่บอกใคร** ว่าทั้งเอกสารถูกทิ้ง (production = ไม่ออกผลอะไรเลย)
นี่คือ ของเสียระดับ 1 ของรอบนี้ เพราะไม่มีสัญญาณใดใน payload ให้ system A เอามาเป็น exception ได้

### 3.2 ส่งค่าครบแต่ **ไม่มีกล่องแม้แต่กล่องเดียว** — 2 ฉบับ: `DMS-147`, `DMS-212`
field ทั้ง 11 ตัว (`invoice_num`, `invoice_date`, `po_number`, supplier/customer, totals, vat …) + แถว + cell
มาแบบ **`region=None` ทั้งหมด** ขณะที่ `calls=2` (extract จริง) และ `classify[].type = None` ทุกหน้า
→ ทั้งสองฉบับ **ไม่มีอะไรให้ไม้วัดและไม่มีอะไรให้ reviewer ชี้** ทั้งที่อ่านค่าได้ครบ (และ matching อาจใช้ค่าพวกนั้นโดยไม่รู้ source)
ทั้ง corpus: field ไม่มี bbox = 22 ตัว (= 2 ฉบับนี้) และ **cell ที่มีค่าจริงแต่ไม่มีกล่อง = 15 ตัว** (ส่วน 312 cell ที่ไม่มีกล่องคือช่องว่าง = ปกติ)

### 3.3 action queue จริง (≥8 กล่อง และ rate ≥25% หรือ flagged ≥10) — **28 ฉบับ / ของใหม่ 26**
```
DMS-15(58%) 215(50%) 213(50%) 23(50%) 190(48%,22/46) 214(44%) 221(43%) 236(41%) 120(39%) 238(35%)
194(35%) 175(35%) 52(35%) 241(33%) 233(33%) 216(33%) 135(33%) 96(29%) 91(29%) 77(29%) 76(29%)
112(28%) 187(28%) 136(28%) 83(28%) 20(28%,13/47) 30(14%,11/77) 33(12%,10/81)
```
ฉบับที่ clean ตามไม้วัด (≥8 กล่อง, 0 flagged) มี **25 ฉบับ** — แต่ยังต้องเปิดตาดูอยู่ดี เพราะไม้วัดมองไม่เห็น
"กล่องครอบถูกตัวแต่ผิด field" / "อ่านค่าผิดโดยกล่องตรง" (§6.1 ของแผนรอบ)

## 4. ดักเครื่องมือได้เพิ่มอีก 2 ตัว (รวมเป็น 5–6 ตัวของสายนี้)

1. `align.py` **crashed กลางรอบ** เพราะ print ข้อความไทยลง console cp874 (`UnicodeEncodeError 'ฏ'`) —
   ครั้งแรกได้ "96 ฉบับไม่มีกล่องที่วัดได้" ซึ่งเป็น ของหลอกของไม้บรรทัด ไม่ใช่ของข้อมูล
2. แก้ child แล้วยังตายฝั่ง parent: `subprocess` ยัง **decode** stdout เป็น cp874
3. แก้: pin `PYTHONIOENCODING=utf-8` ให้ child + `encoding="utf-8", errors="replace"` ฝั่ง parent —
   **ไม่แตะ `align.py`** (ยัง byte-for-byte เดิม) เปลี่ยนแค่การตั้ง console ของผู้เรียก
4. **เพิ่มกติกาใหม่ให้ตัวเอง**: ถ้า ruler exit ≠ 0 ให้ **ล้มทั้งการวัด** (raise) ห้ามรายงานต่อ —
   เพราะ "วัดได้ 127 จาก 223" หน้าตาเหมือนกับ "96 ฉบับอ่านไม่ได้" เป๊ะ และตัวเลขผิดนั้นเกือบถูกเขียนลง scorecard แล้ว
5. คำสั่ง `AUDIT_ROUND_DIR` ต้องชี้ dir ที่มี `ocr/` ข้างใน — ผมชี้ผิดแล้วได้ `not_in_round (FileNotFoundError)`
   ซึ่งอ่านดูเหมือน payload หาย ทั้งที่เป็นแค่ path ผิด

## 5. เทียบกับเงื่อนไขหยุดของแผน

| เงื่อนไข | สถานะหลัง FFR |
|---|---|
| 50 ฉบับ PASS/MODEL_LIMIT ครบ 100% | **ยังไม่ครบ** — และตอนนี้รู้แล้วว่า "50 ฉบับ" ไม่ใช่สนามจริงอีกต่อไป |
| 2 รอบติด PASS rate ไม่เพิ่ม | รอบนี้เป็นการวัดเต็มครั้งแรก จึงยังไม่มี "รอบก่อน" ที่ประชากรเดียวกันมาให้เทียบ |
| ใช้ครบ 7 รอบ (รอบ 8 บังคับ FFR) | ใช้ไป **6 รอบ** (round_01…round_06) — FFR รันแล้ว 1 รอบ ตามแผน: ยัง FAIL อยู่และยังเหลือรอบ แก้ได้ 1 รอบ แล้วรัน full corpus ซ้ำ |

**รอบถัดไปที่ควรทำ (เรียงตามมูลค่าต่อระบบ ไม่ใช่ตามความง่าย)**
1. **§3.1 — 12 ฉบับที่ถูกทิ้งเงียบ**: ทำให้ "classify บอกว่าไม่มีหน้า invoice" เป็นผลลัพธ์ที่มีเสียง (exception/flag)
   และตรวจว่า 12 ฉบับนั้นเป็น invoice จริงไหม (เปิดตา + ดูว่า classify เห็นหน้าแบบไหน)
2. **§3.2 — payload ไร้พิกัด**: หาว่า coords หายไประหว่าง parse หรือโมเดลไม่ส่งมา + ห้าม deliver ค่าที่ไร้ region โดยไม่มี signal
3. **26 ฉบับใหม่ของ action queue**: เปิดตาดู 100% (ตามแผน: ฉบับนอกชุด 50 ต้องเปิดดูทุกรูป) — 28 ฉบับนี้คือจุดที่ของเสียหนาแน่นสุด
4. หน้าหมุน 90°: 10 ฉบับที่อยู่นอกไม้บรรทัด ต้องมีวิธีวัดของมันเอง (หรือยืนยันด้วยตา)

## 6. คำสั่งรันซ้ำ
```bash
cd engine
python scripts/run_single_pass.py --ids-file config/full_corpus_ids.json --workers 4 \
       --out-dir bbox_testing/round_06/ffr          # แล้วย้าย payload เข้า ffr/run1/
python bbox_testing/round_06/ffr_score.py           # census: calls, coverage, rate, empty ทั้ง 2 บรรทัด, queue
# พยาน: ffr_run1.log (223 แถว), ffr_score.txt, preflight.md, ../round_01/added_docs.md
```


---

# R6-2 forensics: 12 เอกสารที่ gate ทิ้ง — ของจริงคือตัวอักษรที่พิมพ์อยู่บนหน้ากระดาษ (19 ต.ค.)

R6-1 จดไว้ว่า "engine ทิ้งเงียบ 12 ฉบับ ไม่มี signal" — **ข้อความนั้นเกินจริง และผมแก้ในบันทึกนี้**
รัน `validate()` กับ payload เดิมทั้ง 12 ฉบับ (ไม่ re-extract) ได้ผลตรงกันทุกฉบับ:

```
DMS-56 / 93 / 123 / 124 / 205 / 223 / 226 / 227 ...  -> recommendation=REVIEW  codes=E01
```
`pages_complete=False` ถูก `rules.py` ใช้จริง (V-01 miss + skip V-06) → **มนุษย์เห็น REVIEW/E01 อยู่แล้ว**
ของเสียจริงคือ "อ่านใบกำกับภาษีจริงทิ้ง" ไม่ใช่ "ไม่มี signal"

## ของจริงไม่ใช่ label — เป็นตัวอักษรที่พิมพ์อยู่บนหน้า (เก็บด้วย `page_identity_probe.py`, ห้ามเดา + ห้าม quote mangled)

| ของจริง | ฉบับ | classify ใน FFR | ของที่ถูกต้อง |
|---|---|---|---|
| พิมพ์ว่า **"ไม่ใช่ใบกำกับภาษี"** + หัว "ใบส่งสินค้า/DELIVERY ORDER" | **93, 123, 124, 180, 205, 206, 207** (7) | delivery | **drop ถูกแล้ว** (E01 คือผลที่ซื่อสัตย์) |
| combined title: "ต้นฉบับ**ใบกำกับภาษี/ใบส่งของ**", "ใบส่งของ/**ใบกำกับภาษี**", "ใบส่งสินค้า/**ใบแจ้งหนี้**" + มี VAT + ยอดสุทธิ | **56, 195, 223, 226, 227** (5) | delivery / other | **drop ผิด — สูญใบกำกับภาษีจริง** |

→ **ของเสียจริง = 5/223 = 2.2% ไม่ใช่ 5.4%** (R6-1 โดนตัวเลขครบล้วนโดยไม่มีใครเปิดดูหน้ากระดาษ)
และนี่คือบทเรียนแบบเดิมซ้ำอีกรอบ: *count ที่ยังไม่แตะของจริง มีไว้ให้ตั้งคำถาม ไม่ใช่ไว้สรุป*

## สิ่งที่วัดระหว่างทาง (และถูกปฏิเสธ)

| สมมติฐาน | วิธีวัด | ผล |
|---|---|---|
| "80 DPI thumb เล็กไป โมเดลถึงอ่านหัวไม่ออก" | `classify_at.py` ส่ง classify prompt ที่ 80/110/150 DPI | **ปฏิเสธ** — 3 ฉบับได้ 0/3, 1/3, 1/3 (ที่ "ดีขึ้น" คือ noise) |
| "หน้าหมุนทำให้ classify พลาด" | ใช้ oracle PP-LCNet (`detect_page_orientation`, 0 calls) เทียบ `rotate_degrees` | **ปฏิเสธสำหรับกลุ่มหลัก** (10/12 ตรง oracle = 0) — แต่เจอของแถม: oracle เอง **พลาด 180°** ตอนทดสอบ (หมุน 180 แล้วตอบ r=0) และกลุ่มหน้าขวาง 36/49/59 แจ้ง 90 ส่วน oracle บอก 270 (ยังเปิดเป็น R6-5) |
| "ถ้า gate ไม่ทิ้ง จะได้อะไร?" | `force_invoice.py`: subclass override ให้ทุกหน้าเป็น invoice แล้ว extract จริง | 12/12 "ได้ใบกำกับภาษีครบ" → **แต่มันคือของปลอม** ดูข้อถัดไป |
| **"fallback แบบ forced ปลอดภัยไหม"** | เทียบ with ของจริง | **ไม่ปลอดภัยและอันตราย**: DMS-93/123 เป็นใบส่งของที่ **พิมพ์เองว่าไม่ใช่ใบกำกับภาษี** แต่ forced extract เสก `invoice_num=ITAM26900656`, `grand_total=390.55` ขึ้นมา → การอ่านใบส่งของเป็น invoice คือ **ป้อนของปลอมให้ matching** ซึ่งแย่กว่าการปล่อยทิ้ง (confirm R6-1 ว่า E01/REVIEW ดีกว่าของปลอม) |
| **"ถามคำถามที่ตรงกว่าแทนที่จะเพิ่ม pixel"** | `page_identity_probe.py`: หน้าเดียว + ให้ quote หัวกระดาษ verbatim + 4 คำถาม yes/no | **ตอบถูกรวม 12/12** (5 combined → tax/invoice จริง, 7 no-invoice → False ทั้งหมด) |
| escalate = ส่ง classify prompt เดิมใหม่ ทีละหน้า @150 DPI q85 | `escalate_probe.py` ทำ confusion matrix | rescue จริงแค่ **1/3** ของที่ baseline พลาด, **false rescue 0/7** — ปลอดภัยแต่ไม่พอ |

## ของเสียใหม่ที่ใหญ่กว่า gate ผิด: **คำตัดสินของ gate ไม่ reproducible**

เอกสารเดียวกัน โมเดลเดียวกัน `temperature=0`:
| doc | FFR run (19 ต.ค.) | รันซ้ำวันเดียวกัน (force_invoice) |
|---|---|---|
| DMS-226 | `p1 other, p2 po, p3 po` → ทิ้ง | **`p1 tax_invoice`** → อ่านได้ |
| DMS-227 | `p1 delivery, p2 delivery, p3 po` → ทิ้ง | **`p1 tax_invoice, p2 tax_invoice`** → อ่านได้ |

แปลว่า *"gate ตัดสินจากตัวอย่างเดียวของโมเดล"* และตัว gate เองมี variance → เอกสารบางฉบับได้ REVIEW บ้าง ได้ผลจริงบ้าง
**แบบสุ่ม** ซึ่งกับงาน invoice ที่ต้อง repeat ได้ = ของเสียระดับนโยบาย ไม่ใช่แค่ความแม่นของ prompt

## ทิศทางที่ ของสนับสนุน (ยังไม่เขียนลง engine — รอตัดสินใจเพราะเปลี่ยนพฤติกรรม production)

**escalation แบบเจาะจงหัวข้อ (focused-title adjudication)** ไม่ใช่ "เพิ่ม DPI" และไม่ใช่ "extract เดามั่ว":
- เงื่อนไข: fire เฉพาะตอน gate กำลังจะ **ทิ้งทั้งเอกสาร** (ใน FFR = 12/223 ≈ 5% ของงาน) → cost ต่ำมาก
- คำถาม: หน้าเดียว + "quote หัวกระดาษ verbatim + serves_as_tax_invoice? + VAT? + total?" (ห้ามตอบจาก layout อย่างเดียว)
- ของรองรับจาก probe ชุดนี้: **rescue 5/5 ของ combined forms, false rescue 0/7 ของใบส่งของจริง**
- กติกาที่ต้องฝังพร้อมกัน: **ยอมรับได้เฉพาะเมื่อ quote มีคำ "ใบกำกับภาษี"/"TAX INVOICE" จริง** — ไม่รับด้วย layout/ความรู้สึก
  (เพราะ ของแสดงแล้วว่าโมเดลเสก invoice จากใบส่งของที่ประกาศว่าไม่ใช่ได้ ถ้าไม่ผูกกับคำที่พิมพ์จริง)


---

# R6-6 shipped: "one harder look" ก่อนทิ้งทั้งเอกสาร — และกติกาที่ต้องผูกกับ **ชื่อที่เอกสารตั้งให้ตัวเอง**

## สิ่งที่ใส่ลง engine (`single-pass/1.3.0`)
```
step 1b (ใหม่)  fire เฉพาะตอน gate กำลังจะทิ้งทั้งเอกสาร และ classify ไม่ได้ error
prompt         config/prompts/single_pass_adjudicate.md (v1.0.0) — หน้าเดียว 150 DPI q85
               ขอ quotes verbatim + kind_word_seen (ชื่อที่พิมพ์เป็นชื่อเอกสาร) + 4 คำถาม yes/no
accept         invoice_wording(quotes, kind_word=...) — ดูจาก kind_word ก่อน ถ้าไม่มีชื่อจึงถอยไปหา quotes
               + คำปฏิเสธ (ไม่ใช่/not a/no tax) ชนะเสมอ + fold ตัวสะกดไทย
gate           ไม่ bypass: เปลี่ยน doc_type แล้วรัน select_invoice_pages ใหม่ (copy/marker/multi-doc ยังทำงาน)
fail-safe      escalate พัง = คงการตัดสินใจเดิม + บันทึก page_errors["adjudicate"]
knob           PERCEPTION_ADJUDICATE=0 = behavior เดิม, ฝังใน code_version, payload carry extra["adjudication"]
               (page, was, accepted, named_as, quote) ทุกการช่วยชีวิต audit ย้อนได้
```

## ของวัดจริงกับโมเดลจริง (12 ฉบับ, สอง arm)
| | ผล |
|---|---|
| **ช่วยคืนได้** | **DMS-56, 195, 226, 227 = +4 ฉบับ (1.8% ของ corpus)** |
| ยังช่วยไม่ได้ | DMS-223 (หน้า 1 ตั้งชื่อตัวเองว่า "ORIGINAL DELIVERY ORDER" คำว่า ใบกำกับภาษี อยู่ส่วนอื่นของหน้า — path ที่ไม่ปลอดภัยพอดีก) |
| ทิ้งถูกต้องเหมือนเดิม | 93, 123, 124, 180, 205, 206, 207 (7) |
| **เปิดของผิด (invented invoice)** | **0** (เวอร์ชันแรกคือ **5**) |
| cost | 40 calls/12 doc · **0 calls บน 8 doc แข็งแรง** (control) และ payload เหมือน FFR **7/8** (DMS-30 ต่าง 1 field โดยไม่มี adjudication เกิดขึ้น = model variance) |

## ของที่ version แรกทำผิด แล้ว ของจับได้ (จดไว้เพราะเป็นการลองที่ผิดที่มีค่า)
เวอร์ชันแรก bind กับ "คำ invoice ปรากฏที่ใดก็ได้ใน quotes" → rescue ครบ 5/5 **แต่เปิดของผิด 5 ฉบับ**
เพราะ *หน้า PO* ของ DMS-93/123/205/206/207 พิมพ์ "TAX INVOICE" / "เลขที่ใบกำกับภาษี" (PO ที่อ้างถึง invoice ที่มันอ้างวางบิล)
**คำเดียวแยก "หน้านี้คือใบกำกับภาษี" ออกจาก "หน้านี้พูดถึงใบกำกับภาษี" ไม่ออก** → ผูกกับ `kind_word_seen` แทน
และที่เจ็บกว่า: **ของจริงของผมมีรู** — identity probe ดูแค่หน้า 1 แต่ escalate เปิดได้ทุกหน้า
= *กติกาจะถือว่า validated ไม่ได้ ถ้าของที่ใช้นี้ไม่ได้ครอบคลุมจุดที่มันทำงานจริง*

การเลือก **4/5 + invented 0** แทน **5/5 + invented 5** เป็นการแลกที่ถูก: ของพลาด = REVIEW ที่คนเห็น, ของปลอม = ของที่ matching เชื่อเป็น fact

## TDD + mutation testing (หลักฐานว่า test จับของเสียได้จริง)
`pytest 242 passed` · test ใหม่ 8 ตัวเขียนแดงก่อนทั้งหมด · **mutation ที่ต้นทาง** (backup ก่อนแก้ ห้ามใช้ `git checkout` กับไฟล์ที่ยังไม่ commit — ผมทำแล้วเสียโค้ดทั้งก้อนรอบนึง):

| mutation | ผล |
|---|---|
| A ไม่นับคำปฏิเสธ | แดง 2 test (matcher + pipeline) |
| B ให้ความเห็นโมเดล reopen ได้ | แดง 1 test |
| C escalate ทุกเอกสาร | แดง 4 test (กติกา cost ถูกจับ) |
| D ยัดหน้าเข้า selection ตรง ๆ ไม่ผ่าน gate | แดง 1 test — **เป็น ของว่างที่ผมเจอตอนวัดเอง จึงเขียน test เพิ่ม** |
| E ย้อนกติกาเป็น wording-anywhere | แดง 1 test (คือเวอร์ชันที่วัดแล้วเปิดของผิด 5 ฉบับ) |
| F ไม่ fold ตัวสะกด/ไม่ reject denial | แดง ✓ |


---

# R6-3: หน้าอ่านค่าได้ครบแต่ **เสียกล่องทุกกล่อง** = ต้องนับเป็นอ่านพัง (ไม่ใช่ ok)

## ofที่เกิดจริง (forensics ก่อนแก้ เพราะสองสาเหตุต้องแก้คนละทาง)
| คำถาม | ofที่ได้ |
|---|---|
| โมเดลไม่ส่งพิกัดมาเลยไหม? | **ไม่ใช่** — capture คำตอบดิบ (`dump_extract_answer.py`) เห็น `bbox_2d` ครบ 12/12 fields + cells + regions และ **รันซ้ำได้ payload ปกติ (regions 9/8)** |
| ของ DMS-147/212 ใน FFR หายได้ยังไง? | กล่องที่ map ไม่ได้จะ **ถูกทิ้งเงียบ ๆ** — ทดลองกับ parser ตรง: `xyxy_px([1100,1600,1200,1700], …)` → clamp เป็น `(W,H,W,H)` → ขนาด 0 → `region()` คืน None โดยไม่มีใครพูดอะไร |
| หาย **ทั้งหน้า** ได้ยังไง? | รูปแบบ `[x,y,w,h]` ถูกอ่านเป็น `[x1,y1,x2,y2]` จะทำให้ทุกกล่องมี x2<x1 → พังยกหน้า (ตรงกับที่เห็น: fields/cells/lines **ทุกตัว** region=null) — **ยังเป็นสมมติฐาน เพราะ raw ของรันวัดไม่ถูกเก็บไว้** |
| เกิดบ่อยแค่ไหน? | FFR: 2/223 (0.9%) และมัน **ไม่ reproducible** (รันซ้ำหาย) — สายนี้เจอ ofเสียประเภท "ตัวอย่างเดียวตัดสิน" สองรอบแล้ว (gate R6-6 + ที่นี่) |

## สิ่งที่ ship
1. `PageAnswer.dropped` — เก็บกล่องที่มาแต่ map ไม่ตก **ตามที่โมเดลส่งมาจริง** (ไม่เกิน 12, กันซ้ำ) → ครั้งหน้าวินิจฉัยได้จาก payload ไม่ต้องรอโชครันซ้ำเจอ
2. `count_answer_values(answer)` เทียบ "ค่าที่ answer เสนอมา" กับ "ค่าที่มาพร้อมกล่อง" → ถ้าเสนอมา N แล้ว locate ได้ 0 →
   `page_errors["<page>"] = "NO_GEOMETRY: N values read, none with a usable box (unmapped: [[...], …])"`
3. **ตัดสินก่อน `complete`** → กลายเป็น **E01/REVIEW** (test ยันถึง `validate()` ไม่ใช่แค่ assert flag)
4. ค่าทั้งหลาย **ยังส่งออกไปตามเดิม** เพราะมันเป็นofว่าอะไรพัง — ที่เปลี่ยนคือ "มันไม่ใช่ read ที่สำเร็จ"

## guard สองด้าน (กันรายงานพังเพราะofเสียเกินจริง)
- `test_a_normal_read_is_not_called_geometry_less` — cell ว่างจริงไม่มีกล่อง = ปกติ ห้าม report
- `test_a_page_that_read_no_values_is_not_blamed_for_missing_boxes` — ไร้ค่าไร้กล่อง = หน้าเปล่า ไม่ใช่ofเสีย
- **ของจริง 10 ฉบับ (รวม 147/212)**: `NO_GEOMETRY` fired **0/10** · 147/212 รันนี้กล่องครบ 11/11 + regions 9

## สิ่งที่ไม่ทำ (และจดไว้ว่าทำไม)
**repair by guessing shape** (ถ้าอ่านเป็น xyxy แล้วพังทุกกล่อง ให้ลองอ่านเป็น xywh) — จะ "แก้" ทั้งสองฉบับได้ทันที
แต่ **ไม่มี raw answer ของรันที่พัง** มายืนยันว่ารูปแบบนั้นเคยเกิดจริง → เป็นกติารอof (แพทเทิร์นที่สายนี้จับได้ตัวเองมาแล้ว 2 รอบ)
สิ่งที่ ship คือ **ofเก็บ_OFกล่องที่ map ไม่ตก** เพื่อให้ ifมันเกิดอีกจะมีofจริงมาตัดสิน ไม่ใช่ ofเดา

`pytest 245 passed` · mutation: ถอด guard (G) → แดง 1 test · ลำดับก่อน/หลัง `complete` ครอบคลุมด้วย
assert `pages_complete is False` + `"E01" in codes` อยู่แล้ว (ถ้าตรวจทีหลัง two asserts นั้นจะแดงทันที)


---

# R6-8: **เส้นฐานของสายนี้** — รัน 223 ฉบับ 2 รอบ ด้วยโค้ดเดียวกัน temp=0 แล้วเทียบกับตัวเอง

ของเสียสองตัวที่เจอรอบนี้ (gate กลับคำ, box หายทั้งหน้า) เป็น **intermittent** และผมเจอจาก ofตัวอย่างเดียว
ทั้งคู่ → ถ้าจะบอกว่า "improve 5 pp" ต้องรู้ว่า pipeline แกว่งเองกี่ pp ก่อน · รัน A/B นี้โค้ดเหมือนกันทุกประการ
(`single-pass/1.3.0` มี adjudication + geometry guard แล้ว) ต่างกันแค่โมเดลตอบ

## ระดับ gate / การตัดสินใจ
| เรื่อง | ค่าที่ได้ |
|---|---|
| เอกสารที่ **หน้า invoice ที่เลือกไม่เหมือนกัน** | **4/223 (1.8%)** |
| หน้าที่ได้ `doc_type` ต่างกัน | **13/785 (1.7%)** |
| เอกสารที่ **รอบหนึ่งอ่าน อีกรอบทิ้งทั้งฉบับ** | **1 — DMS-204** |
| `pages_complete` เปลี่ยน (AUTO_PASS ↔ E01/REVIEW) | **8/223 (3.6%)** |
| detector `NO_GEOMETRY` | **A=4, B=4 but ตรงกันแค่ DMS-148** → ofจริง **~1.8%/รอบ** (FFR รอบเดียววัดได้ 0.9% = ofตัวอย่างเดียว *ประเมินต่ำไปครึ่งหนึ่ง*) |
| adjudication | 24 vs 26 calls, log ตรงกัน **222/223** |

## ระดับ "ค่าที่ matching จะเอาไปใช้" — ตัวเลขที่ใหญ่ที่สุดของสายนี้
| เรื่อง | ค่าที่ได้ |
|---|---|
| field ที่เทียบได้ | 1,484 |
| **ค่าต่างกันระหว่างสองรอบ** | **236 (15.9%)** |
| **เอกสารที่มีอย่างน้อยหนึ่งค่าต่าง** | **133/223 (59.6%)** |
| แยกประเภท | **EARLY 174 · TAIL 45 · PREFIX 14 · INVISIBLE 1** (ต่างจริงที่คนเห็น = 174 ไม่ใช่ ofprint) |
| **PRESENCE (ค่าหาย/โผล่)** | **0** → โมเดลไม่ได้ "ลืม field" มัน **อ่านผิด** |
| กล่องของ field เดิมกันสองรอบ | median IoU **0.947**, mean 0.871, **6.9% IoU<0.5** |
| field ที่แกว่งที่สุด | customer_name 81, customer_address 74, supplier_name 41, supplier_tax_id 18, po_number 9, invoice_num 8 |

### ofที่อันตรายที่สุด (field ที่ matching ใช้เป็น key) — ของจริงไม่ใช่ ofprint
- `invoice_num` ต่างกันแบบ **คนละเลข** 6 ฉบับ: DMS-159 `SLI261000000…` vs `INV-2026-080…`, DMS-175 `1003801984` vs `2213666606`, DMS-76 `3792` vs `076`
- `supplier_tax_id` ต่างกัน 7 ฉบับ และ**มี pattern**: `01055…` ↔ `01455…` (DMS-126/167/175/189) · DMS-212 รอบ B ตอบ `002-46810…` (เบอร์โทร!)
- `invoice_date` 4 ฉบับ รวมถึง **ปีไม่ตรงกัน** DMS-229 `2567` vs `2569`
- **ตัด confound แล้ว**: 19/19 เอกสารที่ key ต่างกัน **อ่านหน้าเดียวกันทั้งสองรอบ** → เป็น same-page disagreement จริง ไม่ใช่เลือกคนละหน้า

## ofนี้คืออะไรในทางปฏิบัติ
1. **เส้นฐาน**: ofที่วัดจาก field-level ใด ๆ ที่ขยับน้อยกว่า ~16% คือเสียงรบกวน; ส่วน box-defect-rate แกว่งน้อยกว่ามาก (0.1–1.3 pp) เพราะเฉลี่ย over ~2,500 กล่อง
2. **ofเสียอันดับหนึ่งของการ matching ไม่ใช่กล่องเบี้ยว แต่คือค่า key ไม่เสถียร** — งาน box alignment ที่ทำมา 6 รอบทำให้ *ตรวจได้* ดีขึ้น แต่ ofที่ *matching ใช้ตัดสินใจ* ยังสั่นระดับนี้
3. **rate ของ detector ต้องวัดจาก 2 รอบ** — FFR รอบเดียวบอก 0.9% แต่จริง ~1.8% (และ NO_GEOMETRY จับเพิ่มได้อีก 7 doc-instance ที่เมื่อก่อนเงียบสนิท)

## ofที่ผม **ไม่สรุป** (และต้องวัดต่อ = R6-9)
**ยังไม่รู้ว่ารอบไหน "ถูก"** — ofข้างบนวัด "ไม่เหมือนกัน" ไม่ใช่ "ผิด" · ต้อง open PDF เทียบ ground truth 13 ฉบับ
(invoice_num 6 + tax_id 7) แล้วตอบ 2 คำถาม: (1) ผิดฝั่งเดียวเสมอหรือสุ่ม, (2) ผิดเพราะหน้ามีหลาย ofให้เลือก (multi-candidate) ไหม
**และยังไม่ตัดสินใจเรื่อง 2-vote** เพราะ means ×2 calls ทั้ง corpus — เป็นofตัดสินใจของ owner ไม่ใช่ของผม


---

# R6-9: วินิจฉัย ofที่ *ต่าง* กลายเป็น ofที่ *ผิด* — และ ofที่ "ผิดแบบเสถียร" ซึ่ง repeatability มองไม่เห็น

รายงานเต็ม + ตาราของทั้ง 31 คู่: **`r69_diagnosis.md`** · ofเปิดตาดูจริง 8 ฉบับ (42, 43, 159, 175, 177, 212, 236 +237 inferred)

| คลาส | คู่ | ofยืนยันกับตา |
|---|---:|---|
| **สับสนฝ่าย (กล่องผู้ขาย vs ผู้ซื้อ)** | 8 | DMS-43 (ofจริง BKS `0105562195321`, B ตอบ ofผู้ซื้อ APCHP `0145548001549`), DMS-175 |
| **หยิบ label อื่นบนหน้า** | (รวม 8) | DMS-212 (B ตอบ `002-46810` = **เลขทะเบียนพาณิชย์ใต้โลโก้**), DMS-194 (`084` = เศษของ tax_id), DMS-175 (A เอาเลขที่ **ใบส่งof** เป็น invoice_num) |
| **ofambiguous จริง (2 ofสมเหตุสมผล, label ถูกตัด)** | 4 | DMS-159 (`Doc No. SLI2610000004` vs `INVOICE NO. INV-2026-0802`), DMS-236/237 (`เลขที่ 085` คู่กับ `เลขที่ 422` บนฟอร์มรวม) |
| **อ่านเลขผิด** | 5 | DMS-189 กลับหลัก, DMS-229 คนละปี, DMS-119, 213, 175-date |
| **field หายทั้งค่า (หน้าถูกอ่านแล้ว)** | 7 | ทุกคู่เป็น `supplier_tax_id` (DMS-31/92/94/96/98/149/182) |
| **ofจริงเหมือน ofพิมพ์ต่างกัน** | 3 | DMS-42 `0 2 0 5 …` vs `0205557002730` — คนไม่สนใจ `==` สนใจ |
| **gate ทิ้งทั้งฉบับ (ห้าม นับเป็นofเสีย field)** | 3 | DMS-204 — ofที่ "หาย" ทั้ง 3 ค่ามาจาก gate |

## สองofที่เปลี่ยนวิธีคิด
1. **ofผิดแบบเสถียรมีจริงและวัดด้วย repeatability ไม่ได้**: **DMS-177 ตอบ `011546006764` (12 หลัก) เหมือนกันทั้งสองรอบ
   ทั้งที่ ofพิมพ์จริง `0115546006764` (13 หลัก)** · DMS-45 ตอบ ofผู้ซื้อเป็น ofผู้ขาย **ทั้งสองรอบ** → ของไทยตรวจได้ด้วย
   กติกา deterministic (**tax id = 13 หลัก**) ซึ่งจับได้ **7 ค่า/6 ฉบับ (1.7%)** โดย **ไม่ยิงโมเดลเพิ่ม**
2. **ofผิดพลาดจริงของ corpus > 15.9%** เพราะ 15.9% นับเฉพาะ "คู่ที่ไม่ตรงกัน" — ofที่ผิดตรงกันทั้งสองรอบไม่ถูกนับ

## and one correction I owe you
ตัวเลข **"PRESENCE flips = 0"** ที่ผมให้ไว้รอบก่อน **ผิด** — tool ของผมวน `fa.items()` เลยข้าม field ที่อีกฝั่งไม่มี
ofจริงคือ **10 คู่** (7 field-miss + 3 gate-driven)

## สรุป for owner (เต็มใน r69_diagnosis.md)
- **A. prompt 2 บรรทัด (ฝ่าย + label) = +0 calls** เป้าคลาส 1-2 (~38% ของ ofต่าง) → ทำก่อน + A/B จริง
- **B. กติกา format 13 หลัก / consistency = +0 calls** จับ ofผิดที่ *เสถียร* — ฝัง flag ฝั่ง perception ได้ แต่
  ofบริโภคอยู่ที `rules.py` ซึ่ง **ต้อง owner อนุมัติ**
- **C. ยิงซ้ำเฉพาะ field key = ~+224 calls/รอบ** · **D. 2-vote ทั้ง corpus = ×2 calls และไม่ช่วย of systematic เลย**
- **คลาส 3 (ofambiguous จริง) เป็นนโยบาย owner** ว่าจะเอา ofไหน ไม่ใช่ofผมเดา — สิ่งที่ทำได้คือให้ model ตอบหลายค่า
  พร้อม label ที่มันอ่านเจอ แล้วให้กติกา/คนเลือก


---

# R6-10: Option A — ผูกค่าเข้ากับ "บล็อกของผู้ออกเอกสาร" (prompt binding)

ทำ **2 iterations** และ iteration แรก **ถูกวัดว่ามีofเสียใหม่ จึงไม่ถูก ship**

| | **1.4.0 (rejected)** | **1.5.0 (shipped)** |
|---|---|---|
| กลไกที่สั่ง | ห้ามofของผู้ซื้อ + "ถ้าหน้าพิมพ์ofลูกค้าofเดียว → supplier_tax_id = null" | **สั่งให้ค้นหา ก่อน**: ofของผู้ออกมักอยู่บรรทัด**ตัวเล็ก ใต้ address/TEL หรือข้างโลโก้** + ห้ามofผู้ซื้อ + คืน null เฉพาะเมื่อ **ค้นทั้ง header แล้วไม่เจอจริง ๆ** |
| ofที่วัดได้ | **DMS-147 ofที่ถูกต้อง `0105562195321` กลายเป็น null (regression จริง)**, DMS-43 เหลือ 1/2, DMS-127 กลายเป็น null | DMS-147 **2/2 คงofถูกต้องไว้ได้**, DMS-43 **2/2**, DMS-127 **2/2 ตรงofจริง** |
| สรุป | ประโยค "ยอมให้ null" ถูก model ใช้อย่างเกินความจำเป็น | **ship** |

## ofA/B (20 ฉบับ × 2 รอบ × 2 arm = 80 reads; arm เก่า = rewind ข้อความจากสำเนาที่เก็บไว้)
| metric | arm ข้อความเก่า | arm ที่ ship (1.5.0) |
|---|---|---|
| `supplier_tax_id == customer_tax_id` ใน payload เดียวกัน (คลาส 1) | 1/40 (2.5%) | **0/40** |
| tax id ไม่ใช่ 13 หลัก | 1/40 | 1/40 (คือ DMS-177 หนึ่งรอบ — เป็นคลาส "อ่านเลขผิด" ไม่ใช่คลาส 1) |
| **supplier_tax_id outว่าง** | 1/40 | **0/40** → ofที่ 1.4.0 เคยทำofถูกต้องหาย **ไม่เกิดแล้ว** |
| within-arm self-disagreement (เส้นฐาน) | 8/60 (13.3%) | 4/60 (6.7%) |

## ofdecision เทียบofพิมพ์จริง (7 field-docs ที่ R6-9 เปิดหน้าดูแล้ว)
| doc | ofพิมพ์จริง | arm เก่า | arm ที่ ship |
|---|---|---|---|
| **DMS-127** | `0105546047223` (ofของผู้ออก P.SUNEE ตัวเล็กใน header; ofตัวใหญ่ข้างล่าง `0145563000434` คือ of**ลูกค้า**) | **0/2 (ofลูกค้า)** | **2/2 ถูก** |
| **DMS-147** | `0105562195321` (ofของผู้ออก BKS ใน header) | 2/2 | **2/2 (ofregression ของ 1.4.0 ถูกซ่อม)** |
| **DMS-212** | `0115533001629` | 1/2 (อีกofตอบ `002-46810` = เลขทะเบียนพาณิชย์ใต้โลโก้) | **2/2 ถูก** |
| DMS-43 | `0105562195321` | 2/2 | 2/2 ถูก |
| DMS-175 invoice_num | `2213666606` (เลขที่**ใบกำกับภาษี** ไม่ใช่ใบส่งof `1003801984`) | 1/2 | **2/2 ถูก** |
| DMS-175 tax_id | `0145548001557` | 1/2 | 0/2 ✗ **ofไม่หาย** |
| DMS-177 tax_id | `0115546006764` (13 หลัก) | 2/2 | 1/2 (ที่ n=2 = ยังแยกจาก noise ไม่ได้) |

**controls 8 ฉบับ (ที่ไม่มีofเสียคลาส 1):** ค่าเปลี่ยน 1 จุด = DMS-127 ซึ่งกลายเป็น **offix** (เพราะผมจัดกลุ่มไว้ก่อนเปิดหน้าดูofจริง)
และ **ไม่มี control ใดofหายหรือกลายเป็น ofว่าง** — ตรงกับofเกณฑ์ที่ตั้งไว้ **ก่อน** รันว่า "control ที่ofอยู่แล้วห้ามหาย"

## ofที่ต้อง ofซื่อสัตย์
- ที่ 40 reads/arm และเส้นฐาน within-arm 6.7–13.3% → **ผลต่างระดับ 1-2 reads ยังไม่มีนัยสำคัญทางสถิติ**
  ofที่ ofแข็งจริงคือ **DMS-127** (ofboth arm × 2 รอบ and ตรงกับofจริงที่ผมเปิดตาดูเอง)
- **DMS-175 tax_id ยังofผิดทั้งสอง arm** → ofคลาส 1 บางcase prompt ไม่หาย → ofofไป **Option B (format guard)**
- ofambiguous (DMS-159/236/237) **ofไม่เปลี่ยน** ทั้งสอง arm → ofต้องเป็นนโยบายowner ไม่ใช่ofให้ prompt เดา

## ofinstrument ที่เจอระหว่างทาง (and fixed)
arm ที่ rewind prompt **ส่งข้อความเก่าจริง แต่ payload ติดป้าย version ว่า 1.5.0** เพราะ `prompt_version`
ถูกคำนวณตอน construct ก่อนที่ tool จะ override ข้อความ → ofaudit trail โหกม → tool ใหม่ recompute
`prompt_version` หลัง override และติดป้าย arm ตามบทบาท (ไม่depend on label ที่ผิด)

## ofengine ที่ ofiเพิ่ม (from ofเดิมofที่ ofink rules)
`code_version` **รวม prompt version เข้าไปใน cache key แล้ว** — เดิมถ้าแก้ prompt อย่างเดียว cache key ofเหมือนเดิม
→ payloads เก่าunder ข้อความเดิมจะถูก serve ต่อไปอย่างเงียบ ๆ (ofเดียวกับที่ INK_RULES_VERSION เคยปิดไว้)
test ครอบคลุม: เปลี่ยนข้อความ prompt → `code_version` ต้องเปลี่ยน


---

# R6-11: Option B — format guard ฝั่ง perception

## สิ่งที่ ship (+0 vision calls)
`extra["format_warnings"]` ใน payload: flag เมื่อค่าที่ส่งออกมาเป็นรูปแบบ tax id แต่ **ไม่ใช่ 13 หลัก**
- strip ช่องว่าง/ขีด ก่อนนับ
- **ไม่แก้ `raw`** — ของจริงคงตามทีพิมพ์ (contract ของ prompt) flag只做รายงาน
- rule id `thai_tax_id_13_digits` พร้อม `field / raw / digits / page`
- ครอบคลุมทั้ง `supplier_tax_id` และ `customer_tax_id`

**ทดสอบกับเอกสารจริง 7 ฉบับ** (กลุ่ม R6-9):

| doc | ค่าที่ส่งมา | ผล |
|---|---|---|
| DMS-31 | `011554004198` | **flag 12 digits** ✓ |
| DMS-96 | `01155490004428` | **flag 14 digits** ✓ |
| DMS-42 | `0205557002730` (พิมพ์เว้นวรรค) | ไม่ fired ✓ |
| DMS-177, DMS-213 | รอบนี้ค่าถูกต้อง | ไม่ fired ✓ |
| DMS-20, DMS-106 (control) | ค่าปกติ | สะอาด ✓ |

`pytest 253 passed` · mutation สองทิศทาง: ปิด guard → แดง 2 tests · ให้ flag แม้ค่าที่ถูกต้อง → แดง 2 tests

## and ผลที่ พลิก งานนี้: ไม่มีอะไร ต้องเสนอ ให้ แก้ `rules.py`
ผมเตรียม 2 แนวทาง (เทียบแบบ digits-only / ให้ flag ห้าม fail E07) แล้วอ่าน `normalize.py` ก่อน — **กติกาพวกนี้มีอยู่แล้ว**
และเข้มกว่าที่ผมจะเสนอ: `tax_id()` strip ช่องขีด, บังคับ 13 หลัก, **ตรวจ Thai checksum**, และซ่อมรูปแบบ `0155…` (12 หลัก)
→ `0111…` ได้ ส่วน `_nfield()` แปลงเป็น `INVALID_FORMAT:<reason>` + `ok=False` และ `V-05` ใช้ `.value` ที่ normalize แล้ว

วัดจริงบนค่าที่ Final Full Round ส่งออกมา **836 ค่า** (ทั้งสองรอบ):

| field | ผ่าน validator | rejected |
|---|---|---|
| `supplier_tax_id` | 413/422 (97.9%) — รวมแก้รูปแบบ 17 ค่า | `NOT_13_DIGITS` 7 (= ตรงกับ flag ของผมทุกค่า) · `CHECKSUM` 2 |
| `customer_tax_id` | 382/414 (92.3%) — รวมแก้รูปแบบ 13 ค่า | `NOT_13_DIGITS` 11 · **`CHECKSUM` 21** |

สรุป: **false E07 ทั้งจาก typography และจาก id ที่อ่านขาด ถูกกันไว้ตั้งแต่ต้นแล้ว** — proposal สำหรับ `rules.py` จึงไม่มี
(เก็บไว้เป็นหลักฐานว่า "วัดแล้ว" ไม่ใช่ "คิดเอาว่าไม่ต้องมี")

## ofใหม่ที่ ได้ from ตารางข้างบน (ถึง owner)
`customer_tax_id` ตก checksum **21 reads (5.1%)** ขณะที่ `supplier_tax_id` ตกแค่ 2 (0.5%)
และ **master data (buyer_entity.yaml, 28 ids) ตก checksum = 0 ตัว**
→ checksum กำลัง **จับ OCR อ่านเลขผิดหลักเดียว** ของ buyer id `0145548001557` ได้จริง
(เห็นเป็น `0145548001558`, `0145548001357`, `0145546001557`, `0145548001594`, `0145549001557` ใน ~14 ฉบับ: 68, 76, 77, 103, 184, 194, 227, 236, 237, 238 …)

ผลต่อเนื่อง: เมื่อตก checksum field เป็น `ok=False` → **V-05 ไม่ถูกประเมินในเอกสารกลุ่มนั้น** (`_skip`)
ของที่ต้องตามคือ **เอกสารเหล่านี้โผล่เป็น REVIEW จริงหรือไม่** — วัดด้วยการรัน validate เทียบ outcome
ผมยังไม่ได้รัน และจะไม่สรุปเองว่าเป็นหรือไม่ใช่


---

# R6-12 · Class 5 closed with evidence — and it is NOT MODEL_LIMIT

Full evidence: `r69_class5_evidence.md` · measurement: `class5_probe.py` / `class5_probe.json`

- All 7 pages print the issuer's own tax id **legibly at 130 DPI** — no stamp overprint, no faded ink. My
  "MODEL_LIMIT (หมึกจาง/ตัวกลืน)" guess was **refuted by looking**.
- **attempt 1** = shipped `single-pass-extract@1.5.0` @150 DPI → **correct 10/14, missing 0, wrong 4**
  (DMS-31 drops a digit, DMS-96 inserts one; both caught by the new `format_warnings`).
- **attempt 2** = 300 DPI only (same code/prompt) → **14/14 correct, 0 wrong, 0 missing.**
- So: 5 docs = **OCR read-instability, PASS under 1.5.0**; 2 docs = **OCR limited by 150 DPI render**,
  **not MODEL_LIMIT** (attempt 2 fixed it — the plan's definition requires the fault to survive ≥2 attempts).
- Bonus finding nobody asked for: **the "field disappears" behaviour is gone** — 0/14 reads lost the field under
  1.5.0, on documents where it had vanished in one of two runs. Option A fixed a class it was never A/B'd on.
- Instrument lesson recorded in the file: I first mis-read DMS-96 as 14 digits from a *downscaled* montage;
  the 5x crop showed 13. Ground truth is checked at the resolution I plan to rely on.
- Owner trade-off left open: raise extract DPI 150→300 (≈4× pixels/page on ~224 pages), or the cheaper
  unmeasured option — **re-read at 300 DPI only the pages whose tax id fails the format/checksum rule**
  (18 + 23 rejections out of 836 delivered values). Not my call, and I'll measure before proposing.


---

# R6-13 · Targeted 300 DPI retry — the owner's cost rule turned into code, and it fixes the two documents R6-12 could not

## Design, then measurement, in that order

Before writing anything I measured what the trigger would cost on the three full corpus runs already on disk:

| run | documents | T1 delivered tax id fails format/checksum | T2 issuer tax id absent | retry rate if T1 only | if T1+T2 (ordered) |
|---|---|---|---|---|---|
| repA | 223 | 21 (9.4%) | 9 (4.0%) | 9.4% | **13.5%** |
| repB | 223 | 20 (9.0%) | 15 (6.7%) | 9.0% | **15.7%** |
| ffr/run1 | 223 | 15 (6.7%) | 14 (6.3%) | 6.7% | **13.0%** |

So the owner's rule ("150 DPI as the default, re-shoot 300 DPI only where a tax id is missing or fails
format/checksum") buys the resolution R6-12 proved was needed, for **~1 extra extract call on 13-16% of
documents** instead of 4× pixels on all ~224 pages. T2 (missing) is included because the owner asked for it and
because R6-12 showed those numbers are usually printed and simply not returned. An absent *customer* id is
deliberately **not** a trigger — plenty of documents legitimately print none.

## What ships

`PERCEPTION_TAXID_RETRY_DPI` (default 300, `0` = off, and the knob is part of `code_version`):
one re-read per **document** (not per page — cost stays bounded), same prompt, same rotation handling.
The second answer is accepted **only if the tax id rule now passes**; otherwise the first value stands and the
event is still logged. `extra["taxid_retry"]` records `{page, reason, dpi, accepted}`, and the retried page's
`render_dpi` is recorded as 300 so the geometry bookkeeping cannot lie about which frame the boxes came from.

## Tests: 8, red first

Trigger on 12 digits · on a check-digit failure · on a missing issuer id · **no extra call when the first read is
valid** · a still-wrong second read does not silently replace the first · **one retry per document, not per
page** · knob off restores old behaviour *and* changes the cache key · **a retried page still lands its boxes in
the same place** (compares `Region.bbox` fractions between 150-only and retried reads — a DPI bookkeeping error
would show up as a box ~2× off while still looking plausible).

One of these was green for the wrong reason and I only caught it because I checked: the knob-off/cache-key test
compared a pipeline built with `ink_snap=False` against one built with the default, so the `code_version`
differed because of the **snap**, not the knob. Fixed to compare arms that differ in the knob and nothing else.

`261 passed` (was 253). Mutation: `tax_id_problem()` always returns `None` → **5 of the 8 red**, the three
"no extra call" tests correctly stay green.

## Real documents, production pipeline, not a probe

| doc | what R6-12 measured | what the shipped pipeline delivers now | second look |
|---|---|---|---|
| **DMS-31** | `011554004198` at 150 DPI (digit dropped) | **`0115554004198` = exactly what the page prints** | `{'page':1,'reason':'TAX_ID_NOT_13_DIGITS','dpi':300,'accepted':True}`, page 1 recorded at 300 DPI, format flags 0 |
| **DMS-96** | `01155490004428` at 150 DPI (digit inserted) | **`0115549004428` = matches the page** | same shape, accepted |
| DMS-42 | prints its id spaced inside a box | delivered, **not flagged, not re-read** | none — a false positive would have shown as a wasted call |
| DMS-106 | clean control | delivered, **not re-read** | none |

## The mistake I made in this task, recorded because it cost an hour

To revert my mutation test I ran `git checkout -- src/system_a/perception/single_pass.py` on a file whose retry
work was **not yet committed** — which is the exact thing I wrote down as a rule after R6-3 ("back up to
bbox_testing/ before mutation testing"). The checkout restored HEAD and deleted the implementation; the tests
survived, so `261 passed` after re-applying proves nothing was silently lost. The file is now backed up to
`bbox_testing/round_06/single_pass.after_retry.py.bak` *before* any mutation, and mutation reverts by editing
the specific line back, not by asking git for a clean copy.
