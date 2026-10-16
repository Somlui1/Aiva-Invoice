# Design Document: Unified Multi-Type Audit Logs & Oracle EBS Company Master

**Author:** AIVA Portal Engineering Team  
**Date:** 2026-10-16  
**Status:** Approved by User  
**Target File:** `docs/plans/2026-10-16-unified-audit-logs-and-oracle-company-master-design.md`

---

## 1. Executive Summary & User Requirements

The user requested two major enterprise governance enhancements:
1. **Unified Multi-Type Audit Logs:**
   - Store and track multiple types of logs that can be displayed together in a single unified view.
   - Distinctly label each log type with clear category identifiers and Thai activity descriptions.
   - Automatically log user creation (User Provisioning) and permission changes (role changes, company access additions/removals, Oracle receiver mappings) with structured diff metadata.
   - Enforce RBAC security scoping so each user only sees logs permitted by their role and assigned companies.
   - Provide real-time text search and a category dropdown filter directly on the unified audit table.
2. **Oracle EBS Company Master Table (26 Affiliates) & MCP Sync:**
   - In reality, AAPICO Group has far more affiliates than the initial 5 mock companies (`AH`, `AHA`, `AHT`, `AHP`, `AM`).
   - Querying the real AAPICO Oracle EBS database via Oracle MCP revealed **26 Operating Units / Legal Entities** across Thailand, Malaysia, and Europe.
   - Store all 26 companies in a dedicated SQLite database table (`Company`).
   - Provide an instant search bar in the UI to filter companies by code, name, tax ID, or ORG_ID.
   - Connect the "ดึงข้อมูลจาก Oracle (MCP)" button to query Oracle EBS live via Oracle MCP tool (`sql_run`), upsert into the database table, and record an audit log.

---

## 2. Architecture & Data Model

### 2.1 Prisma Schema Extension

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  category     String   @default("DOCUMENT") // 'DOCUMENT' | 'INGESTION' | 'RBAC_USER' | 'RBAC_PERMISSION' | 'AUTH' | 'ORACLE_SYNC' | 'AP_BATCH'
  docId        String   @default("—")         // e.g. "DMS-100", "AP-20261016-001", "USER_MANAGEMENT", "MASTER_DATA"
  whoId        String?                        // Actor user ID
  who          String                         // Actor display name (e.g. "สมศักดิ์ ใจดี", "IT Admin")
  role         String                         // Actor role ('SA', 'ADM', 'APR', 'ACC', 'EU')
  act          String                         // Human-readable action name in Thai
  action       String?                        // Programmatic action code (e.g. 'INGEST', 'APPROVE', 'CREATE_USER', 'UPDATE_PERMISSIONS', 'ORACLE_SYNC')
  fromStatus   String?
  toStatus     String?
  reason       String?
  note         String?
  detail       String                         // Detailed descriptive summary
  metadataJson String?                        // Serialized JSON with structured changes / diffs
  ipAddress    String?
  createdAt    DateTime @default(now())

  @@index([category])
  @@index([docId])
  @@index([createdAt])
}

model Company {
  code        String   @id // Short code: AH, AHP, AHT, AF, AITS, AM, AHA, AMPK, AMPT, ABC, AEV, MG, AVEE...
  name        String       // Official legal entity name
  taxId       String?      // Tax Identifier (e.g. 'TH3011706022')
  ouName      String?      // Oracle EBS Operating Unit name (e.g. 'AH - Aapico Hitech')
  ledgerName  String?      // Oracle EBS Ledger name (e.g. 'AH_Ledger')
  orgId       Int?         // Oracle Organization ID (e.g. 101, 176, 195, 413, 535)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
  @@index([orgId])
}
```

---

## 3. The 26 Real AAPICO Companies Dataset

Extracted live from Oracle EBS via MCP (`APPS.HR_OPERATING_UNITS` + `APPS.XLE_ENTITY_PROFILES` + `APPS.GL_LEDGERS`):

| Code | ORG_ID | Company Legal Name | Tax Identifier | Operating Unit Name | Ledger Short Name |
|---|---|---|---|---|---|
| **AH** | 101 | AAPICO HITECH PUBLIC COMPANY LIMITED | TH3011706022 | AH - Aapico Hitech | AH_Ledger |
| **AHP** | 176 | AAPICO HITECH PARTS CO., LTD. | TH3031854475 | Aapico Hitech Parts Legal | AHP_Ledger |
| **XXX** | 177 | AAPICO SPECIAL UNIT | TH3031854468 | XXX | XXX_SOB |
| **AHT** | 195 | AAPICO HITECH TOOLING CO., LTD. | TH3031854468 | Aapico Hitech Tooling Legal | AHT_Ledger |
| **AF** | 197 | AAPICO FORGING PUBLIC COMPANY LIMITED | TH3101867473 | Aapico Forging Legal | AF_Ledger |
| **AITS** | 202 | AAPICO ITS CO., LTD. | TH3031476790 | Aapico ITS Legal | AITS_Ledger |
| **AMT** | 223 | A MACTION CO., LTD. | TH3032470698 | A Maction Legal | AMT_SOB |
| **AMK** | 243 | AAPICO MITSUIKE CO., LTD. | TH3032425681 | Aapico Mitsuike Legal | AMK_Ledger |
| **AERP** | 263 | A ERP CO., LTD. | TH3033897869 | A ERP Legal | AERP_SOB |
| **AP** | 285 | AAPICO PLASTICS PUBLIC COMPANY LIMITED | TH3101140408 | Aapico Plastics Legal | AP_SOB |
| **ASP** | 289 | AAPICO STRUCTURAL PRODUCTS CO., LTD. | TH3033368901 | Aapico Structural Legal | ASP_Ledger |
| **AAMT** | 292 | AA MASTER LEGAL | TH1 | Master Legal | AAMT_SOB |
| **AAA** | 309 | AAPICO AMATA CO., LTD. | TH0105535001499 | Aapico Amata Legal | AAA_Ledger |
| **AL** | 329 | AAPICO LEADTECH CO., LTD. | TH0145556001111 | Aapico Leadtech Legal | AL_Ledger |
| **EA** | 349 | EDSCHA AAPICO AUTOMOTIVE CO., LTD. | TH0145556001391 | Edscha Aapico Automotive Legal | EA_SOB |
| **APC** | 353 | AAPICO PRECISION CO., LTD. | TH0205557018563 | Aapico Precision Legal | APC_Ledger |
| **AM** | 373 | ABLE MOTORS CO., LTD. | TH0135546008643 | Able Motors Legal | AM_SOB |
| **AMMT** | 375 | AM MASTER LEGAL | TH1 | AM Master Legal | AMMT_SOB |
| **CONSO** | 393 | AAPICO CONSO GROUP | Conso_TH3011706022 | OU_AAPICO CONSO GROUP | AAPICO CONSO_Ledger |
| **AHA** | 413 | AAPICO HITECH AUTOMATION CO., LTD. | 0145563000434 | Aapico Hitech Automation Legal | AHA_Ledger |
| **AMPK** | 453 | ABLE MOTORS PAKKRED CO., LTD. | 0125562036711 | Able Motors Pakkred Legal | AMPK_Ledger |
| **AMPT** | 473 | ABLE MOTORS PHATHUMTHANI CO., LTD. | 0135562027568 | Able Motors Phathumthani Legal | AMPT_Ledger |
| **ABC** | 475 | AAPICO BIKE CO., LTD. | 0145553001829 | Aapico Bike Legal | ABC_Ledger |
| **AEV** | 535 | ABLE EV CO., LTD. | 0135566030351 | Able EV Legal | AEV_Ledger |
| **MG** | 555 | MG ABLE MOTORS CO., LTD. | 0135564010484 | MG Able Motors Legal | MG_Ledger |
| **AVEE** | 596 | AAPICO AVEE SDN. BHD. | 200301017448 | Aapico AVEE | AVEE(M) LEDGER |

---

## 4. API Endpoints Specification

### 4.1 `GET /api/audit-logs`
- **Query Params:**
  - `search`: string (matches `who`, `act`, `detail`, `docId`)
  - `category`: string (filters `INGESTION`, `DOCUMENT`, `AP_BATCH`, `RBAC_USER`, `RBAC_PERMISSION`, `AUTH`, `ORACLE_SYNC`)
  - `whoId`: string (actor id)
  - `role`: string (actor role)
  - `companies`: comma-separated strings
- **RBAC Security Scoping:**
  - `SA` and `ADM`: Returns all log categories without restriction.
  - `APR`: Allowed categories: `DOCUMENT`, `INGESTION`, `AP_BATCH`. Filtered to company codes in user's assigned `co` array.
  - `ACC`: Allowed categories: `DOCUMENT`, `AP_BATCH` for assigned companies.
  - `EU`: Allowed categories: `DOCUMENT` for own receiver name or company.

### 4.2 `POST /api/users` (Diff & RBAC Audit Logging)
- Computes before-and-after state when saving a user:
  - Is new user? -> Category `RBAC_USER`, Action `CREATE_USER`, Act `สร้างผู้ใช้ใหม่`
  - Existing user changed? -> Category `RBAC_PERMISSION`, Action `UPDATE_PERMISSIONS`, Act `แก้ไขสิทธิ์ผู้ใช้`
  - Calculates diff for `companies` (added/removed), `receivers` (added/removed), and `role` (from -> to).
  - Serializes diff into `metadataJson`.

### 4.3 `GET /api/companies`
- Returns all companies from the `Company` database table.
- Accepts `?search=` to filter by code, name, taxId, or ouName.
- Automatically seeds the 26 companies if table is empty.

### 4.4 `POST /api/oracle/sync-companies`
- Queries live Oracle MCP tool `sql_run` with query:
  ```sql
  SELECT 
    hou.ORGANIZATION_ID AS ORG_ID,
    hou.NAME AS OU_NAME,
    xle.LEGAL_ENTITY_IDENTIFIER AS TAX_ID,
    xle.NAME AS COMPANY_NAME,
    gl.SHORT_NAME AS LEDGER_SHORT_NAME
  FROM APPS.HR_OPERATING_UNITS hou
  LEFT JOIN APPS.XLE_ENTITY_PROFILES xle ON hou.DEFAULT_LEGAL_CONTEXT_ID = xle.LEGAL_ENTITY_ID
  LEFT JOIN APPS.GL_LEDGERS gl ON hou.SET_OF_BOOKS_ID = gl.LEDGER_ID
  ORDER BY hou.ORGANIZATION_ID
  ```
- Upserts all 26 records into Prisma `Company` table.
- Creates an `AuditLog` entry with `category = 'ORACLE_SYNC'`.

---

## 5. UI Specification

### 5.1 `AuditPage.tsx`
- **Toolbar Filter Bar:**
  - Search box: `<input type="text" placeholder="ค้นหาตามชื่อผู้ใช้, รหัสเอกสาร, กิจกรรม หรือรายละเอียด..." />`
  - Category dropdown: `<select>` with options:
    - ทั้งหมด (All)
    - นำเข้าเอกสาร (Ingestion)
    - การดำเนินงานเอกสาร (Document Actions)
    - การส่ง AP เข้า Oracle (AP Batches)
    - การจัดการผู้ใช้ (User Management)
    - การแก้ไขสิทธิ์ (Permission Changes)
    - ความปลอดภัยและเข้าสู่ระบบ (Authentication)
    - การซิงค์ข้อมูลภายนอก (Oracle Sync)
  - Badge counter: "แสดง X จาก Y รายการ"
- **Table Columns:**
  - วันที่ / เวลา (Mono)
  - ประเภท (Category Badge with distinct colors)
  - ผู้ใช้งาน (Who & Role Pill)
  - กิจกรรม (Activity)
  - อ้างอิง / เอกสาร (Doc Ref)
  - รายละเอียด (Detail with Diff summary)

### 5.2 `RbacPage.tsx` (Tab 3: Companies & ORG_ID)
- Search box for 26 companies (instant filtering).
- "ดึงข้อมูลจาก Oracle (MCP)" button with active spin state and last-sync timestamp.
- Responsive table with 26 companies showing Code, Legal Name, OU Name, Tax ID, ORG_ID, Ledger, and Status.

---

## 6. Verification Plan
1. **Prisma DB Migration & Seeding:** Run Prisma migration/push, verify `Company` table exists and `AuditLog` has `category` and `metadataJson`.
2. **Unit & API Tests:**
   - `auditLogScoping.test.ts`: Verify multi-category filtering, text search, and role scoping.
   - `userDiffAudit.test.ts`: Verify creating user creates `RBAC_USER` log; updating permissions creates `RBAC_PERMISSION` log with correct diff in `metadataJson`.
   - `companyMasterSync.test.ts`: Verify 26 companies seeded, searchable via `GET /api/companies`, and synced via `POST /api/oracle/sync-companies`.
3. **Frontend Integration Tests:**
   - Verify `AuditPage.tsx` renders unified table, search filter, and category dropdown.
   - Verify `RbacPage.tsx` Tab 3 renders 26 companies and live search filter.
4. **Full Regression:** Run `npm test`, `npm run typecheck`, and `npm run build`.
