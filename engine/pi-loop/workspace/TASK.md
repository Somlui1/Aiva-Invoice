# Autonomous Invoice OCR & BBox Perfection Loop

## Task Directive
Read and execute the complete implementation plan defined in:
`/workspace/docs/plans/2026-10-15-ocr-bbox-autonomous-improvement-loop.md`

## Summary of Core Instructions:
1. **Corpus & Staging:**
   - Rounds 1–7: Use the fixed 50-document subset in `config/eval_staged_50_ids.json` (generated with seed=42).
   - Final Full Round: Run on all Paperless invoices (~125 docs).
2. **Copy Separation vs Exclusion:**
   - Multi-page PDF with Original + Copy: Patch `select_invoice_pages()` in `single_pass.py` and `single_pass_classify.md` to select ONLY the original. Keep the document in the test pool.
   - Non-invoice PDF (100% Delivery Note / PO): Exclude to `round_XX/excluded_docs.md`.
3. **Folder Structure:**
   - All artifacts must strictly follow `bbox_testing/round_XX/` (with `source_images/`, `rendered/`, `crops/`, `ocr/`, `review/`, `scorecard.md`, `excluded_docs.md`).
4. **Visual Inspection:**
   - Inspect overlays with your own eyes (`view_file` on PNGs) for all failed docs, diff docs (>5px delta or text change), and spot-check unchanged passes.
5. **Safe Permissions:**
   - Paperless API is READ-ONLY. Never alter tags or delete documents.
   - Never weaken existing assertions in unit tests.
6. **Completion:**
   - When all stopping conditions are satisfied (and after running the full corpus), write a final summary to `/workspace/.pi_done`.
