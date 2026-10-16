# Backlog carried out of the Autonomous OCR & BBox Refinement Loop (plan closed 2026-10-16)

Source: `2026-10-15-ocr-bbox-autonomous-improvement-loop.md`, closed by System Owner order after the final
full-corpus census. Full numbers: `engine/bbox_testing/round_06/FINAL_SCORECARD.md`.

The closed loop left the **box defect rate at 11.4%** (616/5,384 judgeable boxes, unchanged from 11.3%) and the
**key-field health materially better** (a tax id the Thai rule cannot accept: 6.7–9.4% → 3.6% of documents;
buyer-id-in-issuer-field 0/223). Every item below is a place where work was measured but not finished, or where
a fault is now *detected* but its cause is still unknown. Ordered by what I would spend first.

---

## B-1 · Four documents deliver values with no geometry (`NO_GEOMETRY`) — cause still unproven

**State.** R6-3 shipped detection: a selected page that offers values and locates none becomes
`page_errors[page] = "NO_GEOMETRY: N values read, none with a usable box (unmapped: …)"` and lands as `E01/REVIEW`
instead of silently dropping coordinates. The unmapped boxes are now retained on the payload.

**Evidence.** Final run: DMS-98 (26 values), DMS-135 (17), DMS-158 (17), DMS-209 (18) = 1.8%/run, which matches
R6-8's two-run estimate — so this is a stable ~4-documents-per-corpus-run fault, not a one-off.

**What is unknown.** The hypothesis is that the model answers `[x, y, w, h]` where `[x1, y1, x2, y2]` is expected
(a whole page read that way collapses every box to zero size, and `region()` used to return `None` silently).
**It was never proven**, because the raw answer from the failing run was not captured. A rule written on a guessed
cause is the mistake I refused to make, so no repair shipped.

**First step.** `bbox_testing/round_06/dump_extract_answer.py` monkeypatches `pipe._ask` to save raw answers. Run
those four documents until the fault reproduces, then compare the raw geometry of a failing page with a working
one. Only after that does a coordinate-convention repair earn its place — and it should ship with a test that
fails without it.

## B-2 · Rotated pages sit outside the measurement (R6-5) — the 11.4% does not include them

**State.** Ten documents have pages the engine turns 90°/270° (32, 36, 49, 59, 62, 64, 118, 119, 224, 225).
`bbox_testing/round_03/align.py` has no frame for a turned page, so those boxes are excluded from the ruler's
denominator. They are **not inside** the 11.4%, and any claim that the corpus is at 11.4% is only true for the
pages the ruler can judge.

**First step.** Extend the *measurement* (a copy, never `align.py` — it is the historical ruler and must stay
byte-for-byte unchanged) to rotate the ground-truth grid for a turned page, then re-score. Expect the corpus rate
to move once these documents are counted; that movement is a change in what is measured, not a regression.

## B-3 · Orientation oracle has no safe control (R6-7)

**State.** PP-LCNet orientation classifier fails a 180° control, so no orientation vote from it is trusted today;
turning decisions rest on the LLM. **First step.** Build the control first: a fixed set of pages with known
orientation, scored by the classifier alone, with a documented pass bar. An oracle that cannot pass a control
cannot improve the pipeline, only move its errors.

## B-4 · DMS-227 delivers `invoice_num = 4224` (probably `422` + a stray digit)

**State.** DMS-227 is the same supplier and paper form (Mongkonchai, ห.จ.ก. มงคลชัยกลการ) as DMS-236/237, which
deliver `422` after the ambiguity ruling. A document number has no check digit, so no rule can catch this class —
it is invisible to `format_warnings` and to `normalize.tax_id()`.

**First step.** Re-render the number block from the PDF at **300 DPI** (never from a 130 DPI upscaling — that
exact mistake produced two wrong ground-truth readings this loop: DMS-96 and the DMS-236/237 labels), establish
what is printed, then decide: prompt wording, or accept it as a model ceiling on that form.

## B-5 · DMS-175 `supplier_tax_id = 0105544109337` — never verified against the page

**State.** R6-9 recorded this field as "not fixed by Option A", but no printed ground truth was ever established,
so it is logged as **unverified**, not as correct. It passes the 13-digit rule and the Thai checksum, so nothing
in the pipeline would ever question it. **First step.** 300 DPI crop of the issuer block; read the printed value;
then classify (wrong / correct / genuinely absent).

**Same class, larger.** "Stable and wrong" is the failure mode the whole loop kept circling back to: an error both
runs agree on is invisible to a repeatability measurement. So far only the tax id has a deterministic rule that
can see it. Worth a backlog decision: which other delivered fields admit a cheap deterministic check
(e.g. a known buyer-id roster from the master — R6-14 found 15 of 30 checksum-rejected customer ids are exactly
one digit from master `0145548001557`).

## B-6 · 26 action-queue documents never visually audited (R6-4)

**State.** The Final Full Round queued 28 documents for human look, 26 of them new:
`15,215,213,23,190,214,221,236,120,238,194,175,52,241,233,216,135,96,91,77,76,112,187,136,83,20,30,33`.
The worst offenders in the final run are largely the same documents (DMS-36 88.9%, DMS-214 61.1%, DMS-213 55.6%,
DMS-236 50.0%, DMS-15 45.8%, DMS-190 45.7%, DMS-23 44.4%, DMS-221 42.9%, DMS-77 35.3%).
**First step.** One review sheet per document in the `r69_sheet.py` style (page image + delivered values side by
side), 8 at a time, classified into R6-9's existing classes. This is the cheapest path to moving 11.4%, because
the worst documents are already known and few.

## B-7 · Name spelling is still the largest source of key-field disagreement

**State.** R6-8 measured 15.9% of key-field reads disagreeing between two runs of identical code; the most
volatile fields were `customer_name` (81) and `customer_address` (74), then `supplier_name` (41) — Thai company
names shift spelling (อาปิโก ↔ อาบีโก ↔ อาวีกโก, พาร์ทส์ ↔ فارทส์). Normalisation and fuzzy matching absorb it
today, so it is mostly not a matching failure, but it is the reason key-field rates carry a ±16% caveat.
**First step.** Decide, as policy, whether a canonical name may be substituted from master data once the tax id
matches — that turns an OCR spelling problem into a lookup, and would remove the largest remaining disagreement
source without touching the model.

## B-8 · Two paired runs of the shipped config (to tighten, not extend)

Every rate in `FINAL_SCORECARD.md` comes from **one run per document**. The noise floor measured in R6-8 is
15.9% of key-field reads, 1.8% of selected pages, 3.6% of `pages_complete` flips. `supplier_tax_id` empties
(4.0%) and missing `invoice_num` (4.0%) could not be claimed as improvements because they sit inside the old
arms' spread. Two paired runs of `extract@1.6.0 + retry` would say which survivors are stable — cost ≈ 2 × 504
vision calls. Do this before quoting the 3.6% figure as production reality.

## B-9 · Owner policy still owed

* DMS-223's page 1 names itself ORIGINAL DELIVERY ORDER and is discarded on every run while the tag says
  invoice — is that the intended policy? (It is the only unresolved drop from R6-2's seven.)
* Any page that prints two candidate numbers *other* than the ruled cases (DMS-159, DMS-236, DMS-237) is still a
  model judgement. The ladder in `single_pass_extract.md@1.6.0` covers the labelled cases; unlabelled collisions
  need a ruling.
