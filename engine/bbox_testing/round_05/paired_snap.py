"""The paired version of the R4-3c measurement: the same model answers, snapped and un-snapped.

``ab_measure.py`` compares two pipeline runs and therefore carries the model's own variance - R4-7 measured
that a document's defect count swings by up to 9 between two runs of identical code, and this arm showed it
(DMS-159: 3 defects in one off-arm run, 18 in the next).  The snap is pure geometry applied *after* the
answer, so its effect can be measured with that variance removed: take the boxes the OFF arm delivered,
replay the engine's own correction on them, and score both box sets with the same two rulers.

The replay is the engine's code path, not an approximation of it: the page rendered at the engine's DPI
(``extract_dpi``), :func:`ink_mask` over it, :func:`snap_box_to_ink`, then the same px -> normalised maths
(``rotate_px_box_back`` with ``M=None``, which is the case for every page here - all six documents were
delivered unrotated).  Row boxes are left alone, exactly as in ``_rf``: only field and cell boxes are snapped.

  python bbox_testing/round_05/paired_snap.py [docs...]      # default: every doc in snap_off/run1

Reads Paperless download-only (read-only) and writes payloads under ``round_05/align/``.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(HERE))

import ab_measure as A                                        # noqa: E402
import ink_check as IC                                        # noqa: E402
from system_a.envfile import load_env                         # noqa: E402

load_env()
from system_a.container import Settings, build_paperless      # noqa: E402
from system_a.perception.coords import ink_mask, rotate_px_box_back, snap_box_to_ink   # noqa: E402

SRC_ARM = os.environ.get("PAIR_ARM", "snap_off")            # raw model boxes = the off arm's payload
SRC_RUN = int(os.environ.get("PAIR_RUN", "1"))               # which run of that arm to pair on
ALIGN = ROOT / "bbox_testing" / "round_03" / "align.py"
CELLS = A.CELLS


def page_mask(fitz_doc, page_no: int, dpi: int) -> np.ndarray:
    """The engine's own ink map of a page: what it renders for the model, thresholded by Otsu."""
    from PIL import Image
    import io
    img = Image.open(io.BytesIO(fitz_doc[page_no - 1].get_pixmap(dpi=dpi).tobytes("png"))).convert("RGB")
    return ink_mask(img)


def snap_box(box, mask):
    """One normalised xywh box through the engine's correction; (new_box, moved_px)."""
    H, W = mask.shape[:2]
    x, y, w, h = box
    px = [x * W, y * H, (x + w) * W, (y + h) * H]
    new, note = snap_box_to_ink(px, mask)
    bbox, _rbox = rotate_px_box_back(new, W, H, W, H, None)
    moved = max(abs(a - b) for a, b in zip(px, [new[0], new[1], new[2], new[3]]))
    return list(bbox), (0 if note == "unchanged" else moved)


def build_snapped(payload: dict, masks: dict) -> tuple[dict, int, int]:
    """Same payload, every field/cell box corrected; row boxes untouched (that is what ``_rf`` does)."""
    moved = total = 0
    out = json.loads(json.dumps(payload))
    for f in (out.get("fields") or {}).values():
        total += 1
        box, mv = snap_box(f["bbox"], masks[int(f.get("page_no") or 1)])
        f["bbox"] = box
        moved += 1 if mv else 0
    for item in out.get("line_items") or []:
        page = int(item.get("page_no") or 1)
        for cell in CELLS:
            v = item.get(cell)
            if not isinstance(v, dict) or not v.get("bbox"):
                continue
            total += 1
            box, mv = snap_box(v["bbox"], masks[page])
            v["bbox"] = box
            moved += 1 if mv else 0
    return out, moved, total


def empty_of(payload: dict, doc: int) -> tuple[int, int]:
    """Field/cell boxes with no dark pixel under them - the same rule as ``ink_check.empty_ratio``."""
    masks, empty, total = {}, 0, 0
    boxes = [(int(f.get("page_no") or 1), f["bbox"]) for f in (payload.get("fields") or {}).values()
             if f.get("bbox")]
    for item in payload.get("line_items") or []:
        page = int(item.get("page_no") or 1)
        boxes += [(page, v["bbox"]) for c in CELLS
                  if isinstance(v := (item.get(c) or {}), dict) and v.get("bbox")]
    for page, (x, y, w, h) in boxes:
        if w <= 0 or h <= 0:
            continue
        total += 1
        mask = masks.setdefault(page, IC.render(doc, page, 0))
        if mask is None:
            return None
        H, W = mask.shape
        x1, y1 = max(0, int(x * W)), max(0, int(y * H))
        x2, y2 = min(W, int((x + w) * W)), min(H, int((y + h) * H))
        if x2 > x1 and y2 > y1 and mask[y1:y2, x1:x2].sum() == 0:
            empty += 1
    return empty, total


def align_states(dest: Path, docs) -> dict:
    """{doc: {box_name: flagged?}} - parsed out of the unmodified round-3 ruler's own report."""
    env = dict(__import__("os").environ, AUDIT_ROUND_DIR=str(dest.resolve()))
    proc = subprocess.run([sys.executable, str(ALIGN), *[f"DMS-{d}" for d in docs], "--all"],
                          capture_output=True, text=True, env=env, cwd=str(ROOT))
    states, doc = {}, None
    for line in proc.stdout.splitlines():
        m = re.match(r"== (DMS-\d+)", line)
        if m:
            doc = int(m.group(1).split("-")[1])
            states[doc] = {}
            continue
        row = re.match(r"^ +!?\s*(p\d+):(\S+)", line)      # a row of the --all listing, not a note
        if doc is not None and row and not line.lstrip().startswith("#"):
            states[doc][row.group(2)] = line.startswith("   !")
    return states


def main() -> int:
    docs = [int(v) for v in sys.argv[1:]] or sorted(
        int(p.name.split("-")[1]) for p in (HERE / SRC_ARM / f"run{SRC_RUN}").glob("DMS-*"))
    src_dir = HERE / "align" / f"{SRC_ARM}_run{SRC_RUN}"
    dst_dir = HERE / "align" / f"{SRC_ARM}_run{SRC_RUN}_snapped"
    settings = Settings()
    paperless = build_paperless(settings)
    print(f"paired on the {SRC_ARM}/run{SRC_RUN} payloads ({len(docs)} docs), "
          f"engine frame at {settings.extract_dpi} DPI\n")

    import fitz
    header = (f"{'doc':>8} | {'boxes':>5} {'moved':>5} | {'defect raw':>14} {'defect snapped':>15} "
              f"| {'empty raw':>12} {'empty snapped':>13} | fixed broke")
    print(header)
    tot = dict(boxes=0, moved=0, b_before=0, f_before=0, b_after=0, f_after=0,
               e_before=0, t_before=0, e_after=0, t_after=0, fixed=0, broke=0,
               fixed_rows=0, broke_rows=0)
    for doc in docs:
        src = json.loads((src_dir / "ocr" / f"DMS-{doc}.json").read_text(encoding="utf-8"))
        pdf = paperless.download(doc)
        with fitz.open(stream=pdf, filetype="pdf") as fdoc:
            pages = {int(f.get("page_no") or 1) for f in (src.get("fields") or {}).values()}
            pages |= {int(i.get("page_no") or 1) for i in src.get("line_items") or []}
            masks = {p: page_mask(fdoc, p, settings.extract_dpi) for p in sorted(pages)}
        snapped, moved, total = build_snapped(src, masks)
        (dst_dir / "ocr").mkdir(parents=True, exist_ok=True)
        (dst_dir / "ocr" / f"DMS-{doc}.json").write_text(json.dumps(snapped, ensure_ascii=False), encoding="utf-8")

        before, after = align_states(src_dir, [doc]).get(doc, {}), align_states(dst_dir, [doc]).get(doc, {})
        fixed = sorted(n for n in before if before.get(n) and not after.get(n, False))
        broke = sorted(n for n in after if after.get(n) and not before.get(n, False))
        bb, fb = len(before), sum(before.values())
        ba, fa = len(after), sum(after.values())
        er, tr = empty_of(src, doc)
        es, ts = empty_of(snapped, doc)
        print(f"DMS-{doc:>4} | {total:>5} {moved:>5} | {fb:>5}/{bb:<3} {fb / max(1, bb) * 100:>5.1f}% "
              f"{fa:>5}/{ba:<3} {fa / max(1, ba) * 100:>5.1f}% | "
              f"{er:>5}/{tr:<3} {er / max(1, tr) * 100:>5.1f}% {es:>5}/{ts:<3} {es / max(1, ts) * 100:>5.1f}% "
              f"| {len(fixed):>2} {len(broke):>2}")
        if fixed or broke:
            print(f"           fixed: {', '.join(fixed) or '-'}   broke: {', '.join(broke) or '-'}")
        for k, v in (("boxes", total), ("moved", moved), ("b_before", bb), ("f_before", fb),
                     ("b_after", ba), ("f_after", fa), ("e_before", er), ("t_before", tr),
                     ("e_after", es), ("t_after", ts), ("fixed", len(fixed)), ("broke", len(broke)),
                     ("fixed_rows", sum(n.startswith("line_") for n in fixed)),
                     ("broke_rows", sum(n.startswith("line_") for n in broke))):
            tot[k] += v
    print(f"\nALL      | {tot['boxes']:>5} {tot['moved']:>5} | {tot['f_before']:>5}/{tot['b_before']:<3} "
          f"{A.rate(tot['f_before'], tot['b_before']):>5.1f}% {tot['f_after']:>5}/{tot['b_after']:<3} "
          f"{A.rate(tot['f_after'], tot['b_after']):>5.1f}% | {tot['e_before']:>5}/{tot['t_before']:<3} "
          f"{A.rate(tot['e_before'], tot['t_before']):>5.1f}% {tot['e_after']:>5}/{tot['t_after']:<3} "
          f"{A.rate(tot['e_after'], tot['t_after']):>5.1f}% | {tot['fixed']:>2} {tot['broke']:>2}")
    print(f"\ndefect rate {A.rate(tot['f_before'], tot['b_before']):.1f}% -> "
          f"{A.rate(tot['f_after'], tot['b_after']):.1f}% on identical answers "
          f"({tot['moved']}/{tot['boxes']} boxes actually moved: {tot['fixed']} fixed, {tot['broke']} broken)")
    print(f"of the changed verdicts, {tot['broke_rows']} are `line_N` row boxes that stopped containing their "
          f"own cells (arithmetic, not pixels: only cells are snapped) and {tot['fixed_rows']} row boxes started")
    print(f"empty  rate {A.rate(tot['e_before'], tot['t_before']):.1f}% -> "
          f"{A.rate(tot['e_after'], tot['t_after']):.1f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
