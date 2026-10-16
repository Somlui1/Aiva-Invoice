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
MODES = os.environ.get("PAIR_MODES", "off,move,grow,both").split(",")  # R4-9: price each knob, plus a control
#   off  = control arm: the replay machinery runs, nothing is corrected. Any verdict flip here is the
#          instrument, not the correction - it is the paired measurement's own noise floor.
ALIGN = ROOT / "bbox_testing" / "round_03" / "align.py"
CELLS = A.CELLS


def page_mask(fitz_doc, page_no: int, dpi: int) -> np.ndarray:
    """The engine's own ink map of a page: what it renders for the model, thresholded by Otsu."""
    from PIL import Image
    import io
    img = Image.open(io.BytesIO(fitz_doc[page_no - 1].get_pixmap(dpi=dpi).tobytes("png"))).convert("RGB")
    return ink_mask(img)


def snap_box(box, mask, mode: str = "both"):
    """One normalised xywh box through the engine's correction; (new_box, moved_px).

    ``mode`` is the R4-9 knob setting (both / move / grow): the same code the pipeline runs, with the same
    flags it would pass, so an arm measured here is an arm the engine can actually be configured to run.
    """
    H, W = mask.shape[:2]
    x, y, w, h = box
    px = [x * W, y * H, (x + w) * W, (y + h) * H]
    new, note = snap_box_to_ink(px, mask, move=mode in ("both", "move"), grow=mode in ("both", "grow"))
    if note == "unchanged":
        return list(box), 0        # same rule as the engine: nothing acted on is not re-measured
    bbox, _rbox = rotate_px_box_back(new, W, H, W, H, None)
    moved = max(abs(a - b) for a, b in zip(px, [new[0], new[1], new[2], new[3]]))
    return list(bbox), (0 if note == "unchanged" else moved)


def _union(row, cell):
    return (min(row[0], cell[0]), min(row[1], cell[1]),
            max(row[0] + row[2], cell[0] + cell[2]), max(row[1] + row[3], cell[1] + cell[3]))


def build_snapped(payload: dict, masks: dict, mode: str = "both") -> tuple[dict, int, int]:
    """Same payload, every field/cell box corrected; the row box then follows the cells it was drawn around.

    That second half is what the engine does since R4-9 (``PageAnswer.region(..., contains=cells)``): only
    cells are corrected against ink, so a row that does not follow its own cells reports as broken.
    """
    moved = total = 0
    out = json.loads(json.dumps(payload))
    for f in (out.get("fields") or {}).values():
        total += 1
        box, mv = snap_box(f["bbox"], masks[int(f.get("page_no") or 1)], mode)
        f["bbox"] = box
        moved += 1 if mv else 0
    for item in out.get("line_items") or []:
        page = int(item.get("page_no") or 1)
        row_box = item.get("line_bbox")
        grown = list(row_box) if row_box else None
        for cell in CELLS:
            v = item.get(cell)
            if not isinstance(v, dict) or not v.get("bbox"):
                continue
            total += 1
            drawn = v["bbox"]
            box, mv = snap_box(drawn, masks[page], mode)
            v["bbox"] = box
            moved += 1 if mv else 0
            if grown and drawn[1] < row_box[1] + row_box[3] and drawn[1] + drawn[3] > row_box[1]:
                grown = _union(grown, box)          # the model put this cell inside this row
        if grown and row_box:
            item["line_bbox"] = [grown[0], grown[1], grown[2] - grown[0], grown[3] - grown[1]]
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
    """Score the same boxes once per knob setting, and let the numbers say which knob to keep."""
    docs = [int(v) for v in sys.argv[1:]] or sorted(
        int(p.name.split("-")[1]) for p in (HERE / SRC_ARM / f"run{SRC_RUN}").glob("DMS-*"))
    base_dir = HERE / "align" / f"{SRC_ARM}_run{SRC_RUN}"
    settings = Settings()
    paperless = build_paperless(settings)
    print(f"paired on the {SRC_ARM}/run{SRC_RUN} payloads ({len(docs)} docs), "
          f"engine frame at {settings.extract_dpi} DPI; arms: raw + {', '.join(MODES)}")

    import fitz
    payloads, masks_by_doc = {}, {}
    for doc in docs:
        src = json.loads((base_dir / "ocr" / f"DMS-{doc}.json").read_text(encoding="utf-8"))
        payloads[doc] = src
        with fitz.open(stream=paperless.download(doc), filetype="pdf") as fdoc:
            pages = {int(f.get("page_no") or 1) for f in (src.get("fields") or {}).values()}
            pages |= {int(i.get("page_no") or 1) for i in src.get("line_items") or []}
            masks_by_doc[doc] = {p: page_mask(fdoc, p, settings.extract_dpi) for p in sorted(pages)}

    raw_states = {d: align_states(base_dir, [d]).get(d, {}) for d in docs}
    raw_empty = {d: empty_of(payloads[d], d) for d in docs}
    rows = [("raw", None, None, raw_states, raw_empty)]

    for mode in MODES:
        dest = HERE / "align" / f"{SRC_ARM}_run{SRC_RUN}_{mode}"
        (dest / "ocr").mkdir(parents=True, exist_ok=True)
        snapped, moved, total = {}, 0, 0
        for doc in docs:
            pay, mv, tt = build_snapped(payloads[doc], masks_by_doc[doc], mode)
            snapped[doc] = pay
            moved += mv
            total += tt
            (dest / "ocr" / f"DMS-{doc}.json").write_text(json.dumps(pay, ensure_ascii=False), encoding="utf-8")
        states = {d: align_states(dest, [d]).get(d, {}) for d in docs}
        rows.append((mode, moved, total, states, {d: empty_of(snapped[d], d) for d in docs}))

    # An arm is judged against the "off" row, not against "raw".  The replay rebuilds every row box as the
    # hull of its own cells - which the engine now does in every arm, correction or not - so raw carries a
    # second, unrelated difference (how row boxes are derived).  raw -> off is reported on its own line.
    base = next(r for r in rows if r[0] == "off")
    base_states, base_empty = base[3], base[4]
    print(f"{'arm':>6} | {'moved':>9} | {'defect rate vs baseline':>31} | {'fixed':>5} {'broke':>5} "
          f"{'row broke':>9} | {'empty rate':>18}")
    for mode, moved, total, states, empty in rows:
        b = sum(len(base_states[d]) for d in docs)
        f0 = sum(sum(base_states[d].values()) for d in docs)
        a = sum(len(states[d]) for d in docs)
        f1 = sum(sum(states[d].values()) for d in docs)
        fixed = {d: sorted(n for n in base_states[d] if base_states[d].get(n) and not states[d].get(n, False))
                 for d in docs}
        broke = {d: sorted(n for n in states[d] if states[d].get(n) and not base_states[d].get(n, False))
                 for d in docs}
        nfix, nbrok = sum(len(v) for v in fixed.values()), sum(len(v) for v in broke.values())
        rbrok = sum(sum(n.startswith("line_") for n in v) for v in broke.values())
        e0 = sum(v[0] for v in base_empty.values()); t0 = sum(v[1] for v in base_empty.values())
        e1 = sum(v[0] for v in empty.values()); t1 = sum(v[1] for v in empty.values())
        moved_txt = "    -    " if moved is None else f"{moved:>4}/{total:<4}"
        print(f"{mode:>6} | {moved_txt} | {f0:>6}/{b:<4} {A.rate(f0, b):>5.1f}% -> {f1:>4}/{a:<4} "
              f"{A.rate(f1, a):>5.1f}% ({A.rate(f1, a) - A.rate(f0, b):+.1f} pp) | {nfix:>5} {nbrok:>5} "
              f"{rbrok:>9} | {e0:>5}/{t0:<4} {A.rate(e0, t0):>5.1f}% -> {e1:>4}/{t1:<4} "
              f"{A.rate(e1, t1):>5.1f}%")
        if mode not in ("raw", "off"):
            for d in docs:
                if fixed[d] or broke[d]:
                    fx = ", ".join(fixed[d]) or "-"
                    br = ", ".join(broke[d]) or "-"
                    print(f"       DMS-{d}: fixed [{fx}]  broke [{br}]")

    raw_def = 100 * sum(sum(raw_states[d].values()) for d in docs) / max(1, sum(len(raw_states[d]) for d in docs))
    off_def = 100 * sum(sum(base_states[d].values()) for d in docs) / max(1, sum(len(base_states[d]) for d in docs))
    print("\nraw payload " + f"{raw_def:.1f}% vs off-arm {off_def:.1f}% ({off_def - raw_def:+.1f} pp): "
          "that gap is the row boxes rebuilt as the hull of their own cells - a derivation change, applied "
          "in every arm, not the ink correction")
    print("rate is what decides, never the count (R4-7): same answers, same rulers, only the knobs differ.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
