# docs/change — patch แบบมี version

ตั้งแต่ v5.13 การแก้ไขทุกชุดเป็น **patch package หนึ่ง version** และมีบันทึกการเปลี่ยนแปลง **ไฟล์เดียว**

| ที่ | คืออะไร |
|---|---|
| `inbox/` | วาง patch ที่ได้รับ (โฟลเดอร์หรือ `.zip`) — ไม่เข้า git |
| `applied/` | patch ที่ใช้แล้ว (เครื่องมือย้ายมาให้) |
| `CHANGELOG.md` | **บันทึกเดียว** ใหม่สุดอยู่บน — เครื่องมือเขียนให้จาก `CHANGE.md` ของแต่ละ patch |
| `applied.json` | ประวัติเครื่อง: version, ไฟล์ที่แตะ, ผล verify (เวลา/เทสต์) — CI เก็บเป็น artifact |
| `CHANGELOG-v5.*.md` | ประวัติก่อน v5.13 (อ่านอย่างเดียว ไม่เพิ่มไฟล์แบบนี้อีก) |

## รูปแบบ patch package

```
aiva-patch-v5.13.0/
├─ manifest.json
├─ CHANGE.md          entry ที่จะถูกเพิ่มบนสุดของ CHANGELOG.md
└─ files/             ไฟล์ฉบับเต็ม ตาม path จาก root ของ frontend/
   └─ src/…
```

```json
{
  "version": "5.13.0",
  "base": "5.12.0",
  "title": "สรุปสั้น",
  "db": false,
  "tests": ["src/test/x.test.ts"],
  "delete": ["path/ที่ต้องลบ.ts"],
  "packageJson": { "scripts": { "name": "command" } }
}
```

- `base` ต้องเท่ากับ `package.json` ปัจจุบัน → patch เรียงต่อกันเสมอ
- `files/` เป็นไฟล์ฉบับเต็ม (ไม่ใช่ diff) → ไม่มีปัญหา CRLF/LF หรือ hunk ไม่ตรง
- ห้ามใส่ `package.json` / `CHANGELOG.md` ใน `files/` — ใช้ `packageJson` (merge เฉพาะ scripts/deps) และ `CHANGE.md`

## คำสั่ง

```bash
node scripts/patch/apply-patch.mjs docs/change/inbox/aiva-patch-v5.13.0 --dry-run   # ดูว่าจะแตะอะไร
node scripts/patch/apply-patch.mjs docs/change/inbox/aiva-patch-v5.13.0             # ใช้ + verify ครั้งเดียว
node scripts/patch/verify.mjs --only src/test/a.test.ts                              # รันซ้ำเฉพาะที่ fail
node scripts/patch/apply-patch.mjs --rollback 5.13.0                                 # ย้อนกลับ
node scripts/patch/make-patch.mjs --version 5.13.1 --title "…"                       # แพ็กงานที่แก้ใน working tree
```

npm: `npm run patch:apply -- <pkg>` · `npm run patch:verify -- --files a.ts` · `npm run test:affected -- <files>`

## CI/CD (`ci/gitlab-ci.yml`)

commit `patch vX.Y.Z` → MR: typecheck + affected tests (`--deep`) → `main`: full suite 1 ครั้ง + build →
`scripts/deploy/compose-deploy.sh` (docker compose, image `aiva-portal:<version>-<sha>`, รอ health, rollback อัตโนมัติ)
