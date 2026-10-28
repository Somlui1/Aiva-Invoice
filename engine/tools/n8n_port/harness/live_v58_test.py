"""Run the DRAFT on a real document and report what actually happened (never publishes).

  python harness/live_v58_test.py                      # doc from node 00 (89) — the normal branch
  python harness/live_v58_test.py --set-doc 16         # point node 00 at doc 16 first
  python harness/live_v58_test.py --revert-doc         # put node 00's expression back
  python harness/live_v58_test.py --doc-only           # no execute, just read node 00

Checks made on the saved execution (live/ab_exec_<id>.json, gitignored — it holds real invoice data):
  * which branch the new IF node took,
  * node 03 page_dims (is the classify image really JPEG now?),
  * node 05 selection (selected / no_invoice_page / pages_complete / decode flags),
  * node 21 port block (recommendation, codes, oracle, ai_calls, payload_sha256),
  * every evidence row against schemas/result-3.1.schema.json,
  * node 22's own parity/report block.
"""
import argparse
import io
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ENGINE, "src"))
from mcp_client import Mcp                                              # noqa: E402

WF = "034iqKMRjqKt9LlB"
NODE00 = "00 CONFIG (single point)"
DOC_FIELD = "doc_id"
NODES_OF_INTEREST = ["03 Build classify request", "05 Parse classify pick invoice pages",
                     "05b Invoice pages found?", "21 Validate (port)", "22 Verification report (9 rules)"]


def doc_field_index(wf):
    for i, a in enumerate(wf["nodes"]):
        pass
    nodes = {n["name"]: n for n in wf["nodes"]}
    assigns = nodes[NODE00]["parameters"]["assignments"]["assignments"]
    for i, a in enumerate(assigns):
        if a.get("name") == DOC_FIELD:
            return i
    raise SystemExit("node 00 has no %s assignment" % DOC_FIELD)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--set-doc", default="")
    ap.add_argument("--revert-doc", action="store_true")
    ap.add_argument("--doc-only", action="store_true")
    ap.add_argument("--timeout", type=int, default=420)
    args = ap.parse_args()
    mcp = Mcp()

    def wf_get():
        got = mcp.call("get_workflow_details", {"workflowId": WF})
        return got.get("workflow", got)

    wf = wf_get()
    idx = doc_field_index(wf)
    pointer = "/assignments/assignments/%d/value" % idx
    nodes00 = {n["name"]: n for n in wf["nodes"]}[NODE00]["parameters"]["assignments"]["assignments"][idx]
    current = nodes00.get("value")
    print("node 00 doc_id  = %r   (draft %s / active %s)"
          % (current, str(wf.get("versionId"))[:8], str(wf.get("activeVersionId"))[:8]))
    if args.doc_only:
        return 0

    if args.revert_doc:
        backups = sorted(f for f in os.listdir(os.path.join(ROOT, "live")) if "before_v58" in f)
        old = json.load(io.open(os.path.join(ROOT, "live", backups[-1]), encoding="utf-8"))
        oldnodes = {n["name"]: n for n in old["nodes"]}
        oldval = [a for a in oldnodes[NODE00]["parameters"]["assignments"]["assignments"]
                  if a.get("name") == DOC_FIELD][0]["value"]
        mcp.call("update_workflow", {"workflowId": WF, "versionName": "revert node 00 doc_id after v5.8 test",
                                     "operations": [{"type": "setNodeParameter", "nodeName": NODE00,
                                                     "path": pointer, "value": oldval}]})
        back = wf_get()
        now = [a for a in {n["name"]: n for n in back["nodes"]}[NODE00]["parameters"]["assignments"]["assignments"]
               if a.get("name") == DOC_FIELD][0]["value"]
        print("reverted doc_id -> %r  %s" % (now, "OK" if now == oldval else "MISMATCH"))
        return 0 if now == oldval else 1

    if args.set_doc:
        mcp.call("update_workflow", {"workflowId": WF, "versionName": "test doc_id for v5.8 (temporary)",
                                     "operations": [{"type": "setNodeParameter", "nodeName": NODE00,
                                                     "path": pointer, "value": args.set_doc}]})
        print("node 00 doc_id set to %r for this test" % args.set_doc)

    ex = mcp.call("execute_workflow", {"workflowId": WF, "executionMode": "manual"})
    eid = (ex or {}).get("executionId") or (ex or {}).get("id") or json.dumps(ex)[:80]
    print("manual execution started: %s (draft runs; production version untouched)" % eid)
    t0 = time.time()
    status = "?"
    while time.time() - t0 < args.timeout:
        time.sleep(6)
        meta = mcp.call("get_workflow_execution", {"workflowId": WF, "executionId": str(eid)})
        e = meta.get("execution", meta)
        status = e.get("status")
        if status not in ("running", "new", "waiting", "?"):
            break
    print("status=%s after %.0f s" % (status, time.time() - t0))

    got = mcp.call("get_workflow_execution", {"workflowId": WF, "executionId": str(eid), "includeData": True})
    path = os.path.join(ROOT, "live", "ab_exec_%s.json" % eid)
    io.open(path, "w", encoding="utf-8").write(json.dumps(got))
    print("saved -> live/%s (%d KB)" % (os.path.basename(path), os.path.getsize(path) // 1024))
    rd = ((got.get("data") or {}).get("resultData") or {}).get("runData") or {}
    print("nodes executed: %s" % ", ".join(list(rd)[:20]))

    def first_json(name):
        runs = rd.get(name) or []
        for r in reversed(runs):
            for br in ((r.get("data") or {}).get("main") or []):
                for it in br or []:
                    return (it or {}).get("json") or {}
        return {}

    n03 = first_json("03 Build classify request")
    dims = n03.get("page_dims") or []
    print("node 03: pages=%s mimes=%s bytes=%s" % (n03.get("n_pages"),
          sorted({d.get("mime") for d in dims}), [d.get("bytes") for d in dims]))
    n05 = first_json("05 Parse classify pick invoice pages")
    sel = n05.get("selection") or {}
    print("node 05: selected=%s no_invoice_page=%s pages_complete=%s empty_read=%s decode=%s"
          % (json.dumps(sel.get("selected")), sel.get("no_invoice_page"), sel.get("pages_complete"),
             n05.get("empty_read"), json.dumps(n05.get("classify_decode"))[:120]))
    print("node 05b executed: %s" % ("yes (branch node ran)" if "05b Invoice pages found?" in rd else "no"))
    n21 = first_json("21 Validate (port)")
    port = n21.get("port") or {}
    payload = n21.get("result") or {}
    if port:
        print("node 21: mode=%s recommendation=%s halted_by=%s oracle=%s ai_calls=%s (%s ms) elapsed=%s"
              % (port.get("mode"), port.get("recommendation"), port.get("halted_by"), port.get("oracle_queries"),
                 port.get("ai_calls"), port.get("ai_ms"), port.get("elapsed_ms")))
        print("        payload_sha256=%s" % port.get("payload_sha256"))
    if payload:
        rec = payload.get("recommendation") or {}
        print("payload: contract=%s schema=%s pages_complete=%s codes=%s max_severity=%s evidence=%d (review=%d)"
              % (payload.get("contract"), (payload.get("versions") or {}).get("schema"),
                 (payload.get("package") or {}).get("pages_complete"), rec.get("exception_codes"),
                 rec.get("max_severity"), len(payload.get("evidence") or []),
                 sum(1 for e in payload.get("evidence") or [] if e.get("kind") == "review")))
        import jsonschema
        schema = json.load(io.open(os.path.join(ENGINE, "schemas", "result-3.1.schema.json"), encoding="utf-8"))
        try:
            jsonschema.validate(payload, schema)
            print("        schema result-3.1: VALID")
        except jsonschema.ValidationError as e:
            print("        schema result-3.1: INVALID at %s: %s" % ("/".join(map(str, e.path)), e.message[:200]))
    n22 = first_json("22 Verification report (9 rules)")
    if n22:
        print("node 22: ok=%s parity_ok=%s review_points=%s rules=%s"
              % (n22.get("ok"), (n22.get("parity") or {}).get("ok") if isinstance(n22.get("parity"), dict) else n22.get("parity_ok"),
                 n22.get("review_points_count") or len(n22.get("review_points") or []),
                 len(n22.get("rules") or [])))
    for name, runs in rd.items():
        for r in runs:
            if r.get("error") or (r.get("data") or {}).get("error"):
                err = r.get("error") or (r.get("data") or {}).get("error")
                print("NODE ERROR at %s: %s" % (name, json.dumps(err, default=str)[:400]))
    return 0 if status == "success" else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
