| Task | Status | Description |
|---|---|---|
| Task 1: Add Missing UOM Groups (TRIP, BOOK) to Standards | Done | Updated `uom_groups.yaml` with TRIP and BOOK; verified passing |
| Task 2: Enhance `cells_from_row_text()` for Dual-Quantity Rows | Done | Added dual-quantity arithmetic check in `vision_pipeline.py`; 38/38 tests pass |
| Task 3: Prevent False Merging in `rows_from_line_items` & `merge_duplicate_rows` | Done | Protected unparsed rows with money tokens and distinct items; 42/42 tests pass |
| Task 4: Update Table Rows Prompt for Borderless & Dual-Quantity Tables | Done | Refined prompt instructions in `vision_table_rows.md` |
| Task 5: Fix Rule V-08 for N:1 Matching Groups | Done | Sum invoice quantities in N:1 groups in `v08.py`; 43/43 tests pass |
| Task 6: Full Regression and Verification | Done | 43/43 tests pass, 62/62 sandbox scenarios pass |
| Task 7: Batch Verification v5 (invoice tag, 8 workers) & Summary | In Progress | Run `scripts/test_paperless_invoices.py --tag invoice --concurrency 8 --out-dir results/paperless_invoices_v5` and summarize results |

## Plan: test-portal batch & round comparison (`2026-10-09-test-portal-batch-and-round-comparison-implementation.md`)

| Task | Status | Description |
|---|---|---|
| Portal Task 1: `RoundStore` for direct `results/` interop + summary | Not Started | `webapp/store.py` + `webapp/config.py` + `tests/test_round_store.py`; scoped to `engine/src/test-portal/` only |
| Portal Task 2: Parallel batch runner + stop + round switching | Not Started | `webapp/service.py` + `tests/test_batch_service.py` |
| Portal Task 3: Round comparison engine | Not Started | `webapp/service.py` (`compare_verdicts`, `compare_rounds`) + `tests/test_compare_rounds.py` |
| Portal Task 4: REST endpoints for rounds / batch / compare | Not Started | `webapp/app.py` + `tests/test_api.py` |
| Portal Task 5: UI — round selector, batch controls, summary & compare modals | Not Started | `webapp/static/index.html`, `webapp/static/app.js`, `tests/test_ui_static.py` |
| Portal Task 6: Full regression verification | Not Started | `pytest -v` in `engine/src/test-portal` + `git status --porcelain src/system_a config/` empty |
