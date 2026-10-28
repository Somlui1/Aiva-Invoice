"""Engine vs port on the recorded corpus — the gate that must be green before the canvas is touched.

  python harness/parity_rec.py                 # every doc in fixtures/rec
  python harness/parity_rec.py 117 102         # subset

Both sides get the same extraction, the same Oracle rows and the same AI answers (tapes), so a difference
is always the port's fault, never the world's.  Sections that differ are printed, because "sha differs" is
not something a human can act on.
"""
import io
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REC = os.path.join(ROOT, "fixtures", "rec")
sys.path.insert(0, HERE)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import engine_replay                                                     # noqa: E402
from system_a.container import Settings                                   # noqa: E402

HASH_OUT = ("request", "metrics", "summary")        # excluded from payload_sha256 by assembler


def sections(a, b):
    return [k for k in sorted(set(a) | set(b))
            if json.dumps(a.get(k), sort_keys=True, default=str) != json.dumps(b.get(k), sort_keys=True, default=str)]


def main():
    docs = sys.argv[1:] or sorted({f.split("_")[0] for f in os.listdir(REC) if f.endswith("_engine_payload.json")})
    settings = Settings()
    ok, bad = [], []
    for doc in docs:
        js_path = os.path.join(REC, "%s_js_payload.json" % doc)
        if os.path.exists(js_path):
            os.remove(js_path)
        eng, used_ai, _ = engine_replay.replay(doc, settings)
        r = subprocess.run(["node", os.path.join(HERE, "js_rec.mjs"), doc],
                           capture_output=True, text=True, cwd=ROOT)
        line = (r.stdout or "").strip().splitlines()
        if not os.path.exists(js_path):
            bad.append((doc, "port threw: " + (line[-1] if line else (r.stderr or "")[:200])))
            print("  DMS-%-5s %-13s %-22s %s" % (doc, eng["recommendation"]["value"], "(no payload)",
                                                 (line[-1] if line else "js_rec.mjs produced nothing")[:100]))
            continue
        port = json.load(io.open(js_path, encoding="utf-8"))
        a, b = eng["integrity"]["payload_sha256"], port["integrity"]["payload_sha256"]
        diff = [] if a == b else sections({k: v for k, v in eng.items() if k not in HASH_OUT},
                                          {k: v for k, v in port.items() if k not in HASH_OUT})
        mark = "identical" if a == b else "DIFFERENT %s" % ",".join(diff)
        print("  DMS-%-5s %-13s %-13s ai=%d  %s" % (doc, eng["recommendation"]["value"],
                                                    port["recommendation"]["value"], sum(used_ai), mark))
        if a == b:
            ok.append(doc)
        else:
            bad.append((doc, "sha differs in: %s" % (diff or "-")))
            for k in (diff or [])[:3]:
                print("      %s\n        engine=%s\n        port  =%s" % (
                    k, json.dumps(eng.get(k), ensure_ascii=False, default=str)[:240],
                    json.dumps(port.get(k), ensure_ascii=False, default=str)[:240]))
    print("\n%s/%d documents identical to the engine" % (len(ok), len(docs)))
    for d, why in bad:
        print("  FAIL DMS-%-5s %s" % (d, why[:200]))
    print("RECORDED-CORPUS PARITY: %s" % ("OK" if not bad else "MISSING " + str(len(bad)) + " document(s)"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
