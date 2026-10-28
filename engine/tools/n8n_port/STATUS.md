# สถานะ n8n port — engine **v5.7** (schema 3.1)

update **2026-07-29 (รอบ 3)** • เจ้าของงานสั่ง publish แล้ว — **production รัน port ที่ตรงกับ engine v5.7**
• version ที่ active = `2532a1ff` = draft (ตรวจ content ของ active version จริง: jsCode node 21,
prompt 1.7.0, node 22, `prompt_classify` — **EQUAL ทุก field เทียบ byte กับ repo**)
• ช่องว่างที่ยังเหลือตามดีไซน์: V-07 AI matcher (M3–M5), adjudicate (R6-6), retry 300 DPI (R6-13) — ดู §4

> วิธีขึ้นของจริงคือ `harness/n8n_mcp_sync.py` (MCP `update_workflow` แบบ `setNodeParameter`) —
> **ไม่ต้องใช้ n8n REST API key และไม่ต้อง paste 276 KB** รายละเอียด §3
> ตัวเลขใน §2 ใช้ได้กับทั้งสอง version เพราะ active ↔ draft เคยเทียบกันแล้ว **เท่ากันทุก field ทั้ง 16 nodes**

> งานชุดก่อน (v5.5, sha `0a9446bd…`, exec 796, node 22/23) เคยบันทึกไว้ใน `n8n_nodes/STATUS.md`
> (16 KB) ซึ่ง **หายไปตอนย้ายโฟลเดอร์จาก `temp/n8n_port` มา `tools/n8n_port`** (ไฟล์ untracked ทั้งหมด
> จึงกู้จาก git ไม่ได้) ข้อเท็จจริงทางเทคนิคที่เหลืออยู่ถูกรวบรวมไว้ในเล่มนี้ + `docs/plans/task.md`
> ส่วนที่เก็บกลับมาได้บันทึกไว้ใน §6 บัญชีสิ่งที่ต้องตรวจซ้ำ

---

## 0. เทียบ engine วันนี้ (HEAD `d7cf2ba`) กับ canvas ที่รันอยู่

| หัวข้อ | canvas (v5.5) | repo (v5.7) | ผลถ้าไม่ sync |
|---|---|---|---|
| V-06 | `1.1` confidence + Oracle waive + `manual_review` | **`2.0`** นับลายมือชื่อ 2 ช่อง ไม่มี confidence ไม่มี waive | เอกสารที่ "ไม่เซ็นเลย" ยัง AUTO_PASS ทั้งที่ engine ให้ HOLD |
| รอยตราประทับ | gate ด้วย `min_confidence` | ตัด gate ออกแล้ว |ตราประทับที่ confidence ต่ำไม่ถูกนับ |
| evidence | 1 แถวต่อ rule | **1 แถวต่อ finding** + review rows + `bbox_missing_reason` | Portal เห็นหลักฐานไม่ตรงจริง |
| schema | `3.0` | **`3.1`** | frontend อ่าน field ใหม่ไม่ได้ |
| prompt extract | `1.6.0` | `1.7.0` | 1.7.0 สั่ง `signature: null` + `source.page` — JS เก่าไม่รู้เรื่อง → ยิ่งอันตรายถ้าอัปเดต prompt เดี่ยว ๆ |

---

## 1. ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | หน้าที่ |
|---|---|
| `build.mjs` | รวม `src_*.js` → `dist/bundle.cjs` แล้วรัน `runPort()` จริงกับ fixture เพื่อดึง `PARITY_EXPECTED` (ห้าม hardcode sha — บทเรียน 18 ต.ค.) |
| `build_n8n_inline.mjs` | ผูก port + `standard.json` + fixture → `dist/node21_inline.js` ก้อนเดียวจบ (paste ลง Code node ได้) **มี guard: engine ใหม่กว่า fixture เมื่อไหร่ = refuse to build** |
| `src_*.js` | คำแปลจาก Python ทีละไฟล์ ตรงกับ `src/system_a/**` (V-06 อยู่ `src_rules.js`, evidence/assembler อยู่ `src_assemble.js`) |
| `standard.json` | `Standard v6.6` ที่ generate จาก `config/standards/v6.6/` อย่าแก้เอง — รัน `harness/dump_standard.py` |
| `n8n_nodes/22_v57.js` | node 22 เวอร์ชันแสดง review rows (เพิ่ม key ไม่ลบ key เดิม) |
| `harness/py_full.py` | รัน engine จริงเต็ม pipeline → payload + sha |
| `harness/js_full.mjs` | รัน bundle ฝั่ง JS จาก input เดียวกัน |
| `harness/parity.py` | **ตัวตรวจหลัก**: 5 เคส ต้อง sha เท่ากัน byte-for-byte + validate schema 3.1 + exit code |
| `harness/make_v06_fixtures.py` | สร้าง fixture เคส V-06 (empty / nosig / stamp) จาก `temp/sigtest/` |
| `harness/test_rule_text_parity.py` | ข้อความไทยทุกข้อความที่ engine พิมพ์ได้ ต้องอยู่ใน JS แบบ byte-exact |
| `harness/verdict_delta.py` | ตอบคําถาม "publish แล้ว HOLD เพิ่มกี่ฉบับ" โดย replay corpus 125 ฉบับ (ตรวจว่า mapping คำนวณผลเดิมได้ 125/125 ก่อน) |
| `harness/live_parity.py` | เอา extraction จาก execution จริงของ n8n ไปให้ engine ตัดสิน แล้วเทียบ payload ทั้งก้อน |
| `harness/test_tail_v57.mjs` | node 22 + node 23 อ่าน payload v5.7 ได้จริง (review rows, rule_version 2.0, sha ไม่เพี้ยน) |
| `harness/n8n_sync.py` | upsert เข้า n8n พร้อม backup + อ่านกลับมาเทียบ (see §3) |

---

## 2. ทุกครั้งที่แก้ engine ให้รันชุดนี้ (เรียงตามนี้)

```bash
cd engine/tools/n8n_port
python harness/dump_standard.py            # config/standards/v6.6 → standard.json
node build.mjs && node build_n8n_inline.mjs
python harness/py_full.py fixtures/payload_py_exec357.json exec357   # re-pin reference payload
python harness/py_full.py fixtures/payload_py_2.json DMS-15
python harness/make_v06_fixtures.py        # ถ้าแตะ V-06
node build_n8n_inline.mjs                  # build อีกรอบให้ PARITY_EXPECTED ใหม่ติดไปจริง
python harness/parity.py                   # ต้อง "5/5 cases identical to the engine"
python harness/test_rule_text_parity.py    # ต้อง "0 missing"
node harness/test_tail_v57.mjs             # ต้อง "tail nodes handle the v5.7 payload"
node harness/test_inline.mjs               # inline ก้อนที่จะวางลง node 21 ให้ผลเท่า engine
```

parity ปัจจุบัน (`PARITY: OK`, exit 0):

```
PASS exec357 / DMS-23   MANUAL_REVIEW  sha=True   receipt not found -> V-04 review row
PASS DMS-15             AUTO_PASS      sha=True   po_number NOT_PRESENT reason
PASS V-06 empty         HOLD           sha=True   E08 High + Medium, signature_boxes, missing_slots
PASS V-06 nosig         HOLD           sha=True   synthetic slot elements + NOT_PRESENT
PASS V-06 stamp         HOLD           sha=True   stamp clears deliverer -> E08 High only
schema 3.1 (port payload): 0 errors
```

sha ที่ canvas ต้องทำได้หลัง sync: `exec357 = 98b53036badbd62c…` (MANUAL_REVIEW),
`DMS-15 = 1a533924c85c08b5…` (AUTO_PASS) — ค่าจริงอ่านจาก `fixtures/payload_py_*.json` เสมอ

---

## 3. ship เข้า n8n ผ่าน MCP (ไม่ต้องมี API key, ไม่ต้อง copy-paste 272 KB)

`update_workflow` ของ MCP server รับ operation objects ({`type:"setNodeParameter"`, `nodeName`,
`path:"/jsCode"`, `value`}) เราจึงเรียก JSON-RPC เดียวกับที่ agent ใช้จาก python และให้สคริปต์อ่าน bytes
จาก disk ตรง ๆ (`harness/mcp_client.py`ยาย url + bearer จาก `~/.pi/agent/mcp.json` ไม่ต้องใส่เพิ่ม)

```bash
cd engine/tools/n8n_port
python harness/n8n_mcp_sync.py --status   # ดู versionId (draft) vs activeVersionId (production)
python harness/n8n_mcp_sync.py --check   # อ่าน canvas จริงมาเทียบ ไม่เขียนอะไร
python harness/n8n_mcp_sync.py           # backup → update_workflow → GET กลับมาเทียบ byte-for-byte
python harness/n8n_mcp_sync.py --publish # ถ้าจะให้ production ใช้ version ใหม่ด้วย
```

ลำดับการเขียน **ไม่ใช่ลำดับตัวอักษร**: node 21 ถูกเขียนก่อนเสมอและเขียนก้อนเดียว
เพราะ **prompt 1.7.0 + JS เก่า (v5.5) คือคู่ที่อันตราย** (JS เก่าอ่าน field ที่ 1.7.0 ไม่ส่งมา
เป็น "unsure" → waive → AUTO_PASS บนเอกสารที่ไม่ได้เซ็น) ส่วน JS ใหม่ + prompt เก่ามีแค่ quality ต่ำลง

rollback ได้ 2 ทาง: `live/backup_<wf>_version-<versionId>.json` (สคริปต์เขียนให้ก่อนแก้ทุกครั้ง)
หรือ version history ของ n8n เอง (`get_workflow_history` + `restore_workflow_version`) —
ใช้ MCP `--only "<node name>"` ย้อนเป็นราย node ได้

ของที่ต้องรู้: gateway ตอบ `429 Too many requests` ถ้ายิง poll ถี่ ๆ — `mcp_client.py` backoff ให้แล้ว
แต่อย่า poll execution ทุก 2 วินาที

---

## 4. สิ่งที่ port นี้ยัง "ทำได้ไม่เท่า engine" (ห้ามลืมตอนอ่านผล)

1. **R6-6 adjudicate** — ไม่มีใน flow (จะยิงซ้ำเฉพาะเคสที่ adjudicator เรียก)
   ตอนนี้ `runAdjudicate()` ยิง `PortPending` ให้ fail ตามเดิม
2. **R6-13 300 DPI retry เฉพาะ tax id** — ยังไม่ port
3. **AI matcher V-07 (M3–M5), V-05 entity AI, V-08 AI mode** —
   `runAiMatcher()` จะ throw `PortPending` ให้ review fall-through เหมือน flow เดิม
   ผลลัพธ์จึงต่าง engine ตอนที่ match แบบ fuzzy/synonym/fuzzy_total เท่านั้น
4. **classify ส่งภาพทีละ 1 ภาพ** เพราะ AI Gateway ไม่รับเกิน 1 image/request (ไม่ใช่พฤติกรรม engine)
5. ความลับยังอยู่ใน node แบบ plaintext: `llm_key`, `paperless_token` (`00 CONFIG`) และ `oracleToken`
   (node 21 SECTION A) — ควรย้ายเข้า n8n Credentials ก่อนแจก flow ให้ทีมอื่น

---

## 5. หลัง sync แล้วให้ตรวจ (บทเรียน 19 ต.ค.: "upsert แล้วไม่ได้แปลว่าได้")

1. `n8n_sync.py` ต้องพิมพ์ `SYNC VERIFIED` (มัน GET กลับมาเทียบเอง อย่าเชื่อ flag ที่ send response)
2. รัน workflow 1 ครั้งด้วย doc ที่รู้ว่าผลควรเป็นอะไร แล้วดู node 21: `parity_ok` ต้อง true
3. เทียบ `payload_sha256` กับ `python harness/py_full.py fixtures/<case>.json <case>` ให้ตรงกัน
4. ดู node 22: `verdict`, `halted_by`, `exception_codes`, `review_points` (v5.7 เพิ่ม review rows)
5. parent `soWzNNLrZ1c4Absf` node 23: payload schema `3.1` อยู่ระดับบนสุด + `verification.rules` ครบ 9
   (key `evidence[]`, `summary.review_points` ไหลเข้า API โดยอัตโนมัติ เพราะ node 23 spread payload)

---

## 6. สิ่งที่หายไปพร้อมโฟลเดอร์เก่า + ข้อควรระวังที่เก็บกลับมาได้

ไฟล์ที่หาย (ทุกไฟล์เป็น snapshot ของ canvas จึงดึงใหม่จาก n8n ได้เสมอ — `live/blackbox_*.json` มี jsCode
ของ node 21/22 ครบ): `STATUS.md` (v5.5), `node21_jscode.txt`, `node21_jscode_actual.txt`,
`node21_jscode_from_mcp.json`, `node21_paste.txt`, `node22_report_v4.js`, `node23_response_v2.js`

บทเรียนที่ยังใช้ได้อยู่ (จากบันทึกเดิม exec 796):
1. **อย่าเชื่อ flag ที่ send response เขียนขึ้นเอง** — `upsert: true` เคยหมายถึง "ส่งสำเร็จ" ไม่ใช่ "canvas
   ได้ไฟล์ใหม่" ต้อง GET/inspect กลับมาเทียบ byte-for-byte (n8n_sync.py ทำขั้นตอนนี้ให้แล้ว)
2. **sha ในไฟล์ห้าม hardcode** — บทเรียนรอบ v5.5: `PARITY_EXPECTED` เคยเป็นค่าคงที่ `0a9446bd…`
   แล้ว engine ขยับ → ERROR ตอน build ตอนนี้ build script อ่านจาก `fixtures/payload_py_*.json`
3. **build แล้วต้องดู exit code + ไฟล์จริง** — `npx esbuild` เคย failเงียบ ทำให้ bundle เท่าเดิม
   (ตอนนี้ `build.mjs` เช็ค `child status != 0` แล้ว fail ทันที)
4. **engine validate payload ด้วย schema ก่อนเสมอ** — port ฝั่ง JS validate ผ่าน `schema_v31.json`
   ใน harness ถ้า validate fail = ห้าม sync

---

## 7. ผลรันจริงบน canvas หลัง sync (exec 449, manual mode, doc 89) และตัวเลขที่ต้องใช้ตัดสินใจ

`execute_workflow(mode=manual)` รัน **draft** (ไม่กระทบ production) → `status=success`, 22.2 s, Oracle 1 query

| | node 22 รายงาน |
|---|---|
| verdict | **HOLD** · max_severity High · codes `E01, E13` · `review_points` แสดงผลได้ · cards 9 missing 0 |
| versions | `schema 3.1`, `ruleset v6.6-r4`, **V-06 rule_version = 2.0** (ยืนยันว่า logic ใหม่ทำงานจริง ไม่ใช่ของเก่า) |
| evidence | 2 แถว `kind=exception` พร้อม `actual_value`/`expected_value`/`document_id` (V-01 แตกเป็นรายฟิลด์: `L1: qty(NOT_PRESENT), uom(NOT_PRESENT), unit_price(NOT_PRESENT)`) |
| sha | `sha256:26dc579052f0e343…` |

**เทียบกับ engine จริงบน doc เดียวกัน** (`python scripts/run_single_pass.py --doc-ids 89 --validate`):

| | engine | canvas |
|---|---|---|
| V-07 | fail **E11 Medium** — match ระดับ **M4 `source:"ai"`** confidence 0.85 | fail **E13 High** — `UNMATCHED/NONE source:"logic"` |
| V-08 | pass (evaluated) | **not_evaluated** (โดน halt เพราะ E13 High) |
| verdict | **REVIEW** | **HOLD** |
| rules อื่น | V-01 E01, V-02 n/a, V-03/V-04/V-05/V-06/V-09 pass — **ตรงกับ canvas ทุกข้อ** | |

ต่างกัน **ที่เดียว** = V-07 ต้องใช้ AI matcher (M3–M5) ซึ่ง port นี้ throw `PortPending` — เป็นช่องว่าง
ข้อ 3 ใน §4 ไม่ใช่บั๊กการแปล และทิศทางคือ **flow เข้มกว่า engine** (ไม่ปล่อยผ่านเงียบ)

ผล 47/125 ฉบับที่ engine ต้องอาศัย AI matcher ในการ match บรรทัด (`logic/M1 70 · ai/M3 11 · ai/M4 10 ·
ai/M1,M4 7 · ai/M5 5 …`) — **แต่มันไม่ใช่ delta ของการ publish** เพราะ canvas ตัวที่ production รันอยู่
(v5.5) ก็ไม่มี AI matcher เหมือนกัน (ตรวจจาก bundle จริง: ทั้งสองก้อน `v07LineMatch` มี code เดียวกัน
`E10/E13` และไม่มี AI call ทั้งคู่ `runAiMatcher` = 0 ในทั้งสองไฟล์) ⇒ canvas เก่าก็ให้ผลเข้มกว่า engine
บน doc กลุ่มนั้นอยู่แล้ว publish จึงไม่เปลี่ยนอะไรในจุดนี้
• **delta จริงของการ publish คือ V-06 เท่านั้น** — วัดด้วย `harness/verdict_delta.py` (ดู §8)

**ทางเลือกของเจ้าของงาน**
1. `publish` ตอนนี้ → ได้กติกา v5.7 ครบ ผลกระทบจริง = **18/125 ฉบับเปลี่ยนคำตัดสิน เข้า HOLD เพิ่ม 6 ฉบับ**
   (ทั้งหมดมาจาก V-06 v2.0 ข้อเดียวดู §8)
2. ปิดช่องว่าง V-07 AI matcher ก่อน (เพิ่ม VLM call ใน flow + port `v07_match` ระดับ M3–M5 = งาน scope C) แล้วค่อย publish
3. ยืน v5.5 ที่ production ต่อไป (draft พร้อมใช้เมื่อไหร่ก็ `publish` ได้ทันที)

หลัง publish ต้องตรวจว่า **content ของ version ที่ active จริง** เท่ากับ repo ไม่ใช่ดูแค่ flag:
`get_workflow_version(activeVersionId)` แล้วเทียบ jsCode/prompt กับ repo (ทำแล้ว 29 ก.ค.: EQUAL 4/4)

---

## 8. delta จริงของการ publish (วัดบน corpus 125 ฉบับด้วย `harness/verdict_delta.py`)

คำถามที่ถูก: "publish แล้ว HOLD จะเยอะขึ้นแค่ไหนกันแน่" — วิธีวัดคือเอาผล v5.5 ที่เก็บไว้ต่อ doc
มาคํานวณซ้ํา โดยเปลี่ยนเฉพาะ V-06 เป็นกติกา v2.0 แล้วตัดสินซ้ําด้วย logic เดียวกับ engine
(สคริปต์ **บังคับตรวจก่อนว่า mapping คํานวณผลเดิมได้ครบ 125/125** ค่อยอนุญาตให้พยากรณ์)

```
mapping check: reproduces the stored verdict for 125/125 documents

old (v5.5 canvas)  ->  new      AUTO_PASS   REVIEW    HOLD   MANUAL_REVIEW
  AUTO_PASS (51)                     49         2
  REVIEW    (23)                                 23
  HOLD      (12)                                            12
  MANUAL_REVIEW (39)                   1          9      6          23

verdict changes: 18/125  (into HOLD: 6, out of HOLD: 0)
```

สรุป: **HOLD 12 → 18 (+6 ฉบับ = +4.8% ของ 125)**, AUTO_PASS 51 → 49 (ตกเป็น REVIEW เพราะช่องเซ็นต์ว่าง),
MANUAL_REVIEW 39 → 23 (ย้ายเป็น REVIEW 9, HOLD 6, ดีขึ้น 2) — ต้นเหตุ **ข้อเดียวคือ V-06 v1.1 → v2.0**
(ถอด Oracle waive + ตัดสถานะ "unclear/ไม่มั่นใจ" ที่เคยทำให้เป็น manual_review + ช่องว่าง = E08)
ไม่ใช่ prompt 1.7.0, ไม่ใช่ evidence-per-finding, ไม่ใช่ schema 3.1 และไม่ใช่ AI matcher (ดู §7)

ข้อจำกัดของตัวเลขนี้ (บอกล่วงหน้า): corpus เก็บ extraction แบบ trimmed ไม่มี `regions`
จึงนับ stamp fallback ของ v5.6 ไม่ได้ ซึ่ง fallback มีแต่ทำให้ "พลาด → ผ่าน" ⇒ **6 ฉบับคือเพดานบน**
ของเลขที่จะเยอะขึ้น และ prompt 1.7.0 ยังไม่ถูกจับในการคำนวณนี้ (มันเปลี่ยน extraction ไม่ใช่ rule)

---

## 9. ชั้น AI ถูก port แล้ว + เกทใหม่ "12 เอกสารจริง = engine เป๊ะ" (29 ก.ค.)

**สถานะ: `RECORDED-CORPUS PARITY: OK` — 12/12 เอกสารจริงให้ `payload_sha256` เท่า engine v5.7 ทุกตัวอักษร**
รวม V-07 M3–M5 (AI matcher), V-05 entity judge, guardrail, `metrics.ai` — และ `node harness/test_node21_rec.mjs`
ยืนยันว่า **โค้ดจริงของ node 21** (`dist/node21_inline.js` รวม glue) ทำได้เหมือนกันบน 5 เอกสาร (100/104/101/116/107)
โดยไม่มี call ออกเน็ตเลย (`httpRequest` ถูก stub ให้ throw ถ้ายิง)

### ทำไมต้องวัดด้วย tape
engine รันซ้ำไม่ได้ (VLM ไม่ deterministik + Oracle เปลี่ยนตามเวลา — หลักฐาน: DMS-117 ที่ต.ค. ให้ HOLD
วันนี้ให้ AUTO_PASS เพราะ Oracle มีข้อมูลใหม่) `harness/engine_replay.py` จึง replay ทั้ง Oracle และ LLM
จาก tape และ **ต้องทำ sha เดิมได้ก่อน** (DETERMINISM OK 12/12) ถึงจะใช้เทียบ port ได้

### tape key ที่สองภาษาต้องตรงกัน
`src_ai.js::aiRequestKey` (JS ตัวจริงที่อยู่ใน node) กับ `harness/tape_key.py` (python) ให้ string เดียวกัน
บน 41 calls ที่บันทึก — **ไม่มี hash** (ใช้ `len:<n>`), ไม่มี `0.0` vs `0` (format `%g`/`Number()`)
ถ้า port ยิง request ต่างจาก engine แม้แตตัวเดียว → tape ไม่ match → เทสต์ fail พร้อม body เทียบสองข้าง

### เกทที่รันก่อนแตะ canvas (ทุกตัวต้อง PASS)
```bash
node build.mjs && node build_n8n_inline.mjs
python harness/dump_standard.py --check          # standard.json + prompt 3 ตัว ไม่ drift จาก config/
node harness/test_inline.mjs                     # fixture exec357 + DMS-15 ยังให้ sha เดิม
node harness/test_decimal.mjs                    # dDiv เทียบ python Decimal 23 เคส
node harness/test_node21_rec.mjs                 # โค้ด node 21 จริง = engine บน 5 doc (มี AI)
node harness/test_tail_v57.mjs && node harness/test_blackbox_offline.mjs   && node harness/test_node12_offline.mjs && node harness/test_loop_nodes.mjs && node harness/test_01c_shape.mjs
python harness/test_rule_text_parity.py          # 177 ข้อความไทย byte-exact
python harness/check_calls.py                     # F()/RV()/FAIL() ห้ามส่ง opts เกิน 1 object
python harness/engine_replay.py && python harness/parity_rec.py
```

### bug จริง 5 ตัวที่ corpus นี้หาเจอ (fixture เดิม 5 ตัวหาไม่เห็น) — ตัวที่ 1 กระทบ production ตอนนี้
1. **`dDiv` คิด scale ผิด**: `k = 10^(dec + b.s)` แล้วหารด้วย `b.v` เฉย ๆ ลืม `10^a.s` ของตัวตั้ง
   ⇒ `75000.00 / 250000.00 = 30.000` แทน `0.300` จุดที่เรียกใช้: `corroborateArithmetic` (qty ลับจาก
   amount/price), `priceCheck` (กรอบ % ของ E09!), `corroborateLines` (qty จากใบรับ), `installment.receipt_fraction`
   ⇒ เป็นเหตุให้ DMS-102/116/117 ต่างจาก engine และ **flow ที่ publish อยู่ตอนนี้ก็มี bug เดียวกัน**
2. `v01Required` เขียนทับ `const miss` → TypeError ทุก doc ที่มีแถว bbox ชนกัน (DMS-26/52 crash)
3. Oracle `fingerprint` hash ด้วย `json.dumps` ที่ `ensure_ascii=True` (U+00A0 → ` `) แต่ `canonicalJson`
   ของ port ไม่ escape → sha ต่างทั้งที่ข้อมูลเท่ากัน → เพิ่ม `canonicalJsonAscii`
4. `F(c, ..., {sev}, {element_ids})` — JS รับ args ตัวเดียว object ตัวที่สองถูกทิ้งเงียบ ๆ → E12 installment
   ไม่มี element_ids → Portal ไม่มีปุ่ม bbox (กันไว้ด้วย `check_calls.py`)
5. `installment` เรียก `dStr()` บน string ของ Oracle row → crash `reading 'toString'`

### ไฟล์ใหม่ / ที่ต้องรู้
`src_ai.js` (client + 3 services + `pyJson` แบบ python + `aiRequestKey`) · `standard.json` มี `prompts`
(v07_match/v05_entity/v08_qty, `dump_standard.py` เขียน, เทียบกับ system message บน tape แล้วตรง 14/14) ·
node 21 SECTION A เพิ่ม `aiEnabled`/`aiTimeoutMs` และ **`versions.models` ส่ง 4 key เหมือน container แล้ว**
(เดิมส่ง `{ocr, line_matcher, qty_judge}` — เป็นเหตุผลเชิงโครงสร้างที่ sha จะไม่มีทางเท่า engine) ·
`resolve()`/`v05Customer`/`v08Quantity` เป็น async · `AIServiceError` → rule `not_evaluated` +
`system_errors[{code:"AI_SERVICE_ERROR"}]` เหมือน `_run` ของ python (ไม่ crash ไม่ pass) · node size 276 KB → **308 KB**


---

## 10. A2: classify กลับมาเป็น "ยิงทีเดียวทุกหน้า" เหมือน engine (โค้ด + เทส offline เรียบร้อย, ยังไม่ push)

ไฟล์ใหม่ใน `tools/n8n_port/n8n_nodes_v58/` (ยังไม่แตะ canvas): `03_classify_multimage.js` (1 request ทุกหน้า,
ข้อความ byte-identical กับ `single_pass.py:993`, `max_tokens=160N+400`, เรียง image ก่อน text),
`05_parse_classify.js` (รับ 1 answer ครอบคลุมทุกหน้า + เปลี่ยนกติกาเลขหน้า/ประเภท/สถานะเป็น `||` แบบ python `or`
+ `normKey` คงอักษรไทย), `08_extract_request.js` (เติม newline ท้าย prompt_extract เพราะค่าใน node 00 ถูก trim
สั้นกว่าไฟล์ 1 ตัวอักษร — นี่คือสาเหตุที่ text_len ฝั่ง flow 9,619 ส่วน engine 9,620)

`node harness/test_request_shape.mjs 116` → body ของ node 03/08 ตรง tape ทุกข้อที่เทียบได้ (ข้อความเท่ากันเป๊ะ)
`node harness/test_classify_select.mjs` → node 05 ตรง python 11/14 เคส ที่เหลือ 3 เคสคือ gap "ไม่มีหน้า invoice" (ดู `live/GAP_v5.7_vs_live.md`)

**แก้ bug เชิงระบบ**: normalize ทั้งหมดของ port ตัดอักษรไทยทิ้ง (`[^A-Z0-9]`) ทั้งที่ python ใช้ `isalnum()` ซึ่งคงไว้
→ เปลี่ยนเป็น `[^\p{L}\p{N}]/gu` ครบ 6 จุด และ node 05 ด้วย (กันไว้แล้วโดยเทสเคส "thai digits + thai marker")


---

## 11. A/B บน canvas จริง (draft เท่านั้น) — exec 450-453 + bug ที่ทำให้ flow พังจริง (29 ก.ค.)

Draft เดินมาถึง `4de2ad29` ส่วน **production ยังเป็น `2532a1ff` เหมือนเดิม** (ยังไม่ได้ publish)
สิ่งที่ push ลง draft แล้ว (read-back แบบ byte ต่อ byte ทุก node): `21 Validate (port)` (AI + dDiv + zip),
`00 CONFIG` (prompt 1.7.0/1.3.0), `03/05/08` (classify multi-image + newline), `22` (report v5.7)

### ผลรันจริง (manual trigger, doc_id เปลี่ยนชั่วคราวแล้ว revert กลับ 89 แล้ว)
| exec | doc | ผล | classify calls | oracle | AI | หมายเหตุ |
|---|---|---|---|---|---|---|
| 450 | 116 | *error* → เจอ ghost-row bug (แก้แล้ว) | 1 | – | – | prompt_chars 1867 = engine, max_tokens 1200 = engine |
| 451 | 116 | success 45 วิ HOLD | **1 (จากเดิม 5)** | 0 | 0 (rule ไม่ขอ) | |
| 452 | 104 | success **AUTO_PASS** | 1 | 1 | 0 (V-08 ใช้ logic mode) | `versions.models` = 4 key เหมือน engine |
| 453 | 117 | success HOLD | 1 | 0 | 0 | |

`ai_calls=0` ไม่ใช่ transport ตาย — `node harness/js_exec.mjs live/ab_exec_452.json --ai-probe` แสดงว่า
rule **ไม่ขอเรียก AI** จริงในรอบนี้ (OCR รอบนี้ชื่อ/จำนวนตรง deterministic) ส่วนเส้นทาง AI ยังพิสูจน์ได้อยู่
ด้วย `test_node21_rec.mjs` (ai=1..2 ผ่านโค้ด node จริง)

### bug ที่ 6: ghost row ทำให้ node 21 **crash** (flow ที่ publish อยู่พังกับเอกสารลักษณะนี้)
`collapse_ghost_rows` / `collapse_repeated_copies` พับ `doc.lines` ให้สั้นลง (orchestrator.py:65-66)
python จึงเขียน `for rl, nl in zip(ext.lines, doc.lines)` (assembler.py:67) แต่ port วน `ext.lines.length`
→ `TypeError: Cannot read properties of undefined (reading 'element_id')` บรรทัด 4492 ของ node
เอกสารที่ OCR แล้วมีบรรทัดอธิบายต่อท้าย (ไม่มี qty/price/amount) จะโดนทุกคน — 12 ฉบับใน tape ไม่มีบรรทัดแบบ
นี้จึงไม่เคยเจอ; doc 116 ที่ OCR ใหม่เจอทันที **แก้เป็น zip เหมือน python + rebuild + push draft แล้ว**
(บรรทัดที่ถูกพับจะไม่ได้รับ element เหมือน python เป๊ะ)

### เกทใหม่: `python harness/test_live_exec.py` = engine vs port บน OCR ที่ *flow* สแกนเอง (ไม่ได้ record)
```
liveb_exec_450.json OK sha256:7bc15357... vs sha256:7bc15357...
liveb_exec_451.json OK ...   liveb_exec_452.json OK ...   liveb_exec_453.json OK ...
LIVE-EXTRACTION PARITY: OK
```
วิธีทำงาน: `harness/js_exec.mjs` อ่าน execution ที่ save ไว้ (output จริงของ node 05/08/10 + CONFIG) ->
buildExtraction แบบเดียวกับ node -> รัน port ฝั่ง JS และ `harness/py_full.py` รัน engine ด้วย extraction
*เดียวกัน* + Oracle stub "No rows selected" ทั้งสองฝั่ง + AI ปิดทั้งสองฝั่ง -> sha ต้องตรงกัน (4/4 ตรง)
ไฟล์ `live/`+`fixtures/` เป็นข้อมูลจริง = gitignored; `harness/js_exec.mjs` ยังใช้เป็น debug entry ได้
(`--dump-extraction`, `--tape`, `--out`, `--ai-probe`)

### สิ่งที่ยังไม่ทำ (รอเจ้าของ)
publish draft `4de2ad29` -> production (rollback = `restore_workflow_version` ไป `2532a1ff`), gap "ไม่มีหน้า
invoice" (ต้องเพิ่ม IF node), D2 JPEG q90, D3 R6-13 300 DPI, D4 R6-6 adjudicate


---

## 12. PUBLISHED แล้ว: production = `4de2ad29` (29 ก.ค.) — engine v5.7 + rule AI + classify multi-image

`publish_workflow` สำเร็จ: `activeVersionId = 4de2ad29-0e19-4043-81aa-120c240a7a02` (ของเดิม `2532a1ff`)
**rollback**: `restore_workflow_version` ไป `2532a1ff` — หรือใช้ `live/PUBLISHED_2532a1ff.json` / `live/backup_...0257c569...json`

### ยืนยันว่า "ที่รันอยู่" = repo (`python harness/verify_published.py`)
```
21 Validate (port)      314319 B  equal except the generated BUILD stamp
03 / 05 / 08 / 22                 BYTE-EQUAL
CONFIG prompt_classify   1807 B   file verbatim
CONFIG prompt_extract    9627 B   file minus trailing newline (node restores it)
RUNNING VERSION == REPO
```
(`harness/verify_published.py` เทียบ byte ทั้ง node + prompt; อนุโลมเฉพาะบรรทัด BUILD stamp ที่เปลี่ยนทุกครั้งที่ build)

### รันหลัง publish (exec 454, doc 89): **success**
```
recommendation=REVIEW  oracle=1  ai_calls=1 (16.2 s)  ai_enabled=true
classify calls=1 (4 หน้า · เดิม 4 calls)  selected=[1]
V-01=fail V-03=pass V-04=pass V-05=pass V-06=pass V-07=pass V-08=pass V-09=pass V-02=not_evaluated
node 22 ok=true
```
ชั้น AI ทำงานบน production จริง (1 call / 16 วิ ต่อ 1 เอกสาร)

### เกทสะสม ณ จุดนี้ (ทุกตัวเขียว)
`test_inline · test_decimal · test_tail_v57 · test_blackbox_offline · test_node12_offline · test_loop_nodes ·
test_01c_shape · test_node21_rec · test_request_shape · test_classify_select` = 10 PASS
`parity_rec.py` 12/12 · `engine_replay.py` DETERMINISM OK · rule-text 177/177 · arity 0 ·
**`test_live_exec.py` = 5/5** (OCR ที่ flow สแกนเอง: exec 450-454 python กับ port ให้ sha เดียวกัน)

### เหลือต่อ (งานใหม่ ไม่ใช่ blocker ของ production)
gap "ไม่มีหน้า invoice" (ต้องเพิ่ม IF node) · D2 extract เป็น JPEG q90 แทน PNG · D3 R6-13 re-read 300 DPI ·
D4 R6-6 adjudicate · A2 ฝั่ง node 02 (JPEG quality 70 ของ engine vs ที่ pdfConvert ตั้งไว้)

---

## 13. v5.8 (27 ต.ค.): ปิด gap ที่เหลือของชั้น decision + branch "ไม่มีหน้า invoice" — อยู่บน **draft เท่านั้น**

production ยังเป็น `4de2ad29` (v5.7) ตามเดิม; draft ปัจจุบัน `128fb6f2` = repo = v5.8
(version id ของ draft เปลี่ยนทุกครั้งที่เขียน canvas — อ่านค่าจริงด้วย `verify_published.py` เสมอ)
ยืนยันด้วย `python harness/verify_published.py` (ตัวใหม่ fetch version ที่ *รันอยู่* ด้วย `get_workflow_version`
เพราะ `get_workflow_details` คืนกราฟของ **draft** →เทียบแล้วจะฟ้อง PASS หลอก แบบที่เคยเกิดตอนเขียน tool นี้)

```
draft    : 21 · 03 · 05 · 08 · 10 · 22 BYTE-EQUAL + node 02 format=jpeg quality=70 + สาย 05→05b→(06|21)  = RUNNING VERSION == REPO
published: != REPO — publish จะเปลี่ยน 6 node [02, 03, 05, 10, 21] + node ใหม่ 05b
```

### 13.1 สิ่งที่แก้ (ทุกข้ออ้างอิงโค้ด engine จริง)

| # | gap เดิม | v5.8 | อ้างอิง |
|---|---|---|---|
| 1 | node 05 **เดาหน้า 1** เมื่อ classify ไม่เจอหน้า invoice → flow อ่านเอกสารผิดแล้วอาจ "ผ่าน" | IF node `05b` แยกสาย: ไม่มีหน้า invoice → ไม่อ่าน PDF เลย → node 21 สร้าง extraction 0 หน้า → E01/REVIEW | `single_pass.py` (select=[] , `pages_complete=false`) |
| 2 | parse answer แบบ slice `{..` ถึง `..}` + JSON.parse → answer ตก/ตัดกลาง = หายทั้งหน้า | `lib_answer_decode.js` = strict `extract_json_object` → `salvage_json_object` (SALVAGE_CUTS=60) inline ใน node 05 + 10 พร้อม `answer_salvaged` → page error `TRUNCATED_JSON_SALVAGED` | `litellm_client.py` |
| 3 | ทิ้ง row region เมื่อ `line_bbox` ใช้ไม่ได้ | union-of-cells (median outlier + table bbox splice) แล้ว validate ก่อนใช้ → `row_boxes_from_cells` | `single_pass.py::_box/validate_line_bbox` + `coords.py::xyxy_px` |
| 4 | ไม่ตรวจค่าที่มาแบบไม่มี box | `NO_GEOMETRY` → `pages_complete=false` + page error | เดียวกัน |
| 5 | node 02 ส่ง PNG แต่ node 03 แจ้ง `image/jpeg` | node 02 เป็น JPEG q70 จริง (label ตรงความจริง + token ลงตาม engine) | `_data_url(quality=70)` |
| 6 | AI call ช้า → **platform ฆ่า Code node ทั้งงาน** (exec 456: "the task runner was taking too long") เสียเอกสารทั้งฉบับ | `aiTimeoutMs` 180000 → **40000** ให้ timeout ตกที่ error path ของ port เอง (rule not_evaluated + `system_errors[AI_SERVICE_ERROR]` → MANUAL_REVIEW) ไม่เสีย run และไม่ "ผ่าน" | error handling ของ engine |

### 13.2 หลักฐาน (รันจริงใน session นี้)

```
Node 05 page selection       == Python        14/14  (รวมเคสไม่มีหน้า invoice)
Answer decode JS vs Python   212 answers        0 diff (strict / salvage / fail)
Row bbox + NO_GEOMETRY       เคส row            5/5
Empty-read payload           port sha == engine sha   a04a2265…d50813 (schema 3.1 VALID, E01/REVIEW)
test_live_exec.py            8 OK / 1 skip     exec 451-457, 459, 460  (sha ตรงกันทุกฉบับ)
parity_rec.py                12/12 documents   RECORDED-CORPUS PARITY: OK
เกท offlineชุดเดิม           test_inline · test_decimal · test_tail_v57 · test_blackbox_offline ·
                             test_node12_offline · test_loop_nodes · test_01c_shape · test_node21_rec ·
                             test_request_shape · test_classify_select · test_rule_text_parity · check_calls  = เขียว
```

### 13.3 รันจริงบน canvas (draft; production ไม่แตะ)

| exec | doc | ผล | จำ |
|---|---|---|---|
| 455 | 89 | error ที่ IF node เดิม (condition แบบ boolean เข้ม) → เปลี่ยนเป็น `($json.selected_invoice_pages \|\| []).length > 0` | |
| 456 | 89 | IF ผ่าน, node 21 โดน **task runner timeout** → เป็นเหตุให้แก้ `aiTimeoutMs` | |
| 457 | 89 | **success** 57 วิ · selected=[1] · oracle=1 · ai=1 (23.9 วิ) · REVIEW/E01 · schema 3.1 VALID | |
| 458 | 16 | doc ไม่มีใน paperless (paperless ตอบ 404) → fail ที่ `Get a document` (ไม่ใช่โค้ด port) | |
| **459** | **34** (เอกสารไม่มี tag invoice) | **success 6 วิ · empty-read branch ทำงานจริง**: node 05 `selected=[] empty_read=true` → 05b สาย false → ข้าม 06-12 → node 21 **oracle=0 ai_calls=0** (gate ก่อน Oracle ทำงาน) → payload E01/REVIEW schema 3.1 VALID | |
| 460 | 89 (draft หลังแก้ aiTimeout) | **success** · ผ่าน 05b → สายปกติ · oracle=1 · ai=1 (21.9 วิ · elapsed node 21 = 25.5 วิ) · schema 3.1 VALID | |

doc 34 คือเอกสารเดียวใน paperless ที่ไม่มี tag invoice (`paperless_documents_search tagsExclude=5`) —
จึงเป็นเคส empty-read ที่มีอยู่จริงในระบบ ไม่ต้องสร้างเอกสารใหม่

### 13.4 เหลืออยู่จริง (ยังไม่ตรง engine — ต้องตัดสินใจก่อน publish)

1. **อ่านหลายหน้าพร้อมกัน**: flow ยัง `.first()` ฝั่ง extract = อ่านหน้าแรกที่เลือกหน้าเดียว
   engine อ่านทุกหน้าที่ classify เลือก → ผลต่างกันเมื่อ invoice มี >1 หน้า (doc 89 เลือก [1] จึงไม่กระทบ)
2. **R6-6 adjudicate**: engine ยิง adjudicate ซ้ำเมื่อ select ว่าง; draft นี้จบที่ empty-read ทันที
   → ทิศทางปลอดภัย (refuse ไม่ pass) แต่ถ้า adjudicate จะเจอหน้า invoice flow นี้จะปฏิเสธเอกสารที่ engine อ่านได้
3. **R6-13 tax-id re-read 300 DPI**: ยังไม่มีใน flow
4. **D2 extract เป็น JPEG q90** (engine) vs PNG (flow) — ตั้งใจคง PNG ไว้ก่อนเพราะ node 07/10 ใช้ต่อ
5. node 21 ยังเป็น Code node เดียว: ถ้า AI + Oracle ช้ารวมกันเกิน limits ของ platform ยังมีสิทธิ์โดนฆ่า
   (ตอนนี้ลดโอกาสลงด้วยการตั้ง `aiTimeoutMs=40000`)

### 13.5 ไฟล์/เครื่องมือที่เพิ่มใน session นี้

`n8n_nodes_v58/{lib_answer_decode.js,05_parse_classify.js,03_classify_multimage.js,10_parse_extract.js,05b_if_node.json}` ·
`src_extract.js` (zero-read, row-bbox, NO_GEOMETRY) · `build_n8n_inline.mjs` (runner + aiTimeout + config ไม่อ่าน token จาก git) ·
`n8n_nodes/port_config.example.json` · `harness/{test_answer_decode.py,test_row_bbox_parity.py,test_empty_read.py,
test_classify_select.mjs,js_exec.mjs,push_v58.py,live_v58_test.py,export_workflow.py}` ·
`verify_published.py` (อ่าน published version จริง + เช็ค node 10/params/สาย IF) ·
`workflow/workflow_034iqKMRjqKt9LlB_v5.8_{draft,published}.json` (redacted, import ได้) ·
`ENVIRONMENT.md` · `RUNBOOK.md` · `.gitignore` กันไฟล์ที่มี token

### 13.6 สองหลุมที่เจอระหว่างทาง (เคยทำให้ "รายงาน PASS หลอก") — แก้แล้ว

1. `verify_published.py` เวอร์ชันแรกเทียบ node จาก `get_workflow_details` แล้วพิมพ์ว่าเทียบ "version ที่รันอยู่"
   → จริง ๆ มันคือกราฟ **draft** ⇒ ฟ้อง `RUNNING VERSION == REPO` ทั้งที่ production ยังเป็นโค้ดเก่า
   ตอนนี้ fetch `get_workflow_version(activeVersionId)` เสมอ (ผลจริง: published **!=** repo, publish จะเปลี่ยน 6 node)
   และ RUNBOOK ห้ามเทียบแบบเดิมแล้ว
2. บล็อก `.gitignore` กันไฟล์ token เขียนคำอธิบายต่อท้าย pattern ในบรรทัดเดียวกัน
   → git ถือว่าข้อความนั้นเป็นส่วนหนึ่งของ pattern → **ไม่ ignore อะไรเลย** (`git add -n` ยังจะเก็บ `port_config.json`,
   `blackbox.json`, `parent_dump.json`, `nodes/00_…` เข้า git) ย้ายคำอธิบายไปอยู่บรรทัดของตัวเองแล้ว
   ตรวจซ้ำด้วย `git check-ignore` + `git add -n -A` (106 ไฟล์ที่จะเข้า = โค้ด+เอกสาร+workflow JSON, ไม่มีไฟล์ secret)

---

## 14. multi-page + R6-6 adjudicate + เทียบ payload ระดับ "ทุก field" (27 ต.ค., still **draft only**)

### 14.1 harness ตัวใหม่ที่ไม่เคยมีมาก่อน: `harness/js_flow.mjs` + `test_payload_parity.py`

ของเดิม (`parity_rec`, `test_live_exec`) เริ่มจาก **extraction ของ engine** ⇒ พิสูจน์ได้แค่ "ชั้น decision ไม่เอน"
ไม่ได้ตอบคำถามว่า "flow สร้าง extraction นั้นเองได้ไหม" ตัวใหม่รัน **โค้ด node จริง** (05, 05c/05e, 06b, 08, 10, 12)
บน scenario ที่หน้ากระดาษทุกหน้าเป็น JPEG ที่ **engine ยิงออกไปจริง** (จาก `fixtures/rec/<doc>_ai_tape.json`)
แล้วเอา extraction ที่ flow สร้างไปรัน port ต่อจนได้ payload แล้ว diff **ทั้ง payload + ทั้ง extraction**

ผลรวม (docs ที่ recording มีครบ 12 ฉบับ):

| bucket | คืออะไร | นับ |
|---|---|---|
| `HARD` | difference ที่เป็นพฤติกรรมจริง | **0 ใน docs 100/101/106/107** ที่เหลือเป็น bbox-family + ผลจาก ink-snap (ดู 14.3) |
| `EXPECTED` | ของที่ flow knowledge ไม่ได้จริง: `timings_ms`, `calls[].ms`, token usage, `*_at`, `duration_ms` | — |
| `PORT-ONLY` | `metrics.engine`, `metrics.sql_audit` (port เขียนเพิ่มโดยเจตนา, อยู่นอก hash) | 2/doc |
| `SUBPIXEL` | `pages[].width_pt/height_pt` ≤ 1.0 pt — Code node อ่าน PDF MediaBox ไม่ได้ จึงคำนวณจาก px/dpi (1 px ที่ 80 DPI = 0.9 pt) | 4–10/doc |
| `SNAP-off` | `extra.ink_snap` / `ink_snap_mode` | 2/doc |

doc ที่ HARD = 0 field: **100, 101, 106, 107** (รวม doc หลายหน้าที่ flow อ่านจริง 2 หน้า: 100, 101)

### 14.2 multi-page ปิดจริง

เดิม node 08/10/12 ใช้ `.first()` ⇒ อ่านหน้าเดียวเสมอ ตอนนี้ `06b Split selected pages` แตกเป็น 1 item/หน้า,
node 08 ใช้ `$('06b …').item`, node 12 รวมทุกหน้าเป็น `reads[]`, node 21 ส่ง `reads[]` เข้า `buildExtraction`
ผลบน doc 100/26/129 (selected `[1,3]`): flow อ่าน 2 หน้า, ได้ 19 lines / 2 lines เท่า engine, region id,
`items_by_page`, reprint-drop, `NO_GEOMETRY` (doc 129 หน้า 3) ตรงกันหมด — เทส `test_row_bbox_parity` 5/5 boxes เท่ากันเป๊ะ

### 14.3 สิ่งที่เจอใหม่และ **สำคัญกว่า gap ก่อนหน้าทั้งหมด**: ink-snap เปลี่ยน *recommendation*

engine default `PERCEPTION_INK_SNAP=move` เลื่อน box ให้แนบเนื้อ ink ส่วน Code node decode pixel ไม่ได้
⇒ flow คือ "แขน snap=off" ของ engine เดิม เคยคิดว่านี่คือ diff ระดับ cosmetic — **ผิด**

doc 26: snap ของ engine ขยาย box ของ line 14 จาก `y=0.67 h=0.02` เป็น `y=0.6513 h=0.0387` (กิน 2 บรรทัด)
→ box ชนกับเพื่อน → `V-01 fail`, exception `E01`, recommendation **REVIEW**
flow (snap off) ได้ box สะอาด → `V-01 pass` → **AUTO_PASS** — ผิดทางที่ อันตรายที่สุด (หลุดผ่าน)
doc อื่นที่โดนแบบเดียวกัน: 52, 102, 116, 117, 129, 131

ทางปิดมี 2 ทาง的选择 (owner ตัดสิน): (a) รัน engine ที่ `PERCEPTION_INK_SNAP=off` แล้วเทียบใหม่ให้ตรงกัน หรือ
(b) ให้ flow เรียก service ที่ snap ได้ (นอกขอบเขตงานนี้) — **ห้าม**แก้ flow ให้เข้มขึ้นเอง เพราะนั่นคือพฤติกรรมใหม่ ไม่ใช่ parity

### 14.4 ของที่แก้ใน port ระหว่างทาง (ทุกข้อมีเทสคุม)

1. `src_evidence_check.js` — port `application/evidence_check.py` (R1–R10) และเขียน `metrics.evidence_violations`
   ตรงจุดเดียวกับ engine (`assembler.py:278`) เดิม flow ไม่เคยเขียน key นี้ทั้งที่ consumer อ่านได้
2. `extractor.prompts` — ไม่ store ค่า version ไว้ แต่ ** derive** จาก header ของ prompt ใน node 00
   (`prompt_id:/version:` ภายใน 200 ตัวอักษรแรก) เหมือน `single_pass._pid` ⇒ แก้ prompt แล้วเลข version ขยับเอง
3. `file_sha256` — paperless ให้ bare hex, engine มี prefix `sha256:` → normalize ใน seam
4. `extra.items_by_page` — engine ใช้ `setdefault` ต่อ append เท่านั้น เดิม flow สร้างคีย์หน้าเปล่า (`"4": []`) ซึ่ง engine ไม่มี
5. `harness/js_exec.mjs --dump-extraction` เขียน fixture ด้วย `canonicalJson` ไม่ใช่ `JSON.stringify`
   เพราะ JS มี number type เดียว: engine เขียน `1.0` ส่วน stringify เขียน `1` → python parse เป็น int → sha ไม่ตรงกัน
   ด้วยเหตุผลที่ไม่เกี่ยวกับพฤติกรรมเลย (นี่คือเหตุที่ `test_empty_read` เคย FAIL ชั่วคราว)

### 14.5 ที่ **ยังไม่ได้ทำ** (ห้ามรายงานเป็นอันเสร็จ)

* โทโพโลยีใหม่ (`06b`, `06r`, `05c/05d/05e/05f`, tax-id 300 DPI branch) **ยังไม่ถูก push ขึ้น canvas** —
  draft `128fb6f2` ยังเป็นกราฟ v5.8 เดิม (16+1 node, อ่านหน้าเดียว) production `4de2ad29` ไม่ถูกแตะ
  `build_n8n_inline.mjs` (SECTION R) พร้อมรับ `reads[]`/`05e` แล้ว แต่ push + A/B สดบนเอกสารหลายหน้ายังไม่ทำ
* R6-13 tax-id re-read 300 DPI ยังไม่มีใน flow (node 12 คัดเคสและรายงาน `taxid_need` ไว้แล้ว แต่ยังไม่มี branch)
* ink-snap: unresolved โดยสภาพ platform — ต้องเลือกทางใน 14.3
* Code node timeout 60 s vs engine 300 s (AI) / 600 s (OCR): `aiTimeoutMs=40000` ทำให้ AI ช้า = MANUAL_REVIEW
  พร้อม payload แต่ยังไม่เท่ากับ engine ที่รอได้ถึง 300 s — ทางที่ตรงจริงคือย้าย AI ออกไปเป็น HTTP node
  (node 21 ต้องไม่ wait ข้างใน Code node) ซึ่งยังไม่ทำ

### 14.6 doc 129: harness จำลองไม่ได้ (ไม่ใช่หลักฐานว่า port ผิด) และต้องเก็บเป็นงานถัดไป

> **แก้ไข (§15): ข้อสรุปข้างล่างนี้ผิด — doc 129 เป็น "port ผิดจริง" ไม่ใช่ tape เสีย**
> identity ของ request↔response แยกต่อหน้าถูกต้องมาตลอด (ตรวจด้วย `harness/test_tape_identity.py`:
> 12 docs, 0 assertions fail, 0 contradictions) และ 116 diff rows มาจาก bug 3 ตัวในโค้ด port
> (`norm_key` semantics → reprint ไม่เคยถูก fold, `unmapped` ผิดความหมาย, `folded_rows` ขาด `row`)
> หลังแก้: **HARD rows 116 → 0** และ `REVIEW` ตรงกันทั้งสองฝั่ง — เก็บข้อความเดิมไว้เพื่อไม่ลบประวัติ

`fixtures/rec/129_ai_tape.json` ขัดแย้งกับ `129_extraction.json` ในแบบที่ scenario offline ปิดไม่ได้:
entry ที่ prompt เขียนว่า "page 3 of the document" มี answer ที่ engine **ตีพิมพ์เป็นค่าของ page 1**
(`bbox_2d [822,138,919,150]` → `region.page 1, bbox [0.822, 0.143, …]`) แต่ในขณะเดียวกัน engine ก็บันทึก
`page_errors {"3": "NO_GEOMETRY: 17 values read, none with a usable box"}` และ drop page 3 เป็น reprint
(`same_as_page 1, invoice_num IV 25690373`) — flow ที่ answer เดียวกันกลับ map ได้ box ปกติ (11 fields + 6 cells)
⇒ `pages_complete` flow=True engine=False, `documents` จึงย้ายหน้ากัน, diff ทั้งก้อน 116 บรรทัด
ข้อสรุปที่พูดได้เต็มปากคือ **"129 ยังอธิบายไม่ได้ ห้ามถือเป็นทั้ง parity และทั้ง bug"** — ต้องการ A/B บน canvas
(หรือ recording ใหม่ที่ capture คำตอบแยกหน้าให้ตรง) ก่อนตัดสิน ส่วน `make_scenario.py` ต้อง map คำตอบเข้าหน้า
ด้วยข้อความ "page N of the document" ใน prompt ไม่ใช่ tape order (ตอนนี้ tape order ใช้ได้กับ 11/12 docs)

---

## 15. v5.9 บน canvas: multi-page จริง + adjudicate + R6-13 + พบบั๊ก port 3 ตัว (27 ต.ค., still **draft only**)

### 15.1 topology ที่อยู่บน canvas ตอนนี้ (33 nodes, 32 connections)

`06b Split selected pages` (splitOut ทุกหน้าที่เลือก) → `06r Render 150 DPI (adjudicate)` (jpeg q85) →
`05c/05d/05e` (adjudicate prompt `max_tokens=900` แล้วรัน `selectInvoicePages` ชุด byte เดียวกับ node 05) →
`05f` → `07 Rotate` (ทำเองทุก item) → `08 Build extract request` (วนลูปทุกหน้า, JPEG **q90**) →
`09 VLM step 2` (HTTP วนเองทุก item) → `09t Tax-id triage` → `09i` → `09r 300 DPI` → `09o/09rot/09b/09c/09d/09z`
→ `10 Bbox math` (zip request↔answer ด้วย index) → `12` → `21` → `22`
node 08/10/05c/05e/06b/09t/09o/09b/09d/09z/12 = **Run Once for All Items + วนลูปเอง** เพราะ n8n ห้าม `.first()`
ทุกตัวในโหมด "Each Item" (exec 465 คือหลักฐาน) และ count guard ทุกจุด **fail loudly** ไม่เงียบ

### 15.2 บทเรียน platform 3 เรื่องที่ทำให้ fail จริง (exec 461/465/467/468)

1. `prepareBinaryData` ของ n8n เป็น **async** — ขาด `await` แล้ว `getBinaryData()` คืน `{}` (exec 461 fail ที่ node 07)
2. Code node โหมด "Each Item" ห้าม `.first()` แม้บรรทัดเดียว (exec 465) ⇒ ย้ายกลับมา allItems + วนเอง
3. **HTTP node ทิ้ง binary ของ item** (exec 467/468: node 09/10 เห็น binary ว่าง) ⇒ `09t` เก็บ
   `page`(150 DPI ที่ rotate แล้ว) + `pre`(ก่อน rotate) + `pdf` คืนจาก node 07/`Get a document` ด้วย index
   และ `09z` แนบ hi-res frame ที่ node 10 ต้องใช้คูณ scale

### 15.3 R6-13 tax-id re-read ทำครบตาม engine (และพิสูจน์บน canvas แล้ว)

engine ทำ **ใน loop ก่อนทำ bbox maths** และถ้าผล re-read ผ่าน checksum ก็ **แทนทั้ง answer และ frame**
(`single_pass.py:1024-1073` ⇒ `infos[p] = (image_hi, w_hi, h_hi)`) — port ทำเหมือนกัน: `09t` ตัดสินครั้งเดียว
ต่อเอกสาร (เลือกหน้าที่ fail เร็วสุดตามลำดับที่ engine วน) `09c` เป็น HTTP `onError=continueOnFail`
= `try/except Exception: continue` ของ engine และ `09d` ย้ายเฉพาะคำตอบที่ผ่าน gate เข้า `ans`
หลักฐาน: exec 468 (ปิด branch, `calls=[extract]`), exec 470 (branch ทำงานจริง: render 300 DPI 702 KB →
frame **2479×3508** → answer 25 boxes → `taxid_retry accepted=true`, `extra.calls` มี extract 2 records ของหน้า 1)
gate: `test_taxid_parity.py` (byte identity 2 copies + verdict เทียบ python 312 กรณี) PASS,
`test_taxid_flow.mjs` 14 กรณี (accept/reject/fail/off) PASS

### 15.4 บั๊ก port จริง 3 ตัว (เจอตอนเทียบ payload "ทุก field") + 2 gap ระดับ contract ที่ layer live จับได้

| # | ของจริง | port ทำ | ผลต่อ Portal | แก้ |
|---|---|---|---|---|
| 1 | `norm_key` เก็บเฉพาะตัวอักษร/ตัวเลข | `normKey` ตัดแต่ whitespace (ตัวนี้คือ `normalize.py` คนละฟังก์ชัน) | **หน้า reprint ไม่เคยถูก fold** → payload มีเอกสารซ้ำ, `pages_complete`/`documents` เพี้ยน (DMS-129) | เพิ่ม `normKeyDoc` ใช้ถูกจุด (signature + occurrence) |
| 2 | `dropped` = box ที่ map ไม่ได้อย่างเดียว | รวม "แถวไม่เป็นแถว" เข้าไปด้วย | ข้อความ `NO_GEOMETRY` ใน `validation.findings` เปลี่ยนทั้งที่ verdict เหมือนกัน → payload hash เปลี่ยน | `unmapped` เก็บเฉพาะ `degenerate_or_off_canvas` |
| 3 | `{**rec, page_no, element_type}` (ทั้ง object) | ตัด `row` ทิ้ง + เติม `text` ที่ engine ไม่ส่ง | Portal/AI เห็นรายการที่ "อ้างถึงเลขแถวไม่ได้" + key เกิน contract | ส่ง `row` ครบ, ไม่มี `text` |
| 4 | engine ส่ง `request.idempotency_key` เสมอ (null ได้) | ไม่ส่ง key เลย | contract field หายไป 1 ตัว | เพิ่มใน `build_n8n_inline.mjs` |
| 5 | `extra.calls` = classify → adjudicate → extract ตามเวลาที่เกิด | มีแต่ extract (classify แยกก้อน) | AI/Portal นับ VLM call ผิด | `src_extract.js` ประกอบ list เดียวตามลำดับ engine |

ผล parity หลังแก้ (replay layer, tape เดียวกับ engine): **HARD 0 ที่ 10/12 docs**
(100,101,102,104,106,107,116,117,129,131) เหลือ **DMS-26 (42 rows)** กับ **DMS-52 (3 rows)** ซึ่งเป็น geometry
จาก ink-snap ตาม ledger ของ §16 เท่านั้น

### 15.5 ชั้นทดสอบที่สาม (live traffic) และผลรัน

`harness/test_live_vs_engine.py` เทียบ payload ของ exec จริงกับ engine โดย **แยก bucket FRESH-OCR**
(ค่าที่ VLM อ่านต่างจากวันบันทึก ไม่ใช่ parity claim) + ตรวจ structure ที่ห้ามเปลี่ยน (`contract`/schema/codes)
ผล exec 472 (doc 100): `structure diffs=0`, HARD rows 11 บรรทัดล้วนอธิบายได้ด้วย "อ่านใหม่ต่างวัน"
(ที่อยู่ภาษาไทย, stamp↔signature, `matched_on=name_th`, id ที่ flow สร้างเอง)
และ layer นี้เองที่เจอ gap #4/#5 ซึ่ง replay layer มองไม่เห็น

### 15.6 สถานะ canvas / production

draft ล่าสุด `f80d1390` (export แล้ว: `workflow/workflow_034iqKMRjqKt9LlB_v5.9_draft.json`, redact 4 ค่า),
**published ยัง `4de2ad29` (v5.7, `active=true`) — ไม่เคย publish จากงานชุดนี้**, parent `soWzNNLrZ1c4Absf` ไม่ถูกแตะ
rollback ก่อน v5.9 = `live/backup_034iqKMRjqKt9LlB_before_v59_*.json` (versionId `128fb6f2…`)
`verify_published.py` ยังรายงาน "RUNNING VERSION DOES NOT MATCH THE REPO" ซึ่ง **ถูกต้อง**: publish ครั้งหน้าจะเปลี่ยน 27 nodes + เพิ่ม 17 nodes ใหม่

---

## 16. ink-snap: วัดขนาดจริงแล้ว และมันคือ DECISION ไม่ใช่ความสวยความงาม (owner ตัดสิน)

`harness/test_snap_gap.py` ทำให้ข้ออ้าง "snap เป็นแค่ pixel noise" เทียบไม่ได้กับหลักฐานอีกต่อไป:
ตรวจทีละเอกสารว่า (1) payload ทุก field ที่ไม่ใช่ geometry ตรงกันแค่ไหน (2) เอกสารไหนที่ engine fail V-01 แต่ flow pass
(3) ที่ engine อ้างบรรทัด 14 นั้น **ตัวที่ engine อ้างจริง honour `BOX_TOL=0.02` หรือแค่เฉียด** โดยใช้ bbox ที่ engine พิมพ์ไว้ใน finding

| doc | engine | flow | delta ที่กล่องซึ่ง engine อ้าง | สถานะ |
|---|---|---|---|---|
| 26 | V-01 **fail**, REVIEW | V-01 **pass**, AUTO_PASS | `D1-L14`: y 0.6513 h 0.0387 vs box โมเดล y 0.67 h 0.02 → delta **0.0187** (under `BOX_TOL`, but `L14.overlap(0.69)` ตามที่ engine พิมพ์) | **LOOSER — เปลี่ยนคำแนะนำ** |
| 52 | V-01 fail, REVIEW | V-01 fail, REVIEW | `D1-L5`: delta 0.2045 > 0.02 (fail แม้ไม่มี snap) | คำเตือนตรง, ข้อความ finding ต่าง |
| 116/117 | AUTO_PASS | AUTO_PASS | `D1-L14`: 0.0152; V-01 fail ทั้งคู่ (line-12) | **ตรงกันจริง หลังแก้ §15.4** |

ข้อสรุปที่พูดได้: flow ตอนนี้เป็น "แขน snap=off" ของ engine เสมอ ตัวที่เปลี่ยนคำแนะนำจริงคือ **DMS-26 และมันเปลี่ยนไปทาง stricter → safer ของ flow ที่ looser กว่า**
ทางปิดที่ซื่อสัตย์มี 2 ทาง: (a) รัน engine ด้วย `PERCEPTION_INK_SNAP=off` เพื่อ A/B จริง (b) ให้ flow เรียก external snap service
**ห้ามบีบค่าใน flow ให้เข้มขึ้นเพื่อให้ตรง** — นั่นคือ behaviour ใหม่ ไม่ใช่ parity (gate จะ fail loudly เมื่อ flow เข้มกว่า engine เช่นกัน)

---

## 17. ink-snap helper (เลือกทาง "เรียก implementation เดิมของ engine") + ขอบเขตหลักฐาน + rollback (27 ต.ค., draft เดิม, ไม่ publish)

### 17.1 สิ่งที่ลง_code_จริง

`snap_service/snap_server.py` — HTTP helper ที่ **import โค้ดของ engine ตรงๆ** ไม่มีอัลกอริทึมซ้ำ:
`SinglePassPipeline._render` (render 150 DPI จาก PDF), `coords.rotate_image`, `strip_rules(ink_mask(...))`
(single_pass.py:1070), `coords.snap_box_to_ink(rect, mask, move=, grow=)` และ `ink_snap_mode()` ของ engine
ค่า baseline คงของ engine: `INK_SNAP_DEFAULT="move"`, `PERCEPTION_INK_SNAP` ไม่เซ็ต — **ไม่มีใครถูกปิด**
`/health` พิมพ์ sha256 ของ `coords.py` + `single_pass.py` ให้ยืนยันว่า helper รันโค้ดไฟล์เดียวกับ engine

Node 10 เรียก helper **ก่อนที่ box ตัวไหนจะถูกใช้** (ตรงตำแหน่งที่ engine ทำใน `_px`) และ:
* ส่งเฉพาะ box ที่ engine snap จริง (fields + line cells — single_pass.py:516/519/408) regions/occurrences/
  handwriting/แถว/folded rows **ไม่ถูก snap** ตาม engine
* adoption rule เป็นของ engine: เก็บเฉพาะ `note != "unchanged"` (single_pass.py:381) ⇒ ไม่ re-quantise box ที่ไม่ถูกแก้
* **frame guard**: ถ้ามิติ frame ที่ helper render ไม่เท่ากับ frame ที่คำตอบอยู่นode 10 **throw ทันที**
* helper พัง/timeout ⇒ node 10 **throw** ไม่ fallback เป็น snap=off (engine ไม่มี try/except รอบ snap)
* `read.snap = {mode, moved, boxes, map}` วิ่งต่อไปกับ node 12 → 21 และ `src_extract.js` ใช้ map เดียวกัน
  ใน `region(contains=)` (row โตตาม cell ที่ถูกแก้ เหมือน engine) + `extra.ink_snap / ink_snap_mode`
  รายงาน arm จริงแทนค่า hard-code `off` เดิม (โหมดต่างกันระหว่างหน้า = throw เพราะ "one run is one arm")

พิสูจน์ helper ด้วยตัวเอง (synthetic page, ink อยู่คนละบรรทัดกับ box): `moved_13px` (note รูปแบบเดียวกับ
ที่ engine บันทึกใน DMS-59), กล่องที่ทับ ink อยู่แล้วได้ `unchanged`, input เพี้ยน → HTTP 500 พร้อม traceback
โหมด `move/grow/both/off` ผ่าน `ink_snap_mode` ของ engine (typo ไม่เท่ากับปิด)

### 17.2 ผลวัดจริง ณ จุดที่หยุด (ต้องอ่านก่อนอ้างว่า "snap ปิดแล้ว")

| สิ่งที่วัด | ผล |
|---|---|
| regression เมื่อ `snap_url` ไม่เซ็ต (สภาพ canvas ตอนนี้) | **เหมือนเดิมทุกตัว** — HARD 45 rows (26=42, 52=3), 10 docs HARD 0, เกท JS 11 ตัว + Python 10 ตัว PASS |
| offline parity ด้วย helper (`.cache/downloads/DMS-26.pdf`) | **frame guard หยุดให้** — helper render 1938×2743 ขณะที่ answer อยู่ใน frame 1240×1755 ⇒ PDF ใน cache **ไม่ใช่ไฟล์เดียวกับที่ engine ใช้บันทึก tape** (A4@150 = 1240×1755) ถ้าไม่มี guard นี้จะได้ "parity" ปลอมจากภาพคนละไฟล์ |
| offline parity ผ่าน `image_b64` (mask จาก JPEG ที่ tape บันทึก) | **ยังไม่จบ** — wiring ใน `harness/js_flow.mjs` พังระหว่างทาง (error ใน snapPrep) ต้องแก้ runner ต่อ ⇒ **ตัวเลข HARD ของ DMS-26/52 ตอน snap=on ยังไม่มี** และห้ามพูดว่า gap ปิดแล้ว |
| canvas live ที่เรียก helper จริง | **ยังไม่ทำ** — ต้องตรวจก่อนว่า n8n instance เข้าถึง helper ได้ (workstation/พอร์ต) ถ้าเข้าไม่ถึงคือ blocker ของการทดสอบบน canvas ไม่ใช่ blocker ของตัว helper |

ข้อสรุปที่พูดได้ตอนนี้: helper ใช้ algorithm/render/mask/error handling ของ engine จริง + ผูกเข้ากับ node 10/21
โดยมี guard ครบ และไม่กระทบพฤติกรรมเดิมเมื่อไม่ได้เปิดใช้ — **แต่ "snap parity" ยังไม่ถูกวัด**

---

## 18. snap บน canvas จริง + parity HARD 0 ทั้ง 12 ฉบับ + rollback ที่ตรวจได้ + secret_guard (28 ต.ค., draft เท่านั้น)

### 18.1 snap parity (controlled replay, recorded-image) — ปิดแล้วจริง

`harness/test_snap_parity_arms.py` รันครบ 4 สภาพและ **assert ค่าที่ควรได้**:

| สภาพ | ผล |
|---|---|
| SNAP ON (helper รันโค้ด engine เหนือ frame ที่บันทึกไว้) | **12/12 docs HARD 0** (รวม 26, 52 ที่ค้างมาตลอด) |
| SNAP OFF (flow เดี่ยวๆ ไม่มี helper) | HARD 45 (26=42, 52=3) — ถ้าวันไหนเป็น 0 แปลว่า "เงียบๆ snap" gate จะฟ้อง |
| helper ตาย | node 10 throw, ไม่มี payload, **ไม่มี AUTO_PASS** |
| helper ตอบ 500 | เหมือนกัน — fail loudly |

ต้นเหตุจริงของ 42/3 rows ไม่ใช่แค่ "ไม่มี snap" อย่างเดียว — `src_extract.snapLookup` จับ key เป็น px ทศนิยม
("223.2,1184.6…") ไปเทียบกับ key จำนวนเต็มของ node 10 ("223,1185…") ⇒ **lookup พลาดทุก box** และแถวที่ 14
ไม่โตตาม cell ที่ถูก snap (`harness/test_snap_replay.py` ชี้เป้า: engine snap บน frame บันทึกแล้ว reproduce
box ที่ engine เผยแพร่ 100% = 95/95 ที่ 26, 22/22 ที่ 52) หลังแก้ `pxKey` → ครบทุก field ตรงกันหมด

### 18.2 snap บน canvas: เข้าถึงได้ และต้อง mask "ภาพที่ box อาศัยอยู่" ไม่ใช่ re-render

probe `harness/probe_snap_canvas.py` (ตั้ง `snap_url` ที่ node 00 ของ draft ชั่วคราว → รัน → คืน config)
* exec 473/475: 500 — n8n เก็บ binary เป็น filesystem pointer ⇒ `binary.data` = **"filesystem-v2"** ไม่ใช่ base64
  ⇒ ต้องใช้ `helpers.getBinaryDataBuffer` เท่านั้น (ตอนนี้ guard ตรวจความยาวแล้ว throw ถ้าได้ pointer)
* exec 477: **frame guard จับของจริง** — fitz render 150 DPI ได้ 1240×1755 แต่ frame ของ flow (n8n pdfConvert)
  คือ 1240×**1754** ⇒ re-render ด้วย PyMuPDF = mask คนละภาพกับที่โมเดลเห็น (ต่าง 1 px ที่ 150 DPI — ตัวเลขนี้
  ไม่เคยวัดมาก่อน เพราะ flow ไม่เคยต้องใช้ pixel ของตัวเอง)
* exec 478: ส่ง frame JPEG ของ flow เอง ⇒ **node 10 รายงาน `snap {mode:"move", boxes:15}` บน canvas สำเร็จ**
  สรุปบรรทัดนี้ให้ชัด: "raw-PDF/render parity" ทำไม่ได้ด้วยการ re-render ใน flow และ**ไม่จำเป็น** เพราะ engine
  เองก็ mask ภาพเดียวกับที่ส่งโมเดล — หลักฐาน offline ทั้งหมดจึงติดป้าย recorded-image test

exec 477 ยังจบที่ node 21 ด้วย **"The task runner was taking too long"** — หลักฐานว่า timeout gap ยังไม่ถูกแก้จริง

### 18.3 rollback: ยืนยันราย leaf แล้ว (และแก้ไขข้อสรุปเมื่อวาน)

`harness/make_rollback_artifact.py` เทียบ version ที่รันอยู่ (fetch ตาม `activeVersionId`) กับไฟล์ที่เคยเรียกว่า
published แล้วแยก diff เป็น SECRET / METADATA / BEHAVIOUR: **BEHAVIOUR 0, METADATA 0, SECRET 3**
(token ใน assignment 2 ตัว + oracle url/token ที่ฝังใน jsCode ของ node 21) ⇒ ข้อสรุป "hash ไม่ตรง = ใช้นี่ไม่ได้"
เมื่อวานเป็น artifact ของการ redact ไม่ตรงกัน ไม่ใช่พฤติกรรมต่างกัน — ตอนนี้พิสูจน์ราย leaf แล้ว
ของใหม่: `workflow/workflow_034iqKMRjqKt9LlB_ACTIVE_4de2ad29.json` (+ `.sha256`) ที่ capture จาก version ID
จริง มี manifest (versionId, nodes, connections, redactedSha256) ไว้ตรวจย้อนหลัง
**ยังไม่ restore/import/publish จริง** — prerequisites (instance เป้าหมาย + credential ของมัน) ยังไม่พร้อม

### 18.4 secret_guard: final scan เจอว่า export เคยหลุด

`workflow/…_v5.9_draft.json` เคยมี **paperless token + LLM key** หลุดอยู่ เพราะ exporter redact ตาม **ชื่อ key**
แต่น8n เก็บ config เป็น `{name:"paperless_token", value:"…"}` (key ชื่อ `value`) และการตรวจรอบก่อนใช้รายการ
secret จาก `port_config.json` ที่ไม่มีสองค่านี้ ⇒ ผลตรวจ "NONE" เลยเชื่อถือไม่ได้
`harness/secret_guard.py` แก้ทั้งสองทาง: redact ตาม **ชื่อ assignment + shape ของค่า** (sk-, eyJ JWT, n8n_,
hex 40 ตัว, Bearer, URL oracle) + ค่าจริงจาก port_config และ **scan ด้วยกฎเดียวกัน**
ผลหลัง scrub: artifact ทุกไฟล์ + STATUS/RUNBOOK/ENVIRONMENT **CLEAN** ทั้งหมด (placeholder ของ template
ถูกกันออกจาก list เพื่อไม่ให้ scan ฟ้องหลอกจนคนเริ่มเพิกเฉย)

### 18.5 สภาพ ท้ายรอบ

draft `62fe2386` · **activeVersionId `4de2ad29`, active=True, 16 nodes ในเวอร์ชันที่รัน** · parent `soWzNNLrZ1c4Absf`
(b892d831, active=False) ไม่ถูกเขียน · `doc_id` = expression เดิม · ไม่มี `snap_*` ค้างบน node 00 · ไม่ commit/tag ·
engine ไม่ถูกแตะ (baseline snap = `move`, env ไม่เซ็ต) · เกทเดิมยัง PASS ครบ (11 JS + 10 Python + live exec parity)


## 19. Node 21 timeout — the platform limit measured, and what was changed (28 Oct, v6.0 WIP)

**The limit, measured.** Exec 478 died with `The task runner was taking too long...` at
`executionTime = 60005 ms` on node 21; exec 456 died the same way. Every HTTP node on this instance stays
under it (slowest recorded: 15.1 s for node 09). So the ceiling is **60 s per node execution**, and the
engine's own budgets are deliberately larger than that (Oracle 60 s per attempt, rule AI 300 s) — a single
Code node can never be parity. Shortening the timeouts is not a fix and was not done; `aiTimeoutMs` is now
read from config and defaults to the engine's 300 s again.

**What the change does.** `dist/node21_inline.js` now has an external-I/O shape (`ioExternal`, switched on by
`io_external` on node 00 CONFIG): the Oracle call and the rule-AI call are replaced by facades that either
answer from a tape carried on the item, or stop the pass and hand the request out as `io.pending`
(`{kind: oracle|ai, sql | url+headers+body}`). The next pass replays the *same deterministic* rule
evaluation over the now-longer tape, so gate order, adaptive narrowing, evidence and error semantics are the
engine's own code path — nothing is reordered, and a failed answer is replayed as the same error instead of
silently becoming "no rows". The pass count is bounded by engine limits (7 Oracle queries, 8 AI calls) and
exceeding them throws instead of inventing data.

**What is proven.** The built node text runs offline (`harness/js_node21.mjs`) with **zero in-node HTTP**
(`in-node HTTP=0`; the stub raises if the node ever calls out itself), and produces a payload through the
pending loop. With `ioExternal` off, every previous gate is green again (`test_inline`, `test_node21_rec`,
`test_request_shape`, the other JS gates, `test_snap_parity_arms`, `test_snap_gap`, `test_tape_identity`,
`test_row_bbox_parity`) — the feature is inert by default.

**What is NOT proven (do not call this Done).** (1) The offline comparison against the old plumbing is still
feeding the built node an incomplete input item, so its "MISMATCH vs the old plumbing" lines are harness
noise, not behaviour — the equivalence claim is unmeasured. (2) The canvas side (IF + HTTP Oracle node +
fold node + loop edges, and `io_external` on node 00) has **not** been pushed: nothing about this refactor
has run on n8n. (3) Slow/timeout/error/duplicate answers were exercised only against that same incomplete
input, so they prove the mechanism exists, not that the verdicts match the engine. Production and the parent
were not touched while doing this, and the flag defaults off, so the draft still behaves as before.
