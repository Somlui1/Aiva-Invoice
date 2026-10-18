# แผนงานการจัดการสิทธิ์และขอบเขตผู้ใช้งานแบบ Zero-Trust (Zero-Trust RBAC & Scope Management)

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** บังคับใช้นโยบายความปลอดภัย Zero-Trust RBAC อย่างเคร่งครัด โดยผู้ใช้งานทุกคนที่เข้าสู่ระบบแต่ยังไม่ได้รับการกำหนดสิทธิ์หรือขอบเขตบริษัท (Company Scope) โดยผู้ดูแลระบบในหน้า RBAC จะต้องไม่เห็นเอกสารหรือรายการใดๆ ในระบบทั้งสิ้น (0 รายการ) พร้อมรองรับการกำหนดสิทธิ์ขอบเขตทั้ง 26 บริษัท AAPICO และกำจัดข้อมูลผู้ใช้จำลอง (Fake Mock Users) ทั้งหมด

**Architecture:** ปรับปรุง `scopeCheck` ใน `AuthContext.tsx` ให้เป็น Zero-Trust Gateway สมบูรณ์แบบ, กำจัด Default Company Fallback ที่แอบใส่ `['AH', 'AHA', 'AHT', 'AHP', 'AM']`, ปรับหน้า `/queue` ให้แสดง Zero-Trust Empty State แจ้งเตือนผู้ใช้ให้ติดต่อ Admin, และขยายขอบเขตการเลือกบริษัทใน `UserInspectorPane` ให้รองรับครบทั้ง 26 บริษัท AAPICO จากฐานข้อมูล

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma ORM, SQLite, Vitest, Testing Library

---

## 1. Goal Description

ผู้ใช้งานระบุข้อกำหนดชัดเจน:
> *"การจัดการสิทธิ์และขอบเขต ; user ต้องมีการจัดการสิทธิ์การเสมอ หากไม่มีการจัดการสิทธิ์เเล้ว login จะไมเห็นรายการอะไร"*
> *"เอา user ปลอมออกไปให้หมด"*

ในเวอร์ชันก่อนหน้า มีจุดบกพร่องทางความปลอดภัยและสิทธิ์การเข้าถึงดังนี้:
1. `AuthContext.tsx` มีการ Fallback ใส่ 5 บริษัท (`['AH', 'AHA', 'AHT', 'AHP', 'AM']`) โดยอัตโนมัติใน 4 จุดเมื่อผู้ใช้ไม่มีบริษัทกำหนดไว้
2. ฟังก์ชัน `scopeCheck` มีเงื่อนไข `if (currentUser.co.length > 0 && !currentUser.co.includes(doc.company))` ซึ่งหมายความว่าถ้า `currentUser.co.length === 0` (ยังไม่ได้รับสิทธิ์บริษัทใดๆ) เงื่อนไขจะไม่ทำงานและคืนค่า `{ ok: true }` ทำให้ผู้ใช้ที่ยังไม่ได้รับสิทธิ์สามารถมองเห็นเอกสารได้
3. หน้าจัดการสิทธิ์ (`UserInspectorPane.tsx` และ `PermissionExcelGrid.tsx`) ฮาร์ดโค้ดให้เลือกบริษัทได้เพียง 4 บริษัท (`AH`, `AHT`, `AHP`, `AM`) แทนที่จะรองรับครบทั้ง 26 บริษัท AAPICO
4. ในระบบยังมี Mock User Roster (`u1`..`u8`, `itsupport`) หลงเหลืออยู่ในโค้ดและ Unit Test

แผนงานนี้จะปิดช่องโหว่เหล่านี้ทั้งหมด และสร้างมาตรฐาน Zero-Trust RBAC ที่ปลอดภัย ถูกต้องตามข้อกำหนด 100%

---

## 2. User Review Required

> [!IMPORTANT]
> **การเปลี่ยนแปลงพฤติกรรมระบบ (Behavioral Changes):**
> 1. ผู้ใช้งานใหม่ที่ล็อกอินผ่าน Active Directory หรือระบบใดๆ ก็ตาม หากผู้ดูแลระบบ (IT Admin / Super Admin) ยังไม่ได้เข้าไปในหน้า `/rbac` เพื่อกำหนด Role และเลือก Company Scope (เช่น AH, AHA, etc.) เมื่อล็อกอินเข้าสู่ระบบ จะพบหน้าคิวเอกสารที่ว่างเปล่า (0 ฉบับ) และเห็นข้อความแจ้งให้ติดต่อผู้ดูแลระบบเพื่อขอรับสิทธิ์
> 2. การกำหนดสิทธิ์ผู้ใช้งานจะกระทำผ่านหน้า **RBAC Console** (`/rbac`) โดย Admin สามารถค้นหาผู้ใช้จาก Active Directory (`/api/ad/search`), กำหนด Role, ติ๊กเลือกบริษัทจาก 26 บริษัท AAPICO, และผูกชื่อ Oracle Receiver จากนั้นกดบันทึก (Save Changes) ข้อมูลจะถูกบันทึกจริงลงฐานข้อมูล SQLite ทันที

---

## 3. Open Questions
*ไม่มีประเด็นที่คลุมเครือ — ข้อกำหนดจากผู้ใช้มีความชัดเจนและสอดคล้องกับมาตรฐาน Zero-Trust Architecture ทุกประการ*

---

## 4. Proposed Changes

Grouped by component layer:

### Component A: Core Security & Scope Gateway (`AuthContext.tsx`)

#### [MODIFY] `src/context/AuthContext.tsx`
- กำจัด Fallback 5 บริษัทในทุกตำแหน่ง (`savedProfile`, `saved` user ID, `/api/auth/me` sync, `switchRole`) ให้คงเป็น `[]` เมื่อยังไม่มีสิทธิ์
- อัปเกรด `scopeCheck` ให้ตรวจ Zero-Trust อย่างเข้มงวด:
  - หาก `currentUser.co.length === 0` (และไม่ใช่ Super Admin `SA` หรือบทบาทที่ scope `all`): คืนค่า `{ ok: false, why: 'ผู้ใช้งานยังไม่ได้รับการกำหนดสิทธิ์บริษัทในระบบ' }`
  - หากเป็นบทบาท `EU` (Receiver) และยังไม่ได้รับการผูกบัญชี Receiver (`acctsOf(currentUser).length === 0`): คืนค่า `{ ok: false, why: 'ยังไม่ได้รับการผูกบัญชี Oracle Receiver ในระบบ' }`

---

### Component B: Queue Zero-Trust Empty State UI (`QueuePage.tsx` & `QueueTableView.tsx`)

#### [MODIFY] `src/components/queue/QueuePage.tsx` & `src/components/queue/QueueTableView.tsx`
- เมื่อ `currentUser.co.length === 0` (ผู้ใช้ไม่ได้รับสิทธิ์บริษัทใดๆ):
  - แสดง Empty State Card ที่ชัดเจนและเป็นทางการ:
    - ไอคอนล็อก/ความปลอดภัย `shield` หรือ `lock`
    - ข้อความหัวเรื่อง: **"ยังไม่ได้รับการกำหนดสิทธิ์เข้าถึงข้อมูลบริษัท (Zero-Trust Security)"**
    - ข้อความอธิบาย: **"บัญชีผู้ใช้งานของคุณเข้าสู่ระบบสำเร็จแล้ว แต่ยังไม่ได้รับการมอบหมายขอบเขตบริษัท (Company Scope) หรือบทบาทการทำงานในระบบ กรุณาติดต่อผู้ดูแลระบบ (IT Administrator) เพื่อดำเนินการกำหนดสิทธิ์ในหน้า RBAC Console"**
    - หากผู้ใช้เป็น `ADM` หรือ `SA`: มีปุ่มลิงก์ลัด **"ไปที่หน้าจัดการสิทธิ์ (RBAC Console)"**

---

### Component C: RBAC 26 AAPICO Companies Binding (`RbacPage.tsx` & `UserInspectorPane.tsx`)

#### [MODIFY] `src/components/governance/rbac/UserInspectorPane.tsx`
- ปรับ `availableCompanies` ให้รับรายชื่อ 26 บริษัท AAPICO (เช่น AH, AHA, AHT, AHP, AM, AITS, ASP, ... จาก `COMPANIES_26`)
- เพิ่มปุ่มอำนวยความสะดวกใน Inspector: **"เลือกทั้งหมด (All)"** และ **"ล้างทั้งหมด (Clear)"** เพื่อให้ Admin ทำงานได้รวดเร็ว

#### [MODIFY] `src/components/governance/RbacPage.tsx`
- ส่ง `companiesList.map(c => c.code)` ไปยัง `UserInspectorPane` และ `PermissionExcelGrid` เพื่อให้ Admin มีตัวเลือกบริษัทที่สมบูรณ์ 100%

---

### Component D: Clean Mock Data & Update Regression Suite

#### [MODIFY] `src/mock/users.ts` & `src/app/api/users/route.ts`
- กำจัด Fake Mock User entries ออกจากระบบจริง
- ใน `/api/users`: ไม่ทำ auto-seed fake users ใส่ SQLite ถ้า DB ว่างเปล่า

#### [MODIFY] `src/test/authMe.test.ts` & `src/test/ldapAuth.test.ts`
- อัปเดตการทดสอบให้สอดคล้องกับ Zero-Trust:
  - ยืนยันว่าผู้ใช้ที่ไม่มีบริษัทใน DB จะได้ `companies: []`
  - ยืนยันว่า `scopeCheck` ปฏิเสธเอกสารทั้งหมดเมื่อผู้ใช้มี `companies: []`
  - ยืนยันว่าเมื่อ Admin กำหนดบริษัทให้ ผู้ใช้จะเห็นเฉพาะเอกสารในบริษัทนั้น

---

## 5. Bite-Sized Implementation Tasks

### Task 1: Strict Zero-Trust `scopeCheck` & Purge Fallback Companies in `AuthContext`
**Files:**
- Modify: `src/context/AuthContext.tsx`
- Create Test: `src/test/zeroTrustScopeCheck.test.ts`

### Task 2: Zero-Trust Empty State Banner & Notice in Queue UI
**Files:**
- Modify: `src/components/queue/QueuePage.tsx`
- Modify: `src/components/queue/QueueTableView.tsx`
- Create Test: `src/test/queueZeroTrustEmptyState.test.tsx`

### Task 3: 26 AAPICO Companies Binding & Quick Select in RBAC Console
**Files:**
- Modify: `src/components/governance/rbac/UserInspectorPane.tsx`
- Modify: `src/components/governance/RbacPage.tsx`
- Create Test: `src/test/rbac26CompaniesBinding.test.tsx`

### Task 4: Fix Test Parity & Remove Stale Mock User Expectations
**Files:**
- Modify: `src/test/authMe.test.ts`
- Modify: `src/test/ldapAuth.test.ts`
- Modify: `src/mock/users.ts`

### Task 5: Comprehensive Regression Verification & Next.js Production Build
**Files:**
- Update Task Tracker: `docs/plans/task.md`

---

## 6. Verification Plan

### Automated Tests
```bash
# 1. Run new Zero-Trust tests
npx vitest run src/test/zeroTrustScopeCheck.test.ts
npx vitest run src/test/queueZeroTrustEmptyState.test.tsx
npx vitest run src/test/rbac26CompaniesBinding.test.tsx

# 2. Run updated auth tests
npx vitest run src/test/authMe.test.ts src/test/ldapAuth.test.ts

# 3. Run full regression test suite
npm test

# 4. Run TypeScript compilation check
npx tsc --noEmit

# 5. Run Next.js production build
npm run build
```
