# AIVA Portal v5.5 — ความปลอดภัยก่อนขึ้น production

**แผน / งานต่อ:** `docs/plans/2026-10-26-production-hardening.md`
**ผลกระทบกับผู้ใช้:** ทุกคนต้อง login ใหม่ 1 ครั้งหลังอัปเดต (cookie แบบเดิมใช้ไม่ได้แล้ว) · อายุ session 8 ชั่วโมง

## ช่องโหว่ที่ปิด
| # | เดิม | ตอนนี้ | ไฟล์ |
|---|---|---|---|
| 1 | header `x-user-id` = เป็นใครก็ได้ · cookie `aiva_session` เป็น JSON ไม่มีลายเซ็น | cookie ลงลายเซ็น HMAC-SHA256 (`AUTH_SECRET`) มีแต่ user id · อ่าน role/บริษัท/receiver จาก DB ทุก request (เปลี่ยนสิทธิ์/ปิดบัญชี = มีผลทันที) | `src/server/auth/sessionToken.ts`, `server/middleware/session.ts` |
| 2 | ไม่มี session → `POST /documents/:id/actions` ทำในนาม **SA** | 401 | `server/routes/documents.ts` |
| 3 | AP batch อ่าน role จาก header `x-user-role` | จาก session · callback ของ Oracle ต้องใช้ `ORACLE_CALLBACK_KEY` | `server/routes/governance.ts` |
| 4 | `/api/users`, `/api/ad`, `/api/oracle`, `/api/audit-logs`, `/api/documents`, PDF, `/api/engine/ingest` ไม่ตรวจสิทธิ์ | ตรวจที่จุด mount ใน `server/app.ts` (ดูตารางในไฟล์) · สิทธิ์ใช้ตาราง `ROLES` เดียวกับ UI | `server/app.ts`, `src/server/auth/guards.ts` |
| 5 | Audit log รับ `?role=SA` จาก query → เห็นทุกอย่าง | ขอบเขตจาก session เท่านั้น | `governance.ts` |
| 6 | `/api/auth/me?userId=x` อ่านโปรไฟล์ใครก็ได้ | ตัดออก | `server/routes/auth.ts` |
| 7 | AD ล่ม → รหัส `support` / `1234` / `password` ใช้ได้ทุก user · `itsupport` = SA (ใน production ด้วย) | เฉพาะ dev/test (`AUTH_DEV_LOGIN`) | `auth.ts` |
| 8 | user ใหม่ที่ผ่าน AD = EU + ทุกบริษัทอัตโนมัติ | production: ต้องถูกเพิ่มในหน้าสิทธิ์ก่อน (ไม่งั้น 403 noaccess) · ยกเว้น `AUTH_BOOTSTRAP_ADMINS` | `auth.ts` |
| 9 | login ผิดไม่จำกัดครั้ง | ผิด 5 ครั้ง/15 นาที → ล็อก 15 นาที (HTTP 423, หน้า login แสดงเวลานับถอยหลังอยู่แล้ว) | `src/server/auth/loginLimiter.ts` |
| 10 | build production: `mock` และ `bypass` ของหน้า login = **true** (เพราะ `process.env = {}` ในเบราว์เซอร์) | อ่าน `import.meta.env` · `vite build` ปิดทั้งคู่เสมอ | `src/features/login/config.ts` |
| 11 | LDAP default `ldap://10.10.10.250:389` + `itsupport`/`support` ในโค้ด · filter ไม่ escape (LDAP injection) | ไม่มีค่า default · `ldaps://` + CA (`LDAP_CA_FILE`) · escape RFC 4515 · ตรวจบัญชีถูก disable | `src/lib/adAuth.ts` |
| 12 | Paperless ไม่ได้ → สร้าง **PDF ปลอม** ให้ผู้ตรวจดู | production: ไม่มี PDF ปลอม/ไฟล์ใน temp/ → 502 | `server/routes/pdfProxy.ts` |
| 13 | start server = seed เอกสารตัวอย่าง 125 ฉบับ (production ด้วย) · Docker image ฝัง demo DB | เฉพาะ dev (`AIVA_SEED_SAMPLE`) · image ไม่มีข้อมูลตัวอย่าง | `src/lib/autoSeedSample.ts`, `Dockerfile`, `docker-entrypoint.sh` |
| 14 | logout ลบ cookie ด้วย `document.cookie` (ลบ httpOnly ไม่ได้) | `POST /api/auth/logout` | `src/context/AuthContext.tsx` |
| 15 | CORS `origin: true` · ไม่มี security header · error 500 ส่ง message ภายใน | allowlist `CORS_ORIGINS` · nosniff / frame / referrer · ซ่อนรายละเอียด 5xx ใน production | `server/app.ts`, `errorHandler.ts` |
| 16 | `vitest` เขียนลง `prisma/dev.db` | path test DB เป็น absolute · Prisma URL ไม่ fallback เมื่อกำหนด `DATABASE_URL` แล้ว | `vitest.db-url.ts`, `src/lib/prismaUrl.ts` |
| 17 | production เริ่มได้แม้ config ไม่ครบ | ไม่ยอม start และบอกทุกข้อที่ขาด | `src/server/auth/config.ts`, `server/index.ts` |
| 18 | `docker-compose.prod.yml` ใช้ `Dockerfile.frontend` (Next.js — ใช้กับโปรเจกต์ Vite ไม่ได้) และมี `AUTH_SECRET` ค่าเริ่มต้น | ใช้ `Dockerfile` (Vite + Express) · secret บังคับ (`:?`) · bind 127.0.0.1 หลัง reverse proxy | compose, `Dockerfile` |

## เครื่องมือใหม่
- `scripts/db-reset.ts` — ล้าง/seed ฐานข้อมูล SQLite สำหรับทดสอบ (มีด่านกัน: ไม่ทำใน production, ไม่ทำกับ SQL Server, เฉพาะ `prisma/{dev,test,staging*,uat*,local*}.db`, ต้อง `--yes`, backup ก่อนเสมอ)
- `scripts/check-integrations.ts` — ทดสอบ AD (TLS, service bind, ค้นหา, user bind) + Paperless (token, read-only, ดาวน์โหลด PDF) + config production
- `POST /api/auth/dev-login` — หน้า login แบบ mock ขอ cookie จริงจาก server (dev เท่านั้น)

## Tests
- ใหม่: `securityCore.test.ts` (28 · pure), `securityRoutes.test.ts` (supertest), `helpers/session.ts`
- แก้ให้ใช้ cookie ที่ลงลายเซ็น (เดิมใช้ header): `documentActions`, `apBatchPipeline`, `auditLogScoping`, `userDirectory`, `authMe`, `serverAuthRoutes`, `serverDocumentsRoutes`, `serverGovernanceRoutes`, `serverPdfAndIngest`, `pdfProxy`, `oracleCompanySync`, `invoiceContextMutation`, `uiParity`
- ตรวจแล้วในเครื่องที่ไม่มี npm: `securityCore` 28/28 · จำลองผ่าน `server/app.ts` จริง (express/prisma จำลอง) 36/36 สถานการณ์ · `tsc --strict` ไม่มี error ใหม่
- **ยังไม่ได้รัน:** `npm test` ทั้งชุด (supertest + Prisma จริง)

## ต้องทำเองหลังวางทับ
- `package.json` → `scripts`: `"db:reset": "tsx scripts/db-reset.ts"`, `"check:integrations": "tsx scripts/check-integrations.ts"`
- `.env` สำหรับ dev: `AUTH_DEV_LOGIN=true` (ไม่งั้นหน้า login แบบ mock ได้หน้าจอแต่เรียก API ไม่ผ่าน)
- ลบ `Dockerfile.frontend` (Next.js เก่า)
