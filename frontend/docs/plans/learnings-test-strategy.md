# Post-Mortem & Incident Learning: Test Planning & Execution Efficiency

**Date:** 2026-10-28  
**Scope:** Frontend Patch & Test Verification Process

---

## 1. Description of Mistake (สิ่งที่ผิดพลาด)
ในการนำเข้า Patch `aiva_v5.12.patch` และการทดสอบระบบ:
- ได้ทำการเรียกคำสั่ง `npm test` แบบรันครอบคลุมทั้ง Repository (78 ไฟล์ทดสอบ, 855 tests) รวดเดียว
- เนื่องจาก Vitest ของโปรเจกต์นี้ตั้งค่า `fileParallelism: false` (รันเรียงลำดับทีละไฟล์เพื่อความถูกต้องของ SQLite database และ jsdom) ทำให้การรัน Full Suite ใช้เวลาเกือบ 3 นาที (178 วินาที)
- เมื่อเกิดข้อผิดพลาดเล็กน้อยที่ไม่ได้เกี่ยวกับ patch หลัก (เช่น การนับสถานะ fixture ใน `seedHarness.test.ts`) การสั่งรันทั้งชุดซ้ำทำให้เสียเวลาโดยเปล่าประโยชน์ และขัดต่อคำสั่งที่ต้องการความรวดเร็วและกระชับ

---

## 2. Root Cause Analysis (สาเหตุที่แท้จริง)
1. **ขาด Targeted Test Planning:** ไม่ได้ลิสต์ไฟล์เทสต์ที่ได้รับผลกระทบโดยตรงจาก patch ก่อนทำการรัน
2. **ละเลย Execution Cost:** ไม่ได้คำนึงถึงเวลาในการรันของ Full Test Suite (178 วินาที) เทียบกับ Targeted Test (10–15 วินาที)

---

## 3. Strict Rules & Corrective Action (กฎเหล็กเพื่อป้องกันไม่ให้เกิดขึ้นอีก)

### กฎข้อที่ 1: ห้ามสั่ง `npm test` แบบ Full Suite ในระหว่างขั้นตอน Patch / Debug / Iterate
- ในระหว่างการแก้ไขโค้ดหรือการ apply patch ห้ามยิงคำสั่ง `npm test` ทั้ง repo โดยเด็ดขาด

### กฎข้อที่ 2: ใช้ขั้นตอน 3 ระดับ (3-Step Execution Model) เสมอ
1. **Step 1: Typecheck First (1-2 วินาที)**
   - รัน `npm run typecheck` หรือ `tsc --noEmit` เพื่อตรวจ syntax และ types ให้ผ่านทั้งหมดก่อน
2. **Step 2: Targeted Testing (5-15 วินาที)**
   - วิเคราะห์ไฟล์ที่มีการเปลี่ยนแปลงจาก git diff หรือ patch
   - ระบุเฉพาะไฟล์ทดสอบที่เกี่ยวข้อง เช่น:
     ```bash
     npx vitest run src/test/v512.test.ts src/test/seedHarness.test.ts
     ```
   - แก้ไขและยืนยันผลจนผ่าน 100%
3. **Step 3: Final Verification (รันรอบเดียวเท่านั้นเมื่อพร้อมส่งมอบ)**
   - รัน Full Suite หรือ Build (`npm run build`) เฉพาะตอนจบงานเพื่อเป็นหลักฐานยืนยันความสมบูรณ์สุดท้าย

---

## 4. Updates Applied
- ได้บันทึกกฎนี้ลงใน [.agent/AGENTS.md](file:///c:/Users/wajeepradit.p/git/DMS_Invoice_Auto_mathing/frontend/.agent/AGENTS.md) เพื่อให้ Agent ทุกตัวปฏิบัติตามกฎนี้อย่างเคร่งครัด
