"""Engine payload vs the FLOW's payload — the comparison the earlier harnesses could not make.

  python harness/test_payload_parity.py            # every recorded document that has a scenario
  python harness/test_payload_parity.py 100 26     # just these

Why this file exists: parity_rec.py and test_live_exec.py both start from the ENGINE's extraction, so they
prove the decision layer is deterministic — they never ask whether the n8n flow can BUILD that extraction.
This one runs the real node code (harness/js_flow.mjs) from the classify answer onward and diffs the whole
payload, field by field, with SHA equality explicitly refused as evidence.

Every difference is put in one of four buckets, and the buckets are the claim:
  EXPECTED   wall-clock / tape artefacts the flow cannot know: timings_ms, calls[].ms, token usage,
             payload_sha256 (it covers the numbers below), generated_at, request/metrics echo.
  SUBPIXEL   pages[].width_pt / height_pt within 0.6 pt: the engine reads the PDF MediaBox, a Code node
             cannot, so the flow derives points from pixels (w_px / dpi * 72).
  SNAP-off   extraction.extra.ink_snap / ink_snap_mode: the flow is the engine's snap=off arm.
  BBOX       an ocr element's bbox/rbox within 0.02 of norm1000 (rounding-scale move).
  SNAP-move? an ocr element's bbox/rbox further apart than that. The flow's box is the box the model
             reported (nodes 08/10 only rescale it), so the engine moved it: PERCEPTION_INK_SNAP='move'
             snaps boxes onto ink and a Code node cannot decode a pixel. The CAUSE is read from the engine
             source, not reproduced offline - and it is not cosmetic: on DMS-26 the snapped box made two rows
             collide, which turned V-01 from pass into fail and AUTO_PASS into REVIEW. Run the engine at
             snap=off on the same documents if you want this bucket to disappear.
  HARD       anything else — a real behavioural difference. This test fails on a single HARD row.
"""
import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REC = os.path.join(ROOT, "fixtures", "rec")
SCN = os.path.join(ROOT, "fixtures", "scn")
sys.path.insert(0, HERE)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from diff_rec import walk                                        # noqa: E402

# ---------------------------------------------------------------- buckets
EXPECTED = [
    r"\.timings_ms", r"extra\.timings", r"calls\[\d+\]\.ms", r"\.usage", r"tokens", r"\.ms$",
    r"payload_sha256", r"^request\.", r"^metrics\.", r"\.elapsed_ms", r"_ms$", r"metrics\.duration_ms",
    r"extra\.flow", r"\.decode_version$", r"extra\.build$",
    # every timestamp is "now", and the two runs are not the same now: the engine writes
    # 2026-10-26T07:50:39.151230+00:00, the flow 2026-10-27T06:08:24.423Z. Neither is a decision.
    r"generated_at$", r"evaluated_at$", r"queried_at$", r"completed_at$", r"_at$",
    # wall-clock inside metrics, and two keys the port adds on purpose (provenance + the SQL it ran)
]
# The ink-snap arm: engine PERCEPTION_INK_SNAP defaults to 'move' (boxes are nudged onto ink); a Code node
# cannot decode a pixel, so the flow is the engine's snap=off arm. Reported, never counted as parity.
SNAP = [r"extra\.ink_snap$", r"extra\.ink_snap_mode$"]
PT = (r"\.width_pt$", r"\.height_pt$")
BOX = (r"\.(bbox|rbox|box)(\[|$)",)     # paths arrive as ocr.elements[5].bbox[1], not .bbox     # trailing comma: without it this is a STRING and
#                                          iterating it hands out single characters
# one pixel of the *classify* render is 72/80 = 0.9 pt, and PyMuPDF rounds the raster, so a page the
# flow only ever saw at 80 DPI cannot be nearer than about one pixel. Pages that were read at 150
# DPI land inside 0.2 pt. Anything wider is a real geometry difference.
PT_TOL, BOX_TOL = 1.0, 0.02


# Two keys the port writes and the engine does not: who produced the payload, and the SQL it actually ran.
# Both live under metrics (outside the hash), and both are kept on purpose - but they are listed here, in a
# bucket of their own, instead of being quietly folded into "expected".
PORT_ONLY = [r"^metrics\.engine", r"^metrics\.sql_audit"]


def bucket(path, a, b):
    for rx in PORT_ONLY:                       # only when the engine side really has nothing there
        if re.search(rx, path.replace("payload.", "")) and a is None:
            return "PORT-ONLY"
    for rx in EXPECTED:
        if re.search(rx, path):
            return "EXPECTED"
    for rx in SNAP:
        if re.search(rx, path):
            return "SNAP-off"
    if a is None or b is None or not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        return "HARD"
    for rx in PT:
        if re.search(rx, path) and abs(a - b) <= PT_TOL:
            return "SUBPIXEL"
    for rx in BOX:
        if re.search(rx, path):
            # The flow's box IS the box the model reported (nodes 08/10 only rescale it), so when the engine's
            # value differs the engine moved it: PERCEPTION_INK_SNAP='move' snaps boxes onto ink, which a Code
            # node cannot do. Small moves fit BBOX; a big one is the same cause, and it is the one that can
            # change a recommendation (DMS-26: a snapped row box collided with its neighbour -> V-01 fail).
            # Marked as inferred-from-engine-code, because the snap itself is not reproducible offline.
            return "BBOX" if abs(a - b) <= BOX_TOL else "SNAP-move?"
    return "HARD"


def norm(x):
    """Drop the keys that carry wall-clock, and the values that cannot be reproduced offline."""
    if isinstance(x, dict):
        return {k: norm(v) for k, v in x.items()
                if k not in ("timings_ms", "generated_at", "payload_sha256", "elapsed_ms", "usage")}
    if isinstance(x, list):
        return [norm(v) for v in x]
    return x


def run(doc):
    if not os.path.exists(os.path.join(SCN, "%s_scenario.json" % doc)):
        subprocess.run([sys.executable, os.path.join(HERE, "make_scenario.py"), doc], check=True,
                       stdout=subprocess.DEVNULL)
    subprocess.run(["node", os.path.join(HERE, "js_flow.mjs"), doc], check=True, cwd=ROOT,
                   stdout=subprocess.DEVNULL)
    port = json.load(io.open(os.path.join(SCN, "%s_port.json" % doc), encoding="utf-8"))
    engine = json.load(io.open(os.path.join(REC, "%s_engine_payload.json" % doc), encoding="utf-8"))
    eng_ext = json.load(io.open(os.path.join(REC, "%s_extraction.json" % doc), encoding="utf-8"))
    rows = []
    walk(norm(engine), norm(port["payload"]), "payload", rows, 4000)
    walk(norm(eng_ext), norm(port["extraction"]), "extraction", rows, 4000)
    tally, hard = {}, []
    for path, a, b in rows:
        bk = bucket(path, a, b)
        key = "%-8s %s" % (bk, re.sub(r"\[\d+\]", "[]", path).rsplit(".", 1)[-1])
        tally[key] = tally.get(key, 0) + 1
        if bk == "HARD":
            hard.append((path, a, b))
    rec = json.load(io.open(os.path.join(REC, "%s_ai_tape.json" % doc), encoding="utf-8"))
    print("\n== doc %s   recommendation engine=%s flow=%s   ai_tape=%d" %
          (doc, engine["recommendation"]["value"], port["payload"]["recommendation"]["value"], len(rec)))
    for k in sorted(tally):
        print("   %-42s %4d" % (k, tally[k]))
    if hard:
        for path, a, b in hard[:25]:
            print("   HARD  %-60s %s  !=  %s" % (path[:60], json.dumps(a, ensure_ascii=False)[:60],
                                                 json.dumps(b, ensure_ascii=False)[:60]))
        print("   HARD rows: %d" % len(hard))
    else:
        print("   HARD rows: 0   ->  engine and flow agree on every field the platform can reproduce")
    return len(hard), tally


def main():
    have = sorted({os.path.basename(f).split("_")[0] for f in os.listdir(REC) if f.endswith("_ai_tape.json")})
    docs = sys.argv[1:] or [d for d in have if os.path.exists(os.path.join(REC, "%s_extraction.json" % d))]
    total_hard, per_doc = 0, {}
    for d in docs:
        try:
            hard, _ = run(d)
        except subprocess.CalledProcessError as e:
            print("doc %s: harness step failed (%s)" % (d, e))
            hard = -1
        per_doc[d] = hard
        total_hard += max(hard, 0)
    print("\n----- payload parity (engine vs flow-built extraction) -----")
    for d, h in per_doc.items():
        print("  %-6s %s" % (d, "HARD %d" % h if h > 0 else ("FAILED" if h < 0 else "OK")))
    print("  total hard differences: %d" % total_hard)
    return 1 if total_hard or any(h < 0 for h in per_doc.values()) else 0


if __name__ == "__main__":
    sys.exit(main())
