# AIVA v5.2 React + Vite

## สถานะการแปลง: Hybrid migration

โปรเจกต์นี้ใช้ React จริงสำหรับ App, AppShell, SplashScreen, ModalHost และ ToastHost ไม่ใช้ iframe และไม่โหลด HTML ต้นฉบับทั้งไฟล์มาแสดงแทน React

**ยังไม่ใช่การ rewrite ทุกหน้าจอเป็น React แบบสมบูรณ์** หน้าคิว รายละเอียดเอกสาร PDF, permission console, login, simulator และ state/business logic เดิมยังทำงานผ่าน imperative DOM runtime ใน `src/runtime/` รวมถึง innerHTML, global state และ inline handlers ของหน้าจอ dynamic

จุดประสงค์คือให้ต้นฉบับทำงานในโครงสร้าง React + Vite โดยลดการเปลี่ยนพฤติกรรมระหว่างย้าย ไม่ได้ยืนยันว่าเทียบเท่าทุก workflow หรือพร้อม production

## เริ่มใช้งาน

ใช้ Node.js 22.12 ขึ้นไป (ทดสอบ build ด้วย Node.js 24)

```bash
npm ci
npm run dev
```

ใช้ URL ที่ Vite แสดงใน terminal ต้องเปิดผ่าน HTTP server ไม่ใช่ดับเบิลคลิก index.html

## Build

```bash
npm run build
npm run preview
```

มี `dist/` ที่ build แล้วใน ZIP สามารถนำทั้งโฟลเดอร์ไปเสิร์ฟด้วย static web server ได้

## โครงสร้าง

- `src/main.jsx`: React entry point
- `src/App.jsx`: ประกอบ component และ initialize runtime ครั้งเดียว
- `src/components/`: JSX shell components
- `src/runtime/bridge.js`: เชื่อม event จาก JSX และลำดับเริ่มระบบ
- `src/runtime/core.js`: master data, workflow, queue, PDF, simulator และ logic เดิม
- `src/runtime/permissions.js`: permission console เดิม
- `src/runtime/login.js`: mock login เดิม
- `src/runtime/effects.js`: effects และ command palette เดิม
- `src/runtime/icons.js`: icon registry เดิม
- `public/styles/`: CSS ต้นฉบับ แยกไฟล์และรักษาลำดับ รวมถึง data-t สำหรับ Dark/Light
- `src/styles/manifest.json`: mapping attribute ของ stylesheet ต้นฉบับ
- `reference/`: HTML ต้นฉบับสำหรับเทียบ
- `tests/smoke-results.json`: ผลตรวจเบื้องต้นของ production build

## ผลตรวจ

- Build ผ่าน มี warning เรื่อง JavaScript bundle ขนาดใหญ่
- Browser smoke test ผ่าน 35 checks: เริ่มระบบ, สลับ mock user 4 บทบาท, เปิดเมนูที่เข้าถึงได้, สลับธีม และจำธีมหลัง reload
- ไม่พบ uncaught JavaScript error ใน smoke test ชุดนี้
- ไม่ใช่การตรวจครบทุกปุ่ม ทุก validation หรือทุก workflow
- ยังไม่ได้ยืนยัน pixel-perfect, responsive ทุกขนาด, print/PDF export หรือ regression ทุกกรณี
- เครื่องทดสอบไม่มีฟอนต์ไทยและโหลด Google Fonts ไม่ได้ จึงไม่ได้ยืนยัน typography จากภาพหน้าจอ

## ข้อจำกัดสำคัญ

1. ยังเป็น mock prototype เช่นต้นฉบับ ไม่ได้เพิ่ม backend หรือเชื่อม LDAP, Microsoft 365, Oracle, OCR หรือ DMS จริง
2. Google Fonts ยังเป็น external dependency เช่นต้นฉบับ
3. ไม่เปิด React StrictMode เพราะ runtime มี side effects ที่ต้อง initialize ครั้งเดียว
4. ห้ามให้ React render ทับ dynamic DOM ภายใน `#app` ขณะยังใช้ runtime นี้
5. Runtime ยังเผยแพร่ global bindings เพื่อให้ inline event handlers เดิมทำงาน จึงยังไม่เหมาะกับ strict CSP โดยไม่ refactor เพิ่ม
6. การย้ายเป็น idiomatic React เต็มรูปแบบยังต้องย้ายแต่ละหน้าและ state ไป component/hooks พร้อม regression test
7. ข้อมูลจำลองและ business rules เดิมถูกเก็บไว้ ไม่ได้ยืนยันความถูกต้องทางบัญชีหรือสิทธิ์สำหรับ production

## แนวทาง refactor ต่อ

ย้าย Queue → Detail/PDF → Simulator → Permission/Login เป็น React components ทีละขอบเขต แล้วเลิกใช้ DOM renderer และ global bridge ของขอบเขตนั้น ห้ามให้สอง renderer จัดการ DOM ชุดเดียวกัน
