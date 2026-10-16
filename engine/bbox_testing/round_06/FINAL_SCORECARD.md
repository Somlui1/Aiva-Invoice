# FINAL SCORECARD — Round 6 close-out · corpus 223 documents · `single-pass/1.4.0` + `extract@1.6.0`

Config that produced every number on this page (read out of the payloads, not from memory):
`engine=single-pass/1.4.0` · prompts `single-pass-classify@1.3.0 + single-pass-extract@1.6.0 + single-pass-adjudicate@1.0.0` ·
`ink_snap=move` (`INK_RULES_VERSION=2`) · adjudication **on** · targeted tax-id retry **on at 300 DPI** · extract 150 DPI.
Scoring ruler: `bbox_testing/round_03/align.py`, **byte-for-byte unchanged**, called as a subprocess (`FFR_ARM=final`).

## 1 · The run

| | |
|---|---|
| documents | **223 / 223 `ok`, 0 errors** |
| vision calls recorded | **504** (preflight estimate was ≤ 1,008; FFR spent 447) |
| pages past the read cap | 2 documents are wider than `max_pages=12`: DMS-40 (13 pages, read to 4), DMS-95 (19 pages, read to 7) — never sent to the model, so their silence is not a read fault |
| gate sent nothing to extract | **9 documents** `93,123,124,180,204,205,206,207,223` |
| second-look adjudication ran | 13 documents; **rescued and read: DMS-56, DMS-195, DMS-226, DMS-227** · still discarded: DMS-223 (page 1 names itself ORIGINAL DELIVERY ORDER), DMS-204 |
| geometry-less reads (`NO_GEOMETRY`) | **4 documents (1.8%)** — DMS-98 (26 values), DMS-135 (17), DMS-158 (17), DMS-209 (18). R6-8's two-run estimate of the true rate was ~1.8%, and this run landed on it |

## 2 · Geometry — the historical ruler's verdict

```
boxes the ruler could judge : 5,384
flagged                     : 616
defect rate                 : 11.4%        (Final Full Round: 611 / 5,404 = 11.3%)
empty by ink (historical)   : 81 / 5,176 = 1.6%
empty by print (diagnostic) : 781 / 5,176 = 15.1%
documents with no measurable box: 13  = 9 gate-drops + 4 geometry-less
```

**The box defect rate did not move: 11.3% → 11.4%, and the noise floor for this metric is 0.1–1.3 pp.** That is
the expected result and it is written down rather than spun: everything shipped in this stretch — the party
binding, the ambiguity ruling, the format flag, the targeted retry, the geometry-less guard — changes **which
value** is delivered or **whether a fault becomes visible**. None of them changes where a box is drawn. Anyone
reading a 0.1 pp move here as a regression or an improvement is reading noise.

## 3 · Key fields — the number this round was actually aimed at

Per run, over the same 223 documents. `repA/repB/ffr` ran `extract@1.3.0` (before Option A); `final` is the config
above. `repA`/`repB` are two runs of identical code, so their spread **is** the noise floor.

| arm | tax id the rule rejects | buyer id in the issuer's field | no `supplier_tax_id` | no `invoice_num` |
|---|---|---|---|---|
| repA (1.3.0) | 21 · 9.4% | 0 · 0.0% | 9 · 4.0% | 8 · 3.6% |
| repB (1.3.0) | 20 · 9.0% | 1 · 0.4% | 15 · 6.7% | 9 · 4.0% |
| ffr (1.3.0) | 15 · 6.7% | 3 · 1.3% | 14 · 6.3% | 12 · 5.4% |
| **final (1.6.0 + retry)** | **8 · 3.6%** | **0 · 0.0%** | 9 · 4.0% | 9 · 4.0% |

**May be claimed:** a tax id the Thai rule cannot accept fell from 6.7–9.4% of documents to **3.6%** — a drop
1.9–2.6× larger than the old arms' own spread, driven by the prompt binding plus the targeted retry (fired on
23 documents, **accepted 15, refused 8**; reasons: checksum 13, not-13-digits 7, absent 3). Party confusion
(buyer's id delivered as `supplier_tax_id`) is **0/223**. Ambiguity: DMS-159 `INV-2026-0802`, DMS-236/237 `422`,
DMS-175 `2213666606` — the four ruled numbers, delivered in a real corpus run, not a probe.

**May not be claimed:** `supplier_tax_id` empties (4.0%) and missing `invoice_num` (4.0%) sit *inside* the old
arms' spread (4.0–6.7% and 3.6–5.4%) — same as the best old arm, so "not worse", nothing stronger.

## 4 · What the round cost

The retry is what the ~57 extra calls went to: 23 re-reads (10.3% of documents) instead of 4× pixels on all
~224 invoice pages. Fifteen of those pages now deliver a tax id that passes the rule; the eight refusals are
pages where 300 DPI did not fix the read, and they stay visible as `format_warnings` / a rejected value rather
than being quietly accepted.

## 5 · Still wrong, and not pretending otherwise

| item | state |
|---|---|
| **DMS-227 `invoice_num` = `4224`** | same supplier/form as DMS-236/237 (Mongkonchai), which deliver `422`. A stray digit, no rule catches it (a document number has no check digit). **Needs a ground-truth look at 300 DPI, then a decision.** |
| **DMS-175 `supplier_tax_id` = `0105544109337`** | unchanged from FFR. I have **no printed ground truth for this field** (R6-9 flagged it as unfixed but never established what the page prints), so it is recorded as unverified, not as correct. |
| **4 `NO_GEOMETRY` documents** | detection ships and the values are kept as evidence, but the *cause* is still unproven: the R6-3 raw-answer capture did not survive the failing run, so the `[x,y,w,h]`-read-as-`[x1,y1,x2,y2]` hypothesis remains a hypothesis. 4 documents × ~1.8%/run means a failing run is expected roughly every other corpus run. |
| **rotated pages** | 8 documents (32, 36, 49, 59, 62, 64, 118, 119, 224, 225) — the ruler has no frame for a page the engine turned, so those boxes are **outside the 11.4% figure**, not included in it (R6-5). |
| **orientation oracle** | PP-LCNet still fails a 180° control (R6-7), so no orientation vote is trusted. |
| **26 action-queue documents** | the visual audit of the FFR action queue (R6-4) has not been done. |
| **spelling of names** | `customer_name` / `supplier_name` still move between runs (e.g. อาปิโก ↔ อาบีโก ↔ อาวีกโก). Normalisation and fuzzy matching absorb it, but it is the largest remaining source of key-field disagreement and this round did not touch it. |
| **ambiguous-but-unruled documents** | the owner ruled 159/236/237. Any other page that prints two candidate numbers is still a model judgement until a ruling exists for it. |

## 6 · Limits of this scorecard

One run per document — `final` has no second sample, so every rate above carries the R6-8 caveat (15.9% of
key-field reads disagree between identical runs of the same code). Two paired runs of *this* config would say
which of the 3.6% tax-id survivors and the 4.0% empties are stable; that is the first thing I would run if the
owner wants the final numbers tightened rather than extended.
