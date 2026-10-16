"""Key-field health per run, over the same three old arms and the final census.

The box defect rate (ffr_score.py, historical ruler) answers "is the rectangle on the right text".  It is
deliberately not the number this round was aimed at: Option A, the ambiguity ruling and the 300 DPI retry all
change *which value* is delivered, not where the box sits.  So the honest test of this round's work is here:

  taxReject   documents delivering a tax id the Thai rule cannot accept (per run, as a rate)
  party       payloads where supplier_tax_id equals customer_tax_id - the buyer's id in the issuer's field
  supEmpty    documents with no supplier_tax_id value at all
  invoiceNum  documents with no invoice_num at all

Everything is a count over one run's payloads, so the rates are comparable between arms.  The old arms are
pre-Option-A (extract@1.3.0); final is extract@1.6.0 + the targeted retry.

  python bbox_testing/round_06/keyfield_rate.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

from system_a.domain.normalize import Invalid, tax_id                    # noqa: E402

ARMS = [("repA", "repA/run1" if (HERE / "repA" / "run1").is_dir() else "repA"),
        ("repB", "repB/run1" if (HERE / "repB" / "run1").is_dir() else "repB"),
        ("ffr", "ffr/run1"), ("final (1.6.0 + retry)", "final/run1")]


def bad(value):
    if value in (None, ""):
        return False
    try:
        tax_id(str(value))
        return False
    except Exception:
        return True


def digits(v):
    return "".join(ch for ch in str(v) if ch.isdigit())


def main() -> int:
    print(f"{'arm':24} {'docs':>5} {'taxReject':>10} {'party':>7} {'supEmpty':>9} {'noInvoiceNum':>13}")
    for label, sub in ARMS:
        base = HERE / sub
        pay = {int(p.parent.name.split("-")[1]): json.loads(p.read_text(encoding="utf-8"))
               for p in base.glob("DMS-*/extraction.json")}
        if not pay:
            print(f"{label:24} {'-':>5}  (no payloads at {sub})")
            continue
        rej = par = emp = noinv = 0
        for j in pay.values():
            f = j.get("fields") or {}
            sup = (f.get("supplier_tax_id") or {}).get("raw")
            cus = (f.get("customer_tax_id") or {}).get("raw")
            rej += bad(sup) or bad(cus)
            par += bool(sup) and bool(cus) and digits(sup) == digits(cus)
            emp += not sup
            noinv += not (f.get("invoice_num") or {}).get("raw")
        n = len(pay)
        print(f"{label:24} {n:5} {rej:4} {100*rej/n:5.1f}% {par:3} {100*par/n:4.1f}% "
              f"{emp:3} {100*emp/n:4.1f}% {noinv:3} {100*noinv/n:4.1f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
