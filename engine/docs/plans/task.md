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
| Task 1: Cache Defense Guard (`is_cacheable`, `save`, `load`) via TDD | Done | Add is_cacheable validator rejecting ConnectError/transport drops; guard PerceptionCache save/load |
| Task 2: Purge Tooling & Poisoned Cache Cleanup | Done | Implement scripts/clean_perception_cache.py and delete 110 poisoned cache files |
| Task 3: Selective Result Pruning & Batch Re-execution | In Progress | Prune 108 invalid results in run_20261011 and resume batch execution via test_paperless_invoices.py |
| Task 4: Regression Verification & Target Document Inspection | Pending | Run pytest regression suites and verify Multi-Grid document bboxes (DMS-102 etc.) |

## Plan: Invoice-First <=3 VLM Calls (`2026-10-12-invoice-first-3call-implementation.md`)

| Task | Status | Description |
|---|---|---|
| Task 1: New `vision_classify_batch` Prompt | Done | Create config/prompts/vision_classify_batch.md for multi-page batch classification; committed efc2453 |
| Task 2: Add `invoice_first` Setting to Container | Done | Add PERCEPTION_INVOICE_FIRST env setting and perception_options entry in container.py; committed 365fb74 |
| Task 3: TDD — Unit Tests for Invoice-First Logic | Done | Write failing unit tests for select_invoice_pages and text_layer_is_copy in test_ocr_improvements.py; committed 24bb524 |
| Task 4: Implement `select_invoice_pages()` and `text_layer_is_copy()` | Done | Implement pure functions in vision_pipeline.py to pass TDD tests; committed 77b09c8 |
| Task 5: Implement `_classify_batch()` in VisionPipeline | Done | Add _classify_batch method sending multi-image call to LiteLLM; committed f3efdf0 |
| Task 6: Refactor `extract()` for Invoice-First Flow | Done | Branch in extract() to run batch classify then page_items & table_rows on invoice originals; committed 079c73a |
| Task 7: Wire `invoice_first` in Container | Done | Pass invoice_first setting to VisionPipeline in build_perception; committed 3cfedb7 |
| Task 8: Full Regression Verification | Done | 70/70 engine tests pass; 153/153 portal tests pass; 3-call limit verified; committed 6e20511 |

## Plan: Pi Agent 3-Call Benchmark Evaluation Loop (`2026-10-12-pi-agent-3call-eval-loop-implementation.md`)

| Task | Status | Description |
|---|---|---|
| Task 1: Benchmark Corpus Configuration & Default Hardening | Done | Create config/benchmark_3call_ids.json (16 docs) and default do_crops to False; 70/70 tests pass; committed b8274a0 |
| Task 2: Automated 3-Pillar Audit Script | Done | Implement scripts/audit_3call_benchmark.py evaluating Calls, Accuracy, BBox; CLI + smoke test pass; committed c6d306f |
| Task 3: Unit Tests for 3-Pillar Audit Script | Done | Add tests/test_audit_3call_benchmark.py verifying gate assertions; 4/4 tests pass, suite 74/74; committed aa7697b |
| Task 4: Execute Initial Benchmark Run & Audit (Loop 1) | Done | Ran 16 docs into results/eval_3call_loop (added --doc-ids filter); initial scorecard 4/16 (G1 9/16, G2 7/16, G3 16/16); root causes mapped for Task 5 |
| Task 5: Targeted Root-Cause Fix & Re-verification Loop | Done | 8 loops to 16/16 PASSED (all 3 gates). L1 4/16 → L2 (classify v2.0 content copy, consensus, stamp synth, rescue; dce6473) 10 → L3 (all-invoice-sheet selection, title demotion, two-phase picking; 6c62069) 12 → L4 9/16 (wording rule side-effects; 6c5b814) → L5 (dashed canonical tax, oracle supplier==customer overwrite, SHAPE_USABLE, stamp-page rescue, PO_RUN11, audit separator parity; 98/98; 9a7c71d) 12 → L6 selection reverted to all invoice sheets (1ee3a85) 11 → L7 identifier-majority-first + tiered wording + tax-less-title demotion (ea9b172) 10 under over-strict audit → L8 audit aligned to plan Gate-2 spec (verdict+invoice_num+grand_total+po_number gated; lines/tax ids = observations; corroborate overwrite needs receipt-row confirmation; 4279364) 14/16 → L8b V-06 waives unsure receiver when Oracle receipt confirms receiving (56ec7e4) 15/16 → L8c classify-named duplicate page folds despite misread qty column (f074827) **16/16**; final scorecard results/eval_3call_loop/audit_final.txt; suite 101/101 |
| Task 6: Full Regression Verification & Documentation | Done | Full regression green after final pass: engine 101/101 (pytest tests/), portal 153/153 (pytest src/test-portal/), both exit 0; final scorecard results/eval_3call_loop/audit_final.txt = OVERALL PASSED 16/16; observations kept for human review: DMS-26 lines=19 vs 33 (baseline double-counts its own folded copy - design doc names DMS-26 the duplicate-folding case), DMS-27/DMS-46 supplier_tax_id differ from baseline (DMS-27 value now matches Oracle PO master; DMS-46 keeps the printed value - Oracle master disagrees with the paper), DMS-27 lines=12 vs 10 |

## Plan: Single-Pass Invoice Extraction & BBox Testing

| Task | Status | Description |
|---|---|---|
| Single-Pass BBox Test Script | Done | Created `scripts/test_invoice_single_pass.py` supporting multi-image 1-pass VLM extraction, original invoice prioritization, all-bbox overlay rendering to PNG, and required fields JSON payload to `bbox_testing/`; verified on DMS-20 & DMS-19 |
| System A v5 Review & Validation | Done | Verified 107/107 engine tests, 153/153 test-portal tests, 68/68 sandbox scenarios with schema validation, 218/218 frontend tests; verified SinglePassPipeline, logic V-08, UOM & milestone installment rules |
| Single-Pass 16-Doc Benchmark & Baseline Comparison | Done | Ran scripts/run_single_pass.py --ids-file config/benchmark_3call_ids.json --validate; compared results with baseline run_20261011 (5 Match, 4 Improved, 7 Regressed); avg time 26.4s |

## Plan: Image Orientation & BBox Rotation-Back (`2026-10-13-image-orientation-and-bbox-rotation-implementation.md`)

| Task | Status | Description |
|---|---|---|
| Orientation Task 1: PP-LCNet Setup & Runtime Loader | Done | Add opencv/numpy deps, PP-LCNet_x1_0_doc_ori ONNX asset & sha256, cv2.dnn loader with onnxruntime fallback, official preprocessing & label mapping tests; committed 89253ee |
| Orientation Task 2: Horizontal Projection Profile Skew Measurement | Done | Implement fine skew angle search (-10°..+10°), thresholding (<0.3° -> 0.0), sparse text handling, and detect_page_orientation(); committed 89253ee |
| Orientation Task 3: Affine Image Rotation & Inverse Coordinate Mapping | Done | Implement rotate_image (white border) and rotate_box_back via M_inv yielding standard bbox and oriented rbox [cx, cy, w, h, angle]; committed 02fe780 |
| Orientation Task 4: Contract Updates & Schema Compatibility | Done | Add rbox to Region, RegionNode, and schemas/result-3.0.schema.json; wire in assembler; verify 68/68 scenarios pass; committed 45aa609 |
| Orientation Task 5: Pipeline Integration (`SinglePassPipeline`) | Done | Wire orientation detection into 80 DPI step, upright classify, 130 DPI extract rotation, PageAnswer.region() inverse mapping, and prompt cleanup; committed a2a4a49 |
| Orientation Task 6: Full Regression Verification & Acceptance Gates | Done | 129/129 engine tests pass; 153/153 portal tests pass; 68/68 sandbox scenarios pass with valid schema; 218/218 frontend tests pass; all acceptance gates satisfied |

## Plan: Invoice Separation, Dual-Quantity & Matching Robustness (2026-10-14-invoice-separation-and-dual-qty-matching-implementation.md)

| Task | Status | Description |
|---|---|---|
| Task 1: Prompt Enhancements for Visual Unit Matching & Negative Discounts | Done | Added 2D table extraction rules (horizontal gating, visual unit matching, header UOM inheritance, negative discounts) to single_pass_extract.md and vision_table_rows.md; 1 test passes |
| Task 2: Safe Upstream Duplicate Page Separation | Done | Prune copy sheets when original exists for same doc_no without markers while protecting multi-page continuation; 2 new tests pass |
| Task 3: Resilient Midstream Row Folding for Installments & Fuzzy Match | Done | Decouple installment folding from subtotal equality and support fuzzy block matching against OCR noise in collapse_repeated_copies; 2 new tests pass, 138/138 engine tests pass |
| Task 4: Engine Self-Evidence Token Fallback for Dual-Quantity | Done | Implement self-evidence fallback in corroborate_arithmetic using row OCR tokens without Oracle peeking and ghost row auto-folding; 2 new tests pass, 140/140 engine tests pass |
| Task 5: Business Rule Fast-Paths | Done | Add V-05 AAPICO Tax ID 100% bypass and V-08 service line amount match; 2 new tests pass, 142/142 engine tests pass |
| Task 5B: Pure Numeric Line Pairing & Split-Line Aggregation | Done | Deterministic 1:1, N:1, and 1:N numeric aggregation in matching.py and v08.py; 4 new tests pass, 133/133 engine tests pass, 153/153 portal tests pass |

| Task 6: Target Document Verification & Full Regression | Done | Verified target scorecard cases (DMS-80, 174, 210 -> AUTO_PASS; DMS-86, 153, 40, 39, 37 -> REVIEW; DMS-109, 112, 113 copies folded; DMS-179, 188 continuation preserved); full suites pass: 142/142 engine tests, 153/153 portal tests |

## Plan: Auto-Pass Boost, Orientation BBox Alignment, UOM E10 Demotion & PO Relaxation (2026-10-14-autopass-boost-orientation-and-po-uom-relax-implementation.md)

| Task | Status | Description |
|---|---|---|
| Task 1: Orientation Threshold Optimization & Margin Check in `orientation.py` | Pending | Lower CONFIDENCE_THRESHOLD to 0.75 and add margin rule to rotate DMS-59 upright and fix BBox misalignment |
| Task 2: UOM Mismatch (E10) Conditional Low Severity when Amount is Equal | Pending | Emit E10 with severity='Low' when amount_equal == True in rules.py & codes.yaml |
| Task 3: PO Corroboration Relaxation in Rule V-01 | Pending | Demote uncorroborated/missing PO finding in V-01 to Low severity when Oracle EBS receipt confirmed |
| Task 4: Target Document Verification, Regression Suite & Tracker Update | Pending | Verify DMS-59 BBox alignment, target review cases, full pytest engine & portal suites |

