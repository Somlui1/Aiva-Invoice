"""Ship the v5.8 parity work to the n8n DRAFT — nodes + the new branch — and read every byte back.

  python harness/push_v58.py --check    # read-only: what would change (code + topology)
  python harness/push_v58.py            # backup -> one atomic update_workflow -> read back, byte compare

This NEVER publishes. Production keeps running the previously published version until the owner says so;
`--status` prints draft vs active. Rollback: restore_workflow_version to the id printed before the write.

What v5.8 changes, and why each piece is here:
  node 21  dist/node21_inline.js  — buildExtraction tolerates zero reads (the empty-read branch), the row
                                   box falls back to the union of its cells (single_pass.py) and a page whose
                                   values arrive with no box is reported NO_GEOMETRY like the engine.
  node 03  page_dims per page + it really sends JPEG now (node 02 was PNG under an 'image/jpeg' label).
  node 05  stops guessing page 1 (engine: no invoice page -> read nothing), decodes the classify answer with
           the engine's strict-then-salvage chain, and reports empty_read for the IF node.
  node 10  same decoder on the extract answer (of the flow: a truncated answer lost the whole page).
  node 02  format jpeg + quality 70 = single_pass.py::_data_url(img, quality=70) for the classify call.
  NEW 05b IF "invoice pages found?"  true -> node 06 (unchanged path), false -> node 21 with no reads.
"""
import argparse
import io
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp_client import Mcp, McpError                                   # noqa: E402
from n8n_sync import (EXPECTED_NODES, CONFIG_NODE, NODE21, NODE22, NODE12,   # noqa: E402
                      NODE03, NODE05, NODE08, current_value, norm)

WF = "034iqKMRjqKt9LlB"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVE = os.path.join(ROOT, "live")
NODE10 = "10 Bbox math pixels + sanitize"
NODE02 = "02 PDF to JPEG 80 DPI (classify)"
NODE06 = "06 PDF to JPEG 150 DPI"
NODE05B = "05b Invoice pages found?"
IF_NODE = {"name": NODE05B, "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": [1060, 300],
           "parameters": {"conditions": {"options": {"caseSensitive": True, "leftValue": "",
                                                     "typeValidation": "strict", "version": 2},
                                         "conditions": [{"id": "has-pages",
                                                         "leftValue": "={{ ($json.selected_invoice_pages || []).length }}",
                                                         "rightValue": 0,
                                                         "operator": {"type": "number", "operation": "gt"}}],
                                         "combinator": "and"},
                          "options": {}},
           "notes": ("true output = at least one invoice page was selected (normal path). "
                     "false output = classify found no invoice page: the engine reads nothing at all, "
                     "so this goes straight to node 21, which builds an extraction with zero reads "
                     "(V-01 E01 -> REVIEW). A number compare is used on purpose: the boolean 'is false' "
                     "operator fails strict typeValidation against an empty right-hand side (exec 455).")}


def js(path):
    return io.open(os.path.join(ROOT, path), encoding="utf-8").read()


def repo_code():
    return {NODE21: js(os.path.join("dist", "node21_inline.js")),
            NODE03: js(os.path.join("n8n_nodes_v58", "03_classify_multimage.js")),
            NODE05: js(os.path.join("n8n_nodes_v58", "05_parse_classify.js")),
            NODE10: js(os.path.join("n8n_nodes_v58", "10_parse_extract.js"))}


def intended_edges():
    """What the canvas must look like after this push (the empty-read branch is the only topology change)."""
    return [(NODE05, NODE05B, 0), (NODE05B, NODE06, 0), (NODE05B, NODE21, 1)]


def edges_of(wf):
    out = []
    for src, outs in (wf.get("connections") or {}).items():
        for i, branch in enumerate((outs or {}).get("main") or []):
            for tgt in branch or []:
                if isinstance(tgt, dict) and tgt.get("node"):
                    out.append((src, tgt.get("node"), i))
    return sorted(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--skip-if", action="store_true", help="code only, no topology change")
    args = ap.parse_args()
    mcp = Mcp()

    def fetch():
        got = mcp.call("get_workflow_details", {"workflowId": WF})
        return got.get("workflow", got)

    wf = fetch()
    print("canvas versionId=%s\nactive versionId=%s  active=%s"
          % (wf.get("versionId"), wf.get("activeVersionId"), wf.get("active")))
    if args.status:
        return 0
    code = repo_code()
    nodes = {n["name"]: n for n in wf["nodes"]}
    have_if = NODE05B in nodes
    print("nodes on canvas: %d%s" % (len(nodes), "  (05b IF already present)" if have_if else ""))

    drift = []
    for name, want in code.items():
        live = nodes[name]["parameters"].get("jsCode", "")
        drift.append((name, len(live), len(want), live == want))
    for name, a, b, same in drift:
        print("  %-38s live=%-7d repo=%-7d %s" % (name, a, b, "in sync" if same else "WOULD WRITE"))
    edges = edges_of(wf)
    for src, tgt, idx in intended_edges():
        if (src, tgt, idx) not in edges:
            print("  edge missing on canvas: %-38s -> %-28s [output %d]" % (src, tgt, idx))
    if all(s for _, _, _, s in drift) and all(e in edges for e in intended_edges()):
        print("nothing to write — canvas already equals the repo build")
        return 0
    if args.check:
        print("--check wrote nothing.")
        return 0

    stamp = time.strftime("%Y%m%d_%H%M%S")
    bak = os.path.join(LIVE, "backup_%s_before_v58_%s.json" % (WF, stamp))
    io.open(bak, "w", encoding="utf-8").write(json.dumps(wf))
    print("backup of the canvas -> %s (%d KB)   rollback id = %s"
          % (os.path.basename(bak), os.path.getsize(bak) // 1024, wf.get("versionId")))

    ops = []
    # node 21 first, on its own safety grounds (new JS + old prompt is only older extraction; the reverse
    # combination is what used to turn a missing field into a silent pass).
    for name in (NODE21, NODE03, NODE05, NODE10):
        if code[name] != nodes[name]["parameters"].get("jsCode", ""):
            ops.append({"type": "setNodeParameter", "nodeName": name, "path": "/jsCode", "value": code[name]})
    # node 02 really emits JPEG now: single_pass.py renders the classify pages and saves them
    # img.save(buf, format="JPEG", quality=70). node 03 has been labelling them image/jpeg all along.
    if nodes[NODE02]["parameters"].get("format") != "jpeg":
        ops.append({"type": "setNodeParameter", "nodeName": NODE02, "path": "/format", "value": "jpeg"})
    if json.dumps(nodes[NODE02]["parameters"].get("options") or {}, sort_keys=True) != json.dumps({"quality": 70}, sort_keys=True):
        ops.append({"type": "setNodeParameter", "nodeName": NODE02, "path": "/options", "value": {"quality": 70}})
    if not args.skip_if and not have_if:
        ops.append({"type": "addNode", "node": IF_NODE})
        ops.append({"type": "removeConnection", "source": NODE05, "target": NODE06})
        ops.append({"type": "addConnection", "source": NODE05, "target": NODE05B, "sourceIndex": 0})
        ops.append({"type": "addConnection", "source": NODE05B, "target": NODE06, "sourceIndex": 0})
        ops.append({"type": "addConnection", "source": NODE05B, "target": NODE21, "sourceIndex": 1})

    print("writing %d operation(s), %d KB of jsCode..." %
          (len(ops), sum(len(json.dumps(o.get("value", ""))) for o in ops) // 1024))
    res = mcp.call("update_workflow", {"workflowId": WF, "operations": ops,
                                       "versionName": "v5.8 parity: no page-1 guessing, engine answer decoder, cell-union row box",
                                       "versionDescription": ("Node 05 stops reading page 1 when classify found no "
                                                              "invoice page (engine reads nothing -> E01/REVIEW) and the new IF "
                                                              "routes that branch to node 21. Nodes 05/10 decode the VLM answer "
                                                              "with the engine's strict-then-salvage chain. buildExtraction: "
                                                              "zero-read extraction + row box from the union of its cells + "
                                                              "NO_GEOMETRY page error. node 02 sends JPEG q70 for classify.")})
    print("update_workflow ->", json.dumps(res)[:300])

    back = fetch()
    bad = 0
    n2 = {n["name"]: n for n in back["nodes"]}
    for name, want in code.items():
        got = n2.get(name, {}).get("parameters", {}).get("jsCode", "")
        if got == want:
            print("  %-38s %7d B  BYTE-EQUAL after read-back" % (name, len(want)))
        else:
            bad += 1
            print("  %-38s MISMATCH live=%d repo=%d" % (name, len(got), len(want)))
    q = n2.get(NODE02, {}).get("parameters", {})
    print("  %-38s format=%s options=%s" % (NODE02, q.get("format"), json.dumps(q.get("options"))))
    if q.get("format") != "jpeg" or (q.get("options") or {}).get("quality") != 70:
        bad += 1
    want_edges = set(intended_edges())
    now_edges = set(edges_of(back))
    missing = sorted(want_edges - now_edges)
    if missing:
        bad += 1
        print("  EDGES STILL MISSING: %s" % missing)
    else:
        print("  branch wired: %s" % " | ".join("%s -> %s [out %s]" % (e[0], e[1], e[2]) for e in sorted(intended_edges())))
    print("draft=%s  active=%s  (NOT published by this script)"
          % (str(back.get("versionId"))[:8], str(back.get("activeVersionId"))[:8]))
    print("\n%s" % ("V5.8 DRAFT SYNC: OK" if not bad else "V5.8 DRAFT SYNC: PROBLEMS (%d)" % bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
