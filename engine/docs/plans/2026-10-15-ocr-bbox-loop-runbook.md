# Runbook — OCR/BBox autonomous improvement loop (resume a fresh session)

คู่มือเริ่มต้นใหม่เมื่อ context/session หมด: **copy 1 บรรทัดนี้ไปวาง**

> อ่าน `AGENTS.md`, `docs/plans/2026-10-15-ocr-bbox-autonomous-improvement-loop.md`,
> `docs/plans/2026-10-15-ocr-bbox-loop-runbook.md` แล้วลุย Round 3 visual audit ต่อจาก
> `bbox_testing/round_03/progress.json` ตามกติกาในไฟล์นั้น อย่าถามซ้ำ

ทุกอย่างเป็น state บน disk — session ใหม่ไม่ต้องมีความจำเดิม

## 1. State อยู่ที่ไฟล์ไหน

| ข้อมูล | ไฟล์ |
|---|---|
| แผนแม่ (ห้ามตีความใหม่) | `docs/plans/2026-10-15-ocr-bbox-autonomous-improvement-loop.md` |
| Task tracker (อัปเดตทุกครั้งที่เปลี่ยนสถานะ) | `docs/plans/task.md` (ต่อท้ายตารางท้ายไฟล์) |
| คิวตรวจภาพ + ความคืบหน้า | `bbox_testing/round_03/progress.json` → `inspected`, `pending_view`, `triage_order` |
| ผลตรวจรายฉบับ (ต้องบันทึกไฟล์รูปที่เปิด) | `bbox_testing/round_03/review/DMS-<id>.md` |
| สรุป/ข้อค้นพบ/ตารางวัดผล | `bbox_testing/round_03/scorecard.md` |
| กติกาการตรวจภาพ (owner ruling) | `bbox_testing/round_03/INSPECTION_PROTOCOL.md` |
| คิวต้องดูจาก diff | `bbox_testing/round_03/round_diff.json` (`view_queue`, `must_view`) |
| รูปอ่านง่าย (102 รูป 1000px) | `bbox_testing/round_03/view/` (สร้างโดย `make_view.py`) |
| Baseline เดิม | `bbox_testing/round_01/` (ตรวจ 11/48, 11 FAIL — owner ตัดสิน: ปิดเป็น baseline) |
| ชุดเอกสาร 50 ฉบับ / corpus 223 | `config/eval_staged_50_ids.json`, `config/full_corpus_ids.json` (อ่านอย่างเดียว) |

## 2. คำสั่งที่ใช้บ่อย

```bash
# test (ห้ามใช้ pytest ตรง ๆ จะ PermissionError บน Windows)
TEMPDIR=$(cygpath -u "$TEMP"); PYTHONPATH=src python -m pytest tests/ -q -p no:cacheprovider \
    --basetemp="$TEMPDIR/pi_pytest"

# รันรอบ (130 DPI, temperature 0)
python scripts/test_invoice_single_pass.py --ids-file config/eval_staged_50_ids.json \
    --out-dir bbox_testing/round_04 --layout round --dpi 130 --workers 4

# จัดคิว + นับความคืบหน้า
python scripts/test_invoice_single_pass.py --audit-round bbox_testing/round_03

# เทียบ 2 รอบ
python scripts/test_invoice_single_pass.py --compare-rounds bbox_testing/round_02 bbox_testing/round_03

# สรุป payload ต่อ 1 ฉบับ (ประหยัด context)
python bbox_testing/round_03/summarize.py 47 134
python bbox_testing/round_03/make_view.py            # view JPEG ทุกหน้าของเอกสารในคิว
# crop เมื่อเข้า 3 trigger ของแผน (OCR misread / กล่องบัง / ต้องเพ่ง)
python scripts/test_invoice_single_pass.py --crop --crop-field grand_total --crop-page 1 \
    --source-images-dir bbox_testing/source_images --round-dir bbox_testing/round_03
```

## 3. กติกาเหล็ก (owner สั่งไว้ — ห้ามละเมิด)

1. Whitelist แก้ได้: `config/prompts/single_pass_extract.md`, `single_pass_classify.md`,
   `src/system_a/perception/{coords,single_pass,assembler,cache}.py`, `scripts/test_invoice_single_pass.py`,
   `scripts/render_debug_bboxes.py`, `config/eval_staged_50_ids.json`, `tests/test_coords_rotation.py`,
   `tests/test_single_pass.py`, `tests/test_ocr_improvements.py`, workspace `bbox_testing/`
2. ห้ามแตะ: `src/system_a/matching.py`, `rules.py` (V-01..V-08), Oracle, Frontend
3. Paperless = **อ่านอย่างเดียว** (ไม่แก้ tag ไม่ลบ ไม่เขียนกลับ)
4. **ห้ามลบ/ลด/放宽 assert เดิม** — เพิ่ม test case ใหม่เท่านั้น; `pytest tests/` ต้อง 100% (ตอนนี้ 183)
5. Git: commit บน branch `engine`, **`git add` ทีละพาธ**, ห้าม `git add -A` / `.` / `commit -a`,
   ห้าม stage ไฟล์ที่งานอื่นทำให้ dirty (`frontend/**`, `config/standards/v6.6/*`,
   `src/system_a/sandbox/scenarios.py`, `.gitignore`), แนบ `git diff --cached --stat` ทุก commit
6. **commit ทันทีที่ test เขียว** — งานนี้เคยโดน git ของ work stream อื่นกลืน (merge + stash, `5054136`)
   ตอนยังไม่ commit แล้วงานหายทั้งฟีเจอร์
7. **ห้ามแก้ script ขณะ batch รัน** (module เก่าถูก load ทำให้ crash ตอนรายงานผล)
8. ตรวจภาพ: เปิด `rendered/DMS-<id>_p<page>_bbox.png` **ทุกหน้าที่ระบบเลือก** (บังคับ), หน้าที่ไม่ถูกเลือก
   ให้ JSON-check ว่าไม่มี box + เปิดหน้าแรก 1 หน้า, `source_images` เปิดเมื่อ 3 trigger เท่านั้น,
   review file ต้องระบุว่าเปิดไฟล์ไหนบ้าง

## 4. ข้อสรุปที่ตัดสินแล้ว (ห้ามถกใหม่ใน session ใหม่)

- Automated check เป็นได้แค่ **ตัวจัดคิว** ห้ามใช้แทนการดูรูป (พิสูจน์ด้วย DMS-25 false `MISSING_FIELD`)
- **Box shift ไม่ใช่หลักฐาน** ว่าผลเปลี่ยน (noise p90=67.7px) → ใช้ material/cosmetic (`text_change_is_material`)
- `currency` ไม่计入 verdict (flip 43%) · row จับคู่ด้วย **content signature** ไม่ใช่ `line_no`
- `row_bbox` = union ของ cell ใน raw **xyxy** (ไม่ใช่ xywh) และเก็บ `line_bbox_model`
- Digit re-check (`--recheck-digits`) = **MODEL_LIMIT**: crop แคบตัดเลขท้ายหาย (8/29), แถบกว้างอ่านค่า
  คอลัมน์ข้างเคียง (9/35) → เป็นได้แค่ `recheck_hints` default ปิด
- PDF ทุกฉบับเป็น scan (`get_text()` = 0 ตัวอักษร) → **ไม่มี** deterministic digit verifier
- `CLASSIFY_SUSPECT`: ข้ามสำเนาที่ `(doc_no_hint, page_marker)` ตรงกับหน้าที่เลือก หรือ hint = `invoice_num`
- `DUPLICATE:<region>`: นับเฉพาะกล่องที่ทับซ้อน >25% ของกล่องเล็ก (stamp หลายดวงบนกระดาษ = ปกติ)
- หน้าที่ตอบว่าง: retry **4 attempts** (`EXTRACT_EMPTY_ATTEMPTS`) — DMS-159 p1 ว่าง 6/8 attempts ที่ temp 0

## 5. MODEL_LIMIT ที่บันทึกแล้ว (มีหลักฐาน ≥2 วิธีที่ลอง)

| หมวด | หลักฐาน | วิธีที่ลอง |
|---|---|---|
| เลขยาว alphanumeric | `LN60644814000H2`↔`LN6064481400H2`, `EKSD2-25`↔`EKSD22-25`, `po_number` flip 14% | prompt v1.2 baseline, v1.3.0 VALUE FIDELITY |
| `currency` phantom | DMS-47/DMS-198 = THB ทั้งที่ไม่มีการพิมพ์ | v1.2, v1.3.0 |
| `vat` computed-in-raw | DMS-47 raw `604.80` กระดาษพิมพ์ `7.00` | v1.2, v1.3.0 |
| page-level empty answer | DMS-159 p1 ว่าง 6/8 attempts | retry 2→4 attempts |

## 6. สถานะปัจจุบัน + สิ่งที่ต้องทำต่อ

- `pytest tests/` **183/183** · HEAD `d0ca479` (branch `engine`)
- Round 1: 48/50 (baseline) · Round 2: 49/50 · **Round 3: 50/50 pipeline, 0 error**
- Visual audit: round_01 11/48 (ปิดเป็น baseline) · **round_03 3/50** (`DMS-134`, `DMS-159`, `DMS-47` — ทุกฉบับ FAIL)
- คิวถัดไป (`triage_order`): DMS-198 (ค้างจาก Tranche A), 106, 107, 108, 111, 117, 127, ... (47 ฉบับ)
  โดยPriority `must_view` 31 ฉบับจาก `round_diff.json` ก่อน
- ก่อน **Final Full Round (223 ฉบับ)** ต้องทำ: (ก) แผน §3 เคส 3 — สุ่ม invoice ที่ไม่มี tag 5–10 ฉบับ +
  `round_01/added_docs.md`; (ข) backfill `bbox_testing/source_images` ให้ 173 นอก 50; (ค) งบ ~800 หน้า
- หลังจบ visual audit รอบ 3: ทำ `round_03` Round 4 (rerun) เพื่อวัดว่า fix ใหม่ลด FAIL จริง แล้วเทียบ
  กับ FAIL set ของรอบ 1

## 7. Pattern ที่ยังเปิด (จาก round_01 §4)

`P2` ขวาสุดของตารางถูกตัด/กล่องซ้อน · `P3` กล่อง anchor บน label ไม่ใช่ค่า · `P4` currency phantom ·
`P5` `customer_tax_id` ผิดบรรทัด · `P6` เลือกสำเนา/non-invoice · `P8` จับตัวเลขผิด label (DMS-47 ยืนยันว่ายังไม่หาย)
(P1 line_bbox, P7 duplicate region, P9 pipeline crash = ปิดแล้ว)
