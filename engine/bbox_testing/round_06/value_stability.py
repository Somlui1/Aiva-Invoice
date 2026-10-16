"""Two identical runs disagree on 15.9% of field values - how much of that is danger and how much is spelling?

`repeatability.py` measured the disagreement.  This tool classifies it, because the categories have very
different consequences for matching:

  PRESENCE   a value in one run and nothing in the other       -> a rule can pass in one run and not the next
  DIFFERENT  genuinely different content                        -> matching is deciding on noise
  NUMERIC    20 vs 20.00 vs 2,000.00                            -> harmless if the matcher normalises
  SPELLING   Thai spelling/vowel/tone variants of one word      -> harmless for a person, not for ==

The samples printed at the end are the ones worth reading with your own eyes: they show what the model does to
the same page twice.

  python bbox_testing/round_06/value_stability.py
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):                     # pragma: no cover
    pass

KEY = ("invoice_num", "invoice_date", "supplier_tax_id", "po_number", "subtotal", "total")
THAI_FOLD = re.compile(r"[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e48\u0e49]")


def fold(s):
    return THAI_FOLD.sub("", str(s)).replace("์", "่").casefold()


def numeric(s):
    t = re.sub(r"[,\s]", "", str(s))
    try:
        return float(t)
    except ValueError:
        return None


def classify(a, b):
    if a in (None, "") and b not in (None, ""):
        return "PRESENCE"
    if b in (None, "") and a not in (None, ""):
        return "PRESENCE"
    na, nb = numeric(a), numeric(b)
    if na is not None and nb is not None and abs(na - nb) < 1e-9:
        return "NUMERIC"
    if fold(a) == fold(b):
        return "SPELLING"
    return "DIFFERENT"


def load(base):
    out = {}
    for d in sorted((p for p in base.iterdir() if p.is_dir()),
                    key=lambda p: int(p.name.split("-")[1]) if p.name.startswith("DMS-") else 10 ** 9):
        f = d / "extraction.json"
        if f.exists():
            out[d.name] = json.loads(f.read_text(encoding="utf-8"))
    return out


def main() -> int:
    a, b = load(HERE / "repA"), load(HERE / "repB")
    common = sorted(set(a) & set(b), key=lambda k: int(k.split("-")[1]))
    groups, key_diffs, samples = {}, {}, []
    for d in common:
        fa, fb = a[d].get("fields") or {}, b[d].get("fields") or {}
        for k, v in fa.items():
            if k not in fb:
                continue
            va, vb = (v or {}).get("raw"), (fb.get(k) or {}).get("raw")
            sa, sb = " ".join(str(va).split()) if va not in (None, "") else "", \
                     " ".join(str(vb).split()) if vb not in (None, "") else ""
            if sa.casefold() == sb.casefold():
                continue
            g = classify(va, vb)
            groups[g] = groups.get(g, 0) + 1
            if k in KEY and g in ("PRESENCE", "DIFFERENT"):
                key_diffs.setdefault(k, []).append((d, sa[:28], sb[:28]))
            if g in ("PRESENCE", "DIFFERENT") and len(samples) < 14:
                samples.append((d, k, g, sa[:40], sb[:40]))

    total = sum(groups.values())
    print(f"value disagreements between two identical runs: {total}")
    for g in ("PRESENCE", "DIFFERENT", "NUMERIC", "SPELLING"):
        n = groups.get(g, 0)
        print(f"  {g:10} {n:5}  ({100 * n / max(total, 1):4.1f}% of the disagreements)")
    print(f"\nfields that matching actually keys on, where the two runs disagree in substance:")
    for k in KEY:
        hits = key_diffs.get(k, [])
        print(f"  {k:16} {len(hits):3} documents"
              + (f"   e.g. {hits[0][0]}: '{hits[0][1]}' vs '{hits[0][2]}'" if hits else ""))
    print("\nwhat the model does to the same page twice:")
    for d, k, g, sa, sb in samples:
        print(f"  {d:9} {k:16} {g:10} A='{sa}' B='{sb}'")
    print("\nPRESENCE and DIFFERENT are the ones that move decisions; NUMERIC and SPELLING only move strings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
