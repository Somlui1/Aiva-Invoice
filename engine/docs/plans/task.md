| Task | Status | Description |
|---|---|---|
| Streamline Task 1: V-06 Deliverer Signature Waiver on Confirmed Receipt | Done | Waive faint deliverer signature when Oracle receipt exists; 2 new tests pass |
| Streamline Task 2: V-05 Address AI Uncertainty Demotion to Medium E07 | Done | Demote low-confidence address to E07 Medium when Tax ID and Name match Aapico; 3/3 tests pass |
| Streamline Task 3: V-07 & V-08 Milestone Installment Exact-Amount Matching | In Progress | Pass milestone installment lines when exact amount diff == 0.00; resolves 7 docs |
| Streamline Task 4: V-08 UOM Mismatch Delegation to V-07 E10 | Not Started | Delegate non-comparable UOM to V-07 E10 Medium without manual review override; resolves 8 docs |
| Streamline Task 5: Full Regression & Target DMS Verification | Not Started | Verify pytest, 62 sandbox scenarios, and target documents DMS-20, 72, 120 |

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
