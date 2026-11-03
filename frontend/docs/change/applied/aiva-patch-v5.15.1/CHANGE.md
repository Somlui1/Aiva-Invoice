## 5.15.1 — EU KPI cards ปรับลำดับ/คำอธิบาย · ตัวเลือก Receiver ค้นหาได้ · Engine watchdog & log (2026-11-03)

### เปลี่ยนอะไร
- **EU KPI cards (QueueKpiCards)**: ปรับการ์ดสรุปของ End User ให้สอดคล้องกับขั้นตอนการทำงาน (ทั้งหมด · ต้องดำเนินการ · Review · Hold · ผ่านอัตโนมัติ · ส่งบัญชีแล้ว) พร้อมคำอธิบายย่อยใต้ตัวเลข, เน้นการ์ดที่ต้องทำรายการ (accent), และคำนวณอายุเอกสารเทียบกับเวลาปัจจุบัน (`now`) แทนวันที่ mock เดิม
- **ตัวเลือก Receiver สำหรับ EU (ReceiverPicker)**: กรณีผู้ใช้งานผูก Oracle account มากกว่า 3 บัญชี จะเปลี่ยนเป็นปุ่มพร้อมป๊อปอัปค้นหาได้ (`ReceiverPicker.tsx`) แสดงจำนวนเอกสารต่อบัญชี แทนการแสดงชิปยาว
- **การ์ดส่งบัญชีแล้ว (EU AP Flow)**: เพิ่มการแสดงผลเอกสารสถานะ Confirmed / Sent / Posted ในมุมมองอ่านอย่างเดียว (read-only) สำหรับ EU
- **Engine Logging & Watchdog (`engine/`, `docker-compose.yml`)**:
  - เพิ่มระบบ Watchdog ตรวจจับ worker loop ค้าง และ exit process เพื่อให้ Docker restart อัตโนมัติ (`DOC_STAGE_TIMEOUT_SECONDS`, `WATCHDOG_STALL_SECONDS`)
  - Healthcheck `/health/live` ส่งกลับ 503 เมื่อ worker loop ไม่ตอบสนอง
  - ปรับระบบ Logging ให้เป็นระเบียบ อ่านง่ายใน `docker compose logs -f engine` และกรอง log noise จาก healthcheck probe
- **English Translations**: เพิ่มคำแปลภาษาอังกฤษของข้อความ UI ใหม่ใน `i18n-en-extra.json`

### ผลต่อผู้ใช้ / การ deploy
- ไม่มีการเปลี่ยนฐานข้อมูล (`db: false`)
- มีการปรับปรุง config ใน `docker-compose.yml` และ `engine/.env.example`

### รอตัดสินใจ
- (ไม่มี)
