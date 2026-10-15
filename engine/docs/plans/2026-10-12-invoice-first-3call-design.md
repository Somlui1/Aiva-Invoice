# Invoice-First ≤3 VLM Calls Design

**Date:** 2026-10-12
**Status:** Approved

## Problem

The current VisionPipeline makes 12–18 VLM calls per document (page_items + classify + table_rows + crop_reread per page).  Turning off `do_classify` and `do_crops` reduces this to ~5 calls on a 3-page document, but the goal is **≤ 3 calls** while maintaining field extraction accuracy and bbox quality.

Most DMS invoice PDFs bundle several document types in one file — the invoice original, a copy ("สำเนา" / "DUPLICATE" / "คู่ฉบับ"), a delivery note, and sometimes supporting documents.  Only the invoice original carries the authoritative data.  Reading every page wastes calls and risks copy-duplication errors (V-03).

## Design

### Call Budget

| Call # | Stage | Input | Output |
|---|---|---|---|
| **1** | **classify_batch** | All pages as multi-image (1 VLM call) | `doc_type`, `is_copy`, `page_priority` per page |
| **2** | **page_items** | Invoice original page(s) only (multi-image if >1) | fields + regions + bboxes |
| **3** | **table_rows** | Invoice original page(s) only (multi-image if >1) | item rows + cell bboxes |

Single-page invoice = 3 calls.  Multi-page invoice = still 3 calls (batched as multi-image).  No crop re-reads — consensus uses the PDF text layer as the second independent reader.

### Pipeline Flow

```
PDF
 → render all pages (no VLM)
 → ingest PDF text layers (no VLM)
 → Call 1: _classify_batch(all pages as multi-image)
     → returns [{page, doc_type, is_copy, page_priority}, ...]
 → Page Selection:
     1. Filter pages where doc_type ∈ {INVOICE, TAX_INVOICE}
     2. Partition into originals (is_copy=false) and copies (is_copy=true)
     3. If originals exist → use originals only
     4. If no originals → fallback to copies
     5. Skip all non-invoice pages entirely
 → Call 2: page_items(selected invoice pages)
     → extract fields, regions, bboxes
 → Call 3: table_rows(selected invoice pages)
     → extract item rows, cell bboxes
 → Consensus with PDF text layer (no VLM)
 → Assemble ExtractionResult
```

### Copy Detection

Two sources, combined:

1. **VLM classify_batch response:** the model returns `is_copy: true/false` per page.
2. **PDF text layer regex (corroboration):** scan for "สำเนา", "COPY", "DUPLICATE", "คู่ฉบับ", "CUSTOMER COPY", "ลูกค้า" in the text layer.

The VLM answer is the primary source.  The text layer regex is a corroboration signal that can upgrade confidence but does not override the VLM's classification.

### Multi-Invoice Handling

When a PDF contains multiple distinct invoices (different invoice numbers), all original invoice pages are sent together as a multi-image batch in calls 2 and 3.  The page_items and table_rows prompts already handle multi-page context.

### Configuration

New env var `PERCEPTION_INVOICE_FIRST` (default `"0"` = off, `"1"` = on).

When **off**, the pipeline behaves exactly as today — full per-page processing.  When **on**, the three-call flow above is used.

### What Changes

| Component | Change |
|---|---|
| `vision_pipeline.py` | New `_classify_batch()` method; refactored `extract()` with page filtering |
| `container.py` | New `invoice_first` setting from `PERCEPTION_INVOICE_FIRST` env var |
| Prompts | New `vision_classify_batch.md` prompt for multi-image classification |
| `PageRead` | New `page_priority` field (original / copy / non_invoice) |

### What Does NOT Change

- `ExtractionResult` contract — same fields, lines, regions, bboxes
- Consensus logic — same `same_text()`, `extract_value()`, `consensus()`
- PDF text layer processing — same `page_text_and_words()`
- Existing pipeline behavior when `PERCEPTION_INVOICE_FIRST=0`
- All downstream rules (V-01 through V-08) — they consume `ExtractionResult` unchanged

### Risks

| Risk | Mitigation |
|---|---|
| Text layer missing "สำเนา" in some PDFs | VLM classify_batch is primary source; text layer is corroboration only |
| Multi-page invoice (3+ pages) exceeding budget | Multi-image batching keeps it at exactly 3 calls |
| Dual-purpose documents ("ใบส่งของ/Invoice") | classify_batch prompt explicitly handles dual-purpose labels |
| Accuracy drop without crop re-reads | PDF text layer consensus remains; arithmetic corroboration unchanged |

### Success Criteria

1. ≤ 3 VLM calls per document when `PERCEPTION_INVOICE_FIRST=1`
2. Field extraction accuracy matches current pipeline on the test corpus
3. Existing tests pass without modification
4. New tests cover: single invoice, multi-invoice, original+copy, copy-only fallback
