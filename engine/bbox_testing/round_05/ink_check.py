"""How many delivered boxes contain no ink at all?

R4-3b: the audit harness has its own pipeline, so the engine's new ink-snap (R4-3a) is invisible to
align.py.  This measures the engine's own delivery instead, with a metric that needs no model and no eye:
a field/cell box that lands on blank paper contains zero dark pixels.  The same metric is run over the
audit payload of the same document (which never snaps) for comparison.

  python bbox_testing/round_05/ink_check.py 127 171 170 159 107 117

R4-3c: the two sides are switchable, because the A/B is engine-snap-on against engine-snap-off on the same
documents (not engine against harness any more) - ``ENGINE_DIR`` / ``AUDIT_DIR`` point each column at any
payload set.  The first column still reads an engine ``extraction.json``, the second a harness-shaped
``ocr/DMS-<id>.json``; ``ab_measure.py`` feeds both formats of the same run.
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))
from system_a.perception.coords import ink_mask                      # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "bbox_testing" / "round_03"))
import align                                                          # noqa: E402

ENGINE = Path(os.environ.get("ENGINE_DIR") or ROOT / "bbox_testing" / "_engine_snap")
AUDIT = Path(os.environ.get("AUDIT_DIR") or ROOT / "bbox_testing" / "round_04")
IMG = ROOT / "bbox_testing" / "source_images"


def render(doc: int, page_no: int, rot: int):
    """The page as an ink map, in the upright frame both pipelines deliver their boxes in (see align.py)."""
    path = IMG / f"DMS-{doc}_p{page_no}.png"
    if not path.exists():
        return None
    im = Image.open(path).convert("L")
    if rot:
        im = im.rotate(-rot)
    return ink_mask(np.asarray(im))





def boxes_engine(doc: int, engine: Path = None):
    """Every field/cell region the engine delivered, as (page, normalised xywh), + page rotations."""
    folder = (engine or ENGINE) / f"DMS-{doc}"
    blob = folder / "result.json"
    blob = blob if blob.exists() else folder / "extraction.json"
    res = json.loads(blob.read_text(encoding="utf-8") if blob.exists() else "{}")
    rots = {int(p["page_no"]): int(p.get("rotation") or 0) for p in res.get("pages") or []}
    out = []
    for val in (res.get("fields") or {}).values():
        reg = (val or {}).get("region") or {}
        if reg.get("bbox"):
            out.append((reg["page"], reg["bbox"]))
    for row in res.get("lines") or []:
        for cell in (row.get("cells") or {}).values():
            reg = (cell or {}).get("region") or {}
            if reg.get("bbox"):
                out.append((reg["page"], reg["bbox"]))
    return out, rots


def boxes_audit(doc: int, audit: Path = None):
    ocr = json.loads(((audit or AUDIT) / "ocr" / f"DMS-{doc}.json").read_text(encoding="utf-8"))
    rots = {int(k): int(v or 0) for k, v in (ocr.get("page_rotations") or {}).items()}
    out = []
    for val in (ocr.get("fields") or {}).values():
        if isinstance(val, dict) and val.get("bbox"):
            out.append((val.get("page") or 1, val["bbox"]))
    for row in ocr.get("line_items") or []:
        for key in ("description", "qty", "unit_price", "discount", "amount", "lot"):
            cell = row.get(key)
            if isinstance(cell, dict) and cell.get("bbox"):
                out.append((row.get("page") or 1, cell["bbox"]))
    return out, rots, ocr.get("selected_invoice_pages") or []


def empty_ratio(items, doc: int, rots: dict):
    """Field/cell boxes that contain no ink at all - a box on blank paper reads nothing back."""
    masks, empty, total = {}, 0, 0
    for page, box in items:
        x, y, w, h = box
        if w <= 0 or h <= 0:
            continue
        total += 1
        if page not in masks:
            masks[page] = render(doc, page, rots.get(page, 0))
        mask = masks[page]
        if mask is None:
            return None
        H, W = mask.shape
        x1, y1 = max(0, int(x * W)), max(0, int(y * H))
        x2, y2 = min(W, int((x + w) * W)), min(H, int((y + h) * H))
        if x2 <= x1 or y2 <= y1:
            continue
        if mask[y1:y2, x1:x2].sum() == 0:
            empty += 1
    return empty, total


def main() -> None:
    docs = [int(v) for v in sys.argv[1:]]
    print(f"left  = {ENGINE}\nright = {AUDIT}")
    print(f"{'doc':>7} | {'engine (snap on)':>18} | {'right-hand payload':>25}")
    for doc in docs:
        e_items, e_rots = boxes_engine(doc)
        a_items, a_rots, sel = boxes_audit(doc)
        e = empty_ratio(e_items, doc, e_rots)
        a = empty_ratio(a_items, doc, a_rots)
        if e is None or a is None:
            print(f"DMS-{doc}: no source image")
            continue
        (ee, et), (ae, at) = e, a
        print(f"DMS-{doc:>4} | engine {ee:>3}/{et:<3} = {100.0 * ee / max(1, et):5.1f}% "
              f"| audit {ae:>3}/{at:<3} = {100.0 * ae / max(1, at):5.1f}%")


if __name__ == "__main__":
    main()
