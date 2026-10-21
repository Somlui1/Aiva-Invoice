"""Order 2 (owner): do the documents whose customer tax id fails the Thai check digit really end up in REVIEW?

The chain that has to hold, read out of the code first:

  normalize.tax_id() rejects a bad check digit  ->  NField(ok=False, reason=INVALID_FORMAT:...)
  V-05's own line                              ->  _skip("V-05", "V-01", ...) which sets halted_by="V-01"
  recommendation.recommend()                   ->  a not_evaluated outcome is only a manual review when it has
                                                   NO halted_by, so V-05's skip does NOT protect the document
  => the whole safety of the case sits on V-01, and V-01 only fires for fields listed in policy.required_fields.

That makes this measurable with zero vision calls: rehydrate the payloads already on disk, run the real
normalize(), the real v01_required() against the real v6.6 standard, and the real recommend().

  python bbox_testing/round_06/v05_coverage.py
"""
import json
import sys
from pathlib import Path
from types import SimpleNamespace

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):                     # pragma: no cover
    pass

from system_a.domain.contracts import ExtractionResult                    # noqa: E402
from system_a.domain.normalize import Invalid, normalize, tax_id          # noqa: E402
from system_a.domain.recommendation import recommend                     # noqa: E402
from system_a.domain.rules import Ctx, v01_required, v05_customer         # noqa: E402
from system_a.domain.standard import load_standard                       # noqa: E402

RUNS = ["repA", "repB", "ffr/run1"]
FIELDS = ("supplier_tax_id", "customer_tax_id")


def fails(value):
    """None when the value is usable, otherwise the reason it is not."""
    if value in (None, ""):
        return None
    try:
        tax_id(str(value))
        return None
    except Invalid as e:
        return str(e)
    except Exception as e:                                # pragma: no cover
        return type(e).__name__


def main() -> int:
    std = load_standard()
    print(f"required_fields = {std.policy['required_fields']}")
    print(f"E01 severity    = {std.severity('E01')}\n")

    suspects: dict[tuple[int, str], dict] = {}
    for run in RUNS:
        base = HERE / run
        if not base.is_dir():
            continue
        for p in sorted(base.iterdir()):
            if not (p.is_dir() and p.name.startswith("DMS-")):
                continue
            ext = ExtractionResult.model_validate_json((p / "extraction.json").read_text(encoding="utf-8"))
            did = int(p.name.split("-")[1])
            for f in FIELDS:
                rf = ext.fields.get(f)
                why = fails(getattr(rf, "raw", None))
                if why:
                    suspects.setdefault((did, run), {"doc": did, "run": run, "bad": {}})["bad"][f] = (
                        getattr(rf, "raw", None), why)

    docs = sorted({d for (d, _) in suspects})
    print(f"{len(suspects)} reads across {len(docs)} documents deliver a tax id the rule rejects\n")

    rows, auto_pass = [], []
    for did in docs:
        for (d, run), rec in sorted(suspects.items()):
            if d != did:
                continue
            p = HERE / run / f"DMS-{did}" / "extraction.json"
            ext = ExtractionResult.model_validate_json(p.read_text(encoding="utf-8"))
            doc, _meta = normalize(ext, std)
            ctx = Ctx(doc=doc, std=std)                   # snapshot=None: V-01 needs no Oracle data
            v01 = v01_required(ctx)
            rec_out = recommend([v01], [])
            nf = {f: doc.fields[f] for f in FIELDS}
            row = {"doc": did, "run": run, "delivered": rec["bad"],
                   "nfield": {f: {"value": nf[f].value, "ok": nf[f].ok, "reason": nf[f].null_reason}
                              for f in FIELDS},
                   "v01": v01.result, "codes": rec_out["exception_codes"],
                   "recommendation": rec_out["value"]}
            rows.append(row)
            if rec_out["value"] == "AUTO_PASS":
                auto_pass.append((did, run, rec["bad"]))
            flags = ", ".join(f"{f}={rec['bad'][f][0]!r}→{rec['bad'][f][1]}" for f in rec["bad"])
            print(f"DMS-{did:<4} {run:<9} {flags}")
            print(f"{'':16}normalize: " + " | ".join(
                f"{f.split('_')[0]}: value={nf[f].value!r} ok={nf[f].ok} reason={nf[f].null_reason}" for f in FIELDS))
            print(f"{'':16}V-01={v01.result} codes={rec_out['exception_codes']} -> "
                  f"**{rec_out['value']}** ({rec_out['max_severity']})\n")

    (HERE / "v05_coverage.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")
    by_reason: dict[str, int] = {}
    for row in rows:
        for f, (_v, why) in row["delivered"].items():
            by_reason[f"{f}:{why}"] = by_reason.get(f"{f}:{why}", 0) + 1
    by_rec: dict[str, int] = {}
    for row in rows:
        by_rec[row["recommendation"]] = by_rec.get(row["recommendation"], 0) + 1
    print("rejected because:", json.dumps(by_reason, ensure_ascii=False))
    print("recommendation on those reads:", json.dumps(by_rec, ensure_ascii=False))
    if auto_pass:
        print(f"\n*** {len(auto_pass)} reads would AUTO_PASS with a rejected tax id — buyer identity unchecked ***")
        for d, run, bad in auto_pass:
            print(f"  DMS-{d} {run} {bad}")
    else:
        print("\nno read carrying a rejected tax id reaches AUTO_PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
