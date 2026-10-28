"""Prove the version n8n is RUNNING equals the repo, byte for byte.

  python harness/verify_published.py            # compares the active (published) version
  python harness/verify_published.py --draft    # compares the draft on the canvas

One line is allowed to differ: the generated header's BUILD stamp (git hash + clock) inside node 21, which
changes on every rebuild.  Anything else - one character in a prompt, one Thai string, one operator - is a
failure, because the payload hash is computed over the model output and the rule code that read it.
"""
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp_client import Mcp                                              # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WF = "034iqKMRjqKt9LlB"

FILES = {
    "21 Validate (port)": os.path.join(ROOT, "dist", "node21_inline.js"),
    "03 Build classify request": os.path.join(ROOT, "n8n_nodes_v58", "03_classify_multimage.js"),
    "05 Parse classify pick invoice pages": os.path.join(ROOT, "n8n_nodes_v58", "05_parse_classify.js"),
    "08 Build extract request": os.path.join(ROOT, "n8n_nodes_v58", "08_extract_request.js"),
    "10 Bbox math pixels + sanitize": os.path.join(ROOT, "n8n_nodes_v58", "10_parse_extract.js"),
    "22 Verification report (9 rules)": os.path.join(ROOT, "n8n_nodes", "22_v57.js"),
}
# v5.8 pins more than code: the classify pages must really be JPEG q70 (single_pass.py::_data_url
# quality=70) and the "no invoice page" branch must exist on the canvas.
PARAMS = {"02 PDF to JPEG 80 DPI (classify)": {"format": "jpeg", "options": {"quality": 70}}}
EDGES = [("05 Parse classify pick invoice pages", "05b Invoice pages found?", 0),
         ("05b Invoice pages found?", "06 PDF to JPEG 150 DPI", 0),
         ("05b Invoice pages found?", "21 Validate (port)", 1)]
PROMPTS = {  # the CONFIG values, compared to the engine's prompt files
    "prompt_classify": os.path.join(ROOT, "..", "..", "config", "prompts", "single_pass_classify.md"),
    "prompt_extract": os.path.join(ROOT, "..", "..", "config", "prompts", "single_pass_extract.md"),
}


def lines(text):
    return text.splitlines()


def main():
    draft_only = "--draft" in sys.argv
    m = Mcp()
    wf = m.call("get_workflow_details", {"workflowId": WF})
    wf = wf.get("workflow", wf)
    draftNodes, draftConn = wf["nodes"], wf.get("connections")
    print("canvas versionId=%s  activeVersionId=%s  active=%s" % (wf.get("versionId"), wf.get("activeVersionId"), wf.get("active")))
    if not draft_only:
        # get_workflow_details returns the DRAFT graph. Comparing that and calling it "the running version"
        # reports the draft as production (it did, once). The running content must be fetched by version id.
        ver = m.call("get_workflow_version", {"workflowId": WF, "versionId": wf["activeVersionId"]})
        if not ver.get("nodes"):
            print("could not read the published version: %s" % json.dumps(ver)[:200])
            return 1
        wf, running = ver, wf["activeVersionId"]
    else:
        wf, running = wf, wf["versionId"]
    print("comparing: %s version %s" % ("draft" if draft_only else "PUBLISHED (read back by version id)", running))
    nodes = {n["name"]: n for n in wf["nodes"]}
    bad = 0
    for name, path in FILES.items():
        repo = io.open(path, encoding="utf-8").read()
        live = nodes[name]["parameters"].get("jsCode", "")
        if live == repo:
            print("  %-38s %7d B  BYTE-EQUAL" % (name, len(repo)))
            continue
        la, lb = lines(live), lines(repo)
        diffs = [(i, a, b) for i, (a, b) in enumerate(zip(la, lb)) if a != b]
        real = [d for d in diffs if not d[1].lstrip().startswith("//  BUILD")]
        if len(la) == len(lb) and diffs and not real:
            print("  %-38s %7d B  equal except the generated BUILD stamp (%s / %s)"
                  % (name, len(repo), diffs[0][1].split("@")[-1].split()[0] if "@" in diffs[0][1] else "?",
                     diffs[0][2].split("@")[-1].split()[0] if "@" in diffs[0][2] else "?"))
            continue
        bad += 1
        print("  %-38s %7d B  DIFFERENT (%d line(s) differ, %d outside the BUILD stamp)"
              % (name, len(repo), len(diffs), len(real)))
        for i, a, b in real[:5]:
            print("      line %d\n        live: %s\n        repo: %s" % (i + 1, a.strip()[:110], b.strip()[:110]))

    asg = {a["name"]: a.get("value") for a in nodes["00 CONFIG (single point)"]["parameters"]["assignments"]["assignments"]}
    for name, want in PARAMS.items():
        p = (nodes.get(name) or {}).get("parameters", {})
        miss = {k: v for k, v in want.items() if json.dumps(p.get(k), sort_keys=True) != json.dumps(v, sort_keys=True)}
        if miss:
            bad += 1
            print("  %-38s params %s (live=%s want=%s)" % (name, "DIFFERENT", json.dumps({k: p.get(k) for k in miss}),
                                                          json.dumps(miss)))
        else:
            print("  %-38s %s" % (name, " ".join("%s=%s" % (k, json.dumps(v)) for k, v in want.items())))
    edges = set()
    for src, outs in (wf.get("connections") or {}).items():
        for i, branch in enumerate((outs or {}).get("main") or []):
            for tgt in branch or []:
                if isinstance(tgt, dict):
                    edges.add((src, tgt.get("node"), i))
    missing = [e for e in EDGES if e not in edges]
    if missing:
        bad += 1
        print("  BRANCH MISSING on the running version: %s" % missing)
    else:
        print("  %-38s %s" % ("empty-read branch", "wired: 05 -> 05b -> (06 | 21)"))
    for key, path in PROMPTS.items():
        f = io.open(path, encoding="utf-8").read()
        v = asg.get(key) or ""
        if v == f:
            print("  %-38s %7d B  file verbatim" % ("CONFIG " + key, len(v)))
        elif v == f.rstrip("\n"):
            print("  %-38s %7d B  file minus trailing newline (node restores it)" % ("CONFIG " + key, len(v)))
        else:
            bad += 1
            print("  %-38s %7d B  DIFFERENT from %s (%d B)" % ("CONFIG " + key, len(v), os.path.basename(path), len(f)))
    print("\n%s" % ("RUNNING VERSION == REPO" if not bad else "RUNNING VERSION DOES NOT MATCH THE REPO"))
    if not draft_only:
        # what a publish would change: draft graph vs the running one
        same = {n["name"]: n for n in draftNodes}
        run = {n["name"]: n for n in wf["nodes"]}
        added = sorted(set(same) - set(run)), sorted(set(run) - set(same))
        changed = sorted(n for n in set(same) & set(run)
                         if json.dumps(same[n]["parameters"], sort_keys=True) != json.dumps(run[n]["parameters"], sort_keys=True))
        print("publish would change: %d node(s) %s%s" % (len(changed) + len(added[0]), changed,
              (" + new nodes %s" % added[0]) if added[0] else ""))
        for n in added[1]:
            print("   (only in production, would be removed: %s)" % n)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
