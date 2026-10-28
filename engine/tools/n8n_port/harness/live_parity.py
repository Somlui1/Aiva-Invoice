"""Ground-truth check of ONE real execution: n8n's own extraction -> the real engine -> compare payloads.

  python harness/live_parity.py live/exec449_n12_n21.json        # engine run records the Oracle tape live
  python harness/live_parity.py <that file> --replay             # reuse the tape written on the first run

Why: parity.py proves the decision layer matches on recorded fixtures.  This proves it on a document that
the *deployed canvas* just processed, with the VLM excluded from the comparison (the canvas hands us the
extraction it actually used, so a VLM disagreement cannot move the sha).

Files it writes hold real invoice data, so they go to live/ (gitignored) — never to fixtures/.
"""
import io
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
LIVE = os.path.join(ROOT, "live")
FIX = os.path.join(ROOT, "fixtures")


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(LIVE, "exec449_n12_n21.json")
    tag = os.path.basename(src).replace(".json", "")
    data = json.load(io.open(src, encoding="utf-8"))
    run = data["data"]["resultData"]["runData"]
    n21 = [k for k in run if k.startswith("21 ")][0]
    n12 = [k for k in run if k.startswith("12 ")][0]
    out21 = run[n21][0]["data"]["main"][0][0]["json"]
    out12 = run[n12][0]["data"]["main"][0][0]["json"]
    flow_payload = out21["result"]
    if not isinstance(flow_payload, dict) or "integrity" not in flow_payload:
        raise SystemExit("node 21 output has no payload: %s" % str(flow_payload)[:200])

    # node 12 ships the raw VLM answer plus its own debug keys; the engine model is stricter
    ex = flow_payload.get("extraction") or out12["result"]["extraction"]
    sys.path.insert(0, os.path.join(ENGINE, "src"))
    from system_a.domain.contracts import ExtractionResult
    allowed = set(ExtractionResult.model_fields)
    ex_clean = {k: v for k, v in ex.items() if k in allowed}
    dropped = sorted(set(ex) - allowed)
    ExtractionResult.model_validate(ex_clean)                       # fails loudly, not silently
    print("extraction keys kept=%d  dropped (n8n debug only)=%s" % (len(ex_clean), dropped))

    doc = flow_payload["package"]["dms_doc_id"]
    name = "live_%s_doc%s" % (tag, doc)
    json.dump({"extraction": ex_clean}, io.open(os.path.join(FIX, name + ".json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    meta = {"request": flow_payload.get("request"),
            "models": (flow_payload.get("versions") or {}).get("models") or {}}
    json.dump(meta, io.open(os.path.join(FIX, name + "_meta.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("doc_id=%s  request.id=%s  models=%s" % (doc, (meta["request"] or {}).get("validation_id"),
                                                   meta["models"]))

    args = [sys.executable, "-X", "utf8", os.path.join(HERE, "py_full.py"),
            name + ".json", name + "_oracle.json", name + "_payload.json"]
    args.append("--replay" if "--replay" in sys.argv else "--record")
    print("running the engine ...")
    r = subprocess.run(args, cwd=ENGINE)
    if r.returncode != 0:
        raise SystemExit("engine run failed (exit %d)" % r.returncode)

    engine = json.load(io.open(os.path.join(FIX, name + "_payload.json"), encoding="utf-8"))
    flow = json.loads(json.dumps(flow_payload, default=str))
    a, b = engine["integrity"]["payload_sha256"], flow["integrity"]["payload_sha256"]
    print("\nengine  sha=%s  %s" % (a, engine["recommendation"]["value"]))
    print("canvas  sha=%s  %s" % (b, flow["recommendation"]["value"]))
    same = a == b
    if not same:
        # name the exact keys so a mismatch is a finding, not a shrug
        keys = sorted(set(engine) | set(flow))
        bad = [k for k in keys if json.dumps(engine.get(k), sort_keys=True, default=str) !=
                                json.dumps(flow.get(k), sort_keys=True, default=str)]
        print("sections that differ: %s" % (bad or "-"))
        for k in bad:
            e = json.dumps(engine.get(k), sort_keys=True, default=str)[:300]
            f = json.dumps(flow.get(k), sort_keys=True, default=str)[:300]
            print("  %s\n    engine=%s\n    canvas=%s" % (k, e, f))
        print("\nmetrics: engine oracle_calls=%s  canvas oracle_queries=%s"
              % (engine.get("metrics", {}).get("oracle_calls"), out21["port"].get("oracle_queries")))
    # keep the real-data copies out of the tracked fixtures dir
    for suffix in (".json", "_meta.json", "_oracle.json", "_payload.json"):
        p = os.path.join(FIX, name + suffix)
        if os.path.exists(p):
            os.replace(p, os.path.join(LIVE, name + suffix))
    print("\ncopies kept in live/ (gitignored): %s*" % name)
    print("LIVE PARITY: %s" % ("OK - the deployed canvas and the engine agree byte-for-byte" if same
                               else "MISMATCH - see the sections above"))
    return 0 if same else 1


if __name__ == "__main__":
    sys.exit(main())
