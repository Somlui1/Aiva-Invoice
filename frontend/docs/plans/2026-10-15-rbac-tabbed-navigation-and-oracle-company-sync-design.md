# RBAC Tabbed Navigation & Oracle Company Sync Design

- **Status:** Approved
- **Date:** 2026-10-15
- **Project:** AIVA Invoice Auto-Matching Portal (`frontend`)
- **Author:** AIVA Portal Engineering & DeepMind Antigravity

---

## 1. Executive Summary & Problem Context

Currently, [RbacPage.tsx](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/components/governance/RbacPage.tsx) renders all permission governance components in a single, vertically scrolling page:
1. `PermissionExcelGrid` (Admin interactive editor)
2. `Matrix สิทธิ์ตามบทบาท (ตารางที่ 6)`
3. `ผู้ใช้งานในระบบและการผูกบัญชี (ตารางที่ 5)` (Read-only list for non-admin)
4. `บริษัทและ ORG_ID (ตารางที่ 4)`

This single-scroll layout causes visual clutter, excessive scrolling, and obscures the primary administrative workspace (`PermissionExcelGrid`). Furthermore, the company and ORG_ID mappings in [companies.ts](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/mock/companies.ts) are currently static dictionaries, with no live sync capability to the enterprise Oracle ERP.

This design establishes:
1. A **clean 3-tab layout** on [RbacPage.tsx](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/components/governance/RbacPage.tsx):
   - **Tab 1: 👤 จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)** *(Default landing)*
   - **Tab 2: 📋 Matrix สิทธิ์ตามบทบาท**
   - **Tab 3: 🏢 บริษัทและ ORG_ID**
2. An **Oracle MCP Company Sync API (`POST /api/oracle/sync-companies`)** that can query the live Oracle ORDS MCP JSON-RPC service (`http://ahebs.aapico.com:8080/mcp`) via tool `sql_run` to dynamically refresh operating units, company codes, tax IDs, and names.
3. A **"🔄 Sync ข้อมูลจาก Oracle"** button inside Tab 3 with live loading state, feedback toast, and seamless fallback if offline.

---

## 2. Architecture & Component Hierarchy

```
+---------------------------------------------------------------------------------------------------+
|                                      RbacPage.tsx                                                 |
+---------------------------------------------------------------------------------------------------+
|  [Header & Scope Note]                                                                            |
|  [Tabs: (1) จัดการสิทธิ์ผู้ใช้งาน (Count) | (2) Matrix สิทธิ์ (12) | (3) บริษัทและ ORG_ID (5) ]       |
+---------------------------------------------------------------------------------------------------+
                                            |
         +----------------------------------+----------------------------------+
         | (tab === 'users')                | (tab === 'matrix')               | (tab === 'companies')
         v                                  v                                  v
+-----------------------------+   +-----------------------------+   +-----------------------------+
| Tab 1: User Permissions    |   | Tab 2: Permission Matrix    |   | Tab 3: Company & ORG_ID     |
| - canManage?                |   | - Table of 12 Permissions   |   | - Sync from Oracle Button   |
|   Yes -> PermissionExcelGrid|   | - 4 Roles (EU, ACC, APR, ADM|   | - POST /api/oracle/sync-... |
|   No  -> Read-only Table 5  |   | - Green ✓ vs '—' badges     |   | - Table of Companies & Orgs |
+-----------------------------+   +-----------------------------+   +-----------------------------+
```

---

## 3. Detailed Specifications

### 3.1 Tab 1: จัดการสิทธิ์ผู้ใช้งาน (Admin Grid)
- **Role check**:
  - `canManage = can('MAP')`: Renders `<PermissionExcelGrid />`.
  - Non-Admin: Renders the standard read-only table of users (`USERS.map(...)`) with a banner informing that write privileges require IT Admin (`ADM`) role.
- **Tab Badge**: Shows total users count (e.g. `9`).

### 3.2 Tab 2: Matrix สิทธิ์ตามบทบาท
- Renders the Role-Permission matrix table (Table 6).
- Rows: 12 Permissions (`VIEW_OWN`, `VIEW_ALL`, `CONFIRM_MATCH`, `REVIEW_FAIL`, `HOLD_DOC`, `REJECT_DOC`, `MANUAL_REVIEW`, `MAP`, `APPROVE`, `AUDIT_VIEW`, `RULE_EDIT`, `POST_AP`).
- Columns: Role Pills (`EU`, `ACC`, `APR`, `ADM`).
- Tab Badge: `12`.

### 3.3 Tab 3: บริษัทและ ORG_ID & Oracle MCP Sync
- Renders company details (Company code, Legal name, Tax ID, ORG_IDs).
- Action toolbar: **"🔄 Sync ข้อมูลจาก Oracle"** button.
  - When clicked: Calls `POST /api/oracle/sync-companies`.
  - Shows spinner and disabled state during sync.
  - Displays last synced timestamp and success notification banner.
- Tab Badge: `5`.

### 3.4 API Route: `POST /api/oracle/sync-companies`
- **Location**: `src/app/api/oracle/sync-companies/route.ts`
- **Execution Flow**:
  1. Inspects `ORACLE_MCP_URL` (`http://ahebs.aapico.com:8080/mcp`) and `ORACLE_MCP_TOKEN`.
  2. If token and URL are present, executes JSON-RPC `tools/call` for `sql_run`:
     ```sql
     SELECT 
       hou.ORGANIZATION_ID AS ORG_ID,
       hou.NAME AS OU_NAME,
       xle.LEGAL_ENTITY_IDENTIFIER AS TAX_ID,
       xle.NAME AS COMPANY_NAME
     FROM HR_OPERATING_UNITS hou
     JOIN XLE_ENTITY_PROFILES xle ON hou.DEFAULT_LEGAL_CONTEXT_ID = xle.LEGAL_ENTITY_ID
     ORDER BY hou.ORGANIZATION_ID
     ```
  3. Parses returned rows and aggregates company codes, ORG_IDs, and names.
  4. Returns `{ ok: true, source: 'oracle_mcp' | 'mock_fallback', companies: [...] }`.
  5. Audit logs the sync action (`docId: 'MASTER_DATA'`, `action: 'oracle_sync_companies'`).

---

## 4. Verification & Testing

1. **Unit & Component Testing**:
   - Update and expand [rbacPageInteractive.test.tsx](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/src/test/rbacPageInteractive.test.tsx):
     - Verifies default active tab is `จัดการสิทธิ์ผู้ใช้งาน`.
     - Verifies switching to `Matrix สิทธิ์ตามบทบาท` displays matrix table.
     - Verifies switching to `บริษัทและ ORG_ID` displays company table and Sync button.
     - Verifies clicking Sync button calls `/api/oracle/sync-companies` and updates UI.
2. **API Route Testing**:
   - Create `src/test/oracleCompanySync.test.ts` to test endpoint responses and mock fallback.
3. **Full Regression Pass**:
   - `vitest run` (all 36 test files pass)
   - `tsc --noEmit` (clean)
   - `next build` (clean)
