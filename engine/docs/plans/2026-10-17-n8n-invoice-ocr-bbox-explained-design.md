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

## 12. Task 6 + การวัด "flow == engine 5.5?" (ทำต่อ 2026-10-19, session นี้)

### 12.1 ground truth ที่ไม่ใช่ VLM (ปิดช่องที่ §9/§10 เทียบกับ "reference" อย่างเดียว)

ปัญหาของ §9/§10: ทุกผู้อ่านภาพหน้า DMS-23 คือ **โมเดลตัวเดียวกัน** (`nvidia/Qwen3.8-Flash-Next` บน gateway
`10.10.3.112:4000`) ทั้ง engine, flow และ vision MCP — การอ่านของโมเดลจึงตัดสินการอ่านของโมเดลเองไม่ได้
(พิสูจน์แล้ว: ให้ vision MCP อ่าน `exec334/invoice_p1_clean.png` แบบ verbatim ได้ `ผู้ขาย = บริษัท โปรเส้นสาย`,
`ผู้ซื้อ = บริษัท ฮาโก้ โฮม`, `Grand Total 4,723.55`, `รหัสสินค้า 8888888888888` ซึ่ง **ผิดทั้งหมด** ทั้งที่อ่านด้วย
thinking=on และ 300 DPI crops) → ห้ามใช้ VLM เป็นพยาน

พยานที่ Independence จริง = **OCR ของ Paperless-ngx เอง** (tesseract eng+tha, ผูกกับไฟล์จริง, เราไม่ได้สร้าง)
`GET /api/documents/23/ -> content` — ตัว PDF เองไม่มี text layer (R3-4 วัดแล้วว่า `get_text()` = 0 ตัวอักษร)
เครื่องมือ: `temp/n8n_run/gt_paperless.py` (ดึง+เซฟ) และ `temp/n8n_run/gt_score.py` (ให้คะแนนทุก producer
กับของจริง โดย **ตรวจว่าคำอ้างอิงที่อ้าง อยู่ในไฟล์ OCR จริง** ถ้าไม่อยู่ = ออก 1 ห้ามใช้ต่อ)

| ฟิลด์ | สิ่งที่พิมพ์จริง (อ้างจาก OCR) | ที่มา |
|---|---|---|
| supplier_name | บริษัท ที.เอ็น.สตีล จำกัด | `T.N.STEEL CO.,LTD. (HEAD OFFICE)` |
| supplier_tax_id | 0145538000833 | `เลขประจําตัวผู้เสียภาษี : 0145538000833 (สํานักงานใหญ่)` |
| customer_name | บริษัท อาปิโก ไฮเทค ทูลลิ่ง จำกัดฯ | `AAPICO HITECH TOOLING COMPANY LIMITED` |
| customer_tax_id | 0145548001557 | หน้าที่ 2 (PO): `TAX 1D : 0-1455-48001-55-7` |
| invoice_num | T6909/0093 | `เลียวหก a a T6909, /0093` |
| invoice_date | 03/09/2569 | `โรนต่ 03/09/2569 9:43:19` · **02/11/2569 คือ "กําหนดชําระ/Due Date"** |
| po_number | PO42052739 | `หนมายเหตุ: PO42052739` + PO พิมพ์ `42052739` |
| sub_total / vat / grand_total | 2,265.00 / 158.55 / 2,423.55 | 2,265×7% = 158.55 · ผลบวก = 2,423.55 · PO เขียนตัวอักษร `TWO THOUSAND FOUR HUNDRED … AND 55/100` |
| แถวรายการ | 0800105003216 / เหล็กท่อกลมดำ 2"×3.2 มม.ชมพู / 3.00 × 755.00 = 2,265.00 | OCR บรรทัดตาราง + PO `STEEL PIPE … 755.00` |

⇒ **reference Oct-12 ถูก 10/11** (พลาด `customer_name` ตัวเดียว: พิมพ์ `พูลทิง` แทน `ทูลลิ่ง`)
⇒ **flow (thinking=off) ถูก 2–5/11 ทุกครั้ง** — พังคงที่คือ `po_number` (หยิบ timestamp `03/09/2569 9:43:19`),
`invoice_date` (หยิบ Due Date), `supplier_tax_id`, `customer_name`/`customer_address` (ประดิษฐ์ชื่อไทยใหม่
ไม่ซ้ำกันในแต่ละรัน: อารียา โฮเทล / อมรินทร์ โฮมมาร์ท / อมรชัย โกลด์ / ฮาโก้ อินดัสทรี)

**ข้อจำกัดที่ต้องบันทึกไว้ด้วย: reference Oct-12 ไม่ใช่ output ของ engine 5.5** — ผลิตด้วย prompt ก่อน 1.4.0
(ไม่มี label ladder / กฎกันสับสนฝ่ายของ 1.5.0–1.6.0) และ engine 5.5 วันนี้รันไม่ได้เพราะ classify ยิงทุกหน้า
ในลูกเดียว (§11) ⇒ **ตอนนี้ยังไม่มีใครวัด "flow vs engine 5.5" ได้จริง** สิ่งเดียวที่วัดได้คือ *flow vs สิ่งที่
กระดาษพิมพ์* และตัวเลขข้างบนคือคำตอบนั้น

### 12.2 Task 6: `enable_thinking` เข้า node + root cause ที่ MCP โกหกว่าแก้สำเร็จ

`setNodeParameter` path `/parameters/jsCode` **ไม่ได้เขียนทับ** `parameters.jsCode` — มันสร้าง key ซ้อน
`parameters.parameters.jsCode` แล้วปล่อย jsCode ตัวจริง **เหมือนเดิมทุกตัวอักษร** (sha256 `38cec399…` ทั้งก่อน
และหลัง) แต่ API ตอบ `appliedOperations: 2` และ version diff ลงท้ายว่าเป็น `parameters__added`
⇒ execution **335–338 รันโค้ดเดิมทั้ง 4 รอบ** (ตรวจจาก output ของ node 03/08 ที่ไม่มี key `thinking`/
`max_tokens_used` และ llmBody still `enable_thinking:false`) — ตอนแรกเข้าใจผิดว่า "n8n ใช้ snapshot ค้าง"
กว่าจะจับได้เพราะอ่าน `parameters` กลับมาดู (บทเรียน: **ห้ามเชื่อ flag ของ write, ต้อง read back**)
แก้ด้วย `updateNodeParameters` + `replace:true` (ลบ key ที่เกินมาออกด้วย) — n8n เติม `\n` ท้ายโค้ด 1 ตัว ไม่มีผล

knob อ่านค่า 2 ทาง (node 03/08): `body.enable_thinking` จาก Webhook (ใช้ตอน A/B) → fallback `cfg.enable_thinking`
จาก node 00 เหตุผลที่ไม่ใส่เข้า node 00 ให้เสร็จ: Set node แทรก array element ผ่าน MCP ไม่ได้ (Task 6 เดิม)
และเขียนทับทั้งก้อน = ต้อง paste prompt 9,301 ตัวอักษรผ่าน MCP = เสี่ยง prompt เพี้ยน
**และบทเรียนเพิ่ม (exec 336):** `cfg.body` เป็น `undefined` เสมอ เพราะ node 00 ตั้ง `includeOtherFields=false`
→ ต้องอ่านจาก node Webhook ตรง ๆ ไม่งั้น knob ไม่ทำงานเงียบ ๆ (`reasoning_tokens=0`)
เจ้าของยังเพิ่ม entry `enable_thinking` ใน node 00 ได้เองใน UI — โค้ดรองรับอยู่แล้ว

ตรวจว่าการเขียนครั้งนี้ตรงเป้าจริง: jsCode ที่ store = ที่ build จาก `temp/n8n_run/build_ops_v2.py` ต่างกันแค่
newline ท้ายไฟล์ และ **prompt ใน node 00 ยังเป็น byte เดิม** (`prompt_classify` sha `50404699…` = ไฟล์ใน repo
ส่วน `prompt_extract` sha `9aa745df…` ≠ `34ac2fc3…` เพราะ **ขาด newline 1 ตัวที่ offset 7565** — deviation
ที่มีมาก่อน session นี้ และยังไม่แก้เพราะต้อง paste 9.3 KB (เจ้าของวางจาก UI ได้เลย)

### 12.3 ผล A/B ของ thinking บน DMS-23 (วัดจริง ไม่ใช่เดา)

| arm | exec | ถูกเทียบกระดาษ | tokens | reasoning | เวลา |
|---|---|---|---|---|---|
| thinking=off (default = engine) | 332,333,334,335,336,337,338,340 | 2–5/11 (ค่ากลาง 3) | 4,904–5,799 | 0 | 12–14 s |
| thinking=on (8,000 classify / 16,000 extract) | 339 | 5/11 | 8,457 | 2,052 | 27.6 s |
| engine reference (Oct-12, prompt เก่า) | — | 10/11 | — | — | 15.8 s |

อ่านอย่างซื่อสัตย์: **ยังสรุปว่า thinking=on ดีกว่าไม่ได้** — on arm มี 1 รัน และ off arm แกว่ง 2→5/11
(exec340 ได้ 5/11 เท่ากัน) คือใน spread เดิม สิ่งเดียวที่ *เอนเอียงชัด* คือ `invoice_date`: off พลาด 8/8
(หยิบ Due Date) ส่วน on ได้เลขถูก 1/1 — ต้อง n≥5 ต่อ arm ถึงจะพูดได้ และ thinking=on **จ่ายเพิ่มแน่นอน**
คือ +46% completion tokens และ ~2× เวลา ส่วนฟิลด์ชื่อไทยประดิษฐ์ใหม่ **พังเท่ากันทั้งสอง arm** —
นี่คือสิ่งที่ engine มีแต่ flow ไม่มี (occurrences voting, corroborate_arithmetic, `normalize.tax_id()`
+ Thai checksum, `format_warnings`, retry 300 DPI, adjudicate) ไม่ใช่เรื่อง thinking
