# Scorecard — Round 05 / R4-3c: A/B จริงของ ink snap (16 ต.ค. รอบบ่าย)

คำถาม: snap ที่ใส่ใน R4-3a ทำให้กล่องดีขึ้นจริงไหม — วัดด้วยตัวเลข ไม่ใช่ความรู้สึก
กติกาที่บังคับใช้รอบนี้ (จากบทเรียน R4-7): **เทียบ rate เท่านั้น ห้ามเทียบ count** และทุกการเทียบต้องมีซ้ำ n=2

## วิธีรัน (ทำซ้ำได้ทั้งหมด)

```bash
# สี่รัน: ฝั่งละ 2 ครั้ง บน doc เดิมของ R4-3b, arms สลับกันตามเวลา (on1,off1,on2,off2)
bash bbox_testing/round_05/run_arms.sh
#   = PERCEPTION_INK_SNAP={1,0} python scripts/run_single_pass.py \
#       --doc-ids 127,171,170,159,107,117 --workers 2 --out-dir bbox_testing/round_05/<arm>/run<n>
#   (ผ่าน SinglePassPipeline จริง, 150 DPI, temperature 0 — ไม่ใช่ harness ของ audit ซึ่งมองไม่เห็น snap)

python bbox_testing/round_05/ab_measure.py          # แปลง engine payload → รูป round dir แล้ววัด 2 ไม้บรรทัด
PAIR_RUN=2 python bbox_testing/round_05/paired_snap.py   # วัดแบบ paired (ไม่มี noise ของ model)
```

หลักฐานความซื่อของรอบนี้: ทุก payload บันทึก `extra.ink_snap` ไว้ (4 รัน = 24 payloads, ฝั่งละ 12 —
ตรวจแล้ว `snap_on run1/run2 = {True}`, `snap_off run1/run2 = {False}`, `page_errors` ว่างทุกตัว) และ
`code_version` ของ pipeline now รวมฝั่งของ snap ไว้ด้วย เพราะ `process_pdf.py` เอาค่านี้ไปทำ perception cache key
— ไม่งั้นฝั่งที่เปิดอยู่จะคืนผลเก่าให้ฝั่งที่ปิด (test `test_the_two_snap_arms_may_not_share_a_perception_cache_entry`)

ไม้บรรทัด: `ink_check.py` (กล่อง field/cell ที่ไม่มี ink เลย) + `round_03/align.py` (defect per box, เกณฑ์ 80%)
โดย **align.py ไม่ถูกแก้แม้แต่ counter ตัวเดียว** — เรียกผ่าน subprocess แล้วอ่านรายงานมันเอง

## ผลที่ 1 — A/B แบบรันสองรอบต่อฝั่ง: **สรุปไม่ได้ (Δ ต่ำกว่า noise ของตัวเอง)**

| ฝั่ง | defect rate (pooled) | ต่อรัน | spread ในฝั่ง | empty rate (pooled) | ต่อรัน |
|---|---|---|---|---|---|
| snap_on | **11.0%** (52/472 กล่อง) | 11.9% / 10.2% | 1.7 pp | **0.0%** (0/422) | 0% / 0% |
| snap_off | **10.8%** (51/472 กล่อง) | 8.1% / 13.6% | **5.5 pp** | **1.2%** (5/422) | 0% / 2.4% |

Δdefect = **0.2 pp** กับ noise floor 5.5 pp · Δempty = **1.2 pp** กับ noise floor 2.4 pp
→ ทั้งคู่อยู่ในการแกว่งของโค้ดเดิม จึง **อ้างอะไรไม่ได้ทั้งนั้น** และสาเหตุไม่ใช่ snap ไม่ทำงาน แต่คือ
**doc set นี้แทบไม่มีงานให้ snap ทำ** (ดูผลที่ 3)

## ผลที่ 2 — paired (คำตอบเดิมของ model, snap หรือไม่ snap เท่านั้น): **แย่ลงจริง และทำซ้ำได้**

ตัด noise ของ model ทิ้งด้วยการเอา box ที่ `snap_off` ส่งจริง มา replay ผ่าน `snap_box_to_ink` บนภาพจริงที่
150 DPI (= สิ่งที่ engine ทำกับหน้า unrotated ทุกหน้าของ 6 ฉบับนี้, `M=None`) แล้ววัด box สองชุดด้วยไม้บรรทัดเดียวกัน

| รัน | กล่อง | กล่องที่ถูกขยับ | defect ก่อน → หลัง | แก้ได้ | ทำพัง | `line_N` ที่หยุดคลุม cell ของตัวเอง |
|---|---|---|---|---|---|---|
| run1 | 211 | 96 | 8.1% → **10.6%** | 3 | **9** | 2 |
| run2 | 211 | 95 | 13.6% → **15.7%** | 7 | **12** | 4 |
| รวม | 422 | 191 | **+2.1 pp ทั้งสองครั้ง** | 10 | **21** | 6 |

กล่องที่เสียชื่อ (ทำซ้ำทั้งสองรัน): `vat` (107, 117, 171), `supplier_tax_id`/`invoice_num` (107),
`L1.description` (170), `L2.amount`/`L2.unit_price` (171)

## ผลที่ 3 — กลไก: `moved` (เหตุผลที่ snap มีอยู่) แทบไม่เคยทำงาน ส่วนที่ทำงานจริงคือ `grown`

นับจาก `note` ของ `snap_box_to_ink` เอง บนกล่อง field/cell จริงของสองรัน:

| รัน | `grown` (ขยายตามแนวนอน) | `moved` (เลื่อนไปบรรทัด ink) | `unchanged` |
|---|---|---|---|
| run1 | 96 | **0** | 115 |
| run2 | 90 | **5** | 116 |

- **กล่องว่างที่ Round 3 ฟาดไว้ 90 กล่อง ไม่เกิดบน path ของ engine เลย**: empty = 5 กล่องจาก 844
  กล่อง-ที่สังเกต (0.6%) และ 5 กล่องนั้นคือ 5 ครั้งที่ `moved` ทำงานพอดี (DMS-159 run2) — paired ยืนยันว่า
  หลัง snap empty ลงเป็น 0.0% ✔ **นี่คือกำไรอย่างเดียวที่วัดได้จริง**
- ราคาที่จ่ายคือ **`grown` which fires on ~45% of boxes**: `L1.description` กว้าง 0.278 → **0.501**,
  `vat` 0.071 → **0.127**, `invoice_num` ขยายไปทางซ้าย — ลามเข้า label/คอลัมน์ข้างเคียง
  (`INK_GAP_PX=3` กันไม่ได้เพราะ run ของ ink บนฟอร์มแน่นต่อกันทั้งแถว)
- และ engine **ไม่ snap แถว** (`line_bbox` = union ของ cell ตาม R1-9) → ขยาย cell แล้วกรอบแถวตามไม่ทัน
  **invariant "กรอบแถวคลุม cell ของตัวเอง" ที่ R3-9 วัดไว้ 0/50 จึงพัง** — ตรวจซ้ำด้วย arithmetic ล้วน
  (ไม่เกี่ยวกับ pixel/เฟรม): DMS-107 `L1.description` 1.00 → **0.84**, DMS-170 `L1.description` 1.00 → **0.85**

## ทำไม empty-rate ของ engine ถึงอ่าน 0% ทั้งที่ Round 3 ฟาดไว้เยอะ (ห้ามลืม)

1. **คนละ payload** — 90 กล่องนั้นวัดจาก `ocr/` ของ harness (130 DPI, pipeline ของมันเอง) ส่วนนี่คือ
   `extraction.json` ของ engine (150 DPI, prompt v1.3) บน doc เดียวกัน DMS-171 harness = 10/20 ว่าง,
   engine = 0/20 ทั้งสองฝั่ง
2. **ink mask นับเส้นตารางกับเส้นประใต้ยอดเงินเป็น ink** → "กล่องมี ink ทับ" เป็นจริงแทบทุกครั้ง
   ทำให้ทั้ง *ตัววัด* และ *ตัว snap* มองผิดสัญญาณพร้อมกัน (`own` band เจอจากเส้นตาราง → ไม่เคย `moved`)

## ข้อจำกัดของตัวเลขชุดนี้ (ห้ามตีความเกิน)
- 6 ฉบับ ไม่ใช่ 50 — และ `defect` คือเกณฑ์ 80% coverage ของ align ซึ่ง Round 3 สรุปแล้วว่า
  **รายฉบับอ่อน** และมีผลบวกปลอมเวลากล่องทับอีกบรรทัดอย่างสะอาด
- ทั้ง 6 ฉบับ pipeline ไม่ได้หมุนหน้า → paired replay ใช้ `M=None` ตรงกับ engine; **หน้าที่หมุนยังไม่ถูกวัดด้วยวิธีนี้**
- `line_N` ที่ "ทำพัง" มาจาก cell ขยายออกนอกแถว ไม่ใช่จาก pixel metric — เป็น arithmetic ที่เชื่อถือได้กว่ากลุ่มอื่น

## ข้อเสนอ (รอ owner เคาะ — ยังไม่ได้เปลี่ยน default)
1. **ปิด snap เป็น default** (`PERCEPTION_INK_SNAP=0`): evidence ปัจจุบัน = กำไร 0.6% ของกล่อง, ขาดทุน ~5%
   ของกล่องที่ verdict แย่ลง · toggle ปล่อยไว้สลับได้ทันที และ payload บันทึกฝั่งไว้แล้ว
2. หรือ **แก้ก่อนเปิด**: (ก) `grown` ห้ามข้ามกล่อง cell ข้างเคียง/ห้ามเกิน `line_bbox` (ข) `line_bbox` =
   union ของ cell *หลัง* snap (R1-9 invariant) (ค) `moved` จะเริ่มทำงานได้เมื่อ ink mask ไม่นับเส้นตาราง/เส้นประ
   — ถ้าไม่แก้ (ค) กติกา "เลื่อนไปหา ink" จะไม่มีวันเกิดบนฟอร์มแน่น
3. เลือก doc ให้ถูกก่อนวัดรอบหน้า: **วัด `moved` count ก่อน** แล้วค่อยเลือกฉบับที่มันทำงานจริง ไม่งั้นก็ได้ null อย่างรอบนี้

## ไฟล์ที่สร้างรอบนี้ (ทั้งหมดอยู่ใต้ `bbox_testing/` ซึ่ง gitignore — คำสั่งข้างบน rebuild ได้)
`run_arms.sh` (รัน 4 ฝั่ง), `ab_measure.py` (แปลง payload + วัด 2 ไม้บรรทัด + เทียบ rate/noise),
`paired_snap.py` (paired replay), `ink_check.py` (แก้ให้ชี้ `ENGINE_DIR`/`AUDIT_DIR` ได้อิสระ),
`align/<arm>_run<n>/` (payload ที่แปลงแล้วให้ align วัด), `align/snap_off_run<n>_snapped/` (ฝั่ง replay)


---

# R4-9 (ต่อจากรอบเช้า): แยกสองปุ่มของ snap แล้ววัดทีละปุ่ม (16 ต.ค. รอบเย็น)

ปมของ R4-3c คือ snap หนึ่งตัวทำสองอย่างพร้อมกัน — **MOVE** กล่องที่อยู่บนกระดาษว่าง ให้ไปอยู่บรรทัดที่พิมพ์จริง
กับ **GROW** กล่องที่อยู่ถูกบรรทัดแล้วให้กว้างคลุมตัวเลขทั้งพวง — คะแนนรวมจึงเถียงไม่ได้ว่าใครดีใครร้าย
รอบนี้เลยแยกปุ่ม แล้ววัดใหม่ทั้งหมดด้วย `paired_snap.py` (คำตอบ model ชุดเดิม, ไม้บรรทัดเดิม, ไม่มี noise ของ model)

## โค้ดที่แก้ (TDD ทุกขั้น, แดงก่อนเขียวจริง)

1. `snap_box_to_ink(..., move=, grow=)` + `PERCEPTION_INK_SNAP=both|move|grow|off` และ payload บันทึก
   `extra["ink_snap_mode"]` ไว้ด้วย (arm ไหนก็พิสูจน์ย้อนหลังได้)
2. **กล่องที่ snap ไม่ได้แตะ ต้องไม่ถูก "วัดใหม่"** — เดิมกล่องทุกกล่องที่วิ่งผ่าน snap ถูกตัดเลขพิกัดเป็นจำนวนเต็ม
   (เลื่อนได้สูงสุด 1 px) ซึ่งเพียงพอให้ verdict ของ align พลิก: control arm (mode `off` ที่ replay ผ่านโค้ดเดิม
   ทั้งหมด) วัดก่อนแก้ = **fixed 2 / broke 2 ทั้งที่ไม่มีการแก้กล่องเลยแม้แต่กล่องเดียว** หลังแก้ = **0 / 0**
   (test `test_a_box_the_snap_leaves_alone_is_delivered_exactly_as_the_model_drew_it`)
   ⇒ตัวเลขเก่าทุกตัวของ R4-3c มี artifact ตัวนี้ปนอยู่ในฝั่งที่เปิด snap ฝั่งเดียว
3. **กรอบแถวต้องตาม cell ของมัน** — `PageAnswer.region(row, contains=cells)` ขยายกรอบแถวเป็น hull ของ cell
   ที่ model วางไว้ในแถวนั้นจริง (cell ที่ model ไม่ได้วางในแถวนี้ ไม่ถูกดึงเข้ามา = ไม่เป่ากรอบให้บวม — มี test กันไว้)

## ผล: ใครคืออะไร (baseline = arm `off` เพราะทุก arm ผ่าน hull เหมือนกัน)

| arm | run1: moved / defect / fix-break / empty | run2: moved / defect / fix-break / empty |
|---|---|---|
| raw (payload เดิม) | 8.1%, 0/0, 0.0% | 13.6%, 0/**10**, 2.4% |
| **off (control)** | 8.1% → 8.1% (0/0) | 9.3% (0/0) |
| **move** | 0/211 · 8.1% → 8.1% (0/0) | 5/211 · 9.3% → **8.1% (−1.3 pp)**, 3 fix / **0 broke**, empty **2.4% → 0.0%** |
| **grow** | 96/211 · 8.1% → **9.7% (+1.7 pp)**, 2 fix / **6 broke** | 90/211 · 9.3% → **11.0% (+1.7 pp)**, 3 fix / **7 broke** |
| both (= R4-3a ที่ ship ไว้) | 96/211 · 8.1% → 9.7% (+1.7 pp), 2/6 | 95/211 · 9.3% → 9.7% (+0.4 pp), 6/7, empty 0.0% |

- **`grow` = ปิด**: แย่ลง **+1.7 pp เท่ากันทั้งสองรัน** (แก้ 5 ทำพัง 13) และ **ไม่ช่วยลดกล่องว่างแม้แต่กล่องเดียว**
- **`move` = เปิด**: รันแรกไม่มีงานให้ทำเลย (0 กล่อง) รันสอง **−1.3 pp, ทำพัง 0** และเก็บกวาดกล่องว่างเกลี้ยง (0.0%)
- **default ใหม่ = `move`** (`INK_SNAP_DEFAULT`): `=both` คืนพฤติกรรม R4-3a, `=0` ปิดทั้งหมด, พิมพ์ผิด = default
  (ห้าม silently ปิดของที่ดีเพราะ typo) — R4-3a shipped ทั้งคู่โดยไม่มีใครวัด อันนี้คือสิ่งที่ตัวเลขสนับสนุน

## "กรอบแถวตาม cell" ชนะจริงหรือแค่ถูกหลักการ? — วัดแยกบน 50 ฉบับ ไม่ใช้ VLM ไม่ใช้ ink

`bbox_testing/round_05/row_hull_check.py` บน `round_04` ทั้ง 50 ฉบับ (117 แถว):

- **115 จาก 117 กรอบแถวถูกสร้างใหม่** (hull ของ cell 632 cell) แต่ **verdict เปลี่ยน 0**: defect **19.2% → 19.2%**
  แถวที่ถูก flag **5 → 5**
- ส่วน −4.2 pp ที่โผล่ใน snap_off/run2 คือ **DMS-159 ฉบับเดียว 10 แถว** (payload ของรันนั้นมี line_bbox เพี้ยน)
- 5 แถวที่ยังถูก flag หลัง hull (DMS-134 `line_1`, DMS-159 `line_1`–`line_4`) มีสาเหตุอื่น ไม่ใช่การไม่คลุม cell

⇒ บันทึกไว้ตรง ๆ: กฎนี้คือ **หลักประกัน invariant ให้เป็นจริง by construction** (วันที่ payload เพี้ยนแบบ DMS-159
มันกัน defect ให้ทั้งแถว) ไม่ใช่ "ชัยชนะ 4 pp" อย่างที่ตัวเลขรอบแรกทำให้ดูเหมือนนั้น

## ตรวจ end-to-end ด้วย default ใหม่ (รันจริง 6 ฉบับ)

6/6 ok, payload ทุกตัว `ink_snap=True, ink_snap_mode="move"`, `page_errors` ว่างหมด, `empty rate 0.0%`
defect run เดียว = 8.9% เทียบ snap_off run1 = 8.1% (+0.8 pp) — **n=1 สรุปอะไรไม่ได้** (floor ที่วัดจริงคือ 5.5 pp ที่ n=2)
และโปรดระวัง: `ab_measure.py` ที่ `AB_RUNS=1,1` จะพิมพ์ "noise floor 0.0 pp ⇒ DIFFERENCE LARGER THAN NOISE"
ซึ่งเป็น **artifact ของการชี้อาร์มสองครั้งไปที่ run เดียวกัน** ไม่ใช่หลักฐาน — อ่านเฉพาะค่า rate ของแต่ละรัน

pytest **222 passed** (เดิม 210) — +12: แยกปุ่มระดับ coords 3, ผ่าน pipeline 6, quantization 1, invariant แถว 2
(ไม่มี assert เดิมถูกทำให้อ่อนลง มีแต่ assert ใหม่ที่เข้มขึ้น)

## คิวที่ค้าง (จดไว้ไม่ให้รอบหน้าเดา)
- `move` ยัง "แทบไม่ทำงาน" บนฟอร์มแน่น เพราะ ink mask นับ **เส้นตาราง/เส้นประ** เป็น ink → box ที่หลุดบรรทัดมักมี
  "band ของตัวเอง" ปลอม ๆ ทำให้ `own` ไม่เป็น None เลย ต้องแก้ mask ก่อน (R4-11) ไม่อย่างนั้นกติกา "เลื่อนไปหา ink"
  จะไม่มีวันเกิดบนฟอร์มแน่น และตัววัด empty-box ก็จะบอดต่อไปด้วย
- `grow` ยังเปิดได้ผ่าน env ถ้าใครอยากใช้ ต้องแก้ให้ลามเข้าคอลัมน์ข้างเคียงไม่ได้ก่อน (วัดแล้ว −1.7 pp)
- จะวัด `move` รอบหน้า: **นับจำนวน `moved` ก่อน** แล้วเลือก doc ที่มันมีงานจริง (run1 = 0 กล่อง = ได้ null อย่างที่เห็น)

## คำสั่งทำซ้ำ
```bash
python bbox_testing/round_05/paired_snap.py                     # run1, arms: off,move,grow,both
PAIR_RUN=2 python bbox_testing/round_05/paired_snap.py          # run2
python bbox_testing/round_05/row_hull_check.py                  # 50 ฉบับ, hull อย่างเดียว
python scripts/run_single_pass.py --doc-ids 127,171,170,159,107,117 --workers 2     --out-dir bbox_testing/round_05/default_move/run1           # default ใหม่ (ไม่ต้องตั้ง env)
AB_ARMS=default_move,snap_off AB_RUNS=1,1 python bbox_testing/round_05/ab_measure.py
```
