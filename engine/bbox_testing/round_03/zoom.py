"""Evidence crop for the visual audit: zoom one normalised region out of a rendered overlay
or the clean source page, at up to 3x, into crops/.

  python bbox_testing/round_03/zoom.py <DMS-id> <page> <x,y,w,h> [src|ov|rect] [name] [more_boxes...]

`ov` (default) crops round_03/rendered/<id>_p<page>_bbox.png so the box and the text under it are
seen together; `src` crops bbox_testing/source_images/<id>_p<page>.png (no boxes) - the plan's
trigger (i)/(ii)/(iii) cases. `rect` crops the clean source page and draws the given box(es) as a
thin outline with no label text on top - the labels the pipeline draws can hide the very glyphs
whose coverage is in question. Plan §5.3 requires crops to live in crops/.
"""
import os
import sys

from PIL import Image, ImageDraw

ROUND = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROUND, "..", "source_images")
MAXW = 1500
COLORS = [(255, 0, 0), (0, 90, 255), (0, 160, 0), (200, 0, 200), (255, 140, 0)]


def main():
    doc, page, box = sys.argv[1], int(sys.argv[2]), [float(v) for v in sys.argv[3].split(",")]
    kind = sys.argv[4] if len(sys.argv) > 4 else "ov"
    name = sys.argv[5] if len(sys.argv) > 5 else f"z{box[0]:.2f}_{box[1]:.2f}"
    rects = [box] + [[float(v) for v in s.split(",")] for s in sys.argv[6:]]
    path = (os.path.join(ROUND, "rendered", f"{doc}_p{page}_bbox.png") if kind == "ov"
            else os.path.join(SRC, f"{doc}_p{page}.png"))
    if not os.path.exists(path):
        print(f"[MISSING] {path}")
        return 1
    img = Image.open(path)
    W, H = img.size
    x, y, w, h = box
    px = (int(x * W), int(y * H), min(W, int((x + w) * W)), min(H, int((y + h) * H)))
    crop = img.crop(px).convert("RGB")
    z = max(1, min(3, MAXW // max(1, crop.width)))
    if z > 1:
        crop = crop.resize((crop.width * z, crop.height * z), Image.LANCZOS)
    if kind == "rect":
        draw = ImageDraw.Draw(crop)
        for i, extra in enumerate(rects):
            bx, by, bw, bh = extra
            r = (int((bx * W - px[0]) * z), int((by * H - px[1]) * z),
                 int(((bx + bw) * W - px[0]) * z), int(((by + bh) * H - px[1]) * z))
            draw.rectangle(r, outline=COLORS[i % len(COLORS)], width=2)
    out = os.path.join(ROUND, "crops", f"{doc}_p{page}_{name}.jpg")
    crop.save(out, "JPEG", quality=88)
    print(f"{out}  page={W}x{H} px_box={px} zoom={z}x size={crop.size}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
