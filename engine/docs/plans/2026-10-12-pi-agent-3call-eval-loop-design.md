# Pi Agent 3-Call Benchmark Evaluation Loop Design

## 1. Objective

Design an automated, repeatable evaluation loop for the Pi Agent (and pair programming agents) to test, audit, and iteratively refine the System A engine until:
1. **VLM Calls = 3 per document** (and `crop_reread == 0`) across standard single-invoice documents.
2. **Extraction Accuracy & Verdict Quality** match or exceed the baseline round (`results/run_20261011` or `results/paperless_invoices_v5`).
3. **Bounding Box Integrity** is preserved (no degenerate boxes `w<=0` or `h<=0`, no out-of-bounds coords, proper Y-axis table line alignment).

---

## 2. Benchmark Corpus (16 Representative Documents)

The evaluation loop focuses on a curated 16-document benchmark representing all common and tricky invoice layouts:

| Category | Document IDs | Description & Verification Focus |
|---|---|---|
| **Single-Page Standard** | `DMS-15`, `DMS-19`, `DMS-30`, `DMS-31` | Baseline single-page invoice; must execute in exactly 3 VLM calls. |
| **Multi-Page (Original + Copy + Delivery Note)** | `DMS-20`, `DMS-22`, `DMS-24`, `DMS-25`, `DMS-33` | 2–4 pages; batch classify must isolate invoice original; zero calls on copies/delivery notes. |
| **BBox & Table Edge Cases** | `DMS-26`, `DMS-46`, `DMS-52`, `DMS-53`, `DMS-56`, `DMS-102` | Multi-grid table alignment (`DMS-102`), duplicate row folding (`DMS-26`), zero-satang notation (`DMS-52`), receiving stamps (`DMS-53`, `DMS-56`). |
| **Multi-Invoice Set** | `DMS-27` | 11 pages containing multiple distinct invoices; verifies batch classify and page selection handling. |

* **Baseline Reference:** `results/run_20261011` (or `results/paperless_invoices_v5`)
* **Evaluation Target Round:** `results/eval_3call_loop`

---

## 3. Three-Pillar Audit Gates

Each benchmark run must pass three independent gates for every document:

### Gate 1: VLM Call Budget Gate
- **Calls Count:** `calls <= 3` for standard single-invoice documents (`classify_batch` 1 + `page_items` 1 + `table_rows` 1).
- **Zero Crop Re-read:** `crop_reread == 0` (no zoomed crop calls permitted, `PERCEPTION_CROPS="0"`).
- **Multi-Invoice Exception:** For sets with multiple invoices in one PDF (e.g. `DMS-27`), `calls <= 1 + (N_invoices * 2)`.

### Gate 2: Extraction & Verdict Accuracy Gate
- **Verdict Non-Regression:** The final recommendation (`AUTO_PASS`, `REVIEW`, `HOLD`, `MANUAL_REVIEW`) must match or improve upon the baseline. No regression from `AUTO_PASS` to `HOLD`/`MANUAL_REVIEW`.
- **Core Field Consistency:** Key fields (`invoice_num`, `po_number`, `supplier_tax_id`, `sub_total`, `grand_total`) must match the baseline extraction values.
- **Line Items Count:** The number of extracted line items (`lines`) must match the baseline.

### Gate 3: BBox Integrity Gate
- **No Degenerate Boxes:** No bounding box with `w <= 0` or `h <= 0` or negative values.
- **Valid Boundary Range:** All coordinates `(x, y, w, h)` must lie strictly within `[0.0 .. 1.0]`.
- **Vertical Alignment:** Table row boxes and cell boxes must reside below the table header region and align with page line items (zero horizontal/vertical inversion).
- **Clean Sanity Report:** `extra.get("bbox_problems")` must be empty (`[]`).

---

## 4. The Pi Agent Iteration Loop Protocol

```
                  ┌──────────────────────────────────────────┐
                  │ 1. Run Benchmark Batch (16 docs)         │
                  │    Target: results/eval_3call_loop       │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │ 2. Execute 3-Pillar Audit Script         │
                  │    (Calls ≤ 3, Verdict/Field, BBox)      │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                            /──────────────────────\
                           /  Did all 16 docs PASS  \
                           \     all 3 gates?       /
                            \──────────────────────/
                                    /      \
                             (Yes) /        \ (No - violations found)
                                  ▼          ▼
             ┌────────────────────────┐   ┌──────────────────────────────────────────┐
             │ Complete! Report       │   │ 3. Isolate Failing Documents             │
             │ Scorecard & Finish     │   │    • Analyze root cause                  │
             └────────────────────────┘   │    • Patch code in src/system_a          │
                                          │    • Delete cached result of that doc    │
                                          └────────────────────┬─────────────────────┘
                                                               │
                                                               ▼
                                          ┌──────────────────────────────────────────┐
                                          │ 4. Re-run Specific Failing Docs          │
                                          │    Return to Step 2                      │
                                          └──────────────────────────────────────────┘
```

### Operational Rules for Pi Agent:
1. **Single Unit Re-execution:** When a document fails, delete only `results/eval_3call_loop/DMS-<id>_result.json` and re-run that specific document ID (`--doc-id <id>`) to keep iterations fast.
2. **Selective Cache Pruning:** If a code change alters perception logic, ensure the corresponding cache key in `.cache/perception` is invalidated or bypassed.
3. **Full Regression Check:** Before claiming final completion, run the full 16-document audit and confirm 16/16 PASS.

---

## 5. Audit Script Contract (`scripts/audit_3call_benchmark.py`)

A lightweight audit script executes the 3-pillar checks and generates a human-readable scorecard:
```
================================================================================
                    3-CALL BENCHMARK EVALUATION SCORECARD
================================================================================
Target Round:   results/eval_3call_loop
Baseline Round: results/run_20261011
Evaluated Docs: 16

[Gate 1] Call Budget (Calls <= 3, crop_reread == 0):     16 / 16 PASSED
[Gate 2] Accuracy & Verdict Non-Regression:             16 / 16 PASSED
[Gate 3] BBox Integrity (No degenerate, clean coords):   16 / 16 PASSED

OVERALL RESULT: PASSED (16/16) - Ready for deployment!
================================================================================
```
If violations occur, the script lists each failing document ID and the specific failure reason (e.g. `DMS-25: calls=14 (crop_reread=11)`, `DMS-102: degenerate bbox detected`).
