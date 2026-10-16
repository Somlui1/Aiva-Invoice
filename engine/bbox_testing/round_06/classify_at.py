"""Is the page-type gate wrong because the model is wrong, or because the picture it is given is too small?

Twelve documents were dropped in the Final Full Round because classify answered "delivery / po" for every
page - yet forcing the ordinary extract step onto those same pages returned complete, boxed tax invoices
(invoice numbers like ITAM26A00021, totals, VAT).  So the model can read these documents.  The open question
is what it was actually shown: production classify sees a **page sized to 80 DPI, re-encoded as JPEG q=70**,
because the step is only supposed to choose pages, not read them.

This tool asks the production classify question at several resolutions and nothing else - one call per DPI per
document, no extraction - and reports the page types and whether the selection gate would read the document.

  python bbox_testing/round_06/classify_at.py                    # the twelve, 80/110/150 DPI
  python bbox_testing/round_06/classify_at.py 106 127 159 171    # a control set: pages classify already got right

Read the control set before believing a win: a DPI that rescues the twelve but starts calling real invoices
"other" has not fixed anything, it has moved the error.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))

from system_a.envfile import load_env                                # noqa: E402

load_env()
from dataclasses import replace                                      # noqa: E402
import fitz                                                          # noqa: E402
from system_a.container import Settings, build_perception, build_paperless  # noqa: E402
from system_a.perception.single_pass import normalize_classify, select_invoice_pages  # noqa: E402

DROPPED = [56, 93, 123, 124, 180, 195, 205, 206, 207, 223, 226, 227]
INVOICE_TYPES = ("tax_invoice", "invoice")


def classify_pages(pipe, pdf: bytes, dpi: int) -> tuple[list[dict], dict]:
    """The production classify step, isolated: same prompt, same client call, only the DPI is ours."""
    import io
    urls = []
    with fitz.open(stream=pdf, filetype="pdf") as doc:
        n = min(doc.page_count, pipe.max_pages)
        for i in range(n):
            urls.append(pipe._data_url(pipe._render(doc[i], dpi), quality=70))
    text = pipe.prompts["single_pass_classify"] + \
        f"\n\nThere are {n} images: Image 1 = page 1 ... Image {n} = page {n}."
    raw = pipe._ask("classify", None, text, urls, 160 * n + 400)
    pages = normalize_classify(raw, n)
    return pages, select_invoice_pages(pages)


def main() -> int:
    ids = [int(v) for v in sys.argv[1:] if v.isdigit()] or DROPPED
    dpis = [int(v) for v in sys.argv[1:] if v.isdigit() and int(v) > 300] or [80, 110, 150]
    s = replace(Settings(), mode="production", perception_engine="single_pass")
    reader = build_paperless(s)
    pipe = build_perception(s)
    print(f"{'doc':>8} | " + " | ".join(f"{d} DPI -> would the gate read it?" for d in dpis))
    tally = {d: [0, 0] for d in dpis}
    for doc in ids:
        cached = ROOT / ".cache" / "downloads" / f"DMS-{doc}.pdf"
        pdf = cached.read_bytes() if cached.exists() else reader.download(doc)
        cells = []
        for dpi in dpis:
            pages, sel = classify_pages(pipe, pdf, dpi)
            types = ",".join(f"{p['page_no']}:{p['doc_type'][:4]}" for p in pages)
            read = bool(sel.get("invoice_pages_seen") or sel.get("selected"))
            tally[dpi][0] += int(read); tally[dpi][1] += 1
            cells.append(f"{types} -> {'READ' if read else 'DROP'}")
        print(f"DMS-{doc:>4} | " + " | ".join(cells))
    print()
    for dpi in dpis:
        ok, tot = tally[dpi]
        print(f"  {dpi} DPI: the gate would read {ok}/{tot} of these documents")
    print("\nA DPI that rescues these but breaks the control set has moved the error, not fixed it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
