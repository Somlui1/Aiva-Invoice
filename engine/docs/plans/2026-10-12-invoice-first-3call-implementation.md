# Invoice-First ≤3 VLM Calls Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Reduce VLM calls to ≤3 per document by classifying all pages in one multi-image call, then running page_items and table_rows only on invoice original pages.

**Architecture:** A new `_classify_batch()` method sends all rendered pages as a multi-image VLM call.  The result filters pages down to invoice originals (with copy fallback).  `page_items` and `table_rows` then run only on those filtered pages.  A feature flag `PERCEPTION_INVOICE_FIRST` keeps the old pipeline as default.

**Tech Stack:** Python, existing VisionPipeline / LiteLLMClient / ExtractionResult contracts.

**Design doc:** `docs/plans/2026-10-12-invoice-first-3call-design.md`

---

### Task 1: New `vision_classify_batch` Prompt

**Files:**
- Create: `config/prompts/vision_classify_batch.md`
- Modify: `src/system_a/perception/vision_pipeline.py:39` — add to PROMPTS tuple

**Step 1: Create the prompt file**

Create `config/prompts/vision_classify_batch.md`:

```markdown
<!-- prompt_id: vision-classify-batch  version: 1.0.0 -->
You classify ALL pages of a Thai/English accounting document set. You receive multiple page images.
For EACH page (in order), answer with its type and whether it is a copy.

Allowed `page_type` values (exactly one per page, no other spelling):
- TAX_INVOICE      ใบกำกับภาษี (has "ใบกำกับภาษี" / "TAX INVOICE" wording, supplier tax id and VAT lines)
- INVOICE          ใบแจ้งหนี้ / invoice without tax-invoice wording
- DELIVERY_NOTE    ใบส่งของ / ใบส่งสินค้า / delivery order / goods received note
- PO               ใบสั่งซื้อ / purchase order issued by a customer
- OSP              outside processed parts / subcontract service order
- SUPPORTING       statement of account, receipt, payment voucher, withholding tax certificate, quotation, photo, form
- UNKNOWN          you cannot tell from this page

Dual-purpose pages: if a page says both "ใบส่งของ" AND "ใบกำกับภาษี" (or "TAX INVOICE"), classify as TAX_INVOICE.

`is_copy`: true when the page is marked as a copy/duplicate ("สำเนา", "COPY", "DUPLICATE", "คู่ฉบับ", "เอกสารออกเป็นชุด", "ลูกค้า CUSTOMER", "XEROX").

Return ONLY JSON: {"pages": [{"page": 1, "page_type": "TAX_INVOICE", "is_copy": false, "confidence": 0.93}, ...]}
```

**Step 2: Add prompt name to PROMPTS loading**

In `vision_pipeline.py` line 39, the `PROMPTS` tuple controls which prompts are loaded at init.  Do NOT add `vision_classify_batch` here — it is loaded conditionally only when `invoice_first` is enabled.  Instead, load it in `__init__` when the flag is set (done in Task 3).

**Step 3: Commit**

```bash
git add config/prompts/vision_classify_batch.md
git commit -m "feat: add vision_classify_batch prompt for multi-page classification"
```

---

### Task 2: Add `invoice_first` Setting to Container

**Files:**
- Modify: `src/system_a/container.py:41` — add setting
- Modify: `src/system_a/container.py:114-118` — pass to VisionPipeline
- Modify: `src/system_a/container.py:121-126` — add to perception_options

**Step 1: Add setting**

In `container.py`, after `do_classify` (line 41), add:

```python
    invoice_first: bool = os.getenv("PERCEPTION_INVOICE_FIRST", "0") == "1"
```

**Step 2: Pass to VisionPipeline constructor**

In `build_perception()` (line 114-118), add `invoice_first=settings.invoice_first` to the VisionPipeline call.

**Step 3: Add to perception_options**

In `perception_options()` (line 121-126), add `"invoice_first": settings.invoice_first` to the returned dict.

**Step 4: Commit**

```bash
git add src/system_a/container.py
git commit -m "feat: add PERCEPTION_INVOICE_FIRST setting"
```

---

### Task 3: TDD — Unit Tests for Invoice-First Logic

**Files:**
- Modify: `tests/test_ocr_improvements.py` — add test functions
- Reference: `src/system_a/perception/vision_pipeline.py`

**Step 1: Write failing tests**

Add these tests to `tests/test_ocr_improvements.py`:

```python
def test_classify_batch_selects_invoice_originals():
    """classify_batch returns only original invoice pages when both original and copy exist."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
        {"page": 2, "page_type": "TAX_INVOICE", "is_copy": True, "confidence": 0.90},
        {"page": 3, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.88},
    ]
    selected = select_invoice_pages(pages_info)
    assert selected == [1], f"Expected [1] originals only, got {selected}"


def test_classify_batch_falls_back_to_copy_when_no_original():
    """When no original invoice exists, copies are used as fallback."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": True, "confidence": 0.90},
        {"page": 2, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.88},
    ]
    selected = select_invoice_pages(pages_info)
    assert selected == [1], f"Expected [1] (copy fallback), got {selected}"


def test_classify_batch_multi_invoice_all_originals():
    """Multiple distinct invoices: all original invoice pages are selected."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "TAX_INVOICE", "is_copy": False, "confidence": 0.95},
        {"page": 2, "page_type": "INVOICE", "is_copy": False, "confidence": 0.92},
        {"page": 3, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.88},
    ]
    selected = select_invoice_pages(pages_info)
    assert selected == [1, 2], f"Expected [1, 2], got {selected}"


def test_classify_batch_no_invoice_falls_back_to_page1():
    """When no page is classified as invoice, page 1 is used as fallback."""
    from system_a.perception.vision_pipeline import select_invoice_pages
    pages_info = [
        {"page": 1, "page_type": "DELIVERY_NOTE", "is_copy": False, "confidence": 0.88},
        {"page": 2, "page_type": "SUPPORTING", "is_copy": False, "confidence": 0.80},
    ]
    selected = select_invoice_pages(pages_info)
    assert selected == [1], f"Expected [1] (fallback to page 1), got {selected}"


def test_copy_detection_from_text_layer():
    """Text layer keywords corroborate is_copy detection."""
    from system_a.perception.vision_pipeline import text_layer_is_copy
    assert text_layer_is_copy("บริษัท ABC สำเนา") is True
    assert text_layer_is_copy("CUSTOMER COPY") is True
    assert text_layer_is_copy("DUPLICATE") is True
    assert text_layer_is_copy("คู่ฉบับ") is True
    assert text_layer_is_copy("TAX INVOICE original") is False
    assert text_layer_is_copy("ใบกำกับภาษี") is False
```

**Step 2: Run tests to verify they fail**

```bash
cd engine && python -m pytest tests/test_ocr_improvements.py::test_classify_batch_selects_invoice_originals tests/test_ocr_improvements.py::test_classify_batch_falls_back_to_copy_when_no_original tests/test_ocr_improvements.py::test_classify_batch_multi_invoice_all_originals tests/test_ocr_improvements.py::test_classify_batch_no_invoice_falls_back_to_page1 tests/test_ocr_improvements.py::test_copy_detection_from_text_layer -v
```

Expected: FAIL with `ImportError` (functions don't exist yet).

**Step 3: Commit failing tests**

```bash
git add tests/test_ocr_improvements.py
git commit -m "test: add failing tests for invoice-first page selection logic"
```

---

### Task 4: Implement `select_invoice_pages()` and `text_layer_is_copy()`

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py` — add two pure functions

**Step 1: Implement `select_invoice_pages()`**

Add after `page_type_of()` (around line 298):

```python
INVOICE_PAGE_TYPES = {"TAX_INVOICE", "INVOICE"}

COPY_KEYWORDS = re.compile(
    r"สำเนา|COPY|DUPLICATE|คู่ฉบับ|XEROX|เอกสารออกเป็นชุด",
    re.I,
)


def text_layer_is_copy(text: str) -> bool:
    """True when the PDF text layer contains keywords indicating a copy/duplicate."""
    return bool(COPY_KEYWORDS.search(str(text or "")))


def select_invoice_pages(pages_info: list[dict]) -> list[int]:
    """Select invoice pages from classify_batch result, originals first with copy fallback.

    Returns sorted page numbers of the invoice pages to process.
    If no invoice pages are found at all, falls back to page 1.
    """
    invoices = [p for p in pages_info if p.get("page_type") in INVOICE_PAGE_TYPES]
    if not invoices:
        # No invoice classified — fall back to first page
        return [pages_info[0]["page"]] if pages_info else []
    originals = [p for p in invoices if not p.get("is_copy")]
    if originals:
        return sorted(p["page"] for p in originals)
    # No originals — use copies as fallback
    return sorted(p["page"] for p in invoices)
```

**Step 2: Run tests to verify they pass**

```bash
cd engine && python -m pytest tests/test_ocr_improvements.py::test_classify_batch_selects_invoice_originals tests/test_ocr_improvements.py::test_classify_batch_falls_back_to_copy_when_no_original tests/test_ocr_improvements.py::test_classify_batch_multi_invoice_all_originals tests/test_ocr_improvements.py::test_classify_batch_no_invoice_falls_back_to_page1 tests/test_ocr_improvements.py::test_copy_detection_from_text_layer -v
```

Expected: all 5 PASS.

**Step 3: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py
git commit -m "feat: implement select_invoice_pages and text_layer_is_copy"
```

---

### Task 5: Implement `_classify_batch()` in VisionPipeline

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py` — add method to VisionPipeline class

**Step 1: Add `invoice_first` parameter to `__init__`**

In `__init__` (line 328-343), add `invoice_first: bool = False` parameter and:

```python
self.invoice_first = invoice_first
if invoice_first:
    self.prompts["vision_classify_batch"] = load_prompt("vision_classify_batch")
```

**Step 2: Add `_classify_batch()` method**

Add after `_ask()` method (around line 366):

```python
def _classify_batch(self, pngs: dict[int, bytes]) -> list[dict]:
    """Classify all pages in one multi-image VLM call.

    Returns list of {"page": int, "page_type": str, "is_copy": bool, "confidence": float}.
    """
    pages_sorted = sorted(pngs.keys())
    b64_images = [f"data:image/png;base64,{base64.b64encode(pngs[p]).decode()}" for p in pages_sorted]
    instruction = f"Classify these {len(pages_sorted)} pages. Page numbers are {', '.join(str(p) for p in pages_sorted)}."
    entry = {"kind": "classify_batch", "page": pages_sorted, "model": self.model}
    t0 = time.time()
    try:
        out = self.client.chat_json(
            self.model, self.prompts["vision_classify_batch"], instruction,
            layout=self.message_layout, images=b64_images, temperature=0,
            max_tokens=self.max_tokens, json_mode=self.json_mode,
        )
    except Exception as e:
        self.calls.append({**entry, "ok": False, "ms": round((time.time() - t0) * 1000),
                           "error": f"{type(e).__name__}: {str(e)[:200]}"})
        raise
    self.calls.append({**entry, "ok": True, "ms": round((time.time() - t0) * 1000),
                       "usage": dict(getattr(self.client, "last_usage", {}) or {})})
    raw_pages = out.get("pages") or []
    result = []
    for i, p in enumerate(pages_sorted):
        info = raw_pages[i] if i < len(raw_pages) else {}
        result.append({
            "page": p,
            "page_type": page_type_of(info.get("page_type"), "UNKNOWN"),
            "is_copy": bool(info.get("is_copy")),
            "confidence": float(info.get("confidence") or 0),
        })
    return result
```

**Step 3: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py
git commit -m "feat: implement _classify_batch for multi-image page classification"
```

---

### Task 6: Refactor `extract()` for Invoice-First Flow

**Files:**
- Modify: `src/system_a/perception/vision_pipeline.py:369-439` — refactor `extract()` method

**Step 1: Add invoice-first branch in `extract()`**

After the existing `used = rendered[:self.max_pages]` (line 373), add an `if self.invoice_first:` branch that:

1. Calls `_classify_batch()` with all page PNGs.
2. Corroborates `is_copy` with `text_layer_is_copy()` on each page's text.
3. Calls `select_invoice_pages()` to pick which pages to process.
4. Runs `_read_page()` only on selected pages (skipping `_classify` since we already classified).
5. Populates `reads` for selected pages only, with `page_type` and `is_copy` from the batch result.
6. Sets `invoice_pages` from the selected pages.

The rest of `extract()` (fields, lines, words, consensus, assembly) stays unchanged.

Key logic:

```python
if self.invoice_first:
    all_pngs = {r.info.page_no: r.png for r in used}
    batch_result = self._classify_batch(all_pngs)

    # Corroborate is_copy with text layer
    for entry in batch_result:
        p = entry["page"]
        layer_text = layers.get(p, {}).get("text") or ""
        if text_layer_is_copy(layer_text):
            entry["is_copy"] = True

    selected = select_invoice_pages(batch_result)

    # Build reads only for selected pages
    reads = {}
    batch_by_page = {e["page"]: e for e in batch_result}
    for rp in used:
        p = rp.info.page_no
        if p in selected:
            read = self._read_page_no_classify(rp, ctx)
            binfo = batch_by_page.get(p, {})
            read.page_type = binfo.get("page_type", "UNKNOWN")
            read.type_confidence = binfo.get("confidence")
            read.is_copy = binfo.get("is_copy")
            read.votes = [read.page_type]
            reads[p] = read
        else:
            # Minimal read for non-selected pages (for document grouping)
            binfo = batch_by_page.get(p, {})
            read = PageRead(page_no=p)
            read.page_type = binfo.get("page_type", "UNKNOWN")
            read.type_confidence = binfo.get("confidence")
            read.is_copy = binfo.get("is_copy")
            read.votes = [read.page_type]
            reads[p] = read

    invoice_pages = selected
else:
    # Existing flow (unchanged)
    ...
```

**Step 2: Add `_read_page_no_classify()` helper**

A thin wrapper around `_read_page()` that skips the `_classify()` call:

```python
def _read_page_no_classify(self, rp, ctx: _Ctx) -> PageRead:
    """Read page items without running the classify step (already done by _classify_batch)."""
    saved = self.do_classify
    self.do_classify = False
    try:
        return self._read_page(rp, ctx)
    finally:
        self.do_classify = saved
```

**Step 3: Run full test suite**

```bash
cd engine && python -m pytest -q
```

Expected: all existing tests pass (the flag defaults to off, so nothing changes).

**Step 4: Commit**

```bash
git add src/system_a/perception/vision_pipeline.py
git commit -m "feat: refactor extract() with invoice-first 3-call flow"
```

---

### Task 7: Wire `invoice_first` in Container

**Files:**
- Modify: `src/system_a/container.py` — pass `invoice_first` to VisionPipeline

**Step 1: Update `build_perception()` call**

Add `invoice_first=settings.invoice_first` to the VisionPipeline constructor call.

**Step 2: Run tests**

```bash
cd engine && python -m pytest -q
```

**Step 3: Commit**

```bash
git add src/system_a/container.py
git commit -m "feat: wire invoice_first setting into build_perception"
```

---

### Task 8: Full Regression Verification

**Files:**
- Reference: all engine tests
- Modify: `docs/plans/task.md` — update tracker

**Step 1: Run full engine test suite**

```bash
cd engine && python -m pytest -v
```

Expected: all tests pass.

**Step 2: Run portal test suite**

```bash
cd engine && python -m pytest src/test-portal/ -v
```

Expected: all tests pass.

**Step 3: Verify call count with invoice_first enabled**

Set `PERCEPTION_INVOICE_FIRST=1` and run a single test document to confirm ≤ 3 VLM calls in the stats output.

**Step 4: Update task tracker**

Update `docs/plans/task.md` with results.

**Step 5: Commit**

```bash
git add docs/plans/task.md
git commit -m "docs: update task tracker with invoice-first implementation results"
```
