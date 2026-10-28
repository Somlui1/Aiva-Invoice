"""One live draft execution vs the engine's recorded payload for the same document — field by field.

This is the THIRD test layer and it answers a different question from the other two:
  replay (harness/test_payload_parity.py)  — can the flow's node code build the engine's extraction from the
                                             engine's own recorded answers? (same pixels, same answers)
  native (a draft execution through 02/06/06r/09r)  — do the platform render/rotate nodes hand the Code nodes
                                             frames with the sizes and encodings the Code nodes assume?
  live   (this file)                        — what the draft actually produced on a real document today.

The live layer is NOT parity evidence and must not be reported as such: the VLM ran again, on pixels rendered
today, so values legitimately differ from a recording. Differences in text-bearing fields are therefore put in
its own bucket, FRESH-OCR, and shown as samples rather than counted as parity. What this file is looking for is
everything that should NOT move between two runs of the same pipeline on the same document: the shape of the
payload, the contract strings, the schema, the rule ids, the number of pages, the coordinate system, the
presence of boxes, the recommendation channel, and any HARD row that is not explained by a different read.

Run:  cd engine/tools/n8n_port && python harness/test_live_vs_engine.py live/ab_exec_471.json 100
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REC = os.path.join(ROOT, "fixtures", "rec")
sys.path.insert(0, HERE)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from test_payload_parity import bucket, norm                      # noqa: E402  same buckets as the replay layer
from diff_rec import walk                                         # noqa: E402

# Fields whose content is whatever the model saw today. A different answer here is a different read, not a
# bug — and NOT evidence of parity either, which is why they are counted separately and sampled, never waived.
VALUE_PATH = re.compile(r"(raw_value|normalized_value|raw|text|name|value|actual_value|message|message_th|"
                        r"expected_value|description|item_code|qty|uom|unit_price|amount|confidence|"
                        r"element_id|evidence_id|evidence_ids|related_element_ids|line_no|code|codes)\b")
STRUCTURE = re.compile(r"^(contract|versions\.schema|package\.(coordinate_system|page_count)|"
                       r"rule_results\[\]\.rule_id|integrity|metrics\.schema|ocr\.pages\[\]\.page_no)")


def payload_of(exec_file):
    d = json.load(io.open(exec_file, encoding="utf-8"))
    rd = d["data"]["resultData"]["runData"]
    for r in rd.get("21 Validate (port)") or []:
        br = ((r.get("data") or {}).get("main") or [[]])[0]
        if br:
            return br[0]["json"]["result"], d
    raise SystemExit("no node 21 output in %s" % exec_file)


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    exec_file, doc = sys.argv[1], sys.argv[2]
    live, ex = payload_of(exec_file)
    eng = json.load(io.open(os.path.join(REC, "%s_engine_payload.json" % doc), encoding="utf-8"))
    print("live  %s  doc %s   execution %s" % (os.path.basename(exec_file), doc, ex.get("id")))
    print("engine fixture            recommendation=%s  schema=%s"
          % (eng["recommendation"]["value"], eng["versions"]["schema"]))
    print("flow  (live draft)        recommendation=%s  schema=%s"
          % (live["recommendation"]["value"], live["versions"]["schema"]))

    rows = []
    walk(norm(eng), norm(live), "payload", rows, 6000)
    tally, hard, fresh, samples = {}, [], [], {}
    for path, a, b in rows:
        bk = bucket(path, a, b)
        if bk == "HARD" and VALUE_PATH.search(path) and isinstance(a, (str, int, float, list)) \
                and isinstance(b, (str, int, float, list)):
            bk = "FRESH-OCR"
        key = "%-9s %s" % (bk, re.sub(r"\[\d+\]", "[]", path).rsplit(".", 1)[-1])
        tally[key] = tally.get(key, 0) + 1
        if bk == "HARD":
            hard.append((path, a, b))
        elif bk == "FRESH-OCR":
            fresh.append((path, a, b))
            samples.setdefault(re.sub(r"\[\d+\]", "[]", path).rsplit(".", 1)[-1], (path, a, b))

    print("\nbuckets (SHA equality is deliberately NOT used as the verdict):")
    for k in sorted(tally):
        print("   %-46s %4d" % (k, tally[k]))

    print("\nstructure that must never move, checked explicitly:")
    checks = [("contract", live.get("contract"), eng.get("contract")),
              ("versions.schema", live["versions"]["schema"], eng["versions"]["schema"]),
              ("rule ids", [r["rule_id"] for r in live.get("rule_results") or []],
               [r["rule_id"] for r in eng.get("rule_results") or []]),
              ("coordinate system", json.dumps(live["package"]["coordinate_system"], sort_keys=True),
               json.dumps(eng["package"]["coordinate_system"], sort_keys=True)),
              ("page_count", live["package"]["page_count"], eng["package"]["page_count"]),
              ("every evidence row has a bbox or a reason",
               all((e.get("bboxes") or e.get("bbox_missing_reason")) for e in live.get("evidence") or []), True)]
    bad = 0
    for label, got, want in checks:
        ok = got == want
        bad += 0 if ok else 1
        print("   %-38s %s" % (label, "OK" if ok else "DIFF  live=%r engine=%r" % (got, want)))

    print("\nFRESH-OCR sample (a different read today, NOT a parity claim):")
    for k, (path, a, b) in list(samples.items())[:10]:
        print("   %-30s engine=%s  live=%s" % (k, json.dumps(a, ensure_ascii=False)[:44],
                                               json.dumps(b, ensure_ascii=False)[:44]))
    print("   %d FRESH-OCR rows in total, %d sampled" % (len(fresh), len(samples)))

    if hard:
        print("\nHARD rows on the live layer (not explained by a different read):")
        for path, a, b in hard[:25]:
            print("   %-58s %s != %s" % (path[:58], json.dumps(a, ensure_ascii=False)[:52],
                                         json.dumps(b, ensure_ascii=False)[:52]))
    print("\nLIVE vs ENGINE: HARD rows=%d  structure diffs=%d  fresh-ocr rows=%d"
          % (len(hard), bad, len(fresh)))
    print("This layer is labelled LIVE TRAFFIC: the VLM ran again, so it is not parity evidence.")
    return 1 if hard or bad else 0


sys.exit(main())
