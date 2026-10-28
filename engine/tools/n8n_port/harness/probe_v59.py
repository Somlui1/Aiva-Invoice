"""One-shot canvas probe: set a parameter, execute the draft, print the first failing node.

  python harness/probe_v59.py --set "07 Rotate invoice page upright:/dataPropertyName:pre" --run
Only ever touches the child workflow draft; prints draft/active ids so a publish is visible if it ever happens.
"""
import argparse, io, json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp_client import Mcp

WF = "034iqKMRjqKt9LlB"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", action="append", default=[], help='node:path:value (value parsed as JSON when possible)')
    ap.add_argument("--run", action="store_true")
    args = ap.parse_args()
    mcp = Mcp()
    wf = mcp.call("get_workflow_details", {"workflowId": WF})
    wf = wf.get("workflow", wf)
    print("draft=%s active=%s activeFlag=%s" % (str(wf.get("versionId"))[:8], str(wf.get("activeVersionId"))[:8], wf.get("active")))
    ops = []
    for spec in args.set:
        node, path, val = spec.split(":", 2) if spec.count(":") >= 2 else spec.split(":", 1) + [""]
        try:
            v = json.loads(val)
        except Exception:
            v = val
        ops.append({"type": "setNodeParameter", "nodeName": node, "path": path, "value": v})
        print("  set %-38s %s = %s" % (node, path, json.dumps(v)[:70]))
    if ops:
        res = mcp.call("update_workflow", {"workflowId": WF, "operations": ops,
                                           "versionName": "probe: parameter change while testing v5.9 draft"})
        print("  applied ->", json.dumps(res)[:120])
    if not args.run:
        return 0
    ex = mcp.call("execute_workflow", {"workflowId": WF, "executionMode": "manual"})
    eid = ex.get("executionId") or ex.get("id")
    print("execution", eid)
    t0, status = time.time(), "?"
    while time.time() - t0 < 420:
        time.sleep(6)
        meta = mcp.call("get_workflow_execution", {"workflowId": WF, "executionId": str(eid)})
        status = (meta.get("execution", meta) or {}).get("status")
        if status not in ("running", "new", "waiting", "?"):
            break
    print("status=%s after %.0f s" % (status, time.time() - t0))
    got = mcp.call("get_workflow_execution", {"workflowId": WF, "executionId": str(eid), "includeData": True})
    io.open(os.path.join(ROOT, "live", "probe_exec_%s.json" % eid), "w", encoding="utf-8").write(json.dumps(got))
    d = got.get("data") or (got.get("execution") or {}).get("data") or {}
    rd = ((d.get("resultData") if isinstance(d, dict) else {}) or {}).get("runData") or {}
    print("status=%s  executed: %s" % (status, ", ".join(list(rd)[-8:])))
    for name, runs in rd.items():
        runs = runs if isinstance(runs, list) else [runs[k] for k in sorted(runs)]
        for r in runs:
            if r.get("executionStatus") == "error":
                print("ERROR at %s: %s" % (name, json.dumps((r.get("data") or {}).get("error"), ensure_ascii=False)[:400]))
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
