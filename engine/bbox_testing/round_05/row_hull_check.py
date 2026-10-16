"""What does "the row box must contain its own cells" buy, measured on the whole 50-document round?

R4-9 found this while pricing the ink snap: the snap corrects cells and never the row, so a corrected cell
can leave its own row box behind - the invariant Round 3 measured at 0 breaks over 50 documents.  The engine
now keeps that invariant by construction (``PageAnswer.region(row, contains=cells)``: the row box is widened
to the hull of the cells the model drew inside it, and never to a cell it did not).

The repair is worth measuring on its own, because it is not a snap change: it applies whether the correction
is on or off, and it can only help a row whose model-drawn box was already too small for its cells.  This
needs no VLM and no page ink - it is arithmetic on payloads that are already on disk.

  python bbox_testing/round_05/row_hull_check.py [DMS ids...]     # default: every round_04 payload

Writes the repaired payloads under ``round_05/align/row_hull_r04/`` and scores both with the unmodified
round-3 ruler.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(HERE))

import ab_measure as A                                        # noqa: E402
import paired_snap as P                                       # noqa: E402

SRC = ROOT / "bbox_testing" / "round_04"
CELLS = A.CELLS


def hull(row: dict) -> tuple[list | None, int]:
    """The row box widened to the cells the model placed in it; (new box or None, cells adopted)."""
    box = row.get("line_bbox")
    if not box:
        return None, 0
    x, y, w, h = box
    frame = [x, y, x + w, y + h]
    out, adopted = list(frame), 0
    for name in CELLS:
        v = row.get(name)
        cell = v.get("bbox") if isinstance(v, dict) else None
        if not cell:
            continue
        cx, cy, cw, ch = cell
        if cy >= frame[1] + frame[3] or cy + ch <= frame[1]:      # the model never put it in this row
            continue
        out = [min(out[0], cx), min(out[1], cy), max(out[2], cx + cw), max(out[3], cy + ch)]
        adopted += 1
    new = [out[0], out[1], out[2] - out[0], out[3] - out[1]]
    return (new if new != box else None), (adopted if new else 0)


def main() -> int:
    src_ocr = SRC / "ocr"
    ids = sorted(int(p.name.split("-")[1].split(".")[0]) for p in src_ocr.glob("DMS-*.json"))
    docs = [int(v) for v in sys.argv[1:]] or ids
    dest = HERE / "align" / "row_hull_r04"
    (dest / "ocr").mkdir(parents=True, exist_ok=True)

    rows_total = rows_changed = cells_adopted = 0
    for doc in docs:
        payload = json.loads((src_ocr / f"DMS-{doc}.json").read_text(encoding="utf-8"))
        for row in payload.get("line_items") or []:
            rows_total += 1
            new, adopted = hull(row)
            if new:
                row["line_bbox"] = new
                rows_changed += 1
                cells_adopted += adopted
        (dest / "ocr" / f"DMS-{doc}.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    before = {d: P.align_states(SRC, [d]).get(d, {}) for d in docs}
    after = {d: P.align_states(dest, [d]).get(d, {}) for d in docs}
    b = sum(len(before[d]) for d in docs)
    f0 = sum(sum(before[d].values()) for d in docs)
    a = sum(len(after[d]) for d in docs)
    f1 = sum(sum(after[d].values()) for d in docs)
    r0 = sum(sum(1 for n, bad in before[d].items() if bad and n.startswith("line_")) for d in docs)
    r1 = sum(sum(1 for n, bad in after[d].items() if bad and n.startswith("line_")) for d in docs)
    fixed = {d: sorted(n for n in before[d] if before[d].get(n) and not after[d].get(n, False)) for d in docs}
    broke = {d: sorted(n for n in after[d] if after[d].get(n) and not before[d].get(n, False)) for d in docs}
    nfix, nbrok = sum(len(v) for v in fixed.values()), sum(len(v) for v in broke.values())

    print(f"{len(docs)} documents, {rows_total} rows: {rows_changed} row boxes rebuilt as the hull of their "
          f"cells ({cells_adopted} cells adopted)")
    print(f"defect rate   {f0:>4}/{b:<4} {A.rate(f0, b):>5.1f}%  ->  {f1:>4}/{a:<4} {A.rate(f1, a):>5.1f}%  "
          f"({A.rate(f1, a) - A.rate(f0, b):+.1f} pp)")
    print(f"of which rows {r0:>4}/{b:<4} {A.rate(r0, b):>5.1f}%  ->  {r1:>4}/{a:<4} {A.rate(r1, a):>5.1f}%  "
          f"({A.rate(r1, a) - A.rate(r0, b):+.1f} pp)")
    print(f"verdicts      fixed {nfix}, broke {nbrok}")
    for d in docs:
        if fixed[d] or broke[d]:
            print(f"  DMS-{d}: fixed [{', '.join(fixed[d]) or '-'}]  broke [{', '.join(broke[d]) or '-'}]")
    print("\nNo page ink and no VLM here - the same payloads, one derivation rule, the same ruler "
          "(round_03/align.py, unmodified).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
