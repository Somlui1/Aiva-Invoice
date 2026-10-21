"""Would a second, harder look at the pages rescue the five combined forms without inventing invoices?

Ground truth for these twelve documents is not an opinion - it is text printed on the page, captured verbatim
by ``page_identity_probe.py``:

  seven of them print "ไม่ใช่ใบกำกับภาษี" ("this is not a tax invoice") under a title of
  "ใบส่งสินค้า" / "DELIVERY ORDER".  Classify called them delivery and the gate dropped them, which is
  correct: there is no tax invoice in the document to read.
  five of them print a title naming BOTH roles - "ต้นฉบับใบกำกับภาษี/ใบส่งของ", "ใบส่งของ/ใบกำกับภาษี",
  "ใบส่งสินค้า/ใบแจ้งหนี้" - and carry a VAT line and a net total.  Dropping those loses a real invoice.

The production prompt already says a combined title is a tax_invoice, so this is not a rule the model lacks -
it is a title the model did not read while answering about every page of a set from 80 DPI thumbnails.  The
surgical idea is therefore an escalation, not a guess: when the gate is about to throw a whole document away,
look again at each page alone, bigger and cleaner, and accept the document only if that second look names an
invoice.  It costs calls only on the ~5% of documents that would otherwise be discarded.

The test has to be a confusion matrix, not a rescue count.  A method that rescues the five by starting to call
genuine delivery notes invoices would be strictly worse than the bug it fixes - the forced-extract arm proved
that already, reading a fabricated invoice number and total off a page that announces it is not an invoice.

  python bbox_testing/round_06/escalate_probe.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):                     # pragma: no cover
    pass

import fitz                                             # noqa: E402
from dataclasses import replace                         # noqa: E402
from system_a.envfile import load_env                   # noqa: E402

load_env()
from system_a.container import Settings, build_perception, build_paperless   # noqa: E402
from system_a.perception.single_pass import normalize_classify              # noqa: E402

# Truth as printed on page 1, quoted verbatim by page_identity_probe.py on 19 Oct.
TRUTH = {56: ("invoice", "ต้นฉบับใบกำกับภาษี/ใบส่งของ"),
         226: ("invoice", "ต้นฉบับใบกำกับภาษี/ใบส่งของ"),
         223: ("invoice", "ต้นฉบับใบส่งของ + ใบกำกับภาษี"),
         195: ("invoice", "ใบส่งสินค้า/ใบแจ้งหนี้"),
         93: ("no-invoice", "ใบส่งสินค้า D/O"),
         123: ("no-invoice", "ใบส่งสินค้า"),
         124: ("no-invoice", "ใบส่งสินค้า"),
         180: ("no-invoice", "ต้นฉบับใบส่งของ"),
         205: ("no-invoice", "ใบส่งสินค้า"),
         206: ("no-invoice", "ใบส่งสินค้า"),
         207: ("no-invoice", "ใบส่งสินค้า")}
INVOICE_TYPES = ("tax_invoice", "invoice")


def classify_multi(pipe, doc_obj, dpi, quality):
    """Production's shape: every page in ONE call."""
    n = min(doc_obj.page_count, pipe.max_pages)
    urls = [pipe._data_url(pipe._render(doc_obj[i], dpi), quality=quality) for i in range(n)]
    text = pipe.prompts["single_pass_classify"] + \
        f"\n\nThere are {n} images: Image 1 = page 1 ... Image {n} = page {n}."
    raw = pipe._ask("classify", None, text, urls, 160 * n + 400)
    return [p["doc_type"] for p in normalize_classify(raw, n)]


def classify_each(pipe, doc_obj, dpi, quality):
    """The escalation's shape: one page per call, so the model's whole attention is on one title."""
    out = []
    for i in range(min(doc_obj.page_count, pipe.max_pages)):
        url = pipe._data_url(pipe._render(doc_obj[i], dpi), quality=quality)
        n = 1
        text = pipe.prompts["single_pass_classify"] + "\n\nThere are 1 images: Image 1 = page 1."
        raw = pipe._ask("classify", i + 1, text, [url], 160 * n + 400)
        out.append(normalize_classify(raw, 1)[0]["doc_type"])
    return out


def main() -> int:
    s = replace(Settings(), mode="production", perception_engine="single_pass")
    pipe = build_perception(s)
    reader = build_paperless(s)
    rows = []
    print(f"{'doc':>8} | {'truth (as printed)':<20} | baseline multi@80 | escalate each@150 | verdict")
    for doc, (truth, printed) in sorted(TRUTH.items(), key=lambda kv: (kv[1][0], kv[0])):
        cached = ROOT / ".cache" / "downloads" / f"DMS-{doc}.pdf"
        pdf = cached.read_bytes() if cached.exists() else reader.download(doc)
        with fitz.open(stream=pdf, filetype="pdf") as d:
            base = classify_multi(pipe, d, 80, 70)
            esc = classify_each(pipe, d, 150, 85)
        b_inv = any(t in INVOICE_TYPES for t in base)
        e_inv = any(t in INVOICE_TYPES for t in esc)
        want = truth == "invoice"
        if want and b_inv:
            verdict = "already read (no loss)"
        elif want and e_inv:
            verdict = "RESCUED by the second look"
        elif want:
            verdict = "still lost"
        elif not want and e_inv:
            verdict = "FALSE RESCUE - would invent an invoice"
        else:
            verdict = "still correctly dropped"
        rows.append((truth, b_inv, e_inv, want))
        print(f"DMS-{doc:>4} | {truth:<20} | {','.join(t[:4] for t in base):<15} | "
              f"{','.join(t[:4] for t in esc):<15} | {verdict}")
    n_want = sum(1 for t, b, e, w in rows if w)
    print(f"\nof {n_want} documents that really contain an invoice: "
          f"baseline read {sum(1 for t, b, e, w in rows if w and b)}, "
          f"escalation reads {sum(1 for t, b, e, w in rows if w and (b or e))}")
    print(f"of {len(rows) - n_want} documents that really contain NO invoice, escalation falsely rescues: "
          f"{sum(1 for t, b, e, w in rows if not w and e)}")
    print("\na rescue that also invents invoices is worse than the bug - that is the line to stay under.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
