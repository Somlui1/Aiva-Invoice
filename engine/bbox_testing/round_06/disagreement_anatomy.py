"""Are those 228 "different" values really different, or is my own print lying about it?

Half of this loop's false findings came from the measuring instrument, so before writing "the model disagrees
on 15% of values" into a scorecard, every disagreement gets a first-differing-position and a look at the
characters involved.  Three outcomes:

  EARLY     the difference is inside the first 25 characters          -> a person would notice
  TAIL      identical for 25+ characters, differs after               -> a person would not notice
  INVISIBLE same visible text, different code points (NBSP, NFKC)     -> only == cares

  python bbox_testing/round_06/disagreement_anatomy.py
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):                     # pragma: no cover
    pass

KEY = ("invoice_num", "invoice_date", "supplier_tax_id", "po_number")


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
    kinds, key_rows = {}, []
    for d in common:
        fa, fb = a[d].get("fields") or {}, b[d].get("fields") or {}
        for k, v in fa.items():
            if k not in fb:
                continue
            sa = " ".join(str((v or {}).get("raw")).split()) if (v or {}).get("raw") not in (None, "") else ""
            rb = (fb.get(k) or {}).get("raw")
            sb = " ".join(str(rb).split()) if rb not in (None, "") else ""
            if sa == sb or sa.casefold() == sb.casefold():
                continue
            if unicodedata.normalize("NFKC", sa).casefold() == unicodedata.normalize("NFKC", sb).casefold():
                kind = "INVISIBLE"
            elif sa.casefold().startswith(sb.casefold()) or sb.casefold().startswith(sa.casefold()):
                kind = "PREFIX (one is a truncation of the other)"
            else:
                i = next((j for j in range(min(len(sa), len(sb))) if sa[j].casefold() != sb[j].casefold()),
                         min(len(sa), len(sb)))
                kind = "EARLY" if i < 25 else "TAIL"
                if k in KEY:
                    key_rows.append((d, k, i, sa[max(0, i - 6):i + 12], sb[max(0, i - 6):i + 12]))
            kinds[kind] = kinds.get(kind, 0) + 1

    print("every disagreement between two identical runs, by what a person would see:")
    for kind, n in sorted(kinds.items(), key=lambda kv: -kv[1]):
        print(f"  {kind:46} {n:4}")
    print("\nthe ones matching keys on, with the first character where the two runs part company:")
    for d, k, i, ca, cb in sorted(key_rows, key=lambda r: (r[1], r[0]))[:24]:
        print(f"  {d:9} {k:16} char {i:3}  A='…{ca}…'  B='…{cb}…'")
    print("\nEARLY and INVISIBLE on a key field are the dangerous shape: the same page, two different answers,")
    print("and a rule that compares strings will call one of them a mismatch.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
