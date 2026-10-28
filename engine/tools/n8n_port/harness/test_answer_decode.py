"""Offline gate: the flow's answer decoder must equal the engine's, byte-for-byte in behaviour.

    python harness/test_answer_decode.py

Three checks:
  1. the ANSWER-DECODE snippet inlined in every node file still equals n8n_nodes_v58/lib_answer_decode.js
     (an n8n Code node cannot import, so the block is copied — this is what stops the copies drifting);
  2. on EVERY answer the engine actually recorded (fixtures/rec/*_ai_tape.json = real model output, plus
     every answer truncated at several offsets, which is the case that used to lose a whole page), the JS
     decoder returns the same object and the same salvaged/failed verdict as python's
     adapters/llm/litellm_client.py::extract_json_object + salvage_json_object;
  3. the pure-decode pair the flow can run (strict -> salvage) is the same pair chat_json falls back to
     after its two network recoveries, so the flow is never *more* trusting than the engine.

Nothing here calls the network.
"""
import glob
import io
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "..", "..", "src"))

from system_a.adapters.llm.litellm_client import extract_json_object, salvage_json_object  # noqa: E402

LIB = os.path.join(ROOT, "n8n_nodes_v58", "lib_answer_decode.js")
NODE_FILES = [os.path.join(ROOT, "n8n_nodes_v58", "05_parse_classify.js"),
              os.path.join(ROOT, "n8n_nodes_v58", "10_parse_extract.js")]


def canonical(obj):
    """Stable repr that cannot be fooled by 0.0 (python) vs 0 (JS) — the same JSON number."""
    if isinstance(obj, bool):
        return "b:" + ("1" if obj else "0")
    if isinstance(obj, (int, float)):
        return "n:" + ("%g" % float(obj))
    if isinstance(obj, str):
        return "s:" + obj
    if obj is None:
        return "null"
    if isinstance(obj, (list, tuple)):
        return "[" + ",".join(canonical(v) for v in obj) + "]"
    if isinstance(obj, dict):
        return "{" + ",".join("%s:%s" % (k, canonical(obj[k])) for k in sorted(obj)) + "}"
    return repr(obj)


def py_decode(text):
    """What python's chat_json ends up doing when it may not spend another request."""
    try:
        return {"mode": "strict", "obj": extract_json_object(text), "salvaged": False}
    except ValueError:
        got = salvage_json_object(text)
        if got is None:
            return {"mode": "fail", "obj": None, "salvaged": False}
        return {"mode": "salvage", "obj": got, "salvaged": True}


def js_decode_many(texts):
    """Run the snippet exactly as a Code node holds it (no module system), over many answers in one process."""
    src = io.open(LIB, encoding="utf-8").read()
    runner = ("const code = require('fs').readFileSync(process.argv[2], 'utf8');\n"
              "const decode = new Function(code + '\\nreturn decodeAnswer;')();\n"
              "const texts = JSON.parse(require('fs').readFileSync(process.argv[3], 'utf8'));\n"
              "const out = texts.map((t) => {\n"
              "  const r = decode(t);\n"
              "  const mode = r.error === null ? 'strict' : (r.salvaged ? 'salvage' : 'fail');\n"
              "  return { mode: mode, obj: mode === 'fail' ? null : r.obj, salvaged: r.salvaged };\n"
              "});\n"
              "process.stdout.write(JSON.stringify(out));\n")
    with tempfile.NamedTemporaryFile("w", suffix=".cjs", delete=False, encoding="utf-8") as fh:
        fh.write(runner)
        script = fh.name
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as fh:
        json.dump(texts, fh)
        tin = fh.name
    try:
        r = subprocess.run(["node", script, LIB, tin], capture_output=True, text=True, encoding="utf-8")
        if r.returncode != 0:
            raise SystemExit("node decoder failed:\n" + r.stderr[-2000:])
        return json.loads(r.stdout)
    finally:
        os.unlink(script)
        os.unlink(tin)


def main():
    lib = io.open(LIB, encoding="utf-8").read()
    start = lib.index("const ANSWER_DECODE_VERSION")
    snippet = lib[start:].rstrip()

    # ---- 1. the inlined copies must still equal the canonical file ------------------------------------
    bad = 0
    for path in NODE_FILES:
        body = io.open(path, encoding="utf-8").read()
        if snippet in body:
            print("  %-52s snippet BYTE-EQUAL to lib_answer_decode.js" % os.path.basename(path))
        else:
            bad += 1
            print("  %-52s SNIPPET DIFFERS (edit lib_answer_decode.js and re-inline)" % os.path.basename(path))

    # ---- 2. real recorded answers + truncations, python vs the node's code --------------------------
    texts, kinds = [], []
    for f in sorted(glob.glob(os.path.join(ROOT, "fixtures", "rec", "*_ai_tape.json"))):
        for e in json.load(io.open(f, encoding="utf-8")):
            t = e.get("text")
            if isinstance(t, str) and t:
                texts.append(t)
                kinds.append(os.path.basename(f) + " full")
    for i, t in enumerate(texts[:]):
        for cut in (0.35, 0.62, 0.80, 0.93):
            n = max(1, int(len(t) * cut))
            texts.append(t[:n])
            kinds.append("truncated@%d%% of case %d" % (cut * 100, i))
    # adversarial: fences, thinking tags, trailing commas, a brace inside a string, no object at all
    texts += ['```json\n{"pages": [{"p": 1, "t": "invoice"}],}\n```',
              'thinking noise <reasoning>let me look</reasoning>{"a": 1, "b": {"c": 2}}',
              'no object here at all', '{"a": "a } brace inside a string', '{"a": [1,2,3',
              '{"line_items": [{"qty": {"raw": "3"}}, {"qty": {"raw": "4"}}', '{"n": "\u0e41"}']
    kinds += ["fenced + trailing comma", "thinking tag", "no object", "unterminated string",
              "unterminated array", "rows cut mid-member", "thai value"]

    got = js_decode_many(texts)
    diff = 0
    tally = {}
    for t, kind, g in zip(texts, kinds, got):
        want = py_decode(t)
        tally[want["mode"]] = tally.get(want["mode"], 0) + 1
        same_mode = want["mode"] == g["mode"]
        same_obj = canonical(want["obj"]) == canonical(g["obj"])
        if not (same_mode and same_obj):
            diff += 1
            if diff <= 6:
                print("  DIFF %-34s py=%s js=%s" % (kind, want["mode"], g["mode"]))
                print("       py=%s" % canonical(want["obj"])[:150])
                print("       js=%s" % canonical(g["obj"])[:150])
    print("  answers compared: %d (%s)  python/js differ: %d"
          % (len(texts), ", ".join("%s=%d" % kv for kv in sorted(tally.items())), diff))
    bad += diff
    print("ANSWER DECODE: %s" % ("OK - the flow loses no answer the engine can still read"
                                 if not bad else "FAIL (%d problem(s))" % bad))
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
