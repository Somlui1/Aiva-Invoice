# AIVA Portal — evidence findings (F1, F2, F10)

**แผน:** `docs/plans/2026-10-26-evidence-findings-portal-implementation.md` · **คู่กับ:** Engine v5.7 (`engine/docs/RELEASE_NOTES.md`)
**ขอบเขต:** ชั้นข้อมูลเท่านั้น (adapter, type, schema) · **UI ยังไม่เปลี่ยน** — F3–F9 (overlay, context, ปุ่ม 3 สถานะ, dock, backfill, CSS) เป็นงานถัดไป

| Task | สิ่งที่เปลี่ยน | ไฟล์ |
|---|---|---|
| F1 | `PortalFinding` 1 ตัวต่อ evidence 1 แถว ผูกกับ rule ผ่าน `rule_results[].evidence_ids` · `PortalRuleCheck.findings` · `PortalBoundingBox.findingIds` (element ใช้ร่วมหลาย rule ได้) · ฟิลด์ระดับ rule เดิมยังเป็นของ finding แรกที่มี code | `features/engine/types/portalDomain.ts`, `features/engine/adapters/engineToPortalAdapter.ts` (`buildFindings`, `targetLabel`, `normalizeMissingReason`) |
| F2 | `RuleCheck.findings`, `EvidenceSelection.findingId/targetIdx/locatable` · helper `findingState`, `ruleEvidenceState`, `findingsOf` (fallback 1 finding สำหรับ mock / payload เก่า), `unlocatedBanner`, `MISSING_REASON_TH` · `raw_payload.evidence` = 1 กลุ่มต่อ finding (payload เก่ายังจัดกลุ่มต่อ rule) · **ลายเซ็น: นับเฉพาะ `signed`/`true`** — กล่อง `empty` จาก engine v5.6+ ไม่เป็น ✓ อีก | `types/invoice.ts`, `features/evidence/findings.ts` (ใหม่), `features/engine/adapters/portalDocToInvoiceDoc.ts` |
| F10 | รับ schema 3.1: evidence `kind`, `field_name`, `line_no` · `bbox_missing_reason` แบบมี type (รูปแบบอื่น → `null` แทนการปฏิเสธทั้ง payload) · contract id ยัง `aiva.system_a.result/3.0` | `features/engine/schemas/engineResultV3Schema.ts`, `temp/schemas/result-3.1.schema.json` |

**Tests:** `src/test/engineFindings.test.ts` (ใหม่) · `src/test/uiParity.test.ts` แก้ 1 จุด (หา evidence group ของ rule ที่มีกล่องนั้น เพราะตอนนี้ rule หนึ่งมีได้หลายกลุ่ม)

**ตรวจแล้ว (ในเครื่องที่ไม่มี npm registry):**
- `tsc --strict` เฉพาะไฟล์ที่แก้ + `overlayModel.ts` + `server/portalDocs.ts` (ใช้ type stub ของ zod) = 0 error
- รัน adapter จริง (transpile) กับ 125 ฉบับ `paperless_invoices_v5`: finding 136 = evidence 136, located 125 / unlocated 11, element ใช้ร่วม 10, exceptions ไม่เปลี่ยน, rule PASS/SKIP ไม่มีปุ่ม, error 0
- กับผล engine v5.7 (schema 3.1) 125 ฉบับ: finding 232 (review 14), unlocated 30 ทุกตัวมีเหตุผล (`NOT_PRESENT` 27, `PAGES_INCOMPLETE` 3), error 0

**ยังไม่ได้ตรวจ — ต้องรันในเครื่องที่ติดตั้งแล้ว:** `npm ci && npm run typecheck && npm test`

**ลำดับ deploy:** Portal ชุดนี้ก่อน → แล้วจึง engine v5.7 (schema 3.1) · เอกสารที่อยู่ใน DB แล้วยังไม่มี `findings` จนกว่าจะทำ F7 (backfill) — ระหว่างนั้น `findingsOf()` ใช้ fallback
