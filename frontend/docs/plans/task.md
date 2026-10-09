| id | task | status | notes |
| --- | --- | --- | --- |
| brainstorm-completed | Complete brainstorming & requirements exploration | completed | Design approved & written to docs/plans/2026-10-09-enterprise-portal-engine-integration-design.md |
| plan-created | Generate implementation plan | completed | Written to docs/plans/2026-10-09-enterprise-portal-engine-integration.md |
| task-1 | Setup Dependencies & Database Foundation (Prisma ORM) | pending | Install Prisma, Zod, define schema, configure DB client & connection test |
| task-2 | Engine Schema Validator & Portal Domain Contracts | pending | Define Engine Result 3.0 Zod schema and Portal Domain Model contracts |
| task-3 | Transformation Layer (EngineToPortalAdapter) | pending | Implement adapter mapping Engine 3.0 to Portal Domain & 4-step progress |
| task-4 | Webhook Ingestion API (/api/engine/ingest) | pending | Implement Next.js POST endpoint with idempotency check |
| task-5 | 126 Sample Files Ingestion Harness | pending | Create simulation script to ingest and verify 126 sample JSON files |
| task-6 | DMS PDF Streaming Proxy API with Fallback | pending | Implement /api/documents/:id/pdf proxy with mock fallback |
| task-7 | PDF.js Canvas Viewer with Interactive BBox Overlay | pending | Implement Canvas PDF rendering and interactive BBox highlight overlay |
| task-8 | UI Integration & Live Database Connection | pending | Connect Queue Page & Invoice Detail Pane to live database (100% Mockup Parity) |
| task-9 | Final End-to-End Verification & Verification Suite | pending | Run full suite: Vitest, build check, and e2e validation |
