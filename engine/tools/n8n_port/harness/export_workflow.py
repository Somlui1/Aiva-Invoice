"""Export the workflow as an importable JSON file with every secret replaced by a placeholder.

  python harness/export_workflow.py            # exports the DRAFT
  python harness/export_workflow.py --published

The file is what a reviewer imports (n8n → Import from file) or diffs against the canvas; it lives in
tools/n8n_port/workflow/ (tracked) while dist/ and live/ stay out of git.

Redaction is a recursive walk over the whole returned object — get_workflow_details also embeds
`activeVersion`, which carries its own copy of every node, and a shallow pass over wf["nodes"] leaves the
production copy of the tokens behind (found the hard way on the first run of this script). Afterwards the
script refuses to write if any collected secret value is still anywhere in the file, so the repo never
gains a copy of a credential (open item (c) of the v5.7 audit).
"""
import argparse
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from mcp_client import Mcp                                            # noqa: E402

WF = "034iqKMRjqKt9LlB"
OUTDIR = os.path.join(ROOT, "workflow")        # tracked: the importable artifact, not dist/
OUT_TMPL = os.path.join(OUTDIR, "workflow_%s_v5.9_%s.json")   # %s = draft | published
# Label bump: the draft carries v5.9 (multi-page reads, R6-6 adjudicate, R6-13 tax-id re-read).
# The v5.8 draft export is gone from disk — it was overwritten before this label existed; the
# pre-v5.9 draft is still recoverable byte-for-byte from live/backup_*_before_v59_*.json
# (versionId 128fb6f2-11f5-4b92-9f54-cf524fbb93a4), and workflow_..._v5.8_published.json still
# matches the live published version, which harness/verify_published.py re-checks.
NODE00 = "00 CONFIG (single point)"
ASSIGN_PLACEHOLDER = {"paperless_token": "<<PAPERLESS_TOKEN>>", "llm_key": "<<LLM_KEY>>"}


def collect_secrets(obj, out):
    """node 00's two assignments, and the Oracle token/url baked into node 21's SECTION A."""
    if isinstance(obj, dict):
        for a in obj.get("assignments", {}).get("assignments", []) if isinstance(obj.get("assignments"), dict) else []:
            if a.get("name") in ASSIGN_PLACEHOLDER and a.get("value"):
                out[(a["name"], ASSIGN_PLACEHOLDER[a["name"]])] = str(a["value"])
        for v in obj.values():
            collect_secrets(v, out)
    elif isinstance(obj, list):
        for v in obj:
            collect_secrets(v, out)
    elif isinstance(obj, str) and "oracleToken:" in obj:
        m = re.search(r'oracleToken:\s*"([^"]*)"', obj)
        if m and m.group(1):
            out[("oracleToken", "<<ORACLE_MCP_TOKEN>>")] = m.group(1)
        m2 = re.search(r'oracleUrl:\s*"([^"]*)"', obj)
        if m2 and m2.group(1):
            out[("oracleUrl", "<<ORACLE_MCP_URL>>")] = m2.group(1)


def redact(obj, pairs):
    if isinstance(obj, dict):
        return {k: redact(v, pairs) for k, v in obj.items()}
    if isinstance(obj, list):
        return [redact(v, pairs) for v in obj]
    if isinstance(obj, str):
        for _, ph, val in pairs:
            if val and val in obj:
                obj = obj.replace(val, ph)
        return obj
    return obj


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--published", action="store_true", help="export the version n8n is running, not the draft")
    args = ap.parse_args()
    mcp = Mcp()
    wf = mcp.call("get_workflow_details", {"workflowId": WF})
    wf = wf.get("workflow", wf)
    if args.published:
        wf = mcp.call("get_workflow_version", {"workflowId": WF, "versionId": wf["activeVersionId"]})
        wf = wf.get("workflow", wf)
        label = "PUBLISHED " + str(wf.get("versionId"))[:8]
    else:
        label = "DRAFT " + str(wf.get("versionId"))[:8]

    found = {}
    collect_secrets(wf, found)
    pairs = [(name, ph, val) for (name, ph), val in found.items()]
    clean = redact(wf, pairs)
    body = json.dumps(clean, ensure_ascii=False)
    leaked = sorted({name for name, _, val in pairs if val and val in body})
    if leaked:
        print("REFUSING to write: these values are still present after redaction: %s" % ", ".join(leaked))
        return 1
    os.makedirs(OUTDIR, exist_ok=True)
    out = OUT_TMPL % (WF, "published" if args.published else "draft")
    io.open(out, "w", encoding="utf-8").write(body)
    print("%s -> %s" % (label, os.path.relpath(out, ROOT)))
    print("  nodes=%d  connections=%d  bytes=%d"
          % (len(clean["nodes"]), len(clean.get("connections") or {}), os.path.getsize(out)))
    print("  redacted %d value(s): %s" % (len(pairs), ", ".join("%s -> %s" % (n, p) for n, p, _ in sorted(pairs))))
    print("  nodes keep their credential REFERENCES (ids only); the import will ask for the target instance's own")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
