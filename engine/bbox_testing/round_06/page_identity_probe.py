"""What actually is this page? - a verbatim-quote probe, used to adjudicate a document type by evidence.

Classify called page 1 of these documents a *delivery note*; the extract step, shown the same page, read a
complete tax invoice.  Both cannot be right - unless the page is a combined Thai form that serves as both,
which is common on supplier paper ("ใบกำกับภาษี / ใบส่งของ" printed together).

Deliberately written as a file, not a heredoc: Thai text inside a shell heredoc on this box's cp874 console
gets mangled into a Python syntax error, and a mangled prompt would silently change the question being asked.

The question asks for VERBATIM lines and then four independent yes/no judgements, because a label ("delivery")
is not evidence - a quoted line saying ภาษีมูลค่าเพิ่ม is.  A page is allowed to answer true for both roles.

  python bbox_testing/round_06/page_identity_probe.py 56 93 123 226
"""
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

Q = (
    "This is page 1 of a scanned Thai supplier document. Answer in JSON only, nothing else.\n"
    "{\n"
    '  "quotes": [ "up to 6 short lines of PRINTED text, copied VERBATIM exactly as printed. Include every '
    'document title or document-kind word you can read anywhere on the page - including small print, footers '
    'and stamps - for example words like ใบกำกับภาษี, ภาษีมูลค่าเพิ่ม, ใบส่งของ, ใบวางบิล, ใบเสร็จ, '
    ' TAX INVOICE, DELIVERY NOTE " ],\n'
    '  "serves_as_tax_invoice": true or false,\n'
    '  "serves_as_delivery_note": true or false,\n'
    '  "vat_amount_shown": true or false,\n'
    '  "total_amount_shown": true or false,\n'
    '  "kind_word_seen": "the single printed word or phrase that names this document, copied verbatim"\n'
    "}\n"
    "Rules: base every answer only on text you can actually read on this page. Never guess from layout alone. "
    "A page may be two documents at once - if so, say true for both and quote the title of each."
)


def main() -> int:
    ids = [int(v) for v in sys.argv[1:] if v.isdigit()] or [56, 93, 123, 226]
    s = replace(Settings(), mode="production", perception_engine="single_pass")
    pipe = build_perception(s)
    reader = build_paperless(s)
    for doc in ids:
        cached = ROOT / ".cache" / "downloads" / f"DMS-{doc}.pdf"
        pdf = cached.read_bytes() if cached.exists() else reader.download(doc)
        with fitz.open(stream=pdf, filetype="pdf") as d:
            url = pipe._data_url(pipe._render(d[0], 150), quality=80)
        a = pipe.client.chat_json(pipe.model, "", Q, images=[url], layout="v3", temperature=0.0,
                                  max_tokens=800, json_mode=pipe.json_mode)
        print(f"DMS-{doc}: tax_invoice={a.get('serves_as_tax_invoice')} delivery={a.get('serves_as_delivery_note')} "
              f"vat={a.get('vat_amount_shown')} total={a.get('total_amount_shown')} "
              f"kind_word={str(a.get('kind_word_seen'))[:34]!r}")
        for q in (a.get("quotes") or [])[:6]:
            print(f"        quoted | {str(q)[:82]}")
    print("\nclassify's own label for these pages was 'delivery' (or 'other') on every one of them.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
