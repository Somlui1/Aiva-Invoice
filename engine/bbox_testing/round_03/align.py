"""Box-vs-text alignment report v2: does each stored box actually cover the printed line it lands on?

v1 tried to find text lines in a window *around* the box and merged Thai ascender rows into giant
bands, which produced both false alarms (DMS-198 tax ids that are fine) and misses (DMS-106
customer_tax_id, which is clearly on the wrong line). v2 measures the way the eye does it:

  1. look only at the columns the box spans;
  2. group those columns' ink rows into printed lines (small gap tolerance - Thai is dense);
  3. the line the box sits on = the one with the biggest vertical overlap; how much of that line's
     height (vcov) and of its horizontal run (hcov) is inside the box is the answer;
  4. an uncovered line directly above/below whose run lines up with the box better than the line the
     box is on = the label-anchor defect ("box on the label, value on the next line").

Used to order the visual queue (runbook §4: automated checks may order work, never decide). Calibrated
against documents whose boxes were checked with the eye (see round_03/review/*.md).

  python bbox_testing/round_03/align.py DMS-106 [...] [--thresh=N] [--fields=sub_total,vat] [--all]
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROUND = os.environ.get("AUDIT_ROUND_DIR") or os.path.dirname(os.path.abspath(__file__))
# AUDIT_ROUND_DIR lets the same measurement run against an earlier round dir -> "did it get better?"
_SRC = os.path.join(ROUND, "..", "source_images")
# scans live outside the round dir; an earlier round measured via AUDIT_ROUND_DIR falls back here
SRC = _SRC if os.path.isdir(_SRC) else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "source_images")
KEYS = ["invoice_num", "invoice_date", "supplier_name", "customer_name", "supplier_tax_id",
        "customer_tax_id", "customer_address", "po_number", "sub_total", "vat", "grand_total"]
CELLS = ["item_code", "description", "qty", "uom", "unit_price", "amount"]
RUN_GAP = 4       # px of blank column that ends a printed run
ROW_GAP = 2       # blank rows tolerated inside one printed line
OK = 0.80


def otsu(level):
    """These scans mix yellow paper, cyan print and pencil; one fixed cut loses pale digits (DMS-106)
    or swallows shading, so the threshold comes from the page histogram."""
    hist, _ = np.histogram(level, bins=64, range=(0, 256))
    p = hist / hist.sum()
    best, thr = -1.0, 128
    for i in range(1, 64):
        w1, w2 = p[:i].sum(), p[i:].sum()
        if w1 == 0 or w2 == 0:
            continue
        m1 = (np.arange(i) * p[:i]).sum() / w1
        m2 = (np.arange(i, 64) * p[i:]).sum() / w2
        v = w1 * w2 * (m1 - m2) ** 2
        if v > best:
            best, thr = v, i
    return max(120, min(220, thr * 4))


def lines_in(mask, x0, x1, y0, y1, row_gap=ROW_GAP):
    """Printed lines (page px) that carry ink inside the column range x0..x1."""
    prof = mask[int(y0):int(y1), int(x0):int(x1)].any(axis=1)
    out, start, blank = [], None, 0
    for i, v in enumerate(prof):
        if v:
            if start is None:
                start = i
            blank = 0
        elif start is not None:
            blank += 1
            if blank > row_gap:
                if i - blank - start >= 3:
                    out.append((y0 + start, y0 + i - blank))
                start, blank = None, 0
    if start is not None and len(prof) - start >= 3:
        out.append((y0 + start, y0 + len(prof)))
    return out


def hruns(mask, r0, r1, gap=RUN_GAP):
    cols = mask[int(r0):int(r1)].any(axis=0)
    out, start, blank = [], None, 0
    for c, v in enumerate(cols):
        if v:
            if start is None:
                start = c
            blank = 0
        elif start is not None:
            blank += 1
            if blank >= gap:
                out.append((start, c - blank))
                start, blank = None, 0
    if start is not None:
        out.append((start, len(cols)))
    return [(s, e) for s, e in out if e - s >= 5]


def run_align(mask, box, r0, r1):
    """Best horizontal coverage of a printed run of rows r0..r1 by the box, plus how far off it is."""
    x0, x1 = box[0] * mask.shape[1], (box[0] + box[2]) * mask.shape[1]
    best, bx = 0.0, None
    for (s, e) in hruns(mask, r0, r1):
        ov = max(0, min(e, x1) - max(s, x0))
        if ov / max(1.0, e - s) > best:
            best, bx = min(1.0, ov / max(1.0, e - s)), (s, e)
    return best, bx


def word_align(mask, box, r0, r1, gap=3):
    """How much of the printed *word* under the box the box covers.

    Using the whole line's run as the denominator is wrong on these forms: `จำนวนภาษีมูลค่าเพิ่ม 7%`
    and `12,495.00` share a row band - and many forms print a dotted leader line under the value, whose
    dots are only 2 px apart - so a box sitting exactly on the amount scores 8%. Instead grow a segment
    outward from the ink inside the box while the gap stays within one word space, and never further
    than 1.5 box widths per side: a box that points at its value cannot be missing most of it.
    """
    W = mask.shape[1]
    body = int(r0 + 0.65 * (r1 - r0))      # dotted leader lines sit on the baseline: read the word from
    cols = np.flatnonzero(mask[int(r0):body].any(axis=0))  # the upper body of the printed line
    if cols.size == 0:
        cols = np.flatnonzero(mask[int(r0):int(r1)].any(axis=0))
    if cols.size == 0:
        return 0.0, None
    x0, x1 = box[0] * W, (box[0] + box[2]) * W
    limit = 1.5 * (x1 - x0)
    inside = cols[(cols >= x0) & (cols <= x1)]
    if inside.size == 0:
        return 0.0, (x0, x1)
    lo, hi = int(inside[0]), int(inside[-1])
    moved = True
    while moved:                                  # grow while the next ink is within a word space
        moved = False
        if hi - lo < 2 * limit:
            nxt = cols[(cols < lo) & (cols >= lo - gap)]
            if nxt.size:
                lo, moved = int(nxt[0]), True
            nxt = cols[(cols > hi) & (cols <= hi + gap)]
            if nxt.size:
                hi, moved = int(nxt[-1]), True
    ov = max(0, min(hi, x1) - max(lo, x0))
    return min(1.0, ov / max(1.0, hi - lo)), (lo, hi)


def check_box(mask, box, cell=False):
    H, W = mask.shape
    x0, y0 = box[0] * W, box[1] * H
    x1, y1 = x0 + box[2] * W, y0 + box[3] * H
    bh = max(1.0, y1 - y0)
    # A field box is only ~12 px tall on a 1521 px page; a search window scaled to the box alone misses
    # the line one row away (DMS-224 totals), so keep a floor of 2.5% of the page height.
    win = max(3.0 * bh, 0.025 * H)
    lines = lines_in(mask, x0, x1, max(0, y0 - win), min(H, y1 + win))
    own, own_v = None, 0.0
    for (a, b) in lines:
        v = max(0, min(b, y1) - max(a, y0)) / max(1.0, b - a)
        if v > own_v:
            own, own_v = (a, b), v
    if own is None or own_v < 0.35:
        far = lines_in(mask, x0, x1, max(0, y0 - 3 * win), min(H, y1 + 3 * win))
        if not far:
            return ("no_ink_nearby", 0.0, 0.0, None)
        near = min(far, key=lambda l: min(abs(l[0] - y1), abs(l[1] - y0)))
        gap = min(abs(near[0] - y1), abs(near[1] - y0))
        side = "below" if near[0] >= y1 else "above"
        return (f"empty_box/line_{side}_{int(gap)}px", 0.0, 0.0, None)
    hcov, run = word_align(mask, box, own[0], own[1])
    score = min(own_v, hcov)
    state = "ok" if score >= OK else ("partial_low" if cell else f"covers_{score:.0%}")
    if state != "ok":                       # is a better aligned line just above/below? (label anchor)
        alt = None
        for (a, b) in lines:
            if (a, b) == own:
                continue
            v = max(0, min(b, y1) - max(a, y0)) / max(1.0, b - a)
            if v > 0.2:
                continue
            c2, _ = word_align(mask, box, a, b)
            if c2 > hcov + 0.15 and (a > y1 - 2 or b < y0 + 2):
                side = "below" if a >= y1 - 2 else "above"
                if alt is None or c2 > alt[1]:
                    alt = (side, c2)
        if alt:
            state = f"{state}/value_{alt[0]}_{alt[1]:.0%}"
    return (state, own_v, hcov, run)


def boxes_of(doc):
    d = json.load(open(os.path.join(ROUND, "ocr", f"{doc}.json"), encoding="utf-8"))
    out = []
    for k in KEYS:
        f = (d.get("fields") or {}).get(k) or {}
        if f.get("bbox"):
            out.append((int(f.get("page_no") or 1), k, f["bbox"], f.get("raw")))
    for it in d.get("line_items") or []:
        n = it.get("line_no")
        if it.get("line_bbox"):
            out.append((int(it.get("page_no") or 1), f"line_{n}", it["line_bbox"],
                        (it.get("description") or {}).get("raw")))
        for c in CELLS:
            v = it.get(c) or {}
            if isinstance(v, dict) and v.get("bbox"):
                out.append((int(it.get("page_no") or 1), f"L{n}.{c}", v["bbox"], v.get("raw")))
    return out


def overlay_angle(img0, rend):
    """Which quarter turn of the scan equals the pipeline's overlay? Coarse image correlation.

    The overlay *is* the frame the stored boxes live in, so the audit has to measure in it - and ink
    statistics cannot find it: on a dense form a 180 deg flip puts the boxes on other people's text and
    scores better than the truth (DMS-224 measured 270 by coverage, correlation says 90).
    """
    if not os.path.exists(rend):
        return None
    r = np.asarray(Image.open(rend).convert("L").resize((60, 80))).astype(float)
    best = None
    for ang in (0, 90, 180, 270):
        im = img0.rotate(-ang, expand=True) if ang else img0
        s = np.asarray(im.convert("L").resize((60, 80))).astype(float)
        c = float(np.corrcoef(s.ravel(), r.ravel())[0, 1])
        if best is None or c > best[0]:
            best = (c, ang)
    return best[1] if best[0] > 0.15 else None


def page_image(doc, page, boxes, guard_boxes=None):
    """(PIL image, ink mask, angle, boxes-in-that-frame), measured in the pipeline's own frame.

    Ink comes from the scan, never from the overlay: the print on these forms is itself coloured (blue
    ink, yellow paper), so filtering out the drawn boxes also erases the text. The overlay is still the
    authority on *which frame* to measure in - `overlay_angle` matches the scan to it, which is the only
    reliable answer on a rotated page (DMS-59, DMS-224).

    A page whose print runs sideways while the boxes stay in the unturned frame (DMS-227) has no
    horizontal frame to measure in; guessing a quarter turn on a dense table is a coin flip, so the page
    is reported as "sideways - eye only" rather than given an invented number.
    """
    path = os.path.join(SRC, f"{doc}_p{page}.png")
    if not os.path.exists(path):
        return None
    img0 = Image.open(path).convert("RGB")
    rend = os.path.join(ROUND, "rendered", f"{doc}_p{page}_bbox.png")

    def load(ang):
        im = img0.rotate(-ang, expand=True) if ang else img0
        level = np.asarray(im.convert("L"))
        return im, level < otsu(level)

    # The payload already records the turn the pipeline used (`meta.pages_classification[].rotate_degrees`)
    # - use it, and keep the correlation only as a cross-check (they agreed on DMS-59 and DMS-224: 90).
    declared = None
    try:
        ocr = json.load(open(os.path.join(ROUND, "ocr", f"{doc}.json"), encoding="utf-8"))
        for c in ((ocr.get("meta") or {}).get("pages_classification") or []):
            if int(c.get("page_no") or 0) == int(page):
                declared = int(c.get("rotate_degrees") or 0) % 360
    except (OSError, ValueError, TypeError):
        declared = None
    corr = overlay_angle(img0, rend)
    if declared is not None and corr is not None and declared != corr:
        print(f"   # {doc} p{page}: payload says {declared} deg, correlation says {corr} deg")
    ang = declared if declared is not None else corr
    if not ang:                     # upright frame: check the print is not running sideways
        W, H = img0.size
        # only the named field boxes count here: table cells are square and row boxes are very wide, so
        # averaging over every box hides a page whose text runs sideways (DMS-227 has 12 tall field boxes).
        probe = [b for b in (guard_boxes if guard_boxes is not None else boxes) if b[2] * b[3] > 0]
        asp = [b[2] * W / float(b[3] * H) for b in probe]
        # a third of the field boxes taller than wide can only mean the print runs sideways: the median
        # alone hides DMS-227, where the long boxes look wide and the number boxes look tall.
        if asp and sorted(asp)[len(asp) // 2] < 1.0 or (asp and
                                                            sum(a < 0.8 for a in asp) >= len(asp) / 3):
            return None
        ang = 0
    im, mask = load(ang)
    return im, mask, ang, list(boxes)


def load_page(doc, page, boxes):
    """Ink mask only - see page_image."""
    got = page_image(doc, page, boxes)
    return None if got is None else got[1]


def row_cell_check(boxes, line_no):
    """Does a row box actually contain the cells of its row? Pure arithmetic on the stored boxes.

    Measuring a full-width row box against the page image is unreliable: the table's horizontal rules
    are ink rows too, so `lines_in` finds a rule and the box looks empty (DMS-47 line_1 is the exact
    union of its cells and covers them perfectly, yet reported "no line under box"). The cells are what
    a row box exists to cover, and both come from the same payload.
    """
    row = next((b for p, n, b, r in boxes if n == f"line_{line_no}"), None)
    if row is None:
        return None
    worst, worst_cell, n = 1.0, None, 0
    for p, name, b, raw in boxes:
        if not name.startswith(f"L{line_no}."):
            continue
        if str(raw).strip() in ("", "-"):            # a cell with no value has nothing to cover
            continue
        n += 1
        ov = (max(0, min(b[0] + b[2], row[0] + row[2]) - max(b[0], row[0]))
              * max(0, min(b[1] + b[3], row[1] + row[3]) - max(b[1], row[1])))
        cov = ov / max(1e-9, b[2] * b[3])
        if cov < worst:
            worst, worst_cell = cov, name.split(".")[-1]
    if n == 0:
        return None
    return ("ok" if worst >= 0.95 else f"row_misses_{worst_cell}_{worst:.0%}"), worst


def set_round(path):
    """Measure another round's payload with the same ruler (answer 'did it get better?' in one number)."""
    global ROUND
    ROUND = os.path.abspath(path)
    return ROUND


def main():
    thresh, only, show_all = 0, None, "--all" in sys.argv
    args = []
    for a in sys.argv[1:]:
        if a.startswith("--thresh="):
            thresh = int(a.split("=", 1)[1]) or 0
        elif a.startswith("--round-dir="):
            set_round(a.split("=", 1)[1])
        elif a.startswith("--fields="):
            only = set(a.split("=", 1)[1].split(","))
        elif not a.startswith("--"):
            args.append(a)
    for doc in args:
        doc = doc if doc.startswith("DMS-") else f"DMS-{doc}"
        rows = []
        try:
            want = [b for b in boxes_of(doc) if not only or b[1].split(".")[0] in only]
            allb = boxes_of(doc)
        except OSError as exc:                       # a doc that failed to run in that round
            print(f"== {doc} not_in_round ({type(exc).__name__})")
            continue
        by_page = {}
        for item in want:
            by_page.setdefault(item[0], []).append(item)
        for page, items in by_page.items():
            fields = [i[2] for i in items if '.' not in i[1] and not i[1].startswith('line_')]
            if not os.path.exists(os.path.join(SRC, f"{doc}_p{page}.png")):
                rows.append((f"p{page}:-", "no_source_image", 0, "", ""))
                continue
            got = page_image(doc, page, [i[2] for i in items], guard_boxes=fields)
            if got is None:
                rows.append((f"p{page}:-", "sideways_page_eye_only", 0, "", "no horizontal frame"))
                continue
            _, mask, ang, turned = got
            for (_, name, box, raw), tbox in zip(items, turned):
                if name.startswith("line_"):           # row box vs its own cells: no pixels involved
                    got2 = row_cell_check(allb, name.split("_")[1])
                    if got2 is None:
                        continue
                    rows.append((f"p{page}:{name}", got2[0], got2[1], "", "row box vs its cells"))
                    continue
                state, v, h, _ = check_box(mask, tbox, cell="." in name)
                if state in ("ok", "partial_low") and not show_all:
                    continue
                rows.append((f"p{page}:{name}", state, round(min(v, h), 2), round(h, 2), str(raw)[:26]))
        rows.sort(key=lambda r: r[0])
        bad = [r for r in rows if not r[1].startswith(("ok", "partial_low"))]
        print(f"== {doc} boxes={len(rows) + 0} flagged={len(bad)}"
              + ("  << " + ",".join(r[0].split(":", 1)[1] for r in bad) if bad else ""))
        if show_all:
            for r in rows:
                print(("   ! " if not r[1].startswith(("ok", "partial_low")) else "    ")
                      + f"{r[0]:<20} {r[1]:<34} v={r[2]:<5} h={r[3]:<5} {r[4]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
