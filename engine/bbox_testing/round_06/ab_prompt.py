"""A/B the label-binding prompt on the documents where R6-9 proved the fault, plus controls.

The prompt change is the cheap half of the R6-9 diagnosis: the buyer's tax id delivered as supplier_tax_id,
and the delivery-note number delivered as invoice_num, are binding faults - the right number taken from the
wrong block.  Two rules were added to single-pass-extract@1.4.0 to forbid exactly that.

Nothing about this is believed until the same documents say otherwise:

  targets  the documents R6-9 diagnosed (party / wrong-label key-field faults)
  controls documents that had no such fault - if the new wording moves these, it is a regression, not a win
  watch    the genuinely ambiguous (two plausible numbers printed) and the stable-and-wrong (13-digit) cases,
           where a change is interesting but not the point of the test

Each arm runs every document twice, because the noise floor measured in R6-8 is 15.9% of field values: an arm
that "improves" by less than that, on a population that small, has proved nothing.

  python bbox_testing/round_06/ab_prompt.py
"""
import concurrent.futures
import hashlib
import json
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):                     # pragma: no cover
    pass

from dataclasses import replace                          # noqa: E402
from system_a.envfile import load_env                    # noqa: E402

load_env()
from system_a.container import Settings, build_perception, build_paperless   # noqa: E402
from system_a.perception.single_pass import PROMPTS                       # noqa: E402

TARGETS = [43, 45, 91, 126, 167, 175, 194, 212]     # R6-9: party confusion / wrong label
CONTROLS = [20, 30, 33, 106, 127, 147, 170, 171]    # no diagnosed key fault: any move is a regression
WATCH = [159, 177, 229, 236]                        # ambiguity + stable-and-wrong-format cases
RUNS = 2
OLD_PROMPT = (HERE / "prompt_extract_v130_baseline.md").read_text(encoding="utf-8")
GROUND_TRUTH = {43: {"supplier_tax_id": "0105562195321"},
                127: {"supplier_tax_id": "0105546047223"},
                147: {"supplier_tax_id": "0105562195321"},
                175: {"supplier_tax_id": "0145548001557", "invoice_num": "2213666606"},
                212: {"supplier_tax_id": "0115533001629"},
                177: {"supplier_tax_id": "0115546006764"}}
KEY = ("invoice_num", "supplier_tax_id", "invoice_date")


def digits(s):
    return "".join(c for c in str(s or "") if c.isdigit())


def run_doc(doc, old_prompt):
    """One document, one arm: build a fresh pipeline, optionally rewinding the extract prompt to 1.3.0."""
    s = replace(Settings(), mode="production", perception_engine="single_pass")
    reader = build_paperless(s)
    cached = ROOT / ".cache" / "downloads" / f"DMS-{doc}.pdf"
    pdf = cached.read_bytes() if cached.exists() else reader.download(doc)
    pipe = build_perception(s)
    if old_prompt:
        pipe.prompts["single_pass_extract"] = OLD_PROMPT
        # prompt_version and code_version were computed from the file at construction; rewinding the text
        # afterwards without recomputing them made the payload label the old-wording arm with the shipped
        # version - the arm was genuinely old-wording, but the audit trail lied about it
        pipe.prompt_version = "+".join(pipe._pid(n) for n in PROMPTS)
        out_prompt = pipe.prompt_version.split("+")[1]
    else:
        out_prompt = pipe.prompt_version.split("+")[1]
    ext = pipe.extract(pdf, package_id=f"PKG-{doc}", dms_doc_id=str(doc))
    def raw_of(name):
        f = ext.fields.get(name)
        return getattr(f, "raw", None) if f is not None else None
    out = {k: raw_of(k) for k in KEY}
    out["customer_tax_id"] = raw_of("customer_tax_id")
    out["pages"] = [int(p) for p in ext.extra.get("invoice_pages") or []]
    out["page_errors"] = ext.extra.get("page_errors") or {}
    out["prompt"] = out_prompt
    out["code_version"] = ext.extra.get("code_version") or pipe.code_version
    return doc, out


def arm(name, old_prompt, docs, workers=4):
    runs = []
    for r in range(RUNS):
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            runs.append(dict(pool.map(lambda d: run_doc(d, old_prompt), docs)))
        print(f"  {name} run {r + 1}/{RUNS} done")
    return runs


def signals(runs):
    """Per-arm rates: party confusion, wrong-length tax id, and within-arm self-disagreement."""
    party = wronglen = total = unstable = comparable = nulls = 0
    for per_run in runs:
        for doc, f in per_run.items():
            sd, cd = digits(f["supplier_tax_id"]), digits(f["customer_tax_id"])
            total += 1
            if sd and sd == cd:
                party += 1
            if sd and len(sd) != 13:
                wronglen += 1
            if not sd:
                nulls += 1
    first, second = runs[0], runs[1]
    for doc in first:
        for k in KEY:
            a, b = first[doc][k], second[doc][k]
            if a is None and b is None:
                continue
            comparable += 1
            if " ".join(str(a or "").split()).casefold() != " ".join(str(b or "").split()).casefold():
                unstable += 1
    return {"reads": total, "party": party, "wronglen": wronglen, "nulls": nulls,
            "unstable": unstable, "comparable": comparable}


def truth(runs, docs):
    """Verdicts only where R6-9 established what the page actually prints."""
    rows = []
    for doc in docs:
        for field, want in (GROUND_TRUTH.get(doc) or {}).items():
            got = [(" ".join(str(r[doc][field] or "").split())) for r in runs]
            hits = sum(1 for g in got if digits(g) == digits(want) and g)
            rows.append((doc, field, want, got, hits))
    return rows


def main() -> int:
    docs = TARGETS + CONTROLS + WATCH
    print(f"arms: the pre-change wording rewound from a saved copy, vs the wording shipped in the prompt file\n"
          f"{len(docs)} documents x {RUNS} runs per arm = {len(docs) * RUNS * 2} document reads\n")
    out = HERE / "ab_prompt.json"
    if "--report" in sys.argv and out.exists():
        # re-read a finished run instead of spending calls on it again
        raw = json.loads(out.read_text(encoding="utf-8"))
        # an older stored file may carry arm names this version no longer uses: first = old wording
        keys = list(raw)
        raw = dict(zip(("old-wording", "shipped"), (raw[k] for k in keys)))
        arms = {k: [{int(d): v for d, v in r.items()} for r in runs] for k, runs in raw.items()}
        print("reporting the stored run (no model calls)")
    else:
        arms = {}
        for name, old in (("old-wording", True), ("shipped", False)):
            print(f"running {name} ...")
            arms[name] = arm(name, old, docs)
        out.write_text(json.dumps({k: [{str(d): v for d, v in r.items()} for r in rs] for k, rs in arms.items()},
                                  ensure_ascii=False, indent=1), encoding="utf-8")
    # label by the arm's role: the payload's own version string is only trustworthy for the arm that used
    # the file as shipped, and printing two identical versions side by side is how this tool lied once
    print("\n=== the fault the wording targets (measured on every read in the arm) ===")
    for name, rs in (("old wording (saved copy, 1.3.0)", arms["old-wording"] if "old-wording" in arms
                      else list(arms.values())[0]),
                     ("shipped wording (this file)", list(arms.values())[-1])):
        s = signals(rs)
        print(f"{name}: reads={s['reads']}  supplier_tax_id == customer_tax_id in same payload: {s['party']} "
              f"({100 * s['party'] / s['reads']:.1f}%)  |  not-13-digit tax id: {s['wronglen']} "
              f"({100 * s['wronglen'] / s['reads']:.1f}%)  |  supplier_tax_id delivered empty: {s['nulls']} "
              f"({100 * s['nulls'] / s['reads']:.1f}%)")
        print(f"{'':>{len(name)}}  within-arm self-disagreement (the floor): {s['unstable']}/{s['comparable']} "
              f"({100 * s['unstable'] / max(s['comparable'], 1):.1f}%)")

    print("\n=== ground truth (only where R6-9 opened the page) ===")
    for name, rs in arms.items():
        for doc, field, want, got, hits in truth(rs, docs):
            print(f"  {name}  DMS-{doc:<4} {field:15} printed='{want}' runs gave {got} -> "
                  f"{'MATCH ' + str(hits) + '/' + str(RUNS) if hits else 'MISS both'}")

    print("\n=== controls: any movement is a cost, not a win ===")
    a, b = arms["old-wording"], arms["shipped"]
    moved = []
    for doc in CONTROLS:
        for k in KEY:
            va = " ".join(str(a[0][doc][k] or "").split()).casefold()
            vb = " ".join(str(b[0][doc][k] or "").split()).casefold()
            if va != vb:
                moved.append(f"DMS-{doc}.{k}: '{a[0][doc][k]}' -> '{b[0][doc][k]}'")
    print(f"  first-run control values changed by the new wording: {len(moved)}")
    for m in moved:
        print(f"    {m}")

    print("\n=== watch: the ambiguous and the stable-wrong ===")
    for doc in WATCH:
        for k in ("invoice_num", "supplier_tax_id"):
            print(f"  DMS-{doc:<4} {k:15} 130={str(a[0][doc][k])[:20]:20} 140={str(b[0][doc][k])[:20]:20}")
    print(f"\nfull per-read detail -> {out.name}")
    print("read the arms against the within-arm floor printed above, not against each other's single runs.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
