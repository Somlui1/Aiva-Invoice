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
| Task 1: Orientation Threshold Optimization & Margin Check in `orientation.py` | Done | Lowered CONFIDENCE_THRESHOLD to 0.75 with runner-up margin rule; DMS-59 rotates 270 deg upright; 12/12 tests pass; committed dd5c70e |
| Task 2: UOM Mismatch (E10) Conditional Low Severity when Amount is Equal | Done | Emitted E10 with severity='Low' when amount_equal == True in rules.py & codes.yaml; 103/103 tests pass; committed 2a90fc8 |
| Task 3: PO Corroboration Relaxation in Rule V-01 | Done | Demoted PO missing/conflict finding in V-01 to Low severity when Oracle receipt confirmed; 104/104 tests pass; committed e00b46a |
| Task 4: Target Document Verification, Regression Suite & Tracker Update | Done | Verified DMS-59 orientation (r=270, conf=0.836 upright); 200-doc batch yields AUTO_PASS 145 (+68), REVIEW 42, HOLD 7, MANUAL_REVIEW 6; 145/145 engine tests pass; 153/153 portal tests pass |

## Plan: LLM-Driven Orientation, Line BBox Sanitization & AUTO_PASS Integrity (2026-10-15-llm-orientation-and-line-bbox-sanitization-implementation.md)

| Task | Status | Description |
|---|---|---|
| Task 1: Prompt Update for Orientation `r` in Classify & Removal of PP-LCNet in `single_pass.py` | Done | Update single_pass_classify.md prompt for 'r'; parse 'r' in normalize_classify; render 80 DPI unrotated and rotate on demand; 11/11 tests pass; committed 5bebeea |
| Task 2: Coordinate Sanitization, Clamping & Swapping in `coords.py` | Done | Implement sanitize_xyxy with auto-rescaling, point swapping, out-of-bounds rejection, and clamping; 109/109 tests pass; committed 0c493d3 |
| Task 3: Skew-Tolerant Cell Union & Geometric Sanity Check in `single_pass.py` | Done | Implement compute_row_bbox_from_cells and validate_line_bbox with aspect ratio >= 1.5; update extract prompt; 110/110 tests pass; committed 175441b |
| Task 4: Grounding Gate & Row Overlap Collision Check in `rules.py` (V-01 / V-07) | Done | Enforce line bbox grounding and row overlap collision detection in V-01; 111/111 tests pass; committed 3d10ed9 |
| Task 5: V-08 Unit-Price Grouping & Subtotal Sum Validation in `v08.py` | Done | Implement validate_unit_price_groups against double-counting and hallucinations; 112/112 tests pass; committed 2bcc7bb |
| Task 6: Target Document Verification & Full Regression Suite | Done | DMS-25, DMS-26, DMS-22 verified AUTO_PASS with horizontal row bboxes (ar>=14.5) and rotation=0; 153/153 engine tests pass, 153/153 portal tests pass |

## Plan: Autonomous OCR & BBox Refinement Loop (2026-10-15-ocr-bbox-autonomous-improvement-loop.md)

| Task | Status | Description |
|---|---|---|
| Task 1: Autonomous Loop Specification & Benchmark Protocol | Done | Created plan & PI Agent prompt for all Paperless invoices, image visual audit, copy separation, and OCR field completeness |
| Task 2: Batch Invoice Extraction & Image BBox Rendering | Pending | Run scripts/test_invoice_single_pass.py --tag invoice to render overlay images and extract payloads |
| Task 3: Classification & Separation Audit | Pending | Audit selected pages to ensure original invoices only (filter copies and delivery notes) |
| Task 4: Visual BBox Alignment & Field Completeness Iteration | Pending | Iteratively patch prompts/coords/single_pass.py until BBoxes align and fields are complete |
| Task 5: Final Acceptance Gates & Model Limitation Report | Pending | Verify 100% test pass, clean BBoxes across invoices, and log model ceiling cases |


### Plan: Autonomous OCR & BBox Loop — Round 0 (prep & tooling)

| Task | Status | Description |
|---|---|---|
| R0-1: Baseline verification & plan-vs-reality audit | Done | `pytest tests/` = **153/153 passed** (plan said 19/19); tag `invoice` = **223** docs (plan said ~125); `config/eval_staged_50_ids.json` absent; VLM endpoint live (DMS-20 = 59.8s, 3 pages); 729 pages / 204 cached PDFs |
| R0-2: Owner rulings on inspection scope | Done | Recorded in `bbox_testing/round_01/INSPECTION_PROTOCOL.md`: selected pages 100% visual mandatory; `source_images/` only on 3 triggers; unselected pages JSON-checked (first unselected page eyeballed in Round 1 + Final); auto-checks triage only; commit on `engine` with per-path `git add` only; legacy `bbox_testing/` dirs kept |
| R0-3: Corpus snapshot + fixed 50-doc subset | Done | `config/full_corpus_ids.json` (223 IDs, read-only snapshot) + `config/eval_staged_50_ids.json` (seed=42, sorted-pool `random.Random(42).sample`, 50 IDs) via new `--snapshot-corpus` / `--make-eval-subset`; 2 new tests |
| R0-4: Read-only PDF backfill | Done | `--download-only`: 19 missing of 223 downloaded, **223/223 cached, 0 missing** |
| R0-5: 130 DPI source images (create-once) | Done | `--emit-source-images`: 176 pages for the 50-doc subset -> `bbox_testing/source_images/` (195 MB, 55s), legacy dirs untouched |
| R0-6: Round layout artifacts | Done | `--layout round` writes `round_XX/ocr/DMS-<id>.json` (payload + `meta.pages_classification`) and `round_XX/rendered/DMS-<id>_p<page>_bbox.png`; legacy paths + `--skip-existing` regression-tested; 2 new tests |
| R0-7: Automated triage + resumable progress | Done | `audit_doc()` + `--audit-round` -> `round_XX/progress.json` (inspected / pending_view / triage_order, needs_source_check, first_unselected_page_to_view): row aspect ratio <1.5, duplicate/OOB boxes, mandatory-field gaps, BBox on unselected page, unselected page classified as original tax invoice; 3 new tests; suite **161/161** |
| R0-8: Round 1 batch run (50 docs) | Done | `--out-dir bbox_testing/round_01 --layout round --dpi 130 --workers 4`: **48/50 succeeded, 2 errors** (DMS-208 `float() None` crash in parsing, DMS-224 VLM answered prose not JSON); log `round_01/run.log` |
| R0-9: Evidence crop tool | Done | `crop_rect_norm()` + `find_field_box()` + `--crop/--crop-field/--crop-box`: writes `round_XX/crops/DMS-<id>_<field>.png` upscaled for reading, source-page rotation aware; 2 new tests (caught an off-by-one from float truncation); suite **163/163** (baseline 153) |
| R1-1: Round 1 visual audit (48 rendered + first unselected page each) | In Progress | 1/48 inspected (`review/DMS-25.md`: FAIL — `po_number` box drawn ~20px above the printed digits, verified by crop; 4 rows in image = 4 rows OCR; `invoice_num` genuinely absent from the document); resume queue in `round_01/progress.json` (inspected/pending/triage_order) |
| R1-2: Round 1 scorecard, fixes & commit | Pending | Fix targets for the observed patterns (coords/prompt), `scorecard.md` with `git diff --cached --stat`, pytest 100%, one per-path-staged commit |

### Plan: Autonomous OCR & BBox Loop — Round 1 findings (partial visual audit)

| Task | Status | Description |
|---|---|---|
| R1-3: Crop evidence tool (used by the audit) | Done | `crop_rect_norm`/`find_field_box` + `--crop`; caught an off-by-one (float truncation); +5 tests; suite 163/163; committed `8f09698` |
| R1-4: Visual audit tranche 1 (11/49 docs, 100% of selected pages + first unselected page each) | Done | 11 FAIL / 0 PASS: BBOX 8, CLASSIFY 2, OCR 1; `review/DMS-25,26,134,223,233,234,47,69,106,117,24.md`; DMS-223 excluded (delivery-order-only) in `excluded_docs.md` |
| R1-5: Pattern analysis P1-P9 + round-1 scorecard | Done | `round_01/scorecard.md`: row-bbox drawn as full empty table band (AR<1.5 vs cell-union AR≈26), right-column boxes clipped/overlapping, boxes anchored on the label instead of the value, phantom `currency`, duplicated `company_stamp`, copy pages not deduped by `doc_no_hint`, wrong-label number capture, 2 pipeline errors (DMS-208/DMS-224) |
| R1-6: Remaining visual audit (38 docs) | Pending | resume from `round_01/progress.json` -> `pending_view` / `triage_order` |
| R1-7: Untagged-invoice spot check (5-10 docs) | Pending | plan §3 case 3, write `round_01/added_docs.md` |
| R1-9: Fix P1 (row_bbox from cell union) | Done | `row_bbox()` unions the row's `bbox_2d` cells in the VLM xyxy space (first attempt assumed xywh and drew 14 stacked boxes - caught by opening the render), keeps `line_bbox_model`; measured DMS-69 AR 1.3→25.4, DMS-234 AR 1.4→8.1, render inspected; +1 contract test, 164/164 pass; committed `6716b46` |
| R1-8: Fix P1b, P2-P9 + Round 2 re-run | Pending | prompt/coords/assembler/`select_invoice_pages`; round 2 = re-run all 50 with cache bypass |

### Plan: Autonomous OCR & BBox Loop — Round 2 (vs round_01 baseline)

| Task | Status | Description |
|---|---|---|
| R2-1: Round 2 batch (same fixed 50, DPI 130, temp 0) | Done | **49/50 succeeded, 1 error** (DMS-134 classify answered outside JSON; round 1's failures were DMS-208/DMS-224 → parse failure is random per round = P9) |
| R2-2: Round comparison tooling | Done | `diff_round_payloads()` + `--compare-rounds` → `round_02/round_diff.json` (changed/unchanged/previously_failed/view_queue by plan §2 rules); +2 tests; suite **166/166**; committed `35b93ad` |
| R2-3: Baseline-vs-round-2 measurement | Done | **49/49 docs "changed"** though only P1 was in the code: text differs in 46, field boxes moved >5px in 46, row boxes 45 (intended remeasure), **page selection stable 0/49**; `currency` unstable in **21/49 = 43%**, `customer_address`/`supplier_name` 29%, `supplier_tax_id` 12% incl. a digit-insertion regression on DMS-107; DMS-117/DMS-89 rows only renumbered |
| R2-4: Round 2 scorecard | Done | `round_02/scorecard.md` — records that the plan's "any character changed ⇒ view 100%" rule now flags 100% of the corpus every round, with 4 options (stability gate, drop `currency`, row-content hash, fix P9 first) |
| R2-5: Round 2 visual audit (49 docs) | Pending | blocked on R2-4 option choice: without a stability gate the queue is the whole corpus again |

### Plan: Autonomous OCR & BBox Loop — noise gate + P9 (owner: "ทำทุกข้อ" = options ง/ค/ข/ก)

| Task | Status | Description |
|---|---|---|
| R2-6: (ง) pipeline-error root cause | Done | Two causes, both proven: `detect_coord_mode()` did `float(None)` on a `[null,null,null,null]` answer (killed DMS-208) and Step 1 was pinned to `max_tokens=4096`, so a thinking model's preamble ate the budget and no JSON arrived (DMS-224/DMS-134). Fixed in whitelisted files: null-safe coordinate scan + `VLM_MAX_TOKENS_CLASSIFY` (default 8000) with per-attempt escalation + `_clean_json_response()` picks the largest **balanced** `{...}` region instead of first-`{`→last-`}` |
| R2-7: verify P9 on the documents that really failed | Done | DMS-134, DMS-208, DMS-224 re-run in `bbox_testing/_check_p9`: **3/3 succeeded, 0 errors** (same env, temperature 0) — previously every one of them errored |
| R2-8: (ค) match rows by content, not `line_no` | Done | `row_signature()` + pairing by signature; `renumbered` reported separately and does not mark a doc changed (kills the DMS-117/DMS-89 phantom rows) |
| R2-9: (ข) drop `currency` from the verdict | Done | `NON_SCORING_FIELDS = {"currency"}` — flip-flopped in 21/49 docs with identical code and plan §6.2 does not score it; still recorded under `noise_only` |
| R2-10: (ก) stability gate | In Progress | `--stability ROUND_DIR --runs 2` re-runs every doc with identical code → `stability_report.json` (per-field instability rate, `noisy_fields` at `--noisy-field-rate`); `--compare-rounds --stability-report` then excludes exactly those fields from the verdict. Running on all 49 docs x 2 (`round_02/stability.log`) |
| R2-11: Tests | Done | +5 tests (prose/truncated JSON, null coordinates, token escalation, row signature + currency, `ignore_fields` gate); suite **171/171** (was 166); committed `65968c2` with per-path staging |
| R2-12: Stability gate measured | Done | 49 docs × 2 identical runs (`round_02/stability_report.json`): every scoring field differs in ≥20% of docs (`supplier_tax_id` 76%) → excluding unstable fields would delete all signal. Splitting by severity: **digit-level (material) instability is rare** — `po_number` 14% (`PI2610-00300`→`PI2610-000300`), `invoice_date` 6%, everything else 2% and all of that is DMS-183 where run1 returned `None` for the whole document. Cosmetic-only events: 68 (`currency` 19, `supplier_name` 19, `customer_name` 12, `customer_address` 11). Page selection **stable 49/49**; row boxes move >5px in 14/49 |
| R2-13: Replace the field gate with a severity split | Pending | `diff_round_payloads` gains material (digit set differs) vs cosmetic (digits identical) so a verdict uses material only; retry when an extraction returns an empty page (DMS-183); prompt focus on `po_number` digit fidelity |
| R2-13: severity split + calibrated box rule + prompt v1.3 | Done | `text_change_is_material()` (digit set หรือค่าโผล่/หาย) ตัดสิน verdict; `cosmetic` = เลขเหมือน; box shift (p90=67.7px noise) แยกไป `moved`/`row_moves` ไม่นับ; `is_empty_extraction()` retry 2 ครั้ง; prompt `single_pass_extract.md` v1.3.0 VALUE FIDELITY. วัดจริง: material 31 / cosmetic-only 13 / changed 34 / unchanged 15 (เดิม 49/49); po_number material flip ใน set ที่แย่สุดลด 7/7→2/7; empty extraction 0/7; suite **174/174**; commit `2fb1cea` |
| R2-14: MODEL_LIMIT สำหรับรหัสอักษรยาว | Pending | `LN6064481400 0H2`, `EKSD2-25`/`EKSD22-25` model นับตัวอักษรซ้ำผิด — ทดลองแก้ 2 วิธีแล้ว (v1.2 baseline, v1.3 fidelity) เหลือทางเดียวคือเทียบกับ text layer/PDF search ทีละฉบับ |
