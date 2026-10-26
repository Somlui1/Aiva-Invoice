# Issue — `vitest` เขียนลง `prisma/dev.db` ทั้งที่ออกแบบมาให้ใช้ `prisma/test.db`

**ประเภท:** test harness / data-loss
**พบเมื่อ:** 2026-10-26 ระหว่าง verify แพตช์ engine v5.7 + Portal F1–F10
**กระทบ:** `npm test` หนึ่งครั้งเปลี่ยนฐานข้อมูลพัฒนาจริง (`prisma/dev.db`) — เอกสารของจริงหาย/เพี้ยน โดยไม่มีข้อความใดบอก
**Component:** `frontend/vitest.global-setup.ts`, `frontend/vitest.db-url.ts`, `frontend/src/lib/prisma.ts`, `frontend/.env`

---

## สิ่งที่เกิดขึ้น (ทำซ้ำได้)

1. `cd frontend && npm run seed:v5` → `prisma/dev.db` = 125 documents / 125 validation runs
   (Auto-pass 51 · Manual Review 39 · Review 23 · Hold 12 ตรงกับ `summary.json` ของ Engine)
2. `npm test` (หรือ `vitest run`) รันทั้งชุด
3. `prisma/dev.db` กลายเป็น:

   ```
   Document=127  ValidationRun=124  AuditLog=6  User=2  UserCompany=5  ApBatch=1
   สถานะ: Auto-pass 52 · Manual Review 38 · Review 23 · Hold 12 · Import Failed 1 · Posted 1
   ```

   มีแถวของเทสต์ปนเข้ามา (`DMS-15`, `DMS-19`, …) และเอกสารจริงบางใบถูกเปลี่ยนสถานะเป็น `Posted` / `Import Failed`
   ส่วน `prisma/test.db` ที่ควรเป็นเป้าหมายกลับว่างเปล่า (`Document=0`)

## ที่ควรจะเป็น

`vitest.db-url.ts` เขียนไว้ชัดเจนว่า “Keeping tests off `dev.db` … every run starts from a known-empty schema”
และ `vitest.global-setup.ts` ส่ง `DATABASE_URL=file:./test.db` ให้ `prisma db push --force-reset` —
ทุกเทสต์ต้องอ่าน/เขียนเฉพาะ `prisma/test.db` และ `dev.db` ไม่ถูกแตะเลย

## สาเหตุที่สังเกตได้

* `Prisma 6` + `.env` ที่มี `DATABASE_URL="file:./dev.db"`: เมื่อเรียก CLI แบบ
  `execFileSync(node, ['…/prisma', 'db', 'push', '--force-reset'], { env: { ...process.env, DATABASE_URL: 'file:./test.db' } })`
  ค่าจาก `.env` เป็นฝ่ายชนะ `env` ที่ส่งเข้า process ⇒ `--force-reset` ไปลงที่ **`dev.db`**
  (พิสูจน์โดย: รันคำสั่งนี้มือเปล่าแล้ว `dev.db` ยุบจาก 19 MB → 254 KB ส่วน `test.db` ไม่เปลี่ยน)
* ฝั่ง runtime: `getDatasourceUrl()` ใน `src/lib/prisma.ts` คืน `file:./test.db` แบบสัมพัทธ์ตามสภาพ
  แต่มี fallback ที่ชี้ `prisma/dev.db` ตรง ๆ เมื่อหาไฟล์จาก CWD ไม่เจอ ⇒ path สัมพัทธ์ + fallback
  ทำให้ “ไฟล์ไหนถูกใช้จริง” ไม่แน่นอนระหว่าง worker
* ผลคือ global setup reset คนละไฟล์กับที่เทสต์บางส่วนเขียน ⇒ ทั้งข้อมูลเทสต์เลอะ `dev.db`
  และเทสต์ที่อ่อนไหวต่อลำดับ (`ingestApi.test.ts`) ล้มแบบ false negative เมื่อ `test.db` ค้างจากครั้งก่อน

## วิธีพิสูจน์เร็ว

```bash
cd frontend
npm run seed:v5
md5sum prisma/dev.db prisma/test.db
npx vitest run src/test/productionSchema.test.ts src/test/ingestApi.test.ts
md5sum prisma/dev.db prisma/test.db   # dev.db เปลี่ยน, test.db still 0 rows
```

## ทางแก้ที่แนะนำ (เลือกอย่างใดอย่างหนึ่ง + เพิ่ม guard)

1. **ทำให้ URL เป็น absolute ตั้งแต่ต้นทาง** — `TEST_DATABASE_URL = pathToFileURL(path.resolve(__dirname,'prisma/test.db')).href`
   แล้วส่งให้ทั้ง global setup และ setup file (ตัดปัญหา path สัมพัทธ์ทั้งสองทาง)
2. **ตัด `.env` ออกจากสมการ** — ย้ายค่า default ไป `prisma.config.ts` / หรือใช้ `--schema` แยกไฟล์
   `prisma/schema.test.prisma` datasource ชี้ `test.db` แล้วให้ global setup ใช้ schema นั้น
3. **เพิ่ม guard ใน CI** — global setup จด `sha256(prisma/dev.db)` ก่อนรัน และ assert หลังรันว่าไม่เปลี่ยน
   (กันการถอยหลังแบบเดียวกับที่เพิ่งเกิด)
4. `getDatasourceUrl()` ไม่ควร fallback ไป `prisma/dev.db` เมื่อ `DATABASE_URL` ถูกตั้งไว้ชัดเจน
   (ตอนนี้ตั้งไว้แล้วยังถูก override ได้)

## งานปัจจุบันที่ต้องทำต่อ

* `prisma/dev.db` ถูกลบ/สร้างใหม่ด้วย `npm run seed:v5` ทุกครั้งก่อนทำการตรวจสอบ (backup ไว้ก่อนรัน `npm test`)
* เทสต์ใหม่ `src/test/dockKeyboardScroll.test.tsx` และเทสต์อื่นที่ไม่ใช้ DB ไม่กระทบ — แต่ **ห้าม** ใช้
  `dev.db` ที่ผ่าน `npm test` แล้วเป็นฐานดูหน้าจอ (ต้องมี DB แยก)
