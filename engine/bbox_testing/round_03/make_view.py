"""Make small readable copies of the BBox overlays for visual review.

The plan requires opening every selected page's overlay. The originals are 130 DPI PNGs (~2-4 MB);
reading them straight into the session burns the context budget, so this writes ~1000 px JPEG copies
into view/ next to them. Geometry judgement (box placement, coverage, clipping) is what the eye is
for here; when a digit must be checked the reviewer opens the full PNG or the source image instead.
"""
import json
import os
import sys

from PIL import Image

ROUND = os.path.dirname(os.path.abspath(__file__))
VIEW = os.path.join(ROUND, "view")
MAX_W = 1000


def main():
    os.makedirs(VIEW, exist_ok=True)
    prog = json.load(open(os.path.join(ROUND, "progress.json"), encoding="utf-8"))
    made = skipped = 0
    for doc_id, info in sorted(prog["docs"].items()):
        pages = [(int(p), "sel") for p in info["selected_pages"]]
        fu = info.get("first_unselected_page_to_view")
        if fu:
            pages.append((int(fu), "unsel"))
        for page, kind in pages:
            src = os.path.join(ROUND, "rendered", f"{doc_id}_p{page}_bbox.png")
            dst = os.path.join(VIEW, f"{doc_id}_p{page}_{kind}.jpg")
            if not os.path.exists(src):
                # unselected pages carry no boxes, so there is no overlay to look at: the plan asks whether
                # the page really is not an invoice, and that question is answered on the clean page.
                src_plain = os.path.join(ROUND, "..", "source_images", f"{doc_id}_p{page}.png")
                src = src_plain if os.path.exists(src_plain) else None
            if src is None:
                print(f"[MISSING] {doc_id} p{page}")
                continue
            if os.path.exists(dst):
                skipped += 1
                continue
            img = Image.open(src)
            if img.width > MAX_W:
                img = img.resize((MAX_W, int(img.height * MAX_W / img.width)), Image.LANCZOS)
            img.convert("RGB").save(dst, "JPEG", quality=80)
            made += 1
    print(f"view images: {made} new, {skipped} already there -> {VIEW}")


if __name__ == "__main__":
    sys.exit(main())
