| Task | Status | Description |
|---|---|---|
| Task 1: Add Missing UOM Groups (TRIP, BOOK) to Standards | Done | Updated `uom_groups.yaml` with TRIP and BOOK; verified passing |
| Task 2: Enhance `cells_from_row_text()` for Dual-Quantity Rows | Done | Added dual-quantity arithmetic check in `vision_pipeline.py`; 38/38 tests pass |
| Task 3: Prevent False Merging in `rows_from_line_items` & `merge_duplicate_rows` | Done | Protected unparsed rows with money tokens and distinct items; 42/42 tests pass |
| Task 4: Update Table Rows Prompt for Borderless & Dual-Quantity Tables | Done | Refined prompt instructions in `vision_table_rows.md` |
| Task 5: Fix Rule V-08 for N:1 Matching Groups | Done | Sum invoice quantities in N:1 groups in `v08.py`; 43/43 tests pass |
| Task 6: Full Regression and Verification | Done | 43/43 tests pass, 62/62 sandbox scenarios pass |
| Task 7: Batch Verification v5 (invoice tag, 8 workers) & Summary | In Progress | Run `scripts/test_paperless_invoices.py --tag invoice --concurrency 8 --out-dir results/paperless_invoices_v5` and summarize results |
