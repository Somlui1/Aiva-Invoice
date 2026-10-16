"""Final Full Round score: the whole 223-document corpus, measured, not eyeballed.

Reuses the round-05 machinery instead of restating it - the same payload converter, the same unmodified
round-3 ruler called as a subprocess, the same two empty-box rules - so the numbers written into the FFR
scorecard are produced by the code that produced R4-15's, and a reader can diff them.

Three things a round this size needs and a 30-document A/B did not:

  * **coverage** - a rate over 223 documents is only honest if every document is present.  A doc that errored
    out, produced no boxes, or cannot be measured at all is named, never averaged away.
  * **what the ruler cannot see** - ``align.py`` has no frame for a page the engine turned, and a document
    whose pages were never sent to the model (``max_pages``) is not a BBox defect.  Both get their own count
    instead of quietly inflating the defect rate.
  * **what the run actually cost** - the pipeline records every vision call in ``extra["calls"]``, so the
    estimate made in preflight (<= 1008 calls) can be checked against the round that spent it.

  python bbox_testing/round_06/ffr_score.py            # every document in the round
  python bbox_testing/round_06/ffr_score.py 127 171    # a subset
"""
import collections
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "bbox_testing" / "round_05"))

try:
    sys.stdout.reconfigure(errors="replace")           # cp874 console, Thai notes
except (AttributeError, ValueError):                   # pragma: no cover
    pass

import ab_measure as AM                                               # noqa: E402
import ink_check as IC                                                # noqa: E402
from system_a.envfile import load_env                                 # noqa: E402

load_env()

# Point the round-05 machinery at this round: one arm, one run, no comparison - this is a census, not an A/B.
# FFR_ARM lets the same unmodified ruler re-score a later round ("final" = the 1.6.0 + retry census) without
# touching the numbers already recorded for ffr; the default is exactly what scored the Final Full Round.
ARM = os.environ.get("FFR_ARM", "ffr").strip() or "ffr"
AM.HERE = HERE
AM.ARMS = (ARM,)
AM.RUNS = (1,)
MAX_PAGES = 12                                         # SinglePassPipeline default (see preflight.md)


def payloads():
    return {int(p.parent.name.split("-")[1]): json.loads(p.read_text(encoding="utf-8"))
            for p in HERE.glob(f"{ARM}/run1/DMS-*/extraction.json")}


def rendered_pages():
    got = collections.Counter()
    for p in (ROOT / "bbox_testing" / "source_images").glob("DMS-*_p*.png"):
        got[int(re.match(r"DMS-(\d+)_p", p.name).group(1))] += 1
    return got


def main() -> int:
    only = {int(v) for v in sys.argv[1:] if v.isdigit()}
    pay = payloads()
    docs = sorted(set(pay) & only if only else set(pay))
    if not docs:
        print(f"nothing to score: no payloads under {ARM}/run1")
        return 1

    page_totals = rendered_pages()
    dest, notes = AM.convert(ARM, 1, docs)
    # The ruler is called as a subprocess and is not edited - but its own prints quote the payload's Thai text,
    # and on this cp874 console that raises UnicodeEncodeError *inside* align.py, which used to kill the
    # measurement halfway through and leave 96 documents looking like they had no measurable boxes at all.
    # Setting the child's IO encoding is a console setting, not a change to the ruler or its verdicts.
    os.environ["PYTHONIOENCODING"] = "utf-8"
    align = AM.align_counts(dest, docs)

    rows, calls, page_err, no_page_seen, unmeasured = [], 0, [], [], []
    for d in docs:
        j = pay[d]
        ex = j.get("extra") or {}
        cs = len(ex.get("calls") or [])
        calls += cs
        errs = ex.get("page_errors") or {}
        if errs:
            page_err.append((d, errs))
        selected = ex.get("invoice_pages") or []
        total = page_totals.get(d, 0)
        if total > MAX_PAGES:
            no_page_seen.append((d, total, max(selected or [0])))
        boxes, flagged = align.get(d, (0, 0))
        if boxes == 0:
            unmeasured.append(d)
        rows.append((d, total, len(selected), cs, boxes, flagged, len(j.get("fields") or {}), len(j.get("lines") or [])))

    tb = sum(r[4] for r in rows)
    tf = sum(r[5] for r in rows)
    ti = sum(1 for r in rows if r[6] == 0)

    print(f"{ARM} census: {len(docs)} documents scored from {ARM}/run1")
    print(f"  vision calls spent this round: {calls}   (preflight estimated <= 1008)")
    print(f"  boxes the ruler could judge: {tb}   flagged: {tf}   defect rate {AM.rate(tf, tb):.1f}%")
    print(f"  documents with no measurable box at all: {len(unmeasured)} {unmeasured[:12]}")
    print(f"  documents that delivered no field: {ti}")
    print(f"  documents with page_errors: {len(page_err)}")
    for d, errs in page_err[:10]:
        print(f"     DMS-{d}: {errs}")
    print(f"  documents wider than max_pages={MAX_PAGES} (pages past the cap were never read): {no_page_seen}")
    for n in sorted(set(notes)):
        print(f"  note: {n}")

    # Both empty-box rules, on the delivered payload, over the documents the ruler can see.
    ie = it_ = pe = pt = 0
    misses = []
    for d in docs:
        items, rots = IC.boxes_engine(d, HERE / "ffr" / "run1")
        a = IC.empty_ratio(items, d, rots)
        b = IC.empty_of_print(items, d, rots)
        if not a or not b:
            continue
        ie += a[0]; it_ += a[1]; pe += b[0]; pt += b[1]
        if a[0]:
            misses.append((d, a[0], b[0]))
    print(f"  empty by ink (historical series): {ie}/{it_} = {AM.rate(ie, it_):.1f}%")
    print(f"  empty by print (R4-15 diagnostic): {pe}/{pt} = {AM.rate(pe, pt):.1f}%")
    misses.sort(key=lambda r: -r[2])
    print(f"  documents holding empty boxes ({len(misses)}), worst first: "
          + ", ".join(f"DMS-{d}:{i}ink/{p}print" for d, i, p in misses[:14]))

    rows.sort(key=lambda r: -(r[5] / max(1, r[4])))
    print("\n  worst documents by defect rate (>=8 measurable boxes), ruler verdict per box:")
    print(f"  {'doc':>7} | {'pages':>5} | {'sel':>3} | {'calls':>5} | {'boxes':>5} | {'flag':>4} | {'rate':>6} | fields | lines")
    for r in rows[:20]:
        if r[4] < 8:
            continue
        print(f"  DMS-{r[0]:>4} | {r[1]:>5} | {r[2]:>3} | {r[3]:>5} | {r[4]:>5} | {r[5]:>4} | "
              f"{AM.rate(r[5], r[4]):>5.1f}% | {r[6]:>6} | {r[7]:>5}")
    print(f"\n  payload set written for the ruler: {dest}")
    print("  rate is the number to compare; counts move with what the model chose to read (R4-7).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
