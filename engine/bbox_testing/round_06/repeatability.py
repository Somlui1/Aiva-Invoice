"""How much does the same code, the same documents and the same temperature-0 model disagree with itself?

Two faults found this round are intermittent: the page-type gate changed its mind about a page between runs,
and a page lost every coordinate in one run and not the next.  Both were found on single observations, which
is how you get the answer wrong twice in a row.  This tool measures the noise floor itself, from two full
runs of the corpus with identical code:

  gate flips        : documents whose selected invoice pages differ
  classify flips    : pages whose doc_type differs
  value agreement   : fields whose delivered value differs
  box agreement     : IoU between the same field's boxes in the two runs
  detector rates    : how often NO_GEOMETRY and the adjudication guard fire, and whether they agree

Anything that differs here is not a model-quality question - it is the floor under every rate this loop has
ever reported.  A "5 pp improvement" smaller than this floor is not a finding.

  python bbox_testing/round_06/repeatability.py            # compares repA vs repB
"""
import json
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):                     # pragma: no cover
    pass

A, B = HERE / "repA", HERE / "repB"
FIELDS = ("invoice_num", "invoice_date", "po_number", "po_date", "supplier_name", "supplier_address",
          "supplier_tax_id", "customer_name", "customer_address", "subtotal", "total", "amount_text")


def norm(v):
    """A value compared the way a matcher would see it, not byte-for-byte."""
    return " ".join(str(v).split()).casefold() if v not in (None, "") else ""


def load(base):
    out = {}
    for d in sorted((p for p in base.iterdir() if p.is_dir()),
                    key=lambda p: int(p.name.split("-")[1]) if p.name.startswith("DMS-") else 10 ** 9):
        f = d / "extraction.json"
        if f.exists():
            out[d.name] = json.loads(f.read_text(encoding="utf-8"))
    return out


def iou(p, q):
    """Intersect/union of two payload boxes, each stored as normalised [x, y, w, h]."""
    ax1, ay1, ax2, ay2 = p[0], p[1], p[0] + p[2], p[1] + p[3]
    bx1, by1, bx2, by2 = q[0], q[1], q[0] + q[2], q[1] + q[3]
    iw, ih = max(0.0, min(ax2, bx2) - max(ax1, bx1)), max(0.0, min(ay2, by2) - max(ay1, by1))
    inter = iw * ih
    union = (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - inter
    return inter / union if union > 0 else 0.0


def main() -> int:
    a, b = load(A), load(B)
    common = sorted(set(a) & set(b), key=lambda k: int(k.split("-")[1]))
    print(f"documents compared: {len(a)} in A, {len(b)} in B, {len(common)} in both\n")

    gate_flip, dropped_only_one, type_flip, type_total = [], [], 0, 0
    field_total = field_diff = 0
    value_flip_docs, worst_fields, ious = [], {}, []
    lines_flip, complete_flip = [], []
    adj_a = adj_b = adj_agree = 0
    geom_a = geom_b = []
    no_geo_a = [d for d in common if any("NO_GEOMETRY" in str(v) for v in (a[d]["extra"].get("page_errors") or {}).values())]
    no_geo_b = [d for d in common if any("NO_GEOMETRY" in str(v) for v in (b[d]["extra"].get("page_errors") or {}).values())]

    for d in common:
        ea, eb = a[d]["extra"], b[d]["extra"]
        if [int(x) for x in ea.get("invoice_pages") or []] != [int(x) for x in eb.get("invoice_pages") or []]:
            gate_flip.append(d)
        sa, sb = bool(ea.get("invoice_pages")), bool(eb.get("invoice_pages"))
        if sa != sb:
            dropped_only_one.append(f"{d}(A={'read' if sa else 'dropped'}/B={'read' if sb else 'dropped'})")
        ca = {c["page_no"]: c.get("doc_type") for c in ea.get("classify") or []}
        cb = {c["page_no"]: c.get("doc_type") for c in eb.get("classify") or []}
        for p in set(ca) & set(cb):
            type_total += 1
            if ca[p] != cb[p]:
                type_flip += 1
                type_flip_doc = d
        aa, ab = ea.get("adjudication") or [], eb.get("adjudication") or []
        adj_a += len(aa)
        adj_b += len(ab)
        if [(x.get("page"), bool(x.get("accepted"))) for x in aa] == [(x.get("page"), bool(x.get("accepted")))
                                                                      for x in ab]:
            adj_agree += 1
        if bool(a[d].get("pages_complete")) != bool(b[d].get("pages_complete")):
            complete_flip.append(d)
        if len(a[d].get("lines") or []) != len(b[d].get("lines") or []):
            lines_flip.append(d)

        fa, fb = a[d].get("fields") or {}, b[d].get("fields") or {}
        diffs = []
        for k in FIELDS:
            va = (fa.get(k) or {}).get("raw")
            vb = (fb.get(k) or {}).get("raw")
            if va is None and vb is None:
                continue
            field_total += 1
            if norm(va) != norm(vb):
                field_diff += 1
                diffs.append(k)
                worst_fields[k] = worst_fields.get(k, 0) + 1
            ra, rb = (fa.get(k) or {}).get("region"), (fb.get(k) or {}).get("region")
            if ra and rb:
                ious.append(iou(ra["bbox"], rb["bbox"]))
        if diffs:
            value_flip_docs.append((d, len(diffs), ",".join(diffs[:3])))

    print(f"=== the gate ===")
    print(f"docs whose selected pages differ between the two runs : {len(gate_flip)}/{len(common)} "
          f"({100 * len(gate_flip) / len(common):.1f}%)")
    print(f"  read in one run, discarded in the other             : {dropped_only_one or 'none'}")
    print(f"pages whose doc_type differs                          : {type_flip}/{type_total} "
          f"({100 * type_flip / max(type_total, 1):.1f}%)")
    print(f"docs whose pages_complete differs                     : {len(complete_flip)}/{len(common)} "
          f"({100 * len(complete_flip) / len(common):.1f}%){' -> ' + str(complete_flip[:8]) if complete_flip else ''}")

    print(f"\n=== the values a matcher would consume ===")
    print(f"field comparisons made                                : {field_total}")
    print(f"fields whose delivered value differs                  : {field_diff}/{field_total} "
          f"({100 * field_diff / max(field_total, 1):.1f}%)")
    print(f"documents with at least one differing value           : {len(value_flip_docs)}/{len(common)} "
          f"({100 * len(value_flip_docs) / len(common):.1f}%)")
    top = sorted(worst_fields.items(), key=lambda kv: -kv[1])[:6]
    print(f"most volatile fields                                  : "
          + (", ".join(f"{k}={n}" for k, n in top) or "none"))
    print(f"documents whose line count differs                    : {len(lines_flip)}/{len(common)} "
          f"({100 * len(lines_flip) / len(common):.1f}%){' -> ' + str(lines_flip[:8]) if lines_flip else ''}")

    print(f"\n=== the boxes ===")
    if ious:
        print(f"same field boxed in both runs                          : {len(ious)}")
        print(f"IoU between the two runs' boxes                        : median {statistics.median(ious):.3f}, "
              f"mean {statistics.mean(ious):.3f}, below 0.5 in {sum(1 for v in ious if v < 0.5)} "
              f"({100 * sum(1 for v in ious if v < 0.5) / len(ious):.1f}%)")

    print(f"\n=== the detectors this round shipped ===")
    print(f"adjudication calls              : A={adj_a} B={adj_b} | docs where the adjudication log agrees: "
          f"{adj_agree}/{len(common)} ({100 * adj_agree / len(common):.1f}%)")
    print(f"NO_GEOMETRY pages               : A={len(no_geo_a)} {no_geo_a} | B={len(no_geo_b)} {no_geo_b}")

    print("\nread this as the floor: any rate this loop reports that moves by less than the percentages above")
    print("is inside what the pipeline does to itself when nothing changed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
