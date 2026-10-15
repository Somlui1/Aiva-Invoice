# Pi Agent 3-Call Benchmark Evaluation Loop Implementation Plan

> **For Antigravity / Pi Agent:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the benchmark configuration and automated 3-pillar audit tool, then execute the Pi Agent evaluation loop across 16 benchmark documents until all 3 gates (Calls ≤ 3, Extraction Accuracy, BBox Integrity) achieve 100% PASS.

**Architecture:** A static benchmark list in `config/benchmark_3call_ids.json` targets 16 representative DMS documents. An audit script `scripts/audit_3call_benchmark.py` compares target results against baseline `results/run_20261011` across 3 gates: (1) Calls ≤ 3 and zero crop_reread, (2) Verdict and core field equality, and (3) BBox sanity. The agent loops through testing, auditing, fixing, and re-verifying until all 16 documents pass.

**Tech Stack:** Python 3.11, pytest, `scripts/test_paperless_invoices.py`, `scripts/audit_3call_benchmark.py`.

**Design Document:** `docs/plans/2026-10-12-pi-agent-3call-eval-loop-design.md`

---

### Task 1: Benchmark Corpus Configuration & Default Hardening

**Files:**
- Create: `config/benchmark_3call_ids.json`
- Modify: `src/system_a/container.py:40` — ensure `do_crops` defaults to `0`
- Modify: `src/system_a/perception/vision_pipeline.py:360` — ensure `do_crops` defaults to `False`

**Step 1: Create `config/benchmark_3call_ids.json`**

```json
{
  "description": "16 curated benchmark documents covering single-page, multi-page, copies, and BBox edge cases",
  "baseline_round": "run_20261011",
  "document_ids": [
    15, 19, 20, 22, 24, 25, 26, 27, 30, 31, 33, 46, 52, 53, 56, 102
  ]
}
```

**Step 2: Hard-wire `do_crops: bool = False` as default in container.py and vision_pipeline.py**

In `container.py` line 40:
```python
    do_crops: bool = os.getenv("PERCEPTION_CROPS", "0") == "1"
```
In `vision_pipeline.py` line 360:
```python
    def __init__(self, client, model: str, ..., do_crops: bool = False, ...):
```

**Step 3: Verify existing tests pass**

Run: `python -m pytest -q`
Expected: 70 passed.

**Step 4: Commit**

```bash
git add config/benchmark_3call_ids.json src/system_a/container.py src/system_a/perception/vision_pipeline.py
git commit -m "feat: add benchmark 3-call corpus config and default do_crops to False"
```

---

### Task 2: Automated 3-Pillar Audit Script (`scripts/audit_3call_benchmark.py`)

**Files:**
- Create: `scripts/audit_3call_benchmark.py`

**Step 1: Write the audit script**

Create `scripts/audit_3call_benchmark.py` with:
- CLI args: `--target-dir` (default: `results/eval_3call_loop`), `--baseline-dir` (default: `results/run_20261011`), `--config` (default: `config/benchmark_3call_ids.json`).
- Gate 1 check: `calls_count <= 3` (or multi-invoice budget), `crop_reread_count == 0`.
- Gate 2 check: recommendation verdict matching or improving vs baseline; core fields (`invoice_num`, `grand_total`, `po_number`) matching.
- Gate 3 check: no boxes with `w <= 0` or `h <= 0`, coords in `[0..1]`, empty `bbox_problems`.
- Formatted output table scorecard with overall exit status (0 on success, 1 on any violation).

**Step 2: Test CLI help**

Run: `python scripts/audit_3call_benchmark.py --help`
Expected: Help options printed with code 0.

**Step 3: Commit**

```bash
git add scripts/audit_3call_benchmark.py
git commit -m "feat: implement audit_3call_benchmark.py for 3-pillar gate evaluation"
```

---

### Task 3: Unit Tests for 3-Pillar Audit Script

**Files:**
- Create: `tests/test_audit_3call_benchmark.py`

**Step 1: Write TDD unit tests**

Test:
- `test_gate1_passes_when_calls_under_or_equal_three()`
- `test_gate1_fails_when_crop_reread_present()`
- `test_gate2_verifies_verdict_and_field_parity()`
- `test_gate3_detects_degenerate_bbox()`

**Step 2: Run pytest**

Run: `python -m pytest tests/test_audit_3call_benchmark.py -v`
Expected: All 4 tests PASS.

**Step 3: Commit**

```bash
git add tests/test_audit_3call_benchmark.py
git commit -m "test: add unit tests for audit_3call_benchmark script gates"
```

---

### Task 4: Execute Initial Benchmark Run & Audit (Loop 1)

**Files:**
- Execute against Paperless-ngx documents into `results/eval_3call_loop/`

**Step 1: Run benchmark documents**

Run benchmark batch for the 16 IDs:
```bash
python scripts/test_paperless_invoices.py --out-dir results/eval_3call_loop --concurrency 5 --skip-existing
```

**Step 2: Run audit script**

Run:
```bash
python scripts/audit_3call_benchmark.py --target-dir results/eval_3call_loop --baseline-dir results/run_20261011
```

**Step 3: Inspect scorecard**
- If 16/16 PASS: Proceed directly to Task 6.
- If any documents fail: Document failing IDs and failure details for Task 5.

---

### Task 5: Targeted Root-Cause Fix & Re-verification Loop (Loop 2..N)

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py` (or prompt/rules as needed)

**Step 1: Isolate failing document(s)**
- For each failing document, inspect its `results/eval_3call_loop/DMS-<id>_result.json`.

**Step 2: Apply targeted fix**
- If multi-invoice causes excessive calls (e.g. DMS-27): scope selection to primary invoice document `D1`.
- If a bbox alignment shifts: calibrate row box fallback.
- If a field is missing: adjust batch classify or text layer corroboration.

**Step 3: Selective re-run**
- Remove only the failing document's JSON:
```bash
rm results/eval_3call_loop/DMS-<id>_result.json
python scripts/test_paperless_invoices.py --doc-id <id> --out-dir results/eval_3call_loop
```

**Step 4: Re-audit**
```bash
python scripts/audit_3call_benchmark.py --target-dir results/eval_3call_loop --baseline-dir results/run_20261011
```
Repeat until Scorecard reports **16 / 16 PASSED**.

---

### Task 6: Full Regression Verification & Documentation

**Files:**
- Modify: `docs/plans/task.md`

**Step 1: Run full engine test suite**

Run: `python -m pytest -v`
Expected: 74+ passed.

**Step 2: Run portal test suite**

Run: `python -m pytest src/test-portal/ -v`
Expected: 153 passed.

**Step 3: Update `docs/plans/task.md`**

Update tracker with benchmark evaluation results and scorecard evidence.

**Step 4: Commit**

```bash
git add docs/plans/task.md
git commit -m "docs: finalize task tracker with 3-call benchmark evaluation results"
```
