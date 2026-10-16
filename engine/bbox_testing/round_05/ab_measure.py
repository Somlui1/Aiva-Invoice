"""R4-3c: does the ink snap actually help?  Same documents, n=2 per arm, measured as a RATE.

Why a rate: R4-7 measured that the defect *count* of a full round moves ~70 boxes between two rounds of the
same code, because a count also answers "what did that round read at all".  A rate (flagged / boxes) is the
only form that survives the model returning a different number of rows, and two runs per arm give the noise
floor of this specific comparison - a between-arm difference smaller than that floor proves nothing.

Both metrics are model-free and eye-free, and both are read from the payload the ENGINE delivered (the audit
harness has its own pipeline and never enters ``SinglePassPipeline``, so it cannot see the snap at all):

  empty   a field/cell box with no dark pixel under it      - ``ink_check.empty_ratio``
  defect  align.py's own per-box verdict, flagged / total   - align.py run as a subprocess, unedited, so
            the ruler used here is byte-for-byte the one that scored rounds 1-4

align.py reads a round dir (``ocr/DMS-<id>.json`` in the harness shape), so ``convert()`` rewrites the
engine's ``extraction.json`` into that shape first.  It records ``rotate_degrees: 0`` on purpose: the engine
inverse-rotates every box into the unrotated scan frame (``rotate_px_box_back``), and align measures in the
frame the payload declares - a page the engine actually turned is reported, not quietly measured wrong.

  python bbox_testing/round_05/ab_measure.py                # every doc present in all four run dirs
  python bbox_testing/round_05/ab_measure.py 127 171 159    # or a subset
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(HERE))

import ink_check as IC                                            # noqa: E402

# These reports quote payload values and page notes (Thai text, degree signs, arrows). The console on this
# box is cp874, and one unencodable character in a note used to kill the run *after* the measurement had
# already been printed - the numbers were fine and the exit status said otherwise.
try:
    sys.stdout.reconfigure(errors="replace")
except (AttributeError, ValueError):                              # pragma: no cover - depends on the console
    pass

# The two arms of R4-3c; overridable so the same ruler can compare the arm that ships now ("move") against
# the arm that shipped before it, without editing the measurement.
ARMS = tuple(os.environ.get("AB_ARMS", "snap_on,snap_off").split(","))
RUNS = tuple(int(v) for v in os.environ.get("AB_RUNS", "1,2").split(","))
ALIGN = ROOT / "bbox_testing" / "round_03" / "align.py"
CELLS = ("item_code", "description", "qty", "uom", "unit_price", "amount")


def engine_dirs_exist(docs=None):
    """Docs that ran in every arm/run - a missing doc would silently change what the rate is over."""
    found = None
    for arm in ARMS:
        for run in RUNS:
            got = {int(p.name.split("-")[1]) for p in (HERE / arm / f"run{run}").glob("DMS-*")} if \
                (HERE / arm / f"run{run}").is_dir() else set()
            found = got if found is None else found & got
    return sorted(found if docs is None else set(docs) & (found or set()))


def convert(arm: str, run: int, docs) -> tuple[Path, list[str]]:
    """engine extraction.json -> the round-dir shape align.py measures.  Geometry only, no re-reading."""
    dest = HERE / "align" / f"{arm}_run{run}"
    notes: list[str] = []
    for doc in docs:
        src = HERE / arm / f"run{run}" / f"DMS-{doc}" / "extraction.json"
        if not src.exists():
            notes.append(f"DMS-{doc}: no extraction.json in {arm}/run{run}")
            continue
        j = json.loads(src.read_text(encoding="utf-8"))
        fields = {}
        for name, f in (j.get("fields") or {}).items():
            reg = (f or {}).get("region") or {}
            if reg.get("bbox"):
                fields[name] = {"bbox": reg["bbox"], "page_no": reg.get("page") or 1, "raw": f.get("raw")}
        items = []
        for row in j.get("lines") or []:
            reg = (row or {}).get("region") or {}
            item = {"line_no": row.get("line_no"), "page_no": reg.get("page") or 1}
            if reg.get("bbox"):
                item["line_bbox"] = reg["bbox"]
            for cell in CELLS:
                v = (row.get("cells") or {}).get(cell) or {}
                cr = v.get("region") or {}
                if cr.get("bbox"):
                    item[cell] = {"bbox": cr["bbox"], "raw": v.get("raw")}
                    item["page_no"] = cr.get("page") or item["page_no"]
            items.append(item)
        selected = (j.get("extra") or {}).get("invoice_pages") or []
        for c in (j.get("extra") or {}).get("classify") or []:
            if int(c.get("rotate_degrees") or 0) and int(c.get("page_no") or 0) in selected:
                notes.append(f"DMS-{doc} p{c['page_no']}: engine turned this page {c['rotate_degrees']}\u00b0 "
                             "but delivers its boxes unrotated - align's frame does not apply here")
        payload = {"fields": fields, "line_items": items, "selected_invoice_pages": selected,
                   "meta": {"pages_classification": [{"page_no": c.get("page_no"), "rotate_degrees": 0}
                                                     for c in (j.get("extra") or {}).get("classify") or []]}}
        (dest / "ocr").mkdir(parents=True, exist_ok=True)
        (dest / "ocr" / f"DMS-{doc}.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return dest, notes


def align_counts(dest: Path, docs) -> dict:
    """{doc: (boxes, flagged)} straight out of the unmodified round-3 ruler's own stdout."""
    env = dict(os.environ, AUDIT_ROUND_DIR=str(dest.resolve()))
    # Both directions are pinned to UTF-8: the ruler prints payload text that is Thai, and on a cp874 console
    # it raised inside align.py while printing (killing the round) and, once the child was fixed, again here
    # while *decoding* its stdout.  The ruler itself is still called unedited.
    proc = subprocess.run([sys.executable, str(ALIGN), *[f"DMS-{d}" for d in docs], "--all"],
                          capture_output=True, text=True, encoding="utf-8", errors="replace",
                          env=env, cwd=str(ROOT))
    out = {}
    for line in proc.stdout.splitlines():
        m = re.match(r"== (DMS-\d+) boxes=(\d+) flagged=(\d+)", line)
        if m:
            out[int(m.group(1).split("-")[1])] = (int(m.group(2)), int(m.group(3)))
        elif "not_in_round" in line:
            print(f"   ! align: {line.strip()}")
    if proc.returncode != 0:
        # A round that scored 127 of 223 documents looks exactly like a round with 96 unreadable documents.
        # It is not; it is a crashed ruler.  Refuse the number instead of reporting a rate over a population
        # that silently shrank - that mistake would have been written into the FFR scorecard this morning.
        raise SystemExit(f"align.py exited {proc.returncode}: {(proc.stderr or '').strip()[-600:]}")
    return out


def empty_counts(arm: str, run: int, docs) -> dict:
    """{doc: (empty, total)} - the same metric on both arms, read from the engine payload itself."""
    out = {}
    for doc in docs:
        items, rots = IC.boxes_engine(doc, HERE / arm / f"run{run}")
        got = IC.empty_ratio(items, doc, rots)
        if got is None:
            print(f"   ! DMS-{doc}: no source image, empty metric cannot be measured")
            continue
        out[doc] = got
    return out


def rate(part, whole):
    return 100.0 * part / whole if whole else float("nan")


def main() -> int:
    docs = [int(v) for v in sys.argv[1:]] or engine_dirs_exist()
    if not docs:
        print("nothing measured: no doc ran in all four arm/run directories")
        return 1
    print(f"docs: {', '.join(f'DMS-{d}' for d in docs)}   (n={len(RUNS)} runs per arm)\n")
    rows, notes = [], []
    for arm in ARMS:
        for run in RUNS:
            dest, note = convert(arm, run, docs)
            notes += [f"[{arm} run{run}] {n}" for n in note]
            defects, empties = align_counts(dest, docs), empty_counts(arm, run, docs)
            tb = tf = te = tt = 0
            for doc in docs:
                b, f = defects.get(doc, (0, 0))
                e, t = empties.get(doc, (0, 0))
                tb, tf, te, tt = tb + b, tf + f, te + e, tt + t
                rows.append((arm, run, doc, b, f, e, t))
            rows.append((arm, run, None, tb, tf, te, tt))
    print(f"{'arm':>9} {'run':>4} {'doc':>8} | {'boxes':>5} {'defect':>6} {'defect%':>7} | "
          f"{'empty':>5} {'boxes':>5} {'empty%':>7}")
    for arm, run, doc, b, f, e, t in rows:
        label = "TOTAL" if doc is None else f"DMS-{doc}"
        print(f"{arm:>9} {run:>4} {label:>8} | {b:>5} {f:>6} {rate(f, b):>6.1f}% | "
              f"{e:>5} {t:>5} {rate(e, t):>6.1f}%")
        if doc is None:
            print()

    agg = {}
    for arm, run, doc, b, f, e, t in rows:
        if doc is None:
            agg.setdefault(arm, []).append((b, f, e, t))
    print("arm totals (the number to compare is the RATE, and the two runs are its own noise floor)\n")
    verdict = []
    for arm in ARMS:
        runs = agg.get(arm) or []
        if not runs:
            print(f"{arm:>9} - no run measured")
            continue
        dfec = [rate(f, b) for b, f, _e, _t in runs]
        empt = [rate(e, t) for _b, _f, e, t in runs]
        boxes = sum(b for b, _f, _e, _t in runs)
        flag = sum(f for _b, f, _e, _t in runs)
        ep = sum(e for _b, _f, e, _t in runs)
        tot = sum(t for _b, _f, _e, t in runs)
        agg[arm] = (dfec, empt, rate(flag, boxes), rate(ep, tot))
        print(f"{arm:>9} defect rate pooled {rate(flag, boxes):5.1f}%  ({flag}/{boxes} boxes)"
              f"   per run {' / '.join(f'{v:.1f}%' for v in dfec)}"
              f"   spread {max(dfec) - min(dfec):.1f} pp")
        print(f"{'':>9} empty  rate pooled {rate(ep, tot):5.1f}%  ({ep}/{tot} boxes)"
              f"   per run {' / '.join(f'{v:.1f}%' for v in empt)}"
              f"   spread {max(empt) - min(empt):.1f} pp")
        verdict.append((arm, agg[arm]))
    if len(verdict) == 2 and all(len(agg[a][0]) >= 2 for a, _ in verdict):
        (a, (ad, ae, ap, ep)), (b, (bd, be, bp, eb)) = verdict
        d_defect, d_empty = bp - ap, eb - ep
        floor_d = max(max(ad) - min(ad), max(bd) - min(bd))
        floor_e = max(max(ae) - min(ae), max(be) - min(be))
        print(f"\ndefect: {a} {ap:.1f}% -> {b} {bp:.1f}%   delta {d_defect:+.1f} pp"
              f"   within-arm noise floor {floor_d:.1f} pp"
              f"   => {'DIFFERENCE LARGER THAN NOISE' if abs(d_defect) > floor_d else 'inside the noise'}")
        print(f"empty : {a} {ep:.1f}% -> {b} {eb:.1f}%   delta {d_empty:+.1f} pp"
              f"   within-arm noise floor {floor_e:.1f} pp"
              f"   => {'DIFFERENCE LARGER THAN NOISE' if abs(d_empty) > floor_e else 'inside the noise'}")
    for n in notes:
        print(f"note: {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
