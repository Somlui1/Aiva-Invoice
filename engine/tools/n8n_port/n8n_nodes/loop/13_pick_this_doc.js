// anchor ของ 1 รอบใน LOOP 1 doc: node 14 ต้องอ่าน json ของ doc "ตัวเดียวกัน" กับที่กำลังวาดรูป
// เหตุผล: 11a/11c เป็น Edit Image ซึ่งเขียน json ของตัวเองทับ item ที่ไหลมา
// และห้ามให้อ้าง $('03 BB Call') ตรง ๆ เพราะ BB Call 1 run มี 5 item (ทั้ง batch) -> .first() จะผิด doc
// LOOP 1 doc คืน item เข้ามาทีละ 1 ตัวเสมอ จึง safe ที่จะใช้ $input.first()
const it = $input.first();
const j = Object.assign({}, it.json);
j.debug_step = '13';
return [{ json: j, binary: it.binary || {} }];
