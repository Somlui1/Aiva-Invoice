"""Manual probe: the Oracle <-> invoice comparison model, built from a payload System A made itself.

    python tests/probe_compare.py                 # print the screen model of five shapes
    python tests/probe_compare.py --json OUT      # also write view_<shape>.json for tests/probe_render.js

Runs the same harness the tests use (stub Standard + in-memory Oracle, no network), over five shapes:
a clean match, a receipt row nobody claims, a receipt row with qty 0, an invoice line Oracle has nothing
for, and an Oracle that has no receipt for the invoice at all.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import conftest  # noqa: E402
from webapp.view import build_view  # noqa: E402


OUT = Path(sys.argv[sys.argv.index("--json") + 1]) if "--json" in sys.argv else None
if OUT:
    OUT.mkdir(parents=True, exist_ok=True)


def show(title, p, name=None):
    v = build_view(p)
    if OUT and name:
        (OUT / f"view_{name}.json").write_text(json.dumps(v, ensure_ascii=False), encoding="utf-8")
    o = v["oracle_lines"]
    print(f"\n=== {title} ===")
    print("oracle_lines.counts :", o["counts"], " queried:", o["queried"], " source:", o["source"])
    for r in o["items"]:
        print(f"  ORACLE {r['id']:<18} {str(r['item'])[:22]:<24} qty={r['qty']:<6} {r['uom']:<4} "
              f"price={r['unit_price']:<9} amount={r['amount']:<9} -> lines={r['line_nos']} "
              f"status={r['status']} lvl={[g['level'] for g in r['groups']]} src={r['source']}")
    for l in v["lines"]["items"]:
        print(f"  INVOICE line {l['no']:<3} {str(l['desc'])[:22]:<24} qty={l['qty']:<6} {l['uom']:<4} "
              f"price={l['unit_price']:<9} amount={l['amount']:<9} "
              f"match={l['match'] and (l['match']['level'], l['match']['relation'])} "
              f"qty_check={l['qty_check'] and l['qty_check'].get('result')} "
              f"paired={[x['id'] for x in l['oracle']]}")
    print("  lines.extra      :", json.dumps(v["lines"]["extra"], ensure_ascii=False)[:200])
    print("  search.oracle    :", repr(v["search"]["oracle_text"][:90]))


def main():
    import tempfile

    import synth
    home = Path(tempfile.mkdtemp(prefix="probe-sysa-"))
    conftest.make_harness(home)
    buyer = conftest.standard_buyer()

    def run(**kw):
        lines = list(kw.pop("lines", None) or [synth.BRACKET, synth.GASKET])
        ds_kw = kw.pop("ds_kw", {})
        inv, po = kw.pop("inv", "SYN-INV-0001"), kw.pop("po", "50000001")
        ds = kw.pop("dataset", None)
        if ds is None:
            ds = synth.oracle_dataset(inv=inv, po=po, lines=kw.pop("ds_lines", lines), **ds_kw)
        kw.pop("ds_lines", None)
        return synth.payload(buyer=buyer, ext=synth.extraction(buyer=buyer, inv=inv, po=po, lines=lines, **kw),
                             dataset=ds)

    show("1 clean: 2 invoice lines, 2 receipt rows", run(), name="clean")

    # Oracle carries one row more than the invoice has lines
    ds = synth.oracle_dataset(lines=[synth.BRACKET, synth.GASKET])
    ds["receipts"][0]["rows"].append({"ORG_ID": 103, "RECEIPT_NUM": "RCV-0000010001", "RECEIVER": "SMITH J.",
                                      "LINE": 3, "ITEM": "LEFTOVER VALVE", "QTY": "4", "UOM": "PCS",
                                      "UNIT_PRICE": "77.00", "LINE_AMOUNT": "308.00", "PO_NUM": "50000001"})
    show("2 extra receipt row nobody claims", run(dataset=ds), name="extra_row")

    # a receipt row whose qty is 0: System A never matches against it
    ds = synth.oracle_dataset(lines=[synth.BRACKET, synth.GASKET])
    ds["receipts"][0]["rows"].append({"ORG_ID": 103, "RECEIPT_NUM": "RCV-0000010001", "RECEIVER": "SMITH J.",
                                      "LINE": 3, "ITEM": "CANCELLED LINE", "QTY": "0", "UOM": "PCS",
                                      "UNIT_PRICE": "50.00", "LINE_AMOUNT": "0.00", "PO_NUM": "50000001"})
    show("3 receipt row with qty 0", run(dataset=ds), name="qty_zero")

    # an invoice line Oracle has nothing for: the invoice has 3 lines, the receipt only 2
    show("4 invoice line with no receipt row", run(lines=[synth.BRACKET, synth.GASKET,
                                                          ("ORPHAN PART", 3, "PCS", "999.00", "2997.00")],
                                                   ds_lines=[synth.BRACKET, synth.GASKET]), name="orphan_line")

    show("5 Oracle has no receipt for the invoice",
         run(inv="SYN-INV-0009", po="50000009",
             dataset=synth.oracle_dataset(inv="SYN-INV-0009", po="50000009", with_receipt=False)), name="no_receipt")

    # 6 a row V-08 proposed and a rule refused. The sandbox has no LLM, so a real run cannot produce this shape;
    # the payload is cut to exactly what matching.py leaves behind when it pushes a proposal into ai_rejected.
    p = run()
    rid = p["oracle_snapshot"]["receipt_lines"][1]["rcv_line_id"]
    p["line_matching"]["groups"] = [g for g in p["line_matching"]["groups"] if rid not in g["rcv_line_ids"]]
    p["line_matching"]["ai_rejected"] = [{"proposal": {"rcv_line_ids": [rid], "invoice_line_nos": [2]},
                                         "reason": "qty ไม่ตรงตามที่ PO อนุมัติ"}]
    show("6 receipt row the AI proposed and a rule refused", p, name="rejected")


if __name__ == "__main__":
    main()
