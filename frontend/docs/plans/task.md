| id | task | status | notes |
| --- | --- | --- | --- |
| brainstorm-completed | Complete brainstorming & requirements exploration | completed | Design approved & written to docs/plans/2026-10-09-enterprise-portal-engine-integration-design.md |
| plan-created | Generate implementation plan | completed | Written to docs/plans/2026-10-09-enterprise-portal-engine-integration.md |
| task-1 | Setup Dependencies & Database Foundation (Prisma ORM) | completed | Prisma 6.19.3 + Zod 4.6.5 installed; schema.prisma (Document/ValidationRun/AuditLog) pushed to prisma/dev.db; src/lib/prisma.ts singleton; RED->GREEN proven (21/21 tests pass, tsc clean); commit f06e2cb |
| task-2 | Engine Schema Validator & Portal Domain Contracts | completed | Zod port of result-3.0.schema.json + Portal contracts per design §3.1-3.2; RED->GREEN; verified 125/125 corpus valid, 68/68 contract probes reject correctly, tsc clean; review fixed halted_by requiredness + non-null evidence bbox; commit 830c32e. NOTE: 2 contract-vs-reality gaps found for Task 3 (pageType union, companyCode 31/125 unresolved) |
| task-3 | Transformation Layer (EngineToPortalAdapter) | completed | Adapter + 4-step progress (grouping/thresholds ported from shipped InvoiceDetailPane); RED->GREEN; corpus 125/125 transform, 0 invariant problems, no NaN, status dist matches summary.json (51/23/12/39), line->bbox 358/358 linked; fixed D0: prefix bug + grLine type; commit 2f82150 |
| task-4 | Webhook Ingestion API (/api/engine/ingest) | completed | POST endpoint live: Zod contract guard (422 incl. Portal-owned keys), validation_id+file_sha256 idempotency (replay 200 / conflict 409), Document+ValidationRun in one transaction; 9 tests + real-HTTP smoke test |
| task-5 | 126 Sample Files Ingestion Harness | completed | simulate-engine-push.ts + independent cross-check vs summary.json; scans 126 JSON files (125 docs + index), ingests all 125 into dev.db, matches Engine aggregate + per-document; idempotent re-run = 125 replays; `npm run seed:engine` |
| task-6 | DMS PDF Streaming Proxy API with Fallback | pending | Implement /api/documents/:id/pdf proxy with mock fallback |
| task-7 | PDF.js Canvas Viewer with Interactive BBox Overlay | pending | Implement Canvas PDF rendering and interactive BBox highlight overlay |
| task-8 | UI Integration & Live Database Connection | pending | Connect Queue Page & Invoice Detail Pane to live database (100% Mockup Parity) |
| task-9 | Final End-to-End Verification & Verification Suite | pending | Run full suite: Vitest, build check, and e2e validation |
