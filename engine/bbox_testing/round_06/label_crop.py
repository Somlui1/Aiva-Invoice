"""Crop the top-right corner of a page: where เล่มที่ / เลขที่ live on the Mongkonchai form."""
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

PAP = build_paperless(Settings())
OUT = HERE / "source_images" / "labels_300"
OUT.mkdir(parents=True, exist_ok=True)

for did in [int(a) for a in sys.argv[1:]] or [237]:
    doc = fitz.open(stream=PAP.download(did), filetype="pdf")
    pg = doc[0]
    scale = 300 / 72
    # top-right quarter: the two number labels on this form
    clip = fitz.Rect(pg.rect.width * 0.60, 0, pg.rect.width, pg.rect.height * 0.32)
    pix = pg.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip)
    f = OUT / f"DMS-{did}-right-300.png"
    pix.save(f)
    print(f"DMS-{did}: {f.name} {pix.width}x{pix.height}")
