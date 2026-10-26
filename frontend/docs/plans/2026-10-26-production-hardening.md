# AIVA Portal — Production Hardening (v5.5) & งานต่อ

> **For Antigravity / Pi:** REQUIRED WORKFLOW: `.agent/skills/executing-plans` + `single-flow-task-execution` · ทีละ task · อัปเดต `docs/plans/task.md` ทุกครั้งที่สถานะเปลี่ยน
> **ห้าม** ทำให้ test ผ่านด้วยการผ่อน guard (ลบ `requireAuth` / เปิด header / ใส่ bypass) — ถ้า test ล้มเพราะต้องมี session ให้ใช้ `src/test/helpers/session.ts`

## สถานะ
| Task | สถานะ | เจ้าของ |
|---|---|---|
| H0 ปิดช่องโหว่ auth/session/guard/LDAP/PDF/seed/Docker | ✅ โค้ดเสร็จ (`CHANGELOG-v5.5-security.md`) · รอ H1 | Copilot |
| H1 ตรวจ v5.5 บนเครื่องจริง | ⬜ | agent |
| H2 ทดสอบ AD + Paperless จริง (staging) | ⬜ | agent + IT |
| H3 ย้ายฐานข้อมูล production → SQL Server (container) | ⬜ | agent |
| H4 สถานะเอกสาร · log · สิทธิ์ (ขอบเขตข้อมูล) | ⬜ | ผู้ใช้ (ดูจุดเริ่มด้านล่าง) |
| H5 ปฏิบัติการ (TLS proxy, backup, monitoring, rollback) | ⬜ | agent + IT |

---

## H1 — ตรวจ v5.5 บนเครื่องจริง
1. วางทับ / `git apply` แล้วเพิ่มใน `package.json` → `scripts`:
   `"db:reset": "tsx scripts/db-reset.ts"`, `"check:integrations": "tsx scripts/check-integrations.ts"`
2. `.env` (dev) ตั้ง `AUTH_DEV_LOGIN=true` (ดู `.env.example`) · **อย่า** ตั้ง `ENGINE_INGEST_KEY` / `ORACLE_CALLBACK_KEY` ใน `.env` ของเครื่องที่รัน test (Prisma โหลด `.env` เข้า process.env → test ingest จะได้ 401)
3. `npm run typecheck && npm test` — คาด: เดิม 355 + ใหม่ (`securityCore` 28, `securityRoutes` ~25, ที่แก้เพิ่มใน test เดิม ~8)
   - ตรวจว่า `prisma/dev.db` **ไม่เปลี่ยน** หลังรัน (`Get-FileHash prisma\dev.db` ก่อน/หลัง) — ปิดปัญหา vitest เขียนลง dev.db
   - test ไหนล้ม: รายงานกลับพร้อม error · แก้ได้เฉพาะการเพิ่ม cookie ใน test, ห้ามผ่อน guard
4. `npm run build` แล้ว `npm run preview` → หน้า login ต้อง **ไม่มี** แถบ MOCK และรหัสผ่านผิดต้องไม่ผ่าน (โค้ด MockBar อาจยังอยู่ใน bundle แต่ต้องไม่แสดง — ตัดสินจากหน้าจอ ไม่ใช่จากการ grep)
5. `npm run dev` → login แบบ mock → คิวเอกสารโหลดได้ (มี cookie จาก `/api/auth/dev-login`) · กด Logout แล้ว refresh ต้องกลับหน้า login
6. `npm run db:reset -- --yes --seed temp/paperless_invoices_v5 --admin wajeepradit.p` → คาด `Auto-pass=51 · Manual Review=39 · Review=23 · Hold=12` · ลอง `NODE_ENV=production npm run db:reset -- --yes` ต้องถูกปฏิเสธ
7. ลบ `Dockerfile.frontend` · `docker compose -f docker-compose.prod.yml build` ผ่าน · `docker compose up` **โดยไม่มี .env** ต้องหยุดพร้อมบอกตัวแปรที่ขาด
8. commit `feat(portal): v5.5 production hardening` · ยังไม่ push/tag

## H2 — ทดสอบ AD + Paperless จริง (staging)
**ต้องขอจาก IT ก่อน (agent ทำแทนไม่ได้):**
- [ ] service account อ่านอย่างเดียว เช่น `CN=svc-aiva,OU=ServiceAccounts,DC=aapico,DC=com` (ไม่ใช้ itsupport) + รหัสผ่าน
- [ ] ชื่อ DC ที่เปิด LDAPS 636 + ไฟล์ root CA ของบริษัท (.pem)
- [ ] บัญชีทดสอบใน AD อย่างน้อย 4 บัญชี (EU / ACC / APR / ADM) หรือ OU ทดสอบ + 1 บัญชีที่ถูก disable
- [ ] Paperless: user ที่มีสิทธิ์ **view document อย่างเดียว** + API token · เลข document id ที่มีจริง 1 ฉบับ
- [ ] เครื่อง staging แยกจาก production (DB แยก)

**ขั้นตอน (บนเครื่อง staging, secret อยู่ใน `.env.staging` ที่ไม่ commit):**
```powershell
# 1) ต่อได้จริงไหม (ไม่เขียนอะไร)
$env:NODE_ENV="production"   # ให้ตรวจ config แบบ production ด้วย
npx tsx --env-file=.env.staging scripts/check-integrations.ts --ad-user <บัญชีทดสอบ EU> --dms <paperless id>
# รหัสผ่านผู้ใช้ทดสอบ: ใส่ใน env ชั่วคราว ห้ามใส่ใน argv / ไฟล์
$env:CHECK_AD_PASSWORD="<รหัส>"; npx tsx --env-file=.env.staging scripts/check-integrations.ts --ad-user <บัญชี>; Remove-Item Env:CHECK_AD_PASSWORD
```
เกณฑ์ผ่าน: ทุกแถว PASS ยกเว้นที่ SKIP โดยตั้งใจ · `encrypted (ldaps://)` = PASS · `certificate verified` = PASS · `token is read-only` = PASS · `production settings complete` = PASS

```powershell
# 2) เปิด Portal บน staging (DB แยก)
$env:DATABASE_URL="file:./staging.db"; npx tsx scripts/db-reset.ts --yes --admin <sam ของ ADM ทดสอบ>
npm run build; npm start   # NODE_ENV=production, AUTH_BOOTSTRAP_ADMINS=<sam ADM ทดสอบ>
```
**สถานการณ์ที่ต้องทดสอบด้วยมือ (บันทึกผลลง `docs/plans/task.md`):**
| # | ทำ | คาด |
|---|---|---|
| 1 | login ด้วยบัญชี bootstrap admin | เข้าได้ role SA · มี log `login_ldap` |
| 2 | login บัญชี AD ที่ยังไม่ถูกเพิ่มใน Portal | "ยังไม่ได้รับสิทธิ์" (403) · log `login_noaccess` |
| 3 | admin เพิ่มบัญชีนั้นในหน้าสิทธิ์ (ค้นจาก AD จริง) เป็น EU + receiver | login ใหม่ได้ · เห็นเฉพาะเมนูของ EU |
| 4 | รหัสผิด 5 ครั้ง | ครั้งที่ 6 ขึ้นล็อก + เวลานับถอยหลัง (423) |
| 5 | บัญชีที่ถูก disable ใน AD | เข้าไม่ได้ |
| 6 | admin เปลี่ยน role ผู้ใช้ที่กำลัง login อยู่ | request ถัดไปของผู้ใช้นั้นใช้สิทธิ์ใหม่ทันที |
| 7 | เปิด PDF เอกสารที่มีใน Paperless | header `X-PDF-Source: dms_live` |
| 8 | ปิด Paperless / token ผิด | 502 — **ไม่มี** PDF ปลอม |
| 9 | ingest จาก engine โดยไม่ใส่ key / ใส่ key | 401 / 200 |
| 10 | ส่ง request ปลอม `x-user-id: <admin>` จาก curl | 401 |

## H3 — Production บน SQL Server (container)
Prisma ใช้ provider ตาม schema (ไม่เปลี่ยนตาม env ได้) → ใช้ **2 schema ที่สร้างจากต้นฉบับเดียว**
1. `scripts/gen-sqlserver-schema.ts`: อ่าน `prisma/schema.prisma` → เขียน `prisma/sqlserver/schema.prisma` (provider `sqlserver`) และเติมชนิดคอลัมน์:
   - `@db.NVarChar(Max)`: `Document.payloadJson`, `ValidationRun.rawEngineResult`, `DocumentBBox.boxJson`, `ApBatch.payloadJson`, `AuditLog.detail`, `AuditLog.note`, `AuditLog.reason`, `Document.importError` (Prisma ให้ String = NVARCHAR(1000) — JSON ของ engine ยาวกว่านี้มาก)
   - เงิน: `Float` → `Decimal @db.Decimal(18, 2)` (`grandTotal`, `totalAmount`) — Float ปัดเศษผิดได้ · ปรับโค้ดที่อ่านค่า (Decimal → number) และ test
   - test: สร้าง schema แล้วเทียบว่าไม่ต่างจากไฟล์ที่ commit (กันลืม regenerate)
2. `prisma migrate dev --schema prisma/sqlserver/schema.prisma --name init` กับ SQL Server container บนเครื่อง dev → commit `prisma/sqlserver/migrations/`
3. Dockerfile: `prisma generate --schema prisma/sqlserver/schema.prisma` เมื่อ build arg `DB=sqlserver` · entrypoint ใช้ `migrate deploy --schema …` (โครงมีแล้วใน `docker-entrypoint.sh`)
4. compose: เปิด service `mssql` (มี template แล้ว) · DB user ของแอปมีแค่ `db_datareader`/`db_datawriter` · migration ใช้ user แยก
5. ข้อควรระวัง: SQL Server collation ไม่สนตัวพิมพ์ (SQLite สน) → ตรวจการค้นหา/unique email · ทดสอบ `npm test` กับ SQL Server 1 รอบ (`DATABASE_URL=sqlserver://…`)
6. ย้ายข้อมูลจาก SQLite (ถ้ามีข้อมูลจริงแล้ว): สคริปต์อ่านจาก SQLite → เขียน SQL Server ทีละตาราง + ตรวจจำนวนแถว
7. Backup: job `BACKUP DATABASE aiva TO DISK=…` รายวัน + ส่งออกนอกเครื่อง · ทดสอบ restore 1 ครั้งก่อน go-live

## H4 — งานของผู้ใช้: สถานะเอกสาร · log · สิทธิ์ (จุดเริ่ม)
v5.5 ปิดเรื่อง "ใครเป็นใคร" แล้ว เหลือ "เห็น/ทำอะไรได้" ที่ต้องออกแบบตามกฎธุรกิจ:
- **ขอบเขตเอกสาร (สำคัญที่สุด):** `GET /api/documents`, `GET /api/documents/:id`, PDF — ตอนนี้ผู้ใช้ที่ login แล้ว **ทุกคนเห็นทุกเอกสาร** · ต้องกรองตาม `ROLES[role].scope`: EU = receiver ของตน, ACC/APR = บริษัทของตน, ADM = ไม่เห็นเอกสาร, SA = ทั้งหมด → ทำใน `src/server/portalDocs.ts` (`loadQueueDocs`) + ตรวจซ้ำใน `:id` และ PDF
- **สิทธิ์ action:** `server/routes/documents.ts` ใช้เงื่อนไข role ฝังในโค้ด (EU ห้าม confirm, APR/ADM สำหรับ unconfirm ฯลฯ) ซึ่ง **ไม่ตรง** กับตาราง `ROLES` (เช่น ADM ไม่มี UNCONFIRM ใน ROLES แต่ server อนุญาต · EU ทำ review/hold ได้ที่ server) → ใช้ `hasPermission(role, …)` จาก `src/server/auth/guards.ts` ให้ตรงกับ UI + ตาราง transition เดียว (สถานะต้นทาง × action × สิทธิ์) ใช้ทั้ง UI และ server
- **AP batch:** ตอนนี้ APR หรือ ADM ส่งได้ แต่ ROLES ให้ `POST` เฉพาะ APR/SA · `postMax` (1,000,000) ยังไม่ถูกบังคับที่ server · เอกสารต้องอยู่ในบริษัทของผู้ส่ง
- **Log:** ทุก action / เปลี่ยนสิทธิ์ / ส่ง AP / login มีแล้ว → เพิ่ม: เก็บ IP, ห้าม update/delete ตาราง AuditLog (DB permission บน SQL Server), กำหนดระยะเก็บ, export สำหรับ audit
- **สิทธิ์ผู้ใช้:** การแก้สิทธิ์ตัวเอง (ADM เพิ่ม role ให้ตัวเองเป็น SA) ควรห้าม · ปิด/เปิดบัญชี (`isActive`) จากหน้า RBAC · ทบทวนสิทธิ์รายไตรมาส

## H5 — ปฏิบัติการ
- Reverse proxy (IIS/nginx) ทำ TLS + HSTS · container bind `127.0.0.1:3000` (compose ตั้งแล้ว) · `TRUST_PROXY=1`
- Secret: ไฟล์ `.env` บนเครื่อง production สิทธิ์อ่านเฉพาะ service account · rotate `AUTH_SECRET` (ทุกคน login ใหม่) / `ENGINE_INGEST_KEY` เมื่อคนดูแลเปลี่ยน
- Monitoring: `/api/health` (503 เมื่อ DB ล่ม) · แจ้งเตือนเมื่อ `login_failed` พุ่ง หรือ PDF 502 ต่อเนื่อง
- Rollback: tag image ทุก release (`aiva-portal:5.5.0`) · backup DB ก่อน deploy · ขั้นตอนถอยกลับเขียนไว้ใน runbook
- Engine ต้องส่ง `Authorization: Bearer <ENGINE_INGEST_KEY>` (แก้ฝั่ง engine: ตัวส่งผลไป `PORTAL_CALLBACK_URL`)
