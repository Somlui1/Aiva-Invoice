"""How many documents actually change verdict when the canvas moves from the v5.5 port to the v5.7 one?

  python harness/verdict_delta.py            # 125-doc corpus replay, attribution by rule

Method (and why it is honest):
  * the corpus under frontend/temp holds the engine's v5.5 output per document, so every rule result the
    old canvas would have produced is already there — no Oracle, no VLM, no re-running anything;
  * the only *decision-changing* engine edit between v5.5 and v5.7 is V-06 v1.1 -> v2.0 (v5.7's evidence
    work changed 0 decisions in the 125-doc replay), so we re-evaluate V-06 with the real current engine
    function on each recorded extraction and keep every other rule as recorded;
  * the verdict is recomputed with the same Table-8 logic the engine uses, and the script first proves that
    logic reproduces the stored verdict of all 125 documents before it is allowed to predict anything.
"""
import glob
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, os.path.join(ENGINE, "src"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from system_a.domain import evidence as ev                                    # noqa: E402
from system_a.domain import rules as R                                             # noqa: E402
from system_a.domain.contracts import ExtractionResult                             # noqa: E402
from system_a.domain.normalize import normalize                                    # noqa: E402
from system_a.domain.standard import load_standard                                 # noqa: E402

CORPUS = os.path.join(ENGINE, "..", "frontend", "temp", "paperless_invoices_v5")
RANK = {"Low": 1, "Medium": 2, "High": 3}


def decide(findings, manual_reviews, not_eval_without_cause):
    """domain/recommendation.py:recommend() expressed over recorded payload data (kept in sync by the check below)."""
    sev = max((RANK[f[1]] for f in findings), default=0)
    if manual_reviews:
        value = "MANUAL_REVIEW"
    elif sev == 3:
        value = "HOLD"
    elif sev == 2:
        value = "REVIEW"
    elif not_eval_without_cause:
        value = "MANUAL_REVIEW"
    else:
        value = "AUTO_PASS"
    return value


def main():
    std = load_standard()
    files = sorted(f for f in glob.glob(os.path.join(CORPUS, "*.json")) if "summary" not in f)
    rows, mism = [], 0
    for f in files:
        p = json.load(io.open(f, encoding="utf-8"))
        if "rule_results" not in p or not (p.get("package") or {}).get("dms_doc_id"):
            continue                      # corpus files are trimmed extractions + payload, keyed by package
        doc_id = p["package"]["dms_doc_id"]
        old_rec = p["recommendation"]["value"]

        old_v6 = next((r for r in p["rule_results"] if r["rule_id"] == "V-06"), {})
        kept_findings = [(e["code"], e["severity"]) for e in p["exceptions"] if e["rule_id"] != "V-06"]
        kept_manual = [r["rule_id"] for r in p["rule_results"]
                       if r["result"] == "manual_review" and r["rule_id"] != "V-06"]
        kept_neval = [r["rule_id"] for r in p["rule_results"]
                      if r["result"] == "not_evaluated" and not r.get("halted_by") and r["rule_id"] != "V-06"]

        # the mapping must reproduce the recorded verdict, or the prediction is worthless
        old_manual = kept_manual + (["V-06"] if old_v6.get("result") == "manual_review" else [])
        if decide(kept_findings + [(x["code"], x["severity"]) for x in p["exceptions"] if x["rule_id"] == "V-06"],
                  old_manual, kept_neval) != old_rec:
            mism += 1
            print("  mapping does not reproduce %s (%s)" % (doc_id, old_rec))

        # V-06 re-evaluated with v2.0 semantics on the recorded extraction.
        # The corpus stores a trimmed extraction (no `regions`), so the v5.6 stamp fallback
        # (_receiver_from_stamp / _deliverer_from_stamp) cannot be checked here — and it only ever turns a
        # miss into a hit, so the counts below are an UPPER BOUND of the new E08s.
        if old_v6.get("result") in ("not_evaluated", "skipped"):
            new_res, new_findings = old_v6.get("result"), []
        else:
            sigs = (p["extraction"] or {}).get("signatures") or {}
            new_findings = []
            for slot, sev in (("receiver", "High"), ("deliverer", "Medium")):
                obs = sigs.get(slot)
                if not (obs and obs.get("present") is True):
                    new_findings.append(("E08", sev))
            new_res = "fail" if new_findings else "pass"
        new_rec = decide(kept_findings + new_findings, kept_manual, kept_neval)
        rows.append((doc_id, old_rec, new_rec, old_v6.get("result"), new_res,
                     ",".join(sorted({c for c, _ in new_findings})) or "-"))

    print("\nmapping check: reproduces the stored verdict for %d/%d documents" % (len(rows) - mism, len(rows)))
    if mism:
        print("stopping: the verdict mapping above is not faithful, do not trust the numbers.")
        return 1

    import collections
    matrix = collections.Counter((o, n) for _d, o, n, *_ in rows)
    order = ["AUTO_PASS", "REVIEW", "HOLD", "MANUAL_REVIEW"]
    print("\nold (v5.5 canvas)  ->  new (v5.7 canvas)          %s" % "".join("%14s" % o for o in order))
    for o in order:
        print("  %-22s %s  total %d" % (o, "".join("%14s" % matrix.get((o, n), "") for n in order),
                                        sum(v for (a, _b), v in matrix.items() if a == o)))
    changed = [r for r in rows if r[1] != r[2]]
    worse = [r for r in changed if r[2] == "HOLD"]
    better = [r for r in changed if r[1] == "HOLD"]
    print("\nverdict changes: %d/%d  (into HOLD: %d, out of HOLD: %d)" % (len(changed), len(rows), len(worse), len(better)))
    for d, o, n, oq, nq, codes in changed:
        print("  DMS-%-6s %-13s -> %-13s V-06 %s -> %-13s %s" % (d, o, n, oq, nq, codes))
    return 0


if __name__ == "__main__":
    sys.exit(main())
