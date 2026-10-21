"""How much page furniture was the empty-box ruler being fooled by?  (R4-15, the metric half)

``ink_check`` asks "is there any dark pixel under this box", which answers "does the crop contain ink" - and a
table rule, a box border or a dotted leader is ink.  That is the whole reason the engine path reported a
0.0% empty-box rate while the audit round of the same documents counted 90 boxes on ink that was not print:
the boxes were not on paper, they were on furniture, and the ruler called that a pass.

This tool runs both rules over the same payloads and prints them side by side:

  ink     the historical rule, byte for byte, so the numbers recorded for rounds 1-4 stay what they were
  print   the new one: empty unless a band between the snap's height floor and ceiling crosses the box *and*
          more than one mark sits under the line - furniture may be ink, it may not count as an answer

Nothing here ships a box: the new rule is a diagnostic, ``align.py`` stays the ruler decisions are made with.
Run it on both sides of the snap, because the point of the second column is that the snap's win is bigger than
the first column admits - and on the audit payloads, which no snap ever touched, as the control.

  python bbox_testing/round_05/ruler_check.py                      # arms + control
  python bbox_testing/round_05/ruler_check.py 127 159 171          # a subset
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(HERE))

import ink_check as IC                                            # noqa: E402
from system_a.envfile import load_env                             # noqa: E402

load_env()

SETS = [("engine arm: snap off, run 1", HERE / "snap_off" / "run1", "engine"),
        ("engine arm: move, run 1", HERE / "snap_move" / "run1", "engine"),
        ("engine arm: snap off, run 2", HERE / "snap_off" / "run2", "engine"),
        ("engine arm: move, run 2", HERE / "snap_move" / "run2", "engine"),
        ("control: audit round 04 (never snapped)", ROOT / "bbox_testing" / "round_04", "audit")]


def main() -> int:
    only = [int(v) for v in sys.argv[1:] if v.isdigit()]
    print(f"{'payload set':>38} | {'empty by ink (historical)':>26} | {'empty by print (new)':>22}")
    for label, folder, kind in SETS:
        # A round dir keeps its payloads in ocr/DMS-<id>.json; an engine run dir keeps DMS-<id>/extraction.json.
        src = (folder / "ocr") if kind == "audit" else folder
        docs = sorted(int(p.name.split("-")[1].split(".")[0]) for p in src.glob("DMS-*"))
        docs = [d for d in docs if not only or d in only]
        ink_e = ink_t = pr_e = pr_t = 0
        skipped = 0
        for doc in docs:
            if kind == "engine":
                items, rots = IC.boxes_engine(doc, folder)
            else:
                items, rots, _sel = IC.boxes_audit(doc, folder)
            a = IC.empty_ratio(items, doc, rots)
            b = IC.empty_of_print(items, doc, rots)
            if a is None or b is None:
                skipped += 1
                continue
            ink_e += a[0]; ink_t += a[1]; pr_e += b[0]; pr_t += b[1]
        ri = 100.0 * ink_e / max(1, ink_t)
        rp = 100.0 * pr_e / max(1, pr_t)
        print(f"{label:>38} | {ink_e:>5}/{ink_t:<5} = {ri:5.1f}%      | {pr_e:>5}/{pr_t:<5} = {rp:5.1f}%"
              + (f"   ({skipped} docs unreadable)" if skipped else ""))
    print("\nThe gap is not measurement error: it is boxes on rules, borders and dotted leaders that the old rule")
    print("counted as answered.  Rates only - and the control row is a payload set no snap ever touched.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
