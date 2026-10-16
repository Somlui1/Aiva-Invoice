# R6-12 · Class 5 evidence — the seven documents whose `supplier_tax_id` vanished in one run

**Files inspected**: `source_images/DMS-<id>_p1.png` (130 DPI), header strips
`r69_sheets/class5_montage_1.png` / `class5_montage_2.png`, and the 5x crop
`r69_sheets/class5_printed_ids_5x.png`.
**Measurement**: `bbox_testing/round_06/class5_probe.py`, raw results in `class5_probe.json`.

## First, a mistake of mine that would have changed the conclusion

Reading DMS-96 off the montage strip (which had been *downscaled*) I wrote down `01155490004428` — 14 digits.
The 5x crop, which was never shrunk, prints **`0115549004428` — 13 digits**. Had I not re-checked at higher
magnification, my ground truth would have been wrong and the conclusion would have flipped into blaming the
document for printing a malformed number, when in fact the model inserted an extra `0`. Ground truth gets
verified at the resolution I intend to rely on, not at the resolution that was convenient to look at.

## What the pages actually print (all seven are genuine tax invoices; the issuer's own id is printed and legible)

| doc | issuer | id as printed (read from the 5x crop) | how it looks on the page |
|---|---|---|---|
| DMS-31 | THREE PIECE (THAILAND) | `0115554004198` | last line of the header after E-mail, small but fully legible |
| DMS-92 | BKS ENTERPRISE | `0105562195321` | under E-Mail, full size, easy |
| DMS-94 | MISUMI (THAILAND) | `0105540008838` | small line under address/TEL, thin but not faded |
| DMS-96 | TaeguTec (Thailand) | `0115549004428` | green type on the right, clear |
| DMS-98 | BKS ENTERPRISE | `0105562195321` | as DMS-92 |
| DMS-149 | BKS ENTERPRISE | `0105562195321` | as DMS-92 |
| DMS-182 | MISUMI (THAILAND) | `0105540008838` | as DMS-94 |

**No page in this class has a stamp over the number and no page has ink too faint to read.** My earlier
hypothesis (overprint / faded ink ⇒ MODEL_LIMIT) is refuted by the images, not by argument.

## Two attempts, as the plan requires before anything may be called MODEL_LIMIT

| attempt | what changed | result (14 reads = 7 docs × 2 runs) |
|---|---|---|
| **1** | shipped prompt `single-pass-extract@1.5.0` (the rule that says to look on the small line under the issuer's address *before* returning null), production 150 DPI | **correct 10/14, missing 0, wrong 4.** Only DMS-31 (`011554004198`, a digit dropped) and DMS-96 (`01155490004428`, a digit inserted) are wrong, identically in both runs — and `format_warnings` caught **both** |
| **2** | more pixels only: render at 300 DPI, same code, same prompt | **correct 14/14, wrong 0, missing 0** — DMS-31 and DMS-96 both read correctly in both runs |

## Per-document verdict (plan template)

| doc | type | verdict |
|---|---|---|
| DMS-92, 94, 98, 149, 182 | **OCR — read stability** (the value is printed clearly and was simply not returned in some runs of the old wording) | **PASS** under 1.5.0: 2/2 correct, zero missing |
| DMS-31, DMS-96 | **OCR — limited by render resolution** (one digit dropped/inserted at 150 DPI; correct at 300 DPI) | **FAIL at 150 DPI / PASS at 300 DPI → not MODEL_LIMIT** |

**Why this is not MODEL_LIMIT**: the plan defines it as *two fixes tried and the same failure remains, with faded
ink or merging glyphs*. Here attempt 2 fixed it, and no page shows faded ink. Labelling these MODEL_LIMIT would
be using the label to stop working on something that has a measured way forward.

What *is* earned here, and worth noting because it was not the point of the exercise: **the "value disappears"
behaviour itself is gone** — 0 of 14 reads lost the field under 1.5.0, on documents where it had disappeared in
one of two runs before. That is Option A's binding rule doing its job on a population it was never A/B'd on.

## The trade-off that belongs to the owner

Fixing DMS-31/DMS-96 means raising extract render DPI from 150 to 300 — configuration, not a bug, and not my call:
a page at 300 DPI carries roughly 4× the pixels of the same page at 150 DPI, and the corpus sends ~224 pages to
extract per run, so the token bill follows.

An unmeasured middle option: **re-read only the pages whose tax id fails the format check or the checksum, at
300 DPI** — pay the extra resolution only for the handful of documents that look suspicious (from R6-11: 18
rejections for not-13-digits and 23 checksum rejections across 836 delivered values). If the owner wants this,
I will measure its hit rate and its cost before proposing it as a change.
