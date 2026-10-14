# Production Readiness Design Document: Core Data, State Machine, RBAC & ERP Staging

- **Status:** Approved
- **Date:** 2026-10-14
- **Project:** AIVA Invoice Auto-Matching Portal (`frontend`)
- **Author:** AIVA Portal Engineering & DeepMind Antigravity

---

## 1. Executive Summary & Context

The AIVA Invoice Auto-Matching Portal has achieved high mockup-parity, robust OCR/BBox canvas projection, and validation engine ingest adapters (`aiva.system_a.result/3.0`). However, to transition into real enterprise production, several operational gaps must be bridged:

1. **State Persistence Gap:** User actions (`Confirm`, `Review`, `Hold`, `Reject`, `Manual Review`, `Upload Revision`) previously existed solely in browser in-memory React state (`InvoiceContext.tsx`). A reload erased mutations, and no server-side state transitions or audit logs were persisted.
2. **User & Permission Management Gap:** Roles and permissions were statically mocked in TypeScript files (`mock/users.ts`). IT Administrators had a read-only viewer and lacked interactive provisioning, role assignment, and Oracle Receiver mapping.
3. **Identity & IdP Flexibility:** The system needs an IdP-agnostic authentication architecture (supporting Microsoft 365 Entra ID, Keycloak, or LDAP) anchored on corporate **`email`** as the canonical identifier, with fast user auto-mapping during provisioning.
4. **Oracle AP Interface Integration Boundary:** Posting invoices into Oracle AP Interface requires coordination with the enterprise Oracle/ERP team. The portal must provide a robust batching, document locking, and staging data pipeline that can seamlessly plug into Oracle's interface tables or APIs.
5. **PDF & BBox Storage Optimization:** Separating heavy BBox/geometry arrays from summary queue listing APIs to ensure millisecond queue response times while preserving interactive PDF dock overlays.

This document details the architectural specifications and implementation roadmap for these capabilities.

---

## 2. Architecture & Roadmap

```
+---------------------------------------------------------------------------------------------------+
|                                      AIVA INVOICE PORTAL                                          |
+---------------------------------------------------------------------------------------------------+
|  [Queue Page]              [PDF Dock / Standalone]         [AP Interface]        [Permission Admin]  |
|  - Real DB State           - Dynamic BBox Fetch            - Batch Staging       - Excel Grid (v3) |
|  - Role & Co Filter        - Paperless-NGX Stream          - Lock & Audit        - Directory Search|
+---------------------------------------------------------------------------------------------------+
                                            |
                             Next.js API & Route Guards (Zod)
                                            |
         +----------------------------------+----------------------------------+
         |                                  |                                  |
         v                                  v                                  v
+------------------+              +-------------------+              +-------------------+
| State Mutation   |              | Identity & RBAC   |              | AP Batch Staging  |
| - POST /actions  |              | - OIDC / Keycloak |              | - POST /batches   |
| - Transition Rul |              | - AD Auto-Map     |              | - AP Interface    |
| - Optimistic UI  |              | - Scope (Co/Rcv)  |              | - 3-Stage Flow    |
+------------------+              +-------------------+              +-------------------+
         |                                  |                                  |
         +----------------------------------+----------------------------------+
                                            |
                                  Prisma ORM Layer
                                            |
+---------------------------------------------------------------------------------------------------+
|                                  PORTAL DATABASE                                                  |
|  - Document (Lifecycle, Lock, Batch)          - User & UserCompany (RBAC)                         |
|  - DocumentBBox (Hybrid BBox Index)          - UserReceiverMap (Oracle Account Bindings)         |
|  - AuditLog (Immutable Event Trail)           - ApBatch (Oracle Staging Payload)                  |
+---------------------------------------------------------------------------------------------------+
```

### Phased Roadmap

- **Phase 1: Core State Machine & Data Persistence (Immediate Priority):**
  - Schema migration for `Document`, `DocumentBBox`, `AuditLog`, and `ApBatch`.
  - Server-side Action Mutation API (`POST /api/documents/[id]/actions`).
  - Wire `InvoiceContext` to use real mutation endpoints with optimistic UI updates.
- **Phase 2: User & Permission Management (Adapted from Mockup v3):**
  - Implement Excel-like Permission Grid in `src/components/governance/rbac/`.
  - Directory search endpoint (`GET /api/ad/search?q=...`) with automatic field mapping (`name`, `email`, `emp`, `unit`).
  - IdP-agnostic auth token extractor (anchored on verified `email`).
  - Database-backed user management and audit logging.
- **Phase 3: Oracle AP Interface Staging & Paperless Feedback:**
  - Batch creation, payload transformation, and document locking (`isLocked = true`).
  - Staging export API and callback endpoint for Oracle Payables Import results (`Posted` vs `Import Failed`).
  - Status/Tag sync back to Paperless-NGX.

---

## 3. Data Models & Database Schema

The Prisma database schema is extended from `prisma/schema.prisma`:

### 3.1 Extended `Document` Model
```prisma
model Document {
  id              String   @id // e.g. "DMS-100"
  dmsDocId        String   @unique // Paperless numeric doc ID e.g. "100"
  packageId       String
  fileSha256      String
  pageCount       Int
  invoiceNum      String
  invoiceDate     String
  companyCode     String
  supplierTaxId   String
  supplierName    String
  grandTotal      Float
  currency        String   @default("THB")
  status          String   // Auto-pass, Review, Hold, Manual Review, Duplicate, Confirmed, Sent, Posted, Rejected, Superseded, Import Failed
  recommendation  String
  maxSeverity     String
  receiverName    String?
  receiptNum      String?
  linesMatched    String?
  assignedRole    String   @default("EU") // EU or ACC
  apStatus        String   @default("unconfirmed")
  
  // Concurrency & Document Locking
  isLocked        Boolean  @default(false)
  lockedAt        DateTime?
  lockedBy        String?
  
  // Oracle AP Batch Tracking
  apBatchId       String?
  oracleInvoiceId String?
  importError     String?

  payloadJson     String   // Structured Portal Document JSON (Rules, Lines, Snapshots)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  runs            ValidationRun[]
  bboxes          DocumentBBox[]
}
```

### 3.2 `DocumentBBox` Model (Hybrid BBox Index)
Separates heavy page geometry and character coordinates from the main list query:
```prisma
model DocumentBBox {
  id         String   @id @default(cuid())
  documentId String
  pageNum    Int
  boxType    String   // 'rule_evidence' | 'ocr_word' | 'table_cell' | 'oracle_receipt'
  targetRef  String?  // e.g. 'V-01', 'item:0', 'receipt:1'
  boxJson    String   // Serialized JSON of coordinates [ymin, xmin, ymax, xmax] & metadata
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId, pageNum])
}
```

### 3.3 `AuditLog` Model (Immutable Event Trail)
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  docId      String
  whoId      String   // User identifier or email
  whoName    String   // Display name
  role       String   // EU, ACC, APR, ADM
  action     String   // CONFIRM, REVIEW, HOLD, REJECT, MANUAL_REVIEW, UNCONFIRM, RETURN_FAILED, UPLOAD_REVISION, POST_BATCH
  fromStatus String?
  toStatus   String?
  reason     String?
  note       String?
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([docId])
  @@index([createdAt])
}
```

### 3.4 `ApBatch` Model (Oracle Interface Staging)
```prisma
model ApBatch {
  id          String    @id // e.g. "AP-20261014-001"
  status      String    // 'PENDING' | 'SENT' | 'SYNCED' | 'FAILED'
  totalDocs   Int
  totalAmount Float
  companyCode String
  createdBy   String
  sentAt      DateTime?
  payloadJson String    // AP Invoice & Line Interface Data ready for Oracle
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### 3.5 User & RBAC Models
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique // Canonical Identity Key (somsak.j@aapico.com)
  name        String   // Display Name (สมศักดิ์ ใจดี)
  samAccount  String?  // AD username (somsak.j)
  empId       String?  // Employee ID (10231)
  unit        String?  // Department / Warehouse unit
  role        String   // 'EU' | 'ACC' | 'APR' | 'ADM'
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  companies   UserCompany[]
  receivers   UserReceiverMap[]
}

model UserCompany {
  id          String @id @default(cuid())
  userId      String
  companyCode String // 'AH', 'AHT', 'AHP', 'AM'
  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, companyCode])
}

model UserReceiverMap {
  id           String   @id @default(cuid())
  userId       String
  receiverName String   // Oracle PO Receipt Receiver Name ('SOMSAK JAIDEE')
  assignedBy   String
  ticketRef    String?  // IT Request Ref e.g. 'INC-1021'
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, receiverName])
}
```

---

## 4. Document State Machine & Mutation API

### 4.1 Endpoint Specification
`POST /api/documents/[id]/actions`

**Request Payload:**
```json
{
  "action": "confirm",
  "reason": "ผ่านการตรวจสอบครบถ้วน",
  "note": "PO ตรงกับใบรับของคลัง AH",
  "revisionPayload": null
}
```

### 4.2 State Transition Matrix & Security Guards
| Action | Source Statuses | Target Status | Allowed Roles | Guard Checks |
|---|---|---|---|---|
| `confirm` | `Auto-pass`, `Review` | `Confirmed` | `ACC`, `APR` | Must not be locked; user company matches doc company |
| `review` | `Hold`, `Auto-pass` | `Review` | `ACC`, `APR` | Must not be locked |
| `hold` | `Auto-pass`, `Review` | `Hold` | `ACC`, `APR` | Mandatory reason |
| `reject` | `Auto-pass`, `Review`, `Hold` | `Rejected` | `ACC`, `APR` | Mandatory reason |
| `manual_review` | `Manual Review` | `Confirmed` or `Review` | `APR` | Approver override decision |
| `dup_override` | `Duplicate` | `Review` | `APR` | Approver duplicate clearance |
| `unconfirm` | `Confirmed` | `Review` | `APR` | Allowed only if document has NOT been sent in an AP Batch (`status !== 'Sent'`) |
| `returnf` | `Import Failed` | `Review` | `APR` | Clears AP import error and returns to review queue |
| `upload_revision` | Any open state | New Revision Doc | `EU`, `ACC`, `APR` | Creates revision `-R1`, applies duplicate/superseding rules DR-01..07 |

### 4.3 Atomic Execution Flow
1. Fetch target `Document` by ID with a write lock.
2. Verify `doc.isLocked === false`. If true, reject with `423 Locked`.
3. Validate action compatibility against current status and user role.
4. Execute Prisma transaction:
   - Update `Document.status`, `confirmedBy`, `confirmedAt`, and append history entry in `payloadJson`.
   - Insert new row into `AuditLog`.
5. Return updated document representation to client.

---

## 5. User & Permission Management (Adapted from Mockup v3)

### 5.1 Core Identity Principles
- **Email is the Canonical Identifier:** Authentication methods (Microsoft 365, Keycloak, LDAP) all map to the internal `User` record via verified `email`.
- **No Login Method Noise:** Remove confusing provider tags from the main management table; focus on Name, Username, Email, Role, Scope, and Actions.
- **IdP-Agnostic Backend:** Session extraction checks the verified token claim `email`. If authenticated, loads user roles and scopes from the database.

### 5.2 Fast Provisioning UX (Auto-Mapping)
When an administrator clicks `[+ เพิ่มผู้ใช้จาก AD (LDAP)]`:
1. Modal displays an autocomplete search input querying `GET /api/ad/search?q=<query>`.
2. Admin selects the employee from search results.
3. System automatically populates:
   - `name` ➔ Full Name (e.g. "สมศักดิ์ ใจดี")
   - `email` ➔ Corporate Email (e.g. "somsak.j@aapico.com")
   - `samAccount` ➔ AD Username (e.g. "somsak.j")
   - `empId` ➔ Employee ID (e.g. "10231")
   - `unit` ➔ Department / Unit (e.g. "คลังวัตถุดิบ")
4. Admin configures:
   - **Role:** Select `EU` (Receiver), `ACC` (Accounting), `APR` (Acc. Head), or `ADM` (IT Admin).
   - **Scope:**
     - If `EU`: Chips for Oracle Receiver Account names (`SOMSAK JAIDEE`).
     - If `ACC` / `APR`: Multi-select chips for company codes (`AH`, `AHT`, `AHP`, `AM`).
     - If `ADM`: Scope disabled (system administration only).
5. Review & Save: Dirty state tracking shows modified rows; admin reviews changes in Diff Modal before committing to database.

---

## 6. Oracle AP Interface Staging & Batch Pipeline

### 6.1 Three-Stage Pipeline
1. **Stage 1: Confirmed ➔ Sent (Document Locking)**
   - Accountant/Approver selects confirmed documents on [ApPage](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/components/governance/ApPage.tsx) and clicks `[ส่งเข้า AP Interface (Batch)]`.
   - Generates batch record `ApBatch` (`AP-YYYYMMDD-xxx`).
   - Documents transition to `status = 'Sent'`, `isLocked = true`, `apBatchId = batch.id`.
   - Generates an immutable audit trail.
2. **Stage 2: Staging Payload Generation**
   - System structures headers and line items into Oracle Payables Open Interface format (`AP_INVOICES_INTERFACE` and `AP_INVOICE_LINES_INTERFACE`).
   - Stores payload in `ApBatch.payloadJson`.
   - Exposes endpoint `GET /api/ap/batches/[id]` for the Oracle team to poll or trigger via ETL/API.
3. **Stage 3: Result Ingestion (Posted vs Import Failed)**
   - When the Oracle Concurrent Program completes:
     - **Success:** Webhook or sync job calls `POST /api/ap/batches/[id]/callback` with `{ status: 'POSTED', oracleInvoiceId: 'INV-9921', voucherNum: 'V-0012' }`. Documents update to `Posted`.
     - **Failure:** Callback supplies rejection reasons (e.g. invalid tax registration or closed PO). Documents update to `Import Failed` with `importError` recorded.
   - Approver can click `[Return Failed]` to return failed documents back to `Review` with corrective notes.

---

## 7. Testing & Verification Strategy

1. **Schema & Migration Tests:**
   - Verify Prisma schema push, relations, cascading deletes, and indexes.
2. **State Machine & Mutation Tests:**
   - Test every legal and illegal state transition.
   - Verify `423 Locked` rejection when modifying locked documents.
   - Verify `AuditLog` records are accurately written in each transaction.
3. **RBAC & Directory Auto-Mapping Tests:**
   - Mock directory search and verify automatic field mapping.
   - Verify scope filtering: EU sees only assigned receiver docs; ACC sees only assigned company docs.
4. **End-to-End Regression Test:**
   - Full suite execution (`npm test`), Next.js production build (`npm run build`), and typecheck (`tsc --noEmit`).
