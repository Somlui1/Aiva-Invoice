# Engine Evidence Findings (v5.7) Implementation Plan

> **For Antigravity / Pi:** REQUIRED WORKFLOW: `.agent/skills/executing-plans` + `single-flow-task-execution` · one task at a time · update `engine/docs/plans/task.md` at each state change.
> **Pair plan:** `frontend/docs/plans/2026-10-26-evidence-findings-portal-implementation.md` (Portal F1–F4 must ship **before** E7)

**Goal:** ให้ engine แนบหลักฐานแบบ **1 evidence = 1 finding = 1 ปุ่มบน Portal** — ทุกแถวต้อง "ระบุตำแหน่งได้" (`bboxes`) หรือ "บอกเหตุผลที่ระบุไม่ได้" (`bbox_missing_reason` ที่ reason ถูกต้อง) และ `manual_review` ต้องมีหลักฐานให้กดดู **โดย `recommendation` / `max_severity` / `exception_codes` ไม่เปลี่ยน**

**Architecture:**
- `Finding` (มี code) ยังเป็นตัวเดียวที่สร้าง `exceptions[]` และเป็นอินพุตของ `recommend()` → status ไม่ขยับ
- เพิ่ม `ReviewPoint` (ไม่มี code) ใน `RuleOutcome.reviews` → assembler สร้าง evidence `result="manual_review"`, `exception_code=null`, `severity=null` **ไม่สร้าง exception**
- เหตุผลที่ไม่มี bbox คำนวณที่ assembler จาก `null_reason` ของ field/cell จริง แทนค่าคงที่ `"NOT_LOCATED"`
- `contract` คงเป็น `aiva.system_a.result/3.0` (Portal ใช้ `z.literal` — เปลี่ยนแล้ว ingest พังทั้งระบบ) · bump เฉพาะ `versions.schema = "3.1"` (additive)

**Tech Stack:** Python 3 · `src/system_a` · pytest (`make test`) · sandbox (`make scenarios`, `--schema`, `--golden`) · `tools/replay_results.py`

**Base:** Engine v5.6 candidate (working tree 2026-10-21: 272 passed · scenarios 59/68) — V-06 v2.0 ชี้ `D1-sig-<slot>` แล้ว

---

## 0. สิ่งที่พบในโค้ด (เหตุผลของแต่ละ Task)

| # | ปัญหา | ตำแหน่ง | ผลบน Portal | Task |
|---|---|---|---|---|
| 1 | reason ฮาร์ดโค้ด `"NOT_LOCATED"` ทุกกรณี · finding ที่ `element_ids=()` ได้ `bbox_missing_reason=None` | `application/assembler.py:127-145` | banner บอกเหตุผลผิด / ไม่มีเหตุผล (DMS-40, 49) | E2 |
| 2 | V-01 รวมทุกฟิลด์ + ทุกเซลล์ + pages + geometry เป็น **finding เดียว** | `domain/rules.py:120-158` `v01_required` | ปุ่มเดียวคลุม 51 element (DMS-95) | E3 |
| 3 | V-01 ใส่ element id ของเซลล์ที่ไม่มีใน `ocr.elements` (cell ที่ normalize สร้างแต่ ext ไม่มี) | `v01_required` + `build_elements` (`assembler.py:30`) | 100 id ชี้ไม่ได้ | E2, E3 |
| 4 | V-03 เป็น finding เดียวแม้ผิดคนละข้อ (lines↔sub, vat 7%, sub+vat↔grand) | `rules.py:181` | กรอบขึ้นทั้ง 3 ช่องเสมอ | E3 |
| 5 | `manual_review` ส่วนใหญ่ไม่มี finding → ไม่มี evidence | V-04 `rules.py:249,259,265,285,308` · V-05 `:327,373,397,429` · V-07 `:540,544` (มี finding บางกรณี) · V-08 `:590,635` | ไม่มีปุ่ม (46 กรณีในชุด v5) | E4 |
| 6 | `recommend()` อ่าน `f.severity` ทุก finding → ถ้าใส่ finding ที่ code/severity เป็น None จะ `KeyError` | `domain/recommendation.py:12-14` | — | E4 (ใช้ `ReviewPoint` แยก) |
| 7 | `build_summary` สร้าง `summary.exceptions` และ `codes` จาก **evidence ทุกแถว** | `assembler.py:329,435,437` | ถ้ามี review evidence จะมี code `None` หลุดเข้า summary | E4 |
| 8 | element ลายเซ็นสร้างเฉพาะ slot ที่ ext/doc มี → slot ที่หาไม่เจอไม่มี element | `assembler.py:73` | V-06 E08 ที่ไม่พบกล่องไม่มี target และไม่มี reason | E5 |
| 9 | `actual_value`/`expected_value` ว่างใน V-01, V-07 E11/E13 | `rules.py` V-01, V-07 | banner ว่าง | E6 |
| 10 | JSON schema: `severity` เป็น `enum` ไม่รวม `null` | `schemas/result-3.0.schema.json` `properties.evidence` | review evidence ไม่ผ่าน `--schema` | E7 |

---

## Contract rules (ทุก Task ต้องเคารพ)

```text
R1  evidence_id     required · unique ในเอกสาร · X1, X2, … (ลำดับ: findings ก่อน reviews ภายใน rule เดียวกัน)
R2  ความละเอียด
      V-01 ฟิลด์หัว/ยอดรวม → 1 ฟิลด์       V-01 บรรทัด → 1 บรรทัด (รวมเซลล์ที่หายของบรรทัดนั้น)
      V-01 pages_complete → 1 แถว         V-01 geometry → 1 บรรทัด
      V-03 → 1 การตรวจที่ผิด               V-04/V-05 → 1 ฟิลด์หรือ 1 เหตุการณ์
      V-06 → 1 slot                       V-07/V-08 → 1 บรรทัด (เดิมถูกแล้ว)
R3  bboxes ไม่ว่าง  หรือ  bbox_missing_reason != null   (อย่างใดอย่างหนึ่งเสมอ; มีทั้งคู่ได้ = ระบุได้บางส่วน)
R4  bbox_missing_reason = { element_ids: [...], reason: NOT_PRESENT | NOT_LOCATED | PAGES_INCOMPLETE | LOW_CONFIDENCE | NO_ELEMENT }
R5  page_no == sorted(unique(bboxes[].page_no))           (ปัจจุบันถูก — ห้ามถอย)
R6  related_element_ids ⊆ ocr.elements                   (id ที่ไม่มี element → ไปอยู่ใน bbox_missing_reason.element_ids เท่านั้น)
R7  manual_review rule → evidence ≥ 1 (review) · exception_code = null · severity = null · ไม่มีใน exceptions[]
R8  fail rule → evidence ≥ 1 และมี exception_code
R9  message_th อธิบาย finding นั้นเท่านั้น
R10 signatures.<slot> มี element ครบทุก slot ที่ V-06 ตรวจ · normalized_value เป็น bool | null
```

---

### Task E0: Baseline (ไม่แก้โค้ด)

**Files:** `temp/evidence-baseline/` (ไม่ commit)

```bash
cd engine
make test                                   # จดจำนวน passed (คาด 272)
PYTHONPATH=src python -m system_a.cli scenarios > temp/evidence-baseline/scenarios.txt
PYTHONPATH=src python -m system_a.sandbox.scenarios --schema
python tools/replay_results.py src ../frontend/temp/paperless_invoices_v5 temp/evidence-baseline/replay.json schemas/result-3.0.schema.json
```
บันทึกต่อเอกสาร: `recommendation.value`, `max_severity`, `exception_codes`, จำนวน evidence/exceptions — ใช้เทียบใน E8

---

### Task E1: Evidence post-check (warn mode) — ไม่เปลี่ยนผลลัพธ์

**Files:**
- Create: `src/system_a/application/evidence_check.py`
- Modify: `src/system_a/application/assembler.py` (`assemble`, หลังสร้าง `evidence` ก่อน `payload =`)
- Test: `tests/test_evidence_check.py`

**Step 1: failing test** — สร้าง payload เล็ก ๆ ด้วยมือ 6 แบบ แล้ว assert รหัส violation:
`R3_NO_LOCATION_NO_REASON` · `R4_BAD_REASON` · `R5_PAGE_MISMATCH` · `R6_UNKNOWN_ELEMENT` · `R7_REVIEW_WITHOUT_EVIDENCE` · `R10_SIGNATURE_NOT_BOOL`
**Step 2:** `PYTHONPATH=src python -m pytest -q tests/test_evidence_check.py` → FAIL
**Step 3: implement**
```python
REASONS = {"NOT_PRESENT", "NOT_LOCATED", "PAGES_INCOMPLETE", "LOW_CONFIDENCE", "NO_ELEMENT"}

def check_evidence(payload: dict) -> list[dict]:
    """Pure: returns [{"code": "R3_...", "evidence_id": "X1", "detail": "..."}]. Never raises."""
```
- assembler: `metrics["evidence_violations"] = check_evidence(...)` (อยู่ใน `metrics` → ไม่กระทบ `integrity.payload_sha256`)
- env `AIVA_EVIDENCE_STRICT=1` → raise `ValueError` (ใช้ใน test/CI เท่านั้น)
**Step 4:** PASS + รัน replay ของ E0 อีกครั้ง → `recommendation` เหมือนเดิมทุกฉบับ, นับ violation ไว้ใน PR
**Step 5: commit** `feat(engine): evidence contract post-check (warn)`

---

### Task E2: Missing reason ที่ถูกต้อง (R3, R4, R6)

**Files:**
- Modify: `src/system_a/domain/contracts.py` (`Finding` l.327: + `missing_reason: Optional[str] = None`)
- Modify: `src/system_a/application/assembler.py` (loop l.127-145 → helper `_locate(f, els, doc)`)
- Test: `tests/test_evidence_locate.py`

**Step 1: failing test**
| กรณี | คาด |
|---|---|
| element มี bbox | อยู่ใน `bboxes` · ไม่อยู่ใน reason |
| element มี แต่ `bbox=None` และ `source_reference.null_reason == "NOT_PRESENT"` | reason `NOT_PRESENT` |
| element มี, มีค่า, ไม่มี bbox | `NOT_LOCATED` |
| `null_reason` = `LOW_CONFIDENCE` / `CONFLICT_BETWEEN_SOURCES` | `LOW_CONFIDENCE` |
| id ไม่อยู่ใน `els` | `NO_ELEMENT` · **ไม่อยู่ใน `related_element_ids`** (R6) |
| `f.element_ids=()` และ `f.missing_reason="PAGES_INCOMPLETE"` | reason `PAGES_INCOMPLETE`, `element_ids=[]` |
| `f.element_ids=()` และไม่มี `missing_reason` | `NOT_LOCATED` (ไม่ใช่ `None`) |
| ปนกัน (บาง id มี bbox) | `bboxes` + reason คู่กัน |

**Step 3: implement**
```python
def _locate(f, els, doc) -> tuple[list, list, Optional[dict]]:
    """-> (related_ids_existing, bboxes, bbox_missing_reason)"""
    # reason priority (หลายสาเหตุในแถวเดียว): PAGES_INCOMPLETE > NOT_PRESENT > LOW_CONFIDENCE > NOT_LOCATED > NO_ELEMENT
```
- `null_reason` ของ element อ่านจาก `els[eid]["source_reference"]["null_reason"]` (field/cell ใส่ไว้แล้วใน `build_elements`)
**Step 4:** PASS · `make test` · `--schema` (ยัง 3.0 ผ่าน เพราะ shape ไม่เปลี่ยน)
**Step 5: commit** `fix(engine): precise bbox_missing_reason; drop unknown element ids`

---

### Task E3: แยก finding ของ V-01 และ V-03 (R2)

**Files:**
- Modify: `src/system_a/domain/rules.py` (`v01_required` l.120, `v03_doc_totals` l.181)
- Test: `tests/test_v01_v03_split.py`
- Modify (repin): `tests/golden_legacy_integrity.json`

**V-01 — หน่วยของ finding**
```text
for k in required_fields   (not ok)  → 1 Finding: element_ids=(field.element_id,)
                                          message "ฟิลด์บังคับอ่านไม่ได้: {k} ({null_reason})"
                                          actual=k, expected="required"
for l in lines (มีเซลล์บังคับที่ไม่ ok) → 1 Finding: element_ids=(l.element_id, *cell ids ที่ไม่ ok)
                                          message "บรรทัดที่ {n} อ่านไม่ครบ: qty, uom"  actual="L{n}"
not d.lines                          → 1 Finding (missing_reason="NOT_PRESENT")
not d.pages_complete                 → 1 Finding (missing_reason="PAGES_INCOMPLETE")
geometry errors                      → 1 Finding ต่อบรรทัดที่ผิด (element_ids=(l.element_id,))
```
- **คง severity/branch เดิมทุกกรณี:** PO-only + Oracle confirmed → ทุก finding `Low` · geometry-only → `Medium` · ที่เหลือ → `c.std.severity("E01")`
- `_fail("V-01", findings)` เดิมยังใช้ได้ (คำนวณ worst เหมือนเดิม)

**V-03 — 1 finding ต่อการตรวจที่ผิด**
| การตรวจ | element_ids | actual / expected |
|---|---|---|
| `lines_vs_sub_total` | `sub_total` + row ids | `sub_total` / `sum(amount)` |
| `vat_7pct` | `vat` | `vat` / `sub×rate` |
| `sub_plus_vat_vs_grand` | `grand_total` (+`sub_total`,`vat`) | `grand` / `sub+vat` |
- E04 (เศษปัดในกรอบ) ใช้หลักเดียวกัน severity เดิม · `data.diffs` คงเดิม

**Step 1: test** — DMS-95-like (3 ยอด NOT_PRESENT + L7–L12 ไม่ครบ) → V-01 ได้ 9 finding · PO-only → ทุกตัว `Low` · V-03 ที่ผิดแค่ VAT → 1 finding ชี้ `vat`
**Step 4:** PASS · `make scenarios` ต้อง **row-by-row เหมือน E0** (status/codes) · `--golden` เปลี่ยนเพราะ evidence เพิ่ม → repin + บันทึกเหตุผลใน commit
**Step 5: commit** `feat(engine): V-01/V-03 evidence per field, line and check`

---

### Task E4: `ReviewPoint` — manual_review มีหลักฐาน (R7)

**Files:**
- Modify: `src/system_a/domain/contracts.py` (+ dataclass `ReviewPoint`, `RuleOutcome.reviews: tuple = ()`)
- Modify: `src/system_a/application/assembler.py` (emit reviews; `build_summary` l.329/435/437 กรอง `exception_code is not None`)
- Modify: `src/system_a/domain/rules.py` (V-04, V-05, V-07, V-08)
- **ไม่แก้:** `domain/recommendation.py` (อ่านเฉพาะ `findings`)
- Test: `tests/test_review_evidence.py`

```python
@dataclass(frozen=True)
class ReviewPoint:
    message_th: str
    element_ids: tuple = ()
    oracle_refs: tuple = ()
    actual: Optional[str] = None
    expected: Optional[str] = None
    missing_reason: Optional[str] = None
```

**ตำแหน่งที่ต้องเติม `reviews=`**
| Rule / branch | ReviewPoint | element_ids |
|---|---|---|
| V-04 not found (`not_found_result=manual_review`) | 1 | `invoice_num`, `supplier_tax_id` |
| V-04 `RCV-BY-NUM` | 1 | `invoice_num` · oracle_refs = ใบรับที่พบ |
| V-04 candidates ambiguous / PO-LIST ambiguous / row cap | 1 | `invoice_num` (+`po_number` สำหรับ PO-LIST) · row cap ใช้ `missing_reason="NOT_LOCATED"`, ids=() |
| V-05 ORG_ID unknown | 1 | `customer_tax_id` |
| V-05 AI ไม่มั่นใจชื่อ / ที่อยู่ | 1 | `customer_name` / `customer_address` |
| V-07 installment (mode `manual_review`) | 1 ต่อบรรทัดใน `installments` | `L{n}` row + `unit_price`, `qty` |
| V-07 `ai_rejected` | 1 ต่อ proposal ใน `match_trace["ai_rejected"]` | row ids ของบรรทัดที่อ้างใน proposal |
| V-08 line `manual_review` | 1 ต่อ `line_results[]` ที่เป็น manual_review | row + `qty` · actual=`qty` inv, expected=`qty_rcv_compared` |
| V-08 ไม่มี AI | 1 | ids=() · `missing_reason="NOT_LOCATED"` |

**assembler:** ภายใน rule ต่อจาก findings → evidence `{"result": "manual_review", "exception_code": None, "severity": None, ...}` · `ev_ids` รวมทั้งสองแบบ · **ไม่ append exceptions**

**Step 1: test**
- ทุก rule ที่ `result == "manual_review"` มี `evidence_ids` ไม่ว่าง
- `len(exceptions)` และ `recommendation` เท่ากับก่อนแก้ (ใช้ sandbox scenario ที่เป็น MR: S27, S46–S62 ที่เกี่ยว V-04)
- `summary.decision.exceptions` ไม่มี code `None`
**Step 4:** PASS · `make scenarios` เหมือน E0 · `--schema` จะ fail ที่ `severity: null` → แก้ใน E7 (ทำ E7 ส่วน schema ทันทีหลัง task นี้ หรือรวม commit)
**Step 5: commit** `feat(engine): review evidence for manual_review rules (no exception)`

---

### Task E5: ลายเซ็น — element ครบทุก slot (R10)

**Files:** `src/system_a/application/assembler.py` (l.73) · `src/system_a/domain/rules.py` (`v06_signatures` l.203) · `tests/test_v06_signature_detect.py` (เพิ่มเคส)

- `build_elements`: วน `("receiver", "deliverer")` เสมอ — slot ที่ไม่มี obs → element `bbox=None`, `raw_value=None`, `normalized_value=None`, `source_reference.null_reason="NOT_PRESENT"`
- V-06: ใส่ `element_ids=(f"{did}-sig-{slot}",)` **ทุกครั้ง** (ไม่ขึ้นกับ `has_box`) → E2 จะให้ reason `NOT_PRESENT`/`NOT_LOCATED` เอง
- คงกติกา v2.0: พบรอย = pass (ไม่ดู confidence) · ไม่พบ = E08 ชี้กล่อง · `data.signature_boxes` เดิม
- **Test:** slot หายทั้งคู่ → element 2 ตัว, E08 2 finding, ทั้งคู่มี reason · `normalized_value` เป็น `True/False/None` เท่านั้น
**Commit** `fix(engine): always emit both signature slot elements`

---

### Task E6: ค่าให้ banner (`actual` / `expected`)

**Files:** `src/system_a/domain/rules.py`

| Rule / code | actual | expected |
|---|---|---|
| V-01 field | ชื่อฟิลด์ + `null_reason` | `"required"` |
| V-01 line | `L{n}: qty, uom` | `"required"` |
| V-07 E13 | `L{n} {qty}×{price}={amount}` | `"ไม่พบบรรทัดใบรับ"` |
| V-07 E11 | ราคา/จำนวน invoice | ราคา/จำนวนใบรับ (`rcv_price`, `tot_q`) |
| V-06 E08 | `"empty"` / `"no box"` | `"signed"` |
- ห้ามเปลี่ยน `message_th` เดิมของ code ที่ไม่ได้แยก (เพื่อไม่ทำ golden ขยับเกินจำเป็น)
**Commit** `feat(engine): actual/expected for V-01, V-06, V-07`

---

### Task E7: Contract 3.1 (additive) + schema

**Files:**
- Modify: `src/system_a/application/assembler.py` (`SCHEMA_VERSION = "3.1"`; **`CONTRACT` คงเป็น `aiva.system_a.result/3.0`**)
- Create: `schemas/result-3.1.schema.json` (คัดจาก 3.0) · evidence:
  - `severity`: `{"enum": ["Low","Medium","High", null]}`
  - `exception_code`: `{"type": ["string","null"], "pattern": ...}`
  - `bbox_missing_reason`: `{"type": ["object","null"], "required": ["element_ids","reason"], "properties": {"reason": {"enum": [...R4]}}}`
  - optional: `field_name` (string|null), `line_no` (int|null), `kind` (`"exception" | "review"`)
- Modify: sandbox `--schema` ให้ชี้ 3.1
- เติม `field_name` / `line_no` / `kind` ใน assembler (ได้จาก element ตัวแรก)
**Gate:** Portal F1–F4 + F10 (รับ `kind`, `severity: null`, schema "3.1") ต้อง deploy ก่อน
**Commit** `feat(contract): schema 3.1 additive evidence fields`

---

### Task E8: Regression, release, tracker

```bash
cd engine
AIVA_EVIDENCE_STRICT=1 make test
make scenarios                         # เทียบ E0 row-by-row → diff ต้องว่าง (status/codes)
PYTHONPATH=src python -m system_a.sandbox.scenarios --schema
python tools/replay_results.py src ../frontend/temp/paperless_invoices_v5 temp/evidence-after/replay.json schemas/result-3.1.schema.json
```
**Acceptance**
| ตัวชี้วัด | เกณฑ์ |
|---|---|
| `recommendation`, `max_severity`, set ของ `exception_codes` ต่อเอกสาร | **เท่ากับ E0 ทุกฉบับ** |
| `metrics.evidence_violations` | 0 ทุกฉบับ |
| rule `manual_review` ที่ `evidence_ids` ว่าง | 0 |
| evidence ที่ `related_element_ids` > 12 | 0 (ยกเว้น V-08 E14 กลุ่มราคา — บันทึกเป็นข้อยกเว้น) |
| fixture: DMS-27, DMS-40, DMS-95, DMS-139 | ตรวจด้วยตาตาม checklist ใน Portal plan |

- `docs/RELEASE_NOTES.md`: หัวข้อ **Engine v5.7 — evidence per finding** (ตาราง: ส่วน / สิ่งที่แก้ / ไฟล์) + ผลตัวเลขข้างบน
- `docs/plans/task.md`: แถว E0–E8
- ส่งไฟล์ผลชุดใหม่ให้ Portal → `frontend/temp/paperless_invoices_v5_7/` แล้ว Portal รัน `backfill:findings` (F7)

---

## Order & dependencies
```text
E0 → E1 → E2 → E3 → E4 → E5 → E6 → [Portal F1–F4, F10 deployed] → E7 → E8
```
E1–E6 ยังส่ง `schema "3.0"` แต่ review evidence (E4) มี `severity: null` → Portal zod รับได้อยู่แล้ว (nullable) ส่วน JSON schema ฝั่ง engine ต้องแก้ใน E7 ก่อน release

## Decisions used (ค่าแนะนำ — แก้ได้)
1. V-01 บรรทัด = 1 evidence ต่อบรรทัด (ไม่ใช่ต่อเซลล์)
2. MR ใช้ `ReviewPoint` แยก — ไม่มี code, ไม่อยู่ใน `exceptions[]`, ไม่แตะ `recommend()`
3. `contract` id คง 3.0 · bump แค่ `versions.schema` 3.1
4. ไม่ทำตำแหน่งประมาณ (`approximate` / `page_hint`) ในรอบนี้
5. ฟิลด์ที่ไม่บังคับ (เช่น PO เมื่อ resolve ด้วย Tax ID) ไม่สร้าง evidence
