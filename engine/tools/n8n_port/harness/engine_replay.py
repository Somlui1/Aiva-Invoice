"""Reproduce a recorded engine run offline: same extraction + same Oracle rows + same AI answers.

  python harness/engine_replay.py 117 129 26 ...        # default: every doc in fixtures/rec

This is the determinism gate under the whole parity project.  If the engine cannot reproduce its own
recorded payload from the tapes, then a mismatch between engine and port would prove nothing.  Nothing is
re-called: every ORDS query and every LLM answer is read from the tape written by ``record_doc.py``, and a
request whose key is not on the tape raises (that is how we notice the port is asking something different).
"""
import glob
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
REC = os.path.join(ROOT, "fixtures", "rec")
sys.path.insert(0, os.path.join(ENGINE, "src"))
sys.path.insert(0, os.path.join(ENGINE, "scripts"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from system_a.envfile import read_env_file                                    # noqa: E402
for _k, _v in read_env_file().items():                                        # noqa: E402
    os.environ.setdefault(_k, _v)

from system_a.adapters.llm.litellm_client import LiteLLMClient                # noqa: E402
from system_a.adapters.oracle.mcp_repository import McpSqlClient              # noqa: E402
from system_a.application.orchestrator import validate                        # noqa: E402
from system_a.container import Settings, build_services                       # noqa: E402
from system_a.domain.contracts import ExtractionResult                        # noqa: E402

_post, _run = LiteLLMClient._post, McpSqlClient.run


from tape_key import py_key as req_key       # same function the JS port uses (tape_key.mjs)


def replay(doc, settings):
    ai = json.load(io.open(os.path.join(REC, "%s_ai_tape.json" % doc), encoding="utf-8"))
    ora = json.load(io.open(os.path.join(REC, "%s_oracle_tape.json" % doc), encoding="utf-8"))
    used_ai, used_or = [False] * len(ai), [False] * len(ora)

    def post(self, body):
        key = req_key(body)
        for i, e in enumerate(ai):
            if not used_ai[i] and req_key(e["body"]) == key:      # recomputed, never trusting the stored key
                used_ai[i] = True
                return e["text"]
        mine = json.dumps({k: v for k, v in body.items() if k != "messages"}, sort_keys=True, default=str)
        for i, e in enumerate(ai):
            if not used_ai[i]:
                theirs = json.dumps({k: v for k, v in e["body"].items() if k != "messages"},
                                    sort_keys=True, default=str)
                raise AssertionError("AI request not on the tape.\n  wanted key %s\n  body     %s\n"
                                     "  next tape  key %s\n  body     %s" % (key, mine, e["key"], theirs))
        raise AssertionError("AI tape exhausted (%d calls recorded)" % len(ai))

    def sql(self, text, *, database="default"):
        for i, e in enumerate(ora):
            if not used_or[i] and e["sql"].strip() == text.strip():
                used_or[i] = True
                return e["csv"]
        raise AssertionError("Oracle query not on the tape (port/engine config drift?):\n%s" % text[:400])

    ext = ExtractionResult.model_validate(json.load(io.open(os.path.join(REC, "%s_extraction.json" % doc),
                                                            encoding="utf-8")))
    svc = build_services(settings)
    LiteLLMClient._post, McpSqlClient.run = post, sql
    try:
        payload = validate(ext, svc, request={"validation_id": "SP-%s" % doc, "correlation_id": "sp-%s" % doc,
                                              "idempotency_key": None, "document_revision": 1,
                                              "validation_round": 1})
    finally:
        LiteLLMClient._post, McpSqlClient.run = _post, _run
    return payload, used_ai, used_or


def main():
    docs = sys.argv[1:] or sorted({os.path.basename(f).split("_")[0] for f in
                                   glob.glob(os.path.join(REC, "*_engine_payload.json"))})
    settings = Settings()
    bad = 0
    for doc in docs:
        want = json.load(io.open(os.path.join(REC, "%s_engine_payload.json" % doc), encoding="utf-8"))
        try:
            got, used_ai, used_or = replay(doc, settings)
        except Exception as e:
            print("  DMS-%-5s REPLAY FAILED %s: %s" % (doc, type(e).__name__, str(e)[:300]))
            bad += 1
            continue
        a, b = want["integrity"]["payload_sha256"], got["integrity"]["payload_sha256"]
        same = a == b
        bad += 0 if same else 1
        print("  DMS-%-5s %-13s %-13s ai=%d/%d oracle=%d/%d  %s" %
              (doc, want["recommendation"]["value"], got["recommendation"]["value"],
               sum(used_ai), len(used_ai), sum(used_or), len(used_or),
               "reproducible" if same else "NOT reproducible\n    recorded=%s\n    replay  =%s" % (a[:34], b[:34])))
    print("\n%s - the tape replay %s reproduce the engine exactly"
          % ("DETERMINISM OK" if not bad else "DETERMINISM BROKEN", "does" if not bad else "does NOT"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
