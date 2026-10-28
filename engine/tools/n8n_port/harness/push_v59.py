"""Ship the v5.9 parity work to the n8n DRAFT of the child workflow: multi-page reads + the R6-6 second look.

  python harness/push_v59.py --check    # read-only: node/edge/code diff against the live draft
  python harness/push_v59.py            # backup -> one atomic update_workflow -> READ BACK and byte-compare
  python harness/push_v59.py --status    # draft vs active ids only

This NEVER publishes and never touches the parent workflow: production keeps running whatever was published
before, and `activeVersionId` is printed before and after so the difference (or the lack of one) is on record.

What gets installed, and why each piece is a parity requirement rather than an improvement:

  06 PDF to JPEG 150 DPI          options.quality=90   single_pass._data_url(img, quality=90) for the extract
                                                      call (was: whatever pdfConvert defaults to)
  07 Rotate …                     dataPropertyName/rotate come from $json (per item), output format jpeg q90
                                                      engine: _render -> rotate_image -> save JPEG q90, and node
                                                      08 has been labelling the image image/jpeg for a while
                                                      without it being one. Per-item expressions are the point:
                                                      a .first() rotation angle rotates every page the same way.
  NEW 06b Split selected pages    one item per SELECTED page under engine-unique binary names. The old chain read
                                                      .first() and therefore read one page of a 2-page invoice.
  NEW 05c1 Adjudicate allowed?    engine gate: self.adjudicate and not selected and not page_errors["classify"]
  NEW 06r Render 150 DPI (adj.)   _adjudicate renders at adjudicate_dpi=150, JPEG q85 (85, not 90)
  NEW 05c Adjudicate request      one request per page, prompt single_pass_adjudicate, max_tokens 900
  NEW 05d VLM step 1b adjudicate  HTTP node (not a Code node): a 10-minute wait must not live inside the 60 s
                                                      Code/task-runner budget
  NEW 05e Parse adjudicate        quotes joined " | ", invoice_wording, reopen only non-invoice pages, then the
                                  SAME select_invoice_pages (shared bytes, guarded by test_lib_parity.py)
  NEW 05f After adjudicate found? true -> the normal extract chain, false -> node 21 with zero reads
  05c/05e/05f false/05c1 false -> 21 : the engine still refuses the document, the refusal just isn't a guess.
  08 / 10 / 12 / 21               the multi-page read chain (reads[] in, per-page pairing, aggregate)
"""
import argparse
import io
import uuid
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp_client import Mcp                                              # noqa: E402
from n8n_sync import CONFIG_NODE, NODE21, NODE12, NODE05, NODE08, NODE03   # noqa: E402

WF = "034iqKMRjqKt9LlB"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.dirname(os.path.dirname(ROOT))
LIVE = os.path.join(ROOT, "live")
V58 = "n8n_nodes_v58"

NODE02 = "02 PDF to JPEG 80 DPI (classify)"
NODE04 = "04 VLM step 1 classify pages"
NODE06 = "06 PDF to JPEG 150 DPI"
NODE07 = "07 Rotate invoice page upright"
NODE09 = "09 VLM step 2 extract bbox"
N09T = "09t Tax-id triage"
N09I = "09i Tax-id re-read needed?"
N09R = "09r Render 300 DPI (tax-id)"
N09O = "09o Prep re-read frame"
N09ROT = "09rot Rotate re-read upright"
N09B = "09b Build re-read request"
N09C = "09c VLM step 3 tax-id re-read"
N09D = "09d Merge tax-id re-read"
N09Z = "09z Assemble extract reads"
ALL_ITEMS_CODE = ["08 Build extract request", "10 Bbox math pixels + sanitize",
                  "12 Build final JSON + images", "06b Split selected pages",
                  "05c Adjudicate request", "05e Parse adjudicate + reselect", "05 Parse classify pick invoice pages",
                  N09T, N09O, N09B, N09D, N09Z]
NODE10 = "10 Bbox math pixels + sanitize"
# The multi-page nodes are explicit about their execution mode, and the choice is forced by the platform,
# not by taste: "Run Once for Each Item" forbids EVERY .first() (exec 465: "Can't use .first() here [line 21,
# for item 0]"), and node 00's config is only reachable through .first(). So 08/10 run once for all items and
# loop themselves - which is also what makes their per-page pairing visible in the code (zip by index with a
# loud count guard) instead of hidden in the graph.
NODE05B = "05b Invoice pages found?"
N06B = "06b Split selected pages"
N05C1 = "05c1 Adjudicate allowed?"
N06R = "06r Render 150 DPI (adjudicate)"
N05C = "05c Adjudicate request"
N05D = "05d VLM step 1b adjudicate"
N05E = "05e Parse adjudicate + reselect"
N05F = "05f Invoice pages after adjudicate?"

CODE = {                                        # repo file -> canvas node
    NODE03: "03_classify_multimage.js",
    NODE05: "05_parse_classify.js",
    N05C: "05c_adjudicate_request.js",
    N05E: "05e_parse_adjudicate.js",
    N06B: "06b_split_selected_pages.js",
    NODE08: "08_extract_request.js",
    NODE10: "10_parse_extract.js",
    NODE12: "12_aggregate_reads.js",
    "09t Tax-id triage": "09t_taxid_triage.js",
    "09o Prep re-read frame": "09o_taxid_prep.js",
    "09b Build re-read request": "09b_taxid_request.js",
    "09d Merge tax-id re-read": "09d_taxid_merge.js",
    "09z Assemble extract reads": "09z_taxid_join.js",
}


def js(path):
    return io.open(os.path.join(ROOT, path), encoding="utf-8").read()


def repo_code():
    out = {name: js(os.path.join(V58, f)) for name, f in CODE.items()}
    out[NODE21] = js(os.path.join("dist", "node21_inline.js"))
    return out


def prompt(name):
    text = io.open(os.path.join(ENGINE, "config", "prompts", name), encoding="utf-8").read()
    return text[:-1] if text.endswith("\n") else text      # the Set node trims one trailing newline


def if_node(name, pos, left, op, right, note):
    return {"name": name, "type": "n8n-nodes-base.if", "typeVersion": 2.2, "position": pos,
            "parameters": {"conditions": {"options": {"caseSensitive": True, "leftValue": "",
                                                      "typeValidation": "strict", "version": 2},
                                          "conditions": [{"id": name, "leftValue": left, "rightValue": right,
                                                          "operator": {"type": "number", "operation": op}}],
                                          "combinator": "and"},
                             "options": {}},
            "notes": note}


def new_nodes(wf):
    http = [n for n in wf["nodes"] if n["name"] == NODE04][0]
    render = [n for n in wf["nodes"] if n["name"] == NODE06][0]
    adj_http = json.loads(json.dumps(http))                    # clone 04 exactly: same gateway, headers, timeout
    adj_http["id"] = str(uuid.uuid4())          # a clone must not carry the node id it was cloned from
    adj_http.pop("pinData", None); adj_http.pop("meta", None)
    adj_http.update({"name": N05D, "typeVersion": http.get("typeVersion", 4.2), "position": [1290, 620],
                     "parameters": json.loads(json.dumps(http["parameters"])),
                     "notes": ("Same gateway and the same 600000 ms timeout as node 04 (engine perception client "
                               "timeout is 600 s). An adjudicate wait must not live inside a Code node: the "
                               "task runner kills a Code node at ~60 s (exec 456).")})
    code = repo_code()
    adj_render = json.loads(json.dumps(render))
    adj_render["id"] = str(uuid.uuid4())
    adj_render.pop("pinData", None); adj_render.pop("meta", None)
    adj_render.update({"name": N06R, "position": [1540, 620],
                       "parameters": {"binaryPropertyName": "pdf", "format": "jpeg",
                                      "density": "={{ $('00 CONFIG (single point)').first().json.dpi_adjudicate }}",
                                      "outputProperty": "ext", "options": {"quality": 85}},
                       "notes": ("single_pass._adjudicate: _render(page, adjudicate_dpi) then _data_url(img, "
                                 "quality=85). 85 and not 90 on purpose - the extract pass is q90, and the two "
                                 "are different requests.")})
    # ---- R6-13: the tax-id second look, as its own branch, on the engine's own frame --------------------
    rot = [n for n in wf["nodes"] if n["name"] == NODE07][0]
    ext_http = [n for n in wf["nodes"] if n["name"] == NODE09][0]

    def clone(src, name, params, pos, notes, type_version=None, on_error=None):
        c = json.loads(json.dumps(src))
        c["id"] = str(uuid.uuid4())                       # a cloned node must not keep the id of its parent
        c.pop("pinData", None); c.pop("meta", None)
        c.update({"name": name, "position": pos, "parameters": params, "notes": notes})
        if type_version:
            c["typeVersion"] = type_version
        if on_error:
            c["onError"] = on_error
        return c

    taxid_nodes = [
        {"name": N09T, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [2060, 900],
         "parameters": {"mode": "runOnceForAllItems", "jsCode": code[N09T]},
         "notes": ("R6-13: one re-read per DOCUMENT (engine taxid_spent), fired on the first page in selection "
                   "order whose answer fails the tax-id rule. An IF node cannot decide this — it evaluates per "
                   "item and would re-read every failing page.")},
        if_node(N09I, [2180, 900], "={{ $json.taxid_retry_page ? 1 : 0 }}", "equals", 1,
                ("Number comparison only: the boolean operator fails strict typeValidation (exec 455). "
                 "Exactly one item in the batch carries a page number.")),
        clone(render, N09R,
              {"binaryPropertyName": "pdf", "format": "jpeg",
               "density": "={{ $('00 CONFIG (single point)').first().json.taxid_retry_dpi }}",
               "outputProperty": "tax", "options": {"quality": 90}},
              [2300, 980],
              ("Engine single_pass.py:1053 re-renders the page at PERCEPTION_TAXID_RETRY_DPI (default 300). "
               "The pixels are the whole point of the retry: a bigger frame is the harder look.")
              ),
        {"name": N09O, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [2300, 820],
         "parameters": {"mode": "runOnceForAllItems", "jsCode": code[N09O]},
         "notes": "Picks the re-read page out of the 300 DPI render and puts page_no/rotate into json for node 09rot."},
        clone(rot, N09ROT,
              {"operation": "rotate", "dataPropertyName": "={{ $json.hi_key }}",
               "rotate": "={{ $json.rotate_degrees }}",
               "options": {"destinationKey": "page", "format": "jpeg", "quality": 90}},
              [2420, 900],
              ("_orient(hi_orig, p, rot['rotate_degrees']): the re-read keeps the page's orientation, so the "
               "answer's boxes mean the same thing as the first read's. Quality 90, like the extract pass.")),
        {"name": N09B, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [2540, 900],
         "parameters": {"mode": "runOnceForAllItems", "jsCode": code[N09B]},
         "notes": ("Same prompt, same max_tokens, same message order as a normal extract call — the engine calls "
                   "_extract_one again, it does not invent a tax-id prompt.")},
        clone(ext_http, N09C, json.loads(json.dumps(ext_http["parameters"])), [2660, 900],
              ("Same gateway, same 600000 ms timeout. onError=continueOnFail is the flow's version of the "
               "engine's try/except around the retry: if the harder look fails, the FIRST read stays in force "
               "and the run does not die (single_pass.py:1063-1065)."),
              type_version=ext_http.get("typeVersion", 4.2), on_error="continueOnFail"),
        {"name": N09D, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [2780, 900],
         "parameters": {"mode": "runOnceForAllItems", "jsCode": code[N09D]},
         "notes": ("Accept only when the whole high-resolution answer no longer breaks the rule; otherwise the "
                   "first read stands. Logged either way into extra.taxid_retry (page/reason/dpi/accepted).")},
        {"name": N09Z, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [2900, 760],
         "parameters": {"mode": "runOnceForAllItems", "jsCode": code[N09Z]},
         "notes": ("Joins the branch back: one item per selected page with the answer AND the frame that answer "
                   "came from. A re-read answer measured on 150 DPI pixels would scale boxes onto the wrong grid.")},
    ]
    res = (taxid_nodes + [
        {"name": N06B, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1700, 560],
         "parameters": {"jsCode": code[N06B]},
         "notes": ("One item per SELECTED invoice page, engine-unique binary names, orig frame kept under `pre` "
                   "and node 07 writing the rotated frame to `page`. This is the node that closes the "
                   "'.first() reads one page of a 2-page invoice' gap.")},
        if_node(N05C1, [1300, 460],
                "={{ ($json.page_errors && $json.page_errors.classify) ? 1 : 0 }}", "equals", 0,
                ("Engine gate, both halves: the second look runs only when adjudication is enabled AND classify "
                 "itself did not fail. Number comparisons only - the boolean operator fails strict "
                 "typeValidation (exec 455).")),
        adj_render,
        {"name": N05C, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1420, 620],
         "parameters": {"jsCode": code[N05C]},
         "notes": "One adjudicate request per page, 150 DPI unrotated JPEG q85, max_tokens 900."},
        adj_http,
        {"name": N05E, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1170, 620],
         "parameters": {"jsCode": code[N05E]},
         "notes": ("quotes joined ' | ', invoice_wording, only non-invoice pages are reopened, then the SAME "
                   "select_invoice_pages bytes node 05 runs. First failing page records "
                   "page_errors.adjudicate and stops, like the engine's break.")},
        if_node(N05F, [1560, 784],
                "={{ ($json.selected_invoice_pages || []).length }}", "gt", 0,
                ("true = the second look produced an invoice page, so read it. false = the document is refused "
                 "with the adjudication log attached, never with a guessed page.")),
    ])
    if NODE05B not in {n["name"] for n in wf["nodes"]}:
        if_node_05b = if_node(NODE05B, [1060, 300], "={{ ($json.selected_invoice_pages || []).length }}", "gt", 0,
                              "true output = invoice pages found -> 06. false output = no invoice page -> adjudicate / 21.")
        res.append(if_node_05b)
    return res


def config_assignments(wf):
    """What node 00 must carry for the new nodes. Baseline = the engine's CURRENT configuration:
    PERCEPTION_ADJUDICATE unset -> on, PERCEPTION_TAXID_RETRY_DPI unset -> 300, adjudicate_dpi=150,
    extract image = JPEG q90, adjudicate image = JPEG q85 (all read out of single_pass.py)."""
    cfg_node = [n for n in wf["nodes"] if n["name"] == CONFIG_NODE][0]
    have = {a["name"]: a for a in cfg_node["parameters"]["assignments"]["assignments"]}
    want = {"adjudicate": ("boolean", True), "dpi_adjudicate": ("number", 150),
            "jpeg_quality_extract": ("number", 90), "jpeg_quality_adjudicate": ("number", 85),
            "taxid_retry_dpi": ("number", 300), "prompt_adjudicate": ("string", prompt("single_pass_adjudicate.md"))}
    out = []
    for name, (typ, val) in want.items():
        if name in have and str(have[name].get("value")) == str(val):
            continue
        out.append({"id": name, "name": name, "type": typ, "value": val})
    return out


EDGES_NEW = [
    (NODE05, NODE05B, 0), (NODE05B, NODE06, 0), (NODE05B, N05C1, 1),
    (N06B, NODE07, 0), (NODE06, N06B, 0),
    (N05C1, N06R, 0), (N05C1, NODE21, 1),
    (N06R, N05C, 0), (N05C, N05D, 0), (N05D, N05E, 0), (N05E, N05F, 0),
    (N05F, NODE06, 0), (N05F, NODE21, 1),
]
# R6-13: node 09's answer no longer goes straight to the bbox maths. The engine takes its harder look inside
# the read loop, BEFORE bbox maths, so the branch sits between them — and the maths must run on whichever
# frame the accepted answer came from, which is why 09z (not 09) is node 10's input now.
EDGES_NEW += [
    (NODE09, N09T, 0), (N09T, N09I, 0),
    (N09I, N09R, 0), (N09R, N09O, 0), (N09O, N09ROT, 0), (N09ROT, N09B, 0),
    (N09B, N09C, 0), (N09C, N09D, 0), (N09D, N09Z, 0),
    (N09I, N09Z, 1), (N09Z, NODE10, 0),
]
EDGES_GONE = [(NODE05, NODE06, 0), (NODE06, NODE07, 0), (NODE05B, NODE21, 1), (NODE09, NODE10, 0)]
EDGES_KEEP = [(NODE05B, N05C1, 1)]


def edges_of(wf):
    out = []
    for src, outs in (wf.get("connections") or {}).items():
        for i, branch in enumerate((outs or {}).get("main") or []):
            for tgt in branch or []:
                if isinstance(tgt, dict) and tgt.get("node"):
                    out.append((src, tgt.get("node"), i))
    return sorted(out)


def main():
    global WF
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--no-topology", action="store_true", help="code only")
    ap.add_argument("--wf", default=WF, help="target workflow id")
    args = ap.parse_args()
    WF = args.wf
    mcp = Mcp()

    def fetch():
        got = mcp.call("get_workflow_details", {"workflowId": WF})
        return got.get("workflow", got)

    wf = fetch()
    print("BEFORE  draft=%s  active=%s  activeFlag=%s"
          % (str(wf.get("versionId"))[:8], str(wf.get("activeVersionId"))[:8], wf.get("active")))
    if args.status:
        return 0
    names = {n["name"] for n in wf["nodes"]}
    code = repo_code()
    bad_plan = 0
    for name, want in sorted(code.items()):
        live = (next((n for n in wf["nodes"] if n["name"] == name), {}) or {}).get("parameters", {}).get("jsCode", "")
        print("  %-40s live=%-7d repo=%-7d %s" % (name, len(live), len(want), "in sync" if live == want else "WRITE"))
    edges = set(edges_of(wf))
    add_nodes = [n for n in new_nodes(wf) if n["name"] not in names]
    print("  new nodes to install: %s" % (", ".join(n["name"] for n in add_nodes) or "none"))
    for src, tgt, i in EDGES_NEW + EDGES_KEEP:
        if (src, tgt, i) not in edges:
            print("  edge to add:    %-34s -> %-24s [out %d]" % (src, tgt, i))
    for src, tgt, i in EDGES_GONE:
        if (src, tgt, i) in edges:
            print("  edge to remove: %-34s -> %-24s [out %d]" % (src, tgt, i))
    extra_cfg = config_assignments(wf)
    print("  node 00 assignments to add: %s" % (", ".join(a["name"] for a in extra_cfg) or "none"))
    if args.check:
        print("--check wrote nothing.")
        return bad_plan

    stamp = time.strftime("%Y%m%d_%H%M%S")
    bak = os.path.join(LIVE, "backup_%s_before_v59_%s.json" % (WF, stamp))
    io.open(bak, "w", encoding="utf-8").write(json.dumps(wf))
    io.open(os.path.join(LIVE, "draft_before_v59.json"), "w", encoding="utf-8").write(json.dumps(wf, indent=1))
    print("backup -> %s (%d KB)   rollback versionId = %s"
          % (os.path.basename(bak), os.path.getsize(bak) // 1024, wf.get("versionId")))

    ops = []
    # code first (the new nodes below carry the same bytes from the same files, so a partial install can never
    # leave the canvas with a new graph and an old extraction seam)
    for name in sorted(code):
        node = next((n for n in wf["nodes"] if n["name"] == name), None)
        if node and node["parameters"].get("jsCode", "") != code[name]:
            ops.append({"type": "setNodeParameter", "nodeName": name, "path": "/jsCode", "value": code[name]})
    if extra_cfg:
        cfg_node = [n for n in wf["nodes"] if n["name"] == CONFIG_NODE][0]
        merged = list(cfg_node["parameters"]["assignments"]["assignments"]) + extra_cfg
        ops.append({"type": "setNodeParameter", "nodeName": CONFIG_NODE, "path": "/assignments/assignments",
                    "value": merged})
    for name in ALL_ITEMS_CODE:
        node = next((n for n in wf["nodes"] if n["name"] == name), None)
        if node and node["parameters"].get("mode") != "runOnceForAllItems":
            ops.append({"type": "setNodeParameter", "nodeName": name, "path": "/mode",
                        "value": "runOnceForAllItems"})
    r02 = next((n for n in wf["nodes"] if n["name"] == NODE02), None)
    if r02:
        if r02["parameters"].get("format") != "jpeg":
            ops.append({"type": "setNodeParameter", "nodeName": NODE02, "path": "/format", "value": "jpeg"})
        if (r02["parameters"].get("options") or {}).get("quality") != 70:
            ops.append({"type": "setNodeParameter", "nodeName": NODE02, "path": "/options", "value": {"quality": 70}})
    r06 = next(n for n in wf["nodes"] if n["name"] == NODE06)
    if (r06["parameters"].get("options") or {}).get("quality") != 90:
        ops.append({"type": "setNodeParameter", "nodeName": NODE06, "path": "/options",
                    "value": {"quality": 90}})
    r07 = next(n for n in wf["nodes"] if n["name"] == NODE07)
    if r07["parameters"].get("dataPropertyName") != "={{ $json.orig_key }}":
        ops.append({"type": "setNodeParameter", "nodeName": NODE07, "path": "/dataPropertyName",
                    "value": "={{ $json.orig_key }}"})
        ops.append({"type": "setNodeParameter", "nodeName": NODE07, "path": "/rotate",
                    "value": "={{ $json.rotate_degrees }}"})
        ops.append({"type": "setNodeParameter", "nodeName": NODE07, "path": "/options",
                    "value": {"destinationKey": "page", "format": "jpeg", "quality": 90}})

    if not args.no_topology:
        for n in add_nodes:
            ops.append({"type": "addNode", "node": n})
        for src, tgt, i in EDGES_GONE:
            if (src, tgt, i) in edges:
                ops.append({"type": "removeConnection", "source": src, "target": tgt, "sourceIndex": i})
        for src, tgt, i in EDGES_NEW + EDGES_KEEP:
            if (src, tgt, i) not in edges:
                ops.append({"type": "addConnection", "source": src, "target": tgt, "sourceIndex": i})

    print("writing %d operation(s), %d KB of jsCode" %
          (len(ops), sum(len(json.dumps(o.get("value", ""))) for o in ops) // 1024))
    res = mcp.call("update_workflow", {
        "workflowId": WF, "operations": ops,
        "versionName": "v5.9 multi-page reads + R6-6 adjudicate (draft only)",
        "versionDescription": ("06b splits the selection into one item per page (was: .first() read one page of a "
                              "2-page invoice). 05c1/06r/05c/05d/05e/05f implement the R6-6 second look at 150 DPI "
                              "JPEG q85, max_tokens 900, re-running the SAME select_invoice_pages bytes as node 05. "
                              "node 07 rotates per item and outputs JPEG q90; node 06 renders q90. "
                              "node 21 reads reads[] and prefers 05e for the selection. Nothing published.")})
    print("update_workflow ->", json.dumps(res)[:240])

    back = fetch()
    io.open(os.path.join(LIVE, "draft_after_v59.json"), "w", encoding="utf-8").write(json.dumps(back, indent=1))
    io.open(os.path.join(ROOT, "workflow", "workflow_%s_v5.9_draft.json" % WF), "w", encoding="utf-8") \
        .write(json.dumps(redact(back), indent=1, ensure_ascii=False))
    n2 = {n["name"]: n for n in back["nodes"]}
    bad = 0
    for name, want in sorted(code.items()):
        got = n2.get(name, {}).get("parameters", {}).get("jsCode", "")
        if got == want:
            print("  %-40s %7d B  BYTE-EQUAL after read-back" % (name, len(want)))
        else:
            bad += 1
            print("  %-40s MISMATCH live=%d repo=%d" % (name, len(got), len(want)))
    now = set(edges_of(back))
    miss = sorted(set(EDGES_NEW + EDGES_KEEP) - now)
    still = sorted({e for e in EDGES_GONE if e in now})
    print("  edges: %d present, missing=%s, should-be-gone-but-present=%s" % (len(now), miss or "none", still or "none"))
    bad += len(miss) + len(still)
    cfgn = n2[CONFIG_NODE]["parameters"]["assignments"]["assignments"]
    cnames = {a["name"] for a in cfgn}
    for a in extra_cfg:
        if a["name"] not in cnames:
            bad += 1
            print("  node 00 assignment missing after write: %s" % a["name"])
    for name in ALL_ITEMS_CODE:
        got = n2.get(name, {}).get("parameters", {}).get("mode")
        print("  %-40s execution mode = %s" % (name, got))
        if got != "runOnceForAllItems":
            bad += 1
    print("  node 07 %s / rotate %s / options %s" % (n2[NODE07]["parameters"].get("dataPropertyName"),
          json.dumps(n2[NODE07]["parameters"].get("rotate")), json.dumps(n2[NODE07]["parameters"].get("options"))))
    print("AFTER   draft=%s  active=%s  activeFlag=%s  (this script never publishes)"
          % (str(back.get("versionId"))[:8], str(back.get("activeVersionId"))[:8], back.get("active")))
    print("\n%s" % ("V5.9 DRAFT SYNC: OK" if not bad else "V5.9 DRAFT SYNC: PROBLEMS (%d)" % bad))
    return 1 if bad else 0


def redact(wf):
    """Export without secrets: any token-shaped string becomes a placeholder, and the write refuses if a
    secret ever survives (same guard as harness/export_workflow.py)."""
    import re
    secrets = {}

    def walk(o):
        if isinstance(o, dict):
            return {k: walk(v) for k, v in o.items()}
        if isinstance(o, list):
            return [walk(v) for v in o]
        if isinstance(o, str):
            for pat, tag in ((r"eyJ[A-Za-z0-9_\-\.]{20,}", "<<TOKEN>>"),
                             (r"(?i)(https?://[^\s\"']*(?:paperless|ords|mcp)[^\s\"']*)", "<<URL>>")):
                m = re.search(pat, o)
                if m:
                    secrets.setdefault(tag + m.group(0)[:12], tag)
                    o = o.replace(m.group(0), tag)
            return o
        return o
    out = json.loads(json.dumps(walk(wf)))
    txt = json.dumps(out)
    if re.search(r"eyJ[A-Za-z0-9_\-\.]{20,}", txt):
        raise SystemExit("refusing to write the export: a token survived redaction")
    for a in [x for x in out["nodes"] if x["name"] == CONFIG_NODE][0]["parameters"]["assignments"]["assignments"]:
        if a["name"] in ("paperless_token", "llm_key"):
            a["value"] = "<<%s>>" % a["name"].upper()
    if re.search(r"(?i)bearer eyJ", json.dumps(out)):
        raise SystemExit("refusing to write the export: a bearer token survived redaction")
    return out


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
