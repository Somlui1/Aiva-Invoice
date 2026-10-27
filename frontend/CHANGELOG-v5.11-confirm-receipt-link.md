# v5.11 — Phase 1: Confirm + ผูกใบรับ (portal only · engine ไม่ถูกแตะ)

ฐาน: source v5.10 · React + Vite (`src`) + Express (`server`) + Prisma

## ต้องทำหลัง apply

```bash
cd frontend
npx prisma generate          # schema.prisma มีคอลัมน์ใหม่
npx prisma db push           # SQLite (docker-entrypoint ทำให้อยู่แล้วตอนเริ่ม container)
npm run typecheck && npm test
```

ตัวแปรแวดล้อม (ไม่บังคับ): `ORACLE_MCP_URL`, `ORACLE_MCP_TOKEN` (ใช้ตัวเดียวกับ sync บริษัท),
`ORACLE_LOOKUP_TIMEOUT_MS` (ค่าเริ่มต้น 6000)
- production + ไม่มี MCP → ค้นใบรับตอบ 503 (หน้าจอแสดง "Oracle ไม่พร้อม" และให้ Hold)
- dev/test + ไม่มี MCP → ใช้ snapshot ใบรับที่ engine เก็บไว้ใน `payloadJson.oracleReceiptLines`

## สิ่งที่เปลี่ยน

### 1) Confirm
- Confirm ได้ทุกสถานะจาก engine ยกเว้น Superseded / Duplicate · Import Failed ยังทำที่หน้า AP · เอกสารที่ปิดแล้วทำซ้ำไม่ได้
- ปุ่ม Confirm เดิมใช้ได้เฉพาะ **Auto-pass** · สถานะอื่นปุ่มเป็น "Confirm…" แล้วเปิดหน้าผูกใบรับ (เพราะต้องเลือกเหตุผล)
  - `POST /actions {action:'confirm'}` กับสถานะที่ไม่ใช่ Auto-pass → `422 USE_LINK_SCREEN`
  - Auto-pass ที่มีรหัส High → ต้องมี note (`400 NOTE_REQUIRED`) · เลขใบแจ้งหนี้ + ผู้ขายซ้ำกับเอกสารใน AP → `409 DUPLICATE_IN_AP`
- ไม่ใช่ Auto-pass → ต้องเลือกเหตุผลจาก 6 รายการ (อื่น ๆ ต้องพิมพ์) · มีรหัส High → ต้องมีหมายเหตุ
- Manual Review / identity UNRESOLVED / ไม่รู้บริษัท / ยอดสะสมเกินใบรับ → APR (หรือ SA) เท่านั้น
- เอกสารที่รอ EU แก้ → ฝ่ายบัญชี Confirm ข้ามได้ แต่ต้องใส่เหตุผล
- บันทึก: คอลัมน์ `engineStatus, confirmOutsideAutopass, confirmReasonCode/Text, confirmNote, confirmCodes, receiptManual, confirmedBy/At` + `payloadJson.confirmMeta` (สถานะตอน Confirm, สถานะจาก engine, รหัสข้อยกเว้น, เหตุผล, ใบรับกรอกเองหรือไม่, ผู้ Confirm) + AuditLog `LINK_CONFIRM`
- หน้าเอกสารที่ปิดแล้ว: ตัวกรอง "Confirm นอก Auto-pass" · คอลัมน์ "เหตุผล Confirm" · CSV เพิ่ม 9 คอลัมน์ (ต่อท้าย ไม่กระทบคอลัมน์เดิม)
- Unconfirm ล้าง `confirmMeta` และคอลัมน์เหตุผล

### 2) หน้าจอ "ผูกใบรับ" (`src/components/receiptLink/*`, ปุ่มในหน้ารายละเอียดเอกสาร)
- ซ้าย: PDF ทุกหน้าเลื่อนแนวตั้ง · วาดเฉพาะหน้าที่ใกล้จอ (IntersectionObserver, ระยะ 1 จอ) · คืน canvas เมื่อออกห่าง
- ขวา: ① ใบรับ ② ข้อมูลเอกสาร ③ เทียบใบรับ ④ เหตุผล — section แบน คั่นด้วยเส้น ไม่มีการ์ดซ้อนการ์ด
- แถบปุ่มติดล่าง: ปฏิเสธ · Hold รอใบรับ · บันทึก · Confirm (หรือ "ปิดเป็นเอกสารซ้ำ") · ใต้ปุ่ม Confirm บอกเสมอว่ายังขาดอะไร
- สถานะที่รองรับ: โหลดเอกสาร · กำลังค้น Oracle · Oracle ล่ม (ลองใหม่) · ไม่พบ/นอกบริษัท · พบซ้ำ · 409 (แถบแดง + โหลดหน้าใหม่) · PDF โหลด/ผิดพลาด (ลองใหม่) · SA โหมดดูในมุมมอง (ทุกช่อง/ปุ่มล็อก)
- server เป็นผู้ตัดสิน: ทุกการแก้ฟอร์มส่ง `POST …/link/evaluate` (debounce 350 ms) · ค้นใบรับเฉพาะตอนกด "ค้น"
- ช่องพิมพ์ครั้งที่ 2 ห้าม paste · Esc ปิดหน้า · dark/light ใช้ token ของธีม (`src/styles/aiva/v511.css`)

### 3) กฎใบรับ (portal server · ไม่เรียก engine)
- กฎอยู่ที่เดียว `src/lib/receiptLink.ts` (server ใช้ตัดสิน, browser ใช้แสดง)
- ไม่พบใน Oracle → Confirm ไม่ได้ (ให้ Hold) · คนละบริษัท → ห้าม (บันทึกก็ไม่ได้)
- Tax ID ผู้ขายไม่ตรง → เตือน + ต้องมีเหตุผล (แม้เป็น Auto-pass) · ยอดก่อน VAT / จำนวน / ราคาต่าง → ไฮไลต์ + ต้องมีหมายเหตุ
- `GET /api/receipts/:num` — ACC/APR/SA (สิทธิ์ CONFIRM) · ตอบเฉพาะใบรับในบริษัทที่ได้รับมอบหมาย (403 นอกบริษัท · 404 ไม่พบ · 503 Oracle ล่ม)
- `GET /api/documents/:id/link` · `POST /api/documents/:id/link/evaluate` · `POST /api/documents/:id/link {op: save|confirm|hold|reject|close_duplicate, version}`
- บันทึก/Confirm เขียน `receiptNum, receiverName` (+ `companyCode`, `supplierTaxId/Name` ถ้ามาจากใบรับและคนกดยืนยัน) + `payloadJson.receiptLink` + AuditLog
- กันแก้พร้อมกัน: `version` = `updatedAt` ตอนเปิดหน้า · ไม่ตรง → `409 STALE` · เขียนด้วย `updateMany where {id, updatedAt}` (atomic)

### 4) เช็คเอกสารซ้ำตอน Confirm (ไม่เปลี่ยนสถานะเอกสารอื่นอัตโนมัติ)
- เลขใบแจ้งหนี้ + Tax ID ผู้ขาย (normalise แบบเดียวกับ businessKey) ที่ Confirmed/Sent/Posted → ห้าม · ลิงก์ฉบับเดิม · ปุ่ม "ปิดเป็นเอกสารซ้ำ" → Duplicate (`drRule = MANUAL`, `duplicateOfId`)
- ใบรับเดียวกัน เลขใบแจ้งหนี้ต่าง → Confirm ได้ + "ใบรับนี้ใช้แล้วกับ DMS-xxx"
- ยอดสะสมของใบรับ (นับเฉพาะ Confirmed/Sent/Posted, ยอดก่อน VAT) · เกินยอดรับ → APR + หมายเหตุ
- ป้ายในคิว (list + ตาราง): "ใบรับนี้ส่ง AP แล้ว" (`rcvSentToAp` คำนวณใน `GET /api/documents`)

### 5) ไม่รู้บริษัท / ไม่มียอด (เส้นทาง D)
- **บริษัทว่างเก็บเป็น `'?'`** (`engineToPortalAdapter.resolveCompanyCode`) → `docScope.explainScope`: APR เห็นทุกฉบับที่เป็น `'?'`, ACC/EU ไม่เห็น, SA เห็นทั้งหมด
- บริษัท + ผู้ขายเติมจากใบรับ (ORG_ID) เมื่อคนติ๊กยืนยัน · ใบรับต้องอยู่ในบริษัทที่ APR ได้รับมอบหมาย
- OCR อ่านเลขใบแจ้งหนี้/ยอดรวมไม่ได้ → ต้องพิมพ์ 2 ครั้งให้ตรงกัน · ไม่ใช้ยอดใบรับแทนยอดใบแจ้งหนี้
- ค่าที่คนกรอกเก็บใน `payloadJson.manualValues[]` (ค่า, ค่า OCR เดิม, ใคร, เมื่อไร, เหตุผล) · คอลัมน์ OCR (`invoiceNum`, `grandTotal`) ไม่ถูกแก้ · `hasManualValues = true`
- ป้าย "มีค่าที่คนกรอก" ที่คิว, เอกสารที่ปิดแล้ว, หน้า AP · AP batch ใช้ค่าที่คนกรอกและส่ง `MANUAL_VALUES = 'Y'`

### 6) ลิงก์ตารางเทียบ ↔ PDF
- บรรทัดที่ engine จับคู่แล้ว (`rcvLineId`, ใบรับของ engine) ใช้ผล engine
- ใบรับที่กรอกเอง: `src/lib/approxLineMatch.ts` — รหัสสินค้า/PO line → qty×price = ยอด (±0.01) → ยอดบรรทัดไม่ซ้ำทั้งสองฝั่ง → ไม่เดา · หนึ่งต่อหนึ่ง · กำกวมไม่จับคู่ · ป้าย "ประมาณ" · ใช้แค่นำทาง/แสดงผลต่าง
- ยอดก่อน VAT / VAT / ยอดรวม / เลขใบแจ้งหนี้ ใช้กรอบตาม `field_name`
- ไม่มีตำแหน่ง → ไม่เลื่อน + tooltip บอกเหตุผล · กดกรอบบน PDF → ไฮไลต์แถวกลับ
- adapter ส่งต่อ `element_id, page_no, rcv_line_id, item_code` ของแต่ละบรรทัดไปถึง UI (เดิมถูกตัดทิ้ง)

**ผลตรวจข้อมูลจริง** (`temp/paperless_invoices_v5`, 6 ไฟล์ / 50 บรรทัด):

| field | มีครบ | หมายเหตุ |
|---|---|---|
| `line_no` | 50/50 | |
| `element_id` + bbox ของ row | 50/50 | |
| `page_no` | 50/50 | |
| `rcv_line_ids` (gr_line) | 34/50 | DMS-27 ขาด 4, DMS-95 ขาด 12 → บรรทัดเหล่านั้นใช้การจับคู่แบบประมาณไม่ได้ (ใบรับของ engine) จึงไม่มีคู่ |
| `item_code` (ฝั่งใบแจ้งหนี้) | **0/50** | ขั้นที่ 1 (รหัสสินค้า) จึงยังไม่เกิดผลกับข้อมูลจริง |
| `po_line` | **0/50** | adapter ตั้งเป็น `null` ทุกบรรทัด (engine ไม่ส่ง) |
| กรอบ `sub_total / vat / grand_total` | 5/6 ไฟล์ | DMS-95 ไม่มีกรอบยอด → ลิงก์ยอดไม่เลื่อน + tooltip |

### 7) Role
- EU ไม่เห็นปุ่ม/หน้าผูกใบรับ (server ตอบ 403) · ใน "ผลการส่งเอกสาร" เห็นป้าย "ฝ่ายบัญชีผูกใบรับให้"
- APR = ACC + Manual Review + ไม่รู้บริษัท + ยอดเกินใบรับ
- โหมด SA "ดูในมุมมองของ" → เปิดหน้าดูได้ ทุกปุ่มล็อก (server ตอบ `403 PREVIEW_READ_ONLY` อยู่แล้ว)

## ไฟล์
ใหม่: `server/routes/receiptLink.ts` · `src/lib/receiptLink.ts` · `src/lib/approxLineMatch.ts` · `src/lib/receiptLinkApi.ts` ·
`src/server/receiptLink/{service,oracleReceipts}.ts` · `src/components/receiptLink/{ReceiptLinkScreen,LinkPdfPane}.tsx` ·
`src/styles/aiva/v511.css` · test 4 ไฟล์ · CHANGELOG นี้
แก้: `prisma/schema.prisma` · `server/app.ts` · `server/routes/{documents,governance}.ts` · `src/lib/{docScope,closedDocs}.ts` ·
`src/features/engine/{types/portalDomain,adapters/engineToPortalAdapter,adapters/portalDocToInvoiceDoc}.ts` · `src/types/invoice.ts` ·
`src/context/InvoiceContext.tsx` · `src/components/{queue/InvoiceDetailPane,queue/QueueListItem,queue/QueueTableView,closed/ClosedDocsPage,governance/ApPage,common/Icon}.tsx` · `src/styles/index.css`

## ตรวจแล้ว (ในสภาพแวดล้อมของ Copilot)
- `git apply --check` ของ patch ทั้งชุดกับ source v5.10 ที่แนบมา: ผ่าน
- `tsc --noEmit` ทั้งโปรเจกต์ โดยใช้ type stub แทน express/zod/prisma/react (ไม่มี node_modules): **ไม่มี error ใหม่** นอกจากที่เกิดจาก stub เป็น `any` (implicit any ของ handler/event, useContext เป็น `{}`) — `src/lib/*` ใหม่ทั้งหมด type ผ่านแบบ strict
- รัน test แบบ pure (transpile + shim ที่เลียน vitest): `receiptLinkRules` 22/22 · `approxLineMatch` 6/6 · `closedDocsConfirmOutside` 2/2 · `closedDocs` (เดิม) 9/9

## ยังไม่ได้ทดสอบ (ต้องรันฝั่งคุณ)
1. **`npm test` จริงทั้งชุด** — โดยเฉพาะ `receiptLinkRoutes.test.ts` (supertest + Prisma + SQLite) ยังไม่เคยรัน · test เดิมที่อาจกระทบ: `documentActions`, `viewAsServer`, `closedDocsPage`, `queueReceiverFilter`, `uiParity`
2. **`npm run typecheck` กับ type จริง** (React 19 / Express 5 / Zod 4 / Prisma client ที่ generate ใหม่)
3. **Oracle MCP จริง**: SQL (`RCV_SHIPMENT_HEADERS/LINES` + PO + AP_SUPPLIERS + PER_ALL_PEOPLE_F) และรูปแบบคำตอบ `sql_run` (`result.rows` / `result.content[0].text`) — เขียนตาม schema EBS มาตรฐาน ยังไม่เคยยิงจริง · ราคาใช้ `PO_LINES_ALL.UNIT_PRICE` และ Tax ID ใช้ `AP_SUPPLIERS.VAT_REGISTRATION_NUM` ต้องยืนยันว่าตรงกับที่ engine ใช้
4. **UI ในเบราว์เซอร์**: หน้าผูกใบรับทั้งหมด (layout, dark/light, PDF lazy render, scroll ไปกรอบ, กรอบ → แถว, 320–1100 px), ป้ายในคิว/AP/ปิดแล้ว — ยังไม่เคย render จริง ไม่มี component test
5. ประสิทธิภาพ: `sameInvoiceCandidates` อ่านเอกสาร Confirmed/Sent/Posted ทั้งหมดทุกครั้งที่ evaluate (เทียบเลขแบบ normalise ในหน่วยความจำ) — พอสำหรับ Phase 1 แต่ควรมีคอลัมน์ normalised + index ถ้าเอกสารเกินหลักหมื่น
6. Prisma + SQL Server (`prisma/sqlserver`) ไม่ได้แก้ — ถ้าใช้ schema แยก ต้องเพิ่มคอลัมน์เดียวกัน
7. การหมุนหน้า PDF (rotation ≠ 0) กับกรอบในหน้าผูกใบรับ — ใช้ viewport ของ PDF.js ตรง ๆ ยังไม่เทียบกับ `coordinateTransform` แบบที่ dock ใช้

## นอกขอบเขต (Phase 2)
engine ตรวจ V-xx ซ้ำด้วยค่าที่คนกรอก · ถังเอกสารที่ไม่ใช่ใบแจ้งหนี้ · ลากกรอบบน PDF · ส่งค่าที่คนกรอกไปปรับปรุง OCR ·
กรอง scope ฝั่ง server กับผู้ใช้ทุกคน · EU ที่ยังไม่ผูก Oracle account ให้ไม่เห็นเอกสาร
