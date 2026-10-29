---
description: Apply a versioned patch package (docs/change/inbox) and verify once
---

1. อ่าน `.agent/AGENTS.md` และ `.agent/PROJECT_MAP.md`
2. ดูแผนก่อน (ไม่เขียนไฟล์): `node scripts/patch/apply-patch.mjs docs/change/inbox/<package> --dry-run`
   - base version ไม่ตรง `package.json` → **หยุด แจ้งผู้ใช้** ว่าขาด patch ไหน (ห้าม `--force` เอง)
3. ใช้ patch: `node scripts/patch/apply-patch.mjs docs/change/inbox/<package>`
   - เครื่องมือ backup → เขียนไฟล์ → bump version → เพิ่ม entry ใน `docs/change/CHANGELOG.md` → verify **ครั้งเดียว**
4. ถ้า verify ✖:
   - อ่าน error ทั้งหมดก่อน แก้ทุกจุดที่ fail ในรอบเดียว
   - รันซ้ำเฉพาะไฟล์ที่ fail: `node scripts/patch/verify.mjs --only src/test/<a>.test.ts,src/test/<b>.test.ts`
   - ถ้าแก้ไม่ได้ภายใน 2 รอบ → `node scripts/patch/apply-patch.mjs --rollback <version>` แล้วรายงาน
5. `manifest.db = true` → dev DB: `npx prisma db push` (Docker ทำเองตอน start)
6. commit: `git add -A && git commit -m "patch v<version>: <title>"` → push → CI ทำ check/build/deploy
7. รายงานผู้ใช้: version · ไฟล์ที่เปลี่ยน · ผล verify (เวลา/จำนวนเทสต์) · หัวข้อ "รอตัดสินใจ" จาก CHANGE.md

## สร้าง patch เอง (เมื่อผู้ใช้สั่งให้ agent แก้โค้ดโดยตรง)

1. แก้ทุก task ให้ครบ (ไม่รันเทสต์ระหว่างทาง)
2. `node scripts/patch/make-patch.mjs --version <x.y.z> --title "<สรุป>" [--tests a,b] [--db]`
   → สร้าง `docs/change/inbox/aiva-patch-v<x.y.z>/` จาก `git diff` (ไฟล์ที่แก้ทั้งหมด) + `CHANGE.md` ให้กรอก
3. กรอก `CHANGE.md` (สั้น: เปลี่ยนอะไร · ผลต่อผู้ใช้ · รอตัดสินใจ)
4. บันทึก version (ไม่คัดลอกไฟล์ซ้ำ, backup จาก git HEAD) + verify ครั้งเดียว:
   `node scripts/patch/apply-patch.mjs docs/change/inbox/aiva-patch-v<x.y.z> --in-place`
5. ทำข้อ 4–7 ด้านบนต่อ
