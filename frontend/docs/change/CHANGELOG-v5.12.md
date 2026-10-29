# v5.12 — live queue, confirm always, add-user dialog, one compose file, CI/CD, clear documents

## Live (SSE)
- `GET /api/events` (signed in): document events, each sent only to users who may see the document
  (`docVisibleTo`); ADM/SA get a content-free `audit` tick. Keep-alive `EVENTS_PING_SEC` (25 s); a user
  deactivated meanwhile is dropped at the next ping. One process only (multi-container → Redis).
- Published by: Engine ingest (new / re-validated / superseded), document actions, ผูกใบรับ,
  AP batch (sent / taken out), Oracle callback (posted / failed — after commit).
- Queue: banner "เอกสารใหม่ N · เปลี่ยนสถานะ N" + **โหลดรายการ** (nothing reloads by itself);
  loaded rows highlighted 8 s; sidebar "+N" on คิวตรวจสอบ. SSE down → polls every 60 s and says so.
- บันทึกการเข้าถึง: refreshes on events, new lines highlighted, live indicator. Ingest now writes an
  audit line for every arrival ("รับเอกสารใหม่จาก Engine" / "ตรวจซ้ำจาก Engine").
- Import Failed: immediate toast for APR.

## Confirm
- "รอผูกบัญชี" and "รอ End User แก้" no longer block accounting's Confirm; a note is required
  (dialog + server). Receipt-less documents still go through ผูกใบรับ; the receive_id guard is unchanged.

## เพิ่มผู้ใช้จาก AD
- Dialog rebuilt on theme tokens (aum.css): readable in dark and light, row hover/selection, ↑ ↓ Enter,
  disabled button says why.

## Run / deploy
- `docker-compose.yml` only (prod file and `.env.production.example` removed). Same `.env` as
  `npm start`; the container overrides NODE_ENV, DATABASE_URL (own volume), LDAP_CA_FILE, ports and turns
  dev logins/sample data off. Host port `AIVA_DOCKER_PORT` (3001), bind `AIVA_DOCKER_BIND` (0.0.0.0).
- `COOKIE_SECURE=auto|true|false` (unset = old behaviour) so the container works over http on the LAN.
- `.gitlab-ci.yml` (repo root): check → build → deploy (server runner `aiva-server`, no registry)
  → manual clear-documents. `.env` comes from the File variable `AIVA_ENV`.
- `npm run db:clear-docs -- --yes`: removes documents, runs, boxes, AP batches (+ their audit lines
  unless `--keep-audit`), keeps users / companies / Oracle accounts; backup first; allowed in production.
- `.dockerignore` now excludes `.env`, secrets, `.xlsx`, mockups.

## Upgrading an existing Docker install
The volume is now `aiva-portal_aiva_data` (was `<folder>_sqlite_data`). To keep the old database:
`docker run --rm -v <old>_sqlite_data:/from -v aiva-portal_aiva_data:/to alpine cp -a /from/. /to/`
