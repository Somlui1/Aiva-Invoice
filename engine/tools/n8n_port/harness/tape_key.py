"""Deterministic key of one LLM request, computed the SAME way in python and in JS.

  python harness/tape_key.py            # prints the key of every recorded request; the JS twin must agree

The key is derived from the request body every time (the `key` field stored in the tape is only for humans).
That way a tape recorded before this format existed still replays, and the JS port cannot pass by accident:
if it builds a different request, the lookup fails and the test says exactly what differs.

The JS twin is the port's own aiRequestKey() (src_ai.js), so the n8n node and this file cannot drift;
`node harness/tape_key.mjs` prints the same list.  Two cross-language traps are designed out: no hash
function (lengths are compared as integers) and numbers formatted %g / Number(), so python's 0.0 and
JSON's 0 agree.
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REC = os.path.join(ROOT, "fixtures", "rec")


def py_key(body):
    roles, text_len, imgs, pid = [], 0, 0, ""
    for m in body.get("messages") or []:
        roles.append(m.get("role") or "")
        c = m.get("content")
        blob = ""
        if isinstance(c, str):
            blob = c
        else:
            for part in c or []:
                if isinstance(part, dict) and part.get("type") == "image_url":
                    imgs += 1
                else:
                    blob += (part.get("text") if isinstance(part, dict) else str(part)) or ""
        text_len += len(blob)
        if "prompt_id" in blob and not pid:
            pid = blob.split("prompt_id:")[1].split("-->")[0].strip().splitlines()[0][:40]
    k = body.get("chat_template_kwargs") or {}
    thinking = "none"
    if isinstance(k, dict) and "enable_thinking" in k:
        thinking = "true" if k.get("enable_thinking") else "false"
    num = lambda v: "none" if v is None else ("%g" % float(v))
    return "|".join([pid or "+".join(roles), "len:%d" % text_len,
                     str(imgs), str(body.get("model")), num(body.get("temperature")), num(body.get("max_tokens")),
                     "json" if body.get("response_format") else "none", thinking])


if __name__ == "__main__":
    docs = sorted({os.path.basename(f).split("_")[0] for f in os.listdir(REC) if f.endswith("_ai_tape.json")}) \
        if len(sys.argv) < 2 else sys.argv[1:]
    for d in docs:
        for e in json.load(io.open(os.path.join(REC, "%s_ai_tape.json" % d), encoding="utf-8")):
            print("%-6s %s" % (d, py_key(e["body"])))
