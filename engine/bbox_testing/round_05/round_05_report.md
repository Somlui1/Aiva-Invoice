# รายงานปิด Round 5 → เตรียมเข้า Final Full Round (FFR)

เอกสารนี้เขียนตอนปิด Round 5 (18 ต.ค.) เพื่อให้คนเริ่ม FFR (หรือ AI session ใหม่) ไม่ต้องอ่าน scorecard 464 ทัดก่อน
ตัวเลขทุกตัวที่นี่มีคำสั่งรันซ้ำกำกับ และที่มาอยู่ใน `bbox_testing/round_05/scorecard.md`

---

## 1. สถานะงานสาย BBox หลังจบ Round 5

**สิ่งที่ engine ทำกับกล่องข้อความทุกใบที่ส่งออกไป (single-pass path):**
```
default   PERCEPTION_INK_SNAP=1, INK_SNAP_DEFAULT="move"      (grow ถอดออกจากค่า default เพราะวัดแล้วพัง)
map       strip_rules()   เส้นทึบเต็มหน้า (สูง <=4 px และยาว >=80% กว้างหน้า) ไม่ใช่ตัวอักษร
bands     line_bands()    รวมแถบที่ขาดจากกัน <=2 px แล้วคัดทิ้งถ้า สูง <4 px หรือ >24 px (หรือ >3% ของสูงหน้า)
snap      move ได้ไกลสุด 0.75x สูงกล่อง, grow สูงสุด 0.40x; กล่องที่ทับบรรทัดอยู่แล้ว = คืนของเดิมทุกพิกเซล
skip      กล่องที่ค่าเป็น placeholder ("-/", "N/A", ว่าง ฯลฯ) ไม่ถูกแตะ (is_placeholder)
cache     code_version ฝัง ink_snap_mode + INK_RULES_VERSION=2 -> payload เก่าไม่ถูกนับเป็นผลของกติกาใหม่
บันทึก    extra.ink_snap / ink_snap_mode ต่อ payload
```

**หลักฐานล่าสุด (Round 5, engine จริง 30 ฉบับที่มีงาน n=2 ต่อฝั่ง, ไม้บรรทัด `align.py` ไม่แก้):**

| metric | snap off | snap move | Δ | noise ในฝั่งเดียวกัน | สรุป |
|---|---|---|---|---|---|
| defect rate (กล่องที่ align ฟาด) | 13.2% (210/1592) | **8.2% (129/1571)** | **−5.0 pp** | 1.3 pp | เกิน noise |
| empty-box (ไม้บรรทัดเดิม "มี ink") | 2.4% (37/1516) | **0.6% (9/1496)** | **−1.8 pp** | 0.9 pp | เกิน noise |
| empty-box (ไม้บรรทัดใหม่ "มีตัวอักษร") | 17.8% | **12.65%** | **−5.2 pp** | 0.6 pp | เกิน noise |

คู่ขนานกันด้วยวิธีที่ไม่ใช้ model เลย (paired replay, payload เดิม): **−5.7 pp, 35 กล่องถูกแก้ / 0 กล่องถูกทำพัง**

## 2. ข้อที่ "ยังไม่Claims" — ห้ามเอาตัวเลขชุดนี้ไปพูดเกิน

1. **30 ฉบับที่วัดคือ doc ที่ปุ่มมีงาน** ไม่ใช่ทั้ง corpus → ผลระดับ corpus จริงเล็กกว่านี้มาก (R4-12 เคยชี้ว่า ~1 pp)
2. FFR ต้องรัน **223 ฉบับ** (`config/full_corpus_ids.json`, tag `invoice`, snapshot 15 ต.ค.) แล้ววัดใหม่ทั้งก้อน —
   ตัวเลขข้างบนใช้แทนไม่ได้ ใช้เป็น "ทิศทางที่ควรจะได้" เท่านั้น
3. `DMS-59 p1`, `DMS-227 p1`: engine หมุนหน้าแต่ส่งกล่องในกรอบ unrotated → `align.py` วัดไม่ได้ (ทั้ง 4 รันมี note เดียวกัน)
   = มีหน้าประเภทนี้นอกไม้บรรทัด ถ้า FFR เจอบ่อยต้องแยกนับเป็นประเภทเอง ไม่ใช่บวกเข้าไปใน defect
4. ตัวเลข defect rate ของ Round 1-4 **เทียบตรงกับ 8.2% นี้ไม่ได้** เพราะประชากรกล่องต่างกัน (R4-7) — เทียบได้แต่ rate
5. ไม้บรรทัดใหม่ (empty_by_print) เป็น diagnostic เท่านั้น ยังไม่เคยเป็นเกณฑ์ตัดสินรอบใด

## 3. Pre-flight ของ FFR (ยังไม่ได้ทำ — บังคับตาม runbook §ก่อน FFR)

| # | งาน | สถานะ / สิ่งที่ต้องทำ |
|---|---|---|
| (ก) | แผน §3 เคส 3: สุ่ม invoice **ที่ไม่มี tag** 5–10 ฉบับ + `round_01/added_docs.md` | **ยังไม่ทำ** — corpus snapshot นี้มีแต่ tag `invoice` ถ้า DMS ไม่ติด tag จะหลุดจาก 223 โดยไม่มีใครรู้ |
| (ข) | backfill `bbox_testing/source_images` ให้ 173 ฉบับนอกชุด 50 | **มีแค่ 50/223** → ไม้บรรทัด (align/ink_check) ทำงานกับ 173 ฉบับไม่ได้เลย ต้อง render ก่อน |
| (ค) | งบหน้ากระดาษ ~800 หน้า | อนุมัติแล้ว (System Owner: ไม่จำกัด token แต่ห้ามฟุ่มเฟือย) → ควร estimate จริงจาก page count ก่อนยิง |
| (ง) | Visual audit ค้าง **47 ฉบับ** (R3-11) | FFR บังคับเปิดดู **100%** สำหรับฉบับที่ไม่เคยตรวจ → งานคน/สายตามหาวัดอัตโนมัติแทนไม่ได้ |
| (จ) | เกณฑ์ audit ของ FFR: ฉบับนอกชุด 50 เปิดดู 100%; ชุด 50 เดิมใช้เกณฑ์รอบ 2 ขึ้นไป; ฉบับที่เคย PASS แล้วพัง = ต้องแก้/rollback ก่อน | จดไว้ที่แผนรอบงาน §5 และ runbook |
| (ฉ) | เงื่อนไขหยุด: 50 ฉบับ PASS/MODEL_LIMIT ครบ / 2 รอบติดไม่ดีขึ้น / ใช้ครบ 7 รอบ (รอบ 8 บังคับ FFR) | ตอนนี้ใช้ไป 5 รอบ (round_01…round_05) → เหลือ 2 รอบก่อนบังคับ **และห้ามประกาศจบงานถ้ายังไม่รัน full corpus อย่างน้อย 1 รอบ** |

## 4. คำสั่งพร้อมใช้

```bash
cd engine
# A/B หรือ single arm ผ่าน engine จริง (env ควบคุม snap) — corpus ทั้ง 223 ให้ส่ง --doc-ids จากไฟล์ config
DOCS=$(python -c "import json;print(','.join(map(str,json.load(open('config/full_corpus_ids.json'))['document_ids'])))")
PERCEPTION_INK_SNAP=0 python scripts/run_single_pass.py --doc-ids $DOCS --workers 3 \
        --out-dir bbox_testing/round_06/<arm>/run1
python scripts/run_single_pass.py --doc-ids $DOCS --workers 3 --out-dir bbox_testing/round_06/<arm>/run1

# วัด: แปลง payload engine -> รูปทรง round dir แล้วรัน align.py (ตัวเดิมห้ามแก้) + ink ทั้งสองบรรทัด
AB_ARMS=snap_off,snap_move python bbox_testing/round_05/ab_measure.py          # defect rate + noise floor
python bbox_testing/round_05/ruler_check.py                                    # empty by ink vs by print
# คัด doc ที่ปุ่มมีงานก่อน (อย่าเสียงบเทียบ 2 รันของสิ่งที่ไม่ทำงาน)
python bbox_testing/round_05/scan_moved.py
# suite + กติกา
TEMPDIR=$(cygpath -u "$TEMP") && PYTHONPATH=src python -m pytest tests/ -q -p no:cacheprovider --basetemp="$TEMPDIR/pi_pytest"
```

## 5. บทเรียนของสายนี้ที่ FFR ต้องถือต่อ (ทุกข้อเคยทำให้ตัวเลขผิดจริงแล้ว)

1. **เทียบ rate ไม่ใช่ count** — count รวม "รอบนั้นอ่านได้กี่กล่อง" (R4-7: 211↔280 จากโค้ดเดิม)
2. **n=2 ต่อฝั่งเป็นขั้นต่ำ** และต้องพิมพ์ noise floor ของแต่ละฝั่งเสมอ — gap ที่เล็กกว่า noise ยังไม่ใช่คำตอบ (R4-3c)
3. **เลือก doc ที่มีงานก่อนวัด** — ไม่งั้น A/B คือการเทียบ 2 รันของสิ่งที่ไม่มีอะไรเกิดขึ้น (R4-12)
4. **อย่าเชื่อ instrument ตัวแรก** — สายนี้จับบั๊กเครื่องมือของตัวเอง 5 ครั้ง (requantise, px↔norm, crop-not-rotate,
   กรอบรูป DMS-59, และนับ "เลื่อน 13 px" จาก note ที่จริงคือ "ข้ามช่องว่าง 13 px") ทุกครั้งที่แก้ test ต้องยังจับของเสียได้
5. **ของถูกต้องไม่พังงานอื่น** — ทุกการแก้มี control arm (`off`) ที่ต้องไม่มีกล่องไหนเคลื่อน ถ้าเคลื่อนแปลว่า wiring ผิด
6. **measure ก่อนใส่ rule กันไว้** — guard "print under box" เคยถูกเขียน วัด แล้วถอน (ตัดงานดี 14 กล่อง ไม่ลดของเสีย)
   และ dotted leader ที่กลัวกันมาสองรอบ ก็วัดแล้วไม่พบจริง
