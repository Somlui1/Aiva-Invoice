# AIVA System A Test Portal — Batch Execution & Round Comparison Design

> **Scope Restriction**: All modifications are strictly confined to `engine/src/test-portal/`.
> **DO NOT TOUCH** `src/system_a/`, `config/`, or any engine files outside `engine/src/test-portal/`.

## 1. Objectives & Overview

The AIVA System A Test Portal (`engine/src/test-portal`) provides a visual inspection tool for validating System A results (bounding boxes, extraction, comparison table, rules V-01..V-09). 

Currently, the portal operates on a per-document basis against an internal `./data/results` cache, while `scripts/test_paperless_invoices.py` writes batch run results to `engine/results/<round_dir>/` (e.g. `paperless_invoices_v5`) with `DMS-<id>_result.json` and `summary.json`.

This design aligns the Test Portal with `scripts/test_paperless_invoices.py` so that:
1. **Direct `results/` Interop & Round Selection**: The portal operates directly on `engine/results/<round_dir>/`. Users can select existing rounds (e.g. `paperless_invoices_v5`) to instantly load and view results without re-running, or create new rounds (`run_YYYYMMDD_HHMMSS` or custom name).
2. **Safe Overwrite on Document Re-run**: Running an existing document overwrites `DMS-<id>_result.json` in place within the active round directory.
3. **High-Speed Parallel Processing**: Configurable concurrency (default: 10 workers, adjustable 1–20+) with support for both Single Document Run ("Process ฉบับนี้") and Batch Run ("Batch Process" with "Skip Existing" option and "Stop Batch" button).
4. **Summary & Round Comparison**:
   - Round Summary modal: Aggregate counts (AUTO_PASS %, REVIEW, HOLD, MANUAL_REVIEW, SYSTEM_ERROR), duration, rules breakdown table, and a "Re-generate summary.json" button.
   - Round Comparison modal: Compare Base Round (e.g. `v4`) vs Target Round (e.g. `v5`) with aggregate deltas, per-doc delta (🟢 Improved / 🔴 Regressed / ⚪ Unchanged), and rule status diffs.
5. **Utilitarian & High-Contrast UI**: Retains the existing Tahoma, dense, crisp, functional style.

---

## 2. Directory & Storage Architecture

### 2.1 File Organization

```
engine/results/
  ├── paperless_invoices_v5/               # Existing round
  │     ├── DMS-15_result.json             # Full System A Result 3.0 (payload)
  │     ├── DMS-56_result.json
  │     ├── summary.json                   # Consolidated summary
  │     └── .cache/                        # Test portal view model cache
  │           └── DMS-56_view.json
  │
  └── run_20261009_103000/                 # New round created from portal
        ├── DMS-20_result.json
        └── summary.json
```

### 2.2 Storage Contracts

1. **`DMS-<id>_result.json`**:
   - Written directly using System A's canonical payload: `aiva.system_a.result/3.0`.
   - Matching byte-for-byte what `scripts/test_paperless_invoices.py` produces.
   - When opened, `build_view(payload)` converts it into the screen model.
2. **`.cache/DMS-<id>_view.json`**:
   - Optional accelerator: cached output of `build_view(payload)` so repeated clicks do not re-parse large JSON payloads. Automatically invalidated if `DMS-<id>_result.json` mtime changes.
3. **`summary.json`**:
   - Schema identical to `scripts/test_paperless_invoices.py`:
     - `metadata`: `title`, `executed_at`, `mode`, `total_documents`, `total_elapsed_s`, `output_directory`
     - `statistics`: `counts` (AUTO_PASS, REVIEW, HOLD, MANUAL_REVIEW, SYSTEM_ERROR, SKIPPED, FAILED), `rules` (pass, fail, manual_review, not_evaluated)
     - `cases`: array of case dicts (`doc_id`, `title`, `recommendation`, `max_severity`, `invoice_num`, `grand_total`, `currency`, `elapsed_s`, `rule_results`, etc.)

---

## 3. Backend Service Architecture

### 3.1 `RoundStore` (`webapp/store.py`)
- Replaces/extends `ResultStore`.
- Accepts `results_root` (`Path("results")` relative to `engine`).
- Methods:
  - `list_rounds() -> list[str]`: sorted list of subdirectories in `results_root` containing `DMS-*_result.json` or `summary.json`.
  - `create_round(name: str) -> Path`: creates new round folder.
  - `set_active_round(name: str)`: switches current active round.
  - `save_result(doc_id: int, payload: dict)`: writes `results/<round>/DMS-<id>_result.json`.
  - `load_result(doc_id: int) -> dict | None`: loads `results/<round>/DMS-<id>_result.json`.
  - `has_result(doc_id: int) -> bool`: checks if file exists.
  - `delete_result(doc_id: int)`: deletes `DMS-<id>_result.json` and cache.
  - `load_or_build_view(doc_id: int) -> dict | None`: returns view model from cache or parses payload.
  - `build_and_save_summary() -> dict`: scans all `DMS-*_result.json` in active round, generates and writes `summary.json`.
  - `load_summary(round_name: str) -> dict | None`: reads `summary.json` from specified round.

### 3.2 `DocumentService` (`webapp/service.py`)
- Manages:
  - Active round (`round_name`).
  - Worker thread pool with dynamic concurrency:
    - Default concurrency: `10`.
    - Resizable `ThreadPoolExecutor`.
  - Batch job state:
    - `batch_running: bool`
    - `batch_total: int`, `batch_done: int`, `batch_errors: int`
    - Cancellation token / stop flag: `_batch_cancel_event = threading.Event()`.
  - Methods:
    - `start(doc_id: int)`: triggers single document run. Overwrites existing result.
    - `start_batch(doc_ids: list[int], skip_existing: bool = True, concurrency: int = 10)`: dispatches queue to workers.
    - `stop_batch()`: sets cancel flag to abort remaining queued jobs.
    - `batch_status() -> dict`: returns active progress.
    - `compare_rounds(base_round: str, target_round: str) -> dict`: diff engine.

### 3.3 Round Comparison Engine (`webapp/service.py`)
- Verdict Hierarchy Ranking (highest to lowest quality):
  1. `AUTO_PASS` (Score: 5)
  2. `REVIEW` (Score: 4)
  3. `MANUAL_REVIEW` (Score: 3)
  4. `HOLD` (Score: 2)
  5. `SYSTEM_ERROR` / `FAILED` (Score: 1)
- Delta Status:
  - `Improved` (🟢): Target Score > Base Score
  - `Regressed` (🔴): Target Score < Base Score
  - `Unchanged` (⚪): Target Score == Base Score
  - `Added` (🟡): In Target only
  - `Removed` (🟡): In Base only
- Rules Delta:
  - Compares `rule_results` between rounds and extracts changed rules: `[ { "rule_id": "V-08", "base": "fail", "target": "pass" } ]`.

---

## 4. API Endpoints (`webapp/app.py`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rounds` | List all available rounds in `engine/results/` |
| `POST` | `/api/rounds/create` | Create new round folder (`{"name": "run_..."}`) |
| `POST` | `/api/rounds/select` | Switch active round (`{"name": "paperless_invoices_v5"}`) |
| `GET` | `/api/rounds/summary` | Get `summary.json` of active round |
| `POST` | `/api/rounds/summary/rebuild` | Force rebuild `summary.json` from active round's `DMS-*` files |
| `GET` | `/api/rounds/compare?base={A}&target={B}` | Compute delta between Round A and Round B |
| `POST` | `/api/batch/start` | Start batch run (`{"doc_ids": [...], "skip_existing": true, "concurrency": 10}`) |
| `POST` | `/api/batch/stop` | Stop running batch |
| `GET` | `/api/batch/status` | Polling endpoint for batch progress |

---

## 5. UI / UX Design (`webapp/static/index.html` & `app.js`)

- **Top Bar**:
  - `Round Selector`: Dropdown populated with existing rounds + button `+ รอบใหม่` (prompts with `run_YYYYMMDD_HHMMSS`).
  - `Workers Input`: Number input (`1`–`30`, default `10`).
  - `Process Buttons`:
    - `Process ฉบับนี้` (Single)
    - `Batch Process` (Blue button)
    - `[x] ข้ามที่มีผลแล้ว` (Checkbox)
    - `หยุด Batch` (Red button, visible only during batch)
  - `Summary Button`: Opens Round Summary Modal.
  - `Compare Button`: Opens Round Comparison Modal.
- **Round Summary Modal**:
  - High-contrast verdict breakdown bar (`AUTO_PASS` green, `REVIEW` yellow, `MANUAL_REVIEW` purple, `HOLD` dark red, `ERROR` red).
  - V-01..V-09 rule pass/fail table.
  - Re-generate summary button.
- **Round Comparison Modal**:
  - Base Round vs Target Round selector.
  - Metric delta summary cards (`AUTO_PASS: +8 🟢`, etc.).
  - Filter chips: `[เฉพาะที่เปลี่ยน]` (default), `[ทั้งหมด]`, `[🟢 ดีขึ้น]`, `[🔴 แย่ลง]`.
  - Crisp table: `Doc ID` | `Invoice No.` | `Base Verdict` | `➔` | `Target Verdict` | `Delta` | `Rule Changes`.
  - Clicking any row selects and inspects that document on the main screen.
