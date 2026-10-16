"""Counterfactual: what would these documents have delivered if the page-type gate had not dropped them?

The engine's own rule is deliberate and documented - "no invoice page at all -> nothing is read,
pages_complete = False, no guessing page 1" - and the FFR proved the state is not silent: all twelve
documents come back as REVIEW / E01.  What nobody had measured is the other side of that decision:
is the classification right, or is a whole document being thrown away because `classify` called a tax
invoice a delivery note?

So this tool changes exactly one thing and nothing else.  It calls the pipeline's classify for real,
keeps every field the model reported (copy status, page markers, document-number hints, rotation,
handwriting), and rewrites only the page type to ``tax_invoice`` - then lets the ordinary extract step
run on those pages.  The answer is the payload production would have delivered had the gate agreed:

  fields come back with a real invoice number and totals   -> the gate was wrong, and the loss is real
  fields come back empty / describing a delivery note      -> the gate was right, E01 is the honest outcome

Nothing in ``src/`` is edited: the override lives in a subclass here, which is the only honest way to ask a
production question of production code without changing it.

  python bbox_testing/round_06/force_invoice.py            # the twelve the round dropped
  python bbox_testing/round_06/force_invoice.py 227 56     # or a subset
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))

from system_a.envfile import load_env                                # noqa: E402

load_env()
from system_a.container import Settings, build_paperless, build_perception  # noqa: E402

DROPPED = [56, 93, 123, 124, 180, 195, 205, 206, 207, 223, 226, 227]
CANDIDATE_TYPES = ("invoice", "tax_invoice")


class ForceInvoicePages:
    """Wrap the pipeline so classify's answer is real except for one field: every page is an invoice page."""

    def __init__(self, pipe):
        self.pipe = pipe
        self.forced = []

    def __getattr__(self, name):
        return getattr(self.pipe, name)

    def extract(self, pdf, *, package_id, dms_doc_id):
        original = self.pipe._ask

        def ask(kind, page, text, images, max_tokens):
            out = original(kind, page, text, images, max_tokens)
            if kind == "classify":
                for e in (out or {}).get("pages") or []:
                    if isinstance(e, dict):
                        self.forced.append((e.get("p") or e.get("page_no"), e.get("t") or e.get("doc_type")))
                        e.pop("t", None)
                        e["doc_type"] = "tax_invoice"
            return out

        self.pipe._ask = ask
        try:
            return self.pipe.extract(pdf, package_id=package_id, dms_doc_id=dms_doc_id)
        finally:
            self.pipe._ask = original


def main() -> int:
    wanted = [int(v) for v in sys.argv[1:] if v.isdigit()] or DROPPED
    from dataclasses import replace
    s = replace(Settings(), mode="production", perception_engine="single_pass")   # exactly what the runner builds
    reader = build_paperless(s)
    out_root = HERE / "forced"
    print("classify's own answer (before the override) -> what the forced extract delivered")
    silent = []
    for doc in wanted:
        cached = ROOT / ".cache" / "downloads" / f"DMS-{doc}.pdf"
        pdf = cached.read_bytes() if cached.exists() else reader.download(doc)
        wrap = ForceInvoicePages(build_perception(s))
        ext = wrap.extract(pdf, package_id=f"PKG-{doc}", dms_doc_id=str(doc))
        folder = out_root / f"DMS-{doc}"
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "extraction.json").write_text(ext.model_dump_json(indent=2), encoding="utf-8")
        f = ext.fields
        got = {k: (f[k].raw if k in f else None) for k in
               ("invoice_num", "invoice_date", "supplier_name", "grand_total", "vat", "sub_total")}
        with_box = sum(1 for v in f.values() if v.region)
        look = "INVOICE-LIKE" if f.get("invoice_num") and f.get("grand_total") else (
            "partial" if len(f) >= 5 else "no invoice structure")
        print(f"DMS-{doc:>4}: said {str(wrap.forced)[:58]:<58} -> fields={len(f):>2} boxed={with_box:>2} "
              f"lines={len(ext.lines):>2} pages={ext.extra.get('invoice_pages')} [{look}] "
              f"inv={str(got['invoice_num'])[:14]!r} total={str(got['grand_total'])[:12]!r}")
        if not f:
            silent.append(doc)
    print(f"\ndocuments that still produced NOTHING even when forced: {silent}")
    print("rate is the number that decides whether the gate is worth changing - not how the labels felt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
