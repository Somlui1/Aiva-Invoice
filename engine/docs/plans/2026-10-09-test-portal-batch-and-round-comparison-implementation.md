# Test Portal Batch Execution & Round Comparison Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.
> 
> [!CAUTION]
> **CRITICAL REPOSITORY GUARDRAIL**:
> **DO NOT TOUCH `src/system_a/`, `config/`, OR ANY OTHER PIPELINE FILES!**
> The goal of this task is solely testing OCR & validation within `engine/src/test-portal/`.
> The code in `src/system_a/` is continuously maintained and upgraded by upstream processes.
> ALL changes in this plan are strictly scoped to `engine/src/test-portal/`!

**Goal:** Enable test round management against `engine/results/`, high-speed parallel batch verification, summary generation, and round comparison in the System A Test Portal without modifying any core engine files.

**Architecture:** Refactor `store.py` to `RoundStore` operating directly on `engine/results/<round_name>/`, add batch concurrency manager in `service.py`, expose REST endpoints in `app.py`, and extend the UI with round switcher, batch controls, and summary/comparison modals in `index.html` + `app.js`.

**Tech Stack:** Python 3.10+, FastAPI, ThreadPoolExecutor, Vanilla JS, HTML/CSS.

---

### Task 1: Implement `RoundStore` for Direct `results/` Interop and Summary Generation

**Files:**
- Modify: `engine/src/test-portal/webapp/store.py`
- Modify: `engine/src/test-portal/webapp/config.py` (add `results_dir: Path`)
- Create: `engine/src/test-portal/tests/test_round_store.py`

**Step 1: Write the failing test**

Create `engine/src/test-portal/tests/test_round_store.py`:
```python
import json
import pytest
from pathlib import Path
from webapp.store import RoundStore

def test_round_store_list_and_create(tmp_path: Path):
    # Setup initial mock rounds in results directory
    (tmp_path / "paperless_invoices_v5").mkdir()
    (tmp_path / "paperless_invoices_v5" / "DMS-56_result.json").write_text("{}", encoding="utf-8")
    
    store = RoundStore(results_root=tmp_path, default_round="paperless_invoices_v5")
    rounds = store.list_rounds()
    assert "paperless_invoices_v5" in rounds
    assert store.active_round == "paperless_invoices_v5"

    # Create new round
    new_round = "run_20261009_120000"
    created = store.create_round(new_round)
    assert created.is_dir()
    assert new_round in store.list_rounds()

def test_round_store_save_load_overwrite(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="round_a")
    store.create_round("round_a")
    
    # Save DMS-10 result
    payload_1 = {
        "dms_doc_id": "DMS-10",
        "recommendation": {"value": "AUTO_PASS", "max_severity": "None", "exception_codes": []},
        "rule_results": [{"rule_id": "V-01", "result": "pass"}]
    }
    store.save_result(10, payload_1)
    
    saved_file = tmp_path / "round_a" / "DMS-10_result.json"
    assert saved_file.exists()
    assert store.has_result(10)
    
    loaded = store.load_result(10)
    assert loaded["recommendation"]["value"] == "AUTO_PASS"

    # Overwrite DMS-10 result
    payload_2 = {
        "dms_doc_id": "DMS-10",
        "recommendation": {"value": "REVIEW", "max_severity": "Low", "exception_codes": ["V02_DIFF"]},
        "rule_results": [{"rule_id": "V-01", "result": "pass"}, {"rule_id": "V-02", "result": "fail"}]
    }
    store.save_result(10, payload_2)
    loaded_2 = store.load_result(10)
    assert loaded_2["recommendation"]["value"] == "REVIEW"

def test_round_store_summary_generation(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="round_test")
    store.create_round("round_test")
    
    doc1 = {
        "dms_doc_id": "DMS-1",
        "recommendation": {"value": "AUTO_PASS", "max_severity": "None"},
        "normalized_fields": {"invoice_num": "INV-001", "grand_total": 100.0, "currency": "THB"},
        "rule_results": [{"rule_id": "V-01", "result": "pass"}]
    }
    doc2 = {
        "dms_doc_id": "DMS-2",
        "recommendation": {"value": "HOLD", "max_severity": "High"},
        "normalized_fields": {"invoice_num": "INV-002", "grand_total": 500.0, "currency": "THB"},
        "rule_results": [{"rule_id": "V-01", "result": "fail"}]
    }
    store.save_result(1, doc1)
    store.save_result(2, doc2)

    summary = store.build_and_save_summary(mode="production")
    assert summary["statistics"]["counts"]["AUTO_PASS"] == 1
    assert summary["statistics"]["counts"]["HOLD"] == 1
    assert summary["metadata"]["total_documents"] == 2
    
    summary_file = tmp_path / "round_test" / "summary.json"
    assert summary_file.is_file()
```

**Step 2: Run test to verify it fails**

Run:
```bash
pytest engine/src/test-portal/tests/test_round_store.py -v
```
Expected: FAIL with `ImportError: cannot import name 'RoundStore' from 'webapp.store'`

**Step 3: Implement `RoundStore` in `webapp/store.py` and `webapp/config.py`**

In `webapp/config.py`: Add `results_dir: Path = ROOT.parents[0] / "results"` to `Settings`.
In `webapp/store.py`: Implement `RoundStore` maintaining backward compatibility with `ResultStore` while adding:
- `list_rounds() -> list[str]`
- `create_round(name: str) -> Path`
- `set_active_round(name: str)`
- `save_result(doc_id: int, payload: dict)` (writes `DMS-<id>_result.json` atomically)
- `load_result(doc_id: int) -> dict | None`
- `has_result(doc_id: int) -> bool`
- `delete_result(doc_id: int)`
- `build_and_save_summary(mode: str) -> dict` (matches `test_paperless_invoices.py` schema)
- `load_summary(round_name: str | None = None) -> dict | None`

**Step 4: Run test to verify it passes**

Run:
```bash
pytest engine/src/test-portal/tests/test_round_store.py -v
```
Expected: PASS

**Step 5: Commit**
```bash
git add engine/src/test-portal/webapp/store.py engine/src/test-portal/webapp/config.py engine/src/test-portal/tests/test_round_store.py
git commit -m "feat(test-portal): add RoundStore for direct results directory interop"
```

---

### Task 2: Service Layer High-Speed Parallel Batch Processing & Concurrency

**Files:**
- Modify: `engine/src/test-portal/webapp/service.py`
- Create: `engine/src/test-portal/tests/test_batch_service.py`

**Step 1: Write the failing test**

Create `engine/src/test-portal/tests/test_batch_service.py`:
```python
import time
import pytest
from pathlib import Path
from unittest.mock import MagicMock
from webapp.store import RoundStore
from webapp.service import DocumentService

class MockCatalog:
    def __init__(self, count=10):
        self.docs = [MagicMock(id=i, title=f"Doc {i}", file_name=f"dms_{i}.pdf",
                               mime="application/pdf", file_class="invoice",
                               tagged=["invoice"], pages_total=1, page_numbers=[1],
                               created="2026-01-01", correspondent=None,
                               dms_url=f"http://test/{i}") for i in range(1, count + 1)]
    def get(self, doc_id):
        for d in self.docs:
            if d.id == doc_id:
                return d
        raise KeyError(doc_id)
    def viewer_url(self, doc_id):
        return f"/view/{doc_id}"

class MockRunner:
    name = "inprocess"
    def run(self, doc_id: int, *, run: int):
        time.sleep(0.01)
        return {
            "dms_doc_id": f"DMS-{doc_id}",
            "pages": [{"width_pt": 600, "height_pt": 800, "rotation": 0, "page_type": "invoice"}],
            "ocr": {"elements": []},
            "recommendation": {"value": "AUTO_PASS", "max_severity": "None", "exception_codes": []},
            "normalized_fields": {"invoice_num": f"INV-{doc_id}", "grand_total": 100.0 * doc_id, "currency": "THB"},
            "rule_results": [{"rule_id": "V-01", "result": "pass"}]
        }

def test_batch_service_execution(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="batch_test")
    store.create_round("batch_test")
    catalog = MockCatalog(count=5)
    runner = MockRunner()
    
    svc = DocumentService(catalog, runner, store, workers=10, mode="production")
    
    # Start batch
    res = svc.start_batch(doc_ids=[1, 2, 3, 4, 5], skip_existing=False, concurrency=5)
    assert res["status"] == "started"
    assert res["total"] == 5
    
    # Wait for completion
    timeout = 10.0
    t0 = time.time()
    while time.time() - t0 < timeout:
        st = svc.batch_status()
        if not st["running"]:
            break
        time.sleep(0.05)
        
    st = svc.batch_status()
    assert not st["running"]
    assert st["completed"] == 5
    assert st["errors"] == 0
    
    # Check results exist
    for doc_id in [1, 2, 3, 4, 5]:
        assert store.has_result(doc_id)

def test_batch_service_stop(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="stop_test")
    store.create_round("stop_test")
    catalog = MockCatalog(count=20)
    runner = MockRunner()
    
    svc = DocumentService(catalog, runner, store, workers=2, mode="production")
    svc.start_batch(doc_ids=list(range(1, 21)), skip_existing=False, concurrency=2)
    time.sleep(0.02)
    svc.stop_batch()
    time.sleep(0.1)
    
    st = svc.batch_status()
    assert not st["running"]
    assert st["stopped"] is True
```

**Step 2: Run test to verify it fails**

Run:
```bash
pytest engine/src/test-portal/tests/test_batch_service.py -v
```
Expected: FAIL with `AttributeError: 'DocumentService' object has no attribute 'start_batch'`

**Step 3: Implement Batch & Concurrency controls in `webapp/service.py`**

In `webapp/service.py`:
- Add `concurrency` parameter and dynamic `ThreadPoolExecutor` adjustment.
- Add `start_batch(doc_ids: list[int], skip_existing: bool = True, concurrency: int = 10) -> dict`.
- Add `stop_batch() -> dict`.
- Add `batch_status() -> dict`.
- Integrate round switching: `switch_round(round_name: str)`.
- Ensure single `start(doc_id)` seamlessly saves to active round and updates `summary.json`.

**Step 4: Run test to verify it passes**

Run:
```bash
pytest engine/src/test-portal/tests/test_batch_service.py -v
```
Expected: PASS

**Step 5: Commit**
```bash
git add engine/src/test-portal/webapp/service.py engine/src/test-portal/tests/test_batch_service.py
git commit -m "feat(test-portal): add high-speed parallel batch runner with stop support"
```

---

### Task 3: Round Comparison Engine

**Files:**
- Modify: `engine/src/test-portal/webapp/service.py`
- Create: `engine/src/test-portal/tests/test_compare_rounds.py`

**Step 1: Write the failing test**

Create `engine/src/test-portal/tests/test_compare_rounds.py`:
```python
import pytest
from pathlib import Path
from unittest.mock import MagicMock
from webapp.store import RoundStore
from webapp.service import DocumentService, compare_verdicts

def test_compare_verdicts_ranking():
    assert compare_verdicts("MANUAL_REVIEW", "AUTO_PASS") == "improved"
    assert compare_verdicts("HOLD", "AUTO_PASS") == "improved"
    assert compare_verdicts("AUTO_PASS", "HOLD") == "regressed"
    assert compare_verdicts("AUTO_PASS", "AUTO_PASS") == "unchanged"
    assert compare_verdicts("SYSTEM_ERROR", "MANUAL_REVIEW") == "improved"

def test_compare_rounds_diff(tmp_path: Path):
    store = RoundStore(results_root=tmp_path, default_round="r1")
    store.create_round("r1")
    store.create_round("r2")
    
    # Doc 1: MANUAL_REVIEW -> AUTO_PASS (improved)
    store.set_active_round("r1")
    store.save_result(1, {
        "dms_doc_id": "DMS-1",
        "recommendation": {"value": "MANUAL_REVIEW"},
        "normalized_fields": {"invoice_num": "INV-1"},
        "rule_results": [{"rule_id": "V-08", "result": "fail"}]
    })
    store.set_active_round("r2")
    store.save_result(1, {
        "dms_doc_id": "DMS-1",
        "recommendation": {"value": "AUTO_PASS"},
        "normalized_fields": {"invoice_num": "INV-1"},
        "rule_results": [{"rule_id": "V-08", "result": "pass"}]
    })
    
    # Doc 2: AUTO_PASS -> HOLD (regressed)
    store.set_active_round("r1")
    store.save_result(2, {
        "dms_doc_id": "DMS-2",
        "recommendation": {"value": "AUTO_PASS"},
        "normalized_fields": {"invoice_num": "INV-2"},
        "rule_results": [{"rule_id": "V-01", "result": "pass"}]
    })
    store.set_active_round("r2")
    store.save_result(2, {
        "dms_doc_id": "DMS-2",
        "recommendation": {"value": "HOLD"},
        "normalized_fields": {"invoice_num": "INV-2"},
        "rule_results": [{"rule_id": "V-01", "result": "fail"}]
    })
    
    svc = DocumentService(MagicMock(docs=[]), MagicMock(), store)
    diff = svc.compare_rounds("r1", "r2")
    
    assert diff["aggregate"]["AUTO_PASS"]["diff"] == 0  # +1 (doc 1) -1 (doc 2)
    assert diff["aggregate"]["improved_count"] == 1
    assert diff["aggregate"]["regressed_count"] == 1
    
    cases = {c["doc_id"]: c for c in diff["cases"]}
    assert cases[1]["delta"] == "improved"
    assert cases[1]["rule_changes"] == [{"rule_id": "V-08", "base": "fail", "target": "pass"}]
    assert cases[2]["delta"] == "regressed"
```

**Step 2: Run test to verify it fails**

Run:
```bash
pytest engine/src/test-portal/tests/test_compare_rounds.py -v
```
Expected: FAIL with `ImportError: cannot import name 'compare_verdicts' from 'webapp.service'`

**Step 3: Implement `compare_rounds` and `compare_verdicts` in `webapp/service.py`**

Implement ranking logic:
```python
VERDICT_RANKS = {
    "AUTO_PASS": 5,
    "REVIEW": 4,
    "MANUAL_REVIEW": 3,
    "HOLD": 2,
    "SYSTEM_ERROR": 1,
    "FAILED": 1,
}
```
Compute deltas across all documents appearing in either round.

**Step 4: Run test to verify it passes**

Run:
```bash
pytest engine/src/test-portal/tests/test_compare_rounds.py -v
```
Expected: PASS

**Step 5: Commit**
```bash
git add engine/src/test-portal/webapp/service.py engine/src/test-portal/tests/test_compare_rounds.py
git commit -m "feat(test-portal): add round comparison and verdict delta ranking engine"
```

---

### Task 4: Expose REST API Endpoints in `webapp/app.py`

**Files:**
- Modify: `engine/src/test-portal/webapp/app.py`
- Modify: `engine/src/test-portal/tests/test_api.py`

**Step 1: Write the failing test**

Add to `engine/src/test-portal/tests/test_api.py`:
```python
def test_rounds_api_endpoints(client):
    # GET /api/rounds
    r = client.get("/api/rounds")
    assert r.status_code == 200
    data = r.json()
    assert "rounds" in data
    assert "active" in data

    # POST /api/rounds/create
    r = client.post("/api/rounds/create", json={"name": "test_api_round"})
    assert r.status_code == 200
    assert r.json()["round"] == "test_api_round"

    # POST /api/rounds/select
    r = client.post("/api/rounds/select", json={"name": "test_api_round"})
    assert r.status_code == 200
    assert r.json()["active"] == "test_api_round"

def test_batch_api_endpoints(client):
    # GET /api/batch/status
    r = client.get("/api/batch/status")
    assert r.status_code == 200
    assert "running" in r.json()
```

**Step 2: Run test to verify it fails**

Run:
```bash
pytest engine/src/test-portal/tests/test_api.py -k "test_rounds_api_endpoints" -v
```
Expected: FAIL with 404 Not Found

**Step 3: Implement endpoints in `webapp/app.py`**

Add routes:
- `GET /api/rounds`
- `POST /api/rounds/create`
- `POST /api/rounds/select`
- `GET /api/rounds/summary`
- `POST /api/rounds/summary/rebuild`
- `GET /api/rounds/compare?base={A}&target={B}`
- `POST /api/batch/start`
- `POST /api/batch/stop`
- `GET /api/batch/status`

**Step 4: Run test to verify it passes**

Run:
```bash
pytest engine/src/test-portal/tests/test_api.py -v
```
Expected: PASS

**Step 5: Commit**
```bash
git add engine/src/test-portal/webapp/app.py engine/src/test-portal/tests/test_api.py
git commit -m "feat(test-portal): add API endpoints for rounds, batching, and comparison"
```

---

### Task 5: Frontend UI Integration (Round Selector, Batch Runner, Summary & Compare Modals)

**Files:**
- Modify: `engine/src/test-portal/webapp/static/index.html`
- Modify: `engine/src/test-portal/webapp/static/app.js`
- Modify: `engine/src/test-portal/tests/test_ui_static.py`

**Step 1: Write static tests to verify elements exist**

Update `engine/src/test-portal/tests/test_ui_static.py` to assert presence of:
- `#round_sel`, `#btn_new_round`
- `#concurrency`, `#btn_batch`, `#skip_existing`, `#btn_stop`
- `#btn_summary`, `#btn_compare`
- `#modal_summary`, `#modal_compare`

**Step 2: Implement UI layout in `index.html`**

Update `engine/src/test-portal/webapp/static/index.html`:
- Top bar with compact utilitarian layout.
- High-contrast styles for modals, progress bar, and diff table rows.

**Step 3: Implement client logic in `app.js`**

Update `engine/src/test-portal/webapp/static/app.js`:
- Fetch and populate rounds dropdown.
- Handle `+ รอบใหม่` prompt (auto-generate `run_YYYYMMDD_HHMMSS`).
- Handle round selection change: re-fetch document statuses and refresh list.
- Batch run execution: triggers `/api/batch/start`, polls `/api/batch/status`, updates UI progress strip and document side indicators.
- Summary modal: renders verdict bar chart and rules breakdown table; wires "Re-generate summary" button.
- Comparison modal: renders Base vs Target selector, net delta cards, filter chips (`[เฉพาะที่เปลี่ยน]`, `[ทั้งหมด]`, `[🟢 ดีขึ้น]`, `[🔴 แย่ลง]`), and clickable diff table.

**Step 4: Run test to verify it passes**

Run:
```bash
pytest engine/src/test-portal/tests/test_ui_static.py -v
```
Expected: PASS

**Step 5: Commit**
```bash
git add engine/src/test-portal/webapp/static/index.html engine/src/test-portal/webapp/static/app.js engine/src/test-portal/tests/test_ui_static.py
git commit -m "feat(test-portal): implement UI for round selection, parallel batching, summary, and comparison"
```

---

### Task 6: Full Regression Verification

**Files:**
- None (verification only)

**Step 1: Run all test-portal tests**

```bash
cd engine/src/test-portal
pytest -v
```
Verify all existing tests (131+) and new tests pass without any regression.

**Step 2: Verify zero changes in `src/system_a/` or root `config/`**

Run:
```bash
git status --porcelain src/system_a config/
```
Output MUST be completely empty.

**Step 3: Update `docs/plans/task.md`**

Update task table in `engine/docs/plans/task.md` to reflect completed test-portal batch & comparison capability.
