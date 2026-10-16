"""Why did DMS-237 deliver nothing under the new arm - and what prompt did the old arms really run?"""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = pathlib.Path("bbox_testing/round_06")

for run in ("prompt160", "repA", "repB"):
    p = BASE / run / "DMS-237" / "extraction.json"
    j = json.loads(p.read_text(encoding="utf-8"))
    ex = j.get("extra") or {}
    fields = j.get("fields") or {}
    inv = fields.get("invoice_num") or {}
    sel = ex.get("selection")
    print(f"{run:10} prompts = {j.get('extractor', {}).get('prompts')}")
    print(f"{'':10}doc_type={j.get('doc_type')} invoice_pages={ex.get('invoice_pages')} selection={sel}")
    print(f"{'':10}page_errors={ex.get('page_errors')} pages_complete={j.get('pages_complete')}")
    print(f"{'':10}adjudication={ex.get('adjudication')}")
    print(f"{'':10}invoice_num={inv.get('raw')!r} null_reason={inv.get('null_reason')} "
          f"occurrences={len(ex.get('occurrences') or [])}")
    print(f"{'':10}lines={len(j.get('lines') or [])} field_raws=" +
          str({k: (fields.get(k) or {}).get("raw") for k in
               ("supplier_name", "supplier_tax_id", "customer_name", "grand_total")}))
    print()
