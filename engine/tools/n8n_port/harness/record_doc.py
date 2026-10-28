"""Pick the documents the parity corpus must contain, then record their tapes.

  python harness/record_doc.py --pick 12          # choose docs, print the list (no network)
  python harness/record_doc.py                    # record LLM + Oracle tapes for the picked docs
  python harness/record_doc.py --docs 89,117,26   # record specific docs

Why tapes: the engine and the JS port must be compared with the SAME answers.  Re-calling the VLM between
two runs is not a parity test, it is a test of the VLM's mood, and the gateway rate-limits us anyway.
So one live pass per document records every LLM request/answer and every ORDS query; from then on both
sides replay from disk, forever, offline.
"""
import argparse
import glob
import io
import json
import os
import shutil
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
REC = os.path.join(ROOT, "fixtures", "rec")
CORPUS = os.path.join(ENGINE, "..", "frontend", "temp", "paperless_invoices_v5")
sys.path.insert(0, os.path.join(ENGINE, "src"))
sys.path.insert(0, os.path.join(ENGINE, "scripts"))   # run_single_pass lives with the batch scripts
sys.path.insert(0, HERE)

from system_a.envfile import read_env_file                                    # noqa: E402
for _k, _v in read_env_file().items():                                        # noqa: E402
    os.environ.setdefault(_k, _v)


def pick(n):
    """A corpus that covers the branches: AI-matched (V-07 M3-M5), AI qty votes, and the plain-logic ones."""
    rows = []
    for f in sorted(glob.glob(os.path.join(CORPUS, "*_result.json"))):
        try:
            p = json.load(io.open(f, encoding="utf-8"))
        except Exception:
            continue
        if "line_matching" not in p or not (p.get("package") or {}).get("dms_doc_id"):
            continue
        doc = p["package"]["dms_doc_id"].replace("DMS-", "")
        gs = (p.get("line_matching") or {}).get("groups") or []
        srcs = {g.get("source") for g in gs}
        highs = {e["code"] for e in p["exceptions"] if e["severity"] == "High"}
        rows.append({"doc": doc, "verdict": p["recommendation"]["value"], "ai": "ai" in srcs,
                     "levels": ",".join(sorted({str(g.get("level")) for g in gs})),
                     "e13_only": highs == {"E13"}, "v08_ai": (p.get("metrics", {}).get("ai") or {})
                     .get("v08", {}).get("mode") == "ai", "codes": p["recommendation"]["exception_codes"]})
    want = []
    def take(cond, k):
        got = [r for r in rows if cond(r) and r not in want][:k]
        want.extend(got)
    take(lambda r: r["ai"] and r["e13_only"], 4)            # the HOLDs the AI matcher would release
    take(lambda r: r["ai"] and r["verdict"] == "AUTO_PASS", 2)
    take(lambda r: r["ai"] and r["verdict"] in ("REVIEW", "MANUAL_REVIEW"), 3)
    take(lambda r: r["v08_ai"], 1)                          # needs the V-08 qty judge
    take(lambda r: not r["ai"] and r["verdict"] == "AUTO_PASS", 3)
    take(lambda r: not r["ai"] and r["verdict"] in ("REVIEW", "HOLD", "MANUAL_REVIEW"), 3)
    return want[:n] if n else want


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pick", type=int, default=0, help="print the picked docs and stop")
    ap.add_argument("--docs", default="", help="comma separated doc ids to record")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    os.makedirs(REC, exist_ok=True)
    if a.pick:
        for r in pick(a.pick):
            print("  DMS-%-5s %-13s ai=%-5s levels=%-12s v08_ai=%-5s codes=%s"
                  % (r["doc"], r["verdict"], r["ai"], r["levels"], r["v08_ai"], ",".join(r["codes"])))
        print("picked %d doc(s)" % len(pick(a.pick)))
        return 0

    docs = a.docs.split(",") if a.docs else [r["doc"] for r in pick(12)]
    docs = [d.strip() for d in docs if d.strip()]
    print("recording %d doc(s): %s\n" % (len(docs), ",".join(docs)))

    from system_a.adapters.llm.litellm_client import LiteLLMClient
    from system_a.adapters.oracle.mcp_repository import McpSqlClient
    import run_single_pass as rsp
    from system_a.container import Settings

    llm_post, sql_run = LiteLLMClient._post, McpSqlClient.run

    def req_key(body):
        """Stable key of a request: what prompt, with how many images, under which knobs.  The JS side has
        to reproduce it exactly or the replay raises - that is what makes the tape a test, not a crutch."""
        import hashlib
        roles, text_len, imgs = [], 0, 0
        for m in body.get("messages") or []:
            roles.append(m.get("role"))
            c = m.get("content")
            if isinstance(c, str):
                text_len += len(c)
            else:
                for part in c or []:
                    if part.get("type") == "image_url":
                        imgs += 1
                    else:
                        text_len += len(part.get("text") or "")
        pid = ""
        for m in body.get("messages") or []:
            c = m.get("content")
            blob = c if isinstance(c, str) else " ".join(str((p.get("text") if isinstance(p, dict) else p))[:4000]
                                                        for p in (c or []))
            if "prompt_id" in blob:
                pid = blob.split("prompt_id:")[1].split("-->")[0].strip().splitlines()[0][:40]
                break
        knobs = json.dumps({k: body.get(k) for k in ("model", "temperature", "max_tokens", "response_format",
                                                     "chat_template_kwargs")}, sort_keys=True, default=str)
        return "%s|%s|%d|%s" % (pid or "|".join(roles), hashlib.md5(("%d" % text_len).encode()).hexdigest()[:8],
                               imgs, knobs)
    state = {"doc": None}

    def patched_post(self, body):
        t0 = time.time()
        text = llm_post(self, body)
        tape = json.load(io.open(os.path.join(REC, "%s_ai_tape.json" % state["doc"]), encoding="utf-8"))
        tape.append({"key": req_key(body), "body": body, "text": text,
                     "ms": round((time.time() - t0) * 1000)})
        json.dump(tape, io.open(os.path.join(REC, "%s_ai_tape.json" % state["doc"]), "w", encoding="utf-8"),
                  ensure_ascii=False)
        return text

    def patched_sql(self, sql, *, database="default"):
        csv = sql_run(self, sql, database=database)
        tape = json.load(io.open(os.path.join(REC, "%s_oracle_tape.json" % state["doc"]), encoding="utf-8"))
        tape.append({"sql": sql, "csv": csv})
        json.dump(tape, io.open(os.path.join(REC, "%s_oracle_tape.json" % state["doc"]), "w", encoding="utf-8"),
                  ensure_ascii=False)
        return csv

    LiteLLMClient._post, McpSqlClient.run = patched_post, patched_sql
    settings, out_root = Settings(), rsp.ROOT / "bbox_testing" / "single_pass"
    bad = 0
    for d in docs:
        ai_p, or_p = os.path.join(REC, "%s_ai_tape.json" % d), os.path.join(REC, "%s_oracle_tape.json" % d)
        if os.path.exists(os.path.join(REC, "%s_engine_payload.json" % d)) and not a.force:
            print("  DMS-%-5s already recorded (skip, --force to redo)" % d)
            continue
        state["doc"] = d
        json.dump([], io.open(ai_p, "w", encoding="utf-8"))
        json.dump([], io.open(or_p, "w", encoding="utf-8"))
        t0 = time.time()
        try:
            row = rsp.run_one(int(d), settings, out_root, True)
        except Exception as e:
            print("  DMS-%-5s FAILED %s: %s" % (d, type(e).__name__, str(e)[:180]))
            bad += 1
            continue
        if row.get("status") != "ok":
            print("  DMS-%-5s engine said: %s" % (d, row.get("error")))
            bad += 1
            continue
        src = os.path.join(str(out_root), "DMS-%s" % d)
        for name in ("extraction.json", "result.json"):
            if os.path.exists(os.path.join(src, name)):
                shutil.copy(os.path.join(src, name), os.path.join(REC, "%s_%s" % (d, name)))
        os.replace(os.path.join(REC, "%s_result.json" % d), os.path.join(REC, "%s_engine_payload.json" % d))
        n_ai = len(json.load(io.open(ai_p, encoding="utf-8")))
        n_or = len(json.load(io.open(or_p, encoding="utf-8")))
        print("  DMS-%-5s %-13s codes=%-12s ai_calls=%d oracle_calls=%d  %3.0fs"
              % (d, row.get("recommendation"), row.get("codes"), n_ai, n_or, time.time() - t0))
    print("\nrecorded into %s" % REC)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
