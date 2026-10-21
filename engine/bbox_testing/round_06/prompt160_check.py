"""Did the ambiguity ruling land, and did anything else move?

New arm: the shipped pipeline (prompt 1.6.0 + the targeted 300 DPI retry), one run per document.
Old arm: repA / repB, two runs per document - and their prompt version is read out of the payloads instead of
assumed, which matters: they ran ``single-pass-extract@1.3.0``, i.e. the arm from BEFORE the Option A binding
rule, so anything that moved here may be 1.5.0's work rather than 1.6.0's.  The old arm also has a stability
range while the new arm has a single observation - stated, not hidden: a value that lands once here is evidence,
not proof, and must be read against the R6-8 noise floor (15.9% of key-field reads differ between identical
runs).

Ground truth for the three ambiguity documents is what the printed page shows, read off 300 DPI crops by eye
(label_zoom.py / label_crop.py), not from the model.

  python bbox_testing/round_06/prompt160_check.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

# doc -> (what the page prints as the tax-invoice number, what the owner ruled, why)
GROUND = {
    159: ("INV-2026-0802", "INVOICE NO. beats Doc No.", 'header prints "Doc No.: SLI2610000004", '
          'body prints "INVOICE NO.: INV-2026-0802"'),
    236: ("422", "เลขที่ beats เล่มที่", 'page prints "เล่มที่ 085" above "เลขที่ 422"'),
    237: ("422", "เลขที่ beats เล่มที่", 'same Mongkonchai form: "เล่มที่ 085" above "เลขที่ 422"'),
    175: ("2213666606", "tax invoice, not the delivery note", "delivery note number 1003801984 is a different label"),
}
REGRESSION = [43, 127, 147, 212, 20, 30, 33, 106]
FIELDS = ("invoice_num", "supplier_tax_id", "customer_tax_id", "supplier_name", "po_number")


def read(run_dir: Path, did: int):
    p = run_dir / f"DMS-{did}" / "extraction.json"
    if not p.exists():
        return None
    j = json.loads(p.read_text(encoding="utf-8"))
    f = j.get("fields") or {}
    got = {k: (f.get(k) or {}).get("raw") for k in FIELDS}
    return {"values": got, "prompts": (j.get("extractor") or {}).get("prompts"),
            "retry": (j.get("extra") or {}).get("taxid_retry"),
            "pages": [(q["page_no"], q.get("render_dpi")) for q in j.get("pages", [])
                      if q["page_no"] in (j.get("extra") or {}).get("invoice_pages", [])]}


def main() -> int:
    new_dir, old_dirs = HERE / "prompt160", [HERE / "repA", HERE / "repB"]
    rows = []
    for did in sorted(GROUND) + REGRESSION:
        new = read(new_dir, did)
        if not new:
            print(f"DMS-{did}: MISSING in the new arm")
            continue
        olds = [r for r in (read(d, did) for d in old_dirs) if r]
        truth, ruling, why = GROUND.get(did, (None, "unchanged - regression control", ""))
        nv, ov = new["values"]["invoice_num"], [o["values"]["invoice_num"] for o in olds]
        old_ver = {(o["prompts"] or "").split("extract@")[-1].split("+")[0] for o in olds}
        ok = (truth is None) or ((nv or "").strip() == truth)
        # the version of the old arm is read out of the payloads, never assumed: repA/repB turn out to be
        # extract@1.3.0, i.e. the arm from BEFORE Option A, so a value that moved here can be 1.5.0's doing
        print(f"DMS-{did:<4} invoice_num: old(1.3.0 arm={sorted(old_ver)})={ov}  ->  new(1.6.0)={nv!r}   "
              f"{'MATCHES THE PAGE' if ok else 'STILL NOT ' + str(truth)}")
        if truth:
            print(f"{'':10}ruling: {ruling} | page: {why}")
        for fld in ("supplier_tax_id", "customer_tax_id"):
            n, o = new["values"][fld], [x["values"][fld] for x in olds]
            if n not in o:
                print(f"{'':10}{fld} moved: {o} -> {n!r} (retry={new['retry']})")
        assert "1.6.0" in (new["prompts"] or ""), f"DMS-{did} did not run the new prompt: {new['prompts']}"
        rows.append({"doc": did, "new_invoice_num": nv, "wanted": truth, "ok": ok,
                     "old_invoice_num": ov, "new_tax": {k: new["values"][k] for k in
                                                        ("supplier_tax_id", "customer_tax_id")},
                     "retry": new["retry"], "prompts": new["prompts"]})
    (HERE / "prompt160_check.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")
    hit = [r for r in rows if r["wanted"]]
    print(f"\nambiguity targets: {sum(1 for r in hit if r['ok'])}/{len(hit)} now deliver the ruled number")
    moved = [(r["doc"], r["old_invoice_num"], r["new_invoice_num"]) for r in rows
             if r["new_invoice_num"] not in r["old_invoice_num"]]
    print(f"invoice_num moved vs the old arm on {len(moved)} docs: {moved}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
