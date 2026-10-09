| Task | Status | Description |
|---|---|---|
| Task 1: PO Number Normalization & Consensus | In Progress | Strip PO prefixes in extract_value and corroborate PO agreement in `vision_pipeline.py` |
| Task 2: Crop Budget Prioritization for Core Lookup Keys | Not Started | Prioritize critical identifiers in candidate crop allocation before free text |
| Task 3: Header Candidate Scoping to Invoice Pages | Not Started | Restrict invoice headers to `invoice_pages` to avoid PO attachment leakage |
| Task 4: Ghost Row Auto-Folding in `_lines()` | Not Started | Auto-fold empty continuation lines into preceding description; eliminates false V-07 failures |
| Task 5: Full Regression & Target DMS Verification | Not Started | Verify pytest suite, 62/62 sandbox scenarios, and DMS-24, 64, 23 |
