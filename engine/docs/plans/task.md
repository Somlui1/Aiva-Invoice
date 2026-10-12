| Task | Status | Description |
|---|---|---|
| OCR Task 1: Date Normalization with English & Thai Month Names | Done | Support textual English and Thai months in `date_iso()`; eliminates E01 on DMS-27 & DMS-32; 49/49 tests pass |
| OCR Task 2: Thai Currency Zero-Satang Notation (`.-`) in `split_number()` | Done | Strip trailing `.-` and `-` in `split_number()`; prevents NOT_A_NUMBER on DMS-52; 50/50 tests pass |
| OCR Task 3: Receiving Stamp Detection on Delivery Notes (`V-06`) | Done | Map warehouse receiving stamps on delivery notes to receiver signature; fixes DMS-53..56; 51/51 tests pass |
| OCR Task 4: Grand Total Arithmetic Disambiguation | Done | Reconcile grand_total when mistakenly duplicated from subtotal; fixes DMS-46 & DMS-56; 52/52 tests pass |
| OCR Task 5: Middle-Block Table Duplication Folding | Done | Fold duplicate table rows occurring in middle of multi-page invoices; fixes DMS-26; 53/53 tests pass |
| OCR Task 6: Full Regression Verification & Replay Evaluation | Done | 58/58 engine tests pass; 153/153 portal tests pass; 62/62 scenarios pass; DMS-26, 27, 32, 46, 52, 53, 54, 55, 56 verified |

| Task | Status | Description |
|---|---|---|
| Streamline Task 1: V-06 Deliverer Signature Waiver on Confirmed Receipt | Done | Waive faint deliverer signature when Oracle receipt exists; 2 new tests pass |
| Streamline Task 2: V-05 Address AI Uncertainty Demotion to Medium E07 | Done | Demote low-confidence address to E07 Medium when Tax ID and Name match Aapico; 3/3 tests pass |
| Streamline Task 3: V-07 & V-08 Milestone Installment Exact-Amount Matching | Done | Pass milestone installment lines when exact amount diff == 0.00; 4/4 tests pass; 62/62 scenarios pass |
| Streamline Task 4: V-08 UOM Mismatch Delegation to V-07 E10 | Done | Delegate non-comparable UOM to V-07 E10 Medium without manual review override; 5/5 tests pass; 62/62 scenarios pass |
| Streamline Task 5: Full Regression & Target DMS Verification | Done | 53/53 engine tests pass; 153/153 portal tests pass; 62/62 scenarios pass; DMS-20 & DMS-72 -> AUTO_PASS; DMS-120 -> MANUAL_REVIEW |

## Plan: Perception Robustness (`2026-10-09-perception-robustness-implementation.md`)

| Task | Status | Description |
|---|---|---|
| Task 1: PO Number Normalization & Consensus | Done | Strip PO prefixes in extract_value and corroborate PO agreement in `vision_pipeline.py`; 45/45 tests pass |
| Task 2: Crop Budget Prioritization for Core Lookup Keys | Done | Prioritize critical identifiers in candidate crop allocation before free text; 46/46 tests pass |
| Task 3: Header Candidate Scoping to Invoice Pages | Done | Restrict invoice headers to `invoice_pages` to avoid PO attachment leakage; 47/47 tests pass |
| Task 4: Ghost Row Auto-Folding in `_lines()` | Done | Auto-fold empty continuation lines into preceding description; eliminates false V-07 failures; 48/48 tests pass |
| Task 5: Full Regression & Target DMS Verification | Done | 48/48 pytest pass; 62/62 sandbox scenarios pass; DMS-23 & DMS-24 upgrade to AUTO_PASS; DMS-64 upgrades from HOLD to MANUAL_REVIEW |

## Plan: test-portal batch & round comparison (`2026-10-09-test-portal-batch-and-round-comparison-implementation.md`)

| Task | Status | Description |
|---|---|---|
| Portal Task 1: `RoundStore` for direct `results/` interop + summary | Done | `RoundStore` in `webapp/store.py` (+`results_dir`/`default_round` in `webapp/config.py`); 3 new tests, 134/134 pass; committed `2d5cda5` |
| Portal Task 2: Parallel batch runner + stop + round switching | Done | `webapp/service.py` (`start_batch`/`stop_batch`/`batch_status`/`switch_round`/`rounds`); 2 new tests, 136/136 pass; committed `cd0857a` |
| Portal Task 3: Round comparison engine | Done | `compare_verdicts`/`compare_rounds`/`_round_facts` in `webapp/service.py`, `has_results` in `store.py`; 4 tests, 140/140 pass; committed `89060be` |
| Portal Task 4: REST endpoints for rounds / batch / compare | Done | 9 routes in `webapp/app.py`, `create_round`/`rebuild_summary` in service, `RoundStore` wired in `build.py` (+`WEBAPP_BATCH_CONCURRENCY`); 7 new API tests, 146/146 pass; committed `c6a1812` |
| Portal Task 5: UI — round selector, batch controls, summary & compare modals | Done | `webapp/static/index.html` (+round/batch controls, batch bar, 2 modals), `app.js` (rounds, batch poll, summary + compare render), 6 static tests updated/added; 152/152 pass; committed `c6308b2` |
| Portal Task 6: Full regression verification | Done | `pytest -v` in `engine/src/test-portal`: **153 passed** (baseline 131); engine suite **43 passed**; `git status --porcelain src/system_a config/` **empty** and the same for `2d5cda5^..HEAD` — every touched file is under `engine/src/test-portal/`. Live check on the real DMS (`python -m webapp check` → 125 เอกสาร tag `invoice`): `/api/rounds` = 8 rounds in `engine/results`; opening `paperless_invoices_v5` → 125/125 done (51 AUTO_PASS / 23 REVIEW / 12 HOLD / 39 MANUAL_REVIEW, matching that round's own `summary.json`); `compare v4_rerun → v5` = 13 improved / 22 regressed / 90 unchanged in 0.5s; batch of DMS-20 into a new round ran to `completed:1 errors:0` (~54s) and wrote `DMS-20_result.json` + `summary.json`; a script-written view builds in ~0.5s (119 KB) |

## Plan: Multi-Grid Line Items BBox Misalignment Fix

| Task | Status | Description |
|---|---|---|
| Phase 1 & 2: Root Cause & Pattern Analysis | Done | Root cause confirmed across 10 documents: VLM table_rows targets upper grid; row_box_from_page returns None due to 0 vertical overlap; row/cell bboxes stay at wrong upper positions and degenerate zero-width boxes are emitted |
| Phase 3: Hypothesis & Design Validation | Done | Formulated 3-layer fix: (1) Fallback to items_by_page line boxes when table rows float above table header or have zero vertical overlap; (2) Update table/column regions and sanitize zero-size bboxes; (3) Add multi-grid negative constraint in vision_table_rows prompt |
| Phase 4 Task 1: Failing Test Cases (TDD) | Done | Added failing tests test_multi_grid_table_rows_fallback_to_page_items and test_degenerate_bbox_sanitized_in_assembler in test_ocr_improvements.py |
| Phase 4 Task 2: Implement Fallback in `_lines()` & `row_box_from_page()` | Done | Implemented `fallback_row_box` in `vision_pipeline.py` with text/token & order fallback; adjusted mislocated `T{page}-001` table region to encompass real table |
| Phase 4 Task 3: Degenerate BBox Sanitization | Done | Sanitized degenerate boxes (`w <= 0` or `h <= 0`) to `None` in `assembler.py` `build_elements()`; filtered invalid columns in `_lines()` |
| Phase 4 Task 4: Negative Constraint in Prompt | Done | Added explicit MULTI-GRID NEGATIVE CONSTRAINT in `vision_table_rows.md` prompt; bumped prompt version to 2.1.0 |
| Phase 4 Task 5: Full Regression & Target DMS Verification | Done | 60/60 pytest engine suite pass; 153/153 portal suite pass; DMS-102 simulation confirmed lines aligned to Y=0.335..0.415 with zero degenerate boxes |

## Plan: Perception Cache Defense & Run Reconciliation (`2026-10-12-perception-cache-defense-and-run-reconciliation-implementation.md`)

| Task | Status | Description |
|---|---|---|
| Task 1: Cache Defense Guard (`is_cacheable`, `save`, `load`) via TDD | Pending | Add is_cacheable validator rejecting ConnectError/transport drops; guard PerceptionCache save/load |
| Task 2: Purge Tooling & Poisoned Cache Cleanup | Pending | Implement scripts/clean_perception_cache.py and delete 110 poisoned cache files |
| Task 3: Selective Result Pruning & Batch Re-execution | Pending | Prune 108 invalid results in run_20261011 and resume batch execution via test_paperless_invoices.py |
| Task 4: Regression Verification & Target Document Inspection | Pending | Run pytest regression suites and verify Multi-Grid document bboxes (DMS-102 etc.) |
