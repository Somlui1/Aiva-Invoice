# AIVA Portal v5.4 — evidence findings: ปุ่ม 3 สถานะ (F1–F10)

**แผน:** `docs/plans/2026-10-26-evidence-findings-portal-implementation.md` · **คู่กับ:** Engine v5.7 (schema 3.1)
**สถานะ:** F1–F10 เขียนครบ · ตรวจ logic และ markup แล้ว · **ยังไม่ได้รัน `npm test` / ดูหน้าจอจริง** (ดูหัวข้อ "ยังไม่ได้ตรวจ")

## ผลบนหน้าจอ
| ที่ | ก่อน | หลัง |
|---|---|---|
| การ์ดกฎ (สรุปผล) | ลิงก์ "ดูหลักฐานหน้า N" ทุกการ์ด · ไม่มี bbox → เปิดหน้า 1 | 1 ปุ่มต่อ finding: **ทึบ** = มีตำแหน่ง ("หน้า N · 3 กล่อง") · **ขอบประ** = ไม่มีตำแหน่ง · ไม่มี finding = ไม่มีปุ่ม · > 1 finding แสดงเป็นรายการ (5 รายการแรก + "แสดงอีก N") |
| การ์ด manual_review | ไม่มีการ์ดเลย | มีการ์ด ป้าย "ต้องตรวจ" สีกลาง ไม่มี severity ไม่ยืม E01 |
| ตารางกฎ | ปุ่ม "ดู" ทุกแถว รวมกฎที่ผ่าน | 1 finding → ปุ่ม · หลาย finding → "N รายการ" (ไปที่การ์ด) · ผ่าน/ข้าม → ว่าง |
| chip ใน dock | 1 chip ต่อกฎที่ fail/MR (แม้ไม่มีหลักฐาน) · "หน้า 1" เมื่อไม่รู้หน้า | 1 chip ต่อ finding · ทึบ/ขอบประ · "ต้องตรวจ" สำหรับ review |
| กด finding ที่มีตำแหน่ง | กระโดดไปกล่องแรกของกฎ (`startsWith`) | ไปหน้าของกล่องนั้น · เลื่อนให้อยู่กลาง · กรอบกระพริบ · กล่องอื่นของ finding เดียวกันจาง · ‹ n/m › วนกล่อง · รายการก่อน/ถัดไป · Alt+←/→/↑/↓ |
| กด finding ที่ไม่มีตำแหน่ง | เปิดหน้า 1 | **PDF ไม่ขยับ** · banner: เหตุผล · ข้อความ engine · ค่าที่ได้/ค่าที่คาดไว้ (เป็น "—" ถ้าไม่มี) |
| กล่องที่ใช้ร่วม (`sub_total` ของ V-03 + V-09) | ผูกกับกฎแรกเท่านั้น | ขึ้นจากทั้งสองกฎ |
| E11 จาก V-07 | สีม่วง "ซ้ำ" | สีหมวด "ไม่ตรงกับใบรับ" |
| `/viewer/:id` | ไม่รู้จัก finding | `?finding=X3&t=0` ไฮไลต์กล่องของ finding, จางกล่องอื่น, เลื่อนไปกล่องที่เลือก, บอกเหตุผลเมื่อไม่มีตำแหน่ง · ปุ่ม "เปิดในแท็บใหม่" ใน dock ส่ง finding ไปด้วย |
| ลายเซ็น ✓/✗ | `"false"`/`"empty"` นับว่ามี | นับเฉพาะ `signed`/`true` |

## ไฟล์
| Task | ไฟล์ |
|---|---|
| F1 adapter | `features/engine/adapters/engineToPortalAdapter.ts` (+ทนรูปแบบ `bbox_missing_reason` แปลก, แถว review ไม่แย่งสีกล่อง) |
| F2 UI model | `types/invoice.ts`, `features/evidence/findings.ts`, `features/engine/adapters/portalDocToInvoiceDoc.ts` (กลุ่ม evidence ต่อ finding รวมแถว review) |
| F3 overlay | `features/pdf-viewer/lib/overlayModel.ts` (`boxMatchesActive`, `activeFindingId`, `dim`, multi-link), `features/pdf-viewer/components/BoundingBoxOverlay.tsx` |
| F4 focus | `features/evidence/focus.ts` (ใหม่), `context/InvoiceContext.tsx` (`openEvidence`) |
| F5 detail pane | `components/evidence/EvidenceButton.tsx` (ใหม่), `components/queue/InvoiceDetailPane.tsx` |
| F6 dock | `components/evidence/FindingStatusBar.tsx` (ใหม่), `components/evidence/FindingBanner.tsx` (ใหม่), `components/evidence/DockControls.tsx`, `components/evidence/EvidenceViewerDock.tsx` |
| F7 backfill | `server/backfillFindings.ts` (ใหม่), `scripts/backfill-findings.ts` (ใหม่) |
| F8 viewer/mock | `features/evidence/viewerFocus.ts` (ใหม่), `components/viewer/StandaloneViewerRoute.tsx`, `features/pdf-viewer/components/StandaloneBBoxViewer.tsx`, `features/pdf-viewer/styles/standaloneViewer.css` · mock: กล่อง mock ไม่มี `findingIds` จึงถอยไปจับตามกฎ (ไม่ต้องแก้ canvas) |
| F9 CSS/สี | `styles/queue.css`, `styles/evidence.css` (ใช้ token เท่านั้น), `features/pdf-viewer/lib/validationCategories.ts` |
| F10 schema 3.1 | `features/engine/schemas/engineResultV3Schema.ts` (ไม่เปลี่ยนรอบนี้) |

**Tests ใหม่:** `findingOverlay` · `evidenceFocus` · `backfillFindings` · `openEvidenceContext` (RTL) · `evidenceButtons` (RTL) · **แก้:** `engineFindings` (+1), `validationCategories` (+1), `dockMockupHeader` (chip เป็นต่อ finding)

## ตรวจแล้ว (เครื่องไม่มี npm registry → ใช้ตัวจำลอง vitest/zod + React 19 จริงแบบ server render)
- test logic 9 ไฟล์ = **127 ผ่าน, 0 ล้ม** (`engineFindings`, `findingOverlay`, `evidenceFocus`, `backfillFindings`, `validationCategories`, `engineToPortalAdapter`, `portalDomainContracts`, `coordinateTransform`, `engineSchema`)
- render ด้วย React 19 (`react-dom/server`) ครบ 125 ฉบับ: การ์ด = จำนวนกฎ fail + manual_review ทุกฉบับ (รวมการ์ด "ต้องตรวจ" 46 ใบ), จำนวนปุ่ม = จำนวน finding (สูงสุด 5 ต่อการ์ด), ไม่มี "ดูหลักฐานหน้า" เหลือ, error 0
- `tsc --strict` ไฟล์ที่แก้/เพิ่มทั้ง 23 ไฟล์ (stub ของ react/zod): ไม่มี error ใหม่เทียบกับก่อนแก้
- `tools/gendark.py` ให้ผลเหมือนเดิมทุกไบต์ → **ไม่ต้อง regenerate `dark-compat.css`**

## ยังไม่ได้ตรวจ — ต้องทำในเครื่องที่ติดตั้งครบ
1. `npm run typecheck && npm test` — `openEvidenceContext.test.tsx` และ `evidenceButtons.test.tsx` ยังไม่เคยรัน
2. หน้าจอจริง 2 ธีม: คลิก/คีย์บอร์ด, เลื่อนไปกล่องหลังเปลี่ยนหน้า, zoom แล้วไม่เลื่อนซ้ำ, finding ไม่มีตำแหน่งไม่ขยับ PDF, `/viewer/:id?finding=`
3. `backfill-findings.ts` กับ DB จริง (ใช้ `--dry-run` ก่อน)

## ข้อควรรู้
- **`package.json` ไม่อยู่ใน source ที่ส่งมา** — ชุดนี้จึงไม่ได้แก้ ถ้าต้องการคำสั่ง npm ให้เพิ่มเอง: `"backfill:findings": "tsx scripts/backfill-findings.ts"` (หรือเรียก `npx tsx scripts/backfill-findings.ts --dry-run` ตรง ๆ)
- โหมด mock: ปุ่มของ finding ที่ไม่มีตำแหน่งจะไม่ขยับหน้า แต่บริเวณจำลองของกฎนั้นยังถูกไฮไลต์ (หน้าจำลองไม่มีกล่องราย finding)
- `openEvidenceDock(page, rule)` เดิมยังใช้ได้ (ปุ่ม "เปิดเอกสาร PDF" ใช้อยู่)
- ลำดับ deploy: Portal ชุดนี้ → engine v5.7 → `backfill-findings --dry-run` → รันจริง
