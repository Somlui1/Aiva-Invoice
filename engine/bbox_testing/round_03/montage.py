"""One picture per document for the boxes the alignment report flags - so the eye checks 47 documents
without opening a crop per field.

  python bbox_testing/round_03/montage.py DMS-106 [DMS-107 ...] [--fields=a,b] [--all] [--with-page]

Each row is a strip of the clean source page around one stored box (nothing is drawn over the glyphs,
the box is outlined: red = value box, blue = 1 line above/below where an off-line box may belong),
headed with `page:field  state  cov  value`. Rows are ordered by flag severity. Written to
crops/DMS-<id>_flags.jpg; --all draws every box, not just the flagged ones.

`--with-page` puts the pipeline's own overlay of each selected page at the top of the sheet, so one image
read satisfies the protocol (open every selected page) *and* carries the per-field evidence underneath.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from align import SRC, ROUND, boxes_of, check_box, page_image, row_cell_check  # noqa: E402

PAD_X, PAD_LINES, MAXW = 0.035, 1.5, 760
FONT = ImageFont.load_default()
_CACHE = {}


def strip(mask, img, box, state, label):
    H, W = img.size[1], img.size[0]
    x0, y0, w, h = box[0] * W, box[1] * H, box[2] * W, box[3] * H
    pad_y = PAD_LINES * h
    crop = img.crop((max(0, int(x0 - PAD_X * W)), max(0, int(y0 - pad_y)),
                     min(W, int(x0 + w + PAD_X * W)), min(H, int(y0 + h + pad_y)))).convert("RGB")
    z = max(1, min(4, (MAXW * 3) // max(1, crop.width)))
    if z > 1:
        crop = crop.resize((crop.width * z, crop.height * z), Image.LANCZOS)
    if crop.width > MAXW:                      # a wide strip at 4x is just the page again
        z2 = MAXW / crop.width
        crop = crop.resize((MAXW, max(1, int(crop.height * z2))), Image.LANCZOS)
    ox, oy = max(0, int(x0 - PAD_X * W)) * z, max(0, int(y0 - pad_y)) * z
    d = ImageDraw.Draw(crop)
    d.rectangle([x0 * z - ox, y0 * z - oy, (x0 + w) * z - ox, (y0 + h) * z - oy],
                outline=(255, 0, 0), width=2)
    return crop, f"{label}  {state}  {'' if state.startswith('ok') else 'cov='}"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    want_all = "--all" in sys.argv
    with_page = "--with-page" in sys.argv
    only = None
    for a in sys.argv[1:]:
        if a.startswith("--fields="):
            only = set(a.split("=", 1)[1].split(","))
    for doc in args:
        doc = doc if doc.startswith("DMS-") else f"DMS-{doc}"
        rows = []
        want = [b for b in boxes_of(doc) if not only or b[1].split(".")[0] in only]
        allb = boxes_of(doc)
        by_page = {}
        for item in want:
            by_page.setdefault(item[0], []).append(item)
        for page, items in by_page.items():
            p = os.path.join(SRC, f"{doc}_p{page}.png")
            if not os.path.exists(p):
                continue
            fields = [i[2] for i in items if '.' not in i[1] and not i[1].startswith('line_')]
            got = page_image(doc, page, [i[2] for i in items], guard_boxes=fields)
            if got is None:
                continue
            img, mask, ang, turned = got        # same frame the pipeline drew (or turned) the boxes in
            for (_, name, box, raw), tbox in zip(items, turned):
                if name.startswith("line_"):    # a row box is judged against its cells, not against pixels
                    got2 = row_cell_check(allb, name.split("_")[1])
                    if got2 is None or (got2[0] == "ok" and not want_all):
                        continue
                    strip_img, head = strip(mask, img, tbox, f"{got2[0]} cov={got2[1]:.0%}",
                                            f"{name}={str(raw)[:22]}")
                    rows.append((0, strip_img, head))
                    continue
                state, cov, _, _ = check_box(mask, tbox)
                if not want_all and state.startswith(("ok", "partial_low")):
                    continue
                strip_img, head = strip(mask, img, tbox,
                                        f"{state} cov={cov:.0%}" if state != "ok" else "ok",
                                        f"{name}={str(raw)[:22]}")
                rows.append((0 if state == "ok" else 1, strip_img, head))
        if not rows:
            print(f"{doc}: no flagged box")
            continue
        rows.sort(key=lambda r: r[0])
        if with_page:            # protocol: the whole page first, then the boxes that need adjudication
            seen = set()
            for page, _, _, _ in want:
                ov = os.path.join(ROUND, "rendered", f"{doc}_p{page}_bbox.png")
                if page in seen or not os.path.exists(ov):
                    continue
                seen.add(page)
                im = Image.open(ov).convert("RGB")
                z = min(1.0, 1000.0 / im.width)
                im = im.resize((int(im.width * z), int(im.height * z)), Image.LANCZOS)
                rows.insert(0, (-1, im, f"p{page} OVERLAY (rendered overlay, {Image.open(ov).size})"))
        gap, head_h = 14, 12
        MAXH = 1900                             # a 9000 px sheet comes back unreadably downscaled:
        sheets = []                             # one image per ~1900 px of evidence
        cur = [0, 0]
        for r in rows:
            if cur[0] and cur[0] + r[1].height + head_h + gap > MAXH:
                sheets.append([])
                cur = [0, 0]
            if not sheets:
                sheets.append([])
            sheets[-1].append(r)
            cur[0] += r[1].height + head_h + gap
            cur[1] = max(cur[1], r[1].width)
        for si, sheet in enumerate(sheets, 1):
            cols = 2 if sum(r[1].height + head_h + gap for r in sheet) > 950 else 1
            buckets = [[] for _ in range(cols)]
            for i, r in enumerate(sheet):
                buckets[i % cols].append(r)
            col_h = [sum(r[1].height + head_h + gap for r in b) for b in buckets]
            col_w = [max([r[1].width for r in b] or [0]) for b in buckets]
            canvas = Image.new("RGB", (sum(col_w) + gap * (cols - 1), max(col_h)), "white")
            d = ImageDraw.Draw(canvas)
            x = 0
            for b, cw in zip(buckets, col_w):
                y = 0
                for _, im, head in b:
                    d.text((x + 2, y), head, fill=(180, 0, 0))
                    canvas.paste(im, (x, y + head_h))
                    y += im.height + head_h + gap
                x += cw + gap
            out = os.path.join(ROUND, "crops", f"{doc}_flags.jpg" if si == 1 else f"{doc}_flags{si}.jpg")
            canvas.save(out, "JPEG", quality=85)
            print(f"{out} rows={len(sheet)} {canvas.size}")


if __name__ == "__main__":
    main()
