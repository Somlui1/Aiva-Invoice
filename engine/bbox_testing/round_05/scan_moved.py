"""Which documents would the ``move`` knob actually have work to do in?  (R4-12)

Both replications of the paired measurement answered the same way: ``move`` fires on 0 and 5 boxes out of 211.
An A/B run over documents where the correction is a no-op measures the model's variance, not the correction -
which is exactly how R4-3c ended up unable to separate its two arms.  So before paying for any more model
calls, replay the shipped correction over every payload already on disk and list the documents where it does
something.  Those are the documents an A/B has to be run on; the rest are noise with extra steps.

The replay is the engine's own geometry (:func:`snap_box_to_ink` with ``grow=False``) on the ink map with the
page furniture removed, which is what the pipeline hands it since R4-11.

Two things it counts per box, because "moved" is not the same as "useful":
  fixed  - the box had no dark pixel under it before and has print under it after  (the failure Round 3 left)
  broke  - the box had print under it before and lands on blank paper after        (what a wrong move costs)

Frame caveat, stated because it changes the numbers: this replays in the *audit* frame (the rendered pages
under ``source_images``, the frame ``align.py`` and ``ink_check.py`` read) not the engine's 150 DPI frame.
The snap's travel budget is in pixels, so a page rendered larger lets a box travel further.  For picking
documents that is fine - it is a proxy for "does this page have a box sitting on a rule" - and the actual
measurement is still done by ``paired_snap.py``, in the engine frame.

  python bbox_testing/round_05/scan_moved.py                 # every round_04 payload
  python bbox_testing/round_05/scan_moved.py 107 159 170     # a subset
"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(HERE))

import ink_check as IC                                        # noqa: E402
from system_a.envfile import load_env                         # noqa: E402

load_env()
from system_a.perception.coords import snap_box_to_ink, strip_rules   # noqa: E402

PAYLOADS = ROOT / "bbox_testing" / "round_04" / "ocr"
CELLS = ("item_code", "description", "qty", "uom", "unit_price", "amount")


def boxes_of(payload: dict):
    """Every field/cell box the audit delivered, as (page, name, normalised xywh).  Rows excluded: the
    engine only ever corrects fields and cells, so a row box is not the knob's work."""
    out = [(int(v.get("page_no") or v.get("page") or 1), k, v["bbox"])
           for k, v in (payload.get("fields") or {}).items() if (v or {}).get("bbox")]
    for n, item in enumerate(payload.get("line_items") or [], 1):
        page = int(item.get("page_no") or 1)
        for cell in CELLS:
            v = item.get(cell) or {}
            if isinstance(v, dict) and v.get("bbox"):
                out.append((page, f"L{n}.{cell}", v["bbox"]))
    return out


def has_ink(mask, box) -> bool:
    """Does print sit under this box?  The same rule as ``ink_check``: not a single dark pixel = empty.

    ``box`` is normalised xywh - the frame every payload and every ruler in this folder speaks.
    """
    H, W = mask.shape[:2]
    x, y, w, h = box
    x1, y1 = max(0, int(x * W)), max(0, int(y * H))
    x2, y2 = min(W, int((x + w) * W)), min(H, int((y + h) * H))
    return bool(x2 > x1 and y2 > y1 and mask[y1:y2, x1:x2].sum() > 0)


def rots_of(payload: dict) -> dict:
    """The turn the pipeline declared for each page - the frame the payload's boxes are actually in.

    Delivering a box in the upright frame and measuring it against the unturned render is how an instrument
    invents damage: DMS-59 pages 1-3 are turned 90 deg and its first run "broke" 3 of 3 moved boxes until the
    replay turned the page the way the payload said it was turned.
    """
    return {int(c.get("page_no") or 0): int(c.get("rotate_degrees") or 0)
            for c in ((payload.get("meta") or {}).get("pages_classification") or [])}


def move_box(box, clean, raw):
    """One normalised box through the shipped ``move`` knob; (new_box_norm, note, moved?).

    The engine's geometry on the furniture-stripped map, which is what ``_rf`` hands it since R4-11.  A box the
    correction does not act on is returned as the same object it came in - not requantised - because R4-9
    measured that re-emitting an untouched box through float->px->float drifts it by a pixel and flips verdicts
    in the ruler.
    """
    H, W = clean.shape[:2]
    px = [box[0] * W, box[1] * H, (box[0] + box[2]) * W, (box[1] + box[3]) * H]
    new, note = snap_box_to_ink(px, clean, move=True, grow=False)
    if note == "unchanged":
        return list(box), note, False
    return [new[0] / W, new[1] / H, (new[2] - new[0]) / W, (new[3] - new[1]) / H], note, True


def scan(doc: int, masks: dict):
    """Replay ``move`` over one document's boxes; (stats, list of what it moved and how it landed)."""
    payload = json.loads((PAYLOADS / f"DMS-{doc}.json").read_text(encoding="utf-8"))
    rots = rots_of(payload)
    raw, clean = {}, {}
    stats, notes = dict(boxes=0, moved=0, fixed=0, broke=0, empty_before=0, empty_after=0), []
    for page, name, box in boxes_of(payload):
        if page not in raw:
            m = IC.render(doc, page, rots.get(page, 0))
            if m is None:
                return None
            raw[page], clean[page] = m, strip_rules(m)
        stats["boxes"] += 1
        before = has_ink(raw[page], box)
        stats["empty_before"] += 0 if before else 1
        new, note, moved = move_box(box, clean[page], raw[page])
        if not moved:
            stats["empty_after"] += 0 if before else 1
            continue
        stats["moved"] += 1
        after = has_ink(raw[page], new)
        stats["empty_after"] += 0 if after else 1
        stats["fixed"] += int(not before and after)
        stats["broke"] += int(before and not after)
        notes.append((name, note, int((new[1] - box[1]) * clean[page].shape[0]), before, after))
    return stats, notes


def apply_move(payload: dict, masks: dict, do_move: bool = True) -> tuple[dict, int]:
    """The payload as the shipped knob would have delivered it - and the row box follows the cells it drew.

    The second half is not decoration: only fields and cells are corrected against ink, so a row that keeps the
    box the model drew while its cells move reports as broken containment (R4-9 measured exactly that).  A
    measurement that moved cells and left rows alone would blame the knob for a bug in the derivation.
    """
    out, moved = json.loads(json.dumps(payload)), 0
    skip = (lambda box, page: ([box[0], box[1], box[2], box[3]], "", False)) if not do_move else None
    for f in (out.get("fields") or {}).values():
        if not f.get("bbox"):
            continue
        page = int(f.get("page_no") or f.get("page") or 1)
        box, _note, mv = (skip(f["bbox"], page) if skip else move_box(f["bbox"], masks["clean"][page], masks["raw"][page]))
        f["bbox"], moved = box, moved + int(mv)
    for n, item in enumerate(out.get("line_items") or [], 1):
        page = int(item.get("page_no") or 1)
        row = item.get("line_bbox")
        hull = list(row) if row else None
        for cell in CELLS:
            v = item.get(cell) or {}
            if not isinstance(v, dict) or not v.get("bbox"):
                continue
            drawn = v["bbox"]
            box, _note, mv = (skip(drawn, page) if skip else move_box(drawn, masks["clean"][page], masks["raw"][page]))
            v["bbox"], moved = box, moved + int(mv)
            if hull and row and drawn[1] < row[1] + row[3] and drawn[1] + drawn[3] > row[1]:
                hull = [min(hull[0], box[0]), min(hull[1], box[1]),
                        max(hull[0] + hull[2], box[0] + box[2]), max(hull[1] + hull[3], box[1] + box[3])]
        if hull and row:
            item["line_bbox"] = [hull[0], hull[1], hull[2] - hull[0], hull[3] - hull[1]]
    return out, moved


def load_masks(doc: int, payload: dict):
    """Both ink maps of every page this payload's boxes refer to - pages counted the way the ruler counts them."""
    pages = {int(f.get("page_no") or f.get("page") or 1) for f in (payload.get("fields") or {}).values()}
    pages |= {int(i.get("page_no") or 1) for i in payload.get("line_items") or []}
    rots = rots_of(payload)
    raw = {p: IC.render(doc, p, rots.get(p, 0)) for p in sorted(pages)}
    if any(m is None for m in raw.values()):
        return None
    return {"raw": raw, "clean": {p: strip_rules(m) for p, m in raw.items()}}


def align_on(dest: Path, docs) -> dict:
    """Verdicts from the unmodified round-3 ruler, over a payload set written under ``dest``."""
    from paired_snap import align_states                        # the ruler's parser - one definition
    (dest / "ocr").mkdir(parents=True, exist_ok=True)
    return {d: align_states(dest, [d]).get(d, {}) for d in docs}


def measure_with_the_ruler() -> int:
    """``has ink under it`` is necessary, not sufficient: did the rescued box land on the print it meant to cover?

    "fixed 31, broke 0" above is a pixel fact, and a box can sit on print that is not its own value.  So the
    same two payload sets go through ``align.py`` untouched - the ruler every round in this folder has been
    scored with since round 1 - and the verdicts are paired box by box.

      python bbox_testing/round_05/scan_moved.py --align 24 41 59 74 106 134 159 163 171 183 203 233
    """
    docs = [int(v) for v in sys.argv[1:] if v.isdigit()]
    assert docs, "--align needs the documents to score (the scan prints which ones have work)"
    base = HERE / "move_corpus"
    before, hull, after = (base / "before"), (base / "hull"), (base / "after")
    moved_by_doc = {}
    for doc in docs:
        payload = json.loads((PAYLOADS / f"DMS-{doc}.json").read_text(encoding="utf-8"))
        masks = load_masks(doc, payload)
        assert masks, f"no rendered page on disk for DMS-{doc}"
        new, moved = apply_move(payload, masks)
        hullonly, _ = apply_move(payload, masks, do_move=False)   # the row rule on its own: the control arm
        moved_by_doc[doc] = moved
        for dest, blob in ((before, payload), (hull, hullonly), (after, new)):
            (dest / "ocr").mkdir(parents=True, exist_ok=True)
            (dest / "ocr" / f"DMS-{doc}.json").write_text(json.dumps(blob, ensure_ascii=False), encoding="utf-8")
    vr = {d: align_on(before, [d]).get(d, {}) for d in docs}
    vh = {d: align_on(hull, [d]).get(d, {}) for d in docs}
    va = {d: align_on(after, [d]).get(d, {}) for d in docs}
    print(f"{len(docs)} documents where the shipped `move` knob has work, scored three times by align.py "
          f"(unchanged):\n")
    print(f"{'doc':>7} | {'boxes':>5} {'moved':>5} | {'as delivered':>12} {'row rule only':>13} {'+ move':>7} | "
          f"{'knob fixed':>10} {'broke':>5}")
    tot = dict(boxes=0, bad_r=0, bad_h=0, bad_a=0, fixed=0, broke=0, moved=0)
    for doc in docs:
        names = sorted(set(vr[doc]) | set(vh[doc]) | set(va[doc]))
        fixed = [n for n in names if vh[doc].get(n) and not va[doc].get(n)]      # the knob's own ledger
        broke = [n for n in names if not vh[doc].get(n) and va[doc].get(n)]
        r, h, a = sum(vr[doc].values()), sum(vh[doc].values()), sum(va[doc].values())
        tot["boxes"] += len(names); tot["bad_r"] += r; tot["bad_h"] += h; tot["bad_a"] += a
        tot["fixed"] += len(fixed); tot["broke"] += len(broke); tot["moved"] += moved_by_doc[doc]
        print(f"DMS-{doc:>3} | {len(names):>5} {moved_by_doc[doc]:>5} | {r:>12} {h:>13} {a:>7} | "
              f"{len(fixed):>10} {len(broke):>5}" + ("   " + ", ".join(broke) if broke else ""))
    rr, rh, ra = (100.0 * tot[k] / max(1, tot["boxes"]) for k in ("bad_r", "bad_h", "bad_a"))
    print(f"{'total':>7} | {tot['boxes']:>5} {tot['moved']:>5} | {tot['bad_r']:>12} {tot['bad_h']:>13} "
          f"{tot['bad_a']:>7} | {tot['fixed']:>10} {tot['broke']:>5}")
    print(f"\nrow rule alone:   {rr:.1f}% -> {rh:.1f}% ({rh - rr:+.1f} pp)  <- derivation, ships in every arm")
    print(f"move knob alone:  {rh:.1f}% -> {ra:.1f}% ({ra - rh:+.1f} pp)  <- same answers, same ruler, "
          f"same rows; only the correction differs")
    print(f"payloads kept under {base.relative_to(ROOT)} (before/, hull/, after/) for the record")
    return 0


def main() -> int:
    if "--align" in sys.argv:
        return measure_with_the_ruler()
    docs = [int(v) for v in sys.argv[1:] if v.isdigit()] or sorted(
        int(p.stem.split("-")[1]) for p in PAYLOADS.glob("DMS-*"))
    print(f"replaying the shipped `move` knob over {len(docs)} round_04 payloads "
          f"({PAYLOADS.relative_to(ROOT)}), audit frame, furniture stripped\n")
    print(f"{'doc':>7} | {'boxes':>5} {'moved':>5} {'%':>5} | {'fixed':>5} {'broke':>5} | "
          f"{'empty before -> after':>22}")
    tot = dict(boxes=0, moved=0, fixed=0, broke=0, empty_before=0, empty_after=0)
    rows, skipped = [], []
    for doc in docs:
        got = scan(doc, {})
        if got is None:
            skipped.append(doc)
            continue
        s, notes = got
        for k in tot:
            tot[k] += s[k]
        rows.append((s["moved"], doc, s, notes))
    for moved, doc, s, notes in sorted(rows, reverse=True):
        pct = 100.0 * s["moved"] / s["boxes"] if s["boxes"] else 0.0
        print(f"DMS-{doc:>3} | {s['boxes']:>5} {s['moved']:>5} {pct:>4.0f}% | {s['fixed']:>5} {s['broke']:>5} | "
              f"{s['empty_before']:>9} -> {s['empty_after']:<9}"
              + ("   " + ", ".join(f"{n}({d:+d}px)" for n, _x, d, _b, _a in notes[:6]) if notes else ""))
    print(f"{'total':>7} | {tot['boxes']:>5} {tot['moved']:>5} "
          f"{100.0 * tot['moved'] / max(1, tot['boxes']):>4.0f}% | {tot['fixed']:>5} {tot['broke']:>5} | "
          f"{tot['empty_before']:>9} -> {tot['empty_after']:<9}")
    working = [doc for moved, doc, _s, _n in rows if moved]
    print(f"\n{len(working)} of {len(rows)} documents have any work for `move`: {working}")
    print(f"the other {len(rows) - len(working)} would be measured noise: an A/B over them compares two runs of "
          f"the same thing")
    if skipped:
        print(f"no rendered page on disk for: {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
