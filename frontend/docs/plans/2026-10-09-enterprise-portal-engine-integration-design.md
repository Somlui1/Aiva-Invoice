# Enterprise Portal & Matching Engine Integration Design

**Document Version:** 1.0  
**Date:** 2026-10-09  
**Status:** Approved  
**Target Branch:** `feat/enterprise-portal-engine-integration`

---

## 1. Executive Summary & Goals

ระบบ Web Application (AIVA Portal) จะถูกยกระดับจากเวอร์ชัน Mockup/Sandbox ให้เป็น **Enterprise Application (Production Ready)** โดยมีเป้าหมายหลัก 3 ประการ:
1. **Decoupled Engine Integration:** Portal สามารถรับผลลัพธ์จาก Matching Engine (`aiva.system_a.result/3.0`) ผ่าน Webhook API Receiver (`POST /api/engine/ingest`) โดยไม่ผูกติดกับ Internal Schema ของ Engine และแปลงข้อมูลผ่าน Transformation Layer สู่ Portal Standard Domain Model
2. **100% Mockup Parity & Real PDF + BBox Display:** แสดงผลหน้าจอตรงตาม Mockup (`AIVA-Web-Portal-Mockup-v4.18.html`) ครบทุกมุมมอง (Queue Table, Split View, KPI Cards, 4-Step Validation) พร้อมระบบแสดงผล PDF จริงจาก DMS (Paperless-NGX) และซ้อนทับกรอบ Bounding Box แบบโต้ตอบสองทาง (Bi-directional Linking)
3. **Pluggable Security & Clean Architecture:** จัดวางสถาปัตยกรรมรองรับระบบ Login & Permission (Entra ID SSO, Role & Data Scopes) ในอนาคตอย่างเป็นสัดส่วน

---

## 2. High-Level Architecture & Layer Separation

```
[Matching Engine]
       │
       ▼ (POST Webhook Payload: aiva.system_a.result/3.0)
[Webhook Ingestion API: /api/engine/ingest]
       │ (Zod Validation & Idempotency Check)
       ▼
[Transformation Layer (Adapter / Normalizer)]
       │ (Maps recommendation -> Portal Status, extracts 4-step progress & BBoxes)
       ▼
[Portal Standard Domain Model]
       │
       ▼ (Prisma ORM)
[Portal Database (Hybrid Relational & Structured JSON)]
       │
       ├───────────────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼
[Queue & KPI APIs]             [Document Detail API]          [PDF & BBox Stream Proxy]
       │                               │                               │
       └───────────────────────────────┼───────────────────────────────┘
                                       ▼
                       [Web Portal UI (Next.js 15 / React 19)]
                       ├── Queue & Split View Views
                       ├── 4-Step Validation Indicators & 9 Rules
                       └── PDF.js Canvas + Interactive BBox Layer
```

### Layer Responsibilities
1. **Engine Layer:** ประมวลผล OCR, Matching, กฎ V-01..V-09, ให้คำแนะนำ (Recommendation) และส่งออกผลลัพธ์เป็นมาตรฐาน Engine Result 3.0
2. **Ingestion Layer (`/api/engine/ingest`):** ตรวจสอบโครงสร้างข้อมูลด้วย Zod, ป้องกันการส่งซ้ำด้วย Idempotency Key (`validation_id`, `file_sha256`)
3. **Transformation Layer (Adapter):** แปลงข้อมูล Engine Schema ให้สอดคล้องกับ Portal Standard Domain Model, คำนวณสถานะ 4 ขั้นตอน และเตรียม BBoxes รายหน้า
4. **Database Layer (Hybrid Persistence):** จัดเก็บฟิลด์ค้นหา/คัดกรองในรูป Relational Columns และเก็บรายละเอียดเชิงลึก (OCR, BBoxes, Rule Details) ในรูป Structured JSON
5. **Presentation Layer (UI):** ถอดแบบจาก Mockup v4.18 ครบ 100%

---

## 3. Portal Standard Domain Model Specification

Web Application กำหนดมาตรฐานข้อมูลของตนเองเป็นทางการ (TypeScript Contracts):

### 3.1 Portal Document Entity
```typescript
export type PortalDocumentStatus =
  | 'Auto-pass'
  | 'Review'
  | 'Hold'
  | 'Manual Review'
  | 'Confirmed'
  | 'Posted'
  | 'Rejected'
  | 'Duplicate'

export type CompanyCode = 'AH' | 'AHT' | 'AHP' | 'AM'

export interface PortalInvoiceDocument {
  // 1. Identity & DMS Reference
  id: string                      // Primary Key (e.g. "DMS-100")
  dmsDocId: string                // Paperless-NGX Document ID
  packageId: string               // Package Identifier
  fileSha256: string              // SHA-256 for file integrity
  pageCount: number               // Number of pages in PDF
  contentKind: 'pdf' | 'image'
  
  // 2. Invoice Master Data (ERP Ready)
  invoiceNum: string
  invoiceDate: string             // YYYY-MM-DD
  dueDate?: string
  companyCode: CompanyCode
  companyName: string
  companyTaxId: string
  supplierName: string
  supplierTaxId: string
  supplierBranch?: string
  currency: string
  subtotal: number
  vat: number
  grandTotal: number
  poNumbers: string[]
  receiverName?: string
  receiverAccount?: string

  // 3. Oracle Receipt & Matching
  receiptFound: boolean
  lookupPath?: string
  orgId?: number
  ouName?: string
  receiptTotal?: number
  invoiceVsReceiptDiff?: number
  linesMatched?: string
  lineItems: PortalLineItem[]

  // 4. Validation & Rule Results
  recommendation: 'AUTO_PASS' | 'REVIEW' | 'HOLD' | 'MANUAL_REVIEW' | 'SYSTEM_ERROR'
  status: PortalDocumentStatus
  maxSeverity: 'Low' | 'Medium' | 'High' | 'None'
  stepProgress: {
    step1: { status: 'ok' | 'warn' | 'fail'; label: string }
    step2: { status: 'ok' | 'warn' | 'fail'; label: string }
    step3: { status: 'ok' | 'warn' | 'fail'; label: string }
    step4: { status: 'ok' | 'warn' | 'fail'; label: string }
  }
  rules: PortalRuleCheck[]
  exceptions: PortalException[]

  // 5. OCR & Bounding Box Data
  pages: PortalPageMeta[]
  bboxes: PortalBoundingBox[]

  // 6. Workflow & Governance (Portal Owned)
  assignedRole: 'EU' | 'ACC' | 'APR' | 'ADM'
  assignedUserId?: string
  apStatus: 'unconfirmed' | 'confirmed' | 'sent' | 'posted' | 'failed'
  apBatchId?: string
  duplicateStatus: 'none' | 'potential_duplicate' | 'overridden'
  createdAt: string
  updatedAt: string
  history: PortalHistoryEntry[]
}
```

### 3.2 Bounding Box & Page Geometry Contract
```typescript
export interface PortalPageMeta {
  pageNo: number
  widthPt: number
  heightPt: number
  rotation: number
  pageType: 'TAX_INVOICE' | 'DELIVERY_ORDER' | 'PO' | 'RECEIPT' | 'UNKNOWN'
}

export interface PortalBoundingBox {
  id: string
  pageNo: number
  bbox: [number, number, number, number] // [x, y, w, h] normalized 0..1 (top-left)
  elementType: 'field' | 'table' | 'row' | 'cell' | 'word' | 'signature'
  fieldName?: string
  rawValue?: string
  confidence: number
  ruleId?: string                       // Associated rule (e.g. "V-07")
  exceptionCode?: string                // Associated exception (e.g. "E10")
  severity?: 'Low' | 'Medium' | 'High'
}
```

---

## 4. PDF Rendering & Interactive Bounding Box Architecture

### 4.1 DMS Streaming Proxy
* **Endpoint:** `GET /api/documents/:id/pdf`
* เซิร์ฟเวอร์ Portal รับคำขอ ตรวจสอบสิทธิ์ผู้ใช้ แล้วดึงไฟล์ PDF ต้นฉบับจาก Paperless-NGX ผ่าน API ด้วย Master Token ฝั่ง Server-side แล้ว Stream ข้อมูลต่อให้ Client
* **Offline / Dev Fallback:** หากไม่สามารถเชื่อมต่อ DMS หรือไม่มีไฟล์ต้นฉบับ ระบบจะสลับไปเรนเดอร์ผ่าน `EvidenceCanvas.tsx` (Mockup SVG Paper) โดยอัตโนมัติ

### 4.2 PDF.js Canvas + Overlay Layer
* หน้าเอกสารเรนเดอร์ลงบน `<canvas>` ขนาด `W` × `H`
* ชั้น Overlay อยู่ด้านบนแบบ `position: absolute; pointer-events: auto;`
* พิกัดกรอบสี่เหลี่ยมคำนวณจากค่า Normalized:
  $$\text{left} = x \times W, \quad \text{top} = y \times H, \quad \text{width} = w \times W, \quad \text{height} = h \times H$$

### 4.3 Bi-directional Interactive Linking
1. **Detail Pane → PDF:** คลิกที่กฎข้อที่ไม่ผ่าน (`V-07`, `E10`) ในหน้าต่างสรุปผล หรือบรรทัดสินค้า → PDF Dock เปลี่ยนหน้าไปยัง `page_no` ทันที เลื่อนไปยังตำแหน่ง BBox และแสดง Pulsing Highlight สีแดง/ส้ม
2. **PDF → Detail Pane:** ชี้เมาส์ที่กรอบ BBox บน PDF → แสดง Tooltip รายละเอียด และเน้นแถวที่เกี่ยวข้องในตาราง

---

## 5. Security & RBAC Extensibility (Future-Ready)

* **Session Abstraction:** ออกแบบผ่าน `PortalSession` interface โดยปัจจุบันเชื่อมกับ `MockAuthProvider` (สลับผู้ใช้จำลอง Somsak, Nattaporn, ฯลฯ ได้ทันที) และพร้อมเชื่อมต่อกับ Entra ID SSO / NextAuth ในอนาคต
* **Data-Level Scope Filtering:** ทุก API Query (`/api/documents`) จะผูก Scope อัตโนมัติ:
  * `EU` (Receiver): กรองเฉพาะบริษัทและ Receiver Account ของตนเอง
  * `ACC` (Accounting): กรองตามรหัสบริษัทที่ดูแล
  * `ADM` (Admin): บล็อกการเข้าถึงยอดเงินเอกสาร ให้เข้าถึงได้เฉพาะ RBAC และ Audit Logs
* **Declarative Permission Gates:** คุมปุ่มและสิทธิ์การกระทำด้วย `<PermissionGate can="CONFIRM">`

---

## 6. Error Handling, Idempotency & Ingestion Testing

1. **Idempotency Check:**
   * ตรวจสอบคู่ `validation_id` และ `file_sha256` ในตาราง `ValidationRun`
   * หากได้รับ Payload เดิมซ้ำ จะตอบกลับ `200 OK (idempotent_replay: true)` ทันที
2. **Re-validation History:**
   * หากมีรอบตรวจใหม่ (`validation_round: 2`) จะสร้าง Record ใน `ValidationRun` และอัปเดตสถานะล่าสุดใน `PortalDocument`
3. **126 Sample Files Ingestion Harness (`scripts/simulate-engine-push.ts`):**
   * อ่านไฟล์ JSON 126 ชุดจาก `temp/paperless_invoices_v5/`
   * จำลองส่งผ่าน HTTP POST เข้า Webhook `/api/engine/ingest`
   * ยืนยันผลการแปลงข้อมูล, วัดประสิทธิภาพ และตรวจสอบว่าสรุปสถานะคิวใน UI ตรงกับของ Engine 100%

---

## 7. Implementation Roadmap & Milestones

* **Milestone 1:** Git Branching (`feat/enterprise-portal-engine-integration`) + Database Schema (Prisma) + Portal Domain Model Types
* **Milestone 2:** Transformation Layer (Zod + Adapter) + Webhook Ingestion API + Unit Tests + Ingest Harness สำหรับ 126 ไฟล์
* **Milestone 3:** UI Parity Integration (เชื่อมต่อ Queue Table, Split View, Detail Pane กับ Database จริง)
* **Milestone 4:** PDF.js Canvas Viewer + DMS Proxy Stream + Interactive Bounding Box Layer
* **Milestone 5:** Verification & End-to-End Workflow Testing
