# Portal Evidence Findings & 3-State Evidence Button Implementation Plan

> **For Antigravity / Pi:** REQUIRED WORKFLOW: `.agent/skills/executing-plans` + `single-flow-task-execution` · one task at a time · update `docs/plans/task.md` at each state change.
> **Pair plan:** `engine/docs/plans/2026-10-26-evidence-findings-implementation.md` · **UI reference:** `evidence-3state-demo.html`

**Goal:** เปลี่ยนการแสดง evidence จาก "1 rule = 1 กล่อง" เป็น "1 finding = 1 ปุ่ม" พร้อมปุ่ม 3 สถานะ
| สถานะ | เงื่อนไข | เมื่อกด |
|---|---|---|
| **ระบุตำแหน่งได้** | finding มี bbox | เปลี่ยนหน้า → กล่องกลางจอ → กรอบกระพริบ · หลายกล่องมี ‹ n/m › |
| **ไม่มีตำแหน่ง** | มี finding แต่ไม่มี bbox | **ไม่เลื่อน PDF** · banner: เหตุผล / ค่าที่ได้ / ค่าที่คาดไว้ |
| **ไม่มีหลักฐาน** | rule ผ่าน หรือ ไม่มี finding | ไม่แสดงปุ่ม |

**Architecture:** adapter สร้าง `findings[]` จาก `engine.evidence` ทีละแถว → `RuleCheck.findings` → overlay/dock เลือกด้วย `findingId` (equality) แทน `startsWith` · element ที่ใช้ร่วมหลาย rule ใช้ multi-map · ฟิลด์เดิมคงไว้ (= finding แรก) เพื่อ backward compat · รองรับทั้ง engine v5.5/5.6 (schema 3.0) และ v5.7 (schema 3.1: review evidence, reason ใหม่, `field_name`/`line_no`/`kind`)

**Tech Stack:** React 19 · Vite · TypeScript · Zod · Prisma (SQLite) · CSS · Vitest + RTL

**Base:** `frontend/` v5.3.0 (เหมือนกับ `aiva-main` ทุกไฟล์)

---

## สถานะ (อัปเดต 2026-10-26)
| Task | สถานะ | หมายเหตุ |
|---|---|---|
| F1 F2 F10 | ✅ เสร็จ | + adapter ทน `bbox_missing_reason` แปลก, แถว review ไม่แย่งสีกล่อง |
| F3 | ✅ เสร็จ | ตรวจด้วย test logic + ข้อมูลจริง |
| F4 | ✅ เสร็จ | `openEvidence`, `focus.ts` · dock ยังไม่ได้ลองบนหน้าจอ |
| F5 | ✅ เสร็จ (รอดูหน้าจอ) | render ครบ 125 ฉบับด้วย React 19 server render |
| F6 | ✅ เสร็จ (รอดูหน้าจอ) | chip ต่อ finding, status bar ‹ n/m ›, banner, Alt+ลูกศร |
| F7 | ✅ เสร็จ (รอรันกับ DB) | logic ผ่านทั้ง 125 ฉบับ · ไม่ได้เพิ่ม script ใน `package.json` (ไม่มีไฟล์ใน source) |
| F8 | ✅ เสร็จ (รอดูหน้าจอ) | `/viewer/:id?finding=` · mock ถอยไปจับตามกฎ |
| F9 | ✅ เสร็จ | token เท่านั้น · gendark ผลเท่าเดิม · E11/V-07 = mismatch |

---

## 0. สิ่งที่พบในโค้ด

| # | ปัญหา | ตำแหน่ง | Task |
|---|---|---|---|
| 1 | ปุ่ม "ดู" ทุก rule · ไม่มี bbox → เปิดหน้า 1 | `src/components/queue/InvoiceDetailPane.tsx` l.364, 413, 680 (`r.page \|\| 1`) | F5 |
| 2 | chip แสดงทุก rule fail/MR แม้ไม่มี finding | `src/components/evidence/DockControls.tsx` | F6 |
| 3 | adapter เก็บ evidence **แถวแรกของ rule** (`evByRule`) → message/actual/expected/code มาจาก finding แรก · `boxForRule()` เลือกกล่องเดียว · จับคู่ด้วย `startsWith` | `engineToPortalAdapter.ts:156-164` · `portalDocToInvoiceDoc.ts:122` · `EvidenceViewerDock.tsx:235` · `overlayModel.ts:170` | F1, F2, F3, F6 |
| 4 | element เป็นหลักฐานหลาย rule ไม่ได้ (first-wins 3 จุด) | `evidenceByElement` (adapter) · `links` ใน `viewerBoxesFromInvoiceDoc` (`overlayModel.ts:262`) · `portalBboxesToRawPayload` (`portalDocToInvoiceDoc.ts:264`) | F1, F3 |
| 5 | ลายเซ็น: นับ `rawValue` ไม่ว่าง = มี → engine v5.6 ส่ง `"empty"` จะกลายเป็น ✓ | `mockSignatureFlags()` `portalDocToInvoiceDoc.ts:199` (RELEASE_NOTES v5.6 ระบุไว้ว่ายังไม่แก้) | F2 |
| 6 | contract pin `z.literal('aiva.system_a.result/3.0')` · `bbox_missing_reason: z.unknown()` · `z.object` ตัดฟิลด์ใหม่ทิ้ง | `engineResultV3Schema.ts:78-98, 166` | F10 |
| 7 | E11 จาก V-07 (จับคู่ด้วยคำบรรยาย) ถูกระบายเป็นหมวด "ซ้ำ" | `validationCategories.ts` `getValidationCategory` | F9 |

---

### Task F1: Portal contract — `PortalFinding` + adapter ทีละ evidence

**Files:**
- Modify: `src/features/engine/types/portalDomain.ts` (`PortalRuleCheck` l.149, `PortalBoundingBox` l.200)
- Modify: `src/features/engine/adapters/engineToPortalAdapter.ts` (`transformValidatedEngineResult` l.129)
- Test: `src/test/engineFindings.test.ts`

**Step 1: failing test** (ไฟล์จริงใน `temp/paperless_invoices_v5`)
- `DMS-27`: `rules[V-07].findings.length === 10` · บรรทัด 2 → page 1 · บรรทัด 5 → page 3
- `DMS-123`: V-01 `customer_tax_id` → `targets = []`, `missingReason ∈ {NOT_PRESENT, NOT_LOCATED}`
- `DMS-40`: `bbox_missing_reason = null` → `missingReason = 'UNKNOWN'`
- เอกสารที่ `sub_total` ใช้ร่วม V-03/V-09 → bbox `sub_total` มี `findingIds.length === 2`
- fixture สังเคราะห์ v5.7: evidence `result="manual_review"`, `exception_code=null`, `severity=null` → finding `kind='review'` · **`exceptions[]` ของ Portal ไม่เพิ่ม**

**Step 2:** `npx vitest run src/test/engineFindings.test.ts` → FAIL

**Step 3: implement**
```ts
export type FindingMissingReason =
  'NOT_PRESENT' | 'NOT_LOCATED' | 'PAGES_INCOMPLETE' | 'LOW_CONFIDENCE' | 'NO_ELEMENT' | 'UNKNOWN'

export interface PortalFindingTarget {
  id: string                       // linkKey(element_id)
  elementId: string
  pageNo: number
  bbox: [number, number, number, number]
  kind: 'row' | 'cell' | 'field' | 'signature' | 'other'
  label?: string                   // "L7 · qty", "sub_total", "ลายเซ็นผู้รับ"
}

export interface PortalFinding {
  id: string                       // evidence_id ?? `${rule_id}#${i}`
  ruleId: string
  kind: 'exception' | 'review'     // review = exception_code null (engine v5.7)
  result: 'fail' | 'manual_review' | 'pass' | 'not_evaluated'
  code: string | null
  severity: 'Low' | 'Medium' | 'High' | null
  messageTh: string | null
  actual: string | number | null
  expected: string | number | null
  fieldName?: string | null        // schema 3.1
  lineNo?: number | null           // schema 3.1
  relatedElementIds: string[]
  oracleRefs: string[]
  targets: PortalFindingTarget[]   // [] = ไม่มีตำแหน่ง
  missingReason?: FindingMissingReason
  missingElementIds?: string[]
}
// PortalRuleCheck  += findings: PortalFinding[]
// PortalBoundingBox += findingIds: string[]
```
- วน `engine.evidence` ทั้งหมด · ผูกกับ rule ผ่าน `rule_results[].evidence_ids` (ไม่พึ่งลำดับ)
- `kind`: `ev.kind` ถ้ามี (3.1) ไม่งั้น `exception_code == null ? 'review' : 'exception'`
- `missingReason`: อ่าน `bbox_missing_reason.reason` → ไม่อยู่ใน enum หรือ null แต่ `bboxes` ว่าง → `'UNKNOWN'`
- target `kind` จาก `ocr.elements[].element_type` · sort: row → cell/field → ตาม page, y
- `evidenceByElement: Map<string, string[]>` (append)
- **ฟิลด์เดิมของ `PortalRuleCheck`** (`exceptionCode`, `severity`, `messageTh`, `actual/expected`) = finding แรกที่ `kind==='exception'` → status/step progress ไม่เปลี่ยน
**Step 4:** PASS + `engineToPortalAdapter.test.ts`, `portalDomainContracts.test.ts` ยังผ่าน
**Step 5: commit** `feat(portal): findings model in engine→portal adapter`

---

### Task F2: UI model + state helper + ลายเซ็น `signed`/`empty`

**Files:**
- Modify: `src/types/invoice.ts` (`RuleCheck` l.19, `EvidenceSelection` l.125)
- Modify: `src/features/engine/adapters/portalDocToInvoiceDoc.ts` (`toRuleCheck` l.136 · ลบ `boxForRule` l.122 · `mockSignatureFlags` l.199 · `portalBboxesToRawPayload` l.264)
- Create: `src/features/evidence/findings.ts`
- Test: `src/test/findingState.test.ts`

**Step 3: implement**
```ts
export type FindingState = 'located' | 'unlocated'
export type RuleEvidenceState = 'located' | 'unlocated' | 'none'
export const findingState = (f: Finding): FindingState => (f.targets.length ? 'located' : 'unlocated')
export function ruleEvidenceState(r: RuleCheck): RuleEvidenceState   // none ถ้า PASS/SKIP หรือไม่มี finding
export function findingsOf(r: RuleCheck, doc: InvoiceDoc): Finding[] // r.findings ?? legacyFindings(r, doc)
export const MISSING_REASON_TH: Record<FindingMissingReason, string> = {
  NOT_PRESENT: 'ไม่พบข้อมูลนี้บนเอกสาร',
  NOT_LOCATED: 'อ่านค่าได้ แต่ระบุตำแหน่งบนเอกสารไม่ได้',
  PAGES_INCOMPLETE: 'เอกสารสแกนไม่ครบหน้า',
  LOW_CONFIDENCE: 'ระบบไม่มั่นใจผลการอ่าน',
  NO_ELEMENT: 'ระบบไม่ได้สร้างตำแหน่งของข้อมูลนี้',
  UNKNOWN: 'ไม่ทราบตำแหน่ง (engine ไม่ระบุเหตุผล)',
}
```
- `legacyFindings`: payload เก่าที่ไม่มี `findings` → 1 finding ต่อ rule จาก `ruleId/exceptionCode/pageNos/detail` + bbox ที่ `ruleId` ตรง (equality)
- `mockSignatureFlags`: ใช้ `normalizedValue === true || rawValue === 'signed'` → 1 · `'empty'`, `'false'`, `''`, `null`, `false` → 0
- `portalBboxesToRawPayload`: 1 กลุ่มต่อ finding
- `EvidenceSelection` += `findingId?`, `targetIdx?`, `locatable?`

**Step 1/4 test:** state 3 แบบ · legacy fallback · ลายเซ็น 6 ค่า · rule PASS → `none`
**Step 5: commit**

---

### Task F3: Overlay projector — `findingId` (ลบ `startsWith`)

**Files:** `src/features/pdf-viewer/lib/overlayModel.ts` (`ProjectOptions`, `projectOverlayBoxes` l.151/170, `viewerBoxesFromInvoiceDoc` l.262) · `src/features/pdf-viewer/components/BoundingBoxOverlay.tsx` · test: `src/test/overlayCategoryAndFilter.test.tsx`

- `ProjectOptions` += `activeFindingId?`, `activeTargetIdx?` · `activeRuleId` ใช้ equality เท่านั้น
- active finding → แสดงเฉพาะกล่องที่ `findingIds.includes(id)` · กล่อง `activeTargetIdx` = `focus` · กล่องอื่นของ finding = `dim`
- `links` เป็น `Map<string, string[]>`
- **Test:** `'V-0'` ไม่ match `'V-01'` · `sub_total` แสดงทั้งจาก V-03 และ V-09 · ไม่มี active → พฤติกรรมเดิม
**Commit**

---

### Task F4: Context — `openEvidence(finding, targetIdx)`

**Files:** `src/context/InvoiceContext.tsx` (`openEvidenceDock` l.178, `evidenceDockFocus` l.123) · test: `src/test/evidenceFocusContext.test.tsx`

```ts
type EvidenceFocus = { findingId?: string; ruleId?: string; page?: number; targetIdx?: number; locatable: boolean; nonce: number }
openEvidence(f: Finding, targetIdx = 0): void   // located → page = targets[i].pageNo · unlocated → page undefined
openEvidenceDock(page?: number, ruleId?: string) // deprecated: map ไป finding แรกของ rule (test เดิมผ่าน)
```
**Test:** unlocated → `page === undefined` · กดซ้ำ finding เดิม nonce เปลี่ยน
**Commit**

---

### Task F5: Detail pane — รายการ finding ในการ์ด + `EvidenceButton`

**Files:** Create `src/components/evidence/EvidenceButton.tsx` · Modify `src/components/queue/InvoiceDetailPane.tsx` (การ์ด `.exc` l.353-420, ตาราง rule l.650-690) · test: `src/test/validationEvidenceLinking.test.tsx` (แก้), `src/test/evidenceButton.test.tsx`

| ตำแหน่ง | located | unlocated | none |
|---|---|---|---|
| `EvidenceButton` | ทึบ · `target` · "หน้า N" (+ "· 3 กล่อง") | ขอบประ · `info` · "ไม่มีตำแหน่ง" | ไม่ render |
| finding `kind='review'` | ป้าย "ต้องตรวจ" แทน code (สีกลาง ไม่ใช่สี severity) | เหมือนกัน | — |
| การ์ด `.exc` | หัว = rule · รายการ finding (code/ป้าย · `messageTh` · ปุ่ม) · > 5 ยุบ "แสดงอีก N" | เหมือนกัน | ไม่มีลิงก์ "ดูหลักฐานหน้า N" |
| คลิกตัวการ์ด | = ปุ่มของ finding แรก | = banner ของ finding แรก | ไม่ทำอะไร |
| ตาราง rule "ดู" | 1 finding → ปุ่ม · หลาย → "N รายการ" (ไปแท็บข้อยกเว้น + scroll ไป rule) | เหมือนกัน | ว่าง |

- ข้อความหลัก = `messageTh` · ชื่อจาก `EXCEPTION_CATALOG` เป็นรอง
- `failRules` (l.114) กรองเฉพาะ `FAIL` → rule `manual_review` ไม่เคยขึ้นการ์ด · เปลี่ยนเป็น `FAIL || WARN` (manual_review map เป็น `WARN`) เพื่อให้ปุ่ม "ต้องตรวจ" มีที่แสดง
- `RULES.find(x => x.startsWith(r.rule))` (l.399, 661) → exact match รหัส rule
- คง `can('DMS')`
**Test:** rule PASS ไม่มีปุ่ม · DMS-123 ปุ่มประ · DMS-27 V-07 10 รายการ · review finding มีป้าย "ต้องตรวจ"
**Commit**

---

### Task F6: Dock — chip ต่อ finding · ‹ n/m › · banner · ไม่เลื่อนเมื่อไม่มีตำแหน่ง

**Files:** `src/components/evidence/DockControls.tsx` · `src/components/evidence/EvidenceViewerDock.tsx` (ลบ l.235-236) · Create `src/components/evidence/FindingBanner.tsx` · test: `src/test/dockFindingNav.test.tsx`

- **Chip:** 1 ต่อ finding (rule → page → y) · located ทึบ · unlocated ขอบประ · review มีจุดสีกลาง · ไม่มี finding = ไม่มี chip
- **Status bar:** `E11 · บรรทัด 2 · หน้า 1` + `‹ 1/3 ›` (กล่องใน finding) + `finding ก่อน/ถัดไป` (ใน rule) · คีย์ลัด `Alt+←/→` กล่อง, `Alt+↑/↓` finding (`[` ใช้กับ sidebar อยู่แล้ว)
- **located:** `setCurrentPage` → รอ `pageSize` หน้าใหม่ → `scrollIntoView({block:'center'})` → `.hl.focus`
- **unlocated:** ห้าม `setCurrentPage` / scroll · ล้าง focus เดิม · `FindingBanner`:
  ```text
  ⓘ ไม่พบตำแหน่งบนเอกสาร — {MISSING_REASON_TH[reason]}
     {messageTh}
     ค่าที่ได้: {actual ?? '—'}    ค่าที่คาดไว้: {expected ?? '—'}
     ข้อมูลที่เกี่ยวข้อง: {fieldName ?? label(missingElementIds)}
  ```
- **คลิกกล่องบน PDF:** หลาย `findingIds` → เลือก finding ที่ active ก่อน ไม่งั้นตัวแรก + popover "หลักฐานของ V-03, V-09"
- `aria-live="polite"` บน status bar และ banner
**Test:** unlocated ไม่เปลี่ยนหน้า/ไม่ scroll · DMS-27 บรรทัด 5 → หน้า 3 แล้วจึง scroll · ‹ › wrap
**Commit**

---

### Task F7: Backfill `findings` ให้เอกสารใน DB

**Files:** Create `scripts/backfill-findings.ts` · `package.json` (`"backfill:findings": "tsx scripts/backfill-findings.ts"`) · test: `src/test/backfillFindings.test.ts`

- เหตุผล: `Document.payloadJson` สร้างตอน ingest และ replay ไม่ transform ใหม่
- วน `ValidationRun` ล่าสุดต่อ `Document` → parse `rawEngineResult` → `transformEngineResultToPortalDoc` → **merge เฉพาะ** `rules[].findings` + `bboxes[].findingIds` (ห้ามทับ status / history / AP fields) · `--dry-run` · idempotent
- ใช้ซ้ำหลัง ingest ผล engine v5.7 ชุดใหม่
**Commit**

---

### Task F8: Mock mode & standalone viewer

**Files:** `src/components/evidence/EvidenceCanvas.tsx` · `overlayModel.ts` (`mockEvidenceViewerBBoxes` l.388) · `src/features/pdf-viewer/components/StandaloneBBoxViewer.tsx`
- Mock (INITIAL_DOCS): 1 finding ต่อ rule จาก region เดิม
- `/viewer/:id?finding=X3&t=0` (คง `?rule=` เดิม)
**Commit**

---

### Task F9: Category, CSS, dark theme

**Files:** `src/features/pdf-viewer/lib/validationCategories.ts` · `src/styles/evidence.css` · `src/styles/queue.css` · `src/styles/aiva/dark-compat.css` (generated)
- `getValidationCategory`: E11 จาก V-07 → `mismatch` · `duplicate` เฉพาะ `ruleId === 'duplicate'` · review → หมวดตาม rule
- CSS ใหม่: `.evbtn.loc`, `.evbtn.noloc`, `.evbtn.review`, `.evchip.noloc`, `.ev-status`, `.ev-nav`, `.ev-banner`, `.hl.dim` — ใช้ token `var(--t-*)`/`var(--s-*)`
- regenerate:
  `python3 tools/gendark.py src/styles/aiva/dark-compat.css src/styles/base.css src/styles/layout.css src/styles/queue.css src/styles/evidence.css src/styles/components.css src/styles/permissionGrid.css src/features/login/login.css`
- แก้ `src/test/validationCategories.test.ts`
**Commit**

---

### Task F10: รับ schema 3.1 (ต้อง deploy **ก่อน** engine E7)

**Files:** `src/features/engine/schemas/engineResultV3Schema.ts` (l.78-98) · `src/lib/validationStore.ts` · test: `src/test/engineSchema.test.ts`
- `contract` คง `z.literal('aiva.system_a.result/3.0')` · `versions.schema` รับ `'3.0' | '3.1'`
- `bbox_missing_reason`: `z.object({ element_ids: z.array(z.string()), reason: z.string() }).nullable().optional()` (reason แปลก → `'UNKNOWN'` ใน adapter)
- evidence += `kind?: 'exception' | 'review'`, `field_name?: string | null`, `line_no?: number | null`
- `exception_code`, `severity` คง nullable
**Test:** fixture 3.0 เดิมทั้งหมดผ่าน · fixture 3.1 สังเคราะห์ผ่าน · review evidence ไม่สร้าง `PortalException`
**Commit**

---

## Verification
```bash
cd frontend
npm ci && npm run typecheck && npm test
npm run backfill:findings -- --dry-run
npm run dev        # ตรวจ 2 ธีม: queue → detail pane → dock
```
| เอกสาร | ตรวจ |
|---|---|
| DMS-27 | V-07 10 finding · บรรทัด 5 → หน้า 3 · ‹ › วนแถว/เซลล์ |
| DMS-95 | ยอดรวมไม่มี bbox → ปุ่มประ · PDF ไม่ขยับ · banner (หลัง engine E3: แยก 9 ปุ่ม) |
| DMS-123 | V-01 `customer_tax_id` → banner `NOT_PRESENT` |
| DMS-40 | v5: `UNKNOWN` · v5.7: `PAGES_INCOMPLETE` |
| DMS-139 | v5: V-06 ไม่มีปุ่ม · v5.6+: E08/กล่อง `D1-sig-deliverer` หรือ banner |
| เอกสาร V-03+V-09 | กล่อง `sub_total` ขึ้นจากทั้งสอง rule |
| เอกสาร V-08 MR (v5.7) | ปุ่ม "ต้องตรวจ" ต่อบรรทัด · status เอกสารไม่เปลี่ยน |

## Order
```text
F1 → F2 → F3 → F4 → F10 → (deploy · engine E7 ได้) → F5 → F6 → F7 → F8 → F9
```
F1–F9 ใช้กับผล engine ปัจจุบันได้ทันที

## Decisions used (ค่าแนะนำ — แก้ได้)
1. คลิกตัวการ์ด = ปุ่มของ finding แรก
2. chip แสดงทั้ง located / unlocated (ขอบประ) และ review (จุดสีกลาง)
3. เอกสารเดิมใช้ backfill ไม่ re-seed
4. Mock mode = 1 finding ต่อ rule
5. ข้อความหลักใช้ `message_th` · E11 จาก V-07 ไม่ใช่หมวด "ซ้ำ"
6. มีปุ่ม finding ก่อน/ถัดไป คู่กับ ‹ n/m ›
