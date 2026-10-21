"""Compact per-document digest for the visual audit.

Reading a whole round payload costs ~3k tokens of coordinates nobody looks at twice. This prints the
things the reviewer actually compares the picture against: field values, which page each box sits on,
row-box aspect ratios (plan section 5: row box must cover the row, not the empty table body) and the
automated findings.
"""
import json
import os
import sys
from PIL import Image

ROUND = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROUND, "..", "source_images")
KEYS = ["invoice_num", "invoice_date", "supplier_name", "supplier_tax_id", "customer_name",
        "customer_tax_id", "po_number", "sub_total", "vat", "grand_total", "currency"]


def page_size(doc_id, page):
    p = os.path.join(SRC, f"{doc_id}_p{page}.png")
    return Image.open(p).size if os.path.exists(p) else (1650, 2338)


def digest(doc_id):
    d = json.load(open(os.path.join(ROUND, "ocr", f"{doc_id}.json"), encoding="utf-8"))
    prog = json.load(open(os.path.join(ROUND, "progress.json"), encoding="utf-8"))
    info = prog["docs"].get(doc_id, {})
    sel = d.get("selected_invoice_pages")
    cls = [(c.get("page_no"), c.get("doc_type"), c.get("copy_status"))
           for c in (d.get("meta", {}).get("pages_classification") or [])]
    print(f"== {doc_id} pages={d.get('meta',{}).get('total_pages')} selected={sel} "
          f"original={d.get('is_original')} multi={d.get('multi_invoice_detected')}")
    print(f"   classify: {cls}")
    for k in KEYS:
        f = (d.get("fields") or {}).get(k) or {}
        b = f.get("bbox")
        bs = f"[{b[0]:.3f},{b[1]:.3f},{b[2]:.3f},{b[3]:.3f}]" if b and len(b) == 4 else "NO-BOX"
        print(f"   {k:<16}={str(f.get('raw'))[:30]!r:<33} p{f.get('page_no')} {bs}")
    dims = {int(p): page_size(doc_id, p) for p in (sel or [1])}
    rows = d.get("line_items") or []
    ars = []
    for it in rows:
        rb = it.get("line_bbox")
        if not rb:
            continue
        w, h = dims.get(int(it.get("page_no") or 1), (1650, 2338))
        px_w, px_h = rb[2] * w, rb[3] * h
        if px_h > 0:
            ars.append(round(px_w / px_h, 1))
    print(f"   line_items={len(rows)} row_AR={ars[:12]}")
    regs = [(r.get("label"), r.get("page_no")) for r in (d.get("regions") or [])]
    print(f"   regions={regs}")
    print(f"   findings={info.get('findings')} hints={info.get('recheck_hints')}")


if __name__ == "__main__":
    for a in sys.argv[1:]:
        digest(a if a.startswith("DMS-") else f"DMS-{a}")
