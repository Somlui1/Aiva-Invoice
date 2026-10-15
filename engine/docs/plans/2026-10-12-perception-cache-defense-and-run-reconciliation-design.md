# Design: Perception Cache Defense & Run 20261011 Reconciliation

- **Date:** 2026-10-12
- **Author:** AIVA Engineering Team
- **Status:** Approved
- **Target Modules:** `src/system_a/perception/cache.py`, `scripts/clean_perception_cache.py`, `results/run_20261011/`

---

## 1. Context & Root Cause Analysis

### 1.1 The Incident in `run_20261011`
On October 11, 2026 at ~20:59, batch execution of 146 documents was running via `scripts/test_paperless_invoices.py`.
During document processing (starting at DMS-41 through DMS-144, including multi-grid target DMS-102), the network/DNS connection to LiteLLM (`http://aiva.aapico.com:4000/v1`) dropped (`[Errno 11001] getaddrinfo failed`).

### 1.2 The Silent Poisoning Mechanism
1. In `vision_pipeline.py`, page-level calls trapped `AITransportError: ConnectError` into `reads[p].error` and left `reads[p].items = []`.
2. The pipeline emitted an `ExtractionResult` where `pages_complete = False` and all fields/lines were `None` / `NOT_PRESENT`.
3. In `process_pdf.py` (`cache.save(key, ext)`), `PerceptionCache.save()` blindly persisted the empty extraction to `.cache/perception/<key>.json`.
4. Over 110 cache files were written to disk with transport errors, permanently recording empty results.
5. In `results/run_20261011/`, 101 documents ended up as empty files with verdict `REVIEW` (E01: missing mandatory fields), and 7 documents suffered `SYSTEM_ERROR` due to coincident Oracle EBS connection drops.
6. Meanwhile, 38 documents (DMS-15..39 before the drop, and DMS-145..166 this morning after network recovery) were valid, with DMS-145..166 achieving a 76% `AUTO_PASS` rate.

---

## 2. Architecture & Design

### 2.1 Cache Defense Guard (`is_cacheable`)
In `src/system_a/perception/cache.py`, introduce a strict validation gate `is_cacheable(ext: ExtractionResult) -> bool`:

```python
def is_cacheable(ext: ExtractionResult) -> bool:
    # 1. Reject if any page failed
    if not ext.pages_complete:
        return False

    # 2. Reject if page_errors or calls contain fatal transport/service errors
    extra = ext.extra or {}
    page_errors = extra.get("page_errors") or {}
    if any("connecterror" in str(e).lower() or "getaddrinfo" in str(e).lower()
           or "aitransporterror" in str(e).lower() for e in page_errors.values()):
        return False

    calls = extra.get("calls") or []
    if any(not c.get("ok") and ("connecterror" in str(c.get("error")).lower()
           or "getaddrinfo" in str(c.get("error")).lower()) for c in calls):
        return False

    # 3. Reject if document has pages but zero valid extracted fields
    if len(ext.pages) > 0:
        fields = ext.fields or {}
        has_any_field = any(f.raw_value is not None or f.ok for f in fields.values())
        if not has_any_field and len(ext.lines) == 0:
            return False

    return True
```

### 2.2 Guarded Cache Operations
- **`PerceptionCache.save(key, ext)`**:
  - Evaluate `is_cacheable(ext)`. If `False`, skip saving, log debug message, and return `None`.
  - Never write poisoned or transiently failed Extractions to disk.

- **`PerceptionCache.load(key, expect_sha)`**:
  - Deserialize json into `ExtractionResult`.
  - Validate against `expect_sha`.
  - Evaluate `is_cacheable(ext)`. If `False`, treat as corrupted/poisoned entry:
    - Increment `self.rejected += 1`.
    - Automatically delete or unlink the poisoned file.
    - Return `None` (cache miss, triggering fresh extraction).

### 2.3 Non-regression of BBox Quality (Zero-Impact Guarantee)
The cache guard is purely an I/O filter on `ExtractionResult` persistence.
It does NOT modify:
- Bounding box coordinates $[x, y, w, h]$
- Row or cell matching logic in `vision_pipeline.py`
- Table region unioning or degenerate sanitization in `assembler.py`
All BBox quality enhancements from commit `fba6e51` remain completely intact.

---

## 3. Purge Tooling & Batch Execution

### 3.1 Purge Script (`scripts/clean_perception_cache.py`)
A standalone utility that:
1. Iterates over all `.cache/perception/*.json` files.
2. Identifies files where `is_cacheable()` is `False` or containing `ConnectError`/`getaddrinfo`.
3. Unlinks the poisoned files.
4. Reports total cleaned vs preserved.

### 3.2 Smart Resume in `results/run_20261011/`
1. Identify the 101 empty JSON files (`inv is None and gt is None`) + 7 `SYSTEM_ERROR` files in `results/run_20261011/`.
2. Delete only these 108 invalid result files, keeping the 38 successfully processed valid files intact.
3. Execute:
   ```powershell
   python scripts/test_paperless_invoices.py --concurrency 6 --round-name run_20261011
   ```
4. `--skip-existing` preserves the 38 good results and re-runs the 108 cleaned documents against live LiteLLM & Oracle services.

---

## 4. Verification & Success Criteria

1. **Unit Tests**:
   - New unit tests in `tests/test_ocr_improvements.py` (or dedicated `tests/test_perception_cache.py`) asserting:
     - Extraction with `ConnectError` is rejected by `is_cacheable()` and not saved by `cache.save()`.
     - Poisoned file on disk is rejected by `cache.load()`.
2. **Purge Verification**:
   - `clean_perception_cache.py` cleans all 110 poisoned entries.
3. **Batch Verification**:
   - `results/run_20261011/summary.json` has 146/146 valid documents.
   - Multi-grid sample documents (DMS-102, DMS-119, DMS-129, DMS-24, DMS-59, DMS-60, DMS-76, DMS-81, DMS-93, DMS-96) have correct $Y \ge 0.33$ table coordinates and zero degenerate boxes.
   - Test portal `/api/compare` verifies overall accuracy improvement against `paperless_invoices_v5`.
