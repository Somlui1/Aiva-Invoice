// Debug group (11a-11c) เป็น Edit Image ซึ่งเขียน json ทับผลที่ไหลมา จึงประกอบกลับที่นี่
// รอบนี้มี loop หลาย doc => ห้ามอ่าน $('03 BB Call') เพราะ 1 run มี 5 item (.first() จะผิด doc)
// ให้อ่าน anchor '13 Pick this doc' ซึ่งเป็น run ของ doc นี้เอง (LOOP 1 doc ป้อนทีละ 1 item)
const src = $('13 Pick this doc (code)').first();
const cur = $input.first();
const srcBin = (src && src.binary) || {};
const curBin = cur.binary || {};
if (!srcBin.page_original) {
  throw new Error('ไม่มี binary.page_original ของ doc ' + ((src && src.json && src.json.doc_id) || '?') + ' คีย์ที่มี: ' + Object.keys(srcBin).join(','));
}
if (!curBin.annotated) throw new Error('11c ไม่คืน binary.annotated, คีย์ที่มี: ' + Object.keys(curBin).join(','));
let draw = null;
try { draw = $('11b Draw bbox outlines (code)').first().json || null; } catch (e) { draw = null; }
return [{
  json: Object.assign({}, src.json, { bbox_debug: draw }),
  binary: { page_original: srcBin.page_original, annotated: curBin.annotated }
}];
