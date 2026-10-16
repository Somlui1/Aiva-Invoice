"""One command per document for the visual audit: digest + the box-quality sheet + which pictures to open.

  python bbox_testing/round_03/check.py DMS-106 [DMS-107 ...]

Prints the OCR digest (values, boxes, row count, findings), builds crops/<doc>_flags.jpg - every
mandatory field's box drawn over the clean page at 3-4x - and lists the files the reviewer must open
(plan §5: the overlay of every selected page is mandatory, the crops answer "does the box cover the
value", which a 1000 px overlay cannot show).
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.abspath(os.path.join(HERE, "..", ".."))
FIELDS = ["invoice_num", "invoice_date", "supplier_name", "customer_name", "supplier_tax_id",
          "customer_tax_id", "po_number", "sub_total", "vat", "grand_total"]


def main():
    docs = [a if a.startswith("DMS-") else f"DMS-{a}" for a in sys.argv[1:] if not a.startswith("--")]
    extra = [a for a in sys.argv[1:] if a.startswith("--fields=")]
    fields = extra[0].split("=", 1)[1] if extra else ",".join(FIELDS)
    for doc in docs:
        print(f"\n########## {doc}")
        subprocess.run([sys.executable, os.path.join(HERE, "summarize.py"), doc], cwd=ENGINE)
        prog = json.load(open(os.path.join(HERE, "progress.json"), encoding="utf-8"))
        info = prog["docs"].get(doc, {})
        n = len(json.load(open(os.path.join(HERE, "ocr", f"{doc}.json"), encoding="utf-8")).get("line_items") or [])
        want = fields + (",line_1" if n else "") + (",line_2" if n > 1 else "") + (",line_3" if n > 3 else "")
        subprocess.run([sys.executable, os.path.join(HERE, "montage.py"), doc, "--all", f"--fields={want}"], cwd=ENGINE)
        views = [f"view/{doc}_p{p}_sel.jpg" for p in info.get("selected_pages", [])]
        if info.get("first_unselected_page_to_view"):
            views.append(f"view/{doc}_p{info['first_unselected_page_to_view']}_unsel.jpg")
        print("OPEN:", " ".join(views), f" crops/{doc}_flags.jpg   rows_in_payload={n}")


if __name__ == "__main__":
    main()
