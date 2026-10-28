// แปลงรายการเอกสารจาก Paperless เป็น item เล็ก ๆ { doc_id, title } ที่ loop กินได้
// บทเรียนรันจริง: Paperless node (resource=document, operation=list) ไม่ได้คืน 1 item/เอกสาร
// แต่คืน "pagination ทั้งก้อนเป็น item เดียว" -> { count, next, previous, all:[id...], results:[{id,...}] }
// จึงต้องคลี่ array ใต้ results/documents/data/items/docs ก่อน แล้วค่อยหา id (และกัน id ซ้ำจาก all+results)
const ARR_KEYS = ['results', 'documents', 'data', 'items', 'docs'];

function pickArray(j) {
  for (const k of ARR_KEYS) if (Array.isArray(j[k])) return j[k];
  return null;
}

function idOf(row) {
  if (row === null || row === undefined) return undefined;
  if (typeof row === 'number' || typeof row === 'string') return row;      // some builds return bare ids
  if (row.id !== undefined) return row.id;
  if (row.document && row.document.id !== undefined) return row.document.id;
  if (row.document_id !== undefined) return row.document_id;
  return undefined;
}

const out = [];
const seen = new Set();
let itemsIn = 0;
let pagesLeft = 0;
const keysSeen = [];

for (const it of $input.all()) {
  const j = it.json || {};
  itemsIn++;
  keysSeen.push(Object.keys(j).join('|'));
  if (j.next) pagesLeft++;                                                 // ยังเหลือหน้า ⇒ returnAll ไม่ทำงาน
  const arr = pickArray(j);
  const rows = arr || [j];                                                 // หรือ node คืนแบบ 1 item/เอกสาร
  for (const row of rows) {
    const id = idOf(row);
    if (id === undefined || id === null || id === '') continue;
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    const r = (row && typeof row === 'object') ? row : {};
    out.push({ json: { doc_id: key, title: r.title || r.title_or_file_name || r.file_name || '', tags: r.tags || [] } });
  }
}

if (!out.length) {
  throw new Error('ไม่พบ doc_id จาก Paperless (item เข้า=' + itemsIn +
    ', key ที่เห็น=' + keysSeen.slice(0, 3).join(' ;; ') + ')');
}
if (pagesLeft) console.warn('คำเตือน: Paperless ยัง มีหน้าถัดไป (next != null) อีก ' + pagesLeft +
  ' ก้อน = returnAll ไม่ครบ ให้เช็ก page size ของ node 01b');
console.log('พบเอกสารติด tag invoice =', out.length, 'ฉบับ');
return out;
