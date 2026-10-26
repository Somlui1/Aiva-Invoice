"""แพ็ก source ของ Portal (frontend) เป็น zip สำหรับนักออกแบบ — source ที่จำเป็นเท่านั้น

usage:  python scripts/pack_frontend_source.py <out_zip> [--fixtures] [--no-docs] [--print-list]

เกณฑ์เลือกไฟล์
  - เอาเฉพาะไฟล์ที่ git track และยังมีอยู่บนดิสก์ (ไฟล์ที่ถูก deletion ค้างใน working tree จะถูกข้าม)
  - ตัด: package*.json (นโยบายของนักออกแบบ — เพิ่มบรรทัด script เอง), temp/ corpus, mockup/, reference/, .agent/
  - include fixtures เท่าที่เทสต์ต้องใช้ (--fixtures, ค่า default = ใส่) 6 ไฟล์ ~1.9 MB ดิบ
    = DMS-27/35/40/95/100/123 จาก temp/paperless_invoices_v5/
  - เขียน README-PACKAGE.md ลงไปใน zip อธิบายสิ่งที่ตัดและวิธีได้ของคืน

ผลรวมที่วัดไว้ (v5.5): source ดิบ ~2.7 MB + fixtures 1.9 MB → zip ~0.7-0.9 MB
"""
import sys, os, subprocess, zipfile, io, datetime

FIXTURE_IDS = ['DMS-27', 'DMS-35', 'DMS-40', 'DMS-95', 'DMS-100', 'DMS-123']
EXCLUDE_PREFIX = ('mockup/', 'reference/', '.agent/', 'node_modules/', 'dist/', 'temp/paperless_invoices_v5_7/')
EXCLUDE_NAMES = ('package.json', 'package-lock.json')
README = 'README-PACKAGE.md'

FIXTURE_NOTE = '\n'.join(f'  - temp/paperless_invoices_v5/{i}_result.json' for i in FIXTURE_IDS)
FIXTURE_BLOCK = ('- fixtures ที่เทสต์อ้างถึง มีแค่ 6 ไฟล์:\n' + FIXTURE_NOTE) if True else ''


def read_me(has_fixtures: bool, files: list) -> str:
    fixture_block = FIXTURE_BLOCK if has_fixtures else ''
    return f"""# AIVA Portal — แพ็ก source (v5.5, สร้าง {datetime.date.today().isoformat()})

โค้ดฐาน: commit ล่าสุดของ `frontend/` (Portal v5.4 เส้นหลักฐาน F1–F10 + v5.5 production hardening)
รวม {len(files)} ไฟล์

## มีอะไรในนี้
- `src/` `server/` `scripts/` `prisma/schema.prisma` — โค้ดทั้งหมด (UI + Express API + Prisma)
- ไฟล์ configure ระดับ root: `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`,
  `vitest.db-url.ts`, `vitest.global-setup.ts`, `index.html`, `Dockerfile`, `docker-compose.prod.yml`,
  `docker-entrypoint.sh`, `.dockerignore`, `.gitignore`, `.env.example`, `.env.production.example`
- เอกสาร: `CHANGELOG-v5.4-evidence-findings.md`, `CHANGELOG-v5.5-security.md`,
  `docs/plans/2026-10-26-production-hardening.md`, `docs/issues/`
- `temp/schemas/` — JSON schema ของ result 3.0 / 3.1 (เทสต์ contract ใช้)
{fixture_block}

## ไม่มีในนี้ (และเอาคืนยังไง)
- `package.json` / `package-lock.json` — ตามนโยบายเดิม ถ้าต้องการรัน script ใหม่ของแพ็กนี้ให้เพิ่มเอง:
  ```json
  "db:reset": "tsx scripts/db-reset.ts",
  "check:integrations": "tsx scripts/check-integrations.ts",
  "backfill:findings": "tsx scripts/backfill-findings.ts"
  ```
- `temp/paperless_invoices_v5/` ทั้งโฟลเดอร์ (24.9 MB · 126 ไฟล์) — เป็นผลลัพธ์ของ Engine สร้าง/เอากลับได้ด้วย
  `npm run db:reset -- --yes --seed temp/paperless_invoices_v5 --admin <sam ของคุณ>`
  หรือ copy จาก repo หลัก (`frontend/temp/paperless_invoices_v5/`)
{('- เทสต์ที่อ่าน DMS อื่นจาก corpus จะ fail แบบ "file not found" ไม่ใช่บั๊กของโค้ด' if has_fixtures else '')}
- `mockup/`, `reference/aiva-styles/`, `.agent/skills/` — งานต้นทางของนักออกแบบและ skills ของ agent
- `node_modules/`, `dist/`, `prisma/*.db`

## รัน
```bash
npm ci && npx prisma generate      # ต้อง generate ไม่งั้น ~20 เทสต์ fail ด้วย "@prisma/client did not initialize"
npm run typecheck
npx vitest run                      # หรือ npm test
npm run dev                         # vite :3000 + express :3001
```
- เครื่องที่เป็น Windows + Git Bash บางเครื่อง `npm run <script>` / `npx` ไม่พิมพ์อะไรเลยและคืน exit 0
  ให้เรียกตรง ๆ แทน: `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/vitest/vitest.mjs run`,
  `node_modules/.bin/tsx scripts/db-reset.ts --yes`
- **อย่ารัน `npx prisma db push --force-reset` เปล่า ๆ** ในโฟลเดอร์นี้ — มันจะเอา `DATABASE_URL` จาก `.env`
  (=`file:./dev.db`) และลบฐานพัฒนา ใช้ `npm run db:reset` แทน (มีด่านกัน + backup)

## จุดที่เปลี่ยนในแพ็กนี้ (อ่านก่อนแก้ต่อ)
- `src/server/auth/` + `server/middleware/session.ts` — cookie ลงลายเซ็น HMAC เก็บแค่ user id,
  role/บริษัท/receiver อ่านจาก DB ทุก request, `AUTH_DEV_LOGIN` มีผลเฉพาะ dev
- `src/features/login/config.ts` — อ่าน `import.meta.env` (ไม่ใช่ `process.env`) → build production ปิด mock/bypass เสมอ
- `vitest.db-url.ts` — path ฐานเทสต์เป็น absolute เพื่อไม่ให้ `vitest` เขียนทับ `prisma/dev.db`
- `src/components/evidence/` + `src/features/evidence/` — เส้นหลักฐาน F1–F10 (บอกซ์ราย finding,
  banner, status bar, `Alt+←/→/↑/↓`, deep link `?finding=`) และ auto-scroll กลิ้งครั้งเดียวต่อ 1 request
"""


def main() -> None:
    args = [a for a in sys.argv[1:]]
    if not args or args[0].startswith('--'):
        print(__doc__)
        sys.exit(2)
    out = args[0]
    use_fixtures = '--no-fixtures' not in args
    use_docs = '--no-docs' not in args
    tracked = subprocess.run(['git', 'ls-files', '-z'], capture_output=True).stdout.decode().split('\0')
    tracked = [t.replace('\\', '/') for t in tracked if t]

    want_fixtures = {f'temp/paperless_invoices_v5/{i}_result.json' for i in FIXTURE_IDS}
    picked = []
    for f in tracked:
        if f in EXCLUDE_NAMES or f == README:
            continue
        if f.startswith(EXCLUDE_PREFIX):
            continue
        if f.startswith('temp/paperless_invoices_v5/'):
            if use_fixtures and f in want_fixtures:
                picked.append(f)
            continue
        if not use_docs and f.startswith('docs/'):
            continue
        if f.endswith(('.db', '.db-journal', '.png', '.jpg', '.7z', '.zip')):
            continue
        if not os.path.isfile(f):
            continue
        picked.append(f)

    if '--print-list' in args:
        for f in sorted(picked):
            print(f)
        print('# files:', len(picked))
        return

    # README must be inside the zip but is not a repo file (regenerated on every pack).
    if os.path.exists(out):
        os.remove(out)
    raw = 0
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr('frontend/' + README, read_me(use_fixtures and any(f in want_fixtures for f in picked), picked))
        for f in sorted(picked):
            raw += os.path.getsize(f)
            z.write(f, 'frontend/' + f)

    groups = {}
    for f in picked:
        top = f.split('/')[0] if '/' in f else '(root)'
        g = groups.setdefault(top, [0, 0])
        g[0] += 1
        g[1] += os.path.getsize(f)
    print('files:', len(picked), '| raw: %.2f MB' % (raw / 1048576))
    for k, (n, b) in sorted(groups.items(), key=lambda x: -x[1][1]):
        print('  %5s files  %8.2f MB  %s' % (n, b / 1048576, k))
    print('fixtures:', 'on' if use_fixtures else 'off', '| docs:', 'on' if use_docs else 'off')
    print('ZIP: %s = %.2f MB (%d bytes)' % (out, os.path.getsize(out) / 1048576, os.path.getsize(out)))


if __name__ == '__main__':
    main()
