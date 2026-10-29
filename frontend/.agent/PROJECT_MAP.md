# AIVA Portal — Project Map (อ่านก่อนแก้โค้ด)

> โฟลเดอร์นี้ = `frontend/` ใน repo `DMS_Invoice_Auto_mathing` · version อยู่ใน `package.json`
> ประวัติการแก้: `docs/change/CHANGELOG.md` (ไฟล์เดียว) · patch ที่ใช้แล้ว: `docs/change/applied.json`

## 1. ภาพรวมระบบ (end-to-end)

```
DMS / Paperless ──► Engine (Python, OCR + rules, schema 3.0/3.1)
                         │ POST /api/engine/ingest  (ENGINE_INGEST_KEY)
                         ▼
                 Express API (server/)  ──► Prisma (SQLite / SQL Server)
                         │  REST + SSE (/api/events)
                         ▼
                 React SPA (src/, Vite)  — คิวตรวจสอบ · หลักฐาน PDF/bbox · AP Interface · RBAC
                         │ POST /api/ap/batches  → Oracle AP Interface
                         ◄─ POST /api/ap/batches/:id/callback (ORACLE_CALLBACK_KEY) → Posted / Import Failed
Oracle ERP ── MCP (ORACLE_MCP_URL) ── ใบรับ (receipt lookup) · บริษัทในเครือ (sync-companies)
```

Run: `npm run dev` (Vite :3000 + Express :3001) · Docker: `docker compose up -d --build` (:3001 → 3000)

## 2. โครงโฟลเดอร์

| path | หน้าที่ |
|---|---|
| `server/app.ts` | สร้าง Express app · **จุดเดียวที่เห็น guard ทุก route** |
| `server/index.ts` | start: ตรวจ config production → seed (dev) → โหลด company master → listen |
| `server/routes/documents.ts` | รายการ/รายละเอียดเอกสาร · `POST /:id/actions` (confirm/review/hold/reject/unconfirm/returnf) · ผูกใบรับ |
| `server/routes/engineIngest.ts` | รับผลจาก Engine → `src/server/ingestEngineResult.ts` |
| `server/routes/governance.ts` | users · AD search · audit logs · AP batches + Oracle callback · Oracle sync-companies / companies |
| `server/routes/auth.ts` | LDAP · Entra SSO · dev-login · view-as · me/logout |
| `server/routes/pdfProxy.ts` | PDF จาก Paperless (cache) |
| `src/server/*` | logic ฝั่ง server ที่ไม่ผูก Express: `receiveIdGuard` · `duplicateResolution` · `businessKey` · `apCallback` · `events` (SSE) · `viewAs` · `companyMaster` · `auth/*` |
| `src/lib/*` | logic ที่ใช้ร่วม UI/server: **`docTransitions`** · **`docScope`** · `queueFilters` · `closedDocs` · `smartSearch` · `i18n` · `theme` · `backendApi` |
| `src/context/*` | `AuthContext` (ผู้ใช้/สิทธิ์/view-as) · `InvoiceContext` (เอกสาร, ตัวกรอง, actions) · `LiveContext` (SSE) · `SettingsContext` · `ToastModalContext` |
| `src/components/layout` | `Sidebar` (+ `useNavSections` = โครงเมนูตามบทบาท) · `Topbar` · `Modal` · `Toast` |
| `src/components/queue` | `QueuePage` · `InvoiceDetailPane` · `ActionModals` · `ReceiptBindDrawer` · `SmartSearchBox` · `DateRangeTool` |
| `src/components/governance` | `ApPage` (AP + failed) · `RbacPage` (+ `rbac/PermissionExcelGrid`, `AdUserSearchModal`) · `AuditPage` |
| `src/components/settings` | `GeneralSettingsPage` (ภาษา/ธีม — v5.13) |
| `src/components/shell` | `CommandPalette` (Ctrl K) · `SplashScreen` · `ThemeSwitch` |
| `src/components/evidence`, `src/features/pdf-viewer` | dock หลักฐาน · bbox overlay · viewer แยกหน้าต่าง |
| `src/features/engine` | schema/adapter ผล Engine → `PortalInvoiceDocument` |
| `src/mock/*` | master ที่ยังอยู่ในโค้ด: `companies` (มี sync แล้ว v5.13) · `users` (ROLES/permissions) · `rules` (เหตุผล preset) |
| `src/styles` | `index.css` import ตามลำดับ · `aiva/theme.css` (token + กฎกลาง) · ไฟล์ต่อ version `aiva/v5x.css` |
| `prisma/schema.prisma` | Document · ValidationRun · DocumentBBox · AuditLog · ApBatch · User · UserCompany · UserReceiverMap · Company (v5.13) |
| `scripts/patch/*` | **apply-patch / verify / affected-tests** (v5.13) |
| `scripts/deploy/compose-deploy.sh`, `ci/gitlab-ci.yml` | CI/CD ด้วย docker compose (v5.13) |
| `src/test/*` | vitest ทั้งหมด (≈ 80 ไฟล์) · `helpers/session.ts` → `asUser(id, role, {companies})` |

## 3. บทบาทและขอบเขต

| role | เห็นเอกสาร | ทำอะไรได้ |
|---|---|---|
| EU | เฉพาะ Receiver ที่ผูก Oracle account | อัปโหลดฉบับใหม่ · ผูกใบรับ |
| ACC | บริษัทที่ได้รับมอบหมาย (รวม `?` ได้) | Confirm/Review/Hold/Reject · ผูกใบรับ · **ยกเลิก Confirm** (หน้า AP แท็บรอส่ง) |
| APR | บริษัทที่ได้รับมอบหมาย | + Manual Review/UNRESOLVED · **ส่ง Batch (POST)** · Return Import Failed · Audit |
| ADM | ไม่เห็นเนื้อหา | ผู้ใช้/สิทธิ์ · audit · sync บริษัท (ไม่มีสิทธิ์ action เอกสาร/Batch) |
| SA | ทุกบริษัท | ทุกอย่าง + view-as · นำเข้าบริษัทจาก JSON |

**สิทธิ์มีที่เดียว:** `ROLES` ใน `src/mock/users.ts` → UI (`can()`), server (`guards.hasPermission`, `docTransitions.roleCan`)
และหน้า Matrix (`src/lib/permissionMatrix.ts`) อ่านตารางเดียวกัน · `v513Permissions.test.ts` ตรวจว่าไม่หลุดกัน
**ห้าม** เช็กชื่อ role ตรง ๆ (`role === 'APR'`) สำหรับสิทธิ์ action — เพิ่ม/แก้ permission ใน ROLES + แถวใน permissionMatrix แทน

กติกา: `src/lib/docScope.ts` (`explainScope`) · permissions: `src/mock/users.ts` · server guard: `src/server/auth/guards.ts`

## 4. สถานะเอกสารและกติกา

`Auto-pass · Review · Hold · Manual Review → Confirmed → Sent → Posted | Import Failed` · ปิด: `Rejected · Superseded · Duplicate`

- transition ทั้งหมด: `src/lib/docTransitions.ts` → `transitionFor()` (UI ผ่าน `queueFilters.allowedActionFor`, server ใน `documents.ts`)
- receive_id: 1 invoice = 1 receive_id · ผู้ถือ = `RECEIVE_HOLDER_STATUSES` · guard ใน transaction (`receiveIdGuard.ts`)
- business key: `receive_id` → fallback `supplier_tax_id + invoice_num` (`src/server/businessKey.ts`)
- AP: `Confirmed` → batch (`POST /api/ap/batches`) → `Sent` → callback → `Posted` / `Import Failed` (ผลจาก Oracle เป็นตัวตั้ง)
- บริษัท: Tax ID ลูกค้า → ORG_ID → ไม่เจอ = `?` (`src/mock/companies.ts`, master จากตาราง `Company`)

## 5. เทสต์

- รันเฉพาะที่เกี่ยว: `node scripts/patch/verify.mjs --files a.ts,b.tsx` (typecheck → affected tests ครั้งเดียว)
- ดูรายการก่อนรัน: `node scripts/patch/affected-tests.mjs <files>` (`--deep` = importer ทุกชั้น)
- DB เทสต์: `prisma/test.db` (reset ทุก vitest run) — เทสต์ที่เขียน DB ต้องลบข้อมูลของตัวเองใน `afterEach/afterAll`
- jsdom: ใส่ `@vitest-environment jsdom` ที่หัวไฟล์ `.tsx`
- เทสต์ UI ห่อด้วย `AuthProvider → SettingsProvider → ToastModalProvider → InvoiceProvider` (ดู `viewAsClient.test.tsx`)

## 6. จุดที่มักพัง (อ่านก่อนแก้ส่วนนั้น)

| เรื่อง | ระวัง |
|---|---|
| Focus ring | `theme.css` มี `:focus-visible{box-shadow…!important}` → ในกล่อง `overflow:hidden` ใช้ inset |
| Sidebar sections | `viewAsClient.test.tsx` / `v513I18nSettings.test.tsx` ตรวจชื่อหมวดแบบเรียงลำดับ |
| เมนู/หน้าใหม่ | เพิ่ม `PageKey` (Sidebar) + `renderCurrentPage` + `resolvePageFromPath` (App.tsx) |
| ภาษาอังกฤษ | เมนู: `t()` ใน `src/lib/i18n.ts` · หน้าจออื่นทั้งหมด: `src/lib/i18n-en.json` (แปลตอนแสดงผลโดย `i18nDom.ts`) — ข้อความไทยใหม่ต้องเพิ่มคำแปลใน JSON · ตรวจด้วย `node scripts/i18n/extract-th.mjs` · ข้อมูล (ชื่อผู้ขาย ฯลฯ) ไม่แปล · ครอบส่วนที่ห้ามแปลด้วย `data-no-i18n` |
| company master | `COMPANIES`/`ORG` ถูกแก้ in-place หลัง sync → อย่าคำนวณรายการบริษัทเป็นค่าคงที่ระดับ module |
| SQL Server | schema ใหม่ต้องมี migration (`prisma/migrations`) ก่อน deploy |
| line endings | ไฟล์ส่วนใหญ่ CRLF · `*.sh` = LF |
