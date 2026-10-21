"""Measure where the printed ink actually is, to settle "does this box cover the value?".

The eye decides whether a box is wrong (plan §6). This only quantifies the two questions the eye
cannot answer off a 1000 px thumbnail: where does the text line in this y-band start/end, and how
much of it sits inside the box. Columns are ink when a pixel is darker than --thresh after a
row-min projection, so shaded table headers do not count as text.

  python bbox_testing/round_03/measure.py <DMS-id> <page> <y0,y1> [--box x,y,w,h] [--src] [--gap 0.008]
"""
import os
import sys

from PIL import Image

ROUND = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROUND, "..", "source_images")


def load(doc, page, use_src):
    p = (os.path.join(SRC, f"{doc}_p{page}.png") if use_src
         else os.path.join(ROUND, "rendered", f"{doc}_p{page}_bbox.png"))
    return Image.open(p).convert("L"), p


def columns(img, y0, y1, thresh=140):
    W, H = img.size
    px = img.load()
    r0, r1 = max(0, int(y0 * H)), min(H, int(y1 * H))
    dark = []
    for c in range(W):
        hit = False
        for r in range(r0, r1):
            if px[c, r] < thresh:
                hit = True
                break
        dark.append(hit)
    return dark


def segments(dark, W, gap_frac=0.008):
    gap = max(1, int(gap_frac * W))
    segs, start, blank = [], None, 0
    for c, hit in enumerate(dark):
        if hit:
            if start is None:
                start = c
            blank = 0
        elif start is not None:
            blank += 1
            if blank >= gap:
                segs.append((start, c - blank))
                start, blank = None, 0
    if start is not None:
        segs.append((start, W - 1))
    return [(s / W, (e + 1) / W) for s, e in segs if e > s]


def main():
    doc, page, band = sys.argv[1], int(sys.argv[2]), [float(v) for v in sys.argv[3].split(",")]
    args = sys.argv[4:]
    box, use_src, gap, thresh = None, False, 0.008, 140
    while args:
        a = args.pop(0)
        if a == "--box":
            box = [float(v) for v in args.pop(0).split(",")]
        elif a == "--src":
            use_src = True
        elif a == "--gap":
            gap = float(args.pop(0))
        elif a == "--thresh":
            thresh = int(args.pop(0))
    img, path = load(doc, page, use_src)
    W, H = img.size
    y0, y1 = band
    if box and len(band) == 2 and band[1] <= band[0]:
        y0, y1 = box[1] - 0.004, box[1] + box[3] + 0.004
    dark = columns(img, y0, y1, thresh)
    segs = segments(dark, W, gap)
    print(f"{doc} p{page} band y={y0:.3f}..{y1:.3f} src={use_src} thresh={thresh}")
    for s, e in segs:
        tag = ""
        if box:
            inside = max(0.0, min(e, box[0] + box[2]) - max(s, box[0]))
            tag = (f"  cover={inside / max(1e-9, e - s):.0%} of segment | "
                   f"box_outside_segment={max(0.0, (box[2]) - inside) / box[2]:.0%}")
        print(f"   seg {s:.3f}..{e:.3f} (w={e - s:.3f}){tag}")
    if box:
        print(f"   box x={box[0]:.3f}..{box[0] + box[2]:.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
