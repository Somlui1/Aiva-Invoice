# AIVA Portal — Agent Rules (v5.13)

อ่านไฟล์นี้ก่อนทำงานทุกครั้ง แล้วอ่าน **`.agent/PROJECT_MAP.md`** (แผนที่โปรเจกต์) ก่อนแตะโค้ด
งานแบบ patch ให้ทำตาม **`.agent/workflows/apply-patch.md`** และรูปแบบใน **`docs/change/README.md`**

---

## 0. กฎสั้นที่สุด (ถ้าจำได้ข้อเดียว)

> **แก้ทุก task ให้ครบก่อน → verify ครั้งเดียว → ถ้า fail รันซ้ำเฉพาะไฟล์ที่ fail**
> ห้ามรัน `npm test` ทั้งชุดในเครื่อง (≈ 3 นาที, `fileParallelism:false`) — full suite เป็นหน้าที่ของ CI บน `main`

---

## 1. ลำดับการทำงาน (ทุกงาน)

| ขั้น | ทำอะไร | ห้าม |
|---|---|---|
| 1. อ่าน | `PROJECT_MAP.md` → ไฟล์ที่เกี่ยวข้องทั้งหมดของ **ทุก task** ในรอบนี้ | เริ่มแก้ก่อนอ่านครบ |
| 2. วางแผน | รายการไฟล์ที่จะแก้ + เทสต์ที่ได้รับผลกระทบ (เขียนลง `docs/plans/task.md` เป็นตาราง) | แผนที่ไม่มีรายชื่อเทสต์ |
| 3. แก้ | แก้ **ทุก task** ต่อเนื่องกันจนจบ · เทสต์ใหม่/ที่ต้องปรับก็แก้ในขั้นนี้ | รันเทสต์ระหว่าง task |
| 4. verify (ครั้งเดียว) | `node scripts/patch/verify.mjs --files <ไฟล์ที่แก้,คั่นด้วย,>` หรือ `--patch <version>` | `npm test`, `vitest` ทั้ง repo |
| 5. แก้จุดที่ fail | แก้เฉพาะสาเหตุ แล้ว `verify.mjs --only src/test/<ที่ fail>.test.ts` | รัน verify ทั้งแผนซ้ำเพื่อ "ดูอีกที" |
| 6. ส่งมอบ | สรุป: ไฟล์ที่แก้ · ผล verify (เวลา, จำนวนเทสต์) · ความเสี่ยงที่เหลือ | อ้างว่าผ่านโดยไม่มีผลรัน |

ระหว่างขั้น 3 อนุญาตเฉพาะ `npx tsc --noEmit` (≈ 2 วินาที) เมื่อไม่แน่ใจเรื่อง type — ไม่บังคับ

### งบเวลา verify ในเครื่อง
- typecheck ≈ 2 s · เทสต์ที่ได้รับผลกระทบ 5–20 ไฟล์ ≈ 15–60 s
- ถ้าแผนบอก `FULL SUITE` (เปลี่ยน `package.json`, `vitest.*`, `tsconfig.json`) → รันได้ **1 ครั้ง** ตอนท้าย หรือปล่อยให้ CI

### เลือกเทสต์ให้ถูก (verify ทำให้ แต่ต้องเข้าใจ)
- อัตโนมัติ: เทสต์ที่ `import` ไฟล์ที่เปลี่ยน **โดยตรง** (`scripts/patch/affected-tests.mjs <files>`)
- route ฝั่ง server (`server/routes/*.ts`): verify อ่าน mount path จาก `server/app.ts` แล้วเลือกเทสต์ที่เรียก path นั้นให้เอง
- เทสต์ที่ผู้เขียน patch รู้ว่าเกี่ยวแต่ไม่ได้ import ตรง (เช่นผ่าน context) → ใส่ใน `manifest.tests`
- `prisma/schema.prisma` เปลี่ยน → verify รัน `prisma generate` ให้ และนับทุกไฟล์ที่ import `src/lib/prisma.ts`
- CI บน merge request ใช้ `--deep` (importer ทุกชั้น) — ครอบคลุมกว่าในเครื่องอยู่แล้ว

---

## 2. Patch = version (ไม่มีเอกสารแยกต่อ version อีกต่อไป)

- งานแก้ทุกชุดออกเป็น **patch package** ตาม `docs/change/README.md` (`manifest.json` + `files/` + `CHANGE.md`)
- ใช้ `node scripts/patch/apply-patch.mjs <package>` เท่านั้น — เครื่องมือจะ backup, เขียนไฟล์, bump `package.json`,
  เพิ่ม entry บนสุดของ **`docs/change/CHANGELOG.md` ไฟล์เดียว**, บันทึก `docs/change/applied.json`, แล้ว verify ครั้งเดียว
- **ห้าม** สร้าง `CHANGELOG-vX.Y.md` / เอกสารสรุปแยกต่อ version · ห้ามแก้ version ใน `package.json` เอง
- patch ที่ได้รับมาวางไว้ที่ `docs/change/inbox/` · ใช้แล้วเครื่องมือย้ายไป `docs/change/applied/`
- ย้อนกลับ: `node scripts/patch/apply-patch.mjs --rollback <version>`
- base version ต้องตรงกับ `package.json` (patch ต่อเนื่องกัน) — ถ้าไม่ตรง **หยุดและแจ้งผู้ใช้** ห้ามใช้ `--force` เอง

### เมื่อผู้ใช้ส่งรายการแก้ไขหลายข้อ
1. รวมเป็น patch เดียว (version เดียว) เว้นแต่ผู้ใช้สั่งแยก
2. ข้อที่ผู้ใช้เขียนว่า "review ก่อน" → **ไม่แก้โค้ด** เขียนผลรีวิว + คำถามไว้ใน `CHANGE.md` หัวข้อ "รอตัดสินใจ"
3. คำถามที่ต้องถามผู้ใช้: ถามรวม **ครั้งเดียว** เป็นชุด พร้อมค่าแนะนำ (ตอบสั้นได้ เช่น "ตามแนะนำ ยกเว้นข้อ 3")
4. มี SRS/กติกาเดิม → ยึดกติกาเดิมก่อนเสมอ

---

## 3. กฎธุรกิจที่ห้ามละเมิด (ย่อ — รายละเอียดใน PROJECT_MAP §4)

- **1 invoice = 1 receive_id** · receive_id มีผู้ถือ (Confirmed / Sent / Posted / Import Failed) ได้ใบเดียว
  ตรวจที่ `src/server/receiveIdGuard.ts` ใน transaction เดียวกับการเขียน
- ตาราง transition มีที่เดียว: `src/lib/docTransitions.ts` (UI และ server ใช้ร่วมกัน) — ห้ามเขียนเงื่อนไขซ้ำในคอมโพเนนต์
- สิทธิ์เห็นเอกสารมีที่เดียว: `src/lib/docScope.ts` (`explainScope`) — server ใช้ทุก read/write/PDF
- สิทธิ์ action มีที่เดียว: `ROLES` (`src/mock/users.ts`) + แถวใน `src/lib/permissionMatrix.ts` — ห้ามเช็กชื่อ role ตรง ๆ
- AP callback: ยึดผลจาก Oracle API (ผ่าน / มีอยู่แล้ว = Posted · error = Import Failed) ไม่เทียบซ้ำเอง
- Production fail-closed: ไม่มี demo login / sample data / ingest ที่ไม่ใส่ key

---

## 4. ขอบเขตและความปลอดภัยของการแก้

- แก้เฉพาะที่ task ขอ · ไม่ refactor ข้างทาง · ไม่เปลี่ยนชื่อ export ที่เทสต์ใช้
- ไฟล์ส่วนใหญ่เป็น **CRLF** — คงรูปแบบบรรทัดเดิม (diff ทั้งไฟล์เพราะ line ending = ห้าม)
- เปลี่ยน DB schema ได้เมื่อจำเป็นจริงเท่านั้น และต้องระบุ `"db": true` ใน manifest
  (SQLite: container ทำ `prisma db push` ตอนเริ่ม · SQL Server: ต้องมี migration)
- ข้อความใน UI ภาษาไทยเป็นหลัก · เมนูผ่าน `src/lib/i18n.ts` (`t('key')`) · ข้อความไทยใหม่บนหน้าจอ → เพิ่มคำแปลใน `src/lib/i18n-en.json` (`exact`) แล้วรัน `node scripts/i18n/extract-th.mjs` ให้ไม่มีรายการค้าง
- CSS ใหม่ใส่ไฟล์ `src/styles/aiva/v<major><minor>.css` แล้ว `@import` ท้าย `src/styles/index.css`
  ระวังกฎกลาง `:focus-visible{box-shadow:…!important}` ใน `theme.css` — element ในกล่องที่ `overflow:hidden`
  ต้องใช้ focus แบบ inset (ดู `command-palette.css` v5.13)

---

## 5. Tooling (Antigravity)

- ทำงาน **ทีละ task** (single-flow) · ไม่ dispatch agent ขนาน
- Skills: `.agent/skills/<name>/SKILL.md` ก่อน `~/.gemini/skills`
- ติดตามงานใน `docs/plans/task.md` (ตารางอย่างเดียว · สร้างตอนเริ่มงาน ลบเมื่อส่งมอบ)
- Tool translation (skills อ้างชื่อเครื่องมือเก่า → ใช้ของ Antigravity):
  - Legacy assistant/platform names -> `Antigravity`
  - `Task` tool -> `browser_subagent` for browser tasks, otherwise sequential `task_boundary`
  - `Skill` tool -> `view_file ~/.gemini/skills/<skill-name>/SKILL.md` (or project-local `.agent/skills/<skill-name>/SKILL.md`)
  - `TodoWrite` -> update `<project-root>/docs/plans/task.md` task list
  - File operations -> `view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`
  - Directory listing -> `list_dir` · Code structure -> `view_file_outline`, `view_code_item`
  - Search -> `grep_search`, `find_by_name`
  - Shell -> `run_command` · Web -> `read_url_content`, `search_web` · User -> `notify_user`
  - MCP tools -> `mcp_*` tool family
- Shell บน Windows (PowerShell): ใช้ `node scripts/...` (ไม่ใช้ bash-only) · path คั่นด้วย `/` ได้

## 6. ก่อนบอกว่า "เสร็จ"
1. มีผล verify ล่าสุดที่ ✔ (หรือระบุชัดว่าอะไร fail และทำไม)
2. `docs/change/applied.json` มี `verify.ok: true` ของ version นี้ (ถ้าเป็นงาน patch)
3. รายงาน: ไฟล์ที่แก้ · เทสต์ที่รัน (จำนวน/เวลา) · สิ่งที่ยังไม่ได้ทำ/รอตัดสินใจ
