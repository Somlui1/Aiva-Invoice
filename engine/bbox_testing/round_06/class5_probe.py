"""Earn the classification for the seven documents whose supplier_tax_id appeared in one run and not the other.

My first guess was faded ink or a stamp over the number - a MODEL_LIMIT.  The header strips said otherwise:
every one of these pages prints the issuer's own tax id, legibly.  So the label has to be earned by trying to
fix it, at least twice, and recording what each attempt did.

  attempt 1: the shipped prompt (single-pass-extract@1.5.0), which now tells the model to look for the
             issuer's id on the small line under its address - exactly where these ids sit.  Two runs each.
  attempt 2: more pixels - render at 300 DPI instead of the production 150.

Delivered values are compared against what the printed page shows (read by eye from a zoomed crop, not from
the model).  A value that matches the page is a correct read even if the format flag fires, because the page
itself may print something malformed.

  python bbox_testing/round_06/class5_probe.py
"""
import concurrent.futures
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SRC = HERE.parents[0] / "source_images"
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):                     # pragma: no cover
    pass

from dataclasses import replace                          # noqa: E402
from system_a.envfile import load_env                    # noqa: E402

load_env()
from system_a.container import Settings, build_perception, build_paperless  # noqa: E402

DOCS = [31, 92, 94, 96, 98, 149, 182]
#: read from the rendered page, by eye, at 4x - not from the model
PRINTED = {31: "0115554004198", 92: "0105562195321", 94: "0105540008838", 96: "0115549004428",
           98: "0105562195321", 149: "0105562195321", 182: "0105540008838"}
# where each id sits on its page, as a fraction of the page, for the zoom crop
WHERE = {31: (0.26, 0.108, 0.72, 0.018), 92: (0.16, 0.075, 0.50, 0.02), 94: (0.05, 0.068, 0.46, 0.014),
         96: (0.62, 0.105, 0.34, 0.016), 98: (0.16, 0.075, 0.50, 0.02), 149: (0.16, 0.075, 0.50, 0.02),
         182: (0.05, 0.068, 0.46, 0.014)}


def zoom(doc, box, scale=5):
    """A labelled 5x crop of the printed line, for checking my own reading of the number."""
    page = Image.open(SRC / f"DMS-{doc}_p1.png").convert("RGB")
    x, y, w, h = box
    c = page.crop((int(x * page.width), int(y * page.height),
                   int((x + w) * page.width), int((y + h * 3) * page.height)))
    c = c.resize((c.width * scale, c.height * scale), Image.LANCZOS)
    return c


def sheet():
    panels = [zoom(d, WHERE[d]) for d in DOCS]
    w = max(p.width for p in panels)
    out = Image.new("RGB", (w, sum(p.height + 26 for p in panels) + 8 * len(panels)), "white")
    d = ImageDraw.Draw(out)
    y = 0
    for doc, p in zip(DOCS, panels):
        d.rectangle([0, y, w, y + 24], fill=(15, 15, 15))
        d.text((6, y + 6), f"DMS-{doc} printed line, 5x  (my reading was: {PRINTED[doc]})", fill="white")
        out.paste(p, (0, y + 26))
        y += p.height + 34
    path = HERE / "r69_sheets" / "class5_printed_ids_5x.png"
    out.save(path)
    print(f"zoom sheet for checking my own reading -> {path.relative_to(ROOT)}")


def read_once(doc, dpi):
    s = replace(Settings(), mode="production", perception_engine="single_pass")
    cached = ROOT / ".cache" / "downloads" / f"DMS-{doc}.pdf"
    pdf = cached.read_bytes() if cached.exists() else build_paperless(s).download(doc)
    pipe = build_perception(s)
    pipe.dpi = dpi    # the production prompt and the production code: only the render resolution differs
    ext = pipe.extract(pdf, package_id=f"PKG-{doc}", dms_doc_id=str(doc))
    f = ext.fields.get("supplier_tax_id")
    warns = [w for w in (ext.extra.get("format_warnings") or []) if w["field"] == "supplier_tax_id"]
    return doc, (getattr(f, "raw", None) if f else None), warns


def attempt(label, dpi, runs):
    print(f"\n=== {label} (render {dpi} DPI, {runs} run(s) per document) ===")
    results = {}
    for r in range(runs):
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            for doc, raw, warns in pool.map(lambda d: read_once(d, dpi), DOCS):
                results.setdefault(doc, []).append((raw, warns))
    good = missing = wrong = 0
    for doc in DOCS:
        got = [raw for raw, _ in results[doc]]
        ok = [g for g in got if (g or "").replace(" ", "").replace("-", "") == PRINTED[doc]]
        delivered = [g for g in got if g]
        good += len(ok)
        missing += len(got) - len(delivered)
        wrong += len(delivered) - len(ok)
        flag = "" if not results[doc][0][1] else "  [format flag fired]"
        print(f"  DMS-{doc:<4} printed {PRINTED[doc]} -> runs gave {got}{flag}   "
              f"{'correct ' + str(len(ok)) + '/' + str(runs) if ok else ('no value ' + str(len(got) - len(delivered)) + '/' + str(runs) if not delivered else 'wrong value')}")
    print(f"  totals: correct {good}, no value {missing}, wrong value {wrong} of {len(DOCS) * runs} reads")
    return results


def main() -> int:
    sheet()
    a1 = attempt("attempt 1 - shipped prompt 1.5.0", 150, 2)
    a2 = attempt("attempt 2 - more pixels", 300, 2)
    out = HERE / "class5_probe.json"
    out.write_text(json.dumps({"attempt1_150dpi": {str(k): v for k, v in a1.items()},
                              "attempt2_300dpi": {str(k): v for k, v in a2.items()}},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\ndetail -> {out.name}")
    print("if both attempts still lose the value on some documents, that is the MODEL_LIMIT evidence the plan asks for;")
    print("if they recover it, the honest label for this class is OCR instability, not a legibility limit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
