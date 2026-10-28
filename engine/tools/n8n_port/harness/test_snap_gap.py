"""The ink-snap gap, measured and pinned — DMS-26 / 52 / 116 / 117.

Background (engine source, not inference): perception/single_pass.py runs PERCEPTION_INK_SNAP, default "move"
(engine default read from env handling in single_pass.py; the recorded extractions carry
extra.ink_snap=true and extra.ink_snap_mode="move"). It slides each reported box onto the ink of the rendered
page. A n8n Code node cannot decode a pixel, so the flow reports the box the model returned — i.e. the flow
is permanently the engine's snap="off" arm. That is NOT cosmetic:

  DMS-26: the engine's snapped box for a table row made it collide with its neighbour, V-01 went pass -> fail
          and the recommendation went AUTO_PASS -> REVIEW. A flow that says AUTO_PASS where the engine says
          REVIEW is the dangerous direction, and it is the one this test watches.

This file does not pretend to close the gap. It makes the gap *audible and pinned*, which is what a known
platform limitation deserves:

  (1) cause isolation  — every non-geometry field still has to agree, so a divergence here can only be the
                         geometry, never a silent logic bug that hides behind the known snap story;
  (2) causal check     — a recommendation that differs must differ on a GEOMETRY rule (V-01/V-02) and only
                         when at least one table-row box actually moved by more than BOX_TOL;
  (3) direction check  — flow looser than engine is printed as the risk it is, and only allowed for a doc in
                         the ledger;
  (4) ledger pin       — today's verdict per document is written down. If the gap is ever closed (an external
                         snap service, or the owner runs the engine at snap=off for A/B) or the flow drifts,
                         the ledger stops matching and this test fails, forcing a human re-read.

Run:  cd engine/tools/n8n_port && python harness/test_snap_gap.py
"""
import io
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REC = os.path.join(ROOT, "fixtures", "rec")
SCN = os.path.join(ROOT, "fixtures", "scn")
sys.path.insert(0, HERE)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from test_payload_parity import bucket, norm                      # noqa: E402  same buckets, same tol
from diff_rec import walk                                         # noqa: E402

DOCS = ["26", "52", "116", "117"]
BOX_TOL = 0.02                       # the tolerance test_payload_parity uses for "rounding-scale" moves
CAUSAL_TOL = 0.002                   # but causality needs a finer ruler, and the measurement proved why:
#   DMS-26 line 14 differs by 0.0187 — under BOX_TOL, so a coarse ruler reports "no row moved" while the
#   engine's V-01 is failing on exactly that row (engine box y 0.6513 h 0.0387 vs the model box y 0.67 h 0.02,
#   which is a COLLISION_RATIO_0.69 overlap). 0.002 of page height is ~3.5 px at 1754 px: below that a move
#   cannot plausibly change an overlap verdict, above it one can.
GEOMETRY_RULES = {"V-01", "V-02"}   # the rules that read boxes
RANK = {"AUTO_PASS": 0, "REVIEW": 1, "MANUAL_REVIEW": 1, "HOLD": 2, "BLOCK": 2}

# Pinned state, MEASURED on this checkout (engine V-01, flow V-01, engine rec, flow rec).
# Note what this says about the earlier assumption: only DMS-26 changes verdict, and only DMS-26 is looser.
# DMS-52 fails V-01 on BOTH sides (its row box differs a lot, but the verdict was already REVIEW), and
# DMS-116 / DMS-117 agree outright — their recorded differences are in the fields the snap moves, not in the
# decision. If any of these four stop matching, re-read this file: either the gap got closed or the flow moved.
LEDGER = {
    "26": ("fail", "pass", "REVIEW", "AUTO_PASS"),
    "52": ("fail", "fail", "REVIEW", "REVIEW"),
    "116": ("pass", "pass", "AUTO_PASS", "AUTO_PASS"),
    "117": ("pass", "pass", "AUTO_PASS", "AUTO_PASS"),
}

fails = []


def check(cond, msg):
    print(("  OK   " if cond else "  FAIL ") + msg)
    if not cond:
        fails.append(msg)


def rule(payload, rid):
    for r in payload.get("rule_results") or []:
        if r.get("rule_id") == rid:
            return r.get("result")
    return None


def line_boxes(ext):
    out = {}
    for ln in ext.get("lines") or []:
        reg = ln.get("region") or {}
        bb = reg.get("bbox")
        if isinstance(bb, list) and len(bb) == 4:
            out["%s/%s" % (reg.get("page"), ln.get("line_no"))] = [float(v) for v in bb]
    return out


def element_boxes(ext):
    """Every box the flow's payload carries, keyed so an evidence row's element_id can find its box.

    The engine's evidence rows cite element ids like D1-L14 (line 14 of document D1) and D1-f-invoice_num.
    Looking the CITED element up in both extractions is how the causal check avoids "something moved somewhere".
    """
    out = {}
    for i, ln in enumerate(ext.get("lines") or []):
        reg = ln.get("region") or {}
        if isinstance(reg.get("bbox"), list):
            out[("line", str(ln.get("line_no")))] = [float(v) for v in reg["bbox"]]
    for name, f in (ext.get("fields") or {}).items():
        reg = (f or {}).get("region") or {}
        if isinstance(reg.get("bbox"), list):
            out[("field", name)] = [float(v) for v in reg["bbox"]]
    for i, r in enumerate(ext.get("regions") or []):
        reg = (r or {}).get("region") or {}
        if isinstance(reg.get("bbox"), list):
            out[("region", "%s@%s" % (r.get("kind"), i))] = [float(v) for v in reg["bbox"]]
    return out


def cited_by_geometry_rules(payload):
    """(rule_id, element_id, page, engine_box) for every geometry rule that cites a box."""
    out = []
    for e in payload.get("evidence") or []:
        if e.get("rule_id") not in GEOMETRY_RULES:
            continue
        for b in e.get("bboxes") or []:
            out.append((e["rule_id"], b.get("element_id"), b.get("page_no"),
                        [float(v) for v in (b.get("bbox") or [])], e.get("actual_value")))
    return out


def build(doc):
    if not os.path.exists(os.path.join(SCN, "%s_scenario.json" % doc)):
        subprocess.run([sys.executable, os.path.join(HERE, "make_scenario.py"), doc], check=True,
                       stdout=subprocess.DEVNULL)
    subprocess.run(["node", os.path.join(HERE, "js_flow.mjs"), doc], check=True, cwd=ROOT,
                   stdout=subprocess.DEVNULL)
    return (json.load(io.open(os.path.join(REC, "%s_engine_payload.json" % doc), encoding="utf-8")),
            json.load(io.open(os.path.join(REC, "%s_extraction.json" % doc), encoding="utf-8")),
            json.load(io.open(os.path.join(SCN, "%s_port.json" % doc), encoding="utf-8")))


print("engine snap, from its own extraction (not assumed):")
for doc in DOCS:
    eng_ext = json.load(io.open(os.path.join(REC, "%s_extraction.json" % doc), encoding="utf-8"))
    ex = eng_ext.get("extra") or {}
    print("   DMS-%-4s extra.ink_snap=%s extra.ink_snap_mode=%s" % (doc, ex.get("ink_snap"), ex.get("ink_snap_mode")))
    check(ex.get("ink_snap") is True and ex.get("ink_snap_mode") == "move",
          "DMS-%s: the engine really ran snap=move on this document" % doc)
    break          # one statement of the baseline is enough; it is the same process for every doc

for doc in DOCS:
    eng, eng_ext, port = build(doc)
    pext, ppl = port["extraction"], port["payload"]
    v01e, v01f = rule(eng, "V-01"), rule(ppl, "V-01")
    ve, vf = rule(eng, "V-02"), rule(ppl, "V-02")
    re_, rf = eng["recommendation"]["value"], ppl["recommendation"]["value"]

    eb, fb = line_boxes(eng_ext), line_boxes(pext)
    moved = [(k, eb[k], fb[k], max(abs(a - b) for a, b in zip(eb[k], fb[k])))
             for k in sorted(set(eb) & set(fb)) if max(abs(a - b) for a, b in zip(eb[k], fb[k])) > BOX_TOL]

    # (1) cause isolation: nothing but geometry may differ
    rows = []
    walk(norm(eng), norm(ppl), "payload", rows, 4000)
    walk(norm(eng_ext), norm(pext), "extraction", rows, 4000)
    hard = [(p, a, b) for p, a, b in rows if bucket(p, a, b) == "HARD"]
    snap_rows = [(p, a, b) for p, a, b in rows if bucket(p, a, b) == "SNAP-move?"]

    print("\n== DMS-%s  V-01 engine=%s flow=%s | V-02 engine=%s flow=%s | rec engine=%s flow=%s"
          % (doc, v01e, v01f, ve, vf, re_, rf))
    print("   row boxes moved > %.2f: %d of %d shared rows;  inferred-snap fields in payload: %d"
          % (BOX_TOL, len(moved), len(set(eb) & set(fb)), len(snap_rows)))
    for k, a, b, d in moved[:4]:
        print("      line %s  engine=%s  flow=%s  max delta %.4f" % (k, [round(x, 4) for x in a], [round(x, 4) for x in b], d))

    check((v01e, v01f, re_, rf) == LEDGER[doc],
          "DMS-%s: pinned state holds %s (changed -> the gap was closed or the flow drifted: re-read this file)"
          % (doc, LEDGER[doc]))

    # (2) causal check, evidence-driven: take the exact elements the ENGINE's geometry rules tripped on and
    # look at how the flow reports those same boxes. "A verdict changed" plus "the cited box differs" is the
    # whole claim; anything else would be a logic bug wearing the snap story as a costume.
    cited = cited_by_geometry_rules(eng)
    pext_boxes = element_boxes(pext)
    if (v01e != v01f) or (re_ != rf):
        explained = []
        for rid, eid, page, ebox, actual in cited:
            tail = (eid or "").rsplit("-", 1)[-1]
            kind = "line" if (eid or "").startswith("D") and tail.startswith("L") else "field"
            key = ("line", tail[1:]) if kind == "line" and tail.startswith("L") else ("field", tail)
            fbox = pext_boxes.get(key)
            if fbox and len(fbox) == 4 and len(ebox) == 4:
                d = max(abs(a - b) for a, b in zip(ebox, fbox))
                explained.append((rid, eid, actual, d))
                print("      cited %s %s %s: engine box %s vs flow box %s, delta %.4f (%s)"
                      % (rid, eid, actual, [round(x, 4) for x in ebox], [round(x, 4) for x in fbox], d,
                         "differs" if d > CAUSAL_TOL else "identical"))
        check(bool(explained) and any(d > CAUSAL_TOL for *_x, d in explained),
              "DMS-%s: the verdict differs and an element the engine's geometry rule cited is boxed "
              "differently by the flow (cause is geometry, measured at the cited element)" % doc)
        check(all(r["rule_id"] in GEOMETRY_RULES or r["result"] == rule(eng, r["rule_id"])
                  for r in ppl.get("rule_results") or []),
              "DMS-%s: every rule that disagrees is a geometry rule; value/total rules still agree" % doc)

    if RANK.get(rf, 9) < RANK.get(re_, 9):
        print("   !!! RISK: the flow is LOOSER than the engine (engine %s -> flow %s). This is the direction that"
              " can pass a bad invoice; it stays open only while the snap gap is open." % (re_, rf))
        check(doc in LEDGER, "DMS-%s: the looser verdict is on the pinned ledger" % doc)

print()
print("Snap gap is NOT closed: the flow cannot decode ink, so it is the engine's snap=off arm.")
print("Owner options: run the engine at PERCEPTION_INK_SNAP=off for a true A/B, or give the flow an external")
print("service that returns snapped boxes. Do NOT make the flow stricter by hand — that is new behaviour,")
print("not parity.")
print()
print("SNAP GAP REGRESSION: " + ("PASS" if not fails else "FAIL (%d)" % len(fails)))
sys.exit(1 if fails else 0)
