"""Ship the port into n8n through the n8n MCP server — no REST API key, no copy/paste.

  python harness/n8n_mcp_sync.py --check     # read live canvas over MCP, print drift, write nothing
  python harness/n8n_mcp_sync.py             # update_workflow (atomic ops) then GET back and compare
  python harness/n8n_mcp_sync.py --publish   # ... and activate afterwards
  python harness/n8n_mcp_sync.py --status    # versionId vs activeVersionId + what production is running

Why MCP and not the REST API: `update_workflow` takes operation objects
({type:"setNodeParameter", nodeName, path:"/jsCode", value}) so a script can put 276 KB of jsCode into the
JSON-RPC body while the bytes come straight off disk.  Same server, same auth and same tool the agent
uses — and no human pasting 276 KB into a Code node.

Order matters, and it is not alphabetical.  node 21 is written FIRST on its own:
prompt 1.7.0 + old (v5.5) JS is the dangerous combination — the old code turns the missing
"unclear"/confidence fields into "unsure" → waive → AUTO_PASS on unsigned documents.
New JS + old prompt is merely older extraction quality, never a silent pass.
"""
import argparse
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp_client import Mcp, McpError                     # noqa: E402
from n8n_sync import (EXPECTED_NODES, CONFIG_NODE, NODE12, NODE21, NODE22,   # noqa: E402
                      NODE03, NODE05, NODE08,                              # noqa: E402
                      current_value, norm, repo_updates)

WF = "034iqKMRjqKt9LlB"
LIVE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "live")
# order = safety, not aesthetics
ORDER = [NODE21, CONFIG_NODE, NODE22, NODE12, NODE03, NODE05, NODE08]


def pointer(node, key):
    """JSON Pointer (inside parameters) for a jsCode field or a named Set-node assignment."""
    if key is None:
        return "/jsCode"
    assigns = node.get("parameters", {}).get("assignments", {}).get("assignments", [])
    for i, a in enumerate(assigns):
        if a.get("name") == key:
            return "/assignments/assignments/%d/value" % i
    return None


def live_workflow(mcp, workflow):
    got = mcp.call("get_workflow_details", {"workflowId": workflow})
    if not isinstance(got, dict):
        raise McpError("get_workflow_details returned text: %s" % str(got)[:200])
    wf = got.get("workflow", got)
    return wf


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workflow", default=WF)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--publish", action="store_true")
    ap.add_argument("--only", default="", help="comma separated node names to touch")
    args = ap.parse_args()

    mcp = Mcp()
    upd, vers = repo_updates()
    wf = live_workflow(mcp, args.workflow)
    nodes = {n["name"]: n for n in wf["nodes"]}
    extra, gone = sorted(set(nodes) - EXPECTED_NODES), sorted(EXPECTED_NODES - set(nodes))
    print("canvas %s  versionId=%s  activeVersionId=%s  active=%s  nodes=%d"
          % (wf["id"], wf.get("versionId"), wf.get("activeVersionId"), wf.get("active"), len(nodes)))
    if args.status:
        same = wf.get("versionId") == wf.get("activeVersionId")
        print("production is running: %s (%s)" % (wf.get("activeVersionId"),
              "same as draft" if same else "DIFFERENT from the draft on the canvas"))
        return 0
    if extra or gone:
        print("canvas is not the expected topology - refusing to write.\n  unexpected: %s\n  missing   : %s"
              % (extra or "-", gone or "-"))
        return 1

    wanted = [n for n in ORDER if not args.only or n in args.only.split(",")]
    ops, plan = [], []
    for name in wanted:
        for kind, key, val, src in upd[name]:
            if kind == "label":                       # bump the version label inside live code only
                cur = nodes[name]["parameters"].get("jsCode", "")
                if "single-pass-extract@" not in cur:
                    print("%s: no single-pass-extract@ label found - refusing to guess" % name)
                    return 1
                import re
                val = re.sub(r"single-pass-extract@[0-9.]+", "single-pass-extract@" + val, cur)
                kind, key = "jsCode", None
            path = pointer(nodes[name], key)
            if path is None:
                print("%s: assignment %r not on the canvas" % (name, key))
                return 1
            cur = nodes[name]["parameters"]
            for part in [p for p in path.split("/")[1:]]:
                cur = cur[part] if not part.isdigit() else cur[int(part)]
            same = norm(cur) == norm(val)
            plan.append((name, key or "jsCode", path, val, src, cur))
            if not same:
                ops.append({"type": "setNodeParameter", "nodeName": name, "path": path, "value": val})

    print("repo: single-pass-extract@%s  single-pass-classify@%s\n" % (vers["extract"], vers["classify"]))
    for name, key, path, val, src, cur in plan:
        print("  %-30s %-16s %-38s %s  live=%s repo=%d  (%s)"
              % (name, key, path, "in sync     " if norm(cur) == norm(val) else "WOULD WRITE",
                 len(norm(cur)), len(norm(val)), src))
    if not ops:
        print("\nnothing to write - the canvas already matches the repo.")
        return 0
    print("\n%d operation(s), %d bytes of payload." % (len(ops), sum(len(o["value"]) for o in ops)))
    if args.check:
        print("--check wrote nothing.")
        return 1

    os.makedirs(LIVE, exist_ok=True)
    bak = os.path.join(LIVE, "backup_%s_version-%s.json" % (wf["id"], wf.get("versionId")))
    with open(bak, "w", encoding="utf-8") as fh:
        json.dump(wf, fh, ensure_ascii=False, indent=1)
    print("backup (offline copy of what the canvas held): %s" % bak)

    # node 21 alone first (see module docstring), the rest in one atomic batch
    big = [o for o in ops if o["nodeName"] == NODE21]
    rest = [o for o in ops if o["nodeName"] != NODE21]
    for batch, label in ([b for b in ((big, NODE21), (rest, "the rest")) if b[0]]):
        try:
            res = mcp.call("update_workflow", {
                "workflowId": args.workflow, "operations": batch,
                "versionName": "port engine v5.7 (V-06 2.0, evidence per finding, schema 3.1)"[:80],
                "versionDescription": ("Decision layer re-ported from engine v5.7 + the rule AI (V-07 M3-M5 "
                                       "matcher, V-05 entity judge, V-08 quantity guard). Offline proof: "
                                       "12/12 recorded production documents give a payload_sha256 identical "
                                       "to the engine, and node 21 itself reproduces 5 of them with AI "
                                       "replayed. Includes a money fix (dDiv scale) that the live flow "
                                       "currently gets wrong.")[:1000],
            })
        except McpError as e:
            print("update_workflow(%s) FAILED: %s" % (label, e))
            return 1
        txt = json.dumps(res, ensure_ascii=False)
        bad = [k for k in ("error", "failed", "notFound") if '"%s"' % k in txt or "%s:" % k in txt.lower()]
        print("wrote %-22s -> %s%s" % (label, "ok", ("  response keys/flags: " + ",".join(bad)) if bad else ""))
        if "skippedOperations" in txt and '"skippedOperations": []" ' not in txt:
            print("   response: %s" % txt[:600])

    if args.publish:
        print("publish -> %s" % json.dumps(mcp.call("publish_workflow", {"workflowId": args.workflow}))[:300])

    after = live_workflow(mcp, args.workflow)
    anodes = {n["name"]: n for n in after["nodes"]}
    bad = 0
    print("\nREAD-BACK (this is the only proof that counts)")
    for op in ops:
        node = anodes[op["nodeName"]]
        cur = node["parameters"]
        for part in path_parts(op["path"]):
            cur = cur[part] if not isinstance(part, str) or not part.isdigit() else cur[int(part)]
        ok = norm(cur) == norm(op["value"])
        exact = str(cur) == op["value"]
        bad += 0 if ok else 1
        print("  %-30s %-38s %s%s" % (op["nodeName"], op["path"], "EQUAL" if ok else "MISMATCH",
              "" if exact or not ok else "  (equal after CR / trailing-newline normalisation)"))
        if not ok:
            a, b = norm(cur), norm(op["value"])
            i = 0
            while i < min(len(a), len(b)) and a[i] == b[i]:
                i += 1
            print("      first diff at %d: canvas=%r repo=%r" % (i, a[i:i + 60], b[i:i + 60]))
    print("\ndraft versionId now %s (was %s)%s" % (after.get("versionId"), wf.get("versionId"),
          "" if after.get("versionId") != after.get("activeVersionId") else "  <- and it is LIVE"))
    print("%s (%d field(s))" % ("SYNC VERIFIED" if not bad else "SYNC NOT VERIFIED", len(ops)))
    print("next: run the flow on one document and compare port.payload_sha256 with "
          "python harness/py_full.py — see STATUS.md §5")
    return 1 if bad else 0


def path_parts(path):
    return [p for p in path.split("/")[1:]]


if __name__ == "__main__":
    sys.exit(main())
