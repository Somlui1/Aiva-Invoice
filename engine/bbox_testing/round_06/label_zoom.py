"""Which label sits next to which number?  Needed before the ambiguity policy can be written into a prompt.

130 DPI cannot separate เลขที่ from เล่มที่ - the difference is one mark and one small consonant, and upscaling a
130 DPI PNG invents no detail (that is the lesson R6-12 taught me when I mis-read a tax id off a shrunk montage).
So these crops are rendered from the PDF at 300 DPI and read by eye.

  python bbox_testing/round_06/label_zoom.py 236 237 159
"""
import sys
from pathlib import Path

import pymupdf as fitz

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass
from system_a.envfile import load_env                                   # noqa: E402

load_env()
from system_a.container import Settings, build_paperless                # noqa: E402

PDFS = HERE / "source_images" / "labels_300"
PDFS.mkdir(parents=True, exist_ok=True)
PAP = build_paperless(Settings())


def pdf_bytes(did: int) -> bytes:
    return PAP.download(did)


for did in [int(a) for a in sys.argv[1:]] or [236, 237, 159]:
    doc = fitz.open(stream=pdf_bytes(did), filetype="pdf")
    page = doc[0]
    scale = 300 / 72
    full = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
    out = PDFS / f"DMS-{did}-p1-300.png"
    full.save(out)
    print(f"DMS-{did}: {out.name} {full.width}x{full.height}")
    # the top 40% of the page carries both header and (for DMS-159) the first table rows
    crop = page.get_pixmap(matrix=fitz.Matrix(scale, scale),
                           clip=fitz.Rect(0, 0, page.rect.width, page.rect.height * 0.42))
    c2 = PDFS / f"DMS-{did}-top-300.png"
    crop.save(c2)
    print(f"          {c2.name} {crop.width}x{crop.height}")
