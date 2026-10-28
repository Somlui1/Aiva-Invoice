"""Where do two payloads part company?  Prints the first differing JSON paths, engine vs port.

  python harness/diff_rec.py 104                 # fixtures/rec/104_engine_payload.json vs _js_payload.json
  python harness/diff_rec.py 104 --paths 12

Drops what the canonical hash drops (request, metrics, summary, and any key named evaluated_at /
queried_at), so every line it prints is a difference that actually moves payload_sha256.
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REC = os.path.join(os.path.dirname(HERE), "fixtures", "rec")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
DROP = ("integrity", "request", "metrics", "summary")


def strip_ts(x):
    if isinstance(x, dict):
        return {k: strip_ts(v) for k, v in x.items() if k not in ("evaluated_at", "queried_at")}
    if isinstance(x, list):
        return [strip_ts(v) for v in x]
    return x


def walk(a, b, path, out, limit):
    if len(out) >= limit:
        return
    if a is None or b is None or isinstance(a, (str, int, float, bool)) or type(a) is not type(b):
        if a != b:
            out.append((path, a, b))
        return
    if isinstance(a, list):
        if len(a) != len(b):
            out.append((path + ".length", len(a), len(b)))
        for i in range(min(len(a), len(b))):
            walk(a[i], b[i], "%s[%d]" % (path, i), out, limit)
    elif isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a:
                out.append((path + "." + k + ".MISSING_IN_ENGINE", None, b[k]))
            elif k not in b:
                out.append((path + "." + k + ".MISSING_IN_PORT", a[k], None))
            else:
                walk(a[k], b[k], path + "." + k, out, limit)


def main():
    doc = sys.argv[1]
    lim = int(sys.argv[sys.argv.index("--paths") + 1]) if "--paths" in sys.argv else 6
    a = json.load(io.open(os.path.join(REC, "%s_engine_payload.json" % doc), encoding="utf-8"))
    b = json.load(io.open(os.path.join(REC, "%s_js_payload.json" % doc), encoding="utf-8"))
    for k in DROP:
        a.pop(k, None)
        b.pop(k, None)
    out = []
    walk(strip_ts(a), strip_ts(b), "", out, lim)
    if not out:
        print("  no difference outside the excluded keys")
    for p, x, y in out:
        print("  %s\n      engine=%s\n      port  =%s"
              % (p, json.dumps(x, ensure_ascii=False, default=str)[:170],
                 json.dumps(y, ensure_ascii=False, default=str)[:170]))
    return 1 if out else 0


if __name__ == "__main__":
    sys.exit(main())
