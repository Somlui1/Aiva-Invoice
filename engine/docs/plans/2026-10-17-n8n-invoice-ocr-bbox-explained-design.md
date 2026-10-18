# Design — n8n "DMS Invoice OCR + BBox (Explained) v1"

Date: 2026-10-17 · Owner: wajeepradit.p · Audience: หัวหน้างาน (อธิบายการทำงานของ `src/system_a/`)

## 1. เป้าหมาย (scope ที่ owner ตัดสินใจแล้ว)

flow เดียวใน n8n ที่ทำงาน **แค่** ห่วงนี้ของ System A:

```
เลือกเอกสาร invoice 1 ฉบับจาก Paperless → render → VLM classify หน้า → เลือกเฉพาะหน้า Invoice
→ VLM extract ฟิลด์/บรรทัด + bbox → วาด bbox → ส่ง (1) รูป Invoice ล้วน (2) รูป Invoice + bbox
(3) final JSON
```

**YAGNI ที่ owner ตัดออกรอบนี้:** Oracle lookup, normalize, rules V-01..V-08, matching, recommend —
เหลือไว้เป็นช่อง `not_evaluated` ใน JSON เพื่อต่อยอด "ของจริง" แบบ drop-in

## 2. ข้อจำกัดที่วัดแล้ว (ไม่ใช่การเดา)

| ข้อเท็จจริง | หลักฐาน |
|---|---|
| n8n Code node รันได้แต่ JS — import `system_a` (PyMuPDF/cv2/ONNX/Decimal) ไม่ได้ | `container.py::Settings`, `coords.py` ใช้ cv2/onnx/fitz |
| Engine API ยังไม่มี instance รันอยู่ | `10.10.3.112:8080` และ `10.10.10.230:8080` = closed |
| GraphicsMagick ใช้ได้ (`Edit Image` create/draw/text/information ผ่าน) | n8n execution 325, node `A4` → PNG 400x200 |
| Paperless เข้าได้จากใน container + token ใช้ได้ | execution 325 → HTTP 200 `application/pdf` 524,994 B (DMS-23) |
| `PDF Convert` ให้ 1 item หลาย binary prop, ตั้ง DPI ได้ | execution 325 → `page_page_1` 1,545,128 B / `page_page_2` 720,714 B @150 DPI |

⇒ **ทางที่เลือก:** port ห่วง OCR เป็น n8n node (ไม่เปิด engine API) โดย **ยึด src เป็นแบบพิมพ์**
(prompt คำต่อคำ, เรขาคณิตเดียวกัน, สี/label เดียวกับ `scripts/run_single_pass.py::overlay`)

## 3. แผนผัง node (14 nodes + sticky 3 ใบ + group 3 กลุ่ม)

```
Webhook POST /dms-invoice-ocr {doc_id}
└ 00 CONFIG (จุดเดียวที่แก้)                        ← container.py::Settings + config/prompts/*.md + COLORS
  └ 01 Paperless ดาวน์โหลด PDF                     ← adapters/paperless/reader.py::download
    └ 02 PDF→JPEG 80 DPI ทุกหน้า                   ← perception/single_pass.py::_render(classify_dpi=80)
      └ 03 Build request classify (Code)           ← _ask(layout="v3"): ภาพก่อน ข้อความทีหลัง, ไม่มี system
        └ 04 VLM step1 classify (HTTP LiteLLM)     ← _ask / litellm_client.py (temp 0, max_tokens 8000)
          └ 05 Parse + เลือกหน้า Invoice (Code)     ← normalize_classify + select_invoice_pages + parse_marker
            └ 06 PDF→JPEG 150 DPI ทุกหน้า           ← _render(extract_dpi=150)
              └ 07 หมุนหน้า Invoice ตาม r (Edit Image) ← perception/coords.py::rotate_image_for_vlm
                └ 08 Build request extract (Code)   ← extract prompt 1.6.0 + W/H จาก JPEG header
                  └ 09 VLM step2 extract (HTTP)     ← single_pass.py::extract
                    └ 10 bbox → พิกเซล + sanitize (Code) ← coords.py::xyxy_px / bbox_problems / validate_line_bbox
                      └ 11 วาด bbox ทุกกล่อง (Edit Image multiStep) ← run_single_pass.py::overlay
                        └ 12 ประกอบ final JSON (Code) ← application/assembler.py (envelope result/3.0)
                          └ 13 Respond to Webhook
```

**CONFIG (node 00) ครอบคลุม:** `doc_id`, `paperless_url/token`, `llm_url/key/model`, `temperature`,
`max_tokens`, `dpi_classify=80`, `dpi_extract=150`, `coord=norm1000`, `invoice_types`, `max_pages`,
`colors{field,line,occurrence,signature_box,stamp,table,excluded,folded}`, `label_max_chars=40`,
`max_boxes=22`, **`prompt_classify` (1.3.0) + `prompt_extract` (1.6.0) แบบเต็ม**
→ ทุก node อ้าง `$()` กลับมาที่ node นี้ที่เดียว ไม่มีค่า hardcode แทรกอยู่ข้างล่าง

## 4. สัญญาผลลัพธ์ (final JSON)

envelope เดียวกับ `schemas/result-3.0.schema.json` แต่เติมเฉพาะส่วนที่ flow นี้ผลิตจริง:
`contract, request, versions, package, pages, documents, ocr.elements[], extraction{fields,lines,regions,occurrences,handwritten_refs}, metrics`
+ `normalized_fields / oracle_snapshot / line_matching / rule_results / evidence / exceptions / recommendation`
= `{"status":"not_evaluated","why":"ขั้นนี้อยู่นอก scope ของ flow อธิบาย (ต่อได้จาก engine)"}`
+ `steps[]` — อธิบายทีละขั้น (node / ทำอะไร / ตรงกับโมดูล+ฟังก์ชันไหนใน `src/`)

**binary ที่ส่งกลับ:** `images.invoice_page_b64` (หน้า Invoice ล้วน, หมุนตั้งแล้ว) และ
`images.invoice_annotated_b64` (= รูปแบบเป้าหมาย `bbox_testing/DMS-23/invoice_p1.png`)
ส่งเป็น base64 ใน JSON เพราะอ่านผลจากการ execution ได้ทันทีโดยไม่ต้อง publish workflow

## 5. ความต่างจาก src ที่ยอมรับและ *บันทึกไว้ในผลลัพธ์* (ไม่แอบเนียน)

| ความต่าง | เหตุผล | สัญญาณที่มองเห็นได้ |
|---|---|---|
| ไม่มีการหมุนด้วย cv2 + `warpAffine` per-pixel, ใช้ `Edit Image rotate` | n8n ไม่มี cv2 | `metrics.rotation_mode = "n8n-editImage"` |
| เส้นกรอบ 1 px (PIL ใช้ 3 px) | `Edit Image draw` ไม่เปิด `lineWidth` | `metrics.box_rings = 1` |
| กล่องที่วาดได้สูงสุด `max_boxes=22` ต่อหน้า (multiStep เป็น fixed pool) | n8n ผูก ops กับ node parameter ไม่ใช่ item | `metrics.bboxes_total` vs `bboxes_drawn` + `truncated` |
| classify ไม่พบหน้า invoice → fallback หน้า 1 | src ปฏิเสธอ่าน; demo ต้องส่งภาพกลับได้เสมอ | `extraction.fallback_used` + `note` |
| ไม่มี `normalized_fields` (date/number normalize) | ต้อง port `normalize.py` ทั้งไฟล์ | `normalized_fields.status = not_evaluated` |

## 6. การตรวจสอบ (verification-before-completion)

1. `execute_workflow` manual ด้วย `{doc_id: 23}` → อ่าน execution ผ่าน MCP
2. decode base64 ทั้ง 2 รูป → เปิดดูเทียบ `bbox_testing/DMS-23/invoice_p1.png` (16 กล่อง, หน้าเดียว)
3. เทียบตัวเลขกับ `bbox_testing/DMS-23/meta.json`: `selected_pages=[1]`, `doc_type[1]=tax_invoice`,
   `doc_type[2]=po`, `is_original=true`, `multi_invoice_detected=false`
4. `total_bboxes_drawn` ต้อง ≥ 16 และ `invoice_num` ต้องออก `T6909/0093` (หรือ close ตามที่โมเดลอ่านรอบนั้น)

## 7. แผนต่อยอดเป็น "ของจริง"

1. `docker compose -f frontend/docker-compose.engine.yml up -d` → เปลี่ยน node 10-12 เป็น HTTP ไป `/v1/validations`
2. หรือเพิ่ม granular endpoints (`/v1/perception`, `/v1/normalize`, `/v1/rules`) แล้วสลับ node ทีละขั้น — JSON envelope เดิมใช้ได้ทันที
3. ย้าย token/key จาก node 00 → n8n Credential (httpHeaderAuth) และลด `CONFIG` เหลือแต่ค่าที่ไม่ลับ

## 8. ผลการรันจริง (workflow `0Vr8EhxshgvpWPKZ`)

| Execution | ผล | สาเหตุ / สิ่งที่แก้ |
|---|---|---|
| 326 | error ที่ `01` — Paperless 401 `Invalid token.` | ผมใส่ token ผิดบรรทัด (คนละตัวกับ `PAPERLESS_API_TOKEN`) → patch ค่าจริงจาก `engine/.env` (ทั้ง token และ `LITELLM_API_KEY`) |
| 327 | error ที่ `04` — `BadRequestError: At most 1 image(s) may be provided in one prompt` | **ข้อจำกัดจริงของ LiteLLM gateway ตัวนี้ (vLLM backend) ไม่ใช่บั๊กของ flow** |
| 328 | รันหลังปรับ classify เป็น 1 หน้า : 1 request | ดูข้อสรุปด้านล่าง |

### ผลข้างเคียงที่กระทบ engine (ต้องรายงาน)

`single_pass.py` บรรทัด 6 เขียนไว้ว่า *"Step 1 classify — ONE multi-image call"* และบรรทัด 977 ส่ง
`img_80_urls` (ทุกหน้า) ในลูกยิงเดียว — gateway ปัจจุบันตอบ 400 กับ request แบบนี้
**แปลว่า route classify ของ engine จะชน error เดียวกันกับโมเดล/gateway ชุดนี้** ยังไม่ได้ยืนยันด้วย
การรัน engine จริง (engine ไม่ได้รันอยู่) — ควรตรวจก่อนสรุปว่าเป็น regression ฝั่ง gateway หรือ model serving

### สิ่งที่แก้ใน flow ให้ตรงกับข้อจำกัดจริง

`03` ปล่อย N items (1 หน้า/1 request, `max_tokens = 160*n + 400` ตาม src) → `04` ยิง N ครั้ง →
`05` รวม `pages[]` กลับก่อนเข้า `normalize_classify` ตัวเดิม; base prompt ยังเป็นข้อความเดิม
ต่อท้ายเฉพาะบรรทัดบอกเลขหน้า — ความต่างบันทึกไว้ใน `metrics.classify_mode` ของผลลัพธ์เสมอ (ไม่แอบเนียน)

## 9. ผลรันจริง DMS-23 (execution **329** = success, 26.0 วินาที)

ไฟล์ที่ flow ส่งกลับมา ( decode จาก base64 ในผลลัพธ์ node 12 ):
`temp/n8n_run/invoice_p1_clean.png` (1,565,981 B), `temp/n8n_run/invoice_p1_annotated.png` (1,323,800 B),
`temp/n8n_run/result.json` (envelope result/3.0)

**โครงสร้างหน้าที่เลือก ตรงกับ reference:** `total_pages=2`, หน้า 2 = `po` (เลข `00-25733`, marker `1/1`),
`selected_invoice_pages=[1]`, ภาพ 1240×1754 px @150 DPI, `pages_complete=True`, `multi_invoice=False`

เทียบฟิลด์กับที่ engine เคยรันไว้ (`bbox_testing/DMS-23/validation_payload.json`):

| ฟิลด์ | engine (reference) | n8n flow | |
|---|---|---|---|
| invoice_num | T6909/0093 | T6909/0093 | ✓ |
| invoice_date | 03/09/2569 | 03/09/2569 | ✓ |
| customer_tax_id | 0145548001557 | 0145548001557 | ✓ |
| sub_total / vat / grand_total | 2,265.00 / 158.55 / 2,423.55 | เหมือนกัน | ✓ |
| po_number | PO42052739 | **PO2569/2739** | ✗ |
| supplier_tax_id | 0145538000833 | **0103558000337** | ✗ |

+ bbox ที่วาด: `bboxes_drawn=20` จาก candidates 22 (`truncated=true` — เพดาน 20 ops ของ node 11)
+ ภาษาไทยใน *ป้ายกำกับ* เพี้ยน (GraphicsMagick ไม่มีฟอนต์ไทย — ตัวเลข/อังกฤษอ่านได้ปกติ)
+ classify รอบนี้ตอบหน้า 1 = `other` (engine ตอบ `tax_invoice`) → flow ใช้ `fallback_used=true`
  (ยังได้หน้า 1 ถูกต้อง แต่ **การเลือกหน้าอ่อนกว่า engine จริง** เพราะ engine มี adjudicate + occurrences voting
  + hi-DPI re-read ซึ่ง flow อธิบายนี้ยังไม่ port)

→ สรุป: ภาพรวมทำงานได้จริงและอธิบายเป็นขั้นได้ แต่ **ความแม่นของฟิลด์ key-field ยังสู.engine ไม่ได้**
และจุดที่ต่างทั้งหมดมองเห็นได้จากใน JSON (`fallback_used`, `truncated`, `classify_mode`)

## 10. Root cause ของ "รันสำเร็จแต่ผลลัพธ์ว่าง" + สิ่งที่แก้ (exec 331 → 332)

**อาการ:** execution 331 สถานะ *success* แต่ `fields` เป็น null ทั้ง 12 ฟิลด์, `bboxes_drawn=0`, ไม่มีรูป — workflow ไม่ error เลย

**หลักฐาน (Phase 1 ของ systematic-debugging — ห้ามเดา):**

| จุดที่วัด | exec 330 (thinking on) | exec 331 (thinking on) |
|---|---|---|
| node 04 classify | `finish_reason="length"`, content คมกลาง JSON: `{"pages":[{"p":1,"t":"tax_invoice","c":"original","n":"T6909/` | เหมือนกัน → parse ไม่ได้ → `missing_in_answer` → `doc_type=other` → `fallback_used=true` |
| node 09 extract | ใช้ไป 7,763 completion tokens (reasoning 6,211 / 8,000) → ฟิลด์เพี้ยนบางส่วน | `finish_reason="length"` และ **`message.content` หายไปทั้งก้อน** (เหลือแต่ `reasoning_content`) → ว่างหมด |

**Root cause (จุดเดียว):** node `03`/`08` ประกอบ request โดย **ไม่ส่ง `chat_template_kwargs:{enable_thinking:false}`**
ซึ่ง engine ส่งทุกครั้งเพราะ `PERCEPTION_THINKING` ค่า default `"0"` (`container.py:53` → `single_pass.py::_ask` → `litellm_client.py:132-133`)
vLLM นับ `reasoning_content` เป็น completion tokens ⇒ มันกินโควตา `max_tokens` แล้วคำตอบถูกตัดกลาง
(ซ้ำเติม: classify ใช้ `160*n+400 = 720` ตาม `single_pass.py:977` ขณะที่สคริปต์ที่เคยทำ reference ใช้ `VLM_MAX_TOKENS_CLASSIFY=8000` + retry บันได `attempt_max_tokens`)

**แก้:** patch node 03+08 ให้ส่ง `chat_template_kwargs:{enable_thinking:false}` ตรงตาม engine (versionName `VLM: ปิด reasoning ให้ตรงกับ engine`)

**ผลวัดจริง exec 332 (success, 12.3 s — จากเดิม 40 s):**

| ตัวชี้วัด | ก่อน (331) | หลัง (332) |
|---|---|---|
| classify หน้า 1 | `other` + `missing_in_answer` → fallback | **`tax_invoice`**, `n="T6909/0093"`, `m="1/1"` — `fallback_used=false` |
| finish_reason | `length` / content หาย | **`stop`**, `reasoning_tokens=0` |
| extract | ฟิลด์ว่าง 0 กล่อง | **21/21 กล่องวาดครบ**, `truncated=false`, รูป 1240×1754 |
| cost | extract 7,763 completion tokens | extract **1,785** completion tokens |
| ตรวจภาพด้วยโปรแกรม | — | clean 480 px vs annotated **68,218 px** ที่ตรง palette (field/line/stamp/table/signature/occurrence) ⇒ วาดจริง |

ไฟล์หลักฐาน: `temp/n8n_run/exec332/{result.json, invoice_p1_clean.png, invoice_p1_annotated.png, summary.json}`
+ ตัว dump: `temp/n8n_run/export_exec.py <mcp-output> <exec_id>`

**สิ่งที่ยังไม่เคลม (ต้องให้ owner เลือก):** 332 เทียบกับ reference `bbox_testing/DMS-23/validation_payload.json` แล้ว
`invoice_num`, `sub_total`, `customer_tax_id` ตรงกัน แต่ **9/12 ฟิลด์ไม่ตรง** (`customer_name`, `supplier_name`, `po_number`, `invoice_date`, `vat`, `grand_total` ...) —
reference นั้นผลิตตอน thinking=on + `max_tokens=8000` (`test_invoice_single_pass.py:563,614`) จึง **ไม่ใช่การเทียบแบบ apples-to-apples**
และเทียบ engine ปัจจุบันไม่ได้เพราะ engine classify พัง (§11) → ต้อง owner ตัดสินว่าจะ ship thinking=off
(เร็ว/ถูก/ตรงกับ `PERCEPTION_THINKING=0` ที่ engine ใช้งานอยู่) หรือ thinking=on + `max_tokens` ใหญ่พอ

## 11. ผลรัน engine จริง = ยืนยันข้อจำกัด gateway (ปิด Task 3)

```
python scripts/run_single_pass.py --doc-ids 23 --out-dir temp/n8n_run/engine_ref
{"doc_id": 23, "status": "ok", "pages": [], "lines": 0, "pages_complete": false, "seconds": 10.5}

extra.selection.classify_failed =
  "AIServiceError: AIBadRequestError: HTTP 400 {"message":"litellm.BadRequestError:
   Hosted_vllmException - At most 1 image(s) may be provided in one prompt ..."
```

⇒ `single_pass.py:977` ยิง classify ทุกหน้าในลูกเดียว → gateway/model serving ตัวปัจจุบันตอบ 400 ทุกครั้ง
และ `except` ที่บรรทัด 979 degrade แบบเงียบเป็น "ทุกหน้า = other, ไม่มีหน้า invoice" → engine **ไม่ได้ฟิลด์อะไรเลย** จาก DMS-23
probe เพิ่มเพื่อบอกขอบเขตที่แท้จริง: 1 ภาพ = 200 · 2 ภาพใน message เดียว = 400 · 2 ภาพคนละ message = **500** ⇒ จำกัดที่ **1 ภาพ/request**

**นัยสำคัญ:** flow อธิบายนี้ (1 หน้า : 1 request) กำลังทำงานได้ *ดีกว่า* engine บน gateway วันนี้ —
เป็น defect ของ engine/`src` ที่ควรแก้แยกเป็นอีกงาน (ไม่ใช่บั๊กของ flow) และมี pattern เดิมใน `src` อยู่แล้วคือ retry บันไดของ
`litellm_client.py:136-160` (repair → ปิด thinking → salvage JSON)
