const cfg = $('00 CONFIG (single point)').first().json;
const sel = $('05 Parse classify pick invoice pages').first().json;
const s10 = $('10 Bbox math pixels + sanitize').first().json;
const u1 = ($('04 VLM step 1 classify pages').first().json.usage || {});
const u2 = ($('09 VLM step 2 extract bbox').first().json.usage || {});
const clean = await this.helpers.getBinaryDataBuffer(0, 'page');
// ใน blackbox: 11a-11c ย้ายไป parent แล้ว -> ไม่มี 'annotated' ที่นี่ จึงทำให้เป็น optional
let annotated = null;
try { annotated = await this.helpers.getBinaryDataBuffer(0, 'annotated'); } catch (e) { annotated = null; }
const NE = { status: 'not_evaluated', why: 'ขั้นนี้อยู่นอก scope ของ flow อธิบายนี้ (ทำเฉพาะ OCR) - ต่อกับ engine /v1/validations หรือ port เพิ่มได้ โดย envelope เดิมใช้ได้ทันที' };
const result = {
  contract: { name: 'aiva.system_a.result', version: '3.0', coordinate_system: 'normalized [0..1] ของหน้าที่หมุนตั้งแล้ว' },
  request: { validation_id: 'N8N-' + cfg.doc_id, correlation_id: 'n8n-' + String($execution.id), source: 'n8n explanatory flow (OCR only)', schema: 'schemas/result-3.0.schema.json' },
  versions: { engine: 'n8n-mirror-of-single-pass/1.4.0', prompt_classify: 'single-pass-classify@1.3.0', prompt_extract: 'single-pass-extract@1.6.0', standard: cfg.standard, ruleset: cfg.standard + ' (not evaluated)' },
  package: { source: 'paperless', dms_doc_id: String(cfg.doc_id), file_name: 'dms_' + cfg.doc_id + '.pdf' },
  pages: [{ page_no: sel.invoice_page, image_kind: 'primary', width_px: s10.img_w, height_px: s10.img_h, rotation: sel.rotate_degrees }],
  documents: [{ doc_no_hint: sel.doc_no_hint, doc_type: sel.doc_type, is_original: sel.is_original, multi_invoice_detected: sel.multi_invoice_detected, selected_invoice_pages: sel.selected_invoice_pages, pages_complete: sel.pages_complete, selection: sel.selection, pages_classification: sel.pages_classification }],
  ocr: { engine: 'litellm-vlm-n8n', elements: s10.elements },
  extraction: { fields: s10.fields, occurrences: s10.occurrences, line_items: s10.line_items, regions: s10.regions, handwritten_refs: s10.handwritten_refs, dropped_boxes: s10.dropped_boxes, answer_parse_error: s10.answer_parse_error, fallback_used: sel.fallback_used, fallback_note: sel.fallback_used ? 'classify ไม่พบหน้า invoice -> demo ใช้หน้า 1 (engine จริงจะไม่อ่านเลย)' : null },
  normalized_fields: NE, oracle_snapshot: NE, line_matching: NE, rule_results: NE, evidence: NE, exceptions: NE, recommendation: NE,
  metrics: { vision_calls: sel.classify_calls + 1, classify_calls: sel.classify_calls, classify_mode: '1 หน้า : 1 request (gateway จำกัด 1 ภาพ/request - engine จริงยิงทุกหน้าในลูกเดียว)', extract_mode: '1 image/request (เหมือน engine)', model: cfg.model, dpi_classify: cfg.dpi_classify, dpi_extract: cfg.dpi_extract, total_pages: sel.total_pages, bboxes_drawn: s10.bboxes_drawn, boxes_candidates: s10.boxes_candidates, truncated: s10.truncated, cells_in_json_not_drawn: true, box_rings: 1, rotation_mode: 'n8n-editImage-rotate', token_usage: { classify: u1, extract: u2 } },
  integrity: { note: 'flow อธิบายนี้ไม่มี sha256 / timing_hmac - engine เป็นคนคำนวณ (api/security.py)' }
};
const steps = [
  { step: '1', node: 'Get a document', does: 'ดาวน์โหลด PDF ของเอกสาร DMS ที่เลือก (Paperless node - เดิมคือ 01 Paperless download PDF)', src: 'adapters/paperless/reader.py::download' },
  { step: '2', node: '02 PDF to JPEG 80 DPI (classify)', does: 'แตกทุกหน้าเป็นภาพ 80 DPI สำหรับจำแนก', src: 'perception/single_pass.py::_render' },
  { step: '3', node: '03 Build classify request', does: 'ประกอบ request แบบ layout v3 (ภาพก่อน prompt สุดท้าย ไม่มี system) - แยก 1 หน้า/1 request เพราะ gateway จำกัด 1 ภาพ', src: 'perception/single_pass.py::_ask' },
  { step: '4', node: '04 VLM step 1 classify pages', does: 'โมเดลจำแนกหน้า + มุมหมุน + เลขเอกสาร + marker หน้า', src: 'config/prompts/single_pass_classify.md (1.3.0)' },
  { step: '5', node: '05 Parse classify pick invoice pages', does: 'รวมคำตอบทุกหน้า แล้วเลือกเฉพาะหน้า Invoice (ทิ้ง reprint / sheet สำเนา / คนละเลขเอกสาร, เช็ค pages_complete)', src: 'single_pass.py::normalize_classify + select_invoice_pages' },
  { step: '6', node: '06 PDF to JPEG 150 DPI', does: 'แตก PDF ซ้ำที่ 150 DPI เพื่อ OCR จริง', src: 'container.py::Settings (RENDER_DPI=150)' },
  { step: '7', node: '07 Rotate invoice page upright', does: 'เลือกหน้า Invoice ใบเดียว + หมุนให้ตั้งก่อนส่งโมเดล', src: 'perception/coords.py::rotate_image_for_vlm' },
  { step: '8', node: '08 Build extract request', does: 'ส่งภาพใบเดียว + prompt extract + วัดขนาดภาพจริงเพื่อแปลง bbox', src: 'single_pass.py::_ask + prompt {page_no}' },
  { step: '9', node: '09 VLM step 2 extract bbox', does: 'OCR ฟิลด์/occurrences/line_items/regions ทุกค่ามี bbox 0..1000', src: 'config/prompts/single_pass_extract.md (1.6.0) + coord_mode norm1000' },
  { step: '10', node: '10 Bbox math pixels + sanitize', does: 'bbox -> พิกเซลจริง, clip/ทิ้งกล่องเสีย, ตรวจ line_bbox ต้องเป็นแถวนอน, สร้าง ocr.elements[]', src: 'coords.py::xyxy_px + validate_line_bbox + domain/standard.py::extract_vlm' },
  { step: '11', node: '11 Draw bbox overlay', does: 'วาดกรอบ + ป้ายชื่อ = รูปแบบ bbox_testing/DMS-23/invoice_p1.png (ส่งออก JPEG q85)', src: 'scripts/run_single_pass.py::overlay (PIL -> jimp)' },
  { step: '12', node: '12 Build final JSON + images', does: 'ประกอบ envelope result/3.0 (ส่วนที่ไม่ทำ = not_evaluated) + ส่ง 2 รูปเป็น binary ไม่ embed base64', src: 'application/assembler.py + schemas/result-3.0.schema.json' }
];
const pageOriginal = await this.helpers.prepareBinaryData(clean, 'invoice_p' + sel.invoice_page + '.png', 'image/png');
const pageAnnotated = annotated ? await this.helpers.prepareBinaryData(annotated, 'invoice_p' + sel.invoice_page + '_annotated.jpg', 'image/jpeg') : null;
return [{ json: { ok: true, doc_id: cfg.doc_id, steps: steps, result: result, images: { invoice_page: sel.invoice_page, overlay: s10.overlay || [], img_w: s10.img_w, img_h: s10.img_h, original_binary_key: 'page_original', original_bytes: clean.length, original_mime: 'image/png', annotated_binary_key: 'annotated', annotated_bytes: annotated ? annotated.length : null, annotated_mime: 'image/jpeg', note: 'รูป 2 ไฟล์ออกมาเป็น binary เท่านั้น ไม่ได้ embed base64 ใน JSON (เดิม 8.4 MB ทำให้ browser ค้าง) - ถ้าต้องการ base64 ให้ต่อ node Extract from File (binaryToPropery) ที่ปลายทาง' } }, binary: pageAnnotated ? { page_original: pageOriginal, annotated: pageAnnotated } : { page_original: pageOriginal } }];