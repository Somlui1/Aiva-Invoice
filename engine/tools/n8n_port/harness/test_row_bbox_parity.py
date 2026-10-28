"""Unit parity for the row-box rules the flow used to be missing.

  python harness/test_row_bbox_parity.py

Engine behaviour being reproduced (perception/single_pass.py, read before writing the port):
  * validate_line_bbox      — a row box must be a plausible horizontal row
  * compute_row_bbox_from_cells — when it is not, the row's box is the UNION of its own cells
                                  (median outlier filter, then the items-table width is spliced in)
  * count_answer_values     — a page that delivered values but no single usable box is reported
                              (page error NO_GEOMETRY) and pages_complete must go false

of the flow before v5.8: an unusable line_bbox simply lost the row's region, so Portal got a finding with
no frame, and a coordinate-less read looked like a complete page.

The port is driven through buildExtraction (the same function node 21 calls), so this checks what the flow
actually produces, not a copy of the maths.
"""
import io
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, os.path.join(ENGINE, "src"))
sys.path.insert(0, os.path.join(ENGINE, "src", "system_a", "perception"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from system_a.perception.single_pass import (compute_row_bbox_from_cells, validate_line_bbox,  # noqa: E402
                                             count_answer_values)
from system_a.perception.coords import sanitize_xyxy  # noqa: E402

CFG = {"dpi_extract": 150, "dpi_classify": 80, "model": "m"}
N05 = {"pages_classification": [{"page_no": 1, "doc_type": "tax_invoice", "copy_status": "original",
                                 "doc_no_hint": "INV-1", "rotate_degrees": 0, "page_marker": "1/1"}],
       "selected_invoice_pages": [1], "selection": {"selected": [1], "pages_complete": True},
       "invoice_page": 1, "pages_complete": True}
N08 = {"img_w": 1240, "img_h": 1754}


def cell(raw, box):
    return {"raw": raw, "bbox_2d": box}


def row(no, cells, line_bbox="omit"):
    out = {"line_no": no, "page_no": 1}
    out.update({k: cell(*v) if v is not None else {"raw": None, "bbox_2d": None} for k, v in cells.items()})
    if line_bbox != "omit":
        out["line_bbox"] = line_bbox
    return out


ROWS = [
    # 1: a normal printed row box -> keep it (no behaviour change on the proven path)
    ("valid line_bbox kept", row(1, {"qty": ("3", [430, 300, 470, 320]), "amount": ("1,200.00", [820, 300, 960, 322])},
                                 [40, 296, 960, 330])),
    # 2: model gave no row box at all -> the union of its cells
    ("no line_bbox -> cells union", row(2, {"item_code": ("A1", [40, 400, 120, 424]), "qty": ("3", [430, 400, 470, 424]),
                                            "amount": ("1,200.00", [820, 398, 960, 426])})),
    # 3: row box is nonsense (too tall) -> fall back to the cells
    ("absurd line_bbox -> cells union", row(3, {"qty": ("2", [430, 500, 470, 520]), "amount": ("99.00", [820, 500, 960, 522])},
                                            [10, 40, 990, 900])),
    # 4: one cell far away must not stretch the row (median outlier filter)
    ("outlier cell excluded", row(4, {"item_code": ("B2", [40, 600, 130, 624]), "qty": ("1", [430, 602, 460, 626]),
                                      "amount": ("5.00", [900, 600, 960, 624]), "description": ("ของดี", [150, 600, 400, 624])},
                                  [40, 600, 960, 626])),
    # 5: one narrow cell only -> not a plausible row -> no region (must NOT invent one)
    ("single narrow cell -> no region", row(5, {"qty": ("7", [430, 700, 470, 724])})),
]
TABLE = {"kind": "table", "label": "items_table", "bbox_2d": [30, 0, 990, 900], "present": None}


def build(n10_lines, regions, answer_line_items, fields=None):
    # node 10 always reports line_bbox_valid (the same aspect/width/height test the engine runs); the port
    # reads that flag, so the synthetic row has to carry it exactly like a real node-10 output does.
    for r in n10_lines:
        if "line_bbox" in r:
            r["line_bbox_valid"] = bool(validate_line_bbox(r["line_bbox"]))
    fields = fields if fields is not None else {"invoice_num": {"raw": "INV-1", "bbox_2d": [400, 40, 620, 70]}}
    # The seam consumes one `read` per page, exactly as node 12 hands it to node 21: the decoded ANSWER is the
    # model's JSON (fields + line_items + regions + occurrences + handwriting), the geometry around it comes
    # from nodes 08/10. The old fixture passed the answer split across two levels; the seam wants the real shape.
    answer = {"fields": fields, "occurrences": {}, "line_items": answer_line_items, "regions": regions,
              "handwritten_refs": []}
    read = {"page_no": 1, "answer": answer,
            "img_w": 1240, "img_h": 1754, "orig_w": 1240, "orig_h": 1754, "rot_w": 1240, "rot_h": 1754,
            "rotate_degrees": 0, "render_dpi": 150, "coord": "norm1000",
            "answer_salvaged": False, "answer_parse_error": None, "dropped_boxes": []}
    runner = ("const P = require(process.argv[2]);\n"
              "const arg = JSON.parse(require('fs').readFileSync(process.argv[3], 'utf8'));\n"
              "process.stdout.write(JSON.stringify(P.buildExtraction(arg)));\n")
    with io.open(os.path.join(HERE, "_tmp_build.cjs"), "w", encoding="utf-8") as fh:
        fh.write(runner)
    with io.open(os.path.join(HERE, "_tmp_build_in.json"), "w", encoding="utf-8") as fh:
        json.dump({"n05": N05, "reads": [read], "cfg": CFG, "docId": "1",
                   "fileSha256": "sha256:x", "packageId": "PKG-1"}, fh)
    try:
        r = subprocess.run(["node", os.path.join(HERE, "_tmp_build.cjs"),
                            os.path.join(ROOT, "dist", "bundle.cjs"),
                            os.path.join(HERE, "_tmp_build_in.json")], capture_output=True, text=True, encoding="utf-8")
        if r.returncode:
            raise SystemExit("buildExtraction failed: " + (r.stderr or "")[-1200:])
        return json.loads(r.stdout)
    finally:
        for f in ("_tmp_build.cjs", "_tmp_build_in.json"):
            os.unlink(os.path.join(HERE, f))


def close(a, b, tol=1e-6):
    if a is None or b is None:
        return a is None and b is None
    return len(a) == len(b) and all(abs(x - y) <= tol for x, y in zip(a, b))


def main():
    bad = 0
    lines = [r for _, r in ROWS]
    # engine reference: exactly what single_pass.py does for these rows
    want = []
    for r in lines:
        raw_bbox = r.get("line_bbox")
        if raw_bbox is not None and validate_line_bbox(raw_bbox):
            want.append(("line_bbox", [v / 1 for v in [0, 0, 0, 0]], sanitize_xyxy(raw_bbox)))
        else:
            cand = compute_row_bbox_from_cells({k: v for k, v in r.items() if k in
                                                ("item_code", "description", "qty", "uom", "unit_price", "amount")},
                                               table_bbox=TABLE["bbox_2d"])
            ok = validate_line_bbox(cand)
            want.append(("cells_union" if ok else "none", None, cand if ok else None))
    got = build(lines, [TABLE], lines)
    glines = got.get("lines") or []
    print("rows compared: %d" % len(ROWS))
    for i, ((name, _), (how, _, expected)) in enumerate(zip(ROWS, want)):
        reg = (glines[i].get("region") or {}) if i < len(glines) else {}
        box = reg.get("bbox")                                   # [x, y, w, h] normalised
        gotBox = None if box is None else [box[0], box[1], box[0] + box[2], box[1] + box[3]]
        expBox = None if expected is None else [expected[0], expected[1], expected[2], expected[3]]
        same = close(gotBox, expBox, tol=2e-4)
        print("  %-34s engine=%-11s port=%s  %s"
              % (name, how if expected else "no region",
                 "region " + json.dumps([round(v, 4) for v in gotBox]) if gotBox else "no region",
                 "OK" if same else "DIFF"))
        if not same:
            bad += 1
            print("      engine xyxy=%s  port xyxy=%s" % (expBox, gotBox))
        if same and not expected:
            print("      (both refuse to invent a box — required for the narrow-row case)")

    # a page whose values all arrive without boxes must not look complete
    # EVERY value on the page arrives without a box (that is what NO_GEOMETRY means)
    nobox = [{"line_no": 1, "page_no": 1, "qty": cell("3", None), "amount": cell("1,200.00", None)}]
    nofields = {"invoice_num": {"raw": "INV-1", "bbox_2d": None}}
    ex = build(nobox, [], [{"line_no": 1, "qty": {"raw": "3"}, "amount": {"raw": "1,200.00"}}], fields=nofields)
    offered = count_answer_values({"fields": nofields, "line_items": [{"qty": {"raw": "3"}, "amount": {"raw": "1,200.00"}}]})
    print("coordinate-less read: engine count_answer_values=%s  port pages_complete=%s  page_errors=%s"
          % (offered, ex.get("pages_complete"), (ex.get("extra") or {}).get("page_errors")))
    if ex.get("pages_complete") is not False or not (ex.get("extra") or {}).get("page_errors"):
        bad += 1
        print("      FAIL the engine marks this page NO_GEOMETRY and stops calling the read complete")
    else:
        print("      OK pages_complete=false + NO_GEOMETRY reported (E01 will fire, never a silent pass)")

    # a plain read (no salvage, boxes present) must stay complete — no regression on the proven path
    n10_lines = [row(1, {"qty": ("3", [430, 300, 470, 320])}, [40, 296, 960, 330])]
    ex2 = build(n10_lines, [], n10_lines)
    if ex2.get("pages_complete") is not True:
        bad += 1
        print("      FAIL a normal read must stay complete: %s" % json.dumps((ex2.get("extra") or {}).get("page_errors")))
    else:
        print("  normal read: pages_complete=true (no regression on the proven path)")
    print("\n%s" % ("ROW-BOX PARITY: OK" if not bad else "ROW-BOX PARITY: FAIL (%d)" % bad))
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
