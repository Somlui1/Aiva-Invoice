# v5.11.1 — PDF/bbox alignment, drawer/dock exclusivity, production scope & RBAC

## PDF / bbox
- `/api/documents/:id/pdf` downloads `?original=true` (archive only when the original is not a PDF) —
  the same file the Engine reads. The default Paperless download is the OCRmyPDF archive, which can be
  re-rotated, so boxes landed on a differently turned page. Header `X-PDF-Variant: original|archive`.
- Evidence dock compares the painted page shape with the Engine's `pages[].width_pt/height_pt`; on a
  mismatch the boxes are hidden with a warning instead of pointing at the wrong place.
- Engine `pdf_ingest.py`: text-layer word boxes are mapped into the `page.rect` frame (`rotation_matrix`)
  on rotated pages (was: unrotated frame normalised by rotated size).
- Non-Latin-1 fallback reasons no longer crash the PDF response header.

## UI
- "ผูกใบรับ" drawer and the PDF dock are mutually exclusive.

## Scope (server, every user — was only under "view as")
- List / read / action / PDF / AP batch apply the document scope. ACC/APR without a company and EU
  without an Oracle account see nothing (was: everything). Receiver match ignores case/spacing.
- `upload_revision` is simulation-only and limited to engine statuses (could set any status).

## RBAC / company / Oracle account
- `POST /api/users`: known companies only (incl. AHA), EU needs ≥1 Oracle account, ACC/APR ≥1 company,
  only SA manages SA, no self role change, receivers de-duplicated, real admin in audit, re-activates.
- `DELETE /api/users/:id` (soft deactivate); the grid now sends deletions and reports refused rows.
- Company lists come from the company master (AHA was missing); no guessed Oracle account on add.
- `receiverActive` ("ยังไม่เชื่อมบัญชี") from real active EU bindings.
- Oracle company sync reports Oracle only when Oracle rows were read and applied.
