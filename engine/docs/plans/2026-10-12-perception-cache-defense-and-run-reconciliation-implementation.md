# Perception Cache Defense & Run 20261011 Reconciliation Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a strict Perception Cache defense guard against network/DNS drops, purge 110 poisoned cache entries, re-execute the 108 invalid documents in `run_20261011`, and verify multi-grid bbox precision across all 146 documents.

**Architecture:** Add `is_cacheable()` validator in `src/system_a/perception/cache.py` guarding `save()` and `load()`. Create `scripts/clean_perception_cache.py` to purge poisoned entries on disk. Smart-resume `run_20261011` by purging empty result files and re-running with `--skip-existing` across 6 concurrent workers.

**Tech Stack:** Python 3.11, Pydantic, PyMuPDF, LiteLLM, pytest.

---

### Task 1: Cache Defense Guard (`is_cacheable`, `save`, `load`) via TDD

**Files:**
- Modify: `engine/src/system_a/perception/cache.py`
- Test: `engine/tests/test_ocr_improvements.py`

**Step 1: Write the failing tests**
Add test functions in `engine/tests/test_ocr_improvements.py`:
- `test_is_cacheable_rejects_transport_errors()`: asserts that `ExtractionResult` with `pages_complete=False` or `ConnectError` / `getaddrinfo` is uncacheable.
- `test_perception_cache_save_skips_uncacheable()`: asserts that `cache.save(key, ext)` skips write when `is_cacheable(ext)` is False.
- `test_perception_cache_load_rejects_poisoned_file()`: asserts that `cache.load(key, sha)` rejects a corrupted file on disk and removes it.

**Step 2: Run tests to verify they fail**
Run: `python -m pytest tests/test_ocr_improvements.py -k "cacheable" -v`
Expected: FAIL (functions/logic not yet implemented in `cache.py`).

**Step 3: Implement `is_cacheable` and guard `save()` & `load()`**
In `engine/src/system_a/perception/cache.py`:
- Add `is_cacheable(ext: ExtractionResult) -> bool` checking `pages_complete`, `page_errors` keywords (`connecterror`, `getaddrinfo`, `aitransporterror`), `calls` failures, and field presence.
- In `save()`: check `is_cacheable(ext)`; if False, return `None` without writing.
- In `load()`: if loaded `ext` fails `is_cacheable(ext)`, increment `self.rejected += 1`, remove file, return `None`.

**Step 4: Run tests to verify they pass**
Run: `python -m pytest tests/test_ocr_improvements.py -k "cacheable" -v`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/system_a/perception/cache.py tests/test_ocr_improvements.py
git commit -m "feat(perception): add cache defense guard rejecting transport errors and empty results"
```

---

### Task 2: Purge Tooling & Poisoned Cache Cleanup

**Files:**
- Create: `engine/scripts/clean_perception_cache.py`

**Step 1: Write `clean_perception_cache.py` script**
Implement scanner reading `.cache/perception/*.json`, identifying poisoned files using `is_cacheable()` and error signatures, deleting them, and outputting summary metrics.

**Step 2: Execute cache cleanup**
Run: `python scripts/clean_perception_cache.py`
Expected: Deletes ~110 poisoned cache files; confirms remaining ~335 cache files are valid.

**Step 3: Verify clean cache state**
Run verification check ensuring 0 files in `.cache/perception/` have `getaddrinfo failed` or `ConnectError`.

**Step 4: Commit**
```bash
git add scripts/clean_perception_cache.py
git commit -m "feat(scripts): add clean_perception_cache script to purge poisoned cache files"
```

---

### Task 3: Selective Result Pruning & Batch Re-execution

**Files:**
- Modify: `engine/results/run_20261011/` (delete 101 empty JSON files and 7 `SYSTEM_ERROR` JSON files)
- Command: `python scripts/test_paperless_invoices.py --concurrency 6 --round-name run_20261011`

**Step 1: Prune invalid result files from `results/run_20261011/`**
Delete the 108 invalid files (`DMS-*_result.json`) while preserving the 38 successful ones.

**Step 2: Execute batch re-run**
Run: `python scripts/test_paperless_invoices.py --concurrency 6 --round-name run_20261011`
Expected: 38 documents skipped, 108 documents processed fresh with live LiteLLM & Oracle connections.

**Step 3: Verify batch completion**
Inspect `results/run_20261011/summary.json`:
- 146 total documents completed.
- 0 empty files (`inv is None and gt is None`).
- Review rule statistics (`V-01` through `V-09`).

**Step 4: Commit updated test run summary**
```bash
git add results/run_20261011/summary.json
git commit -m "chore(results): reconcile run_20261011 batch results after cache hardening"
```

---

### Task 4: Regression Verification & Target Document Inspection

**Files:**
- Inspection: Multi-grid target documents in `results/run_20261011/` (`DMS-102`, `DMS-119`, `DMS-129`, `DMS-24`, `DMS-59`, `DMS-60`, `DMS-76`, `DMS-81`, `DMS-93`, `DMS-96`)
- Tracker: `engine/docs/plans/task.md`

**Step 1: Run full test regression**
Run:
- `python -m pytest tests -q` (engine suite: 60+ tests pass)
- `python -m pytest src/test-portal -q` (portal suite: 153 tests pass)

**Step 2: Inspect Multi-Grid BBoxes & Elements**
Verify `DMS-102_result.json` and other multi-grid targets:
- Item row bboxes are located at $Y \ge 0.33$ matching table items.
- Zero degenerate ($w \le 0$ or $h \le 0$) bboxes.
- Table region `T1-001` properly envelopes the item table.

**Step 3: Update `docs/plans/task.md` and report benchmark comparison**
Update task tracker rows to Done and report final comparative metrics vs `paperless_invoices_v5`.
