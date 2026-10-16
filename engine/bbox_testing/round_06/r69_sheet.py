"""Build one inspection sheet per document for the R6-9 forensics.

For every key field whose value changed between two identical runs, one image shows: the whole page (small -
to answer "does this page print several numbers that could be confused?") and next to it the printed value
zoomed, cropped where the engine claimed to have read it, with margin so the label above it is visible.

The ground truth is produced by reading these with human (or model-as-eyeball) vision, not by asking the same
extraction model a third time - a third opinion from the thing under test is not evidence.

  python bbox_testing/round_06/r69_sheet.py                # all disputed documents
  python bbox_testing/round_06/r69_sheet.py 76 175         # a subset
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
SRC = HERE.parents[0] / "source_images"
OUT = HERE / "r69_sheets"
GAP, PAGE_W, LABEL = 12, 760, 18


def crop_zoom(page: Image.Image, bbox, pad_x=0.045, pad_y=0.035, scale=4):
    """The value, as printed: the engine's own box plus room for the label around it, enlarged."""
    x, y, w, h = bbox
    l = max(0, int((x - pad_x) * page.width))
    t = max(0, int((y - pad_y) * page.height))
    r = min(page.width, int((x + w + pad_x) * page.width))
    b = min(page.height, int((y + h + pad_y * 3) * page.height))
    c = page.crop((l, t, r, b))
    return c.resize((c.width * scale, c.height * scale), Image.LANCZOS)


def main() -> int:
    wanted = {int(v) for v in sys.argv[1:] if v.isdigit()}
    disputed = json.loads((HERE / "r69_disputed.json").read_text(encoding="utf-8"))
    by_doc = {}
    for row in disputed:
        by_doc.setdefault(row["doc"], []).append(row)
    OUT.mkdir(exist_ok=True)
    made = []
    for doc in sorted(by_doc):
        if wanted and doc not in wanted:
            continue
        rows = by_doc[doc]
        # the page the value was actually read from, as the run recorded it
        page_no = rows[0].get("page") or (rows[0].get("pages") or [1])[0]
        page_img = SRC / f"DMS-{doc}_p{page_no}.png"
        if not page_img.exists():
            print(f"DMS-{doc}: no source image at {page_img.name}, skipped")
            continue
        page = Image.open(page_img).convert("RGB")
        scale = PAGE_W / page.width
        small = page.resize((PAGE_W, int(page.height * scale)))

        crops = []
        for row in rows:
            av = (row["a"] or "<absent>")[:30]
            bv = (row["b"] or "<absent>")[:30]
            title = f"DMS-{doc} {row['field']}   A='{av}'   B='{bv}'"
            if row.get("bbox"):
                c = crop_zoom(page, row["bbox"])
            else:          # no box in either run: show the top third, where these fields normally live
                c = page.crop((0, 0, page.width, int(page.height * 0.35)))
                c = c.resize((int(c.width * 1.6), int(c.height * 1.6)), Image.LANCZOS)
                title += "   (engine gave no box: showing upper third)"
            strip = Image.new("RGB", (max(c.width, 420), c.height + LABEL + 4), "white")
            d = ImageDraw.Draw(strip)
            d.rectangle([0, 0, strip.width, LABEL], fill=(30, 30, 30))
            d.text((4, 3), title, fill="white")
            strip.paste(c, (0, LABEL + 4))
            crops.append(strip)

        col_w = max([small.width] + [c.width for c in crops])
        height = small.height + sum(c.height + GAP for c in crops) + GAP * 2
        sheet = Image.new("RGB", (col_w, height), "white")
        sheet.paste(small, (0, 0))
        d = ImageDraw.Draw(sheet)
        d.text((4, small.height + 2), f"{page_img.name}  (whole page: how many candidate numbers are printed?)",
               fill="black")
        y = small.height + LABEL
        for c in crops:
            sheet.paste(c, (0, y))
            y += c.height + GAP
        out = OUT / f"DMS-{doc}.png"
        sheet.save(out)
        made.append((doc, len(rows), out.name))

    print(f"sheets built: {len(made)}")
    for doc, n, name in made:
        print(f"  DMS-{doc:<4} {n} disputed field(s) -> r69_sheets/{name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
