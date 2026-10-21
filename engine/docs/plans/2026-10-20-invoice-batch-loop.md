# เพิ่ม loop: ทุกรายการ tag `invoice` → ประมวลผลระลอกละ 5 ฉบับ

วันที่: 2026-10-20 · parent workflow: `soWzNNLrZ1c4Absf` · blackbox: `034iqKMRjqKt9LlB`
สถานะ: **ประกอบเสร็จ + ตรวจแบบไม่รันเท่านั้น (ผู้ใช้ทดสอบเองตามคำสั่ง)**

## 1. โครงใหม่ (17 nodes)

```
01 START (manualTrigger)                      ← trigger ใส่ node group ไม่ได้
  └─ [Fetch + map]
       01b Paperless: docs tag invoice (resource=document, operation=list,
           returnAll=true, filters.tags = tag id 5 "invoice")
        └ 01c Map to doc_id (code)                 → 1 item = { doc_id, title, tags }
     LOOP 5 docs (splitInBatches v3, batchSize=5)
       [loop / output 1] → [Batch 5 doc]
                             03 BB Call (executeWorkflow v1.2, mode=each,
                                 options.waitForSubWorkflow=true,
                                 onError=continueRegularOutput)
                              └ 04 Alias page key        → map ทุก item, ติด bb_ok
                             └ 04b Split ... (If v2.2)   → true = doc สำเร็จ
                                  ├ true  → LOOP 1 doc (batchSize=1)
                                  └ false → 04c Log doc ที่ข้าม (leaf, จด staticData)
                         LOOP 1 doc [loop] → [Debug]
                                 13 Pick this doc → 11a → 11b (วาดกรอบ 3px) → 11c
                              → [ตอบ API + เก็บสรุป]
                                 14 Merge → 23 Build API response → 15 Collect result
                                 15 ────────────────────────────────► กลับ LOOP 1 doc
                         LOOP 1 doc [done / output 0] ─────────────► กลับ LOOP 5 docs
       LOOP 5 docs [done / output 0] → [สรุปท้ายรอบ] 16 Final summary
```

## 2. ทำไมต้องแบบนี้ (decision log)

| เรื่อง | สรุป |
|---|---|
| "5 พร้อมกัน" | `executeWorkflow` v1.2 **ไม่มีออปชัน concurrency** (ยืนยันจาก `get_node_types`) มีแค่ `waitForSubWorkflow` ⇒ ทำเป็น **ระลอกละ 5** (batch) ถ้าสลับเป็น `waitForSubWorkflow=false` จะได้ 5 วิ่งทับกันจริงแต่ **ไม่ได้ผลลัพธ์กลับมา** ประกอบ response/รูป |
| loop ซ้อน 2 ชั้น | `LOOP 5` คุมจำนวนต่อระลอก, `LOOP 1 doc` (batchSize=1) จำเป็นเพราะ `11b` อ่าน `$input.first()` — ถ้าให้ 5 item เข้า Debug group พร้อมกันจะวาดกรอบแค่ doc เดียว |
| `13 Pick this doc` | `11a/11c` (Edit Image) เขียน json ทับ ⇒ `14` ต้องอ่าน json ของ doc เดียวกัน จาก anchor ของ iteration นี้ (**ห้าม** `$('03 BB Call').first()` เพราะ 1 run มี 5 doc) |
| doc ที่ blackbox พัง | `onError=continueRegularOutput` + `04` ติด `bb_ok=false` + `04b (If)` แยกไป `04c` ⇒ เอกสารเสีย 1 ฉบับไม่ฆ่าทั้งกอง |
| สรุปทุก doc | output `done` ของ Loop Over Items คืน "item ต้นทาง" ไม่คืน output ของ body ⇒ `15` เก็บหัวผลลง `$getWorkflowStaticData('global')[$execution.id]` แล้ว `16` รวม (ลบกระเป๋าหลังสรุป) |
| `Filter` → `If` | `filter` v2.2 ถูก validator รายงานว่ามี 1 output (ต่อ branch ที่ 2 ไม่ได้) ⇒ เปลี่ยนเป็น `if` v2.2 เงื่อนไขเดิม (`boolean bb_ok = true`) |
| ลบ `HTTP Request` | มี node โทรมีเดิม (`n8n-nodes-base.httpRequest`, parameters ว่าง ไม่มี url) ต่อจาก output ของ `04` → **จะทำให้รันล่มทันทีที่ doc แรกผ่าน 04** จึงลบพร้อมเส้น (validator เด้ง INVALID_PARAMETER มาตลอด) |
| node ที่ใส่ group ไม่ได้ | `01 START` (trigger), `LOOP 5 docs` / `LOOP 1 doc` (เส้น feedback ของ loop ข้ามกลุ่มไม่ได้), `04c` (leaf ที่ต่อจาก branch — ถ้าเอาเข้ากลุ่ม exit จะมาจาก non-leaf ซึ่ง n8n ปฏิเสธ) |

## 3. หลักฐาน (ไม่มีการรัน workflow)

```
validate_node_config          : ผ่าน 3/3 (paperless list v2 + tag RLC, splitInBatches v3, filter→if v2.2)
update_workflow (6 calls)     : ครั้งสุดท้ายไม่มี structural warning เหลือแต่ TOP_LEVEL_ITEMS_OVER_CEILING (9 กล่อง)
harness/test_loop_nodes.mjs   : ALL PASS (exit 0) — รัน jsCode จริงของ 01c/04/04c/13/15/16
     01c : 3 เข้า -> 2 ออก (ทิ้งไม่มี id), doc_id เป็น string, throw เมื่อไม่พบเอกสาร
     04  : 5 item + 1 item พัง -> 6 item, bb_ok/page alias ครบ, doc_id รายตัวไม่หาย
     04c : สร้างกระเป๋า st[$execution.id] + จด skipped, ใช้กระเป๋าเดียวกับ 15
     15  : เก็บ 2 doc, หัวผลครบ verdict/sha/boxes_drawn, จำนวน item + binary คงเดิม
     16  : 4/2/1 ถูก, never_touched=[96], verdict_counts={HOLD:1,AUTO_PASS:1}, เคลียร์กระเป๋า
```

## 3b. บั๊กแรกที่เจอตอนผู้ใช้รันจริง (2026-10-20)

**อาการ:** `ไม่พบเอกสารที่มี id เลยจาก Paperless (item เข้า = 1) [line 11]` ที่ node `01c`

**สาเหตุ (ยืนยันด้วยข้อมูลจริง):** `@mephistojb/n8n-nodes-paperless` `resource=document, operation=list` คืน
**pagination ทั้งก้อนเป็น item เดียว** — `{ count, next, previous, all:[id...], results:[{id,title,tags},…] }`
ไม่ใช่ 1 item/เอกสาร ⇒ `01c` เวอร์ชันแรกที่อ่าน `j.id` ตรง ๆ จึงไม่เห็น id เลย
(ยืนยันข้อมูลจริงด้วย `paperless_documents_search tags=5 pageSize=3`: **มีเอกสารติด tag invoice 275 ฉบับ**)

**แก้:** `01c` คลี่ array ใต้ `results/documents/data/items/docs` ก่อน, รับ row ทั้งแบบ object และ id ล้วน,
กัน id ซ้ำจาก `all` + `results`, ยังรองรับกรณี node คืน 1 item/เอกสาร,
และ error ตัวใหม่**พิมพ์ key จริงของ item ที่เข้ามา** (ครั้งหน้าไม่ต้องเดา shape)

** หลักฐาน (offline เท่านั้น):** `harness/test_01c_shape.mjs` → ALL PASS 7 (ใช้ pagination shape จริงจาก API)

## 3c. ข้อควรระวังถัดไปที่เห็นจาก shape นี้

- ถ้า `next != null` แปลว่า `returnAll` ของ node ดึงไม่ครบหน้า ⇒ `01c` จะ `console.warn` ไว้
  (Paperless default page size = 25 จากทั้งหมด 275) — ถ้าเจอ warn ต้องเปลี่ยน `01b` เป็น HTTP Request
  แบบ pagination (หรือเพิ่ม page size) ก่อนรันจริงทั้งกอง
- 275 ฉบับ × ~20 วิ (รันรอจบทีละ doc) ≈ **1.5 ชม./รอบ** — ถ้าต้องการเร็วจริงต้องกลับไปคุยเรื่อง
  fire-and-forget + collector (หัวข้อ C ใน `docs/plans/2026-10-20-invoice-batch-loop.md` §1 ทางเลือก)

## 4. สิ่งที่ต้องดูตอนผู้ใช้ทดสอบ

1. `01b` คืนมากี่ฉบับ (ถ้า 0 = tag ไม่ใช่ id 5 — เช็คด้วย `explore_node_resources`/tagSearch)
2. `16 Final summary` ต้องมี `processed + skipped + never_touched == total_docs_from_paperless`
   ถ้า `processed=0` ทั้งที่ `23` มี output ⇒ staticData ไม่ carry ใน manual run ของเวอร์ชันนี้ บอกผมจะเปลี่ยนวิธีเก็บผลรวม
3. `annotated` ของแต่ละ doc ต้องเป็น **กรอบ** 3px ไม่ใช่กล่องทึบ (ดูใน execution ของ iteration นั้น)
4. ความเร็ว: 1 doc ≈ 20s ⇒ 5 ฉบับ/ระลอกแบบรอจบ = ~20s/ระลอก (VLM ไปซ้อนกันเฉพาะตอนที่ n8n ยิงพร้อมกันจริง)

## 5. ไฟล์ใน repo (gitignore — `engine/temp/`)

`n8n_nodes/loop/*.js` (ต้นทางโค้ดทุก node ใหม่), `harness/test_loop_nodes.mjs`
