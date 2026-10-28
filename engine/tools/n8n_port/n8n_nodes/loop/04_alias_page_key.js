// blackbox คืนหน้าสะอาดมาในคีย์ page_original แต่ 11a ของเดิมอ่านคีย์ page -> ทำ alias ที่นี่
// แก้จากเวอร์ชันแรก: BB Call คืนหลาย item ต่อ 1 batch (5 doc) จึงต้อง map ทุก item ไม่ใช่ $input.first()
// และทำแบบอดทน: doc ที่ blackbox พัง (onError=continue) จะได้ bb_ok=false ให้ If กันออกก่อนถึง Edit Image
// บทเรียนรันจริง: If v2.2 + typeValidation=strict ปฏิเสธ operator {type:'boolean',operation:'true'}
// เพราะ rightValue ว่างถูกตรวจเป็น boolean -> "Wrong type: '' is a string but was expecting a boolean"
// จึงส่ง bb_status เป็น "string" ('ok'/'skip') ให้ If เทียบ equals ซึ่งไม่พังแม้ key ขาด ('' !== 'ok')
return $input.all().map((it) => {
  const bin = it.binary || {};
  const ok = !!bin.page_original;
  const j = Object.assign({}, it.json);
  j.bb_ok = ok;
  j.bb_status = ok ? 'ok' : 'skip';
  if (!ok) {
    j.bb_skip_reason = j.error
      ? String(j.error).slice(0, 300)
      : 'ไม่มี binary.page_original (คีย์ที่มี: ' + Object.keys(bin).join(',') + ')';
  }
  return { json: j, binary: ok ? Object.assign({}, bin, { page: bin.page_original }) : bin };
});
